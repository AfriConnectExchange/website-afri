import { redirect } from 'next/navigation';

export default function AdminIndexPage() {
  // Redirect /admin to the main admin dashboard
  redirect('/admin/dashboard');
}
