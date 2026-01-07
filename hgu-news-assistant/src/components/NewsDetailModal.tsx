import React from 'react';
import { X, Calendar, User, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { NewsItem } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  news: NewsItem | null;
}

export const NewsDetailModal: React.FC<Props> = ({ isOpen, onClose, news }) => {
  if (!isOpen || !news) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-850 rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col animate-in fade-in zoom-in duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
          <div className="flex-1 pr-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight mb-3">
              {news.title}
            </h2>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{news.publish_date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-xs font-medium border border-blue-100 dark:border-blue-800">
                  {news.source}
                </span>
              </div>
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); window.open(news.original_url, '_blank'); }}
                className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                title="在浏览器中打开原文"
              >
                <LinkIcon className="w-4 h-4" />
                <span className="truncate max-w-[200px]">原文链接</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all"
          >
            <X className="w-6 h-6"/>
          </button>
        </div>
        
        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-gray-850 custom-scrollbar">
          <article className="prose prose-lg prose-slate dark:prose-invert max-w-none">
            {/* We render plain text with simple paragraph breaks as the crawler cleans HTML. 
                For better display, we split by newlines and wrap in paragraphs. */}
            {news.content.split('\n').map((paragraph, idx) => (
              paragraph.trim() && <p key={idx} className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed text-justify indent-8">
                {paragraph.trim()}
              </p>
            ))}
          </article>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            关闭阅读
          </button>
        </div>
      </div>
    </div>
  );
};