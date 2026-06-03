export default function TimelineTab({ store }) {
  const { response } = store;

  if (!response || !response.timings) {
    return (
      <div className="text-center py-6 text-xs text-neutral-400">
        No timing details available for this request.
      </div>
    );
  }

  const { timings } = response;
  const total = timings.total || 1;

  // Let's design phases with start offsets and lengths
  const phases = [
    { id: 'dns', label: 'DNS Lookup', val: timings.dns || 0, color: '#3b82f6' },
    { id: 'tcp', label: 'TCP Connection', val: timings.tcp || 0, color: '#8b5cf6' },
    { id: 'tls', label: 'SSL/TLS Handshake', val: timings.tls || 0, color: '#ec4899' },
    { id: 'request', label: 'Request Sent', val: timings.request || 0, color: '#eab308' },
    { id: 'server', label: 'Waiting (TTFB)', val: timings.server || 0, color: '#f97316' },
    { id: 'response', label: 'Content Download', val: timings.response || 0, color: '#22c55e' },
  ];

  // Calculate cumulative offsets
  let currentOffset = 0;
  const timingItems = phases.map(phase => {
    const start = currentOffset;
    currentOffset += phase.val;
    const pctStart = (start / total) * 100;
    const pctWidth = Math.max((phase.val / total) * 100, 0.5); // Minimum 0.5% width for visibility
    
    return {
      ...phase,
      pctStart,
      pctWidth,
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs pb-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>API Request Lifecycle Timing</span>
        <span className="font-mono font-bold" style={{ color: 'var(--color-primary)' }}>Total: {timings.total} ms</span>
      </div>

      <div className="space-y-3.5 pt-2">
        {timingItems.map(item => (
          <div key={item.id} className="grid grid-cols-12 items-center gap-2 text-xs">
            {/* Label and Value */}
            <div className="col-span-4 flex flex-col">
              <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{item.label}</span>
              <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-muted)' }}>{item.val} ms</span>
            </div>

            {/* Waterfall Bar Graph */}
            <div className="col-span-8 relative h-4 bg-neutral-100 dark:bg-neutral-800 rounded-md overflow-hidden">
              {item.val > 0 && (
                <div
                  className="absolute h-full rounded"
                  style={{
                    left: `${item.pctStart}%`,
                    width: `${item.pctWidth}%`,
                    background: item.color,
                  }}
                  title={`${item.label}: ${item.val} ms`}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary note */}
      <div 
        className="rounded-lg p-2.5 text-[10px] leading-relaxed border"
        style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
      >
        <span className="font-semibold text-neutral-600 dark:text-neutral-350 block mb-0.5">Understanding Timings:</span>
        • <strong>TTFB</strong> (Time to First Byte) is the duration from sending the request to receiving the first byte of response data. High TTFB indicates server processing delays.<br />
        • <strong>SSL/TLS Handshake</strong> happens only for HTTPS secure endpoints.
      </div>
    </div>
  );
}
