import { getApiBaseUrl } from "@/lib/api";

type HealthPayload = {
  status: string;
  database: string;
  integrations: {
    stripe: string;
    cloudinary: string;
    email: string;
  };
};

export async function ApiStatusBadge() {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/health`, {
      cache: "no-store",
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return <StatusPill tone="warn" label="API unreachable" />;
    }

    const json = (await response.json()) as {
      success: boolean;
      data: HealthPayload;
    };

    if (!json.success) {
      return <StatusPill tone="warn" label="API error" />;
    }

    return (
      <StatusPill
        tone="ok"
        label={`API ${json.data.status} · DB ${json.data.database}`}
      />
    );
  } catch {
    return (
      <StatusPill
        tone="warn"
        label="API offline — start with pnpm dev:api"
      />
    );
  }
}

function StatusPill({
  tone,
  label,
}: {
  tone: "ok" | "warn";
  label: string;
}) {
  const classes =
    tone === "ok"
      ? "border-emerald/30 bg-emerald/10 text-emerald"
      : "border-green/20 bg-green/5 text-green";

  return (
    <span
      className={`inline-flex items-center border px-2.5 py-1 text-xs font-medium ${classes}`}
    >
      {label}
    </span>
  );
}
