"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLang } from "@/lib/i18n";

export default function LoginPage() {
  const { t, lang, setLang } = useLang();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { username, password, redirect: false });
    setLoading(false);
    if (result?.ok) {
      router.push("/");
    } else {
      setError(t.loginError);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8 relative">
          <button
            onClick={() => setLang(lang === "en" ? "fr" : "en")}
            className="absolute top-0 right-0 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            {lang === "en" ? "FR" : "EN"}
          </button>
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">GlowStudio</h1>
          <p className="text-muted-foreground text-sm mt-1">{t.loginTitle}</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="username">{t.loginUsername}</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="dr4"
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">{t.loginPassword}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1"
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t.loginLoading : t.loginButton}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
