import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { homedir, userInfo } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

// ─── Types ─────────────────────────────────────────────────────────────────

interface OAuth2Token {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  expires_at: number
}

export interface PersistedSession {
  cookies: string
  oauth2Token: OAuth2Token
  diClientId: string
}

// ─── Session paths ──────────────────────────────────────────────────────────

export function getSessionDir(): string {
  return join(homedir(), '.garmin-connect-backup');
}

export function getSessionFile(): string {
  return join(getSessionDir(), 'session.json');
}

// ─── File permissions ───────────────────────────────────────────────────────

// fs mode bits are ignored on Windows — use icacls to restrict access to the current user only
function restrictToCurrentUser(path: string): void {
  if (process.platform !== 'win32') return;
  const username = userInfo().username;
  spawnSync('icacls', [path, '/inheritance:r', '/grant:r', `${username}:(F)`], { stdio: 'ignore' });
}

// ─── Cookie store ───────────────────────────────────────────────────────────

class CookieStore {
  private jar = new Map<string, string>();

  ingest(res: Response): void {
    // getSetCookie() returns each Set-Cookie header separately (Node 18.14.1+)
    const setCookies: string[] = (res.headers as any).getSetCookie?.() ?? [];
    for (const raw of setCookies) {
      const eqIdx = raw.indexOf('=');
      const scIdx = raw.indexOf(';');
      if (eqIdx === -1) continue;
      const name = raw.slice(0, eqIdx).trim();
      const value = raw.slice(eqIdx + 1, scIdx === -1 ? undefined : scIdx).trim();
      this.jar.set(name, value);
    }
  }

  header(): string {
    return [...this.jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }

  serialize(): string {
    return JSON.stringify([...this.jar.entries()]);
  }

  static deserialize(data: string): CookieStore {
    const store = new CookieStore();
    for (const [k, v] of JSON.parse(data) as [string, string][]) {
      store.jar.set(k, v);
    }
    return store;
  }
}

// ─── URLs ───────────────────────────────────────────────────────────────────

const SSO_BASE = 'https://sso.garmin.com/sso';
// `service` must point to the embed URL. Garmin binds each service ticket to
// the exact URL used at login, so this same value must be sent as `service_url`
// in the OAuth2 token exchange or the ticket will be rejected.
const EMBED_URL = `${SSO_BASE}/embed`;

// Mirrors what the Garmin Connect embedded login widget sends.
// `clientId` is intentionally absent — its presence triggers stricter Cloudflare
// rate limiting on the SSO endpoints.
function ssoWidgetParams(): string {
  return new URLSearchParams({
    service: EMBED_URL,
    webhost: 'https://connect.garmin.com/modern',
    source: EMBED_URL,
    redirectAfterAccountLoginUrl: EMBED_URL,
    redirectAfterAccountCreationUrl: EMBED_URL,
    gauthHost: SSO_BASE,
    locale: 'en_US',
    id: 'gauth-widget',
    cssUrl: 'https://connect.garmin.com/gauth-custom-v3.2-min.css',
    privacyStatementUrl: 'https://www.garmin.com/en-US/privacy/connect/',
    rememberMeShown: 'true',
    rememberMeChecked: 'false',
    createAccountShown: 'true',
    openCreateAccount: 'false',
    displayNameShown: 'false',
    consumeServiceTicket: 'false',
    initialFocus: 'true',
    embedWidget: 'true',
    generateExtraServiceTicket: 'true',
    generateTwoExtraServiceTickets: 'true',
    generateNoServiceTicket: 'false',
    globalOptInShown: 'true',
    globalOptInChecked: 'false',
    mobile: 'false',
    connectLegalTerms: 'true',
    showTermsOfUse: 'false',
    showPrivacyPolicy: 'false',
    showConnectLegalAge: 'false',
    locationPromptShown: 'true',
    showPassword: 'true',
    useCustomHeader: 'false',
    mfaRequired: 'false',
    performMFACheck: 'false',
    rememberMyBrowserShown: 'false',
    rememberMyBrowserChecked: 'false',
  }).toString();
}

const EMBED_SEED_URL = `${EMBED_URL}?id=gauth-widget&embedWidget=true&gauthHost=${encodeURIComponent(SSO_BASE)}`;
const SIGNIN_URL = `${SSO_BASE}/signin?${ssoWidgetParams()}`;
const MFA_URL = `${SSO_BASE}/verifyMFA/loginEnterMfaCode?${ssoWidgetParams()}`;

const OAUTH_URL = 'https://diauth.garmin.com/di-oauth2-service/oauth/token';

// Rotated quarterly by Garmin — try in order until one succeeds
const DI_CLIENT_IDS = [
  'GARMIN_CONNECT_MOBILE_ANDROID_DI_2025Q2',
  'GARMIN_CONNECT_MOBILE_ANDROID_DI_2024Q4',
  'GARMIN_CONNECT_MOBILE_ANDROID_DI',
  'GARMIN_CONNECT_MOBILE_IOS_DI',
];

const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

// ─── HTML parsers (ported from auth-html-parser.ts) ─────────────────────────

function parseCsrfToken(html: string): string {
  const match = /name="_csrf"\s+value="([^"]+)"/i.exec(html);
  if (!match) throw new Error('CSRF token not found in signin form');
  return match[1];
}

