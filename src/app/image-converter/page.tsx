'use client';

import { useState, useRef } from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Progress } from '~/components/ui/progress';
import { toast, Toaster } from 'sonner';
import { Upload, Download, Image as ImageIcon, FileImage, Check, X, Play, Archive, Trash2 } from 'lucide-react';
import JSZip from 'jszip';

interface FileItem {
  id: string;
  file: File;
  previewUrl: string;
  isConverting: boolean;
  convertedBlob: Blob | null;
  progress: number;
  status: 'pending' | 'converting' | 'completed' | 'error';
  error?: string;
}

interface BatchState {
  files: FileItem[];
  isConverting: boolean;
  allCompleted: boolean;
}

export default function ImageConverterPage() {
  const [state, setState] = useState<BatchState>({
    files: [],
    isConverting: false,
    allCompleted: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return '不支持的文件格式。支持的格式：JPEG, PNG, GIF, BMP, TIFF, WebP';
    }

    if (file.size > 10 * 1024 * 1024) {
      return '文件大小不能超过 10MB';
    }

    return null;
  };

  const generateFileId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const newFiles: FileItem[] = [];
    
    files.forEach(file => {
      const error = validateFile(file);
      if (error) {
        toast.error(`${file.name}: ${error}`);
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      newFiles.push({
        id: generateFileId(),
        file,
        previewUrl,
        isConverting: false,
        convertedBlob: null,
        progress: 0,
        status: 'pending',
      });
    });

    if (newFiles.length > 0) {
      setState(prev => ({
        ...prev,
        files: [...prev.files, ...newFiles],
        allCompleted: false,
      }));
      toast.success(`成功添加 ${newFiles.length} 个文件`);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    
    // 模拟文件输入事件
    const fakeEvent = {
      target: { files }
    } as React.ChangeEvent<HTMLInputElement>;
    handleFileSelect(fakeEvent);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const removeFile = (fileId: string) => {
    setState(prev => {
      const fileToRemove = prev.files.find(f => f.id === fileId);
      if (fileToRemove?.previewUrl) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }
      return {
        ...prev,
        files: prev.files.filter(f => f.id !== fileId),
      };
    });
  };

  const convertSingleFile = async (fileItem: FileItem): Promise<void> => {
    try {
      const formData = new FormData();
      formData.append('file', fileItem.file);

      // 更新状态为转换中
      setState(prev => ({
        ...prev,
        files: prev.files.map(f => 
          f.id === fileItem.id 
            ? { ...f, isConverting: true, status: 'converting', progress: 0 }
            : f
        ),
      }));

      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          files: prev.files.map(f => 
            f.id === fileItem.id && f.status === 'converting'
              ? { ...f, progress: Math.min(f.progress + 10, 90) }
              : f
          ),
        }));
      }, 100);

      const response = await fetch('/api/convert-to-webp', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '转换失败');
      }

      const blob = await response.blob();

      // 更新为完成状态
      setState(prev => ({
        ...prev,
        files: prev.files.map(f => 
          f.id === fileItem.id 
            ? { 
                ...f, 
                isConverting: false, 
                status: 'completed', 
                progress: 100,
                convertedBlob: blob 
              }
            : f
        ),
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        files: prev.files.map(f => 
          f.id === fileItem.id 
            ? { 
                ...f, 
                isConverting: false, 
                status: 'error', 
                progress: 0,
                error: error instanceof Error ? error.message : '转换失败'
              }
            : f
        ),
      }));
    }
  };

  const convertAllFiles = async () => {
    const pendingFiles = state.files.filter(f => f.status === 'pending' || f.status === 'error');
    if (pendingFiles.length === 0) {
      toast.error('没有待转换的文件');
      return;
    }

    setState(prev => ({ ...prev, isConverting: true }));

    // 依次转换所有文件
    for (const file of pendingFiles) {
      await convertSingleFile(file);
    }

    setState(prev => ({ ...prev, isConverting: false, allCompleted: true }));
    toast.success('所有文件转换完成！');
  };

  const downloadSingleFile = (fileItem: FileItem) => {
    if (!fileItem.convertedBlob) return;

    const url = URL.createObjectURL(fileItem.convertedBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileItem.file.name.split('.')[0]}.webp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadAllFiles = async () => {
    const completedFiles = state.files.filter(f => f.status === 'completed' && f.convertedBlob);
    
    if (completedFiles.length === 0) {
      toast.error('没有已转换的文件可供下载');
      return;
    }

    if (completedFiles.length === 1) {
      downloadSingleFile(completedFiles[0]);
      return;
    }

    try {
      const zip = new JSZip();
      
      for (const fileItem of completedFiles) {
        if (fileItem.convertedBlob) {
          const fileName = `${fileItem.file.name.split('.')[0]}.webp`;
          zip.file(fileName, fileItem.convertedBlob);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `converted-images-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('批量下载完成！');
    } catch (error) {
      toast.error('创建下载文件失败');
    }
  };

  const clearAllFiles = () => {
    // 清理所有预览 URL
    state.files.forEach(file => {
      if (file.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
    });

    setState({
      files: [],
      isConverting: false,
      allCompleted: false,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: FileItem['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-500';
      case 'converting': return 'text-blue-500';
      case 'completed': return 'text-green-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = (status: FileItem['status']) => {
    switch (status) {
      case 'pending': return '等待转换';
      case 'converting': return '转换中...';
      case 'completed': return '转换完成';
      case 'error': return '转换失败';
      default: return '未知状态';
    }
  };

  const completedCount = state.files.filter(f => f.status === 'completed').length;
  const totalCount = state.files.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            批量图片转 WebP 工具
          </h1>
          <p className="text-lg text-gray-600">
            支持批量上传并转换多个图片文件为 WebP 格式
          </p>
        </div>

        {/* 文件上传区域 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              批量上传图片
            </CardTitle>
            <CardDescription>
              支持 JPEG、PNG、GIF、BMP、TIFF、WebP 格式，单个文件最大 10MB，可同时选择多个文件
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                拖拽多个图片到此处或点击选择
              </p>
              <p className="text-sm text-gray-500">
                支持同时选择多个文件进行批量转换
              </p>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>

        {/* 文件列表和批量操作 */}
        {state.files.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileImage className="w-5 h-5" />
                    文件列表 ({totalCount} 个文件)
                  </CardTitle>
                  <CardDescription>
                    {completedCount > 0 && `已完成 ${completedCount} 个`}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {!state.isConverting && (
                    <Button 
                      onClick={convertAllFiles}
                      disabled={state.files.every(f => f.status === 'completed')}
                      size="sm"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      开始批量转换
                    </Button>
                  )}
                  {completedCount > 0 && (
                    <Button 
                      onClick={downloadAllFiles}
                      variant="outline"
                      size="sm"
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      批量下载 ({completedCount})
                    </Button>
                  )}
                  <Button 
                    onClick={clearAllFiles}
                    variant="outline"
                    size="sm"
                    disabled={state.isConverting}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    清空列表
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {state.files.map((fileItem) => (
                  <div
                    key={fileItem.id}
                    className="flex items-center gap-4 p-4 border rounded-lg bg-white"
                  >
                    {/* 缩略图 */}
                    <div className="flex-shrink-0">
                      <img
                        src={fileItem.previewUrl}
                        alt={fileItem.file.name}
                        className="w-16 h-16 object-cover rounded border"
                      />
                    </div>

                    {/* 文件信息 */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {fileItem.file.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(fileItem.file.size)} • {fileItem.file.type}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-sm font-medium ${getStatusColor(fileItem.status)}`}>
                          {getStatusText(fileItem.status)}
                        </span>
                        {fileItem.error && (
                          <span className="text-xs text-red-500">
                            {fileItem.error}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 进度条 */}
                    <div className="flex-shrink-0 w-32">
                      {fileItem.isConverting && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>转换中</span>
                            <span>{fileItem.progress}%</span>
                          </div>
                          <Progress value={fileItem.progress} className="h-2" />
                        </div>
                      )}
                      {fileItem.status === 'completed' && (
                        <div className="flex items-center gap-1 text-green-600 text-sm">
                          <Check className="w-4 h-4" />
                          <span>完成</span>
                        </div>
                      )}
                      {fileItem.status === 'pending' && (
                        <div className="text-gray-400 text-sm">待转换</div>
                      )}
                      {fileItem.status === 'error' && (
                        <div className="text-red-500 text-sm">失败</div>
                      )}
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex-shrink-0 flex gap-2">
                      {fileItem.status === 'completed' && fileItem.convertedBlob && (
                        <Button
                          onClick={() => downloadSingleFile(fileItem)}
                          size="sm"
                          variant="outline"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      {!fileItem.isConverting && (
                        <Button
                          onClick={() => removeFile(fileItem.id)}
                          size="sm"
                          variant="outline"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 关于 WebP 格式 */}
        <Card>
          <CardHeader>
            <CardTitle>关于 WebP 格式</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">优势</h4>
                <ul className="space-y-1">
                  <li>• 文件大小比 JPEG 小 25-35%</li>
                  <li>• 文件大小比 PNG 小 26%</li>
                  <li>• 支持有损和无损压缩</li>
                  <li>• 支持透明度和动画</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">浏览器支持</h4>
                <ul className="space-y-1">
                  <li>• Chrome 23+</li>
                  <li>• Firefox 65+</li>
                  <li>• Safari 14+</li>
                  <li>• Edge 18+</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}