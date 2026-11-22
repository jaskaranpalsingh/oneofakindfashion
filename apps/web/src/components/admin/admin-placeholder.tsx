import Link from "next/link";

export function AdminPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-ink">{title}</h1>
        <div className="gold-rule mt-3" />
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          {description}
        </p>
      </div>
      <div className="border border-border bg-white px-5 py-8 text-sm text-muted">
        This admin screen is ready in the navigation. Connect live data as the
        matching API endpoints expand.
        <div className="mt-4">
          <Link
            href="/admin"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-green hover:text-gold-dark"
          >
            ← Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
