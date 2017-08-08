import { constant, MkGen, sized, resize } from './gen';
import { Just, Nothing } from './prelude/maybe';
import { putLine } from './text';
import Immutable from 'immutable';

// data Rose a = MkRose a [Rose a] | IORose (IO (Rose a))
class Rose {

    constructor(x, rs) {
        this.x = x;
        this.rs = rs;
    }

    map(f) {
        return MkRose(f(this.x), this.rs.map(r => r.map(f)));
    }

    flatMap(k) {
        return joinRose(this.map(k));
    }
}

const MkRose = (x, rs) => new Rose(x, rs);

// joinRose :: Rose (Rose a) -> Rose a
const joinRose = ({ x: { x, rs: ts }, rs: tts }) =>
    MkRose(x, (tts.map(joinRose)).concat(ts));

// onRose :: (a -> [Rose a] -> Rose a) -> Rose a -> Rose a
const onRose = (f, { x, rs }) => f(x, rs);

export class PostTest extends Immutable.Record({
    callbackKind: undefined,
    callback: undefined // State -> Result -> IO ()
}) { }

export class PostFinalFailure extends Immutable.Record({
    callbackKind: undefined,
    callback: undefined // State -> Result -> IO ()
}) { }

const CallbackKind = {
    Counterexample: Symbol('Counterexample'),
    NotCounterexample: Symbol('NotCounterexample')
};

class Result extends Immutable.Record({
    ok: undefined, // Maybe Bool
    expect: true,
    reason: '',
    theException: Nothing, // Maybe AnException
    abort: true,
    maybeNumTests: Nothing, // Maybe Int
    labels: Immutable.Map(), // Map String Int
    stamp: Immutable.Set(), // Set String
    callbacks: [], // [Callback]
    testCase: [] // [String]
}) { }

const MkResult = fields => new Result(fields);

const result = MkResult({
    ok: undefined,
    expect: true,
    reason: '',
    theException: Nothing,
    abort: true,
    maybeNumTests: Nothing,
    labels: Immutable.Map(),
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

class InternalDiscard { }
export const Discard = new InternalDiscard();

// property :: prop -> Property
export const property = prop => {

    // instance Testable Discard
    if (prop instanceof InternalDiscard) {
        return property(rejected);
    }

    // instance Testable Bool
    if (typeof (prop) === 'boolean') {
        return property(liftBool(prop));
    }

    // instance Testable Result
    if (prop instanceof Result) {
        return MkProperty(constant(MkProp(new Rose(prop, []))));
    }

    // instance Testable Property
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

// mapSize :: Testable prop => (Int -> Int) -> prop -> Property
export const mapSize = (f, p) => MkProperty(sized(n => resize(f(n), property(p).unProperty)));

// shrinking :: Testable prop => (a -> [a]) -> a -> (a -> prop) -> Property
export const shrinking = (shrinker, x0, pf) => {
    const props = x => MkRose(property(pf(x)).unProperty, shrinker(x).map(props));
    const v1 = props(x0);
    const v2 = promote(v1);
    const v3 = v2.map(r => MkProp((joinRose(r.map(p => p.unProp)))));
    return MkProperty(v3);
};

// promote :: Monad m => m (Gen a) -> Gen (m a)
const promote = m => delay().flatMap(_eval => constant(liftMrose(_eval, m)));

// delay :: Gen (Gen a -> a)
const delay = () => MkGen((r, n) => g => g.run(r, n));

// liftM :: (Monad m) => (a1 -> r) -> m a1 -> m r
const liftMrose = (f, m1) => m1.flatMap(x1 => MkRose(f(x1), []));

// noShrinking :: Testable prop => prop -> Property
export const noShrinking = p => mapRoseResult(
    rr => onRose((res /* _ */) => MkRose(res, []), rr),
    p);

// callback :: Testable prop => Callback -> prop -> Property
const callback = (cb, p) => mapTotalResult(res => res.set('callbacks', [cb, ...res.callbacks]), p);

// counterexample :: Testable prop => String -> prop -> Property
export const counterexample = (s, p) =>
    mapTotalResult(
        res => res.set('testCase', [s, ...res.testCase]),
        callback(
            new PostFinalFailure({
                callbackKind: CallbackKind.Counterexample,
                callback: (st /* _res */) => putLine(st.terminal, s)
            }),
            p));

// whenFail :: Testable prop => IO () -> prop -> Property
export const whenFail = (m, p) =>
    callback(
        new PostFinalFailure({
            callbackKind: CallbackKind.NotCounterexample,
            callback: (/* _st _res */) => m()
        }),
        p);

// whenFail' :: Testable prop => IO () -> prop -> Property
export const whenFail2 = (m, p) =>
    callback(
        new PostTest({
            callbackKind: CallbackKind.NotCounterexample,
            callback: (st, res) => res.ok.fold(() => { }, ok => !ok && m())
        }),
        p);

// verbose :: Testable prop => prop -> Property
export const verbose = p => {
    const status = res => res.ok.fold(
        () => 'Skipped (precondition false)',
        ok => ok ? 'Passed' : 'Failed'
    );
    const newCallbacks = cbs => {
        const v1 = new PostTest({
            callbackKind: CallbackKind.Counterexample,
            callback: (st, res) => putLine(st.terminal, `${status(res)}:`)
        });
        const v2 = cbs
            .filter(cb =>
                cb instanceof PostFinalFailure &&
                cb.callbackKind === CallbackKind.Counterexample)
            .map(cb => cb.callback)
            .map(f => new PostTest({
                callbackKind: CallbackKind.Counterexample,
                callback: f
            }));
        return [v1, ...v2];
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
const classify3 = (b, ifTrue, p) => cover(b, 0, ifTrue, p);
const classify4 = (b, ifTrue, ifFalse, p) => b
    ? cover(true, 0, ifTrue, p)
    : cover(true, 0, ifFalse, p);
export function classify(arg1, arg2, arg3, arg4) {
    return (arguments.length === 3)
        ? classify3(arg1, arg2, arg3)
        : classify4(arg1, arg2, arg3, arg4);
}

// TODO: move elsewhere ?
const insertWith = (f, k, v, mp) => mp.has(k) ? mp.set(k, f(v, mp.get(k))) : mp.set(k, v);

// cover :: Testable prop => Bool -> Int -> String -> prop -> Property
export const cover = (x, n, s, p) =>
    mapTotalResult(
        res => res.withMutations(obj => obj
            .set('labels', insertWith(Math.max, s, n, res.labels))
            .set('stamp', x ? res.stamp.add(s) : res.stamp)),
        p);

// (==>) :: Testable prop => Bool -> prop -> Property
export const implication = (b, p) => property(b ? p : Discard);
Boolean.prototype['==>'] = function(p) { return implication(this.valueOf(), p); };

// forAll :: (Show a, Testable prop) => Gen a -> (a -> prop) -> Property
export const forAll = (gen, pf) => forAllShrink(gen, () => [], pf);

// forAllShrink :: (Show a, Testable prop) => Gen a -> (a -> [a]) -> (a -> prop) -> Property
export const forAllShrink = (gen, shrinker, pf) =>
    again(
        MkProperty(
            gen.flatMap(x =>
                shrinking(shrinker, x, x2 => counterexample(x2.toString(), pf(x2)))
                    .unProperty)));
