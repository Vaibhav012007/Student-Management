import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, AlertCircle, Bell } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Calendar as CalendarUI } from "./ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { format, parseISO, differenceInDays, isSameDay, startOfDay } from "date-fns";
import { toast } from "sonner";
import { api } from "../api";

interface Exam {
  id: string;
  title: string;
  subject: string;
  date: string;
  type: "quiz" | "exam" | "test" | "assignment";
}

export function Calendar() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    date: format(new Date(), "yyyy-MM-dd"),
    type: "exam" as "quiz" | "exam" | "test" | "assignment",
  });

  useEffect(() => {
    const loadExams = async () => {
      try {
        const data = await api.getExams();
        setExams(data);
        // Check reminders after loading
        data.forEach((exam: Exam) => {
          const examDate = parseISO(exam.date);
          const daysUntil = differenceInDays(examDate, new Date());

          if (daysUntil === 1) {
            const reminderKey = `reminder-${exam.id}`;
            const hasShownReminder = localStorage.getItem(reminderKey);

            if (!hasShownReminder) {
              toast.warning(`Reminder: ${exam.title} is tomorrow!`, {
                description: `Don't forget to study for your ${exam.type} in ${exam.subject}`,
                duration: 10000,
              });
              localStorage.setItem(reminderKey, "true");
            }
          }

          if (daysUntil < 1) {
            localStorage.removeItem(`reminder-${exam.id}`);
          }
        });
      } catch (err) {
        console.error('Failed to load exams:', err);
        toast.error('Failed to load exams');
      }
    };
    loadExams();
  }, []);

  const loadExams = () => {
    // Removed localStorage logic
  };

  const saveExams = (updatedExams: Exam[]) => {
    // Removed localStorage logic
    setExams(updatedExams);
  };

  const checkReminders = () => {
    exams.forEach((exam) => {
      const examDate = parseISO(exam.date);
      const daysUntil = differenceInDays(examDate, new Date());
      
      // Check if exam is tomorrow
      if (daysUntil === 1) {
        const reminderKey = `reminder-${exam.id}`;
        const hasShownReminder = localStorage.getItem(reminderKey);
        
        if (!hasShownReminder) {
          toast.warning(`Reminder: ${exam.title} is tomorrow!`, {
            description: `Don't forget to study for your ${exam.type} in ${exam.subject}`,
            duration: 10000,
          });
          localStorage.setItem(reminderKey, "true");
        }
      }
      
      // Reset reminder if exam date has passed
      if (daysUntil < 1) {
        localStorage.removeItem(`reminder-${exam.id}`);
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.subject || !formData.date) {
      toast.error("Please fill in all fields");
      return;
    }

    if (editingExam) {
      try {
        await api.updateExam(editingExam.id, formData);
        const updatedExams = exams.map((exam) =>
          exam.id === editingExam.id ? { ...exam, ...formData } : exam
        );
        setExams(updatedExams);
        toast.success("Exam updated successfully");
      } catch (err: any) {
        toast.error(err.message || "Failed to update exam");
      }
    } else {
      const newExam = {
        ...formData,
      };
      try {
        const data = await api.createExam(newExam);
        setExams(prev => [...prev, data]);
        toast.success("Exam added to calendar");
      } catch (err: any) {
        toast.error(err.message || "Failed to add exam");
      }
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (exam: Exam) => {
    setEditingExam(exam);
    setFormData({
      title: exam.title,
      subject: exam.subject,
      date: exam.date,
      type: exam.type,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteExam(id);
      const updatedExams = exams.filter((exam) => exam.id !== id);
      setExams(updatedExams);
      localStorage.removeItem(`reminder-${id}`);
      toast.success("Exam removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete exam");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      subject: "",
      date: format(new Date(), "yyyy-MM-dd"),
      type: "exam",
    });
    setEditingExam(null);
  };

  const getDaysUntil = (dateString: string) => {
    const days = differenceInDays(parseISO(dateString), new Date());
    if (days < 0) return "Past";
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return `${days} days`;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "exam":
        return "destructive";
      case "quiz":
        return "default";
      case "test":
        return "secondary";
      case "assignment":
        return "outline";
      default:
        return "default";
    }
  };

  const upcomingExams = exams
    .filter((exam) => parseISO(exam.date) >= new Date())
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

  const examsOnSelectedDate = selectedDate
    ? exams.filter((exam) => isSameDay(parseISO(exam.date), selectedDate))
    : [];

  const examDates = exams.map((exam) => parseISO(exam.date));

  // Get active reminders - exams due today, tomorrow, or within 3 days
  const activeReminders = exams
    .map((exam) => ({
      ...exam,
      daysUntil: differenceInDays(parseISO(exam.date), startOfDay(new Date())),
    }))
    .filter((exam) => exam.daysUntil >= 0 && exam.daysUntil <= 3)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return (
    <div className="p-8">
      {/* Active Reminders Banner */}
      {activeReminders.length > 0 && (
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <Bell className="size-5 text-orange-600" />
          <AlertTitle className="text-orange-900">Active Reminders</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-2">
              {activeReminders.map((exam) => (
                <div key={exam.id} className="flex items-center justify-between p-2 bg-white rounded border border-orange-100">
                  <div>
                    <span className="font-semibold text-gray-900">{exam.title}</span>
                    <span className="text-gray-600"> - {exam.subject}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={exam.daysUntil === 0 ? "destructive" : exam.daysUntil === 1 ? "default" : "secondary"}>
                      {exam.daysUntil === 0 ? "Today!" : exam.daysUntil === 1 ? "Tomorrow" : `${exam.daysUntil} days`}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exam Calendar</h1>
          <p className="text-gray-500 mt-1">Schedule and track your quizzes and exams</p>
        </div>

        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4 mr-2" />
              Add Exam
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingExam ? "Edit Exam" : "Add Exam"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Midterm Exam"
                />
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., Mathematics"
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "quiz" | "exam" | "test" | "assignment") =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="test">Test</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingExam ? "Update" : "Add"} Exam</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <CalendarUI
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              modifiers={{
                exam: examDates,
              }}
              modifiersStyles={{
                exam: {
                  fontWeight: "bold",
                  textDecoration: "underline",
                  color: "#3b82f6",
                },
              }}
            />

            {/* Selected Date Info */}
            {selectedDate && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold text-gray-900 mb-2">
                  {format(selectedDate, "PPPP")}
                </p>
                {examsOnSelectedDate.length > 0 ? (
                  <div className="space-y-2">
                    {examsOnSelectedDate.map((exam) => (
                      <div key={exam.id} className="text-sm">
                        <Badge variant={getTypeColor(exam.type)} className="mr-2">
                          {exam.type}
                        </Badge>
                        <span className="font-medium">{exam.title}</span>
                        <span className="text-gray-500"> - {exam.subject}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No exams scheduled for this date</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Exams */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="size-5 text-orange-500" />
              Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingExams.length === 0 ? (
              <p className="text-gray-500 text-sm">No upcoming exams</p>
            ) : (
              <div className="space-y-3">
                {upcomingExams.map((exam) => (
                  <div key={exam.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{exam.title}</p>
                        <p className="text-sm text-gray-500">{exam.subject}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(exam)}>
                          <Edit className="size-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(exam.id)}>
                          <Trash2 className="size-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant={getTypeColor(exam.type)}>{exam.type}</Badge>
                      <span className="text-xs text-gray-500">
                        {format(parseISO(exam.date), "MMM dd")} • {getDaysUntil(exam.date)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reminder Info */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-blue-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Automatic Reminders</p>
              <p className="text-sm text-gray-500 mt-1">
                You'll receive a reminder notification one day before each exam to help you prepare.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}