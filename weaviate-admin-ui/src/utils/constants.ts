// API Configuration
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';
export const APP_ORGANIZATION_NAME = process.env.REACT_APP_ORGANIZATION_NAME || 'Your Organization';
export const APP_TITLE = process.env.REACT_APP_APP_TITLE || 'Weaviate Admin';
export const APP_DESCRIPTION =
  process.env.REACT_APP_APP_DESCRIPTION || 'Admin tool for monitoring and managing Weaviate';
export const DEMO_CREDENTIALS = [
  {
    email: process.env.REACT_APP_DEMO_USER_1_EMAIL || 'engineer1@example.com',
    password: process.env.REACT_APP_DEMO_USER_1_PASSWORD || 'admin123',
  },
  {
    email: process.env.REACT_APP_DEMO_USER_2_EMAIL || 'engineer2@example.com',
    password: process.env.REACT_APP_DEMO_USER_2_PASSWORD || 'admin123',
  },
];

// Class Icons Mapping
export const CLASS_ICONS: Record<string, string> = {
  Requirement: '📋',
  UserStory: '📖',
  TestCase: '✅',
  FigmaScreen: '🎨',
  BugReport: '🐛',
};

// Default icon for unknown classes
export const DEFAULT_CLASS_ICON = '📦';

// Color Palette
export const COLORS = {
  primary: '#1976d2',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  background: '#fafafa',
  cardBackground: '#ffffff',
};

// Memory Usage Thresholds
export const MEMORY_THRESHOLDS = {
  normal: 70, // < 70% is green
  warning: 85, // 70-85% is yellow
  // > 85% is red
};

// Pagination
export const DEFAULT_PAGE_SIZE = 50;
export const DEFAULT_SIMILAR_LIMIT = 5;

// Refresh Intervals (in milliseconds)
export const DASHBOARD_REFRESH_INTERVAL = 30000; // 30 seconds

// Local Storage Keys
export const AUTH_TOKEN_KEY = 'weaviate_admin_token';
export const AUTH_USER_KEY = 'weaviate_admin_user';

