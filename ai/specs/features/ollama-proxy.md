# Ollama Proxy Server

## Product Requirements Document (PRD)

**Reference**: This feature aligns with the Master PRD at `/ai/specs/prd.md`

### Overview

A Node.js (TypeScript) proxy server that corrects HTTP methods for requests forwarded by Runpod’s proxy to the Ollama API. The proxy ensures the correct HTTP method and streaming support, enabling seamless use of Ollama from Runpod even when the platform’s proxy only supports GET requests.

### Alignment with Product Vision

This feature enables reliable, production-grade access to Ollama’s API from Runpod, overcoming platform limitations and supporting advanced AI workflows.

### Business Context

- **Problem statement:** Runpod’s proxy converts all requests to HTTP GET, breaking Ollama API usage.
- **Target users:** Developers running Ollama on Runpod who need full API access.
- **Success metrics:**
  - All Ollama endpoints work as intended via the proxy
  - Streaming endpoints (chat, generate) work with no perceptible lag
- **Business value:** Enables advanced AI workloads on Runpod with minimal friction.

### Core Requirements

- Must-have features:
  - Accept incoming requests and map to correct HTTP method
  - Forward requests to Ollama API with correct method, headers, and body
  - Support streaming for `/api/chat` and `/api/generate`
  - Return Ollama’s response (including streaming) to the client
  - Written in TypeScript using Express
- Nice-to-have features:
  - Basic logging
  - Rate limiting
  - Configurable endpoint-method map
- Out of scope:
  - Authentication
  - Advanced security (beyond basic protections)

## User Stories

- As a developer, I want to call any Ollama API endpoint from outside Runpod and have the proxy correct the HTTP method so my requests succeed.
- As a developer, I want streaming endpoints to work seamlessly so I can build real-time chat UIs.

## Acceptance Criteria

- Given a GET request to the proxy for `/api/chat`, when the proxy forwards it as POST to Ollama, then the response is streamed back to the client.
- Given a GET request to `/api/tags`, when the proxy forwards it as GET to Ollama, then the list of models is returned.
- All supported endpoints and methods are handled as per the endpoint-method map.

## Technical Requirements

- **Functional requirements:**
  - Express server in TypeScript
  - Endpoint-method map (see below)
  - Forwards headers and body as appropriate
  - Handles streaming responses
- **Non-functional requirements:**
  - Minimal latency for streaming endpoints
  - Robust error handling (return Ollama errors to client)
- **Dependencies:**
  - Node.js (latest LTS)
  - Express
  - TypeScript
- **Performance criteria:**
  - Streaming responses must not be buffered; must be piped directly

## API Endpoints (Supported)

| Endpoint        | Method | Streaming |
| --------------- | ------ | --------- |
| /api/chat       | POST   | Yes       |
| /api/generate   | POST   | Yes       |
| /api/embeddings | POST   | No        |
| /api/pull       | POST   | No        |
| /api/push       | POST   | No        |
| /api/create     | POST   | No        |
| /api/copy       | POST   | No        |
| /api/delete     | POST   | No        |
| /api/show       | POST   | No        |
| /api/tags       | GET    | No        |
| /api/ls         | GET    | No        |
| /api/stop       | POST   | No        |
| /api/version    | GET    | No        |
| /api/serve      | POST   | No        |
| /api/unload     | POST   | No        |

## Database Changes

- None

## UI/UX Requirements

- None (API only)

## Test Requirements

- Unit tests for endpoint-method mapping logic
- Integration tests for proxying requests (including streaming)
- E2E tests for real-world usage (optional)
- Coverage requirements: 100%

## Development Phases

- Phase 1: Core proxy with endpoint-method map and streaming support
- Phase 2: Add logging and rate limiting
- Phase 3: Configurability and polish

## Risks & Mitigations

- **Risk:** Streaming not handled correctly → **Mitigation:** Use Node.js streams and test with large responses
- **Risk:** Ollama API changes → **Mitigation:** Keep endpoint-method map configurable
- **Risk:** Runpod proxy changes behavior → **Mitigation:** Document workaround and monitor platform updates
