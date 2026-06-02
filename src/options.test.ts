import { describe, it, expect } from 'vitest';
import { parseDate, parsePositiveFloat } from './parsers.js';

describe('parseDate', () => {
  it('accepts a valid ISO date and returns it unchanged', () => {
    expect(parseDate('2024-03-15')).toBe('2024-03-15');
  });

  it('accepts the start of a year', () => {
    expect(parseDate('2020-01-01')).toBe('2020-01-01');
  });

  it('throws on a non-date string', () => {
    expect(() => parseDate('not-a-date')).toThrow('Invalid date "not-a-date"');
  });

  it('throws on wrong separator style', () => {
    expect(() => parseDate('2024/03/15')).toThrow();
  });

  it('throws on an out-of-range month', () => {
    expect(() => parseDate('2024-13-01')).toThrow();
  });

  it('throws on an out-of-range day', () => {
    expect(() => parseDate('2024-01-32')).toThrow();
  });

  it('throws on an empty string', () => {
    expect(() => parseDate('')).toThrow();
  });
});

describe('parsePositiveFloat', () => {
  it('parses a whole number', () => {
    expect(parsePositiveFloat('5')).toBe(5);
  });

  it('parses a decimal', () => {
    expect(parsePositiveFloat('0.5')).toBe(0.5);
  });

  it('throws on zero', () => {
    expect(() => parsePositiveFloat('0')).toThrow('must be a positive number');
  });

  it('throws on a negative number', () => {
    expect(() => parsePositiveFloat('-1')).toThrow('must be a positive number');
  });

  it('throws on a non-numeric string', () => {
    expect(() => parsePositiveFloat('abc')).toThrow('must be a positive number');
  });

  it('throws on an empty string', () => {
    expect(() => parsePositiveFloat('')).toThrow('must be a positive number');
  });
});
