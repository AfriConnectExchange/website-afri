/**
 * Script to migrate category images from local paths to Firebase Storage
 * This will upload images from public/images/categories to Firebase Storage
 * and update the database with the new URLs
 */

import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin
const serviceAccountPath = path.join(process.cwd(), 'creds.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: serviceAccount.project_id + '.appspot.com',
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

interface CategoryData {
  id: string;
  name: string;
  image?: string;
  image_url?: string;
  parent_id?: string | null;
}

async function uploadImageToStorage(localPath: string, categoryName: string): Promise<string> {
  const publicDir = path.join(process.cwd(), 'public');
  const fullPath = path.join(publicDir, localPath.replace(/^\//, ''));

  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Image file not found: ${fullPath}`);
  }

  // Read file
  const fileBuffer = fs.readFileSync(fullPath);
  const fileExtension = path.extname(fullPath);
  const sanitizedName = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const timestamp = Date.now();
  const filename = `categories/${timestamp}_${sanitizedName}${fileExtension}`;

  // Determine content type
  const contentTypeMap: { [key: string]: string } = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
  };
  const contentType = contentTypeMap[fileExtension.toLowerCase()] || 'application/octet-stream';

  // Upload to Firebase Storage
  const fileRef = bucket.file(filename);
  await fileRef.save(fileBuffer, {
    metadata: {
      contentType,
      metadata: {
        uploadedAt: new Date().toISOString(),
        purpose: 'category_image',
        migratedFrom: localPath,
      },
    },
  });

  // Make file public
  await fileRef.makePublic();
  
  // Return public URL
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
  return publicUrl;
}

async function migrateCategoryImages(dryRun: boolean = true) {
  console.log('🚀 Starting category image migration...');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE MIGRATION'}\n`);

  try {
    const categoriesRef = db.collection('categories');
    const snapshot = await categoriesRef.get();

    if (snapshot.empty) {
      console.log('❌ No categories found in the database.');
      return;
    }

    const categoriesToMigrate: CategoryData[] = [];

    // Find categories with local paths
    snapshot.forEach((doc) => {
      const data = doc.data() as CategoryData;
      const imageField = data.image_url || data.image;

      if (imageField && !imageField.startsWith('http')) {
        categoriesToMigrate.push({
          id: doc.id,
          name: data.name,
          image: data.image,
          image_url: data.image_url,
          parent_id: data.parent_id,
        });
      }
    });

    if (categoriesToMigrate.length === 0) {
      console.log('✅ No categories need migration. All images are already using Storage URLs!');
      return;
    }

    console.log(`📊 Found ${categoriesToMigrate.length} categories to migrate:\n`);

    const results: { success: number; failed: number; skipped: number } = {
      success: 0,
      failed: 0,
      skipped: 0,
    };

    for (const category of categoriesToMigrate) {
      const localPath = category.image_url || category.image || '';
      console.log(`\n📁 Processing: ${category.name}`);
      console.log(`   Local path: ${localPath}`);

      try {
        if (dryRun) {
          console.log(`   ✓ Would upload to Firebase Storage (dry run)`);
          results.skipped++;
        } else {
          // Upload to Firebase Storage
          const storageUrl = await uploadImageToStorage(localPath, category.name);
          console.log(`   ✓ Uploaded to: ${storageUrl}`);

          // Update database
          await db.collection('categories').doc(category.id).update({
            image_url: storageUrl,
            image: admin.firestore.FieldValue.delete(), // Remove old image field
          });
          console.log(`   ✓ Database updated`);
          
          results.success++;
        }
      } catch (error: any) {
        console.error(`   ✗ Failed: ${error.message}`);
        results.failed++;
      }
    }

    console.log('\n' + '─'.repeat(80));
    console.log('\n📈 Migration Summary:');
    console.log(`   Successful: ${results.success}`);
    console.log(`   Failed: ${results.failed}`);
    console.log(`   Skipped (dry run): ${results.skipped}`);

    if (dryRun) {
      console.log('\n💡 This was a dry run. Run with --live flag to perform actual migration.');
      console.log('   Example: npm run migrate-category-images -- --live');
    }

  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    // Clean up
    await admin.app().delete();
  }
}

// Check if --live flag is passed
const isLive = process.argv.includes('--live');
const dryRun = !isLive;

// Run the migration
migrateCategoryImages(dryRun)
  .then(() => {
    console.log('\n✅ Migration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
