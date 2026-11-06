// Browser-only helpers: load a picture and read its pixels at a fixed size,
// so a giant phone photo and the official image are compared fairly.

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load image: ${src}`));
    img.src = src;
  });
}

function pixelsAtWidth(img, width) {
  const height = Math.max(1, Math.round((img.naturalHeight * width) / img.naturalWidth));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
}

export async function prepareImage(src) {
  const img = await loadImage(src);
  return {
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
    small: pixelsAtWidth(img, 300),
    medium: pixelsAtWidth(img, 500),
  };
}
