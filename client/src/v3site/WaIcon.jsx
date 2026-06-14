// WhatsApp glyph — inherits size via CSS, green by default. Use on every
// WhatsApp CTA across the v3 site.
export default function WaIcon({ className = 'v3s-wa' }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M16 3C9 3 3.5 8.5 3.5 15.5c0 2.3.6 4.5 1.8 6.4L3 29l7.3-2.2c1.8 1 3.8 1.5 5.7 1.5 7 0 12.5-5.5 12.5-12.5S23 3 16 3zm0 22.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-4.3 1.3 1.3-4.2-.3-.4a10.3 10.3 0 0 1-1.6-5.4C5.7 9.7 10.3 5.2 16 5.2S26.3 9.7 26.3 15.5 21.7 25.8 16 25.8zm5.7-7.7c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.1-.2.2-.3.2-.6.1-1.8-.9-3-1.6-4.2-3.6-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3 2.9 1.2 2.9.8 3.4.8.5 0 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.2-.3-.2-.6-.4z" />
    </svg>
  );
}
