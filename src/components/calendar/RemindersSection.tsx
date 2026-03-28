import { format, isBefore, startOfDay } from "date-fns";
import { useState } from "react";
import { useReminders } from "@/hooks/useReminders";
import { AddReminderDialog } from "./AddReminderDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, AlertCircle, Bell } from "lucide-react";
import { useSpendBCoins } from "@/hooks/useCoins";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";

const REMINDER_COST = 5;

interface RemindersSectionProps {
    date: Date | undefined;
}

export const RemindersSection = ({ date }: RemindersSectionProps) => {
    const [showAddDialog, setShowAddDialog] = useState(false);
    const { user } = useAuth();
    const { deleteReminder, getRemindersForDate, addReminder, isPending } = useReminders();
    const { data: profile } = useProfile();
    const spendBCoins = useSpendBCoins();

    if (!date) return null;

    const isPastDate = isBefore(startOfDay(date), startOfDay(new Date()));

    const dateStr = format(date, "yyyy-MM-dd");
    const dayReminders = getRemindersForDate(dateStr);

    const handleSave = async (data: { title: string; time: string; isSpecial: boolean }) => {
        // Prevent adding reminders for past times today
        const now = new Date();
        const todayStr = format(now, "yyyy-MM-dd");
        if (dateStr === todayStr) {
            const currentTimeStr = format(now, "HH:mm");
            if (data.time < currentTimeStr) {
                toast.error("You cannot add a reminder for a past time today.");
                return;
            }
        }

        const bBalance = (profile as any)?.b_coin_balance || 0;
        if (bBalance < REMINDER_COST) {
            toast.error(`Not enough B Coins! You need ${REMINDER_COST} B Coins to add a reminder.`);
            return;
        }

        try {
            await spendBCoins.mutateAsync({ amount: REMINDER_COST, reason: "Add reminder" });
            addReminder({
                ...data,
                date: dateStr,
                userId: user?.id,
            });
            setShowAddDialog(false);
            toast.success(`Reminder added! (-${REMINDER_COST} B Coins)`);
        } catch (err: any) {
            toast.error(err.message || "Failed to add reminder");
        }
    };

    return (
        <>
            <Card className="glass border-border/50 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                        <div>
                            <h2 className="text-2xl font-bold">Reminders for {format(date, "MMMM d, yyyy")}</h2>
                            <p className="text-muted-foreground text-sm">Manage your reminders for the selected date.</p>
                        </div>
                        <Button
                            onClick={() => setShowAddDialog(true)}
                            className="bg-primary hover:bg-opacity-90 transition-colors gap-2"
                            disabled={isPastDate || spendBCoins.isPending || isPending}
                        >
                            <Bell className="w-4 h-4" />
                            Add Reminder (Costs {REMINDER_COST} B Coins)
                        </Button>
                    </div>

                    <div className="rounded-md border border-border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30 hover:bg-muted/30">
                                    <TableHead className="w-[50%]">Reminder</TableHead>
                                    <TableHead>Time</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dayReminders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                            No reminders for this day.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    dayReminders.map((reminder) => (
                                        <TableRow key={reminder.id} className="hover:bg-muted/20">
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    {reminder.isSpecial && <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />}
                                                    <span className={reminder.isSpecial ? "text-destructive font-semibold" : ""}>{reminder.title}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-muted-foreground">{reminder.time}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => deleteReminder(reminder.id)} className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <AddReminderDialog
                open={showAddDialog}
                onOpenChange={setShowAddDialog}
                onSave={handleSave}
            />
        </>
    );
};
