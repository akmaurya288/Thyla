# Thyla — System Overview

> **Version:** 2.0.0  
> **Status:** Production Implementation Design  
> **Classification:** Principal Architecture Document

---

## 1. Executive Summary

Thyla is a **multi-channel AI agent orchestration platform** built for high-throughput, real-time, and asynchronous production workloads. It enables developers and businesses to visually design, deploy, and manage AI agents using a node-based graph execution engine.

Thyla is designed around core stability and isolation principles:

| Principle | Implication |
|---|---|
| **Dual Execution Model** | Real-time channels (Voice/WebSockets) run in-memory; Async channels (Email/WhatsApp) run via queues. |
| **Strict Multi-Tenancy** | Mathematical data isolation at every layer: PostgreSQL RLS, Redis keyspacing, and Milvus PartitionKeys. |
| **Bounded Statefulness** | Session memory is summarized and rolling; states are diff-patched to prevent memory bloat and I/O saturation. |
| **Observability First** | Every node transition, token emission, and network hop is traced via OpenTelemetry. |

---

## 2. High-Level Architecture

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                              THYLA PLATFORM                                  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                        CLIENT LAYER                                    │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │  │
│  │  │  Builder UI  │  │  Web Chat    │  │  Voice/LiveKit│  │ WhatsApp/ │  │  │
│  │  │  (REST)      │  │  (WebSocket) │  │  (WebRTC)     │  │ Webhooks  │  │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘  │  │
│  └─────────┼─────────────────┼─────────────────┼────────────────┼────────┘  │
│            │                 │                 │                │            │
│  ┌─────────▼─────────────────▼─────────────────▼────────────────▼────────┐  │
│  │                      API GATEWAY / EDGE                                │  │
│  │        (Auth · Rate Limiting · Tenant Resolution · Routing)            │  │
│  │                                                                        │  │
│  │     ┌─────────────────────────────────────────────────────┐            │  │
│  │     │                CHANNEL ADAPTERS                     │            │  │
│  │     └────────┬─────────────────────────┬──────────────────┘            │  │
│  └──────────────┼─────────────────────────┼──────────────────────────────┘  │
│                 │ (Streamable)            │ (Async)                          │
│  ┌──────────────▼────────────┐    ┌───────▼──────────────────────────────┐  │
│  │      STREAMER NODES       │    │          MESSAGE QUEUE (Redis)       │  │
│  │   (Real-time Execution)   │    └───────┬──────────────────────────────┘  │
│  │  Runs WebSockets, Voice   │            │                                  │
│  └──────────────┬────────────┘    ┌───────▼──────────────────────────────┐  │
│                 │                 │      BACKGROUND WORKERS (Celery)     │  │
│                 │                 │    (Async Execution, Email, API)     │  │
│                 │                 └───────┬──────────────────────────────┘  │
│                 └───────────┬─────────────┘                                  │
│                             │                                                │
│  ┌──────────────────────────▼─────────────────────────────────────────────┐  │
│  │                    ORCHESTRATION ENGINE & NODES                        │  │
│  │    Graph Executor · Streaming Buffer · Variable Scopes · Summarizer    │  │
│  └──────┬──────────────┬──────────────┬────────────────┬──────────────────┘  │
│         │              │              │                │                      │
│  ┌──────▼──────────────▼──────────────▼────────────────▼──────────────────┐  │
│  │                         DATA LAYER                                      │  │
│  │     PostgreSQL    │      Redis      │      Milvus     │      S3        │  │
│  │  (Cold/RLS SQL)   │ (Hot State/Q's) │ (PartitionKeys) │ (Blobs/Docs)   │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Delivery Models

To support both low-latency voice and long-running email agents, the execution paths are strictly isolated based on channel requirements.

### 3.1 Real-Time Streaming Path (Sync)
- **Channels**: WebSockets (Web Chat), WebRTC (LiveKit Voice).
- **Execution**: Runs directly inside long-lived `asyncio` tasks on the API servers (Streamer Nodes).
- **Why**: Ensures zero queuing latency. STT pipes direct to LLM tokens, buffered and flushed immediately to the client connection without hopping through message brokers.

### 3.2 Background Queue Path (Async)
- **Channels**: WhatsApp, Email, Webhooks.
- **Execution**: Pushed to a Redis queue and picked up by horizontal Celery/Worker nodes.
- **Why**: Guarantees delivery, enables exponential backoff, and frees API gateway nodes from maintaining state for offline/asynchronous workflows.

---

## 4. State Management Principle

State bloat kills distributed orchestration. Writing a massive JSON context object to Redis on every execution hop leads to catastrophic network I/O saturation.

Thyla splits state into distinct tiers:
1. **Lightweight Session Metadata (`redis:string`)**: Current node, active step, wait status. Written on node completion.
2. **Conversation History (`postgres:table` + Summary)**: Full turns are appended to a Postgres table asynchronously. The hot context holds only a sliding window (last $N$ messages) and a text summary of older context.
3. **Transient Variables (`redis:hash`)**: Internal node variables are saved via targeted Redis hash operations (`HSET`). Only changed variables are sent over the wire.

---

## 5. RAG System Strategy

- **Vector Database (Milvus)**: A **single, global collection partitioned by Tenant ID** (`PartitionKey`). This prevents cluster metadata collapse caused by one-collection-per-tenant architectures.
- **Retrieval Pipeline**: Bypasses heavy LLM-based categorization for initial topic routing; uses lightning-fast ONNX classifiers embedded in workers, routing direct to Milvus HNSW indexes.

---

## 6. Concurrency & Event Handling

Race conditions on agent "resume" signals (e.g., a webhook payload arriving simultaneously with a user chat message) are handled via **queue-based sequential execution**.
- No session locking that drops external events (e.g. throwing HTTP 409) is used.
- Instead, inbound signals are pushed to a `t:{tenant_id}:session:{session_id}:inbox` queue.
- The executor drains the queue sequentially.

---

## 7. Tech Stack Overview

| Domain | Technology | Use Case |
|---|---|---|
| **API Edge / Streamers** | Python FastAPI / Uvicorn | High-concurrency async IO, WebSockets, LiveKit events |
| **Background Workers** | Celery + Redis | Long-running asynchronous workflows, webhooks |
| **Orchestrator** | LangGraph (Custom fork/wrapper) | Graph traversal, node branching, checkpointing |
| **Data: Primary** | PostgreSQL 16 | Relational data, RLS multi-tenancy, audit logs |
| **Data: Hot State** | Redis 7 | Hot session lookups, throttling, queuing |
| **Data: Vector** | Milvus 2.4 | Single collection `PartitionKey` sharding |
| **Observability** | OTel, Prom, Loki, Tempo | Traces, metrics, logging |
| **Frontend** | React 18, Zustand, React Flow | Graph builder, dashboard |

## 8. Document Index

This module overrides prior specifications into executable engineering guides:
- `execution_engine.md`: Split-path executor, fractional state, batch streaming.
- `node_system.md`: Subprocess-based function nodes, enforced schemas.
- `rag_system.md`: PartitionKey Milvus architecture, ONNX topic classifiers.
- `database_schema.md`: Postgres and Redis DDL definitions.
- `channel_adapters.md`: Real-time vs queued routing adapters.
- `api_contracts.md`: Interface definitions.
- `observability.md`, `deployment.md`, `security.md`, `plugin_system.md`, `frontend_architecture.md`.
