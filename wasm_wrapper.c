/*
 * MicroQuickJS WASM Wrapper
 *
 * This file provides a browser-friendly API for MicroQuickJS compiled to WebAssembly.
 *
 * Original MicroQuickJS:
 * Copyright (c) 2017-2025 Fabrice Bellard
 * Copyright (c) 2017-2025 Charlie Gordon
 *
 * WASM Wrapper:
 * Created 100% by Claude Code (claude.ai/code) - December 2024
 * No human review or modification.
 *
 * MIT License - See LICENSE file
 */

#include <emscripten/emscripten.h>
#include <string.h>
#include <stdlib.h>
#include <stdio.h>
#include <math.h>
#include "mquickjs.h"

/* Memory pool for the JS engine */
#define MQUICKJS_MEM_SIZE (1024 * 1024)  /* 1MB default */
static uint8_t js_memory[MQUICKJS_MEM_SIZE] __attribute__((aligned(8)));

/* Global context */
static JSContext *global_ctx = NULL;

/* Output buffer for results */
#define OUTPUT_BUF_SIZE 65536
static char output_buffer[OUTPUT_BUF_SIZE];
static size_t output_pos = 0;

/* Custom print function implementation for console.log */
static JSValue js_print(JSContext *ctx, JSValue *this_val, int argc, JSValue *argv)
{
    int i;
    JSValue v;

    for(i = 0; i < argc; i++) {
        if (i != 0 && output_pos < OUTPUT_BUF_SIZE - 1) {
            output_buffer[output_pos++] = ' ';
        }
        v = argv[i];
        if (JS_IsString(ctx, v)) {
            JSCStringBuf buf;
            const char *str;
            str = JS_ToCString(ctx, v, &buf);
            if (str) {
                size_t len = strlen(str);
                if (output_pos + len < OUTPUT_BUF_SIZE - 1) {
                    memcpy(output_buffer + output_pos, str, len);
                    output_pos += len;
                }
            }
        } else if (JS_IsInt(v)) {
            int val = JS_VALUE_GET_INT(v);
            char num_buf[32];
            int len = snprintf(num_buf, sizeof(num_buf), "%d", val);
            if (output_pos + len < OUTPUT_BUF_SIZE - 1) {
                memcpy(output_buffer + output_pos, num_buf, len);
                output_pos += len;
            }
        } else if (JS_IsUndefined(v)) {
            const char *undef = "undefined";
            size_t len = strlen(undef);
            if (output_pos + len < OUTPUT_BUF_SIZE - 1) {
                memcpy(output_buffer + output_pos, undef, len);
                output_pos += len;
            }
        } else if (JS_IsNull(v)) {
            const char *null_str = "null";
            size_t len = strlen(null_str);
            if (output_pos + len < OUTPUT_BUF_SIZE - 1) {
                memcpy(output_buffer + output_pos, null_str, len);
                output_pos += len;
            }
        } else if (JS_IsBool(v)) {
            const char *bool_str = JS_VALUE_GET_SPECIAL_VALUE(v) ? "true" : "false";
            size_t len = strlen(bool_str);
            if (output_pos + len < OUTPUT_BUF_SIZE - 1) {
                memcpy(output_buffer + output_pos, bool_str, len);
                output_pos += len;
            }
        } else {
            /* For other types, just show [Object] */
            JSCStringBuf buf;
            const char *str = JS_ToCString(ctx, v, &buf);
            if (str) {
                size_t len = strlen(str);
                if (output_pos + len < OUTPUT_BUF_SIZE - 1) {
                    memcpy(output_buffer + output_pos, str, len);
                    output_pos += len;
                }
            }
        }
    }
    if (output_pos < OUTPUT_BUF_SIZE - 1) {
        output_buffer[output_pos++] = '\n';
    }
    output_buffer[output_pos] = '\0';
    return JS_UNDEFINED;
}

/* Date.now implementation */
static JSValue js_date_now(JSContext *ctx, JSValue *this_val, int argc, JSValue *argv)
{
    /* Use emscripten's time */
    double now = emscripten_get_now();
    return JS_NewFloat64(ctx, now);
}

/* performance.now implementation */
static JSValue js_performance_now(JSContext *ctx, JSValue *this_val, int argc, JSValue *argv)
{
    double now = emscripten_get_now();
    return JS_NewFloat64(ctx, now);
}

/* Required global functions that the stdlib references */
static JSValue js_gc(JSContext *ctx, JSValue *this_val, int argc, JSValue *argv) {
    JS_GC(ctx);
    return JS_UNDEFINED;
}

static JSValue js_load(JSContext *ctx, JSValue *this_val, int argc, JSValue *argv) {
    /* Not supported in WASM browser environment */
    return JS_ThrowTypeError(ctx, "load() is not supported in browser");
}

