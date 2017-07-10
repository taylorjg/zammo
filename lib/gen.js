import { mkTheGen, split } from './random';

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

const MkGen = unGen => new Gen(unGen);

export const constant = a => MkGen(() => a);

export const generate = g => {
    const seed = Math.random();
    const r = mkTheGen(seed);
    return g.run(r, 30);
};

export const resize = (n, g) => {
    if (n < 0) throw new Error('resize: negative size');
    return MkGen(r => g.run(r, n));
};

export const sized = f => MkGen((r, n) => f(n).run(r, n));

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

export const genInt = sized(n => choose(-n, n));
