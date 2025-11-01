'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import RatingInput from './RatingInput'
import ImageUpload from '@/components/vendor/ImageUpload'

interface ReviewFormProps {
  productId: string
  orderId: string
  onSuccess?: () => void
}

export default function ReviewForm({ productId, orderId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    if (reviewText.length < 20) {
      setError('Review must be at least 20 characters')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/reviews/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          order_id: orderId,
          rating,
          review_text: reviewText,
          images
        })
      })

      if (!response.ok) throw new Error('Failed to submit review')

      setRating(0)
      setReviewText('')
      setImages([])
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label>Your Rating *</Label>
        <div className="mt-2">
          <RatingInput value={rating} onChange={setRating} size="lg" />
        </div>
      </div>

      <div>
        <Label htmlFor="review">Your Review * (min 20 characters)</Label>
        <Textarea
          id="review"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Share your experience with this product..."
          rows={6}
          className="mt-2"
        />
        <p className="text-xs text-gray-500 mt-1">{reviewText.length}/2000 characters</p>
      </div>

      <div>
        <Label>Photos (Optional)</Label>
        <ImageUpload
          maxImages={4}
          maxSizeMB={2}
          onImagesChange={setImages}
          defaultImages={images}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button
        type="submit"
        disabled={submitting || rating === 0 || reviewText.length < 20}
        className="w-full bg-[#F4B400] hover:bg-[#F4B400]/90"
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  )
}
