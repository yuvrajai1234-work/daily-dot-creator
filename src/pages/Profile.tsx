import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/components/AuthProvider";
import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStats, useAchievements, useUserAchievements } from "@/hooks/useAchievements";
import { User, MapPin, Briefcase, Calendar, Users, Weight, Ruler, Heart, Crown, Camera, Lock, Sparkles, CheckCircle } from "lucide-react";
import LifeBalanceSpiderWeb from "@/components/LifeBalanceSpiderWeb";
import HabitPointsCalendar from "@/components/HabitPointsCalendar";
import AvatarSelector from "@/components/AvatarSelector";
import AvatarWithFrame, { AVATAR_FRAMES, AvatarFrameId } from "@/components/AvatarWithFrame";
import { useLevelInfo } from "@/hooks/useXP";
import { useProfile } from "@/hooks/useProfile";
import { useTheme } from "@/contexts/ThemeContext";
import { RARITY_CONFIG, CATEGORY_CONFIG, YEAR_OPTIONS, getAchievementProgress } from "@/hooks/achievementConstants";
import { YearDropdown } from "@/components/YearDropdown";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pin, Star as StarIcon, Trophy, Award, Flame, Zap, Shield, Target, BookOpen, MoreHorizontal, Plus, Settings } from "lucide-react";


const personalityTraits = [
  "Empathy", "Resilience", "Confidence", "Kindness", "Leadership", "Reliability",
  "Optimism", "Creativity", "Honesty", "Gratitude", "Humility", "Adaptability",
  "Punctuality", "Generosity", "Self-discipline", "Resourcefulness", "Fair-mindedness",
  "Enthusiasm", "Forgiveness", "Integrity", "Patience", "Courage", "Loyalty",
  "Curiosity", "Perseverance",
];

