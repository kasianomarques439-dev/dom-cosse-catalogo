export function matchesImageSignature(contentType: string, header: Uint8Array) {
  const jpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => header[index] === byte);
  const webp = String.fromCharCode(...header.slice(0, 4)) === 'RIFF' && String.fromCharCode(...header.slice(8, 12)) === 'WEBP';
  return contentType === 'image/jpeg' && jpeg || contentType === 'image/png' && png || contentType === 'image/webp' && webp;
}
