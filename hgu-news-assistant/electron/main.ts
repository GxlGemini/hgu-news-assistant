import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import Database from 'better-sqlite3';
import axios from 'axios';
import * as cheerio from 'cheerio';
import Store from 'electron-store';
import https from 'https';

// Fix for "Cannot find name '__dirname'" in TypeScript when targeting CommonJS
declare const __dirname: string;

// --- Database Setup ---
const isDev = !app.isPackaged;
const dbPath = isDev 
  ? path.join((process as any).cwd(), 'news.db') 
  : path.join(app.getPath('userData'), 'news.db');

const db = new Database(dbPath);
const store = new Store();

// Initialize DB Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    publish_date TEXT,
    source TEXT,
    content TEXT,
    original_url TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// --- Main Window ---
let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false 
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../../index.html'));
  
  mainWindow.webContents.on('did-finish-load', () => {
    const envLabel = isDev ? '[开发模式]' : '[生产模式]';
    sendLog('info', `${envLabel} 数据库存储路径: ${dbPath}`);
    
    const autoCrawl = store.get('autoCrawl', false) as boolean;
    setupAutoCrawl(autoCrawl);
  });
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if ((process as any).platform !== 'darwin') app.quit();
});

// --- Helper: Send Log to UI ---
function sendLog(type: 'info' | 'success' | 'warning' | 'error', message: string) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('on-crawl-log', {
      id: Date.now().toString() + Math.random(),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      status: isCrawling ? 'CRAWLING' : 'IDLE'
    });
  }
}

// --- Scheduler Logic ---
let autoCrawlTimer: ReturnType<typeof setInterval> | null = null;

function setupAutoCrawl(enabled: boolean) {
  if (autoCrawlTimer) clearInterval(autoCrawlTimer);
  
  if (enabled) {
    const INTERVAL = 24 * 60 * 60 * 1000; 
    console.log("Auto-crawl scheduled enabled.");
    
    autoCrawlTimer = setInterval(() => {
      if (!isCrawling) {
        const url = store.get('lastScrapedUrl') as string;
        if (url) {
          sendLog('info', '⏰ 触发定时自动采集任务...');
          visitedUrls.clear(); 
          isCrawling = true;
          crawlPage(url);
        }
      }
    }, INTERVAL);
  }
}

// --- Crawler Logic ---
let isCrawling = false;
let currentAbortController: AbortController | null = null;
const visitedUrls = new Set<string>();

