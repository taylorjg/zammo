import { constant } from './gen';
import { Just, Nothing } from './prelude/maybe';
const { Record } = require('immutable');

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

// -- | Different kinds of callbacks
// data Callback
//   = PostTest CallbackKind (State -> Result -> IO ())         -- ^ Called just after a test
//   | PostFinalFailure CallbackKind (State -> Result -> IO ()) -- ^ Called with the final failing test-case

// data CallbackKind = Counterexample    -- ^ Affected by the 'verbose' combinator
//                   | NotCounterexample -- ^ Not affected by the 'verbose' combinator

class Result extends Record({
    ok: undefined,
    expect: true,
    reason: '',
    theException: Nothing,
    abort: true,
    maybeNumTests: Nothing,
    labels: new Map(),
    stamp: new Set(),
    callbacks: [],
    testCase: []
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
    stamp: new Set(),
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

const liftBool = b => b ? succeeded : failed.set('reason', 'Falsifiable');

// forAll :: (Show a, Testable prop)
//        => Gen a -> (a -> prop) -> Property
export const forAll = (gen, pf) => forAllShrink(gen, () => [], pf);

// forAllShrink :: (Show a, Testable prop)
//              => Gen a -> (a -> [a]) -> (a -> prop) -> Property
export const forAllShrink = (gen, _shrinker, pf) =>
    // TODO: currently taking a short cut here - we should be calling 'shrinking'.
    again(MkProperty(gen.flatMap(x => property(pf(x)).unProperty)));

// once :: Testable prop => prop -> Property
export const once = p => mapTotalResult(res => res.set('abort', true), p);

// again :: Testable prop => prop -> Property
export const again = p => mapTotalResult(res => res.set('abort', false), p);

// mapTotalResult :: Testable prop => (Result -> Result) -> prop -> Property
const mapTotalResult = (f, p) => mapRoseResult(rr => rr.map(f), p);

// mapRoseResult :: Testable prop => (Rose Result -> Rose Result) -> prop -> Property
const mapRoseResult = (f, p) => mapProp(prop => MkProp(f(prop.unProp)), p);

// mapProp :: Testable prop => (Prop -> Prop) -> prop -> Property
const mapProp = (f, p) => MkProperty(property(p).unProperty.map(f));

// withMaxSuccess :: Testable prop => Int -> prop -> Property
export const withMaxSuccess = (n, p) => mapTotalResult(res => res.set('maybeNumTests', Just(n)), p);

// expectFailure :: Testable prop => prop -> Property
export const expectFailure = p => mapTotalResult(res => res.set('expect', false), p);

// -- | Adds a callback
// callback :: Testable prop => Callback -> prop -> Property
// callback cb = mapTotalResult (\res -> res{ callbacks = cb : callbacks res })

// callback :: Testable prop => Callback -> prop -> Property
const callback = (cb, p) => mapTotalResult(res => res.set('callbacks', [cb, ...res.callbacks]), p);

// verbose :: Testable prop => prop -> Property
// export const verbose = p => {
//     const status = res => res.patternMatch(
//         () => 'Passed',
//         () => 'Failed',
//         () => 'Skipped (precondition false)');
//     const newCallbacks = cbs => {
//         // PostTest Counterexample (\st res -> putLine (terminal st) (status res ++ ":")):
//         // [ PostTest Counterexample f | PostFinalFailure Counterexample f <- cbs ] ++
//         // [ PostTest Counterexample (\st res -> putLine (terminal st) "") ]
//         return cbs;
//     };
//     return mapResult(res => res.set('callbacks', newCallbacks(res.callbacks)).concat(res.callbacks));
// };
