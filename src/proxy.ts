import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { existsSync } from 'fs';
import { join } from 'path';
import { CONFIGURED_COOKIE, configuredCookieOptions } from '@/lib/cookies';
import { loadGlobalConfig } from '@/lib/config';

const PUBLIC_PATHS = ['/login', '/setup', '/api/auth/login', '/api/auth/me', '/api/setup'];

function hasEnvConfig(): boolean {
  return Boolean(process.env.KIBANA_URL && process.env.WORKFLOW_ID);
}

const CONFIG_FILE_PRIMARY = join(process.cwd(), 'data', 'config_enc');
const CONFIG_FILE_FALLBACK = '/tmp/lurelit_config_enc';

function hasPersistedConfigOnDisk(): boolean {
  return existsSync(CONFIG_FILE_PRIMARY) || existsSync(CONFIG_FILE_FALLBACK);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const envConfigured = hasEnvConfig();
  const cookieConfigured = request.cookies.get(CONFIGURED_COOKIE)?.value === '1';

  if (envConfigured || cookieConfigured) {
    const session = request.cookies.get('smish_session');
    if (!session?.value) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // Cookie missing — check disk directly (self-hosted/Docker).
  if (hasPersistedConfigOnDisk()) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set(CONFIGURED_COOKIE, '1', configuredCookieOptions());
    return response;
  }

  // Disk check failed — try durable storage (Redis/KV on Vercel/serverless).
  // This only runs when the cookie is missing AND no disk file exists, so
  // the extra async call is rare and acceptable.
  try {
    const config = await loadGlobalConfig();
    if (config) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.set(CONFIGURED_COOKIE, '1', configuredCookieOptions());
      return response;
    }
  } catch {
    // Storage unavailable — fall through to setup
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Not configured', needsSetup: true }, { status: 503 });
  }
  return NextResponse.redirect(new URL('/setup', request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
