export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-base font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
        This area will be implemented in the next milestones.
      </p>
    </div>
  );
}
