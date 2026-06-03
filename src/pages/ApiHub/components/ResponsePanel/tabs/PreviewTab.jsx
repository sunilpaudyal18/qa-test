export default function PreviewTab({ store }) {
  const { response } = store;

  if (!response) return null;

  const content = response.rawBody || response.body;

  return (
    <div 
      className="border rounded-lg overflow-hidden h-96"
      style={{ borderColor: 'var(--color-border)', background: '#fff' }}
    >
      <iframe
        title="Response Preview"
        srcDoc={content}
        sandbox="allow-scripts"
        className="w-full h-full border-none"
      />
    </div>
  );
}