type SsoPostResult
  = | { type: 'success', ticket: string }
    | { type: 'mfa_required' }
    | { type: 'locked', message?: string }
    | { type: 'invalid', message?: string }
    | { type: 'error', message?: string };

function parseSsoPostResponse(html: string): SsoPostResult {
  const titleMatch = /<title>([^<]*)<\/title>/i.exec(html);
  const title = titleMatch?.[1]?.trim();

  if (title === 'Success') {
    const ticket = extractTicket(html);
    if (!ticket) return { type: 'error', message: 'Login reported success but no ticket found in response' };
    return { type: 'success', ticket };
  }

  if (title && /mfa/i.test(title)) return { type: 'mfa_required' };

  const message = extractErrorMessage(html) ?? title;
  if (message && /lock/i.test(message)) return { type: 'locked', message };
  if (message && /(invalid|incorrect|wrong|password|credentials)/i.test(message)) return { type: 'invalid', message };
  return { type: 'error', message };
}

// Garmin embeds the post-login redirect URL in one of two JS patterns:
//   var response_url = "https://...?ticket=...";
//   window.location.replace("https://...?ticket=...");
function extractTicket(html: string): string | undefined {
  const patterns = [/var response_url\s*=\s*"([^"]+)"/i, /window\.location\.replace\("([^"]+)"\)/i];
  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (match) {
      const url = match[1].replaceAll('\\/', '/');
      const ticketMatch = /[&?]ticket=([\da-z-]+)/i.exec(url);
      if (ticketMatch) return ticketMatch[1];
    }
  }
}

function extractErrorMessage(html: string): string | undefined {
  const patterns = [
    /<[^>]*class="[^"]*(?:login-error|error-message|alert)[^"]*"[^>]*>([^<]+)<\/[^>]+>/i,
    /<div[^>]*id="[^"]*error[^"]*"[^>]*>([^<]+)<\/div>/i,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (match) {
      const text = match[1].trim();
      if (text.length > 0) return text;
    }
  }
}

// ─── HTTP helper ─────────────────────────────────────────────────────────────

async function get(url: string, cookies: CookieStore, extraHeaders: Record<string, string> = {}): Promise<Response> {
  const res = await fetch(url, {
    headers: { ...BROWSER_HEADERS, ...extraHeaders, Cookie: cookies.header() },
  });
  cookies.ingest(res);
  return res;
}

async function post(url: string, cookies: CookieStore, body: string, extraHeaders: Record<string, string> = {}): Promise<Response> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...BROWSER_HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...extraHeaders,
      'Cookie': cookies.header(),
    },
    body,
  });
  cookies.ingest(res);
  return res;
}

// ─── SSO flow ───────────────────────────────────────────────────────────────

async function seedAndGetCsrf(cookies: CookieStore): Promise<string> {
  await get(EMBED_SEED_URL, cookies);
  const formRes = await get(SIGNIN_URL, cookies, { Referer: EMBED_URL });
  return parseCsrfToken(await formRes.text());
}

async function ssoLogin(username: string, password: string, cookies: CookieStore): Promise<SsoPostResult> {
  const csrf = await seedAndGetCsrf(cookies);
  const loginRes = await post(SIGNIN_URL, cookies, new URLSearchParams({ username, password, embed: 'true', _csrf: csrf }).toString(), {
    Referer: SIGNIN_URL,
    Origin: 'https://sso.garmin.com',
  });
  return parseSsoPostResponse(await loginRes.text());
}

async function verifyMfa(mfaCode: string, cookies: CookieStore): Promise<SsoPostResult> {
  // CSRF rotates — re-seed and re-scrape it for the MFA POST
  const csrf = await seedAndGetCsrf(cookies);
  const mfaRes = await post(MFA_URL, cookies, new URLSearchParams({ 'mfa-code': mfaCode.trim(), 'embed': 'true', '_csrf': csrf, 'fromPage': 'setupEnterMfaCode' }).toString(), {
    Referer: SIGNIN_URL,
    Origin: 'https://sso.garmin.com',
  });
  return parseSsoPostResponse(await mfaRes.text());
}

// ─── OAuth2 exchange ─────────────────────────────────────────────────────────

