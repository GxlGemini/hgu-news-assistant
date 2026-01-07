import React from 'react';
import { X, Sparkles, Copy, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  content: string;
}

export const SummaryModal: React.FC<Props> = ({ isOpen, onClose, content }) => {
  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    alert('已复制到剪贴板');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800 rounded-t-xl">
          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-bold text-lg">AI 智能总结</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-5 h-5"/></button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto p-6 custom-scrollbar">
          {!content ? (
            <div className="h-40 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              <p>AI 正在思考中... (连接 DeepSeek 中)</p>
            </div>
          ) : (
            <div className="prose prose-purple dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-300">{content}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900/30 rounded-b-xl">
          {content && (
            <button 
              onClick={handleCopy}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2 text-sm"
            >
              <Copy className="w-4 h-4" /> 复制内容
            </button>
          )}
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 text-sm font-medium"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};