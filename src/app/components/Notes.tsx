import { useState, useEffect } from "react";
import { Plus, Search, Trash2, Edit, FileText, Upload, Eye, Download } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { toast } from "sonner";
import { api } from "../api";

interface Note {
  id: string;
  title: string;
  subject: string;
  content: string;
  createdAt: string;
  type: "text" | "pdf";
  pdfData?: string;
  pdfName?: string;
}

export function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    content: "",
    type: "text" as "text" | "pdf",
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const data = await api.getNotes();
        setNotes(data);
      } catch (err) {
        console.error('Failed to load notes:', err);
        toast.error('Failed to load notes');
      }
    };
    loadNotes();
  }, []);

  const loadNotes = () => {
    // Removed localStorage logic
  };

  const saveNotes = (updatedNotes: Note[]) => {
    // Removed localStorage logic
    setNotes(updatedNotes);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Please upload a PDF file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error("File size must be less than 10MB");
        return;
      }
      setPdfFile(file);
      setFormData({ ...formData, type: "pdf" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.subject) {
      toast.error("Please fill in title and subject");
      return;
    }

    if (formData.type === "text" && !formData.content) {
      toast.error("Please add content to your note");
      return;
    }

    if (formData.type === "pdf" && !pdfFile && !editingNote) {
      toast.error("Please upload a PDF file");
      return;
    }

    if (editingNote) {
      try {
        await api.updateNote(editingNote.id, {
          title: formData.title,
          subject: formData.subject,
          content: formData.content
        });
        const updatedNotes = notes.map((note) =>
          note.id === editingNote.id
            ? { ...note, title: formData.title, subject: formData.subject, content: formData.content }
            : note
        );
        setNotes(updatedNotes);
        toast.success("Note updated successfully");
      } catch (err: any) {
        toast.error(err.message || "Failed to update note");
      }
    } else {
      let pdfData = "";
      let pdfName = "";

      if (formData.type === "pdf" && pdfFile) {
        const reader = new FileReader();
        pdfData = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(pdfFile);
        });
        pdfName = pdfFile.name;
      }

      const newNote = {
        title: formData.title,
        subject: formData.subject,
        content: formData.content,
        type: formData.type,
        pdfData: pdfData || undefined,
        pdfName: pdfName || undefined,
        createdAt: new Date().toISOString(),
      };

      try {
        const data = await api.createNote(newNote);
        setNotes(prev => [data, ...prev]);
        toast.success("Note created successfully");
      } catch (err: any) {
        toast.error(err.message || "Failed to create note");
      }
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      subject: note.subject,
      content: note.content,
      type: note.type,
    });
    setIsDialogOpen(true);
  };

  const handleView = (note: Note) => {
    setViewingNote(note);
    setIsViewDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteNote(id);
      const updatedNotes = notes.filter((note) => note.id !== id);
      setNotes(updatedNotes);
      toast.success("Note deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete note");
    }
  };

  const resetForm = () => {
    setFormData({ title: "", subject: "", content: "", type: "text" });
    setEditingNote(null);
    setPdfFile(null);
  };

  const filteredNotes = notes.filter(
    (note) =>
      (selectedSubject === "all" || note.subject === selectedSubject) &&
      (note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const subjects = Array.from(new Set(notes.map((note) => note.subject))).sort();

  const openPdf = (pdfData: string, pdfName: string) => {
    const link = document.createElement("a");
    link.href = pdfData;
    link.download = pdfName;
    link.target = "_blank";
    link.click();
  };

  const downloadPdf = (pdfData: string, pdfName: string) => {
    const link = document.createElement("a");
    link.href = pdfData;
    link.download = pdfName;
    link.click();
    toast.success("PDF downloaded");
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notes</h1>
          <p className="text-gray-500 mt-1">Organize and manage your study notes</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4 mr-2" />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingNote ? "Edit Note" : "Create New Note"}</DialogTitle>
              <DialogDescription>
                {editingNote ? "Update your note details" : "Add a new text note or upload a PDF"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Note title"
                />
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., Mathematics, Physics, History"
                />
              </div>
              
              {!editingNote && (
                <div>
                  <Label>Note Type</Label>
                  <Tabs value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as "text" | "pdf" })}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="text">Text Note</TabsTrigger>
                      <TabsTrigger value="pdf">PDF Upload</TabsTrigger>
                    </TabsList>
                    <TabsContent value="text" className="mt-4">
                      <div>
                        <Label htmlFor="content">Content</Label>
                        <Textarea
                          id="content"
                          value={formData.content}
                          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                          placeholder="Write your notes here..."
                          rows={10}
                        />
                      </div>
                    </TabsContent>
                    <TabsContent value="pdf" className="mt-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <Upload className="size-12 text-gray-400 mx-auto mb-4" />
                        <Label htmlFor="pdf-upload" className="cursor-pointer">
                          <span className="text-blue-600 hover:text-blue-700">
                            Click to upload
                          </span>
                          <span className="text-gray-500"> or drag and drop</span>
                          <Input
                            id="pdf-upload"
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </Label>
                        <p className="text-sm text-gray-500 mt-2">PDF (max 10MB)</p>
                        {pdfFile && (
                          <p className="text-sm text-green-600 mt-3 font-medium">
                            Selected: {pdfFile.name}
                          </p>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {editingNote && editingNote.type === "text" && (
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Write your notes here..."
                    rows={10}
                  />
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingNote ? "Update" : "Create"} Note
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Subject Filter Tabs */}
      {subjects.length > 0 && (
        <div className="mb-6">
          <Tabs value={selectedSubject} onValueChange={setSelectedSubject}>
            <TabsList>
              <TabsTrigger value="all">All Subjects ({notes.length})</TabsTrigger>
              {subjects.map((subject) => (
                <TabsTrigger key={subject} value={subject}>
                  {subject} ({notes.filter(n => n.subject === subject).length})
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {searchQuery ? "No notes found" : "No notes yet. Create your first note!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <Card key={note.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {note.type === "pdf" && <FileText className="size-4 text-red-500" />}
                      <CardTitle className="text-lg">{note.title}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="mt-2">
                      {note.subject}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(note)}
                      title="View note"
                    >
                      <Eye className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(note)}
                      title="Edit note"
                    >
                      <Edit className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(note.id)}
                      title="Delete note"
                    >
                      <Trash2 className="size-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {note.type === "pdf" ? (
                  <div>
                    <p className="text-sm text-gray-600 mb-3 truncate">{note.pdfName}</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPdf(note.pdfData!, note.pdfName!)}
                        className="flex-1"
                      >
                        <FileText className="size-4 mr-2" />
                        Open
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadPdf(note.pdfData!, note.pdfName!)}
                        className="flex-1"
                      >
                        <Download className="size-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 line-clamp-4">{note.content}</p>
                )}
                <p className="text-xs text-gray-400 mt-3">
                  {new Date(note.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Note Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewingNote?.type === "pdf" && <FileText className="size-5 text-red-500" />}
              {viewingNote?.title}
            </DialogTitle>
            <DialogDescription>
              Subject: {viewingNote?.subject} • Created: {viewingNote && new Date(viewingNote.createdAt).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          
          {viewingNote && (
            <div className="mt-4">
              {viewingNote.type === "pdf" ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">PDF File: {viewingNote.pdfName}</p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => openPdf(viewingNote.pdfData!, viewingNote.pdfName!)}
                        className="flex-1"
                      >
                        <FileText className="size-4 mr-2" />
                        Open in New Tab
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => downloadPdf(viewingNote.pdfData!, viewingNote.pdfName!)}
                        className="flex-1"
                      >
                        <Download className="size-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <div className="border rounded-lg overflow-hidden" style={{ height: '500px' }}>
                    <iframe
                      src={viewingNote.pdfData}
                      className="w-full h-full"
                      title={viewingNote.pdfName}
                    />
                  </div>
                </div>
              ) : (
                <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                  <div className="whitespace-pre-wrap text-sm text-gray-700">
                    {viewingNote.content}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false);
              if (viewingNote) handleEdit(viewingNote);
            }}>
              <Edit className="size-4 mr-2" />
              Edit Note
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}