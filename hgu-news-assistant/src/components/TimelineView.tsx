import React from 'react';
import { NewsItem } from '../types';
import { ArrowRight, Flame } from 'lucide-react';

interface Props {
  items: NewsItem[];
  onViewDetail: (item: NewsItem) => void;
  keywords: string[];
}

export const TimelineView: React.FC<Props> = ({ items, onViewDetail, keywords }) => {
  // Group by date
  const grouped = items.reduce((acc, item) => {
    const date = item.publish_date || '未知日期';
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {} as Record<string, NewsItem[]>);

  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (items.length === 0) {
     return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-600">
           <div className="text-lg font-medium">暂无数据</div>
        </div>
     );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
       {sortedDates.map(date => (
          <div key={date} className="relative pl-8 pb-10 border-l-2 border-blue-100 dark:border-gray-700 last:border-0 last:pb-0">
             {/* Date Header */}
             <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-white dark:border-gray-900 shadow-sm"></div>
             <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-6 pl-2 -mt-1.5 flex items-center gap-3">
                {date}
                <span className="text-xs font-normal text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-full border border-blue-100 dark:border-blue-900">
                  {grouped[date].length} 篇
                </span>
             </h3>
             
             {/* Cards */}
             <div className="space-y-4">
               {grouped[date].map(item => {
                  const isHot = keywords.some(k => k && item.title.includes(k));
                  return (
                    <div 
                      key={item.id} 
                      onClick={() => onViewDetail(item)}
                      className={`
                        group relative p-5 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md
                        ${isHot 
                          ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-700/50' 
                          : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                        }
                      `}
                    >
                       <div className="flex justify-between items-start mb-2">
                          <h4 className={`font-medium text-base leading-snug line-clamp-2 ${isHot ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                             {isHot && <Flame className="w-4 h-4 text-orange-500 inline mr-1.5 align-text-bottom animate-pulse" />}
                             {item.title}
                          </h4>
                       </div>
                       
                       <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-gray-700/50">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-wider text-gray-400">来源</span>
                            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs text-gray-600 dark:text-gray-300 font-medium">
                              {item.source}
                            </span>
                          </div>
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 dark:text-blue-400 text-xs font-medium flex items-center gap-1">
                            阅读详情 <ArrowRight className="w-3 h-3" />
                          </span>
                       </div>
                    </div>
                  );
               })}
             </div>
          </div>
       ))}
    </div>
  );
};