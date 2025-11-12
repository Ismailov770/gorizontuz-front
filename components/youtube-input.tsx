"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Youtube, AlertCircle, Eye, EyeOff, HelpCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface YouTubeInputProps {
  value: string
  onChange: (url: string) => void
  error?: string
  language?: 'uz' | 'ru'
  className?: string
}

type YouTubeUrlType = 'standard' | 'short' | 'embed' | 'id' | 'invalid'

interface YouTubeUrlInfo {
  type: YouTubeUrlType
  videoId: string | null
  standardUrl: string
  isValid: boolean
}

// Function to extract video ID and determine URL type
const parseYouTubeUrl = (url: string): YouTubeUrlInfo => {
  if (!url || typeof url !== 'string') {
    return { type: 'invalid', videoId: null, standardUrl: '', isValid: false }
  }

  // Check for empty or whitespace only
  if (!url.trim()) {
    return { type: 'invalid', videoId: null, standardUrl: '', isValid: false }
  }

  // Check if it's just a video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return {
      type: 'id',
      videoId: url,
      standardUrl: `https://www.youtube.com/watch?v=${url}`,
      isValid: true
    }
  }

  // Check for standard URL
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
  if (watchMatch && watchMatch[1]) {
    return {
      type: 'standard',
      videoId: watchMatch[1],
      standardUrl: `https://www.youtube.com/watch?v=${watchMatch[1]}`,
      isValid: true
    }
  }

  // Check for short URL
  const shortMatch = url.match(/(?:youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/)
  if (shortMatch && shortMatch[1]) {
    return {
      type: 'short',
      videoId: shortMatch[1],
      standardUrl: `https://www.youtube.com/watch?v=${shortMatch[1]}`,
      isValid: true
    }
  }

  // Check for embed URL
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/)
  if (embedMatch && embedMatch[1]) {
    return {
      type: 'embed',
      videoId: embedMatch[1],
      standardUrl: `https://www.youtube.com/watch?v=${embedMatch[1]}`,
      isValid: true
    }
  }

  return { type: 'invalid', videoId: null, standardUrl: '', isValid: false }
}

// Get localized strings based on language
const useLocalization = (language: 'uz' | 'ru' = 'ru') => {
  return useMemo(() => ({
    title: language === 'uz' ? 'YouTube havolasi' : 'Ссылка на YouTube',
    placeholder: language === 'uz' 
      ? 'https://www.youtube.com/watch?v=... yoki https://youtu.be/...' 
      : 'https://www.youtube.com/watch?v=... или https://youtu.be/...',
    formatsTitle: language === 'uz' 
      ? 'Q\'ollab-quvvatlanadigan formatlar:' 
      : 'Поддерживаемые форматы:',
    invalidUrl: language === 'uz'
      ? 'Noto\'g\'ri YouTube havolasi'
      : 'Неверная ссылка на YouTube',
    preview: {
      show: language === 'uz' ? 'Oldindan ko\'rish' : 'Показать предпросмотр',
      hide: language === 'uz' ? 'Oldindan ko\'rishni yashirish' : 'Скрыть предпросмотр',
      title: language === 'uz' ? 'YouTube video ko\'rinishi' : 'Предпросмотр видео',
    },
    tooltips: {
      formats: language === 'uz' 
        ? 'Qo\'llab-quvvatlanadigan formatlar' 
        : 'Поддерживаемые форматы ссылок',
      valid: language === 'uz' 
        ? 'Havola to\'g\'ri kiritildi' 
        : 'Ссылка введена корректно'
    }
  }), [language])
}

export const YouTubeInput = React.memo(({ 
  value, 
  onChange, 
  error: externalError,
  language = 'ru',
  className = ''
}: YouTubeInputProps) => {
  const [inputValue, setInputValue] = useState(value || '')
  const [isTouched, setIsTouched] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  
  const loc = useLocalization(language)
  
  // Parse the current URL to get video info
  const urlInfo = useMemo(() => parseYouTubeUrl(inputValue), [inputValue])
  
  // Determine if we should show an error
  const showError = useMemo(() => {
    if (externalError) return true
    if (!isTouched) return false
    return !urlInfo.isValid && inputValue.length > 0
  }, [externalError, isTouched, urlInfo.isValid, inputValue.length])
  
  // Handle input changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }, [])
  
  // Handle input blur
  const handleBlur = useCallback(() => {
    setIsTouched(true)
    
    // If we have a valid URL, format it to standard
    if (urlInfo.isValid && urlInfo.standardUrl !== inputValue) {
      setInputValue(urlInfo.standardUrl)
    }
  }, [inputValue, urlInfo])
  
  // Notify parent about changes
  useEffect(() => {
    if (urlInfo.isValid && urlInfo.standardUrl !== value) {
      onChange(urlInfo.standardUrl)
    } else if (!urlInfo.isValid && inputValue === '' && value !== '') {
      onChange('')
    }
  }, [urlInfo, value, onChange, inputValue])
  
  // Handle external value changes
  useEffect(() => {
    if (value !== inputValue && value !== urlInfo.standardUrl) {
      const newInfo = parseYouTubeUrl(value)
      setInputValue(newInfo.isValid ? newInfo.standardUrl : value)
    }
  }, [value])
  
  // Toggle preview
  const togglePreview = useCallback(() => {
    setShowPreview(prev => !prev)
  }, [])

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-foreground flex items-center">
          <Youtube className="inline mr-2" size={18} />
          {loc.title}
        </label>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                <span className="sr-only">{loc.tooltips.formats}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[300px]">
              <div className="space-y-1">
                <p className="font-medium">{loc.formatsTitle}</p>
                <ul className="list-disc pl-4 space-y-1 text-xs">
                  <li>https://www.youtube.com/watch?v=VIDEO_ID</li>
                  <li>https://youtu.be/VIDEO_ID</li>
                  <li>https://www.youtube.com/embed/VIDEO_ID</li>
                  <li>VIDEO_ID (11 символов)</li>
                </ul>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="relative">
        <Input
          type="text"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={loc.placeholder}
          className={showError ? 'border-destructive pr-10' : 'pr-10'}
          aria-invalid={showError}
        />
        
        {urlInfo.isValid && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    <span className="sr-only">{loc.tooltips.valid}</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{loc.tooltips.valid}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>
      
      {(showError || externalError) && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle size={16} />
          <span>{externalError || loc.invalidUrl}</span>
        </div>
      )}
      
      {urlInfo.isValid && urlInfo.videoId && (
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={togglePreview}
            className="w-full"
          >
            {showPreview ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                {loc.preview.hide}
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                {loc.preview.show}
              </>
            )}
          </Button>
          
          {showPreview && (
            <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden border">
              <iframe
                src={`https://www.youtube.com/embed/${urlInfo.videoId}?rel=0`}
                title={loc.preview.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
                loading="lazy"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
})

YouTubeInput.displayName = 'YouTubeInput'
