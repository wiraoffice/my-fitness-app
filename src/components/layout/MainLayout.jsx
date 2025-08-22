import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../Navbar";

export default function MainLayout({ max = "max-w-4xl" }) {
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Navbar selalu di atas */}
      <Navbar />

      {/* Kontainer tengah global */}
      <main className={`${max} mx-auto px-4 py-6`}>
        <Outlet />
      </main>
    </div>
  );
}
