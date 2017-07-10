import { genInt, sample } from './gen';
import { forAll, withMaxSuccess } from './property';
import { quickCheckResult } from './test';

const values = sample(genInt);
values.forEach((value, index) => console.log(`values[${index}]: ${value}`));

const prop_Simple = n => n + n === 2 * n;

const result1 = quickCheckResult(forAll(genInt, prop_Simple));
console.log(`result1: ${JSON.stringify(result1)}`);

const result2 = quickCheckResult(forAll(genInt, prop_Simple));
console.log(`result2: ${JSON.stringify(result2)}`);

const result3 = quickCheckResult(withMaxSuccess(10, forAll(genInt, prop_Simple)));
console.log(`result3: ${JSON.stringify(result3)}`);
