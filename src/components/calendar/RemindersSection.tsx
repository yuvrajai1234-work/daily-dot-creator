import { format } from "date-fns";
import { useState } from "react";
import { useReminders } from "@/hooks/useReminders";
import { AddReminderDialog } from "./AddReminderDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, AlertCircle } from "lucide-react";

interface RemindersSectionProps {
    date: Date | undefined;
}

export const RemindersSection = ({ date }: RemindersSectionProps) => {
    const [showAddDialog, setShowAddDialog] = useState(false);
    const { deleteReminder, getRemindersForDate, addReminder } = useReminders();

    if (!date) return null;

    const dateStr = format(date, "yyyy-MM-dd");
    const dayReminders = getRemindersForDate(dateStr);

    const handleSave = (data: { title: string; time: string; isSpecial: boolean }) => {
        addReminder({
            ...data,
            date: dateStr,
        });
        setShowAddDialog(false);
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
                        <Button onClick={() => setShowAddDialog(true)} className="bg-primary hover:bg-opacity-90 transition-colors">
                            Add Reminder
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
