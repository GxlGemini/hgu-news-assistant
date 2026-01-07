import React, { useState, useRef, useEffect } from 'react';
import { AppSettings } from '../types';
import { X, Save, Upload, Image as ImageIcon, ZoomIn, ZoomOut, Move, RotateCcw, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: AppSettings;
  onSave: (s: AppSettings) => void;
}

export const BrandingModal: React.FC<Props> = ({ isOpen, onClose, currentSettings, onSave }) => {
  const [title, setTitle] = useState(currentSettings.appTitle || '新闻助手');
  const [subtitle, setSubtitle] = useState(currentSettings.appSubtitle || 'HGU News Intelligence');
  const [finalLogo, setFinalLogo] = useState(currentSettings.appLogo || '');
  
  // --- Cropper State ---
  const [editingSrc, setEditingSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle(currentSettings.appTitle || '新闻助手');
      setSubtitle(currentSettings.appSubtitle || 'HGU News Intelligence');
      setFinalLogo(currentSettings.appLogo || '');
      setEditingSrc(null);
    }
  }, [isOpen, currentSettings]);

  // --- Robust Dragging Logic (Window Level) ---
  useEffect(() => {
    const handleWindowMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      // Calculate new position based on initial offset
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setCrop({ x: newX, y: newY });
    };

    const handleWindowUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleWindowMove);
      window.addEventListener('mouseup', handleWindowUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleWindowMove);
      window.removeEventListener('mouseup', handleWindowUp);
    };
  }, [isDragging, dragStart]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { 
        alert("图片大小不能超过 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingSrc(reader.result as string);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // --- Event Handlers ---
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    // Record the offset between mouse pointer and current crop position
    setDragStart({ x: e.clientX - crop.x, y: e.clientY - crop.y });
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Prevent default scroll
    e.stopPropagation();
    
    // Zoom in/out based on wheel direction
    // Adjusted step to 0.01 (1%) for smoother, finer control
    const step = 0.01;
    const direction = e.deltaY > 0 ? -step : step;
    
    // ALLOW ZOOM FROM 0.1 (10%) TO 3 (300%)
    const newZoom = Math.min(Math.max(zoom + direction, 0.1), 3);
    
    // Use toFixed(2) for 1% precision
    setZoom(parseFloat(newZoom.toFixed(2)));
  };

  // --- Generate Image ---
  const generateCroppedImage = () => {
    if (!imgRef.current || !editingSrc) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 256; 
    canvas.width = size;
    canvas.height = size;
    ctx.clearRect(0, 0, size, size);
    
    const viewportSize = 240; 
    const scaleFactor = size / viewportSize;

    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.translate(crop.x * scaleFactor, crop.y * scaleFactor);
    ctx.scale(zoom, zoom);
    
    const img = imgRef.current;
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();

    const base64 = canvas.toDataURL('image/png', 0.9);
    setFinalLogo(base64);
    setEditingSrc(null);
  };

  const handleSaveSettings = () => {
    onSave({
      ...currentSettings,
      appTitle: title,
      appSubtitle: subtitle,
      appLogo: finalLogo
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <h3 className="font-bold text-gray-800 dark:text-white">
            {editingSrc ? '调整图片' : '自定义品牌样式'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-5 h-5"/></button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          
          {editingSrc ? (
            // --- CROPPER UI ---
            <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-300">
               <div className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                 <Move className="w-3 h-3" /> 拖拽移动，滚轮缩放 (10% - 300%)
               </div>
               
               {/* Viewport Mask */}
               <div 
                 ref={containerRef}
                 className={`w-60 h-60 rounded-2xl bg-gray-100 dark:bg-gray-900 overflow-hidden relative border-2 border-blue-500 shadow-inner select-none touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                 onMouseDown={handleMouseDown}
                 onWheel={handleWheel}
               >
                 {/* Image */}
                 <img 
                    ref={imgRef}
                    src={editingSrc} 
                    alt="Crop Preview" 
                    draggable={false}
                    className="absolute max-w-none origin-center pointer-events-none"
                    style={{ 
                      left: '50%',
                      top: '50%',
                      transform: `translate(-50%, -50%) translate(${crop.x}px, ${crop.y}px) scale(${zoom})` 
                    }}
                 />
                 
                 {/* Grid Overlay */}
                 <div className="absolute inset-0 pointer-events-none opacity-20" 
                      style={{backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '33.3% 33.3%'}}>
                 </div>
               </div>

               {/* Controls */}
               <div className="w-full mt-6 px-4">
                  <div className="flex items-center gap-3 mb-2">
                     <ZoomOut className="w-4 h-4 text-gray-400 cursor-pointer" onClick={() => setZoom(z => Math.max(z - 0.1, 0.1))} />
                     <input 
                        type="range" 
                        min="0.1" 
                        max="3" 
                        step="0.01" 
                        value={zoom} 
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                     />
                     <ZoomIn className="w-4 h-4 text-gray-400 cursor-pointer" onClick={() => setZoom(z => Math.min(z + 0.1, 3))} />
                  </div>
                  <div className="text-center text-xs text-gray-400 font-mono">
                    {Math.round(zoom * 100)}%
                  </div>
               </div>

               <div className="flex gap-3 mt-6 w-full">
                  <button 
                    onClick={() => setEditingSrc(null)}
                    className="flex-1 py-2 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg flex items-center justify-center gap-2 text-sm"
                  >
                    <RotateCcw className="w-4 h-4" /> 取消
                  </button>
                  <button 
                    onClick={generateCroppedImage}
                    className="flex-1 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center justify-center gap-2 text-sm shadow-md"
                  >
                    <Check className="w-4 h-4" /> 确认裁剪
                  </button>
               </div>
            </div>
          ) : (
            // --- MAIN FORM UI ---
            <>
              {/* Logo Upload Display */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 mb-3 relative group shadow-sm transition-all hover:border-blue-400">
                    {finalLogo ? (
                      <img src={finalLogo} alt="Logo Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="w-6 h-6 text-white" />
                    </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  {finalLogo ? '更换 Logo' : '上传 Logo'}
                </button>
                <p className="text-xs text-gray-400 mt-2">支持 JPG, PNG (最大 5MB)</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">主标题</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="新闻助手"
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">副标题</label>
                  <input 
                    type="text" 
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="HGU News Intelligence"
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!editingSrc && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700 shrink-0">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium text-sm">取消</button>
            <button 
              onClick={handleSaveSettings}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-md transition-colors font-medium text-sm"
            >
              <Save className="w-4 h-4" /> 保存设置
            </button>
          </div>
        )}
      </div>
    </div>
  );
};