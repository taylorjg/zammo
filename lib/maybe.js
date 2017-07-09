class Maybe {

    map(f) {
        return this.patternMatch(() => this, a => new Just(f(a)));
    }

    flatMap(k) {
        return this.patternMatch(() => this, a => k(a));
    }

    patternMatch(fnNothing, fnJust) {
        return this instanceof Just ? fnJust(this.value) : fnNothing();
    }
}

export class Nothing extends Maybe {
}

export class Just extends Maybe {
    constructor(value) {
        super();
        this.value = value;
    }
}

// fromMaybe :: a -> Maybe a -> a
export const fromMaybe = (d, x) => x.patternMatch(() => d, v => v);
