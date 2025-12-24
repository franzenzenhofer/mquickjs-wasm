/**
 * WASM Calculator - Powered by MicroQuickJS
 *
 * This calculator runs all user code inside a sandboxed WASM engine.
 * No browser code execution - all math runs in isolated WebAssembly.
 *
 * Created 100% by Claude Code - December 2024
 */

(function() {
    'use strict';

    // State
    var wasmRun = null;
    var wasmReset = null;
    var history = [];
    var variables = {};

    // LocalStorage keys
    var LS_HISTORY = 'wasm_calc_history';
    var LS_FUNCTIONS = 'wasm_calc_functions';

    // DOM elements
    var app = document.getElementById('app');
    var calculator = document.getElementById('calculator');
    var input = document.getElementById('input');
    var result = document.getElementById('result');
    var status = document.getElementById('status');
    var varList = document.getElementById('var-list');
    var historyList = document.getElementById('history-list');
    var fnCode = document.getElementById('fn-code');
    var savedFns = document.getElementById('saved-fns');

    // Math helpers injected into WASM
    var mathSetup = 'var sin=Math.sin,cos=Math.cos,tan=Math.tan,sqrt=Math.sqrt,pow=Math.pow,log=Math.log,PI=Math.PI,E=Math.E,abs=Math.abs,floor=Math.floor,ceil=Math.ceil,round=Math.round,min=Math.min,max=Math.max,random=Math.random;';

    // Helper to clear element children
    function clearElement(el) {
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }
    }

    // Helper to create empty state
    function createEmptyState(icon, text) {
        var div = document.createElement('div');
        div.className = 'empty-state';

        var iconDiv = document.createElement('div');
        iconDiv.className = 'empty-state-icon';
        iconDiv.textContent = icon;

        var p = document.createElement('p');
        p.textContent = text;

        div.appendChild(iconDiv);
        div.appendChild(p);
        return div;
    }

    // Initialize WASM
    function initWASM() {
        if (typeof MQuickJS === 'undefined') {
            setTimeout(initWASM, 100);
            return;
        }

        MQuickJS().then(function(Module) {
            var init = Module.cwrap('mquickjs_init', 'number', []);
            wasmRun = Module.cwrap('mquickjs_run', 'string', ['string']);
            wasmReset = Module.cwrap('mquickjs_reset', 'number', []);

            init();

            // Setup math helpers in WASM sandbox
            wasmRun(mathSetup);

            // Load saved functions
            loadSavedFunctions();

            // Load history
            loadHistory();

            // Show calculator
            app.style.display = 'none';
            calculator.style.display = 'flex';
            status.textContent = 'WASM Engine Ready - 168KB';

            // Focus input
            input.focus();
        });
    }

    // Execute calculation in WASM sandbox
    function calculate(expr) {
        if (!expr || !expr.trim()) return;

        try {
            var rawResult = wasmRun(expr);

            // Check for assignment
            var assignMatch = expr.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=/);
            if (assignMatch) {
                var varName = assignMatch[1];
                variables[varName] = rawResult;
                updateVariables();
            }

            // Update display
            if (rawResult === 'undefined' || rawResult === undefined) {
                result.textContent = 'OK';
                result.className = 'display-result';
            } else {
                result.textContent = rawResult;
                result.className = 'display-result';
            }

            // Add to history
            addToHistory(expr, rawResult || 'OK');

        } catch (e) {
            result.textContent = 'Error: ' + e.message;
            result.className = 'display-result error';
        }
    }

    // Update variables display
    function updateVariables() {
        var varNames = Object.keys(variables);

        clearElement(varList);

        if (varNames.length === 0) {
            varList.appendChild(createEmptyState('📦', 'No variables yet. Define one like x = 10'));
            return;
        }

        varNames.forEach(function(name) {
            var value = variables[name];
            var item = document.createElement('div');
            item.className = 'var-item';

            var nameSpan = document.createElement('span');
            nameSpan.className = 'var-name';
            nameSpan.textContent = name;

            var valueSpan = document.createElement('span');
            valueSpan.className = 'var-value';
            valueSpan.textContent = value;

            var actions = document.createElement('div');
            actions.className = 'var-actions';

            var useBtn = document.createElement('button');
            useBtn.className = 'var-btn';
            useBtn.dataset.use = name;
            useBtn.textContent = 'Use';

            var delBtn = document.createElement('button');
            delBtn.className = 'var-btn';
            delBtn.dataset.del = name;
            delBtn.textContent = 'Delete';

            actions.appendChild(useBtn);
            actions.appendChild(delBtn);

            item.appendChild(nameSpan);
            item.appendChild(valueSpan);
            item.appendChild(actions);

            varList.appendChild(item);
        });
    }

    // History management
    function addToHistory(expr, res) {
        history.unshift({ expr: expr, result: res, time: Date.now() });
        if (history.length > 50) history.pop();
        saveHistory();
        renderHistory();
    }

    function saveHistory() {
        try {
            localStorage.setItem(LS_HISTORY, JSON.stringify(history.slice(0, 50)));
        } catch (e) {}
    }

    function loadHistory() {
        try {
            var saved = localStorage.getItem(LS_HISTORY);
            if (saved) {
                history = JSON.parse(saved);
                renderHistory();
            }
        } catch (e) {}
    }

    function renderHistory() {
        clearElement(historyList);

        if (history.length === 0) {
            historyList.appendChild(createEmptyState('📜', 'No calculations yet.'));
            return;
        }

        history.slice(0, 30).forEach(function(h) {
            var item = document.createElement('div');
            item.className = 'history-item';

            var exprDiv = document.createElement('div');
            exprDiv.className = 'history-expr';
            exprDiv.textContent = h.expr;

            var resultDiv = document.createElement('div');
            resultDiv.className = 'history-result';
            resultDiv.textContent = '= ' + h.result;

            item.appendChild(exprDiv);
            item.appendChild(resultDiv);

            item.onclick = function() {
                input.value = h.expr;
                input.focus();
                switchTab('keypad');
            };

            historyList.appendChild(item);
        });
    }

    // Functions management
    function loadSavedFunctions() {
        try {
            var saved = localStorage.getItem(LS_FUNCTIONS);
            if (saved) {
                fnCode.value = saved;
                // Run saved functions in WASM sandbox
                wasmRun(saved);
                updateSavedFnsDisplay();
            }
        } catch (e) {}
    }

    function saveFunctions() {
        var code = fnCode.value.trim();
        if (!code) return;

        try {
            // Run in WASM sandbox
            wasmRun(code);
            // Save to localStorage
            localStorage.setItem(LS_FUNCTIONS, code);
            updateSavedFnsDisplay();
            result.textContent = 'Functions loaded!';
            result.className = 'display-result';
        } catch (e) {
            result.textContent = 'Error: ' + e.message;
            result.className = 'display-result error';
        }
    }

    function updateSavedFnsDisplay() {
        var code = fnCode.value;
        var fnMatches = code.match(/function\s+([a-zA-Z_][a-zA-Z0-9_]*)/g) || [];

        clearElement(savedFns);

        if (fnMatches.length === 0) {
            var info = document.createElement('div');
            info.className = 'info-section';

            var h3 = document.createElement('h3');
            h3.textContent = 'Why Custom Functions?';

            var p = document.createElement('p');
            p.textContent = 'Your functions run inside the sandboxed WASM engine - safe, isolated, and persistent. They are saved to localStorage and reloaded automatically.';

            info.appendChild(h3);
            info.appendChild(p);
            savedFns.appendChild(info);
            return;
        }

        var header = document.createElement('div');
        header.className = 'info-section';
        var headerH3 = document.createElement('h3');
        headerH3.textContent = 'Loaded Functions';
        header.appendChild(headerH3);
        savedFns.appendChild(header);

        fnMatches.forEach(function(fn) {
            var name = fn.replace('function ', '');
            var item = document.createElement('div');
            item.className = 'saved-fn';
            item.dataset.fn = name;

            var nameDiv = document.createElement('div');
            nameDiv.className = 'saved-fn-name';
            nameDiv.textContent = name + '()';

            var previewDiv = document.createElement('div');
            previewDiv.className = 'saved-fn-preview';
            previewDiv.textContent = 'Click to use in calculator';

            item.appendChild(nameDiv);
            item.appendChild(previewDiv);
            savedFns.appendChild(item);
        });
    }

    // Tab switching
    function switchTab(tabId) {
        document.querySelectorAll('.tab').forEach(function(t) {
            t.classList.toggle('active', t.dataset.tab === tabId);
        });
        document.querySelectorAll('.panel').forEach(function(p) {
            p.classList.toggle('active', p.id === 'panel-' + tabId);
        });
    }

    // Event handlers
    document.querySelectorAll('.tab').forEach(function(tab) {
        tab.onclick = function() {
            switchTab(tab.dataset.tab);
        };
    });

    document.querySelectorAll('.key[data-num]').forEach(function(key) {
        key.onclick = function() {
            input.value += key.dataset.num;
            input.focus();
        };
    });

    document.querySelectorAll('.key[data-op]').forEach(function(key) {
        key.onclick = function() {
            input.value += ' ' + key.dataset.op + ' ';
            input.focus();
        };
    });

    document.querySelectorAll('.key[data-fn]').forEach(function(key) {
        key.onclick = function() {
            input.value += key.dataset.fn;
            input.focus();
        };
    });

    document.getElementById('btn-equals').onclick = function() {
        calculate(input.value);
    };

    document.getElementById('btn-clear').onclick = function() {
        input.value = '';
        result.textContent = '0';
        result.className = 'display-result';
        input.focus();
    };

    document.getElementById('btn-save-fn').onclick = saveFunctions;

    document.getElementById('btn-clear-fn').onclick = function() {
        fnCode.value = '';
    };

    input.onkeydown = function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            calculate(input.value);
        }
    };

    varList.onclick = function(e) {
        var useBtn = e.target.closest('[data-use]');
        var delBtn = e.target.closest('[data-del]');

        if (useBtn) {
            input.value += useBtn.dataset.use;
            input.focus();
            switchTab('keypad');
        }

        if (delBtn) {
            var name = delBtn.dataset.del;
            wasmRun(name + ' = undefined');
            delete variables[name];
            updateVariables();
        }
    };

    savedFns.onclick = function(e) {
        var fnItem = e.target.closest('[data-fn]');
        if (fnItem) {
            input.value += fnItem.dataset.fn + '(';
            input.focus();
            switchTab('keypad');
        }
    };

    // Start
    initWASM();
})();
