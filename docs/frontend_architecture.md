# Thyla — Frontend Architecture

> **Version:** 2.0.0  
> **Status:** Production Implementation Design  

---

## 1. Overview

The interface for Thyla remains a declarative Node-editor rendering visually over standard API schemas. Written exclusively in React Flow + Zustand.

## 2. Graph Rendering Interactions

### 2.1 The Streaming UI Debugger
Due to backend optimization changes buffering tokens into sequential textual blocks, the debugger interface updates `session.debug` renders without thrashing React `state` trees excessively on single token updates.

### 2.2 Visual Node Types Configuration
Nodes generated dynamically based on JSON specifications are rendered safely without evaluating untrusted code natively in the browser mapping directly to Python execution behaviors.

### 2.3 RAG Controls
Interfaces abstract the Milvus `PartitionKey` architecture, simply displaying logical tags mapping directly to internal metadata filters. 

*Standard architectures apply across React routing, WebSockets to Streamers, and API calls mapping backend endpoints directly.*
