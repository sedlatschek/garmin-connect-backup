import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import { CHUNK_ANCHOR } from './constants.js';
import { fourWeekChunks } from './helpers.js';

// Helpers to build dates relative to the anchor for readable test cases
const anchor = (days: number) => CHUNK_ANCHOR.plus({ days }) as DateTime<true>;

describe('fourWeekChunks', () => {
  describe('chunk boundaries are stable (anchor-based)', () => {
    it('produces the same middle-chunk boundaries regardless of start date', () => {
      // Two runs that differ only in start date, both covering chunk index 1 fully
      const chunksA = [...fourWeekChunks(anchor(0), anchor(83))]; // start at chunk 0
      const chunksB = [...fourWeekChunks(anchor(10), anchor(83))]; // start mid-chunk 0

      // chunk index 1 (anchor+28 to anchor+55) must be identical in both runs
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
      const start = anchor(10); // mid chunk 0 (chunk 0 = anchor+0 to anchor+27)
      const end = anchor(30);
      const chunks = [...fourWeekChunks(start, end)];

      expect(chunks[0].from.toISODate()).toBe(start.toISODate());
    });

    it('clamps the last chunk to to end when end is mid-chunk', () => {
      const start = anchor(0);
      const end = anchor(40); // mid chunk 1 (chunk 1 = anchor+28 to anchor+55)
      const chunks = [...fourWeekChunks(start, end)];

      expect(chunks[chunks.length - 1].to.toISODate()).toBe(end.toISODate());
    });

    it('does not clamp middle chunks', () => {
      // span 3 chunks: 0, 1, 2
      const start = anchor(10);
      const end = anchor(70);
      const chunks = [...fourWeekChunks(start, end)];

      // middle chunk (index 1) must have full 28-day bounds
      const middle = chunks[1];
      expect(middle.from.toISODate()).toBe(anchor(28).toISODate());
      expect(middle.to.toISODate()).toBe(anchor(55).toISODate());
    });

    it('when start falls exactly on a chunk boundary, from equals that boundary', () => {
      const start = anchor(28); // exact start of chunk 1
      const end = anchor(55);
      const chunks = [...fourWeekChunks(start, end)];

      expect(chunks[0].from.toISODate()).toBe(anchor(28).toISODate());
    });
  });

  describe('coverage and continuity', () => {
    it('yields a single chunk when start and end are in the same chunk', () => {
      const chunks = [...fourWeekChunks(anchor(5), anchor(20))];
      expect(chunks).toHaveLength(1);
    });

    it('consecutive chunks are contiguous (no gaps, no overlaps)', () => {
      const chunks = [...fourWeekChunks(anchor(0), anchor(111))]; // 4 full chunks
      for (let i = 0; i < chunks.length - 1; i++) {
        const expectedNextFrom = chunks[i].to.plus({ days: 1 }).toISODate();
        expect(chunks[i + 1].from.toISODate()).toBe(expectedNextFrom);
      }
    });

    it('covers exactly 4 chunks when spanning 4 full 28-day windows', () => {
      const chunks = [...fourWeekChunks(anchor(0), anchor(111))]; // 0-27, 28-55, 56-83, 84-111
      expect(chunks).toHaveLength(4);
    });
  });

  describe('complete flag', () => {
    it('marks all chunks as complete when the entire range is well in the past', () => {
      // Use a fixed range from 2010 — all safely in the past
      const start = DateTime.fromISO('2010-01-01', { zone: 'utc' }) as DateTime<true>;
      const end = DateTime.fromISO('2010-06-01', { zone: 'utc' }) as DateTime<true>;
      const chunks = [...fourWeekChunks(start, end)];

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.every(c => c.complete)).toBe(true);
    });

    it('marks the current chunk as not complete', () => {
      // end is in the future so the last chunk cannot have ended yet
      const start = DateTime.now().minus({ days: 10 }).startOf('day') as DateTime<true>;
      const end = DateTime.now().plus({ days: 10 }).startOf('day') as DateTime<true>;
      const chunks = [...fourWeekChunks(start, end)];

      // The last chunk contains today and must not be complete
      expect(chunks[chunks.length - 1].complete).toBe(false);
    });

    it('marks a chunk ending yesterday as complete', () => {
      // Build a chunk whose `to` is yesterday by picking end = yesterday within a past chunk
      const yesterday = DateTime.now().minus({ days: 1 }).startOf('day') as DateTime<true>;
      const start = yesterday.minus({ days: 5 }) as DateTime<true>;
      const chunks = [...fourWeekChunks(start, yesterday)];
      const last = chunks[chunks.length - 1];

      // last.to is clamped to yesterday which is < now
      expect(last.to <= yesterday).toBe(true);
      expect(last.complete).toBe(true);
    });
  });
});
