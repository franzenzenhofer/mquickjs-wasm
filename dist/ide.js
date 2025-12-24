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
    const BUILD_VERSION = '20241224_v4';

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
console.log("Click 'Examples' -> 'Shapes & Colors'");

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

        'canvas-animation': `// Canvas Animation Loop
// Uses requestAnimationFrame bridge

var x = 0;
var y = 100;
var dx = 3;
var dy = 2;
var radius = 15;
var hue = 0;
var frame = 0;

function animate() {
    // Clear with trail effect
    canvas.fillStyle = "rgba(13, 17, 23, 0.2)";
    canvas.fillRect(0, 0, 300, 200);

    // Update position
    x += dx;
    y += dy;

    // Bounce
    if (x + radius > 300 || x - radius < 0) dx = -dx;
    if (y + radius > 200 || y - radius < 0) dy = -dy;

    // Draw ball with rainbow color
    hue = (hue + 3) % 360;
    canvas.fillStyle = "hsl(" + hue + ", 100%, 60%)";
    canvas.beginPath();
    canvas.arc(x, y, radius, 0, Math.PI * 2);
    canvas.fill();

    frame++;
    if (frame < 200) {
        requestAnimationFrame(animate);
    } else {
        console.log("Animation complete! 200 frames");
    }
}

console.log("Starting animation...");
x = 150;
animate();

"Animation running...";`,

        'canvas-game': `// Snake Game
// Arrow keys or WASD to play!

var GRID = 15;
var COLS = 20;
var ROWS = 13;

var snake = [{x: 10, y: 6}];
var dir = {x: 1, y: 0};
var food = {x: 15, y: 6};
var score = 0;
var gameOver = false;

function spawnFood() {
    food.x = Math.floor(Math.random() * COLS);
    food.y = Math.floor(Math.random() * ROWS);
}

function draw() {
    // Background
    canvas.fillStyle = "#0d1117";
    canvas.fillRect(0, 0, 300, 200);

    // Grid
    canvas.strokeStyle = "#21262d";
    for (var i = 0; i <= COLS; i++) {
        canvas.beginPath();
        canvas.moveTo(i * GRID, 0);
        canvas.lineTo(i * GRID, ROWS * GRID);
        canvas.stroke();
    }
    for (var i = 0; i <= ROWS; i++) {
        canvas.beginPath();
        canvas.moveTo(0, i * GRID);
        canvas.lineTo(COLS * GRID, i * GRID);
        canvas.stroke();
    }

    // Food
    canvas.fillStyle = "#f85149";
    canvas.fillRect(food.x * GRID + 1, food.y * GRID + 1, GRID - 2, GRID - 2);

    // Snake
    for (var i = 0; i < snake.length; i++) {
        canvas.fillStyle = i === 0 ? "#3fb950" : "#238636";
        canvas.fillRect(snake[i].x * GRID + 1, snake[i].y * GRID + 1, GRID - 2, GRID - 2);
    }

    // Score
    canvas.fillStyle = "#fff";
    canvas.font = "12px monospace";
    canvas.fillText("Score: " + score, 5, ROWS * GRID + 12);
}

function update() {
    if (gameOver) return;

    var head = {
        x: snake[0].x + dir.x,
        y: snake[0].y + dir.y
    };

    // Wrap
    if (head.x < 0) head.x = COLS - 1;
    if (head.x >= COLS) head.x = 0;
    if (head.y < 0) head.y = ROWS - 1;
    if (head.y >= ROWS) head.y = 0;

    // Self collision
    for (var i = 0; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
            gameOver = true;
            console.log("Game Over! Score: " + score);
            return;
        }
    }

    snake.unshift(head);

    // Eat food
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        spawnFood();
    } else {
        snake.pop();
    }
}

function gameLoop() {
    update();
    draw();
    if (!gameOver) {
        setTimeout(gameLoop, 100);
    }
}

// Key handler
onKeyDown = function(key) {
    if (key === "ArrowUp" || key === "w") dir = {x: 0, y: -1};
    if (key === "ArrowDown" || key === "s") dir = {x: 0, y: 1};
    if (key === "ArrowLeft" || key === "a") dir = {x: -1, y: 0};
    if (key === "ArrowRight" || key === "d") dir = {x: 1, y: 0};
};

console.log("=== SNAKE GAME ===");
console.log("Use Arrow Keys or WASD!");
gameLoop();

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

// Title
canvas.fillStyle = "#fff";
canvas.font = "bold 14px sans-serif";
canvas.fillText("Generative Spiral", 95, 190);

console.log("Generated spiral art!");
"Art complete!";`,

        mandelbrot: `// ASCII Mandelbrot Set
var chars = " .:-=+*#%@";
var output = [];

console.log("=== Mandelbrot Set ===");

for (var py = -1.2; py <= 1.2; py += 0.1) {
    var line = "";
    for (var px = -2.0; px <= 0.6; px += 0.05) {
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

// Loop test
var t0 = Date.now();
var sum = 0;
for (var i = 0; i < 1000000; i++) sum += i;
var t1 = Date.now();
console.log("1M iterations: " + (t1 - t0) + "ms");

// Function calls
t0 = Date.now();
function add(a, b) { return a + b; }
var r = 0;
for (var i = 0; i < 100000; i++) r = add(r, 1);
t1 = Date.now();
console.log("100K func calls: " + (t1 - t0) + "ms");

// Array ops
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
console.log("10K objects: " + (t1 - t0) + "ms");

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
     * @param {string} text - Message text
     * @param {string} type - Message type: log, error, warn, info, result
     */
    function log(text, type) {
        type = type || 'log';

        // Create line container
        const line = document.createElement('div');
        line.className = 'console-line ' + type;

        // Timestamp
        const timestamp = document.createElement('span');
        timestamp.className = 'timestamp';
        const time = new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        timestamp.textContent = time;

        // Prefix (icon placeholder)
        const prefix = document.createElement('span');
        prefix.className = 'prefix';

        // Content (uses textContent for safety)
        const content = document.createElement('span');
        content.className = 'content';
        content.textContent = String(text);

        // Assemble
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
     * @returns {Promise}
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
     * @param {Array} commands - Array of command objects
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
     * Generate wrapper code for user JavaScript
     * This wraps user code with Canvas API mocks that queue commands
     * @param {string} userCode - The user's JavaScript code
     * @returns {string} Wrapped code ready for WASM execution
     */
    function generateWrappedCode(userCode) {
        return `(function() {
    var __logs = [];
    var __canvasCommands = [];
    var __animCallback = null;
    var __keyCallback = null;

    // Console mock
    var console = {
        log: function() {
            var args = [];
            for (var i = 0; i < arguments.length; i++) args.push(String(arguments[i]));
            __logs.push(args.join(" "));
        },
        warn: function() {
            var args = [];
            for (var i = 0; i < arguments.length; i++) args.push(String(arguments[i]));
            __logs.push("WARN: " + args.join(" "));
        },
        error: function() {
            var args = [];
            for (var i = 0; i < arguments.length; i++) args.push(String(arguments[i]));
            __logs.push("ERROR: " + args.join(" "));
        }
    };

    // Canvas API mock - queues commands for browser execution
    var canvas = {
        fillStyle: "#000",
        strokeStyle: "#fff",
        font: "12px sans-serif",
        lineWidth: 1,

        fillRect: function(x, y, w, h) {
            __canvasCommands.push({cmd: "fillRect", args: [x, y, w, h], style: this.fillStyle});
        },
        strokeRect: function(x, y, w, h) {
            __canvasCommands.push({cmd: "strokeRect", args: [x, y, w, h], style: this.strokeStyle, lw: this.lineWidth});
        },
        clearRect: function(x, y, w, h) {
            __canvasCommands.push({cmd: "clearRect", args: [x, y, w, h]});
        },
        fillText: function(text, x, y) {
            __canvasCommands.push({cmd: "fillText", args: [text, x, y], style: this.fillStyle, font: this.font});
        },
        strokeText: function(text, x, y) {
            __canvasCommands.push({cmd: "strokeText", args: [text, x, y], style: this.strokeStyle, font: this.font});
        },
        beginPath: function() {
            __canvasCommands.push({cmd: "beginPath"});
        },
        closePath: function() {
            __canvasCommands.push({cmd: "closePath"});
        },
        moveTo: function(x, y) {
            __canvasCommands.push({cmd: "moveTo", args: [x, y]});
        },
        lineTo: function(x, y) {
            __canvasCommands.push({cmd: "lineTo", args: [x, y]});
        },
        arc: function(x, y, r, s, e) {
            __canvasCommands.push({cmd: "arc", args: [x, y, r, s, e]});
        },
        fill: function() {
            __canvasCommands.push({cmd: "fill", style: this.fillStyle});
        },
        stroke: function() {
            __canvasCommands.push({cmd: "stroke", style: this.strokeStyle, lw: this.lineWidth});
        },
        rect: function(x, y, w, h) {
            __canvasCommands.push({cmd: "rect", args: [x, y, w, h]});
        }
    };

    // Animation frame mock
    function requestAnimationFrame(cb) {
        __animCallback = cb;
        return 1;
    }

    // Timeout mock (simplified)
    var __timeouts = [];
    function setTimeout(cb, delay) {
        __timeouts.push({cb: cb, delay: delay || 0});
        return __timeouts.length;
    }

    // Key handler
    var onKeyDown = null;

    try {
        var __result = (function() {
            ${userCode}
        })();

        __keyCallback = onKeyDown;

        return JSON.stringify({
            logs: __logs,
            canvas: __canvasCommands,
            result: __result === undefined ? null : __result,
            hasAnim: __animCallback !== null,
            hasKeyHandler: __keyCallback !== null,
            hasTimeouts: __timeouts.length > 0
        });
    } catch(e) {
        return JSON.stringify({
            logs: __logs,
            canvas: __canvasCommands,
            error: String(e)
        });
    }
})();`;
    }

    /**
     * Run animation loop in WASM
     */
    function runAnimationLoop() {
        const animCode = `(function() {
    if (typeof __animCallback === 'function') {
        var __canvasCommands = [];
        var __logs = [];
        var canvas = {
            fillStyle: "#000", strokeStyle: "#fff", font: "12px sans-serif", lineWidth: 1,
            fillRect: function(x,y,w,h) { __canvasCommands.push({cmd:"fillRect",args:[x,y,w,h],style:this.fillStyle}); },
            strokeRect: function(x,y,w,h) { __canvasCommands.push({cmd:"strokeRect",args:[x,y,w,h],style:this.strokeStyle}); },
            clearRect: function(x,y,w,h) { __canvasCommands.push({cmd:"clearRect",args:[x,y,w,h]}); },
            fillText: function(t,x,y) { __canvasCommands.push({cmd:"fillText",args:[t,x,y],style:this.fillStyle,font:this.font}); },
            beginPath: function() { __canvasCommands.push({cmd:"beginPath"}); },
            arc: function(x,y,r,s,e) { __canvasCommands.push({cmd:"arc",args:[x,y,r,s,e]}); },
            fill: function() { __canvasCommands.push({cmd:"fill",style:this.fillStyle}); },
            stroke: function() { __canvasCommands.push({cmd:"stroke",style:this.strokeStyle}); },
            moveTo: function(x,y) { __canvasCommands.push({cmd:"moveTo",args:[x,y]}); },
            lineTo: function(x,y) { __canvasCommands.push({cmd:"lineTo",args:[x,y]}); }
        };
        var console = {
            log: function() {
                var args = [];
                for (var i = 0; i < arguments.length; i++) args.push(String(arguments[i]));
                __logs.push(args.join(" "));
            }
        };
        var __nextAnim = null;
        function requestAnimationFrame(cb) { __nextAnim = cb; return 1; }
        var __timeouts = [];
        function setTimeout(cb, d) { __timeouts.push({cb:cb,delay:d||0}); return __timeouts.length; }

        __animCallback();
        __animCallback = __nextAnim;

        // Process timeouts
        for (var i = 0; i < __timeouts.length; i++) {
            if (__timeouts[i].delay <= 16) {
                __timeouts[i].cb();
            }
        }

        return JSON.stringify({
            canvas: __canvasCommands,
            logs: __logs,
            cont: __nextAnim !== null || __timeouts.length > 0
        });
    }
    return JSON.stringify({cont: false});
})();`;

        function frame() {
            try {
                const r = JSON.parse(runCode(animCode));
                if (r.canvas) executeCanvasCommands(r.canvas);
                if (r.logs) r.logs.forEach(function(l) { log(l, 'log'); });
                if (r.cont) {
                    animationId = requestAnimationFrame(frame);
                }
            } catch (e) {
                log('Animation error: ' + e.message, 'error');
            }
        }

        animationId = requestAnimationFrame(frame);
    }

    /**
     * Setup keyboard handler for games
     */
    function setupKeyHandler() {
        keyHandler = function(e) {
            const key = e.key;
            const gameKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'];
            if (gameKeys.indexOf(key) !== -1) {
                e.preventDefault();
                try {
                    runCode('if (typeof onKeyDown === "function") onKeyDown("' + key + '");');
                } catch (err) {
                    // Ignore key handler errors
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

        // Cancel any running animation
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }

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

            // Handle animation
            if (result.hasAnim || result.hasTimeouts) {
                runAnimationLoop();
            }

            // Handle key events
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
            clearConsole();
            clearCanvas();
            log('Engine reset', 'info');
        }
    }

    /**
     * Load an example into the editor
     * @param {string} name - Example name
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

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!dom.examplesBtn.contains(e.target) && !dom.examplesMenu.contains(e.target)) {
                dom.examplesMenu.classList.remove('show');
            }
        });

        // Example buttons
        const exampleBtns = dom.examplesMenu.querySelectorAll('button[data-example]');
        for (let i = 0; i < exampleBtns.length; i++) {
            exampleBtns[i].addEventListener('click', function() {
                loadExample(this.dataset.example);
            });
        }

        // Initialize engine
        initEngine();
    }

    // Public API
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
