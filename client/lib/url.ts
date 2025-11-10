export function toSearchParams(params: Record<string, string | undefined>): URLSearchParams {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === 'string' && v.length > 0) {
      sp.append(k, v);
    }
  }
  return sp;
}
