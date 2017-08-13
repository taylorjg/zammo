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
    listOf
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

    it('[\'<$>\'] and [\'<*>\']', () => {
        const fn = n => s1 => s2 => (`${n}${s1}${s2}`).length > 4;
        const gn = genInt;
        const gs1 = genInt.map(n => `${n}`);
        const gs2 = genInt.map(n => `${n}`);
        const gr = fn['<$>'](gn)['<*>'](gs1)['<*>'](gs2);
        const values = sample(gr);
        const trues = values.filter(b => b === true);
        const falses = values.filter(b => b === false);
        expect(values).to.not.be.empty;
        expect(trues).to.not.be.empty;
        expect(falses).to.not.be.empty;
        expect(trues.length + falses.length).to.equal(values.length);
    });

    // TODO:
    // functor laws
    // applicative laws
    // monad laws
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
