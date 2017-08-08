import chai, { expect } from 'chai';
import chaiThings from 'chai-things';
chai.use(chaiThings);
import { sample, constant } from '../lib';

describe('gen combinators', () => {

    // constant / pure
    // gen.map / fmap
    // gen.flatMap / ['>>=']
    // ap / ['<*>']
    // generate
    // sized
    // getSize
    // resize
    // sample
    // choose
    // elements
    // frequency
    // oneof
    // listOf
    // listOf1
    // vectorOf
    // genInt
    // suchThat
    // suchThatMap
    // suchThatMaybe

    it('constant', () => {
        const values = sample(constant(42));
        expect(values).to.not.be.empty;
        expect(values).to.all.equal(42);
    });
});
