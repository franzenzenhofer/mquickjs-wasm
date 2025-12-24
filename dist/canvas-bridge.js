/**
 * MicroQuickJS Canvas API Bridge
 *
 * This module provides a Canvas API bridge that allows JavaScript code
 * running in MicroQuickJS WASM to draw on an HTML5 Canvas element.
 *
 * Architecture:
 * - User code runs in MicroQuickJS WASM (isolated, no DOM access)
 * - Canvas commands are queued as JSON during execution
 * - After WASM returns, commands are executed on the real canvas
 * - Animation frames are orchestrated by the browser
 *
 * Created 100% by Claude Code - December 2024
 * https://github.com/franzenzenhofer/mquickjs-wasm
 */

const CanvasBridge = (function() {
    'use strict';

    /**
     * Generate the Canvas API mock code to inject into user code
     * This creates a `canvas` object that queues drawing commands
     *
     * @returns {string} JavaScript code defining the canvas mock
     */
    function getCanvasMockCode() {
        return `
    // Canvas API Mock - queues commands for browser execution
    var canvas = {
        // Style properties
        fillStyle: "#000",
        strokeStyle: "#fff",
        font: "12px sans-serif",
        lineWidth: 1,

        // Drawing methods
        fillRect: function(x, y, w, h) {
            __canvasCommands.push({cmd: "fillRect", args: [x, y, w, h], style: this.fillStyle});
        },
        strokeRect: function(x, y, w, h) {
            __canvasCommands.push({cmd: "strokeRect", args: [x, y, w, h], style: this.strokeStyle, lw: this.lineWidth});
        },
        clearRect: function(x, y, w, h) {
            __canvasCommands.push({cmd: "clearRect", args: [x, y, w, h]});
        },

        // Text methods
        fillText: function(text, x, y) {
            __canvasCommands.push({cmd: "fillText", args: [text, x, y], style: this.fillStyle, font: this.font});
        },
        strokeText: function(text, x, y) {
            __canvasCommands.push({cmd: "strokeText", args: [text, x, y], style: this.strokeStyle, font: this.font});
        },

        // Path methods
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
        arc: function(x, y, r, startAngle, endAngle) {
            __canvasCommands.push({cmd: "arc", args: [x, y, r, startAngle, endAngle]});
        },
        rect: function(x, y, w, h) {
            __canvasCommands.push({cmd: "rect", args: [x, y, w, h]});
        },

        // Fill and stroke
        fill: function() {
            __canvasCommands.push({cmd: "fill", style: this.fillStyle});
        },
        stroke: function() {
            __canvasCommands.push({cmd: "stroke", style: this.strokeStyle, lw: this.lineWidth});
        }
    };`;
    }

    /**
     * Generate console mock code
     * Captures console.log/warn/error calls for display in IDE
     *
     * @returns {string} JavaScript code defining console mock
     */
    function getConsoleMockCode() {
        return `
    // Console Mock - captures output for IDE display
    var console = {
        log: function() {
            var args = [];
            for (var i = 0; i < arguments.length; i++) args.push(String(arguments[i]));
            __logs.push({type: "log", msg: args.join(" ")});
        },
        warn: function() {
            var args = [];
            for (var i = 0; i < arguments.length; i++) args.push(String(arguments[i]));
            __logs.push({type: "warn", msg: args.join(" ")});
        },
        error: function() {
            var args = [];
            for (var i = 0; i < arguments.length; i++) args.push(String(arguments[i]));
            __logs.push({type: "error", msg: args.join(" ")});
        }
    };`;
    }

    /**
     * Generate animation frame mock code
     * Allows user code to request animation frames
     *
     * @returns {string} JavaScript code for requestAnimationFrame mock
     */
    function getAnimationMockCode() {
        return `
    // Animation Frame Mock
    var __animCallback = null;
    function requestAnimationFrame(callback) {
        __animCallback = callback;
        return 1;
    }

    // Timeout mock (simplified - runs immediately in next frame)
    var __timeouts = [];
    function setTimeout(callback, delay) {
        __timeouts.push({cb: callback, delay: delay || 0});
        return __timeouts.length;
    }`;
    }

    /**
     * Generate keyboard input mock code
     * Allows user code to handle keyboard events
     *
     * @returns {string} JavaScript code for keyboard mock
     */
    function getKeyboardMockCode() {
        return `
    // Keyboard Input Mock
    var onKeyDown = null;`;
    }

    /**
     * Wrap user code with all mocks and return JSON result
     *
     * @param {string} userCode - The user's JavaScript code
     * @returns {string} Wrapped code ready for WASM execution
     */
    function wrapUserCode(userCode) {
        return `(function() {
    // Internal state
    var __logs = [];
    var __canvasCommands = [];

    ${getConsoleMockCode()}
    ${getCanvasMockCode()}
    ${getAnimationMockCode()}
    ${getKeyboardMockCode()}

    try {
        // Execute user code
        var __result = (function() {
            ${userCode}
        })();

        return JSON.stringify({
            logs: __logs,
            canvas: __canvasCommands,
            result: __result === undefined ? null : __result,
            hasAnim: __animCallback !== null,
            hasTimeouts: __timeouts.length > 0,
            hasKeyHandler: typeof onKeyDown === 'function'
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
     * Execute canvas commands on a real canvas context
     *
     * @param {CanvasRenderingContext2D} ctx - The canvas 2D context
     * @param {Array} commands - Array of command objects from WASM
     */
    function executeCommands(ctx, commands) {
        if (!commands || !Array.isArray(commands)) return;

        commands.forEach(function(cmd) {
            // Apply styles
            if (cmd.style) {
                ctx.fillStyle = cmd.style;
                ctx.strokeStyle = cmd.style;
            }
            if (cmd.font) ctx.font = cmd.font;
            if (cmd.lw) ctx.lineWidth = cmd.lw;

            // Execute command
            switch (cmd.cmd) {
                case 'fillRect':
                    ctx.fillRect(cmd.args[0], cmd.args[1], cmd.args[2], cmd.args[3]);
                    break;
                case 'strokeRect':
                    ctx.strokeRect(cmd.args[0], cmd.args[1], cmd.args[2], cmd.args[3]);
                    break;
                case 'clearRect':
                    ctx.clearRect(cmd.args[0], cmd.args[1], cmd.args[2], cmd.args[3]);
                    break;
                case 'fillText':
                    ctx.fillText(cmd.args[0], cmd.args[1], cmd.args[2]);
                    break;
                case 'strokeText':
                    ctx.strokeText(cmd.args[0], cmd.args[1], cmd.args[2]);
                    break;
                case 'beginPath':
                    ctx.beginPath();
                    break;
                case 'closePath':
                    ctx.closePath();
                    break;
                case 'moveTo':
                    ctx.moveTo(cmd.args[0], cmd.args[1]);
                    break;
                case 'lineTo':
                    ctx.lineTo(cmd.args[0], cmd.args[1]);
                    break;
                case 'arc':
                    ctx.arc(cmd.args[0], cmd.args[1], cmd.args[2], cmd.args[3], cmd.args[4]);
                    break;
                case 'rect':
                    ctx.rect(cmd.args[0], cmd.args[1], cmd.args[2], cmd.args[3]);
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
     * Generate animation frame code for continuing animations
     * This is a minimal version that only includes what's needed for the frame
     *
     * @returns {string} JavaScript code for animation frame execution
     */
    function getAnimationFrameCode() {
        return `(function() {
    if (typeof __animCallback === 'function') {
        var __canvasCommands = [];
        var __logs = [];

        ${getConsoleMockCode()}
        ${getCanvasMockCode()}

        var __nextAnim = null;
        function requestAnimationFrame(cb) { __nextAnim = cb; return 1; }

        var __timeouts = [];
        function setTimeout(cb, d) { __timeouts.push({cb:cb,delay:d||0}); return __timeouts.length; }

        // Execute the callback
        __animCallback();
        __animCallback = __nextAnim;

        // Handle timeouts
        for (var i = 0; i < __timeouts.length; i++) {
            if (__timeouts[i].delay <= 16) { // ~60fps
                __timeouts[i].cb();
            }
        }

        return JSON.stringify({
            logs: __logs,
            canvas: __canvasCommands,
            cont: __nextAnim !== null || __timeouts.length > 0
        });
    }
    return JSON.stringify({cont: false});
})();`;
    }

    /**
     * Generate code for handling keyboard input
     *
     * @param {string} key - The key that was pressed
     * @returns {string} JavaScript code to call the key handler
     */
    function getKeyHandlerCode(key) {
        return `if (typeof onKeyDown === 'function') onKeyDown("${key}");`;
    }

    // Public API
    return {
        wrapUserCode: wrapUserCode,
        executeCommands: executeCommands,
        getAnimationFrameCode: getAnimationFrameCode,
        getKeyHandlerCode: getKeyHandlerCode,

        // Version info
        VERSION: '1.0.0',
        AUTHOR: 'Claude Code'
    };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CanvasBridge;
}
