"use client";
import { useState } from "react";
import { Zap, BookOpen, ExternalLink, MessageSquarePlus, Ticket, ChevronRight, CheckCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const WIKI_LINKS = [
  { title: "Guide de démarrage", description: "Premiers pas sur GlowStudio", href: "#", icon: "🚀" },
  { title: "Règlement général", description: "Règles de la communauté", href: "#", icon: "📋" },
  { title: "FAQ", description: "Questions fréquentes", href: "#", icon: "❓" },
  { title: "Grades & Permissions", description: "Comprendre les rôles", href: "#", icon: "🎖️" },
  { title: "Plugins disponibles", description: "Liste des plugins Build by Bit", href: "#", icon: "🔌" },
  { title: "Mises à jour", description: "Changelog et nouveautés", href: "#", icon: "📣" },
];

type Step = "form" | "success" | "track";

export default function AccueilPage() {
  const [step, setStep] = useState<Step>("form");
  const [createdId, setCreatedId] = useState("");

  // Ticket form
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Track ticket
  const [trackId, setTrackId] = useState("");
  const [ticket, setTicket] = useState<null | {
    id: string; subject: string; status: string; username: string; created_at: string;
    messages: { id: string; sender: string; message: string; is_admin: boolean; created_at: string }[];
  }>(null);
  const [trackError, setTrackError] = useState("");
  const [tracking, setTracking] = useState(false);

  async function submitTicket() {
    if (!name.trim() || !subject.trim() || !message.trim()) return;
    setSubmitting(true);
    setFormError("");
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: name.trim(), subject: subject.trim(), message: message.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setCreatedId(data.id);
      setStep("success");
    } else {
      setFormError(data.error ?? "Erreur lors de la création du ticket");
    }
    setSubmitting(false);
  }

  async function trackTicket() {
    if (!trackId.trim()) return;
    setTracking(true);
    setTrackError("");
    setTicket(null);
    const res = await fetch(`/api/tickets/${trackId.trim()}`);
    if (res.ok) {
      setTicket(await res.json());
    } else {
      setTrackError("Ticket introuvable. Vérifiez l'identifiant.");
    }
    setTracking(false);
  }

  const statusColor: Record<string, string> = {
    open: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    in_progress: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    closed: "bg-green-500/10 text-green-500 border-green-500/20",
  };
  const statusLabel: Record<string, string> = {
    open: "Ouvert",
    in_progress: "En cours",
    closed: "Fermé",
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">GlowStudio</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep("track")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Suivre mon ticket
            </button>
            <a
              href="/login"
              className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors"
            >
              Connexion staff
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-20">

        {/* Hero */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
            <Zap className="w-3.5 h-3.5" />
            Bienvenue sur GlowStudio
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Votre espace client
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Retrouvez toutes les ressources, la documentation et le support en un seul endroit.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button onClick={() => document.getElementById("support")?.scrollIntoView({ behavior: "smooth" })}>
              <MessageSquarePlus className="w-4 h-4 mr-2" />
              Ouvrir un ticket
            </Button>
            <Button variant="outline" onClick={() => document.getElementById("wiki")?.scrollIntoView({ behavior: "smooth" })}>
              <BookOpen className="w-4 h-4 mr-2" />
              Documentation
            </Button>
          </div>
        </section>

        {/* Wiki */}
        <section id="wiki" className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Documentation & Wiki</h2>
              <p className="text-sm text-muted-foreground">Guides et ressources disponibles</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {WIKI_LINKS.map((link) => (
              <a
                key={link.title}
                href={link.href}
                className="group flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-card/80 transition-all"
              >
                <span className="text-2xl">{link.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm text-foreground">{link.title}</p>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{link.description}</p>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Support / Ticket */}
        <section id="support" className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Ticket className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Support client</h2>
              <p className="text-sm text-muted-foreground">Ouvrez un ticket et notre équipe vous répondra</p>
            </div>
          </div>

          <div className="max-w-2xl">
            {/* Tabs */}
            <div className="flex gap-1 border-b border-border mb-6">
              <button
                onClick={() => { setStep("form"); setTicket(null); }}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  step !== "track"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Nouveau ticket
              </button>
              <button
                onClick={() => setStep("track")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  step === "track"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Suivre mon ticket
              </button>
            </div>

            {/* New ticket form */}
            {step === "form" && (
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Votre pseudo</label>
                  <Input
                    placeholder="ex: Notch"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sujet</label>
                  <Input
                    placeholder="ex: Problème d'accès au serveur"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <textarea
                    className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    placeholder="Décrivez votre problème en détail..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
                {formError && <p className="text-sm text-destructive">{formError}</p>}
                <Button
                  className="w-full"
                  onClick={submitTicket}
                  disabled={submitting || !name.trim() || !subject.trim() || !message.trim()}
                >
                  {submitting ? "Envoi..." : "Envoyer le ticket"}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}

            {/* Success */}
            {step === "success" && (
              <div className="bg-card border border-border rounded-xl p-6 space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Ticket créé !</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Notez votre identifiant pour suivre la réponse de notre équipe.
                  </p>
                </div>
                <div className="bg-muted rounded-lg px-4 py-3 font-mono text-sm break-all">
                  {createdId}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setStep("form"); setName(""); setSubject(""); setMessage(""); }}>
                    Nouveau ticket
                  </Button>
                  <Button className="flex-1" onClick={() => { setTrackId(createdId); setStep("track"); }}>
                    Suivre ce ticket
                  </Button>
                </div>
              </div>
            )}

            {/* Track ticket */}
            {step === "track" && (
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Identifiant du ticket</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Collez votre identifiant ici..."
                        value={trackId}
                        onChange={(e) => setTrackId(e.target.value)}
                        className="font-mono text-sm"
                      />
                      <Button onClick={trackTicket} disabled={tracking || !trackId.trim()}>
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {trackError && <p className="text-sm text-destructive">{trackError}</p>}
                </div>

                {ticket && (
                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    {/* Ticket header */}
                    <div className="flex items-start justify-between p-4 border-b border-border">
                      <div>
                        <p className="font-semibold">{ticket.subject}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Par {ticket.username} · {new Date(ticket.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full border ${statusColor[ticket.status] ?? ""}`}>
                        {statusLabel[ticket.status] ?? ticket.status}
                      </span>
                    </div>
                    {/* Messages */}
                    <div className="divide-y divide-border">
                      {ticket.messages.map((msg) => (
                        <div key={msg.id} className={`p-4 ${msg.is_admin ? "bg-primary/5" : ""}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-semibold ${msg.is_admin ? "text-primary" : "text-foreground"}`}>
                              {msg.is_admin ? `⚡ ${msg.sender} (Staff)` : msg.sender}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(msg.created_at).toLocaleString("fr-FR")}
                            </span>
                          </div>
                          <p className="text-sm text-foreground whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      ))}
                    </div>
                    {ticket.status === "closed" && (
                      <div className="p-4 text-center text-sm text-muted-foreground bg-muted/50">
                        Ce ticket est fermé.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-border mt-20 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} GlowStudio · Tous droits réservés
      </footer>
    </div>
  );
}
