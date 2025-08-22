export default function Badge({ children, tone = "zinc" }) {
  const cls = {
    zinc:   "bg-zinc-100 text-zinc-700",
    green:  "bg-green-100 text-green-700",
    blue:   "bg-blue-100 text-blue-700",
    orange: "bg-orange-100 text-orange-700",
    rose:   "bg-rose-100 text-rose-700",
  }[tone];
  return <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${cls}`}>{children}</span>;
}