const ProfilePage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: stats } = useUserStats();
  const { data: levelInfo } = useLevelInfo();
  const { data: profileData } = useProfile();
  const { settings } = useTheme();
  const { data: allAchievements = [] } = useAchievements();
  const { data: userAchievements = [] } = useUserAchievements();
  const metadata = user?.user_metadata || {};
  const userLevel = levelInfo?.level || 0;
  const isLevel5Plus = userLevel >= 5;

  // Earned achievement IDs set
  const earnedIds = useMemo(() => new Set(userAchievements.map((ua) => ua.achievement_id)), [userAchievements]);
  const earnedAchievements = useMemo(() => allAchievements.filter((a) => earnedIds.has(a.id)), [allAchievements, earnedIds]);

  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPersonality, setIsEditingPersonality] = useState(false);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [isBadgeSelectionOpen, setIsBadgeSelectionOpen] = useState(false);

  // Basic Info
  const [name, setName] = useState(metadata.full_name || "");
  const [designation, setDesignation] = useState(metadata.designation || "");
  const [bio, setBio] = useState(metadata.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(metadata.avatar_url || "");

  // Extended Profile Fields
  const [age, setAge] = useState(metadata.age || "");
  const [gender, setGender] = useState(metadata.gender || "");
  const [weight, setWeight] = useState(metadata.weight || "");
  const [height, setHeight] = useState(metadata.height || "");
  const [bodyType, setBodyType] = useState(metadata.bodyType || "");
  const [status, setStatus] = useState(metadata.status || "");
  const [location, setLocation] = useState(metadata.location || "");
  const [archetype, setArchetype] = useState(metadata.archetype || "");

  const [selectedTraits, setSelectedTraits] = useState<string[]>(metadata.personality_traits || []);

  // MBTI Personality sliders
  const [introvertExtrovert, setIntrovertExtrovert] = useState(metadata.introvertExtrovert || 50);
  const [analyticalCreative, setAnalyticalCreative] = useState(metadata.analyticalCreative || 50);
  const [loyalFickle, setLoyalFickle] = useState(metadata.loyalFickle || 50);
  const [passiveActive, setPassiveActive] = useState(metadata.passiveActive || 50);

  // Achievement filters
  const [achievementActiveTab, setAchievementActiveTab] = useState("all");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Pinned badges (max 5)
  const [pinnedBadges, setPinnedBadges] = useState<string[]>([]);
  
  const togglePinBadge = async (badgeId: string) => {
    let newPinned = [...pinnedBadges];
    if (newPinned.includes(badgeId)) {
      newPinned = newPinned.filter(id => id !== badgeId);
    } else {
      if (newPinned.length >= 5) {
        toast.error("You can only pin up to 5 badges");
        return;
      }
      newPinned.push(badgeId);
    }
    
    setPinnedBadges(newPinned);
    
    // Save to database
    const { error } = await supabase
      .from("profiles")
      .update({ pinned_badges: newPinned })
      .eq("user_id", user!.id);
      
    if (error) {
      toast.error("Failed to update pinned badges");
    } else {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    }
  };

  // Sync pinned badges when profileData loads
  useState(() => {
    if (profileData?.pinned_badges && Array.isArray(profileData.pinned_badges)) {
      setPinnedBadges(profileData.pinned_badges as string[]);
    }
  });

  const filteredBadges = useMemo(() => {
    let list = allAchievements;
    if (achievementActiveTab !== "all") list = list.filter(a => a.category === achievementActiveTab);
    if (rarityFilter !== "all") list = list.filter(a => (a.rarity || "common") === rarityFilter);
    if (yearFilter !== "all") list = list.filter(a => String(a.year_target || 1) === yearFilter);
    if (statusFilter !== "all") {
      if (statusFilter === "completed") list = list.filter(a => earnedIds.has(a.id));
      else if (statusFilter === "not_completed") list = list.filter(a => !earnedIds.has(a.id));
    }

    return [...list].sort((a, b) => {
      const aEarned = earnedIds.has(a.id);
      const bEarned = earnedIds.has(b.id);
      if (aEarned && !bEarned) return -1;
      if (!aEarned && bEarned) return 1;
      return 0;
    });
  }, [allAchievements, achievementActiveTab, rarityFilter, yearFilter, statusFilter, earnedIds]);

  // Calculate BMI
  const bmi = useMemo(() => {
    if (weight && height) {
      const weightKg = parseFloat(weight);
      const heightM = parseFloat(height) / 100;
      return (weightKg / (heightM * heightM)).toFixed(2);
    }
    return "";
  }, [weight, height]);

  const userInitials = name
    ? name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || "U";
 
  const isSaveDisabled = useMemo(() => {
    return (
      !name?.trim() ||
      !designation?.trim() ||
      !bio?.trim() ||
      !gender ||
      !location?.trim() ||
      !archetype ||
      selectedTraits.length === 0 ||
      (!age && !weight && !height)
    );
  }, [name, designation, bio, gender, location, archetype, selectedTraits, age, weight, height]);

  const handleSave = async () => {
    const updates = {
      full_name: name,
      designation,
      bio,
      avatar_url: avatarUrl,
      age: age ? Number(age) : null,
      gender,
      weight: weight ? Number(weight) : null,
      height: height ? Number(height) : null,
      bodyType,
      status,
      location,
      archetype,
      personality_traits: selectedTraits,
      introvertExtrovert,
      analyticalCreative,
      loyalFickle,
      passiveActive,
    };

    const { error } = await supabase.auth.updateUser({ data: updates });

    const typeStr = [
      introvertExtrovert < 50 ? 'I' : 'E',
      analyticalCreative < 50 ? 'S' : 'N',
      loyalFickle < 50 ? 'F' : 'T',
      passiveActive < 50 ? 'P' : 'J'
    ].join('');

    // Sync with public profiles table
    if (!error && user) {
      const publicUpdates: any = {
        full_name: name,
        avatar_url: avatarUrl,
        bio,
        location,
        gender,
        designation,
        age: age ? Number(age) : null,
        weight: weight ? Number(weight) : null,
        height: height ? Number(height) : null,
        bmi: bmi ? Number(bmi) : null,
        body_type: bodyType,
        status,
        archetype,
        personality_traits: selectedTraits,
        personality_type: typeStr,
      };
      await supabase.from("profiles").update(publicUpdates).eq("user_id", user.id);
    }

    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated!");
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setName(metadata.full_name || "");
    setDesignation(metadata.designation || "");
    setBio(metadata.bio || "");
    setAvatarUrl(metadata.avatar_url || "");
    setAge(metadata.age || "");
    setGender(metadata.gender || "");
    setWeight(metadata.weight || "");
    setHeight(metadata.height || "");
    setBodyType(metadata.bodyType || "");
    setStatus(metadata.status || "");
    setLocation(metadata.location || "");
    setArchetype(metadata.archetype || "");
    setSelectedTraits(metadata.personality_traits || []);
    setIntrovertExtrovert(metadata.introvertExtrovert || 50);
    setAnalyticalCreative(metadata.analyticalCreative || 50);
    setLoyalFickle(metadata.loyalFickle || 50);
    setPassiveActive(metadata.passiveActive || 50);
    setIsEditing(false);
  };

  const handleAvatarChange = async (newAvatarUrl: string) => {
    setAvatarUrl(newAvatarUrl);

    // Save immediately
    const { error } = await supabase.auth.updateUser({
      data: { avatar_url: newAvatarUrl }
    });

    // Sync with public profiles table
    if (!error && user) {
      await supabase.from("profiles").update({
        avatar_url: newAvatarUrl
      }).eq("user_id", user.id);
    }

    if (error) {
      toast.error("Failed to update avatar");
    } else {
      toast.success("Avatar updated!");
    }
  };

  const toggleTrait = (trait: string) => {
    setSelectedTraits((prev) =>
      prev.includes(trait) ? prev.filter((t) => t !== trait) : [...prev, trait]
    );
  };

  const handleSavePersonality = async () => {
    const updates = {
      introvertExtrovert,
      analyticalCreative,
      loyalFickle,
      passiveActive,
    };

    const typeStr = [
      introvertExtrovert < 50 ? 'I' : 'E',
      analyticalCreative < 50 ? 'S' : 'N',
      loyalFickle < 50 ? 'F' : 'T',
      passiveActive < 50 ? 'P' : 'J'
    ].join('');

    const { error } = await supabase.auth.updateUser({ data: updates });

    // Personality type is stored in auth user metadata only

    if (error) {
      toast.error("Failed to update personality");
    } else {
      toast.success("Personality updated!");
      setIsEditingPersonality(false);
    }
  };

  const handleCancelPersonality = () => {
    setIntrovertExtrovert(metadata.introvertExtrovert || 50);
    setAnalyticalCreative(metadata.analyticalCreative || 50);
    setLoyalFickle(metadata.loyalFickle || 50);
    setPassiveActive(metadata.passiveActive || 50);
    setIsEditingPersonality(false);
  };

  // MBTI Personality Type Calculator
  const personalityTypes = {
    ISTJ: 'Responsible, sincere, analytical, reserved, realistic, systematic. Hardworking and trustworthy with practical judgement.',
    ISFJ: 'Warm, considerate, gentle, responsible, pragmatic, thorough. Devoted caretakers who enjoy being helpful to others.',
    INFJ: 'Idealistic, organized, insightful, dependable, compassionate, gentle. Peace & cooperation.',
    INTJ: 'Innovative, independent, strategic, logical, reserved, insightful. Driven by original ideas to achieve improvements.',
    ISTP: 'Action-oriented, logical, analytical, spontaneous, reserved, independent. Enjoy adventure, skilled at understanding things.',
    ISFP: 'Gentle, sensitive, nurturing, helpful, flexible, realistic. Personal environment is beautiful & practical.',
    INFP: 'Sensitive, creative, idealistic, perceptive, caring, loyal. Harmony and growth, dreams and possibilities.',
    INTP: 'Intellectual, logical, precise, reserved, flexible, imaginative. Thinkers who enjoy speculation & creative problem solving.',
    ESTP: 'Outgoing, realistic, action-oriented, curious, versatile, spontaneous. Pragmatic problem solvers & negotiators.',
    ESFP: 'Playful, enthusiastic, friendly, spontaneous, tactful, flexible. Have common sense, enjoy helping people.',
    ENFP: 'Enthusiastic, creative, spontaneous, optimistic, supportive, playful. Inspiration, new projects, see potential.',
    ENTP: 'Inventive, enthusiastic, strategic, enterprising, inquisitive, versatile. Enjoy new ideas and challenges, value inspiration.',
    ESTJ: 'Efficient, outgoing, analytical, systematic, dependable, realistic. Like to run the show and get things done in an orderly fashion.',
    ESFJ: 'Friendly, outgoing, reliable, conscientious, organized, practical. Helpful and please others, enjoy being active and productive.',
    ENFJ: 'Caring, enthusiastic, idealistic, organized, diplomatic, responsible. Skilled communicators who value connection.',
    ENTJ: 'Strategic, logical, efficient, outgoing, ambitious, independent. Effective organizers of people and planners.',
  };

  const personalityType = useMemo(() => {
    let type = '';
    type += introvertExtrovert < 50 ? 'I' : 'E';
    type += analyticalCreative < 50 ? 'S' : 'N';
    type += loyalFickle < 50 ? 'F' : 'T';
    type += passiveActive < 50 ? 'P' : 'J';
    return type as keyof typeof personalityTypes;
  }, [introvertExtrovert, analyticalCreative, loyalFickle, passiveActive]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your profile and personality</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Card */}
        <div data-onboarding="profile-left-col" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card data-onboarding="profile-card" className="glass border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Profile</CardTitle>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button 
                      data-onboarding="profile-save-btn" 
                      size="sm" 
                      onClick={handleSave}
                      disabled={isSaveDisabled}
                      title={isSaveDisabled ? "Please fill in all details and select at least one personality trait" : ""}
                    >
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancel}>Cancel</Button>
                  </div>
                ) : (
                  <Button data-onboarding="profile-edit-btn" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>
                )}
              </CardHeader>
              <CardContent className="flex flex-col items-center text-center space-y-4">
                {/* Avatar with frame */}
                <AvatarWithFrame
                  avatarUrl={avatarUrl}
                  fallback={userInitials}
                  frameId={settings.avatarFrame}
                  size="xl"
                  showHoverOverlay
                  onClick={() => setIsAvatarDialogOpen(true)}
                />

                {isEditing ? (
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="text-center bg-secondary/30 border-border" />
                ) : (
                  <h2 className="text-xl font-bold">{name || "Anonymous"}</h2>
                )}

                {isEditing ? (
                  <Input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="Your role/designation" className="text-center bg-secondary/30 border-border" />
                ) : (
                  designation && <p className="text-primary text-sm">{designation}</p>
                )}

                {isEditing ? (
                  <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." className="bg-secondary/30 border-border resize-none" />
                ) : (
                  bio && <p className="text-muted-foreground italic text-sm">"{bio}"</p>
                )}

                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Earned Badges Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <Card className="glass border-border/50">
              <CardHeader className="pb-3 px-4 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg flex items-center gap-2">
                  🏅 Earned Badges
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] h-5 px-1.5 ml-1">
                    {userAchievements.length}/{allAchievements.length}
                  </Badge>
                </CardTitle>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="glass border-border/50">
                    <DropdownMenuItem 
                      onClick={() => setIsBadgeSelectionOpen(true)}
                      className="text-xs cursor-pointer focus:bg-primary/10 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add to profile / Edit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              
              <CardContent className="px-4 pb-4">
                <div className="flex flex-wrap gap-3 justify-center py-2">
                  {[0, 1, 2, 3, 4].map((index) => {
                    const pinnedId = pinnedBadges[index];
                    const achievement = pinnedId ? allAchievements.find(a => a.id === pinnedId) : null;
                    const rc = achievement ? (RARITY_CONFIG[achievement.rarity || "common"] || RARITY_CONFIG.common) : null;

                    return (
                      <div 
                        key={index}
                        className={`w-14 h-14 rounded-2xl border-2 border-dashed flex items-center justify-center transition-all ${
                          achievement 
                            ? `${rc?.border} border-solid bg-secondary/10 shadow-sm` 
                            : 'border-muted-foreground/20 bg-secondary/5 hover:border-primary/30 hover:bg-primary/5 cursor-pointer'
                        }`}
                        onClick={() => setIsBadgeSelectionOpen(true)}
                      >
                        {achievement ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-2xl">{achievement.icon}</span>
                          </div>
                        ) : (
                          <Plus className="w-4 h-4 text-muted-foreground/40" />
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {pinnedBadges.length === 0 && (
                  <p className="text-[10px] text-center text-muted-foreground mt-2">
                    Highlight up to 5 badges on your community profile
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <Dialog open={isBadgeSelectionOpen} onOpenChange={setIsBadgeSelectionOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden glass border-border/50 p-0 flex flex-col bg-popover/95 backdrop-blur-xl">
              <DialogHeader className="p-6 pb-2 border-b border-border/30">
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <Award className="w-6 h-6 text-primary" /> Select Pinned Badges
                </DialogTitle>
                <p className="text-sm text-muted-foreground">Select up to 5 badges to display on your community profile.</p>
              </DialogHeader>
              
              <div className="p-6 space-y-6 flex-1 overflow-y-auto no-scrollbar">
                {/* Selection Slots */}
                <div className="grid grid-cols-5 gap-3 p-4 rounded-2xl bg-secondary/20 border border-border/30">
                  {[0, 1, 2, 3, 4].map((index) => {
                    const pinnedId = pinnedBadges[index];
                    const achievement = pinnedId ? allAchievements.find(a => a.id === pinnedId) : null;
                    const rc = achievement ? (RARITY_CONFIG[achievement.rarity || "common"] || RARITY_CONFIG.common) : null;

                    return (
                      <div 
                        key={index}
                        className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center relative transition-all ${
                          achievement 
                            ? `${rc?.border} border-solid bg-background shadow-md group` 
                            : 'border-muted-foreground/30 bg-secondary/10'
                        }`}
                      >
                        {achievement ? (
                          <>
                            <span className="text-3xl mb-1">{achievement.icon}</span>
                            <span className="text-[9px] font-bold text-center px-1 truncate w-full">{achievement.name}</span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); togglePinBadge(pinnedId); }}
                              className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                              <Plus className="w-3 h-3 rotate-45" />
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-tighter">Empty</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex flex-col gap-3">
                    {/* Filters Row 1 */}
                    <div className="flex items-center gap-2 flex-wrap pb-1">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground mr-1">Rarity:</span>
                      {["all", "common", "rare", "epic", "legendary"].map((r) => {
                        const rc = r !== "all" ? RARITY_CONFIG[r] : null;
                        return (
                          <button
                            key={r}
                            onClick={() => setRarityFilter(r)}
                            className={`px-3 py-1 rounded-full text-[10px] font-medium border transition-all ${rarityFilter === r
                              ? rc
                                ? `bg-gradient-to-r ${rc.gradient} border-transparent text-white`
                                : "bg-primary text-primary-foreground border-transparent"
                              : "border-border/50 text-muted-foreground hover:border-border hover:bg-secondary/50"
                              }`}
                          >
                            {r !== "all" && rc ? rc.label : "All"}
                          </button>
                        );
                      })}
                      
                      <div className="ml-auto">
                         <YearDropdown value={yearFilter} onChange={setYearFilter} />
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground mr-1">Status:</span>
                      {[
                        { id: "all", label: "All Status" },
                        { id: "completed", label: "Completed" },
                        { id: "not_completed", label: "Not Completed" }
                      ].map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setStatusFilter(s.id)}
                          className={`px-3 py-1 rounded-full text-[10px] font-medium border transition-all ${statusFilter === s.id
                              ? "bg-primary text-primary-foreground border-transparent"
                              : "border-border/50 text-muted-foreground hover:border-border hover:bg-secondary/50"
                            }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>

                    {/* Category Pills */}
                    <div className="flex flex-wrap gap-1.5 py-3 border-y border-border/20 overflow-x-auto no-scrollbar">
                      {Object.keys(CATEGORY_CONFIG).map((catId) => {
                        const cfg = CATEGORY_CONFIG[catId];
                        return (
                          <button
                            key={catId}
                            onClick={() => setAchievementActiveTab(catId)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-medium transition-all whitespace-nowrap ${achievementActiveTab === catId
                              ? "bg-primary/20 border-primary text-primary"
                              : "bg-secondary/20 border-border/50 text-muted-foreground hover:border-border hover:bg-secondary/40"
                            }`}
                          >
                            <span>{cfg.icon ? <cfg.icon className="w-3 h-3" /> : '🏷️'}</span>
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Badge Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1 pb-4">
                    {filteredBadges.map((achievement) => {
                      const earned = earnedIds.has(achievement.id);
                      const isPinned = pinnedBadges.includes(achievement.id);
                      const rc = RARITY_CONFIG[achievement.rarity || "common"] || RARITY_CONFIG.common;
                      const colorClass = rc.border + " " + (earned ? "opacity-100" : "opacity-40 grayscale");
                      
                      return (
                        <button
                          key={achievement.id}
                          disabled={!earned}
                          onClick={() => togglePinBadge(achievement.id)}
                          className={`group relative flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all h-24 ${
                            isPinned ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'bg-secondary/5 border-border/50'
                          } ${earned ? 'hover:border-primary/50 cursor-pointer active:scale-95' : 'cursor-not-allowed'} ${colorClass}`}
                          title={achievement.description}
                        >
                          <span className="text-3xl leading-none mt-1">{achievement.icon}</span>
                          <span className="text-[9px] font-bold text-center leading-tight line-clamp-2 w-full">{achievement.name}</span>
                          
                          {isPinned && (
                            <div className="absolute top-1 right-1 bg-primary text-white p-0.5 rounded-md shadow-md">
                              <CheckCircle className="w-2.5 h-2.5" />
                            </div>
                          )}
                          {!earned && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/20 rounded-xl">
                              <Lock className="w-5 h-5 text-muted-foreground/30" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Details Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card data-onboarding="profile-details" className="glass border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Age */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span className="font-medium text-sm">Age</span>
                  </div>
                  {isEditing ? (
                    <Input
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="Age"
                      type="number"
                      className="w-24 bg-secondary/30 border-border text-sm"
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">{age || "—"}</span>
                  )}
                </div>

                {/* Gender */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-pink-500/5 border border-pink-500/10">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-pink-400" />
                    <span className="font-medium text-sm">Gender</span>
                  </div>
                  {isEditing ? (
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger className="w-32 bg-secondary/30 border-border text-sm">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm text-muted-foreground">{gender || "—"}</span>
                  )}
                </div>

                {/* Weight */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <div className="flex items-center gap-2">
                    <Weight className="w-4 h-4 text-emerald-400" />
                    <span className="font-medium text-sm">Weight (kg)</span>
                  </div>
                  {isEditing ? (
                    <Input
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="65"
                      type="number"
                      className="w-24 bg-secondary/30 border-border text-sm"
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">{weight ? `${weight} kg` : "—"}</span>
                  )}
                </div>

                {/* Height */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-amber-500" />
                    <span className="font-medium text-sm">Height (cm)</span>
                  </div>
                  {isEditing ? (
                    <Input
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="181"
                      type="number"
                      className="w-24 bg-secondary/30 border-border text-sm"
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">{height ? `${height} cm` : "—"}</span>
                  )}
                </div>

                {/* BMI - Auto-calculated */}
                {(bmi || (weight && height)) && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-rose-500" />
                      <span className="font-medium text-sm">BMI</span>
                    </div>
                    <span className="text-sm text-primary font-medium">{bmi || "—"}</span>
                  </div>
                )}

                {/* Body Type */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-400" />
                    <span className="font-medium text-sm">Body Type</span>
                  </div>
                  {isEditing ? (
                    <Select value={bodyType} onValueChange={setBodyType}>
                      <SelectTrigger className="w-32 bg-secondary/30 border-border text-sm">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ectomorph">Ectomorph</SelectItem>
                        <SelectItem value="Mesomorph">Mesomorph</SelectItem>
                        <SelectItem value="Endomorph">Endomorph</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm text-muted-foreground">{bodyType || "—"}</span>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-400" />
                    <span className="font-medium text-sm">Status</span>
                  </div>
                  {isEditing ? (
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="w-32 bg-secondary/30 border-border text-sm">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="In a Relationship">In a Relationship</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="It's Complicated">It's Complicated</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm text-muted-foreground">{status || "—"}</span>
                  )}
                </div>

                {/* Location */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-teal-500/5 border border-teal-500/10">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal-400" />
                    <span className="font-medium text-sm">Location</span>
                  </div>
                  {isEditing ? (
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="City"
                      type="text"
                      className="w-32 bg-secondary/30 border-border text-sm"
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">{location || "—"}</span>
                  )}
                </div>

                {/* Archetype */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-violet-500/5 border border-violet-500/10">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-violet-400" />
                    <span className="font-medium text-sm">Archetype</span>
                  </div>
                  {isEditing ? (
                    <Select value={archetype} onValueChange={setArchetype}>
                      <SelectTrigger className="w-32 bg-secondary/30 border-border text-sm">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ruler">Ruler</SelectItem>
                        <SelectItem value="Creator">Creator</SelectItem>
                        <SelectItem value="Sage">Sage</SelectItem>
                        <SelectItem value="Innocent">Innocent</SelectItem>
                        <SelectItem value="Explorer">Explorer</SelectItem>
                        <SelectItem value="Hero">Hero</SelectItem>
                        <SelectItem value="Magician">Magician</SelectItem>
                        <SelectItem value="Lover">Lover</SelectItem>
                        <SelectItem value="Jester">Jester</SelectItem>
                        <SelectItem value="Caregiver">Caregiver</SelectItem>
                        <SelectItem value="Rebel">Rebel</SelectItem>
                        <SelectItem value="Everyman">Everyman</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm text-muted-foreground">{archetype || "—"}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Traits */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Personality Traits</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {isEditing
                  ? personalityTraits.map((trait) => (
                    <Badge
                      key={trait}
                      variant={selectedTraits.includes(trait) ? "default" : "outline"}
                      className="cursor-pointer transition-smooth"
                      onClick={() => toggleTrait(trait)}
                    >
                      {trait}
                    </Badge>
                  ))
                  : (selectedTraits.length > 0
                    ? selectedTraits.map((trait) => (
                      <Badge key={trait} className="gradient-primary text-foreground">{trait}</Badge>
                    ))
                    : <p className="text-sm text-muted-foreground">No traits selected yet</p>
                  )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle>Your Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Total Habits", value: stats?.totalHabits || 0, color: "text-primary" },
                    { label: "Completions", value: stats?.totalCompletions || 0, color: "text-success" },
                    { label: "Best Streak", value: `${stats?.bestStreak || 0} days`, color: "text-warning" },
                    { label: "Reflections", value: stats?.totalReflections || 0, color: "text-primary" },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center p-3 rounded-lg bg-secondary/20">
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Personality Sliders - locked below level 5 */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            {!isLevel5Plus ? (
              <Card className="glass border-border/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-3 p-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                    <Lock className="w-8 h-8 text-primary/60" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-lg">Personality Spectrum</p>
                    <p className="text-muted-foreground text-sm mt-1">Unlocks at <span className="text-primary font-bold">Level 5</span></p>
                    <div className="mt-3 w-full max-w-[200px] mx-auto">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Level {userLevel}</span><span>Level 5</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(100, (userLevel / 5) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <CardHeader className="opacity-20 select-none blur-sm">
                  <CardTitle>Personality Spectrum</CardTitle>
                </CardHeader>
                <CardContent className="opacity-20 select-none blur-sm space-y-6 pb-8">
                  <div className="h-6 bg-secondary rounded w-full" />
                  <div className="h-6 bg-secondary rounded w-full" />
                  <div className="h-6 bg-secondary rounded w-full" />
                </CardContent>
              </Card>
            ) : (
              <AnimatePresence>
                <motion.div
                  initial={userLevel === 5 ? { scale: 0.9, opacity: 0 } : false}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <Card className="glass border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        Personality Spectrum
                        {userLevel === 5 && (
                          <motion.span
                            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }}
                            className="text-xs bg-gradient-to-r from-primary to-primary/60 text-white px-2 py-0.5 rounded-full flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3" /> Just Unlocked!
                          </motion.span>
                        )}
                      </CardTitle>
                      {isEditingPersonality ? (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSavePersonality}>Save</Button>
                          <Button size="sm" variant="outline" onClick={handleCancelPersonality}>Cancel</Button>
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => setIsEditingPersonality(true)}>Edit</Button>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {[
                        { label: ["Introvert", "Extrovert"], value: introvertExtrovert, setter: setIntrovertExtrovert },
                        { label: ["Analytical", "Creative"], value: analyticalCreative, setter: setAnalyticalCreative },
                        { label: ["Loyal", "Fickle"], value: loyalFickle, setter: setLoyalFickle },
                        { label: ["Passive", "Active"], value: passiveActive, setter: setPassiveActive },
                      ].map(({ label, value, setter }) => (
                        <div key={label[0]} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{label[0]}</span>
                            <span className="text-muted-foreground">{label[1]}</span>
                          </div>
                          <Slider
                            value={[value]}
                            onValueChange={([v]) => isEditingPersonality && setter(v)}
                            max={100}
                            step={1}
                            disabled={!isEditingPersonality}
                            className="cursor-pointer"
                          />
                          <p className="text-center text-xs text-muted-foreground">{value}%</p>
                        </div>
                      ))}

                      {/* MBTI Personality Type Display */}
                      <div className="mt-6 pt-6 border-t border-border/30">
                        <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                          <h3 className="text-xl font-bold text-center text-primary mb-2">
                            {personalityType}
                          </h3>
                          <p className="text-sm text-center text-muted-foreground leading-relaxed">
                            {personalityTypes[personalityType]}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>
            )}
          </motion.div>

          {/* Habit Points Calendar */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}>
            <HabitPointsCalendar />
          </motion.div>

          {/* Life Balance Spider Web - locked below level 5 */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            {!isLevel5Plus ? (
              <Card className="glass border-border/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-3 p-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                    <Lock className="w-8 h-8 text-primary/60" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-lg">Life Balance Spider Web</p>
                    <p className="text-muted-foreground text-sm mt-1">Unlocks at <span className="text-primary font-bold">Level 5</span></p>
                  </div>
                </div>
                <CardHeader className="opacity-20 select-none blur-sm">
                  <CardTitle>Life Balance</CardTitle>
                </CardHeader>
                <CardContent className="opacity-20 select-none blur-sm h-48" />
              </Card>
            ) : (
              <AnimatePresence>
                <motion.div
                  initial={userLevel === 5 ? { scale: 0.9, opacity: 0 } : false}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                >
                  <LifeBalanceSpiderWeb />
                </motion.div>
              </AnimatePresence>
            )}
          </motion.div>
        </div>
      </div>

      {/* Avatar Selector Dialog */}
      <AvatarSelector
        open={isAvatarDialogOpen}
        onOpenChange={setIsAvatarDialogOpen}
        currentAvatar={avatarUrl}
        userInitials={userInitials}
        onAvatarChange={handleAvatarChange}
      />
    </div>
  );
};

export default ProfilePage;
