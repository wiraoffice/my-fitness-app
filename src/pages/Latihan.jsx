import React, { useState, useEffect, useContext, createContext } from "react";
import { useTodayLog } from "../lib/useLogs";
import { getDaily, putDaily, getRange } from "../lib/db";

/* ============ UI mini-primitives ============ */
function Card({ className = "", children }) {
  return <div className={`bg-white rounded-2xl shadow ${className}`}>{children}</div>;
}
function Button({ className = "", children, ...props }) {
  return (
    <button
      className={`px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
const TabsCtx = createContext(null);
function Tabs({ defaultValue, children }) {
  const [value, setValue] = useState(defaultValue);
  return <TabsCtx.Provider value={{ value, setValue }}>{children}</TabsCtx.Provider>;
}
function TabsList({ children }) { return <div className="flex gap-2 mb-3">{children}</div>; }
function TabsTrigger({ value: val, children }) {
  const ctx = useContext(TabsCtx);
  const active = ctx?.value === val;
  return (
    <button
      onClick={() => ctx?.setValue(val)}
      className={`px-3 py-2 rounded-xl text-sm ${active ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
    >
      {children}
    </button>
  );
}
function TabsContent({ value: val, children }) {
  const ctx = useContext(TabsCtx);
  if (!ctx || ctx.value !== val) return null;
  return <div>{children}</div>;
}
function Progress({ value = 0, className = "" }) {
  const v = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div className={`w-full h-2 rounded bg-gray-200 overflow-hidden ${className}`}>
      <div className="h-full bg-green-500" style={{ width: `${v}%` }} />
    </div>
  );
}

/* ============ Helpers ============ */
const isoDate = (d = new Date()) => d.toISOString().split("T")[0];
const dayNameID = (dateStr) => {
  const d = new Date(dateStr);
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  return days[d.getDay()];
};
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
const addMonths = (date, n) => new Date(date.getFullYear(), date.getMonth() + n, 1);
const fmtMonthTitle = (date) => date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

/* ============ Month matrix (kalender) ============ */
const monthMatrix = (date) => {
  const start = startOfMonth(date);
  const firstWeekday = start.getDay(); // Minggu=0
  const matrix = [];
  let current = new Date(start);
  current.setDate(1 - firstWeekday);
  for (let w = 0; w < 6; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    matrix.push(week);
  }
  return matrix;
};

/* ============ Preset per-hari (A=Jalan, B=Sepeda+Beban) ============ */
const PRESETS = {
  Senin:  { morningSteps: 5000, walkEveningSteps: 5000, bikeKm: 8, weights: [
    { name: "Dumbbell Curl", sets: 3, reps: 12, weightKg: 0, restSec: 60, intensityMET: 5, tempoSecPerRep: 3 },
    { name: "Floor Press",   sets: 3, reps: 12, weightKg: 0, restSec: 60, intensityMET: 5, tempoSecPerRep: 3 },
  ]},
  Selasa: { morningSteps: 5000, walkEveningSteps: 5000, bikeKm: 5, weights: [
    { name: "Barbell Squat", sets: 4, reps: 8,  weightKg: 0, restSec: 90, intensityMET: 6.5, tempoSecPerRep: 3 },
    { name: "Deadlift",      sets: 3, reps: 10, weightKg: 0, restSec: 90, intensityMET: 6.5, tempoSecPerRep: 3 },
    { name: "Plank",         sets: 3, reps: 1,  weightKg: 0, restSec: 45, intensityMET: 3.5, tempoSecPerRep: 60 },
  ]},
  Rabu:   { morningSteps: 5000, walkEveningSteps: 5000, bikeKm: 5, weights: [
    { name: "Floor Press",             sets: 4, reps: 10, weightKg: 0, restSec: 75, intensityMET: 6,   tempoSecPerRep: 3 },
    { name: "Dumbbell Shoulder Press", sets: 3, reps: 10, weightKg: 0, restSec: 60, intensityMET: 5.5, tempoSecPerRep: 3 },
    { name: "Barbell Row",             sets: 3, reps: 10, weightKg: 0, restSec: 75, intensityMET: 6,   tempoSecPerRep: 3 },
  ]},
  Kamis:  { morningSteps: 3500, walkEveningSteps: 5000, bikeKm: 7, weights: [
    { name: "Bodyweight Squat", sets: 3, reps: 15, weightKg: 0, restSec: 45, intensityMET: 4, tempoSecPerRep: 2 },
    { name: "Side Plank",       sets: 3, reps: 1,  weightKg: 0, restSec: 45, intensityMET: 3.5, tempoSecPerRep: 40 },
  ]},
  Jumat:  { morningSteps: 5000, walkEveningSteps: 5000, bikeKm: 5, weights: [
    { name: "Floor Press",  sets: 4, reps: 10, weightKg: 0, restSec: 75, intensityMET: 6,   tempoSecPerRep: 3 },
    { name: "Side Raise",   sets: 3, reps: 12, weightKg: 0, restSec: 60, intensityMET: 4.5, tempoSecPerRep: 2 },
    { name: "Close-grip Push-up", sets: 3, reps: 10, weightKg: 0, restSec: 60, intensityMET: 4.5, tempoSecPerRep: 2 },
  ]},
  Sabtu:  { morningSteps: 5000, walkEveningSteps: 5000, bikeKm: 5, weights: [
    { name: "Barbell Deadlift", sets: 4, reps: 8,  weightKg: 0, restSec: 90, intensityMET: 6.5, tempoSecPerRep: 3 },
    { name: "Bent-over Row",    sets: 3, reps: 10, weightKg: 0, restSec: 75, intensityMET: 6,   tempoSecPerRep: 3 },
    { name: "Dumbbell Curl",    sets: 3, reps: 12, weightKg: 0, restSec: 60, intensityMET: 5,   tempoSecPerRep: 2.5 },
  ]},
  Minggu: { morningSteps: 5000, walkEveningSteps: 5000, bikeKm: 8, weights: [
    { name: "Push-up",        sets: 3, reps: 10, weightKg: 0, restSec: 45, intensityMET: 4.5, tempoSecPerRep: 2 },
    { name: "Bodyweight Squat", sets: 3, reps: 15, weightKg: 0, restSec: 45, intensityMET: 4,   tempoSecPerRep: 2 },
    { name: "Plank",          sets: 3, reps: 1,  weightKg: 0, restSec: 45, intensityMET: 3.5, tempoSecPerRep: 60 },
  ]},
};

/* ============ Kalkulasi kalori ============ */
const MET_WALK = 3.3;
const kcalFromMET = (met, weightKg, minutes) => (met * 1.05 * weightKg) * (Math.max(minutes, 0) / 60);

const calcCalories = (entry, weight = 100, stepsPerKm = 1300, cycleMET = 6, cycleSpeed = 17) => {
  if (!entry) return { morning: 0, evening: 0, total: 0, stepsEq: 0, detail: {} };
  const walkKcalPerStep = (0.5 * weight) / stepsPerKm;

  const morningSteps = entry.morningSteps || 0;
  const eveningSteps = entry.eveningSteps || 0;
  const bikeKm = entry.bikeKm || 0;
  const walkMinMorning = entry.walkMinMorning || 0;
  const walkMinEvening = entry.walkMinEvening || 0;
  const bikeMin = entry.bikeMin || 0;
  const weightSessions = entry.weightSessions || [];

  const kcalMorningWalk = walkMinMorning > 0
    ? kcalFromMET(MET_WALK, weight, walkMinMorning)
    : morningSteps * walkKcalPerStep;
  const kcalEveningWalk = walkMinEvening > 0
    ? kcalFromMET(MET_WALK, weight, walkMinEvening)
    : eveningSteps * walkKcalPerStep;

  const kcalPerKmBike = (cycleMET * 1.05 * weight) / Math.max(cycleSpeed, 1);
  const kcalBike = bikeMin > 0
    ? kcalFromMET(cycleMET, weight, bikeMin)
    : bikeKm * kcalPerKmBike;

  // Durasi beban dari set-rep-tempo + istirahat
  const totalWeightsMin = (weightSessions || []).reduce((sum, s) => {
    const sets = +s.sets || 0;
    const reps = +s.reps || 0;
    const tempo = +(s.tempoSecPerRep ?? 3);
    const rest = +s.restSec || 0;
    const workMin = (sets * reps * tempo) / 60;
    const restMin = Math.max(sets - 1, 0) * (rest / 60);
    return sum + workMin + restMin;
  }, 0);

  // MET per-sesi → ambil rata-rata berbobot durasi
  const totDur = (weightSessions || []).reduce((s, a) => {
    const sets = +a.sets || 0;
    const reps = +a.reps || 0;
    const tempo = +(a.tempoSecPerRep ?? 3);
    const rest = +a.restSec || 0;
    const workMin = (sets * reps * tempo) / 60;
    const restMin = Math.max(sets - 1, 0) * (rest / 60);
    return s + workMin + restMin;
  }, 0);
  let avgMET = 0;
  if (totDur > 0) {
    avgMET = (weightSessions || []).reduce((sum, s) => {
      const sets = +s.sets || 0;
      const reps = +s.reps || 0;
      const tempo = +(s.tempoSecPerRep ?? 3);
      const rest = +s.restSec || 0;
      const dur = (sets * reps * tempo) / 60 + Math.max(sets - 1, 0) * (rest / 60);
      return sum + (dur * (+s.intensityMET || 5));
    }, 0) / totDur;
  }
  const weightsMET = avgMET || 4.5;
  const kcalWeights = kcalFromMET(weightsMET, weight, totalWeightsMin);

  const kcalMorning = Math.round(kcalMorningWalk);
  const kcalEvening = Math.round(kcalEveningWalk + kcalBike + kcalWeights);
  const total = kcalMorning + kcalEvening;

  const stepsFromNonWalk = (kcalBike + kcalWeights) / walkKcalPerStep;
  const stepsEq = Math.round(morningSteps + eveningSteps + stepsFromNonWalk);

  return {
    morning: kcalMorning,
    evening: kcalEvening,
    total,
    stepsEq,
    detail: { kcalBike: Math.round(kcalBike), kcalWeights: Math.round(kcalWeights) },
  };
};

/* ============ Pilihan latihan beban ============ */
const presetExercises = [
  "Dumbbell Curl","Floor Press","Barbell Squat","Deadlift","Plank",
  "Dumbbell Shoulder Press","Barbell Row","Bodyweight Squat","Side Plank",
  "Side Raise","Close-grip Push-up","Barbell Deadlift","Bent-over Row",
  "Circuit Ringan (Push-up, Squat, Plank)",
];

/* ============ Editor harian ============ */
const DayEditor = ({ date, entry, onSave }) => {
  const [mode, setMode] = useState(entry?.eveningMode || "walk");
  const [morningSteps, setMorningSteps] = useState(entry?.morningSteps || 0);
  const [eveningSteps, setEveningSteps] = useState(entry?.eveningSteps || 0);
  const [walkMinMorning, setWalkMinMorning] = useState(entry?.walkMinMorning || 0);
  const [walkMinEvening, setWalkMinEvening] = useState(entry?.walkMinEvening || 0);
  const [bikeKm, setBikeKm] = useState(entry?.bikeKm || 0);
  const [bikeMin, setBikeMin] = useState(entry?.bikeMin || 0);
  const [weightSessions, setWeightSessions] = useState(entry?.weightSessions || []);

  const inferPresetFromMode = (m) => (m === "bike" ? "B" : "A");
  const [presetSel, setPresetSel] = useState(inferPresetFromMode(entry?.eveningMode || "walk"));

  useEffect(() => {
    setMode(entry?.eveningMode || "walk");
    setMorningSteps(entry?.morningSteps || 0);
    setEveningSteps(entry?.eveningSteps || 0);
    setWalkMinMorning(entry?.walkMinMorning || 0);
    setWalkMinEvening(entry?.walkMinEvening || 0);
    setBikeKm(entry?.bikeKm || 0);
    setBikeMin(entry?.bikeMin || 0);
    setWeightSessions(entry?.weightSessions || []);
    setPresetSel(inferPresetFromMode(entry?.eveningMode || "walk"));
  }, [date, entry]);

  useEffect(() => { setPresetSel(inferPresetFromMode(mode)); }, [mode]);

  const addSession = () =>
    setWeightSessions((prev) => [
      ...prev,
      { name: "", sets: 3, reps: 10, weightKg: 0, restSec: 60, intensityMET: 5, tempoSecPerRep: 3 },
    ]);
  const updateSession = (idx, patch) =>
    setWeightSessions(weightSessions.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  const removeSession = (idx) => setWeightSessions(weightSessions.filter((_, i) => i !== idx));

  const save = async () => {
    if (mode === "bike" && weightSessions.length === 0) {
      alert("Mode 'Sepeda + Beban' memerlukan minimal 1 latihan beban.");
      return;
    }
    await onSave(date, {
      morningSteps, eveningSteps, walkMinMorning, walkMinEvening,
      bikeKm, bikeMin, eveningMode: mode, weightSessions,
    });
    alert("Tersimpan ✅");
  };

  const cals = calcCalories({
    morningSteps, eveningSteps, walkMinMorning, walkMinEvening,
    bikeKm, bikeMin, eveningMode: mode, weightSessions,
  });

  const dname = dayNameID(date);
  const preset = PRESETS[dname];

  return (
    <Card className="p-4 my-2">
      <h2 className="font-semibold mb-2">
        {date} <span className="text-gray-500 text-sm">({dayNameID(date)})</span>
      </h2>

      <div className="space-y-3">
        {/* Preset */}
        <div className="grid md:grid-cols-3 gap-3 bg-gray-50 p-3 rounded-xl">
          <div className="md:col-span-2">
            <div className="text-sm text-gray-600">Rekomendasi {dname}:</div>
            <div className="text-xs text-gray-500">
              Opsi A: Jalan {preset?.walkEveningSteps || 5000} langkah · Opsi B: Sepeda {preset?.bikeKm || 5} km + beban preset
            </div>
          </div>
          <div>
            <select
              className="w-full border rounded-lg p-2 text-sm"
              value={presetSel}
              onChange={(e) => {
                const val = e.target.value; setPresetSel(val);
                if (!preset) return;
                if (val === "A") {
                  setMode("walk");
                  setEveningSteps(preset.walkEveningSteps || 5000);
                  if ((morningSteps || 0) === 0) setMorningSteps(preset.morningSteps || 5000);
                  setBikeKm(0); setBikeMin(0); setWeightSessions([]);
                } else {
                  setMode("bike");
                  setBikeKm(preset.bikeKm || 5);
                  if ((morningSteps || 0) === 0) setMorningSteps(preset.morningSteps || 5000);
                  setWeightSessions(preset.weights || []);
                }
              }}
            >
              <option value="A">Opsi A – Jalan</option>
              <option value="B">Opsi B – Sepeda + Beban</option>
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <label className="text-sm">
            Langkah Pagi
            <input type="number" className="mt-1 w-full border rounded-lg p-2"
              value={morningSteps} onChange={(e) => setMorningSteps(+e.target.value || 0)} />
          </label>
          <label className="text-sm">
            Durasi Jalan Pagi (menit)
            <input type="number" className="mt-1 w-full border rounded-lg p-2"
              value={walkMinMorning} onChange={(e) => setWalkMinMorning(+e.target.value || 0)} />
          </label>
        </div>

        <label className="text-sm">
          Mode Sore
          <select className="mt-1 w-full border rounded-lg p-2"
            value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="walk">Jalan</option>
            <option value="bike">Sepeda + Beban</option>
          </select>
        </label>

        {mode === "walk" ? (
          <div className="grid md:grid-cols-2 gap-3">
            <label className="text-sm">
              Langkah Sore
              <input type="number" className="mt-1 w-full border rounded-lg p-2"
                value={eveningSteps} onChange={(e) => setEveningSteps(+e.target.value || 0)} />
            </label>
            <label className="text-sm">
              Durasi Jalan Sore (menit)
              <input type="number" className="mt-1 w-full border rounded-lg p-2"
                value={walkMinEvening} onChange={(e) => setWalkMinEvening(+e.target.value || 0)} />
            </label>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            <label className="text-sm">
              Sepeda (km)
              <input type="number" className="mt-1 w-full border rounded-lg p-2"
                value={bikeKm} onChange={(e) => setBikeKm(+e.target.value || 0)} />
            </label>
            <label className="text-sm">
              Durasi Sepeda (menit)
              <input type="number" className="mt-1 w-full border rounded-lg p-2"
                value={bikeMin} onChange={(e) => setBikeMin(+e.target.value || 0)} />
            </label>
          </div>
        )}

        {/* Latihan Beban */}
        <div className="mt-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Latihan Beban</h3>
            <Button className="text-sm" onClick={addSession}>+ Tambah Sesi</Button>
          </div>
          <div className="space-y-2 mt-2">
            {weightSessions.map((s, idx) => (
              <div key={idx} className="grid md:grid-cols-6 gap-2 items-end border rounded-xl p-3">
                <label className="text-sm">
                  Latihan
                  <select className="mt-1 w-full border rounded-lg p-2"
                    value={s.name || ""} onChange={(e) => updateSession(idx, { name: e.target.value })}>
                    <option value="">Pilih Latihan</option>
                    {presetExercises.map((ex, i) => <option key={i} value={ex}>{ex}</option>)}
                  </select>
                </label>
                <label className="text-sm">
                  Set
                  <input type="number" className="mt-1 w-full border rounded-lg p-2"
                    value={s.sets || 0} onChange={(e) => updateSession(idx, { sets: +e.target.value || 0 })} />
                </label>
                <label className="text-sm">
                  Reps
                  <input type="number" className="mt-1 w-full border rounded-lg p-2"
                    value={s.reps || 0} onChange={(e) => updateSession(idx, { reps: +e.target.value || 0 })} />
                </label>
                <label className="text-sm">
                  Beban (kg)
                  <input type="number" className="mt-1 w-full border rounded-lg p-2"
                    value={s.weightKg || 0} onChange={(e) => updateSession(idx, { weightKg: +e.target.value || 0 })} />
                </label>
                <label className="text-sm">
                  Istirahat (detik)
                  <input type="number" className="mt-1 w-full border rounded-lg p-2"
                    value={s.restSec || 60} onChange={(e) => updateSession(idx, { restSec: +e.target.value || 0 })} />
                </label>
                <label className="text-sm">
                  Intensitas (MET)
                  <select className="mt-1 w-full border rounded-lg p-2"
                    value={s.intensityMET ?? 5} onChange={(e) => updateSession(idx, { intensityMET: +e.target.value })}>
                    <option value={3.5}>Ringan (~3.5)</option>
                    <option value={5}>Sedang (~5)</option>
                    <option value={6.5}>Berat (~6.5)</option>
                    <option value={8}>Sangat berat (~8)</option>
                  </select>
                </label>
                <label className="text-sm">
                  Tempo / Rep (detik)
                  <input type="number" className="mt-1 w-full border rounded-lg p-2"
                    value={s.tempoSecPerRep ?? 3} onChange={(e) => updateSession(idx, { tempoSecPerRep: +e.target.value || 0 })} />
                </label>

                <div className="md:col-span-6 text-xs text-zinc-500">
                  {(() => {
                    const sets = +s.sets || 0;
                    const reps = +s.reps || 0;
                    const tempo = +(s.tempoSecPerRep ?? 3);
                    const rest = +s.restSec || 0;
                    const workMin = (sets * reps * tempo) / 60;
                    const restMin = Math.max(sets - 1, 0) * (rest / 60);
                    const total = workMin + restMin;
                    return <>Durasi hitung otomatis ≈ <b>{total.toFixed(1)} menit</b> (kerja {workMin.toFixed(1)}m + istirahat {restMin.toFixed(1)}m)</>;
                  })()}
                </div>

                <div className="md:col-span-6 flex justify-end">
                  <button className="text-xs px-3 py-1 rounded-lg bg-red-50 text-red-600" onClick={() => removeSession(idx)}>Hapus</button>
                </div>
              </div>
            ))}
            {weightSessions.length === 0 && (
              <p className="text-xs text-gray-500">Belum ada sesi. (Untuk mode "Sepeda + Beban" minimal 1 sesi)</p>
            )}
          </div>
        </div>

        {/* Ringkasan */}
        <Card className="p-4 mt-2">
          <div className="grid md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl p-3 ring-1 ring-zinc-100">
              <div className="text-zinc-500">Kalori pagi</div>
              <div className="text-xl font-semibold">{cals.morning} kkal</div>
              <div className="text-xs text-zinc-500">Jalan pagi</div>
            </div>
            <div className="rounded-xl p-3 ring-1 ring-zinc-100">
              <div className="text-zinc-500">Kalori sore</div>
              <div className="text-xl font-semibold">{cals.evening} kkal</div>
              <div className="text-xs text-zinc-500">Sepeda {cals.detail.kcalBike} kkal · Beban {cals.detail.kcalWeights} kkal</div>
            </div>
            <div className="rounded-xl p-3 ring-1 ring-zinc-100">
              <div className="text-zinc-500">Total hari ini</div>
              <div className="text-xl font-semibold">{cals.total} kkal</div>
              <div className="text-xs text-zinc-500">Eq. langkah {cals.stepsEq.toLocaleString("id-ID")}</div>
            </div>
          </div>
          <Progress value={Math.min(100, (cals.stepsEq / 10000) * 100)} className="mt-3 h-2" />
        </Card>

        <Button onClick={save} className="mt-2">Simpan</Button>
      </div>
    </Card>
  );
};

/* ============ Week View (ambil dari IndexedDB) ============ */
function WeekView() {
  const [items, setItems] = useState({});
  const start = (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d; })();
  const dates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(start); d.setDate(start.getDate() + i); return isoDate(d);
  });

  useEffect(() => {
    let alive = true;
    Promise.all(dates.map((dt) => getDaily(dt))).then((rows) => {
      if (!alive) return;
      const map = {};
      rows.forEach((row, idx) => { map[dates[idx]] = row || {}; });
      setItems(map);
    });
    return () => { alive = false; };
  }, [dates]); // sekali

  const onSave = async (date, entry) => {
    await putDaily(date, entry);
    setItems((prev) => ({ ...prev, [date]: { ...(prev[date] || {}), ...entry } }));
  };

  return (
    <div>
      {dates.map((dt) => (
        <DayEditor key={dt} date={dt} entry={items[dt]} onSave={onSave} />
      ))}
    </div>
  );
}

