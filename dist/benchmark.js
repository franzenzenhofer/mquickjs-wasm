/**
 * MicroQuickJS WASM Benchmark Runner
 *
 * Compares performance between browser JavaScript and MicroQuickJS WASM.
 *
 * SECURITY NOTE: This file uses Function() to execute predefined benchmark code.
 * All benchmark code is hardcoded in this file - NO user input is evaluated.
 * This is a legitimate use case for performance benchmarking.
 *
 * Created 100% by Claude Code - December 2024
 * https://github.com/franzenzenhofer/mquickjs-wasm
 */

const Benchmark = (function() {
    'use strict';

    const BUILD_VERSION = '20251224_v19';

    // Benchmark test suite - all code is predefined, not user input
    const benchmarkSuite = {
        full: [
            {
                name: 'Fibonacci(38)',
                description: 'Recursive function calls',
                code: 'function fib(n){if(n<=1)return n;return fib(n-1)+fib(n-2);}fib(38);'
            },
            {
                name: 'Sieve(100K)',
                description: 'Array operations, loops',
                code: 'function sieve(n){var p=[];for(var i=0;i<=n;i++)p[i]=true;p[0]=p[1]=false;for(var i=2;i*i<=n;i++){if(p[i]){for(var j=i*i;j<=n;j+=i)p[j]=false;}}var c=0;for(var i=0;i<=n;i++)if(p[i])c++;c;}sieve(100000);'
            },
            {
                name: 'Mandelbrot(80)',
                description: 'Floating point math',
                code: 'function m(s){var r=0;for(var y=0;y<s;y++){for(var x=0;x<s;x++){var cx=(x-s/2)*4.0/s;var cy=(y-s/2)*4.0/s;var zx=0,zy=0;var i=0;while(zx*zx+zy*zy<4&&i<100){var t=zx*zx-zy*zy+cx;zy=2*zx*zy+cy;zx=t;i++;}r+=i;}}r;}m(80);'
            },
            {
                name: 'Loop(1M)',
                description: 'Simple loop iterations',
                code: 'var sum=0;for(var i=0;i<1000000;i++)sum+=i%10;sum;'
            },
            {
                name: 'StringOps(50K)',
                description: 'String manipulation',
                code: 'function str(n){var s="";for(var i=0;i<n;i++)s+=String(i%10);var c=0;for(var i=0;i<s.length;i++)if(s[i]==="5")c++;c;}str(50000);'
            }
        ],
        quick: [
            {
                name: 'Fibonacci(32)',
                description: 'Quick recursive test',
                code: 'function fib(n){if(n<=1)return n;return fib(n-1)+fib(n-2);}fib(32);'
            },
            {
                name: 'Sieve(50K)',
                description: 'Quick array test',
                code: 'function sieve(n){var p=[];for(var i=0;i<=n;i++)p[i]=true;p[0]=p[1]=false;for(var i=2;i*i<=n;i++){if(p[i]){for(var j=i*i;j<=n;j+=i)p[j]=false;}}var c=0;for(var i=0;i<=n;i++)if(p[i])c++;c;}sieve(50000);'
            }
        ]
    };

    // State
    let wasmModule = null;
    let wasmRun = null;
    let wasmReset = null;
    let isRunning = false;

    // DOM elements
    const els = {};

    function detectBrowser() {
        const ua = navigator.userAgent;
        if (ua.includes('Firefox')) return 'Firefox (SpiderMonkey)';
        if (ua.includes('Chrome')) return 'Chrome (V8)';
        if (ua.includes('Safari')) return 'Safari (JSC)';
        if (ua.includes('Edge')) return 'Edge (V8)';
        return 'Unknown';
    }

    function formatTime(ms) {
        if (ms >= 1000) return (ms / 1000).toFixed(2) + 's';
        if (ms < 1) return ms.toFixed(2) + 'ms';
        if (ms < 10) return ms.toFixed(1) + 'ms';
        return Math.round(ms) + 'ms';
    }

    // Run predefined benchmark in browser JS (code is hardcoded, not user input)
    function runBrowserBenchmark(code) {
        const fn = Function('"use strict";' + code);
        const times = [];
        for (let i = 0; i < 3; i++) {
            const start = performance.now();
            fn();
            times.push(performance.now() - start);
        }
        times.sort(function(a, b) { return a - b; });
        return { best: times[0], median: times[1], worst: times[2] };
    }

    function runWASMBenchmark(code) {
        const times = [];
        for (let i = 0; i < 3; i++) {
            wasmReset();
            const start = performance.now();
            wasmRun(code);
            times.push(performance.now() - start);
        }
        times.sort(function(a, b) { return a - b; });
        return { best: times[0], median: times[1], worst: times[2] };
    }

    function log(msg) {
        console.log('[Benchmark] ' + msg);
        if (els.consoleOutput) {
            const line = document.createElement('div');
            line.textContent = new Date().toLocaleTimeString() + ' ' + msg;
            els.consoleOutput.appendChild(line);
            els.consoleOutput.scrollTop = els.consoleOutput.scrollHeight;
        }
    }

    function updateProgress(text, percent, status) {
        els.progressText.textContent = text;
        els.progressBar.style.width = percent + '%';
        if (status) els.progressStatus.textContent = status;
        log(text + (status ? ' - ' + status : ''));
    }

    // Safe DOM-based chart rendering (no innerHTML)
    function renderChart(results) {
        // Clear existing content
        while (els.chartContainer.firstChild) {
            els.chartContainer.removeChild(els.chartContainer.firstChild);
        }

        results.forEach(function(r) {
            // Scale bars relative to each other within this test (larger = 100%)
            const localMax = Math.max(r.browser.median, r.wasm.median);
            const browserWidth = localMax > 0 ? (r.browser.median / localMax * 100).toFixed(1) : 0;
            const wasmWidth = localMax > 0 ? (r.wasm.median / localMax * 100).toFixed(1) : 0;
            const ratio = (r.wasm.median / r.browser.median).toFixed(1);

            const row = document.createElement('div');
            row.className = 'chart-row';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'test-name';
            nameSpan.textContent = r.name;

            const barsDiv = document.createElement('div');
            barsDiv.className = 'chart-bars';

            // Browser bar row (bar + label outside)
            const browserRow = document.createElement('div');
            browserRow.className = 'chart-bar-row';
            const browserBar = document.createElement('div');
            browserBar.className = 'chart-bar browser';
            browserBar.style.width = browserWidth + '%';
            const browserLabel = document.createElement('span');
            browserLabel.className = 'chart-bar-label browser';
            browserLabel.textContent = formatTime(r.browser.median);
            browserRow.appendChild(browserBar);
            browserRow.appendChild(browserLabel);

            // WASM bar row (bar + label outside)
            const wasmRow = document.createElement('div');
            wasmRow.className = 'chart-bar-row';
            const wasmBar = document.createElement('div');
            wasmBar.className = 'chart-bar wasm';
            wasmBar.style.width = wasmWidth + '%';
            const wasmLabel = document.createElement('span');
            wasmLabel.className = 'chart-bar-label wasm';
            wasmLabel.textContent = formatTime(r.wasm.median);
            wasmRow.appendChild(wasmBar);
            wasmRow.appendChild(wasmLabel);

            barsDiv.appendChild(browserRow);
            barsDiv.appendChild(wasmRow);

            const ratioSpan = document.createElement('span');
            ratioSpan.className = 'ratio';
            ratioSpan.textContent = ratio + 'x';

            row.appendChild(nameSpan);
            row.appendChild(barsDiv);
            row.appendChild(ratioSpan);

            els.chartContainer.appendChild(row);
        });
    }

    // Safe DOM-based table rendering (no innerHTML)
    function renderTable(results) {
        while (els.resultsTbody.firstChild) {
            els.resultsTbody.removeChild(els.resultsTbody.firstChild);
        }

        results.forEach(function(r) {
            const ratio = (r.wasm.median / r.browser.median).toFixed(1);

            const tr = document.createElement('tr');

            const tdName = document.createElement('td');
            tdName.textContent = r.name;

            const tdBrowser = document.createElement('td');
            tdBrowser.className = 'browser';
            tdBrowser.textContent = formatTime(r.browser.median);

            const tdWasm = document.createElement('td');
            tdWasm.className = 'wasm';
            tdWasm.textContent = formatTime(r.wasm.median);

            const tdRatio = document.createElement('td');
            tdRatio.textContent = ratio + 'x';

            tr.appendChild(tdName);
            tr.appendChild(tdBrowser);
            tr.appendChild(tdWasm);
            tr.appendChild(tdRatio);

            els.resultsTbody.appendChild(tr);
        });
    }

    function displayResults(results) {
        let browserTotal = 0, wasmTotal = 0;
        results.forEach(function(r) {
            browserTotal += r.browser.median;
            wasmTotal += r.wasm.median;
        });
        const overallRatio = (wasmTotal / browserTotal).toFixed(1);

        els.browserTotal.textContent = formatTime(browserTotal);
        els.wasmTotal.textContent = formatTime(wasmTotal);
        els.browserEngine.textContent = detectBrowser();

        // Safe: ratio is calculated from numbers we generated
        els.ratioBanner.textContent = '';
        els.ratioBanner.appendChild(document.createTextNode('Browser JavaScript is '));
        const strong = document.createElement('strong');
        strong.textContent = overallRatio + 'x faster';
        els.ratioBanner.appendChild(strong);
        els.ratioBanner.appendChild(document.createTextNode(' than WASM (expected for JIT vs interpreter)'));

        renderChart(results);
        renderTable(results);

        els.progressSection.classList.remove('active');
        els.resultsSection.classList.add('active');
    }

    function sleep(ms) {
        return new Promise(function(resolve) { setTimeout(resolve, ms); });
    }

    async function runBenchmarks(suite) {
        if (isRunning) return;
        isRunning = true;

        const tests = benchmarkSuite[suite];
        const results = [];

        els.resultsSection.classList.remove('active');
        els.progressSection.classList.add('active');
        els.runFullBtn.disabled = true;
        els.runQuickBtn.disabled = true;

        for (let i = 0; i < tests.length; i++) {
            const test = tests[i];
            const progress = ((i / tests.length) * 100).toFixed(0);

            updateProgress('Running: ' + test.name, progress, 'Testing browser JavaScript...');
            await sleep(50);

            const browserResult = runBrowserBenchmark(test.code);
            updateProgress('Running: ' + test.name, progress, 'Browser: ' + formatTime(browserResult.median) + ' done');
            await sleep(50);

            updateProgress('Running: ' + test.name, progress, 'Testing WASM engine...');
            await sleep(50);

            const wasmResult = runWASMBenchmark(test.code);
            updateProgress('Running: ' + test.name, progress, 'WASM: ' + formatTime(wasmResult.median) + ' done');
            await sleep(50);

            results.push({ name: test.name, browser: browserResult, wasm: wasmResult });
        }

        updateProgress('Complete!', 100, 'Rendering results...');
        await sleep(100);

        displayResults(results);

        els.runFullBtn.disabled = false;
        els.runQuickBtn.disabled = false;
        isRunning = false;
    }

    function initWASM() {
        if (typeof MQuickJS === 'undefined') {
            setTimeout(initWASM, 100);
            return;
        }

        MQuickJS().then(function(Module) {
            wasmModule = Module;
            wasmRun = Module.cwrap('mquickjs_run', 'string', ['string']);
            wasmReset = Module.cwrap('mquickjs_reset', 'number', []);

            const init = Module.cwrap('mquickjs_init', 'number', []);
            init();

            els.runFullBtn.disabled = false;
            els.runFullBtn.textContent = 'Run Full Benchmark (~30s)';
            els.runQuickBtn.disabled = false;

            console.log('MicroQuickJS Benchmark ' + BUILD_VERSION + ' ready');
        });
    }

    function init() {
        els.runFullBtn = document.getElementById('run-full-btn');
        els.runQuickBtn = document.getElementById('run-quick-btn');
        els.progressSection = document.getElementById('progress-section');
        els.progressText = document.getElementById('progress-text');
        els.progressBar = document.getElementById('progress-bar');
        els.progressStatus = document.getElementById('progress-status');
        els.resultsSection = document.getElementById('results-section');
        els.browserTotal = document.getElementById('browser-total');
        els.wasmTotal = document.getElementById('wasm-total');
        els.browserEngine = document.getElementById('browser-engine');
        els.ratioBanner = document.getElementById('ratio-banner');
        els.chartContainer = document.getElementById('chart-container');
        els.resultsTbody = document.getElementById('results-tbody');
        els.consoleOutput = document.getElementById('console-output');

        document.getElementById('browser-name').textContent = detectBrowser();
        document.getElementById('version-display').textContent = BUILD_VERSION;

        els.runFullBtn.addEventListener('click', function() { runBenchmarks('full'); });
        els.runQuickBtn.addEventListener('click', function() { runBenchmarks('quick'); });

        initWASM();
        console.log('MicroQuickJS Benchmark ' + BUILD_VERSION + ' loading...');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return { VERSION: BUILD_VERSION, run: runBenchmarks };
})();