/* Timer stubs - actual timers would require async support */
static JSValue js_setTimeout(JSContext *ctx, JSValue *this_val, int argc, JSValue *argv) {
    /* Basic stub - timers not fully supported in sync WASM */
    return JS_ThrowTypeError(ctx, "setTimeout() requires async support");
}

static JSValue js_clearTimeout(JSContext *ctx, JSValue *this_val, int argc, JSValue *argv) {
    return JS_UNDEFINED;
}

/* Include the generated stdlib header - this defines js_stdlib */
#include "mqjs_stdlib.h"

/* Custom write function to capture output */
static void wasm_write_func(void *opaque, const void *buf, size_t buf_len) {
    (void)opaque;
    if (output_pos + buf_len < OUTPUT_BUF_SIZE - 1) {
        memcpy(output_buffer + output_pos, buf, buf_len);
        output_pos += buf_len;
        output_buffer[output_pos] = '\0';
    }
}

/* Initialize the JavaScript engine */
EMSCRIPTEN_KEEPALIVE
int mquickjs_init(void) {
    if (global_ctx != NULL) {
        return 0;  /* Already initialized */
    }

    /* Create context with the standard library */
    global_ctx = JS_NewContext(js_memory, sizeof(js_memory), &js_stdlib);
    if (!global_ctx) {
        return -1;
    }

    /* Set up logging */
    JS_SetLogFunc(global_ctx, wasm_write_func);

    /* Clear output buffer */
    output_pos = 0;
    output_buffer[0] = '\0';

    return 0;
}

/* Cleanup the JavaScript engine */
EMSCRIPTEN_KEEPALIVE
void mquickjs_cleanup(void) {
    if (global_ctx) {
        JS_FreeContext(global_ctx);
        global_ctx = NULL;
    }
}

/* Clear output buffer */
EMSCRIPTEN_KEEPALIVE
void mquickjs_clear_output(void) {
    output_pos = 0;
    output_buffer[0] = '\0';
}

/* Get output buffer */
EMSCRIPTEN_KEEPALIVE
const char* mquickjs_get_output(void) {
    return output_buffer;
}

/* Run JavaScript code and return result as string */
EMSCRIPTEN_KEEPALIVE
const char* mquickjs_run(const char *code) {
    static char result_buffer[OUTPUT_BUF_SIZE];

    if (!global_ctx) {
        if (mquickjs_init() != 0) {
            return "Error: Failed to initialize engine";
        }
    }

    /* Clear output buffer */
    output_pos = 0;
    output_buffer[0] = '\0';

    /* Parse and run the code */
    /* JS_EVAL_RETVAL: return last expression value
       JS_EVAL_REPL: allow implicit global variable definitions */
    JSValue val = JS_Eval(global_ctx, code, strlen(code), "<input>", JS_EVAL_RETVAL | JS_EVAL_REPL);

    if (JS_IsException(val)) {
        /* Get exception message */
        JSValue exc = JS_GetException(global_ctx);
        /* Clear and use output buffer for error */
        output_pos = 0;
        output_buffer[0] = '\0';
        /* Use JS_PrintValueF to format the exception (writes to log func) */
        JS_PrintValueF(global_ctx, exc, 1 /* JS_DUMP_LONG */);
        if (output_pos > 0) {
            snprintf(result_buffer, sizeof(result_buffer), "Error: %s", output_buffer);
        } else {
            snprintf(result_buffer, sizeof(result_buffer), "Error: Exception occurred");
        }
        return result_buffer;
    }

    /* Convert result to string */
    if (JS_IsUndefined(val)) {
        if (output_pos > 0) {
            return output_buffer;
        }
        return "undefined";
    } else if (JS_IsNull(val)) {
        if (output_pos > 0) {
            snprintf(result_buffer, sizeof(result_buffer), "%snull", output_buffer);
            return result_buffer;
        }
        return "null";
    } else {
        JSCStringBuf buf;
        const char *str = JS_ToCString(global_ctx, val, &buf);
        if (str) {
            /* Combine output and result */
            if (output_pos > 0) {
                snprintf(result_buffer, sizeof(result_buffer), "%s%s", output_buffer, str);
            } else {
                snprintf(result_buffer, sizeof(result_buffer), "%s", str);
            }
            return result_buffer;
        }
        return output_buffer[0] ? output_buffer : "[Object]";
    }
}

/* Reset the engine (create fresh context) */
EMSCRIPTEN_KEEPALIVE
int mquickjs_reset(void) {
    mquickjs_cleanup();
    return mquickjs_init();
}

/* Get engine version info */
EMSCRIPTEN_KEEPALIVE
const char* mquickjs_version(void) {
    return "MicroQuickJS WASM v1.0 (Built with Claude Code)";
}

/* Get memory usage info */
EMSCRIPTEN_KEEPALIVE
int mquickjs_memory_size(void) {
    return MQUICKJS_MEM_SIZE;
}
