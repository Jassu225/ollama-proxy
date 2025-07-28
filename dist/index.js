import express from "express";
import http from "http";
const app = express();
const PORT = process.env.PORT || 4000;
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
// Helper to match endpoint (ignores query params)
function getEndpoint(path) {
    const match = Object.keys(endpointMethodMap).find((ep) => path.startsWith(ep));
    return match;
}
// Middleware setup
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// Fallback middleware for parsing raw bodies as JSON
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
                console.error("Failed to parse raw body as JSON:", err);
            }
        }
    }
    next();
});
app.get("/", (req, res) => {
    res.send("Ollama Proxy Server is running!");
});
// Catch-all for /api/* and /v1/*
const handler = async (req, res) => {
    const endpoint = getEndpoint(req.path);
    if (!endpoint) {
        return res.status(404).json({ error: "Unknown endpoint" });
    }
    const method = endpointMethodMap[endpoint];
    // Streaming endpoints: only if body contains stream: true
    let isStreaming = false;
    if (streamingEndpoints.includes(endpoint) &&
        req.body &&
        typeof req.body === "object") {
        // For POST, check body for stream: true
        isStreaming = req.body.stream === true;
    }
    // Prepare options for proxy request
    let proxyHeaders = { ...req.headers };
    // Remove content-length and transfer-encoding for re-stringified body
    delete proxyHeaders["host"];
    delete proxyHeaders["content-length"];
    delete proxyHeaders["transfer-encoding"];
    // proxyHeaders["content-type"] = "application/json";
    const options = {
        hostname: "localhost",
        port: 11434,
        path: req.originalUrl,
        method,
        headers: proxyHeaders,
        timeout: 60000, // 30 second timeout
    };
    console.log(`Proxying ${method} request to ${options.hostname}:${options.port}${options.path}`);
    console.log(`Streaming: ${isStreaming}`);
    // Proxy the request
    const proxyReq = http.request(options, (proxyRes) => {
        console.log(`Received response: ${proxyRes.statusCode}`);
        // Forward status and headers
        console.log(`proxyRes.headers: ${JSON.stringify(proxyRes.headers)}`);
        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
        // Stream response
        proxyRes.pipe(res);
    });
    proxyReq.on("timeout", () => {
        console.error("Proxy request timed out");
        proxyReq.destroy();
        // Only send error response if headers haven't been sent yet
        if (!res.headersSent) {
            res.status(504).json({ error: "Request timeout" });
        }
        else {
            // If headers already sent, end the response
            res.end();
        }
    });
    // Handle request cleanup
    req.on("error", (err) => {
        console.error("Request stream error:", err);
        proxyReq.destroy();
    });
    proxyReq.on("error", (err) => {
        console.error(`Proxy error: ${err.message}`);
        req.destroy();
        // Only send error response if headers haven't been sent yet
        if (!res.headersSent) {
            res.status(502).json({ error: "Proxy error", details: err.message });
        }
        else {
            // If headers already sent, end the response
            res.end();
        }
    });
    // Forward body for POST endpoints
    if (method === "POST" && req.body) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.write(bodyData);
    }
    proxyReq.end();
};
// Catch-all for /api/* and /v1/*
app.all("/api{/*path}", handler);
app.all("/v1{/*path}", handler);
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
