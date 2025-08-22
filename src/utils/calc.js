// Tetap gunakan fungsi ini, sudah ada di filemu:
const kcalFromMET = (met, weightKg, minutes) =>
  (met * 1.05 * weightKg) * (Math.max(minutes, 0) / 60);

// ===== Baru: helper untuk estimasi durasi beban dari set/reps/istirahat =====
function deriveWeightsMinutes(weightSessions, tempoSecPerRep = 3) {
  if (!Array.isArray(weightSessions)) return 0;
  return weightSessions.reduce((sum, s) => {
    const sets = Number(s.sets) || 0;
    const reps = Number(s.reps) || 0;
    const rest = Number(s.restSec) || 60;
    const explicit = Number(s.durationMin) || 0;

    if (explicit > 0) return sum + explicit;

    // Estimasi “time under tension” + istirahat antar set
    const workSec = sets * reps * tempoSecPerRep;
    const restSec = Math.max(0, sets - 1) * rest;
    return sum + (workSec + restSec) / 60;
  }, 0);
}

/**
 * Perhitungan kalori harian.
 * settings opsional: { weightKg, stepsPerKm, walkMET, cycleMET, cycleSpeed, weightsMET }
 */
export function calcCalories(entry, settings = {}) {
  if (!entry) {
    return { morning: 0, evening: 0, total: 0, stepsEq: 0, detail: {} };
  }

  const weight      = Number(settings.weightKg)   || 100;
  const stepsPerKm  = Number(settings.stepsPerKm) || 1300;
  const walkMET     = Number(settings.walkMET)    || 3.3; // jalan santai
  const cycleMET    = Number(settings.cycleMET)   || 6.0; // sepeda sedang
  const cycleSpeed  = Number(settings.cycleSpeed) || 17;  // km/jam
  const weightsMET0 = Number(settings.weightsMET) || 5.0; // default menengah

  // Energi jalan ~ 0.5 * kg per km → per langkah
  const walkKcalPerStep = (0.5 * weight) / stepsPerKm;

  // --- Ambil input ---
  const morningSteps   = Number(entry.morningSteps)   || 0;
  const eveningSteps   = Number(entry.eveningSteps)   || 0;
  const walkMinMorning = Number(entry.walkMinMorning) || 0;
  const walkMinEvening = Number(entry.walkMinEvening) || 0;
  const bikeKm         = Number(entry.bikeKm)         || 0;
  const bikeMinInput   = Number(entry.bikeMin)        || 0;
  const weightSessions = entry.weightSessions         || [];
  const eveningMode    = entry.eveningMode            || "walk";

  // --- Jalan: kalau durasi ada, pakai MET; kalau tidak ada, pakai “per langkah” ---
  const kcalMorningWalk =
    walkMinMorning > 0
      ? kcalFromMET(walkMET, weight, walkMinMorning)
      : morningSteps * walkKcalPerStep;

  const kcalEveningWalk =
    walkMinEvening > 0
      ? kcalFromMET(walkMET, weight, walkMinEvening)
      : eveningSteps * walkKcalPerStep;

  // --- Sepeda: jika menit tidak diisi tapi km ada → turunkan menit dari kecepatan ---
  const bikeMin =
    bikeMinInput > 0
      ? bikeMinInput
      : (bikeKm > 0 ? (bikeKm / Math.max(cycleSpeed, 1)) * 60 : 0);

  const kcalBike =
    bikeMin > 0
      ? kcalFromMET(cycleMET, weight, bikeMin)
      : bikeKm * ((cycleMET * 1.05 * weight) / Math.max(cycleSpeed, 1)); // per km

  // --- Beban: kalau menit kosong → estimasi dari set/reps/istirahat; MET adaptif ---
  const weightsMin = deriveWeightsMinutes(weightSessions);
  // Sedikit adaptif: kalau total beban > 20 menit, pakai MET 6; kalau <=10 menit pakai 4.5
  const weightsMET =
    weightsMin >= 20 ? Math.max(weightsMET0, 6) :
    weightsMin <= 10 ? Math.min(weightsMET0, 4.5) :
    weightsMET0;

  const kcalWeights = kcalFromMET(weightsMET, weight, weightsMin);

  // --- Agregasi Pagi/Sore ---
  const kcalMorning = Math.round(kcalMorningWalk);
  // beban dihitung ke “sore” (sesuai alur latihan)
  const kcalEvening = Math.round(kcalEveningWalk + kcalBike + kcalWeights);
  const total       = kcalMorning + kcalEvening;

  // Eq. langkah = langkah real + konversi kalori non-jalan → “langkah ekuivalen”
  const stepsFromNonWalk = (kcalBike + kcalWeights) / walkKcalPerStep;
  const stepsEq = Math.round(morningSteps + eveningSteps + stepsFromNonWalk);

  return {
    morning: kcalMorning,
    evening: kcalEvening,
    total,
    stepsEq,
    detail: {
      kcalWalkMorning: Math.round(kcalMorningWalk),
      kcalWalkEvening: Math.round(kcalEveningWalk),
      kcalBike: Math.round(kcalBike),
      kcalWeights: Math.round(kcalWeights),
      weightsMin: Math.round(weightsMin),
      bikeMin: Math.round(bikeMin),
      eveningMode
    }
  };
}

// --- Helper kompatibilitas (dipakai Pengaturan / estimasi) ---
export const kcalPerKmWalk = (kg = 100) => 0.5 * Number(kg);

export const kcalPerStep = (kg = 100, stepsPerKm = 1300) =>
  kcalPerKmWalk(kg) / Math.max(Number(stepsPerKm) || 1300, 1);

export const kcalPerKmBike = (kg = 100, MET = 6, speed = 17) =>
  (Number(MET) * 1.05 * Number(kg)) / Math.max(Number(speed) || 1, 1);

// --- dayTotals versi baru: bungkus calcCalories agar shape tetap sama ---
export function dayTotals(entry = {}, settings = {}) {
  const c = calcCalories(entry, settings);
  const steps = (Number(entry.morningSteps) || 0) + (Number(entry.eveningSteps) || 0);
  const kcalWalk =
    (c.detail?.kcalWalkMorning || 0) + (c.detail?.kcalWalkEvening || 0);
  const kcalBike = c.detail?.kcalBike || 0;
  const kcal = c.total || 0;
  const stepEq = c.stepsEq || 0;
  return { steps, kcalWalk, kcalBike, kcal, stepEq };
}

