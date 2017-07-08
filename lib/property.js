export class Rose {
    constructor(x, rs) {
        this.x = x;
        this.rs = rs;
    }
}

const OK_SUCCEEDED = Symbol('Just True');
const OK_FAILURE = Symbol('Just False');
const OK_REJECTED = Symbol('Nothing');

export class Result {
    constructor(ok, reason, abort, maybeNumTests) {
        this.ok = ok;
        this.reason = reason;
        this.abort = abort;
        this.maybeNumTests = maybeNumTests;
    }
}

export const succeeded = new Result(OK_SUCCEEDED, '', true);
export const failed = new Result(OK_FAILURE, '', true);
export const rejected = new Result(OK_REJECTED, '', true);

export class Prop {
    constructor(unProp) {
        this.unProp = unProp;
    }
}

export class Property {
    constructor(unProperty) {
        this.unProperty = unProperty;
    }
}
