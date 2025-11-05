import React from 'react';
import admin from '@/lib/firebaseAdmin';

const db = admin.firestore();

export default async function AnalyticsPage() {
  // Fetch small sets for dashboard counts and recent activity
  const [ordersSnap, activitiesSnap, notificationsSnap, messagesSnap] = await Promise.all([
    db.collection('orders').limit(1000).get(),
    db.collection('activity_logs').orderBy('created_at', 'desc').limit(20).get(),
    db.collection('notifications').limit(1000).get(),
    db.collection('messages').limit(1000).get(),
  ]);

  const ordersCount = ordersSnap.size;
  const activities = activitiesSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  const notificationsCount = notificationsSnap.size;
  const messagesCount = messagesSnap.size;

  return (
    <div className="container max-w-6xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Admin — Analytics & Activity</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 border rounded">
          <h2 className="text-sm text-muted-foreground">Orders</h2>
          <div className="text-3xl font-semibold">{ordersCount}</div>
        </div>
        <div className="p-4 border rounded">
          <h2 className="text-sm text-muted-foreground">Notifications</h2>
          <div className="text-3xl font-semibold">{notificationsCount}</div>
        </div>
        <div className="p-4 border rounded">
          <h2 className="text-sm text-muted-foreground">Queued Messages</h2>
          <div className="text-3xl font-semibold">{messagesCount}</div>
        </div>
      </div>

      <section>
        <h3 className="text-lg font-medium mb-3">Recent Activity Logs</h3>
        <div className="overflow-x-auto border rounded">
          <table className="w-full table-auto">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="p-2">Time</th>
                <th className="p-2">User</th>
                <th className="p-2">Action</th>
                <th className="p-2">Entity</th>
                <th className="p-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {activities.map(a => (
                <tr key={a.id} className="border-t">
                  <td className="p-2 text-sm">{new Date(a.created_at).toLocaleString()}</td>
                  <td className="p-2 text-sm">{a.user_id}</td>
                  <td className="p-2 text-sm">{a.action}</td>
                  <td className="p-2 text-sm">{a.entity_type} {a.entity_id ? `#${String(a.entity_id).substring(0,6)}` : ''}</td>
                  <td className="p-2 text-sm">{JSON.stringify(a.changes || {})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
