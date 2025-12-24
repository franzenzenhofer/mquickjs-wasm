# CLAUDE.md - MicroQuickJS WASM Project

Project-specific instructions for Claude Code.

## Project Overview

This is a WebAssembly port of MicroQuickJS - a minimal JavaScript engine by Fabrice Bellard.
The WASM port was created 100% by Claude Code with zero human code review.

## Build Commands

```bash
# Build WASM module (requires Emscripten)
make -f Makefile.wasm

# Clean build artifacts
make -f Makefile.wasm clean

# Deploy to Cloudflare Pages
wrangler pages deploy ./dist --project-name=mquickjs-claude-code
```

## Project Structure

```
mquickjs-wasm/
├── mquickjs.c          # Original MicroQuickJS engine (Bellard)
├── mquickjs.h          # Public API header
├── wasm_wrapper.c      # WASM-specific wrapper (Claude Code)
├── Makefile.wasm       # WASM build configuration (Claude Code)
└── dist/
    ├── index.html      # Interactive IDE demo (Claude Code)
    ├── mquickjs.js     # Generated JS loader
    └── mquickjs.wasm   # Compiled WASM module (168KB)
```

## Key Architecture

- **Engine**: MicroQuickJS runs in WASM, isolated from browser DOM
- **Canvas API Bridge**: JavaScript code calls `canvas.*` methods which get queued as commands, then executed on real canvas after WASM returns
- **Animation**: `requestAnimationFrame` is mocked in WASM, browser orchestrates the actual frame loop
- **Input**: Key events captured in browser, forwarded to WASM via `onKeyDown` callback

## API Functions (wasm_wrapper.c)

| Function | Description |
|----------|-------------|
| `mquickjs_init()` | Initialize the JavaScript engine |
| `mquickjs_run(code)` | Execute JavaScript code, returns result as string |
| `mquickjs_reset()` | Reset the engine to a fresh state |
| `mquickjs_version()` | Get version information |
| `mquickjs_memory_size()` | Get allocated memory size in bytes |
| `mquickjs_cleanup()` | Free all resources |

## Important Notes

- Uses 32-bit target for WASM (mquickjs_atom.h and mqjs_stdlib.h must both use `-m32` flag)
- Engine has 1MB memory pool
- Supports ES5 JavaScript with some modern extensions
- NO direct DOM access from within MicroQuickJS - all browser interactions go through bridges

## Deployment

Live site: https://mquickjs-claude-code.franzai.com
GitHub: https://github.com/franzenzenhofer/mquickjs-wasm

## Testing

After changes, always test:
1. Basic calculations (Sum 1-100)
2. Functions and closures
3. Canvas API (shapes, animation)
4. Snake game (keyboard input)
5. Mobile responsiveness
