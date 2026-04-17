# Thyla — Channel Adapters

> **Version:** 2.0.0  
> **Status:** Production Implementation Design  

---

## 1. Overview

Channel Adapters map varying external payload shapes (WhatsApp Webhooks, WebRTC Audio, Email SMTP) into the Thyla **Unified Message Schema (UMS)**.

Critically, channel adapters dictate the **Routing Path**: determining whether a session executes on the high-speed gateway Streamer loops, or the decoupled Background Worker queues.

---

## 2. Real-Time Channels (Streamer Path)

Channels requiring human-perceptible latency. State stays hot in the memory space of the gateway holding the sockets.

### 2.1 WebSockets (Web Chat)
- **Lifecycle Setup:** User opens socket `/ws/chat/{session_id}`. Gateway establishes connection, validates JWT.
- **Input Action:** JSON payload hits socket. Adapter converts to UMS.
- **Dispatch:** Gateway instantiates the Orchestration engine *directly in the local asyncio loop*. 
- **Output Action:** The engine's StreamingBuffer pushes `text_delta` batches natively to the socket reference.
- **Teardown:** Socket drops. Engine checkpoints to Redis/PostgreSQL and dies instantly safely.

### 2.2 LiveKit (WebRTC Voice)
Latency goal: < 500ms TTFT.
- **Flow:** User speaks over WebRTC track. The LiveKit server relays this natively to the connected Thyla `LiveKitWorker` process holding the SIP/Room session.
- **Processing:** `Silero VAD` cuts audio segments -> `Deepgram Nova-2` translates to transcript inside the stream -> UMS payload.
- **Execution:** Graph executed locally. Target buffered chunks flush.
- **Synthesis:** Target buffer piped directly into ElevenLabs streaming endpoint, raw PCM bits streamed directly back into LiveKit `LocalAudioTrack`.

---

## 3. Asynchronous Channels (Worker Path)

Channels where response urgency is low, burst loads are high, and external provider SLAs vary wildly.

### 3.1 Webhooks & WhatsApp
- **Trigger:** Gateway receives `POST /webhooks/wa`.
- **Validation:** Gateway runs basic regex and HMAC signature checks. Immediately responds `200 OK` to meta.
- **Routing Inbox Mechanism (Concurrency Safety):**
  - Gateway converts payload to UMS.
  - Gateway pushes UMS exclusively into Redis using `RPUSH t:{tenant_id}:sess:{session_id}:inbox`.
  - Gateway enqueues a Celery task `process_session_queue(session_id)`.
- **Execution:** 
  - Worker node pops the Celery task.
  - Checks the Redis inbox array, pops the message, drives the execution step.
  - Output pushes against Meta API endpoints.

### 3.2 Email Processing
- **Trigger Integration:** Polling jobs against IMAP folders, or processing SMTP webhooks via SendGrid. 
- **Threading Mapping:** `In-Reply-To` headers route back to the localized Thyla `session_id`. If omitted, generates new.
- Execution occurs exclusively in deep background workers prioritizing throughput over latency.

---

## 4. The Unified Inbox Advantage

By enforcing all asynchronous message routing into a Redis List per session (`:inbox`), the system inherently avoids locking conflicts.
- If two webhooks arrive identically, the gatekeeper places them sequentially in the List.
- The celery worker runs a `while LPOP(inbox)` loop. 
- Input is perfectly sequenced. No dropped webhooks via 409 locked constraints. 
