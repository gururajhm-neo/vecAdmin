import {
  formatBytes,
  truncateUUID,
  formatNumber,
  formatPercent,
  getMemoryColor,
  formatExecutionTime,
} from './formatters';

describe('formatters', () => {
  test('formatBytes returns zero bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
  });

  test('truncateUUID truncates long values', () => {
    expect(truncateUUID('1234567890abcdef', 8)).toBe('12345678...');
  });

  test('formatNumber adds locale separators', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  test('formatPercent formats with default decimals', () => {
    expect(formatPercent(12.34)).toBe('12.3%');
  });

  test('getMemoryColor maps thresholds', () => {
    expect(getMemoryColor(10)).toBe('success');
    expect(getMemoryColor(80)).toBe('warning');
    expect(getMemoryColor(95)).toBe('error');
  });

  test('formatExecutionTime switches units at 1000ms', () => {
    expect(formatExecutionTime(150)).toBe('150ms');
    expect(formatExecutionTime(1450)).toBe('1.45s');
  });
});
