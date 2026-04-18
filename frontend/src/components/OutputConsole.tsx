import { useState, useEffect, useRef } from 'react';

interface OutputConsoleProps {
  isRunning: boolean;
}

export function OutputConsole({ isRunning }: OutputConsoleProps) {
  const [output, setOutput] = useState<string[]>([]);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const wsRef = useRef<WebSocket | null>(null);
  const outputEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputEndRef.current) {
      outputEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [output]);

  const appendOutput = (text: string) => {
    setOutput((prev) => [...prev, text]);
  };

  const clearOutput = () => {
    setOutput([]);
  };

  const executeViaREST = async () => {
    // This would integrate with the REST API
    // For now, just a placeholder
    appendOutput('Executing via REST API...');
  };

  return (
    <div style={styles.console}>
      <div style={styles.header}>
        <h3 style={styles.title}>Output Console</h3>
        <div style={styles.buttons}>
          <button onClick={clearOutput} style={styles.clearButton}>
            Clear
          </button>
        </div>
      </div>
      <div style={styles.output}>
        {output.length === 0 ? (
          <p style={styles.emptyText}>Output will appear here...</p>
        ) : (
          output.map((line, index) => (
            <div key={index} style={styles.outputLine}>
              {line}
            </div>
          ))
        )}
        <div ref={outputEndRef} />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  console: {
    height: '200px',
    backgroundColor: '#1e1e1e',
    borderTop: '1px solid #3e3e42',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  title: {
    color: '#e0e0e0',
    fontSize: '14px',
    fontWeight: '600',
  },
  buttons: {
    display: 'flex',
    gap: '8px',
  },
  clearButton: {
    padding: '6px 12px',
    backgroundColor: '#3e3e42',
    color: '#e0e0e0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  output: {
    flex: 1,
    overflowY: 'auto',
    fontFamily: 'monospace',
    fontSize: '12px',
    lineHeight: '1.6',
  },
  emptyText: {
    color: '#888',
    fontStyle: 'italic',
  },
  outputLine: {
    color: '#e0e0e0',
    marginBottom: '4px',
  },
};