async function exchangeServiceTicket(ticket: string): Promise<{ token: OAuth2Token, diClientId: string }> {
  for (const diClientId of DI_CLIENT_IDS) {
    const res = await fetch(OAUTH_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${diClientId}:`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'https://connectapi.garmin.com/di-oauth2-service/oauth/grant/service_ticket',
        service_ticket: ticket,
        service_url: EMBED_URL,
      }).toString(),
    });

    if (res.ok) {
      const data = await res.json() as Record<string, unknown>;
      return {
        diClientId,
        token: {
          access_token: data['access_token'] as string,
          refresh_token: data['refresh_token'] as string,
          token_type: data['token_type'] as string,
          expires_in: data['expires_in'] as number,
          expires_at: Date.now() + (data['expires_in'] as number) * 1000,
        },
      };
    }
  }
  throw new Error('OAuth2 token exchange failed with all device-identity client IDs');
}

// ─── Session persistence ─────────────────────────────────────────────────────

export function saveSession(session: PersistedSession): void {
  const dir = getSessionDir();
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  restrictToCurrentUser(dir);
  const file = getSessionFile();
  writeFileSync(file, JSON.stringify(session, null, 2), { mode: 0o600 });
  restrictToCurrentUser(file);
}

function loadSession(): PersistedSession | null {
  try {
    return JSON.parse(readFileSync(getSessionFile(), 'utf-8')) as PersistedSession;
  } catch {
    return null;
  }
}

// Treat token as expired 5 minutes early to avoid clock-skew issues
function isTokenValid(token: OAuth2Token): boolean {
  return token.expires_at - 5 * 60 * 1000 > Date.now();
}

// ─── Token refresh ────────────────────────────────────────────────────────────

export async function refreshAccessToken(session: PersistedSession): Promise<PersistedSession> {
  const res = await fetch(OAUTH_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${session.diClientId}:`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: session.oauth2Token.refresh_token,
    }).toString(),
  });

  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);

  const data = await res.json() as Record<string, unknown>;
  return {
    ...session,
    oauth2Token: {
      access_token: data['access_token'] as string,
      // Some refresh responses omit refresh_token — keep the existing one if so
      refresh_token: (data['refresh_token'] as string | undefined) ?? session.oauth2Token.refresh_token,
      token_type: data['token_type'] as string,
      expires_in: data['expires_in'] as number,
      expires_at: Date.now() + (data['expires_in'] as number) * 1000,
    },
  };
}

// ─── Public entry point ──────────────────────────────────────────────────────

export async function runLogin(): Promise<void> {
  const rl = createInterface({ input: stdin, output: stdout });

  try {
    const username = await rl.question('Garmin username / email: ');
    const password = await rl.question('Password: ');

    console.error('\nLogging in...');
    const cookies = new CookieStore();
    const result = await ssoLogin(username, password, cookies);

    let ticket: string;

    if (result.type === 'mfa_required') {
      const mfaCode = await rl.question('MFA code: ');
      const mfaResult = await verifyMfa(mfaCode, cookies);
      if (mfaResult.type !== 'success') {
        throw new Error(`MFA failed: ${mfaResult.type === 'error' ? (mfaResult.message ?? 'unknown error') : mfaResult.type}`);
      }
      ticket = mfaResult.ticket;
    } else if (result.type === 'success') {
      ticket = result.ticket;
    } else {
      const msg = 'message' in result ? result.message : undefined;
      throw new Error(`Login failed (${result.type})${msg ? `: ${msg}` : ''}`);
    }

    console.error('Exchanging service ticket for OAuth2 token...');
    const { token, diClientId } = await exchangeServiceTicket(ticket);

    const session: PersistedSession = {
      cookies: cookies.serialize(),
      oauth2Token: token,
      diClientId,
    };

    saveSession(session);

    console.error(`\nSession saved to ${getSessionFile()}`);
    console.error(`Access token: ${token.access_token.substring(0, 20)}...`);
    console.error(`Expires: ${new Date(token.expires_at).toLocaleString()}`);
    console.error(`Client ID: ${diClientId}`);
  } finally {
    rl.close();
  }
}

// Returns a session with a guaranteed-valid access token.
// Load order: disk cache → refresh if expired → full interactive login.
export async function getValidSession(): Promise<PersistedSession> {
  const existing = loadSession();

  if (existing) {
    if (isTokenValid(existing.oauth2Token)) {
      return existing;
    }

    console.error('Access token expired — refreshing...');
    try {
      const refreshed = await refreshAccessToken(existing);
      saveSession(refreshed);
      console.error('Token refreshed.');
      return refreshed;
    } catch (err) {
      console.error(`Refresh failed (${err instanceof Error ? err.message : err}) — re-logging in...`);
    }
  }

  await runLogin();

  const session = loadSession();
  if (!session) throw new Error('Session file missing after successful login');
  return session;
}
