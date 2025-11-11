"use client"

import React from 'react'
import { Image, Video } from 'lucide-react'
import { MediaType } from '@/lib/api'

interface MediaTypeSelectorProps {
  value: MediaType
  onChange: (type: MediaType) => void
  language?: 'uz' | 'ru'
}

export const MediaTypeSelector: React.FC<MediaTypeSelectorProps> = ({ 
  value, 
  onChange,
  language = 'ru'
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        {language === 'uz' ? 'Media turi' : 'Тип медиа'}
      </label>
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => onChange('images')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
            value === 'images'
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-background text-muted-foreground hover:border-primary/50'
          }`}
        >
          <Image size={20} />
          <span className="font-medium">
            {language === 'uz' ? 'Rasmlar' : 'Изображения'}
          </span>
        </button>
        
        <button
          type="button"
          onClick={() => onChange('iframe')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
            value === 'iframe'
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-background text-muted-foreground hover:border-primary/50'
          }`}
        >
          <Video size={20} />
          <span className="font-medium">
            {language === 'uz' ? 'YouTube video' : 'YouTube видео'}
          </span>
        </button>
      </div>
    </div>
  )
}
