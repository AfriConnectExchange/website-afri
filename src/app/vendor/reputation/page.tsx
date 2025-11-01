'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Star, Reply, CheckCircle } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ReviewDoc } from '@/lib/firestoreTypes';

interface ReviewWithId extends ReviewDoc {
  id: string;
}

export default function ReputationPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<ReviewWithId | null>(null);
  const [replyText, setReplyText] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  
  const [stats, setStats] = useState({
    total_reviews: 0,
    average_rating: 0,
    rating_breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/reviews/seller', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedReview) return;

    setReplyLoading(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/reviews/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          review_id: selectedReview.id,
          reply_message: replyText,
        }),
      });

      const data = await res.json();
      if (data.success) {
        fetchReviews();
        setDialogOpen(false);
        setReplyText('');
        setSelectedReview(null);
        alert('Reply posted successfully!');
      } else {
        alert(data.error || 'Failed to post reply');
      }
    } catch (error) {
      console.error('Failed to post reply:', error);
      alert('An error occurred');
    } finally {
      setReplyLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${index < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Reputation & Reviews</h1>
        <p className="text-gray-600 mt-1">Manage your customer reviews and ratings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total_reviews}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold">{stats.average_rating.toFixed(1)}</p>
              <div className="flex">
                {renderStars(Math.round(stats.average_rating))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Rating Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-2 text-sm">
                  <span className="w-4">{rating}</span>
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-500 rounded-full h-2"
                      style={{
                        width: `${stats.total_reviews > 0 ? (stats.rating_breakdown[rating as keyof typeof stats.rating_breakdown] / stats.total_reviews) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="w-8 text-right text-gray-600">
                    {stats.rating_breakdown[rating as keyof typeof stats.rating_breakdown]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-lg">
          <p className="text-gray-600">No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                {/* Review Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={review.reviewer_avatar || '/images/default-avatar.png'}
                      alt={review.reviewer_name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium">{review.reviewer_name}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-sm text-gray-600">
                          {review.created_at ? new Date((review.created_at as any).toDate()).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  {review.is_verified_purchase && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Verified Purchase
                    </span>
                  )}
                </div>

                {/* Review Title & Comment */}
                {review.title && <p className="font-medium mb-1">{review.title}</p>}
                <p className="text-gray-700 mb-4">{review.comment}</p>

                {/* Seller Reply */}
                {review.seller_reply ? (
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                    <p className="text-sm font-medium text-blue-900 mb-1">Your Reply</p>
                    <p className="text-sm text-blue-800">{review.seller_reply.message}</p>
                    <p className="text-xs text-blue-600 mt-2">
                      {review.seller_reply.replied_at ? new Date((review.seller_reply.replied_at as any).toDate()).toLocaleDateString() : ''}
                    </p>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedReview(review);
                      setDialogOpen(true);
                    }}
                  >
                    <Reply className="mr-2 h-4 w-4" />
                    Reply to Review
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reply Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Review</DialogTitle>
            <DialogDescription>
              Your reply will be publicly visible to all customers
            </DialogDescription>
          </DialogHeader>
          
          {selectedReview && (
            <div className="py-4 space-y-4">
              {/* Original Review */}
              <div className="bg-gray-50 p-3 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-medium">{selectedReview.reviewer_name}</p>
                  <div className="flex">
                    {renderStars(selectedReview.rating)}
                  </div>
                </div>
                <p className="text-sm text-gray-700">{selectedReview.comment}</p>
              </div>

              {/* Reply Input */}
              <div>
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write your reply..."
                  rows={4}
                  className="w-full"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReply}
              disabled={replyLoading || !replyText.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {replyLoading ? 'Posting...' : 'Post Reply'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
