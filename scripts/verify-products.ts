import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
);

(async () => {
  const { data: products } = await supabase
    .from('products')
    .select('name, stock, price, image_url')
    .order('name');

  console.log('\n=== Products in Database ===\n');
  products?.forEach(p => {
    console.log(`• ${p.name}`);
    console.log(`  Stock: ${p.stock} | Price: Ksh ${p.price}`);
    console.log(`  Image: ${p.image_url.substring(0, 60)}...`);
    console.log('');
  });
  console.log(`Total products: ${products?.length}`);
})();
