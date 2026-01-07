import React, { useState } from 'react';
import { AppSettings } from '../types';
import { X, Save, Clock, Eye } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialSettings: AppSettings;
  onSave: (s: AppSettings) => void;
}

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose, initialSettings, onSave }) => {
  const [apiKey, setApiKey] = useState(initialSettings.apiKey);
  const [url, setUrl] = useState(initialSettings.lastScrapedUrl || 'https://www.hgu.edu.cn/info/1049/11082.htm');
  const [autoCrawl, setAutoCrawl] = useState(initialSettings.autoCrawl || false);
  const [keywords, setKeywords] = useState((initialSettings.watchlist || []).join(', '));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-800 dark:text-white">系统设置</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-5 h-5"/></button>
        </div>
        
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">DeepSeek API 密钥</label>
            <input 
              type="password" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">密钥将加密存储在本地数据库中。</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">爬虫起始链接</label>
            <input 
              type="text" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
               <Eye className="w-4 h-4 text-blue-500" /> 关键词监控 (用逗号分隔)
            </label>
            <textarea 
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="例如: 奖学金, 放假, 考试, 招聘"
              rows={2}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            />
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">包含这些词的新闻将在列表中高亮显示。</p>
          </div>

          {/* Auto Crawl */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-full">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <label htmlFor="auto-crawl" className="block text-sm font-medium text-gray-900 dark:text-white cursor-pointer select-none">
                每24小时自动采集
              </label>
              <div className="text-xs text-gray-500 dark:text-gray-400">后台自动检测内容更新</div>
            </div>
            <input 
              id="auto-crawl"
              type="checkbox" 
              checked={autoCrawl}
              onChange={(e) => setAutoCrawl(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
            />
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">取消</button>
          <button 
            onClick={() => onSave({ 
              apiKey, 
              lastScrapedUrl: url, 
              autoCrawl,
              watchlist: keywords.split(/[,，]/).map(k => k.trim()).filter(Boolean)
            })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" /> 保存设置
          </button>
        </div>
      </div>
    </div>
  );
};