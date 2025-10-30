export default function AdminNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold mb-2">Admin — Page not found</h1>
        <p className="text-sm text-muted-foreground mb-4">The admin page you are looking for does not exist.</p>
        <a href="/admin" className="inline-block bg-primary text-white px-3 py-1.5 rounded text-sm">Go to Admin Home</a>
      </div>
    </div>
  );
}
