import { mkTheGen, split } from './random';
import { MkState } from './state';
import * as P from './property';
import { withStdioTerminal, withNullTerminal, putPart, putTemp, terminalOutput, number, bold } from './text';
import { fromMaybe, Nothing } from './prelude/maybe';
import { Record } from 'immutable';

// TODO: make this immutable
export const stdArgs = {
    replay: Nothing, // Maybe (QCGen,Int)
    maxSuccess: 100,
    maxDiscardRatio: 10,
    maxSize: 100,
    chatty: true,
    maxShrinks: Number.MAX_VALUE
};

const Success = Record({
    numTests: 0,
    labels: [/* (String,Double) */],
    output: ''
});

const GaveUp = Record({
    numTests: 0,
    labels: [/* (String,Double) */],
    output: ''
});

const Failure = Record({
    numTests: 0,
    numShrinks: 0,
    numShrinkTries: 0,
    numShrinkFinal: 0,
    usedSeed: null,
    usedSize: 0,
    reason: '',
    theException: Nothing,
    labels: [/* (String,Double) */],
    output: '',
    failingTestCase: [/* String */]
});

const NoExpectedFailure = Record({
    numTests: 0,
    labels: [/* (String,Double) */],
    output: ''
});

const InsufficientCoverage = Record({
    numTests: 0,
    labels: [/* (String,Double) */],
    output: ''
});

// quickCheck :: Testable prop => prop -> IO ()
export const quickCheck = p => (quickCheckWith(stdArgs, p), undefined);

// quickCheckWith :: Testable prop => Args -> prop -> IO ()
export const quickCheckWith = (args, p) => (quickCheckWithResult(args, p), undefined);

// quickCheckResult :: Testable prop => prop -> IO Result
export const quickCheckResult = p => quickCheckWithResult(stdArgs, p);

// quickCheckWithResult :: Testable prop => Args -> prop -> IO Result
export const quickCheckWithResult = (a, p) =>
    (a.chatty ? withStdioTerminal : withNullTerminal)(tm => {
        const rnd = a.replay.patternMatch(() => mkTheGen(Math.random(), v => v));
        const state = MkState({
            terminal: tm,
            maxSuccessTests: a.maxSuccess,
            maxDiscardedTests: a.maxDiscardRatio * a.maxSuccess,
            computeSize: computeSize(a),
            numTotMaxShrinks: a.maxShrinks,
            numSuccessTests: 0,
            numDiscardedTests: 0,
            numRecentlyDiscardedTests: 0,
            labels: new Map(),
            collected: [],
            expectedFailure: false,
            randomSeed: rnd,
            numSuccessShrinks: 0,
            numTryShrinks: 0,
            numTotTryShrinks: 0
        });
        return test(state, P.property(p).unProperty.unGen);
    });

const computeSize = a => (n, d) => {

    const roundTo = (n, m) => Math.floor(n / m) * m;

    if (roundTo(n, a.maxSize) + a.maxSize <= a.maxSuccess ||
        n >= a.maxSuccess ||
        a.maxSuccess % a.maxSize == 0) {
        return Math.min(n % a.maxSize + Math.floor(d / 10), a.maxSize);
    }

    return Math.min((n % a.maxSize * Math.floor(a.maxSize / (a.maxSuccess % a.maxSize + Math.floor(d / 10)))), a.maxSize);
};

// test :: State -> (QCGen -> Int -> Prop) -> IO Result
const test = (st, f) => {
    if (st.numSuccessTests >= st.maxSuccessTests) return doneTesting(st, f);
    if (st.numDiscardedTests >= st.maxDiscardedTests) return giveUp(st, f);
    return runATest(st, f);
};

// doneTesting :: State -> (QCGen -> Int -> Prop) -> IO Result
const doneTesting = (st /* _f */) => {
    const finished = k => {
        success(st);
        const theOutput = terminalOutput(st.terminal);
        return k({
            numTests: st.numSuccessTests,
            labels: summary(st),
            output: theOutput
        });
    };

    if (!st.expectedFailure) {
        putPart(st.terminal, bold('*** Failed!') + ` Passed ${st.numSuccessTests} tests (expected failure)`);
        return finished(NoExpectedFailure);
    }

    if (insufficientlyCovered(st).length) {
        putPart(st.terminal, bold('*** Insufficient coverage after ') + `${st.numSuccessTests} tests`);
        return finished(InsufficientCoverage);
    }

    putPart(st.terminal, `+++ OK, passed ${st.numSuccessTests} tests`);
    return finished(Success);
};

