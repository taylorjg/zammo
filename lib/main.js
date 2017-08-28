import { genInt, sample, constant, elements, frequency, oneof, vectorOf, listOf, listOf1, choose, suchThat, suchThatMap } from './gen';
import { forAll, forAllShrink, withMaxSuccess, verbose, label, classify, noShrinking } from './property';
import { quickCheck, quickCheckResult, quickCheckWith, verboseCheckResult, stdArgs } from './test';
import { shrinkList, shrinkIntegral } from './arbitrary';
import { Just, Nothing } from './prelude/maybe';
import { nub } from './prelude/list';

const values = sample(genInt);
values.forEach((value, index) => console.log(`values[${index}]: ${value}`));

const prop_ofInt_pass = n => n + n === 2 * n;
const prop_ofIntPair_pass = ([a, b]) => a + b === b + a;
const prop_ofIntList_pass = xs => xs.every(x => x + x === 2 * x);
const prop_ofInt_withLabel_Pass = n => label(`n: ${n}`, n + n === 2 * n);
const prop_ofInt_fail = n => n + n === 2 * n + 1;
const prop_ofIntList_fail = xs => nub(xs).length === xs.length;

const result1 = quickCheckResult(forAll(genInt, prop_ofInt_pass));
console.log(`result1: ${JSON.stringify(result1)}`);

const result2 = quickCheckResult(forAll(genInt, prop_ofInt_fail));
console.log(`result2: ${JSON.stringify(result2)}`);

quickCheck(withMaxSuccess(10, forAll(genInt, prop_ofInt_pass)));

quickCheckWith(stdArgs.withMaxSuccess(15), forAll(genInt, prop_ofInt_pass));

quickCheck(forAll(genInt.map(n => n + 1), prop_ofInt_pass));

quickCheck(forAll(genInt.flatMap(a => genInt.flatMap(b => constant([a, b]))), prop_ofIntPair_pass));

quickCheck(forAll(elements([1, 2, 3, 4]), prop_ofInt_pass));

quickCheck(forAll(frequency([
    [1, elements([1, 2, 3])],
    [3, elements([4, 5, 6])]
]), prop_ofInt_pass));

quickCheck(forAll(oneof([
    elements([1, 2, 3]),
    elements([4, 5, 6])
]), prop_ofInt_pass));

quickCheck(forAll(vectorOf(5, genInt), prop_ofIntList_pass));

quickCheck(forAll(listOf(genInt), prop_ofIntList_pass));

quickCheck(forAll(listOf1(genInt), prop_ofIntList_pass));

quickCheck(withMaxSuccess(3, verbose(forAll(genInt, prop_ofInt_pass))));

verboseCheckResult(withMaxSuccess(3, forAll(genInt, prop_ofInt_pass)));

quickCheck(withMaxSuccess(20, forAll(choose(1, 10), prop_ofInt_withLabel_Pass)));

quickCheck(withMaxSuccess(10, forAll(suchThat(genInt, n => n >= 0 && n % 2 === 0), prop_ofInt_withLabel_Pass)));

quickCheck(withMaxSuccess(10, forAll(suchThatMap(genInt, n => n >= 0 ? Just(n) : Nothing), prop_ofInt_withLabel_Pass)));

quickCheck(forAll(listOf(genInt), ns => classify(ns.length > 1, 'non-trivial', ns.every(n => n + n === 2 * n))));

quickCheck(forAll(genInt, n =>
    classify(n % 2 === 0, 'even', 'odd',
        classify(n < 0, 'neg', 'pos',
            classify(Math.abs(n) > 50, 'large',
                n + n === 2 * n)))));

quickCheck(forAll(listOf(genInt), prop_ofIntList_fail));

const compose = (f, g) => x => f(g(x));
quickCheck(forAll(listOf(genInt), compose(noShrinking, prop_ofIntList_fail)));

quickCheck(forAll(genInt, n => (n > 0 && n % 2 === 0)['==>']((n + 1) % 2 === 1)));

// const shrinker = xs => shrinkList(shrinkIntegral, xs);
const shrinker = xs => shrinkList(() => [], xs);
quickCheck(verbose(forAllShrink(listOf(genInt), shrinker, prop_ofIntList_fail)));
