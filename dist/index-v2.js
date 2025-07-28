#!/usr/bin/env node
import http from "http";
import express from "express";
import { OLLAMA_HOST, OLLAMA_PORT, OLLAMA_PROXY_PORT, OLLAMA_PROXY_REQUEST_BODY_LIMIT, OLLAMA_PROXY_REQUEST_TIMEOUT, } from "./init.js";
const app = express();
// Endpoint-method map
const endpointMethodMap = {
    // Native Ollama API endpoints
    "/api/chat": "POST",
    "/api/generate": "POST",
    "/api/embeddings": "POST",
    "/api/pull": "POST",
    "/api/push": "POST",
    "/api/create": "POST",
    "/api/copy": "POST",
    "/api/delete": "POST",
    "/api/show": "POST",
    "/api/tags": "GET",
    "/api/ls": "GET",
    "/api/stop": "POST",
    "/api/version": "GET",
    "/api/serve": "POST",
    "/api/unload": "POST",
    // OpenAI-compatible API endpoints
    "/v1/chat/completions": "POST",
    "/v1/completions": "POST",
    "/v1/models": "GET",
    "/v1/embeddings": "POST",
};
// Streaming endpoints (both native and OpenAI-compatible)
const streamingEndpoints = [
    "/api/chat",
    "/api/generate",
    "/v1/chat/completions",
    "/v1/completions",
];
// Long-running endpoints that need extended timeouts
const longRunningEndpoints = [
    "/api/pull",
    "/api/push",
    "/api/create",
    "/api/show",
];
// Helper to match endpoint (ignores query params)
function getEndpoint(path) {
    const match = Object.keys(endpointMethodMap).find((ep) => path.startsWith(ep));
    return match;
}
// Middleware setup - keeping it simple like your working version
app.use(express.json({ limit: OLLAMA_PROXY_REQUEST_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: OLLAMA_PROXY_REQUEST_BODY_LIMIT }));
// Fallback middleware for parsing raw bodies as JSON - exactly like your working version
app.use((req, res, next) => {
    // Only apply to /api/* and /v1/* POST requests
    if (req.path.startsWith("/api/") || req.path.startsWith("/v1/")) {
        // Check if body is already parsed (has Content-Type: application/json)
        if (req.body !== undefined && !Buffer.isBuffer(req.body)) {
            return next();
        }
        // If body is a Buffer (raw), try to parse as JSON
        if (req.body && Buffer.isBuffer(req.body)) {
            try {
                req.body = JSON.parse(req.body.toString());
            }
            catch (err) {
                res.status(400).json({ error: "Invalid JSON body" });
            }
        }
    }
    next();
});
app.get("/", (req, res) => {
    res.json({
        status: "running",
        message: "Ollama Proxy Server is running!",
        timestamp: new Date().toISOString(),
    });
});
// Catch-all for /api/* and /v1/* - enhanced version of your working handler
const handler = async (req, res) => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    const endpoint = getEndpoint(req.path);
    if (!endpoint) {
        return res.status(404).json({ error: "Unknown endpoint" });
    }
    const method = endpointMethodMap[endpoint];
    // Determine timeout - longer for certain endpoints
    const isLongRunning = longRunningEndpoints.includes(endpoint);
    const timeout = isLongRunning
        ? 3 * OLLAMA_PROXY_REQUEST_TIMEOUT
        : OLLAMA_PROXY_REQUEST_TIMEOUT; // 5 minutes vs 2 minutes
    // Streaming endpoints: only if body contains stream: true
    let isStreaming = false;
    if (streamingEndpoints.includes(endpoint) &&
        req.body &&
        typeof req.body === "object") {
        // For POST, check body for stream: true
        isStreaming = req.body.stream === true;
    }
    // Prepare options for proxy request - keeping it simple but adding key improvements
    let proxyHeaders = { ...req.headers };
    // Remove content-length and transfer-encoding for re-stringified body
    delete proxyHeaders["host"];
    delete proxyHeaders["content-length"];
    delete proxyHeaders["transfer-encoding"];
    // Always set content-type for POST requests to avoid issues
    if (method === "POST") {
        proxyHeaders["content-type"] = "application/json";
    }
    const options = {
        hostname: OLLAMA_HOST,
        port: OLLAMA_PORT,
        path: req.originalUrl,
        method,
        headers: proxyHeaders,
        timeout: timeout,
    };
    console.log(`[${requestId}] Proxying ${method} request to ${options.hostname}:${options.port}${options.path}`);
    console.log(`[${requestId}] Streaming: ${isStreaming}, Timeout: ${timeout}ms`);
    // Proxy the request - keeping your working pattern
    const proxyReq = http.request(options, (proxyRes) => {
        console.log(`[${requestId}] Received response: ${proxyRes.statusCode} (${Date.now() - startTime}ms)`);
        // Add CORS headers to the response
        const responseHeaders = { ...proxyRes.headers };
        responseHeaders["access-control-allow-origin"] = "*";
        responseHeaders["access-control-allow-methods"] = "GET, POST, OPTIONS";
        responseHeaders["access-control-allow-headers"] =
            "Content-Type, Authorization";
        // Forward status and headers
        res.writeHead(proxyRes.statusCode || 500, responseHeaders);
        // Stream response - exactly like your working version
        proxyRes.pipe(res);
        proxyRes.on("end", () => {
            console.log(`[${requestId}] Response complete (${Date.now() - startTime}ms)`);
        });
    });
    proxyReq.on("timeout", () => {
        console.error(`[${requestId}] Proxy request timed out after ${timeout}ms`);
        proxyReq.destroy();
        // Only send error response if headers haven't been sent yet
        if (!res.headersSent) {
            res.status(504).json({ error: "Request timeout", requestId });
        }
        else {
            // If headers already sent, end the response
            res.end();
        }
    });
    // Handle request cleanup - exactly like your working version
    req.on("error", (err) => {
        console.error(`[${requestId}] Request stream error:`, err);
        proxyReq.destroy();
    });
    proxyReq.on("error", (err) => {
        console.error(`[${requestId}] Proxy error: ${err.message}`);
        // Only send error response if headers haven't been sent yet
        if (!res.headersSent) {
            // Enhanced error messages
            let statusCode = 502;
            let errorMessage = "Proxy error";
            if (err.message.includes("ECONNREFUSED")) {
                statusCode = 503;
                errorMessage = "Ollama service unavailable";
            }
            else if (err.message.includes("socket hang up")) {
                statusCode = 502;
                errorMessage = "Connection closed unexpectedly";
            }
            res.status(statusCode).json({
                error: errorMessage,
                details: err.message,
                requestId,
            });
        }
        else {
            // If headers already sent, end the response
            res.end();
        }
    });
    // Forward body for POST endpoints - exactly like your working version
    if (method === "POST" && req.body) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.write(bodyData);
    }
    proxyReq.end();
};
// CORS preflight handler
app.options("{*path}", (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.sendStatus(200);
});
// Catch-all for /api/* and /v1/* - using multiple approaches for compatibility
app.all("/api/*path", handler);
app.all("/v1/*path", handler);
// Fallback routes for older Express versions or different path-to-regexp behavior
app.all(/^\/api\/.*/, handler);
app.all(/^\/v1\/.*/, handler);
app.listen(OLLAMA_PROXY_PORT, () => {
    console.log(`🚀 Ollama Proxy Server listening on port ${OLLAMA_PROXY_PORT}`);
    console.log(`📡 Proxying to Ollama at ${OLLAMA_HOST}:${OLLAMA_PORT}`);
});
export default app;
