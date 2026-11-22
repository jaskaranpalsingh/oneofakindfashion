"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/api";

type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId: string | null;
  imageUrl: string | null;
  displayOrder: number;
  isVisible: boolean;
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      const me = await fetch(`${getApiBaseUrl()}/api/v1/auth/me`, {
        credentials: "include",
      });
      const meJson = await me.json();
      if (!me.ok || meJson?.data?.user?.role !== "admin") {
        setError("Admin sign-in required. Use /account/login.");
        return;
      }

      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/categories?includeHidden=true`,
        { credentials: "include" }
      );
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json?.error?.message ?? "Failed to load categories");
      }

      const rows = (json.data as AdminCategory[]).filter(
        (category) => !category.parentId
      );
      setCategories(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories");
    }
  }

  function updateLocal(id: string, patch: Partial<AdminCategory>) {
    setCategories((current) =>
      current.map((category) =>
        category.id === id ? { ...category, ...patch } : category
      )
    );
  }

  async function saveCategory(category: AdminCategory) {
    setSavingId(category.id);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/admin/categories/${category.id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: category.name,
            description: category.description,
            imageUrl: category.imageUrl || undefined,
            displayOrder: category.displayOrder,
            isVisible: category.isVisible,
          }),
        }
      );
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json?.error?.message ?? "Failed to save category");
      }
      setMessage(`Saved ${category.name}. Homepage collections will refresh on next load.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-ink">Categories</h1>
        <p className="mt-1 text-sm text-muted">
          Manage featured collection cards: image, title, description, order, and
          visibility.
        </p>
      </div>

      {error ? (
        <p className="border border-green/20 bg-green/5 px-4 py-3 text-sm text-green">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-green">
          {message}
        </p>
      ) : null}

      <div className="space-y-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="border border-border bg-white p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-serif text-2xl text-green">{category.name}</p>
                <p className="text-xs uppercase tracking-[0.14em] text-muted">
                  /shop/{category.slug}
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm text-green">
                <input
                  type="checkbox"
                  checked={category.isVisible}
                  onChange={(event) =>
                    updateLocal(category.id, { isVisible: event.target.checked })
                  }
                />
                Featured / visible
              </label>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Title
                <input
                  value={category.name}
                  onChange={(event) =>
                    updateLocal(category.id, { name: event.target.value })
                  }
                  className="mt-1 w-full border border-border px-3 py-2 text-sm text-ink"
                />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Display order
                <input
                  type="number"
                  min={0}
                  value={category.displayOrder}
                  onChange={(event) =>
                    updateLocal(category.id, {
                      displayOrder: Number(event.target.value) || 0,
                    })
                  }
                  className="mt-1 w-full border border-border px-3 py-2 text-sm text-ink"
                />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted md:col-span-2">
                Description
                <input
                  value={category.description}
                  onChange={(event) =>
                    updateLocal(category.id, { description: event.target.value })
                  }
                  className="mt-1 w-full border border-border px-3 py-2 text-sm text-ink"
                />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted md:col-span-2">
                Image URL
                <input
                  value={category.imageUrl ?? ""}
                  onChange={(event) =>
                    updateLocal(category.id, { imageUrl: event.target.value })
                  }
                  placeholder="/images/collections/lehengas.jpg"
                  className="mt-1 w-full border border-border px-3 py-2 text-sm text-ink"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={savingId === category.id}
                onClick={() => void saveCategory(category)}
                className="bg-green px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white hover:bg-green-emerald disabled:opacity-50"
              >
                {savingId === category.id ? "Saving…" : "Save"}
              </button>
              <Link
                href={`/shop/${category.slug}`}
                className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-green underline-offset-4 hover:underline"
              >
                View storefront
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
