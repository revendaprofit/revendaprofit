import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 60,
};

export default async function handler(req: any, res: any) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { products, bucket = 'product_images' } = req.body;
  const authHeader = req.headers.authorization;

  if (!products || !Array.isArray(products)) {
    return res.status(400).json({ error: 'Missing products array' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
     return res.status(500).json({ error: 'Server missing Supabase credentials' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
     global: { headers: { Authorization: authHeader || '' } }
  });

  const results = [];

  for (const product of products) {
    const { id, url, column = 'image_url' } = product;
    
    if (!url || url.includes('supabase.co')) {
       results.push({ id, column, status: 'skipped', reason: 'already_internal_or_empty' });
       continue;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
      
      const arrayBuffer = await response.arrayBuffer();
      
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      let extension = 'jpg';
      if (contentType.includes('png')) extension = 'png';
      else if (contentType.includes('webp')) extension = 'webp';
      else if (contentType.includes('gif')) extension = 'gif';

      const fileName = `${id}_${column}_${Date.now()}.${extension}`;
      const filePath = `imports/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, arrayBuffer, {
          contentType,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      const finalUrl = publicUrlData.publicUrl;

      // Update the database
      const updateData = { [column]: finalUrl };
      
      const { error: dbError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id);

      if (dbError) throw dbError;

      results.push({ id, column, status: 'success', finalUrl });

    } catch (err: any) {
      console.error(`Error processing ${id}:`, err.message);
      results.push({ id, column, status: 'error', error: err.message });
    }
  }

  return res.status(200).json({ results });
}
