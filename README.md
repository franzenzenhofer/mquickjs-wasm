# MicroQuickJS WASM

![Version](https://img.shields.io/badge/version-v15-green) ![Built by](https://img.shields.io/badge/built%20by-Claude%20Code-purple) ![WASM](https://img.shields.io/badge/WASM-168KB-blue)

**A WebAssembly port of MicroQuickJS - Run a minimal JavaScript engine in your browser with Canvas API support.**

---

## 100% Built by Claude Code

This entire WASM port, IDE, Canvas API bridge, benchmark page, and deployment was created by [Claude Code](https://claude.ai/code) with **zero human code review or modification**.

---

## Live Demo

| Page | Description |
|------|-------------|
| **[IDE](https://mquickjs-claude-code.franzai.com)** | Full JavaScript IDE with Canvas API |
| **[Benchmark](https://mquickjs-claude-code.franzai.com/benchmark.html)** | WASM vs Browser JS performance comparison |

**Current Version:** v15 (2025-12-24)

### Features
- **CodeMirror Editor** with syntax highlighting
- **Canvas API** for graphics and games
- **Console output** with timestamps
- **Benchmark suite** - Compare WASM vs native JS
- **Mobile responsive** design

---

## Quickstart - Use in Your Website

Add MQuickJS-WASM to your website in 2 minutes! Just copy this complete example:

### 1. Copy-Paste This HTML File

Save as `mquickjs-demo.html` and open in browser:

```html
<!DOCTYPE html>
<html>
<head>
    <title>MQuickJS-WASM Demo</title>
    <style>
        body { font-family: sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
        textarea { width: 100%; height: 150px; font-family: monospace; font-size: 14px; }
        button { padding: 10px 20px; font-size: 16px; cursor: pointer; margin: 10px 0; }
        #output { background: #1e1e1e; color: #0f0; padding: 15px; font-family: monospace;
                  min-height: 100px; white-space: pre-wrap; border-radius: 4px; }
        .status { color: #888; font-size: 12px; }
    </style>
</head>
<body>
    <h1>MQuickJS-WASM Demo</h1>
    <p class="status" id="status">Loading WASM engine...</p>

    <textarea id="code">// Try some JavaScript!
var sum = 0;
for (var i = 1; i <= 100; i++) {
    sum += i;
}
console.log("Sum of 1-100:", sum);

// Fibonacci
function fib(n) {
    if (n <= 1) return n;
    return fib(n-1) + fib(n-2);
}
console.log("Fibonacci(20):", fib(20));

"Done!";</textarea>

    <br>
    <button id="run" disabled>Run Code</button>
    <button id="reset">Reset Engine</button>

    <h3>Output:</h3>
    <div id="output"></div>

    <!-- Load MQuickJS-WASM from CDN -->
    <script src="https://mquickjs-claude-code.franzai.com/mquickjs.js"></script>
    <script>
        var engine = null;
        var runCode = null;
        var resetEngine = null;
        var output = document.getElementById('output');

        // Capture console.log from WASM
        var logs = [];

        MQuickJS().then(function(Module) {
            engine = Module;

            // Setup API functions
            var init = Module.cwrap('mquickjs_init', 'number', []);
            runCode = Module.cwrap('mquickjs_run', 'string', ['string']);
            resetEngine = Module.cwrap('mquickjs_reset', 'number', []);

            // Initialize
            init();

            // Ready!
            document.getElementById('status').textContent = 'WASM engine ready! (168KB loaded)';
            document.getElementById('run').disabled = false;
        });

        document.getElementById('run').onclick = function() {
            var code = document.getElementById('code').value;
            logs = [];

            // Wrap code to capture console.log
            var wrappedCode = 'var __logs = [];' +
                'var console = { log: function() { ' +
                '  var args = []; for(var i=0; i<arguments.length; i++) args.push(String(arguments[i]));' +
                '  __logs.push(args.join(" ")); } };' +
                code + ';__logs.join("\\n") + "\\n---\\nResult: " + (' + code.split(';').pop() + ')';

            try {
                var result = runCode(code);
                output.textContent = result || '(no output)';
            } catch(e) {
                output.textContent = 'Error: ' + e.message;
            }
        };

        document.getElementById('reset').onclick = function() {
            if (resetEngine) {
                resetEngine();
                output.textContent = 'Engine reset.';
            }
        };
    </script>
</body>
</html>
```

### 2. Or Use the CDN Directly

```html
<!-- Add to your HTML -->
<script src="https://mquickjs-claude-code.franzai.com/mquickjs.js"></script>

<script>
MQuickJS().then(function(Module) {
    // Initialize
    var init = Module.cwrap('mquickjs_init', 'number', []);
    var run = Module.cwrap('mquickjs_run', 'string', ['string']);
    init();

    // Run JavaScript in the WASM sandbox!
    var result = run('1 + 2 + 3');
    console.log('Result:', result);  // "6"

    // Run more complex code
    var fib = run('function fib(n){return n<=1?n:fib(n-1)+fib(n-2)} fib(20)');
    console.log('Fibonacci(20):', fib);  // "6765"
});
</script>
```

### 3. CDN Files

| File | URL | Size |
|------|-----|------|
| **JS Loader** | `https://mquickjs-claude-code.franzai.com/mquickjs.js` | ~15KB |
| **WASM Binary** | `https://mquickjs-claude-code.franzai.com/mquickjs.wasm` | 168KB |

The JS loader automatically fetches the WASM binary from the same directory.

### 4. Self-Hosting

Download both files to your server:

```bash
curl -O https://mquickjs-claude-code.franzai.com/mquickjs.js
curl -O https://mquickjs-claude-code.franzai.com/mquickjs.wasm
```

Then use `<script src="mquickjs.js"></script>` with your local path.

---

## About This Fork

This is a fork of [bellard/mquickjs](https://github.com/bellard/mquickjs) that adds WebAssembly compilation support.

### What's New in This Fork

- `wasm_wrapper.c` - Browser-friendly C wrapper for WASM
- `Makefile.wasm` - Emscripten build configuration
- `dist/index.html` - Full IDE with CodeMirror editor
- **Canvas API Bridge** - Draw graphics from JS running in WASM
- **Animation support** - requestAnimationFrame bridge
- **Keyboard input** - Play games like Snake!
- Cloudflare Pages deployment

### Stats

| Metric | Value |
|--------|-------|
| WASM Size | 168 KB |
| JS Engine Memory | 1 MB |
| Original ROM Size | ~100 KB |
| Min RAM Required | ~10 KB |

---

## Building

### Prerequisites

- GCC (for host tools)
- [Emscripten](https://emscripten.org/) (for WASM compilation)

### Build Commands

```bash
# Install Emscripten (macOS)
brew install emscripten

# Build WASM module
make -f Makefile.wasm

# Output files in dist/
ls dist/
# mquickjs.js mquickjs.wasm index.html
```

---

## Usage

### In Browser

```html
<script src="mquickjs.js"></script>
<script>
MQuickJS().then(function(Module) {
    // Initialize engine
    var init = Module.cwrap('mquickjs_init', 'number', []);
    init();

    // Run JavaScript code
    var run = Module.cwrap('mquickjs_run', 'string', ['string']);
    var result = run('1 + 2 + 3');
    console.log(result); // "6"

    // Reset engine
    var reset = Module.cwrap('mquickjs_reset', 'number', []);
    reset();
});
</script>
```

### API Functions

| Function | Description |
|----------|-------------|
| `mquickjs_init()` | Initialize the JavaScript engine |
| `mquickjs_run(code)` | Execute JavaScript code, returns result as string |
| `mquickjs_reset()` | Reset the engine to a fresh state |
| `mquickjs_version()` | Get version information |
| `mquickjs_memory_size()` | Get allocated memory size in bytes |
| `mquickjs_cleanup()` | Free all resources |

---

## Project Structure

```
mquickjs-wasm/
├── mquickjs.c          # Original MicroQuickJS engine
├── mquickjs.h          # Public API header
├── wasm_wrapper.c      # WASM-specific wrapper (by Claude Code)
├── Makefile            # Original native build
├── Makefile.wasm       # WASM build (by Claude Code)
└── dist/
    ├── index.html      # Interactive demo (by Claude Code)
    ├── mquickjs.js     # Generated JS loader
    └── mquickjs.wasm   # Compiled WASM module
```

---

## Original MicroQuickJS Documentation

MicroQuickJS (aka. MQuickJS) is a JavaScript engine targetted at
embedded systems. It compiles and runs JavaScript programs using as little
as 10 kB of RAM. The whole engine requires about 100 kB of ROM (ARM
Thumb-2 code) including the C library. The speed is comparable to
QuickJS.

MQuickJS only supports a subset of JavaScript close to ES5. It
implements a **stricter mode** where some error prone or inefficient
JavaScript constructs are forbidden.

### JavaScript Subset

- Only **strict mode** constructs are allowed
- Arrays cannot have holes
- Only global `eval` is supported
- No value boxing (e.g. `new Number(1)`)
- Regexp case folding only works with ASCII
- String `toLowerCase`/`toUpperCase` only handle ASCII
- Date: only `Date.now()` is supported

### ES5+ Extensions

- `for of` loops (arrays only)
- Typed arrays
- `\u{hex}` in string literals
- Math functions: `imul`, `clz32`, `fround`, `trunc`, `log2`, `log10`
- Exponentiation operator
- String functions: `codePointAt`, `replaceAll`, `trimStart`, `trimEnd`
- `globalThis` global property

---

## Credits

### Original MicroQuickJS

- **Authors**: Fabrice Bellard, Charlie Gordon
- **Copyright**: (c) 2017-2025
- **License**: MIT
- **Repository**: [github.com/bellard/mquickjs](https://github.com/bellard/mquickjs)
- **Website**: [bellard.org/mquickjs](https://bellard.org/mquickjs/)

### WASM Port

- **Created by**: [Claude Code](https://claude.ai/code)
- **Date**: December 24, 2024
- **Human involvement**: Zero code review or modification
- **Repository**: [github.com/franzenzenhofer/mquickjs-wasm](https://github.com/franzenzenhofer/mquickjs-wasm)

---

## License

MIT License - See [LICENSE](LICENSE) file.

---

*This project demonstrates AI-assisted software development. The WASM compilation, browser wrapper, interactive demo, and Cloudflare deployment were all generated autonomously by Claude Code.*
