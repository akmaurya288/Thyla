import { NodeConfig } from '../types';

interface ConfigPanelProps {
  nodeId: string | null;
  nodeType: string | null;
  config: NodeConfig;
  onUpdate: (data: NodeConfig) => void;
  onDelete: () => void;
}

export function ConfigPanel({ nodeId, nodeType, config, onUpdate, onDelete }: ConfigPanelProps) {
  if (!nodeId) {
    return (
      <div style={styles.panel}>
        <p style={styles.emptyText}>Select a node to configure</p>
      </div>
    );
  }

  const handleChange = (key: string, value: any) => {
    onUpdate({ ...config, [key]: value });
  };

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <h3 style={styles.title}>Configure {nodeType}</h3>
        <button onClick={onDelete} style={styles.deleteButton}>
          Delete
        </button>
      </div>

      <div style={styles.form}>
        {nodeType === 'input' && (
          <>
            <div style={styles.field}>
              <label style={styles.label}>Output Key</label>
              <input
                type="text"
                value={config.outputKey || ''}
                onChange={(e) => handleChange('outputKey', e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Value</label>
              <input
                type="text"
                value={config.value || ''}
                onChange={(e) => handleChange('value', e.target.value)}
                style={styles.input}
              />
            </div>
          </>
        )}

        {nodeType === 'llm' && (
          <>
            <div style={styles.field}>
              <label style={styles.label}>Input Key</label>
              <input
                type="text"
                value={config.inputKey || ''}
                onChange={(e) => handleChange('inputKey', e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Output Key</label>
              <input
                type="text"
                value={config.outputKey || ''}
                onChange={(e) => handleChange('outputKey', e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Model</label>
              <input
                type="text"
                value={config.model || ''}
                onChange={(e) => handleChange('model', e.target.value)}
                style={styles.input}
              />
            </div>
          </>
        )}

        {nodeType === 'output' && (
          <div style={styles.field}>
            <label style={styles.label}>Input Key</label>
            <input
              type="text"
              value={config.inputKey || ''}
              onChange={(e) => handleChange('inputKey', e.target.value)}
              style={styles.input}
            />
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    width: '280px',
    height: '100%',
    backgroundColor: '#252526',
    borderLeft: '1px solid #3e3e42',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  title: {
    color: '#e0e0e0',
    fontSize: '14px',
    fontWeight: '600',
  },
  deleteButton: {
    padding: '6px 12px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  emptyText: {
    color: '#888',
    fontSize: '13px',
    textAlign: 'center',
    marginTop: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    color: '#e0e0e0',
    fontSize: '12px',
    fontWeight: '500',
  },
  input: {
    padding: '8px 12px',
    backgroundColor: '#2d2d30',
    border: '1px solid #3e3e42',
    borderRadius: '4px',
    color: '#e0e0e0',
    fontSize: '13px',
  },
};