async function crawlPage(url: string) {
  if (!isCrawling) return;
  
  if (!url || !url.startsWith('http')) {
    sendLog('error', `无效的 URL: ${url}`);
    isCrawling = false;
    return;
  }

  if (visitedUrls.has(url)) {
    sendLog('warning', `检测到循环链接，停止当前分支: ${url}`);
    return;
  }
  visitedUrls.add(url);

  try {
    sendLog('info', `正在请求: ${url}`);
    store.set('lastScrapedUrl', url);

    // Initialize AbortController for this request
    currentAbortController = new AbortController();

    const { data } = await axios.get(url, {
      timeout: 30000, // Increased to 30s
      signal: currentAbortController.signal,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }), // Ignore SSL cert errors
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Referer': url
      }
    });
    
    // Clear controller as request finished
    currentAbortController = null;

    const $ = cheerio.load(data);

    let title = $('.tit h1').text().trim();
    if (!title) title = $('h1').first().text().trim();
    if (!title) title = $('.article-title').text().trim();
    if (!title) title = $('title').text().split('-')[0].trim();
    
    let metaText = '';
    const potentialMetaElements = $('.info, .art-info, .date, .source, .tit p, .article-info');
    potentialMetaElements.each((i, el) => {
      metaText += $(el).text() + ' ';
    });
    
    if (metaText.length < 10) {
      metaText = $('body').text().replace(/\s+/g, ' ').substring(0, 1500);
    } else {
      metaText = metaText.replace(/\s+/g, ' ');
    }

    let publish_date = '';
    const datePatterns = [
      /(?:发布时间|日期|时间)[：:]\s*(\d{4}[-年]\d{1,2}[-月]\d{1,2}(?:日)?)/, 
      /(\d{4}[-年]\d{1,2}[-月]\d{1,2}(?:日)?)/ 
    ];

    for (const pattern of datePatterns) {
      const match = metaText.match(pattern);
      if (match && match[1]) {
        let rawDate = match[1];
        rawDate = rawDate.replace(/年/g, '-').replace(/月/g, '-').replace(/日/g, '');
        const parts = rawDate.split('-');
        if (parts.length === 3) {
           const y = parts[0];
           const m = parts[1].padStart(2, '0');
           const d = parts[2].padStart(2, '0');
           publish_date = `${y}-${m}-${d}`;
        }
        break; 
      }
    }

    if (!publish_date) publish_date = new Date().toISOString().split('T')[0];

    let source = '';
    const sourcePatterns = [
      /(?:资料来源|来源)[：:]\s*([^\s\|\]]+)/, 
      /(?:供稿|撰稿|作者)[：:]\s*([^\s\|\]]+)/
    ];

    for (const pattern of sourcePatterns) {
      const match = metaText.match(pattern);
      if (match && match[1]) {
        source = match[1].trim();
        source = source.replace(/[\)\],。]+$/, ''); 
        break;
      }
    }

    if (!source || source.length > 30) source = '河北地质大学'; 

    $('.v_news_content script').remove();
    $('.v_news_content style').remove();
    $('p').each((_, el) => { if($(el).text().trim() === '') $(el).remove(); });
    
    const content = $('.v_news_content').text().replace(/\s+/g, '\n').trim(); 

    if (title && content) {
      try {
        const stmt = db.prepare(`
          INSERT INTO news (title, publish_date, source, content, original_url)
          VALUES (?, ?, ?, ?, ?)
        `);
        stmt.run(title, publish_date, source, content, url);
        sendLog('success', `入库: [${publish_date}] [${source}] ${title.substring(0, 10)}...`);
      } catch (err: any) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          sendLog('warning', `跳过重复数据: ${title.substring(0, 15)}...`);
        } else {
          console.error('DB Error:', err);
          sendLog('error', `数据库写入失败: ${err.message}`);
        }
      }
    } else {
      sendLog('warning', `页面解析不完整 (可能是列表页): ${url}`);
    }

    const nextLinkTag = $("a:contains('下一篇')");
    const nextLinkHref = nextLinkTag.attr('href');

    if (nextLinkHref) {
      const nextUrl = new URL(nextLinkHref, url).href;
      setTimeout(() => crawlPage(nextUrl), 1500);
    } else {
      isCrawling = false;
      sendLog('success', '✅ 采集任务完成：未找到“下一篇”链接。');
      mainWindow?.webContents.send('on-crawl-log', { status: 'COMPLETED' });
    }

  } catch (error: any) {
    if (axios.isCancel(error)) {
        console.log('Request canceled by user.');
        return; // Silent exit
    }
    console.error('Crawl Error', error);
    isCrawling = false;
    // Distinguish between timeout and other errors
    const errorMsg = error.code === 'ECONNABORTED' ? '请求超时 (30s) - 对方服务器响应过慢' : error.message;
    sendLog('error', `网络/解析错误: ${errorMsg}`);
    mainWindow?.webContents.send('on-crawl-log', { status: 'ERROR' });
  }
}

// --- IPC Handlers ---

ipcMain.handle('get-settings', () => {
  return {
    apiKey: store.get('apiKey', ''),
    lastScrapedUrl: store.get('lastScrapedUrl', 'https://www.hgu.edu.cn/info/1049/11082.htm'),
    autoCrawl: store.get('autoCrawl', false),
    watchlist: store.get('watchlist', []),
    // Branding defaults
    appTitle: store.get('appTitle', '新闻助手'),
    appSubtitle: store.get('appSubtitle', 'HGU News Intelligence'),
    appLogo: store.get('appLogo', '')
  };
});

