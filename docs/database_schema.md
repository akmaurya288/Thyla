# Thyla — Database Schema

> **Version:** 2.0.0  
> **Status:** Production Implementation Design  

---

## 1. Overview

Thyla's storage spans three optimized engines:
1. **PostgreSQL** for relational metadata, security constraints, and cold archival state.
2. **Redis** for state diffs, queueing, session variables, and synchronization tracking.
3. **Milvus** exclusively engineered with PartitionKeys for scalable embedding management.

---

## 2. PostgreSQL Schema

### 2.1 Tenants and Row-Level Security
All operational tables define `tenant_id` bound to Postgres RLS policies. Connection contexts set the active tenant to eliminate application-layer leakage.

```sql
CREATE TABLE tenants (
    tenant_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            VARCHAR(128) UNIQUE NOT NULL,
    status          VARCHAR(32) DEFAULT 'active'
);

CREATE POLICY isolation_rule ON agents 
    USING (tenant_id = current_setting('app.tenant_id')::UUID);
```

### 2.2 Sessions and Truncated Conversation Archival
A significant risk in orchestration is memory bloat caused by logging massive dialogue histories directly inside the dynamic JSON session state. Thyla splits them.

```sql
-- The high-level map. State configuration is tiny JSON referencing pointers.
CREATE TABLE sessions (
    session_id          UUID PRIMARY KEY,               
    tenant_id           UUID NOT NULL REFERENCES tenants(tenant_id),
    agent_id            UUID NOT NULL REFERENCES agents(agent_id),
    status              VARCHAR(32) NOT NULL DEFAULT 'running',
    archived_state      JSONB NOT NULL DEFAULT '{}',
    updated_at          TIMESTAMPTZ DEFAULT now()
);

-- Archival Table: strictly stores historical context for logs and summary reconstruction
CREATE TABLE conversation_turns (
    turn_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID NOT NULL REFERENCES sessions(session_id),
    tenant_id           UUID NOT NULL REFERENCES tenants(tenant_id),
    role                VARCHAR(32) NOT NULL,
    content             TEXT NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_conversations_session ON conversation_turns(session_id, created_at DESC);
```

---

## 3. Redis State Layout

Redis serves as the dynamic context store. Full-state payload dumps are strictly avoided. Variables and context are targeted optimally.

```text
# Session Meta Properties
# Maintains execution bounds - lightweight pointer
SET t:{tenant_id}:sess:{session_id}:meta => '{"node":"llm_4", "status":"waiting"}'

# Session Transient Variables 
# Addressed via O(1) hashes. Nodes push diffs via HSET
HSET t:{tenant_id}:sess:{session_id}:vars "user_name" "Alice"
HSET t:{tenant_id}:sess:{session_id}:vars "extracted_intent" "refund"

# The Queue Inbox 
# Ensures incoming webhooks/messages never race condition. 
RPUSH t:{tenant_id}:sess:{session_id}:inbox '{"type":"webhook_payload", ...}'
```

---

## 4. Milvus Layout 

Thyla eliminates multi-collection overhead to retain `etcd` node stability. A single globally defined collection scales indefinitely while remaining mathematically isolated.

### Schema: `global_knowledge_chunks`

| Name | Type | Size Limit | Configuration |
|---|---|---|---|
| `chunk_id` | VARCHAR | 36 | `is_primary=True` |
| `tenant_id` | VARCHAR | 36 | **`is_partition_key=True`** |
| `collection_tag` | VARCHAR | 64 | Scalar index for strict filtering |
| `content` | VARCHAR | 65535 | Raw string extraction |
| `embedding` | FLOAT_VECTOR | 3072 | HNSW Index (Cosine) |

- **Partition Key isolation**: Instructs Milvus natively that queries will always route to the explicitly defined sub-partition assigned to `tenant_id`. Searches never bleed laterally into other partitions.
