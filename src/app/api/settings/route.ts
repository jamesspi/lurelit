import { NextRequest, NextResponse } from 'next/server';
import { loadGlobalConfig, saveGlobalConfig, clearGlobalConfig } from '@/lib/config';
import { getSession } from '@/lib/session';
import { CONFIGURED_COOKIE } from '@/lib/cookies';

export async function GET() {
  const session = await getSession();
  const config = await loadGlobalConfig();
  return NextResponse.json({
    configured: config !== null,
    kibanaUrl: config?.kibanaUrl ?? '',
    workflowId: config?.workflowId ?? '',
    huntEnabled: config?.huntEnabled ?? true,
    isEnvVar: Boolean(process.env.KIBANA_URL),
    authenticated: session !== null,
    username: session?.username,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { kibanaUrl, workflowId, huntEnabled } = await request.json() as { kibanaUrl: string; workflowId: string; huntEnabled?: boolean };
    if (!kibanaUrl || !workflowId) {
      return NextResponse.json({ error: 'Kibana URL and Workflow ID are required' }, { status: 400 });
    }
    await saveGlobalConfig({ kibanaUrl: kibanaUrl.replace(/\/+$/, ''), workflowId, huntEnabled: huntEnabled ?? true });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}

export async function DELETE() {
  await clearGlobalConfig();
  const response = NextResponse.json({ success: true });
  response.cookies.set(CONFIGURED_COOKIE, '', { maxAge: 0, path: '/' });
  return response;
}
