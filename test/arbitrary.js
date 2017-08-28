import { expect } from 'chai';
import { shrinkList, shrinkIntegral } from '../lib';

describe('arbitrary', () => {

    it('shrinkList with no shrinking of x', () => {
        const xs = [1, 2, 3];
        const shr = () => [];
        const actual = shrinkList(shr, xs);
        const expected = [[], [2, 3], [1, 3], [1, 2]];
        expect(actual).to.deep.equal(expected);
    });

    it('shrinkIntegral', () => {
        const actual = shrinkIntegral(42);
        const expected = [0, 21, 32, 37, 40, 41];
        expect(actual).to.deep.equal(expected);
    });
});
