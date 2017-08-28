import { expect } from 'chai';
import { iterate, take, takeWhile, drop, nub, nubBy } from '../../lib';
import { it_multiple } from '../extensions/it_multiple';

describe('prelude/list', () => {

    it('iterate', () => {
        const inc = x => x + 1;
        const iterator = iterate(inc, 0);
        const v1 = iterator.next().value;
        const v2 = iterator.next().value;
        const v3 = iterator.next().value;
        const v4 = iterator.next().value;
        const v5 = iterator.next().value;
        expect([v1, v2, v3, v4, v5]).to.deep.equal([0, 1, 2, 3, 4]);
    });

    it_multiple(
        'take',
        (n, xs, expected) => {
            const actual = Array.from(take(n, xs));
            expect(actual).to.deep.equal(expected);
        },
        [
            [5, 'Hello World!', ['H', 'e', 'l', 'l', 'o']],
            [3, [1, 2, 3, 4, 5], [1, 2, 3]],
            [3, [1, 2], [1, 2]],
            [3, [], []],
            [-1, [1, 2], []],
            [0, [1, 2], []]
        ]);

    it_multiple(
        'takeWhile',
        (p, xs, expected) => {
            const actual = Array.from(takeWhile(p, xs));
            expect(actual).to.deep.equal(expected);
        },
        [
            [x => x < 3, [1, 2, 3, 4, 1, 2, 3, 4], [1, 2]],
            [x => x < 9, [1, 2, 3], [1, 2, 3]],
            [x => x < 0, [1, 2, 3], []]
        ]);

    it_multiple(
        'drop',
        (n, xs, expected) => {
            const actual = Array.from(drop(n, xs));
            expect(actual).to.deep.equal(expected);
        },
        [
            [6, 'Hello World!', ['W', 'o', 'r', 'l', 'd', '!']],
            [3, [1, 2, 3, 4, 5], [4, 5]],
            [3, [1, 2], []],
            [3, [], []],
            [-1, [1, 2], [1, 2]],
            [0, [1, 2], [1, 2]]
        ]);

    it('nub', () => {
        const actual = nub([1, 1, 2, 3, 4, 2, 3]);
        expect(actual).to.deep.equal([1, 2, 3, 4]);
    });

    it('nubBy', () => {
        const actual = nubBy(
            (x1, x2) => x1.v === x2.v,
            [
                { v: 1 },
                { v: 1 },
                { v: 2 },
                { v: 3 },
                { v: 4 },
                { v: 2 },
                { v: 3 }
            ]);
        expect(actual).to.deep.equal([
            { v: 1 },
            { v: 2 },
            { v: 3 },
            { v: 4 }
        ]);
    });
});
