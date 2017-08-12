import chai, { expect } from 'chai';
import chaiThings from 'chai-things';
chai.use(chaiThings);
import {
    genInt,
    sample,
    constant,
    elements,
    oneof,
    choose,
    listOf,
    listOf1
} from '../lib';

describe('gen combinators', () => {

    it('constant', () => {
        const values = sample(constant(42));
        expect(values).to.not.be.empty;
        expect(values).to.all.equal(42);
    });

    it('map', () => {
        const values = sample(constant(42).map(n => n + 1));
        expect(values).to.not.be.empty;
        expect(values).to.all.equal(43);
    });

    it('flatMap', () => {
        const values = sample(constant(42).flatMap(n => constant(n + 1)));
        expect(values).to.not.be.empty;
        expect(values).to.all.equal(43);
    });

    it('elements', () => {
        const values = sample(elements([1, 2, 3]));
        const ones = values.filter(n => n === 1);
        const twos = values.filter(n => n === 2);
        const threes = values.filter(n => n === 3);
        expect(ones).to.not.be.empty;
        expect(twos).to.not.be.empty;
        expect(threes).to.not.be.empty;
        expect(ones.length + twos.length + threes.length).to.equal(values.length);
    });

    it('oneof', () => {
        const values = sample(oneof([constant(1), constant(2), constant(3)]));
        const ones = values.filter(n => n === 1);
        const twos = values.filter(n => n === 2);
        const threes = values.filter(n => n === 3);
        expect(ones).to.not.be.empty;
        expect(twos).to.not.be.empty;
        expect(threes).to.not.be.empty;
        expect(ones.length + twos.length + threes.length).to.equal(values.length);
    });

    it('choose', () => {
        const values = sample(choose(1, 3));
        const ones = values.filter(n => n === 1);
        const twos = values.filter(n => n === 2);
        const threes = values.filter(n => n === 3);
        expect(ones).to.not.be.empty;
        expect(twos).to.not.be.empty;
        expect(threes).to.not.be.empty;
        expect(ones.length + twos.length + threes.length).to.equal(values.length);
    });

    it('listOf', () => {
        const values = sample(listOf(genInt));
        expect(values).to.not.be.empty;
        expect(values).to.all.have.property('length');
    });

    // TODO:
    // monad laws
    // ap / ['<*>']
    // generate
    // sized
    // getSize
    // resize
    // sample
    // frequency
    // listOf1
    // vectorOf
    // suchThat
    // suchThatMap
    // suchThatMaybe
});
