"use client";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import AccountingNav from "@/components/accounting/AccountingNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2, Plus } from "lucide-react";

interface Category {
  id: string;
  name: string;
  emoji: string;
  created_at: string;
}

export default function CategoriesPage() {
  const { t } = useLang();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", emoji: "📁" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadCategories() {
    try {
      const res = await fetch("/api/accounting/categories");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  async function handleAdd() {
    if (!form.name.trim()) {
      setError("Le nom est requis.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/accounting/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), emoji: form.emoji.trim() || "📁" }),
      });
      if (!res.ok) throw new Error("Erreur serveur");
      const created: Category = await res.json();
      setCategories((prev) => [...prev, created]);
      setForm({ name: "", emoji: "📁" });
      setDialogOpen(false);
    } catch {
      setError("Impossible d'ajouter la catégorie.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/accounting/categories/${id}`, { method: "DELETE" });
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t.accounting}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t.accountingSubtitle}</p>
      </div>

      <AccountingNav />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{t.categories}</h2>
        <Button
          onClick={() => {
            setForm({ name: "", emoji: "📁" });
            setError("");
            setDialogOpen(true);
          }}
          size="sm"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          {t.addCategory}
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Chargement...</p>
      ) : categories.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <p className="text-muted-foreground text-sm">{t.noCategories}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="rounded-xl border border-border bg-card p-4 flex flex-col items-center gap-2 group relative"
            >
              <span className="text-4xl select-none">{cat.emoji}</span>
              <span className="text-sm font-medium text-foreground text-center break-words w-full text-center">
                {cat.name}
              </span>
              <button
                onClick={() => handleDelete(cat.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                aria-label="Supprimer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.addCategory}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="cat-emoji">{t.categoryEmoji}</Label>
              <Input
                id="cat-emoji"
                value={form.emoji}
                onChange={(e) => setForm((p) => ({ ...p, emoji: e.target.value }))}
                placeholder="📁"
                className="text-2xl w-20"
                maxLength={4}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">{t.categoryName}</Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ex: Loyer, Matériel..."
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving ? "Ajout..." : t.add}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
