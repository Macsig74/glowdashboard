"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap, ArrowRight, Loader2, MessageSquare, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SavedTicket { id: string; subject: string; createdAt: string; }

const LS_KEY = "glow_tickets";

function getSaved(): SavedTicket[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); } catch { return []; }
}
function saveTicket(t: SavedTicket) {
  const list = getSaved().filter((x) => x.id !== t.id);
  localStorage.setItem(LS_KEY, JSON.stringify([t, ...list].slice(0, 10)));
}

export default function NewTicketPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<SavedTicket[]>([]);

  useEffect(() => { setSaved(getSaved()); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), subject: subject.trim(), message: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur"); return; }
      saveTicket({ id: data.id, subject: subject.trim(), createdAt: new Date().toISOString() });
      router.push(`/ticket/${data.id}`);
    } catch { setError("Erreur réseau."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <Zap className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">GlowStudio</h1>
          <p className="text-muted-foreground text-sm mt-1">Support</p>
        </div>

        {/* New ticket form */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground mb-4">Créer un ticket</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">Votre pseudo</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="DragonSlayer74" className="mt-1" required />
            </div>
            <div>
              <Label htmlFor="subject">Sujet</Label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)}
                placeholder="Décrivez votre problème en quelques mots..." className="mt-1" required />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)}
                placeholder="Donnez le maximum de détails..." className="mt-1" rows={4} required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Envoi...</> : <>Envoyer <ArrowRight className="w-4 h-4 ml-2" /></>}
            </Button>
          </form>
        </div>

        {/* Recent tickets from localStorage */}
        {saved.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Mes tickets récents</p>
            <div className="space-y-2">
              {saved.map((t) => (
                <button key={t.id} onClick={() => router.push(`/ticket/${t.id}`)}
                  className="w-full flex items-center justify-between gap-2 p-2 rounded-md hover:bg-accent transition-colors text-left group">
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground truncate">{t.subject}</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
