import { expect } from 'chai';
import { quickCheckResult, forAll, genInt } from '../lib';

describe('test', () => {

    // quickCheck
    // quickCheckWith
    // quickCheckResult
    // quickCheckWithResult
    // verboseCheck
    // verboseCheckWith
    // verboseCheckResult
    // verboseCheckWithResult
    // stdArgs
    
    it('quickCheckResult', () => {
        const prop = n => n * 2 === n + n;
        const result = quickCheckResult(forAll(genInt, prop));
        expect(result.numTests).to.equal(100);
        expect(result.labels).to.be.empty;
        expect(result.output).to.equal("+++ OK, passed 100 tests.\n");
    });
});
