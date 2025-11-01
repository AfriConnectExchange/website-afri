'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingInputProps {
  value: number
  onChange: (rating: number) => void
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  readonly?: boolean
}

export default function RatingInput({ 
  value, 
  onChange, 
  size = 'md', 
  disabled = false,
  readonly = false 
}: RatingInputProps) {
  const [hoverRating, setHoverRating] = useState(0)

  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  const handleClick = (rating: number) => {
    if (!disabled && !readonly) {
      onChange(rating)
    }
  }

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((rating) => {
        const isFilled = (hoverRating || value) >= rating
        
        return (
          <button
            key={rating}
            type="button"
            onClick={() => handleClick(rating)}
            onMouseEnter={() => !readonly && setHoverRating(rating)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
            disabled={disabled}
            className={cn(
              'transition-all duration-150',
              !readonly && !disabled && 'cursor-pointer hover:scale-110',
              (readonly || disabled) && 'cursor-default'
            )}
          >
            <Star
              className={cn(
                sizes[size],
                isFilled ? 'fill-[#F4B400] text-[#F4B400]' : 'fill-none text-gray-300',
                !readonly && !disabled && 'hover:text-[#F4B400]'
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
