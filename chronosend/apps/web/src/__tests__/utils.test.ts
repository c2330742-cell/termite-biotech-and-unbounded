import { describe, it, expect } from 'vitest';
import { cn, formatDate, formatRelativeTime, truncate, getStatusColor } from '../lib/utils';

describe('cn (class name merger)', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('should handle Tailwind conflicts', () => {
    expect(cn('px-4', 'px-2')).toBe('px-2');
  });
});

describe('formatDate', () => {
  it('should format a date string', () => {
    const result = formatDate('2024-06-15T14:30:00Z');
    expect(result).toContain('2024');
    expect(result).toContain('Jun');
  });

  it('should handle Date objects', () => {
    const result = formatDate(new Date('2024-01-01'));
    expect(result).toContain('2024');
  });
});

describe('formatRelativeTime', () => {
  it('should return "just now" for current time', () => {
    expect(formatRelativeTime(new Date())).toBe('just now');
  });

  it('should return minutes for recent times', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(fiveMinAgo)).toContain('5m ago');
  });

  it('should return hours for older times', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    expect(formatRelativeTime(twoHoursAgo)).toContain('2h ago');
  });

  it('should return days for much older times', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(threeDaysAgo)).toContain('3d ago');
  });

  it('should show "in" prefix for future dates', () => {
    const oneHour = new Date(Date.now() + 60 * 60 * 1000);
    expect(formatRelativeTime(oneHour)).toContain('in 1h');
  });
});

describe('truncate', () => {
  it('should return short strings unchanged', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('should truncate long strings', () => {
    const long = 'This is a very long string that should be truncated';
    expect(truncate(long, 20)).toBe('This is a very long ...');
  });
});

describe('getStatusColor', () => {
  it('should return blue classes for pending', () => {
    expect(getStatusColor('pending')).toContain('blue');
  });

  it('should return green classes for sent', () => {
    expect(getStatusColor('sent')).toContain('green');
  });

  it('should return red classes for failed', () => {
    expect(getStatusColor('failed')).toContain('red');
  });

  it('should return gray classes for cancelled', () => {
    expect(getStatusColor('cancelled')).toContain('gray');
  });

  it('should return yellow classes for sending', () => {
    expect(getStatusColor('sending')).toContain('yellow');
  });
});
