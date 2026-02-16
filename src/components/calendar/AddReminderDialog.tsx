import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddReminderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (reminder: { title: string; time: string; isSpecial: boolean }) => void;
}

export const AddReminderDialog = ({ open, onOpenChange, onSave }: AddReminderDialogProps) => {
    const [title, setTitle] = useState("");
    const [hour, setHour] = useState("09");
    const [minute, setMinute] = useState("00");
    const [isSpecial, setIsSpecial] = useState(false);

    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

    const handleSave = () => {
        if (!title.trim()) return;
        onSave({
            title,
            time: `${hour}:${minute}`,
            isSpecial,
        });
        // Reset state
        setTitle("");
        setHour("09");
        setMinute("00");
        setIsSpecial(false);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] border-border bg-background">
                <DialogHeader>
                    <DialogTitle>Add a new reminder</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Input
                            id="title"
                            placeholder="What do you want to be reminded of?"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={hour} onValueChange={setHour}>
                            <SelectTrigger className="w-[70px]">
                                <SelectValue placeholder="HH" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                                {hours.map((h) => (
                                    <SelectItem key={h} value={h}>
                                        {h}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <span className="text-xl font-bold">:</span>
                        <Select value={minute} onValueChange={setMinute}>
                            <SelectTrigger className="w-[70px]">
                                <SelectValue placeholder="MM" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                                {minutes.map((m) => (
                                    <SelectItem key={m} value={m}>
                                        {m}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="special"
                            checked={isSpecial}
                            onCheckedChange={(checked) => setIsSpecial(checked === true)}
                        />
                        <Label htmlFor="special" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Mark as special event
                        </Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Reminder</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
