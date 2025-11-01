'use client'

import { useState, useEffect } from 'react'
import { Star, ThumbsUp, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import RatingInput from './RatingInput'

interface Review {
  id: string
  user_name: string
  user_avatar?: string
  rating: number
  review_text: string
  images?: string[]
  created_at: string
  helpful_count: number
  seller_reply?: {
    text: string
    created_at: string
  }
}

interface ReviewsListProps {
  productId: string
  isSeller?: boolean
}

export default function ReviewsList({ productId, isSeller = false }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('recent')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  useEffect(() => {
    fetchReviews()
  }, [productId, sortBy])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/reviews/product/${productId}?sort=${sortBy}`)
      const data = await response.json()
      setReviews(data.reviews || [])
    } catch (error) {
      console.error('Fetch reviews error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleHelpful = async (reviewId: string) => {
    try {
      await fetch(`/api/reviews/${reviewId}/helpful`, { method: 'POST' })
      fetchReviews()
    } catch (error) {
      console.error('Helpful error:', error)
    }
  }

  const handleReply = async (reviewId: string) => {
    if (replyText.length < 10) return

    try {
      await fetch(`/api/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply_text: replyText })
      })
      setReplyingTo(null)
      setReplyText('')
      fetchReviews()
    } catch (error) {
      console.error('Reply error:', error)
    }
  }

  if (loading) return <div className="text-center py-6">Loading reviews...</div>

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No reviews yet. Be the first to review this product!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sort Options */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{reviews.length} Reviews</h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm"
        >
          <option value="recent">Most Recent</option>
          <option value="rating_high">Highest Rated</option>
          <option value="helpful">Most Helpful</option>
        </select>
      </div>

      {/* Reviews */}
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                {review.user_avatar ? (
                  <img src={review.user_avatar} alt={review.user_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg font-semibold text-gray-600">
                    {review.user_name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="flex-1">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold">{review.user_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <RatingInput value={review.rating} onChange={() => {}} readonly size="sm" />
                      <span className="text-xs text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Review Text */}
                <p className="text-gray-700 mb-3">{review.review_text}</p>

                {/* Images */}
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 mb-3">
                    {review.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Review ${idx + 1}`}
                        className="w-20 h-20 object-cover rounded cursor-pointer hover:opacity-75"
                      />
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 mb-3">
                  <button
                    onClick={() => handleHelpful(review.id)}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-[#0072CE]"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span>Helpful ({review.helpful_count})</span>
                  </button>

                  {isSeller && !review.seller_reply && (
                    <button
                      onClick={() => setReplyingTo(review.id)}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-[#0072CE]"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Reply</span>
                    </button>
                  )}
                </div>

                {/* Seller Reply */}
                {review.seller_reply && (
                  <div className="bg-gray-50 rounded-lg p-4 mt-3">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Seller Response</p>
                    <p className="text-sm text-gray-600">{review.seller_reply.text}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(review.seller_reply.created_at).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {/* Reply Form */}
                {replyingTo === review.id && (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write your response (min 10 characters)..."
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleReply(review.id)}
                        disabled={replyText.length < 10}
                        size="sm"
                        className="bg-[#F4B400] hover:bg-[#F4B400]/90"
                      >
                        Submit Reply
                      </Button>
                      <Button
                        onClick={() => {
                          setReplyingTo(null)
                          setReplyText('')
                        }}
                        size="sm"
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
