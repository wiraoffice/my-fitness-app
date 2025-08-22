export function Section({ title, desc, right, children, className = "" }) {
  return (
    <section className={`mb-6 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {desc && <p className="text-sm text-zinc-500">{desc}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}
