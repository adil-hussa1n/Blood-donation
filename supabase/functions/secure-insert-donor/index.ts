import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const resolveTotalDonations = (data: {
  total_donations?: number | string | null;
  last_donation_date?: string | null;
}) => {
  const raw = data.total_donations;
  if (raw !== undefined && raw !== null && raw !== "") {
    const parsed = Number.parseInt(String(raw), 10);
    if (!Number.isNaN(parsed)) {
      return Math.min(Math.max(parsed, 0), 999);
    }
  }
  return data.last_donation_date ? 1 : 0;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const clientIp = req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      "127.0.0.1";

    const { donorData, honeypot } = await req.json();

    if (honeypot && honeypot.trim() !== "") {
      await supabase.from("rate_limit_logs").insert([{
        ip_address: clientIp,
        request_type: "donor_registration",
        status: "blocked",
        reason: "honeypot_triggered",
      }]);
      return new Response(JSON.stringify({ error: { message: "Verification failed. Bot detected." } }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { count, error: countErr } = await supabase
      .from("rate_limit_logs")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", clientIp)
      .gt("created_at", oneMinuteAgo);

    if (!countErr && count !== null && count >= 3) {
      await supabase.from("rate_limit_logs").insert([{
        ip_address: clientIp,
        request_type: "donor_registration",
        status: "blocked",
        reason: "rate_limit",
      }]);
      return new Response(JSON.stringify({ error: { message: "Too many attempts, please try again in a minute." } }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!donorData?.phone || !phoneRegex.test(donorData.phone)) {
      await supabase.from("rate_limit_logs").insert([{
        ip_address: clientIp,
        request_type: "donor_registration",
        status: "blocked",
        reason: "invalid_phone",
      }]);
      return new Response(JSON.stringify({ error: { message: "Invalid phone number. Must be a valid 11-digit Bangladeshi number starting with 013-019." } }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 500) + 500));

    // Block check — reject if phone is blocked by admin
    const { data: isBlocked } = await supabase
      .from("blocked_donors")
      .select("phone")
      .eq("phone", donorData.phone.trim())
      .maybeSingle();

    if (isBlocked) {
      await supabase.from("rate_limit_logs").insert([{
        ip_address: clientIp,
        request_type: "donor_registration",
        status: "blocked",
        reason: "phone_blocked",
      }]);
      return new Response(JSON.stringify({ error: { message: "Your account has been blocked. Contact Support." } }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: existingDonor } = await supabase
      .from("donors")
      .select("phone")
      .eq("phone", donorData.phone)
      .maybeSingle();

    if (existingDonor) {
      return new Response(JSON.stringify({ error: { message: `Phone number ${donorData.phone} is already registered.` } }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DOB required check
    if (!donorData?.dob) {
      await supabase.from("rate_limit_logs").insert([{
        ip_address: clientIp,
        request_type: "donor_registration",
        status: "blocked",
        reason: "missing_dob",
      }]);
      return new Response(JSON.stringify({ error: { message: "Date of birth is required for registration." } }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resolvedTotalDonations = resolveTotalDonations(donorData);

    // Insert donor row. Do NOT insert donation_history here — that was resetting
    // total_donations to 1 via DB triggers. Cooldown uses donors.last_donation_date.
    const { data: inserted, error } = await supabase
      .from("donors")
      .insert([{
        name: donorData.name,
        phone: donorData.phone,
        blood_group: donorData.blood_group,
        area: donorData.area,
        last_donation_date: donorData.last_donation_date || null,
        is_available: donorData.is_available ?? true,
        password: donorData.password || "123456",
        total_donations: resolvedTotalDonations,
        dob: donorData.dob,
      }])
      .select()
      .single();

    if (error || !inserted) {
      console.error("Database insert error:", error);
      return new Response(JSON.stringify({ error: { message: "Database registration failed." } }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Force-save self-reported total via RPC (survives generated columns / triggers)
    const { error: rpcError } = await supabase.rpc("set_donor_total_donations", {
      p_donor_id: inserted.id,
      p_total: resolvedTotalDonations,
    });

    if (rpcError) {
      console.warn("RPC set_donor_total_donations failed, falling back to update:", rpcError.message);
      await supabase
        .from("donors")
        .update({ total_donations: resolvedTotalDonations })
        .eq("id", inserted.id);
    }

    const { data: finalDonor, error: fetchError } = await supabase
      .from("donors")
      .select("*")
      .eq("id", inserted.id)
      .single();

    if (fetchError) {
      console.error("Failed to fetch final donor:", fetchError);
    }

    await supabase.from("rate_limit_logs").insert([{
      ip_address: clientIp,
      request_type: "donor_registration",
      status: "allowed",
    }]);

    const donor = finalDonor ?? { ...inserted, total_donations: resolvedTotalDonations };

    return new Response(JSON.stringify({
      data: donor,
      error: null,
      saved_total_donations: resolvedTotalDonations,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Server error:", err);
    return new Response(JSON.stringify({ error: { message: "An unexpected server error occurred." } }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
