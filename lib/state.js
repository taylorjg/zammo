import { Record } from 'immutable';

const State = Record({
    // static
    terminal: null, // Terminal
    maxSuccessTests: 0,
    maxDiscardedTests: 0,
    computeSize: (/* n, d */) => 0,
    numTotMaxShrinks: 0,
    // dynamic
    numSuccessTests: 0,
    numDiscardedTests: 0,
    numRecentlyDiscardedTests: 0,
    labels: new Map(), // Map String Int
    collected: [], // [Set String]
    expectedFailure: false,
    randomSeed: null, // QCGen
    // shrinking
    numSuccessShrinks: 0,
    numTryShrinks: 0,
    numTotTryShrinks: 0
});

export const MkState = fields => new State(fields);
