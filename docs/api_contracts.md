# Thyla — API Contracts

> **Version:** 2.0.0  
> **Status:** Production Implementation Design  

---

## 1. Authentication Model (Unchanged Core)
- JWT Bearer for users (`RS256` keys).
- API Keys for programmatic (`X-API-Key`) utilizing fast Redis prefix+hash caching for instant resolution.

---

## 2. Session Execution APIs

### 2.1 Webhook & Async Channel Ingestion
For driving background processing through Thyla's Celery Queues. Guaranteed delivery via Inbox models perfectly resolving concurrent inputs.

```http
POST /v1/sessions/{session_id}/inbox
Authorization: X-API-Key: thyla_live_...

{
  "channel": "webhook",
  "message": "Process order hook.",
  "metadata": {"source": "stripe"}
}
```
**Response: 202 Accepted**
```json
{
  "status": "enqueued",
  "queue_position": 1
}
```
*Architecture Note:* This drops the payload exclusively onto the Redis `:inbox` list and triggers the sequential celery worker. It entirely avoids "HTTP 409 Locks" if the agent is actively executing prior logic.

### 2.2 Synchronous Stream Connection (WebSocket)

```
WSS /v1/ws/stream
```
WebSockets connect solidly to the API server executing the agent payload in the localized `asyncio` task. 

Payloads map standard unified JSON schemas over the socket:
```json
// Server emits batched chunks (Buffer driven)
{
  "event": "session.streaming_chunk",
  "chunk": "Here is the status of ",
  "is_final": false
}
```

---

## 3. RAG Collections

```http
POST /v1/knowledge/collections/{tag}/documents
Content-Type: multipart/form-data
```
Documents are pushed asynchronously into the central `global_knowledge_chunks` Milvus index using the `tenant_id` PartitionKey target silently managed by backend middlewares enforcing strict isolation logic.

---

## 4. Rate Limiting 

Strict bounds evaluated by Redis Sliding Windows.

| Route Group | Limit | Window |
|---|---|---|
| `POST /sessions/*/inbox` | 100 | 1 minute |
| `WSS /ws/stream` | 30 | 1 minute |
| All other endpoints | 300 | 1 minute |

Limit headers sent on every REST response explicitly.
