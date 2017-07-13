import { Record } from 'immutable';

const StateRecord = Record({
    // static
    terminal: null,
    maxSuccessTests: 0,
    maxDiscardedTests: 0,
    computeSize: (/* n, d */) => 0,
    numTotMaxShrinks: 0,
    // dynamic
    numSuccessTests: 0,
    numDiscardedTests: 0,
    numRecentlyDiscardedTests: 0,
    labels: new Map(),
    collected: [],
    expectedFailure: false,
    randomSeed: null,
    // shrinking
    numSuccessShrinks: 0,
    numTryShrinks: 0,
    numTotTryShrinks: 0
});

export const MkState = fields => new StateRecord(fields);
