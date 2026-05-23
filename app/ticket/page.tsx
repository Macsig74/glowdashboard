"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Zap, Loader2, ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Step = "form" | "code";

export default function NewTicketPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [code, setCode] = useState("");
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const codeRef = useRef<HTMLInputElement>(null);

  // Check if we have an existing session from URL param
  useEffect(() => {
    const id = searchParams.get("id");
    if (!id) return;
    const stored = localStorage.getItem(`glow_ticket_${id}`);
    if (stored) {
      router.replace(`/ticket/${id}`);
    } else {
      setTicketId(id);
      setStep("code");
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (step === "code") {
      setTimeout(() => codeRef.current?.focus(), 100);
    }
  }, [step]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), subject: subject.trim(), message: message.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue");
        return;
      }

      setTicketId(data.id);
      setStep("code");
    } catch {
      setError("Erreur réseau, veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId || code.length !== 6) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/ticket/${ticketId}`, {
        headers: { "x-ticket-code": code },
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Code invalide");
        return;
      }

      localStorage.setItem(`glow_ticket_${ticketId}`, JSON.stringify({ code }));
      router.push(`/ticket/${ticketId}`);
    } catch {
      setError("Erreur réseau, veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <Zap className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">GlowStudio</h1>
          <p className="text-muted-foreground text-sm mt-1">Support</p>
        </div>

        {step === "form" && (
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <h2 className="text-base font-semibold text-foreground mb-4">Créer un ticket</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Votre email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemple.com"
                  className="mt-1"
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <Label htmlFor="subject">Sujet</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Décrivez votre problème..."
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Donnez le maximum de détails..."
                  className="mt-1"
                  rows={4}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    Envoyer
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </div>
        )}

        {step === "code" && (
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <div className="flex flex-col items-center mb-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-base font-semibold text-foreground">Vérifiez vos emails !</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Entrez le code à 6 chiffres envoyé à
              </p>
              {email && (
                <p className="text-sm font-medium text-primary mt-0.5">{email}</p>
              )}
            </div>
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div>
                <Label htmlFor="code">Code à 6 chiffres</Label>
                <Input
                  ref={codeRef}
                  id="code"
                  value={code}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setCode(v);
                  }}
                  placeholder="123456"
                  className="mt-1 text-center text-2xl font-bold tracking-widest"
                  inputMode="numeric"
                  maxLength={6}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Vérification...
                  </>
                ) : (
                  "Accéder au ticket"
                )}
              </Button>
              <button
                type="button"
                onClick={() => { setStep("form"); setError(""); setCode(""); }}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Retour
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
