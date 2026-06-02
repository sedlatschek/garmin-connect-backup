import { z } from 'zod';
import { pRateLimit } from 'p-ratelimit';
import { getValidSession, saveSession, refreshAccessToken, type PersistedSession } from './auth.js';

const limit = pRateLimit({ rate: 1, interval: 1000 });

export class GarminClient {
  private session: PersistedSession;

  private constructor(session: PersistedSession) {
    this.session = session;
  }

  /** Loads or refreshes the session from disk, then returns a ready client. */
  static async create(): Promise<GarminClient> {
    return new GarminClient(await getValidSession());
  }

  private authHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.session.oauth2Token.access_token}`,
      NK: 'NT',
    };
  }

  private async refreshToken(): Promise<void> {
    this.session = await refreshAccessToken(this.session);
    saveSession(this.session);
  }

  private async request(url: string, init: RequestInit = {}): Promise<Response> {
    const send = () =>
      fetch(url, {
        ...init,
        headers: {
          ...init.headers,
          ...this.authHeaders(),
        },
      });

    let res = await limit(send);

    // Token expired mid-flight — refresh once and retry
    if (res.status === 401) {
      await this.refreshToken();
      res = await limit(send);
    }

    if (!res.ok) {
      throw new Error(`Garmin API ${res.status} ${res.statusText} — ${url}`);
    }

    return res;
  }

  public async get<T extends z.ZodTypeAny>(url: string, schema: T): Promise<z.infer<T>> {
    const response = await this.request(url);
    const data = await response.json();
    return schema.parse(data);
  }
}

let client: GarminClient | undefined;

export async function getClient(): Promise<GarminClient> {
  if (!client) {
    client = await GarminClient.create();
  }
  return client;
}
