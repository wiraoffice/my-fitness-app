import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import LatihanPage from "./pages/Latihan";
import { db, putDaily } from "./lib/db";

async function migrateFromLocalStorageOnce() {
  const FLAG = "migrated_to_dexie_v1";
  if (localStorage.getItem(FLAG)) return;
  try {
    const raw = localStorage.getItem("gusde_daily_log_v1");
    if (raw) {
      const obj = JSON.parse(raw);
      const entries = Object.entries(obj); // [date, entry]
      await db.transaction("rw", db.daily_logs, async () => {
        for (const [date, entry] of entries) {
          await putDaily(date, entry);
        }
      });
    }
    localStorage.removeItem("gusde_daily_log_v1");
    localStorage.setItem(FLAG, "1");
  } catch (e) {
    console.warn("Migrasi localStorage gagal (abaikan jika kosong):", e);
  }
}

migrateFromLocalStorageOnce();


function Home() {
  return (
    <div className="p-4">
      <h1 className="font-bold text-xl mb-2">Welcome</h1>
      <p>Buka menu Latihan untuk input & pantau progres.</p>
      <div className="mt-3">
        <Link className="px-3 py-2 rounded-xl bg-gray-900 text-white" to="/latihan">
          Ke Halaman Latihan
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="p-4 max-w-5xl mx-auto">
        <nav className="mb-4 flex gap-3">
          <Link to="/" className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200">Dashboard</Link>
          <Link to="/latihan" className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200">Latihan</Link>
        </nav>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/latihan" element={<LatihanPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
