import { useState, useRef, useEffect } from "react";
import { useCommunityMessages } from "@/hooks/useSocial";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Smile, Reply, Pin, X, Trash2, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/components/AuthProvider";
import { Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { MemberProfileCard } from "./MemberProfileCard";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface CommunityChatProps {
    communityId: string;
    channelId: string;
    channelName?: string;
    members?: any[];
    highlightMessageId?: string | null;
    setHighlightMessageId?: (id: string | null) => void;
    pinnedMessages?: any[];
}

const EMOJIS = [
    "😀", "😂", "🥰", "😍", "😎", "😭", "😡", "👍", "👎", "🔥", "✨", "🎉", "❤️",
    "💔", "🤝", "🙏", "💯", "👀", "🧠", "🎨", "🚀", "💀", "👻", "🤖", "🍕", "☕",
    "🍺", "🎵", "🎮", "📚", "💻", "💡", "📅", "✅", "❌", "⚠️"
];

const MAX_CHARS = 2000;

export const CommunityChat = ({ communityId, channelId, channelName = "general", members = [], highlightMessageId, setHighlightMessageId, pinnedMessages = [] }: CommunityChatProps) => {
    const { user } = useAuth();
    const { data: messages = [], isLoading, sendMessage, pinMessage, addReaction, deleteMessage } = useCommunityMessages(channelId);
    const [newMessage, setNewMessage] = useState("");
    const [replyingTo, setReplyingTo] = useState<any | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);

    const [reactionModalData, setReactionModalData] = useState<{ messageId: string, reactions: any[] } | null>(null);
    const [activeReactionTab, setActiveReactionTab] = useState<string>("all");

    // Use passed pinned messages or fallback (though parent passes them now)
    const latestPinned = pinnedMessages.length > 0 ? pinnedMessages[pinnedMessages.length - 1] : null;

    useEffect(() => {
        if (scrollRef.current && !highlightMessageId) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, highlightMessageId]); // Only scroll to bottom if NOT highlighting

    // Handle highlight message scrolling
    useEffect(() => {
        if (highlightMessageId && messages.length > 0) {
            const element = document.getElementById(`message-${highlightMessageId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Optional: flash effect handled by CSS or state
                setTimeout(() => setHighlightMessageId?.(null), 2000);
            }
        }
    }, [highlightMessageId, messages, setHighlightMessageId]);

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            setShowScrollButton(!isNearBottom);
        }
    };

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    };

    const handleSend = () => {
        if (!newMessage.trim()) return;
        sendMessage.mutate({
            content: newMessage,
            communityId,
            replyToId: replyingTo?.id
        });
        setNewMessage("");
        setReplyingTo(null);
        if (textareaRef.current) {
            textareaRef.current.style.height = '40px';
        }
    };

    const handleReply = (msg: any) => {
        setReplyingTo(msg);
        textareaRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        if (value.length <= MAX_CHARS) {
            setNewMessage(value);
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.max(40, e.target.scrollHeight)}px`;
        }
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
        <div className="flex flex-col h-full bg-transparent relative">
            {/* Pinned Message Banner */}
            {latestPinned && (
                <div className="bg-[#1e2023]/95 backdrop-blur-md border-b border-border px-4 py-2 flex items-center gap-3 text-xs sticky top-0 z-20 shadow-sm cursor-pointer hover:bg-secondary/40 transition-colors"
                    onClick={() => {
                        const element = document.getElementById(`message-${latestPinned.id}`);
                        if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            setHighlightMessageId?.(latestPinned.id);
                        } else {
                            // If message not loaded, maybe just flash or something? 
                            // In a real app we'd fetch it. For now, we assume it might be there or we can't scroll to it easily.
                            // But usually pinned messages are important so we might want to handle this better later.
                            toast.info("Pinned message is older and not currently visible");
                        }
                    }}
                >
                    <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary">
                        <Pin className="w-3.5 h-3.5 fill-current" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <span className="font-bold text-primary text-[10px] uppercase tracking-wide leading-tight">Pinned Message</span>
                        <span className="truncate text-foreground/90 font-medium leading-tight">{latestPinned.content}</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar" ref={scrollRef} onScroll={handleScroll}>
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
                            <div
                                key={msg.id}
                                id={`message-${msg.id}`}
                                className={`group relative flex gap-4 pr-4 hover:bg-accent/50 -mx-4 px-4 py-1 transition-colors duration-500 ${highlightMessageId === msg.id ? 'bg-primary/20' : ''}`}
                            >
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
                                    {isMe && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive rounded-sm"
                                            onClick={() => {
                                                if (confirm("Delete this message?")) {
                                                    deleteMessage.mutate(msg.id);
                                                }
                                            }}
                                            title="Delete Message"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
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
                                        {msg.reply_to_id && (() => {
                                            const repliedMsg = messages.find(m => m.id === msg.reply_to_id);
                                            const isMsgFound = !!repliedMsg;
                                            const snippetText = isMsgFound ? (repliedMsg.content.length > 30 ? repliedMsg.content.substring(0, 30) + '...' : repliedMsg.content) : "message...";
                                            const replyUsername = isMsgFound && repliedMsg.profile?.username ? `@${repliedMsg.profile.username}` : '';
                                            return (
                                                <div
                                                    className={`text-xs text-muted-foreground mb-1 border-l-2 border-primary/30 pl-2 py-0.5 w-full block truncate ${isMsgFound ? "cursor-pointer hover:text-primary transition-colors" : ""}`}
                                                    onClick={(e) => {
                                                        if (!isMsgFound) return;
                                                        e.stopPropagation();
                                                        if (setHighlightMessageId) {
                                                            setHighlightMessageId(msg.reply_to_id);
                                                        }
                                                        setTimeout(() => {
                                                            const el = document.getElementById(`message-${msg.reply_to_id}`);
                                                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                        }, 50);
                                                    }}
                                                >
                                                    <Reply className="w-3 h-3 inline mr-1 flex-shrink-0 align-text-bottom" />
                                                    <span className="truncate">Replying to {replyUsername ? `${replyUsername} ` : ''}({snippetText})</span>
                                                </div>
                                            );
                                        })()}
                                        {msg.content}
                                    </div>
                                    {/* Reactions */}
                                    {msg.reactions && msg.reactions.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                            {Object.entries((msg.reactions || []).reduce((acc: any, curr: any) => {
                                                if (!acc[curr.emoji]) acc[curr.emoji] = [];
                                                acc[curr.emoji].push(curr);
                                                return acc;
                                            }, {})).map(([emoji, reactions]: [string, any[]]) => (
                                                <div
                                                    key={emoji}
                                                    className="flex items-center gap-1 bg-secondary/50 px-1.5 py-0.5 rounded-full text-xs hover:bg-secondary border border-transparent hover:border-border cursor-pointer transition-all"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setReactionModalData({ messageId: msg.id, reactions: msg.reactions || [] });
                                                        setActiveReactionTab(emoji);
                                                    }}
                                                >
                                                    <span>{emoji}</span>
                                                    <span className="font-semibold text-muted-foreground">{reactions.length}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Reaction Details Dialog */}
            <Dialog open={!!reactionModalData} onOpenChange={(open) => !open && setReactionModalData(null)}>
                <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-[#313338] border-[#2b2d31] text-gray-200">
                    <DialogHeader className="p-4 bg-[#2b2d31] border-b border-[#1e1f22]">
                        <DialogTitle className="text-base font-bold text-white">Reactions</DialogTitle>
                    </DialogHeader>
                    <div className="flex h-[400px]">
                        {/* Sidebar: Emoji Tabs */}
                        <div className="w-[180px] bg-[#2b2d31] flex flex-col gap-1 p-2 border-r border-[#1e1f22] overflow-y-auto custom-scrollbar">
                            {(() => {
                                if (!reactionModalData) return null;
                                const groups = (reactionModalData.reactions || []).reduce((acc: any, curr: any) => {
                                    if (!acc[curr.emoji]) acc[curr.emoji] = [];
                                    acc[curr.emoji].push(curr);
                                    return acc;
                                }, {});

                                return (
                                    <>
                                        {/* "All" Tab */}
                                        <button
                                            onClick={() => setActiveReactionTab("all")}
                                            className={`flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeReactionTab === "all"
                                                ? "bg-[#404249] text-white"
                                                : "text-gray-400 hover:bg-[#35373c] hover:text-gray-200"
                                                }`}
                                        >
                                            <span className="truncate">All</span>
                                            <span className="ml-2 text-xs bg-[#1e1f22] px-1.5 py-0.5 rounded-full text-gray-400">
                                                {reactionModalData.reactions.length}
                                            </span>
                                        </button>

                                        {/* Emoji Tabs */}
                                        {Object.entries(groups).map(([emoji, reactions]: [string, any]) => (
                                            <button
                                                key={emoji}
                                                onClick={() => setActiveReactionTab(emoji)}
                                                className={`flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeReactionTab === emoji
                                                    ? "bg-[#404249] text-white"
                                                    : "text-gray-400 hover:bg-[#35373c] hover:text-gray-200"
                                                    }`}
                                            >
                                                <span className="truncate text-lg leading-none">{emoji}</span>
                                                <span className="ml-2 text-xs bg-[#1e1f22] px-1.5 py-0.5 rounded-full text-gray-400">
                                                    {(reactions as any[]).length}
                                                </span>
                                            </button>
                                        ))}
                                    </>
                                );
                            })()}
                        </div>

                        {/* Content: User List */}
                        <div className="flex-1 bg-[#313338] flex flex-col">
                            <ScrollArea className="flex-1 p-0">
                                <div className="p-2 space-y-1">
                                    {reactionModalData && (() => {
                                        const filteredReactions = activeReactionTab === "all"
                                            ? reactionModalData.reactions
                                            : reactionModalData.reactions.filter((r: any) => r.emoji === activeReactionTab);

                                        return filteredReactions.map((reaction: any) => (
                                            <div key={`${reaction.id}-${reaction.user_id}`} className="flex items-center justify-between p-2 hover:bg-[#35373c] rounded-md group transition-colors cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={reaction.profile?.avatar_url} />
                                                        <AvatarFallback className="bg-[#1e1f22] text-gray-300 text-xs">
                                                            {reaction.profile?.username?.charAt(0) || "?"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-200">
                                                            {reaction.profile?.username || "Unknown User"}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-xl">
                                                    {reaction.emoji}
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Scroll to Bottom Button */}
            {showScrollButton && (
                <Button
                    size="icon"
                    className="absolute bottom-20 right-6 z-30 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 animate-in fade-in zoom-in duration-200 h-8 w-8"
                    onClick={scrollToBottom}
                >
                    <ChevronDown className="w-4 h-4" />
                </Button>
            )}

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
                <div className={`bg-secondary/50 rounded-lg p-2 flex items-end gap-2 ${replyingTo ? 'rounded-t-none' : ''}`}>
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
                        className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full bg-muted/20 mb-0.5"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <PlusCircle className="w-5 h-5" />
                    </Button>
                    <div className="flex-1 relative">
                        <Textarea
                            ref={textareaRef}
                            placeholder={`Message #${channelName}`}
                            value={newMessage}
                            onChange={handleTextareaChange}
                            onKeyDown={handleKeyDown}
                            rows={1}
                            className="bg-transparent border-none focus-visible:ring-0 text-foreground placeholder-muted-foreground min-h-[40px] max-h-[200px] resize-none py-2.5"
                        />
                        <div className={`text-[10px] text-muted-foreground absolute bottom-1 right-2 ${newMessage.length > MAX_CHARS * 0.9 ? 'text-destructive' : ''}`}>
                            {newMessage.length > 0 && `${newMessage.length}/${MAX_CHARS}`}
                        </div>
                    </div>
                    <div className="flex items-center gap-1 mb-0.5">
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
