const RECENT_TOOLS_KEY = 'intime_pdf_recent_tools';
const FAVORITES_KEY = 'intime_pdf_favorites';
const THEME_KEY = 'intime_pdf_theme';

export function getRecentToolIds(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_TOOLS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordRecentTool(toolId: string): void {
  try {
    const current = getRecentToolIds().filter((id) => id !== toolId);
    const updated = [toolId, ...current].slice(0, 8);
    localStorage.setItem(RECENT_TOOLS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors in private mode
  }
}

export function getFavoriteToolIds(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : ['merge-pdf', 'split-pdf', 'compress-pdf', 'pdf-to-images'];
  } catch {
    return ['merge-pdf', 'split-pdf', 'compress-pdf', 'pdf-to-images'];
  }
}

export function toggleFavoriteToolId(toolId: string): string[] {
  try {
    const current = getFavoriteToolIds();
    const next = current.includes(toolId)
      ? current.filter((id) => id !== toolId)
      : [...current, toolId];
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}

export function getStoredTheme(): 'light' | 'dark' {
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t === 'dark' || t === 'light') return t;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function setStoredTheme(theme: 'light' | 'dark'): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Ignore
  }
}
