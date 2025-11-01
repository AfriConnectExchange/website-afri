'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Package, Truck, CheckCircle, Clock, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface TrackingUpdate {
  status: string
  location: string
  timestamp: string
  description: string
}

interface Order {
  id: string
  status: 'pending' | 'confirmed' | 'shipped' | 'out_for_delivery' | 'delivered'
  tracking_number?: string
  courier_name?: string
  estimated_delivery?: string
  tracking_updates: TrackingUpdate[]
}

export default function OrderTrackingPage() {
  const params = useParams()
  const orderId = params.orderId as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTracking()
    const interval = setInterval(fetchTracking, 5 * 60 * 1000) // Refresh every 5 minutes
    return () => clearInterval(interval)
  }, [orderId])

  const fetchTracking = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}/track`)
      const data = await response.json()
      setOrder(data.order)
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F4B400] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tracking information...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Order not found</p>
        </div>
      </div>
    )
  }

  const STATUSES = [
    { key: 'pending', label: 'Order Placed', icon: Package },
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
    { key: 'shipped', label: 'Shipped', icon: Truck },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: MapPin },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle }
  ]

  const currentIndex = STATUSES.findIndex(s => s.key === order.status)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[#2C2A4A] mb-2">Track Your Order</h1>
        <p className="text-gray-600 mb-8">Order ID: {orderId}</p>

        {/* Status Progress */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              {STATUSES.map((status, index) => {
                const Icon = status.icon
                const isCompleted = index <= currentIndex
                const isCurrent = index === currentIndex

                return (
                  <div key={status.key} className="flex flex-col items-center flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                      isCompleted ? 'bg-[#34A853] text-white' :
                      'bg-gray-200 text-gray-400'
                    }`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <p className={`text-xs text-center ${
                      isCurrent ? 'font-semibold text-[#2C2A4A]' : 'text-gray-500'
                    }`}>
                      {status.label}
                    </p>
                  </div>
                )
              })}
            </div>

            <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-[#34A853] transition-all duration-500"
                style={{ width: `${(currentIndex / (STATUSES.length - 1)) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tracking Info */}
        {order.tracking_number && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tracking Number</p>
                  <p className="font-semibold font-mono">{order.tracking_number}</p>
                </div>
                {order.courier_name && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Courier</p>
                    <p className="font-semibold">{order.courier_name}</p>
                  </div>
                )}
                {order.estimated_delivery && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Estimated Delivery</p>
                    <p className="font-semibold">{new Date(order.estimated_delivery).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tracking Timeline */}
        {order.tracking_updates && order.tracking_updates.length > 0 ? (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-6">Tracking History</h2>
              <div className="space-y-6">
                {order.tracking_updates.map((update, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-[#F4B400]"></div>
                      {index < order.tracking_updates.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-300 my-1"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-start justify-between mb-1">
                        <p className="font-semibold">{update.status}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(update.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {update.location && (
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {update.location}
                        </p>
                      )}
                      {update.description && (
                        <p className="text-sm text-gray-600 mt-1">{update.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Tracking information not available yet</p>
              <p className="text-sm text-gray-500">Please check back later or contact the seller</p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-4">
          <Button
            onClick={fetchTracking}
            variant="outline"
            className="flex-1"
          >
            Refresh Tracking
          </Button>
          <Button
            onClick={() => window.print()}
            variant="outline"
            className="flex-1"
          >
            Print Details
          </Button>
        </div>
      </div>
    </div>
  )
}
