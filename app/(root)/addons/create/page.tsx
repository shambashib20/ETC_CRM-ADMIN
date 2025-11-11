"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import Link from "next/link";

type FormState = {
  title: string;
  description: string;
  value: string;
};

export default function CreateAddons() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    value: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);

  function onChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setError(null);
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const title = form.title.trim();
    const description = form.description.trim();
    const valueNum = Number(form.value);

    // Validation
    if (!title) return setError("TITLE_IS_REQUIRED");
    if (!description) return setError("DESCRIPTION_IS_REQUIRED");
    if (!Number.isFinite(valueNum) || valueNum < 0) {
      return setError("VALUE_MUST_BE_NON_NEGATIVE_NUMBER");
    }

    setSubmitting(true);
    try {
      await apiClient.post("/api/addons/create", {
        title,
        description,
        value: valueNum,
      });

      setSuccess("ADDON_CREATED_SUCCESSFULLY");
      // Small pause so user sees the success, then route
      setTimeout(() => {
        startTransition(() => router.replace("/addons"));
      }, 1500);
    } catch (err: any) {
      setError(err?.message || "FAILED_TO_CREATE_ADDON");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <h1 className="font-display text-3xl md:text-4xl text-foreground">
              CREATE_ADDON
            </h1>
            <p className="text-muted-foreground font-mono text-sm">
              DEFINE_NEW_SERVICE_ADDON
            </p>
          </div>

          <Link
            href="/addons"
            className="px-4 py-2.5 bg-pop text-foreground font-mono text-sm rounded-lg border border-border hover:bg-pop/50 transition-all duration-200"
          >
            BACK_TO_ADDONS
          </Link>
        </div>

        {/* Form Container */}
        <div className="bg-card border border-border rounded-xl p-6">
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Title Field */}
            <div className="space-y-3">
              <label
                className="block text-foreground font-mono text-sm font-medium"
                htmlFor="title"
              >
                ADDON_TITLE
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={form.title}
                onChange={(e) => onChange("title", e.target.value)}
                placeholder="STAFF_SERVICES"
                className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground font-mono placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                autoComplete="off"
                required
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground font-mono">
                ENTER_A_DESCRIPTIVE_TITLE_FOR_THE_ADDON
              </p>
            </div>

            {/* Description Field */}
            <div className="space-y-3">
              <label
                className="block text-foreground font-mono text-sm font-medium"
                htmlFor="description"
              >
                ADDON_DESCRIPTION
              </label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={(e) => onChange("description", e.target.value)}
                placeholder="ADDITION_OF_STAFF_MEMBERS_FOR_ENHANCED_SERVICE"
                className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground font-mono placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 min-h-[120px] resize-vertical"
                required
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground font-mono">
                DESCRIBE_THE_ADDON_SERVICE_IN_DETAIL
              </p>
            </div>

            {/* Value Field */}
            <div className="space-y-3">
              <label
                className="block text-foreground font-mono text-sm font-medium"
                htmlFor="value"
              >
                ADDON_VALUE
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-muted-foreground font-mono">$</span>
                </div>
                <input
                  id="value"
                  name="value"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="1"
                  value={form.value}
                  onChange={(e) => onChange("value", e.target.value)}
                  placeholder="100"
                  className="w-full bg-input border border-border rounded-lg pl-8 pr-4 py-3 text-foreground font-mono placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                  required
                  disabled={submitting}
                />
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                ENTER_A_NON_NEGATIVE_NUMERICAL_VALUE
              </p>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center gap-4 py-4 border-y border-border">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    submitting ? "bg-warning animate-pulse" : "bg-success"
                  }`}
                ></div>
                <span className="text-xs font-mono text-muted-foreground">
                  {submitting ? "PROCESSING_REQUEST" : "SYSTEM_READY"}
                </span>
              </div>
              <div className="w-px h-4 bg-border"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-ring rounded-full"></div>
                <span className="text-xs font-mono text-muted-foreground">
                  ENCRYPTED_CONNECTION
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting || pending}
                className="px-6 py-3 bg-primary text-primary-foreground font-mono text-sm rounded-lg border border-border hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    CREATING_ADDON...
                  </>
                ) : (
                  "CREATE_ADDON"
                )}
              </button>

              <button
                type="button"
                onClick={() => router.back()}
                disabled={submitting}
                className="px-6 py-3 bg-pop text-foreground font-mono text-sm rounded-lg border border-border hover:bg-pop/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card transition-all duration-200 disabled:opacity-50"
              >
                CANCEL
              </button>
            </div>

            {/* Messages */}
            {error && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive font-mono text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 bg-destructive rounded-full"></div>
                  <span>VALIDATION_ERROR</span>
                </div>
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg border border-success bg-success/10 p-4 text-success font-mono text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></div>
                  <span>OPERATION_SUCCESSFUL</span>
                </div>
                {success}
                <div className="mt-2 text-xs opacity-75">
                  REDIRECTING_TO_ADDONS...
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-pop border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-mono text-foreground font-semibold">
              1
            </div>
            <div className="text-xs text-muted-foreground font-mono mt-1">
              NEW_ADDON
            </div>
          </div>
          <div className="bg-pop border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-mono text-foreground font-semibold">
              $0
            </div>
            <div className="text-xs text-muted-foreground font-mono mt-1">
              TOTAL_VALUE
            </div>
          </div>
          <div className="bg-pop border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-mono text-foreground font-semibold">
              ACTIVE
            </div>
            <div className="text-xs text-muted-foreground font-mono mt-1">
              DEFAULT_STATUS
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
