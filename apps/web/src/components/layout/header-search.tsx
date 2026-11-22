"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Search } from "lucide-react";

export function HeaderSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      className={`relative flex min-w-0 flex-1 items-stretch overflow-hidden rounded-full border border-gold/80 bg-white shadow-[0_1px_6px_rgba(0,0,0,0.12)] ${className ?? ""}`}
    >
      <label htmlFor="header-search" className="sr-only">
        Search products
      </label>
      <span className="flex items-center pl-3.5 text-green">
        <Search className="h-4 w-4" aria-hidden />
      </span>
      <input
        id="header-search"
        name="q"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search for lehengas, suits, jewellery and more..."
        className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm text-green placeholder:text-green/55 focus-visible:outline-none"
      />
      <button
        type="submit"
        className="gold-search-btn shrink-0 px-5 text-[11px] font-bold uppercase tracking-[0.12em] sm:px-6"
      >
        Search
      </button>
    </form>
  );
}
