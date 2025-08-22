import { useEffect, useState } from "react";
import { getDaily, putDaily, getRange, getPref, putPref } from "./db";

export const iso = (d = new Date()) => d.toISOString().split("T")[0];

// ----- hari ini -----
export function useTodayLog() {
  const [date] = useState(iso());
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getDaily(date).then((v) => { if (alive) { setEntry(v || {}); setLoading(false); } });
    return () => { alive = false; };
  }, [date]);

  const save = async (patch) => {
    const merged = { ...(entry || {}), ...patch };
    await putDaily(date, merged);
    setEntry(merged);
    return true;
  };

  return { date, entry: entry || {}, setEntry, save, loading };
}

// ----- range minggu/bulan -----
export function useRangeLogs(startISO, endISO) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    let alive = true;
    getRange(startISO, endISO).then(v => { if (alive) setRows(v); });
    return () => { alive = false; };
  }, [startISO, endISO]);
  return rows;
}

// ----- prefs (pengaturan) -----
export function usePrefs(defaults) {
  const [prefs, setPrefs] = useState(defaults);
  useEffect(() => { getPref("calc_prefs", defaults).then(setPrefs); }, [defaults]);
  const savePrefs = async (next) => { await putPref("calc_prefs", next); setPrefs(next); };
  return [prefs, savePrefs];
}
