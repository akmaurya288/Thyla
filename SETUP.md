# Thyla - Setup and Run Instructions

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Redis 7+ (optional - for session persistence)
- Docker (optional - for containerized setup)

## Quick Start (Without Redis)

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Run Standalone Test

This tests the core execution engine without requiring Redis or the API server:

```bash
npm run test-standalone
```

Expected output:
```
=== Thyla Standalone Test ===

Graph configuration:
{
  "nodes": [...],
  "edges": [...]
}

---

Graph validation passed

Executing graph...

[OutputNode] Output: Mock LLM response to: "What is the capital of France?"
Execution results:
{
  "input": "What is the capital of France?",
  "llm": "Mock LLM response to: \"What is the capital of France?\"",
  "output": "Mock LLM response to: \"What is the capital of France?\""
}

---

✅ Test completed successfully!

=== Test Complete ===
```

### 3. Start API Server (Without Redis)

The server will run without Redis for session persistence:

```bash
npm run dev
```

Expected output:
```
Redis connection failed, running without session persistence
Error: connect ECONNREFUSED 127.0.0.1:6379
Thyla API server running on port 3000
WebSocket endpoint: ws://localhost:3000/stream
```

The server is now running at `http://localhost:3000`

## With Redis (Recommended for Production)

### 1. Start Redis

Using Docker:
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

Or install Redis locally:
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu
sudo apt-get install redis-server
sudo systemctl start redis
```

### 2. Start API Server

```bash
cd backend
npm run dev
```

Expected output:
```
Redis connected successfully
Thyla API server running on port 3000
WebSocket endpoint: ws://localhost:3000/stream
```

## API Endpoints

### POST /api/execute

Execute a graph and get results.

**Request:**
```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-1",
    "userId": "user-123",
    "input": "Hello, how are you?",
    "graph": {
      "nodes": [
        {
          "id": "input",
          "type": "input",
          "config": {
            "outputKey": "user_message",
            "value": "Hello, how are you?"
          }
        },
        {
          "id": "llm",
          "type": "llm",
          "config": {
            "inputKey": "user_message",
            "outputKey": "llm_response"
          }
        },
        {
          "id": "output",
          "type": "output",
          "config": {
            "inputKey": "llm_response"
          }
        }
      ],
      "edges": [
        {
          "from": "input",
          "to": "llm",
          "outputKey": "user_message",
          "inputKey": "user_message"
        },
        {
          "from": "llm",
          "to": "output",
          "outputKey": "llm_response",
          "inputKey": "input"
        }
      ]
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "results": {
    "input": "Hello, how are you?",
    "llm": "Mock LLM response to: \"Hello, how are you?\"",
    "output": "Mock LLM response to: \"Hello, how are you?\""
  },
  "sessionId": "test-session-1"
}
```

### GET /api/session/:sessionId

Get session state (requires Redis).

```bash
curl http://localhost:3000/api/session/test-session-1
```

### GET /api/session/:sessionId/history

Get conversation history (requires Redis).

```bash
curl http://localhost:3000/api/session/test-session-1/history
```

### DELETE /api/session/:sessionId

Delete a session (requires Redis).

```bash
curl -X DELETE http://localhost:3000/api/session/test-session-1
```

### WebSocket /stream

Connect for streaming execution.

**JavaScript Example:**
```javascript
const ws = new WebSocket('ws://localhost:3000/stream');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'execute',
    sessionId: 'test-session-1',
    userId: 'user-123',
    input: 'Hello, how are you?',
    graph: {
      nodes: [
        {
          "id": "input",
          "type": "input",
          "config": {
            "outputKey": "user_message",
            "value": "Hello, how are you?"
          }
        },
        {
          "id": "llm",
          "type": "llm",
          "config": {
            "inputKey": "user_message",
            "outputKey": "llm_response"
          }
        },
        {
          "id": "output",
          "type": "output",
          "config": {
            "inputKey": "llm_response"
          }
        }
      ],
      "edges": [
        {
          "from": "input",
          "to": "llm",
          "outputKey": "user_message",
          "inputKey": "user_message"
        },
        {
          "from": "llm",
          "to": "output",
          "outputKey": "llm_response",
          "inputKey": "input"
        }
      ]
    }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};
```

## Docker Setup

### Using docker-compose

```bash
docker-compose up
```

This starts:
- API server on port 3000
- Redis on port 6379
- PostgreSQL on port 5432

### Manual Docker Build

```bash
# Build the API image
docker build -t thyla-api ./backend

# Run the API container
docker run -p 3000:3000 \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  thyla-api
```

## Graph Definition Format

Graphs are defined as JSON with nodes and edges:

```json
{
  "nodes": [
    {
      "id": "unique-id",
      "type": "node-type",
      "config": {
        "node-specific-config": "value"
      }
    }
  ],
  "edges": [
    {
      "from": "source-node-id",
      "to": "target-node-id",
      "outputKey": "source-output-key",
      "inputKey": "target-input-key"
    }
  ]
}
```

### Available Node Types

- **input**: Injects input into the graph
  - `outputKey`: Key to set in context
  - `value`: Value to set (or use `input` from context)

- **llm**: Processes text through LLM (mocked by default)
  - `inputKey`: Key to read from context
  - `outputKey`: Key to write to context
  - `model`: Model name (default: "mock")

- **output**: Outputs the final result
  - `inputKey`: Key to read from context

## Building for Production

```bash
cd backend
npm run build
npm start
```

This compiles TypeScript to JavaScript and runs the production build.

## Troubleshooting

### Redis Connection Failed

If you see "Redis connection failed, running without session persistence":
- Redis is not running (optional for basic functionality)
- Start Redis if you need session persistence
- Or continue without Redis (sessions won't persist)

### Port Already in Use

If port 3000 is already in use:
```bash
PORT=3001 npm run dev
```

### TypeScript Errors

If you see TypeScript errors:
```bash
npm run build
```

This will show compilation errors. Fix them before running.

## Development

### Adding a New Node

1. Create a new class in `backend/nodes/` extending `BaseNode`
2. Implement the `execute` method
3. Register the node in `backend/api/server.ts` in the node registry

Example:
```typescript
import { BaseNode } from '../core/BaseNode';
import { ExecutionContext, NodeResult } from '../types';

export class CustomNode extends BaseNode {
  async execute(context: ExecutionContext): Promise<NodeResult> {
    const input = this.getInput(context, 'input');
    const output = process(input);
    this.setOutput(context, 'output', output);
    return { success: true, output };
  }
}
```

Then register:
```typescript
const nodeRegistry = new Map<string, new (config: any) => Node>([
  ['input', InputNode],
  ['llm', LLMNode],
  ['output', OutputNode],
  ['custom', CustomNode]  // Add this
]);
```

## Testing

Run the standalone test to verify the execution engine:
```bash
npm run test-standalone
```

## Project Structure

```
thyla/
├── backend/
│   ├── api/              # REST API and WebSocket server
│   ├── channels/         # Channel adapters
│   ├── core/             # Execution engine
│   ├── examples/         # Example graphs and tests
│   ├── nodes/            # Node implementations
│   ├── orchestrator/     # Graph orchestration
│   ├── state/            # Session management
│   └── types/            # TypeScript types
├── docker-compose.yml
└── README.md
```
