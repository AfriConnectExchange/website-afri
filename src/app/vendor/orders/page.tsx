'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { CheckCircle, LocalShipping, Cancel, Info, Visibility } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { OrderDoc } from '@/lib/firestoreTypes';

interface OrderWithId extends OrderDoc {
  id: string;
}

export default function SellerOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | OrderDoc['status']>('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderWithId | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/orders/seller?status=${filter}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderDoc['status'], tracking?: string) => {
    setActionLoading(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/orders/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id: orderId,
          status,
          tracking_number: tracking,
        }),
      });

      const data = await res.json();
      if (data.success) {
        fetchOrders();
        setDialogOpen(false);
        setSelectedOrder(null);
        alert(`Order ${status === 'confirmed' ? 'confirmed' : status === 'shipped' ? 'marked as shipped' : 'updated'} successfully!`);
      } else {
        alert(data.error || 'Failed to update order');
      }
    } catch (error) {
      console.error('Failed to update order:', error);
      alert('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status?: OrderDoc['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-green-200 text-green-900';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'disputed': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusActions = (order: OrderWithId) => {
    switch (order.status) {
      case 'pending':
        return (
          <Button
            size="sm"
            onClick={() => updateOrderStatus(order.id, 'confirmed')}
            disabled={actionLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <CheckCircle className="mr-1 h-4 w-4" />
            Confirm Order
          </Button>
        );
      case 'confirmed':
        return (
          <Button
            size="sm"
            onClick={() => {
              setSelectedOrder(order);
              setDialogOpen(true);
            }}
            disabled={actionLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <LocalShipping className="mr-1 h-4 w-4" />
            Mark as Shipped
          </Button>
        );
      case 'shipped':
        return (
          <Button
            size="sm"
            onClick={() => updateOrderStatus(order.id, 'delivered')}
            disabled={actionLoading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="mr-1 h-4 w-4" />
            Mark as Delivered
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Order Management</h1>
        <p className="text-gray-600 mt-1">View and manage your customer orders</p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4 mb-6">
        <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-lg">
          <p className="text-gray-600">No orders found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg">Order #{order.order_number}</h3>
                  <p className="text-sm text-gray-600">
                    {order.created_at ? new Date((order.created_at as any).toDate()).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>

              {/* Items */}
              <div className="space-y-2 mb-4">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded">
                    <img
                      src={item.product_image || '/images/placeholder.png'}
                      alt={item.product_title}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.product_title}</p>
                      <p className="text-sm text-gray-600">
                        Qty: {item.quantity} × {order.currency} {item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Buyer Info */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-600">Buyer</p>
                  <p className="font-medium">{order.buyer_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total</p>
                  <p className="font-medium text-lg">{order.currency} {order.total_amount?.toFixed(2)}</p>
                </div>
              </div>

              {/* Shipping Address */}
              {order.shipping_address && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                  <p className="text-sm font-medium text-blue-900 mb-1">Shipping Address</p>
                  <p className="text-sm text-blue-800">
                    {order.shipping_address.full_name}<br />
                    {order.shipping_address.address_line1}<br />
                    {order.shipping_address.address_line2 && <>{order.shipping_address.address_line2}<br /></>}
                    {order.shipping_address.city}, {order.shipping_address.postal_code}<br />
                    {order.shipping_address.country}
                  </p>
                </div>
              )}

              {/* Tracking Number */}
              {order.tracking_number && (
                <div className="bg-purple-50 border border-purple-200 rounded p-3 mb-4">
                  <p className="text-sm font-medium text-purple-900">Tracking Number</p>
                  <p className="text-sm text-purple-800 font-mono">{order.tracking_number}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {getStatusActions(order)}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedOrder(order);
                    // TODO: Open order details modal
                  }}
                >
                  <Visibility className="mr-1 h-4 w-4" />
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ship Order Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Order as Shipped</DialogTitle>
            <DialogDescription>
              Provide tracking information for this order
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="tracking">Tracking Number (optional)</Label>
              <Input
                id="tracking"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedOrder) {
                  updateOrderStatus(selectedOrder.id, 'shipped', trackingNumber);
                }
              }}
              disabled={actionLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {actionLoading ? 'Updating...' : 'Confirm Shipment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
