import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const turnstileSecretKey = Deno.env.get("TURNSTILE_SECRET_KEY") || "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const clientIp = req.headers.get("cf-connecting-ip") || 
                     req.headers.get("x-forwarded-for")?.split(",")[0].trim() || 
                     "127.0.0.1";

    const { donorData, turnstileToken, honeypot } = await req.json();

    // 1. Honeypot check (Invisible bot trap)
    if (honeypot && honeypot.trim() !== "") {
      console.warn(`[BOT BLOCKED] Honeypot triggered from IP: ${clientIp}`);
      await supabase.from("rate_limit_logs").insert([{
        ip_address: clientIp,
        request_type: "donor_registration",
        status: "blocked",
        reason: "honeypot_triggered"
      }]);
      return new Response(JSON.stringify({ error: { message: "Verification failed. Bot detected." } }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 2. Rate limiting check (Max 3 requests per minute per IP)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { count, error: countErr } = await supabase
      .from("rate_limit_logs")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", clientIp)
      .gt("created_at", oneMinuteAgo);

    if (countErr) {
      console.error("Error checking rate limit logs:", countErr);
    } else if (count !== null && count >= 3) {
      console.warn(`[RATE LIMIT BLOCKED] IP: ${clientIp} exceeded request threshold.`);
      await supabase.from("rate_limit_logs").insert([{
        ip_address: clientIp,
        request_type: "donor_registration",
        status: "blocked",
        reason: "rate_limit"
      }]);
      return new Response(JSON.stringify({ error: { message: "Too many attempts, please try again in a minute." } }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 3. CAPTCHA verification (Cloudflare Turnstile)
    if (!turnstileToken) {
      await supabase.from("rate_limit_logs").insert([{
        ip_address: clientIp,
        request_type: "donor_registration",
        status: "blocked",
        reason: "captcha_missing"
      }]);
      return new Response(JSON.stringify({ error: { message: "Verification failed. CAPTCHA is missing." } }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Skip Turnstile verification if using dummy testing token in development
    const isTestToken = turnstileToken === "XXXX.DUMMY.TOKEN.XXXX" || turnstileToken.startsWith("1x00000000000000000000AA");
    let turnstileSuccess = false;

    if (isTestToken) {
      turnstileSuccess = true;
    } else {
      try {
        const verifyBody = new URLSearchParams({
          secret: turnstileSecretKey,
          response: turnstileToken,
          remoteip: clientIp,
        });

        const turnstileRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
          method: "POST",
          body: verifyBody,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        });

        const turnstileJson = await turnstileRes.json();
        turnstileSuccess = turnstileJson.success;
      } catch (err) {
        console.error("Turnstile verification error:", err);
      }
    }

    if (!turnstileSuccess) {
      console.warn(`[CAPTCHA BLOCKED] Turnstile validation failed for IP: ${clientIp}`);
      await supabase.from("rate_limit_logs").insert([{
        ip_address: clientIp,
        request_type: "donor_registration",
        status: "blocked",
        reason: "captcha_failed"
      }]);
      return new Response(JSON.stringify({ error: { message: "Verification failed. Please reload and try again." } }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 4. Strict phone validation
    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!donorData.phone || !phoneRegex.test(donorData.phone)) {
      console.warn(`[VALIDATION BLOCKED] Invalid phone format from IP: ${clientIp}. Phone: ${donorData.phone}`);
      await supabase.from("rate_limit_logs").insert([{
        ip_address: clientIp,
        request_type: "donor_registration",
        status: "blocked",
        reason: "invalid_phone"
      }]);
      return new Response(JSON.stringify({ error: { message: "Invalid phone number. Must be a valid 11-digit Bangladeshi number starting with 013-019." } }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 5. Artificial security delay (500–1000ms) to throttle rapid script requests
    const delayMs = Math.floor(Math.random() * 500) + 500;
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    // 6. DB Check if phone is already registered
    const { data: existingDonor } = await supabase
      .from("donors")
      .select("phone")
      .eq("phone", donorData.phone)
      .maybeSingle();

    if (existingDonor) {
      await supabase.from("rate_limit_logs").insert([{
        ip_address: clientIp,
        request_type: "donor_registration",
        status: "blocked",
        reason: "phone_already_exists"
      }]);
      return new Response(JSON.stringify({ error: { message: `Phone number ${donorData.phone} is already registered.` } }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 7. Insert the donor
    const newDonor = {
      name: donorData.name,
      phone: donorData.phone,
      blood_group: donorData.blood_group,
      area: donorData.area,
      last_donation_date: donorData.last_donation_date || null,
      is_available: donorData.is_available ?? true,
      password: donorData.password || "123456",
      total_donations: donorData.last_donation_date ? 1 : 0
    };

    const { data, error } = await supabase
      .from("donors")
      .insert([newDonor])
      .select()
      .single();

    if (error) {
      console.error("Database insert error:", error);
      return new Response(JSON.stringify({ error: { message: "Database registration failed." } }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 8. If last donation date is provided, log it in the donation history
    if (data && newDonor.last_donation_date) {
      await supabase
        .from("donation_history")
        .insert([{ donor_id: data.id, donation_date: newDonor.last_donation_date }]);
    }

    // Log the successful attempt
    await supabase.from("rate_limit_logs").insert([{
      ip_address: clientIp,
      request_type: "donor_registration",
      status: "allowed"
    }]);

    return new Response(JSON.stringify({ data, error: null }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Server error:", err);
    return new Response(JSON.stringify({ error: { message: "An unexpected server error occurred." } }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
