import { mkTheGen, split } from './random';
import { Just, Nothing, fromJust, isJust } from './prelude/maybe';

// newtype Gen a = MkGen { unGen :: QCGen -> Int -> a }
class Gen {

    constructor(unGen) {
        this.unGen = unGen;
    }

    run(r, n) {
        return this.unGen(r, n);
    }

    map(f) {
        return MkGen((r, n) => f(this.run(r, n)));
    }

    flatMap(k) {
        return MkGen((r, n) => {
            const [r1, r2] = split(r);
            const g2 = k(this.run(r1, n));
            return g2.run(r2, n);
        });
    }
}

export const MkGen = unGen => {
    const result = new Gen(unGen);
    result['>>='] = result.flatMap;
    result['<*>'] = m2 => ap(result, m2);
    return result;
};

export const constant = a => MkGen((/* r n */) => a);

export const fmap = (f, a) => a.map(f);

export const pure = constant;

// ap :: (Monad m) => m (a -> b) -> m a -> m b
export const ap = (m1, m2) => m1.flatMap(x1 => m2.map(x2 => x1(x2)));

export const generate = g => {
    const seed = Math.random();
    const r = mkTheGen(seed);
    return g.run(r, 30);
};

// sized :: (Int -> Gen a) -> Gen a
export const sized = f => MkGen((r, n) => f(n).run(r, n));

// getSize :: Gen Int
export const getSize = sized(pure);

// resize :: Int -> Gen a -> Gen a
export const resize = (n, g) => {
    if (n < 0) throw new Error('resize: negative size');
    return MkGen(r => g.run(r, n));
};

const sequence = gs =>
    gs.reduceRight((acc, g) =>
        g.flatMap(x =>
            acc.flatMap(xs =>
                constant([x, ...xs]))),
        constant([]));

export const sample = g => {
    const ns = Array.from(Array(21).keys()).filter(n => n !== 1);
    const gs = ns.map(n => resize(n, g));
    return generate(sequence(gs));
};

// choose :: Random a => (a,a) -> Gen a
export const choose = (min, max) => MkGen((r => r.range(min, max + 1)));

// elements :: [a] -> Gen a
export const elements = xs => {
    if (xs.length) {
        return choose(0, xs.length - 1).map(index => xs[index]);
    }
    else {
        throw new Error('elements used with empty list');
    }
};

// frequency :: [(Int, Gen a)] -> Gen a
export const frequency = xs0 => {
    if (xs0.length) {
        const pick = ys => n => {
            if (ys.length) {
                const [[k, x], ...xs] = ys;
                return (n <= k) ? x : pick(xs)(n - k);
            }
            else {
                throw new Error('pick used with empty list');
            }
        };
        const tot = xs0.reduce((acc, [fst]) => acc + fst, 0);
        return choose(1, tot).flatMap(pick(xs0));
    }
    else {
        throw new Error('frequency used with empty list');
    }
};

// oneof :: [Gen a] -> Gen a
export const oneof = gs => {
    if (gs.length) {
        return choose(0, gs.length - 1).flatMap(index => gs[index]);
    }
    else {
        throw new Error('oneof used with empty list');
    }
};

// replicateM :: Applicative m => Int -> m a -> m [a]
const replicateM = (cnt0, f) => {
    const cons = x => xs => [x, ...xs];
    const loop = cnt => cnt <= 0 ? pure([]) : liftA2(cons, f, loop(cnt - 1));
    return loop(cnt0);
};

// vectorOf :: Int -> Gen a -> Gen [a]
export const vectorOf = replicateM;

// listOf :: Gen a -> Gen [a]
export const listOf = gen =>
    getSize.flatMap(n =>
        choose(0, n).flatMap(k =>
            vectorOf(k, gen)));

// listOf1 :: Gen a -> Gen [a]
export const listOf1 = gen =>
    getSize.flatMap(n =>
        choose(1, Math.max(1, n)).flatMap(k =>
            vectorOf(k, gen)));

// liftA2 :: Applicative f => (a -> b -> c) -> f a -> f b -> f c
const liftA2 = (f, a, b) => fmap(f, a)['<*>'](b);

export const genInt = sized(n => choose(-n, n));

// --------------------------------------------------------------------------
// ** Common generator combinators

// suchThat :: Gen a -> (a -> Bool) -> Gen a
export const suchThat = (gen, p) =>
    suchThatMaybe(gen, p).flatMap(mx => mx.fold(
        () => sized(n => resize(n + 1, suchThat(gen, p))),
        x => constant(x)
    ));

// suchThatMap :: Gen a -> (a -> Maybe b) -> Gen b
export const suchThatMap = (gen, f) =>
    fmap(fromJust, suchThat(fmap(f, gen), isJust));

// suchThatMaybe :: Gen a -> (a -> Bool) -> Gen (Maybe a)
export const suchThatMaybe = (gen, p) => {
    const _try = (k, n) =>
        n === 0
            ? constant(Nothing)
            : resize(2 * k + n, gen).flatMap(x =>
                p(x) ? constant(Just(x)) : _try(k + 1, n - 1));
    return sized(n => _try(0, Math.max(n, 1)));
};
