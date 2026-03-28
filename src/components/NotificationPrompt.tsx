import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  requestNotificationPermission, 
  getNotificationPermission, 
  isNotificationSupported 
} from "@/lib/deviceNotifications";
import { toast } from "sonner";

export const NotificationPrompt = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Check if we should show the prompt
        const checkPermission = () => {
            if (!isNotificationSupported()) return;
            
            const permission = getNotificationPermission();
            const dismissed = localStorage.getItem("dd_notification_prompt_dismissed");
            
            if (permission === "default" && !dismissed) {
                // Delay showing by 2 seconds for better UX
                const timer = setTimeout(() => setIsVisible(true), 2000);
                return () => clearTimeout(timer);
            }
        };

        checkPermission();
    }, []);

    const handleRequest = async () => {
        const granted = await requestNotificationPermission();
        if (granted) {
            toast.success("Yay! Notifications enabled.");
            setIsVisible(false);
        } else {
            const perm = getNotificationPermission();
            if (perm === "denied") {
                toast.error("Notifications are blocked in your browser settings.");
            } else {
                toast.info("Notification permission was not granted.");
            }
            handleDismiss();
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        setIsDismissed(true);
        // Don't show again for 7 days
        localStorage.setItem("dd_notification_prompt_dismissed", Date.now().toString());
    };

    if (isDismissed) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="fixed bottom-24 right-4 md:right-8 z-50 max-w-[320px] w-[calc(100vw-32px)]"
                >
                    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-background/80 backdrop-blur-xl shadow-2xl p-5 shadow-primary/10">
                        {/* Decorative background glow */}
                        <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/20 blur-3xl rounded-full" />
                        
                        <button 
                            onClick={handleDismiss}
                            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-secondary/80 text-muted-foreground transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex flex-col items-center text-center space-y-4 pt-1">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                                <Bell className="w-6 h-6 animate-pulse" />
                            </div>
                            
                            <div className="space-y-1.5">
                                <h3 className="font-bold text-lg">Stay in the Loop! 🔔</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Enable notifications to get habit reminders and achievement alerts directly on your device.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 w-full">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={handleDismiss}
                                    className="rounded-xl border-border/50 text-xs"
                                >
                                    Maybe Later
                                </Button>
                                <Button 
                                    size="sm" 
                                    onClick={handleRequest}
                                    className="rounded-xl gradient-primary border-0 text-xs text-white"
                                >
                                    Enable Now
                                </Button>
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground opacity-70">
                                <CheckCircle2 className="w-3 h-3 text-success" />
                                <span>Spam-free • Only important updates</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
