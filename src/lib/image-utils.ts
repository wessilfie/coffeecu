/**
 * Client-side image compression using Canvas API.
 * Resizes and compresses images to keep them under a target size (ideally < 5MB).
 * Falls back to original file if Canvas API is unavailable or compression fails.
 */

export interface CompressionOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number; // 0 to 1
}

const DEFAULT_OPTIONS: CompressionOptions = {
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 0.85,
};

export async function compressImage(
    file: File,
    options: CompressionOptions = {}
): Promise<File> {
    const { maxWidth, maxHeight, quality } = { ...DEFAULT_OPTIONS, ...options };

    // 1. Basic Availability Check
    if (typeof window === 'undefined' || !window.HTMLCanvasElement || !window.URL) {
        console.warn('[image-utils] Canvas API or URL API not available, skipping compression.');
        return file;
    }

    // Only compress images
    if (!file.type.startsWith('image/')) {
        return file;
    }

    try {
        const bitmap = await createImageBitmap(file);
        let { width, height } = bitmap;

        // 2. Calculate new dimensions (maintain aspect ratio)
        if (width > maxWidth! || height > maxHeight!) {
            const ratio = Math.min(maxWidth! / width, maxHeight! / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            console.warn('[image-utils] Could not get canvas context, skipping compression.');
            return file;
        }

        // 3. Draw and Compress
        ctx.drawImage(bitmap, 0, 0, width, height);

        return new Promise((resolve) => {
            // Use image/jpeg for most efficient compression (even if source is PNG)
            // unless user needs transparency, but for profile photos JPEG is usually best.
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        console.warn('[image-utils] toBlob failed, skipping compression.');
                        resolve(file);
                        return;
                    }

                    // Don't return if larger than original (rare, but possible with high quality)
                    if (blob.size >= file.size) {
                        resolve(file);
                        return;
                    }

                    const compressedFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    });

                    console.log(`[image-utils] Compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
                    resolve(compressedFile);
                },
                'image/jpeg',
                quality
            );
        });
    } catch (err) {
        console.error('[image-utils] Compression error:', err);
        return file;
    }
}
