import { genInt, sample, constant, elements, frequency, oneof } from './gen';
import { forAll, withMaxSuccess } from './property';
import { quickCheckResult } from './test';

const values = sample(genInt);
values.forEach((value, index) => console.log(`values[${index}]: ${value}`));

const prop_Good = n => n + n === 2 * n;
const prop_GoodWithLogging = n => (console.log(`n: ${n}`), n + n === 2 * n);
const prop_Bad = n => n + n === 2 * n + 1;
const prop_Good2 = ([a, b]) => a + b === b + a;

const result1 = quickCheckResult(forAll(genInt, prop_Good));
console.log(`result1: ${JSON.stringify(result1)}`);

const result2 = quickCheckResult(forAll(genInt, prop_Bad));
console.log(`result2: ${JSON.stringify(result2)}`);

const result3 = quickCheckResult(withMaxSuccess(10, forAll(genInt, prop_Good)));
console.log(`result3: ${JSON.stringify(result3)}`);

const result4 = quickCheckResult(forAll(genInt.map(n => n + 1), prop_Good));
console.log(`result4: ${JSON.stringify(result4)}`);

const result5 = quickCheckResult(forAll(genInt.flatMap(a => genInt.flatMap(b => constant([a, b]))), prop_Good2));
console.log(`result5: ${JSON.stringify(result5)}`);

const result6 = quickCheckResult(forAll(elements([1, 2, 3, 4]), prop_Good));
console.log(`result6: ${JSON.stringify(result6)}`);

const result7 = quickCheckResult(forAll(frequency([
    [1, elements([1, 2, 3])],
    [3, elements([4, 5, 6])]
]), prop_Good));
console.log(`result7: ${JSON.stringify(result7)}`);

const result8 = quickCheckResult(forAll(oneof([
    elements([1, 2, 3]),
    elements([4, 5, 6])
]), prop_Good));
console.log(`result8: ${JSON.stringify(result8)}`);
