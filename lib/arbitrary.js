import { take, takeWhile, drop, iterate } from './prelude/list';

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

// -- | Shrink an integral number.
// shrinkIntegral :: Integral a => a -> [a]
// shrinkIntegral x =
//   nub $
//   [ -x
//   | x < 0, -x > x
//   ] ++
//   [ x'
//   | x' <- takeWhile (<< x) (0:[ x - i | i <- tail (iterate (`quot` 2) x) ])
//   ]
//  where
//    -- a << b is "morally" abs a < abs b, but taking care of overflow.
//    a << b = case (a >= 0, b >= 0) of
//             (True,  True)  -> a < b
//             (False, False) -> a > b
//             (True,  False) -> a + b < 0
//             (False, True)  -> a + b > 0

// shrinkIntegral :: Integral a => a -> [a]
export const shrinkIntegral = x => [];
