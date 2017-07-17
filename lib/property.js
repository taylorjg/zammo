import { constant } from './gen';
import { Just, Nothing } from './prelude/maybe';
import { putLine } from './text';
import Immutable, { Record, Map } from 'immutable';

// data Rose a = MkRose a [Rose a] | IORose (IO (Rose a))
class Rose {

    constructor(x, rs) {
        this.x = x;
        this.rs = rs;
    }

    map(f) {
        return MkRose(f(this.x), this.rs.map(r => r.map(f)));
    }
}

const MkRose = (x, rs) => new Rose(x, rs);

class PostTest extends Record({
    callbackKind: undefined,
    callback: undefined // State -> Result -> IO ()
}) { }

class PostFinalFailure extends Record({
    callbackKind: undefined,
    callback: undefined // State -> Result -> IO ()
}) { }

const CallbackKind = {
    Counterexample: Symbol('Counterexample'),
    NotCounterexample: Symbol('NotCounterexample')
};

class Result extends Record({
    ok: undefined, // Maybe Bool
    expect: true,
    reason: '',
    theException: Nothing, // Maybe AnException
    abort: true,
    maybeNumTests: Nothing, // Maybe Int
    labels: new Map(), // Map String Int
    stamp: Immutable.Set(), // Set String
    callbacks: [], // [Callback]
    testCase: [] // [String]
})
{
    patternMatch(fnSucceeded, fnFailed, fnRejected) {
        return this.ok.patternMatch(
            () => fnRejected(this),
            ok => ok ? fnSucceeded(this) : fnFailed(this));
    }
}

const MkResult = fields => new Result(fields);

const result = MkResult({
    ok: undefined,
    expect: true,
    reason: '',
    theException: Nothing,
    abort: true,
    maybeNumTests: Nothing,
    labels: new Map(),
    stamp: Immutable.Set(),
    callbacks: [],
    testCase: []
});

const succeeded = result.set('ok', Just(true));
const failed = result.set('ok', Just(false));
const rejected = result.set('ok', Nothing);

// newtype Prop = MkProp { unProp :: Rose Result }
class Prop {
    constructor(unProp) {
        this.unProp = unProp;
    }
}

const MkProp = unProp => new Prop(unProp);

// newtype Property = MkProperty { unProperty :: Gen Prop }
class Property {
    constructor(unProperty) {
        this.unProperty = unProperty;
    }
}

const MkProperty = unProperty => new Property(unProperty);

// property :: prop -> Property
export const property = prop => {

    if (typeof (prop) === 'boolean') {
        return property(liftBool(prop));
    }

    if (prop instanceof Result) {
        return MkProperty(constant(MkProp(new Rose(prop, []))));
    }

    if (prop instanceof Property) {
        // TODO: property (MkProperty mp) = MkProperty $ do p <- mp; unProperty (property p)
        // call flatMap on the Gen Prop inside 'prop' => 'p' of type Prop
        // pass 'p' through 'property' => Property
        // call unProperty => Gen Prop
        // call new Property
        return prop;
    }

    throw new Error(`Sorry - we don't support Testables of type ${typeof (prop)} yet.`);
};

// --------------------------------------------------------------------------
// ** Lifting and mapping functions

const liftBool = b => b ? succeeded : failed.set('reason', 'Falsifiable');

// mapResult :: Testable prop => (Result -> Result) -> prop -> Property
const mapResult = (f, p) => mapRoseResult(rr => rr.map(f), p);

// mapTotalResult :: Testable prop => (Result -> Result) -> prop -> Property
const mapTotalResult = (f, p) => mapRoseResult(rr => rr.map(f), p);

// mapRoseResult :: Testable prop => (Rose Result -> Rose Result) -> prop -> Property
const mapRoseResult = (f, p) => mapProp(prop => MkProp(f(prop.unProp)), p);

// mapProp :: Testable prop => (Prop -> Prop) -> prop -> Property
const mapProp = (f, p) => MkProperty(property(p).unProperty.map(f));

// --------------------------------------------------------------------------
// ** Property combinators

// -- | Adds a callback
// callback :: Testable prop => Callback -> prop -> Property
// callback cb = mapTotalResult (\res -> res{ callbacks = cb : callbacks res })

// callback :: Testable prop => Callback -> prop -> Property
const callback = (cb, p) => mapTotalResult(res => res.set('callbacks', [cb, ...res.callbacks]), p);

// verbose :: Testable prop => prop -> Property
export const verbose = p => {
    const status = res => res.patternMatch(
        () => 'Passed',
        () => 'Failed',
        () => 'Skipped (precondition false)');
    const newCallbacks = cbs => {
        const v1 = new PostTest({
            callbackKind: CallbackKind.Counterexample,
            callback: (st, res) => putLine(st.terminal, `${status(res)}:`)
        });
        const v2 = cbs
            .filter(cb => cb instanceof PostFinalFailure && cb.callbackKind === CallbackKind.Counterexample)
            .map(cb => new PostTest({ callbackKind: cb.callbackKind, callback: cb.callback }));
        const v3 = new PostTest({
            callbackKind: CallbackKind.Counterexample,
            callback: (st /* res */) => putLine(st.terminal, ``)
        });
        return [v1, ...v2, v3];
    };
    return mapResult(res => res.set('callbacks', newCallbacks(res.callbacks).concat(res.callbacks)), p);
};

// expectFailure :: Testable prop => prop -> Property
export const expectFailure = p => mapTotalResult(res => res.set('expect', false), p);

// once :: Testable prop => prop -> Property
export const once = p => mapTotalResult(res => res.set('abort', true), p);

// again :: Testable prop => prop -> Property
export const again = p => mapTotalResult(res => res.set('abort', false), p);

// withMaxSuccess :: Testable prop => Int -> prop -> Property
export const withMaxSuccess = (n, p) => mapTotalResult(res => res.set('maybeNumTests', Just(n)), p);

// label :: Testable prop => String -> prop -> Property
export const label = (s, p) => classify(true, s, p);

// collect :: (Show a, Testable prop) => a -> prop -> Property
export const collect = (x, p) => label(x.toString(), p);

// classify :: Testable prop => Bool -> String -> prop -> Property
export const classify = (b, s, p) => cover(b, 0, s, p);

// TODO: move into a new file in the prelude folder.
// insertWith :: (a -> a -> a) -> Key -> a -> IntMap a -> IntMap a
const insertWith = (f, k, v, mp) =>
    // TODO: use an immutable map instead of a JavaScript Map ?
    mp.has(k) ? mp.set(k, f(v, mp.get(k))) : mp.set(k, v);

// cover :: Testable prop => Bool -> Int -> String -> prop -> Property
export const cover = (x, n, s, p) =>
    mapTotalResult(
        res => res.withMutations(obj => obj
            .set('labels', insertWith(Math.max, s, n, res.labels))
            .set('stamp', x ? res.stamp.add(s) : res.stamp)),
        p);

// forAll :: (Show a, Testable prop)
//        => Gen a -> (a -> prop) -> Property
export const forAll = (gen, pf) => forAllShrink(gen, () => [], pf);

// forAllShrink :: (Show a, Testable prop)
//              => Gen a -> (a -> [a]) -> (a -> prop) -> Property
export const forAllShrink = (gen, _shrinker, pf) =>
    // TODO: currently taking a short cut here - we should be calling 'shrinking'.
    again(MkProperty(gen.flatMap(x => property(pf(x)).unProperty)));
