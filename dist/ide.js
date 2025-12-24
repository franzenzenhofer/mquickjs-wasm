/**
 * MicroQuickJS WASM IDE - Main Application
 *
 * This module provides the IDE interface for running JavaScript code
 * in the MicroQuickJS WASM engine with Canvas API support.
 *
 * Created 100% by Claude Code - December 2024
 * https://github.com/franzenzenhofer/mquickjs-wasm
 */

const MQuickJSIDE = (function() {
    'use strict';

    // Build version for cache busting
    const BUILD_VERSION = '20251224_v19';

    // Example code snippets
    const examples = {
        welcome: `// Welcome to MicroQuickJS WASM IDE!
// A minimal JavaScript engine running in WebAssembly
// with Canvas API support!

console.log("=== MicroQuickJS WASM ===");
console.log("Engine: 168KB WASM binary");
console.log("Memory: 1MB allocated");
console.log("");

// Basic calculation
var sum = 0;
for (var i = 1; i <= 100; i++) {
    sum += i;
}
console.log("Sum 1-100:", sum);

// Canvas is available!
console.log("");
console.log("Try the Canvas examples!");

"Ready to code!";`,

        fibonacci: `// Fibonacci Sequence
function fib(n) {
    if (n <= 1) return n;
    var a = 0, b = 1;
    for (var i = 2; i <= n; i++) {
        var t = a + b;
        a = b;
        b = t;
    }
    return b;
}

console.log("=== Fibonacci Sequence ===");
for (var i = 0; i <= 20; i++) {
    console.log("fib(" + i + ") = " + fib(i));
}

"Done!";`,

        primes: `// Prime Numbers - Sieve of Eratosthenes
function sieve(max) {
    var p = [];
    for (var i = 0; i <= max; i++) p[i] = true;
    p[0] = p[1] = false;

    for (var i = 2; i * i <= max; i++) {
        if (p[i]) {
            for (var j = i * i; j <= max; j += i) {
                p[j] = false;
            }
        }
    }

    var primes = [];
    for (var i = 2; i <= max; i++) {
        if (p[i]) primes.push(i);
    }
    return primes;
}

var primes = sieve(100);
console.log("=== Primes up to 100 ===");
console.log("Found " + primes.length + " primes:");
console.log(primes.join(", "));

"Found " + primes.length + " primes";`,

        'canvas-shapes': `// Canvas API - Shapes & Colors
// The canvas is 300x200 pixels

// Clear canvas
canvas.fillStyle = "#1a1a2e";
canvas.fillRect(0, 0, 300, 200);

// Draw colorful rectangles
var colors = ["#e94560", "#0f3460", "#16213e", "#533483", "#e94560"];
for (var i = 0; i < 5; i++) {
    canvas.fillStyle = colors[i];
    canvas.fillRect(20 + i * 55, 20, 50, 50);
}

// Draw circles
canvas.fillStyle = "#00fff5";
for (var i = 0; i < 4; i++) {
    canvas.beginPath();
    canvas.arc(50 + i * 70, 120, 25, 0, Math.PI * 2);
    canvas.fill();
}

// Draw text
canvas.fillStyle = "#ffffff";
canvas.font = "16px sans-serif";
canvas.fillText("MicroQuickJS Canvas!", 70, 180);

console.log("Drew shapes on canvas!");
"Canvas shapes drawn!";`,

        'canvas-animation': `// Canvas Animation - Bouncing Ball
// Watch the rainbow ball bounce!

__anim.x = 150;
__anim.y = 100;
__anim.dx = 4;
__anim.dy = 3;
__anim.hue = 0;
__anim.frame = 0;

__anim.update = function() {
    // Clear with fade effect
    canvas.fillStyle = "rgba(13, 17, 23, 0.15)";
    canvas.fillRect(0, 0, 300, 200);

    // Update position
    __anim.x += __anim.dx;
    __anim.y += __anim.dy;

    // Bounce off walls
    if (__anim.x > 285 || __anim.x < 15) __anim.dx = -__anim.dx;
    if (__anim.y > 185 || __anim.y < 15) __anim.dy = -__anim.dy;

    // Rainbow color
    __anim.hue = (__anim.hue + 4) % 360;
    canvas.fillStyle = "hsl(" + __anim.hue + ", 100%, 60%)";

    // Draw ball
    canvas.beginPath();
    canvas.arc(__anim.x, __anim.y, 15, 0, Math.PI * 2);
    canvas.fill();

    __anim.frame++;
    if (__anim.frame < 300) {
        requestAnimationFrame(__anim.update);
    } else {
        console.log("Animation done! 300 frames");
    }
};

console.log("Starting bouncing ball...");
__anim.update();
"Animation running!";`,

        'canvas-game': `// Snake Game - Use Arrow Keys or WASD!

__game.GRID = 15;
__game.COLS = 20;
__game.ROWS = 13;
__game.snake = [{x: 10, y: 6}];
__game.dir = {x: 1, y: 0};
__game.food = {x: 15, y: 6};
__game.score = 0;
__game.over = false;

__game.draw = function() {
    // Background
    canvas.fillStyle = "#0d1117";
    canvas.fillRect(0, 0, 300, 200);

    // Grid lines
    canvas.strokeStyle = "#21262d";
    canvas.lineWidth = 1;
    for (var i = 0; i <= __game.COLS; i++) {
        canvas.beginPath();
        canvas.moveTo(i * __game.GRID, 0);
        canvas.lineTo(i * __game.GRID, __game.ROWS * __game.GRID);
        canvas.stroke();
    }
    for (var i = 0; i <= __game.ROWS; i++) {
        canvas.beginPath();
        canvas.moveTo(0, i * __game.GRID);
        canvas.lineTo(__game.COLS * __game.GRID, i * __game.GRID);
        canvas.stroke();
    }

    // Food (red)
    canvas.fillStyle = "#f85149";
    canvas.fillRect(
        __game.food.x * __game.GRID + 2,
        __game.food.y * __game.GRID + 2,
        __game.GRID - 4, __game.GRID - 4
    );

    // Snake
    for (var i = 0; i < __game.snake.length; i++) {
        canvas.fillStyle = (i === 0) ? "#3fb950" : "#238636";
        canvas.fillRect(
            __game.snake[i].x * __game.GRID + 1,
            __game.snake[i].y * __game.GRID + 1,
            __game.GRID - 2, __game.GRID - 2
        );
    }

    // Score
    canvas.fillStyle = "#fff";
    canvas.font = "12px monospace";
    canvas.fillText("Score: " + __game.score, 5, __game.ROWS * __game.GRID + 12);
};

__game.update = function() {
    if (__game.over) return;

    var head = {
        x: __game.snake[0].x + __game.dir.x,
        y: __game.snake[0].y + __game.dir.y
    };

    // Wrap around edges
    if (head.x < 0) head.x = __game.COLS - 1;
    if (head.x >= __game.COLS) head.x = 0;
    if (head.y < 0) head.y = __game.ROWS - 1;
    if (head.y >= __game.ROWS) head.y = 0;

    // Check self-collision
    for (var i = 0; i < __game.snake.length; i++) {
        if (__game.snake[i].x === head.x && __game.snake[i].y === head.y) {
            __game.over = true;
            console.log("Game Over! Final score: " + __game.score);
            return;
        }
    }

    __game.snake.unshift(head);

    // Check food
    if (head.x === __game.food.x && head.y === __game.food.y) {
        __game.score += 10;
        __game.food.x = Math.floor(Math.random() * __game.COLS);
        __game.food.y = Math.floor(Math.random() * __game.ROWS);
    } else {
        __game.snake.pop();
    }
};

__game.loop = function() {
    __game.update();
    __game.draw();
    if (!__game.over) {
        setTimeout(__game.loop, 120);
    }
};

// Keyboard handler
onKeyDown = function(key) {
    if ((key === "ArrowUp" || key === "w") && __game.dir.y !== 1) {
        __game.dir = {x: 0, y: -1};
    }
    if ((key === "ArrowDown" || key === "s") && __game.dir.y !== -1) {
        __game.dir = {x: 0, y: 1};
    }
    if ((key === "ArrowLeft" || key === "a") && __game.dir.x !== 1) {
        __game.dir = {x: -1, y: 0};
    }
    if ((key === "ArrowRight" || key === "d") && __game.dir.x !== -1) {
        __game.dir = {x: 1, y: 0};
    }
};

console.log("=== SNAKE GAME ===");
console.log("Arrow Keys or WASD to move!");
__game.loop();
"Game started!";`,

        'canvas-drawing': `// Generative Art - Spiral Pattern
canvas.fillStyle = "#0d1117";
canvas.fillRect(0, 0, 300, 200);

var cx = 150;
var cy = 100;

for (var i = 0; i < 500; i++) {
    var angle = i * 0.1;
    var radius = i * 0.15;
    var x = cx + Math.cos(angle) * radius;
    var y = cy + Math.sin(angle) * radius;

    var hue = (i * 0.7) % 360;
    canvas.fillStyle = "hsl(" + hue + ", 80%, 60%)";

    var size = 2 + Math.sin(i * 0.05) * 2;
    canvas.beginPath();
    canvas.arc(x, y, size, 0, Math.PI * 2);
    canvas.fill();
}

canvas.fillStyle = "#fff";
canvas.font = "bold 14px sans-serif";
canvas.fillText("Generative Spiral", 95, 190);

console.log("Generated spiral art!");
"Art complete!";`,

        mandelbrot: `// ASCII Mandelbrot Set
var chars = " .:-=+*#%@";

console.log("=== Mandelbrot Set ===");
console.log("");

for (var py = -1.1; py <= 1.1; py += 0.1) {
    var line = "";
    for (var px = -2.0; px <= 0.5; px += 0.045) {
        var x = 0, y = 0;
        var i = 0;
        while (i < 50 && x*x + y*y < 4) {
            var t = x*x - y*y + px;
            y = 2*x*y + py;
            x = t;
            i++;
        }
        var idx = Math.floor(i / 5);
        if (idx >= chars.length) idx = chars.length - 1;
        line += chars[idx];
    }
    console.log(line);
}

"Mandelbrot rendered!";`,

        benchmark: `// Performance Benchmark
console.log("=== MicroQuickJS Benchmark ===");
console.log("");

// Loop test
var t0 = Date.now();
var sum = 0;
for (var i = 0; i < 1000000; i++) sum += i;
var t1 = Date.now();
console.log("1M loop iterations: " + (t1 - t0) + "ms");

// Function calls
t0 = Date.now();
function add(a, b) { return a + b; }
var r = 0;
for (var i = 0; i < 100000; i++) r = add(r, 1);
t1 = Date.now();
console.log("100K function calls: " + (t1 - t0) + "ms");

// Array operations
t0 = Date.now();
var arr = [];
for (var i = 0; i < 10000; i++) arr.push(i);
for (var i = 0; i < arr.length; i++) arr[i] *= 2;
t1 = Date.now();
console.log("10K array ops: " + (t1 - t0) + "ms");

// Object creation
t0 = Date.now();
for (var i = 0; i < 10000; i++) {
    var obj = {x: i, y: i * 2, z: i * 3};
}
t1 = Date.now();
console.log("10K object creations: " + (t1 - t0) + "ms");

console.log("");
console.log("Benchmark complete!");

"Done!";`
    };

    // State
    let editor = null;
    let runCode = null;
    let resetEngine = null;
    let runCount = 0;
    let animationId = null;
    let keyHandler = null;

    // DOM elements (initialized in init)
    let dom = {};

    /**
     * Initialize CodeMirror editor
     */
    function initEditor() {
        editor = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
            mode: 'javascript',
            theme: 'dracula',
            lineNumbers: true,
            matchBrackets: true,
            autoCloseBrackets: true,
            indentUnit: 4,
            tabSize: 4,
            lineWrapping: true,
            extraKeys: {
                'Ctrl-Enter': executeCode,
                'Cmd-Enter': executeCode
            }
        });
        editor.setValue(examples.welcome);
    }

    /**
     * Clear console output using safe DOM methods
     */
    function clearConsole() {
        while (dom.consoleOutput.firstChild) {
            dom.consoleOutput.removeChild(dom.consoleOutput.firstChild);
        }
    }

    /**
     * Log message to console using safe DOM methods (no innerHTML)
     */
    function log(text, type) {
        type = type || 'log';

        const line = document.createElement('div');
        line.className = 'console-line ' + type;

        const timestamp = document.createElement('span');
        timestamp.className = 'timestamp';
        const time = new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        timestamp.textContent = time;

        const prefix = document.createElement('span');
        prefix.className = 'prefix';

        const content = document.createElement('span');
        content.className = 'content';
        content.textContent = String(text);

        line.appendChild(timestamp);
        line.appendChild(prefix);
        line.appendChild(content);

        dom.consoleOutput.appendChild(line);
        dom.consoleOutput.scrollTop = dom.consoleOutput.scrollHeight;
    }

    /**
     * Clear canvas to black
     */
    function clearCanvas() {
        dom.ctx.fillStyle = '#000';
        dom.ctx.fillRect(0, 0, 300, 200);
    }

    /**
     * Wait for WASM module to load
     */
    function waitForWasm() {
        return new Promise(function(resolve, reject) {
            let attempts = 0;
            function check() {
                if (typeof MQuickJS !== 'undefined') {
                    resolve();
                } else if (attempts++ > 100) {
                    reject(new Error('WASM load timeout'));
                } else {
                    setTimeout(check, 100);
                }
            }
            check();
        });
    }

    /**
     * Initialize globals in WASM engine for animation/game state
     */
    function initWasmGlobals() {
        // Initialize persistent globals using globalThis (required for strict mode)
        runCode(`
            globalThis.__anim = globalThis.__anim || {};
            globalThis.__game = globalThis.__game || {};
            globalThis.__timeouts = globalThis.__timeouts || [];
            globalThis.__animCallback = globalThis.__animCallback || null;
            globalThis.onKeyDown = globalThis.onKeyDown || null;
            globalThis.__logs = globalThis.__logs || [];
            globalThis.__canvasCommands = globalThis.__canvasCommands || [];
        `);
    }

    /**
     * Initialize the WASM engine
     */
    async function initEngine() {
        try {
            await waitForWasm();
            const Module = await MQuickJS();

            runCode = Module.cwrap('mquickjs_run', 'string', ['string']);
            resetEngine = Module.cwrap('mquickjs_reset', 'number', []);
            const initFn = Module.cwrap('mquickjs_init', 'number', []);

            if (initFn() !== 0) {
                throw new Error('Engine initialization failed');
            }

            // Initialize persistent globals
            initWasmGlobals();

            dom.engineStatus.textContent = 'Ready';
            dom.engineStatus.className = 'status ready';

            dom.runBtn.disabled = false;
            dom.resetBtn.disabled = false;

            clearConsole();
            clearCanvas();
            log('MicroQuickJS WASM IDE ready!', 'info');
            log('168KB engine with Canvas API', 'info');

            dom.loadingOverlay.classList.add('hidden');
        } catch (err) {
            dom.engineStatus.textContent = 'Error';
            dom.engineStatus.className = 'status error';
            log('Failed to load: ' + err.message, 'error');
            dom.loadingOverlay.classList.add('hidden');
        }
    }

    /**
     * Execute canvas commands on the real canvas context
     */
    function executeCanvasCommands(commands) {
        const ctx = dom.ctx;
        commands.forEach(function(c) {
            if (c.style) {
                ctx.fillStyle = c.style;
                ctx.strokeStyle = c.style;
            }
            if (c.font) ctx.font = c.font;
            if (c.lw) ctx.lineWidth = c.lw;

            switch (c.cmd) {
                case 'fillRect':
                    ctx.fillRect(c.args[0], c.args[1], c.args[2], c.args[3]);
                    break;
                case 'strokeRect':
                    ctx.strokeRect(c.args[0], c.args[1], c.args[2], c.args[3]);
                    break;
                case 'clearRect':
                    ctx.clearRect(c.args[0], c.args[1], c.args[2], c.args[3]);
                    break;
                case 'fillText':
                    ctx.fillText(c.args[0], c.args[1], c.args[2]);
                    break;
                case 'strokeText':
                    ctx.strokeText(c.args[0], c.args[1], c.args[2]);
                    break;
                case 'beginPath':
                    ctx.beginPath();
                    break;
                case 'closePath':
                    ctx.closePath();
                    break;
                case 'moveTo':
                    ctx.moveTo(c.args[0], c.args[1]);
                    break;
                case 'lineTo':
                    ctx.lineTo(c.args[0], c.args[1]);
                    break;
                case 'arc':
                    ctx.arc(c.args[0], c.args[1], c.args[2], c.args[3], c.args[4]);
                    break;
                case 'rect':
                    ctx.rect(c.args[0], c.args[1], c.args[2], c.args[3]);
                    break;
                case 'fill':
                    ctx.fill();
                    break;
                case 'stroke':
                    ctx.stroke();
                    break;
            }
        });
    }

    /**
     * Generate wrapper code that uses persistent globals
     */
    function generateWrappedCode(userCode) {
        return `(function() {
    // Use GLOBAL arrays so callbacks can access them across frames
    globalThis.__logs = [];
    globalThis.__canvasCommands = [];

    // Console mock - pushes to GLOBAL array
    var console = {
        log: function() {
            var args = [];
            for (var i = 0; i < arguments.length; i++) args.push(String(arguments[i]));
            globalThis.__logs.push(args.join(" "));
        },
        warn: function() {
            var args = [];
            for (var i = 0; i < arguments.length; i++) args.push(String(arguments[i]));
            globalThis.__logs.push("WARN: " + args.join(" "));
        },
        error: function() {
            var args = [];
            for (var i = 0; i < arguments.length; i++) args.push(String(arguments[i]));
            globalThis.__logs.push("ERROR: " + args.join(" "));
        }
    };

    // Canvas API mock - pushes to GLOBAL array so callbacks work across frames
    var canvas = {
        fillStyle: "#000",
        strokeStyle: "#fff",
        font: "12px sans-serif",
        lineWidth: 1,
        fillRect: function(x, y, w, h) {
            globalThis.__canvasCommands.push({cmd: "fillRect", args: [x, y, w, h], style: this.fillStyle});
        },
        strokeRect: function(x, y, w, h) {
            globalThis.__canvasCommands.push({cmd: "strokeRect", args: [x, y, w, h], style: this.strokeStyle, lw: this.lineWidth});
        },
        clearRect: function(x, y, w, h) {
            globalThis.__canvasCommands.push({cmd: "clearRect", args: [x, y, w, h]});
        },
        fillText: function(text, x, y) {
            globalThis.__canvasCommands.push({cmd: "fillText", args: [text, x, y], style: this.fillStyle, font: this.font});
        },
        strokeText: function(text, x, y) {
            globalThis.__canvasCommands.push({cmd: "strokeText", args: [text, x, y], style: this.strokeStyle, font: this.font});
        },
        beginPath: function() { globalThis.__canvasCommands.push({cmd: "beginPath"}); },
        closePath: function() { globalThis.__canvasCommands.push({cmd: "closePath"}); },
        moveTo: function(x, y) { globalThis.__canvasCommands.push({cmd: "moveTo", args: [x, y]}); },
        lineTo: function(x, y) { globalThis.__canvasCommands.push({cmd: "lineTo", args: [x, y]}); },
        arc: function(x, y, r, s, e) { globalThis.__canvasCommands.push({cmd: "arc", args: [x, y, r, s, e]}); },
        fill: function() { globalThis.__canvasCommands.push({cmd: "fill", style: this.fillStyle}); },
        stroke: function() { globalThis.__canvasCommands.push({cmd: "stroke", style: this.strokeStyle, lw: this.lineWidth}); },
        rect: function(x, y, w, h) { globalThis.__canvasCommands.push({cmd: "rect", args: [x, y, w, h]}); }
    };

    // Animation - uses globalThis for strict mode
    function requestAnimationFrame(cb) {
        globalThis.__animCallback = cb;
        return 1;
    }

    // Timeout - uses globalThis for strict mode
    function setTimeout(cb, delay) {
        globalThis.__timeouts.push({cb: cb, delay: delay || 0, time: Date.now()});
        return globalThis.__timeouts.length;
    }

    try {
        var __result = (function() {
            ${userCode}
        })();

        var result = {
            logs: globalThis.__logs,
            canvas: globalThis.__canvasCommands,
            result: __result === undefined ? null : __result,
            hasAnim: globalThis.__animCallback !== null,
            hasTimeout: globalThis.__timeouts.length > 0,
            hasKeyHandler: typeof globalThis.onKeyDown === 'function'
        };
        // Clear arrays after capturing
        globalThis.__logs = [];
        globalThis.__canvasCommands = [];
        return JSON.stringify(result);
    } catch(e) {
        var errResult = {
            logs: globalThis.__logs,
            canvas: globalThis.__canvasCommands,
            error: String(e)
        };
        globalThis.__logs = [];
        globalThis.__canvasCommands = [];
        return JSON.stringify(errResult);
    }
})();`;
    }

    /**
     * Run one frame of animation/timeout loop
     */
    function runFrame() {
        // Frame code uses GLOBAL arrays - the callbacks already reference them
        const frameCode = `(function() {
    // Clear global arrays for this frame
    globalThis.__logs = [];
    globalThis.__canvasCommands = [];

    var cont = false;

    // Run animation callback if exists
    if (globalThis.__animCallback) {
        var cb = globalThis.__animCallback;
        globalThis.__animCallback = null;
        cb();
        cont = true;
    }

    // Run due timeouts
    var now = Date.now();
    var pending = [];
    for (var i = 0; i < globalThis.__timeouts.length; i++) {
        var t = globalThis.__timeouts[i];
        if (now - t.time >= t.delay) {
            t.cb();
            cont = true;
        } else {
            pending.push(t);
        }
    }
    globalThis.__timeouts = pending;

    cont = cont || globalThis.__animCallback !== null || globalThis.__timeouts.length > 0;

    return JSON.stringify({
        logs: globalThis.__logs,
        canvas: globalThis.__canvasCommands,
        cont: cont
    });
})();`;

        try {
            const r = JSON.parse(runCode(frameCode));
            if (r.logs) {
                r.logs.forEach(function(l) { log(l, 'log'); });
            }
            if (r.canvas && r.canvas.length > 0) {
                executeCanvasCommands(r.canvas);
            }
            if (r.cont) {
                animationId = requestAnimationFrame(runFrame);
            }
        } catch (e) {
            log('Frame error: ' + e.message, 'error');
        }
    }

    /**
     * Setup keyboard handler for games
     */
    function setupKeyHandler() {
        if (keyHandler) return; // Already set up

        keyHandler = function(e) {
            const key = e.key;
            const gameKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'];
            if (gameKeys.indexOf(key) !== -1) {
                e.preventDefault();
                try {
                    runCode('if (typeof globalThis.onKeyDown === "function") globalThis.onKeyDown("' + key + '");');
                } catch (err) {
                    // Ignore
                }
            }
        };
        document.addEventListener('keydown', keyHandler);
    }

    /**
     * Execute code from the editor
     */
    function executeCode() {
        if (!runCode || !editor) return;

        // Stop any running animation
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }

        // Reset animation state
        runCode('globalThis.__animCallback = null; globalThis.__timeouts = [];');

        const userCode = editor.getValue();
        if (!userCode.trim()) {
            log('No code to run', 'warn');
            return;
        }

        runCount++;
        dom.runCountEl.textContent = runCount;
        dom.engineStatus.textContent = 'Running';
        dom.engineStatus.className = 'status running';

        const startTime = performance.now();

        try {
            const wrappedCode = generateWrappedCode(userCode);
            const resultStr = runCode(wrappedCode);
            const endTime = performance.now();
            dom.execTimeEl.textContent = (endTime - startTime).toFixed(1);

            const result = JSON.parse(resultStr);

            // Output logs
            if (result.logs) {
                result.logs.forEach(function(l) {
                    if (l.indexOf('WARN:') === 0) {
                        log(l.substring(6), 'warn');
                    } else if (l.indexOf('ERROR:') === 0) {
                        log(l.substring(7), 'error');
                    } else {
                        log(l, 'log');
                    }
                });
            }

            // Execute canvas commands
            if (result.canvas && result.canvas.length > 0) {
                executeCanvasCommands(result.canvas);
            }

            // Show result or error
            if (result.error) {
                log(result.error, 'error');
            } else if (result.result !== null) {
                log(result.result, 'result');
            }

            // Start animation/timeout loop if needed
            if (result.hasAnim || result.hasTimeout) {
                animationId = requestAnimationFrame(runFrame);
            }

            // Setup key handler if needed
            if (result.hasKeyHandler) {
                setupKeyHandler();
            }

            dom.engineStatus.textContent = 'Ready';
            dom.engineStatus.className = 'status ready';

        } catch (err) {
            log('Execution error: ' + err.message, 'error');
            dom.engineStatus.textContent = 'Error';
            dom.engineStatus.className = 'status error';
        }
    }

    /**
     * Reset the engine and UI
     */
    function doReset() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        if (keyHandler) {
            document.removeEventListener('keydown', keyHandler);
            keyHandler = null;
        }
        if (resetEngine) {
            resetEngine();
            initWasmGlobals();
            clearConsole();
            clearCanvas();
            log('Engine reset', 'info');
        }
    }

    /**
     * Load an example into the editor
     */
    function loadExample(name) {
        if (examples[name] && editor) {
            doReset();
            editor.setValue(examples[name]);
            dom.examplesMenu.classList.remove('show');
        }
    }

    /**
     * Initialize the IDE
     */
    function init() {
        // Cache DOM elements
        dom = {
            loadingOverlay: document.getElementById('loading-overlay'),
            consoleOutput: document.getElementById('console-output'),
            engineStatus: document.getElementById('engine-status'),
            runBtn: document.getElementById('run-btn'),
            resetBtn: document.getElementById('reset-btn'),
            clearConsoleBtn: document.getElementById('clear-console-btn'),
            clearCanvasBtn: document.getElementById('clear-canvas-btn'),
            examplesBtn: document.getElementById('examples-btn'),
            examplesMenu: document.getElementById('examples-menu'),
            execTimeEl: document.getElementById('exec-time'),
            runCountEl: document.getElementById('run-count'),
            userCanvas: document.getElementById('user-canvas')
        };
        dom.ctx = dom.userCanvas.getContext('2d');

        // Initialize editor
        initEditor();

        // Setup event listeners
        dom.runBtn.addEventListener('click', executeCode);
        dom.resetBtn.addEventListener('click', doReset);
        dom.clearConsoleBtn.addEventListener('click', clearConsole);
        dom.clearCanvasBtn.addEventListener('click', clearCanvas);

        dom.examplesBtn.addEventListener('click', function() {
            dom.examplesMenu.classList.toggle('show');
        });

        document.addEventListener('click', function(e) {
            if (!dom.examplesBtn.contains(e.target) && !dom.examplesMenu.contains(e.target)) {
                dom.examplesMenu.classList.remove('show');
            }
        });

        const exampleBtns = dom.examplesMenu.querySelectorAll('button[data-example]');
        for (let i = 0; i < exampleBtns.length; i++) {
            exampleBtns[i].addEventListener('click', function() {
                loadExample(this.dataset.example);
            });
        }

        // Initialize engine
        initEngine();
    }

    return {
        init: init,
        examples: examples,
        VERSION: BUILD_VERSION
    };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', MQuickJSIDE.init);
} else {
    MQuickJSIDE.init();
}
