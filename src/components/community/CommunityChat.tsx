import { useState, useRef, useEffect } from "react";
import { Message, useCommunityMessages } from "@/hooks/useSocial";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, PlusCircle, Gift, Sticker, Smile } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/components/AuthProvider";
import { Loader2 } from "lucide-react";

interface CommunityChatProps {
    communityId: string;
    channelId: string;
    channelName?: string;
    members?: any[];
}

export const CommunityChat = ({ communityId, channelId, channelName = "general", members = [] }: CommunityChatProps) => {
    const { user } = useAuth();
    const { data: messages = [], isLoading, sendMessage } = useCommunityMessages(channelId);
    const [newMessage, setNewMessage] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        if (!newMessage.trim()) return;
        sendMessage.mutate({ content: newMessage, communityId });
        setNewMessage("");
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin w-8 h-8 text-muted-foreground" /></div>;
    }

    return (
        <div className="flex flex-col h-full bg-transparent">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                    {/* Welcome message at top of channel */}
                    {messages.length < 5 && (
                        <div className="mb-8 mt-4">

                            <h3 className="text-3xl font-bold text-foreground mb-2">Welcome to #{channelName}!</h3>
                            <p className="text-muted-foreground">This is the start of the #{channelName} channel.</p>
                        </div>
                    )}

                    {messages.map((msg, index) => {
                        const isMe = msg.user_id === user?.id;
                        const member = members.find((m: any) => m.userId === msg.user_id);
                        const roleColor = member?.role === 'admin' ? 'text-yellow-500' : member?.role === 'moderator' ? 'text-purple-400' : 'text-foreground';

                        return (
                            <div key={msg.id} className={`group flex gap-4 pr-4 hover:bg-accent/50 -mx-4 px-4 py-1`}>
                                <Avatar className="w-10 h-10 mt-0.5 cursor-pointer hover:drop-shadow-md transition-all">
                                    <AvatarImage src={msg.profile?.avatar_url} />
                                    <AvatarFallback>{msg.profile?.username?.charAt(0) || "U"}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-base font-semibold hover:underline cursor-pointer ${roleColor}`}>
                                            {msg.profile?.username || "Unknown"}
                                        </span>
                                        <span className="text-xs text-muted-foreground ml-1">
                                            {format(new Date(msg.created_at), "MM/dd/yyyy h:mm a")}
                                        </span>
                                    </div>
                                    <div className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>

            <div className="p-4 px-4 bg-transparent">
                <div className="bg-secondary/50 rounded-lg p-2 flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full bg-muted/20">
                        <PlusCircle className="w-5 h-5" />
                    </Button>
                    <Input
                        placeholder={`Message #${channelName}`}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        className="bg-transparent border-none focus-visible:ring-0 text-foreground placeholder-muted-foreground h-9"
                    />
                    <div className="flex items-center gap-1 mr-2">
                        <Gift className="w-6 h-6 text-muted-foreground hover:text-foreground cursor-pointer p-1" />
                        <Sticker className="w-6 h-6 text-muted-foreground hover:text-foreground cursor-pointer p-1" />
                        <Smile className="w-6 h-6 text-muted-foreground hover:text-foreground cursor-pointer p-1" />
                    </div>
                </div>
            </div>
        </div>
    );
};
