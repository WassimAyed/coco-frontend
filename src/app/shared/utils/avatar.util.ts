const AVATAR_BACKGROUNDS = ['#991b1b', '#7f1d1d', '#1f2937', '#334155'];

function hashValue(value: string): number {
  return Array.from(value).reduce((total, character) => total + character.charCodeAt(0), 0);
}

export function createAvatarDataUrl(fullName: string): string {
  const normalizedName = fullName.trim() || 'ESPRIT Life';
  const initials = normalizedName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
  const background = AVATAR_BACKGROUNDS[hashValue(normalizedName) % AVATAR_BACKGROUNDS.length];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
      <rect width="128" height="128" rx="32" fill="${background}" />
      <circle cx="94" cy="34" r="12" fill="rgba(255,255,255,0.14)" />
      <text x="64" y="74" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="42" font-weight="700" fill="#ffffff">
        ${initials || 'EL'}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
