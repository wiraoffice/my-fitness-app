// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import StatCard from "../components/ui/StatCard";
import { Section } from "../components/ui/Section";
import ProgressRing from "../components/ui/ProgressRing";
import Badge from "../components/ui/Badge";
import { dayTotals } from "../utils/calc";
import { getDaily, getRange } from "../lib/db"; // 🆕 ambil dari IndexedDB

// ------- helpers -------
const iso = (d) => d.toISOString().slice(0, 10);
const ID_DAYS_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function loadPrefs() {
  const defaults = {
    weightKg: 100,
    stepsPerKm: 1300,
    cycleSpeed: 17,
    cycleMET: 6,
    weightsMET: 4.5,
    useDeviceBias: false,
    deviceBias: 1,
  };
  try {
    const p = JSON.parse(localStorage.getItem("gusde_prefs_v1")) || {};
    return { ...defaults, ...p };
  } catch {
    return defaults;
  }
}

export default function DashboardPage() {
  const [prefs, setPrefs] = useState(loadPrefs());

  // state data yang sudah dihitung
  const [todayTotals, setTodayTotals] = useState({ stepEq: 0, kcal: 0 });
  const [weekData, setWeekData] = useState(
    ID_DAYS_SHORT.map((label) => ({ label, eqSteps: 0, kcal: 0 }))
  );
  const [hitTargetDays, setHitTargetDays] = useState(0);
  const [monthAgg, setMonthAgg] = useState({ eqSteps: 0, kcal: 0, daysHit: 0 });

  // muat prefs on mount
  useEffect(() => {
    setPrefs(loadPrefs());
  }, []);

  // muat TODAY + WEEK + MONTH dari IndexedDB
  useEffect(() => {
    let alive = true;

    (async () => {
      // ---- TODAY ----
      const todayKey = iso(new Date());
      const todayEntry = (await getDaily(todayKey)) || {};
      const t = dayTotals(todayEntry, prefs);
      if (!alive) return;
      setTodayTotals({ stepEq: Math.round(t.stepEq || 0), kcal: Math.round(t.kcal || 0) });

      // ---- WEEK (Minggu–Sabtu) ----
      const start = new Date();
      start.setDate(start.getDate() - start.getDay()); // ke Minggu
      const weekDates = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return iso(d);
      });

      const weekRows = await Promise.all(weekDates.map((k) => getDaily(k)));
      const w = weekRows.map((row, i) => {
        const dt = dayTotals(row || {}, prefs);
        return {
          label: ID_DAYS_SHORT[i],
          eqSteps: Math.round(dt.stepEq || 0),
          kcal: Math.round(dt.kcal || 0),
        };
      });
      if (!alive) return;
      setWeekData(w);
      setHitTargetDays(w.reduce((n, d) => n + (d.eqSteps >= 10000 ? 1 : 0), 0));

      // ---- MONTH (bulan berjalan) ----
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const monthRows = await getRange(iso(monthStart), iso(monthEnd));
      const m = monthRows
        .map((r) => dayTotals(r || {}, prefs))
        .reduce(
          (acc, cur) => {
            acc.eqSteps += Math.round(cur.stepEq || 0);
            acc.kcal += Math.round(cur.kcal || 0);
            acc.daysHit += (cur.stepEq || 0) >= 10000 ? 1 : 0;
            return acc;
          },
          { eqSteps: 0, kcal: 0, daysHit: 0 }
        );
      if (!alive) return;
      setMonthAgg(m);
    })();

    return () => {
      alive = false;
    };
  }, [prefs]);

  const dailyPercent = Math.min(100, (todayTotals.stepEq / 10000) * 100 || 0);

  // -------- RENDER --------
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">{/* ⬅️ terpusat */}
      {/* Greeting */}
      <div className="text-center">
        <h1 className="text-2xl font-bold">Hi Gus Wira 👋</h1>
        <p className="text-zinc-600 mt-1">
          Selamat datang kembali! Semangat terus jaga konsistensi latihanmu 🚀
        </p>
      </div>

      <Section
        title="Dashboard"
        desc="Ringkasan harian, mingguan, dan bulanan (data dari Latihan)"
      >
        {/* Ringkasan atas */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-100 p-6 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <ProgressRing percent={dailyPercent} size={140} stroke={12} />
              <div className="text-sm text-zinc-500 mt-3">
                Target 10.000 langkah (eq)
              </div>
            </div>
          </div>

          <StatCard
            title="Eq. Langkah Hari Ini"
            value={(todayTotals.stepEq || 0).toLocaleString("id-ID")}
            sub="Target 10.000"
            icon={<span>👟</span>}
            tone="blue"
          />
          <StatCard
            title="Kalori Hari Ini"
            value={`${(todayTotals.kcal || 0).toLocaleString("id-ID")} kkal`}
            icon={<span>🔥</span>}
            tone="orange"
          />
        </div>
      </Section>

      {/* Mingguan */}
      <Section title="Mingguan" desc="Total eq. langkah per hari">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-100 p-4">
          <div className="grid grid-cols-7 gap-2">
            {weekData.map((d) => {
              const pct = Math.min(100, (d.eqSteps / 10000) * 100);
              const bar =
                pct >= 100 ? "bg-blue-500" : pct >= 60 ? "bg-green-500" : "bg-zinc-300";
              return (
                <div key={d.label} className="flex flex-col items-center gap-1">
                  <div className="w-6 h-28 bg-zinc-100 rounded overflow-hidden flex items-end">
                    <div className={`w-6 ${bar}`} style={{ height: `${pct}%` }} />
                  </div>
                  <div className="text-[11px] text-zinc-500">{d.label}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 text-xs text-zinc-500 flex items-center justify-between">
            <div>Progress minggu ini</div>
            <div>
              <Badge tone="green">{`${hitTargetDays}/7 hari ≥10k`}</Badge>
            </div>
          </div>
        </div>
      </Section>

      {/* Bulanan */}
      <Section title="Bulanan" desc="Akumulasi bulan berjalan">
        <div className="grid md:grid-cols-3 gap-4">
          <StatCard
            title="Total Eq. Langkah Bulan Ini"
            value={(monthAgg.eqSteps || 0).toLocaleString("id-ID")}
            icon={<span>📈</span>}
            tone="violet"
          />
          <StatCard
            title="Total Kalori Bulan Ini"
            value={`${(monthAgg.kcal || 0).toLocaleString("id-ID")} kkal`}
            icon={<span>🧮</span>}
            tone="zinc"
          />
          <StatCard
            title="Hari ≥10k bulan ini"
            value={`${monthAgg.daysHit}/30`}
            icon={<span>✅</span>}
            tone="green"
          />
        </div>
      </Section>
    </div>
  );
}
