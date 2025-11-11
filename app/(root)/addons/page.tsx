// app/addons/page.tsx
"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";

type Addon = {
  _id: string;
  title: string;
  description: string;
  value: number;
  status: string;
  property_id: string;
  createdAt: string;
  updatedAt: string;
};

type Pagination = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type ApiSuccess = {
  message: string;
  status: "SUCCESS";
  data: {
    addons: Addon[];
    pagination: Pagination;
  };
};

export default function AddonsPage() {
  return (
    <Suspense fallback={<GridSkeleton />}>
      <AddonsPageInner />
    </Suspense>
  );
}

function AddonsPageInner() {
  const sp = useSearchParams();
  const router = useRouter();

  const page = useMemo(() => {
    const n = Number(sp.get("page") ?? 1);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }, [sp]);

  const limit = useMemo(() => {
    const n = Number(sp.get("limit") ?? 12);
    return Number.isFinite(n) && n > 0 ? n : 12;
  }, [sp]);

  const [addons, setAddons] = useState<Addon[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      // IMPORTANT: call relative to your apiClient BASE.
      // If BASE is http://localhost:8850/api then use "/addons/fetch" (NOT "/api/addons/fetch")
      const res = (await apiClient.get(
        `/api/addons/fetch?page=${page}&limit=${limit}`
      )) as ApiSuccess;

      setAddons(res.data.addons);
      setPagination(res.data.pagination);
    } catch (e: any) {
      setErr(e?.message || "Failed to load add-ons");
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onChangeLimit = (newLimit: number) => {
    const params = new URLSearchParams(sp.toString());
    params.set("limit", String(newLimit));
    params.set("page", "1");
    router.replace(`?${params.toString()}`);
  };

  const goToPage = (p: number) => {
    const params = new URLSearchParams(sp.toString());
    params.set("page", String(p));
    router.replace(`?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-display text-3xl md:text-4xl text-foreground">
            ADDONS
          </h1>
          <p className="text-muted-foreground font-mono text-sm">
            {pagination
              ? `TOTAL_ADDONS: ${pagination.totalItems}`
              : "LOADING..."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            className="bg-input border border-border rounded-lg px-4 py-2.5 text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
            value={limit}
            onChange={(e) => onChangeLimit(Number(e.target.value))}
          >
            {[12, 24, 36, 48].map((n) => (
              <option key={n} value={n} className="font-mono">
                {n} / PAGE
              </option>
            ))}
          </select>

          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2.5 bg-primary text-primary-foreground font-mono text-sm rounded-lg border border-border hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "REFRESHING..." : "REFRESH"}
          </button>

          <Link
            href="/addons/create"
            className="px-4 py-2.5 bg-success text-primary-foreground font-mono text-sm rounded-lg border border-border hover:bg-success/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-all duration-200"
          >
            CREATE_ADDON
          </Link>
        </div>
      </div>

      {/* Loading */}
      {loading && <GridSkeleton />}

      {/* Error */}
      {err && !loading && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-destructive font-mono text-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 bg-destructive rounded-full animate-pulse"></div>
            <span>SYSTEM_ERROR</span>
          </div>
          {err}
          <div className="mt-4">
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg border border-destructive hover:bg-destructive/90 transition-all duration-200"
            >
              RETRY_CONNECTION
            </button>
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && !err && addons.length === 0 && (
        <div className="rounded-lg border border-border bg-pop p-8 text-center">
          <div className="text-muted-foreground font-mono space-y-3">
            <div className="text-2xl">NO_ADDONS_FOUND</div>
            <div className="text-sm">
              CREATE_YOUR_FIRST_ADDON_TO_GET_STARTED
            </div>
            <Link
              href="/addons/create"
              className="inline-block px-6 py-3 bg-primary text-primary-foreground font-mono rounded-lg border border-border hover:bg-primary/90 transition-all duration-200 mt-4"
            >
              CREATE_ADDON
            </Link>
          </div>
        </div>
      )}

      {/* Grid */}
      {!loading && !err && addons.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {addons.map((addon) => (
              <AddonCard key={addon._id} addon={addon} />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              limit={pagination.limit}
              totalItems={pagination.totalItems}
              onGoToPage={goToPage}
            />
          )}
        </>
      )}
    </div>
  );
}

function AddonCard({ addon }: { addon: Addon }) {
  const statusColors = {
    ACTIVE: "bg-success text-success-foreground",
    INACTIVE: "bg-muted text-muted-foreground",
    PENDING: "bg-warning text-warning-foreground",
    DRAFT: "bg-muted text-muted-foreground",
  } as const;

  const statusColor =
    statusColors[addon.status as keyof typeof statusColors] ??
    statusColors.INACTIVE;

  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:border-ring transition-all duration-200 group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-mono font-semibold text-card-foreground text-lg truncate flex-1">
          {addon.title}
        </h3>
        <span
          className={`px-2 py-1 rounded-lg text-xs font-mono ${statusColor}`}
        >
          {addon.status}
        </span>
      </div>

      <p className="text-muted-foreground font-mono text-sm line-clamp-2 mb-4 min-h-[2.5rem]">
        {addon.description}
      </p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground">VALUE</span>
          <span className="font-mono text-card-foreground font-semibold">
            ${addon.value}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground">
            CREATED
          </span>
          <span className="text-xs font-mono text-muted-foreground">
            {new Date(addon.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-border">
        <Link
          href={
            `/addons/edit?` +
            new URLSearchParams({
              id: addon._id,
              title: addon.title,
              description: addon.description,
              value: String(addon.value),
              status: addon.status,
            }).toString()
          }
          className="flex-1 py-2 text-center bg-pop text-foreground font-mono text-sm rounded-lg border border-border hover:bg-pop/50 transition-all duration-200"
        >
          EDIT
        </Link>
      </div>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  limit,
  totalItems,
  onGoToPage,
}: {
  currentPage: number;
  totalPages: number;
  limit: number;
  totalItems: number;
  onGoToPage: (page: number) => void;
}) {
  const prev = Math.max(1, currentPage - 1);
  const next = Math.min(totalPages, currentPage + 1);

  const pages = useMemo(() => {
    const windowSize = 5;
    const half = Math.floor(windowSize / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + windowSize - 1);
    start = Math.max(1, Math.min(start, end - windowSize + 1));
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border">
      <div className="text-muted-foreground font-mono text-sm">
        PAGE {currentPage} OF {totalPages} • {totalItems} ITEMS
      </div>

      <nav className="flex items-center gap-1">
        <button
          onClick={() => onGoToPage(prev)}
          disabled={currentPage === 1}
          className="px-3 py-2 border border-border rounded-lg font-mono text-sm hover:bg-pop transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          PREV
        </button>

        {pages[0] > 1 && (
          <>
            <button
              onClick={() => onGoToPage(1)}
              className="px-3 py-2 border border-border rounded-lg font-mono text-sm hover:bg-pop transition-all duration-200"
            >
              1
            </button>
            {pages[0] > 2 && (
              <span className="px-2 text-muted-foreground">...</span>
            )}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onGoToPage(p)}
            className={`px-3 py-2 border rounded-lg font-mono text-sm transition-all duration-200 ${
              p === currentPage
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:bg-pop"
            }`}
          >
            {p}
          </button>
        ))}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && (
              <span className="px-2 text-muted-foreground">...</span>
            )}
            <button
              onClick={() => onGoToPage(totalPages)}
              className="px-3 py-2 border border-border rounded-lg font-mono text-sm hover:bg-pop transition-all duration-200"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => onGoToPage(next)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 border border-border rounded-lg font-mono text-sm hover:bg-pop transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          NEXT
        </button>
      </nav>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="bg-card border border-border rounded-xl p-4 animate-pulse"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="h-6 bg-input rounded flex-1"></div>
            <div className="h-6 w-16 bg-input rounded"></div>
          </div>
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-input rounded"></div>
            <div className="h-4 bg-input rounded w-3/4"></div>
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <div className="h-3 w-12 bg-input rounded"></div>
              <div className="h-3 w-8 bg-input rounded"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-3 w-16 bg-input rounded"></div>
              <div className="h-3 w-20 bg-input rounded"></div>
            </div>
          </div>
          <div className="flex gap-2 pt-3 border-t border-border">
            <div className="flex-1 h-8 bg-input rounded"></div>
            <div className="flex-1 h-8 bg-input rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
