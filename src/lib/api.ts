
'use client';

import { auth } from '@/lib/firebaseClient';
import { useGlobal } from './context/GlobalContext';

/**
 * A wrapper around the native `fetch` function that automatically adds the
 * Firebase Authentication ID token to the request headers.
 *
 * @param url The URL to fetch.
 * @param options The options for the fetch request.
 * @returns A promise that resolves to the `Response` object.
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('Authentication required: No user is currently signed in.');
  }

  try {
    const token = await currentUser.getIdToken(true); // Force refresh the token

    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${token}`);

    const newOptions: RequestInit = {
      ...options,
      headers,
    };

    return fetch(url, newOptions);

  } catch (error) {
    console.error("Error getting auth token:", error);
    // You could potentially trigger a re-login flow here
    throw new Error('Failed to authenticate the request.');
  }
}
