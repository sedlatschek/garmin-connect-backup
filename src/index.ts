#!/usr/bin/env node

import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { GarminClient } from './client.js';

const OUT_DIR = 'backup';

function outDir(...parts: string[]): string {
  const dir = join(OUT_DIR, ...parts);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function writeJson(path: string, data: unknown): void {
  writeFileSync(path, JSON.stringify(data, null, 2));
}

async function main(): Promise<void> {
  const client = await GarminClient.create();
  console.log('Session ready.');

  // ─── Activities ─────────────────────────────────────────────────────────────

  const activitiesDir = outDir('activities');
  let count = 0;

  for await (const activity of client.getAllActivities()) {
    const id = (activity as any).activityId as number;
    const activityDir = outDir('activities', String(id));

    // Summary (from the list endpoint — skip if already downloaded)
    const summaryPath = join(activityDir, 'summary.json');
    if (!existsSync(summaryPath)) {
      writeJson(summaryPath, activity);
    }

    // Details
    const detailPath = join(activityDir, 'detail.json');
    if (!existsSync(detailPath)) {
      try {
        const detail = await client.getActivityDetails(id);
        writeJson(detailPath, detail);
      } catch (err) {
        console.error(`  detail failed for ${id}: ${err}`);
      }
    }

    count++;
    console.log(`[${count}] ${id} — ${(activity as any).activityName ?? '(unnamed)'}`);
  }

  console.log(`\nDownloaded ${count} activities to ${activitiesDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
