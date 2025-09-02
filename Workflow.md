# Image Optimization Workflow for Network-Adaptive Rendering

## 1. Overview
This workflow creates multiple image resolutions during upload and serves the appropriate version based on user's network speed, with progressive loading for better UX.

## 2. Database Schema Updates

### Update Pins Table
```sql
-- Add columns for different image resolutions
ALTER TABLE pins ADD COLUMN image_variants JSONB DEFAULT '{}';

-- Example structure:
-- {
--   "original": "https://..../image.jpg",
--   "high": "https://..../image_800.jpg",
--   "medium": "https://..../image_400.jpg", 
--   "low": "https://..../image_200.jpg",
--   "thumbnail": "https://..../image_100.jpg"
-- }
```

## 3. Image Processing Setup

### Create Supabase Edge Function for Image Processing
```javascript
// supabase/functions/process-image/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { imageUrl, fileName, userId } = await req.json()
  
  // Process image into multiple resolutions
  const variants = await processImageVariants(imageUrl, fileName, userId)
  
  return new Response(JSON.stringify({ variants }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})

async function processImageVariants(imageUrl: string, fileName: string, userId: string) {
  const variants = {}
  const resolutions = [
    { name: 'thumbnail', width: 100 },
    { name: 'low', width: 200 },
    { name: 'medium', width: 400 },
    { name: 'high', width: 800 },
  ]

  for (const resolution of resolutions) {
    // Use ImageMagick or similar service to resize
    const resizedImageUrl = await resizeImage(imageUrl, resolution.width, fileName, userId)
    variants[resolution.name] = resizedImageUrl
  }
  
  variants.original = imageUrl
  return variants
}
```

## 4. Frontend Implementation

### Enhanced Image Upload Component
```typescript
// components/ImageUpload.tsx
import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

interface ImageUploadProps {
  onUploadComplete: (variants: ImageVariants) => void
}

interface ImageVariants {
  thumbnail: string
  low: string
  medium: string
  high: string
  original: string
}

export const ImageUpload = ({ onUploadComplete }: ImageUploadProps) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true)
    
    try {
      // 1. Upload original image
      const fileName = `${Date.now()}_${file.name}`
      const { data, error } = await supabase.storage
        .from('pin-images')
        .upload(`originals/${fileName}`, file)
      
      if (error) throw error
      
      setUploadProgress(30)
      
      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('pin-images')
        .getPublicUrl(`originals/${fileName}`)
      
      setUploadProgress(50)
      
      // 3. Process variants via Edge Function
      const { data: variants } = await supabase.functions.invoke('process-image', {
        body: {
          imageUrl: publicUrl,
          fileName,
          userId: (await supabase.auth.getUser()).data.user?.id
        }
      })
      
      setUploadProgress(100)
      onUploadComplete(variants)
      
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsProcessing(false)
      setUploadProgress(0)
    }
  }

  return (
    <div>
      {isProcessing && (
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}
      {/* Upload UI */}
    </div>
  )
}
```

### Network Speed Detection Hook
```typescript
// hooks/useNetworkSpeed.ts (Enhanced)
import { useState, useEffect } from 'react'

type NetworkSpeed = 'slow' | 'medium' | 'fast'
type ConnectionType = '2g' | '3g' | '4g' | 'wifi' | 'unknown'

interface NetworkInfo {
  speed: NetworkSpeed
  connectionType: ConnectionType
  effectiveType?: string
  downlink?: number
  rtt?: number
}

export const useNetworkSpeed = () => {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    speed: 'medium',
    connectionType: 'unknown'
  })

  useEffect(() => {
    const detectNetworkSpeed = async () => {
      // Method 1: Network Information API
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        
        const speed = getSpeedFromConnection(connection.effectiveType)
        setNetworkInfo({
          speed,
          connectionType: connection.effectiveType || 'unknown',
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        })
        
        return
      }
      
      // Method 2: Speed Test with small image
      const startTime = performance.now()
      const testImage = new Image()
      
      testImage.onload = () => {
        const loadTime = performance.now() - startTime
        const speed = getSpeedFromLoadTime(loadTime)
        setNetworkInfo(prev => ({ ...prev, speed }))
      }
      
      // Use a 10KB test image
      testImage.src = `data:image/gif;base64,${generateTestImage()}`
    }

    detectNetworkSpeed()
    
    // Listen for connection changes
    if ('connection' in navigator) {
      (navigator as any).connection?.addEventListener('change', detectNetworkSpeed)
    }
    
    return () => {
      if ('connection' in navigator) {
        (navigator as any).connection?.removeEventListener('change', detectNetworkSpeed)
      }
    }
  }, [])

  return networkInfo
}

function getSpeedFromConnection(effectiveType: string): NetworkSpeed {
  switch (effectiveType) {
    case 'slow-2g':
    case '2g':
      return 'slow'
    case '3g':
      return 'medium'
    case '4g':
    default:
      return 'fast'
  }
}

function getSpeedFromLoadTime(loadTime: number): NetworkSpeed {
  if (loadTime < 100) return 'fast'
  if (loadTime < 300) return 'medium'
  return 'slow'
}
```

