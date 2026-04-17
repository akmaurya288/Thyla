# Thyla — Plugin System

> **Version:** 2.0.0  
> **Status:** Production Implementation Design  

---

## 1. Simplified Plugin Architecture

Over-engineering sandboxing through technologies like `gVisor` or embedding WebAssembly interpreters imposes extreme cold-starts into local execution flow, creating poor user experiences inside rapid real-time conversational agents. 

Thyla strips this optimization bloat. 

### 1.1 The Execution Sandbox Layer

Custom nodes (inclusive of user-written Python/Javascript transformations from the Builder GUI) execute natively invoking localized Subprocesses enforcing bounded system checks:

```python
class FunctionalSubprocessRunner:
    async def run(self, code_payload: str, context: dict):
        # Local ephemeral Python process
        # Bounded heavily by resource OS limits (ulimit)
        proc = await asyncio.create_subprocess_exec(
            "python3", "-c", execution_wrapper_script,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            limit=1024 * 1024 * 64, # 64 Megabyte memory map bounds
        )
        
        stdout, _ = await asyncio.wait_for(
            proc.communicate(input=json.dumps(context).encode()),
            timeout=3.0 # Strict time envelope bounds ensuring graph loops do not lag. 
        )
        return json.loads(stdout)
```

## 2. Network Restrict By Default
Instead of complex Veth bridges natively restricting network boundaries, standard processes execute without outbound network privileges mapped unless overtly requested by the administrator generating the plugin node definition structure explicit bounds mapping strictly required capabilities. 

## 3. Extension Registries 
Nodes map logically to `ThulaNodeBase` standards returning structured `NodeResult` definitions. 

By avoiding complex isolation layers, custom functions spin up natively inside typical 5ms bounds rather than imposing heavy Docker instantiation lags on execution loop transitions.
