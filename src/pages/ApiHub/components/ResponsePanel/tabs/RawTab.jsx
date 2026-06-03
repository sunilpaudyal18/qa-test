export default function RawTab({ store }) {
  const { response } = store;

  if (!response) return null;

  return (
    <pre 
      className="text-xs p-3 rounded-lg overflow-x-auto font-mono leading-relaxed" 
      style={{ 
        background: 'var(--color-surface-alt)', 
        border: '1px solid var(--color-border)', 
        color: 'var(--color-text-primary)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
        minHeight: '200px',
        maxHeight: '400px'
      }}
    >
      {response.rawBody || response.body}
    </pre>
  );
}
