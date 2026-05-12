import { useState } from 'react';

// Google's lh3.googleusercontent.com blocks requests whose Referer header is not
// from a Google property — so localhost / your domain returns 403 unless we
// strip the referrer. `referrerPolicy="no-referrer"` solves that.
// onError still fires for genuine broken URLs → we fall back to the initial circle.

export default function ReviewAvatar({ src, name, size = 40, className = '' }) {
  const [failed, setFailed] = useState(false);
  const initial = ((name || 'A').trim()[0] || 'A').toUpperCase();
  const baseStyle = { width: size, height: size, minWidth: size, minHeight: size };

  if (!src || failed) {
    return (
      <div
        className={`gs-review-avatar gs-review-avatar--initial ${className}`}
        style={{ ...baseStyle, fontSize: Math.round(size * 0.45) }}
        aria-label={name}
      >
        {initial}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name || ''}
      className={`gs-review-avatar ${className}`}
      style={baseStyle}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
