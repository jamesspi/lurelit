'use client';

import { useEffect, useMemo, useState } from 'react';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';

const sections = [
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'docker', label: 'Installation & Deployment' },
  { id: 'vercel', label: 'Deploy to Vercel' },
  { id: 'securing-https', label: 'Securing with HTTPS' },
  { id: 'setup-wizard', label: 'First-Time Setup' },
  { id: 'configuration', label: 'Configuration' },
  { id: 'prerequisites', label: 'Kibana Prerequisites' },
  { id: 'connectors', label: 'Connectors' },
  { id: 'workflow-setup', label: 'Workflow Setup' },
  { id: 'find-workflow-id', label: 'Finding Your Workflow ID' },
  { id: 'permissions', label: 'Permissions' },
  { id: 'using-lurelit', label: 'Using Lurelit' },
  { id: 'features', label: 'Features' },
  { id: 'history-analytics', label: 'History & Analytics' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'testing', label: 'Testing' },
  { id: 'troubleshooting', label: 'Troubleshooting' },
];

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="mono" style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 4, padding: '16px 20px', fontSize: 12, lineHeight: 1.7,
      overflowX: 'auto', color: 'var(--text-dim)', margin: '12px 0',
    }}>
      <code>{children}</code>
    </pre>
  );
}

function SectionCard({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ scrollMarginTop: 100, marginBottom: 48 }}>
      <div className="card" style={{ padding: '32px 36px' }}>
        <h2 className="display" style={{
          fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 800, letterSpacing: '-0.03em',
          marginBottom: 24, color: 'var(--text)',
        }}>
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}

function SubHead({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mono" style={{
      fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
      color: 'var(--pink-bright)', marginTop: 28, marginBottom: 12, fontWeight: 600,
    }}>
      {children}
    </h3>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.65, marginBottom: 14 }}>{children}</p>;
}

function BulletList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul style={{ paddingLeft: 20, margin: '10px 0 16px' }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: 6 }}>{item}</li>
      ))}
    </ul>
  );
}

function InlineCode({ children }: { children: string }) {
  return (
    <code className="mono" style={{
      fontSize: 12, background: 'var(--bg-surface)', border: '1px solid var(--border)',
      padding: '2px 7px', borderRadius: 3, color: 'var(--teal-bright)',
    }}>
      {children}
    </code>
  );
}

function NumberedList({ items }: { items: React.ReactNode[] }) {
  return (
    <ol style={{ paddingLeft: 20, margin: '10px 0 16px', listStyleType: 'decimal' }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: 6 }}>{item}</li>
      ))}
    </ol>
  );
}

function CheckItem({ children, done }: { children: React.ReactNode; done?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
      <span style={{
        width: 18, height: 18, borderRadius: 3, flexShrink: 0, marginTop: 2,
        border: done ? '1px solid var(--teal)' : '1px solid var(--border-strong)',
        background: done ? 'var(--teal-soft)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, color: 'var(--teal-bright)',
      }}>
        {done ? '✓' : ''}
      </span>
      <span style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.6 }}>{children}</span>
    </div>
  );
}

