// number :: Int -> String -> String
export const number = (n, s) => `${n} ${s}${n === 1 ? '' : 's'}`;

// bold :: String -> String
// -- not portable:
// --bold s = "\ESC[1m" ++ s ++ "\ESC[0m"
export const bold = s => s;

class Terminal {

    constructor(res, tmp, out, err) {
        this.res = res;
        this.tmp = tmp;
        this.out = out;
        this.err = err;
    }

    flush() {
        const n = this.tmp;
        this.tmp = 0;
        this.err(`${' '.repeat(n)}${'\b'.repeat(n)}`);
    }

    putTemp(s) {
        this.flush();
        this.err(`${s}${'\b'.repeat(s.length)}`);
        this.tmp += s.length;
    }

    putPart(s) {
        this.flush();
        this.out(s);
        this.res += s;
    }

    putLine(s) {
        this.putPart(s + '\n');
    }
}

const MkTerminal = (out, err) => new Terminal('', 0, out, err);

// withStdioTerminal :: (Terminal -> IO a) -> IO a
export const withStdioTerminal = action => {
    const tm = MkTerminal(s => process.stdout.write(s), s => process.stderr.write(s));
    return action(tm);
};

// withNullTerminal :: (Terminal -> IO a) -> IO a
export const withNullTerminal = action => {
    const tm = MkTerminal((/* s */) => {}, (/* s */) => {});
    return action(tm);
};

// terminalOutput :: Terminal -> IO String
export const terminalOutput = tm => tm.res;

// flush :: Terminal -> IO ()
export const flush = tm => tm.flush();

// putPart :: Terminal -> String -> IO ()
export const putPart = (tm, s) => tm.putPart(s);

// putLine :: Terminal -> String -> IO ()
export const putLine = (tm, s) => tm.putLine(s);

// putTemp :: Terminal -> String -> IO ()
export const putTemp = (tm, s) => tm.putTemp(s);
