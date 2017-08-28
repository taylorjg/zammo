import { take, takeWhile, drop, iterate, nub } from './prelude/list';

// shrinkList :: (a -> [a]) -> [a] -> [[a]]
export const shrinkList = (shr, xs) => {

    const n = xs.length;

    const shrinkOne = _xs => {
        if (_xs.length === 0) return [];
        const [x, ...xs] = _xs;
        return shr(x).map(x2 => [x2, ...xs])
            .concat(shrinkOne(xs).map(xs2 => [x, ...xs2]));
    };

    const removes = (k, n, xs) => {
        const xs1 = Array.from(take(k, xs));
        const xs2 = Array.from(drop(k, xs));
        if (k > n) return [];
        if (xs2.length === 0) return [[]];
        return [xs2, ...removes(k, n - k, xs2).map(ys => xs1.concat(ys))];
    };

    const div = (a, b) => Math.floor(a / b);

    const v1 = iterate((n2 => div(n2, 2)), n);
    const v2 = Array.from(takeWhile(n2 => n2 > 0, v1));
    const v3 = v2.map(k => removes(k, n, xs));
    const v4 = [].concat(...v3);
    const v5 = v4.concat(...shrinkOne(xs));
    return v5;
};

function* mapIterator(iterator, f) {
    for (;;) {
        const obj = iterator.next();
        if (obj.done) break;
        const x = obj.value;
        yield f(x);
    }
}

function* cons(x, xs) {
    yield x;
    const iterator = xs[Symbol.iterator]();
    for (;;) {
        const obj = iterator.next();
        if (obj.done) break;
        const x = obj.value;
        yield x;
    }
}

// shrinkIntegral :: Integral a => a -> [a]
export const shrinkIntegral = x => {
    const lessless = (a, b) => {
        const b1 = a >= 0;
        const b2 = b >= 0;
        if (b1 && b2) return a < b;
        if (!b1 && !b2) return a > b;
        if (b1 && !b2) return a + b < 0;
        return a + b > 0;
    };
    const v1 = (x < 0 && -x > x) ? [-x] : [];
    const quot = (a, b) => Math.floor(a / b);
    const v2 = iterate(x2 => quot(x2, 2), x);
    const v3 = drop(1, v2);
    const v4 = cons(0, mapIterator(v3, i => x - i));
    const v5 = takeWhile(x2 => lessless(x2, x), v4);
    const v6 = v1.concat(Array.from(v5));
    const v7 = nub(v6);
    return v7;
};
