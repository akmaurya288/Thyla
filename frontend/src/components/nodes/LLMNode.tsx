import { Handle, Position, NodeProps } from 'reactflow';

export function LLMNode({ data }: NodeProps) {
  return (
    <div style={styles.node}>
      <Handle type="target" position={Position.Left} style={styles.handle} />
      <Handle type="source" position={Position.Right} style={styles.handle} />
      <div style={styles.header}>
        <span style={styles.icon}>🤖</span>
        <span style={styles.label}>LLM</span>
      </div>
      <div style={styles.body}>
        <div style={styles.field}>
          <span style={styles.fieldLabel}>Model:</span>
          <span style={styles.fieldValue}>{data.model || 'mock'}</span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  node: {
    padding: '12px',
    borderRadius: '8px',
    backgroundColor: '#2d2d30',
    border: '2px solid #60a5fa',
    minWidth: '150px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#e0e0e0',
  },
  icon: {
    fontSize: '16px',
  },
  label: {
    fontSize: '14px',
  },
  body: {
    fontSize: '12px',
    color: '#888',
  },
  field: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
  },
  fieldLabel: {
    color: '#888',
  },
  fieldValue: {
    color: '#e0e0e0',
    fontWeight: '500',
  },
  handle: {
    backgroundColor: '#60a5fa',
  },
};
