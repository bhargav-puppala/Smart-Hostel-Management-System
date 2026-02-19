export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, action, className = '' }) {
  return (
    <div className={`flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 ${className}`}>
      <h2 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      {action}
    </div>
  );
}
