import 'babel-polyfill';

// iterate :: (a -> a) -> a -> [a]
export function* iterate(f, x) {
    yield x;
    for (; ;) {
        x = f(x);
        yield x;
    }
}

// take :: Int -> [a] -> [a]
export function* take(n, xs) {
    const iterator = xs[Symbol.iterator]();
    for (; ;) {
        if (n-- <= 0) break;
        const obj = iterator.next();
        if (obj.done) break;
        yield obj.value;
    }
}

// takeWhile :: (a -> Bool) -> [a] -> [a]
export function* takeWhile(p, xs) {
    const iterator = xs[Symbol.iterator]();
    for (; ;) {
        const obj = iterator.next();
        if (obj.done) break;
        const x = obj.value;
        if (!p(x)) break;
        yield x;
    }
}

// drop :: Int -> [a] -> [a]
export function* drop(n, xs) {
    const iterator = xs[Symbol.iterator]();
    for (; ;) {
        if (n-- <= 0) break;
        const obj = iterator.next();
        if (obj.done) return;
    }
    for (; ;) {
        const obj = iterator.next();
        if (obj.done) break;
        yield obj.value;
    }
}

// nubBy :: (a -> a -> Bool) -> [a] -> [a]
export const nubBy = (eq, _xs) => {
    if (_xs.length === 0) return [];
    const [x, ...xs] = _xs;
    return [x, ...nubBy(eq, xs.filter(y => !eq(x, y)))];
};

// nub :: (Eq a) => [a] -> [a]
export const nub = xs => nubBy((a, b) => a === b, xs);
