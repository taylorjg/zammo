import { constant } from './gen';
import { Just, Nothing } from './prelude/maybe';

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

class Result {

    constructor(ok, reason, abort, maybeNumTests) {
        this.ok = ok;
        this.reason = reason;
        this.abort = abort;
        this.maybeNumTests = maybeNumTests;
    }

    withOk(ok) {
        return MkResult(
            ok,
            this.reason,
            this.abort,
            this.maybeNumTests);
    }

    withReason(reason) {
        return MkResult(
            this.ok,
            reason,
            this.abort,
            this.maybeNumTests);
    }

    withAbort(abort) {
        return MkResult(
            this.ok,
            this.reason,
            abort,
            this.maybeNumTests);
    }

    withMaybeNumTests(maybeNumTests) {
        return new Result(
            this.ok,
            this.reason,
            this.abort,
            maybeNumTests);
    }

    patternMatch(fnSucceeded, fnFailed, fnRejected) {
        return this.ok.patternMatch(
            () => fnRejected(this),
            ok => ok ? fnSucceeded(this) : fnFailed(this));
    }
}

const MkResult = (
    ok,
    reason,
    abort,
    maybeNumTests
) => new Result(
    ok,
    reason,
    abort,
    maybeNumTests
);

const result = MkResult(
    undefined,
    '',
    true,
    Nothing);

const succeeded = result.withOk(Just(true));
const failed = result.withOk(Just(false));
const rejected = result.withOk(Nothing);

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

    if (typeof(prop) === 'boolean') {
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

    throw new Error(`Sorry - we don't support Testables of type ${typeof(prop)} yet.`);
};

const liftBool = b => b ? succeeded : failed.withReason('Falsifiable');

// forAll :: (Show a, Testable prop)
//        => Gen a -> (a -> prop) -> Property
export const forAll = (gen, pf) => forAllShrink(gen, () => [], pf);

// forAllShrink :: (Show a, Testable prop)
//              => Gen a -> (a -> [a]) -> (a -> prop) -> Property
export const forAllShrink = (gen, _shrinker, pf) =>
    // TODO: currently taking a short cut here - we should be calling 'shrinking'.
    again(MkProperty(gen.flatMap(x => property(pf(x)).unProperty)));

// once :: Testable prop => prop -> Property
export const once = p => mapTotalResult(res => res.withAbort(true), p);

// again :: Testable prop => prop -> Property
export const again = p => mapTotalResult(res => res.withAbort(false), p);

// mapTotalResult :: Testable prop => (Result -> Result) -> prop -> Property
const mapTotalResult = (f, p) => mapRoseResult(rr => rr.map(f), p);

// mapRoseResult :: Testable prop => (Rose Result -> Rose Result) -> prop -> Property
const mapRoseResult = (f, p) => mapProp(prop => MkProp(f(prop.unProp)), p);

// mapProp :: Testable prop => (Prop -> Prop) -> prop -> Property
const mapProp = (f, p) => MkProperty(property(p).unProperty.map(f));

// withMaxSuccess :: Testable prop => Int -> prop -> Property
export const withMaxSuccess = (n, p) => mapTotalResult(res => res.withMaybeNumTests(Just(n)), p);
