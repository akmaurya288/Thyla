import { useState, useCallback } from 'react';
import { ThylaGraph, BackendGraphConfig } from '../types';

const initialGraph: ThylaGraph = {
  nodes: [
    {
      id: 'input-1',
      type: 'input',
      position: { x: 100, y: 100 },
      data: { outputKey: 'user_message', value: 'Hello, how are you?' },
    },
    {
      id: 'llm-1',
      type: 'llm',
      position: { x: 400, y: 100 },
      data: { inputKey: 'user_message', outputKey: 'llm_response', model: 'mock' },
    },
    {
      id: 'output-1',
      type: 'output',
      position: { x: 700, y: 100 },
      data: { inputKey: 'llm_response' },
    },
  ],
  edges: [
    {
      id: 'e1',
      source: 'input-1',
      target: 'llm-1',
    },
    {
      id: 'e2',
      source: 'llm-1',
      target: 'output-1',
    },
  ],
};

export function useGraph() {
  const [graph, setGraph] = useState<ThylaGraph>(initialGraph);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const addNode = useCallback(
    (type: string, position: { x: number; y: number }) => {
      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: getDefaultConfig(type),
      };
      setGraph((prev) => ({
        ...prev,
        nodes: [...prev.nodes, newNode],
      }));
    },
    []
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setGraph((prev) => ({
        ...prev,
        nodes: prev.nodes.filter((n) => n.id !== nodeId),
        edges: prev.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      }));
      if (selectedNode === nodeId) {
        setSelectedNode(null);
      }
    },
    [selectedNode]
  );

  const updateNodeData = useCallback((nodeId: string, data: any) => {
    setGraph((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === nodeId ? { ...n, data } : n)),
    }));
  }, []);

  const addEdge = useCallback(
    (edge: any) => {
      setGraph((prev) => ({
        ...prev,
        edges: [...prev.edges, edge],
      }));
    },
    []
  );

  const deleteEdge = useCallback(
    (edgeId: string) => {
      setGraph((prev) => ({
        ...prev,
        edges: prev.edges.filter((e) => e.id !== edgeId),
      }));
    },
    []
  );

  const exportToBackendFormat = useCallback((): BackendGraphConfig => {
    return {
      nodes: graph.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        config: node.data,
      })),
      edges: graph.edges.map((edge) => ({
        from: edge.source,
        to: edge.target,
        outputKey: edge.sourceHandle,
        inputKey: edge.targetHandle,
      })),
    };
  }, [graph]);

  const resetGraph = useCallback(() => {
    setGraph(initialGraph);
    setSelectedNode(null);
  }, []);

  return {
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
  };
}

function getDefaultConfig(type: string): any {
  switch (type) {
    case 'input':
      return { outputKey: 'input', value: '' };
    case 'llm':
      return { inputKey: 'input', outputKey: 'output', model: 'mock' };
    case 'output':
      return { inputKey: 'output' };
    default:
      return {};
  }
}
