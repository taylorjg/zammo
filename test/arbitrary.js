import { expect } from 'chai';
import { shrinkList } from '../lib';

describe('arbitrary', () => {

    it('shrinkList with no shrinking of x', () => {
        const xs = [1, 2, 3];
        const shr = () => [];
        const actual = shrinkList(shr, xs);
        const expected = [[],[2,3],[1,3],[1,2]];
        expect(actual).to.deep.equal(expected);
    });
});
