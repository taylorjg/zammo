import { genInt, sample } from './gen';
import { forAll, withMaxSuccess } from './property';
import { quickCheckResult } from './test';

const values = sample(genInt);
values.forEach((value, index) => console.log(`values[${index}]: ${value}`));

const result1 = quickCheckResult(forAll(genInt, n => n + n === 2 * n));
console.log(`result1: ${JSON.stringify(result1)}`);

const result2 = quickCheckResult(forAll(genInt, n => n + n === 2 * n + 1));
console.log(`result2: ${JSON.stringify(result2)}`);

const result3 = quickCheckResult(withMaxSuccess(10, forAll(genInt, n => n + n === 2 * n)));
console.log(`result3: ${JSON.stringify(result3)}`);