ipcMain.handle('save-settings', (_, settings) => {
  store.set('apiKey', settings.apiKey);
  if(settings.lastScrapedUrl) store.set('lastScrapedUrl', settings.lastScrapedUrl);
  store.set('autoCrawl', settings.autoCrawl);
  if(settings.watchlist !== undefined) store.set('watchlist', settings.watchlist);
  
  // Save Branding
  if (settings.appTitle !== undefined) store.set('appTitle', settings.appTitle);
  if (settings.appSubtitle !== undefined) store.set('appSubtitle', settings.appSubtitle);
  if (settings.appLogo !== undefined) store.set('appLogo', settings.appLogo);

  setupAutoCrawl(settings.autoCrawl);
  return true;
});

ipcMain.handle('get-news', (_, { page, limit, search }) => {
  const offset = (page - 1) * limit;
  let query = 'SELECT id, title, publish_date, source, original_url FROM news';
  let countQuery = 'SELECT COUNT(*) as count FROM news';
  const params: any[] = [];

  if (search && search.trim() !== '') {
    const term = `%${search.trim()}%`;
    const whereClause = ' WHERE title LIKE ? OR source LIKE ? OR content LIKE ?';
    query += whereClause;
    countQuery += whereClause;
    params.push(term, term, term);
  }

  query += ' ORDER BY publish_date DESC, id DESC LIMIT ? OFFSET ?';
  
  const items = db.prepare(query).all(...params, limit, offset);
  const count = db.prepare(countQuery).get(...params) as { count: number };
  
  return { items, total: count.count };
});

ipcMain.handle('get-news-content', (_, id) => {
  return db.prepare('SELECT * FROM news WHERE id = ?').get(id);
});

ipcMain.handle('delete-news', (_, ids: number[]) => {
  if (!ids || ids.length === 0) return false;
  const placeholders = ids.map(() => '?').join(',');
  const stmt = db.prepare(`DELETE FROM news WHERE id IN (${placeholders})`);
  stmt.run(...ids);
  return true;
});

ipcMain.handle('start-crawl', async (_, url) => {
  if (isCrawling) return;
  sendLog('info', '🚀 爬虫启动，准备开始采集...');
  isCrawling = true;
  visitedUrls.clear();
  await crawlPage(url);
});

ipcMain.handle('stop-crawl', () => {
  isCrawling = false;
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
  sendLog('warning', '🛑 用户已手动停止采集任务。');
  mainWindow?.webContents.send('on-crawl-log', { status: 'IDLE' });
  return true;
});

ipcMain.handle('generate-summary', async (_, { apiKey, contents }) => {
  if (!apiKey || !contents || contents.length === 0) throw new Error('Params missing');
  
  const newsTexts = contents.map((c: any, i: number) => 
    `新闻${i+1} [${c.title}]: ${c.content.substring(0, 800)}...`
  ).join('\n\n');

  const systemPrompt = "你是一个专业的新闻助手。请对提供的多篇新闻进行综合总结。如果是单篇新闻，请提取核心摘要；如果是多篇，请分析它们的共同点或按时间线梳理。保持客观，格式清晰。";
  
  try {
    const response = await axios.post(
      'https://api.deepseek.com/chat/completions',
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `请总结以下新闻内容：\n\n${newsTexts}` }
        ],
        stream: false
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 60000 
      }
    );
    return response.data.choices[0].message.content;
  } catch (error: any) {
    console.error('AI API Error:', error.response?.data || error.message);
    throw new Error('AI 服务请求失败，请检查 API Key 或网络连接。');
  }
});

ipcMain.handle('get-dashboard-stats', () => {
  const totalCount = (db.prepare('SELECT COUNT(*) as c FROM news').get() as any).c;
  
  const today = new Date().toISOString().split('T')[0];
  const todayCount = (db.prepare('SELECT COUNT(*) as c FROM news WHERE publish_date = ?').get(today) as any).c;

  const sources = db.prepare(`
    SELECT source as name, COUNT(*) as value 
    FROM news 
    GROUP BY source 
    ORDER BY value DESC 
    LIMIT 5
  `).all();

  const trends = db.prepare(`
    SELECT created_at as date, COUNT(*) as count 
    FROM news 
    GROUP BY date(created_at) 
    ORDER BY created_at DESC 
    LIMIT 7
  `).all().reverse();

  return { totalCount, todayCount, sources, trends };
});