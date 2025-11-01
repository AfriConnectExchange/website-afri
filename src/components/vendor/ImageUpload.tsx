'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import imageCompression from 'browser-image-compression'
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ImageFile {
  id: string
  file: File
  preview: string
  uploading: boolean
  uploaded: boolean
  url?: string
  error?: string
}

interface ImageUploadProps {
  maxImages?: number
  maxSizeMB?: number
  onImagesChange?: (urls: string[]) => void
  defaultImages?: string[]
  disabled?: boolean
}

export default function ImageUpload({
  maxImages = 4,
  maxSizeMB = 2,
  onImagesChange,
  defaultImages = [],
  disabled = false
}: ImageUploadProps) {
  const [images, setImages] = useState<ImageFile[]>(
    defaultImages.map((url, index) => ({
      id: `default-${index}`,
      file: new File([], url.split('/').pop() || 'image.jpg'),
      preview: url,
      uploading: false,
      uploaded: true,
      url
    }))
  )
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // Compress and upload image
  const compressAndUpload = async (file: File): Promise<{ url: string; error?: string }> => {
    try {
      // Compress image
      const options = {
        maxSizeMB: maxSizeMB,
        maxWidthOrHeight: 1200,
        useWebWorker: true
      }
      const compressedFile = await imageCompression(file, options)

      // Upload to Firebase Storage via API
      const formData = new FormData()
      formData.append('file', compressedFile)
      formData.append('folder', 'products')

      const response = await fetch('/api/products/upload-image', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      return { url: data.url }
    } catch (error) {
      console.error('Upload error:', error)
      return { url: '', error: error instanceof Error ? error.message : 'Upload failed' }
    }
  }

  // Handle file drop
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled) return

      // Check if adding these files would exceed max images
      const remainingSlots = maxImages - images.length
      const filesToAdd = acceptedFiles.slice(0, remainingSlots)

      if (filesToAdd.length === 0) {
        alert(`Maximum ${maxImages} images allowed`)
        return
      }

      // Validate file types and sizes
      const validFiles = filesToAdd.filter(file => {
        const isValidType = ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)
        const isValidSize = file.size <= maxSizeMB * 1024 * 1024

        if (!isValidType) {
          alert(`${file.name}: Only JPEG/PNG allowed`)
          return false
        }
        if (!isValidSize) {
          alert(`${file.name}: File too large (max ${maxSizeMB}MB)`)
          return false
        }
        return true
      })

      if (validFiles.length === 0) return

      // Create image file objects
      const newImages: ImageFile[] = validFiles.map(file => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview: URL.createObjectURL(file),
        uploading: true,
        uploaded: false
      }))

      setImages(prev => [...prev, ...newImages])

      // Upload each image
      for (const imageFile of newImages) {
        const { url, error } = await compressAndUpload(imageFile.file)

        setImages(prev =>
          prev.map(img =>
            img.id === imageFile.id
              ? { ...img, uploading: false, uploaded: !error, url, error }
              : img
          )
        )
      }

      // Notify parent component
      setImages(prev => {
        const uploadedUrls = prev.filter(img => img.uploaded && img.url).map(img => img.url!)
        onImagesChange?.(uploadedUrls)
        return prev
      })
    },
    [images.length, maxImages, maxSizeMB, disabled, onImagesChange]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/jpg': [], 'image/png': [] },
    maxSize: maxSizeMB * 1024 * 1024,
    disabled: disabled || images.length >= maxImages,
    multiple: true
  })

  // Remove image
  const removeImage = (id: string) => {
    setImages(prev => {
      const updated = prev.filter(img => img.id !== id)
      const uploadedUrls = updated.filter(img => img.uploaded && img.url).map(img => img.url!)
      onImagesChange?.(uploadedUrls)
      return updated
    })
  }

  // Drag and drop reordering
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const updatedImages = [...images]
    const draggedImage = updatedImages[draggedIndex]
    updatedImages.splice(draggedIndex, 1)
    updatedImages.splice(index, 0, draggedImage)

    setImages(updatedImages)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    const uploadedUrls = images.filter(img => img.uploaded && img.url).map(img => img.url!)
    onImagesChange?.(uploadedUrls)
  }

  return (
    <div className="space-y-4">
      {/* Uploaded Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              draggable={!image.uploading && !disabled}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                'relative aspect-square rounded-lg border-2 overflow-hidden group',
                image.uploading && 'border-gray-300 bg-gray-100',
                image.uploaded && 'border-green-500 cursor-move',
                image.error && 'border-red-500',
                draggedIndex === index && 'opacity-50'
              )}
            >
              {/* Image Preview */}
              <img
                src={image.preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Uploading Overlay */}
              {image.uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              )}

              {/* Error Overlay */}
              {image.error && (
                <div className="absolute inset-0 bg-red-500/90 flex flex-col items-center justify-center p-2 text-white text-xs text-center">
                  <AlertCircle className="h-6 w-6 mb-1" />
                  <p>{image.error}</p>
                </div>
              )}

              {/* Remove Button */}
              {!image.uploading && (
                <button
                  onClick={() => removeImage(image.id)}
                  disabled={disabled}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* Main Image Badge */}
              {index === 0 && image.uploaded && (
                <div className="absolute bottom-2 left-2 bg-[#F4B400] text-white text-xs font-semibold px-2 py-1 rounded">
                  Main
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Dropzone */}
      {images.length < maxImages && (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            isDragActive && 'border-[#F4B400] bg-[#F4B400]/10',
            !isDragActive && 'border-gray-300 hover:border-[#0072CE]',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            {isDragActive ? (
              <>
                <Upload className="h-12 w-12 text-[#F4B400]" />
                <p className="text-[#F4B400] font-semibold">Drop images here...</p>
              </>
            ) : (
              <>
                <ImageIcon className="h-12 w-12 text-gray-400" />
                <p className="text-gray-600 font-medium">
                  Drag & drop images here, or click to select
                </p>
                <p className="text-xs text-gray-500">
                  JPEG/PNG only • Max {maxSizeMB}MB per image • Up to {maxImages} images
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Image Counter */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {images.filter(img => img.uploaded).length} of {maxImages} images uploaded
        </span>
        {images.length > 1 && (
          <span className="text-xs text-gray-500">Drag thumbnails to reorder</span>
        )}
      </div>

      {/* Mobile Camera Button */}
      <div className="sm:hidden">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = 'image/*'
            input.capture = 'environment'
            input.multiple = true
            input.onchange = (e) => {
              const files = Array.from((e.target as HTMLInputElement).files || [])
              onDrop(files)
            }
            input.click()
          }}
          disabled={disabled || images.length >= maxImages}
        >
          <Upload className="h-4 w-4 mr-2" />
          Take Photo
        </Button>
      </div>
    </div>
  )
}
