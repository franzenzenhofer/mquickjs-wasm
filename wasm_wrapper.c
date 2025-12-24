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

/* Custom write function to capture output */
static void wasm_write_func(void *opaque, const void *buf, size_t buf_len) {
    (void)opaque;
    if (output_pos + buf_len < OUTPUT_BUF_SIZE - 1) {
        memcpy(output_buffer + output_pos, buf, buf_len);
        output_pos += buf_len;
        output_buffer[output_pos] = '\0';
    }
}

/* Custom console.log implementation for JS */
static JSValue js_console_log(JSContext *ctx, JSValue *this_val, int argc, JSValue *argv) {
    (void)this_val;
    for (int i = 0; i < argc; i++) {
        JSCStringBuf buf;
        const char *str = JS_ToCString(ctx, argv[i], &buf);
        if (str) {
            size_t len = strlen(str);
            if (output_pos + len + 2 < OUTPUT_BUF_SIZE - 1) {
                memcpy(output_buffer + output_pos, str, len);
                output_pos += len;
                if (i < argc - 1) {
                    output_buffer[output_pos++] = ' ';
                }
            }
        }
    }
    output_buffer[output_pos++] = '\n';
    output_buffer[output_pos] = '\0';
    return JS_UNDEFINED;
}

/* Initialize the JavaScript engine */
EMSCRIPTEN_KEEPALIVE
int mquickjs_init(void) {
    if (global_ctx != NULL) {
        return 0;  /* Already initialized */
    }

    /* Create context with our memory pool */
    global_ctx = JS_NewContext(js_memory, sizeof(js_memory), NULL);
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

    /* Parse and run the code using JS_Eval which is the engine's execution function */
    JSValue val = JS_Eval(global_ctx, code, strlen(code), "<input>", JS_EVAL_RETVAL);

    if (JS_IsException(val)) {
        /* Get exception message */
        JSValue exc = JS_GetException(global_ctx);
        if (!JS_IsUndefined(exc)) {
            JSCStringBuf buf;
            const char *str = JS_ToCString(global_ctx, exc, &buf);
            if (str) {
                snprintf(result_buffer, sizeof(result_buffer), "Error: %s", str);
            } else {
                snprintf(result_buffer, sizeof(result_buffer), "Error: Unknown exception");
            }
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
