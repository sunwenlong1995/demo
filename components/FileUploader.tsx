import { useState, useCallback, useRef } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  loading?: boolean;
}

export default function FileUploader({ onFileSelect, loading }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer ${
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
      } ${loading ? 'pointer-events-none opacity-50' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
        disabled={loading}
      />
      
      <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
        isDragging ? 'bg-blue-100' : 'bg-gray-100'
      }`}>
        {loading ? (
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <FileSpreadsheet className={`w-10 h-10 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
        )}
      </div>
      
      <h3 className={`text-lg font-semibold mb-2 ${isDragging ? 'text-blue-600' : 'text-gray-700'}`}>
        {loading ? '正在处理...' : isDragging ? '松开以上传文件' : '拖拽文件到此处或点击上传'}
      </h3>
      
      <p className="text-gray-500 text-sm">
        支持 .xlsx / .xls 格式的 Excel 文件
      </p>
      
      <div className="mt-4 flex items-center justify-center gap-2 text-gray-400 text-sm">
        <Upload className="w-4 h-4" />
        <span>或点击选择文件</span>
      </div>
    </div>
  );
}
