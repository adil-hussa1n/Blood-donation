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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const clientIp = req.headers.get("cf-connecting-ip") || 
                     req.headers.get("x-forwarded-for")?.split(",")[0].trim() || 
                     "127.0.0.1";

    const { requestData, honeypot } = await req.json();

    // 1. Honeypot check
    if (honeypot && honeypot.trim() !== "") {
      console.warn(`[BOT BLOCKED] Honeypot triggered from IP: ${clientIp}`);
      await supabase.from("rate_limit_logs").insert([{
        ip_address: clientIp,
        request_type: "emergency_request",
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
        request_type: "emergency_request",
        status: "blocked",
        reason: "rate_limit"
      }]);
      return new Response(JSON.stringify({ error: { message: "Too many attempts, please try again in a minute." } }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 3. Strict contact phone validation
    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!requestData.contact || !phoneRegex.test(requestData.contact)) {
      console.warn(`[VALIDATION BLOCKED] Invalid contact phone format from IP: ${clientIp}. Contact: ${requestData.contact}`);
      await supabase.from("rate_limit_logs").insert([{
        ip_address: clientIp,
        request_type: "emergency_request",
        status: "blocked",
        reason: "invalid_phone"
      }]);
      return new Response(JSON.stringify({ error: { message: "Invalid contact number. Must be a valid 11-digit Bangladeshi number starting with 013-019." } }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 4. Artificial security delay
    const delayMs = Math.floor(Math.random() * 500) + 500;
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    // 5. Check if the contact phone belongs to a registered donor
    let finalPasscode = requestData.passcode || "1234";
    const { data: donor } = await supabase
      .from("donors")
      .select("password")
      .eq("phone", requestData.contact)
      .maybeSingle();

    if (donor) {
      // If contact phone is registered, check if the passcode matches the account password
      if (donor.password !== requestData.passcode) {
        await supabase.from("rate_limit_logs").insert([{
          ip_address: clientIp,
          request_type: "emergency_request",
          status: "blocked",
          reason: "auth_failed"
        }]);
        return new Response(JSON.stringify({ 
          error: { message: "This contact phone number is registered. Please enter your correct donor account password to authorize posting." } 
        }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      finalPasscode = donor.password;
    }

    // 6. Insert the emergency request
    const newRequest = {
      blood_group: requestData.blood_group,
      area: requestData.area,
      contact: requestData.contact,
      note: requestData.note || "",
      passcode: finalPasscode
    };

    const { data, error } = await supabase
      .from("emergency_requests")
      .insert([newRequest])
      .select()
      .single();

    if (error) {
      console.error("Database insert error:", error);
      return new Response(JSON.stringify({ error: { message: "Database emergency request creation failed." } }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Log the successful attempt
    await supabase.from("rate_limit_logs").insert([{
      ip_address: clientIp,
      request_type: "emergency_request",
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
