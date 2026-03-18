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


const personalityTraits = [
  "Empathy", "Resilience", "Confidence", "Kindness", "Leadership", "Reliability",
  "Optimism", "Creativity", "Honesty", "Gratitude", "Humility", "Adaptability",
  "Punctuality", "Generosity", "Self-discipline", "Resourcefulness", "Fair-mindedness",
  "Enthusiasm", "Forgiveness", "Integrity", "Patience", "Courage", "Loyalty",
  "Curiosity", "Perseverance",
];

const ProfilePage = () => {
  const { user } = useAuth();
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
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  🏅 Earned Badges
                  {earnedAchievements.length > 0 && (
                    <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      {earnedAchievements.length}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {earnedAchievements.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-3xl mb-2">🔒</p>
                    <p className="text-sm">No badges earned yet. Complete achievements to earn badges!</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {earnedAchievements.map((achievement) => {
                      const rarityColors: Record<string, string> = {
                        common: "border-slate-500/40 bg-slate-500/5",
                        rare: "border-blue-500/50 bg-blue-500/5",
                        epic: "border-purple-500/60 bg-purple-500/10",
                        legendary: "border-amber-500/70 bg-amber-500/10 shadow-amber-500/20 shadow-sm",
                      };
                      const colorClass = rarityColors[achievement.rarity || "common"] || rarityColors.common;
                      return (
                        <div
                          key={achievement.id}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${colorClass}`}
                          title={achievement.description}
                        >
                          <span className="text-base leading-none">{achievement.icon}</span>
                          <span className="truncate max-w-[90px]">{achievement.name}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Details Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card data-onboarding="profile-details" className="glass border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Age */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Weight className="w-4 h-4 text-muted-foreground" />
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-muted-foreground" />
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm">BMI</span>
                    </div>
                    <span className="text-sm text-primary font-medium">{bmi || "—"}</span>
                  </div>
                )}

                {/* Body Type */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-muted-foreground" />
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-muted-foreground" />
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
