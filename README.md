# Ollama Proxy

A lightweight, high-performance proxy server that restores the original HTTP methods of the Ollama API. Developed primarily for RunPod environments where the built-in proxy strips original HTTP methods, but can be used with any hosting service.

## 🚀 Features

- **Full Ollama API Support**: Proxies all native Ollama endpoints (`/api/*`)
- **OpenAI Compatibility**: Supports OpenAI-compatible endpoints (`/v1/*`)
- **Streaming Support**: Handles streaming responses for chat and generation endpoints
- **CORS Enabled**: Built-in CORS support for cross-origin requests
- **Configurable Timeouts**: Extended timeouts for long-running operations
- **Error Handling**: Robust error handling with detailed logging
- **Environment Configuration**: Flexible configuration via environment variables
- **TypeScript**: Written in TypeScript with full type safety

## 📋 Supported Endpoints

### Native Ollama API Endpoints

- `POST /api/chat` - Chat completions
- `POST /api/generate` - Text generation
- `POST /api/embeddings` - Text embeddings
- `POST /api/pull` - Pull models
- `POST /api/push` - Push models
- `POST /api/create` - Create models
- `POST /api/copy` - Copy models
- `POST /api/delete` - Delete models
- `POST /api/show` - Show model info
- `GET /api/tags` - List models
- `GET /api/ls` - List models
- `POST /api/stop` - Stop operations
- `GET /api/version` - Get version
- `POST /api/serve` - Serve models
- `POST /api/unload` - Unload models

### OpenAI-Compatible Endpoints

- `POST /v1/chat/completions` - Chat completions
- `POST /v1/completions` - Text completions
- `GET /v1/models` - List models
- `POST /v1/embeddings` - Text embeddings

## 🛠️ Installation

### Using npx (Recommended)

```bash
npx ollama-proxy
```

### Using npm

```bash
npm install -g ollama-proxy
ollama-proxy
```

### From Source

```bash
git clone https://github.com/Jassu225/ollama-proxy.git
cd ollama-proxy
npm install
npm run build
npm start
```

## ⚙️ Configuration

Create a `.env` file in your project root or pass the env varialbes via hosting environment to customize the proxy settings:

```env
# Proxy Configuration
OLLAMA_PROXY_PORT=4000
OLLAMA_PROXY_REQUEST_TIMEOUT=120000 # 360000 (3 * ) for long running requests
OLLAMA_PROXY_REQUEST_BODY_LIMIT=50mb

# Ollama Server Configuration
OLLAMA_HOST=localhost
OLLAMA_PORT=11434
```

### Environment Variables

| Variable                          | Default     | Description                                 |
| --------------------------------- | ----------- | ------------------------------------------- |
| `OLLAMA_PROXY_PORT`               | `4000`      | Port for the proxy server                   |
| `OLLAMA_PROXY_REQUEST_TIMEOUT`    | `120000`    | Request timeout in milliseconds (2 minutes) |
| `OLLAMA_PROXY_REQUEST_BODY_LIMIT` | `50mb`      | Maximum request body size                   |
| `OLLAMA_HOST`                     | `localhost` | Ollama server hostname                      |
| `OLLAMA_PORT`                     | `11434`     | Ollama server port                          |

## 🚀 Usage

### Basic Usage

```bash
# Start the proxy server
npx ollama-proxy

# The server will start on port 4000 (or your configured port)
# Proxying requests to Ollama at localhost:11434
```

### Development Mode

```bash
# Clone the repository
git clone https://github.com/Jassu225/ollama-proxy.git
cd ollama-proxy

# Install dependencies
npm install

# Start in development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Testing the Proxy

Once the proxy is running, you can test it:

```bash
# Check if the proxy is running
curl http://localhost:4000

# Response:
# {
#   "status": "running",
#   "message": "Ollama Proxy Server is running!",
#   "timestamp": "2025-07-28T06:37:21.249Z"
# }
```

### Example API Calls

#### Native Ollama API

```bash
# Chat completion
curl -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama2",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'

# List models
curl http://localhost:4000/api/tags
```

#### OpenAI-Compatible API

```bash
# Chat completion
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama2",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'

# List models
curl http://localhost:4000/v1/models
```

## 🔧 Advanced Features

### Streaming Support

The proxy automatically handles streaming responses when `stream: true` is set in the request body:

```bash
curl -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama2",
    "messages": [{"role": "user", "content": "Tell me a story"}],
    "stream": true
  }'
```

### Extended Timeouts

Long-running operations (pull, push, create, show) automatically get extended timeouts (3x the normal timeout) to handle large model operations.

### CORS Support

The proxy includes built-in CORS headers for cross-origin requests:

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

## 🐛 Troubleshooting

### Common Issues

1. **Connection Refused (503)**

   - Ensure Ollama is running on the configured host and port
   - Check if `OLLAMA_HOST` and `OLLAMA_PORT` are correct

2. **Request Timeout (504)**

   - Increase `OLLAMA_PROXY_REQUEST_TIMEOUT` for long-running operations
   - Check network connectivity to Ollama server

3. **Invalid JSON Body (400)**
   - Ensure request body is valid JSON
   - Check `Content-Type` header is set to `application/json`

### Debug Mode

Enable detailed logging by setting the log level:

```bash
# Set log level (if supported by your environment)
export DEBUG=ollama-proxy:*
npx ollama-proxy
```

## 📊 Performance

- **Low Latency**: Direct proxy with minimal overhead
- **Memory Efficient**: Streams responses without buffering
- **Scalable**: Handles multiple concurrent requests
- **Reliable**: Robust error handling and recovery

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for RunPod environments where HTTP methods are stripped
- Compatible with any Ollama hosting service
- Inspired by the need for proper HTTP method preservation in proxy environments

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Jassu225/ollama-proxy/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Jassu225/ollama-proxy/discussions)
- **Email**: jaswanthsaisattenapalli@gmail.com

---

**Made with ❤️ for the Ollama community**
