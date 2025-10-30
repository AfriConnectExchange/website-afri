"use client";

import React from 'react';

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  // Keep admin error UI self-contained and minimal — do not import shared components
  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
      <div className="max-w-lg text-center">
        <h1 className="text-xl font-semibold mb-2 text-red-700">Something went wrong in Admin</h1>
        <p className="text-sm text-muted-foreground mb-3">An unexpected error occurred. You can try to reload the admin page.</p>
        <div className="mb-3">
          <button
            onClick={() => reset()}
            className="inline-block bg-red-700 text-white px-3 py-1.5 rounded mr-2 text-sm"
          >
            Retry
          </button>
          <a href="/" className="inline-block text-sm text-red-700 underline">Back to site</a>
        </div>
        <details className="text-xs text-left text-red-600 bg-white rounded p-2 border border-red-100">
          <summary className="cursor-pointer">Show error details</summary>
          <pre className="whitespace-pre-wrap mt-2 text-xs">{String(error?.stack || error?.message)}</pre>
        </details>
      </div>
    </div>
  );
}
