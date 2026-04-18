# Thyla Execution Engine Example

This guide demonstrates how to interact with the working Thyla Execution Engine via the REST API and WebSocket interfaces.

## Prerequisites

- Node.js (v18+)
- Redis running locally or via Docker
- Docker Compose (optional but recommended)

## Installation & Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Start supporting services (Redis):**
   ```bash
   # From the project root
   docker-compose up -d redis
   ```

3. **Start the Thyla Engine:**
   ```bash
   cd backend
   npm run dev
   ```

   The server will start on `http://localhost:3000` with the WebSocket endpoint available at `ws://localhost:3000/stream`.

## Testing the Engine

### 1. Execute via REST API
The REST API allows synchronous execution.

**Request:**
```bash
curl -X POST http://localhost:3000/api/execute \
-H "Content-Type: application/json" \
-d '{
  "sessionId": "test-session-123",
  "userId": "user-456",
  "input": "Explain quantum computing simply",
  "graph": {
    "nodes": [
      { "id": "in", "type": "input", "config": { "outputKey": "prompt_text" } },
      { "id": "llm", "type": "llm", "config": { "inputKey": "prompt_text", "outputKey": "bot_response" } },
      { "id": "out", "type": "output", "config": { "inputKey": "bot_response" } }
    ],
    "edges": [
      { "from": "in", "to": "llm" },
      { "from": "llm", "to": "out" }
    ]
  }
}'
```

**Response:**
```json
{
  "success": true,
  "results": {
    "out": "Mock LLM response to: \"Explain quantum computing simply\""
  },
  "sessionId": "test-session-123"
}
```

### 2. Stream Execution via WebSocket (Node.js Example)

The WebSocket interface streams the LLM response chunk by chunk as it computes.

**Test Script:**
Create a file `test-ws.js` and run it with `node test-ws.js`.
```javascript
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3000/stream');

ws.on('open', () => {
  console.log('Connected to Thyla Streamer');
  
  ws.send(JSON.stringify({
    type: 'execute',
    sessionId: 'stream-session-999',
    input: 'Hello world',
    graph: {
      nodes: [
        { id: 'n1', type: 'input', config: { outputKey: 'text' } },
        { id: 'n2', type: 'llm', config: { inputKey: 'text', outputKey: 'result' } },
        { id: 'n3', type: 'output', config: { inputKey: 'result' } }
      ],
      edges: [
        { from: 'n1', to: 'n2' },
        { from: 'n2', to: 'n3' }
      ]
    }
  }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  
  if (msg.type === 'start') {
    console.log(`[START] Session: ${msg.sessionId}`);
  } else if (msg.type === 'chunk') {
    process.stdout.write(msg.content);
    if (msg.done) console.log('\n[DONE]');
  } else if (msg.type === 'complete') {
    console.log('\n[COMPLETE] Output:', msg.results);
    ws.close();
  }
});
```
