export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error("Gagal memuat gambar logo: " + (err instanceof Error ? err.message : String(err))));
    img.src = src;
  });
}

export async function convertImageToEscPosRaster(imageSrc: string, targetWidth: number): Promise<Uint8Array> {
  if (!imageSrc) {
    return new Uint8Array(0);
  }

  const img = await loadImage(imageSrc);
  const width = Math.ceil(targetWidth / 8) * 8;
  
  const aspectRatio = img.height / img.width;
  const height = Math.round(width * aspectRatio);

  if (typeof document === 'undefined') {
    throw new Error("HTML Canvas API tidak tersedia di lingkungan non-browser");
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error("Gagal membuat 2D context pada Canvas");
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.drawImage(img, 0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const pixels = imgData.data;

  const xBytes = width / 8;
  const dataSize = xBytes * height;
  const bitmap = new Uint8Array(dataSize);

  for (let y = 0; y < height; y++) {
    for (let xByte = 0; xByte < xBytes; xByte++) {
      let byteVal = 0;
      for (let bit = 0; bit < 8; bit++) {
        const x = xByte * 8 + bit;
        const pixelIdx = (y * width + x) * 4;

        if (x >= width) continue;

        const r = pixels[pixelIdx];
        const g = pixels[pixelIdx + 1];
        const b = pixels[pixelIdx + 2];
        const a = pixels[pixelIdx + 3];

        let isBlack = 0;
        if (a >= 128) {
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
          if (luminance < 128) {
            isBlack = 1;
          }
        }

        if (isBlack) {
          byteVal |= (1 << (7 - bit));
        }
      }
      bitmap[y * xBytes + xByte] = byteVal;
    }
  }

  const header = new Uint8Array([
    0x1D, 0x76, 0x30, 0x00,
    xBytes & 0xFF, (xBytes >> 8) & 0xFF,
    height & 0xFF, (height >> 8) & 0xFF
  ]);

  const command = new Uint8Array(header.length + bitmap.length);
  command.set(header, 0);
  command.set(bitmap, header.length);

  return command;
}
