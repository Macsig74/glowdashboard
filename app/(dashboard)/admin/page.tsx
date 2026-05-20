"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Shield, UserPlus, Key, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "@/lib/i18n";

const SALONS = [
  { key: "staff", labelKey: "staff" as const },
  { key: "servers", labelKey: "servers" as const },
  { key: "bbb", labelKey: "bbb" as const },
];

interface Member {
  id: string;
  username: string;
  created_at: string;
}

interface AccessEntry {
  username: string;
  salon: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLang();

  const [tab, setTab] = useState<"members" | "access">("members");
  const [members, setMembers] = useState<Member[]>([]);
  const [access, setAccess] = useState<AccessEntry[]>([]);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [accessError, setAccessError] = useState("");
  const [toggling, setToggling] = useState<string | null>(null); // "username:salon"

  useEffect(() => {
    if (status === "authenticated" && !session?.user?.isAdmin) {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.isAdmin) {
      fetchMembers();
      fetchAccess();
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

  async function createMember() {
    if (!newUsername.trim() || !newPassword.trim()) return;
    setCreating(true);
    setError("");
    const res = await fetch("/api/admin/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: newUsername.trim(), password: newPassword }),
    });
    if (res.ok) {
      setNewUsername("");
      setNewPassword("");
      await fetchMembers();
    } else {
      const data = await res.json();
      setError(data.error ?? t.adminCreateError);
    }
    setCreating(false);
  }

  async function deleteMember(id: string) {
    await fetch(`/api/admin/members/${id}`, { method: "DELETE" });
    await fetchMembers();
    await fetchAccess();
  }

  function hasAccess(username: string, salon: string) {
    return access.some((a) => a.username === username && a.salon === salon);
  }

  async function toggleAccess(username: string, salon: string) {
    const key = `${username}:${salon}`;
    setToggling(key);
    setAccessError("");
    const has = hasAccess(username, salon);
    // Optimistic update
    if (has) {
      setAccess((prev) => prev.filter((a) => !(a.username === username && a.salon === salon)));
    } else {
      setAccess((prev) => [...prev, { username, salon }]);
    }
    const res = await fetch("/api/admin/access", {
      method: has ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, salon }),
    });
    if (!res.ok) {
      // Rollback on error
      const data = await res.json().catch(() => ({}));
      setAccessError(data.error ?? "Erreur lors de la mise à jour de l'accès");
      if (has) {
        setAccess((prev) => [...prev, { username, salon }]);
      } else {
        setAccess((prev) => prev.filter((a) => !(a.username === username && a.salon === salon)));
      }
    }
    setToggling(null);
  }

  if (status === "loading" || !session?.user?.isAdmin) return null;

  const nonAdminMembers = members.filter(
    (m) => !["maxim", "mystic", "dr4"].includes(m.username.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.adminTitle}</h1>
          <p className="text-sm text-muted-foreground">{t.adminSubtitle}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setTab("members")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "members"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {t.adminMembers}
        </button>
        <button
          onClick={() => setTab("access")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "access"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {t.adminAccess}
        </button>
      </div>

      {/* Members tab */}
      {tab === "members" && (
        <div className="space-y-4">
          {/* Create form */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              {t.adminCreateMember}
            </h2>
            <div className="flex gap-2">
              <Input
                placeholder={t.username}
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder={t.loginPassword}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="flex-1"
              />
              <Button onClick={createMember} disabled={creating || !newUsername || !newPassword}>
                <Key className="w-4 h-4 mr-1" />
                {t.add}
              </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          {/* Members list */}
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {members.length === 0 && (
              <p className="text-sm text-muted-foreground p-4">{t.adminNoMembers}</p>
            )}
            {members.map((m) => {
              const isAdminUser = ["maxim", "mystic", "dr4"].includes(m.username.toLowerCase());
              return (
                <div key={m.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                      {m.username[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{m.username}</p>
                      {isAdminUser && (
                        <span className="text-xs text-primary font-medium">{t.adminBadge}</span>
                      )}
                    </div>
                  </div>
                  {!isAdminUser && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMember(m.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Access tab */}
      {tab === "access" && (
        <div className="space-y-3">
          {accessError && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
              {accessError}
            </p>
          )}
          {nonAdminMembers.length === 0 && (
            <p className="text-sm text-muted-foreground">{t.adminNoNonAdminMembers}</p>
          )}
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
                        granted
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "bg-muted border-border text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {granted ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <X className="w-3.5 h-3.5" />
                      )}
                      {t[labelKey]}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
