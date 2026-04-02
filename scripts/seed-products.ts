/**
 * Product Seeding Script
 *
 * This script:
 * 1. Deletes all existing products
 * 2. Creates new categories for medical products
 * 3. Creates new products with scraped data
 *
 * Run with: npx tsx scripts/seed-products.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Product data from web scraping
const PRODUCT_DATA = [
  // IV Cannulas
  {
    name: 'I.V. Cannula 18G',
    description: 'IV Cannula With Wings and Ports - 18G size. Winged design with injection port for secure connection and easy medication administration.',
    price: 150,
    stock: 8,
    category: 'IV Cannulas',
    isFeatured: true
  },
  {
    name: 'I.V. Cannula 20G',
    description: 'IV Cannula With Wings and Ports - 20G size. Winged design with injection port for secure connection and easy medication administration.',
    price: 150,
    stock: 10,
    category: 'IV Cannulas',
    isFeatured: true
  },
  {
    name: 'I.V. Cannula 22G',
    description: 'IV Cannula With Wings and Ports - 22G size. Winged design with injection port for secure connection and easy medication administration.',
    price: 150,
    stock: 10,
    category: 'IV Cannulas',
    isFeatured: true
  },

  // Infant Feeding Tubes
  {
    name: 'Infant Feeding Tube 5FG',
    description: 'Infant Feeding Tube - 5 French Gauge size. Medical-grade PVC tube for neonatal and infant feeding. Sterile, single-use.',
    price: 80,
    stock: 8,
    category: 'Infant Feeding Tubes',
    isFeatured: false
  },
  {
    name: 'Infant Feeding Tube 6FG',
    description: 'Infant Feeding Tube - 6 French Gauge size. Medical-grade PVC tube for neonatal and infant feeding. Sterile, single-use.',
    price: 80,
    stock: 8,
    category: 'Infant Feeding Tubes',
    isFeatured: false
  },
  {
    name: 'Infant Feeding Tube 8FG',
    description: 'Infant Feeding Tube - 8 French Gauge size. Medical-grade PVC tube for neonatal and infant feeding. Sterile, single-use.',
    price: 80,
    stock: 16,
    category: 'Infant Feeding Tubes',
    isFeatured: false
  },

  // Urine Bags
  {
    name: 'Urine Collection Bag 2000ml',
    description: 'Urine Collection Bag with Bottom Outlet, Sterile 2000ml capacity. Medical-grade vinyl bag with non-reflux valve and drainage tap.',
    price: 250,
    stock: 45,
    category: 'Urine Bags',
    isFeatured: true
  },

  // Blood Transfusion Sets
  {
    name: 'Blood Transfusion Set',
    description: 'Blood Transfusion Set (Economy) Without Airvent. PVC tubing with roller clamp for accurate flow control. Sterile, single-use.',
    price: 180,
    stock: 20,
    category: 'Blood Transfusion Sets',
    isFeatured: false
  },

  // IV Fluid Infusion Sets
  {
    name: 'I.V. Fluid Infusion Set (Without Airvent)',
    description: 'Economy IV Infusion Set without airvent. PVC material, ISO compliant. For intravenous fluid administration. Sterile, single-use.',
    price: 120,
    stock: 14,
    category: 'IV Fluid Infusion Sets',
    isFeatured: true
  },
  {
    name: 'I.V. Fluid Infusion Set (With Airvent)',
    description: 'Economy IV Infusion Set with airvent. PVC material, ISO compliant. For intravenous fluid administration. Sterile, single-use.',
    price: 130,
    stock: 25,
    category: 'IV Fluid Infusion Sets',
    isFeatured: true
  },

  // Nebulizer Masks
  {
    name: 'Nebulizer Mask Adult',
    description: 'Nebulizer Mask Aerosol Therapy - Adult size. Soft contour mask for comfortable aerosol medication delivery. Universal connector.',
    price: 200,
    stock: 14,
    category: 'Nebulizer Masks',
    isFeatured: false
  },
  {
    name: 'Nebulizer Mask Paediatric',
    description: 'Nebulizer Mask Aerosol Therapy - Paediatric size. Soft contour mask for comfortable aerosol medication delivery. Universal connector.',
    price: 200,
    stock: 14,
    category: 'Nebulizer Masks',
    isFeatured: false
  },
  {
    name: 'Nebulizer Mask Infant',
    description: 'Nebulizer Mask Aerosol Therapy - Infant size. Soft contour mask for comfortable aerosol medication delivery. Universal connector.',
    price: 200,
    stock: 14,
    category: 'Nebulizer Masks',
    isFeatured: false
  },

  // Foley Catheters
  {
    name: 'Foley Catheter 2Way FR 12',
    description: '2Way Foley Catheter Latex - French Size 12 (4mm). Silicone-elastomer coated latex balloon catheter. Sterile, single-use.',
    price: 180,
    stock: 20,
    category: 'Foley Catheters',
    isFeatured: true
  },
  {
    name: 'Foley Catheter 2Way FR 14',
    description: '2Way Foley Catheter Latex - French Size 14 (4.7mm). Silicone-elastomer coated latex balloon catheter. Sterile, single-use.',
    price: 180,
    stock: 50,
    category: 'Foley Catheters',
    isFeatured: true
  },
  {
    name: 'Foley Catheter 2Way FR 16',
    description: '2Way Foley Catheter Latex - French Size 16 (5.3mm). Silicone-elastomer coated latex balloon catheter. Sterile, single-use.',
    price: 180,
    stock: 25,
    category: 'Foley Catheters',
    isFeatured: true
  },
];

// Default image placeholder (will be updated when images are uploaded)
const DEFAULT_IMAGE_URL = 'https://res.cloudinary.com/your-cloud/image/upload/v1/placeholder-product.jpg';

/**
 * Delete all products from the database
 */
