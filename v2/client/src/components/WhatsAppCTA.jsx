// Per CLAUDE.md: native scheme + web fallback (no wa.me).
const PHONE = '+82-10-6487-1060';

export function buildWhatsAppLinks({ hospitalName, procedureName, priceKrw, originalPrice, downtimeDays, painLevel }) {
  const lines = [
    '[Glow Up Seoul · v2 consultation]',
    '',
    hospitalName && `▸ Clinic: ${hospitalName}`,
    procedureName && `▸ Procedure: ${procedureName}`,
    priceKrw && `▸ From: ₩${priceKrw.toLocaleString()}${originalPrice ? ` (orig ₩${originalPrice.toLocaleString()})` : ''}`,
    downtimeDays != null && `▸ Downtime: ${downtimeDays} days`,
    painLevel != null && `▸ Pain: ${painLevel}/5`,
    '',
    'Could you help me with a recommendation?',
  ].filter(Boolean);
  const text = encodeURIComponent(lines.join('\n'));
  const phone = PHONE.replace(/[^0-9]/g, '');
  return {
    native: `whatsapp://send?phone=${phone}&text=${text}`,
    web: `https://web.whatsapp.com/send?phone=${phone}&text=${text}`,
  };
}

export default function WhatsAppCTA({ label = 'Talk to your Concierge', payload }) {
  const onClick = (e) => {
    e.preventDefault();
    const links = buildWhatsAppLinks(payload || {});
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = links.native;
      return;
    }
    let opened = false;
    const onBlur = () => { opened = true; };
    window.addEventListener('blur', onBlur, { once: true });
    window.location.href = links.native;
    setTimeout(() => {
      window.removeEventListener('blur', onBlur);
      if (!opened) window.open(links.web, '_blank');
    }, 1500);
  };
  return (
    <a href="#" onClick={onClick} className="gs-cta">{label}</a>
  );
}
