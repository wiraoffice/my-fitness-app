// src/utils/prefs.js
const KEY = "gusde_prefs_v1";

export const defaultPrefs = {
  weightKg: 100,    // berat default
  stepsPerKm: 1300, // akan dioverride oleh kalibrasi
  walkMET: 3.3,     // jalan santai ~4 km/jam
  cycleSpeed: 17,
  cycleMET: 6,
  weightsMET: 4.5,
  deviceBias: 1,        // 1 = tanpa bias
  useDeviceBias: false, // jika ingin output mirip Samsung Health, set true
};

export function getPrefs() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaultPrefs, ...JSON.parse(raw) } : { ...defaultPrefs };
  } catch {
    return { ...defaultPrefs };
  }
}

export function savePrefs(partial) {
  const merged = { ...getPrefs(), ...partial };
  localStorage.setItem(KEY, JSON.stringify(merged));
  return merged;
}
