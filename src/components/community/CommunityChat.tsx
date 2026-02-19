import { useState, useRef, useEffect } from "react";
import { useCommunityMessages } from "@/hooks/useSocial";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Smile, Reply, Pin, X } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/components/AuthProvider";
import { Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { MemberProfileCard } from "./MemberProfileCard";

interface CommunityChatProps {
    communityId: string;
    channelId: string;
    channelName?: string;
    members?: any[];
}

const EMOJIS = [
    "😀", "😂", "🥰", "😍", "😎", "😭", "😡", "👍", "👎", "🔥", "✨", "🎉", "❤️",
    "💔", "🤝", "🙏", "💯", "👀", "🧠", "🎨", "🚀", "💀", "👻", "🤖", "🍕", "☕",
    "🍺", "🎵", "🎮", "📚", "💻", "💡", "📅", "✅", "❌", "⚠️"
];

export const CommunityChat = ({ communityId, channelId, channelName = "general", members = [] }: CommunityChatProps) => {
    const { user } = useAuth();
    const { data: messages = [], isLoading, sendMessage, pinMessage, addReaction } = useCommunityMessages(channelId);
    const [newMessage, setNewMessage] = useState("");
    const [replyingTo, setReplyingTo] = useState<any | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        if (!newMessage.trim()) return;
        sendMessage.mutate({
            content: newMessage,
            communityId,
            replyToId: replyingTo?.id
        });
        setNewMessage("");
        setReplyingTo(null);
    };

    const handleReply = (msg: any) => {
        setReplyingTo(msg);
        // Focus input? 
        // We can't easily ref focus without forwarding ref to Input or getting element by ID.
        // Assuming user will click or already focused.
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            toast.info("File upload feature coming soon!");
        }
    };

    const insertEmoji = (emoji: string) => {
        setNewMessage(prev => prev + emoji);
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
                            <div key={msg.id} className={`group relative flex gap-4 pr-4 hover:bg-accent/50 -mx-4 px-4 py-1`}>
                                <div className="absolute right-4 -top-3 hidden group-hover:flex items-center gap-0.5 bg-popover shadow-md border border-border rounded-md p-0.5 z-10 transition-all animate-in fade-in zoom-in-95 duration-200">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-accent rounded-sm" title="Add Reaction">
                                                <Smile className="w-4 h-4 text-muted-foreground hover:text-yellow-500 transition-colors" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-64 p-2" align="center" side="top">
                                            <div className="grid grid-cols-6 gap-2">
                                                {EMOJIS.map(emoji => (
                                                    <button
                                                        key={emoji}
                                                        onClick={() => addReaction.mutate({ messageId: msg.id, emoji })}
                                                        className="text-xl hover:bg-accent rounded p-1 transition-colors flex items-center justify-center"
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        </PopoverContent>
                                    </Popover>

                                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-accent rounded-sm" onClick={() => handleReply(msg)} title="Reply">
                                        <Reply className="w-4 h-4 text-muted-foreground hover:text-blue-500 transition-colors" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={`h-7 w-7 hover:bg-accent rounded-sm ${msg.is_pinned ? 'bg-accent text-green-500' : ''}`}
                                        onClick={() => pinMessage.mutate({ messageId: msg.id, isPinned: !msg.is_pinned })}
                                        title={msg.is_pinned ? "Unpin Message" : "Pin Message"}
                                    >
                                        <Pin className={`w-4 h-4 ${msg.is_pinned ? 'fill-current' : 'text-muted-foreground hover:text-green-500'} transition-colors`} />
                                    </Button>
                                </div>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Avatar className="w-10 h-10 mt-0.5 cursor-pointer hover:drop-shadow-md transition-all">
                                            <AvatarImage src={msg.profile?.avatar_url} />
                                            <AvatarFallback>{msg.profile?.username?.charAt(0) || "U"}</AvatarFallback>
                                        </Avatar>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" align="start" side="right">
                                        <MemberProfileCard
                                            userId={msg.user_id}
                                            communityId={communityId}
                                            role={member?.role}
                                        />
                                    </PopoverContent>
                                </Popover>

                                <div className="flex flex-col min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <span className={`text-base font-semibold hover:underline cursor-pointer ${roleColor}`}>
                                                    {msg.profile?.username || "Unknown"}
                                                </span>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" align="start" side="right">
                                                <MemberProfileCard
                                                    userId={msg.user_id}
                                                    communityId={communityId}
                                                    role={member?.role}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <span className="text-xs text-muted-foreground ml-1">
                                            {format(new Date(msg.created_at), "MM/dd/yyyy h:mm a")}
                                        </span>
                                    </div>
                                    <div className="text-foreground/90 whitespace-pre-wrap leading-relaxed break-all">
                                        {msg.reply_to_id && (
                                            <div className="text-xs text-muted-foreground mb-1 border-l-2 border-primary/30 pl-2 py-0.5 flex items-center gap-1">
                                                <Reply className="w-3 h-3" />
                                                <span>Replying to message...</span>
                                            </div>
                                        )}
                                        {msg.content}
                                    </div>
                                    {/* Reactions */}
                                    {msg.reactions && msg.reactions.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                            {Object.entries((msg.reactions || []).reduce((acc: any, curr: any) => {
                                                acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
                                                return acc;
                                            }, {})).map(([emoji, count]: [string, any]) => (
                                                <div key={emoji} className="flex items-center gap-1 bg-secondary/50 px-1.5 py-0.5 rounded-full text-xs hover:bg-secondary border border-transparent hover:border-border cursor-pointer transition-all">
                                                    <span>{emoji}</span>
                                                    <span className="font-semibold text-muted-foreground">{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>

            <div className="p-4 px-4 bg-transparent space-y-2">
                {replyingTo && (
                    <div className="flex items-center justify-between bg-secondary/30 text-xs px-3 py-2 rounded-t-lg border-b border-border/50 animate-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Reply className="w-3.5 h-3.5" />
                            <span>Replying to <span className="font-semibold text-foreground">@{replyingTo.profile?.username}</span></span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-destructive/10 hover:text-destructive rounded-full" onClick={() => setReplyingTo(null)}>
                            <X className="w-3 h-3" />
                        </Button>
                    </div>
                )}
                <div className={`bg-secondary/50 rounded-lg p-2 flex items-center gap-2 ${replyingTo ? 'rounded-t-none' : ''}`}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileSelect}
                        accept="image/*,.pdf,.doc,.docx"
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full bg-muted/20"
                        onClick={() => fileInputRef.current?.click()}
                    >
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
                        <Popover>
                            <PopoverTrigger asChild>
                                <Smile className="w-6 h-6 text-muted-foreground hover:text-foreground cursor-pointer p-1" />
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-2" align="end" side="top">
                                <div className="grid grid-cols-6 gap-2">
                                    {EMOJIS.map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={() => insertEmoji(emoji)}
                                            className="text-xl hover:bg-accent rounded p-1 transition-colors flex items-center justify-center"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </div>
        </div>
    );
};
