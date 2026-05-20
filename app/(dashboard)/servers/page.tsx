"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2, CheckSquare, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLang } from "@/lib/i18n";

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

interface ServerInstance {
  id: string;
  name: string;
  description?: string;
  gs_items: TodoItem[];
  created_at: string;
}

export default function ServersPage() {
  const { t } = useLang();
  const [servers, setServers] = useState<ServerInstance[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTodo, setNewTodo] = useState<{ [key: string]: string }>({});

  const fetchServers = () =>
    fetch("/api/servers").then((r) => r.json()).then(setServers);

  useEffect(() => { fetchServers(); }, []);

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

  const addTodo = async (serverId: string) => {
    const text = newTodo[serverId];
    if (!text?.trim()) return;
    await fetch(`/api/servers/${serverId}/todos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    setNewTodo((prev) => ({ ...prev, [serverId]: "" }));
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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.servers}</h1>
          <p className="text-muted-foreground mt-1">{t.serversSubtitle(servers.length)}</p>
        </div>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {servers.map((server) => {
          const todos = server.gs_items ?? [];
          const doneCount = todos.filter((todo) => todo.done).length;
          const total = todos.length;
          const progress = total > 0 ? (doneCount / total) * 100 : 0;

          return (
            <div key={server.id} className="bg-card border border-border rounded-lg p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground text-lg">{server.name}</h3>
                  {server.description && <p className="text-sm text-muted-foreground mt-0.5">{server.description}</p>}
                </div>
                <button onClick={() => deleteServer(server.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
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

              <div className="space-y-1.5">
                {todos.map((todo) => (
                  <div key={todo.id} className="flex items-center gap-2 group">
                    <button onClick={() => toggleTodo(server.id, todo.id, !todo.done)} className="text-muted-foreground hover:text-primary transition-colors shrink-0">
                      {todo.done ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                    </button>
                    <span className={`flex-1 text-sm ${todo.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {todo.text}
                    </span>
                    <button onClick={() => deleteTodo(server.id, todo.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newTodo[server.id] || ""}
                  onChange={(e) => setNewTodo((prev) => ({ ...prev, [server.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addTodo(server.id)}
                  placeholder={t.newTask}
                  className="text-sm h-9"
                />
                <Button size="sm" onClick={() => addTodo(server.id)}><Plus className="w-4 h-4" /></Button>
              </div>
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
