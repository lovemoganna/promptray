export type MediaKind = 'image' | 'video' | 'audio' | 'unknown';

export function getMediaKind(url?: string): MediaKind {
  if (!url) return 'unknown';
  const lower = url.toLowerCase();
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(lower)) return 'video';
  if (/\.(mp3|wav|m4a|aac)(\?|$)/i.test(lower)) return 'audio';
  if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(lower)) return 'image';
  return 'unknown';
}

export function isVideo(url?: string) {
  return getMediaKind(url) === 'video';
}

export function isAudio(url?: string) {
  return getMediaKind(url) === 'audio';
}

export default { getMediaKind, isVideo, isAudio };


