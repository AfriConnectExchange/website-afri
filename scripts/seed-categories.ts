// scripts/seed-categories.ts
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import the service account key using ES module syntax
import serviceAccount from '../creds.json' with { type: 'json' };

// Replicate __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
  });
}

const db = admin.firestore();
const categoriesCollection = db.collection('categories');

interface CategorySeed {
  name: string;
  image?: string;
  children?: CategorySeed[];
}

const createSlug = (name: string): string => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

const seedCategories = async () => {
  console.log('Starting category seeding...');

  // Clear existing categories to prevent duplicates
  console.log('Deleting existing categories...');
  const existingCategories = await categoriesCollection.get();
  const deletePromises: Promise<FirebaseFirestore.WriteResult>[] = [];
  existingCategories.forEach(doc => {
    deletePromises.push(doc.ref.delete());
  });
  await Promise.all(deletePromises);
  console.log('Existing categories deleted.');

  // Read the v2 seed data (top-level categories with nested subcategories)
  const seedPath = path.join(__dirname, '../src/data/categories.v2.json');
  const categoriesSeed: CategorySeed[] = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

  // Recursive function to add categories
  const addCategory = async (category: CategorySeed, parentId: string | null = null) => {
    const slug = createSlug(category.name);
    
    const categoryData: any = {
      name: category.name,
      slug: slug,
      parent_id: parentId,
      image: category.image || null,
      is_active: true,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await categoriesCollection.add(categoryData);
    console.log(`Added category: ${category.name} (ID: ${docRef.id})`);

    if (category.children && category.children.length > 0) {
      for (const child of category.children) {
        await addCategory(child, docRef.id); // Pass parent's new ID
      }
    }
  };

  // Start the seeding process
  for (const category of categoriesSeed) {
    await addCategory(category);
  }

  console.log('Category seeding completed successfully!');
};

seedCategories().catch(error => {
  console.error('Error seeding categories:', error);
  process.exit(1);
});
