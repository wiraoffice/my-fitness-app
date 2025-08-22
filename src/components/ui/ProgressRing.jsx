export default function ProgressRing({ percent = 0, size = 120, stroke = 10 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, percent));
  const dash = (p / 100) * c;

  return (
    <svg width={size} height={size} className="block">
      <g transform={`rotate(-90 ${size/2} ${size/2})`}>
        <circle cx={size/2} cy={size/2} r={r} strokeWidth={stroke} className="fill-none stroke-zinc-100"/>
        <circle cx={size/2} cy={size/2} r={r} strokeWidth={stroke}
                className="fill-none stroke-green-500 transition-[stroke-dasharray]"
                strokeDasharray={`${dash} ${c - dash}`} strokeLinecap="round"/>
      </g>
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
            className="font-semibold text-zinc-800">{Math.round(p)}%</text>
    </svg>
  );
}
