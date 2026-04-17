# Thyla

Node-based AI Agent Execution Engine

## Project Structure

```
thyla/
├── backend/
│   ├── api/              # API layer (REST + WebSocket)
│   │   ├── routes.ts     # Express route handlers
│   │   ├── streaming.ts  # WebSocket streaming server
│   │   └── server.ts     # Main server setup
│   ├── channels/         # Channel adapters for different platforms
│   │   ├── ChannelAdapter.ts    # Base channel interface
│   │   └── WebChatAdapter.ts     # Web chat implementation
│   ├── core/             # Core execution engine
│   │   ├── ExecutionContext.ts  # Execution context with state
│   │   ├── Graph.ts              # Graph structure and topological sort
│   │   ├── BaseNode.ts           # Base node class
│   │   └── StreamingHandler.ts   # Token batching for streaming
│   ├── examples/         # Example workflows
│   │   ├── simple-graph.json     # Sample graph definition
│   │   └── minimal-flow.ts       # Runnable minimal example
│   ├── nodes/            # Node implementations
│   │   ├── InputNode.ts          # Input node
│   │   ├── LLMNode.ts            # LLM node (mocked)
│   │   └── OutputNode.ts         # Output node
│   ├── orchestrator/     # Graph orchestration
│   │   └── GraphExecutor.ts      # Graph execution engine
│   ├── state/            # State management
│   │   ├── RedisClient.ts        # Redis client wrapper
│   │   └── SessionManager.ts     # Session & conversation history
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts              # Core type interfaces
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── index.ts          # Entry point
├── frontend/             # Frontend application (placeholder)
├── infra/               # Infrastructure configurations
├── docker-compose.yml
└── README.md
```

## Folder Purposes

- **backend/api**: REST API endpoints and WebSocket streaming server
- **backend/channels**: Abstractions for different communication platforms (web chat, Slack, etc.)
- **backend/core**: Core execution engine including graph structure, context management, and node base classes
- **backend/examples**: Sample graph definitions and runnable examples
- **backend/nodes**: Concrete node implementations (input, LLM, output, and custom nodes)
- **backend/orchestrator**: Graph execution engine with node registry and validation
- **backend/state**: Session management, Redis integration, and conversation history with sliding window
- **backend/types**: TypeScript interfaces and type definitions
- **frontend**: Frontend application (placeholder for future implementation)
- **infra**: Infrastructure configurations (Kubernetes, Terraform, etc.)

## Quick Start

### Prerequisites

- Node.js 18+
- Redis 7+
- Docker (optional)

### Local Development

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Start Redis**
   ```bash
   docker run -d -p 6379:6379 redis:7-alpine
   ```

3. **Run the minimal example**
   ```bash
   npm run example
   ```

4. **Start the API server**
   ```bash
   npm run dev
   ```

The API server will be available at `http://localhost:3000`

### Docker Setup

1. **Start all services**
   ```bash
   docker-compose up
   ```

2. **Services started**
   - API: http://localhost:3000
   - Redis: localhost:6379
   - PostgreSQL: localhost:5432

## API Endpoints

### REST API

- `POST /api/execute` - Execute a graph
- `GET /api/session/:sessionId` - Get session state
- `DELETE /api/session/:sessionId` - Delete session
- `GET /api/session/:sessionId/history` - Get conversation history
- `GET /health` - Health check

### WebSocket

Connect to `ws://localhost:3000/stream` for streaming execution.

Message format:
```json
{
  "type": "execute",
  "sessionId": "session-123",
  "userId": "user-456",
  "graph": { ... },
  "input": "Hello"
}
```

## Graph Definition

Graphs are defined as JSON:

```json
{
  "nodes": [
    {
      "id": "input",
      "type": "input",
      "config": {
        "inputKey": "user_message",
        "value": "Hello"
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
```

## Core Components

### ExecutionContext

Manages execution state for a single graph execution:
- Session and user tracking
- Key-value state storage
- Metadata support

### Graph

Directed acyclic graph (DAG) structure:
- Topological sorting for execution order
- Cycle detection
- Edge-based data flow

### Node Interface

All nodes implement:
```typescript
interface Node {
  id: string;
  type: string;
  config: Record<string, any>;
  execute(context: ExecutionContext): Promise<NodeResult>;
}
```

### SessionManager

Handles session state and conversation history:
- Redis-backed storage
- Sliding window for conversation history (default: 50 messages)
- Session creation, retrieval, and deletion

### StreamingHandler

Token batching for streaming responses:
- Configurable batch size
- Time-based flushing
- Callback-based chunk delivery

## Execution Flow

1. User sends message via API or WebSocket
2. Session is created or retrieved
3. User message is added to conversation history
4. Graph is validated and executed in topological order
5. Each node receives inputs from predecessor nodes
6. LLM nodes can stream responses via callbacks
7. Assistant response is added to conversation history
8. Results are returned to client

## Development

### Adding a New Node

1. Create a new class extending `BaseNode` in `backend/nodes/`
2. Implement the `execute` method
3. Register the node in the node registry in `api/server.ts`

```typescript
export class CustomNode extends BaseNode {
  async execute(context: ExecutionContext): Promise<NodeResult> {
    const input = this.getInput(context, 'input');
    // Process input
    const output = process(input);
    this.setOutput(context, 'output', output);
    return { success: true, output };
  }
}
```

### Adding a New Channel

1. Extend `BaseChannelAdapter` in `backend/channels/`
2. Implement `sendMessage`, `onMessage`, and `close` methods
3. Integrate with the API layer

## License

MIT
