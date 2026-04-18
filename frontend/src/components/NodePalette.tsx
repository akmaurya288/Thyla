import { useCallback } from 'react';

interface NodePaletteProps {
  onAddNode: (type: string, position: { x: number; y: number }) => void;
}

const nodeTypes = [
  { type: 'input', label: 'Input', color: '#4ade80' },
  { type: 'llm', label: 'LLM', color: '#60a5fa' },
  { type: 'output', label: 'Output', color: '#f472b6' },
];

export function NodePalette({ onAddNode }: NodePaletteProps) {
  const handleDragStart = useCallback(
    (event: React.DragEvent, type: string) => {
      event.dataTransfer.setData('application/reactflow', type);
      event.dataTransfer.effectAllowed = 'move';
    },
    []
  );

  return (
    <div style={styles.palette}>
      <h3 style={styles.title}>Node Palette</h3>
      <div style={styles.nodeList}>
        {nodeTypes.map((node) => (
          <div
            key={node.type}
            draggable
            onDragStart={(e) => handleDragStart(e, node.type)}
            style={{ ...styles.nodeItem, borderColor: node.color }}
          >
            <span style={{ ...styles.nodeDot, backgroundColor: node.color }}></span>
            {node.label}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  palette: {
    width: '200px',
    height: '100%',
    backgroundColor: '#252526',
    borderRight: '1px solid #3e3e42',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    color: '#e0e0e0',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '16px',
  },
  nodeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  nodeItem: {
    padding: '12px',
    backgroundColor: '#2d2d30',
    border: '2px solid transparent',
    borderRadius: '6px',
    cursor: 'grab',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#e0e0e0',
    fontSize: '13px',
    transition: 'background-color 0.2s',
  },
  nodeDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
};