// giveUp :: State -> (QCGen -> Int -> Prop) -> IO Result
const giveUp = (st /* _f */) => {
    putPart(st.terminal, bold('*** Gave up!') + ` Passed only ${st.numSuccessTests} tests`);
    success(st);
    const theOutput = terminalOutput(st.terminal);
    return GaveUp({
        numTests: st.numSuccessTests,
        labels: summary(st),
        output: theOutput
    });
};

const unionWith = (f, m1, m2) => {
    const r = new Map();
    Array.from(m1.values()).forEach(([k, v]) => m2.has(k) ? r.set(k, f(v, m2.get(k))) : r.set(k, v));
    Array.from(m2.values()).forEach(([k, v]) => !m1.has(k) && r.set(k, v));
    return r;
};

// runATest :: State -> (QCGen -> Int -> Prop) -> IO Result
const runATest = (st, f) => {

    putTemp(st.terminal, `
    (
        ${number(st.numSuccessTests, 'test')}
        ${st.numDiscardedTests > 0 ? `; ${st.numDiscardedTests} discarded` : ''}
    )`
    );

    const [rnd1, rnd2] = split(st.randomSeed);
    const size = st.computeSize(st.numSuccessTests, st.numRecentlyDiscardedTests);
    const { x: res, rs: ts } = f(rnd1, size).unProp;
    // res <- callbackPostTest st res

    const _continue = (_break, st2, f) => {
        return (res.abort) ? _break(st2, f) : test(st2, f);
    };

    return res.patternMatch(
        // succeeded
        () => {
            const st2 = st.withMutations(obj => obj
                .set('numSuccessTests', st.numSuccessTests + 1)
                .set('numRecentlyDiscardedTests', 0)
                .set('maxSuccessTests', fromMaybe(st.maxSuccessTests, res.maybeNumTests))
                .set('randomSeed', rnd2)
                .set('labels', unionWith(Math.max, st.labels, res.labels))
                .set('collected', [res.stamp, ...st.collected])
                .set('expectedFailure', res.expect)
            );
            return _continue(doneTesting, st2, f);
        },
        // failed
        () => {
            if (res.expect)
                putPart(st.terminal, bold('*** Failed! '));
            else putPart(st.terminal, '+++ OK, failed as expected. ');
            // (numShrinks, totFailed, lastFailed, res) <- foundFailure st res ts
            const theOutput = terminalOutput(st.terminal);

            if (!res.expect) {
                return new Success(st.numSuccessTests, summary(st), '');
            }
            else {
                // const testCase = res.testCase.map(showCounterexample);
                return Failure({
                    usedSeed: st.randomSeed,
                    usedSize: size,
                    numTests: st.numSuccessTests + 1,
                    numShrinks: 0, // numShrinks
                    numShrinkTries: 0, // totFailed
                    numShrinkFinal: 0, // lastFailed
                    output: theOutput,
                    reason: res.reason,
                    theException: res.theException,
                    labels: summary(st),
                    failingTestCase: [] // testCase
                });
            }
        },
        // rejected
        () => {
            const st2 = st.withMutations(obj => obj
                .set('numDiscardedTests', st.numDiscardedTests + 1)
                .set('numRecentlyDiscardedTests', st.numRecentlyDiscardedTests + 1)
                .set('maxSuccessTests', fromMaybe(st.maxSuccessTests, res.maybeNumTests))
                .set('randomSeed', rnd2)
                .set('labels', unionWith(Math.max, st.labels, res.labels))
                .set('expectedFailure', res.expect)
            );
            return _continue(giveUp, st2, f);
        }
    );
};

// summary :: State -> [(String, Double)]
const summary = st => {
    return [];
};

// success :: State -> IO ()
const success = st => {
};

// labelCount :: String -> State -> Int
const labelCount = (l, st) =>
    [].concat(...st.collected.map(set => Array.from(set))).filter(l2 => l2 === l).length;

// percentage :: Integral a => State -> a -> Double
const percentage = (st, n) => n * 100 / st.numSuccessTests;

// insufficientlyCovered :: State -> [(String, Int, Double)]
const insufficientlyCovered = st =>
    Array.from(st.labels.entries())
        .map(([l, reqP]) => {
            const p = percentage(st, labelCount(l, st));
            return [l, reqP, p];
        })
        .filter(([, reqP, p]) => p < reqP);
