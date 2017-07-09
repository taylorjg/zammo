## Description

I have only just started this project so it doesn't do much yet.
The idea is to port QuickCheck to JavaScript.
I want the port to be as faithful to the original as possible.

```js
const result = quickCheckResult(forAll(genInt, n => n + n === 2 * n));
console.log(`result: ${JSON.stringify(result)}`);
```

## TODO

* ~~implement a generator for a primitive type~~
* ~~implement `sample` to sample the generator~~
* ~~implement a very basic version of `quickCheckResult` (no shrinking)~~
* output messages (e.g. `+++ OK, passed 100 tests.`)
* implement more generators
* implement generator combinators (e.g. `elements`, `oneof`, etc.)
* implement property combinators (e.g. `withMaxSuccess`, `classify`, `collect`, etc.)
* implement shrinking
* implement arbitraries
* implement integration with [Mocha](https://mochajs.org/)
* implement integration with [Jasmine](https://jasmine.github.io/)
* (and more...)

## Other JavaScript property testing libraries

* [JsCheck](http://jscheck.org/)
* [JsVerify](http://jsverify.github.io/)
* [TestCheck.js](http://leebyron.com/testcheck-js/api)

## Links

* [QuickCheck git repo](https://github.com/nick8325/quickcheck)
* [QuickCheck documentation](https://hackage.haskell.org/package/QuickCheck-2.10.0.1/docs/Test-QuickCheck.html)
* [QuickCheck manual](http://www.cse.chalmers.se/~rjmh/QuickCheck/manual.html)
