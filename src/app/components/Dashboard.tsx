import { useEffect, useState } from "react";
import { Link } from "react-router";
import { BookOpen, Clock, CheckSquare, Calendar, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { format, differenceInDays, parseISO } from "date-fns";
import { api } from "../api";

interface Note {
  id: string;
  title: string;
  subject: string;
  content: string;
  createdAt: string;
}

interface ChecklistItem {
  id: string;
  topic: string;
  completed: boolean;
}

interface Exam {
  id: string;
  title: string;
  date: string;
  type: string;
}

export function Dashboard() {
  const [stats, setStats] = useState({
    totalNotes: 0,
    totalChecklistItems: 0,
    completedItems: 0,
    upcomingExams: 0,
  });
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [notes, checklistItems, exams] = await Promise.all([
          api.getNotes(),
          api.getChecklist(),
          api.getExams()
        ]);

        const today = new Date();
        const upcoming = exams
          .filter((exam: Exam) => new Date(exam.date) >= today)
          .sort((a: Exam, b: Exam) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 3);

        setStats({
          totalNotes: notes.length,
          totalChecklistItems: checklistItems.length,
          completedItems: checklistItems.filter((item: ChecklistItem) => item.completed).length,
          upcomingExams: upcoming.length,
        });

        setUpcomingExams(upcoming);
        setRecentNotes(notes.slice(0, 3));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      }
    };
    loadDashboardData();
  }, []);

  const getDaysUntil = (dateString: string) => {
    const days = differenceInDays(parseISO(dateString), new Date());
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return `${days} days`;
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here's your study overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Notes</CardTitle>
            <BookOpen className="size-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalNotes}</div>
            <Link to="/notes" className="text-xs text-blue-600 hover:underline">
              View all notes →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Checklist Progress</CardTitle>
            <CheckSquare className="size-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.completedItems}/{stats.totalChecklistItems}
            </div>
            <Link to="/checklist" className="text-xs text-blue-600 hover:underline">
              View checklist →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Upcoming Exams</CardTitle>
            <Calendar className="size-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingExams}</div>
            <Link to="/calendar" className="text-xs text-blue-600 hover:underline">
              View calendar →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Focus Time</CardTitle>
            <Clock className="size-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Ready</div>
            <Link to="/timer" className="text-xs text-blue-600 hover:underline">
              Start timer →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Exams */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="size-5 text-orange-500" />
              Upcoming Exams
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingExams.length === 0 ? (
              <p className="text-gray-500 text-sm">No upcoming exams scheduled</p>
            ) : (
              <div className="space-y-3">
                {upcomingExams.map((exam) => (
                  <div key={exam.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{exam.title}</p>
                      <p className="text-sm text-gray-500">{format(parseISO(exam.date), "PPP")}</p>
                    </div>
                    <Badge variant={differenceInDays(parseISO(exam.date), new Date()) <= 1 ? "destructive" : "default"}>
                      {getDaysUntil(exam.date)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="size-5 text-blue-500" />
              Recent Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentNotes.length === 0 ? (
              <p className="text-gray-500 text-sm">No notes created yet</p>
            ) : (
              <div className="space-y-3">
                {recentNotes.map((note) => (
                  <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{note.title}</p>
                        <p className="text-sm text-gray-500 mt-1">{note.subject}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
