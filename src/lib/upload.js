import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';

export async function saveFile(file, subFolder) {
  if (!file || typeof file.arrayBuffer !== 'function') {
    return null;
  }
  
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  const timestamp = Date.now();
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniqueName = `${timestamp}_${cleanName}`;
  
  const uploadDir = join(process.cwd(), 'public', 'uploads', subFolder);
  await mkdir(uploadDir, { recursive: true });
  
  const filePath = join(uploadDir, uniqueName);
  await writeFile(filePath, buffer);
  
  return `/uploads/${subFolder}/${uniqueName}`;
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
