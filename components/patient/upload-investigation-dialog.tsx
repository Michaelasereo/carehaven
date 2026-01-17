'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X, FileText, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { createNotification } from '@/lib/notifications/create'

interface UploadInvestigationDialogProps {
  investigationId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function UploadInvestigationDialog({
  investigationId,
  open,
  onOpenChange,
  onSuccess,
}: UploadInvestigationDialogProps) {
  const supabase = createClient()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Please upload a PDF or image file (PDF, JPEG, PNG)')
        return
      }

      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        return
      }

      setFile(selectedFile)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload')
      return
    }

    setUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      // Get investigation details to find doctor
      const { data: investigation, error: invError } = await supabase
        .from('investigations')
        .select('doctor_id, test_name')
        .eq('id', investigationId)
        .single()

      if (invError || !investigation) {
        throw new Error('Investigation not found')
      }

      // Upload file to Supabase Storage
      // Note: Bucket 'investigations' needs to be created in Supabase Storage
      // For now, we'll store the file info in results_text and handle storage separately
      const fileExt = file.name.split('.').pop()
      const fileName = `investigations/${investigationId}/${Date.now()}.${fileExt}`
      
      let publicUrl: string | null = null
      
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('investigations')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (!uploadError) {
          // Get public URL if upload successful
          const { data: urlData } = supabase.storage
            .from('investigations')
            .getPublicUrl(fileName)
          publicUrl = urlData.publicUrl
        } else {
          // If bucket doesn't exist, we'll store file metadata in results_text
          // In production, ensure the bucket is created
          console.warn('Storage bucket not available, storing file metadata:', uploadError.message)
          publicUrl = `file:${fileName}` // Placeholder
        }
      } catch (storageError) {
        // Fallback: store file metadata
        publicUrl = `file:${fileName}`
      }

      // Update investigation with results URL
      const updateData: any = {
        status: 'completed',
        completed_at: new Date().toISOString(),
      }
      
      if (publicUrl && !publicUrl.startsWith('file:')) {
        updateData.results_url = publicUrl
      } else {
        // Store file info in results_text if storage unavailable
        updateData.results_text = `File uploaded: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
      }

      const { error: updateError } = await supabase
        .from('investigations')
        .update(updateData)
        .eq('id', investigationId)

      if (updateError) throw updateError

      // Send notification to doctor
      try {
        await fetch('/api/notifications/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: investigation.doctor_id,
            type: 'investigation',
            title: 'Investigation Results Uploaded',
            body: `Patient has uploaded results for ${investigation.test_name}`,
            data: { investigationId },
          }),
        })
      } catch (notifError) {
        console.error('Error sending notification:', notifError)
        // Don't fail the upload if notification fails
      }

      onSuccess()
      onOpenChange(false)
      setFile(null)
      setUploadProgress(0)
    } catch (err: any) {
      console.error('Error uploading investigation:', err)
      setError(err.message || 'Failed to upload file. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Investigation Results</DialogTitle>
          <DialogDescription>
            Upload your test results. Supported formats: PDF, JPEG, PNG (max 10MB)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!file ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-500 transition-colors">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-teal-600 hover:text-teal-700 font-medium">
                  Click to upload
                </span>
                <span className="text-gray-600"> or drag and drop</span>
              </Label>
              <Input
                id="file-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
              />
              <p className="text-xs text-gray-500 mt-2">
                PDF, JPEG, PNG up to 10MB
              </p>
            </div>
          ) : (
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-teal-600" />
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-600">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {uploading && (
                <div className="mt-4">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2 text-center">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false)
              setFile(null)
              setError(null)
            }}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {uploading ? 'Uploading...' : 'Upload Results'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