/* ============ Month View (ambil dari IndexedDB) ============ */
function MonthView() {
  const [cursor, setCursor] = useState(startOfMonth(new Date()));
  const [data, setData] = useState({});
  const [selected, setSelected] = useState(null);

  const loadMonth = async (base) => {
    const a = startOfMonth(base);
    const b = endOfMonth(base);
    const rows = await getRange(isoDate(a), isoDate(b));
    const map = {};
    rows.forEach((r) => { map[r.date] = r; });
    setData(map);
  };

  useEffect(() => { loadMonth(cursor); }, [cursor]);

  const stats = Object.entries(data).reduce((acc, [, entry]) => {
    const c = calcCalories(entry);
    acc.totalKcal += c.total;
    acc.totalEqSteps += c.stepsEq;
    acc.totalSteps += (entry.morningSteps || 0) + (entry.eveningSteps || 0);
    acc.totalBikeKm += entry.bikeKm || 0;
    acc.daysTarget += c.stepsEq >= 10000 ? 1 : 0;
    acc.daysWeights += (entry.weightSessions && entry.weightSessions.length > 0) ? 1 : 0;
    return acc;
  }, { totalKcal: 0, totalEqSteps: 0, totalSteps: 0, totalBikeKm: 0, daysTarget: 0, daysWeights: 0 });

  const mat = monthMatrix(cursor);
  const isSameMonth = (d) => d.getMonth() === cursor.getMonth();

  const onSave = async (date, entry) => {
    await putDaily(date, entry);
    setData((prev) => ({ ...prev, [date]: { ...(prev[date] || {}), ...entry } }));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={() => setCursor(addMonths(cursor, -1))}>⟨</Button>
          <div className="font-semibold">{fmtMonthTitle(cursor)}</div>
          <Button onClick={() => setCursor(addMonths(cursor, 1))}>⟩</Button>
        </div>
        <div className="text-sm text-gray-600">Klik tanggal untuk edit cepat</div>
      </div>

      <Card className="p-3">
        <div className="grid md:grid-cols-6 gap-3 text-sm">
          <div><div className="text-gray-500">Total kcal</div><div className="font-semibold">{stats.totalKcal}</div></div>
          <div><div className="text-gray-500">Eq. langkah</div><div className="font-semibold">{stats.totalEqSteps}</div></div>
          <div><div className="text-gray-500">Langkah (real)</div><div className="font-semibold">{stats.totalSteps}</div></div>
          <div><div className="text-gray-500">Sepeda (km)</div><div className="font-semibold">{stats.totalBikeKm}</div></div>
          <div><div className="text-gray-500">Hari ≥10k</div><div className="font-semibold">{stats.daysTarget}</div></div>
          <div><div className="text-gray-500">Hari beban</div><div className="font-semibold">{stats.daysWeights}</div></div>
        </div>
      </Card>

      <div className="grid grid-cols-7 text-xs text-center text-gray-500">
        {["Min","Sen","Sel","Rab","Kam","Jum","Sab"].map((d) => <div key={d} className="py-1">{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {mat.flat().map((d) => {
          const iso = isoDate(d);
          const entry = data[iso];
          const c = entry ? calcCalories(entry) : { total: 0, stepsEq: 0 };
          const isCurrentMonth = isSameMonth(d);
          return (
            <div key={iso}
              onClick={() => setSelected(iso)}
              className={`border rounded-xl p-2 cursor-pointer transition ${isCurrentMonth ? "bg-white hover:bg-gray-50" : "bg-gray-50 text-gray-400"}`}>
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium">{d.getDate()}</div>
                <div className="text-xs">{entry?.weightSessions?.length ? "🏋️" : entry?.bikeKm ? "🚴" : ""}</div>
              </div>
              <div className="mt-1 text-[11px] leading-4">
                <div>Eq: {c.stepsEq || 0}</div>
                <div>kcal: {c.total || 0}</div>
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="mt-3">
          <DayEditor date={selected} entry={data[selected]} onSave={onSave} />
        </div>
      )}
    </div>
  );
}

/* ============ Rekomendasi ============ */
function Recommendations() {
  return (
    <Card className="p-4 mb-3">
      <h3 className="font-semibold mb-2">📌 Rekomendasi Jadwal Jalan Sore Outdoor</h3>
      <ul className="list-disc pl-5 text-sm leading-6">
        <li><b>Senin</b> → Jalan sore (biar start minggu lebih segar)</li>
        <li><b>Rabu</b> → Jalan sore (seimbang, recovery cukup dari Senin)</li>
        <li><b>Sabtu</b> → Jalan sore (waktu lebih longgar + sekaligus bakar kalori lebih banyak sebelum weekend)</li>
      </ul>
      <h4 className="font-semibold mt-3 mb-1">📌 Hari Lainnya</h4>
      <p className="text-sm text-gray-700">
        <b>Selasa, Kamis, Jumat, Minggu</b> → Lebih baik sore pakai <b>sepeda statis + latihan beban</b>,
        karena fokus utamanya adalah <i>penguatan otot</i> (squat, press, deadlift, row).
      </p>
    </Card>
  );
}

/* ============ Halaman Latihan ============ */
export default function LatihanPage() {
  const { date, entry, save, loading } = useTodayLog();

  // sanity check kecil
  useEffect(() => {
    if (!loading) {
      try {
        const t = calcCalories({ morningSteps: 5000, eveningSteps: 5000 }, 100, 1300);
        console.assert(t.stepsEq > 0 && t.total > 0, "calcCalories sanity failed");
      } catch { /* empty */ }
    }
  }, [loading]);

  const onSaveToday = async (_date, patch) => {
    await save(patch); // useTodayLog sudah merge & simpan ke IndexedDB
  };

  return (
    <div className="space-y-4">
      <Recommendations />

      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">Hari Ini</TabsTrigger>
          <TabsTrigger value="week">Mingguan</TabsTrigger>
          <TabsTrigger value="month">Bulanan</TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          <DayEditor date={date} entry={entry} onSave={onSaveToday} />
        </TabsContent>

        <TabsContent value="week">
          <WeekView />
        </TabsContent>

        <TabsContent value="month">
          <MonthView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
