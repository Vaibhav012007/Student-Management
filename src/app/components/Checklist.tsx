import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Progress } from "./ui/progress";
import { toast } from "sonner";
import { api } from "../api";

interface ChecklistItem {
  id: string;
  topic: string;
  completed: boolean;
  createdAt: string;
}

export function Checklist() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newTopic, setNewTopic] = useState("");

  useEffect(() => {
    const loadItems = async () => {
      try {
        const data = await api.getChecklist();
        setItems(data);
      } catch (err) {
        console.error('Failed to load checklist:', err);
        toast.error('Failed to load checklist');
      }
    };
    loadItems();
  }, []);

  const loadItems = () => {
    // Removed localStorage logic
  };

  const saveItems = (updatedItems: ChecklistItem[]) => {
    // Removed localStorage logic
    setItems(updatedItems);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTopic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    const newItem = {
      topic: newTopic,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    try {
      const data = await api.createChecklistItem(newItem);
      setItems(prev => [...prev, data]);
      setNewTopic("");
      toast.success("Topic added to checklist");
    } catch (err: any) {
      toast.error(err.message || "Failed to add topic");
    }
  };

  const handleToggle = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const updatedItem = { topic: item.topic, completed: !item.completed };

    try {
      await api.updateChecklistItem(id, updatedItem);
      const updatedItems = items.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      );
      setItems(updatedItems);
    } catch (err: any) {
      toast.error(err.message || "Failed to update item");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteChecklistItem(id);
      const updatedItems = items.filter((item) => item.id !== id);
      setItems(updatedItems);
      toast.success("Topic removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete item");
    }
  };

  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Study Checklist</h1>
        <p className="text-gray-500 mt-1">Track your progress and tick off completed topics</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Progress Card */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Completed</span>
                <span className="font-semibold">
                  {completedCount} / {totalCount}
                </span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              <p className="text-xs text-gray-500 text-center mt-2">
                {progressPercentage.toFixed(0)}% complete
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Add New Topic */}
        <Card>
          <CardHeader>
            <CardTitle>Add New Topic</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="flex gap-2">
              <Input
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="Enter topic to study..."
                className="flex-1"
              />
              <Button type="submit">
                <Plus className="size-4 mr-2" />
                Add
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Checklist Items */}
        <Card>
          <CardHeader>
            <CardTitle>Topics</CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No topics yet. Add your first study topic above!
              </p>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-4 rounded-lg border ${
                      item.completed ? "bg-gray-50 border-gray-200" : "bg-white border-gray-200"
                    }`}
                  >
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => handleToggle(item.id)}
                      id={`item-${item.id}`}
                    />
                    <label
                      htmlFor={`item-${item.id}`}
                      className={`flex-1 cursor-pointer ${
                        item.completed ? "line-through text-gray-400" : "text-gray-900"
                      }`}
                    >
                      {item.topic}
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="size-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Motivational Message */}
        {completedCount > 0 && completedCount === totalCount && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6 text-center">
              <p className="text-lg font-semibold text-green-800">
                🎉 Congratulations! You've completed all topics!
              </p>
              <p className="text-sm text-green-600 mt-1">
                Great job on staying organized and focused!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
