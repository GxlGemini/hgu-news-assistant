import React, { useState, useEffect, useRef } from 'react';
import { Settings, Newspaper, Play, StopCircle, FileText, Terminal, Activity, Sun, Moon, Edit3, Clock, LayoutDashboard } from 'lucide-react';
import { NewsTable } from './components/NewsTable';
import { SettingsModal } from './components/SettingsModal';
import { SummaryModal } from './components/SummaryModal';
import { NewsDetailModal } from './components/NewsDetailModal';
import { BrandingModal } from './components/BrandingModal';
import { Dashboard } from './components/Dashboard';
import { AppSettings, IPC_CHANNELS, CrawlStatus, CrawlLog, NewsItem } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'news' | 'crawl'>('dashboard');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [brandingOpen, setBrandingOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({ apiKey: '', lastScrapedUrl: '', autoCrawl: false });
  
  // Time State
  const [currentTime, setCurrentTime] = useState(new Date());

  // Global App Dark Mode
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // Local Terminal Dark Mode (Independent but Syncs)
  const [terminalDark, setTerminalDark] = useState(true);

  // Crawler State
  const [crawlStatus, setCrawlStatus] = useState<CrawlStatus>(CrawlStatus.IDLE);
  const [logs, setLogs] = useState<CrawlLog[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // Summary & Detail State
  const [selectedNewsIds, setSelectedNewsIds] = useState<number[]>([]);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryContent, setSummaryContent] = useState<string>('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentNews, setCurrentNews] = useState<NewsItem | null>(null);

  // Clock Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Toggle Global Dark Mode Logic
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setTerminalDark(true); // SYNC: Turn terminal dark when global is dark
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setTerminalDark(false); // SYNC: Turn terminal light when global is light
    }
  }, [isDarkMode]);

  useEffect(() => {
    loadSettings();
    
    window.electron.on(IPC_CHANNELS.ON_CRAWL_LOG, (data: any) => {
      if (data.status) {
        if (data.status === 'COMPLETED') setCrawlStatus(CrawlStatus.COMPLETED);
        else if (data.status === 'ERROR') setCrawlStatus(CrawlStatus.ERROR);
        else if (data.status === 'CRAWLING') setCrawlStatus(CrawlStatus.CRAWLING);
      }
      if (data.message) {
        setLogs(prev => [...prev, data]);
      }
    });

    return () => {};
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, activeTab]);

  const loadSettings = async () => {
    const s = await window.electron.invoke(IPC_CHANNELS.GET_SETTINGS);
    setSettings(s);
  };

  const handleStartCrawl = async () => {
    const currentSettings = await window.electron.invoke(IPC_CHANNELS.GET_SETTINGS);
    if (!currentSettings.lastScrapedUrl) {
      alert("请先在设置中配置起始 URL。");
      setSettingsOpen(true);
      return;
    }
    setSettings(currentSettings);
    
    setLogs([]); 
    setCrawlStatus(CrawlStatus.CRAWLING);
    await window.electron.invoke(IPC_CHANNELS.START_CRAWL, currentSettings.lastScrapedUrl);
  };

  const handleStopCrawl = async () => {
    await window.electron.invoke(IPC_CHANNELS.STOP_CRAWL);
    setCrawlStatus(CrawlStatus.PAUSED);
    loadSettings();
  };

  const handleGenerateSummary = async () => {
    if (selectedNewsIds.length === 0) return;
    if (!settings.apiKey) {
      alert("请先配置 DeepSeek API Key。");
      setSettingsOpen(true);
      return;
    }

    setSummaryOpen(true);
    setSummaryContent(''); 
    
    const contents = [];
    for (const id of selectedNewsIds) {
      const item = await window.electron.invoke(IPC_CHANNELS.GET_NEWS_CONTENT, id);
      contents.push(item);
    }

    try {
      const summary = await window.electron.invoke(IPC_CHANNELS.GENERATE_SUMMARY, {
        apiKey: settings.apiKey,
        contents
      });
      setSummaryContent(summary);
    } catch (err: any) {
      setSummaryContent(`生成总结失败: ${err.message || '未知错误'}`);
    }
  };

  const handleViewDetail = (news: NewsItem) => {
    setCurrentNews(news);
    setDetailOpen(true);
  };

  const getSiteName = () => {
    if (!settings.lastScrapedUrl) return '未配置网站';
    if (settings.lastScrapedUrl.includes('hgu.edu.cn')) {
      return '河北地质大学新闻网';
    }
    try {
      return new URL(settings.lastScrapedUrl).hostname;
    } catch {
      return settings.lastScrapedUrl;
    }
  };

  // Date Formatters
  const timeString = currentTime.toLocaleTimeString('en-GB', { hour12: false });
  const dateString = currentTime.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const weekString = currentTime.toLocaleDateString('zh-CN', { weekday: 'long' });

  return (
    <div className="flex h-screen font-sans text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-850 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-xl z-20 transition-colors duration-200">
        
        {/* Branding & Clock Area */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 group relative flex flex-col items-center text-center">
           
           {/* Edit Trigger */}
           <button 
             onClick={() => setBrandingOpen(true)}
             className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all"
             title="自定义品牌"
           >
              <Edit3 className="w-4 h-4" />
           </button>

           {/* Large Logo */}
           <div className="mb-4 relative">
              {settings.appLogo ? (
                <img 
                  src={settings.appLogo} 
                  alt="Logo" 
                  className="w-24 h-24 rounded-2xl object-cover shadow-lg border-4 border-white dark:border-gray-700 transition-transform hover:scale-105 duration-300" 
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg border-4 border-white dark:border-gray-700 transition-transform hover:scale-105 duration-300">
                  <Newspaper className="w-10 h-10 text-white" />
                </div>
              )}
           </div>

           {/* Title Text */}
           <div className="w-full mb-5">
             <h1 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight truncate">
               {settings.appTitle || '新闻助手'}
             </h1>
             <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider font-medium truncate">
                {settings.appSubtitle || 'HGU News Intelligence'}
             </p>
           </div>

           {/* Time Widget */}
           <div className="w-full bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700/50 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
              <div className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400 tabular-nums tracking-widest z-10">
                 {timeString}
              </div>
              <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-widest mt-1 z-10 flex gap-2">
                 <span>{dateString}</span>
                 <span className="w-px h-3 bg-gray-300 dark:bg-gray-600"></span>
                 <span>{weekString}</span>
              </div>
              {/* Decorative background element */}
              <div className="absolute -right-2 -bottom-4 opacity-5 dark:opacity-10 text-blue-600">
                 <Clock className="w-16 h-16" />
              </div>
           </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-750'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>数据仪表盘</span>
          </button>

          <button 
            onClick={() => setActiveTab('news')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium ${activeTab === 'news' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-750'}`}
          >
            <FileText className="w-5 h-5" />
            <span>新闻资料库</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('crawl')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium ${activeTab === 'crawl' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-750'}`}
          >
            <Activity className="w-5 h-5" />
            <span>数据采集中心</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700 space-y-2 bg-white dark:bg-gray-850">
           {/* Dark Mode Toggle */}
           <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-750 rounded-lg transition-colors"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            <span>{isDarkMode ? '切换亮色模式' : '切换深色模式'}</span>
          </button>

          <div className={`px-3 py-2 rounded mb-3 text-xs font-medium flex items-center justify-between border ${settings.apiKey ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'}`}>
            <span>DeepSeek API</span>
            <span className="flex h-2 w-2 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${settings.apiKey ? 'bg-green-400' : 'bg-red-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${settings.apiKey ? 'bg-green-500' : 'bg-red-500'}`}></span>
            </span>
          </div>
          <button 
            onClick={() => setSettingsOpen(true)}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-750 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>系统设置</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-gray-50 dark:bg-gray-900">
        
        {activeTab === 'dashboard' && <Dashboard />}

        {activeTab === 'crawl' && (
          <div className="flex-1 flex flex-col p-6 max-w-5xl mx-auto w-full h-full">
            <div className="bg-white dark:bg-gray-850 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 flex items-center justify-between transition-colors">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Terminal className="w-6 h-6 text-gray-400" />
                  采集控制台
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  目标站点：<span className="font-medium text-gray-700 dark:text-gray-300">{getSiteName()}</span>
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                 <div className="text-right mr-4 hidden md:block">
                    <div className="text-xs text-gray-400">当前待采集 URL</div>
                    <div className="text-sm font-mono text-gray-600 dark:text-gray-300 truncate max-w-[200px]">{settings.lastScrapedUrl}</div>
                 </div>

                 {crawlStatus === CrawlStatus.CRAWLING ? (
                  <button onClick={handleStopCrawl} className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-red-200 dark:shadow-none transition-all flex items-center gap-2 active:scale-95">
                     <StopCircle className="w-5 h-5" /> 停止任务
                  </button>
                ) : (
                  <button onClick={handleStartCrawl} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none transition-all flex items-center gap-2 active:scale-95">
                     <Play className="w-5 h-5" /> 开始采集
                  </button>
                )}
              </div>
            </div>

            {/* Terminal View */}
            <div className={`flex-1 rounded-2xl shadow-inner overflow-hidden flex flex-col font-mono text-sm border transition-colors duration-300 ${
              terminalDark ? 'bg-gray-900 border-gray-700 text-gray-300' : 'bg-white border-gray-300 text-gray-800'
            }`}>
              <div className={`px-4 py-2 flex items-center justify-between border-b ${
                terminalDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'
              }`}>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <span className={`text-xs ml-2 ${terminalDark ? 'text-gray-400' : 'text-gray-500'}`}>crawler_process — node</span>
                </div>
                {/* Independent Terminal Toggle Button */}
                <button 
                  onClick={() => setTerminalDark(!terminalDark)}
                  className={`p-1 rounded hover:bg-opacity-20 hover:bg-gray-500 transition-colors ${terminalDark ? 'text-gray-400' : 'text-gray-600'}`}
                  title="单独切换终端背景"
                >
                  {terminalDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-600">
                {logs.length === 0 && (
                  <div className={`italic text-center mt-20 ${terminalDark ? 'text-gray-600' : 'text-gray-400'}`}>等待任务启动...</div>
                )}
                {logs.map((log) => (
                  <div key={log.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-200">
                    <span className="opacity-50 shrink-0">[{log.timestamp}]</span>
                    <span className={`break-all ${
                      log.type === 'error' ? 'text-red-500' :
                      log.type === 'warning' ? 'text-yellow-500' :
                      log.type === 'success' ? 'text-green-500' :
                      terminalDark ? 'text-blue-300' : 'text-blue-600'
                    }`}>
                      {log.type === 'success' && '✓ '}
                      {log.type === 'error' && '✗ '}
                      {log.type === 'warning' && '! '}
                      {log.type === 'info' && '> '}
                      {log.message}
                    </span>
                  </div>
                ))}
                {crawlStatus === CrawlStatus.CRAWLING && (
                   <div className="animate-pulse">_</div>
                )}
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'news' && (
           <NewsTable 
             selectedIds={selectedNewsIds}
             onSelectionChange={setSelectedNewsIds}
             onSummarize={handleGenerateSummary}
             onViewDetail={handleViewDetail}
           />
        )}
      </main>

      {/* Modals */}
      {settingsOpen && (
        <SettingsModal 
          isOpen={settingsOpen} 
          onClose={() => setSettingsOpen(false)} 
          initialSettings={settings}
          onSave={(newSettings) => {
            // FIX: Merge with existing settings to preserve appTitle/Logo/Subtitle
            const mergedSettings = { ...settings, ...newSettings };
            setSettings(mergedSettings);
            window.electron.invoke(IPC_CHANNELS.SAVE_SETTINGS, mergedSettings);
            setSettingsOpen(false);
          }}
        />
      )}

      {brandingOpen && (
        <BrandingModal
          isOpen={brandingOpen}
          onClose={() => setBrandingOpen(false)}
          currentSettings={settings}
          onSave={(newSettings) => {
            // Branding modal usually returns full valid object, but merge is safer
            const mergedSettings = { ...settings, ...newSettings };
            setSettings(mergedSettings);
            window.electron.invoke(IPC_CHANNELS.SAVE_SETTINGS, mergedSettings);
          }}
        />
      )}

      {summaryOpen && (
        <SummaryModal
          isOpen={summaryOpen}
          onClose={() => {
            setSummaryOpen(false);
            setSummaryContent(''); 
          }}
          content={summaryContent}
        />
      )}

      {detailOpen && currentNews && (
        <NewsDetailModal 
          isOpen={detailOpen}
          onClose={() => setDetailOpen(false)}
          news={currentNews}
        />
      )}
    </div>
  );
};

export default App;