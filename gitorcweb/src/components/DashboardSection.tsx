import type React from 'react';

export function Section({ title, children, compact = false }: { title: string; children: React.ReactNode; compact?: boolean }) {
  return (
    <section className={compact ? 'panel panel--compact' : 'panel'}>
      <div className="panel__header">
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function DataTable({ children }: { children: React.ReactNode }) {
  return <div className="table-wrap">{children}</div>;
}