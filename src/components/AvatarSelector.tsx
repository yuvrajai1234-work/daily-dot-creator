import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Upload, Smile } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AvatarSelectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentAvatar?: string;
    userInitials: string;
    onAvatarChange: (avatarUrl: string) => void;
}

const PRESET_AVATARS = [
    "👤", "😊", "😎", "🤓", "🧑‍💻", "👨‍💼", "👩‍💼", "🧑‍🎓",
    "👨‍🎓", "👩‍🎓", "🧑‍🏫", "👨‍🏫", "👩‍🏫", "🧑‍⚕️", "👨‍⚕️", "👩‍⚕️",
    "🧑‍🎨", "👨‍🎨", "👩‍🎨", "🧑‍🔬", "👨‍🔬", "👩‍🔬", "🧑‍✈️", "👨‍✈️",
    "🦁", "🐯", "🐻", "🐼", "🐨", "🐸", "🦊", "🦝",
    "🌟", "⚡", "🔥", "💎", "🎯", "🚀", "🎨", "🎮",
    "⚽", "🎸", "📚", "☕", "🌈", "🌙", "🌞", "✨"
];

const AvatarSelector = ({ open, onOpenChange, currentAvatar, userInitials, onAvatarChange }: AvatarSelectorProps) => {
    const [selectedAvatar, setSelectedAvatar] = useState<string>(currentAvatar || "");
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarSelect = (avatar: string) => {
        setSelectedAvatar(avatar);
    };

    const handleSave = () => {
        onAvatarChange(selectedAvatar);
        onOpenChange(false);
    };

    const handleFileUpload = async (file: File) => {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size should be less than 5MB");
            return;
        }

        try {
            setUploading(true);

            // Upload to Supabase Storage
            const fileExt = file.name.split(".").pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data } = supabase.storage
                .from("avatars")
                .getPublicUrl(filePath);

            setSelectedAvatar(data.publicUrl);
            toast.success("Image uploaded successfully!");
        } catch (error) {
            console.error("Error uploading image:", error);
            toast.error("Failed to upload image");
        } finally {
            setUploading(false);
        }
    };

    const handleGalleryClick = () => {
        fileInputRef.current?.click();
    };

    const handleCameraClick = () => {
        cameraInputRef.current?.click();
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Change Profile Picture</DialogTitle>
                        <DialogDescription>
                            Choose an avatar or upload your own image
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Preview */}
                        <div className="flex justify-center">
                            <Avatar className="w-24 h-24 border-4 border-primary/30">
                                {selectedAvatar && !selectedAvatar.startsWith("http") ? (
                                    <div className="w-full h-full flex items-center justify-center text-4xl bg-primary/10">
                                        {selectedAvatar}
                                    </div>
                                ) : (
                                    <>
                                        <AvatarImage src={selectedAvatar} alt="Preview" />
                                        <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                                            {userInitials}
                                        </AvatarFallback>
                                    </>
                                )}
                            </Avatar>
                        </div>

                        <Tabs defaultValue="avatars" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="avatars">
                                    <Smile className="w-4 h-4 mr-2" />
                                    Avatars
                                </TabsTrigger>
                                <TabsTrigger value="gallery">
                                    <Upload className="w-4 h-4 mr-2" />
                                    Gallery
                                </TabsTrigger>
                                <TabsTrigger value="camera">
                                    <Camera className="w-4 h-4 mr-2" />
                                    Camera
                                </TabsTrigger>
                            </TabsList>

                            {/* Preset Avatars */}
                            <TabsContent value="avatars" className="space-y-4">
                                <div className="grid grid-cols-8 gap-2 max-h-64 overflow-y-auto p-2">
                                    {PRESET_AVATARS.map((avatar, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleAvatarSelect(avatar)}
                                            className={`
                        w-12 h-12 rounded-full flex items-center justify-center text-2xl
                        transition-all hover:scale-110 hover:bg-primary/20
                        ${selectedAvatar === avatar ? "ring-2 ring-primary bg-primary/20" : "bg-secondary/50"}
                      `}
                                        >
                                            {avatar}
                                        </button>
                                    ))}
                                </div>
                            </TabsContent>

                            {/* Gallery Upload */}
                            <TabsContent value="gallery" className="space-y-4">
                                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                    <h3 className="font-medium mb-2">Upload from Gallery</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        PNG, JPG or GIF (max. 5MB)
                                    </p>
                                    <Button onClick={handleGalleryClick} disabled={uploading}>
                                        {uploading ? "Uploading..." : "Choose File"}
                                    </Button>
                                </div>
                            </TabsContent>

                            {/* Camera */}
                            <TabsContent value="camera" className="space-y-4">
                                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                                    <Camera className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                    <h3 className="font-medium mb-2">Take a Photo</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Use your device's camera
                                    </p>
                                    <Button onClick={handleCameraClick} disabled={uploading}>
                                        {uploading ? "Uploading..." : "Open Camera"}
                                    </Button>
                                </div>
                            </TabsContent>
                        </Tabs>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={uploading}>
                                Save
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Hidden file inputs */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                }}
            />
            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                }}
            />
        </>
    );
};

export default AvatarSelector;
