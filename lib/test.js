import { mkTheGen, split } from './random';
import { State } from './state';
import * as P from './property';

export const stdArgs = {
    replay: null,
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
        this.reason = reason;
        this.theException = theException;
        this.labels = labels;
        this.output = output;
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

export const quickCheck = p => (quickCheckWith(stdArgs, p), undefined);

export const quickCheckWith = (args, p) => (quickCheckWithResult(args, p), undefined);

export const quickCheckResult = p => quickCheckWithResult(stdArgs, p);

export const quickCheckWithResult = (a, p) => {
    const rnd = a.replay || mkTheGen(Math.random());
    const state = new State(a.maxSuccess, a.maxDiscardRatio * a.maxSuccess, computeSize(a), 0, 0, 0, rnd);
    return test(state, p);
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

const test = (st, f) => {
    if (st.numSuccessTests >= st.maxSuccessTests) return doneTesting(st, f);
    if (st.numDiscardedTests >= st.maxDiscardedTests) return giveUp(st, f);
    return runATest(st, f);
};

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

const giveUp = (st /* _f */) => {
    success(st);
    // theOutput <- terminalOutput (terminal st)
    return new GaveUp(st.numSuccessTests, [/* (String, Double) */], '');
};

const runATest = (st, f) => {

    const [rnd1, rnd2] = split(st.randomSeed);
    const size = st.computeSize(st.numSuccessTests, st.numRecentlyDiscardedTests);
    const { x: res, rs: ts } = f(rnd1, size).unProp;
    // res <- callbackPostTest st res

    const _continue = (_break, st2, f) => {
        return (res.abort) ? _break(st2, f) : test(st2, f);
    };

    if (res.ok === P.succeeded.ok) {
        st.numSuccessTests++;
        st.numRecentlyDiscardedTests = 0;
        res.maybeNumTests;
        st.maxSuccessTests = res.maybeNumTests ? res.maybeNumTests.value : st.maxSuccessTests;
        // randomSeed
        // labels
        // collected
        // expectedFailure
        return _continue(doneTesting, st, f);
    }

    if (res.ok === P.rejected.ok) {
        st.numDiscardedTests++;
        st.numRecentlyDiscardedTests++;
        st.maxSuccessTests = res.maybeNumTests ? res.maybeNumTests.value : st.maxSuccessTests;
        // randomSeed
        // labels
        // expectedFailure
        return _continue(giveUp, st, f);
    }

    if (res.ok === P.failure.ok) {
        // TODO: if res.expect
        // (numShrinks, totFailed, lastFailed, res) <- foundFailure st res ts
        // const testCase = res.testCase.map(showCounterexample);
        return Failure(st.numSuccessTests + 1, res.reason, null, [], '');
    }
};

const success = st => {
};
