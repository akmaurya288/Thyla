# Thyla — Observability

> **Version:** 2.0.0  
> **Status:** Production Implementation Design  

---

## 1. Stack Components
Remains completely built over standard OpenTelemetry tracing with Prometheus aggregates and Loki structured log ingestions.

## 2. Core Operational Metrics

With the shift toward explicit execution paths and inbox queues, observability shifts to monitor congestion states over standard process flows.

### 2.1 Critical Streaming Metrics 
Streamer Nodes operate natively terminating high-throughput WebSocket buffers.

```python
thyla_stream_buffer_flush_size      = Histogram() # Tracking payload chunk boundaries avoiding tiny single-byte socket ops
thyla_stream_flush_interval_ms      = Histogram() # Ensuring limits stay beneath perceptible streaming thresholds < 50ms.
```

### 2.2 Worker Congestion & Queue Safety
Tracking the async inbound flow against localized Celery background drains prevents webhook timeouts.
```python
thyla_inbox_queue_depth             = Gauge()     # Monitoring Redis list elements tracking buildup of concurrent webhooks on single sessions.
thyla_worker_task_latency_ms        = Histogram() # From webhook ingestion 202 accepted response to celery execution pickup. 
```

### 2.3 Reliability (The Sweeper)
Tracking the daemon responsible for restoring dropped workloads.
```python
thyla_sweeper_identifications_count = Counter()   # Tracks how many "zombie" sessions crashed before checkpoint execution completion.
thyla_sweeper_restorations_count    = Counter()   # Successful restores resuming graph states.
```

## 3. RAG Visibility
Tracking explicit ONNX classifier times and subset HNSW Partition searches. LLM categorization latency is stripped, simplifying debugging dramatically ensuring search execution resolves locally < 25ms.
