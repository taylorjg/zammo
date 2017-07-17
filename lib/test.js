import { mkTheGen, split } from './random';
import { MkState } from './state';
import * as P from './property';
import { withStdioTerminal, withNullTerminal, putPart, putTemp, terminalOutput, number, bold } from './text';
import { fromMaybe, Just, Nothing } from './prelude/maybe';
import Immutable, { Record } from 'immutable';

// --------------------------------------------------------------------------
// quickCheck

const Args = Record({
    replay: Nothing, // Maybe (QCGen,Int)
    maxSuccess: 100,
    maxDiscardRatio: 10,
    maxSize: 100,
    chatty: true,
    maxShrinks: Number.MAX_VALUE
});

export const stdArgs = Args();

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
            labels: Immutable.Map(),
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

// verboseCheck :: Testable prop => prop -> IO ()
export const verboseCheck = p => quickCheck(P.verbose(p));

// verboseCheckWith :: Testable prop => Args -> prop -> IO ()
export const verboseCheckWith = (args, p) => quickCheckWith(args, P.verbose(p));

// verboseCheckResult :: Testable prop => prop -> IO Result
export const verboseCheckResult = p => quickCheckResult(P.verbose(p));

// verboseCheckWithResult :: Testable prop => Args -> prop -> IO Result
export const verboseCheckWithResult = (a, p) => quickCheckWithResult(a, P.verbose(p));

// --------------------------------------------------------------------------
// main test loop

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

// TODO: move elsewhere ?
const unionWith = (f, m1, m2) => m1.mergeWith((a, b) => f(a, b), m2);

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
    callbackPostTest(st, res);

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

const group = xs => {
    const buckets = [];
    const findBucket = x => buckets.find(b => b.indexOf(x) >= 0);
    xs.forEach(x => {
        const bucket = findBucket(x);
        if (bucket) bucket.push(x); else buckets.push([x]);
    });
    return buckets;
};

// summary :: State -> [(String, Double)]
const summary = st => {
    const s2s = st.collected
        .map(s => Array.from(s).filter(t => st.labels.has(t) && st.labels.get(t) === 0))
        .filter(s2 => s2.length)
        .map(s2 => s2.join(', '));
    const v1 = s2s.sort();
    const v2 = group(v1);
    const v3 = v2.map(ss => [ss[0], Math.floor(ss.length * 100 / st.numSuccessTests)]);
    const v4 = v3.sort(([, p1], [, p2]) => p2 - p1);
    return v4;
};

// success :: State -> IO ()
const success = st => {
    const allLabels = summary(st).map(pair => formatLabel(st.numSuccessTests, true, pair));
    console.log(`allLabels: ${JSON.stringify(allLabels)}`);
    // TODO: complete this...
};

// formatLabel :: Int -> Bool -> (String, Double) -> String
const formatLabel = (n, pad, [x, p]) => {
    const showP = (pad, p) => `${(pad && p < 10) ? ' ' : ''}${p.toFixed(places)}%`;
    const places = Math.max(Math.ceil(Math.log10(n) - 2), 0);
    return `${showP(pad, p)} ${x}`;
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

// --------------------------------------------------------------------------
// main shrinking loop

// --------------------------------------------------------------------------
// callbacks

// callbackPostTest :: State -> P.Result -> IO P.Result
// callbackPostTest st res = protect (exception "Exception running callback") $ do
//   sequence_ [ f st res | PostTest _ f <- callbacks res ]
//   return res

// callbackPostTest :: State -> P.Result -> IO P.Result
const callbackPostTest = (st, res) => {
    const fs = res.callbacks.map(callback => callback.callback);
    fs.forEach(f => f(st, res));
    return res;
};

// callbackPostFinalFailure :: State -> P.Result -> IO ()
// callbackPostFinalFailure st res = do
//   x <- tryEvaluateIO $ sequence_ [ f st res | PostFinalFailure _ f <- callbacks res ]
//   case x of
//     Left err -> do
//       putLine (terminal st) "*** Exception running callback: "
//       tryEvaluateIO $ putLine (terminal st) (show err)
//       return ()
//     Right () -> return ()

// callbackPostFinalFailure :: State -> P.Result -> IO ()
const callbackPostFinalFailure = (st, res) => {
};

// protect :: (AnException -> a) -> IO a -> IO a
// protect f x = either f id `fmap` tryEvaluateIO x

// --------------------------------------------------------------------------
// the end.
