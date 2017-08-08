import { expect } from 'chai';
import { quickCheckResult, forAll, verbose, genInt, lines } from '../lib';

describe('property combinators', () => {

    // mapSize
    // shrinking
    // noShrinking
    // counterexample
    // whenFail
    // whenFail2
    // verbose
    // expectFailure
    // once
    // again
    // withMaxSuccess
    // label
    // collect
    // classify (3 args)
    // classify (4 args)
    // cover
    // implication / Boolean.prototype['==>']
    // forAll
    // forAllShrink

    it('verbose', () => {
        const prop = n => n * 2 === n + n;
        const result = quickCheckResult(verbose(forAll(genInt, prop)));
        expect(lines(result.output)).to.have.length(201);
    });
});
