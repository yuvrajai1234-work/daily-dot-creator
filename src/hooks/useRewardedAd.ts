import { useState, useEffect, useCallback, useRef } from "react";

// Ad Unit ID: Replace with your actual rewarded ad unit ID from Google Ad Manager
const REWARDED_AD_UNIT_ID = "/6355419/Travel/Europe/France/Paris"; // Google testing ID

export const useRewardedAd = (onRewardGranted: () => void, onAdClosed?: () => void) => {
    const [isAdLoaded, setIsAdLoaded] = useState(false);
    const readyEventRef = useRef<any>(null);
    const [isWatchingRequested, setIsWatchingRequested] = useState(false);
    const [isAdBlockerActive, setIsAdBlockerActive] = useState(false);

    useEffect(() => {
        const googletag = (window as any).googletag;

        if (!googletag || !googletag.apiReady) {
            console.warn("GPT not yet ready or blocked by ad blocker.");
            // Wait a bit to check if it's just late or definitely blocked
            const timeout = setTimeout(() => {
                if (!(window as any).googletag?.apiReady) {
                    setIsAdBlockerActive(true);
                }
            }, 3000);
            return () => clearTimeout(timeout);
        }
    }, []);

    useEffect(() => {
        const googletag = (window as any).googletag || { cmd: [] };

        googletag.cmd.push(() => {
            try {
                // Link your AdSense account to rewarded ads
                googletag.pubads().set("adsense_ad_client", "ca-pub-5235940982085620");

                const slot = googletag.defineOutOfPageSlot(
                    REWARDED_AD_UNIT_ID,
                    googletag.enums.OutOfPageFormat.REWARDED,
                );

                if (slot) {
                    slot.addService(googletag.pubads());

                    googletag.pubads().addEventListener("rewardedSlotReady", (event: any) => {
                        console.log("Rewarded ad slot is ready.");
                        readyEventRef.current = event;
                        setIsAdLoaded(true);
                        setIsAdBlockerActive(false);
                    });

                    googletag.pubads().addEventListener("rewardedSlotGranted", (event: any) => {
                        console.log("Reward granted!");
                        onRewardGranted();
                    });

                    googletag.pubads().addEventListener("rewardedSlotClosed", (event: any) => {
                        console.log("Rewarded ad slot closed.");
                        readyEventRef.current = null;
                        setIsAdLoaded(false);
                        setIsWatchingRequested(false);
                        onAdClosed?.();
                        // Pre-load the next ad
                        googletag.pubads().refresh([slot]);
                    });

                    googletag.pubads().addEventListener("slotRenderEnded", (event: any) => {
                        console.log("Slot render ended:", event);
                        if (event.slot === slot && event.isEmpty) {
                            console.warn("Rewarded ad slot failed to fill (empty).");
                            setIsAdLoaded(false);
                            setIsWatchingRequested(false);
                            onAdClosed?.();
                        }
                    });

                    googletag.enableServices();
                    console.log("Displaying rewarded ad slot...");
                    googletag.display(slot);
                } else {
                    console.error("Failed to define rewarded ad slot.");
                }
            } catch (err) {
                console.error("Error initializing GPT:", err);
            }
        });
    }, [onRewardGranted, onAdClosed]);

    const showAd = useCallback(() => {
        if (readyEventRef.current) {
            console.log("Showing rewarded ad immediately.");
            readyEventRef.current.makeRewardedVisible();
        } else {
            console.log("Ad not ready yet, setting requested flag");
            setIsWatchingRequested(true);

            // If GPT isn't loaded at all, we should probably warn the user
            if (!(window as any).googletag?.apiReady) {
                console.error("GPT API not ready. Likely blocked by an ad-blocker.");
                setIsAdBlockerActive(true);
            }
        }
    }, []);

    // If ad becomes ready after user clicked 'Watch', show it immediately
    useEffect(() => {
        if (isWatchingRequested && isAdLoaded && readyEventRef.current) {
            console.log("Ad requested and now loaded, showing now.");
            readyEventRef.current.makeRewardedVisible();
            setIsWatchingRequested(false);
        }
    }, [isWatchingRequested, isAdLoaded]);

    return { isAdLoaded, showAd, isWatchingRequested, isAdBlockerActive };
};
