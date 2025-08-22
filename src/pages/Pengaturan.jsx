// src/pages/Pengaturan.jsx
import React, { useState, useEffect } from "react";
import { getPrefs, savePrefs, defaultPrefs } from "../utils/prefs";
import { db } from "../lib/db";

export default function PengaturanPage() {
  const [prefs, setPrefs] = useState(defaultPrefs);

  // Form kalibrasi (Samsung Health)
  const [cal, setCal] = useState({
    distanceKm: "",  // contoh: 3.83
    steps: "",       // contoh: 5592
    durationMin: "", // contoh: 56.65 (boleh 56:39 → 56.65)
    samsungKcal: "", // contoh: 201 (opsional)
  });
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    setPrefs(getPrefs());
  }, []);

  const toNum = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const saveBasic = () => {
    const p = savePrefs({
      weightKg: toNum(prefs.weightKg, defaultPrefs.weightKg),
      stepsPerKm: toNum(prefs.stepsPerKm, defaultPrefs.stepsPerKm),
      walkMET: toNum(prefs.walkMET, defaultPrefs.walkMET),
      cycleSpeed: toNum(prefs.cycleSpeed, defaultPrefs.cycleSpeed),
      cycleMET: toNum(prefs.cycleMET, defaultPrefs.cycleMET),
      weightsMET: toNum(prefs.weightsMET, defaultPrefs.weightsMET),
      useDeviceBias: !!prefs.useDeviceBias,
      deviceBias: toNum(prefs.deviceBias, 1),
      // 🆕 target harian kustom (fallback 10_000 jika belum ada di defaultPrefs)
      dailyTargetSteps: toNum(prefs.dailyTargetSteps, 10000),
    });
    setPrefs(p);
    alert("Pengaturan disimpan ✅");
  };

  const computeCalibration = () => {
    const distanceKm  = toNum(cal.distanceKm, 0);
    const steps       = toNum(cal.steps, 0);
    const durationMin = toNum(cal.durationMin, 0);
    const samsungKcal = cal.samsungKcal ? toNum(cal.samsungKcal, 0) : null;

    if (!distanceKm || !steps || !durationMin) {
      alert("Isi minimal Jarak, Langkah, dan Durasi (menit).");
      return;
    }

    // Langkah per km baru dari data real
    const newStepsPerKm = Math.round(steps / distanceKm);

    // Kalori MET untuk jalan = walkMET × 1.05 × weight × (menit/60)
    const kcalMET = prefs.walkMET * 1.05 * prefs.weightKg * (durationMin / 60);

    // Device bias (opsional) = Samsung / MET
    const bias = samsungKcal ? (samsungKcal / kcalMET) : null;

    setPreview({
      newStepsPerKm,
      kcalMET: Math.round(kcalMET),
      deviceBias: bias ? +bias.toFixed(3) : null,
    });
  };

  const applyCalibration = () => {
    if (!preview) return;
    const p = savePrefs({
      stepsPerKm: preview.newStepsPerKm,
      ...(preview.deviceBias ? { deviceBias: preview.deviceBias } : {}),
    });
    setPrefs(p);
    alert("Kalibrasi diterapkan ✅");
    setPreview(null);
  };

  const clearAllLogs = async () => {
    if (!confirm("Yakin hapus SEMUA data latihan di perangkat ini? Tindakan ini tidak bisa dibatalkan.")) {
      return;
    }
    await db.logs.clear();
    alert("Semua data latihan telah dihapus dari perangkat ini.");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Pengaturan umum */}
      <div className="bg-white rounded-2xl shadow p-4">
        <h2 className="font-semibold mb-3">Pengaturan Perhitungan</h2>

        <div className="grid md:grid-cols-2 gap-3">
          <label className="text-sm">
            Berat (kg)
            <input
              type="number"
              className="border rounded-lg p-2 w-full mt-1"
              value={prefs.weightKg ?? ""}
              onChange={(e) => setPrefs({ ...prefs, weightKg: e.target.value })}
              min={1}
            />
          </label>

          <label className="text-sm">
            Langkah per km
            <input
              type="number"
              className="border rounded-lg p-2 w-full mt-1"
              value={prefs.stepsPerKm ?? ""}
              onChange={(e) => setPrefs({ ...prefs, stepsPerKm: e.target.value })}
              min={500}
            />
          </label>

          <label className="text-sm">
            MET Jalan (pace)
            <input
              type="number"
              step="0.1"
              className="border rounded-lg p-2 w-full mt-1"
              value={prefs.walkMET ?? ""}
              onChange={(e) => setPrefs({ ...prefs, walkMET: e.target.value })}
              min={2}
            />
          </label>

          <label className="text-sm">
            Kecepatan Sepeda (km/j)
            <input
              type="number"
              step="0.1"
              className="border rounded-lg p-2 w-full mt-1"
              value={prefs.cycleSpeed ?? ""}
              onChange={(e) => setPrefs({ ...prefs, cycleSpeed: e.target.value })}
              min={1}
            />
          </label>

          <label className="text-sm">
            MET Sepeda
            <input
              type="number"
              step="0.1"
              className="border rounded-lg p-2 w-full mt-1"
              value={prefs.cycleMET ?? ""}
              onChange={(e) => setPrefs({ ...prefs, cycleMET: e.target.value })}
              min={1}
            />
          </label>

          <label className="text-sm">
            MET Latihan Beban
            <input
              type="number"
              step="0.1"
              className="border rounded-lg p-2 w-full mt-1"
              value={prefs.weightsMET ?? ""}
              onChange={(e) => setPrefs({ ...prefs, weightsMET: e.target.value })}
              min={2}
            />
          </label>

          {/* 🆕 Target harian kustom */}
          <label className="text-sm">
            Target Harian (langkah ekuivalen)
            <input
              type="number"
              className="border rounded-lg p-2 w-full mt-1"
              value={prefs.dailyTargetSteps ?? 10000}
              onChange={(e) => setPrefs({ ...prefs, dailyTargetSteps: e.target.value })}
              min={1000}
              step={500}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-3">
          <label className="text-sm flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!prefs.useDeviceBias}
              onChange={(e) => setPrefs({ ...prefs, useDeviceBias: e.target.checked })}
            />
            Gunakan Device Bias (samakan rasa dengan Samsung Health)
          </label>

          <label className="text-sm">
            Device Bias
            <input
              type="number"
              step="0.001"
              className="border rounded-lg p-2 w-28 ml-2"
              value={prefs.deviceBias ?? 1}
              onChange={(e) => setPrefs({ ...prefs, deviceBias: e.target.value })}
              min={0.1}
            />
          </label>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            className="px-4 py-2 rounded-xl bg-gray-900 text-white"
            onClick={saveBasic}
          >
            Simpan Pengaturan
          </button>

          <button
            className="px-4 py-2 rounded-xl bg-red-50 text-red-600"
            onClick={clearAllLogs}
            title="Hapus semua catatan latihan dari perangkat ini"
          >
            Hapus Semua Data Latihan
          </button>
        </div>
      </div>

      {/* Kalibrasi dari Samsung Health */}
      <div className="bg-white rounded-2xl shadow p-4">
        <h2 className="font-semibold mb-3">Kalibrasi dari Samsung Health</h2>
        <p className="text-sm text-gray-600 mb-3">
          Masukkan <b>Jarak (km)</b>, <b>Langkah</b>, <b>Durasi (menit)</b> dari sesi jalanmu.
          Opsional: <b>Kalori Samsung</b> agar kami hitung <i>device bias</i>.
        </p>

        <div className="grid md:grid-cols-4 gap-3">
          <label className="text-sm">
            Jarak (km)
            <input
              type="number"
              step="0.01"
              className="border rounded-lg p-2 w-full mt-1"
              value={cal.distanceKm}
              onChange={(e) => setCal({ ...cal, distanceKm: e.target.value })}
              placeholder="3.83"
            />
          </label>

          <label className="text-sm">
            Langkah
            <input
              type="number"
              className="border rounded-lg p-2 w-full mt-1"
              value={cal.steps}
              onChange={(e) => setCal({ ...cal, steps: e.target.value })}
              placeholder="5592"
            />
          </label>

          <label className="text-sm">
            Durasi (menit)
            <input
              type="number"
              step="0.01"
              className="border rounded-lg p-2 w-full mt-1"
              value={cal.durationMin}
              onChange={(e) => setCal({ ...cal, durationMin: e.target.value })}
              placeholder="56.65"
            />
          </label>

          <label className="text-sm">
            Kalori Samsung (opsional)
            <input
              type="number"
              className="border rounded-lg p-2 w-full mt-1"
              value={cal.samsungKcal}
              onChange={(e) => setCal({ ...cal, samsungKcal: e.target.value })}
              placeholder="201"
            />
          </label>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200"
            onClick={computeCalibration}
          >
            Hitung Pratinjau
          </button>
          <button
            className="px-4 py-2 rounded-xl bg-gray-900 text-white disabled:opacity-50"
            disabled={!preview}
            onClick={applyCalibration}
          >
            Terapkan
          </button>
        </div>

        {preview && (
          <div className="mt-3 text-sm">
            <div>
              Langkah per km baru: <b>{preview.newStepsPerKm}</b>
            </div>
            <div>
              Kalori (MET) berdasarkan durasi: <b>{preview.kcalMET} kkal</b>
            </div>
            {preview.deviceBias && (
              <div>
                Device Bias (Samsung / MET): <b>{preview.deviceBias}</b>
                <span className="text-gray-500">
                  {" "}— nyalakan “Gunakan Device Bias” bila ingin output mirip Samsung Health.
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
