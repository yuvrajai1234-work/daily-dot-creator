import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { NotificationContainer, PopupNotification } from "@/components/PopupNotification";

interface NotificationContextType {
    showNotification: (notification: Omit<PopupNotification, "id">) => void;
    dismissNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const usePopupNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("usePopupNotifications must be used within NotificationProvider");
    }
    return context;
};

interface NotificationProviderProps {
    children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
    const [notifications, setNotifications] = useState<PopupNotification[]>([]);

    const showNotification = useCallback((notification: Omit<PopupNotification, "id">) => {
        const id = `notification-${Date.now()}-${Math.random()}`;
        const newNotification: PopupNotification = {
            ...notification,
            id,
        };

        setNotifications((prev) => [...prev, newNotification]);
    }, []);

    const dismissNotification = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    return (
        <NotificationContext.Provider value={{ showNotification, dismissNotification }}>
            {children}
            <NotificationContainer
                notifications={notifications}
                onDismiss={dismissNotification}
            />
        </NotificationContext.Provider>
    );
};
