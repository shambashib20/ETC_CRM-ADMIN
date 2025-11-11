// components/dashboard/SecurityStatusContainer.tsx
"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import SecurityStatus from "@/components/dashboard/security-status";
import type { SecurityStatus as SecurityStatusType } from "@/types/dashboard";

type ApiStatusResponse = {
  status: number;
  message: string;
  data: {
    server: string;
    dbStatus: string;
    cpuLoad: string; // "0.00"
    memory: {
      totalGB: string; // "11.97"
      usedGB: string; // "9.45"
      usagePercent: string; // "78.91"
    };
    paymentWebhookStatus: {
      success: boolean;
      message: string;
      webhookId?: string;
      webhookUrl?: string;
      events?: string[];
    };
  };
};

function pickVariant(
  level: "ok" | "warn" | "bad"
): "success" | "warning" | "destructive" {
  if (level === "ok") return "success";
  if (level === "warn") return "warning";
  return "destructive";
}

function toStatuses(api: ApiStatusResponse["data"]): SecurityStatusType[] {
  // CPU thresholds (rough): <0.7 ok, 0.7–1.5 warn, >1.5 bad
  const cpu = parseFloat(api.cpuLoad || "0");
  const cpuLevel = cpu < 0.7 ? "ok" : cpu < 1.5 ? "warn" : "bad";

  // Memory thresholds: <80% ok, 80–95 warn, >95 bad
  const memPct = parseFloat(api.memory?.usagePercent || "0");
  const memLevel = memPct < 80 ? "ok" : memPct < 95 ? "warn" : "bad";

  // DB status simple check
  const dbConnected = /connected/i.test(api.dbStatus || "");
  const dbLevel = dbConnected ? "ok" : "bad";

  // Server: if we got a string with "server started", call it ok
  const serverUp =
    /server started/i.test(api.server || "") ||
    /started/i.test(api.server || "");

  const serverLevel = serverUp ? "ok" : "bad";

  // Webhook: based on success boolean
  const hookOk = !!api.paymentWebhookStatus?.success;
  const hookLevel = hookOk ? "ok" : "bad";
  console.log(api.server);

  const statuses: SecurityStatusType[] = [
    {
      title: "SERVER",
      value: serverUp ? "ONLINE" : "OFFLINE",
      status: api.server || "No server info",
      variant: pickVariant(serverLevel),
    },
    {
      title: "DATABASE",
      value: dbConnected ? "CONNECTED" : "DISCONNECTED",
      status: api.dbStatus || "No DB info",
      variant: pickVariant(dbLevel),
    },
    {
      title: "CPU LOAD",
      value: isFinite(cpu) ? String(cpu) : "N/A",
      status: "Lower is better",
      variant: pickVariant(cpuLevel),
    },
    {
      title: "MEMORY",
      value: api.memory
        ? `${api.memory.usedGB}/${api.memory.totalGB} GB`
        : "N/A",
      status: api.memory ? `${memPct.toFixed(0)}% used` : "No memory info",
      variant: pickVariant(memLevel),
    },
    {
      title: "WEBHOOK",
      value: hookOk ? "ACTIVE" : "INACTIVE",
      status:
        api.paymentWebhookStatus?.message ||
        api.paymentWebhookStatus?.webhookUrl ||
        "No webhook info",
      variant: pickVariant(hookLevel),
    },
  ];

  return statuses;
}

export default function SecurityStatusContainer() {
  const [statuses, setStatuses] = useState<SecurityStatusType[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let dead = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = (await apiClient.get("/status")) as ApiStatusResponse;
        if (dead) return;
        setStatuses(toStatuses(res.data));
      } catch (e: any) {
        if (dead) return;
        setError(e?.message || "Failed to fetch status");
      } finally {
        if (!dead) setLoading(false);
      }
    }

    run();
    return () => {
      dead = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-md border p-4 text-sm opacity-70">
        Fetching system status…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive text-sm">
        {error}
      </div>
    );
  }

  if (!statuses) return null;

  return <SecurityStatus statuses={statuses} />;
}
