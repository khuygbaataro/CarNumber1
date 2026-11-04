// Reading a Cloudinary delivery URL on the client.
//
// A vehicle photo is stored as a *derived* URL: the untouched upload plus a
// transformation that resizes it and stamps the logo, phone chip and frame
// on. The original is still there — only the transformation stands between
// the two — which is what makes it possible to hand out a clean photo
// without re-uploading anything.

/**
 * The same image without the watermark, frame or resize.
 *
 *   /upload/w_1600,q_auto/l_logo.../v1712/dealership/images/abc.jpg
 *   /upload/v1712/dealership/images/abc.jpg
 *
 * The version segment is the anchor. Without one there is no safe way to
 * tell a transformation apart from a folder in the public id, so the URL is
 * returned untouched rather than guessed at.
 */
export function originalImageUrl(url: string): string {
  const cut = url.indexOf('/upload/');
  if (cut === -1) return url;
  const base = url.slice(0, cut);
  const parts = url.slice(cut + '/upload/'.length).split('/');
  const versionAt = parts.findIndex((part) => /^v\d+$/.test(part));
  if (versionAt <= 0) return url; // already clean, or no version to anchor on
  return `${base}/upload/${parts.slice(versionAt).join('/')}`;
}
