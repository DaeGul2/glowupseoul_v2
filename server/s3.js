// Presigned PUT URLs for admin direct-to-S3 uploads.
// No file goes through this server — admin's browser PUTs straight to S3,
// then sends the public URL back to admin CRUD to save in the DB row.
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';

let _client = null;

function client() {
  if (_client) return _client;
  _client = new S3Client({
    region: process.env.AWS_REGION || 'ap-northeast-2',
    credentials: {
      accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  return _client;
}

export function hasS3Config() {
  return Boolean(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.S3_BUCKET
  );
}

const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml',
]);

function extFromMime(mime) {
  return ({
    'image/jpeg':    'jpg',
    'image/png':     'png',
    'image/webp':    'webp',
    'image/avif':    'avif',
    'image/gif':     'gif',
    'image/svg+xml': 'svg',
  })[mime] || 'bin';
}

// Build a deterministic object key per (kind, owner_slug, slot).
// kind: 'procedures' | 'hospitals' | 'brands' | 'categories' | 'doctors' | 'ba'
// slot: 'thumbnail' | 'hero' | 'gallery' | 'logo' | 'portrait' | 'before' | 'after' | 'illustration'
// owner: stable slug ('hifu_face', 'hershe_청담점', 'soi', ...). For ba/* use the row id.
export function buildKey({ kind, owner, slot, mime }) {
  const ext = extFromMime(mime);
  const ts  = Date.now().toString(36);
  const safe = (s) => String(s || '').replace(/[^a-z0-9가-힣_-]/gi, '_').slice(0, 80);
  if (slot === 'gallery') {
    return `${kind}/${safe(owner)}/gallery/${ts}-${randomUUID().slice(0, 8)}.${ext}`;
  }
  return `${kind}/${safe(owner)}/${slot}-${ts}.${ext}`;
}

export function publicUrlFor(key) {
  const base = (process.env.S3_PUBLIC_BASE_URL || '').replace(/\/+$/, '');
  if (base) return `${base}/${key}`;
  const region = process.env.AWS_REGION || 'ap-northeast-2';
  return `https://${process.env.S3_BUCKET}.s3.${region}.amazonaws.com/${key}`;
}

// Returns { upload_url, public_url, key, expires_in, max_bytes }.
export async function presignPut({ kind, owner, slot, mime, size }) {
  if (!hasS3Config()) throw new Error('S3 not configured');
  if (!ALLOWED_MIME.has(mime)) throw new Error(`unsupported mime type: ${mime}`);

  const maxBytes = (Number(process.env.S3_MAX_UPLOAD_MB) || 10) * 1024 * 1024;
  if (size && size > maxBytes) {
    throw new Error(`file too large: ${size} > ${maxBytes}`);
  }

  const key = buildKey({ kind, owner, slot, mime });
  const cmd = new PutObjectCommand({
    Bucket:       process.env.S3_BUCKET,
    Key:          key,
    ContentType:  mime,
    CacheControl: 'public, max-age=31536000, immutable',
  });
  const upload_url = await getSignedUrl(client(), cmd, { expiresIn: 60 * 5 }); // 5 min
  return {
    upload_url,
    public_url: publicUrlFor(key),
    key,
    expires_in: 300,
    max_bytes:  maxBytes,
  };
}

export async function deleteObject(key) {
  if (!hasS3Config()) throw new Error('S3 not configured');
  await client().send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
}
