import { NextResponse } from 'next/server';
import { saveGlobalConfig, loadGlobalConfig } from '@/lib/config';
import { CONFIGURED_COOKIE, configuredCookieOptions } from '@/lib/cookies';
import { getDeploymentPlatform, isServerlessPlatform } from '@/lib/deployment';
import { describeStorage } from '@/lib/storage';

interface SaveRequest {
  kibanaUrl: string;
  workflowId: string;
}

export async function POST(request: Request) {
  try {
    const body: SaveRequest = await request.json();
    const { kibanaUrl, workflowId } = body;

    if (!kibanaUrl || !workflowId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cleanedUrl = kibanaUrl.trim().replace(/\/+$/, '');

    // Reject localhost on serverless platforms — the function container can never reach it
    const isServerless = isServerlessPlatform();
    const isLocalhostUrl = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|host\.docker\.internal)(:\d+)?(\/|$)/i.test(cleanedUrl);
    if (isServerless && isLocalhostUrl) {
      return NextResponse.json({
        error: `"${cleanedUrl}" can't be reached from a serverless deployment. Use the public URL of your Kibana or Elastic Cloud project (e.g. https://your-deployment.kb.region.elastic-cloud.com).`,
      }, { status: 400 });
    }

    const storage = describeStorage();
    if (isServerless && storage.kind !== 'redis') {
      const platform = getDeploymentPlatform();
      return NextResponse.json({
        error: `${platform} deployments need durable Redis/KV storage before the setup wizard can save configuration. Add an Upstash Redis/Vercel KV integration (UPSTASH_REDIS_REST_* or KV_REST_API_* env vars) or set KIBANA_URL and WORKFLOW_ID as environment variables, then redeploy. Without durable storage, setup would be lost between requests and redirect back to /setup.`,
      }, { status: 503 });
    }

    await saveGlobalConfig({
      kibanaUrl: cleanedUrl,
      workflowId,
      huntEnabled: true,
    });

    const verify = await loadGlobalConfig();
    if (!verify) {
      return NextResponse.json({
        error: 'Configuration was saved but could not be read back. Check that the data/ directory is writable and CONFIG_SECRET has not changed.',
      }, { status: 500 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(CONFIGURED_COOKIE, '1', configuredCookieOptions());

    return response;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to save config' },
      { status: 500 }
    );
  }
}
