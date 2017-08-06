[![CircleCI](https://circleci.com/gh/taylorjg/zammo.svg?style=svg)](https://circleci.com/gh/taylorjg/zammo)

## Description

I have only just started this project so it doesn't do much yet.
The idea is to port QuickCheck to JavaScript.
I want the port to be as faithful to the original as possible.

```js
quickCheck(forAll(genInt, n =>
    classify(n % 2 === 0, 'even', 'odd',
        classify(n < 0, 'neg', 'pos',
            classify(Math.abs(n) > 50, 'large',
                n + n === 2 * n)))));
// +++ OK, passed 100 tests:
// 26% neg, even
// 19% pos, even
// 19% pos, odd
// 17% neg, odd
//  6% large, neg, odd
//  6% large, pos, odd
//  4% large, neg, even
//  3% large, pos, even
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
* implement integration with [Karma](https://karma-runner.github.io/)
* QCGen, random, replaying random, etc.
* TypeScript typings for users of zammo
* ES2015 & Flow ? Possible use re picking an Arbitrary for a type ?
* (and more...)

### Current progress against the list of things to implement

* __Running tests__: ~~stdArgs~~,
~~quickCheck~~, ~~quickCheckWith~~, ~~quickCheckWithResult~~, ~~quickCheckResult~~,
~~verboseCheck~~, ~~verboseCheckWith~~, ~~verboseCheckWithResult~~, ~~verboseCheckResult~~
* __Gen combinators__: ~~constant~~<sup>1</sup>, ~~choose~~, ~~oneof~~, ~~frequency~~, ~~elements~~,
growingElements, ~~sized~~, ~~getSize~~, ~~resize~~, scale, ~~suchThat~~, ~~suchThatMap~~, ~~suchThatMaybe~~,
~~listOf~~, ~~listOf1~~, ~~vectorOf~~, infiniteListOf, shuffle, sublistOf, ~~generate~~
* __Property combinators__: ~~forAll~~, ~~forAllShrink~~, shrinking, ~~noShrinking~~, ==>, ===, total, ~~verbose~~, ~~once~~, ~~again~~, ~~withMaxSuccess~~, within, .&., .&&., conjoin, .||., disjoin, ~~counterexample~~, ~~whenFail~~, ~~whenFail'~~, ~~expectFailure~~,
~~label~~, ~~collect~~, ~~classify~~, ~~cover~~, discard, mapSize

<sup>1</sup> although `constant` is not part of QuickCheck, it is included here as a counterpart to
[const](https://www.scalacheck.org/files/scalacheck_2.11-1.13.4-api/index.html#org.scalacheck.Gen$@const[T](x:T):org.scalacheck.Gen[T]) in ScalaCheck.

## Other JavaScript property testing libraries

* [JsCheck](http://jscheck.org/)
* [JsVerify](http://jsverify.github.io/)
* [TestCheck.js](http://leebyron.com/testcheck-js/api)

## Links

* [QuickCheck git repo](https://github.com/nick8325/quickcheck)
* [QuickCheck documentation](https://hackage.haskell.org/package/QuickCheck-2.10.0.1/docs/Test-QuickCheck.html)
* [QuickCheck manual](http://www.cse.chalmers.se/~rjmh/QuickCheck/manual.html)
