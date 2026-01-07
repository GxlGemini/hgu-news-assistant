import React, { useEffect, useState } from 'react';
import { Eye, BrainCircuit, ChevronLeft, ChevronRight, Trash2, RefreshCw, ChevronsLeft, ChevronsRight, Search, LayoutList, History, Flame } from 'lucide-react';
import { NewsItem, IPC_CHANNELS } from '../types';
import { TimelineView } from './TimelineView';

interface Props {
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  onSummarize: () => void;
  onViewDetail: (news: NewsItem) => void; 
}

export const NewsTable: React.FC<Props> = ({ selectedIds, onSelectionChange, onSummarize, onViewDetail }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const [keywords, setKeywords] = useState<string[]>([]);
  
  const LIMIT = viewMode === 'list' ? 10 : 100; // Timeline shows more data

  useEffect(() => {
    fetchNews();
  }, [page, viewMode]); // Re-fetch when view mode changes

  const fetchNews = async () => {
    if (loading) return; // Prevent double click
    setLoading(true);
    
    // UX Optimization: Add a minimum delay (500ms) so the spinner is visible
    const minDelay = new Promise(resolve => setTimeout(resolve, 500));

    try {
      // Fetch settings (for keywords) and news data in parallel
      const settingsPromise = window.electron.invoke(IPC_CHANNELS.GET_SETTINGS);
      const newsPromise = window.electron.invoke(IPC_CHANNELS.GET_NEWS, { 
        page, 
        limit: LIMIT, 
        search: searchTerm 
      });

      // Wait for everything
      const [_, settings, data] = await Promise.all([minDelay, settingsPromise, newsPromise]);

      setKeywords(settings.watchlist || []);
      setNews(data.items);
      setTotal(data.total);
      onSelectionChange([]); 
    } catch (error) {
      console.error("Fetch failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchNews();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(news.map(n => n.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter(sid => sid !== id));
    }
  };

  const handleDelete = async (ids: number[]) => {
    if (ids.length === 0) return;
    if (!confirm(`确定要永久删除这 ${ids.length} 条数据吗？`)) return;

    const success = await window.electron.invoke('delete-news', ids);
    if (success) {
      fetchNews();
    }
  };

  const handleView = async (item: NewsItem) => {
      try {
        const fullItem = await window.electron.invoke(IPC_CHANNELS.GET_NEWS_CONTENT, item.id);
        onViewDetail(fullItem);
      } catch (e) {
        console.error("Failed to fetch details", e);
      }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-850 relative transition-colors duration-200">
      {/* Toolbar */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-850 sticky top-0 z-10 shadow-sm transition-colors">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">新闻列表</h2>
          
          {/* View Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 gap-1">
             <button 
               onClick={() => setViewMode('list')}
               className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-300' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
               title="列表视图"
             >
               <LayoutList className="w-4 h-4" />
             </button>
             <button 
               onClick={() => setViewMode('timeline')}
               className={`p-1.5 rounded-md transition-all ${viewMode === 'timeline' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-300' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
               title="时间轴视图"
             >
               <History className="w-4 h-4" />
             </button>
          </div>

          <form onSubmit={handleSearch} className="relative ml-2">
            <input 
              type="text" 
              placeholder="搜索标题或内容..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-sm bg-gray-100 dark:bg-gray-750 dark:text-gray-200 border-none rounded-lg focus:ring-2 focus:ring-blue-500 w-48 sm:w-64 transition-all"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2" />
          </form>

          {selectedIds.length > 0 && viewMode === 'list' && (
             <span className="text-sm bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-1 rounded-md font-medium border border-blue-100 dark:border-blue-800 animate-in fade-in zoom-in duration-200">
               选中 {selectedIds.length} 项
             </span>
          )}
        </div>
        
        <div className="flex gap-3">
          <button 
             onClick={fetchNews}
             disabled={loading}
             className={`p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750 rounded-lg transition-all ${loading ? 'cursor-not-allowed opacity-70' : ''}`}
             title="刷新列表"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-blue-500' : ''}`} />
          </button>

          {selectedIds.length > 0 && viewMode === 'list' && (
            <button
              onClick={() => handleDelete(selectedIds)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">删除</span>
            </button>
          )}

          <button
            onClick={onSummarize}
            disabled={selectedIds.length === 0}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-all shadow-sm ${
              selectedIds.length > 0 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-md hover:from-purple-700 hover:to-indigo-700 active:scale-95' 
                : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed'
            }`}
          >
            <BrainCircuit className="w-4 h-4" />
            <span>AI 智能总结</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto bg-gray-50/50 dark:bg-gray-900/50 custom-scrollbar">
        
        {viewMode === 'timeline' ? (
           <TimelineView 
              items={news} 
              onViewDetail={handleView} 
              keywords={keywords}
           />
        ) : (
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold tracking-wider sticky top-0 z-0">
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="py-4 px-6 w-14">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer dark:bg-gray-700"
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    checked={news.length > 0 && selectedIds.length === news.length}
                  />
                </th>
                <th className="py-4 px-6">标题 / 摘要</th>
                <th className="py-4 px-6 w-40">发布时间</th>
                <th className="py-4 px-6 w-32">来源</th>
                <th className="py-4 px-6 w-24 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-850 divide-y divide-gray-100 dark:divide-gray-800">
              {news.map(item => {
                const isHot = keywords.some(k => k && item.title.includes(k));
                return (
                  <tr key={item.id} className={`hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group ${selectedIds.includes(item.id) ? 'bg-blue-50/30 dark:bg-blue-900/20' : ''} ${isHot ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}`}>
                    <td className="py-4 px-6">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer dark:bg-gray-700"
                        checked={selectedIds.includes(item.id)}
                        onChange={(e) => handleSelectOne(item.id, e.target.checked)}
                      />
                    </td>
                    <td className="py-4 px-6 overflow-hidden">
                      <div className="font-medium text-gray-900 dark:text-gray-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors cursor-pointer truncate flex items-center gap-2" title={item.title} onClick={() => handleView(item)}>
                        {isHot && <Flame className="w-4 h-4 text-orange-500 animate-pulse shrink-0" />}
                        <span className="truncate">{item.title}</span>
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate max-w-xl font-mono">
                        {item.original_url}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{item.publish_date}</td>
                    <td className="py-4 px-6 text-sm text-gray-500 dark:text-gray-400">
                      <div className="truncate w-full" title={item.source}>
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-300">
                            {item.source}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-1">
                        <button 
                          onClick={() => handleView(item)}
                          className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete([item.id])}
                          className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {news.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="text-center py-24">
                    <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
                      <LayoutList className="w-12 h-12 mb-4 opacity-20" />
                      <p className="text-lg font-medium text-gray-500 dark:text-gray-400">暂无新闻数据</p>
                      <p className="text-sm mt-1">
                        {searchTerm ? '换个搜索关键词试试？' : '请前往“数据采集中心”开始抓取数据'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-850">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          第 <span className="font-medium text-gray-900 dark:text-gray-200">{page}</span> 页，共 {totalPages || 1} 页
        </span>
        <div className="flex gap-2">
           <button 
            onClick={() => setPage(1)}
            disabled={page === 1}
            className="px-2 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 shadow-sm transition-all"
            title="首页"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300 shadow-sm transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> 上一页
          </button>
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300 shadow-sm transition-all"
          >
            下一页 <ChevronRight className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages || totalPages === 0}
            className="px-2 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 shadow-sm transition-all"
            title="尾页"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};