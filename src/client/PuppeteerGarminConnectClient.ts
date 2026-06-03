import dotenv from 'dotenv';
import { z } from 'zod';
import vanillaPuppeteer from 'puppeteer';
import { addExtra } from 'puppeteer-extra';
import type { Browser, Page, HTTPRequest } from 'puppeteer';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import { GarminConnectClient } from './GarminConnectClient.js';
import { delay } from '../helpers.js';

dotenv.config();
const puppeteer = addExtra(vanillaPuppeteer);
puppeteer.use(stealthPlugin());

export class PuppeteerGarminConnectClient implements GarminConnectClient {
  private browser: Browser | undefined;
  private page: Page | undefined;
  private csrfToken: string | null = null;

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
      const username = process.env.GARMIN_USERNAME;
      const password = process.env.GARMIN_PASSWORD;
      if (!username || !password) {
        throw new Error('GARMIN_USERNAME and GARMIN_PASSWORD must be set in .env');
      }

      await page.type('#email', username);
      await page.type('#password', password);
      await page.click('button[type="submit"]');

      await page.waitForNavigation();

      await Promise.race([csrfTokenReady, delay(8000)]);

      this.page = page;
    }

    return this.page;
  }

  public async get<T extends z.ZodTypeAny>(url: string, schema: T): Promise<z.output<T>> {
    const page = await this.getPage();
    const data = await page.evaluate(async (url: string, csrfToken: string | null) => {
      const response = await fetch(
        url,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            ...(csrfToken ? { 'connect-csrf-token': csrfToken } : {}),
          },
        },
      );
      if (!response.ok) {
        throw new Error(`Request to "${url}" failed with status ${response.status}: ${response.statusText}\nResponse body: ${await response.text()}`);
      }
      return response.json();
    }, url, this.csrfToken);
    return schema.parse(data);
  }
}
