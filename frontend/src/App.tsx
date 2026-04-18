import { useCallback, useState, useRef } from 'react';
import { Node } from 'reactflow';
import { NodePalette } from './components/NodePalette';
import { ConfigPanel } from './components/ConfigPanel';
import { GraphCanvas } from './components/GraphCanvas';
import { OutputConsole } from './components/OutputConsole';
import { useGraph } from './hooks/useGraph';
import { api } from './services/api';
import { NodeConfig } from './types';

function App() {
  const {
    graph,
    selectedNode,
    setSelectedNode,
    addNode,
    deleteNode,
    updateNodeData,
    addEdge,
    deleteEdge,
    exportToBackendFormat,
    resetGraph,
  } = useGraph();

  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const handleNodeClick = useCallback((node: Node) => {
    setSelectedNode(node.id);
  }, [setSelectedNode]);

  const handleNodesChange = useCallback((changes: any) => {
    // React Flow handles this internally
  }, []);

  const handleEdgesChange = useCallback((changes: any) => {
    // React Flow handles this internally
  }, []);

  const handleConnect = useCallback(
    (connection: any) => {
      addEdge(connection);
    },
    [addEdge]
  );

  const handleUpdateNodeData = useCallback(
    (data: NodeConfig) => {
      if (selectedNode) {
        updateNodeData(selectedNode, data);
      }
    },
    [selectedNode, updateNodeData]
  );

  const handleDeleteNode = useCallback(() => {
    if (selectedNode) {
      deleteNode(selectedNode);
    }
  }, [selectedNode, deleteNode]);

  const handleRunAgent = async () => {
    setIsRunning(true);
    setOutput((prev) => [...prev, 'Starting execution...']);

    try {
      const backendGraph = exportToBackendFormat();
      const sessionId = `session-${Date.now()}`;
      const input = 'Hello, how are you?';

      setOutput((prev) => [...prev, `Session ID: ${sessionId}`]);
      setOutput((prev) => [...prev, `Sending graph to backend...`]);

      const response = await api.executeAgent(backendGraph, sessionId, input);

      if (response.success) {
        setOutput((prev) => [...prev, 'Execution completed successfully']);
        setOutput((prev) => [...prev, `Results: ${JSON.stringify(response.results, null, 2)}`]);
      } else {
        setOutput((prev) => [...prev, `Error: ${response.error}`]);
      }
    } catch (error) {
      setOutput((prev) => [...prev, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const selectedNodeData = selectedNode
    ? graph.nodes.find((n) => n.id === selectedNode)?.data
    : null;
  const selectedNodeType = selectedNode
    ? graph.nodes.find((n) => n.id === selectedNode)?.type
    : null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Thyla Agent Builder</h1>
        <div style={styles.actions}>
          <button onClick={resetGraph} style={styles.secondaryButton}>
            Reset Graph
          </button>
          <button
            onClick={handleRunAgent}
            disabled={isRunning}
            style={isRunning ? styles.disabledButton : styles.primaryButton}
          >
            {isRunning ? 'Running...' : 'Run Agent'}
          </button>
        </div>
      </div>

      <div style={styles.main}>
        <NodePalette onAddNode={addNode} />

        <div style={styles.canvas}>
          <GraphCanvas
            graph={graph}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            onNodeClick={handleNodeClick}
            onAddNode={addNode}
          />
        </div>

        <ConfigPanel
          nodeId={selectedNode}
          nodeType={selectedNodeType}
          config={selectedNodeData || {}}
          onUpdate={handleUpdateNodeData}
          onDelete={handleDeleteNode}
        />
      </div>

      <OutputConsole isRunning={isRunning} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#1e1e1e',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    backgroundColor: '#252526',
    borderBottom: '1px solid #3e3e42',
  },
  title: {
    color: '#e0e0e0',
    fontSize: '18px',
    fontWeight: '600',
  },
  actions: {
    display: 'flex',
    gap: '12px',
  },
  primaryButton: {
    padding: '10px 20px',
    backgroundColor: '#60a5fa',
    color: '#1e1e1e',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  secondaryButton: {
    padding: '10px 20px',
    backgroundColor: '#3e3e42',
    color: '#e0e0e0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  disabledButton: {
    padding: '10px 20px',
    backgroundColor: '#3e3e42',
    color: '#888',
    border: 'none',
    borderRadius: '6px',
    cursor: 'not-allowed',
    fontSize: '14px',
  },
  main: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  canvas: {
    flex: 1,
    backgroundColor: '#1e1e1e',
  },
};

export default App;
