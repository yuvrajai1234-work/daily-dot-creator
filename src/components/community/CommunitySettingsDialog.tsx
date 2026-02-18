import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Shield, User, Users, Trash2, Camera } from "lucide-react";
import { Community, useCommunities, useCommunityMembers } from "@/hooks/useCommunities";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/AuthProvider";

interface CommunitySettingsDialogProps {
    community: Community;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const EMOJIS = ["🎯", "🌅", "💻", "🥗", "🧘", "📚", "🏋️", "🎨", "🎵", "🌿", "🔥", "⭐", "🚀", "💡", "🎮", "🌍"];
const CATEGORIES = ["General", "Health", "Productivity", "Mindfulness", "Coding", "Fitness", "Learning", "Social", "Creative", "Gaming"];

export const CommunitySettingsDialog = ({ community, open, onOpenChange }: CommunitySettingsDialogProps) => {
    const { user } = useAuth();
    const { updateCommunity, updateMemberRole, kickMember } = useCommunities();
    const { data: members = [] } = useCommunityMembers(community.id);

    const [form, setForm] = useState({
        name: community.name,
        tagline: community.tagline,
        emoji: community.emoji,
        habit_category: community.habit_category,
    });

    const [activeTab, setActiveTab] = useState("general");
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

    const handleUpdate = () => {
        updateCommunity.mutate({ id: community.id, ...form }, {
            onSuccess: () => onOpenChange(false),
        });
    };

    const handleRoleChange = (userId: string, newRole: 'admin' | 'moderator' | 'member') => {
        updateMemberRole.mutate({ communityId: community.id, userId, role: newRole });
    };

    const handleKick = (userId: string) => {
        if (confirm("Are you sure you want to remove this member?")) {
            kickMember.mutate({ communityId: community.id, userId });
        }
    };

    const sortedMembers = [...members].sort((a, b) => {
        const roleOrder = { admin: 0, moderator: 1, member: 2 };
        return (roleOrder[a.role as keyof typeof roleOrder] || 2) - (roleOrder[b.role as keyof typeof roleOrder] || 2);
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[750px] max-h-[85vh] h-[600px] p-0 gap-0 bg-background overflow-hidden flex shadow-2xl border-border/40">
                {/* LEFT SIDEBAR ("Slider") */}
                <div className="w-[220px] bg-muted/10 border-r border-border/40 flex flex-col pt-6 pb-4">
                    <div className="px-4 mb-6">
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                            Settings
                        </div>
                        <h2 className="font-bold text-lg truncate" title={community.name}>
                            {community.name}
                        </h2>
                    </div>

                    <div className="space-y-1 px-2 flex-1">
                        <button
                            onClick={() => setActiveTab("general")}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === "general"
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                }`}
                        >
                            <Settings className="w-4 h-4" />
                            General
                        </button>
                        <button
                            onClick={() => setActiveTab("members")}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === "members"
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                }`}
                        >
                            <Users className="w-4 h-4" />
                            Members & Roles
                        </button>
                    </div>

                    <div className="px-4 mt-auto">
                        <div className="text-[10px] text-muted-foreground text-center">
                            Daily Dot Creator v1.0
                        </div>
                    </div>
                </div>

                {/* RIGHT CONTENT AREA */}
                <div className="flex-1 flex flex-col min-w-0 bg-background">
                    {/* Header */}
                    <div className="h-14 border-b border-border/40 flex items-center px-6 flex-shrink-0">
                        <h3 className="font-bold text-lg">
                            {activeTab === "general" ? "Server Overview" : "Manage Members"}
                        </h3>
                    </div>

                    {/* Content Scrollable */}
                    <ScrollArea className="flex-1">
                        <div className="p-6">
                            {activeTab === "general" && (
                                <div className="space-y-6 max-w-lg">
                                    {/* Emoji & Name */}
                                    <div className="flex items-start gap-6">
                                        <div className="flex-shrink-0">
                                            <Label className="block text-xs font-bold text-muted-foreground mb-2 uppercase">Icon</Label>
                                            <div className="relative group cursor-pointer" onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}>
                                                <div className="w-24 h-24 rounded-2xl bg-muted/30 flex items-center justify-center text-5xl border-2 border-dashed border-border group-hover:border-primary/50 transition-all">
                                                    {form.emoji}
                                                </div>
                                                <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2 shadow-lg scale-90">
                                                    <Camera className="w-4 h-4" />
                                                </div>

                                                {/* Emoji Picker Popover */}
                                                {emojiPickerOpen && (
                                                    <div className="absolute top-full left-0 mt-2 bg-popover p-3 rounded-xl shadow-xl border border-border z-50 w-64 grid grid-cols-5 gap-2 animate-in fade-in zoom-in-95">
                                                        {EMOJIS.map(e => (
                                                            <button
                                                                key={e}
                                                                className="text-2xl hover:bg-muted p-2 rounded-md transition-colors"
                                                                onClick={(ev) => {
                                                                    ev.stopPropagation();
                                                                    setForm(f => ({ ...f, emoji: e }));
                                                                    setEmojiPickerOpen(false);
                                                                }}
                                                            >
                                                                {e}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-4">
                                            <div className="space-y-2">
                                                <Label>Server Name</Label>
                                                <Input
                                                    value={form.name}
                                                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                                    className="bg-muted/30 border-border/40 focus:bg-background transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Input
                                            value={form.tagline}
                                            onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
                                            className="bg-muted/30 border-border/40 focus:bg-background transition-all"
                                        />
                                        <p className="text-[11px] text-muted-foreground">What is this community about?</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Category</Label>
                                        <Select value={form.habit_category} onValueChange={(v) => setForm((f) => ({ ...f, habit_category: v }))}>
                                            <SelectTrigger className="bg-muted/30 border-border/40">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CATEGORIES.map((c) => (
                                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            {activeTab === "members" && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between pb-4 border-b border-border/40">
                                        <div className="text-sm text-muted-foreground">
                                            {members.length} {members.length === 1 ? 'Member' : 'Members'}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        {sortedMembers.map((member: any) => {
                                            const isMe = member.userId === user?.id;
                                            return (
                                                <div key={member.userId} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 group transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9 border border-border/40">
                                                            <AvatarImage src={member.avatarUrl} />
                                                            <AvatarFallback>{member.username?.charAt(0) || "U"}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-sm">{member.username}</span>
                                                                {member.role === 'admin' && <Shield className="w-3 h-3 text-yellow-500 fill-yellow-500/20" />}
                                                                {isMe && <Badge variant="secondary" className="text-[10px] h-4 px-1">YOU</Badge>}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground capitalize">{member.role}</div>
                                                        </div>
                                                    </div>

                                                    {!isMe && (
                                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Select
                                                                value={member.role}
                                                                onValueChange={(val: any) => handleRoleChange(member.userId, val as any)}
                                                                disabled={updateMemberRole.isPending}
                                                            >
                                                                <SelectTrigger className="w-[100px] h-7 text-xs bg-background">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="admin">Chief</SelectItem>
                                                                    <SelectItem value="moderator">Elder</SelectItem>
                                                                    <SelectItem value="member">Member</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                                onClick={() => handleKick(member.userId)}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {/* Footer Actions (Only for General) */}
                    {activeTab === "general" && (
                        <div className="p-4 border-t border-border/40 bg-muted/5 flex justify-between items-center animate-in slide-in-from-bottom-2">
                            <div className="text-xs text-muted-foreground">
                                Careful - you have unsaved changes!
                            </div>
                            <div className="flex gap-3">
                                <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                                    Reset
                                </Button>
                                <Button size="sm" className="gradient-primary" onClick={handleUpdate} disabled={updateCommunity.isPending}>
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
