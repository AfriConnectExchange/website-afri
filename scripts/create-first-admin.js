/**
 * Script to create your first admin account
 * Run this once to bootstrap your admin access
 * 
 * Usage:
 * 1. Make sure your Firebase Admin credentials are set in .env.local
 * 2. Run: node scripts/create-first-admin.js
 * 3. Delete or secure this script after use
 */

// This script needs to be run with ts-node or converted to use fetch
const ADMIN_EMAIL = 'admin@africonnect.com'; // Change this
const ADMIN_PASSWORD = 'SecurePassword123!'; // Change this
const ADMIN_NAME = 'Super Admin'; // Change this

async function createFirstAdmin() {
  try {
    const response = await fetch('http://localhost:3000/api/admin/create-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        displayName: ADMIN_NAME,
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Admin account created successfully!');
      console.log('Email:', data.email);
      console.log('UID:', data.uid);
      console.log('\nYou can now login at: http://localhost:3000/admin/login');
      console.log('\n⚠️  IMPORTANT: Delete or secure the /api/admin/create-account endpoint after creating your admin!');
    } else {
      console.error('❌ Failed to create admin account:', data.error);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createFirstAdmin();
