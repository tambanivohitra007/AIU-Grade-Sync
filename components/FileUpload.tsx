import React, { useRef, useState } from 'react';

interface FileUploadProps {
  label: string;
  accept: string;
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  iconClass: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ label, accept, onFileSelect, selectedFile, iconClass }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col w-full">
        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 pl-1 uppercase tracking-wider">{label}</label>
        <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`
                relative h-36 w-full border border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group overflow-hidden
                ${isDragOver 
                    ? 'border-purple-500 dark:border-primary bg-purple-50 dark:bg-purple-900/20 shadow-[0_0_20px_rgba(192,132,252,0.2)]' 
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:border-slate-400 dark:hover:border-slate-500'}
                ${selectedFile ? 'border-purple-400 dark:border-purple-500/50 bg-purple-50 dark:bg-purple-900/10' : ''}
            `}
        >
            <input 
                ref={inputRef}
                type="file" 
                accept={accept} 
                className="hidden" 
                onChange={handleChange}
            />
            
            {/* Background glow effect on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}></div>
            
            {selectedFile ? (
                <div className="text-center p-4 animate-fade-in relative z-10">
                    <div className="w-12 h-12 rounded-full bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center mx-auto mb-3 ring-1 ring-purple-500/30 shadow-[0_0_15px_rgba(192,132,252,0.2)]">
                        <i className="fas fa-file-excel text-xl text-purple-600 dark:text-primary drop-shadow-[0_0_5px_rgba(192,132,252,0.8)]"></i>
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate max-w-[200px]">{selectedFile.name}</p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 font-mono">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    <span className="absolute top-2 right-2 text-emerald-500 dark:text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]"><i className="fas fa-check-circle"></i></span>
                </div>
            ) : (
                <div className="text-center p-4 relative z-10">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors duration-300 ${isDragOver ? 'bg-purple-100 dark:bg-primary/20 text-purple-600 dark:text-primary shadow-[0_0_15px_rgba(192,132,252,0.4)]' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:text-purple-500 dark:group-hover:text-purple-300 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'}`}>
                        <i className={`${iconClass} text-xl ${isDragOver ? 'drop-shadow-[0_0_5px_rgba(192,132,252,1)]' : ''}`}></i>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">Click or drag & drop</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-1 uppercase tracking-wider font-semibold">{accept.replace(/\./g, '')}</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default FileUpload;