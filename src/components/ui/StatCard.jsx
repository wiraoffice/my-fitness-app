export default function StatCard({ title, value, sub, icon = null, tone = "zinc" }) {
  const tones = {
    zinc:   "bg-zinc-50 text-zinc-700 ring-zinc-200",
    green:  "bg-green-50 text-green-700 ring-green-200",
    blue:   "bg-blue-50 text-blue-700 ring-blue-200",
    orange: "bg-orange-50 text-orange-700 ring-orange-200",
    rose:   "bg-rose-50 text-rose-700 ring-rose-200",
    violet: "bg-violet-50 text-violet-700 ring-violet-200",
  };
  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-100 p-4">
      <div className="flex items-start gap-3">
        {icon && <div className={`p-2 rounded-xl ${tones[tone]}`}>{icon}</div>}
        <div className="flex-1">
          <div className="text-sm text-zinc-500">{title}</div>
          <div className="text-2xl font-semibold tracking-tight">{value}</div>
          {sub && <div className="text-xs text-zinc-400 mt-1">{sub}</div>}
        </div>
      </div>
    </div>
  );
}
