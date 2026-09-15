import React, { useState, useCallback } from 'react';
    import { motion } from 'framer-motion';
    import { Upload, FileText, X, CheckCircle2, Loader2 } from 'lucide-react';
    import { toast } from 'react-toastify';

    interface UploadZoneProps {
      onFilesSelected: (files: File[]) => void;
    }

    const UploadZone: React.FC<UploadZoneProps> = ({ onFilesSelected }) => {
      const [isDragging, setIsDragging] = useState(false);
      const [files, setFiles] = useState<File[]>([]);
      const [isUploading, setIsUploading] = useState(false);

      const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
      }, []);

      const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
      }, []);

      const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        if (droppedFiles.length > 0) {
          setFiles(droppedFiles);
          onFilesSelected(droppedFiles);
        }
      }, [onFilesSelected]);

      const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
          const selectedFiles = Array.from(e.target.files);
          setFiles(selectedFiles);
          onFilesSelected(selectedFiles);
        }
      };

      const removeFile = (index: number) => {
        const newFiles = [...files];
        newFiles.splice(index, 1);
        setFiles(newFiles);
        onFilesSelected(newFiles);
      };

      return (
        <div className="space-y-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-3xl p-12 transition-all text-center ${
              isDragging 
                ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]' 
                : 'border-slate-200 bg-white hover:border-indigo-300'
            }`}
          >
            <input
              type="file"
              multiple
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Upload folder or files"
            />
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Drop your recovery folder here</h3>
                <p className="text-slate-500 mt-1">or click to browse your local files</p>
              </div>
              <div className="flex gap-2 mt-2">
                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">ZIP</span>
                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">JSON</span>
                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">CSV</span>
              </div>
            </div>
          </div>

          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-700">{files.length} Files Detected</span>
                <button 
                  onClick={() => setFiles([])}
                  className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                >
                  Clear All
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto p-4 space-y-2">
                {files.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl group">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-900 truncate max-w-[200px]">{file.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFile(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      );
    };

    export default UploadZone;