### Progressive Image Component
```typescript
// components/ProgressiveImage.tsx
import { useState, useEffect, useRef } from 'react'
import { useNetworkSpeed } from '@/hooks/useNetworkSpeed'
import { cn } from '@/lib/utils'

interface ImageVariants {
  thumbnail: string
  low: string
  medium: string
  high: string
  original: string
}

interface ProgressiveImageProps {
  variants: ImageVariants
  alt: string
  className?: string
  onClick?: () => void
  loadHighRes?: boolean // Force high res (for modal)
  priority?: boolean // Eager loading
}

export const ProgressiveImage = ({ 
  variants, 
  alt, 
  className, 
  onClick,
  loadHighRes = false,
  priority = false
}: ProgressiveImageProps) => {
  const [currentSrc, setCurrentSrc] = useState(variants.thumbnail)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { speed } = useNetworkSpeed()
  const imgRef = useRef<HTMLImageElement>(null)

  // Determine optimal image quality
  const getOptimalSrc = () => {
    if (loadHighRes) return variants.original
    
    switch (speed) {
      case 'slow': return variants.low
      case 'medium': return variants.medium
      case 'fast': return variants.high
      default: return variants.medium
    }
  }

  useEffect(() => {
    const optimalSrc = getOptimalSrc()
    
    if (currentSrc === optimalSrc) return
    
    // Progressive loading
    loadImageProgressively(optimalSrc)
  }, [speed, loadHighRes, variants])

  const loadImageProgressively = async (targetSrc: string) => {
    setIsLoading(true)
    
    try {
      // Preload the target image
      await preloadImage(targetSrc)
      setCurrentSrc(targetSrc)
      setIsLoaded(true)
    } catch (error) {
      console.error('Failed to load image:', error)
      // Fallback to current image
    } finally {
      setIsLoading(false)
    }
  }

  const preloadImage = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = reject
      img.src = src
    })
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        onClick={onClick}
        loading={priority ? "eager" : "lazy"}
        className={cn(
          "w-full h-full object-cover transition-all duration-300",
          isLoaded ? "opacity-100" : "opacity-90",
          currentSrc === variants.thumbnail && "blur-sm scale-105"
        )}
        onLoad={() => setIsLoaded(true)}
      />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {/* Quality indicator (dev mode) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 text-xs rounded">
          {Object.entries(variants).find(([_, url]) => url === currentSrc)?.[0] || 'unknown'}
        </div>
      )}
    </div>
  )
}
```

### Updated PinCard Component
```typescript
// components/PinCard.tsx (Updated)
import { ProgressiveImage } from './ProgressiveImage'

const PinCard = ({ pin, onClick, className, currentUserId, onPinDeleted }: PinCardProps) => {
  // ... existing state and logic

  return (
    <Card className={cn("group relative overflow-hidden rounded-2xl cursor-pointer", className)}>
      <div className="relative">
        <ProgressiveImage
          variants={pin.image_variants || {
            thumbnail: pin.image_url,
            low: pin.image_url,
            medium: pin.image_url,
            high: pin.image_url,
            original: pin.image_url
          }}
          alt={pin.title}
          onClick={onClick}
          priority={false}
          className="aspect-auto"
        />
        
        {/* Hover overlay and other UI elements */}
      </div>
      
      {/* Pin info */}
    </Card>
  )
}
```

