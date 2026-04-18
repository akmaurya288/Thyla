import { useCallback, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  EdgeTypes,
  addEdge,
  Connection,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
  OnDrop,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { InputNode } from './nodes/InputNode';
import { LLMNode } from './nodes/LLMNode';
import { OutputNode } from './nodes/OutputNode';
import { ThylaGraph } from '../types';

interface GraphCanvasProps {
  graph: ThylaGraph;
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (connection: Connection) => void;
  onNodeClick: (node: Node) => void;
  onAddNode: (type: string, position: { x: number; y: number }) => void;
}

const nodeTypes: NodeTypes = {
  input: InputNode,
  llm: LLMNode,
  output: OutputNode,
};

export function GraphCanvas({
  graph,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onAddNode,
}: GraphCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChangeHandler] = useNodesState(graph.nodes);
  const [edges, setEdges, onEdgesChangeHandler] = useEdgesState(graph.edges);

  const onConnectHandler = useCallback(
    (connection: Connection) => {
      const edge = {
        ...connection,
        id: `e-${connection.source}-${connection.target}`,
        animated: true,
      };
      onConnect(edge);
    },
    [onConnect]
  );

  const onDropHandler: OnDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = {
        x: event.clientX - 200,
        y: event.clientY - 50,
      };

      onAddNode(type, position);
    },
    [onAddNode]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeClick(node);
    },
    [onNodeClick]
  );

  // Sync with parent state
  const handleNodesChange = useCallback(
    (changes: any) => {
      onNodesChangeHandler(changes);
      onNodesChange(changes);
    },
    [onNodesChangeHandler, onNodesChange]
  );

  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChangeHandler(changes);
      onEdgesChange(changes);
    },
    [onEdgesChangeHandler, onEdgesChange]
  );

  return (
    <div ref={reactFlowWrapper} style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnectHandler}
        onNodeClick={handleNodeClick}
        onDrop={onDropHandler}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#3e3e42" gap={16} />
        <Controls />
        <MiniMap nodeColor="#60a5fa" />
      </ReactFlow>
    </div>
  );
}
