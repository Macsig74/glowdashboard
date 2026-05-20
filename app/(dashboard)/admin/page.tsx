"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Shield, UserPlus, Key, Trash2, Check, X,
  Ticket, MessageSquare, Clock, CheckCircle, AlertCircle, Send, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "@/lib/i18n";

const SALONS = [
  { key: "staff", labelKey: "staff" as const },
  { key: "servers", labelKey: "servers" as const },
  { key: "bbb", labelKey: "bbb" as const },
];

interface Member { id: string; username: string; created_at: string }
interface AccessEntry { username: string; salon: string }
interface TicketRow {
  id: string; username: string; subject: string; status: string; created_at: string;
}
interface TicketMessage {
  id: string; sender: string; message: string; is_admin: boolean; created_at: string;
}
interface TicketDetail extends TicketRow { messages: TicketMessage[] }

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open:        { label: "Ouvert",   color: "bg-blue-500/10 text-blue-500 border-blue-500/20",   icon: <AlertCircle className="w-3.5 h-3.5" /> },
  in_progress: { label: "En cours", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: <Clock className="w-3.5 h-3.5" /> },
  closed:      { label: "Fermé",    color: "bg-green-500/10 text-green-500 border-green-500/20",  icon: <CheckCircle className="w-3.5 h-3.5" /> },
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLang();

  type Tab = "members" | "access" | "tickets";
  const [tab, setTab] = useState<Tab>("members");

  // Members
  const [members, setMembers] = useState<Member[]>([]);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // Access
  const [access, setAccess] = useState<AccessEntry[]>([]);
  const [accessError, setAccessError] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);

  // Tickets
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [ticketFilter, setTicketFilter] = useState<"all" | "open" | "in_progress" | "closed">("all");

  useEffect(() => {
    if (status === "authenticated" && !session?.user?.isAdmin) router.push("/");
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.isAdmin) {
      fetchMembers();
      fetchAccess();
      fetchTickets();
    }
  }, [session]);

  async function fetchMembers() {
    const res = await fetch("/api/admin/members");
    if (res.ok) setMembers(await res.json());
  }
  async function fetchAccess() {
    const res = await fetch("/api/admin/access");
    if (res.ok) setAccess(await res.json());
  }
  async function fetchTickets() {
    const res = await fetch("/api/tickets");
    if (res.ok) setTickets(await res.json());
  }
  async function fetchTicketDetail(id: string) {
    const res = await fetch(`/api/tickets/${id}`);
    if (res.ok) setSelectedTicket(await res.json());
  }

  async function createMember() {
    if (!newUsername.trim() || !newPassword.trim()) return;
    setCreating(true); setError("");
    const res = await fetch("/api/admin/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: newUsername.trim(), password: newPassword }),
    });
    if (res.ok) { setNewUsername(""); setNewPassword(""); await fetchMembers(); }
    else { const d = await res.json(); setError(d.error ?? t.adminCreateError); }
    setCreating(false);
  }

  async function deleteMember(id: string) {
    await fetch(`/api/admin/members/${id}`, { method: "DELETE" });
    await fetchMembers(); await fetchAccess();
  }

  function hasAccess(username: string, salon: string) {
    return access.some((a) => a.username === username && a.salon === salon);
  }

  async function toggleAccess(username: string, salon: string) {
    const key = `${username}:${salon}`;
    setToggling(key); setAccessError("");
    const has = hasAccess(username, salon);
    if (has) setAccess((p) => p.filter((a) => !(a.username === username && a.salon === salon)));
    else setAccess((p) => [...p, { username, salon }]);
    const res = await fetch("/api/admin/access", {
      method: has ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, salon }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setAccessError(d.error ?? "Erreur lors de la mise à jour");
      if (has) setAccess((p) => [...p, { username, salon }]);
      else setAccess((p) => p.filter((a) => !(a.username === username && a.salon === salon)));
    }
    setToggling(null);
  }

  async function sendReply() {
    if (!reply.trim() || !selectedTicket) return;
    setSending(true);
    await fetch(`/api/tickets/${selectedTicket.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: reply }),
    });
    setReply("");
    await fetchTicketDetail(selectedTicket.id);
    await fetchTickets();
    setSending(false);
  }

  async function changeStatus(ticketId: string, newStatus: string) {
    await fetch(`/api/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket((t) => t ? { ...t, status: newStatus } : t);
    }
    await fetchTickets();
  }

  if (status === "loading" || !session?.user?.isAdmin) return null;

  const ADMIN_NAMES = ["maxim", "mystic", "dr4"];
  const nonAdminMembers = members.filter((m) => !ADMIN_NAMES.includes(m.username.toLowerCase()));
  const filteredTickets = ticketFilter === "all" ? tickets : tickets.filter((t) => t.status === ticketFilter);
  const openCount = tickets.filter((t) => t.status === "open").length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.adminTitle}</h1>
          <p className="text-sm text-muted-foreground">{t.adminSubtitle}</p>
        </div>
        <a
          href="/accueil"
          target="_blank"
          className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-3 py-1.5 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Page accueil
        </a>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(["members", "access", "tickets"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "tickets" && openCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {openCount > 9 ? "9+" : openCount}
              </span>
            )}
            {{ members: "Membres", access: "Accès salons", tickets: "Tickets" }[t]}
          </button>
        ))}
      </div>

      {/* ── MEMBERS TAB ── */}
      {tab === "members" && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <UserPlus className="w-4 h-4" />{t.adminCreateMember}
            </h2>
            <div className="flex gap-2">
              <Input placeholder={t.username} value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="flex-1" />
              <Input placeholder={t.loginPassword} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="flex-1" />
              <Button onClick={createMember} disabled={creating || !newUsername || !newPassword}>
                <Key className="w-4 h-4 mr-1" />{t.add}
              </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {members.length === 0 && <p className="text-sm text-muted-foreground p-4">{t.adminNoMembers}</p>}
            {members.map((m) => {
              const isAdminUser = ADMIN_NAMES.includes(m.username.toLowerCase());
              return (
                <div key={m.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                      {m.username[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{m.username}</p>
                      {isAdminUser && <span className="text-xs text-primary font-medium">{t.adminBadge}</span>}
                    </div>
                  </div>
                  {!isAdminUser && (
                    <Button variant="ghost" size="sm" onClick={() => deleteMember(m.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ACCESS TAB ── */}
      {tab === "access" && (
        <div className="space-y-3">
          {accessError && <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">{accessError}</p>}
          {nonAdminMembers.length === 0 && <p className="text-sm text-muted-foreground">{t.adminNoNonAdminMembers}</p>}
          {nonAdminMembers.map((m) => (
            <div key={m.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                  {m.username[0]?.toUpperCase()}
                </div>
                <p className="text-sm font-semibold text-foreground">{m.username}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {SALONS.map(({ key, labelKey }) => {
                  const granted = hasAccess(m.username, key);
                  const isToggling = toggling === `${m.username}:${key}`;
                  return (
                    <button
                      key={key}
                      onClick={() => toggleAccess(m.username, key)}
                      disabled={isToggling}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors disabled:opacity-60 ${
                        granted ? "bg-primary/10 border-primary/30 text-primary" : "bg-muted border-border text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {granted ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      {t[labelKey]}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TICKETS TAB ── */}
      {tab === "tickets" && (
        <div className="flex gap-4 h-[calc(100vh-260px)] min-h-[400px]">
          {/* List */}
          <div className="w-72 flex-shrink-0 flex flex-col gap-2">
            {/* Filter */}
            <div className="flex gap-1">
              {(["all", "open", "in_progress", "closed"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setTicketFilter(f)}
                  className={`flex-1 text-xs py-1 rounded-md border transition-colors ${
                    ticketFilter === f ? "bg-primary/10 border-primary/30 text-primary font-medium" : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {{ all: "Tous", open: "Ouverts", in_progress: "En cours", closed: "Fermés" }[f]}
                </button>
              ))}
            </div>
            {/* Tickets */}
            <div className="flex-1 overflow-y-auto space-y-1.5">
              {filteredTickets.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">Aucun ticket</p>
              )}
              {filteredTickets.map((tk) => {
                const meta = STATUS_META[tk.status];
                return (
                  <button
                    key={tk.id}
                    onClick={() => fetchTicketDetail(tk.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedTicket?.id === tk.id ? "border-primary/40 bg-primary/5" : "border-border bg-card hover:border-primary/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-foreground truncate pr-2">{tk.subject}</p>
                      <span className={`flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full border flex-shrink-0 ${meta?.color}`}>
                        {meta?.icon}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{tk.username} · {new Date(tk.created_at).toLocaleDateString("fr-FR")}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail */}
          <div className="flex-1 flex flex-col bg-card border border-border rounded-lg overflow-hidden">
            {!selectedTicket ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <MessageSquare className="w-10 h-10 opacity-30" />
                <p className="text-sm">Sélectionnez un ticket</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-start justify-between p-4 border-b border-border flex-shrink-0">
                  <div>
                    <p className="font-semibold text-foreground">{selectedTicket.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedTicket.username} · {new Date(selectedTicket.created_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(["open", "in_progress", "closed"] as const).map((s) => {
                      const meta = STATUS_META[s];
                      return (
                        <button
                          key={s}
                          onClick={() => changeStatus(selectedTicket.id, s)}
                          className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border transition-colors ${
                            selectedTicket.status === s ? meta.color : "border-border text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {meta.icon}{meta.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {selectedTicket.messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.is_admin ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
                        msg.is_admin
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}>
                        <p className={`text-xs font-semibold mb-1 ${msg.is_admin ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {msg.is_admin ? `⚡ ${msg.sender}` : msg.sender}
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        <p className={`text-[10px] mt-1 ${msg.is_admin ? "text-primary-foreground/50" : "text-muted-foreground"}`}>
                          {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Reply */}
                {selectedTicket.status !== "closed" && (
                  <div className="p-3 border-t border-border flex gap-2 flex-shrink-0">
                    <Input
                      placeholder="Votre réponse..."
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                      className="flex-1"
                    />
                    <Button onClick={sendReply} disabled={sending || !reply.trim()} size="sm">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {selectedTicket.status === "closed" && (
                  <div className="p-3 border-t border-border text-center text-xs text-muted-foreground flex-shrink-0">
                    Ticket fermé · <button className="text-primary hover:underline" onClick={() => changeStatus(selectedTicket.id, "open")}>Rouvrir</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
