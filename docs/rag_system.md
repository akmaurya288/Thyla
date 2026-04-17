# Thyla — RAG System

> **Version:** 2.0.0  
> **Status:** Production Implementation Design  

---

## 1. Overview

Thyla's Retrieval-Augmented Generation (RAG) system operates on a practical, high-throughput pipeline designed for immense scale. Critically, **it uses a single-collection, PartitionKey architectural approach internally in the vector DB** to support arbitrary tenant scaling without metadata load fragmentation. 

Additionally, the retrieval path abandons heavy, high-latency LLM-routing, instead utilizing strict metadata filtering and rapid local heuristics.

---

## 2. Multi-Tenancy Architecture (Milvus PartitionKey)

Using thousands of individual Milvus collections (one per tenant) causes `etcd` backend failure in production. Thyla structures vector data within a **single global Milvus collection** leveraging physical segmentation via `PartitionKey`.

### 2.1 The Schema definition
Collection Name: `global_knowledge_chunks`

| Field | Type | Index | Properties |
|---|---|---|---|
| `chunk_id` | VARCHAR(36) | Primary | Auto-generated UUID |
| `tenant_id` | VARCHAR(36) | Scalar | **Set as `is_partition_key=True`** |
| `collection_tag` | VARCHAR(64) | Scalar | Sub-grouping within a tenant |
| `content` | VARCHAR(65535) | — | Raw passage text |
| `embedding` | FLOAT_VECTOR(3072) | HNSW | Search vector |
| `metadata_json` | VARCHAR(4096) | — | Flexible JSON map for filters |

### 2.2 How it isolates
Queries against the database *must* supply the `tenant_id` filter. Milvus intercepts the PartitionKey, bypasses global search, and only scans the highly localized HNSW segments associated directly with that tenant's key. 

```python
# Milvus Query Execution
res = milvus_client.search(
    collection_name="global_knowledge_chunks",
    data=[query_embedding],
    expr=f"tenant_id == '{ctx.tenant_id}' AND collection_tag in ['sales_docs']",
    limit=top_k
)
```

---

## 3. High-Speed Retrieval Pipeline

### Stage 1: Explicit Metadata Framing vs Heavy Routing
Instead of calling `gpt-4o-mini` to determine "which topic this is" (costing 300ms+), routing is declarative. The RAG node in the graph mandates explicitly which `collection_tags` are referenced based on the agent's deterministic workflow state.

*Fallback Classification (If Needed)*: Should dynamic query intent mapping be required, Thyla workers load a small, ONNX-optimized Zero-Shot classifier (e.g., `BART-large-MNLI` or lightweight embedding proximity) running locally in `<15ms`.

### Stage 2: Filtered Vector Search
Query embedding is generated and pushed against the partitioned HNSW index. Retrieving exactly `top_k * 2` variants for the reranking buffer.

### Stage 3: Cross-Encoder Re-Ranking
A local cross-encoder model (`cross-encoder/ms-marco-MiniLM-L-6-v2`) runs on the worker to synthetically score the `(query, passage)` tuple. 
- Fast inference.
- Eliminates contextually irrelevant passages right before prompt injection.
- Re-orders the top results explicitly.

### Stage 4: Injection
Summarized outputs are passed down into the node's variable output bounds, keeping standard context length limits enforced dynamically.

---

## 4. Ingestion & Chunking Optimization

The Worker background queues process uploads via Celery.

### Chunking Strategies
We optimize specifically for precision:
1. **Recursive Chunking (Default)**: Overlaps standard document splits via tokens/newline markers.
2. **Semantic Text Chunking**: Splits based on consecutive sentence distance markers (Cosine similarities dropping beneath threshold triggers new chunk). Better for unstructured narratives.

### Ingestion Flow
1. S3 trigger sends `document_id` to Celery `rag_ingest` queue.
2. Worker downloads doc, executes OCR / Tika text extraction.
3. Text is bucketed via Chunking Strategy.
4. Chunks are batched in groups of 1024, embedded asynchronously via OpenAI/Cohere APIs.
5. Emitted natively to Milvus using the `tenant_id` PartitionKey target.

---

## 5. RAG Caching Strategy

Semantic queries have high repetition for FAQ-style agents. Caching is executed at the exact embedding match layer.

```python
def generate_cache_key(tenant_id: str, request_hash: str):
    return f"t:{tenant_id}:rag_cache:{request_hash}"
```
1. Cache entries hold the actual `ReturnedContextString` rather than simply document IDs to save re-instantiating the text prompt.
2. A document addition/deletion within a tenant's collection triggers a bulk asynchronous invalidation on all `t:{tenant_id}:rag_cache:*` keys in Redis to ensure freshness.
