'use client'

import * as React from 'react'
import { useCallback, useState } from 'react'
import { Upload, X, File, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface UploadedFile {
  file: File
  preview?: string
  id: string
  progress?: number
  status?: 'uploading' | 'success' | 'error'
  error?: string
}

interface FileUploadProps {
  accept?: string
  maxSize?: number // in bytes
  maxFiles?: number
  multiple?: boolean
  onFilesChange?: (files: UploadedFile[]) => void
  onUpload?: (files: File[]) => Promise<string[] | void> // Returns URLs or void
  value?: UploadedFile[]
  disabled?: boolean
  className?: string
}

export function FileUpload({
  accept = 'image/*,.pdf',
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 1,
  multiple = false,
  onFilesChange,
  onUpload,
  value = [],
  disabled = false,
  className,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>(value)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)

  const generateId = () => Math.random().toString(36).substring(2, 9)

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `File size must be less than ${(maxSize / 1024 / 1024).toFixed(2)}MB`
    }
    if (accept && !accept.split(',').some((type) => {
      const pattern = type.trim().replace('*', '.*')
      return new RegExp(pattern).test(file.type) || file.name.endsWith(type.replace('*', ''))
    })) {
      return `File type not allowed. Accepted types: ${accept}`
    }
    return null
  }

  const processFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles)
    const validFiles: UploadedFile[] = []
    const errors: string[] = []

    fileArray.forEach((file) => {
      const error = validateFile(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
        return
      }

      const uploadedFile: UploadedFile = {
        file,
        id: generateId(),
        status: 'uploading',
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      }
      validFiles.push(uploadedFile)
    })

    if (errors.length > 0) {
      console.error('File validation errors:', errors)
      // You can add toast notifications here
    }

    if (validFiles.length === 0) return

    const updatedFiles = multiple
      ? [...files, ...validFiles].slice(0, maxFiles)
      : [validFiles[0]]

    setFiles(updatedFiles)
    onFilesChange?.(updatedFiles)

    // Auto-upload if onUpload is provided
    if (onUpload) {
      handleUpload(updatedFiles.filter(f => f.status === 'uploading'))
    }
  }, [files, multiple, maxFiles, onFilesChange, onUpload])

  const handleUpload = async (filesToUpload: UploadedFile[]) => {
    setUploading(true)
    try {
      const fileArray = filesToUpload.map(f => f.file)
      const urls = await onUpload!(fileArray) || []
      
      setFiles((prev) =>
        prev.map((f, idx) => {
          const uploadIdx = filesToUpload.findIndex(uf => uf.id === f.id)
          if (uploadIdx >= 0) {
            return {
              ...f,
              status: 'success' as const,
              progress: 100,
            }
          }
          return f
        })
      )
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) => {
          const uploadIdx = filesToUpload.findIndex(uf => uf.id === f.id)
          if (uploadIdx >= 0) {
            return {
              ...f,
              status: 'error' as const,
              error: error instanceof Error ? error.message : 'Upload failed',
            }
          }
          return f
        })
      )
    } finally {
      setUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled) return

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
    }
  }

  const removeFile = (id: string) => {
    const updatedFiles = files.filter((f) => f.id !== id)
    setFiles(updatedFiles)
    onFilesChange?.(updatedFiles)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / 1024 / 1024).toFixed(2) + ' MB'
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragging ? 'border-teal-600 bg-teal-50' : 'border-gray-300',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'cursor-pointer hover:border-teal-400'
        )}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          disabled={disabled || files.length >= maxFiles}
          className="hidden"
          id="file-upload-input"
        />
        <label
          htmlFor="file-upload-input"
          className={cn(
            'cursor-pointer flex flex-col items-center gap-4',
            disabled && 'cursor-not-allowed'
          )}
        >
          <Upload className={cn('h-12 w-12', isDragging ? 'text-teal-600' : 'text-gray-400')} />
          <div>
            <p className="text-sm font-medium text-gray-900">
              Drag and drop files here, or click to browse
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {accept} (max {formatFileSize(maxSize)}, {maxFiles} {maxFiles === 1 ? 'file' : 'files'})
            </p>
          </div>
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((uploadedFile) => (
            <div
              key={uploadedFile.id}
              className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50"
            >
              {uploadedFile.preview ? (
                <img
                  src={uploadedFile.preview}
                  alt={uploadedFile.file.name}
                  className="w-12 h-12 object-cover rounded"
                />
              ) : (
                <File className="h-12 w-12 text-gray-400" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {uploadedFile.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(uploadedFile.file.size)}
                </p>
                {uploadedFile.status === 'uploading' && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-teal-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${uploadedFile.progress || 0}%` }}
                      />
                    </div>
                  </div>
                )}
                {uploadedFile.status === 'error' && uploadedFile.error && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {uploadedFile.error}
                  </p>
                )}
                {uploadedFile.status === 'success' && (
                  <p className="text-xs text-teal-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Uploaded successfully
                  </p>
                )}
              </div>
              {uploadedFile.status !== 'uploading' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(uploadedFile.id)}
                  disabled={disabled}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              {uploadedFile.status === 'uploading' && (
                <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
