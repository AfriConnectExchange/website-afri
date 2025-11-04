'use client';

import { useEffect, useMemo, useState } from 'react';
import { Star, MessageCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchWithAuth } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

interface SellerReview {
  id: string;
  rating: number;
  comment: string;
  reviewer_name?: string;
  created_at?: { seconds: number; nanoseconds: number } | string | null;
  seller_reply?: {
    text: string;
    created_at: string;
  };
  product_id?: string;
  product_title?: string;
}

interface RatingStats {
  total_reviews: number;
  average_rating: number;
  rating_breakdown: Record<'5' | '4' | '3' | '2' | '1', number>;
}

const toDate = (input?: SellerReview['created_at']): Date | null => {
  if (!input) return null;
  if (typeof input === 'string') return new Date(input);
  if (typeof input === 'object' && 'seconds' in input) return new Date(input.seconds * 1000);
  return null;
};

const formatDate = (input?: SellerReview['created_at']) => {
  const date = toDate(input);
  if (!date) return 'Unknown';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const STARS = [1, 2, 3, 4, 5];
const DEFAULT_STATS: RatingStats = {
  total_reviews: 0,
  average_rating: 0,
  rating_breakdown: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
};

export function SellerReviewsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [stats, setStats] = useState<RatingStats>(DEFAULT_STATS);
  const [replyDialog, setReplyDialog] = useState<{
    open: boolean;
    review: SellerReview | null;
    reply: string;
    isSubmitting: boolean;
  }>({ open: false, review: null, reply: '', isSubmitting: false });

  useEffect(() => {
    const loadReviews = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetchWithAuth('/api/reviews/seller');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch reviews');
        }

        setReviews(data.reviews || []);
  setStats(data.stats || DEFAULT_STATS);
      } catch (err: any) {
        console.error('Failed to load reviews:', err);
        setError(err.message || 'Unable to load reviews');
        toast({
          variant: 'destructive',
          title: 'Could not load reviews',
          description: err.message || 'Please try again later.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  const ratingDistribution = useMemo(() => {
    const total = stats.total_reviews || 0;
    return STARS.slice().reverse().map(star => {
      const count = stats.rating_breakdown[String(star) as keyof RatingStats['rating_breakdown']] || 0;
      const percentage = total === 0 ? 0 : Math.round((count / total) * 100);
      return { star, count, percentage };
    });
  }, [stats]);

  const handleReplySubmit = async () => {
    if (!replyDialog.review) return;
    if (replyDialog.reply.trim().length < 10) {
      toast({
        variant: 'destructive',
        title: 'Reply too short',
        description: 'Replies must be at least 10 characters to meet moderation guidelines.',
      });
      return;
    }

    try {
      setReplyDialog(prev => ({ ...prev, isSubmitting: true }));
      const response = await fetchWithAuth(`/api/reviews/${replyDialog.review.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply_text: replyDialog.reply.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reply');
      }

      toast({
        title: 'Reply published',
        description: 'Your response is now visible to the buyer.',
      });

      setReviews(prev =>
        prev.map(review =>
          review.id === replyDialog.review?.id
            ? {
                ...review,
                seller_reply: {
                  text: replyDialog.reply.trim(),
                  created_at: new Date().toISOString(),
                },
              }
            : review
        )
      );
      setReplyDialog({ open: false, review: null, reply: '', isSubmitting: false });
    } catch (err: any) {
      console.error('Failed to publish reply:', err);
      toast({
        variant: 'destructive',
        title: 'Reply failed',
        description: err.message || 'Please try again shortly.',
      });
      setReplyDialog(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold">Reviews & reputation</h1>
        <p className="text-sm text-muted-foreground">
          Track sentiment, respond to buyers, and stay on top of moderation rules.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Average rating</CardTitle>
            <CardDescription>Verified purchases only.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            {isLoading ? (
              <Skeleton className="h-16 w-16 rounded-full" />
            ) : (
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <span className="text-2xl font-bold">{stats.average_rating.toFixed(1)}</span>
                <Star className="absolute -bottom-1 -right-1 h-5 w-5 fill-primary text-primary" />
              </div>
            )}
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total reviews</p>
              <p className="text-2xl font-semibold">{stats.total_reviews}</p>
              <p className="text-xs text-muted-foreground">Reply to every review within 48 hours to maintain premium status.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Rating distribution</CardTitle>
            <CardDescription>Monitor shifts in sentiment and tackle issues early.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, index) => (
                  <Skeleton key={index} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              ratingDistribution.map(row => (
                <div key={row.star} className="flex items-center gap-3">
                  <span className="flex w-9 items-center justify-between text-sm">
                    <span>{row.star}</span>
                    <Star className="h-3 w-3 fill-primary text-primary" />
                  </span>
                  <div className="h-2 flex-1 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${row.percentage}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs text-muted-foreground">{row.count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent reviews</CardTitle>
          <CardDescription>Spot negative experiences quickly and close the loop with buyers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <Skeleton key={index} className="h-24 w-full" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reviews yet. Once buyers start sharing feedback it will appear here.</p>
          ) : (
            reviews.map(review => (
              <div key={review.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      {STARS.map(star => (
                        <Star
                          key={`${review.id}-${star}`}
                          className={`h-4 w-4 ${star <= review.rating ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
                        />
                      ))}
                    </div>
                    <p className="text-sm font-medium">{review.reviewer_name || 'Verified buyer'}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(review.created_at)}</p>
                    {review.product_title && (
                      <Badge variant="outline" className="text-xs">{review.product_title}</Badge>
                    )}
                  </div>
                  <Badge variant="secondary" className="capitalize">Verified purchase</Badge>
                </div>

                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{review.comment}</p>

                {review.seller_reply ? (
                  <div className="mt-4 rounded-lg border border-dashed bg-muted/40 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your reply</p>
                    <p className="mt-1 text-sm">{review.seller_reply.text}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Posted {new Date(review.seller_reply.created_at).toLocaleString()}</p>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4"
                    onClick={() =>
                      setReplyDialog({ open: true, review, reply: '', isSubmitting: false })
                    }
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />Reply to review
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog
        open={replyDialog.open}
        onOpenChange={open =>
          setReplyDialog(prev => ({
            ...prev,
            open,
            review: open ? prev.review : null,
            reply: open ? prev.reply : '',
            isSubmitting: false,
          }))
        }
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reply to buyer</DialogTitle>
            <DialogDescription>
              Keep your message professional and helpful. Buyers love quick acknowledgements.
            </DialogDescription>
          </DialogHeader>

          {replyDialog.review && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                “{replyDialog.review.comment}”
              </div>
              <div className="space-y-2">
                <Label htmlFor="review-reply">Your reply</Label>
                <Textarea
                  id="review-reply"
                  placeholder="Thanks for choosing us..."
                  minLength={10}
                  value={replyDialog.reply}
                  onChange={event =>
                    setReplyDialog(prev => ({ ...prev, reply: event.target.value }))
                  }
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 10 characters. Replies are visible publicly once submitted.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              variant="outline"
              onClick={() => setReplyDialog({ open: false, review: null, reply: '', isSubmitting: false })}
              disabled={replyDialog.isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleReplySubmit} disabled={replyDialog.isSubmitting}>
              {replyDialog.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Publish reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
