"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2, Send, Zap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  id: string;
  ticket_id: string;
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
  email: string | null;
  created_at: string;
  messages: Message[];
}

const statusStyles: Record<string, string> = {
  open: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  in_progress: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  closed: "bg-green-500/15 text-green-400 border-green-500/30",
};

const statusLabels: Record<string, string> = {
  open: "Ouvert",
  in_progress: "En cours",
  closed: "Fermé",
};

function formatTime(dt: string) {
  return new Date(dt).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TicketPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchTicket = useCallback(
    async (storedCode: string, silent = false) => {
      if (!silent) setRefreshing(true);
      try {
        const res = await fetch(`/api/ticket/${id}`, {
          headers: { "x-ticket-code": storedCode },
        });
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem(`glow_ticket_${id}`);
          router.replace("/ticket");
          return;
        }
        if (!res.ok) return;
        const data: Ticket = await res.json();
        setTicket(data);
      } catch {
        // Network error — keep existing state
      } finally {
        if (!silent) setRefreshing(false);
      }
    },
    [id, router]
  );

  useEffect(() => {
    const stored = localStorage.getItem(`glow_ticket_${id}`);
    if (!stored) {
      router.replace("/ticket");
      return;
    }
    let parsed: { code: string };
    try {
      parsed = JSON.parse(stored);
    } catch {
      router.replace("/ticket");
      return;
    }
    setCode(parsed.code);
    setLoading(true);
    fetchTicket(parsed.code).finally(() => setLoading(false));
  }, [id, router, fetchTicket]);

  // Poll every 5 seconds
  useEffect(() => {
    if (!code) return;
    const interval = setInterval(() => fetchTicket(code, true), 5000);
    return () => clearInterval(interval);
  }, [code, fetchTicket]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !code || sending) return;
    setSending(true);
    setError("");

    try {
      const res = await fetch(`/api/ticket/${id}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ticket-code": code,
        },
        body: JSON.stringify({ message: reply.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'envoi");
        return;
      }

      setReply("");
      // Update messages immediately from response
      if (ticket && data.messages) {
        setTicket({ ...ticket, messages: data.messages });
      }
    } catch {
      setError("Erreur réseau, veuillez réessayer.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e as unknown as React.FormEvent);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Ticket introuvable.</p>
          <Button onClick={() => router.replace("/ticket")}>Retour</Button>
        </div>
      </div>
    );
  }

  const isClosed = ticket.status === "closed";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => router.push("/ticket")}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Zap className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">{ticket.subject}</p>
          <p className="text-xs text-muted-foreground truncate">{ticket.email ?? ticket.username}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
              statusStyles[ticket.status] ?? statusStyles.open
            }`}
          >
            {statusLabels[ticket.status] ?? ticket.status}
          </span>
          <button
            onClick={() => code && fetchTicket(code)}
            disabled={refreshing}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Actualiser"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {ticket.messages.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">Aucun message.</p>
        )}
        {ticket.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.is_admin ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${
                msg.is_admin
                  ? "bg-secondary text-foreground rounded-tl-sm"
                  : "bg-primary text-primary-foreground rounded-tr-sm"
              }`}
            >
              <p className={`text-xs font-medium mb-1 ${msg.is_admin ? "text-muted-foreground" : "text-primary-foreground/70"}`}>
                {msg.is_admin ? "Support GlowStudio" : "Vous"}
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

      {/* Reply bar */}
      <footer className="bg-card border-t border-border p-3 sticky bottom-0">
        {isClosed ? (
          <div className="text-center text-sm text-muted-foreground py-2">
            Ce ticket est fermé. Créez un{" "}
            <button
              onClick={() => router.push("/ticket")}
              className="text-primary hover:underline"
            >
              nouveau ticket
            </button>{" "}
            si besoin.
          </div>
        ) : (
          <form onSubmit={sendMessage} className="flex items-end gap-2">
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Répondre... (Entrée pour envoyer, Shift+Entrée pour saut de ligne)"
              className="flex-1 min-h-[44px] max-h-32 resize-none"
              rows={1}
              disabled={sending}
            />
            <Button
              type="submit"
              size="icon"
              disabled={sending || !reply.trim()}
              className="shrink-0 h-11 w-11"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        )}
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
      </footer>
    </div>
  );
}
