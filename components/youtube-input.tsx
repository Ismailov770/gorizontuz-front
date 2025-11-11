"use client"

import React, { useState, useEffect } from 'react'
import { Youtube, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface YouTubeInputProps {
  value: string
  onChange: (url: string) => void
  error?: string
  language?: 'uz' | 'ru'
}

// Function to extract video ID from different YouTube URL formats
const extractYouTubeId = (url: string): string | null => {
  if (!url) return null
  
  // If already embed URL
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/)
  if (embedMatch) return embedMatch[1]
  
  // Regular URL: https://www.youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/)
  if (watchMatch) return watchMatch[1]
  
  // Short URL: https://youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/)
  if (shortMatch) return shortMatch[1]
  
  // If it's just an ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url
  
  return null
}

export const YouTubeInput: React.FC<YouTubeInputProps> = ({ 
  value, 
  onChange, 
  error,
  language = 'ru'
}) => {
  const [inputValue, setInputValue] = useState(value)
  const [videoId, setVideoId] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    const id = extractYouTubeId(inputValue)
    setVideoId(id)
    
    if (id) {
      const embedUrl = `https://www.youtube.com/embed/${id}`
      onChange(embedUrl)
    } else {
      onChange('')
    }
  }, [inputValue])

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-foreground">
        <Youtube className="inline mr-2" size={18} />
        {language === 'uz' ? 'YouTube URL' : 'YouTube URL'}
      </label>
      
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={language === 'uz' 
          ? 'https://www.youtube.com/watch?v=... yoki https://youtu.be/...'
          : 'https://www.youtube.com/watch?v=... или https://youtu.be/...'
        }
        className={error ? 'border-destructive' : ''}
      />
      
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      
      <div className="text-sm text-muted-foreground">
        <p className="font-medium mb-1">
          {language === 'uz' ? 'Qo\'llab-quvvatlanadigan formatlar:' : 'Поддерживаемые форматы:'}
        </p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>https://www.youtube.com/watch?v=VIDEO_ID</li>
          <li>https://youtu.be/VIDEO_ID</li>
          <li>https://www.youtube.com/embed/VIDEO_ID</li>
        </ul>
      </div>
      
      {videoId && (
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="w-full"
          >
            {showPreview ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                {language === 'uz' ? 'Oldindan ko\'rishni yashirish' : 'Скрыть предпросмотр'}
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                {language === 'uz' ? 'Oldindan ko\'rish' : 'Показать предпросмотр'}
              </>
            )}
          </Button>
          
          {showPreview && (
            <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube preview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
