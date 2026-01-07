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
}

export enum CrawlStatus {
  IDLE = 'IDLE',
  CRAWLING = 'CRAWLING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface SummaryResult {
  newsId?: number; // If single
  text: string;
  type: 'single' | 'multi';
}

// IPC Channels
export const IPC_CHANNELS = {
  START_CRAWL: 'start-crawl',
  STOP_CRAWL: 'stop-crawl',
  ON_CRAWL_PROGRESS: 'on-crawl-progress',
  GET_NEWS: 'get-news',
  GET_NEWS_CONTENT: 'get-news-content',
  DELETE_NEWS: 'delete-news',
  SAVE_SETTINGS: 'save-settings',
  GET_SETTINGS: 'get-settings',
  GENERATE_SUMMARY: 'generate-summary'
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