export class State {
    constructor(
        maxSuccessTests,
        maxDiscardedTests,
        computeSize,
        // numTotMaxShrinks,
        numSuccessTests,
        numDiscardedTests,
        numRecentlyDiscardedTests,
        // labels,
        // collected,
        // expectedFailure,
        randomSeed //,
        // numSuccessShrinks,
        // numTryShrinks,
        // numTotTryShrinks
    ) {
        // static

        this.maxSuccessTests = maxSuccessTests;
        this.maxDiscardedTests = maxDiscardedTests;
        this.computeSize = computeSize;
        // this.numTotMaxShrinks = numTotMaxShrinks;

        // dynamic

        this.numSuccessTests = numSuccessTests;
        this.numDiscardedTests = numDiscardedTests;
        this.numRecentlyDiscardedTests = numRecentlyDiscardedTests;
        // this.labels = labels;
        // this.collected = collected;
        // this.expectedFailure = expectedFailure;
        this.randomSeed = randomSeed;

        // shrinking

        // this.numSuccessShrinks = numSuccessShrinks;
        // this.numTryShrinks = numTryShrinks;
        // this.numTotTryShrinks = numTotTryShrinks;
    }
}
