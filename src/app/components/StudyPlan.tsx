import { useState, useEffect } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { api } from "../api";

interface StudyItem {
  id: string;
  topic: string;
  subject: string;
  priority: number;
  estimatedHours: number;
  order: number;
}

export function StudyPlan() {
  const [items, setItems] = useState<StudyItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    topic: "",
    subject: "",
    priority: 5,
    estimatedHours: 1,
  });

  useEffect(() => {
    const loadItems = async () => {
      try {
        const data = await api.getStudyPlan();
        setItems(data);
      } catch (err) {
        console.error('Failed to load study plan:', err);
        toast.error('Failed to load study plan');
      }
    };
    loadItems();
  }, []);

  const loadItems = () => {
    // Removed localStorage logic
  };

  const saveItems = (updatedItems: StudyItem[]) => {
    // Removed localStorage logic
    setItems(updatedItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.topic || !formData.subject) {
      toast.error("Please fill in all fields");
      return;
    }

    if (formData.priority < 1 || formData.priority > 10) {
      toast.error("Priority must be between 1 and 10");
      return;
    }

    const newItem = {
      ...formData,
      order: items.length,
    };

    try {
      const data = await api.createStudyPlanItem(newItem);
      const updatedItems = [...items, data];
      setItems(sortByPriority(updatedItems));
      toast.success("Study topic added");
      setIsDialogOpen(false);
      setFormData({ topic: "", subject: "", priority: 5, estimatedHours: 1 });
    } catch (err: any) {
      toast.error(err.message || "Failed to add topic");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteStudyPlanItem(id);
      const updatedItems = items.filter((item) => item.id !== id);
      setItems(updatedItems);
      toast.success("Topic removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete topic");
    }
  };

  const sortByPriority = (itemsToSort: StudyItem[]) => {
    return [...itemsToSort].sort((a, b) => b.priority - a.priority);
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return "bg-red-500";
    if (priority >= 5) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPriorityLabel = (priority: number) => {
    if (priority >= 8) return "High Priority";
    if (priority >= 5) return "Medium Priority";
    return "Low Priority";
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Study Plan</h1>
          <p className="text-gray-500 mt-1">Prioritize what to study and when (1-10 scale)</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4 mr-2" />
              Add Topic
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Study Topic</DialogTitle>
              <DialogDescription>Add a new study topic to your plan.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  placeholder="e.g., Calculus Chapter 5"
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
                <Label htmlFor="priority">Priority (1-10)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="priority"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 5 })}
                    className="w-24"
                  />
                  <div className="flex-1">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Low</span>
                      <span>Medium</span>
                      <span>High</span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="hours">Estimated Hours</Label>
                <Input
                  id="hours"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={formData.estimatedHours}
                  onChange={(e) =>
                    setFormData({ ...formData, estimatedHours: parseFloat(e.target.value) })
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Topic</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No study topics yet. Start planning your study schedule!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <GripVertical className="size-5 text-gray-400" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{item.topic}</h3>
                        <p className="text-sm text-gray-500 mt-1">{item.subject}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div className={`size-3 rounded-full ${getPriorityColor(item.priority)}`} />
                          <span className="text-sm font-medium text-gray-700">
                            Priority: {item.priority}/10
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {getPriorityLabel(item.priority)}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {item.estimatedHours}h
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="size-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}