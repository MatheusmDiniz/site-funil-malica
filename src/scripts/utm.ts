const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const;

const STORAGE_KEY = 'malica_utm_params';

export type UtmParams = Partial<Record<(typeof UTM_KEYS)[number], string>>;

export function captureUtmParams(): UtmParams {
  const params = new URLSearchParams(window.location.search);
  const fromUrl: UtmParams = {};

  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) fromUrl[key] = value;
  }

  if (Object.keys(fromUrl).length > 0) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fromUrl));
    return fromUrl;
  }

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as UtmParams) : {};
  } catch {
    return {};
  }
}

export function getUtmParams(): UtmParams {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as UtmParams) : {};
  } catch {
    return {};
  }
}

export function initUtmCapture(): void {
  captureUtmParams();
}
