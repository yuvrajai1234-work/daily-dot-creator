import React, { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const categories = [
    { name: 'Career', color: '#8b5cf6' },
    { name: 'Strength', color: '#3b82f6' },
    { name: 'Relationships', color: '#ef4444' },
    { name: 'Spirituality', color: '#10b981' },
    { name: 'Learning', color: '#f97316' },
    { name: 'Nutrition', color: '#22c55e' },
];

const LifeBalanceSpiderWeb = () => {
    const { user } = useAuth();
    const metadata = user?.user_metadata || {};

    const [scores, setScores] = useState({
        Career: 50,
        Strength: 50,
        Relationships: 50,
        Spirituality: 50,
        Learning: 50,
        Nutrition: 50,
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (metadata?.lifeBalanceScores) {
            setScores(metadata.lifeBalanceScores);
        }
    }, [metadata]);

    const data = categories.map(category => ({
        subject: category.name,
        score: scores[category.name as keyof typeof scores],
        fullMark: 100,
    }));

    const handleSliderChange = (categoryName: string) => (value: number[]) => {
        setScores(prevScores => ({
            ...prevScores,
            [categoryName]: value[0],
        }));
    };

    const handleSave = async () => {
        if (user) {
            setIsSaving(true);
            const { error } = await supabase.auth.updateUser({
                data: { lifeBalanceScores: scores }
            });

            if (error) {
                toast.error("Failed to update life balance scores");
            } else {
                toast.success("Life balance scores updated!");
                setIsEditing(false);
            }
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setScores(metadata?.lifeBalanceScores || {
            Career: 50,
            Strength: 50,
            Relationships: 50,
            Spirituality: 50,
            Learning: 50,
            Nutrition: 50,
        });
        setIsEditing(false);
    };

    return (
        <Card className="glass border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Life Balance Spider Web</CardTitle>
                    <CardDescription>A visual representation of your life balance</CardDescription>
                </div>
                {isEditing ? (
                    <div className="flex gap-2">
                        <Button size="sm" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancel}>
                            Cancel
                        </Button>
                    </div>
                ) : (
                    <Button size="sm" onClick={() => setIsEditing(true)}>
                        Edit
                    </Button>
                )}
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-8">
                <div>
                    <ResponsiveContainer width="100%" height={350}>
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis
                                dataKey="subject"
                                tick={{ fill: 'hsl(var(--foreground))', fontSize: 14 }}
                            />
                            <PolarRadiusAxis
                                angle={30}
                                domain={[0, 100]}
                                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            />
                            <Radar
                                name="Life Balance"
                                dataKey="score"
                                stroke="hsl(var(--primary))"
                                fill="hsl(var(--primary))"
                                fillOpacity={0.6}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
                <div>
                    <h3 className="text-lg font-medium mb-2">Adjust Your Scores</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        {isEditing
                            ? "Use the sliders below to adjust your scores in each area."
                            : "Click 'Edit' to adjust your life balance scores."}
                    </p>
                    {categories.map(category => (
                        <div key={category.name} className="mb-4">
                            <div className="flex justify-between mb-2">
                                <label style={{ color: category.color, fontWeight: 'bold' }} className="text-sm">
                                    {category.name}
                                </label>
                                <span className="text-sm font-medium">{scores[category.name as keyof typeof scores]}</span>
                            </div>
                            <Slider
                                value={[scores[category.name as keyof typeof scores]]}
                                max={100}
                                step={1}
                                onValueChange={handleSliderChange(category.name)}
                                disabled={!isEditing}
                                className="cursor-pointer"
                            />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default LifeBalanceSpiderWeb;
