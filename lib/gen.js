import Random from 'rng';

function makeRng(seed) {
    const rng = new Random.PM(seed);
    rng.random();
    return rng;
}

function split(r) {
    const seed1 = r.random() * 1000;
    const seed2 = r.random() * 1000;
    return [makeRng(seed1), makeRng(seed2)];
}

export class Gen {

    constructor(h) {
        this.h = h;
    }

    run(r, n) {
        return this.h(r, n);
    }

    map(f) {
        return new Gen((r, n) => f(this.run(r, n)));
    }

    flatMap(k) {
        return new Gen((r, n) => {
            const [r1, r2] = split(r);
            const g2 = k(this.run(r1, n));
            return g2.run(r2, n);
        });
    }
}

export const constant = a => new Gen(() => a);

export const generate = g => {
    const seed = Math.random() * 1000;
    const r = makeRng(seed);
    return g.run(r, 30);
};

export const resize = (n, g) => {
    if (n < 0) throw new Error('resize: negative size');
    return new Gen(r => g.run(r, n));
};

export const sized = f => new Gen((r, n) => f(n).run(r, n));

function sequence(gs) {
    const z = constant([]);
    return gs.reduceRight((acc, g) =>
        g.flatMap(x =>
            acc.flatMap(xs =>
                constant([x, ...xs]))),
        z);
}

export const sample = g => {
    const ns = Array.from(Array(21).keys()).filter(n => n !== 1);
    const gs = ns.map(n => resize(n, g));
    return generate(sequence(gs));
};

export const choose = (min, max) => new Gen((r => r.range(min, max)));

export const genInt = sized(n => choose(-n, n));
