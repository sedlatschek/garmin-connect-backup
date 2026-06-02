import { getValidSession, saveSession, refreshAccessToken, type PersistedSession } from './auth.js';

// ─── URLs ────────────────────────────────────────────────────────────────────

const CONNECT_API = 'https://connectapi.garmin.com';

// ─── Client ──────────────────────────────────────────────────────────────────

export class GarminClient {
  private session: PersistedSession;

  private constructor(session: PersistedSession) {
    this.session = session;
  }

  /** Loads or refreshes the session from disk, then returns a ready client. */
  static async create(): Promise<GarminClient> {
    return new GarminClient(await getValidSession());
  }

  /** Returns the current in-memory session (reflects any mid-flight token refreshes). */
  getSession(): PersistedSession {
    return this.session;
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

  async request(url: string, init: RequestInit = {}): Promise<Response> {
    const send = () =>
      fetch(url, {
        ...init,
        headers: { ...init.headers as Record<string, string>, ...this.authHeaders() },
      });

    let res = await send();

    // Token expired mid-flight — refresh once and retry
    if (res.status === 401) {
      await this.refreshToken();
      res = await send();
    }

    if (!res.ok) {
      throw new Error(`Garmin API ${res.status} ${res.statusText} — ${url}`);
    }

    return res;
  }

  // ─── Activities ──────────────────────────────────────────────────────────────

  async getActivities(start = 0, limit = 100): Promise<unknown[]> {
    const res = await this.request(
      `${CONNECT_API}/activitylist-service/activities/search/activities?start=${start}&limit=${limit}`,
    );
    return res.json() as Promise<unknown[]>;
  }

  /** Iterates every activity across pages; yields one at a time. */
  async* getAllActivities(pageSize = 100): AsyncGenerator<unknown, void, unknown> {
    let start = 0;
    while (true) {
      const page = await this.getActivities(start, pageSize);
      yield* page;
      if (page.length < pageSize) break;
      start += pageSize;
    }
  }

  async getActivityDetails(activityId: number): Promise<unknown> {
    const res = await this.request(
      `${CONNECT_API}/activity-service/activity/${activityId}`,
    );
    return res.json();
  }

  // ─── Wellness ────────────────────────────────────────────────────────────────

  /** date: YYYY-MM-DD */
  async getDailySummary(date: string): Promise<unknown> {
    const res = await this.request(
      `${CONNECT_API}/usersummary-service/usersummary/daily/${date}?calendarDate=${date}`,
    );
    return res.json();
  }

  /** date: YYYY-MM-DD */
  async getSleepData(date: string): Promise<unknown> {
    const res = await this.request(
      `${CONNECT_API}/sleep-service/sleep/dailySleepData?date=${date}`,
    );
    return res.json();
  }
}
