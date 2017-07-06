import Random from 'rng';

export const mkTheGen = seed => {
    const rng = new Random.PM(seed * 9937);
    rng.random();
    return rng;
};

export const split = r => {
    const seed1 = r.random();
    const seed2 = r.random();
    return [mkTheGen(seed1), mkTheGen(seed2)];
};
