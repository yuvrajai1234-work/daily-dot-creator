import { serve } from "std/http/server";
import Stripe from "stripe";
import { createClient } from "supabase";

const logStep = (step: string, details?: unknown) => {
    const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
    console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

const PRICE_TO_COINS: Record<string, { coins: number; plan: string }> = {
    "price_1T8fRY3WWGDm9b3SU9X2iL9b": { coins: 100,  plan: "Weekly" },
    "price_1T8fRx3WWGDm9b3SMOyeXEzd": { coins: 500,  plan: "Monthly" },
    "price_1T8fUl3WWGDm9b3SbovWfS5J": { coins: 3000, plan: "6 Months" },
    "price_1T8fVR3WWGDm9b3SjUzJbidC": { coins: 7000, plan: "Yearly" },
};

serve(async (req: Request) => {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
    const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
        logStep("Missing stripe-signature header");
        return new Response("Missing signature", { status: 400 });
    }

    let event: Stripe.Event;
    try {
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
        logStep("Event received", { type: event.type, id: event.id });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logStep("Webhook signature verification failed", { error: msg });
        return new Response(`Webhook error: ${msg}`, { status: 400 });
    }

    // Only handle successful checkouts
    if (event.type !== "checkout.session.completed") {
        return new Response("OK", { status: 200 });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const customerId = session.customer as string;
    const customerEmail = session.customer_email || session.customer_details?.email;

    logStep("Checkout completed", { customerId, customerEmail, sessionId: session.id });

    const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
    );

    // Get the price ID from the line items
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
    const priceId = lineItems.data[0]?.price?.id;
    const planInfo = priceId ? PRICE_TO_COINS[priceId] : null;

    logStep("Plan info", { priceId, planInfo });

    if (!planInfo || !customerEmail) {
        logStep("Could not determine plan or email", { priceId, customerEmail });
        return new Response("OK", { status: 200 });
    }

    // Find the user by email
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
        logStep("Failed to list users", { error: userError.message });
        return new Response("Internal error", { status: 500 });
    }

    const user = users.users.find((u) => u.email === customerEmail);
    if (!user) {
        logStep("No user found with email", { customerEmail });
        return new Response("OK", { status: 200 });
    }

    // Get subscription period end for deduplication
    let periodEnd: string | null = null;
    if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        periodEnd = new Date(subscription.current_period_end * 1000).toISOString();
    }

    // Credit P Coins using the existing deduplication-safe RPC
    const { data: credited, error: rpcError } = await supabase.rpc("credit_p_coins", {
        p_user_id: user.id,
        p_amount: planInfo.coins,
        p_period_end: periodEnd ?? new Date(Date.now() + 86400000).toISOString(),
    });

    if (rpcError) {
        logStep("Failed to credit P Coins", { error: rpcError.message });
    } else {
        logStep(credited ? "P Coins credited" : "Already credited for this period", {
            coins: planInfo.coins,
            userId: user.id,
        });
    }

    // Send confirmation email via Resend
    if (resendApiKey && credited) {
        try {
            const emailRes = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${resendApiKey}`,
                },
                body: JSON.stringify({
                    from: "DailyDots <noreply@dailydots.app>",
                    to: [customerEmail],
                    subject: "🎉 Your DailyDots Subscription is Active!",
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0d0d12; color: #f1f5f9; padding: 40px; border-radius: 16px;">
                            <div style="text-align: center; margin-bottom: 32px;">
                                <h1 style="font-size: 32px; font-weight: 900; background: linear-gradient(135deg, #8b5cf6, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0;">DailyDots</h1>
                                <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Build habits. Level up your life.</p>
                            </div>

                            <div style="background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.2); border-radius: 12px; padding: 28px; text-align: center; margin-bottom: 28px;">
                                <p style="font-size: 48px; margin: 0 0 8px 0;">🎉</p>
                                <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">Payment Successful!</h2>
                                <p style="color: #94a3b8; margin: 0;">Your <strong style="color: #f1f5f9;">${planInfo.plan} Plan</strong> is now active</p>
                            </div>

                            <div style="background: rgba(255,255,255,0.04); border-radius: 12px; padding: 24px; margin-bottom: 28px;">
                                <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin: 0 0 16px 0;">What You Received</h3>
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(239,68,68,0.15); display: flex; align-items: center; justify-content: center;">
                                        <span style="font-size: 20px; font-weight: 900; color: #ef4444;">P</span>
                                    </div>
                                    <div>
                                        <p style="font-size: 24px; font-weight: 900; margin: 0; color: #ef4444;">+${planInfo.coins} P Coins</p>
                                        <p style="font-size: 13px; color: #64748b; margin: 2px 0 0 0;">Credited to your account</p>
                                    </div>
                                </div>
                            </div>

                            <p style="font-size: 14px; color: #94a3b8; text-align: center; margin-bottom: 24px;">
                                Your P Coins have been automatically added to your DailyDots account.<br>
                                Log in and start using them to unlock rewards, themes, and more!
                            </p>

                            <div style="text-align: center; margin-bottom: 32px;">
                                <a href="https://dailydots.app/rewards" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #ec4899); color: white; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 12px; text-decoration: none;">
                                    Go to Rewards →
                                </a>
                            </div>

                            <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.07); margin: 0 0 24px 0;" />
                            <p style="font-size: 12px; color: #475569; text-align: center; margin: 0;">
                                Questions? Reply to this email or visit your subscription settings.<br>
                                © ${new Date().getFullYear()} DailyDots — Build habits. Level up your life.
                            </p>
                        </div>
                    `,
                }),
            });

            if (emailRes.ok) {
                logStep("Confirmation email sent", { to: customerEmail });
            } else {
                const emailErr = await emailRes.text();
                logStep("Failed to send email", { status: emailRes.status, error: emailErr });
            }
        } catch (emailErr) {
            logStep("Email send error", { error: String(emailErr) });
        }
    }

    return new Response("OK", { status: 200 });
});
