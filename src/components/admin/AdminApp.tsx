"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/data/products";
import { ORDER_STATUSES, type OrderStatus, type PaymentStatus, type StoredOrder } from "@/lib/orderSchemas";

type OrdersResponse = { ok: boolean; orders?: StoredOrder[]; error?: string };

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_TONE: Record<OrderStatus, string> = {
  pending: "text-cream/60 border-cream/25",
  confirmed: "text-gold border-gold/40",
  shipped: "text-gold-2 border-gold-2/40",
  delivered: "text-emerald-300 border-emerald-300/40",
  cancelled: "text-red-300 border-red-300/40",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function AdminApp() {
  const [phase, setPhase] = useState<"checking" | "login" | "ready">("checking");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyRef, setBusyRef] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");

  const loadOrders = useCallback(async () => {
    setLoadError(null);
    const res = await fetch("/api/admin/orders", { cache: "no-store" });
    if (res.status === 401) {
      setPhase("login");
      return;
    }
    const json = (await res.json().catch(() => null)) as OrdersResponse | null;
    if (!res.ok || !json?.ok || !json.orders) {
      setLoadError(json?.error ?? "Unable to load orders.");
      setPhase("login");
      return;
    }
    setOrders(json.orders);
    setPhase("ready");
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const login = async () => {
    setLoginError(null);
    setLoggingIn(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !json?.ok) {
        setLoginError(json?.error ?? "Unable to sign in.");
        return;
      }
      setPassword("");
      await loadOrders();
    } catch {
      setLoginError("Network error. Please try again.");
    } finally {
      setLoggingIn(false);
    }
  };

  const logout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" }).catch(() => null);
    setOrders([]);
    setPhase("login");
  };

  const patchOrder = async (ref: string, patch: { status?: OrderStatus; paymentStatus?: PaymentStatus }) => {
    setBusyRef(ref);
    try {
      const res = await fetch("/api/admin/orders/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref, ...patch }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; order?: StoredOrder; error?: string } | null;
      if (!res.ok || !json?.ok || !json.order) {
        setLoadError(json?.error ?? "Update failed.");
        return;
      }
      setOrders((prev) => prev.map((o) => (o.ref === ref && json.order ? json.order : o)));
    } catch {
      setLoadError("Network error — update not saved.");
    } finally {
      setBusyRef(null);
    }
  };

  const visible = useMemo(
    () => (statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter)),
    [orders, statusFilter],
  );
  const pendingPayments = useMemo(() => orders.filter((o) => o.paymentStatus === "pending" && o.status !== "cancelled"), [orders]);
  const collectedTotal = useMemo(
    () => orders.filter((o) => o.paymentStatus === "collected").reduce((n, o) => n + o.total, 0),
    [orders],
  );

  if (phase === "checking") {
    return <div className="flex min-h-screen items-center justify-center eyebrow text-[10px] text-cream/50">Checking session…</div>;
  }

  if (phase === "login") {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <form
          className="w-full max-w-sm border border-cream/10 bg-cream/[0.03] p-8"
          onSubmit={(e) => {
            e.preventDefault();
            login();
          }}
        >
          <p className="eyebrow text-[10px] text-gold">Merchant access</p>
          <h1 className="display mt-3 text-3xl">Miskova Orders</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            className="mt-6 w-full border border-cream/15 bg-transparent px-4 py-3 font-sans text-sm text-cream placeholder:text-cream/30 focus:border-gold/60 focus:outline-none"
            autoComplete="current-password"
            autoFocus
          />
          {loginError && (
            <p role="alert" className="mt-3 font-sans text-xs tracking-wide text-red-300">
              {loginError}
            </p>
          )}
          <button
            type="submit"
            disabled={loggingIn || password.length === 0}
            className="mt-6 w-full border border-gold/60 bg-gold/90 py-3 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {loggingIn ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 md:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow text-[10px] text-gold">Merchant dashboard</p>
          <h1 className="display mt-2 text-4xl">Orders &amp; payments</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadOrders} className="border border-cream/20 px-4 py-2 eyebrow text-[10px] text-cream/70 transition-colors hover:border-gold/50 hover:text-cream">
            Refresh
          </button>
          <button onClick={logout} className="border border-cream/20 px-4 py-2 eyebrow text-[10px] text-cream/70 transition-colors hover:border-red-300/50 hover:text-red-200">
            Sign out
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="border border-cream/10 bg-cream/[0.03] p-4">
          <p className="eyebrow text-[10px] text-cream/50">Orders</p>
          <p className="mt-1 font-display text-3xl text-cream">{orders.length}</p>
        </div>
        <div className="border border-cream/10 bg-cream/[0.03] p-4">
          <p className="eyebrow text-[10px] text-cream/50">Payments to collect</p>
          <p className="mt-1 font-display text-3xl text-gold-2">{pendingPayments.length}</p>
          <p className="mt-1 font-sans text-[11px] text-cream/40">{formatPrice(pendingPayments.reduce((n, o) => n + o.total, 0))} outstanding</p>
        </div>
        <div className="border border-cream/10 bg-cream/[0.03] p-4">
          <p className="eyebrow text-[10px] text-cream/50">Cash collected</p>
          <p className="mt-1 font-display text-3xl text-emerald-300">{formatPrice(collectedTotal)}</p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        {(["all", ...ORDER_STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`border px-3 py-1.5 eyebrow text-[10px] transition-colors ${
              statusFilter === s ? "border-gold/60 text-gold" : "border-cream/15 text-cream/50 hover:text-cream"
            }`}
          >
            {s === "all" ? "All" : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {loadError && (
        <p role="alert" className="mt-4 border border-red-300/30 bg-red-300/5 px-4 py-3 font-sans text-xs text-red-200">
          {loadError}
        </p>
      )}

      <ul className="mt-6 flex flex-col gap-4 pb-16">
        {visible.map((o) => (
          <li key={o.ref} className="border border-cream/10 bg-cream/[0.02] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-2xl text-gold-2">{o.ref}</p>
                <p className="mt-1 font-sans text-[11px] tracking-wider text-cream/40">
                  {formatDate(o.createdAt)} · {o.paymentMethod === "cod" ? "Cash on delivery" : o.paymentMethod}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl text-cream">{formatPrice(o.total)}</p>
                <p className={`mt-1 inline-block border px-2 py-0.5 eyebrow text-[9px] ${STATUS_TONE[o.status]}`}>
                  {STATUS_LABEL[o.status]}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="eyebrow text-[9px] text-cream/40">Items</p>
                <ul className="mt-2 space-y-1">
                  {o.items.map((l) => (
                    <li key={l.slug} className="flex justify-between gap-3 font-sans text-xs text-cream/75">
                      <span>
                        {l.name} × {l.qty}
                      </span>
                      <span className="shrink-0 text-cream/50">{formatPrice(l.unitPrice * l.qty)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="eyebrow text-[9px] text-cream/40">Customer</p>
                <p className="mt-2 font-sans text-xs leading-relaxed text-cream/75">
                  {o.customer.name} · <a href={`tel:${o.customer.phone}`} className="text-gold-2 underline-offset-2 hover:underline">{o.customer.phone}</a>
                  <br />
                  {o.customer.governorate} — {o.customer.address}
                  {o.customer.notes && (
                    <>
                      <br />
                      <span className="text-cream/45">Note: {o.customer.notes}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-cream/10 pt-4">
              <label className="eyebrow text-[9px] text-cream/40" htmlFor={`status-${o.ref}`}>
                Status
              </label>
              <select
                id={`status-${o.ref}`}
                value={o.status}
                disabled={busyRef === o.ref}
                onChange={(e) => patchOrder(o.ref, { status: e.target.value as OrderStatus })}
                className="border border-cream/15 bg-ink px-3 py-2 font-sans text-xs text-cream focus:border-gold/60 focus:outline-none disabled:opacity-40 [&>option]:bg-ink"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>

              {o.paymentStatus === "collected" ? (
                <span className="flex items-center gap-2 border border-emerald-300/40 px-3 py-2 eyebrow text-[9px] text-emerald-300">
                  Paid · collected {o.paymentCollectedAt ? formatDate(o.paymentCollectedAt) : ""}
                </span>
              ) : (
                <button
                  onClick={() => patchOrder(o.ref, { paymentStatus: "collected" })}
                  disabled={busyRef === o.ref || o.status === "cancelled"}
                  className="border border-gold/60 bg-gold/90 px-4 py-2 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-ink transition-opacity hover:opacity-90 disabled:opacity-30"
                >
                  {busyRef === o.ref ? "Saving…" : "Mark payment collected"}
                </button>
              )}
              {o.paymentStatus === "collected" && (
                <button
                  onClick={() => patchOrder(o.ref, { paymentStatus: "pending" })}
                  disabled={busyRef === o.ref}
                  className="link-draw eyebrow text-[9px] text-cream/40 hover:text-cream disabled:opacity-30"
                >
                  Undo
                </button>
              )}
            </div>
          </li>
        ))}
        {visible.length === 0 && (
          <li className="border border-dashed border-cream/15 p-10 text-center font-sans text-sm text-cream/40">No orders in this view yet.</li>
        )}
      </ul>
    </div>
  );
}
