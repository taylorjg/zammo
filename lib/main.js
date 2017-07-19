import { genInt, sample, constant, elements, frequency, oneof, vectorOf, listOf, listOf1, choose, suchThat, suchThatMap } from './gen';
import { forAll, withMaxSuccess, verbose, label } from './property';
import { quickCheckResult, quickCheckWithResult, verboseCheckResult, stdArgs } from './test';
import { Just, Nothing } from './prelude/maybe';

const values = sample(genInt);
values.forEach((value, index) => console.log(`values[${index}]: ${value}`));

const prop_Good1 = n => n + n === 2 * n;
const prop_Good1WithLogging = n => (console.log(`n: ${n}`), n + n === 2 * n);
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

const result3 = quickCheckResult(withMaxSuccess(10, forAll(genInt, prop_Good1)));
console.log(`result3: ${JSON.stringify(result3)}`);

const result3a = quickCheckWithResult(stdArgs.set('maxSuccess', 15), forAll(genInt, prop_Good1));
console.log(`result3a: ${JSON.stringify(result3a)}`);

const result4 = quickCheckResult(forAll(genInt.map(n => n + 1), prop_Good1));
console.log(`result4: ${JSON.stringify(result4)}`);

const result5 = quickCheckResult(forAll(genInt.flatMap(a => genInt.flatMap(b => constant([a, b]))), prop_Good2));
console.log(`result5: ${JSON.stringify(result5)}`);

const result6 = quickCheckResult(forAll(elements([1, 2, 3, 4]), prop_Good1));
console.log(`result6: ${JSON.stringify(result6)}`);

const result7 = quickCheckResult(forAll(frequency([
    [1, elements([1, 2, 3])],
    [3, elements([4, 5, 6])]
]), prop_Good1));
console.log(`result7: ${JSON.stringify(result7)}`);

const result8 = quickCheckResult(forAll(oneof([
    elements([1, 2, 3]),
    elements([4, 5, 6])
]), prop_Good1));
console.log(`result8: ${JSON.stringify(result8)}`);

const result9 = quickCheckResult(forAll(vectorOf(5, genInt), prop_Good3));
console.log(`result9: ${JSON.stringify(result9)}`);

const result10 = quickCheckResult(forAll(listOf(genInt), prop_Good3));
console.log(`result10: ${JSON.stringify(result10)}`);

const result11 = quickCheckResult(forAll(listOf1(genInt), prop_Good3));
console.log(`result11: ${JSON.stringify(result11)}`);

const result12 = quickCheckResult(withMaxSuccess(3, verbose(forAll(genInt, prop_Good1))));
console.log(`result12: ${JSON.stringify(result12)}`);

const result13 = verboseCheckResult(withMaxSuccess(3, forAll(genInt, prop_Good1)));
console.log(`result13: ${JSON.stringify(result13)}`);

const result14 = quickCheckResult(withMaxSuccess(20, forAll(choose(1, 10), prop_Good4)));
console.log(`result14: ${JSON.stringify(result14)}`);

const result15 = quickCheckResult(withMaxSuccess(10, forAll(suchThat(genInt, n => n >= 0 && n % 2 === 0), prop_Good1WithLogging)));
console.log(`result15: ${JSON.stringify(result15)}`);

const result16 = quickCheckResult(withMaxSuccess(10, forAll(suchThatMap(genInt, n => n >= 0 ? Just(n) : Nothing), prop_Good1WithLogging)));
console.log(`result16: ${JSON.stringify(result16)}`);
