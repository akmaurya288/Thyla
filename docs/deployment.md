# Thyla — Deployment

> **Version:** 2.0.0  
> **Status:** Production Implementation Design  

---

## 1. Service Inventory

The split execution model dictates concrete differentiation between deployment units scaling dynamically along unique thresholds.

| Service | Scalability Targets | Role |
|---|---|---|
| `thyla-streamer` | Auto-scales via CPU. Memory bound based on concurrent socket connections. | Runs WebSockets, LiveKit, REST. Executes agents in high-speed AsyncIO loops. |
| `thyla-worker` | Auto-scales via `thyla_inbox_queue_depth` metric exclusively. | Runs Celery background consumers tracking offline long-running agent workflows. |
| `thyla-sweeper` | Single Replica limit. | CRON Daemon traversing Postgres scanning for crashed transient graphs. |

## 2. Database Topology Rules
- **PostgreSQL**: Bound securely for relational connections tracking audit, config, and `conversation_turns` logs efficiently truncating dynamic session sizes.
- **Redis**: Clustered layout. High-memory throughput for Queue Inboxes (`LPUSH`/`RPOP`) and Hash variable mutations. 
- **Milvus**: Standard distributed mode. 1 Collection. Scales seamlessly leveraging underlying Etcd purely mapping chunk metadata avoiding high-collection constraints entirely.

## 3. Scaling Mechanics
Unlike complex stateful affinity models dropping websocket connections during re-deployment cycles, Thyla cleanly segregates concerns: Streamers terminate standard external requests and complete connections independently using the localized Redis state for transient recovery. Workers can be scaled rapidly up/down from 1 -> 50 instances safely based purely on incoming background load dynamically isolated from core user chat latency metrics.