### Updated PinModal Component  
```typescript
// components/PinModal.tsx (Updated)
const PinModal = ({ pin, isOpen, onClose }: PinModalProps) => {
  // ... existing logic

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* High-res image for modal */}
          <ProgressiveImage
            variants={pin.image_variants}
            alt={pin.title}
            loadHighRes={true} // Force high resolution
            priority={true} // Eager loading
            className="aspect-auto max-h-[80vh]"
          />
          
          {/* Content section */}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

## 5. Supabase Storage Configuration

### Storage Bucket Setup
```sql
-- Create bucket for processed images
INSERT INTO storage.buckets (id, name, public)
VALUES ('pin-images-processed', 'pin-images-processed', true);

-- Set up RLS policies
CREATE POLICY "Anyone can view processed images" ON storage.objects
  FOR SELECT USING (bucket_id = 'pin-images-processed');

CREATE POLICY "Users can upload to their folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'pin-images-processed' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

## 6. Performance Optimizations

### Image Caching Strategy
```typescript
// utils/imageCache.ts
class ImageCache {
  private cache = new Map<string, Promise<string>>()
  private maxSize = 50 // Maximum cached images
  
  async get(url: string): Promise<string> {
    if (this.cache.has(url)) {
      return this.cache.get(url)!
    }
    
    const promise = this.fetchAndCache(url)
    this.cache.set(url, promise)
    
    // Cleanup old entries
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    return promise
  }
  
  private async fetchAndCache(url: string): Promise<string> {
    const response = await fetch(url)
    const blob = await response.blob()
    return URL.createObjectURL(blob)
  }
}

export const imageCache = new ImageCache()
```

### Intersection Observer for Lazy Loading
```typescript
// hooks/useIntersectionObserver.ts
import { useEffect, useRef, useState } from 'react'

export const useIntersectionObserver = (options: IntersectionObserverInit = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)
  const elementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
      if (entry.isIntersecting && !hasIntersected) {
        setHasIntersected(true)
      }
    }, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    })

    observer.observe(element)
    
    return () => observer.disconnect()
  }, [hasIntersected, options])

  return { elementRef, isIntersecting, hasIntersected }
}
```

## 7. Migration Script

### Update Existing Pins
```typescript
// scripts/migratePinImages.ts
import { supabase } from '@/integrations/supabase/client'

async function migratePinImages() {
  const { data: pins } = await supabase
    .from('pins')
    .select('id, image_url')
    .is('image_variants', null)

  for (const pin of pins || []) {
    console.log(`Processing pin ${pin.id}...`)
    
    try {
      // Process variants for existing image
      const { data: variants } = await supabase.functions.invoke('process-image', {
        body: {
          imageUrl: pin.image_url,
          fileName: `migrated_${pin.id}`,
          userId: 'system'
        }
      })
      
      // Update pin with variants
      await supabase
        .from('pins')
        .update({ image_variants: variants })
        .eq('id', pin.id)
        
      console.log(`✅ Processed pin ${pin.id}`)
    } catch (error) {
      console.error(`❌ Failed to process pin ${pin.id}:`, error)
    }
  }
}
```

## 8. Monitoring and Analytics

### Performance Tracking
```typescript
// utils/performance.ts
export const trackImagePerformance = (url: string, loadTime: number, quality: string) => {
  // Send to analytics service
  gtag('event', 'image_load', {
    event_category: 'performance',
    event_label: quality,
    value: Math.round(loadTime)
  })
}

export const trackNetworkSpeed = (speed: string, connectionType: string) => {
  gtag('event', 'network_detection', {
    event_category: 'network',
    event_label: speed,
    custom_parameter_1: connectionType
  })
}
```

## 9. Implementation Checklist

- [ ] Set up database schema changes
- [ ] Create Supabase Edge Function for image processing
- [ ] Implement progressive image component
- [ ] Update upload workflow
- [ ] Add network speed detection
- [ ] Configure storage buckets and policies
- [ ] Implement caching strategy
- [ ] Add lazy loading with intersection observer
- [ ] Create migration script for existing images
- [ ] Set up performance monitoring
- [ ] Test across different network conditions
- [ ] Deploy and monitor performance improvements

## 10. Expected Results

- **50-70% reduction** in initial page load times on slow connections
- **30-40% improvement** in perceived performance
- **Reduced bandwidth usage** by 60% for users on slow connections
- **Better user experience** with progressive loading
- **Faster time to interactive** for image-heavy pages

This workflow ensures that users get the best possible experience regardless of their network conditions, while maintaining high quality when needed.