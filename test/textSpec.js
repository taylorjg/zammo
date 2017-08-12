import { expect } from 'chai';
import { lines } from '../lib';

describe('text', () => {

    // lines "" == []
    // lines "\n" == [""]
    // lines "one" == ["one"]
    // lines "one\n" == ["one"]
    // lines "one\n\n" == ["one",""]
    // lines "one\ntwo" == ["one","two"]
    // lines "one\ntwo\n" == ["one","two"]

    it('lines ""', () => {
        const result = lines('');
        expect(result).to.deep.equal([]);
    });

    it('lines "\\n"', () => {
        const result = lines('\n');
        expect(result).to.deep.equal(['']);
    });

    it('lines "one"', () => {
        const result = lines('one');
        expect(result).to.deep.equal(['one']);
    });

    it('lines "one\\n"', () => {
        const result = lines('one\n');
        expect(result).to.deep.equal(['one']);
    });

    it('lines "one\\n\\n"', () => {
        const result = lines('one\n\n');
        expect(result).to.deep.equal(['one', '']);
    });

    it('lines "one\\ntwo"', () => {
        const result = lines('one\ntwo');
        expect(result).to.deep.equal(['one', 'two']);
    });

    it('lines "one\\ntwo\\n"', () => {
        const result = lines('one\ntwo\n');
        expect(result).to.deep.equal(['one', 'two']);
    });

    // TODO:
    // number
    // short
    // oneLine
    // isOneLine
});
