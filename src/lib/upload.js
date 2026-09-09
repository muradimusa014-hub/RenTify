import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';

export async function saveFile(file, subFolder) {
  if (!file || typeof file.arrayBuffer !== 'function') {
    return null;
  }
  
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  const timestamp = Date.now();
  const cleanName = (file.name || 'image.jpg').replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniqueName = `${timestamp}_${cleanName}`;

  // 1. Try Supabase Storage if credentials exist
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const baseUrl = supabaseUrl.replace(/\/$/, '');
      const uploadUrl = `${baseUrl}/storage/v1/object/${subFolder}/${uniqueName}`;
      
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apiKey': supabaseKey,
          'Content-Type': file.type || 'image/jpeg',
          'x-upsert': 'true',
        },
        body: buffer,
      });

      if (res.ok) {
        return `${baseUrl}/storage/v1/object/public/${subFolder}/${uniqueName}`;
      } else {
        const errText = await res.text();
        console.warn(`Supabase Storage upload (${res.status}):`, errText);
      }
    } catch (err) {
      console.warn('Supabase Storage upload failed:', err.message);
    }
  }
  
  // 2. Try Local File System (Works in local dev, fails on read-only serverless like Vercel)
  try {
    const uploadDir = join(process.cwd(), 'public', 'uploads', subFolder);
    await mkdir(uploadDir, { recursive: true });
    
    const filePath = join(uploadDir, uniqueName);
    await writeFile(filePath, buffer);
    
    return `/uploads/${subFolder}/${uniqueName}`;
  } catch (fsErr) {
    console.warn('Local filesystem write failed (read-only environment):', fsErr.message);
  }

  // 3. Fallback: Data URL (Ensures property upload never crashes on Vercel)
  const mimeType = file.type || 'image/jpeg';
  const base64 = buffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

export async function deleteFile(relativePath) {
  if (!relativePath) return;
  try {
    const fs = await import('fs');
    const filePath = join(process.cwd(), 'public', relativePath.replace(/^\//, ''));
    if (fs.existsSync(filePath)) {
      await unlink(filePath);
    }
  } catch (err) {
    console.error('Failed to delete file:', relativePath, err);
  }
}

