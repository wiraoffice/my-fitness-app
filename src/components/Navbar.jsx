import { NavLink } from "react-router-dom";

export default function Navbar() {
  const cls = ({ isActive }) =>
    "px-3 py-2 rounded-xl text-sm " +
    (isActive ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200");
  return (
    <nav className="flex gap-2 p-3 bg-white shadow-sm sticky top-0 z-10">
      <NavLink to="/" className={cls}>Dashboard</NavLink>
      <NavLink to="/latihan" className={cls}>Latihan</NavLink>
      <NavLink to="/pengaturan" className={cls}>Pengaturan</NavLink>
    </nav>
  );
}
