import Random from 'rng';

function split(r) {
    const seed1 = r.random();
    const seed2 = r.random();
    return [new Random.PM(seed1), new Random.PM(seed2)];
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
            return g2.run(r2, n)
        });
    }
}

function genReturn(a) {
    return new Gen((/* r, n */) => a);
}

export const generate = g => {
    const r = new Random.PM(123);
    return g.run(r, 30);
};

export const resize = (n, g) => {
    if (n < 0) throw new Error('resize: negative size');
    return new Gen((r, _) => g.run(r, n));
};

function sequence(gs) {
    const z = genReturn([]);
    return gs.reduceRight((g, acc) => {
        return g.flatMap(x => {
            return acc.flatMap(xs =>
                genReturn([x, ...xs]));
        });
    }, z);
}

export const sample = g => {
    const ns = Array.from(Array(21).keys()).filter(n => n !== 1);
    const gs = ns.map(n => resize(n, g));
    return generate(sequence(gs));
};
