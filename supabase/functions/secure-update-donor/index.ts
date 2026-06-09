import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

    const { action, id, password, payload, name, phone, blood_group, new_password } = await req.json();

    // 1. Rate Limiting Check (Max 10 per minute for updates to prevent brute-forcing passwords)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { count, error: countErr } = await supabase
      .from("rate_limit_logs")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", clientIp)
      .gt("created_at", oneMinuteAgo);

    if (count !== null && count >= 10) {
      console.warn(`[RATE LIMIT BLOCKED] IP: ${clientIp} exceeded update threshold.`);
      await supabase.from("rate_limit_logs").insert([{
        ip_address: clientIp,
        request_type: "donor_update",
        status: "blocked",
        reason: "rate_limit"
      }]);
      return new Response(JSON.stringify({ error: { message: "Too many attempts, please try again later." } }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 2. Perform actions based on request type
    if (action === "reset_password") {
      // Password Recovery Action
      const { data: donor, error: fetchErr } = await supabase
        .from("donors")
        .select("id, password")
        .eq("name", name.trim())
        .eq("phone", phone.trim())
        .eq("blood_group", blood_group)
        .maybeSingle();

      if (fetchErr || !donor) {
        await supabase.from("rate_limit_logs").insert([{
          ip_address: clientIp,
          request_type: "donor_update",
          status: "blocked",
          reason: "recovery_failed"
        }]);
        return new Response(JSON.stringify({ error: { message: "Verification failed. No donor matched the provided Name, Phone, and Blood Group." } }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (new_password.trim().length < 4) {
        return new Response(JSON.stringify({ error: { message: "New password must be at least 4 characters long." } }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const { error: updateErr } = await supabase
        .from("donors")
        .update({ password: new_password.trim() })
        .eq("id", donor.id);

      if (updateErr) {
        return new Response(JSON.stringify({ error: { message: "Failed to reset password." } }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      await supabase.from("rate_limit_logs").insert([{
        ip_address: clientIp,
        request_type: "donor_update",
        status: "allowed",
        reason: "reset_password"
      }]);

      return new Response(JSON.stringify({ success: true, error: null }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } else {
      // Actions that require id and password validation: update_availability, update_profile, add_donation
      if (!id || !password) {
        return new Response(JSON.stringify({ error: { message: "Authentication required." } }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const { data: donor, error: fetchErr } = await supabase
        .from("donors")
        .select("password")
        .eq("id", id)
        .maybeSingle();

      if (fetchErr || !donor) {
        return new Response(JSON.stringify({ error: { message: "Donor profile not found." } }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Password verification
      if (donor.password !== password) {
        await supabase.from("rate_limit_logs").insert([{
          ip_address: clientIp,
          request_type: "donor_update",
          status: "blocked",
          reason: "auth_failed"
        }]);
        return new Response(JSON.stringify({ error: { message: "Invalid password credentials." } }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Action routing
      if (action === "update_availability") {
        const { data, error } = await supabase
          .from("donors")
          .update({ is_available: payload.is_available })
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ data, error: null }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

      } else if (action === "update_profile") {
        // Double check duplicate phone if phone is updated
        if (payload.phone) {
          const { data: dupCheck } = await supabase
            .from("donors")
            .select("id")
            .eq("phone", payload.phone)
            .neq("id", id)
            .maybeSingle();

          if (dupCheck) {
            return new Response(JSON.stringify({ error: { message: `Phone number ${payload.phone} is already registered by another user.` } }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
        }

        const { data, error } = await supabase
          .from("donors")
          .update(payload)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ data, error: null }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

      } else if (action === "add_donation") {
        const { data: event, error: insertErr } = await supabase
          .from("donation_history")
          .insert([{ donor_id: id, donation_date: payload.donation_date }])
          .select()
          .single();

        if (insertErr) throw insertErr;

        // Fetch all history for totals recalculation
        const { data: events } = await supabase
          .from("donation_history")
          .select("donation_date")
          .eq("donor_id", id);

        if (events && events.length > 0) {
          const total = events.length;
          const latest = events.reduce((latestDate, current) => {
            if (!latestDate) return current.donation_date;
            return new Date(current.donation_date) > new Date(latestDate) ? current.donation_date : latestDate;
          }, null);

          await supabase
            .from("donors")
            .update({
              total_donations: total,
              last_donation_date: latest,
              is_available: false
            })
            .eq("id", id);
        }

        return new Response(JSON.stringify({ data: event, error: null }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    return new Response(JSON.stringify({ error: { message: "Invalid action." } }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Update error:", err);
    return new Response(JSON.stringify({ error: { message: err.message || "An unexpected error occurred." } }), {
      status: 550,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
