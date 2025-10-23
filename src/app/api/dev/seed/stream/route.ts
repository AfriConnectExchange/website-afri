import { createServerAdminClient } from '@/lib/supabase/serverAdminClient';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const push = (msg: string) => {
        controller.enqueue(encoder.encode(`data: ${msg}\n\n`));
      };

      push('Starting seeding process...');

      try {
        const supabase = await createServerAdminClient();

        // Load mock products from repo
        let products: any[] = [];
        try {
          // Read mock data from disk at runtime to avoid bundler import resolution
          const dataPath = path.join(process.cwd(), 'src', 'data', 'mock-products.json');
          const raw = await fs.readFile(dataPath, 'utf8');
          products = JSON.parse(raw);
          if (!Array.isArray(products)) products = [];
          push(`Loaded ${products.length} mock products from ${dataPath}`);
        } catch (err) {
          push('Failed to load mock-products.json: ' + String(err));
          controller.close();
          return;
        }

        // Ensure a demo seller exists
        push('Ensuring demo seller exists...');
        const demoEmail = 'dev-seed@local';
        const { data: userRows } = (await supabase
          .from('users')
          .select('id')
          .eq('email', demoEmail)
          .limit(1)) as any;

        let demoUserId: string | null = null;
        if (userRows && userRows.length > 0) {
          demoUserId = userRows[0].id;
          push(`Found existing demo user: ${demoUserId}`);
        } else {
          const { data: insertUser, error: insertErr } = (await supabase
            .from('users')
            .insert(({ email: demoEmail, full_name: 'Dev Seeder', status: 'active', email_verified: true }) as any)
            .select('id')
            .limit(1)
            .single()) as any;

          if (insertErr) {
            push('Failed to create demo user: ' + JSON.stringify(insertErr));
            controller.close();
            return;
          }
          demoUserId = insertUser.id;
          push(`Created demo user: ${demoUserId}`);
        }

        // Helper: slugify
        const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        // Track created categories to avoid repeated DB calls
        const categoryCache = new Map<string, string>();

        const total = products.length;
        let processed = 0;

        for (const p of products) {
          const title = p.title ?? p.name ?? 'Untitled';
          push(`Processing: ${title}`);

          // category handling
          const catName = p.category || 'Uncategorized';
          const catSlug = slugify(String(catName));

          let categoryId = categoryCache.get(catSlug);
          if (!categoryId) {
            // try find
            const { data: existingCat } = (await supabase
              .from('categories')
              .select('id')
              .eq('slug', catSlug)
              .limit(1)) as any;

            if (existingCat && existingCat.length > 0) {
              categoryId = existingCat[0].id;
              push(`Found category '${catName}' -> ${categoryId}`);
            } else {
              const { data: newCat, error: catErr } = (await supabase
                .from('categories')
                .insert(({ name: catName, slug: catSlug, description: null, display_order: 0, is_active: true }) as any)
                .select('id')
                .limit(1)
                .single()) as any;

              if (catErr) {
                push(`Failed to create category '${catName}': ${JSON.stringify(catErr)}`);
                // continue but do not crash
              } else {
                categoryId = newCat.id;
                push(`Created category '${catName}' -> ${categoryId}`);
              }
            }
            if (categoryId) categoryCache.set(catSlug, categoryId);
          }

          // prepare product object for insert
          const productInsert: any = {
            seller_id: demoUserId,
            category_id: categoryId,
            title: title,
            slug: slugify(title),
            description: p.description ?? null,
            price: p.price ?? null,
            currency: p.currency ?? 'GBP',
            images: p.images ?? [],
            tags: p.tags ?? [],
            is_active: p.status === 'active' || true,
            quantity_available: p.quantity_available ?? p.stockCount ?? 0,
            created_at: p.created_at ?? null,
            updated_at: p.updated_at ?? null,
          };

          const { data: prodData, error: prodErr } = (await supabase
            .from('products')
            .insert(productInsert as any)
            .select('id')
            .limit(1)
            .single()) as any;

          if (prodErr) {
            push(`Failed to insert product '${title}': ${JSON.stringify(prodErr)}`);
          } else {
            push(`Inserted product '${title}' id=${prodData.id}`);
          }

          processed += 1;
          push(`Progress: ${processed}/${total}`);
        }

        push('Seeding complete');
        push('event: done\n');
        controller.close();
      } catch (err) {
        push('Unexpected error: ' + String(err));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
