/**
 * Format bytes to human-readable size
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Format Unix timestamp to readable date
 */
export const formatDate = (unixTimestamp: number): string => {
  const date = new Date(unixTimestamp * 1000);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

/**
 * Format ISO date string to readable format
 */
export const formatISODate = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

/**
 * Truncate UUID for display
 */
export const truncateUUID = (uuid: string, length: number = 8): string => {
  if (!uuid) return '';
  return uuid.length > length ? `${uuid.substring(0, length)}...` : uuid;
};

/**
 * Format large numbers with commas
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

/**
 * Format percentage
 */
export const formatPercent = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Get memory color based on usage percentage
 */
export const getMemoryColor = (percent: number): 'success' | 'warning' | 'error' => {
  if (percent < 70) return 'success';
  if (percent < 85) return 'warning';
  return 'error';
};

/**
 * Format execution time in milliseconds
 */
export const formatExecutionTime = (ms: number): string => {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
};

