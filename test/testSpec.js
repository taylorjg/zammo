import { expect } from 'chai';
import {
    quickCheckResult,
    quickCheckWithResult,
    verboseCheckResult,
    verboseCheckWithResult,
    stdArgs,
    forAll,
    genInt,
    lines
} from '../lib';

describe('test', () => {

    const prop = forAll(genInt, n => n * 2 === n + n);

    it('quickCheckResult', () => {
        const result = quickCheckResult(prop);
        expect(result.numTests).to.equal(100);
        expect(result.labels).to.be.empty;
        expect(result.output).to.equal("+++ OK, passed 100 tests.\n");
    });

    it('quickCheckWithResult', () => {
        const result = quickCheckWithResult(stdArgs.withMaxSuccess(20), prop);
        expect(result.numTests).to.equal(20);
        expect(result.labels).to.be.empty;
        expect(result.output).to.equal("+++ OK, passed 20 tests.\n");
    });

    it('verboseCheckResult', () => {
        const result = verboseCheckResult(prop);
        expect(result.numTests).to.equal(100);
        expect(result.labels).to.be.empty;
        expect(lines(result.output)).to.have.length(201);
    });

    it('verboseCheckWithResult', () => {
        const result = verboseCheckWithResult(stdArgs.withMaxSuccess(20), prop);
        expect(result.numTests).to.equal(20);
        expect(result.labels).to.be.empty;
        expect(lines(result.output)).to.have.length(41);
    });

    // TODO:
    // quickCheck
    // quickCheckWith
    // verboseCheck
    // verboseCheckWith
    // stdArgs
});
