'use client';

import Markdown from './Markdown';
import type { EnrichmentDetail } from '@/lib/types';

interface VerdictPanelProps { output: Record<string, unknown>; status: 'completed' | 'failed'; enrichmentDetails?: EnrichmentDetail[]; }
interface IOC { type: string; value: string; }
interface Indicator { type: string; value: string; source: string; details: string; }

function parseJson<T>(val: unknown): T | null {
  if (Array.isArray(val)) return val as T;
  if (typeof val !== 'string') return null;
  try { return JSON.parse(val); } catch { return null; }
}

function parseBulletList(val: unknown): string[] {
  if (typeof val !== 'string') return [];
  return val.split('\n').map(l => l.replace(/^•\s*/, '').trim()).filter(Boolean);
}

function parseRedFlags(val: unknown): string[] {
  const json = parseJson<string[]>(val);
  if (json) return json;
  return parseBulletList(val);
}

function parseIocs(val: unknown): IOC[] {
  const json = parseJson<IOC[]>(val);
  if (json) return json;
  if (typeof val !== 'string') return [];
  return val.split('\n').map(line => {
    const m = line.match(/^•\s*`([^`]+)`\s*—\s*(.+)$/);
    if (!m) return null;
    return { type: m[1], value: m[2].trim() };
  }).filter((x): x is IOC => x !== null);
}

function parseIndicators(val: unknown): Indicator[] {
  const json = parseJson<Indicator[]>(val);
  if (json) return json;
  if (typeof val !== 'string') return [];
  return val.split('\n').map(line => {
    const m = line.match(/^•\s*`([^`]+)`\s*—\s*`([^`]+)`\s*\(([^)]+)\):\s*(.+)$/);
    if (!m) return null;
    return { type: m[1], value: m[2], source: m[3], details: m[4].trim() };
  }).filter((x): x is Indicator => x !== null);
}

const IOC_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  url: { text: 'var(--pink)', bg: 'rgba(240,78,152,0.1)', border: 'rgba(240,78,152,0.3)' },
  domain: { text: 'var(--blue)', bg: 'rgba(27,169,245,0.1)', border: 'rgba(27,169,245,0.3)' },
  ip: { text: 'var(--yellow)', bg: 'rgba(254,197,20,0.1)', border: 'rgba(254,197,20,0.3)' },
  hash: { text: 'var(--teal)', bg: 'rgba(0,191,179,0.1)', border: 'rgba(0,191,179,0.3)' },
  email: { text: 'var(--blue)', bg: 'rgba(27,169,245,0.1)', border: 'rgba(27,169,245,0.3)' },
  phone: { text: 'var(--text-dim)', bg: 'var(--bg-surface)', border: 'var(--border-strong)' },
};

function IocBadge({ type }: { type: string }) {
  const c = IOC_COLORS[type] ?? IOC_COLORS.phone;
  return <span className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 2, fontWeight: 600, color: c.text, background: c.bg, border: `1px solid ${c.border}` }}>{type}</span>;
}

function SkippedSection({ label, reason }: { label: string; reason: string }) {
  return (
    <div className="print-report-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderRadius: 3, border: '1px dashed var(--border)', opacity: 0.6 }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--border-strong)' }} />
      <span className="label" style={{ color: 'var(--text-faint)', fontSize: 11 }}>{label}</span>
      <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>— {reason}</span>
    </div>
  );
}

function Section({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
  return (
    <div className="card print-section" style={{ overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div className="print-section-header" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
        <span className="label" style={{ color, fontSize: 11 }}>{label}</span>
      </div>
      <div className="print-section-body" style={{ padding: 24 }}>{children}</div>
    </div>
  );
}

export default function VerdictPanel({ output, status, enrichmentDetails }: VerdictPanelProps) {
  if (status === 'failed') return <FailedView />;
  if ('classification_is_phishing' in output) return <ReportView output={output} enrichmentDetails={enrichmentDetails} />;
  return <GenericView output={output} />;
}

function ReportView({ output, enrichmentDetails }: { output: Record<string, unknown>; enrichmentDetails?: EnrichmentDetail[] }) {
  const isThreat = output.classification_is_phishing === 'true' || output.classification_is_phishing === true;
  const type = (output.classification_type as string) ?? 'unknown';
  const conf = parseInt(String(output.classification_confidence ?? '0'), 10);
  const summary = (output.classification_summary as string) ?? '';
  const flags = parseRedFlags(output.classification_red_flags);
  const iocs = parseIocs(output.iocs_found);
  const enrichment = (output.enrichment_summary as string) ?? '';
  const indicators = parseIndicators(output.malicious_indicators);
  const hunt = (output.hunt_results as string) ?? '';
  const accent = isThreat ? 'var(--pink)' : 'var(--teal)';

  return (
    <div className="verdict-report" style={{ width: '100%', maxWidth: 760, margin: '40px auto 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className={`card animate-slide-up ${isThreat ? 'card-glow-pink card-accent-pink' : 'card-glow-teal card-accent-teal'}`}>
        <div style={{ padding: 32, display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <div style={{ width: 64, height: 64, flexShrink: 0, borderRadius: '50%', border: `2px solid ${accent}`, background: isThreat ? 'rgba(240,78,152,0.12)' : 'rgba(0,191,179,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isThreat ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01" stroke="var(--pink)" strokeWidth="2" strokeLinecap="round" /><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="var(--pink)" strokeWidth="2" /></svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="var(--teal)" strokeWidth="2" /><path d="M8 12l2.5 2.5L16 9" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
              <span className="label" style={{ color: accent }}>{isThreat ? 'Threat Detected' : 'No Threat Detected'}</span>
              <span className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 2, color: accent, border: `1px solid ${isThreat ? 'rgba(240,78,152,0.35)' : 'rgba(0,191,179,0.35)'}`, background: isThreat ? 'rgba(240,78,152,0.08)' : 'rgba(0,191,179,0.08)' }}>{type}</span>
            </div>
            <h3 className="display" style={{ fontWeight: 700, fontSize: 'clamp(22px, 3vw, 30px)', letterSpacing: '-0.02em', lineHeight: 1.2, color: 'var(--text)', marginBottom: 20 }}>
              {output.title as string ?? 'Analysis Report'}
            </h3>
            {conf > 0 && (
              <div style={{ maxWidth: 280, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="label-sm" style={{ color: 'var(--text-faint)' }}>Confidence</span>
                  <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: accent }}>{conf}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-surface)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, width: `${conf}%`, background: accent, transition: 'width 1s ease' }} />
                </div>
              </div>
            )}
            {summary && <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--text-dim)' }}>{summary}</p>}
          </div>
        </div>
      </div>

      {/* Red Flags */}
      {flags.length > 0 && (
        <div className="animate-slide-up stagger-1">
          <Section label="Red Flags" color="var(--pink)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {flags.map((f, i) => (
                <div key={i} className="print-report-row" style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 22, height: 22, flexShrink: 0, borderRadius: '50%', background: 'rgba(240,78,152,0.12)', border: '1px solid rgba(240,78,152,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 2v3.5M5 7.5h.005" stroke="var(--pink)" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </div>
                  <span style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-dim)' }}>{f}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* IOCs */}
      {iocs.length > 0 && (
        <div className="animate-slide-up stagger-2">
          <Section label="Indicators of Compromise" color="var(--blue)">
            <div className="print-ioc-list" style={{ border: '1px solid var(--border)', borderRadius: 3, overflow: 'hidden' }}>
              <div className="label-sm print-ioc-header" style={{ display: 'flex', color: 'var(--text-faint)', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
                <div className="print-ioc-type" style={{ width: 110, flexShrink: 0, padding: '10px 16px' }}>Type</div>
                <div className="print-ioc-value" style={{ flex: 1, padding: '10px 16px' }}>Value</div>
              </div>
              {iocs.map((ioc, i) => (
                <div key={i} className="print-ioc-row print-report-row" style={{ display: 'flex', alignItems: 'center', borderBottom: i < iocs.length - 1 ? '1px solid var(--border)' : 'none', background: 'var(--bg-panel)' }}>
                  <div className="print-ioc-type" style={{ width: 110, flexShrink: 0, padding: '12px 16px' }}><IocBadge type={ioc.type} /></div>
                  <div className="mono print-ioc-value" style={{ flex: 1, padding: '12px 16px', fontSize: 13, color: 'var(--text)', wordBreak: 'break-all' }}>{ioc.value}</div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* Enrichment Details from VT / urlscan */}
      {enrichmentDetails && enrichmentDetails.length > 0 && (
        <div className="animate-slide-up stagger-2">
          <Section label="IOC Enrichment Results" color="var(--blue)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {enrichmentDetails.map((detail, i) => (
                <div key={i} className="print-enrichment-detail print-report-row" style={{ padding: 16, borderRadius: 3, border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                  <div className="print-ioc-heading" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <IocBadge type={detail.iocType} />
                    <span className="mono" style={{ fontSize: 13, color: 'var(--text)', wordBreak: 'break-all' }}>{detail.iocValue}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {detail.sources.map((src, si) => (
                      <div key={si} className="print-source-row print-report-row" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', borderRadius: 3, border: '1px solid var(--border)', background: 'var(--bg-panel)' }}>
                        {/* Source name */}
                        <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', width: 90, flexShrink: 0, letterSpacing: '0.05em' }}>
                          {src.name}
                        </span>
                        <div style={{ flex: 1 }}>
                          {/* Status badge */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: src.stats ? 8 : 0 }}>
                            <span style={{
                              width: 8, height: 8, borderRadius: '50%',
                              background: src.status === 'malicious' ? 'var(--pink)' : src.status === 'suspicious' ? 'var(--yellow)' : src.status === 'clean' ? 'var(--teal)' : 'var(--text-faint)',
                            }} />
                            <span className="mono" style={{
                              fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em',
                              color: src.status === 'malicious' ? 'var(--pink)' : src.status === 'suspicious' ? 'var(--yellow)' : src.status === 'clean' ? 'var(--teal)' : 'var(--text-faint)',
                            }}>
                              {src.status === 'no_results' ? 'No results' : src.status}
                            </span>
                            {src.resultsCount !== undefined && (
                              <span className="mono" style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                                ({src.resultsCount} result{src.resultsCount !== 1 ? 's' : ''})
                              </span>
                            )}
                          </div>
                          {/* VT stats bar */}
                          {src.stats && (
                            <div>
                              <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                                {src.stats.malicious > 0 && <div style={{ flex: src.stats.malicious, background: 'var(--pink)' }} />}
                                {src.stats.suspicious > 0 && <div style={{ flex: src.stats.suspicious, background: 'var(--yellow)' }} />}
                                {src.stats.harmless > 0 && <div style={{ flex: src.stats.harmless, background: 'var(--teal)' }} />}
                                {src.stats.undetected > 0 && <div style={{ flex: src.stats.undetected, background: 'var(--border-strong)' }} />}
                              </div>
                              <div className="mono" style={{ display: 'flex', gap: 16, fontSize: 10, flexWrap: 'wrap' }}>
                                {src.stats.malicious > 0 && <span style={{ color: 'var(--pink)' }}>{src.stats.malicious} malicious</span>}
                                {src.stats.suspicious > 0 && <span style={{ color: 'var(--yellow)' }}>{src.stats.suspicious} suspicious</span>}
                                <span style={{ color: 'var(--teal)' }}>{src.stats.harmless} clean</span>
                                <span style={{ color: 'var(--text-faint)' }}>{src.stats.undetected} undetected</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {detail.sources.length === 0 && (
                      <span className="mono" style={{ fontSize: 11, color: 'var(--text-faint)' }}>No enrichment available for this IOC type</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* Enrichment */}
      {enrichment && enrichment.length > 0 && enrichment !== 'No IOCs to enrich' ? (
        <div className="animate-slide-up stagger-3">
          <Section label="Enrichment Summary" color="var(--teal)">
            <Markdown>{enrichment}</Markdown>
          </Section>
        </div>
      ) : (
        <SkippedSection label="Enrichment Summary" reason="No enrichment data returned by the workflow" />
      )}

      {/* Malicious Indicators */}
      {indicators.length > 0 ? (
        <MaliciousSection indicators={indicators} />
      ) : (
        <SkippedSection label="IOC Assessment" reason="No malicious indicators identified from enrichment" />
      )}

      {/* Hunt Results */}
      {hunt && !hunt.startsWith('No hunt performed') ? (
        <div className="animate-slide-up stagger-4">
          <Section label="Environment Threat Hunt" color="var(--yellow)">
            <Markdown>{hunt}</Markdown>
          </Section>
        </div>
      ) : (
        <SkippedSection label="Environment Threat Hunt" reason={hunt || 'Hunt was not triggered — no confirmed malicious IOCs to search for'} />
      )}

      {/* Raw */}
      <details className="animate-slide-up stagger-4 no-print" style={{ paddingBottom: 8 }}>
        <summary className="label-sm" style={{ color: 'var(--text-faint)', cursor: 'pointer', padding: '8px 0' }}>View Raw Output</summary>
        <pre className="mono" style={{ fontSize: 12, lineHeight: 1.6, padding: 20, overflow: 'auto', maxHeight: 300, borderRadius: 3, color: 'var(--text-dim)', background: 'var(--bg-surface)', border: '1px solid var(--border)', marginTop: 8 }}>
          {JSON.stringify(output, null, 2)}
        </pre>
      </details>
    </div>
  );
}

function confidenceLevel(source: string): 'high' | 'medium' | 'low' {
  const s = (source ?? '').toLowerCase();
  if (s.includes('high')) return 'high';
  if (s.includes('medium')) return 'medium';
  return 'low';
}

function ConfidenceBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const styles: Record<typeof level, { color: string; bg: string; border: string }> = {
    high: { color: 'var(--pink)', bg: 'rgba(240,78,152,0.1)', border: 'rgba(240,78,152,0.3)' },
    medium: { color: 'var(--yellow)', bg: 'rgba(254,197,20,0.1)', border: 'rgba(254,197,20,0.3)' },
    low: { color: 'var(--text-faint)', bg: 'var(--bg-surface)', border: 'var(--border-strong)' },
  };
  const s = styles[level];
  const label = level === 'high' ? 'HIGH CONFIDENCE' : level === 'medium' ? 'MEDIUM' : 'LOW';
  return (
    <span className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 2, fontWeight: 600, color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
      {label}
    </span>
  );
}

function MaliciousSection({ indicators }: { indicators: Indicator[] }) {
  const levels = indicators.map(ind => confidenceLevel(ind.source));
  const allLow = levels.every(l => l === 'low');
  const allHigh = levels.every(l => l === 'high');
  const hasHigh = levels.some(l => l === 'high');

  const sectionLabel = allLow ? 'IOC Assessment' : allHigh ? 'High-Risk Indicators' : hasHigh ? 'Suspicious Indicators' : 'Suspicious Indicators';
  const sectionColor = allLow ? 'var(--text-dim)' : allHigh ? 'var(--pink)' : 'var(--yellow)';

  return (
    <div className="animate-slide-up stagger-3">
      <Section label={sectionLabel} color={sectionColor}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {indicators.map((ind, i) => {
            const level = confidenceLevel(ind.source);
            const isLow = level === 'low';
            return (
              <div key={i} className="print-indicator-card print-report-row" style={{
                padding: 20, borderRadius: 3, position: 'relative', overflow: 'hidden',
                border: isLow ? '1px solid var(--border-strong)' : level === 'high' ? '1px solid rgba(240,78,152,0.2)' : '1px solid rgba(254,197,20,0.2)',
                background: isLow ? 'var(--bg-surface)' : level === 'high' ? 'rgba(240,78,152,0.03)' : 'rgba(254,197,20,0.03)',
              }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: isLow ? 'var(--text-faint)' : level === 'high' ? 'var(--pink)' : 'var(--yellow)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, paddingLeft: 8 }}>
                  <IocBadge type={ind.type} />
                  <ConfidenceBadge level={level} />
                </div>
                <p className="mono" style={{ fontSize: 13, color: 'var(--text)', marginBottom: 8, paddingLeft: 8, wordBreak: 'break-all' }}>{ind.value}</p>
                <div style={{ paddingLeft: 8 }}><Markdown>{ind.details}</Markdown></div>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

function FailedView() {
  return (
    <div style={{ maxWidth: 760, margin: '40px auto 0' }} className="animate-slide-up">
      <div className="card card-glow-pink card-accent-pink" style={{ padding: 32 }}>
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ width: 64, height: 64, flexShrink: 0, borderRadius: '50%', border: '2px solid var(--pink)', background: 'rgba(240,78,152,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01" stroke="var(--pink)" strokeWidth="2" strokeLinecap="round" /><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="var(--pink)" strokeWidth="2" /></svg>
          </div>
          <div>
            <p className="label" style={{ color: 'var(--pink)', marginBottom: 8 }}>Analysis Failed</p>
            <h3 className="display" style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Workflow Error</h3>
            <p style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.6 }}>The analysis workflow encountered an error. Please try again.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GenericView({ output }: { output: Record<string, unknown> }) {
  const summary = (['summary', 'description', 'message'] as const).reduce<string | null>((a, k) => a ?? (typeof output[k] === 'string' ? output[k] as string : null), null);
  return (
    <div style={{ maxWidth: 760, margin: '40px auto 0' }} className="animate-slide-up">
      <div className="card card-glow-teal card-accent-teal" style={{ padding: 32 }}>
        {summary && <p style={{ fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.65 }}>{summary}</p>}
        <details className="no-print" style={{ marginTop: 16 }}>
          <summary className="label-sm" style={{ color: 'var(--text-faint)', cursor: 'pointer' }}>View Raw Output</summary>
          <pre className="mono" style={{ fontSize: 12, lineHeight: 1.6, padding: 16, overflow: 'auto', maxHeight: 300, borderRadius: 3, color: 'var(--text-dim)', background: 'var(--bg-surface)', border: '1px solid var(--border)', marginTop: 8 }}>
            {JSON.stringify(output, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}
