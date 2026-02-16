import { motion, AnimatePresence } from "framer-motion";
import { X, Gift, Trophy, Users, Sparkles, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export interface PopupNotification {
    id: string;
    type: "reward" | "achievement" | "community" | "event" | "reminder";
    title: string;
    message: string;
    route: string; // Where to navigate on click
    duration?: number; // Duration in ms, default 3000
}

interface NotificationToastProps {
    notification: PopupNotification;
    onDismiss: (id: string) => void;
}

const getIcon = (type: PopupNotification["type"]) => {
    switch (type) {
        case "reward":
            return <Gift className="w-5 h-5" />;
        case "achievement":
            return <Trophy className="w-5 h-5" />;
        case "community":
            return <Users className="w-5 h-5" />;
        case "event":
            return <Sparkles className="w-5 h-5" />;
        case "reminder":
            return <Bell className="w-5 h-5" />;
        default:
            return <Gift className="w-5 h-5" />;
    }
};

const getColor = (type: PopupNotification["type"]) => {
    switch (type) {
        case "reward":
            return "from-amber-500/20 to-yellow-500/20 border-amber-500/50";
        case "achievement":
            return "from-purple-500/20 to-pink-500/20 border-purple-500/50";
        case "community":
            return "from-blue-500/20 to-cyan-500/20 border-blue-500/50";
        case "event":
            return "from-green-500/20 to-emerald-500/20 border-green-500/50";
        case "reminder":
            return "from-indigo-500/20 to-violet-500/20 border-indigo-500/50";
        default:
            return "from-primary/20 to-primary/20 border-primary/50";
    }
};

const NotificationToast = ({ notification, onDismiss }: NotificationToastProps) => {
    const navigate = useNavigate();
    const duration = notification.duration || 3000;

    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(notification.id);
        }, duration);

        return () => clearTimeout(timer);
    }, [notification.id, duration, onDismiss]);

    const handleClick = () => {
        navigate(notification.route);
        onDismiss(notification.id);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative mb-4"
        >
            <div
                onClick={handleClick}
                className={`
          w-80 p-4 rounded-xl border-2 backdrop-blur-xl
          bg-gradient-to-br ${getColor(notification.type)}
          cursor-pointer hover:scale-105 transition-transform
          shadow-2xl
        `}
            >
                {/* Progress bar */}
                <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: duration / 1000, ease: "linear" }}
                    className="absolute bottom-0 left-0 h-1 bg-primary rounded-b-xl"
                />

                {/* Close button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDismiss(notification.id);
                    }}
                    className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition-colors"
                >
                    <X className="w-4 h-4 text-white/70" />
                </button>

                {/* Content */}
                <div className="flex items-start gap-3 pr-6">
                    <div className="p-2 rounded-lg bg-white/10 text-white">
                        {getIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-white text-sm mb-1">
                            {notification.title}
                        </h4>
                        <p className="text-white/80 text-xs leading-relaxed">
                            {notification.message}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

interface NotificationContainerProps {
    notifications: PopupNotification[];
    onDismiss: (id: string) => void;
}

export const NotificationContainer = ({
    notifications,
    onDismiss,
}: NotificationContainerProps) => {
    return (
        <div className="fixed right-6 top-1/3 z-50 pointer-events-none">
            <div className="pointer-events-auto">
                <AnimatePresence>
                    {notifications.map((notification) => (
                        <NotificationToast
                            key={notification.id}
                            notification={notification}
                            onDismiss={onDismiss}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default NotificationToast;