function AlertBox({ type, children }: { type: 'info' | 'warning' | 'tip'; children: React.ReactNode }) {
  const colors = {
    info: { bg: 'rgba(0, 200, 200, 0.05)', border: 'var(--teal)', label: 'NOTE' },
    warning: { bg: 'rgba(255, 100, 100, 0.05)', border: 'var(--pink-bright)', label: 'WARNING' },
    tip: { bg: 'rgba(100, 200, 100, 0.05)', border: 'var(--teal-bright)', label: 'TIP' },
  };
  const c = colors[type];
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 4, padding: '14px 18px', margin: '14px 0' }}>
      <span className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: c.border, fontWeight: 700 }}>{c.label}</span>
      <div style={{ marginTop: 6, fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let idx = lower.indexOf(needle);
  while (idx !== -1) {
    if (idx > cursor) parts.push(text.slice(cursor, idx));
    parts.push(
      <mark key={`${idx}-${needle}`} style={{
        background: 'rgba(0,191,179,0.18)',
        color: 'var(--teal-bright)',
        border: '1px solid rgba(0,191,179,0.25)',
        borderRadius: 2,
        padding: '0 2px',
      }}>
        {text.slice(idx, idx + q.length)}
      </mark>
    );
    cursor = idx + q.length;
    idx = lower.indexOf(needle, cursor);
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts}</>;
}

export default function DocsPage() {
  const [search, setSearch] = useState('');
  const [sectionIndex, setSectionIndex] = useState<Record<string, string>>({});

  useEffect(() => {
    const index: Record<string, string> = {};
    for (const section of sections) {
      const el = document.getElementById(section.id);
      index[section.id] = (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
    }
    const frame = window.requestAnimationFrame(() => setSectionIndex(index));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const root = document.querySelector('[data-docs-content]');
    if (!root) return;

    root.querySelectorAll('mark.docs-search-highlight').forEach(mark => {
      const text = document.createTextNode(mark.textContent ?? '');
      mark.replaceWith(text);
    });
    root.normalize();

    const q = search.trim();
    if (!q) return;

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest('mark, code, pre, input, textarea')) return NodeFilter.FILTER_REJECT;
        if (!node.nodeValue || !regex.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        regex.lastIndex = 0;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const nodes: Text[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode as Text);

    for (const node of nodes) {
      const value = node.nodeValue ?? '';
      const frag = document.createDocumentFragment();
      let cursor = 0;
      value.replace(regex, (match, offset) => {
        if (offset > cursor) frag.appendChild(document.createTextNode(value.slice(cursor, offset)));
        const mark = document.createElement('mark');
        mark.className = 'docs-search-highlight';
        mark.textContent = match;
        frag.appendChild(mark);
        cursor = offset + match.length;
        return match;
      });
      if (cursor < value.length) frag.appendChild(document.createTextNode(value.slice(cursor)));
      node.replaceWith(frag);
    }
  }, [search]);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return sections
      .map((s, i) => {
        const title = s.label.toLowerCase();
        const body = (sectionIndex[s.id] ?? '').toLowerCase();
        const haystack = `${title} ${s.id} ${body}`;
        if (!haystack.includes(q)) return null;
        const titleHit = title.includes(q) ? 100 : 0;
        const idHit = s.id.includes(q) ? 50 : 0;
        const bodyIndex = body.indexOf(q);
        const bodyHit = bodyIndex >= 0 ? 20 : 0;
        const score = titleHit + idHit + bodyHit;
        const source = sectionIndex[s.id] || s.label;
        const idx = Math.max(0, source.toLowerCase().indexOf(q));
        const start = Math.max(0, idx - 55);
        const snippet = source.slice(start, start + 150).trim();
        return { ...s, index: i, score, snippet: `${start > 0 ? '…' : ''}${snippet}${start + 150 < source.length ? '…' : ''}` };
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score || a!.index - b!.index) as Array<{ id: string; label: string; index: number; score: number; snippet: string }>;
  }, [search, sectionIndex]);

  return (
    <>
      <Nav />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: 80, paddingBottom: 64 }}>
        <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
          {/* Header */}
          <div className="row gap-4 animate-fade-in" style={{ marginBottom: 8, paddingTop: 40 }}>
            <span className="label" style={{ color: 'var(--teal-bright)' }}>{'// Documentation'}</span>
          </div>

          <h1 className="display animate-slide-up" style={{
            fontSize: 'clamp(34px, 5vw, 56px)', fontWeight: 800, letterSpacing: '-0.035em',
            lineHeight: 1.0, marginTop: 16, marginBottom: 16, color: 'var(--text)',
          }}>
            How to use <span style={{ color: 'var(--teal-bright)' }} className="glow-text-teal">Lurelit</span>.
          </h1>

          <p className="animate-slide-up stagger-1" style={{
            fontSize: 17, color: 'var(--text-dim)', maxWidth: 640, lineHeight: 1.55, marginBottom: 40,
          }}>
            Agentic phishing analysis powered by Elastic Security Workflows and Agent Builder. Upload a screenshot, get a verdict — with IOC enrichment and environment threat hunting built in.
          </p>

          {/* Layout: sidebar TOC + content */}
          <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start' }}>
            {/* Left sidebar TOC */}
            <aside className="hidden md:block" style={{
              width: 220, flexShrink: 0, position: 'sticky', top: 80,
              maxHeight: 'calc(100vh - 100px)', overflowY: 'auto',
            }}>
              <p className="mono" style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--pink)', marginBottom: 14, fontWeight: 600 }}>
                Contents
              </p>
              <input
                className="input mono"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search docs..."
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  fontSize: 11,
                  marginBottom: 12,
                  letterSpacing: '0.08em',
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {search.trim() ? (
                  searchResults.length > 0 ? searchResults.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      style={{
                        display: 'block',
                        padding: '9px 10px',
                        borderRadius: 3,
                        textDecoration: 'none',
                        border: '1px solid var(--border)',
                        background: 'rgba(0,191,179,0.04)',
                        marginBottom: 6,
                      }}
                    >
                      <span className="mono" style={{ display: 'block', fontSize: 10, color: 'var(--teal-bright)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                        {String(s.index + 1).padStart(2, '0')} · <Highlight text={s.label} query={search} />
                      </span>
                      <span style={{ display: 'block', fontSize: 11, lineHeight: 1.45, color: 'var(--text-faint)' }}><Highlight text={s.snippet} query={search} /></span>
                    </a>
                  )) : (
                    <span className="mono" style={{ fontSize: 11, color: 'var(--text-faint)', padding: '8px 10px' }}>No matches</span>
                  )
                ) : sections.map((s, i) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="mono"
                    style={{
                      fontSize: 11, color: 'var(--text-faint)', textDecoration: 'none',
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '7px 10px', borderRadius: 3, transition: 'all 0.2s',
                      borderLeft: '2px solid transparent',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.borderLeftColor = 'var(--teal)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.borderLeftColor = 'transparent'; }}
                  >
                    <span style={{ color: 'var(--teal)', fontSize: 10, minWidth: 16 }}>{String(i + 1).padStart(2, '0')}</span>
                    {s.label}
                  </a>
                ))}
              </div>
            </aside>

            {/* Main content */}
            <div data-docs-content style={{ flex: 1, minWidth: 0 }}>

          {/* 1. Getting Started */}
          <SectionCard id="getting-started" title="Getting Started">
            <Paragraph>
              Lurelit is an agentic phishing &amp; smishing screenshot analyzer powered by Elastic Security Workflows and Agent Builder. Upload a suspicious screenshot, and Lurelit runs a multi-step AI pipeline — vision analysis, IOC extraction, VirusTotal &amp; urlscan.io enrichment, and autonomous ES|QL threat hunting across your environment logs — then delivers a structured verdict.
            </Paragraph>

            <SubHead>What You Need</SubHead>
            <BulletList items={[
              <><strong style={{ color: 'var(--text)' }}>Elastic Stack 9.4+</strong> with Security Workflows (GA) and Agent Builder</>,
              <><strong style={{ color: 'var(--text)' }}>API keys</strong> for Anthropic (Claude vision), VirusTotal, and urlscan.io</>,
              <><strong style={{ color: 'var(--text)' }}>Node.js 20+</strong> (for running from source) or <strong style={{ color: 'var(--text)' }}>Docker</strong></>,
            ]} />

            <SubHead>Quick Start</SubHead>
            <NumberedList items={[
              <>Install Lurelit (from source or Docker — see next section)</>,
              <>Complete the first-time setup wizard (connects to Kibana, imports workflow)</>,
              <>Login with your Kibana credentials</>,
              <>Upload a screenshot and get a verdict</>,
            ]} />
          </SectionCard>

          {/* 2. Installation & Deployment */}
          <SectionCard id="docker" title="Installation &amp; Deployment">
            <Paragraph>
              Lurelit can be installed from source or run as a Docker container. Both methods are equally supported and run on port <InlineCode>5001</InlineCode> by default.
            </Paragraph>

            <SubHead>From Source</SubHead>
            <CodeBlock>{`git clone https://github.com/jamesspi/lurelit.git
cd lurelit
npm install
npm run dev
# Open http://localhost:5001
# Admin key shown in terminal`}</CodeBlock>
            <Paragraph>
              Requires <strong style={{ color: 'var(--text)' }}>Node.js 20+</strong>. Use this for local development or when you want hot-reload during customization.
            </Paragraph>

            <SubHead>With Docker</SubHead>
            <CodeBlock>{`git clone https://github.com/jamesspi/lurelit.git
cd lurelit
docker compose up
# Open http://localhost:5001
# Admin key shown in container logs: docker compose logs lurelit`}</CodeBlock>
            <Paragraph>
              The container uses a multi-stage build with <InlineCode>node:22-alpine</InlineCode> and runs as a non-root user. No Node.js installation required on the host.
            </Paragraph>

            <SubHead>Default docker-compose.yml</SubHead>
            <CodeBlock>{`version: '3.8'
services:
  lurelit:
    build: .
    ports:
      - "5001:5001"
    environment:
      - CONFIG_SECRET=change-me-to-a-random-string
      # Uncomment and set these to skip the setup wizard:
      # - KIBANA_URL=https://your-kibana-url
      # - WORKFLOW_ID=your-workflow-id
    volumes:
      - lurelit-data:/app/data
    restart: unless-stopped

volumes:
  lurelit-data:`}</CodeBlock>
            <Paragraph>
              The <InlineCode>lurelit-data</InlineCode> Docker volume mounts at <InlineCode>/app/data</InlineCode> and persists your encrypted configuration file (<InlineCode>data/.smish-config.enc</InlineCode>) across container rebuilds. Running <InlineCode>docker compose down && docker compose up --build</InlineCode> preserves your setup config.
            </Paragraph>

            <AlertBox type="warning">
              Do not delete the <InlineCode>data/</InlineCode> directory or remove the <InlineCode>lurelit-data</InlineCode> volume unless you intend to reset all configuration. If the volume is removed, you&apos;ll need to re-run the setup wizard.
            </AlertBox>

            <SubHead>With Docker + Env Vars (Skip Setup Wizard)</SubHead>
            <Paragraph>
              To skip the wizard entirely, uncomment and set <InlineCode>KIBANA_URL</InlineCode> + <InlineCode>WORKFLOW_ID</InlineCode> in your <InlineCode>docker-compose.yml</InlineCode>:
            </Paragraph>
            <CodeBlock>{`    environment:
      - CONFIG_SECRET=change-me-to-a-random-string
      - KIBANA_URL=https://your-kibana:5601
      - WORKFLOW_ID=your-workflow-id`}</CodeBlock>
            <Paragraph>
              When both <InlineCode>KIBANA_URL</InlineCode> and <InlineCode>WORKFLOW_ID</InlineCode> are set, the app bypasses the setup wizard entirely and goes straight to the login page. These env vars override any file-based config. Ideal for pre-configured deployments and CI/CD.
            </Paragraph>

            <SubHead>Environment Variables</SubHead>
            <BulletList items={[
              <><InlineCode>CONFIG_SECRET</InlineCode> — Encryption key for stored config and session cookies (AES-256-GCM). <strong style={{ color: 'var(--text)' }}>Must remain consistent across restarts</strong> — if changed, previously saved config becomes unreadable and you&apos;ll need to re-run setup.</>,
              <><InlineCode>KIBANA_URL</InlineCode> — (Optional) Full URL to your Kibana instance. Only needed to skip the setup wizard.</>,
              <><InlineCode>WORKFLOW_ID</InlineCode> — (Optional) Auto-generated workflow ID from Kibana. Only needed to skip the setup wizard.</>,
            ]} />

            <AlertBox type="info">
              Use <InlineCode>host.docker.internal</InlineCode> in <InlineCode>KIBANA_URL</InlineCode> to reach a Kibana instance running on your host machine. For remote Kibana deployments, use the full URL.
            </AlertBox>

            <SubHead>Admin Key</SubHead>
            <Paragraph>
              On first startup, Lurelit generates an <strong style={{ color: 'var(--text)' }}>admin key</strong> and prints it to the server terminal / Docker logs. This key is required to unlock the setup wizard. Copy it from the terminal output or from <InlineCode>docker compose logs lurelit</InlineCode>.
            </Paragraph>

            <SubHead>Standalone Build Optimization</SubHead>
            <Paragraph>
              The Next.js config sets <InlineCode>output: &apos;standalone&apos;</InlineCode>, which produces a minimal production build including only the files needed to run. The Docker image copies just the standalone output (<InlineCode>.next/standalone</InlineCode> + <InlineCode>.next/static</InlineCode> + <InlineCode>public/</InlineCode>) into the final layer, resulting in a small image size with fast cold starts.
            </Paragraph>

            <SubHead>Image Details</SubHead>
            <BulletList items={[
              <><strong style={{ color: 'var(--text)' }}>Base image:</strong> <InlineCode>node:22-alpine</InlineCode></>,
              <><strong style={{ color: 'var(--text)' }}>Port:</strong> 5001 (configurable via <InlineCode>PORT</InlineCode> env var)</>,
              <><strong style={{ color: 'var(--text)' }}>User:</strong> Runs as non-root <InlineCode>nextjs</InlineCode> user (UID 1001)</>,
              <><strong style={{ color: 'var(--text)' }}>Restart policy:</strong> <InlineCode>unless-stopped</InlineCode></>,
            ]} />
          </SectionCard>

          {/* Deploy to Vercel */}
          <SectionCard id="vercel" title="Deploy to Vercel">
            <Paragraph>
              Lurelit can be deployed to <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--teal)' }}>Vercel</a> as a serverless Next.js application. Since Vercel&apos;s filesystem is ephemeral, an <a href="https://vercel.com/marketplace" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--teal)' }}>Upstash Redis</a> store is used to persist config, admin keys, and avatars.
            </Paragraph>

            <SubHead>One-Click Deploy</SubHead>
            <Paragraph>
              Use the Deploy button in the <a href="https://github.com/jamesspi/lurelit" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--teal)' }}>README</a> to deploy with pre-configured environment variables and Upstash Redis provisioned automatically. During the flow, Vercel will prompt you to create an Upstash Redis database — choose any region close to your Elastic deployment for best latency.
            </Paragraph>

            <SubHead>Manual Setup</SubHead>
            <NumberedList items={[
              <>Import the Lurelit repository in Vercel (Framework: Next.js, auto-detected)</>,
              <>Add <strong style={{ color: 'var(--text)' }}>Upstash Redis</strong> from the Vercel Marketplace — this auto-sets <InlineCode>UPSTASH_REDIS_REST_URL</InlineCode>/<InlineCode>UPSTASH_REDIS_REST_TOKEN</InlineCode>, <InlineCode>KV_REST_API_URL</InlineCode>/<InlineCode>KV_REST_API_TOKEN</InlineCode>, or prefixed variants</>,
              <>Set environment variables: <InlineCode>CONFIG_SECRET</InlineCode> (required — encrypts config), <InlineCode>SETUP_SECRET</InlineCode> (optional — a fixed admin key for the setup wizard)</>,
              <>Deploy — visit your Vercel URL and run the setup wizard as normal</>,
            ]} />

            <SubHead>Adding Upstash Redis (Detailed)</SubHead>
            <Paragraph>
              If Upstash Redis was not provisioned during the one-click deploy, or you are setting up manually:
            </Paragraph>
            <NumberedList items={[
              <>In your Vercel project dashboard, go to the <strong style={{ color: 'var(--text)' }}>Storage</strong> tab</>,
              <>Click <strong style={{ color: 'var(--text)' }}>Create Database</strong> and select <strong style={{ color: 'var(--text)' }}>Upstash Redis (KV)</strong></>,
              <>Choose a <strong style={{ color: 'var(--text)' }}>name</strong> (e.g., <InlineCode>lurelit-store</InlineCode>) and a <strong style={{ color: 'var(--text)' }}>region</strong> — pick one geographically close to your Elastic cluster for lowest latency</>,
              <>Select the <strong style={{ color: 'var(--text)' }}>Free</strong> plan (sufficient for Lurelit&apos;s usage) or Pay as You Go for higher limits</>,
              <>Click <strong style={{ color: 'var(--text)' }}>Create</strong> — Vercel auto-adds Redis/KV REST URL and token environment variables to your project</>,
              <>Redeploy the project (Settings → Deployments → Redeploy) to pick up the new env vars</>,
            ]} />

            <SubHead>How It Works</SubHead>
            <Paragraph>
              When Upstash Redis or Vercel KV REST credentials are detected, Lurelit automatically uses Redis for all persistence (config, admin key, avatars) instead of the filesystem. The setup wizard, login, and all features work identically to self-hosted deployments. Vercel/serverless deployments require this durable storage unless you set <InlineCode>KIBANA_URL</InlineCode> and <InlineCode>WORKFLOW_ID</InlineCode> environment variables to skip the wizard.
            </Paragraph>

            <SubHead>Finding the Admin Key on Vercel</SubHead>
            <Paragraph>
              If you set <InlineCode>SETUP_SECRET</InlineCode> during deployment, use that value as the admin key. If you left it blank, Lurelit generates one automatically on first request. To find it:
            </Paragraph>
            <NumberedList items={[
              <>Go to your Vercel project dashboard → <strong style={{ color: 'var(--text)' }}>Logs</strong> tab</>,
              <>Visit your deployed URL once to trigger the first serverless function invocation</>,
              <>Look for the <InlineCode>Lurelit setup key: ...</InlineCode> message in the function logs</>,
              <>Copy the key and paste it into the setup wizard</>,
            ]} />
            <AlertBox type="tip">
              For simplicity, set <InlineCode>SETUP_SECRET</InlineCode> in your Vercel environment variables (Settings → Environment Variables) to a value you choose. This avoids needing to check the logs.
            </AlertBox>

            <AlertBox type="tip">
              You can also set <InlineCode>KIBANA_URL</InlineCode> and <InlineCode>WORKFLOW_ID</InlineCode> as Vercel env vars to skip the setup wizard entirely — the app will go straight to the login page.
            </AlertBox>
          </SectionCard>

          {/* Securing with HTTPS */}
          <SectionCard id="securing-https" title="Securing with HTTPS">
            <Paragraph>
              Lurelit runs on HTTP by default. For production deployments, TLS should be configured via a reverse proxy.
            </Paragraph>

            <SubHead>Recommended: Nginx Reverse Proxy</SubHead>
            <CodeBlock>{`server {
    listen 443 ssl;
    server_name lurelit.yourdomain.com;

    ssl_certificate /etc/ssl/certs/lurelit.crt;
    ssl_certificate_key /etc/ssl/private/lurelit.key;

    location / {
        proxy_pass http://localhost:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`}</CodeBlock>

            <SubHead>Alternative: Caddy (Auto-TLS with Let&apos;s Encrypt)</SubHead>
            <CodeBlock>{`lurelit.yourdomain.com {
    reverse_proxy localhost:5001
}`}</CodeBlock>
            <Paragraph>
              Caddy automatically provisions and renews certificates.
            </Paragraph>

            <SubHead>Docker with TLS</SubHead>
            <CodeBlock>{`# docker-compose.yml with Caddy
services:
  lurelit:
    build: .
    ports:
      - "5001:5001"
    environment:
      - KIBANA_URL=https://your-kibana:5601
      - WORKFLOW_ID=your-workflow-id
  caddy:
    image: caddy:alpine
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
    depends_on:
      - lurelit`}</CodeBlock>

            <SubHead>Important Notes</SubHead>
            <BulletList items={[
              <>When running behind a proxy, session cookies are marked <InlineCode>secure: true</InlineCode> in production (<InlineCode>NODE_ENV=production</InlineCode>)</>,
              <>Set <InlineCode>NODE_ENV=production</InlineCode> when deploying with TLS</>,
              <>The <InlineCode>X-Forwarded-Proto</InlineCode> header ensures Lurelit knows it&apos;s behind HTTPS</>,
              <>Native TLS support may be added in a future release</>,
            ]} />
          </SectionCard>

          {/* 3. First-Time Setup */}
          <SectionCard id="setup-wizard" title="First-Time Setup">
            <Paragraph>
              On first launch, Lurelit auto-detects that no configuration exists and redirects you to a 5-step guided setup wizard at <InlineCode>/setup</InlineCode>. The proxy checks for environment variables (<InlineCode>KIBANA_URL</InlineCode> + <InlineCode>WORKFLOW_ID</InlineCode>), the <InlineCode>smish_configured</InlineCode> cookie, and durable storage (Redis/KV) — if none contain configuration, all routes redirect to setup.
            </Paragraph>

            <SubHead>First-Time Setup (Step by Step)</SubHead>
            <NumberedList items={[
              <>On first startup, Lurelit generates an <strong style={{ color: 'var(--text)' }}>admin key</strong> and prints it to the server terminal / Docker logs. Copy it.</>,
              <>Navigate to <InlineCode>http://localhost:5001/setup</InlineCode> (the app redirects here automatically when unconfigured).</>,
              <>Paste the admin key to unlock the wizard.</>,
              <>Enter your <strong style={{ color: 'var(--text)' }}>Kibana URL</strong> (e.g., <InlineCode>http://localhost:5601</InlineCode>) and credentials (username/password with workflow execution privileges).</>,
              <>The wizard validates connectivity and checks prerequisites: Kibana 9.4+, Workflows API, Agent Builder, Security solution.</>,
              <>Review <strong style={{ color: 'var(--text)' }}>connectors</strong>: the wizard scans for required HTTP connectors (Anthropic, VirusTotal, urlscan.io) and optional ones (Slack). Create missing connectors by entering API keys directly in the wizard.</>,
              <>Select <strong style={{ color: 'var(--text)' }}>AI models</strong>: choose inference endpoints for enrichment/hunting (primary model) and report formatting (secondary model).</>,
              <>Import or select the <strong style={{ color: 'var(--text)' }}>Lurelit workflow</strong>: if a matching workflow exists, select it; otherwise import the bundled workflow with your configured connectors.</>,
              <>Configuration is encrypted and saved. You&apos;re redirected to the <strong style={{ color: 'var(--text)' }}>login page</strong>.</>,
              <>Login with your Kibana credentials (same ones from step 4).</>,
              <>Upload a screenshot and start analyzing!</>,
            ]} />

            <AlertBox type="tip">
              If you set <InlineCode>KIBANA_URL</InlineCode> and <InlineCode>WORKFLOW_ID</InlineCode> as environment variables (or in <InlineCode>docker-compose.yml</InlineCode>), the setup wizard is bypassed entirely and the app goes straight to the login page. The wizard is only needed for interactive first-time configuration.
            </AlertBox>

            <SubHead>Wizard Steps Summary</SubHead>
            <div style={{ margin: '16px 0 20px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                { step: 1, name: 'Connect', desc: 'Enter Kibana URL + credentials' },
                { step: 2, name: 'Prerequisites', desc: 'Auto-checks version, Workflows API, Agent Builder, Security' },
                { step: 3, name: 'Connectors', desc: 'Review required HTTP connectors (Anthropic, VT, urlscan, Slack)' },
                { step: 4, name: 'Workflow', desc: 'Import bundled workflow or select an existing one' },
                { step: 5, name: 'Ready', desc: 'Confirmation summary, save encrypted config, launch' },
              ].map((s) => (
                <div key={s.name} style={{
                  display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 14px',
                  borderRadius: 3, background: 'var(--bg-surface)', border: '1px solid var(--border)', minWidth: 160,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--teal)', fontWeight: 700 }}>{s.step}</span>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.06em' }}>{s.name}</span>
                  </div>
                  <span className="mono" style={{ fontSize: 9, color: 'var(--text-faint)' }}>{s.desc}</span>
                </div>
              ))}
            </div>

            <SubHead>Auto-Detection</SubHead>
            <Paragraph>
              The proxy (<InlineCode>src/proxy.ts</InlineCode>) runs on every request. If environment variables are missing, no <InlineCode>smish_configured</InlineCode> cookie exists, and no config is found in storage, the user is redirected to <InlineCode>/setup</InlineCode>. API routes return <InlineCode>503</InlineCode> with <InlineCode>{`{ needsSetup: true }`}</InlineCode>.
            </Paragraph>

            <SubHead>Re-Running Setup</SubHead>
            <Paragraph>
              To re-run the wizard after initial configuration, navigate directly to <InlineCode>/setup</InlineCode> (it&apos;s always accessible as a public path). You can also clear your stored configuration via <InlineCode>DELETE /api/settings</InlineCode> which removes the encrypted config and the <InlineCode>smish_configured</InlineCode> cookie, forcing the redirect again on next page load.
            </Paragraph>

            <AlertBox type="tip">
              The setup page is listed as a public path in the proxy, so it can always be accessed without authentication — even if you&apos;re already configured and logged in.
            </AlertBox>
          </SectionCard>

          {/* 4. Configuration */}
          <SectionCard id="configuration" title="Configuration">
            <SubHead>Environment Variables</SubHead>
            <Paragraph>
              Set these in your environment, <InlineCode>.env.local</InlineCode> file, or <InlineCode>docker-compose.yml</InlineCode>:
            </Paragraph>
            <CodeBlock>{`# Recommended — encryption key for stored config (must stay consistent)
CONFIG_SECRET=a-random-secret-for-encryption

# Optional — set both to skip the setup wizard entirely
KIBANA_URL=https://your-kibana.elastic.cloud
WORKFLOW_ID=your-workflow-id-from-kibana`}</CodeBlock>
            <BulletList items={[
              <><InlineCode>CONFIG_SECRET</InlineCode> — Secret key used to encrypt stored config and session cookies (AES-256-GCM). <strong style={{ color: 'var(--text)' }}>Must remain consistent across restarts.</strong> If changed, previously saved config becomes unreadable and you&apos;ll need to re-run the setup wizard.</>,
              <><InlineCode>KIBANA_URL</InlineCode> — (Optional) Full URL to your Kibana instance (no trailing slash). Append <InlineCode>/s/space-name</InlineCode> if using a non-default space. When set with <InlineCode>WORKFLOW_ID</InlineCode>, skips the setup wizard.</>,
              <><InlineCode>WORKFLOW_ID</InlineCode> — (Optional) The auto-generated ID of your imported workflow (see <a href="#find-workflow-id" style={{ color: 'var(--teal-bright)' }}>Finding Your Workflow ID</a>). When set with <InlineCode>KIBANA_URL</InlineCode>, skips the setup wizard.</>,
            ]} />

            <AlertBox type="warning">
              If you change <InlineCode>CONFIG_SECRET</InlineCode> after initial setup, the encrypted config file at <InlineCode>data/.smish-config.enc</InlineCode> becomes unreadable. You&apos;ll see &quot;Kibana URL not configured&quot; errors until you re-run the setup wizard or restore the original secret.
            </AlertBox>

            <SubHead>Config Storage</SubHead>
            <Paragraph>
              Configuration is encrypted (AES-256-GCM) and saved to <InlineCode>data/config.enc</InlineCode> (or Redis when durable storage is configured). In Docker, the <InlineCode>lurelit-data</InlineCode> volume persists this directory at <InlineCode>/app/data</InlineCode>, so config survives container rebuilds. On Vercel, an Upstash Redis or Vercel KV integration is required for persistent storage. Do not delete the <InlineCode>data/</InlineCode> directory or Redis keys unless you intend to reset all configuration.
            </Paragraph>
            <Paragraph>
              If the primary <InlineCode>data/</InlineCode> path isn&apos;t writable (e.g. permission issues in certain environments), the app gracefully falls back to <InlineCode>/tmp</InlineCode> for temporary storage.
            </Paragraph>

            <SubHead>Settings Modal</SubHead>
            <Paragraph>
              Click the gear icon in the nav bar to open the settings modal. It allows you to:
            </Paragraph>
            <BulletList items={[
              <>View and edit the <InlineCode>Kibana URL</InlineCode> and <InlineCode>Workflow ID</InlineCode></>,
              <>See whether configuration is managed via environment variables (displays an info banner when env vars are active)</>,
              <>Run a &quot;Test&quot; button that saves current settings and validates the Kibana connection via <InlineCode>POST /api/settings/test</InlineCode></>,
              <>UI changes override environment variables when saved</>,
            ]} />

            <SubHead>UI-Based Setup</SubHead>
            <Paragraph>
              If environment variables are not set, you can configure Lurelit through the setup wizard on first launch, or the Settings modal in the navigation bar. Settings are encrypted and persisted to <InlineCode>data/.smish-config.enc</InlineCode> on disk.
            </Paragraph>

            <SubHead>Authentication</SubHead>
            <Paragraph>
              Lurelit supports both Kibana username/password credentials and Elastic API keys. Username/password is best for self-managed or stateful Elastic deployments. API key auth is recommended for Elastic Serverless environments.
            </Paragraph>
            <BulletList items={[
              <><strong style={{ color: 'var(--text)' }}>Username / password</strong> — Validated against Kibana&apos;s <InlineCode>/api/status</InlineCode> endpoint and stored in an encrypted 24-hour session cookie.</>,
              <><strong style={{ color: 'var(--text)' }}>API key</strong> — Sent as <InlineCode>Authorization: ApiKey ...</InlineCode>. The key must be able to call Workflows, Agent Builder, Actions/connectors, and read the indices used by the hunt step.</>,
            ]} />
            <Paragraph>
              When using API key auth, the login screen asks for a <strong style={{ color: 'var(--text)' }}>display name</strong>. This is the name shown in the nav bar, history rows, &quot;Submitted by&quot; labels, and Top Analysts metrics. Lurelit attempts to resolve the current Kibana user, but the entered display name takes priority because Serverless API key executions can otherwise appear as numeric principals or generic API-key users.
            </Paragraph>
          </SectionCard>

          {/* 5. Kibana Prerequisites */}
          <SectionCard id="prerequisites" title="Kibana Prerequisites">
            <Paragraph>
              Before deploying Lurelit, ensure the following components are available and configured in your environment.
            </Paragraph>

            <AlertBox type="tip">
              Don&apos;t have an Elastic cluster yet? Start a free <a href="https://cloud.elastic.co/registration" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--teal)' }}>Elastic Cloud trial</a> or use <a href="https://www.elastic.co/docs/deploy-manage/deploy/self-managed/local-development-installation-quickstart" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--teal)' }}>start-local</a> for quick self-managed testing (a trial license is required for Workflows and Agent Builder features).
            </AlertBox>

            <SubHead>Infrastructure</SubHead>
            <CheckItem>Elastic Stack <strong style={{ color: 'var(--text)' }}>9.4+</strong> deployed and accessible</CheckItem>
            <CheckItem>Kibana with <strong style={{ color: 'var(--text)' }}>Security Workflows</strong> feature enabled (GA in 9.4+)</CheckItem>
            <CheckItem>Agent Builder accessible from the <strong style={{ color: 'var(--text)' }}>Agents</strong> item in the left-hand navigation</CheckItem>
            <CheckItem>The system-created <strong style={{ color: 'var(--text)' }}>Elastic AI Agent</strong> visible with Elastic capabilities enabled</CheckItem>
            <CheckItem>Node.js 20+ for local development</CheckItem>

            <SubHead>API Keys Required</SubHead>
            <CheckItem>Anthropic API key (for Claude Opus 4.7 vision analysis)</CheckItem>
            <CheckItem>VirusTotal API key (for IOC enrichment)</CheckItem>
            <CheckItem>urlscan.io API key (for domain/URL reputation)</CheckItem>
            <CheckItem>Slack Bot token (optional — for report notifications)</CheckItem>

            <SubHead>Kibana User Privileges</SubHead>
            <CheckItem>Workflow execution privileges (<InlineCode>workflowsManagement:execute</InlineCode>, <InlineCode>read</InlineCode>, <InlineCode>readExecution</InlineCode>)</CheckItem>
            <CheckItem>Connector execution (<InlineCode>actions:execute</InlineCode>)</CheckItem>
            <CheckItem>Agent Builder access</CheckItem>
            <CheckItem>Read access to <InlineCode>logs-*</InlineCode>, <InlineCode>filebeat-*</InlineCode>, <InlineCode>.alerts-security.*</InlineCode> indices</CheckItem>

            <SubHead>Elastic Serverless</SubHead>
            <Paragraph>
              For Elastic Serverless, use the Kibana/project endpoint and choose <strong style={{ color: 'var(--text)' }}>API Key</strong> in the setup wizard and login screen. Username/password remains supported for stateful Elastic deployments.
            </Paragraph>
            <Paragraph>
              If the prerequisite checker reports <strong style={{ color: 'var(--text)' }}>Needs access</strong>, the API key is valid but likely lacks Kibana privileges for Workflows, Agent Builder, Actions/connectors, or the indices used by the hunt step.
            </Paragraph>

            <SubHead>Version Compatibility</SubHead>
            <div style={{ margin: '12px 0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
              {[
                { label: 'Kibana', desc: '9.4+' },
                { label: 'Elastic Stack', desc: '9.4+' },
                { label: 'Workflows', desc: 'GA (9.4+)' },
              ].map(t => (
                <div key={t.label} style={{ padding: '12px 16px', borderRadius: 3, background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--teal-bright)', fontWeight: 600 }}>{t.label}</span>
                  <p className="mono" style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 4 }}>{t.desc}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* 6. Connectors */}
          <SectionCard id="connectors" title="Connectors">
            <AlertBox type="warning">
              Connector IDs are <strong>auto-generated</strong> by Kibana when you create them. Do NOT expect your connector IDs to match any documentation examples. The workflow YAML shipped with Lurelit references the author&apos;s connector IDs — you must update them to match your own after creating connectors.
            </AlertBox>

            <AlertBox type="info">
              HTTP connectors used by Workflows are created <strong>within the Workflows UI</strong> (Security → Workflows → edit your workflow → connector settings), NOT from the Stack Management → Connectors page. These are different connector types. The only pre-existing connector you may already have is the <strong>managed inference endpoint</strong> used by AI Agent steps.
            </AlertBox>

            <SubHead>Anthropic API Connector</SubHead>
            <Paragraph>
              Powers the AI screenshot analysis using Claude Opus 4.7 with vision capabilities.
            </Paragraph>
            <NumberedList items={[
              <>Open your workflow in the YAML editor</>,
              <>For the <InlineCode>analyze_screenshot</InlineCode> step, create an HTTP connector</>,
              <>Set the URL to:</>,
            ]} />
            <CodeBlock>{`https://api.anthropic.com/v1/messages`}</CodeBlock>
            <Paragraph>Authentication headers:</Paragraph>
            <CodeBlock>{`x-api-key: <your-anthropic-api-key>
anthropic-version: 2023-06-01
content-type: application/json`}</CodeBlock>

            <SubHead>VirusTotal Connectors</SubHead>
            <Paragraph>
              Three separate HTTP connectors are needed for full VirusTotal coverage. All share the same API key but target different endpoints.
            </Paragraph>

            <Paragraph><strong style={{ color: 'var(--text)' }}>1. VT URL Submit</strong> — submits URLs for scanning</Paragraph>
            <CodeBlock>{`URL: https://www.virustotal.com/api/v3/urls
Method: POST
Header: x-apikey: <your-virustotal-api-key>`}</CodeBlock>

            <Paragraph><strong style={{ color: 'var(--text)' }}>2. VT Base</strong> — polls analysis results and general queries</Paragraph>
            <CodeBlock>{`URL: https://www.virustotal.com/api/v3
Method: GET
Header: x-apikey: <your-virustotal-api-key>`}</CodeBlock>

            <Paragraph><strong style={{ color: 'var(--text)' }}>3. VT Files</strong> — file hash lookups</Paragraph>
            <CodeBlock>{`URL: https://www.virustotal.com/api/v3/files
Method: GET
Header: x-apikey: <your-virustotal-api-key>`}</CodeBlock>

            <AlertBox type="tip">
              For IP address reports, the workflow uses a native VirusTotal connector (the <InlineCode>virustotal.getIpReport</InlineCode> action type). If you have a native VirusTotal connector already configured in Stack Management → Connectors, you can reference its auto-generated ID in the workflow.
            </AlertBox>

            <SubHead>urlscan.io Connector</SubHead>
            <Paragraph>
              Searches urlscan.io for domain/URL/IP reputation data.
            </Paragraph>
            <CodeBlock>{`URL: https://urlscan.io/api/v1/search/
Method: GET
Header: API-Key: <your-urlscan-api-key>`}</CodeBlock>
            <Paragraph>
              The workflow sends GET requests with query parameters <InlineCode>q</InlineCode> (search query) and <InlineCode>size</InlineCode> (result limit).
            </Paragraph>

            <SubHead>Slack Connector (Optional)</SubHead>
            <Paragraph>
              If you want analysis reports posted to a Slack channel, create an HTTP connector for the Slack API.
            </Paragraph>
            <CodeBlock>{`URL: https://slack.com/api/chat.postMessage
Method: POST
Header: Authorization: Bearer <your-slack-bot-token>
Header: Content-Type: application/json`}</CodeBlock>
            <Paragraph>
              The workflow posts Block Kit formatted messages. Update the <InlineCode>channel</InlineCode> field in the <InlineCode>send_slack_report</InlineCode> step to your channel ID.
            </Paragraph>

            <SubHead>AI Inference Endpoints</SubHead>
            <Paragraph>
              The <InlineCode>ai.agent</InlineCode> steps use Kibana&apos;s managed inference connectors. These are pre-configured by Elastic and route through inference infrastructure to the Anthropic API. You should not need to create these manually — they appear automatically when you have an Anthropic integration configured.
            </Paragraph>
            <BulletList items={[
              <><InlineCode>.anthropic-claude-4.6-opus-chat_completion</InlineCode> — Used by the summarize_enrichment AI agent step</>,
              <><InlineCode>.anthropic-claude-4.6-sonnet-chat_completion</InlineCode> — Used by the Slack message formatting step</>,
            ]} />
          </SectionCard>

          {/* 7. Workflow Setup */}
          <SectionCard id="workflow-setup" title="Workflow Setup">
            <AlertBox type="tip">
              The workflow YAML ships with this project in the <InlineCode>workflow/</InlineCode> directory. You do NOT need to build it yourself — simply import it into your Kibana instance.
            </AlertBox>

            <SubHead>What the Workflow Does</SubHead>
            <Paragraph>
              The workflow executes a multi-step agentic pipeline on each submitted screenshot:
            </Paragraph>
            <div style={{ margin: '16px 0 20px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                { step: 1, name: 'AI Analysis', desc: 'Anthropic Claude Opus 4.7 vision' },
                { step: 2, name: 'Parse Results', desc: 'Extract structured classification' },
                { step: 3, name: 'IOC Enrichment', desc: 'VirusTotal + urlscan.io' },
                { step: 4, name: 'Summarize', desc: 'AI Agent enrichment analysis' },
                { step: 5, name: 'Environment Hunt', desc: 'ES|QL threat hunting' },
                { step: 6, name: 'Final Report', desc: 'Structured output + Slack' },
              ].map((s) => (
                <div key={s.name} style={{
                  display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 14px',
                  borderRadius: 3, background: 'var(--bg-surface)', border: '1px solid var(--border)', minWidth: 160,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--teal)', fontWeight: 700 }}>{s.step}</span>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.06em' }}>{s.name}</span>
                  </div>
                  <span className="mono" style={{ fontSize: 9, color: 'var(--text-faint)' }}>{s.desc}</span>
                </div>
              ))}
            </div>

            <SubHead>Importing the Workflow</SubHead>
            <NumberedList items={[
              <>Navigate to <strong style={{ color: 'var(--text)' }}>Security → Workflows</strong> in Kibana</>,
              <>Click <strong style={{ color: 'var(--text)' }}>Create new workflow</strong></>,
              <>Switch to the <strong style={{ color: 'var(--text)' }}>YAML editor</strong></>,
              <>Paste the contents of <InlineCode>workflow/phishing-smishing-screenshot-analyzer.yaml</InlineCode> from this project</>,
              <>Kibana will assign the workflow a unique ID automatically</>,
              <>Update all <InlineCode>connector-id</InlineCode> references in the YAML to match YOUR connector IDs (see <a href="#connectors" style={{ color: 'var(--teal-bright)' }}>Connectors</a> section)</>,
              <>Ensure the trigger is set to <InlineCode>manual</InlineCode></>,
              <>Save and enable the workflow</>,
            ]} />

            <AlertBox type="warning">
              The workflow ID is <strong>generated by Kibana</strong> when you create/import the workflow — you cannot choose it. After importing, you must copy the generated ID and paste it into Lurelit&apos;s settings. See <a href="#find-workflow-id" style={{ color: 'var(--teal-bright)' }}>Finding Your Workflow ID</a> below.
            </AlertBox>

            <SubHead>Updating Connector References</SubHead>
            <Paragraph>
              After creating your connectors within the Workflows UI, update these <InlineCode>connector-id</InlineCode> fields in the YAML:
            </Paragraph>
            <CodeBlock>{`# Replace these with YOUR connector IDs:
analyze_screenshot:     connector-id: <your-anthropic-connector-id>
vt_url_submit:          connector-id: <your-vt-url-connector-id>
vt_url_poll_check:      connector-id: <your-vt-base-connector-id>
vt_hash_lookup:         connector-id: <your-vt-files-connector-id>
vt_ip_lookup:           connector-id: <your-vt-native-connector-id>
urlscan_*_search:       connector-id: <your-urlscan-connector-id>
send_slack_report:      connector-id: <your-slack-connector-id>
format_slack_message:   connector-id: <your-inference-endpoint>`}</CodeBlock>

            <SubHead>Workflow Inputs</SubHead>
            <Paragraph>
              The workflow accepts two inputs when triggered:
            </Paragraph>
            <BulletList items={[
              <><InlineCode>image_base64</InlineCode> (string, required) — The base64-encoded screenshot data</>,
              <><InlineCode>media_type</InlineCode> (string, default: &quot;image/png&quot;) — MIME type of the image</>,
            ]} />
          </SectionCard>

          {/* 8. Finding Your Workflow ID */}
          <SectionCard id="find-workflow-id" title="Finding Your Workflow ID">
            <Paragraph>
              After importing the workflow into Kibana, you need to find the auto-generated workflow ID and configure it in Lurelit.
            </Paragraph>

            <SubHead>Method 1: From the URL</SubHead>
            <NumberedList items={[
              <>Navigate to <strong style={{ color: 'var(--text)' }}>Security → Workflows</strong></>,
              <>Click on your imported workflow to open it</>,
              <>Look at the browser URL — it will contain the workflow ID:</>,
            ]} />
            <CodeBlock>{`https://your-kibana.example.com/app/security/workflows/<workflow-id>

# Example:
https://localhost:5601/app/security/workflows/phishing-smishing-screenshot-analyzer`}</CodeBlock>

            <SubHead>Method 2: From the Workflow Details Panel</SubHead>
            <NumberedList items={[
              <>Open the workflow in the editor</>,
              <>Click the <strong style={{ color: 'var(--text)' }}>Info</strong> or <strong style={{ color: 'var(--text)' }}>Details</strong> panel</>,
              <>The workflow ID is displayed in the metadata section</>,
            ]} />

            <SubHead>Method 3: Via API</SubHead>
            <CodeBlock>{`# List all workflows and find yours:
curl -u 'user:pass' -H 'kbn-xsrf: true' \\
  'https://your-kibana/api/workflows/workflows' | jq '.[]'`}</CodeBlock>

            <SubHead>Configuring in Lurelit</SubHead>
            <Paragraph>
              Once you have the workflow ID, enter it in one of two ways:
            </Paragraph>
            <BulletList items={[
              <><strong style={{ color: 'var(--text)' }}>Environment variable:</strong> Set <InlineCode>WORKFLOW_ID=your-workflow-id</InlineCode> in <InlineCode>.env.local</InlineCode></>,
              <><strong style={{ color: 'var(--text)' }}>Settings UI:</strong> Click the Settings button in the nav bar and paste the workflow ID into the &quot;Workflow ID&quot; field</>,
            ]} />

            <AlertBox type="info">
              This is why the Lurelit settings UI has a dedicated field for Workflow ID — every deployment will have a different one because Kibana generates it on import.
            </AlertBox>
          </SectionCard>

          {/* 9. Permissions */}
          <SectionCard id="permissions" title="Permissions">
            <Paragraph>
              The user account used by Lurelit to connect to Kibana needs specific privileges to execute workflows, run the AI agent, and access security data.
            </Paragraph>

            <SubHead>Kibana Space Privileges</SubHead>
            <CodeBlock>{`Feature          Privilege    Purpose
─────────────────────────────────────────────────────────────────────
Workflows        All          Create, read, execute workflows
Security         Read         Access security alerts for hunt step
Actions          All          Execute connectors (VT, urlscan, etc.)
AI Agent         All          Execute ai.agent steps via Agent Builder`}</CodeBlock>

            <SubHead>Workflow Execution Privileges</SubHead>
            <BulletList items={[
              <><InlineCode>workflowsManagement:execute</InlineCode> — Trigger workflow executions via the API</>,
              <><InlineCode>workflowsManagement:read</InlineCode> — Read workflow definitions (needed to verify workflow exists)</>,
              <><InlineCode>workflowsManagement:readExecution</InlineCode> — Poll execution status, read step logs and output</>,
            ]} />

            <SubHead>Agent Builder Execution</SubHead>
            <Paragraph>
              The <InlineCode>ai.agent</InlineCode> steps in the workflow execute as the Elastic AI Agent. The user running the workflow must have:
            </Paragraph>
            <BulletList items={[
              <>Permission to invoke Agent Builder agents</>,
              <>The <InlineCode>elastic-ai-agent</InlineCode> must be set to <strong style={{ color: 'var(--text)' }}>public</strong> visibility</>,
              <>ES|QL execution privileges (the agent runs queries autonomously)</>,
            ]} />

            <SubHead>Index Read Access (Hunt Step)</SubHead>
            <Paragraph>
              The environment hunt step runs ES|QL queries across your data. The executing user needs read access to:
            </Paragraph>
            <CodeBlock>{`logs-*                    Network, DNS, HTTP, and endpoint logs
filebeat-*                Filebeat ingested log data
.alerts-security.*        Security alerts (detection rules)
packetbeat-*              Network packet data (if available)
winlogbeat-*              Windows event logs (if available)`}</CodeBlock>

            <AlertBox type="info">
              If the hunt step finds no results, it may be because the user lacks read access to the relevant indices. Check Kibana → Stack Management → Roles to verify index permissions.
            </AlertBox>

            <SubHead>Connector Execution</SubHead>
            <Paragraph>
              The user must have the <InlineCode>actions:execute</InlineCode> privilege to call connectors during workflow execution. This is typically granted via the <strong style={{ color: 'var(--text)' }}>Actions and Connectors → All</strong> feature privilege in the Kibana space.
            </Paragraph>
          </SectionCard>

          {/* 10. Using Lurelit */}
          <SectionCard id="using-lurelit" title="Using Lurelit">
            <SubHead>Uploading Screenshots</SubHead>
            <Paragraph>
              From the home page, drag-and-drop or click to select one or more screenshot files. Supported formats: <InlineCode>PNG</InlineCode>, <InlineCode>JPG/JPEG</InlineCode>, <InlineCode>WEBP</InlineCode>. Images are base64-encoded and sent to the workflow as input.
            </Paragraph>

            <SubHead>Single vs. Bulk Upload</SubHead>
            <BulletList items={[
              <><strong style={{ color: 'var(--text)' }}>Single file</strong> — Redirects directly to the results page for that analysis</>,
              <><strong style={{ color: 'var(--text)' }}>Multiple files</strong> — All are submitted in parallel; you&apos;re redirected to the History page to track them</>,
            ]} />

            <SubHead>Real-Time Analysis Progress</SubHead>
            <Paragraph>
              The results page polls the execution status every 3 seconds. A live elapsed timer counts up during analysis. Each workflow step appears in a timeline as it completes, with a progress bar showing overall completion percentage.
            </Paragraph>

            <SubHead>Understanding the Verdict</SubHead>
            <Paragraph>
              When the workflow completes, you get a structured verdict including:
            </Paragraph>
            <BulletList items={[
              <><strong style={{ color: 'var(--text)' }}>Classification</strong> — Threat or Safe, with confidence percentage</>,
              <><strong style={{ color: 'var(--text)' }}>Attack type</strong> — Smishing, phishing, credential harvest, etc.</>,
              <><strong style={{ color: 'var(--text)' }}>Red flags</strong> — Specific indicators the AI identified</>,
              <><strong style={{ color: 'var(--text)' }}>IOCs extracted</strong> — URLs, domains, IPs, hashes found in the image</>,
              <><strong style={{ color: 'var(--text)' }}>Enrichment results</strong> — VirusTotal stats and urlscan.io data per IOC</>,
              <><strong style={{ color: 'var(--text)' }}>Environment hunt</strong> — Whether any IOCs were seen in your org&apos;s logs</>,
              <><strong style={{ color: 'var(--text)' }}>Attack chain</strong> — Step-by-step timeline of the attack progression</>,
            ]} />

            <SubHead>Cost Tracking</SubHead>
            <Paragraph>
              Each analysis displays an AI cost breakdown showing token usage and estimated cost for the LLM calls made during the workflow.
            </Paragraph>
          </SectionCard>

          {/* 11. Features */}
          <SectionCard id="features" title="Features">
            <SubHead>Human-in-the-Loop Approval</SubHead>
            <Paragraph>
              When the workflow isn&apos;t confident enough to automatically proceed with environment hunting, it pauses at a <InlineCode>waitForInput</InlineCode> step and asks for human approval. The UI displays a yellow &quot;Human Approval Required&quot; card with:
            </Paragraph>
            <BulletList items={[
              <><strong style={{ color: 'var(--text)' }}>Context summary</strong> — The classification, enrichment findings, and why approval is needed (rendered as markdown)</>,
              <><strong style={{ color: 'var(--text)' }}>Approve Hunt</strong> — Proceeds with the environment hunt step using the Elastic AI Agent</>,
              <><strong style={{ color: 'var(--text)' }}>Skip Hunt</strong> — Finalizes the report without running the hunt</>,
              <><strong style={{ color: 'var(--text)' }}>Optional reason field</strong> — Add a note explaining your decision (stored with the execution)</>,
            ]} />
            <Paragraph>
              After approval, the workflow resumes via <InlineCode>POST /api/resume/[executionId]</InlineCode> with the <InlineCode>proceed_with_hunt</InlineCode> boolean and optional <InlineCode>reason</InlineCode>.
            </Paragraph>

            <SubHead>Cancel Analysis (&quot;Cut the Line&quot;)</SubHead>
            <Paragraph>
              Running analyses can be cancelled at any time. The cancel button appears in multiple locations:
            </Paragraph>
            <BulletList items={[
              <>Small cancel icon in the Active Analyses Bar (bottom bar, next to each running execution)</>,
              <>Cancel button on the results page during running analyses</>,
              <>Cancel option on the History page for active executions</>,
            ]} />
            <Paragraph>
              Cancelling calls Kibana&apos;s <InlineCode>POST /api/workflows/executions/[id]/cancel</InlineCode> API to abort the workflow execution server-side.
            </Paragraph>

            <SubHead>Active Analyses Bar</SubHead>
            <Paragraph>
              A persistent bottom bar appears whenever analyses are running or waiting for input. It polls <InlineCode>/api/history</InlineCode> every 15 seconds and displays:
            </Paragraph>
            <BulletList items={[
              <>A pulsing teal dot with the count of active analyses</>,
              <>Each running execution as a clickable chip that navigates to its results page</>,
              <>Live elapsed time counter for running executions, or a &quot;WAITING&quot; badge for HITL-paused ones</>,
              <>A cancel button per execution (with a scissors icon, titled &quot;Cut the line&quot;)</>,
              <>A &quot;View All&quot; link to the History page and a dismiss button</>,
            ]} />
            <Paragraph>
              The bar auto-reappears when new analyses start. It uses a 1-second tick interval for elapsed time updates.
            </Paragraph>

            <SubHead>Cost Tracking</SubHead>
            <Paragraph>
              Each completed analysis shows an estimated AI cost breakdown, expandable via a <InlineCode>$X.XX est. cost</InlineCode> summary line. The breakdown includes:
            </Paragraph>
            <BulletList items={[
              <><strong style={{ color: 'var(--text)' }}>Per-step detail</strong> — Input/output token counts, model used, number of LLM calls, and cost for each step (e.g., Analyze Screenshot, Summarize Enrichment, Hunt in Environment)</>,
              <><strong style={{ color: 'var(--text)' }}>Model auto-detection</strong> — The system resolves the model from connector IDs (e.g., <InlineCode>.anthropic-claude-4.6-opus-chat_completion</InlineCode> → Opus 4.6) or falls back to known AI agent step defaults</>,
              <><strong style={{ color: 'var(--text)' }}>Multi-provider pricing</strong> — Supports Anthropic (Opus 4.7/4.6, Sonnet 4.5/4, Haiku 3.5/3), OpenAI (GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-4), and Google (Gemini 2.5 Pro/Flash, 2.0 Flash)</>,
              <><strong style={{ color: 'var(--text)' }}>Total summary</strong> — Aggregated token count and total estimated cost across all steps</>,
            ]} />

            <SubHead>User Avatars</SubHead>
            <Paragraph>
              Click your avatar circle in the nav bar to upload a profile photo. The built-in avatar editor provides:
            </Paragraph>
            <BulletList items={[
              <><strong style={{ color: 'var(--text)' }}>Circular crop preview</strong> — 200px preview with a teal-glowing border</>,
              <><strong style={{ color: 'var(--text)' }}>Drag to reposition</strong> — Click and drag to pan the image within the circle</>,
              <><strong style={{ color: 'var(--text)' }}>Zoom slider</strong> — Scale from 0.5x to 3x to frame your photo</>,
              <><strong style={{ color: 'var(--text)' }}>Server-side storage</strong> — Saved as a 256px JPEG data URL in the <InlineCode>.avatars/</InlineCode> directory, keyed by username</>,
            ]} />
            <Paragraph>
              Avatars appear in the nav bar, on the results page (&quot;Submitted by&quot; attribution), and in history analytics.
            </Paragraph>

            <SubHead>Settings Modal</SubHead>
            <Paragraph>
              Click the gear icon in the nav bar to open the settings modal. It allows you to:
            </Paragraph>
            <BulletList items={[
              <>View and edit the <InlineCode>Kibana URL</InlineCode> and <InlineCode>Workflow ID</InlineCode></>,
              <>See whether configuration is managed via environment variables (displays an info banner when env vars are active)</>,
              <>Run a &quot;Test&quot; button that saves current settings and validates the Kibana connection via <InlineCode>POST /api/settings/test</InlineCode></>,
              <>UI changes override environment variables when saved</>,
            ]} />

            <SubHead>Multi-File Parallel Analysis</SubHead>
            <Paragraph>
              Select multiple screenshots and submit them all at once. Each is processed independently by the workflow in parallel.
            </Paragraph>

            <SubHead>Attack Chain Rendering</SubHead>
            <Paragraph>
              When the workflow reconstructs an attack chain (step-by-step progression of the attack), the results page renders it as a visual timeline. Each step in the chain shows the attacker&apos;s actions in sequence, helping analysts understand the full attack flow at a glance.
            </Paragraph>

            <SubHead>IOC Enrichment Results</SubHead>
            <Paragraph>
              Each extracted IOC is enriched with VirusTotal detection stats (malicious, suspicious, harmless, undetected engine counts) and urlscan.io search results. Results are displayed inline with color-coded severity indicators.
            </Paragraph>

            <SubHead>Environment Threat Hunting</SubHead>
            <Paragraph>
              The workflow runs ES|QL queries against your Elasticsearch data to determine if any extracted IOCs have been observed in DNS logs, HTTP connections, TLS handshakes, or other network events in your environment.
            </Paragraph>

            <SubHead>Markdown Rendering</SubHead>
            <Paragraph>
              AI-generated analysis summaries and reports are rendered as styled markdown with headings, lists, code blocks, and emphasis.
            </Paragraph>

            <SubHead>Screenshot Persistence &amp; Lightbox</SubHead>
            <Paragraph>
              Uploaded screenshots are stored in <InlineCode>localStorage</InlineCode> (keyed by execution ID) so they persist across page navigations. A lightbox component allows full-screen viewing.
            </Paragraph>

            <SubHead>Landing Page</SubHead>
            <Paragraph>
              A separate marketing microsite is available at <InlineCode>https://github.com/jamesspi/lurelit-site</InlineCode>. It provides a showcase of Lurelit&apos;s capabilities, the three-step analysis flow, feature highlights, and links to the documentation. Useful for sharing with stakeholders or embedding in internal portals.
            </Paragraph>
          </SectionCard>

          {/* 12. History & Analytics */}
          <SectionCard id="history-analytics" title="History &amp; Analytics">
            <SubHead>History Dashboard</SubHead>
            <Paragraph>
              The History page shows all past executions with filtering by status (completed, failed, running, threats, safe). Stats cards show totals, threat counts, and average analysis time. A metrics dashboard renders historical trend data.
            </Paragraph>

            <SubHead>Sankey Diagram</SubHead>
            <Paragraph>
              The metrics view includes a Sankey diagram that visualizes the flow of submissions through classification stages — from upload through AI analysis, enrichment, and final verdict — showing how many analyses resulted in threats vs. safe verdicts.
            </Paragraph>

            <SubHead>Metrics &amp; Filters</SubHead>
            <Paragraph>
              Aggregate metrics are available via <InlineCode>GET /api/metrics</InlineCode>, providing total counts, threat/safe breakdowns, and timing data. The History page supports filtering by status, date range, and user.
            </Paragraph>
          </SectionCard>

          {/* 13. Architecture */}
          <SectionCard id="architecture" title="Architecture">
            <SubHead>Tech Stack</SubHead>
            <div style={{ margin: '12px 0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
              {[
                { label: 'Next.js 16', desc: 'App Router' },
                { label: 'React 19', desc: 'Client components' },
                { label: 'TypeScript', desc: 'Strict mode' },
                { label: 'Tailwind CSS', desc: 'Utility + custom props' },
              ].map(t => (
                <div key={t.label} style={{ padding: '12px 16px', borderRadius: 3, background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--teal-bright)', fontWeight: 600 }}>{t.label}</span>
                  <p className="mono" style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 4 }}>{t.desc}</p>
                </div>
              ))}
            </div>

            <SubHead>API Routes</SubHead>
            <CodeBlock>{`POST /api/auth/login      — Validate credentials, create session
POST /api/auth/logout     — Destroy session cookie
GET  /api/auth/me         — Check authentication status
POST /api/submit          — Submit screenshot for analysis
GET  /api/status/[id]     — Poll execution status & results
POST /api/cancel/[id]     — Cancel a running execution
POST /api/resume/[id]     — Resume a HITL-paused execution
GET  /api/history         — List past executions (paginated)
GET  /api/metrics         — Aggregate threat/safe counts
GET  /api/settings        — Read config state
POST /api/settings        — Save Kibana URL + Workflow ID
DELETE /api/settings      — Clear stored config
POST /api/settings/test   — Test Kibana connectivity
GET  /api/avatar          — Get current user avatar
POST /api/avatar          — Upload/update avatar
DELETE /api/avatar        — Remove avatar
GET  /api/avatar/[user]   — Get another user's avatar
POST /api/setup/check     — Validate Kibana connection (setup wizard)
POST /api/setup/save      — Save setup config
POST /api/setup/validate-workflow — Verify workflow ID exists`}</CodeBlock>

            <SubHead>Authentication Flow</SubHead>
            <Paragraph>
              Login validates credentials against the Kibana API. On success, an encrypted session cookie is set (AES-256-GCM, scrypt-derived key from <InlineCode>CONFIG_SECRET</InlineCode>). The proxy checks this cookie on every request and redirects unauthenticated users to <InlineCode>/login</InlineCode>. Sessions expire after 24 hours.
            </Paragraph>

            <SubHead>Data Flow</SubHead>
            <CodeBlock>{`User uploads screenshot
  → POST /api/submit (base64 image)
  → Kibana POST /api/workflows/workflow/{id}/run
  → Returns executionId

Results page polls:
  → GET /api/status/{executionId}
  → Kibana GET /api/workflows/executions/{id}
  → Returns steps[], output, status

Human-in-the-Loop (if triggered):
  → Status returns "waiting_for_input"
  → UI shows HumanApproval card
  → POST /api/resume/{executionId} { proceed_with_hunt, reason }
  → Kibana POST /api/workflows/executions/{id}/input

Cancel (if requested):
  → POST /api/cancel/{executionId}
  → Kibana POST /api/workflows/executions/{id}/cancel

Workflow pipeline (in Kibana):
  1. AI analyzes screenshot (Anthropic Claude)
  2. Parse structured classification + IOCs
  3. For each IOC: VirusTotal + urlscan.io enrichment
  4. Summarize enrichment findings
  5. [HITL gate] waitForInput if confidence is ambiguous
  6. ES|QL hunt in environment logs
  7. Generate final report with verdict`}</CodeBlock>
          </SectionCard>

          {/* 14. Testing */}
          <SectionCard id="testing" title="Testing">
            <SubHead>Test Data Seeding</SubHead>
            <Paragraph>
              The <InlineCode>scripts/seed-test-data.sh</InlineCode> script injects 9 test documents into Elasticsearch that match IOCs from the test screenshots. This makes the &quot;Environment Threat Hunt&quot; step find real hits.
            </Paragraph>
            <CodeBlock>{`# Usage:
./scripts/seed-test-data.sh [ELASTICSEARCH_URL] [USERNAME] [PASSWORD]

# Defaults:
./scripts/seed-test-data.sh http://localhost:9200 elastic changeme`}</CodeBlock>
            <Paragraph>
              The script creates network event documents for DNS lookups, HTTP requests, and TLS connections matching known-bad IOCs (usps-redelivery.info, ezpass.com-licy.win, loginmicrosoftonline.uk, etc.).
            </Paragraph>

            <SubHead>Example Screenshots</SubHead>
            <Paragraph>
              The <InlineCode>examples/screenshots/</InlineCode> directory contains ready-to-use PNG screenshots for testing all analysis paths. Upload these directly to Lurelit to validate each scenario.
            </Paragraph>

            <Paragraph><strong style={{ color: 'var(--text)' }}>Benign (safe messages for testing false-positive rates):</strong></Paragraph>
            <BulletList items={[
              <><InlineCode>benign-email-microsoft-signin.png</InlineCode> — Legitimate Microsoft sign-in notification</>,
              <><InlineCode>benign-sms-amazon-delivery.png</InlineCode> — Real Amazon delivery SMS</>,
            ]} />

            <Paragraph><strong style={{ color: 'var(--text)' }}>Phishing/Smishing (threats):</strong></Paragraph>
            <BulletList items={[
              <><InlineCode>phishing-email-microsoft365.png</InlineCode> — M365 credential phishing</>,
              <><InlineCode>phishing-email-real-ioc-microsoft365.png</InlineCode> — Same with real VT-flagged IOCs</>,
              <><InlineCode>smishing-sms-usps-delivery.png</InlineCode> — USPS package delivery smish</>,
              <><InlineCode>smishing-sms-ezpass-toll.png</InlineCode> — E-ZPass toll scam smish</>,
              <><InlineCode>smishing-real-ioc-usps.png</InlineCode> — USPS smish with real VT-flagged URL</>,
              <><InlineCode>smishing-real-ioc-ezpass.png</InlineCode> — E-ZPass smish with real VT-flagged URL</>,
            ]} />

            <Paragraph><strong style={{ color: 'var(--text)' }}>Spam:</strong></Paragraph>
            <BulletList items={[
              <><InlineCode>spam-email-cold-outreach.png</InlineCode> — B2B cold outreach email</>,
              <><InlineCode>spam-sms-marketing.png</InlineCode> — SMS marketing spam</>,
            ]} />

            <Paragraph><strong style={{ color: 'var(--text)' }}>HITL Testing:</strong></Paragraph>
            <BulletList items={[
              <><InlineCode>hitl-trigger-no-hunt-loyalty-reward.png</InlineCode> — Triggers HITL, analyst can skip hunt</>,
              <><InlineCode>hitl-trigger-approved-hunt.png</InlineCode> — Triggers HITL, analyst approves hunt</>,
              <><InlineCode>hitl-trigger-no-hunt-loyalty-reward.png</InlineCode> — Triggers HITL approval, analyst can skip</>,
              <><InlineCode>hitl-trigger-approved-hunt.png</InlineCode> — Triggers HITL approval, analyst approves hunt</>,
            ]} />

            <AlertBox type="tip">
              Screenshots with <InlineCode>real-ioc</InlineCode> in the filename contain IOCs known to be flagged by VirusTotal. When combined with the seed data script (<InlineCode>scripts/seed-test-data.sh</InlineCode>), these produce both VT enrichment hits AND environment hunt hits — providing an end-to-end test of the full analysis pipeline including threat hunting.
            </AlertBox>
          </SectionCard>

          {/* 15. Troubleshooting */}
          <SectionCard id="troubleshooting" title="Troubleshooting">
            <SubHead>Authentication Failures</SubHead>
            <BulletList items={[
              <><strong style={{ color: 'var(--text)' }}>401 Unauthorized on login</strong> — Verify your Kibana credentials are correct. Lurelit authenticates against <InlineCode>/api/status</InlineCode> using Basic auth. Ensure the user exists in Kibana native realm (not just SAML/OIDC).</>,
              <><strong style={{ color: 'var(--text)' }}>Session expired mid-analysis</strong> — Sessions have a 24-hour TTL. If an analysis takes longer than expected, re-login and resubmit.</>,
              <><strong style={{ color: 'var(--text)' }}>CORS errors in browser console</strong> — Lurelit&apos;s API routes proxy to Kibana server-side. If you see CORS errors, ensure <InlineCode>KIBANA_URL</InlineCode> is reachable from the Next.js server, not just the browser.</>,
            ]} />

            <SubHead>Workflow Not Found</SubHead>
            <BulletList items={[
              <><strong style={{ color: 'var(--text)' }}>404 when submitting</strong> — The workflow ID in Lurelit settings must exactly match the ID in Kibana. Check with: <InlineCode>GET /api/workflows/workflow/your-workflow-id</InlineCode></>,
              <><strong style={{ color: 'var(--text)' }}>Workflow exists but won&apos;t trigger</strong> — Ensure the workflow is <strong style={{ color: 'var(--text)' }}>enabled</strong> and has a <InlineCode>manual</InlineCode> trigger type. Disabled workflows return 400.</>,
              <><strong style={{ color: 'var(--text)' }}>Wrong Kibana space</strong> — Workflows are space-scoped. Ensure Lurelit is pointed at the correct Kibana space (append <InlineCode>/s/space-name</InlineCode> to your Kibana URL if using a non-default space).</>,
            ]} />

            <SubHead>Enrichment Returning Empty</SubHead>
            <BulletList items={[
              <><strong style={{ color: 'var(--text)' }}>VirusTotal returns no data</strong> — Check that your VirusTotal connectors have valid API keys. Free VT accounts have rate limits (4 req/min).</>,
              <><strong style={{ color: 'var(--text)' }}>urlscan.io returns empty results</strong> — New/uncommon domains may not be in urlscan&apos;s database. This is expected. The workflow uses <InlineCode>on-failure: continue</InlineCode> so this won&apos;t break the pipeline.</>,
              <><strong style={{ color: 'var(--text)' }}>All enrichment steps skipped</strong> — If the AI analysis finds no IOCs (legitimate message), enrichment is conditionally skipped. This is working as intended.</>,
            ]} />

            <SubHead>Hunt Step Skipped or Empty</SubHead>
            <BulletList items={[
              <><strong style={{ color: 'var(--text)' }}>Hunt step not executed</strong> — The hunt only runs when <InlineCode>has_malicious_iocs: true</InlineCode> from the summarize step. If the message is legitimate or IOCs are not deemed malicious, the hunt is intentionally skipped.</>,
              <><strong style={{ color: 'var(--text)' }}>Hunt runs but finds nothing</strong> — This usually means the malicious IOCs have not appeared in your environment&apos;s logs. Verify the user has read access to <InlineCode>logs-*</InlineCode>, <InlineCode>filebeat-*</InlineCode>, and <InlineCode>.alerts-security.*</InlineCode> indices.</>,
              <><strong style={{ color: 'var(--text)' }}>Hunt step times out (500s)</strong> — The Elastic AI Agent may be running complex ES|QL queries across large indices. Consider adding time bounds to your data retention or check cluster health.</>,
              <><strong style={{ color: 'var(--text)' }}>Agent Builder not available</strong> — If the <InlineCode>ai.agent</InlineCode> steps fail with agent-not-found errors, ensure the <InlineCode>elastic-ai-agent</InlineCode> is visible in Agent Builder (accessible from the <InlineCode>Agents</InlineCode> item in the left-hand navigation) and has public visibility.</>,
            ]} />

            <SubHead>Connector Errors</SubHead>
            <BulletList items={[
              <><strong style={{ color: 'var(--text)' }}>Connector not found</strong> — Workflow references connectors by their auto-generated ID. Verify your connector IDs match those in the workflow YAML. Open the workflow editor to check for validation errors.</>,
              <><strong style={{ color: 'var(--text)' }}>Anthropic 529/overloaded</strong> — The Anthropic connector has a 120s timeout. During high load, the API may be slow. The step will fail and mark the execution as failed.</>,
              <><strong style={{ color: 'var(--text)' }}>Rate limiting</strong> — VirusTotal free API allows 4 requests per minute. With multiple IOCs, you may hit this limit. Consider a premium VT API key for production use.</>,
            ]} />

            <SubHead>Common Error Codes</SubHead>
            <CodeBlock>{`HTTP 401  →  Kibana credentials invalid or session expired
HTTP 403  →  User lacks required privileges (check Roles)
HTTP 404  →  Workflow ID mismatch or wrong Kibana space
HTTP 400  →  Workflow disabled, or invalid input format
HTTP 500  →  Workflow execution error (check Kibana logs)
TIMEOUT   →  Analysis step exceeded timeout (default 120s for AI, 500s for hunt)`}</CodeBlock>

            <SubHead>Docker &amp; Config Persistence</SubHead>
            <BulletList items={[
              <><strong style={{ color: 'var(--text)' }}>&quot;Kibana URL not configured&quot; after rebuild</strong> — Ensure the <InlineCode>lurelit-data</InlineCode> volume is mounted at <InlineCode>/app/data</InlineCode> in your <InlineCode>docker-compose.yml</InlineCode>. Without the volume, config is lost on every container rebuild. Verify with: <InlineCode>docker volume ls | grep lurelit</InlineCode></>,
              <><strong style={{ color: 'var(--text)' }}>Config unreadable after changing CONFIG_SECRET</strong> — The <InlineCode>CONFIG_SECRET</InlineCode> env var must remain consistent across restarts. If changed, the encrypted config file (<InlineCode>data/.smish-config.enc</InlineCode>) can&apos;t be decrypted. Fix: restore the original secret, or delete the volume and re-run setup.</>,
              <><strong style={{ color: 'var(--text)' }}>Permission denied writing to data/</strong> — The container runs as non-root user <InlineCode>nextjs</InlineCode> (UID 1001). If using a bind mount instead of a Docker volume, ensure the host directory is writable by UID 1001. The app falls back to <InlineCode>/tmp</InlineCode> if the primary path fails.</>,
            ]} />

            <SubHead>Vercel &amp; Config Persistence</SubHead>
            <BulletList items={[
              <><strong style={{ color: 'var(--text)' }}>Setup returns to the wizard instead of login</strong> — Vercel functions do not provide durable filesystem storage. Add Upstash Redis/Vercel KV REST credentials, or set <InlineCode>KIBANA_URL</InlineCode> and <InlineCode>WORKFLOW_ID</InlineCode> as environment variables and redeploy.</>,
              <><strong style={{ color: 'var(--text)' }}>Admin key changes between requests</strong> — Ensure Redis/KV REST credentials are present, or set a fixed <InlineCode>SETUP_SECRET</InlineCode> in Vercel environment variables.</>,
            ]} />
          </SectionCard>

            </div>{/* end content column */}
          </div>{/* end flex layout */}
        </div>
      </main>
      <Footer />
    </>
  );
}
