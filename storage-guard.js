(() => {
  const KEY = 'pomodoroTimerStateV3';
  const BACKUP_KEY = 'pomodoroTimerStateV3_backup';
  const VALID_KEYS = new Set([KEY, 'pomodoroTimerStateV2', 'pomodoroTimerState']);

  const todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  function parse(raw) { try { return raw ? JSON.parse(raw) : null; } catch (_) { return null; } }
  function valid(s) {
    return !!(s && typeof s === 'object' && Array.isArray(s.sessions) && s.daily && typeof s.daily === 'object');
  }
  function get(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
  function set(key, value) { try { localStorage.setItem(key, value); } catch (_) {} }

  // IMPORTANT: the app previously treated a new calendar day as a reason to
  // erase the entire state. Keep the full history and only refresh the state
  // date so the app's existing loader will not discard anything.
  function normalize(raw) {
    const s = parse(raw);
    if (!valid(s)) return null;
    s.date = todayKey();
    if (!Array.isArray(s.sessions)) s.sessions = [];
    if (!s.daily || typeof s.daily !== 'object') s.daily = {};
    return JSON.stringify(s);
  }

  try {
    let primary = get(KEY);
    let backup = get(BACKUP_KEY);
    const p = parse(primary);
    const b = parse(backup);

    if (!valid(p) && valid(b)) {
      primary = normalize(backup);
      if (primary) set(KEY, primary);
    } else if (valid(p)) {
      const normalized = normalize(primary);
      if (normalized) {
        primary = normalized;
        set(KEY, normalized);
      }
    }

    const current = get(KEY);
    if (current && valid(parse(current))) set(BACKUP_KEY, current);
  } catch (_) {}

  // Mirror future saves to a second localStorage key. This is only a backup;
  // normal app behavior remains unchanged.
  try {
    const originalSetItem = localStorage.setItem.bind(localStorage);
    const originalRemoveItem = localStorage.removeItem.bind(localStorage);

    localStorage.setItem = function(key, value) {
      originalSetItem(key, value);
      if (key === KEY && valid(parse(value))) {
        try { originalSetItem(BACKUP_KEY, value); } catch (_) {}
      }
    };

    localStorage.removeItem = function(key) {
      originalRemoveItem(key);
      if (VALID_KEYS.has(key)) {
        try { originalRemoveItem(BACKUP_KEY); } catch (_) {}
      }
    };
  } catch (_) {}

  const sync = () => {
    const value = get(KEY);
    if (value && valid(parse(value))) set(BACKUP_KEY, value);
  };
  sync();
  window.addEventListener('pagehide', sync);
  window.addEventListener('beforeunload', sync);
})();
