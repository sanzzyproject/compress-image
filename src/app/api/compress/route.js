import { NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const quality = parseInt(formData.get('quality') || '70');

    // 1. Validasi Keberadaan File
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 2. Validasi Ukuran (Max 20MB)
    const MAX_SIZE = 20 * 1024 * 1024; // 20MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 20MB limit.' }, { status: 400 });
    }

    // 3. Validasi Tipe File
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file format. Please use JPG, PNG, or WEBP.' }, { status: 400 });
    }

    // 4. Proses Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    let processedImage;
    const options = { quality: quality, mozjpeg: true }; // mozjpeg for better compression

    // 5. Compress menggunakan Sharp
    if (file.type === 'image/png') {
        // PNG compression settings (quality acts differently for PNG in sharp, usually palette or compressionLevel)
        // Here we convert to efficient web-friendly PNG settings or fallback to JPEG if transparency isn't key, 
        // but to keep format:
        processedImage = await sharp(buffer)
            .png({ quality: quality, compressionLevel: 9, palette: true })
            .toBuffer();
    } else if (file.type === 'image/webp') {
        processedImage = await sharp(buffer)
            .webp({ quality: quality })
            .toBuffer();
    } else {
        // Default JPEG/JPG
        processedImage = await sharp(buffer)
            .jpeg({ quality: quality, mozjpeg: true })
            .toBuffer();
    }

    // 6. Return response
    return new NextResponse(processedImage, {
      status: 200,
      headers: {
        'Content-Type': file.type,
        'Content-Length': processedImage.length.toString(),
        'X-Original-Size': file.size.toString(),
        'X-Compressed-Size': processedImage.length.toString(),
      },
    });

  } catch (error) {
    console.error('Compression Error:', error);
    return NextResponse.json({ error: 'Internal Server Error during compression.' }, { status: 500 });
  }
}
