/**
 * Script to check category images in the database
 * This will show which categories have images stored as paths vs Firebase Storage URLs
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

interface CategoryData {
  id: string;
  name: string;
  image?: string;
  image_url?: string;
  parent_id?: string | null;
}

async function checkCategoryImages() {
  console.log('🔍 Checking category images in database...\n');

  try {
    const categoriesRef = db.collection('categories');
    const snapshot = await categoriesRef.get();

    if (snapshot.empty) {
      console.log('❌ No categories found in the database.');
      return;
    }

    console.log(`📊 Found ${snapshot.size} categories\n`);
    console.log('─'.repeat(80));

    const categoriesWithLocalPaths: CategoryData[] = [];
    const categoriesWithStorageUrls: CategoryData[] = [];
    const categoriesWithoutImages: CategoryData[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data() as CategoryData;
      const category: CategoryData = {
        id: doc.id,
        name: data.name,
        image: data.image,
        image_url: data.image_url,
        parent_id: data.parent_id,
      };

      const imageField = data.image_url || data.image;

      if (!imageField) {
        categoriesWithoutImages.push(category);
      } else if (imageField.startsWith('http')) {
        categoriesWithStorageUrls.push(category);
      } else {
        categoriesWithLocalPaths.push(category);
      }
    });

    // Display results
    console.log('\n✅ Categories with Firebase Storage URLs:');
    if (categoriesWithStorageUrls.length === 0) {
      console.log('   None');
    } else {
      categoriesWithStorageUrls.forEach((cat) => {
        console.log(`   • ${cat.name} (${cat.id})`);
        console.log(`     URL: ${cat.image_url || cat.image}`);
      });
    }

    console.log('\n⚠️  Categories with local file paths (need migration):');
    if (categoriesWithLocalPaths.length === 0) {
      console.log('   None');
    } else {
      categoriesWithLocalPaths.forEach((cat) => {
        console.log(`   • ${cat.name} (${cat.id})`);
        console.log(`     Path: ${cat.image_url || cat.image}`);
      });
    }

    console.log('\n❌ Categories without images:');
    if (categoriesWithoutImages.length === 0) {
      console.log('   None');
    } else {
      categoriesWithoutImages.forEach((cat) => {
        console.log(`   • ${cat.name} (${cat.id})`);
      });
    }

    console.log('\n' + '─'.repeat(80));
    console.log('\n📈 Summary:');
    console.log(`   Total categories: ${snapshot.size}`);
    console.log(`   With Storage URLs: ${categoriesWithStorageUrls.length}`);
    console.log(`   With local paths: ${categoriesWithLocalPaths.length}`);
    console.log(`   Without images: ${categoriesWithoutImages.length}`);

    if (categoriesWithLocalPaths.length > 0) {
      console.log('\n💡 Next Steps:');
      console.log('   1. Use the admin panel to upload new images for categories with local paths');
      console.log('   2. Or run the migration script to upload local images to Firebase Storage');
      console.log('   3. Local image paths will be replaced with Firebase Storage URLs');
    }

  } catch (error) {
    console.error('❌ Error checking categories:', error);
    throw error;
  } finally {
    // Clean up
    await admin.app().delete();
  }
}

// Run the script
checkCategoryImages()
  .then(() => {
    console.log('\n✅ Check complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
