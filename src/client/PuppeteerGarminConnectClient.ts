import { z } from 'zod';
import vanillaPuppeteer from 'puppeteer';
import { addExtra } from 'puppeteer-extra';
import type { Browser, Page, HTTPRequest } from 'puppeteer';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import { pRateLimit } from 'p-ratelimit';
import { GarminConnectClient } from './GarminConnectClient.js';
import { delay } from '../helpers.js';
import { Logger } from '../logger/Logger.js';
import { GarminConnectBackupError } from '../error/GarminConnectBackupError.js';

const puppeteer = addExtra(vanillaPuppeteer);
puppeteer.use(stealthPlugin());

export class PuppeteerGarminConnectClient implements GarminConnectClient {
  private browser: Browser | undefined;
  private page: Page | undefined;
  private csrfToken: string | undefined;
  private displayName: string | undefined;
  private readonly limit: <T>(fn: () => Promise<T>) => Promise<T>;

  public constructor(
    private readonly logger: Logger,
    requestsPerSecond: number = 1,
    private readonly username: string,
    private readonly password: string,
  ) {
    this.limit = pRateLimit({ rate: requestsPerSecond, interval: 1000 });
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: false,
        args: ['--disable-web-security', '--disable-features=IsolateOrigins,site-per-process'],
      });
    }

    return this.browser;
  }

  private async getPage(): Promise<Page> {
    const browser = await this.getBrowser();

    if (!this.page) {
      const page = await browser.newPage();
      page.setRequestInterception(true);

      let csrfTokenResolve: (() => void) | null = null;
      const csrfTokenReady = new Promise<void>((resolve) => {
        csrfTokenResolve = resolve;
      });

      page.on('request', (request: HTTPRequest) => {
        const type = request.resourceType();
        if (type === 'xhr' || type === 'fetch') {
          const token = request.headers()['connect-csrf-token'];
          if (token && !this.csrfToken) {
            this.csrfToken = token;
            csrfTokenResolve?.();
          }
        }
        request.continue();
      });

      await page.goto('https://connect.garmin.com/signin/');

      await page.waitForSelector('#email');
      await delay(200);
      await page.type('#email', this.username);
      await page.type('#password', this.password);
      await page.click('button[type="submit"]');

      await page.waitForNavigation();

      await Promise.race([csrfTokenReady, delay(8000)]);

      this.page = page;
    }

    return this.page;
  }

  public async get<T extends z.ZodTypeAny>(url: string, schema: T): Promise<z.output<T>> {
    this.logger.fetch(url);

    const page = await this.getPage();

    if (!this.csrfToken) {
      throw new GarminConnectBackupError('CSRF token not found after login');
    }

    const csrfToken = this.csrfToken;
    const data = await this.limit(() => page.evaluate(async (url: string, csrfToken: string) => {
      const response = await fetch(
        url,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'connect-csrf-token': csrfToken,
          },
        },
      );
      if (!response.ok) {
        throw new GarminConnectBackupError(`Request to "${url}" failed with status ${response.status}: ${response.statusText}\nResponse body: ${await response.text()}`);
      }
      return response.json();
    }, url, csrfToken));

    try {
      return schema.parse(data);
    } catch (error) {
      throw new GarminConnectBackupError(`Invalid response:\n${JSON.stringify(data)}`, { cause: error });
    }
  }

  public async getDisplayName(): Promise<string> {
    if (!this.displayName) {
      await this.getPage();

      if (!this.page) {
        throw new GarminConnectBackupError('Page not initialized');
      }

      const regex = /"displayName":"([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})"/;
      const match = (await this.page.content()).match(regex);
      if (match) {
        this.displayName = match[1];
      } else {
        throw new GarminConnectBackupError('Garmin GUID not found in page source');
      }
    }

    return this.displayName;
  }
}
