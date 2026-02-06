
import React, { useRef, useState, useCallback } from 'react';
import { Upload, Image as ImageIcon, X, MousePointer2, Film, PlayCircle } from 'lucide-react';
import { DragState } from '../types';

interface ImageUploaderProps {
  onImageSelect: (base64: string) => void;
  selectedImage: string | null;
  onClear: () => void;
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onImageSelect, 
  selectedImage, 
  onClear,
  disabled = false
}) => {
  const [dragState, setDragState] = useState<DragState>({ isDragging: false });
  const inputRef = useRef<HTMLInputElement>(null);

  const isVideo = selectedImage?.startsWith('data:video');

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragState({ isDragging: true });
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragState({ isDragging: false });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const processFile = (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      alert('Please upload an image or video file.');
      return;
    }
    
    // Check video size (limit to ~20MB for browser performance)
    if (isVideo && file.size > 20 * 1024 * 1024) {
        alert('Video is too large. Please upload a short clip under 20MB.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onImageSelect(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragState({ isDragging: false });

    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [disabled, onImageSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  if (selectedImage) {
    return (
      <div className="relative w-full h-full min-h-[400px] bg-slate-950 rounded-2xl overflow-hidden group border border-white/10">
        {isVideo ? (
            <div className="w-full h-full flex items-center justify-center bg-black">
                <video 
                    src={selectedImage} 
                    controls 
                    className="max-h-[400px] w-full object-contain"
                />
            </div>
        ) : (
            <img 
            src={selectedImage} 
            alt="Uploaded diagram" 
            className="w-full h-full object-contain p-6"
            />
        )}
        
        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm z-10">
          <button 
            onClick={onClear}
            disabled={disabled}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all transform hover:scale-105 font-bold shadow-xl"
          >
            <X size={20} />
            {isVideo ? 'Remove Video' : 'Reset Image'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`
        w-full min-h-[400px] h-full flex flex-col items-center justify-center 
        border-2 border-dashed rounded-2xl transition-all duration-300 cursor-pointer
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary-500/50 hover:bg-primary-500/5'}
        ${dragState.isDragging ? 'border-primary-500 bg-primary-500/10 scale-[0.98]' : 'border-white/10 bg-slate-900/40'}
      `}
    >
      <input 
        type="file" 
        ref={inputRef} 
        onChange={handleInputChange} 
        accept="image/*,video/*" 
        className="hidden" 
        disabled={disabled}
      />
      
      <div className="flex flex-col items-center gap-6 text-slate-400 p-12 text-center max-w-md">
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500 shadow-2xl ${dragState.isDragging ? 'bg-primary-500 text-white rotate-12' : 'bg-slate-800 text-slate-500'}`}>
          {dragState.isDragging ? <Upload size={32} /> : <div className="relative"><ImageIcon size={32} /><div className="absolute -bottom-2 -right-2 bg-slate-700 rounded-full p-1 border border-slate-800"><Film size={12} /></div></div>}
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">
            {dragState.isDragging ? 'Drop Input' : 'Upload Source'}
          </h3>
          <p className="text-slate-500 text-base leading-relaxed">
            Drag screenshots or a short video (≤10s) to reconstruct interactive UI.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-slate-400">
           <MousePointer2 size={14} className="text-primary-500" /> Supports PNG, JPG, MP4, WEBM
        </div>
      </div>
    </div>
  );
};
