"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2, Send, Zap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  id: string;
  sender: string;
  message: string;
  is_admin: boolean;
  created_at: string;
}

interface Ticket {
  id: string;
  username: string;
  subject: string;
  status: string;
  messages: Message[];
}

const statusStyles: Record<string, string> = {
  open: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  in_progress: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  closed: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};
const statusLabels: Record<string, string> = {
  open: "Ouvert", in_progress: "En cours", closed: "Fermé",
};

function formatTime(dt: string) {
  return new Date(dt).toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

const LS_KEY = "glow_tickets";
function saveTicket(id: string, subject: string) {
  try {
    const list: { id: string; subject: string; createdAt: string }[] = JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
    const filtered = list.filter((x) => x.id !== id);
    localStorage.setItem(LS_KEY, JSON.stringify([{ id, subject, createdAt: new Date().toISOString() }, ...filtered].slice(0, 10)));
  } catch {}
}

export default function TicketChatPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchTicket = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await fetch(`/api/ticket/${id}`);
      if (!res.ok) return;
      const data: Ticket = await res.json();
      setTicket(data);
      saveTicket(data.id, data.subject);
    } catch {} finally {
      if (!silent) setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTicket().finally(() => setLoading(false));
  }, [fetchTicket]);

  // Poll every 5s
  useEffect(() => {
    const iv = setInterval(() => fetchTicket(true), 5000);
    return () => clearInterval(iv);
  }, [fetchTicket]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages.length]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/ticket/${id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reply.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur"); return; }
      setReply("");
      if (ticket && data.messages) setTicket({ ...ticket, messages: data.messages });
    } catch { setError("Erreur réseau."); }
    finally { setSending(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (!ticket) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-3">
        <p className="text-muted-foreground">Ticket introuvable.</p>
        <Button onClick={() => router.replace("/ticket")}>Retour</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.push("/ticket")} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Zap className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">{ticket.subject}</p>
          <p className="text-xs text-muted-foreground">{ticket.username}</p>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusStyles[ticket.status] ?? statusStyles.open}`}>
          {statusLabels[ticket.status] ?? ticket.status}
        </span>
        <button onClick={() => fetchTicket()} disabled={refreshing} className="text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-w-2xl w-full mx-auto">
        {ticket.messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.is_admin ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${
              msg.is_admin
                ? "bg-secondary text-foreground rounded-tl-sm"
                : "bg-primary text-primary-foreground rounded-tr-sm"
            }`}>
              <p className={`text-xs font-medium mb-1 ${msg.is_admin ? "text-muted-foreground" : "text-primary-foreground/70"}`}>
                {msg.is_admin ? "Support GlowStudio" : ticket.username}
              </p>
              <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
              <p className={`text-xs mt-1.5 ${msg.is_admin ? "text-muted-foreground" : "text-primary-foreground/60"}`}>
                {formatTime(msg.created_at)}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </main>

      {/* Input */}
      <footer className="bg-card border-t border-border p-3 sticky bottom-0">
        {ticket.status === "closed" ? (
          <p className="text-center text-sm text-muted-foreground py-2">
            Ticket fermé.{" "}
            <button onClick={() => router.push("/ticket")} className="text-primary hover:underline">
              Nouveau ticket
            </button>
          </p>
        ) : (
          <form onSubmit={sendMessage} className="flex items-end gap-2 max-w-2xl mx-auto">
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(e as unknown as React.FormEvent); }}}
              placeholder="Votre message... (Entrée pour envoyer)"
              className="flex-1 min-h-[44px] max-h-32 resize-none"
              rows={1}
              disabled={sending}
            />
            <Button type="submit" size="icon" disabled={sending || !reply.trim()} className="h-11 w-11 shrink-0">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        )}
        {error && <p className="text-sm text-destructive mt-1 text-center">{error}</p>}
      </footer>
    </div>
  );
}
