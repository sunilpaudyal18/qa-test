import { useState, useCallback } from 'react';
import {
  X, Calendar, Tag, Shield, Database, Layout, AlignLeft,
  CheckCircle2, XCircle, AlertTriangle, ExternalLink, Image as ImageIcon,
  Clock, User, Monitor, GitBranch, Paperclip, Download, Maximize2,
  Minimize2, ChevronRight, ChevronDown, Copy, Edit3, FileText,
  Play, ArrowRight, AlertOctagon, FileImage, Video, File,
  ZoomIn, ZoomOut,
} from 'lucide-react';

const surfaceBg = '#111827';
const elevatedBg = '#1A2333';
const borderColor = 'rgba(255,255,255,0.08)';
const primaryText = '#F9FAFB';
const secondaryText = '#94A3B8';
const successColor = '#22C55E';
const failureColor = '#EF4444';
const warningColor = '#F59E0B';
const infoColor = '#3B82F6';

const StatusBadge = ({ status, size = 'default' }) => {
  const config = {
    Pass: { icon: CheckCircle2, bg: 'rgba(34,197,94,0.12)', text: successColor, border: 'rgba(34,197,94,0.25)' },
    Fail: { icon: XCircle, bg: 'rgba(239,68,68,0.12)', text: failureColor, border: 'rgba(239,68,68,0.25)' },
    Blocked: { icon: AlertTriangle, bg: 'rgba(245,158,11,0.12)', text: warningColor, border: 'rgba(245,158,11,0.25)' },
    Untested: { icon: Tag, bg: 'rgba(148,163,184,0.08)', text: secondaryText, border: 'rgba(148,163,184,0.15)' },
    'N/A': { icon: Tag, bg: 'rgba(148,163,184,0.08)', text: secondaryText, border: 'rgba(148,163,184,0.15)' },
  };
  const c = config[status] || config.Untested;
  const Icon = c.icon;
  const sizeStyles = size === 'lg' ? 'px-4 py-2 text-sm gap-2.5' : 'px-2.5 py-1 text-xs gap-1.5';
  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${sizeStyles}`}
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} />
      {status}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const colors = {
    Critical: { bg: 'rgba(239,68,68,0.12)', text: failureColor, border: 'rgba(239,68,68,0.2)' },
    High: { bg: 'rgba(245,158,11,0.12)', text: warningColor, border: 'rgba(245,158,11,0.2)' },
    Medium: { bg: 'rgba(59,130,246,0.12)', text: infoColor, border: 'rgba(59,130,246,0.2)' },
    Low: { bg: 'rgba(148,163,184,0.08)', text: secondaryText, border: 'rgba(148,163,184,0.15)' },
  };
  const c = colors[priority] || colors.Medium;
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold gap-1.5"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      <Shield className="w-3 h-3" /> {priority} Priority
    </span>
  );
};

const SeverityBadge = ({ severity }) => {
  const colors = {
    Critical: { bg: 'rgba(239,68,68,0.12)', text: failureColor, border: 'rgba(239,68,68,0.2)' },
    Major: { bg: 'rgba(245,158,11,0.12)', text: warningColor, border: 'rgba(245,158,11,0.2)' },
    Minor: { bg: 'rgba(59,130,246,0.12)', text: infoColor, border: 'rgba(59,130,246,0.2)' },
    Low: { bg: 'rgba(148,163,184,0.08)', text: secondaryText, border: 'rgba(148,163,184,0.15)' },
  };
  const c = colors[severity] || colors.Minor;
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold gap-1.5"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      <AlertTriangle className="w-3 h-3" /> {severity} Severity
    </span>
  );
};

const SectionCard = ({ title, icon: Icon, children, defaultOpen = true, actions }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border overflow-hidden transition-all duration-200"
      style={{ background: surfaceBg, borderColor }}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:opacity-80 transition-opacity"
        style={{ borderBottom: open ? `1px solid ${borderColor}` : 'none' }}>
        <div className="flex items-center gap-2.5">
          {Icon && <Icon className="w-4 h-4" style={{ color: infoColor }} />}
          <span className="text-sm font-semibold" style={{ color: primaryText }}>{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {open ? <ChevronDown className="w-4 h-4" style={{ color: secondaryText }} /> : <ChevronRight className="w-4 h-4" style={{ color: secondaryText }} />}
        </div>
      </button>
      {open && <div className="p-5">{children}</div>}
    </div>
  );
};

const DetailRow = ({ label, value }) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs font-medium uppercase tracking-wider" style={{ color: secondaryText }}>{label}</span>
    <span className="text-sm leading-relaxed" style={{ color: primaryText }}>{value || '--'}</span>
  </div>
);

const FullscreenImageModal = ({ src, onClose }) => {
  const [zoomed, setZoomed] = useState(false);
  if (!src) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8"
      style={{ background: 'rgba(0,0,0,0.85)' }} onClick={onClose}>
      <div className="relative max-w-5xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium" style={{ color: secondaryText }}>Evidence Preview</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setZoomed(!zoomed)} className="p-1.5 rounded-lg transition-colors hover:bg-white/10" style={{ color: secondaryText }}>
              {zoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg transition-colors hover:bg-white/10" style={{ color: secondaryText }}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="overflow-auto rounded-xl" style={{ background: '#000', border: `1px solid ${borderColor}` }}>
          <img src={src} alt="Evidence" className={zoomed ? '' : 'max-h-[75vh] w-auto object-contain'}
            style={{ maxWidth: '100%', display: 'block', margin: '0 auto' }} />
        </div>
      </div>
    </div>
  );
};

export default function TestCaseViewModal({ isOpen, testCase, onClose, onEdit }) {
  const [fullscreenImg, setFullscreenImg] = useState(null);

  const status = testCase?.status || 'Untested';
  const isFailed = status === 'Fail';
  const evidenceList = [];
  if (testCase?.screenshot) evidenceList.push({ type: 'image', src: testCase.screenshot, name: 'Screenshot' });

  const formatDate = (d) => {
    if (!d) return null;
    try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return d; }
  };

  if (!isOpen || !testCase) return null;

  return (
    <>
      {fullscreenImg && <FullscreenImageModal src={fullscreenImg} onClose={() => setFullscreenImg(null)} />}
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto"
        style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
        <div className="w-full rounded-2xl shadow-2xl flex flex-col overflow-hidden my-4 lg:my-8"
          style={{ maxWidth: '1400px', maxHeight: '90vh', background: '#0B1220', border: `1px solid ${borderColor}` }}
          onClick={e => e.stopPropagation()}>
          <div className="shrink-0 px-6 sm:px-8 lg:px-10 py-5 border-b flex items-start justify-between gap-4"
            style={{ background: surfaceBg, borderColor }}>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <StatusBadge status={status} size="lg" />
                <PriorityBadge priority={testCase.priority} />
                <SeverityBadge severity={testCase.severity} />
              </div>
              <h1 className="text-2xl font-bold leading-tight truncate" style={{ color: primaryText }}>
                {testCase.title}
              </h1>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="text-xs font-mono px-2 py-0.5 rounded"
                  style={{ background: 'rgba(255,255,255,0.05)', color: secondaryText }}>
                  {testCase.testId || '--'}
                </span>
                {testCase.date && (
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: secondaryText }}>
                    <Calendar className="w-3 h-3" /> Executed {formatDate(testCase.date)}
                  </span>
                )}
                {testCase.bugLink && (
                  <a href={testCase.bugLink.startsWith('http') ? testCase.bugLink : '#'} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors hover:opacity-80"
                    style={{ background: 'rgba(239,68,68,0.12)', color: failureColor, border: '1px solid rgba(239,68,68,0.2)' }}>
                    <ExternalLink className="w-3 h-3" /> {testCase.bugLink.length > 30 ? testCase.bugLink.substring(0, 30) + '...' : testCase.bugLink}
                  </a>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl shrink-0 transition-colors" style={{ color: secondaryText }}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {isFailed && (
            <div className="mx-6 sm:mx-8 lg:mx-10 mt-5 p-4 sm:p-5 rounded-xl border flex gap-4"
              style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.2)' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(239,68,68,0.12)' }}>
                <AlertOctagon className="w-5 h-5" style={{ color: failureColor }} />
              </div>
              <div className="space-y-2.5 min-w-0">
                <h3 className="text-base font-bold" style={{ color: failureColor }}>Test Failed</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg border-l-2"
                    style={{ background: 'rgba(34,197,94,0.04)', borderColor: successColor, borderLeftWidth: '3px' }}>
                    <span className="text-xs font-semibold uppercase tracking-wider block mb-1" style={{ color: successColor }}>Expected</span>
                    <span style={{ color: primaryText }}>{testCase.expectedResult || '--'}</span>
                  </div>
                  <div className="p-3 rounded-lg border-l-2"
                    style={{ background: 'rgba(239,68,68,0.04)', borderColor: failureColor, borderLeftWidth: '3px' }}>
                    <span className="text-xs font-semibold uppercase tracking-wider block mb-1" style={{ color: failureColor }}>Actual</span>
                    <span style={{ color: primaryText }}>{testCase.actualResult || '--'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-6 sm:px-8 lg:px-10 py-6">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
              <div className="flex-1 lg:w-[70%] space-y-5">
                <SectionCard title="Test Overview" icon={Layout}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailRow label="Module" value={testCase.module} />
                    <DetailRow label="Test ID" value={testCase.testId} />
                    <DetailRow label="Created" value={formatDate(testCase.createdAt)} />

                  </div>
                </SectionCard>

                <SectionCard title="Test Steps" icon={AlignLeft}>
                  <div className="space-y-1.5">
                    {(testCase.steps || []).length > 0 ? testCase.steps.map((step, idx) => (
                      <div key={idx} className="flex gap-3 p-3 rounded-lg transition-colors"
                        style={{ background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                          style={{ background: 'rgba(59,130,246,0.1)', color: infoColor }}>{idx + 1}</span>
                        <span className="text-sm leading-relaxed pt-0.5" style={{ color: primaryText }}>{step}</span>
                      </div>
                    )) : <span className="text-sm italic" style={{ color: secondaryText }}>No steps defined</span>}
                  </div>
                </SectionCard>

                {testCase.testData?.length > 0 && (
                  <SectionCard title="Test Data" icon={Database}>
                    <div className="space-y-2">
                      {testCase.testData.map((data, idx) => (
                        <div key={idx} className="p-3 rounded-lg font-mono text-sm leading-relaxed"
                          style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${borderColor}` }}>{data}</div>
                      ))}
                    </div>
                  </SectionCard>
                )}

                <SectionCard title="Results Comparison" icon={CheckCircle2}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border-l-[3px]"
                      style={{ background: 'rgba(34,197,94,0.03)', borderColor: successColor }}>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4" style={{ color: successColor }} />
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: successColor }}>Expected</span>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: primaryText }}>
                        {testCase.expectedResult || '--'}</p>
                    </div>
                    <div className="p-4 rounded-xl border-l-[3px]"
                      style={{ background: isFailed ? 'rgba(239,68,68,0.03)' : 'rgba(34,197,94,0.03)',
                        borderColor: isFailed ? failureColor : successColor }}>
                      <div className="flex items-center gap-2 mb-2">
                        {isFailed ? <XCircle className="w-4 h-4" style={{ color: failureColor }} /> :
                          <CheckCircle2 className="w-4 h-4" style={{ color: successColor }} />}
                        <span className="text-xs font-bold uppercase tracking-wider"
                          style={{ color: isFailed ? failureColor : successColor }}>Actual</span>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: primaryText }}>
                        {testCase.actualResult || '--'}</p>
                    </div>
                  </div>
                </SectionCard>

                {evidenceList.length > 0 && (
                  <SectionCard title={`Evidence (${evidenceList.length})`} icon={ImageIcon}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {evidenceList.map((item, idx) => (
                        <button key={idx} onClick={() => setFullscreenImg(item.src)}
                          className="group relative aspect-video rounded-lg overflow-hidden border transition-all duration-200"
                          style={{ borderColor, background: '#000' }}>
                          <img src={item.src} alt={item.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            style={{ background: 'rgba(0,0,0,0.5)' }}>
                            <Maximize2 className="w-5 h-5" style={{ color: '#fff' }} />
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 text-[10px] font-medium truncate"
                            style={{ background: 'rgba(0,0,0,0.7)', color: secondaryText }}>{item.name}</div>
                        </button>
                      ))}
                    </div>
                  </SectionCard>
                )}
              </div>

              <div className="lg:w-[30%] space-y-4">
                <SectionCard title="Execution Summary" icon={Play}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <span className="text-xs font-medium" style={{ color: secondaryText }}>Status</span>
                      <StatusBadge status={status} />
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <span className="text-xs font-medium" style={{ color: secondaryText }}>Executed</span>
                      <span className="text-xs" style={{ color: primaryText }}>{formatDate(testCase.date) || '--'}</span>
                    </div>
                  </div>
                </SectionCard>

                {testCase.bugLink && (
                  <SectionCard title="Linked Defects" icon={AlertOctagon}>
                    <a href={testCase.bugLink.startsWith('http') ? testCase.bugLink : '#'} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-lg transition-colors group"
                      style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)' }}>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold block truncate" style={{ color: failureColor }}>{testCase.bugLink}</span>
                        <span className="text-[10px] mt-0.5 block" style={{ color: secondaryText }}>Open in issue tracker</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-2" style={{ color: secondaryText }} />
                    </a>
                  </SectionCard>
                )}
              </div>
            </div>
          </div>

          <div className="shrink-0 px-6 sm:px-8 lg:px-10 py-4 border-t flex items-center justify-between flex-wrap gap-3"
            style={{ background: surfaceBg, borderColor }}>
            <div className="flex items-center gap-1.5">
              {onEdit && (
                <button onClick={() => { onEdit(testCase); onClose(); }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                  style={{ background: infoColor, color: '#fff' }}>
                  <Edit3 className="w-4 h-4" /> Edit
                </button>
              )}
              <button onClick={onClose}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.06)', color: secondaryText, border: `1px solid ${borderColor}` }}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
