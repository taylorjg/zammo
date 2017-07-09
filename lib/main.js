import { genInt, sample } from './gen';
import { forAll } from './property';
import { quickCheckResult } from './test';

const values = sample(genInt);
values.forEach((value, index) => console.log(`values[${index}]: ${value}`));

const result1 = quickCheckResult(forAll(genInt, n => n + n === 2 * n));
console.log(`result1: ${JSON.stringify(result1)}`);

const result2 = quickCheckResult(forAll(genInt, n => n + n === 2 * n + 1));
console.log(`result2: ${JSON.stringify(result2)}`);
