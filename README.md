# MicroQuickJS WASM

**A WebAssembly port of MicroQuickJS - Run a minimal JavaScript engine in your browser.**

---

## 100% Built by Claude Code

This entire WASM port, demo page, and deployment was created by [Claude Code](https://claude.ai/code) with **zero human code review or modification**.

---

## Live Demo

**[mquickjs-claude-code.franzai.com](https://mquickjs-claude-code.franzai.com)**

Try the interactive JavaScript playground powered by MicroQuickJS running in WebAssembly!

---

## About This Fork

This is a fork of [bellard/mquickjs](https://github.com/bellard/mquickjs) that adds WebAssembly compilation support.

### What's New in This Fork

- `wasm_wrapper.c` - Browser-friendly C wrapper for WASM
- `Makefile.wasm` - Emscripten build configuration
- `dist/index.html` - Interactive demo page
- Cloudflare Pages deployment

### Stats

| Metric | Value |
|--------|-------|
| WASM Size | 118 KB |
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
