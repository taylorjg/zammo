import { constant } from './gen';

// data Rose a = MkRose a [Rose a] | IORose (IO (Rose a))
export class Rose {

    constructor(x, rs) {
        this.x = x;
        this.rs = rs;
    }

    map(f) {
        return new Rose(f(this.x), this.rs.map(r => r.map(f)));
    }
}

const OK_SUCCEEDED = Symbol('Just True');
const OK_FAILURE = Symbol('Just False');
const OK_REJECTED = Symbol('Nothing');

export class Result {

    constructor(ok, reason, abort, maybeNumTests) {
        this.ok = ok;
        this.reason = reason;
        this.abort = abort;
        this.maybeNumTests = maybeNumTests;
    }

    withAbort(abort) {
        return new Result(
            this.ok,
            this.reason,
            abort,
            this.maybeNumTests);
    }

    withReason(reason) {
        return new Result(
            this.ok,
            reason,
            this.abort,
            this.maybeNumTests);
    }
}

export const succeeded = new Result(OK_SUCCEEDED, '', true);
export const failed = new Result(OK_FAILURE, '', true);
export const rejected = new Result(OK_REJECTED, '', true);

// newtype Prop = MkProp{ unProp :: Rose Result }
export class Prop {
    constructor(unProp) {
        this.unProp = unProp;
    }
}

// newtype Property = MkProperty { unProperty :: Gen Prop }
export class Property {
    constructor(unProperty) {
        this.unProperty = unProperty;
    }
}

// property :: prop -> Property
export const property = prop => {

    if (typeof(prop) === 'boolean') {
        return property(liftBool(prop));
    }

    if (prop instanceof Result) {
        return new Property(constant(new Prop(new Rose(prop, []))));
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
    again(new Property(gen.flatMap(x => property(pf(x)).unProperty)));

// again :: Testable prop => prop -> Property
export const again = p => mapTotalResult(res => res.withAbort(false), p);

// mapTotalResult :: Testable prop => (Result -> Result) -> prop -> Property
const mapTotalResult = (f, p) => mapRoseResult(rr => rr.map(f), p);

// mapRoseResult :: Testable prop => (Rose Result -> Rose Result) -> prop -> Property
const mapRoseResult = (f, p) => mapProp(prop => new Prop(f(prop.unProp)), p);

// mapProp :: Testable prop => (Prop -> Prop) -> prop -> Property
const mapProp = (f, p) => new Property(property(p).unProperty.map(f));
