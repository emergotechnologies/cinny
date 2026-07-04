import { getImageFileUrl, loadImageElement } from './dom';

export const REDACTABLE_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png'];

export type RedactionBox = {
  // fractions of the image dimensions, 0-1
  x: number;
  y: number;
  width: number;
  height: number;
};

export const uploadRedactedMedia = async (
  endpointUrl: string,
  accessToken: string,
  file: File
): Promise<string> => {
  const url = `${endpointUrl}?filename=${encodeURIComponent(file.name)}`;
  const res = await fetch(url, {
    method: 'POST',
    body: file,
    headers: {
      'Content-Type': file.type,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Redaction service responded with ${res.status}. ${body}`.trim());
  }
  const data = await res.json();
  const mxc = data?.content_uri;
  if (typeof mxc !== 'string' || !mxc.startsWith('mxc://')) {
    throw new Error('Redaction service returned an invalid upload response.');
  }
  return mxc;
};

export const compositeRedactionBoxes = async (
  imageBlob: Blob,
  mimeType: string,
  boxes: RedactionBox[]
): Promise<Blob> => {
  const imageUrl = getImageFileUrl(imageBlob);
  try {
    const img = await loadImageElement(imageUrl);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to create canvas context.');

    ctx.drawImage(img, 0, 0);
    ctx.fillStyle = 'white';
    boxes.forEach((box) => {
      ctx.fillRect(
        box.x * canvas.width,
        box.y * canvas.height,
        box.width * canvas.width,
        box.height * canvas.height
      );
    });

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to export redacted image.'));
        },
        mimeType,
        mimeType === 'image/jpeg' ? 0.92 : undefined
      );
    });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
};
