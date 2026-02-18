import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Shield, User, Users, Trash2 } from "lucide-react";
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
            <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" /> Community Settings
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="general" className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="members">Members & Roles</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="flex-1 overflow-y-auto space-y-4 py-4">
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Team Name</Label>
                                <Input
                                    value={form.name}
                                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                    className="bg-secondary/30"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Tagline</Label>
                                <Input
                                    value={form.tagline}
                                    onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
                                    className="bg-secondary/30"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Emoji Icon</Label>
                                <div className="flex flex-wrap gap-2 p-2 bg-secondary/20 rounded-lg border border-border/50 max-h-[120px] overflow-y-auto">
                                    {EMOJIS.map((e) => (
                                        <button
                                            key={e}
                                            type="button"
                                            onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                                            className={`text-2xl w-10 h-10 flex items-center justify-center rounded-md transition-all ${form.emoji === e
                                                    ? "bg-primary text-primary-foreground scale-110 shadow-md ring-2 ring-primary"
                                                    : "hover:bg-secondary/50 hover:scale-105"
                                                }`}
                                        >
                                            {e}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Category</Label>
                                <Select value={form.habit_category} onValueChange={(v) => setForm((f) => ({ ...f, habit_category: v }))}>
                                    <SelectTrigger className="bg-secondary/30">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map((c) => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button className="w-full gradient-primary mt-4" onClick={handleUpdate} disabled={updateCommunity.isPending}>
                                Save Changes
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="members" className="flex-1 overflow-hidden flex flex-col pt-4">
                        <div className="mb-4 px-1">
                            <p className="text-sm text-muted-foreground">Manage member roles and permissions.</p>
                        </div>
                        <ScrollArea className="flex-1 pr-4">
                            <div className="space-y-3">
                                {sortedMembers.map((member: any) => {
                                    const isMe = member.userId === user?.id;
                                    return (
                                        <div key={member.userId} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-border/50">
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={member.avatarUrl} />
                                                    <AvatarFallback>{member.username?.charAt(0) || "U"}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium flex items-center gap-2">
                                                        {member.username || "Unknown"}
                                                        {isMe && <span className="text-xs text-muted-foreground">(You)</span>}
                                                    </p>
                                                    <div className="flex gap-2 mt-1">
                                                        {member.role === 'admin' && <Badge className="bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30 border-yellow-500/50">Chief</Badge>}
                                                        {member.role === 'moderator' && <Badge className="bg-purple-500/20 text-purple-600 hover:bg-purple-500/30 border-purple-500/50">Elder</Badge>}
                                                        {member.role === 'member' && <Badge variant="outline" className="text-muted-foreground">Member</Badge>}
                                                    </div>
                                                </div>
                                            </div>

                                            {!isMe && (
                                                <div className="flex items-center gap-2">
                                                    <Select
                                                        value={member.role}
                                                        onValueChange={(val: any) => handleRoleChange(member.userId, val as any)}
                                                        disabled={updateMemberRole.isPending}
                                                    >
                                                        <SelectTrigger className="w-[110px] h-8 text-xs bg-background/50">
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
                                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleKick(member.userId)}
                                                        disabled={kickMember.isPending}
                                                        title="Remove Member"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};
