import { mkTheGen, split } from './random';
import { MkState } from './state';
import * as P from './property';
import { fromMaybe, Nothing } from './prelude/maybe';

export const stdArgs = {
    replay: Nothing,
    maxSuccess: 100,
    maxDiscardRatio: 10,
    maxSize: 100,
    chatty: true,
    maxShrinks: Number.MAX_VALUE
};

class Result {
    isSuccess() {
        return false;
    }
}

class Success extends Result {
    constructor(numTests, labels, output) {
        super();
        this.numTests = numTests;
        this.labels = labels;
        this.output = output;
    }
    isSuccess() {
        return true;
    }
}

class GaveUp extends Result {
    constructor(numTests, labels, output) {
        super();
        this.numTests = numTests;
        this.labels = labels;
        this.output = output;
    }
}

class Failure extends Result {
    constructor(numTests, reason, theException, labels, output) {
        super();
        this.numTests = numTests;
        // numShrinks
        // numShrinkTries
        // numShirnkFinal
        // usedSeed
        // usedSize
        this.reason = reason;
        this.theException = theException;
        this.labels = labels;
        this.output = output;
        // failingTestCase
    }
}

class NoExpectedFailure extends Result {
    constructor(numTests, labels, output) {
        super();
        this.numTests = numTests;
        this.labels = labels;
        this.output = output;
    }
}

class InsufficientCoverage extends Result {
    constructor(numTests, labels, output) {
        super();
        this.numTests = numTests;
        this.labels = labels;
        this.output = output;
    }
}

// quickCheck :: Testable prop => prop -> IO ()
export const quickCheck = p => (quickCheckWith(stdArgs, p), undefined);

// quickCheckWith :: Testable prop => Args -> prop -> IO ()
export const quickCheckWith = (args, p) => (quickCheckWithResult(args, p), undefined);

// quickCheckResult :: Testable prop => prop -> IO Result
export const quickCheckResult = p => quickCheckWithResult(stdArgs, p);

// quickCheckWithResult :: Testable prop => Args -> prop -> IO Result
export const quickCheckWithResult = (a, p) => {
    const rnd = a.replay.patternMatch(() => mkTheGen(Math.random(), v => v));
    const state = MkState(
        undefined,                          // terminal
        a.maxSuccess,                       // maxSuccessTests
        a.maxDiscardRatio * a.maxSuccess,   // maxDiscardedTests
        computeSize(a),                     // computeSize
        a.maxShrinks,                       // numTotMaxShrinks
        0,                                  // numSuccessTests
        0,                                  // numDiscardedTests
        0,                                  // numRecentlyDiscardedTests
        new Map(),                          // labels
        [],                                 // collected
        false,                              // expectedFailure
        rnd,                                // randomSeed
        0,                                  // numSuccessShrinks
        0,                                  // numTryShrinks
        0);                                 // numTotTryShrinks
    return test(state, P.property(p).unProperty.unGen);
};

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
        // theOutput <- terminalOutput (terminal st)
        return new k(st.numSuccessTests, [/* (String, Double) */], '');
    };
    // not (expectedFailure st) => return finished(NoExpectedFailure);
    // not (null (insufficientlyCovered st)) => return finished(InsufficientCoverage);
    return finished(Success);
};

// giveUp :: State -> (QCGen -> Int -> Prop) -> IO Result
const giveUp = (st /* _f */) => {
    success(st);
    // theOutput <- terminalOutput (terminal st)
    return new GaveUp(st.numSuccessTests, [/* (String, Double) */], '');
};

// runATest :: State -> (QCGen -> Int -> Prop) -> IO Result
const runATest = (st, f) => {

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
            st.numSuccessTests++;
            st.numRecentlyDiscardedTests = 0;
            st.maxSuccessTests = fromMaybe(st.maxSuccessTests, res.maybeNumTests);
            // randomSeed
            // labels
            // collected
            // expectedFailure
            return _continue(doneTesting, st, f);
        },
        // failed
        () => {
            // TODO: if res.expect
            // (numShrinks, totFailed, lastFailed, res) <- foundFailure st res ts
            // const testCase = res.testCase.map(showCounterexample);
            return new Failure(
                st.numSuccessTests + 1,
                res.reason,
                Nothing,
                [],
                '');
        },
        // rejected
        () => {
            st.numDiscardedTests++;
            st.numRecentlyDiscardedTests++;
            st.maxSuccessTests = fromMaybe(st.maxSuccessTests, res.maybeNumTests);
            // randomSeed
            // labels
            // expectedFailure
            return _continue(giveUp, st, f);
        }
    );
};

// summary :: State -> [(String, Double)]
const summary = st => {
};

// success :: State -> IO ()
const success = st => {
};
