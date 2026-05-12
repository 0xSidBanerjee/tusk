import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseQuickInput } from './parseQuickInput';

describe('parseQuickInput', () => {
  beforeEach(() => {
    // Set a fixed date for natural language parsing tests
    vi.setSystemTime(new Date('2026-05-12T10:00:00Z'));
  });

  it('parses title only', () => {
    const result = parseQuickInput('Buy milk');
    expect(result).toEqual({
      title: 'Buy milk',
    });
  });

  it('parses title and priority', () => {
    const result = parseQuickInput('Review PR | high');
    expect(result.priority).toBe('High');
    expect(result.title).toBe('Review PR');
  });

  it('parses title and deadline', () => {
    const result = parseQuickInput('Fix bug | tomorrow');
    expect(result.deadline).toBeDefined();
    expect(new Date(result.deadline!).toISOString()).toContain('2026-05-13');
    expect(result.title).toBe('Fix bug');
    expect(result.priority).toBeUndefined();
  });

  it('parses full format: title | deadline | priority', () => {
    const result = parseQuickInput('Meeting | next monday | low');
    expect(result.priority).toBe('Low');
    expect(result.deadline).toBeDefined();
    expect(result.title).toBe('Meeting');
  });

  it('handles unrecognized segments in 2-part input as deadline if possible', () => {
    const result = parseQuickInput('Task title | tomorrow');
    expect(result.priority).toBeUndefined();
    expect(result.deadline).toBeDefined();
  });

  it('parses ISO dates', () => {
    const result = parseQuickInput('Write release notes | 2026-06-01');
    expect(result.deadline).toBeDefined();
    expect(new Date(result.deadline!).toISOString()).toContain('2026-06-01');
    expect(result.title).toBe('Write release notes');
  });

  it('handles partial format with pipes but missing segments', () => {
    const result = parseQuickInput('Only title | | high');
    expect(result.priority).toBe('High');
    expect(result.deadline).toBeUndefined();
    expect(result.title).toBe('Only title');
  });

  it('handles empty input', () => {
    const result = parseQuickInput('');
    expect(result.title).toBe('');
  });

});
