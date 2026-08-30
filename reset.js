(() => {
  const APP_KEYS = ['pomodoroTimerStateV3', 'pomodoroTimerStateV2', 'pomodoroTimerState', 'pomodoroTimerStateV3_backup'];

  function addResetButton() {
    if (document.getElementById('fullResetBtn')) return;

    const card = document.querySelector('.card:last-of-type') || document.querySelector('.card');
    if (!card) return;

    const button = document.createElement('button');
    button.id = 'fullResetBtn';
    button.type = 'button';
    button.textContent = '🗑️ すべてのデータをリセット';
    button.style.cssText = [
      'width:100%', 'height:38px', 'margin-top:8px', 'border:.5px solid #d3d1c7',
      'border-radius:9px', 'background:#fff', 'color:#7a3b32', 'font:inherit',
      'font-size:12px', 'font-weight:500', 'cursor:pointer'
    ].join(';');

    button.addEventListener('click', () => {
      const ok = window.confirm('学習履歴、統計、目標、メモ、理解度、学習マップ、ドット絵の進捗など、タイマーアプリの保存データをすべて削除します。\n\nこの操作は元に戻せません。実行しますか？');
      if (!ok) return;

      APP_KEYS.forEach((key) => localStorage.removeItem(key));
      window.location.reload();
    });

    const title = card.querySelector('.section-title');
    if (title && title.parentElement === card) title.insertAdjacentElement('afterend', button);
    else card.appendChild(button);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addResetButton);
  else addResetButton();
})();
