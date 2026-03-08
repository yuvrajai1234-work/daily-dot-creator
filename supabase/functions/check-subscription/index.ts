import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Map price IDs to P Coin amounts
const PRICE_TO_COINS: Record<string, number> = {
  "price_1T8fRY3WWGDm9b3SU9X2iL9b": 100,   // Weekly
  "price_1T8fRx3WWGDm9b3SMOyeXEzd": 500,   // Monthly
  "price_1T8fUl3WWGDm9b3SbovWfS5J": 3000,  // 6 Months
  "price_1T8fVR3WWGDm9b3SjUzJbidC": 7000,  // Yearly
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No customer found");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let productId = null;
    let priceId = null;
    let subscriptionEnd = null;
    let coinsCredited = false;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      const periodEnd = new Date(subscription.current_period_end * 1000);
      subscriptionEnd = periodEnd.toISOString();
      productId = subscription.items.data[0].price.product;
      priceId = subscription.items.data[0].price.id;
      logStep("Active subscription found", { productId, priceId, subscriptionEnd });

      // Credit P Coins if this billing period hasn't been credited yet
      const coinAmount = PRICE_TO_COINS[priceId] || 0;
      if (coinAmount > 0) {
        // Check if we already credited for this period
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("p_coin_last_credited_period_end")
          .eq("user_id", user.id)
          .single();

        const lastCredited = profile?.p_coin_last_credited_period_end;
        const alreadyCredited = lastCredited && new Date(lastCredited).getTime() === periodEnd.getTime();

        if (!alreadyCredited) {
          logStep("Crediting P Coins", { coinAmount, periodEnd: subscriptionEnd });
          const { error: updateError } = await supabaseClient
            .from("profiles")
            .update({
              p_coin_balance: (profile as any)?.p_coin_balance
                ? (profile as any).p_coin_balance + coinAmount
                : coinAmount,
              p_coin_last_credited_period_end: subscriptionEnd,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id);

          if (updateError) {
            logStep("Failed to credit P Coins", { error: updateError.message });
          } else {
            coinsCredited = true;
            logStep("P Coins credited successfully", { coinAmount });
          }
        } else {
          logStep("P Coins already credited for this period");
        }
      }
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      product_id: productId,
      price_id: priceId,
      subscription_end: subscriptionEnd,
      coins_credited: coinsCredited,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
