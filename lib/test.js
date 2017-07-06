import { mkTheGen } from './random';
import { State } from './state';

export const stdArgs = {
    replay: null,
    maxSuccess: 100,
    maxDiscardRatio: 10,
    maxSize: 100,
    chatty: true
    // ,maxShrinks: maxBound
};

class Result {

}

export class Success extends Result {
    constructor() {
        super();
    }
}

// export class GaveUp extends Result {
//     constructor() {
//         super();
//     }
// }

export class Failure extends Result {
    constructor() {
        super();
    }
}

// export class NoExpectedFailure extends Result {
//     constructor() {
//         super();
//     }
// }

// export class InsufficientCoverage extends Result {
//     constructor() {
//         super();
//     }
// }

export const quickCheck = p => (quickCheckWith(stdArgs, p), undefined);

export const quickCheckWith = (args, p) => (quickCheckWithResult(args, p), undefined);

export const quickCheckResult = p => quickCheckWithResult(stdArgs, p);

export const quickCheckWithResult = (a, p) => {
    const rnd = a.replay || mkTheGen(Math.random());
    const state = new State(a.maxSuccess, a.maxDiscardRatio * a.maxSuccess, 0, 0, rnd);
    return test(state, p);
};

const test = (st, f) => {
    if (st.numSuccessTests >= st.maxSuccessTests) return doneTesting(st, f);
    if (st.numDiscardedTests >= st.maxDiscardedTests) return giveUp(st, f);
    return runATest(st, f);
};

const doneTesting = (st, _f) => {
};

const giveUp = (st, _f) => {
};

const runATest = (st, f) => {
};
