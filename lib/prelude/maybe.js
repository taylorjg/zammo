class Maybe {

    map(f) {
        return this.patternMatch(() => Nothing, a => Just(f(a)));
    }

    flatMap(k) {
        return this.patternMatch(() => Nothing, a => k(a));
    }

    patternMatch(fnNothing, fnJust) {
        return this instanceof InternalJust ? fnJust(this.value) : fnNothing();
    }
}

class InternalNothing extends Maybe {
}

class InternalJust extends Maybe {
    constructor(value) {
        super();
        this.value = value;
    }
}

export const Nothing = new InternalNothing();

export const Just = a => new InternalJust(a);

// fromMaybe :: a -> Maybe a -> a
export const fromMaybe = (d, x) => x.patternMatch(() => d, v => v);

// isJust :: Maybe a -> Bool
export const isJust = m => m.patternMatch(() => false, () => true);

// fromJust :: Maybe a -> a
export const fromJust = m => m.patternMatch(
    () => {
        throw new Error('Maybe.fromJust: Nothing');
    },
    x => x);
