import { genInt, sample } from './gen';

const values = sample(genInt);
values.forEach((value, index) => console.log(`values[${index}]: ${value}`));
