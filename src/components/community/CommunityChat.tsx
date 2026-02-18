import { useState, useRef, useEffect } from "react";
import { Message, useCommunityMessages } from "@/hooks/useSocial";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/components/AuthProvider";
import { Loader2 } from "lucide-react";

interface CommunityChatProps {
    communityId: string;
}

export const CommunityChat = ({ communityId }: CommunityChatProps) => {
    const { user } = useAuth();
    const { data: messages = [], isLoading, sendMessage } = useCommunityMessages(communityId);
    const [newMessage, setNewMessage] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        if (!newMessage.trim()) return;
        sendMessage.mutate(newMessage);
        setNewMessage("");
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
    }

    return (
        <div className="flex flex-col h-[600px] border border-border/50 rounded-xl overflow-hidden glass">
            <div className="bg-secondary/20 p-4 border-b border-border/50 flex justify-between items-center">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    💬 Community Chat
                </h3>
                <span className="text-xs text-muted-foreground">{messages.length} messages</span>
            </div>

            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                    {messages.map((msg) => {
                        const isMe = msg.user_id === user?.id;
                        return (
                            <div key={msg.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                                <Avatar className="w-8 h-8 border border-border/50">
                                    <AvatarImage src={msg.profile?.avatar_url} />
                                    <AvatarFallback>{msg.profile?.username?.charAt(0) || "U"}</AvatarFallback>
                                </Avatar>
                                <div className={`flex flex-col max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-semibold opacity-70">
                                            {isMe ? "You" : msg.profile?.username || "Unknown"}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {format(new Date(msg.created_at), "h:mm a")}
                                        </span>
                                    </div>
                                    <div className={`p-3 rounded-2xl text-sm ${isMe
                                        ? "bg-primary text-primary-foreground rounded-tr-none"
                                        : "bg-secondary text-secondary-foreground rounded-tl-none"
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>

            <div className="p-4 border-t border-border/50 bg-background/50 backdrop-blur-sm flex gap-2">
                <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    className="bg-secondary/30 border-border/50 focus-visible:ring-primary/20"
                />
                <Button onClick={handleSend} disabled={!newMessage.trim() || sendMessage.isPending} size="icon" className="shrink-0 gradient-primary">
                    <Send className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
};
