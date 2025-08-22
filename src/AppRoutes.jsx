import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Latihan from "./pages/Latihan";
import Pengaturan from "./pages/Pengaturan";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Layout global */}
        <Route element={<MainLayout max="max-w-4xl" />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/latihan" element={<Latihan />} />
          <Route path="/pengaturan" element={<Pengaturan />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
