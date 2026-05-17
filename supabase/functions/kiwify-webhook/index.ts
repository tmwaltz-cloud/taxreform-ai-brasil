// supabase/functions/kiwify-webhook/index.ts
// Deploy: supabase functions deploy kiwify-webhook --no-verify-jwt

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Plan = "free" | "mensal" | "vitalicio";

function getEvent(p: Record<string, unknown>): string {
  return (p.webhook_event_type ?? p.event ?? "") as string;
}

function getName(customer: Record<string, unknown>): string {
  return (customer.full_name ?? customer.name ?? customer.first_name ?? "Cliente") as string;
}

function getFrequency(p: Record<string, unknown>): string {
  const sub = (p.Subscription ?? {}) as Record<string, unknown>;
  const plan = (sub.plan ?? {}) as Record<string, unknown>;
  return (plan.frequency ?? sub.charge_frequency ?? "") as string;
}

function resolvePlan(p: Record<string, unknown>): Plan {
  const pid = ((p.Product as Record<string, unknown>)?.product_id ?? 
               (p.Product as Record<string, unknown>)?.id ?? "") as string;
  const freq = getFrequency(p);
  const MENSAL_ID    = Deno.env.get("KIWIFY_PRODUCT_MENSAL_ID") ?? "";
  const VITALICIO_ID = Deno.env.get("KIWIFY_PRODUCT_VITALICIO_ID") ?? "";
  if (MENSAL_ID    && pid === MENSAL_ID)    return "mensal";
  if (VITALICIO_ID && pid === VITALICIO_ID) return "vitalicio";
  if (freq === "monthly" || freq === "weekly" || freq === "yearly") return "mensal";
  if (freq === "lifetime" || freq === "") return "vitalicio";
  return "mensal";
}

function calcExpiry(plan: Plan): string | null {
  if (plan === "vitalicio") return null;
  const d = new Date();
  d.setDate(d.getDate() + 31);
  return d.toISOString();
}

function isApproved(p: Record<string, unknown>): boolean {
  const event  = getEvent(p).toLowerCase();
  const status = ((p.order_status ?? "") as string).toLowerCase();
  return event.includes("order_approved") || event.includes("approved") || status === "paid";
}

function isRevoked(p: Record<string, unknown>): boolean {
  const event = getEvent(p).toLowerCase();
  const sub   = (p.Subscription ?? {}) as Record<string, unknown>;
  return event.includes("refund") || event.includes("chargeback") ||
    (event.includes("subscription") && (sub.status as string)?.includes("cancel"));
}

async function sendWelcomeEmail(name: string, email: string, plan: Plan) {
  const key  = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM_EMAIL") ?? "noreply@taxreform.ai";
  const fromName = Deno.env.get("RESEND_FROM_NAME") ?? "TaxReform.ai";
  if (!key) return;
  const label = plan === "vitalicio" ? "Vitalicio" : "Mensal";
  const emoji = plan === "vitalicio" ? "🏆" : "⚡";
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: `${fromName} <${from}>`,
      to: [email],
      subject: `${emoji} Seu acesso ${label} esta ativo - TaxReform.ai`,
      html: `<p>Ola ${name}! Seu plano <strong>${label}</strong> esta ativo.</p>
             <p><a href="https://taxreform-ai-brasil-slt5.vercel.app/dashboard">Acessar plataforma</a></p>`,
    }),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let payload: Record<string, unknown>;
  try { payload = await req.json(); }
  catch { return new Response("Invalid JSON", { status: 400 }); }

  // Valida token — query param ou body
  const url      = new URL(req.url);
  const received = url.searchParams.get("token") ?? (payload.token as string) ?? "";
  const expected = Deno.env.get("KIWIFY_WEBHOOK_TOKEN") ?? "";
  if (!expected || received !== expected) {
    await supabase.from("kiwify_payments").insert({
      kiwify_order_id: (payload.order_id as string) ?? `fail-${Date.now()}`,
      customer_email:  (payload.Customer as Record<string,unknown>)?.email ?? null,
      plan: "unknown", status: "token_invalido", raw_payload: payload,
    });
    return new Response("Unauthorized", { status: 401 });
  }

  const customer = (payload.Customer ?? {}) as Record<string, unknown>;
  const email    = customer.email as string;
  const name     = getName(customer);
  const event    = getEvent(payload);

  if (!email) return new Response("Missing email", { status: 400 });

  const plan      = resolvePlan(payload);
  const expiresAt = calcExpiry(plan);
  const subId     = (payload.subscription_id as string) ??
                    ((payload.Subscription as Record<string,unknown>)?.id as string) ?? null;
  const orderId   = (payload.order_id as string) ?? `evt-${Date.now()}`;

  let logStatus = "ignored";
  let logMsg    = `Evento nao mapeado: ${event}`;

  try {
    if (isApproved(payload)) {
      const { data: profile } = await supabase
        .from("profiles").select("id").eq("email", email).maybeSingle();

      if (profile) {
        await supabase.from("profiles").update({
          plan, plan_expires_at: expiresAt,
          kiwify_order_id: orderId, kiwify_subscription_id: subId,
        }).eq("email", email);
      } else {
        await supabase.from("pending_access").upsert(
          { email, plan, plan_expires_at: expiresAt,
            kiwify_order_id: orderId, kiwify_subscription_id: subId, granted: false },
          { onConflict: "email" }
        );
      }
      await sendWelcomeEmail(name, email, plan);
      logStatus = "ok";
      logMsg    = `Acesso ${plan} concedido${profile ? "" : " (pending)"}`;

    } else if (isRevoked(payload)) {
      await supabase.from("profiles")
        .update({ plan: "free", plan_expires_at: null }).eq("email", email);
      logStatus = "ok";
      logMsg    = `Plano revertido para free`;
    }
  } catch (err) {
    logStatus = "error";
    logMsg    = err instanceof Error ? err.message : String(err);
  }

  await supabase.from("kiwify_payments").insert({
    kiwify_order_id: orderId, customer_email: email, customer_name: name,
    plan: logStatus === "ok" ? plan : "unknown",
    status: logStatus === "ok" ? (event || "order_approved") : logStatus,
    subscription_id: subId, plan_expires_at: expiresAt, raw_payload: payload,
  });

  return new Response(
    JSON.stringify({ ok: true, status: logStatus, message: logMsg }),
    { headers: { "Content-Type": "application/json" }, status: 200 }
  );
});
