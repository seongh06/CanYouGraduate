export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-card border border-brand-border bg-white p-6 shadow-card ${className}`}>{children}</div>
  );
}
