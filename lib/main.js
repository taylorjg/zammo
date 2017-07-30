import { genInt, sample, constant, elements, frequency, oneof, vectorOf, listOf, listOf1, choose, suchThat, suchThatMap } from './gen';
import { forAll, withMaxSuccess, verbose, label, classify } from './property';
import { quickCheck, quickCheckResult, quickCheckWith, verboseCheckResult, stdArgs } from './test';
import { Just, Nothing } from './prelude/maybe';

const values = sample(genInt);
values.forEach((value, index) => console.log(`values[${index}]: ${value}`));

const prop_Good1 = n => n + n === 2 * n;
// const prop_Good1WithLogging = n => (console.log(`n: ${n}`), n + n === 2 * n);
const prop_Bad1 = n => n + n === 2 * n + 1;

const prop_Good2 = ([a, b]) => a + b === b + a;
// const prop_Good2WithLogging = ([a, b]) => (console.log(`a: ${a}; b: ${b}`), a + b === b + a);

const prop_Good3 = ns => ns.every(n => n + n === 2 * n);
// const prop_Good3WithLogging = ns => (console.log(`ns: ${JSON.stringify(ns)}`), ns.every(n => n + n === 2 * n));

const prop_Good4 = n => label(`n: ${n}`, n + n === 2 * n);

const result1 = quickCheckResult(forAll(genInt, prop_Good1));
console.log(`result1: ${JSON.stringify(result1)}`);

const result2 = quickCheckResult(forAll(genInt, prop_Bad1));
console.log(`result2: ${JSON.stringify(result2)}`);

// quickCheck(withMaxSuccess(10, forAll(genInt, prop_Good1)));

// quickCheckWith(stdArgs.set('maxSuccess', 15), forAll(genInt, prop_Good1));

// quickCheck(forAll(genInt.map(n => n + 1), prop_Good1));

// quickCheck(forAll(genInt.flatMap(a => genInt.flatMap(b => constant([a, b]))), prop_Good2));

// quickCheck(forAll(elements([1, 2, 3, 4]), prop_Good1));

// quickCheck(forAll(frequency([
//     [1, elements([1, 2, 3])],
//     [3, elements([4, 5, 6])]
// ]), prop_Good1));

// quickCheck(forAll(oneof([
//     elements([1, 2, 3]),
//     elements([4, 5, 6])
// ]), prop_Good1));

// quickCheck(forAll(vectorOf(5, genInt), prop_Good3));

// quickCheck(forAll(listOf(genInt), prop_Good3));

// quickCheck(forAll(listOf1(genInt), prop_Good3));

// quickCheck(withMaxSuccess(3, verbose(forAll(genInt, prop_Good1))));

// verboseCheckResult(withMaxSuccess(3, forAll(genInt, prop_Good1)));

// quickCheck(withMaxSuccess(20, forAll(choose(1, 10), prop_Good4)));

// quickCheck(withMaxSuccess(10, forAll(suchThat(genInt, n => n >= 0 && n % 2 === 0), prop_Good4)));

// quickCheck(withMaxSuccess(10, forAll(suchThatMap(genInt, n => n >= 0 ? Just(n) : Nothing), prop_Good4)));

// quickCheck(forAll(listOf(genInt), ns => classify(ns.length > 1, 'non-trivial', ns.every(n => n + n === 2 * n))));

// quickCheck(forAll(genInt, n =>
//     classify(n % 2 === 0, 'even', 'odd',
//         classify(n < 0, 'neg', 'pos',
//             classify(Math.abs(n) > 50, 'large',
//                 n + n === 2 * n)))));
