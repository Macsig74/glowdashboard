"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2, CheckSquare, Square, X, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLang } from "@/lib/i18n";
import { useSession } from "next-auth/react";

type Priority = "low" | "medium" | "high";

interface TodoItem {
  id: string;
  text: string;
  description?: string;
  priority: Priority;
  due_date?: string;
  assigned_to?: string;
  done: boolean;
}

interface ServerInstance {
  id: string;
  name: string;
  description?: string;
  gs_items: TodoItem[];
  created_at: string;
}

interface User {
  id: string;
  username: string;
}

const priorityColors: Record<Priority, string> = {
  low: "text-blue-400",
  medium: "text-yellow-500",
  high: "text-red-500",
};

const emptyTask = { text: "", description: "", priority: "medium" as Priority, due_date: "", assigned_to: "" };

export default function ServersPage() {
  const { t } = useLang();
  const { data: session } = useSession();
  const isAdmin = session?.user?.isAdmin ?? false;
  const [servers, setServers] = useState<ServerInstance[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [taskDialog, setTaskDialog] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState(emptyTask);

  const fetchServers = () =>
    fetch("/api/servers").then((r) => r.json()).then((d) => setServers(Array.isArray(d) ? d : []));

  useEffect(() => {
    fetchServers();
    fetch("/api/users").then((r) => r.json()).then((d) => setUsers(Array.isArray(d) ? d : []));
  }, []);

  const addServer = async () => {
    if (!newName) return;
    await fetch("/api/servers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, description: newDescription }),
    });
    setAddOpen(false);
    setNewName("");
    setNewDescription("");
    fetchServers();
  };

  const deleteServer = async (id: string) => {
    await fetch(`/api/servers/${id}`, { method: "DELETE" });
    fetchServers();
  };

  const addTask = async (serverId: string) => {
    if (!taskForm.text.trim()) return;
    await fetch(`/api/servers/${serverId}/todos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: taskForm.text,
        description: taskForm.description,
        priority: taskForm.priority,
        due_date: taskForm.due_date,
        assigned_to: taskForm.assigned_to || null,
      }),
    });
    setTaskDialog(null);
    setTaskForm(emptyTask);
    fetchServers();
  };

  const toggleTodo = async (serverId: string, todoId: string, done: boolean) => {
    await fetch(`/api/servers/${serverId}/todos`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ todoId, done }),
    });
    fetchServers();
  };

  const deleteTodo = async (serverId: string, todoId: string) => {
    await fetch(`/api/servers/${serverId}/todos`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ todoId }),
    });
    fetchServers();
  };

  const formatDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString(undefined, { day: "2-digit", month: "short" });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.servers}</h1>
          <p className="text-muted-foreground mt-1">{t.serversSubtitle(servers.length)}</p>
        </div>
        {isAdmin && (
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4" />{t.addServer}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t.addServerTitle}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>{t.name}</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t.namePlaceholder} className="mt-1" />
              </div>
              <div>
                <Label>{t.description}</Label>
                <Textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder={t.descriptionPlaceholder} className="mt-1" />
              </div>
              <Button onClick={addServer} className="w-full">{t.create}</Button>
            </div>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {servers.map((server) => {
          const todos = server.gs_items ?? [];
          const doneCount = todos.filter((td) => td.done).length;
          const total = todos.length;
          const progress = total > 0 ? (doneCount / total) * 100 : 0;

          return (
            <div key={server.id} className="bg-card border border-border rounded-lg p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground text-lg">{server.name}</h3>
                  {server.description && <p className="text-sm text-muted-foreground mt-0.5">{server.description}</p>}
                </div>
                {isAdmin && (
                  <button onClick={() => deleteServer(server.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {total > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{t.todoList}</span>
                    <span>{doneCount}/{total}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-1.5">
                    <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              {todos.length > 0 && (
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
                  {todos.map((todo) => (
                    <div key={todo.id} className={`flex items-start gap-2 p-2 rounded-md border transition-colors ${
                      todo.done ? "bg-muted/30 border-border/50 opacity-60" : "bg-background border-border"
                    }`}>
                      <button
                        onClick={() => toggleTodo(server.id, todo.id, !todo.done)}
                        className="text-muted-foreground hover:text-primary transition-colors shrink-0 mt-0.5"
                      >
                        {todo.done ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Circle className={`w-2 h-2 shrink-0 fill-current ${priorityColors[todo.priority ?? "medium"]}`} />
                          <span className={`text-sm font-medium truncate ${todo.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {todo.text}
                          </span>
                          {todo.assigned_to && (
                            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full shrink-0">
                              {todo.assigned_to}
                            </span>
                          )}
                          {todo.due_date && (
                            <span className="text-xs text-muted-foreground shrink-0">{formatDate(todo.due_date)}</span>
                          )}
                        </div>
                        {todo.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{todo.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteTodo(server.id, todo.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors shrink-0 mt-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <Dialog
                open={taskDialog === server.id}
                onOpenChange={(o) => { setTaskDialog(o ? server.id : null); if (!o) setTaskForm(emptyTask); }}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <Plus className="w-3.5 h-3.5" />{t.addTask}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{t.addTask} — {server.name}</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div>
                      <Label>{t.taskTitle}</Label>
                      <Input
                        value={taskForm.text}
                        onChange={(e) => setTaskForm((f) => ({ ...f, text: e.target.value }))}
                        placeholder={t.taskTitlePlaceholder}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>{t.description}</Label>
                      <Textarea
                        value={taskForm.description}
                        onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder={t.taskDescPlaceholder}
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>{t.priority}</Label>
                        <Select value={taskForm.priority} onValueChange={(v) => setTaskForm((f) => ({ ...f, priority: v as Priority }))}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">
                              <span className="flex items-center gap-2"><Circle className="w-2 h-2 fill-blue-400 text-blue-400" />{t.low}</span>
                            </SelectItem>
                            <SelectItem value="medium">
                              <span className="flex items-center gap-2"><Circle className="w-2 h-2 fill-yellow-500 text-yellow-500" />{t.medium}</span>
                            </SelectItem>
                            <SelectItem value="high">
                              <span className="flex items-center gap-2"><Circle className="w-2 h-2 fill-red-500 text-red-500" />{t.high}</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>{t.dueDate}</Label>
                        <Input
                          type="date"
                          value={taskForm.due_date}
                          onChange={(e) => setTaskForm((f) => ({ ...f, due_date: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>{t.assignTo}</Label>
                      <Select
                        value={taskForm.assigned_to || "__none__"}
                        onValueChange={(v) => setTaskForm((f) => ({ ...f, assigned_to: v === "__none__" ? "" : v }))}
                      >
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">{t.unassigned}</SelectItem>
                          {users.map((u) => (
                            <SelectItem key={u.id} value={u.username}>{u.username}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={() => addTask(server.id)} className="w-full">{t.add}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          );
        })}

        {servers.length === 0 && (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            {t.noServers}
          </div>
        )}
      </div>
    </div>
  );
}
