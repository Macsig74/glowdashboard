"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, Send, RefreshCw, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLang } from "@/lib/i18n";

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
  email: string | null;
  subject: string;
  status: string;
  created_at: string;
}

interface TicketDetail extends Ticket {
  messages: Message[];
}

const statusStyles: Record<string, string> = {
  open: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
  in_progress: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  closed: "bg-green-500/15 text-green-400 border border-green-500/30",
};

function formatTime(dt: string) {
  return new Date(dt).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function TicketsPage() {
  const { t } = useLang();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<TicketDetail | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/tickets");
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch {
      setTickets([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const selectTicket = useCallback(async (ticket: Ticket) => {
    setLoadingDetail(true);
    setError("");
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`);
      const data = await res.json();
      if (res.ok) {
        setSelected(data);
      }
    } catch {
      // keep previous
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const refreshSelected = useCallback(async () => {
    if (!selected) return;
    try {
      const res = await fetch(`/api/tickets/${selected.id}`);
      const data = await res.json();
      if (res.ok) setSelected(data);
    } catch {
      // silent
    }
  }, [selected]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.messages]);

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !reply.trim() || sending) return;
    setSending(true);
    setError("");

    try {
      const res = await fetch(`/api/tickets/${selected.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reply.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'envoi");
        return;
      }

      setReply("");
      await refreshSelected();
      await fetchTickets();
    } catch {
      setError("Erreur réseau");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendReply(e as unknown as React.FormEvent);
    }
  };

  const changeStatus = async (status: string) => {
    if (!selected) return;
    const res = await fetch(`/api/tickets/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setSelected({ ...selected, status });
      setTickets((prev) => prev.map((tk) => tk.id === selected.id ? { ...tk, status } : tk));
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.tickets}</h1>
          <p className="text-muted-foreground mt-1">{t.ticketsSubtitle(tickets.length)}</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchTickets}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left panel — ticket list */}
        <div className="w-80 shrink-0 flex flex-col bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-foreground">Tous les tickets</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingList ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-sm gap-2">
                <Inbox className="w-8 h-8 opacity-40" />
                {t.noTickets}
              </div>
            ) : (
              tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => selectTicket(ticket)}
                  className={`w-full text-left px-4 py-3 border-b border-border/50 transition-colors hover:bg-secondary/40 ${
                    selected?.id === ticket.id ? "bg-secondary/60" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-foreground truncate flex-1">{ticket.subject}</p>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full shrink-0 ${statusStyles[ticket.status] ?? statusStyles.open}`}>
                      {ticket.status === "open"
                        ? t.ticketOpen
                        : ticket.status === "in_progress"
                        ? t.ticketInProgress
                        : t.ticketClosed}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{ticket.email ?? ticket.username}</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">{formatDate(ticket.created_at)}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right panel — chat */}
        <div className="flex-1 flex flex-col bg-card border border-border rounded-lg overflow-hidden min-w-0">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <Inbox className="w-12 h-12 opacity-20" />
              <p className="text-sm">Sélectionnez un ticket pour afficher la conversation.</p>
            </div>
          ) : loadingDetail ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="px-5 py-3 border-b border-border flex items-center justify-between gap-3 shrink-0">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground truncate">{selected.subject}</p>
                  <p className="text-xs text-muted-foreground truncate">{selected.email ?? selected.username}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Select value={selected.status} onValueChange={changeStatus}>
                    <SelectTrigger className="h-8 w-36 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">{t.ticketOpen}</SelectItem>
                      <SelectItem value="in_progress">{t.ticketInProgress}</SelectItem>
                      <SelectItem value="closed">{t.ticketClosed}</SelectItem>
                    </SelectContent>
                  </Select>
                  <button
                    onClick={refreshSelected}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {selected.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.is_admin ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                        msg.is_admin
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-secondary text-foreground rounded-tl-sm"
                      }`}
                    >
                      <p className={`text-xs font-medium mb-1 ${msg.is_admin ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {msg.sender}
                      </p>
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      <p className={`text-xs mt-1.5 ${msg.is_admin ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Reply bar */}
              <div className="border-t border-border p-3 shrink-0">
                <form onSubmit={sendReply} className="flex items-end gap-2">
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`${t.ticketReply} (Entrée pour envoyer)`}
                    className="flex-1 min-h-[44px] max-h-32 resize-none"
                    rows={1}
                    disabled={sending || selected.status === "closed"}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={sending || !reply.trim() || selected.status === "closed"}
                    className="shrink-0 h-11 w-11"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
                {selected.status === "closed" && (
                  <p className="text-xs text-muted-foreground mt-1 text-center">Ce ticket est fermé.</p>
                )}
                {error && <p className="text-sm text-destructive mt-1">{error}</p>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
