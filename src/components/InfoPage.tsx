import { ReactNode } from "react";

interface InfoPageProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function InfoPage({ title, subtitle, children }: InfoPageProps) {
  return (
    <div className="bg-surface-muted/40 min-h-[60vh]">
      <div className="container mx-auto px-4 py-14 md:py-20 max-w-4xl">
        <header className="mb-10 md:mb-14 text-center">
          <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-4 text-base md:text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}
        </header>
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}

export function InfoCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`bg-card rounded-2xl border border-border/60 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] p-6 md:p-8 ${className}`}
    >
      {children}
    </div>
  );
}

export function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl md:text-2xl font-semibold text-foreground">{title}</h2>
      <div className="text-foreground/85 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}
