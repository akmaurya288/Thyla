# Thyla

Node-based AI Agent Execution Engine with Visual Builder

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Redis 7+ (optional - for session persistence)
- Docker (optional - for containerized setup)

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Run Standalone Test (No Redis Required)

This tests the core execution engine:

```bash
npm run test-standalone
```

### 3. Start API Server

Without Redis (for local development):
```bash
npm run dev
```

With Redis (recommended for production):
```bash
# Start Redis first
docker run -d -p 6379:6379 redis:7-alpine

# Then start the server
npm run dev
```

The API server will be available at `http://localhost:3000`

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 3. Use the UI

1. Drag nodes from the palette to the canvas
2. Connect nodes by dragging from handles
3. Select nodes to configure them
4. Click "Run Agent" to execute
5. View results in the output console

## Running Both Services

To run both backend and frontend:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Detailed Setup Instructions

See [SETUP.md](SETUP.md) for comprehensive setup instructions including:
- Docker setup
- WebSocket usage
- Graph definition format
- Troubleshooting
- Development guide

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
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   │   ├── nodes/    # Custom React Flow nodes
│   │   │   ├── NodePalette.tsx
│   │   │   ├── ConfigPanel.tsx
│   │   │   ├── GraphCanvas.tsx
│   │   │   └── OutputConsole.tsx
│   │   ├── hooks/       # Custom React hooks
│   │   ├── services/     # API integration
│   │   ├── types/        # TypeScript types
│   │   ├── App.tsx       # Main application
│   │   └── main.tsx      # Entry point
│   └── package.json
├── docker-compose.yml
├── SETUP.md              # Detailed setup instructions
└── README.md
```

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
