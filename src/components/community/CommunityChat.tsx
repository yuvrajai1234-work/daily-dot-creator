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
}

export const CommunityChat = ({ communityId, channelId, channelName = "general" }: CommunityChatProps) => {
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
        return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin w-8 h-8 text-gray-400" /></div>;
    }

    return (
        <div className="flex flex-col h-full bg-[#313338]">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                    {/* Welcome message at top of channel */}
                    {messages.length < 5 && (
                        <div className="mb-8 mt-4">
                            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-3xl mb-4">
                                #
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-2">Welcome to #{channelName}!</h3>
                            <p className="text-gray-400">This is the start of the #{channelName} channel.</p>
                        </div>
                    )}

                    {messages.map((msg, index) => {
                        const isMe = msg.user_id === user?.id;

                        return (
                            <div key={msg.id} className={`group flex gap-4 pr-4 hover:bg-[#2e3035] -mx-4 px-4 py-1`}>
                                <Avatar className="w-10 h-10 mt-0.5 cursor-pointer hover:drop-shadow-md transition-all">
                                    <AvatarImage src={msg.profile?.avatar_url} />
                                    <AvatarFallback>{msg.profile?.username?.charAt(0) || "U"}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-base font-semibold text-white hover:underline cursor-pointer">
                                            {msg.profile?.username || "Unknown"}
                                        </span>
                                        <span className="text-xs text-gray-400 ml-1">
                                            {format(new Date(msg.created_at), "MM/dd/yyyy h:mm a")}
                                        </span>
                                    </div>
                                    <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>

            <div className="p-4 px-4 bg-[#313338]">
                <div className="bg-[#383a40] rounded-lg p-2 flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-200 rounded-full bg-gray-400/10">
                        <PlusCircle className="w-5 h-5" />
                    </Button>
                    <Input
                        placeholder={`Message #${channelName}`}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        className="bg-transparent border-none focus-visible:ring-0 text-gray-200 placeholder-gray-500 h-9"
                    />
                    <div className="flex items-center gap-1 mr-2">
                        <Gift className="w-6 h-6 text-gray-400 hover:text-gray-200 cursor-pointer p-1" />
                        <Sticker className="w-6 h-6 text-gray-400 hover:text-gray-200 cursor-pointer p-1" />
                        <Smile className="w-6 h-6 text-gray-400 hover:text-gray-200 cursor-pointer p-1" />
                    </div>
                </div>
            </div>
        </div>
    );
};
