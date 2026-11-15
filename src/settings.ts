// The parent's switches, kept on the device. Reached only through the hidden
// long press in the top-left corner.

export const settings = {
  muted: false,
  /** Less movement: no sway, squash, glide or big splashes. */
  reduceMotion: false,
};

const KEY = 'stackle.settings';

try {
  Object.assign(settings, JSON.parse(localStorage.getItem(KEY) ?? '{}'));
} catch {
  // Unreadable: keep the defaults.
}

export function saveSettings(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Storage blocked: the switches still work until the app closes.
  }
}
