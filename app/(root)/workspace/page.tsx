// app/workspace/page.tsx
import Link from "next/link";
import BracketsIcon from "@/components/icons/brackets";
import DashboardPageLayout from "@/components/dashboard/layout";

// Server Page props: searchParams is a Promise in Next.js 15/16
type PageSearchParams = { page?: string; limit?: string };

type Props = {
  searchParams: Promise<PageSearchParams>;
};

export type Property = {
  _id: string;
  name: string;
  description?: string;
  usage_limits?: number;
  usage_count?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
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
    properties: Property[];
    pagination: Pagination;
  };
};

const API_URL = "http://localhost:8850/api/property/all";

export async function fetchProperties(page = 1, limit = 10) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ page, limit }), // backend expects body
    next: { revalidate: 60, tags: ["properties"] },
    signal: controller.signal,
  }).catch((e: any) => {
    throw new Error(`Network error: ${e?.message || "unknown"}`);
  });

  clearTimeout(timeout);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `API ${res.status}: ${text || "failed to load properties"}`
    );
  }

  const json = (await res.json()) as ApiSuccess;
  if (json.status !== "SUCCESS" || !json.data) {
    throw new Error("Unexpected API shape.");
  }
  return json.data;
}

export default async function WorkspacePage({ searchParams }: Props) {
  // IMPORTANT: await the promise in Next 15/16
  const sp = await searchParams;

  // Parse and clamp
  const pageNum = Number(sp.page ?? 1);
  const limitNum = Number(sp.limit ?? 10);

  const safePage = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1;
  const safeLimit =
    Number.isFinite(limitNum) && limitNum > 0 && limitNum <= 100
      ? limitNum
      : 10;

  const { properties, pagination } = await fetchProperties(safePage, safeLimit);

  return (
    <DashboardPageLayout
      header={{
        title: "Workspace",
        description: "Last updated 12:05",
        icon: BracketsIcon,
      }}
    >
      <div className="grid grid-cols-1 gap-6 mb-1">
        <div className="border-b pb-5 ">
          <h3 className="text-3xl">Properties Listing</h3>
        </div>
      </div>

      <section className="space-y-3">
        {properties.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No properties found.
          </div>
        ) : (
          <ul className="divide-y rounded-2xl border">
            {properties.map((p) => (
              <li key={p._id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold leading-none">{p.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {p.description || "No description"}
                    </p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Usage {p.usage_count ?? 0}/{p.usage_limits ?? 0} • Status{" "}
                      {p.status ?? "N/A"}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">
                    {p.createdAt
                      ? new Date(p.createdAt).toLocaleDateString()
                      : "—"}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        limit={pagination.limit}
      />
    </DashboardPageLayout>
  );
}

// Server component pagination (no "use client")
function Pagination({
  currentPage,
  totalPages,
  limit,
}: {
  currentPage: number;
  totalPages: number;
  limit: number;
}) {
  const prevPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);

  // helper to build href while preserving other query params if needed later
  const hrefWith = (page: number) => {
    const usp = new URLSearchParams();
    usp.set("page", String(page));
    usp.set("limit", String(limit));
    return `?${usp.toString()}`;
  };

  const PageLink = ({
    page,
    disabled,
    label,
  }: {
    page: number;
    disabled?: boolean;
    label: string;
  }) => (
    <Link
      prefetch={false}
      href={hrefWith(page)}
      aria-disabled={disabled}
      className={[
        "px-3 py-2 rounded-xl border",
        disabled
          ? "pointer-events-none opacity-50"
          : "hover:bg-accent hover:text-accent-foreground",
      ].join(" ")}
    >
      {label}
    </Link>
  );

  const windowSize = 5;
  const start = Math.max(1, currentPage - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <nav className="mt-6 flex items-center gap-2">
      <PageLink page={prevPage} disabled={currentPage === 1} label="Prev" />
      {pages.map((p) => (
        <Link
          prefetch={false}
          key={p}
          href={hrefWith(p)}
          className={[
            "px-3 py-2 rounded-xl border",
            p === currentPage
              ? "bg-primary text-primary-foreground"
              : "hover:bg-accent hover:text-accent-foreground",
          ].join(" ")}
          aria-current={p === currentPage ? "page" : undefined}
        >
          {p}
        </Link>
      ))}
      <PageLink
        page={nextPage}
        disabled={currentPage === totalPages}
        label="Next"
      />
    </nav>
  );
}
