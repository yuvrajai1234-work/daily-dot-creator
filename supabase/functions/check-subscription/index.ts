import { serve } from "std/http/server";
import Stripe from "stripe";
import { createClient } from "supabase";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
    const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
    console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

const PRICE_TO_COINS: Record<string, number> = {
    "price_1T8fRY3WWGDm9b3SU9X2iL9b": 100,
    "price_1T8fRx3WWGDm9b3SMOyeXEzd": 500,
    "price_1T8fUl3WWGDm9b3SbovWfS5J": 3000,
    "price_1T8fVR3WWGDm9b3SjUzJbidC": 7000,
};

serve(async (req: Request) => {
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

        // Parse body to check for force flag
        let forceClaim = false;
        try {
            const body = await req.json().catch(() => ({}));
            forceClaim = body?.force === true;
        } catch (_) { /* no body is fine */ }

        logStep("Force claim mode", { forceClaim });

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
        let coinsAmount = 0;

        if (hasActiveSub) {
            const subscription = subscriptions.data[0];
            const periodEnd = new Date(subscription.current_period_end * 1000);
            subscriptionEnd = periodEnd.toISOString();
            productId = subscription.items.data[0].price.product;
            priceId = subscription.items.data[0].price.id;
            logStep("Active subscription found", { productId, priceId, subscriptionEnd });

            coinsAmount = PRICE_TO_COINS[priceId] || 0;
            if (coinsAmount > 0) {
                if (forceClaim) {
                    // Force mode: reset the deduplication key first, then credit
                    logStep("Force mode: resetting deduplication key");
                    await supabaseClient
                        .from("profiles")
                        .update({ p_coin_last_credited_period_end: null })
                        .eq("user_id", user.id);
                }

                const { data: credited, error: rpcError } = await supabaseClient.rpc("credit_p_coins", {
                    p_user_id: user.id,
                    p_amount: coinsAmount,
                    p_period_end: subscriptionEnd,
                });

                if (rpcError) {
                    logStep("Failed to credit P Coins", { error: rpcError.message });
                } else {
                    coinsCredited = credited === true;
                    logStep(coinsCredited ? "P Coins credited" : "Already credited for this period", { coinsAmount });

                    // If still not credited even after reset, do a raw SQL increment as last resort
                    if (!coinsCredited && forceClaim) {
                        logStep("Force fallback: direct SQL increment");
                        const { error: updateError } = await supabaseClient.rpc(
                            "force_add_p_coins" as "credit_p_coins", // reuse type signature
                            {
                                p_user_id: user.id,
                                p_amount: coinsAmount,
                                p_period_end: subscriptionEnd,
                            }
                        );
                        if (!updateError) {
                            coinsCredited = true;
                            logStep("Force fallback succeeded");
                        } else {
                            logStep("Force fallback failed", { error: updateError.message });
                        }
                    }
                }
            }
        }

        return new Response(JSON.stringify({
            subscribed: hasActiveSub,
            product_id: productId,
            price_id: priceId,
            subscription_end: subscriptionEnd,
            coins_credited: coinsCredited,
            coins_amount: coinsCredited ? coinsAmount : 0,
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logStep("ERROR", { message: msg });
        return new Response(JSON.stringify({ error: msg }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    }
});
