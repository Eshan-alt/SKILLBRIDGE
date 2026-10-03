export function resumeLink(value: string) {
  if (!value.trim()) return null;
  const raw = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {const url = new URL(raw); return ['https:', 'http:'].includes(url.protocol) && url.hostname.includes('.') && !url.username && !url.password ? url.href : null;} catch {return null;}
}
