// Preserve saved Pomodoro data across app restarts and calendar-day changes.
// The app historically cleared all data when the saved state's date differed from today.
// This shim keeps the stored snapshot date current so the app restores the snapshot instead.
(function(){
  const KEY='pomodoroTimerStateV3';
  const originalGetItem=Storage.prototype.getItem;
  Storage.prototype.getItem=function(key){
    const value=originalGetItem.call(this,key);
    if(key!==KEY || !value) return value;
    try{
      const state=JSON.parse(value);
      if(state && typeof state==='object' && state.date){
        const now=new Date();
        const today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
        if(state.date!==today){
          state.date=today;
          return JSON.stringify(state);
        }
      }
    }catch(_){ }
    return value;
  };
})();
