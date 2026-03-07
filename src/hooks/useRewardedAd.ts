import { useState, useEffect, useCallback, useRef } from "react";

// Ad Unit ID: Replace with your actual rewarded ad unit ID from Google Ad Manager
const REWARDED_AD_UNIT_ID = "/6355419/Travel/Europe/France/Paris"; // Google testing ID

export const useRewardedAd = (onRewardGranted: () => void) => {
    const [isAdLoaded, setIsAdLoaded] = useState(false);
    const readyEventRef = useRef<any>(null);
    const [isWatchingRequested, setIsWatchingRequested] = useState(false);

    useEffect(() => {
        const googletag = (window as any).googletag || { cmd: [] };

        googletag.cmd.push(() => {
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
                    // Pre-load the next ad
                    googletag.pubads().refresh([slot]);
                });

                googletag.pubads().addEventListener("slotRenderEnded", (event: any) => {
                    if (event.slot === slot && event.isEmpty) {
                        console.warn("Rewarded ad slot failed to fill (empty).");
                        setIsAdLoaded(false);
                        setIsWatchingRequested(false);
                    }
                });

                googletag.enableServices();
                googletag.display(REWARDED_AD_UNIT_ID);
            }
        });
    }, [onRewardGranted]);

    const showAd = useCallback(() => {
        if (readyEventRef.current) {
            readyEventRef.current.makeRewardedVisible();
        } else {
            console.log("Ad not ready yet, setting requested flag");
            setIsWatchingRequested(true);
        }
    }, []);

    // If ad becomes ready after user clicked 'Watch', show it immediately
    useEffect(() => {
        if (isWatchingRequested && isAdLoaded && readyEventRef.current) {
            readyEventRef.current.makeRewardedVisible();
            setIsWatchingRequested(false);
        }
    }, [isWatchingRequested, isAdLoaded]);

    return { isAdLoaded, showAd, isWatchingRequested };
};
