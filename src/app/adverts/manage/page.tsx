'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/dashboard/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Eye, Calendar, TrendingUp } from 'lucide-react';
import { auth } from '@/lib/firebaseClient';
import Image from 'next/image';

interface Advert {
  advert_id: string;
  title: string;
  description: string;
  images: string[];
  category: string;
  status: string;
  views: number;
  clicks: number;
  created_at: string;
  expires_at: string;
}

export default function ManageAdvertsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [adverts, setAdverts] = useState<Advert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');

  useEffect(() => {
    fetchAdverts();
  }, [filter]);

  const fetchAdverts = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/auth/signin');
        return;
      }

      const token = await user.getIdToken();

      const response = await fetch(`/api/adverts?user_id=${user.uid}&status=${filter}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setAdverts(data.adverts || []);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Fetch adverts error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load adverts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (advertId: string) => {
    if (!confirm('Are you sure you want to delete this advert? This action cannot be undone.')) {
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();

      const response = await fetch(`/api/adverts/${advertId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      toast({
        title: 'Success',
        description: 'Advert deleted successfully',
      });

      fetchAdverts();
    } catch (error: any) {
      console.error('Delete advert error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete advert',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Adverts</h1>
              <p className="text-muted-foreground">Manage your promotional campaigns</p>
            </div>
            <Button onClick={() => router.push('/adverts/create')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Advert
            </Button>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-2 mb-6">
            <Button
              variant={filter === 'active' ? 'default' : 'outline'}
              onClick={() => setFilter('active')}
            >
              Active
            </Button>
            <Button
              variant={filter === 'expired' ? 'default' : 'outline'}
              onClick={() => setFilter('expired')}
            >
              Expired
            </Button>
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              All
            </Button>
          </div>

          {/* Adverts List */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading adverts...</p>
            </div>
          ) : adverts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground mb-4">No adverts found</p>
                <Button onClick={() => router.push('/adverts/create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Advert
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {adverts.map((advert) => (
                <Card key={advert.advert_id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Image */}
                      <div className="flex-shrink-0">
                        <div className="w-full md:w-48 h-32 relative rounded-lg overflow-hidden bg-muted">
                          {advert.images[0] ? (
                            <Image
                              src={advert.images[0]}
                              alt={advert.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-muted-foreground">No image</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex-grow">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-xl font-semibold">{advert.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {advert.description}
                            </p>
                          </div>
                          {getStatusBadge(advert.status)}
                        </div>

                        <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            {advert.views} views
                          </div>
                          <div className="flex items-center">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            {advert.clicks} clicks
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            Expires: {new Date(advert.expires_at).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/adverts/edit/${advert.advert_id}`)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(advert.advert_id)}
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
