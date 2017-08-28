export const it_multiple = (description, fn, testCases) => {

    const numTests = testCases.length;
    const formattedTestCount = " (" + numTests + " " + ((numTests === 1) ? "test" : "tests") + ")";

    const isArray = Array.isArray || function (obj) {
        return Object.prototype.toString.call(obj) === "[object Array]";
    };

    const invokeNormalItForTestCase = function (testCase) {
        const formattedTestCase = "(" + JSON.stringify(testCase) + ")";
        it(description + formattedTestCase, () =>
            isArray(testCase)
                ? fn.apply(this, testCase)
                : fn.call(this, testCase)
        );
    };

    describe(description + formattedTestCount, () =>
        testCases.forEach(invokeNormalItForTestCase)
    );
};
