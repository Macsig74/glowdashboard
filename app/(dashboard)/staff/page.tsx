"use client";
import { useEffect, useState } from "react";
import { Plus, ThumbsUp, ThumbsDown, TrendingUp, TrendingDown, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "next-auth/react";

interface Note {
  _id: string;
  content: string;
  type: "good" | "bad";
  weight: 1 | 2 | 3;
  createdAt: string;
  createdBy: string;
}

interface StaffMember {
  _id: string;
  username: string;
  role: string;
  score: number;
  notes: Note[];
  rankHistory: { action: string; role: string; date: string }[];
  createdAt: string;
}

const ROLES = ["Helper", "Modérateur", "Modérateur+", "Responsable", "Admin", "Co-Owner", "Owner"];

export default function StaffPage() {
  const { data: session } = useSession();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState<string | null>(null);
  const [rankOpen, setRankOpen] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);

  const [newUsername, setNewUsername] = useState("");
  const [newRole, setNewRole] = useState("Helper");
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState<"good" | "bad">("good");
  const [noteWeight, setNoteWeight] = useState<"1" | "2" | "3">("1");
  const [rankAction, setRankAction] = useState<"rankup" | "derank">("rankup");
  const [newRankRole, setNewRankRole] = useState("");

  const fetchStaff = () =>
    fetch("/api/staff")
      .then((r) => r.json())
      .then(setStaff);

  useEffect(() => {
    fetchStaff();
  }, []);

  const addStaff = async () => {
    if (!newUsername || !newRole) return;
    await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: newUsername, role: newRole }),
    });
    setAddOpen(false);
    setNewUsername("");
    fetchStaff();
  };

  const deleteStaff = async (id: string) => {
    await fetch(`/api/staff/${id}`, { method: "DELETE" });
    fetchStaff();
  };

  const addNote = async (memberId: string) => {
    if (!noteContent) return;
    await fetch(`/api/staff/${memberId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: noteContent,
        type: noteType,
        weight: parseInt(noteWeight),
        createdBy: session?.user?.name || "Admin",
      }),
    });
    setNoteOpen(null);
    setNoteContent("");
    setNoteType("good");
    setNoteWeight("1");
    fetchStaff();
  };

  const doRank = async (member: StaffMember) => {
    const targetRole = newRankRole || member.role;
    await fetch(`/api/staff/${member._id}/rank`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: rankAction, newRole: targetRole }),
    });
    setRankOpen(null);
    setNewRankRole("");
    fetchStaff();
  };

  const deleteNote = async (memberId: string, noteId: string) => {
    await fetch(`/api/staff/${memberId}/notes`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId }),
    });
    fetchStaff();
  };

  const getScoreColor = (score: number) => {
    if (score >= 10) return "text-green-500";
    if (score >= 5) return "text-yellow-500";
    if (score >= 0) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff</h1>
          <p className="text-muted-foreground mt-1">{staff.length} membre(s)</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4" />
              Ajouter un staff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un membre du staff</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Pseudo</Label>
                <Input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Pseudo Minecraft"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Rôle</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addStaff} className="w-full">Ajouter</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {staff.map((member) => (
          <div key={member._id} className="bg-card border border-border rounded-lg p-5 shadow-sm flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-foreground text-lg">{member.username}</div>
                <Badge variant="secondary" className="mt-1 text-xs">{member.role}</Badge>
              </div>
              <div className={`flex items-center gap-1 font-bold text-xl ${getScoreColor(member.score)}`}>
                <Star className="w-4 h-4" />
                {member.score}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Dialog
                open={noteOpen === member._id}
                onOpenChange={(o) => setNoteOpen(o ? member._id : null)}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">Ajouter une note</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Note pour {member.username}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div>
                      <Label>Contenu</Label>
                      <Textarea
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Contenu de la note..."
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setNoteType("good")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md border text-sm font-medium transition-colors ${
                          noteType === "good"
                            ? "bg-green-100 border-green-400 text-green-700 dark:bg-green-900/30 dark:border-green-600 dark:text-green-400"
                            : "border-border text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        Bien
                      </button>
                      <button
                        onClick={() => setNoteType("bad")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md border text-sm font-medium transition-colors ${
                          noteType === "bad"
                            ? "bg-red-100 border-red-400 text-red-700 dark:bg-red-900/30 dark:border-red-600 dark:text-red-400"
                            : "border-border text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        <ThumbsDown className="w-4 h-4" />
                        Pas bien
                      </button>
                    </div>
                    <div>
                      <Label>Poids (impact sur le score)</Label>
                      <div className="flex gap-2 mt-1">
                        {(["1", "2", "3"] as const).map((w) => (
                          <button
                            key={w}
                            onClick={() => setNoteWeight(w)}
                            className={`flex-1 py-2 rounded-md border text-sm font-semibold transition-colors ${
                              noteWeight === w
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border text-muted-foreground hover:bg-accent"
                            }`}
                          >
                            {w}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Button onClick={() => addNote(member._id)} className="w-full">
                      Enregistrer la note
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog
                open={rankOpen === member._id}
                onOpenChange={(o) => {
                  setRankOpen(o ? member._id : null);
                  setSelectedMember(o ? member : null);
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">Rang</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Changer le rang de {member.username}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div className="flex gap-3">
                      <button
                        onClick={() => setRankAction("rankup")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md border text-sm font-medium transition-colors ${
                          rankAction === "rankup"
                            ? "bg-green-100 border-green-400 text-green-700"
                            : "border-border text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        <TrendingUp className="w-4 h-4" />
                        Rankup
                      </button>
                      <button
                        onClick={() => setRankAction("derank")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md border text-sm font-medium transition-colors ${
                          rankAction === "derank"
                            ? "bg-red-100 border-red-400 text-red-700"
                            : "border-border text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        <TrendingDown className="w-4 h-4" />
                        Derank
                      </button>
                    </div>
                    <div>
                      <Label>Nouveau rôle</Label>
                      <Select value={newRankRole || member.role} onValueChange={setNewRankRole}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={() => selectedMember && doRank(selectedMember)} className="w-full">
                      Confirmer
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
                onClick={() => deleteStaff(member._id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {member.notes.length > 0 && (
              <div className="space-y-2 mt-1">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Notes ({member.notes.length})
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {member.notes.map((note) => (
                    <div
                      key={note._id}
                      className={`flex items-start gap-2 p-2 rounded text-xs ${
                        note.type === "good"
                          ? "bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800"
                          : "bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800"
                      }`}
                    >
                      {note.type === "good" ? (
                        <ThumbsUp className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                      ) : (
                        <ThumbsDown className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />
                      )}
                      <span className="flex-1 text-foreground">{note.content}</span>
                      <span className="text-muted-foreground shrink-0">x{note.weight}</span>
                      <button
                        onClick={() => deleteNote(member._id, note._id)}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {staff.length === 0 && (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            Aucun membre du staff. Ajoutez-en un !
          </div>
        )}
      </div>
    </div>
  );
}
