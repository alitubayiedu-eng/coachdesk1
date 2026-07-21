// هوک‌های کمکی برای کار با داده‌های async از Supabase
import { useState, useEffect, useCallback } from "react";

// یک مقدار async را لود می‌کند و در صورت تغییر deps دوباره می‌گیرد.
// خروجی: [value, loading, reload]
export function useAsync(fn, deps = []) {
  const [value, setValue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick(t => t + 1), []);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.resolve(fn())
      .then(v => { if (alive) { setValue(v); setLoading(false); } })
      .catch(e => { if (alive) { console.error(e); setLoading(false); } });
    return () => { alive = false; };
    // eslint-disable-next-line
  }, [...deps, tick]);
  return [value, loading, reload];
}
