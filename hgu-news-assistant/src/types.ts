
export interface NewsItem {
  id: number;
  title: string;
  publish_date: string;
  source: string;
  content: string;
  original_url: string;
  created_at: string;
}

export interface AppSettings {
  apiKey: string;
  lastScrapedUrl?: string;
  autoCrawl?: boolean;
  watchlist?: string[]; // Keywords to highlight
  // Branding
  appTitle?: string;
  appSubtitle?: string;
  appLogo?: string; // Base64 string
}

export enum CrawlStatus {
  IDLE = 'IDLE',
  CRAWLING = 'CRAWLING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface CrawlLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface SummaryResult {
  newsId?: number; // If single
  text: string;
  type: 'single' | 'multi';
}

export interface DashboardStats {
  totalCount: number;
  todayCount: number;
  sources: { name: string; value: number }[];
  trends: { date: string; count: number }[];
}

// IPC Channels
export const IPC_CHANNELS = {
  START_CRAWL: 'start-crawl',
  STOP_CRAWL: 'stop-crawl',
  ON_CRAWL_LOG: 'on-crawl-log', 
  GET_NEWS: 'get-news',
  GET_NEWS_CONTENT: 'get-news-content',
  DELETE_NEWS: 'delete-news',
  SAVE_SETTINGS: 'save-settings',
  GET_SETTINGS: 'get-settings',
  GENERATE_SUMMARY: 'generate-summary',
  GET_DASHBOARD_STATS: 'get-dashboard-stats'
};

// Global Window Interface for IPC
declare global {
  interface Window {
    electron: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      on: (channel: string, func: (...args: any[]) => void) => void;
      off: (channel: string, func: (...args: any[]) => void) => void;
    };
  }
}