async function deleteAllProducts(): Promise<void> {
  console.log('Deleting all existing products...');
  const { error } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) {
    console.error('Error deleting products:', error.message);
    throw error;
  }
  console.log('✓ All products deleted');
}

/**
 * Get or create a category by name
 */
async function getOrCreateCategory(name: string): Promise<string> {
  // Try to find existing category
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .ilike('name', name)
    .single();

  if (existing) {
    return existing.id;
  }

  // Create new category
  console.log(`Creating category: ${name}`);
  const { data, error } = await supabase
    .from('categories')
    .insert({
      name,
      show_on_home: true,
    })
    .select('id')
    .single();

  if (error) {
    console.error(`Error creating category ${name}:`, error.message);
    throw error;
  }

  console.log(`✓ Category created: ${name} (ID: ${data.id})`);
  return data.id;
}

/**
 * Create a product
 */
async function createProduct(product: typeof PRODUCT_DATA[0], categoryId: string): Promise<void> {
  const { data, error } = await supabase
    .from('products')
    .insert({
      name: product.name,
      description: product.description,
      price: product.price,
      category_id: categoryId,
      image_url: DEFAULT_IMAGE_URL,
      stock: product.stock,
      is_featured: product.isFeatured,
    })
    .select('id')
    .single();

  if (error) {
    console.error(`Error creating product ${product.name}:`, error.message);
    throw error;
  }

  console.log(`✓ Product created: ${product.name} (ID: ${data.id}, Stock: ${product.stock})`);
}

/**
 * Main seeding function
 */
async function seedProducts(): Promise<void> {
  console.log('=== Starting Product Seeding ===\n');

  try {
    // Step 1: Delete all existing products
    await deleteAllProducts();
    console.log('');

    // Step 2: Create categories and products
    const categoryMap = new Map<string, string>();

    for (const product of PRODUCT_DATA) {
      // Get or create category
      if (!categoryMap.has(product.category)) {
        const categoryId = await getOrCreateCategory(product.category);
        categoryMap.set(product.category, categoryId);
      }

      // Create product
      await createProduct(product, categoryMap.get(product.category)!);
    }

    console.log('\n=== Seeding Complete ===');
    console.log(`Total products created: ${PRODUCT_DATA.length}`);
    console.log(`Total categories: ${categoryMap.size}`);
    console.log('\nNote: Products have placeholder images. Update image_url in the database with actual product images.');

  } catch (error) {
    console.error('\nSeeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding
seedProducts()
  .then(() => {
    console.log('\nScript completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
