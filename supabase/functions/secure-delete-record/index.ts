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

    const { type, id, adminUsername, adminPassword, userPasscode } = await req.json();

    // 1. Authenticate Admin if admin credentials are provided
    let isAuthorizedAdmin = false;
    const isHardcodedAdmin = 
      adminUsername?.trim().toLowerCase() === "adilhussa1n" && 
      adminPassword === "Adil@1267";

    if (adminUsername && adminPassword) {
      if (isHardcodedAdmin) {
        isAuthorizedAdmin = true;
      } else {
        const { data: adminMatch } = await supabase
          .from("admins")
          .select("id")
          .eq("username", adminUsername.trim())
          .eq("password", adminPassword)
          .maybeSingle();
        
        if (adminMatch) {
          isAuthorizedAdmin = true;
        }
      }
    }

    if (type === "donor") {
      // Donors can only be deleted by admins
      if (!isAuthorizedAdmin) {
        await supabase.from("rate_limit_logs").insert([{
          ip_address: clientIp,
          request_type: "admin_action",
          status: "blocked",
          reason: "unauthorized_donor_delete"
        }]);
        return new Response(JSON.stringify({ error: { message: "Unauthorized. Admin credentials required." } }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Perform deletion (donation history is linked or cascaded)
      // Delete history first to avoid foreign key issues
      await supabase.from("donation_history").delete().eq("donor_id", id);
      const { error } = await supabase.from("donors").delete().eq("id", id);

      if (error) throw error;

      await supabase.from("rate_limit_logs").insert([{
        ip_address: clientIp,
        request_type: "admin_action",
        status: "allowed",
        reason: "delete_donor"
      }]);

      return new Response(JSON.stringify({ success: true, error: null }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } else if (type === "emergency") {
      // Emergency requests can be deleted by admins OR by users using the correct passcode
      let isAuthorizedUser = false;

      if (!isAuthorizedAdmin) {
        if (!userPasscode) {
          return new Response(JSON.stringify({ error: { message: "Passcode required to delete request." } }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const { data: request } = await supabase
          .from("emergency_requests")
          .select("contact, passcode")
          .eq("id", id)
          .maybeSingle();

        if (request) {
          const enteredTrimmed = String(userPasscode).trim();
          
          // Check if contact is a registered donor
          const { data: donor } = await supabase
            .from("donors")
            .select("password")
            .eq("phone", request.contact)
            .maybeSingle();

          if (donor) {
            isAuthorizedUser = String(donor.password).trim() === enteredTrimmed;
          } else if (request.passcode) {
            isAuthorizedUser = String(request.passcode).trim() === enteredTrimmed;
          }
        }
      }

      if (!isAuthorizedAdmin && !isAuthorizedUser) {
        await supabase.from("rate_limit_logs").insert([{
          ip_address: clientIp,
          request_type: "donor_update",
          status: "blocked",
          reason: "unauthorized_emergency_delete"
        }]);
        return new Response(JSON.stringify({ error: { message: "Incorrect password. Deletion rejected." } }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const { error } = await supabase.from("emergency_requests").delete().eq("id", id);
      if (error) throw error;

      await supabase.from("rate_limit_logs").insert([{
        ip_address: clientIp,
        request_type: isAuthorizedAdmin ? "admin_action" : "donor_update",
        status: "allowed",
        reason: "delete_emergency"
      }]);

      return new Response(JSON.stringify({ success: true, error: null }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: { message: "Invalid type." } }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Delete error:", err);
    return new Response(JSON.stringify({ error: { message: err.message || "An unexpected error occurred." } }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
