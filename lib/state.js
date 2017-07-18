import Immutable from 'immutable';

const State = Immutable.Record({
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
    labels: Immutable.Map(), // Map String Int
    collected: [], // [Set String]
    expectedFailure: false,
    randomSeed: null, // QCGen
    // shrinking
    numSuccessShrinks: 0,
    numTryShrinks: 0,
    numTotTryShrinks: 0
});

export const MkState = fields => new State(fields);
