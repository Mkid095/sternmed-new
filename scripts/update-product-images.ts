/**
 * Update Product Images Script
 *
 * This script updates product images with URLs from scraped websites
 * and free medical stock images.
 *
 * Run with: npx tsx scripts/update-product-images.ts
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

// Product image mappings - using actual scraped product images
const PRODUCT_IMAGES: Record<string, string> = {
  // IV Cannulas - using actual product image from GSTC
  'I.V. Cannula 18G': 'https://www.gstc.com/wp-content/uploads/2017/03/I.V.-Cannula-with-wing-without-port-ISO.jpg',
  'I.V. Cannula 20G': 'https://www.gstc.com/wp-content/uploads/2017/03/I.V.-Cannula-with-wing-without-port-ISO.jpg',
  'I.V. Cannula 22G': 'https://www.gstc.com/wp-content/uploads/2017/03/I.V.-Cannula-with-wing-without-port-ISO.jpg',

  // Infant Feeding Tubes - using medical stock images
  'Infant Feeding Tube 5FG': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
  'Infant Feeding Tube 6FG': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
  'Infant Feeding Tube 8FG': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',

  // Urine Bags - using medical equipment image
  'Urine Collection Bag 2000ml': 'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=800&q=80',

  // Blood Transfusion Sets - using actual product image from IndiaMART
  'Blood Transfusion Set': 'https://5.imimg.com/data5/YS/AK/SQ/SELLER-85172/economy-iv-infusion-set-1000x1000.jpg',

  // IV Fluid Infusion Sets - using actual product image from IndiaMART
  'I.V. Fluid Infusion Set (Without Airvent)': 'https://5.imimg.com/data5/YS/AK/SQ/SELLER-85172/economy-iv-infusion-set-1000x1000.jpg',
  'I.V. Fluid Infusion Set (With Airvent)': 'https://5.imimg.com/data5/YS/AK/SQ/SELLER-85172/economy-iv-infusion-set-1000x1000.jpg',

  // Nebulizer Masks - using medical stock images
  'Nebulizer Mask Adult': 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=800&q=80',
  'Nebulizer Mask Paediatric': 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=800&q=80',
  'Nebulizer Mask Infant': 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=800&q=80',

  // Foley Catheters - using actual product images from medica100.com
  'Foley Catheter 2Way FR 12': 'https://www.medica100.com/images/virtuemart/product/18635/e_18635_2.jpg',
  'Foley Catheter 2Way FR 14': 'https://www.medica100.com/images/virtuemart/product/18637/e_18637_2.jpg',
  'Foley Catheter 2Way FR 16': 'https://www.medica100.com/images/virtuemart/product/18637/e_18637_2.jpg',
};

/**
 * Update product image URL
 */
async function updateProductImage(productName: string, imageUrl: string): Promise<void> {
  const { data, error } = await supabase
    .from('products')
    .update({ image_url: imageUrl })
    .ilike('name', productName)
    .select('id, name');

  if (error) {
    console.error(`Error updating image for ${productName}:`, error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log(`✓ Updated image for: ${productName}`);
  } else {
    console.warn(`⚠ Product not found: ${productName}`);
  }
}

/**
 * Main update function
 */
async function updateProductImages(): Promise<void> {
  console.log('=== Updating Product Images ===\n');

  for (const [productName, imageUrl] of Object.entries(PRODUCT_IMAGES)) {
    await updateProductImage(productName, imageUrl);
  }

  console.log('\n=== Image Update Complete ===');
  console.log(`Total products updated: ${Object.keys(PRODUCT_IMAGES).length}`);
}

// Run the update
updateProductImages()
  .then(() => {
    console.log('\nScript completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
