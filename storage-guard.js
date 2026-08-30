(() => {
  const KEY = 'pomodoroTimerStateV3';
  const BACKUP_KEY = 'pomodoroTimerStateV3_backup';
  const VALID_KEYS = new Set(['pomodoroTimerStateV3', 'pomodoroTimerStateV2', 'pomodoroTimerState']);

  function isValidState(value) {
    if (!value || typeof value !== 'object') return false;
    if (!('date' in value)) return false;
    if (!Array.isArray(value.sessions)) return false;
    if (!('daily' in value) || typeof value.daily !== 'object') return false;
    return true;
  }

  function rawGet(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }

  function rawSet(key, value) {
    try { localStorage.setItem(key, value); } catch (_) {}
  }

  // Restore the main state before the app's own script runs.
  try {
    const primary = rawGet(KEY);
    const backup = rawGet(BACKUP_KEY);
    if (backup) {
      let backupState = null;
      try { backupState = JSON.parse(backup); } catch (_) {}
      let primaryState = null;
      try { primaryState = primary ? JSON.parse(primary) : null; } catch (_) {}

      if (!isValidState(primaryState) && isValidState(backupState)) {
        rawSet(KEY, backup);
      } else if (isValidState(primaryState)) {
        rawSet(BACKUP_KEY, primary);
      }
    } else if (isValidState(primary ? JSON.parse(primary) : null)) {
      rawSet(BACKUP_KEY, primary);
    }
  } catch (_) {}

  // Mirror future saves/removals so normal app termination cannot lose the latest state.
  try {
    const originalSetItem = localStorage.setItem.bind(localStorage);
    const originalRemoveItem = localStorage.removeItem.bind(localStorage);

    localStorage.setItem = function(key, value) {
      originalSetItem(key, value);
      if (key === KEY && isValidSerializedState(value)) {
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

  function isValidSerializedState(value) {
    try { return isValidState(JSON.parse(value)); } catch (_) { return false; }
  }

  // Keep a backup shortly after startup too, including data written by the existing app before hooks settle.
  const sync = () => {
    const value = rawGet(KEY);
    if (value && isValidSerializedState(value)) rawSet(BACKUP_KEY, value);
  };
  sync();
  window.addEventListener('pagehide', sync);
  window.addEventListener('beforeunload', sync);
})();
