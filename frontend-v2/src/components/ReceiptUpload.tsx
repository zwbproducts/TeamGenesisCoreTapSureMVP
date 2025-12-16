import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { Upload, Camera, FileImage, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { apiClient } from '../lib/api'
import { useInsuranceStore } from '../lib/store'
import { cn } from '../lib/utils'

const CATEGORIES = ['Grocery', 'Electronics', 'Clothing', 'Pharmacy'] as const

export function ReceiptUpload() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const { setReceipt, setIsAnalyzing, isAnalyzing } = useInsuranceStore()

  const handleUpload = useCallback(async (file: File) => {
    setUploadError(null)
    setIsAnalyzing(true)

    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file (JPEG, PNG, or WebP)')
      }
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB')
      }

      const receipt = await apiClient.analyzeReceipt(file)
      
      // Apply manual category override if selected
      if (selectedCategory) {
        receipt.category = selectedCategory as any
      }
      
      setReceipt(receipt)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to analyze receipt'
      setUploadError(message)
      console.error('Upload error:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }, [selectedCategory, setReceipt, setIsAnalyzing])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      handleUpload(acceptedFiles[0])
    }
  }, [handleUpload])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 1,
    disabled: isAnalyzing,
  })

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Upload Receipt</CardTitle>
        <CardDescription>
          Upload a receipt to check if this purchase qualifies for instant cover
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Drag & Drop Zone */}
        <div
          {...getRootProps()}
          className={cn(
            "relative border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer",
            "hover:border-primary hover:bg-primary-50/50",
            isDragActive && "border-primary bg-primary-50 scale-[1.02]",
            isDragReject && "border-red-400 bg-red-50",
            isAnalyzing && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <motion.div
              animate={isAnalyzing ? { rotate: 360 } : {}}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              {isAnalyzing ? (
                <FileImage className="w-12 h-12 text-primary" />
              ) : (
                <Upload className="w-12 h-12 text-gray-400" />
              )}
            </motion.div>
            
            <div>
              <p className="font-medium text-gray-900">
                {isAnalyzing ? 'Analyzing receipt...' : 'Drop receipt here'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {isDragActive ? 'Drop the file here' : 'or use buttons below'}
              </p>
            </div>
          </div>
        </div>

        {/* Upload Error */}
        {uploadError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert variant="destructive" onClose={() => setUploadError(null)}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = 'image/*'
              input.capture = 'environment'
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (file) handleUpload(file)
              }
              input.click()
            }}
            disabled={isAnalyzing}
            loading={isAnalyzing}
          >
            <Camera className="w-4 h-4" />
            Take Photo
          </Button>
          
          <Button
            variant="secondary"
            size="lg"
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = 'image/*'
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (file) handleUpload(file)
              }
              input.click()
            }}
            disabled={isAnalyzing}
          >
            <Upload className="w-4 h-4" />
            Choose File
          </Button>
        </div>

        {/* Category Override */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Category (optional override)
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Badge
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'secondary'}
                className={cn(
                  "cursor-pointer transition-all hover:scale-105",
                  selectedCategory === cat && "ring-2 ring-primary ring-offset-2"
                )}
                onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelectedCategory(cat === selectedCategory ? null : cat)
                  }
                }}
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
