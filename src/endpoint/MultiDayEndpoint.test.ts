import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import { z } from 'zod';
import { CHUNK_ANCHOR } from '../constants.js';
import { MultiDayEndpoint } from './MultiDayEndpoint.js';

const anchor = (days: number) => CHUNK_ANCHOR.plus({ days });

const ep28 = new MultiDayEndpoint(28, () => '', z.unknown(), 'test');

describe('MultiDayEndpoint.chunk', () => {
  describe('chunk boundaries are stable (anchor-based)', () => {
    it('produces the same middle-chunk boundaries regardless of start date', () => {
      const chunksA = [...ep28.chunk(anchor(0), anchor(83))];
      const chunksB = [...ep28.chunk(anchor(10), anchor(83))];

      const chunkA1 = chunksA.find(c => c.from.valueOf() === anchor(28).valueOf());
      const chunkB1 = chunksB.find(c => c.from.valueOf() === anchor(28).valueOf());

      expect(chunkA1).toBeDefined();
      expect(chunkB1).toBeDefined();
      expect(chunkA1!.from.toISODate()).toBe(chunkB1!.from.toISODate());
      expect(chunkA1!.to.toISODate()).toBe(chunkB1!.to.toISODate());
    });
  });

  describe('clamping', () => {
    it('clamps the first chunk from to start when start is mid-chunk', () => {
      const start = anchor(10);
      const end = anchor(30);
      const chunks = [...ep28.chunk(start, end)];

      expect(chunks[0].from.toISODate()).toBe(start.toISODate());
    });

    it('clamps the last chunk to to end when end is mid-chunk', () => {
      const start = anchor(0);
      const end = anchor(40);
      const chunks = [...ep28.chunk(start, end)];

      expect(chunks[chunks.length - 1].to.toISODate()).toBe(end.toISODate());
    });

    it('does not clamp middle chunks', () => {
      const start = anchor(10);
      const end = anchor(70);
      const chunks = [...ep28.chunk(start, end)];

      const middle = chunks[1];
      expect(middle.from.toISODate()).toBe(anchor(28).toISODate());
      expect(middle.to.toISODate()).toBe(anchor(55).toISODate());
    });

    it('when start falls exactly on a chunk boundary, from equals that boundary', () => {
      const start = anchor(28);
      const end = anchor(55);
      const chunks = [...ep28.chunk(start, end)];

      expect(chunks[0].from.toISODate()).toBe(anchor(28).toISODate());
    });
  });

  describe('coverage and continuity', () => {
    it('yields a single chunk when start and end are in the same chunk', () => {
      const chunks = [...ep28.chunk(anchor(5), anchor(20))];
      expect(chunks).toHaveLength(1);
    });

    it('consecutive chunks are contiguous (no gaps, no overlaps)', () => {
      const chunks = [...ep28.chunk(anchor(0), anchor(111))];
      for (let i = 0; i < chunks.length - 1; i++) {
        const expectedNextFrom = chunks[i].to.plus({ days: 1 }).toISODate();
        expect(chunks[i + 1].from.toISODate()).toBe(expectedNextFrom);
      }
    });

    it('covers exactly 4 chunks when spanning 4 full 28-day windows', () => {
      const chunks = [...ep28.chunk(anchor(0), anchor(111))];
      expect(chunks).toHaveLength(4);
    });
  });

  describe('complete flag', () => {
    it('marks all chunks as complete when the entire range is well in the past', () => {
      const start = DateTime.fromISO('2010-01-01', { zone: 'utc' }) as DateTime<true>;
      const end = DateTime.fromISO('2010-06-01', { zone: 'utc' }) as DateTime<true>;
      const chunks = [...ep28.chunk(start, end)];

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.every(c => c.complete)).toBe(true);
    });

    it('marks the current chunk as not complete', () => {
      const start = DateTime.now().minus({ days: 10 }).startOf('day') as DateTime<true>;
      const end = DateTime.now().plus({ days: 10 }).startOf('day') as DateTime<true>;
      const chunks = [...ep28.chunk(start, end)];

      expect(chunks[chunks.length - 1].complete).toBe(false);
    });

    it('marks a chunk ending yesterday as complete', () => {
      const yesterday = DateTime.now().minus({ days: 1 }).startOf('day') as DateTime<true>;
      const start = yesterday.minus({ days: 5 }) as DateTime<true>;
      const chunks = [...ep28.chunk(start, yesterday)];
      const last = chunks[chunks.length - 1];

      expect(last.to <= yesterday).toBe(true);
      expect(last.complete).toBe(true);
    });
  });

  describe('url', () => {
    it('calls the urlBuilder with the chunk from/to dates', () => {
      const calls: Array<{ from: string, to: string }> = [];
      const ep = new MultiDayEndpoint(
        28,
        (from, to) => {
          calls.push({ from: from.toISODate()!, to: to.toISODate()! });
          return '';
        },
        z.unknown(),
        'test',
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const _ of ep.chunk(anchor(0), anchor(55))) { /* exhaust generator */ }

      expect(calls).toHaveLength(2);
      expect(calls[0]).toEqual({ from: anchor(0).toISODate(), to: anchor(27).toISODate() });
      expect(calls[1]).toEqual({ from: anchor(28).toISODate(), to: anchor(55).toISODate() });
    });
  });

  describe('chunk size', () => {
    it('produces 182-day chunks with the correct boundaries', () => {
      const ep182 = new MultiDayEndpoint(182, () => '', z.unknown(), 'test');
      const chunks = [...ep182.chunk(anchor(0), anchor(363))];

      expect(chunks).toHaveLength(2);
      expect(chunks[0].from.toISODate()).toBe(anchor(0).toISODate());
      expect(chunks[0].to.toISODate()).toBe(anchor(181).toISODate());
      expect(chunks[1].from.toISODate()).toBe(anchor(182).toISODate());
      expect(chunks[1].to.toISODate()).toBe(anchor(363).toISODate());
    });
  });
});
