"use client";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";
import AccountingNav from "@/components/accounting/AccountingNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Paperclip, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  emoji: string;
}

interface Transaction {
  id: string;
  label: string;
  amount: number;
  type: "income" | "expense";
  category_id: string | null;
  category_name: string | null;
  category_emoji: string | null;
  date: string;
  notes: string | null;
  doc_count: number;
  created_at: string;
}

interface Doc {
  id: string;
  filename: string;
  mime_type: string;
  created_at: string;
}

function formatEur(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(n);
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function TransactionsPage() {
  const { t } = useLang();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [expandedDocs, setExpandedDocs] = useState<string | null>(null);
  const [docsCache, setDocsCache] = useState<Record<string, Doc[]>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [form, setForm] = useState({
    label: "",
    amount: "",
    type: "expense" as "income" | "expense",
    category_id: "",
    date: today(),
    notes: "",
  });

  async function load() {
    try {
      const [txRes, catRes] = await Promise.all([
        fetch("/api/accounting/transactions"),
        fetch("/api/accounting/categories"),
      ]);
      const [txData, catData] = await Promise.all([txRes.json(), catRes.json()]);
      setTransactions(Array.isArray(txData) ? txData : []);
      setCategories(Array.isArray(catData) ? catData : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();

    const onFocus = () => load();
    const onVisibility = () => { if (document.visibilityState === "visible") load(); };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  function resetForm() {
    setForm({
      label: "",
      amount: "",
      type: "expense",
      category_id: "",
      date: today(),
      notes: "",
    });
    setSelectedFiles([]);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleAdd() {
    if (!form.label.trim()) { setError("Le libellé est requis."); return; }
    if (!form.amount || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0) {
      setError("Le montant doit être un nombre positif."); return;
    }
    if (!form.date) { setError("La date est requise."); return; }

    setSaving(true);
    setError("");

    try {
      const fd = new FormData();
      fd.append("label", form.label.trim());
      fd.append("amount", form.amount);
      fd.append("type", form.type);
      fd.append("date", form.date);
      if (form.category_id) fd.append("category_id", form.category_id);
      if (form.notes.trim()) fd.append("notes", form.notes.trim());
      selectedFiles.forEach((f) => fd.append("docs", f));

      const res = await fetch("/api/accounting/transactions", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error("Erreur serveur");
      const created: Transaction = await res.json();
      setTransactions((prev) => [created, ...prev]);
      resetForm();
      setDialogOpen(false);
    } catch {
      setError("Impossible d'ajouter la transaction.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/accounting/transactions/${id}`, { method: "DELETE" });
      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
      if (expandedDocs === id) setExpandedDocs(null);
    } catch (e) {
      console.error(e);
    }
  }

  async function toggleDocs(txId: string) {
    if (expandedDocs === txId) {
      setExpandedDocs(null);
      return;
    }
    setExpandedDocs(txId);
    if (docsCache[txId]) return;
    try {
      const res = await fetch(`/api/accounting/transactions/${txId}/docs`);
      const data = await res.json();
      setDocsCache((prev) => ({ ...prev, [txId]: Array.isArray(data) ? data : [] }));
    } catch (e) {
      console.error(e);
      setDocsCache((prev) => ({ ...prev, [txId]: [] }));
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
        <h2 className="text-lg font-semibold text-foreground">{t.transactions}</h2>
        <Button
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
          size="sm"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          {t.addTransaction}
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Chargement...</p>
      ) : transactions.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <p className="text-muted-foreground text-sm">{t.noTransactions}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background/50">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Date</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Libellé</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden sm:table-cell">
                  Catégorie
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Type</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Montant</th>
                <th className="text-center px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">
                  Docs
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <>
                  <tr
                    key={tx.id}
                    className="border-b border-border/50 hover:bg-background/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>
                    <td className="px-4 py-3 text-foreground font-medium">
                      {tx.label}
                      {tx.notes && (
                        <p className="text-xs text-muted-foreground font-normal mt-0.5 line-clamp-1">
                          {tx.notes}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {tx.category_name ? (
                        <span className="text-muted-foreground">
                          {tx.category_emoji} {tx.category_name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50 text-xs">Sans catégorie</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={cn(
                          "text-xs font-medium",
                          tx.type === "income"
                            ? "bg-green-500/15 text-green-400 border-green-500/30 hover:bg-green-500/20"
                            : "bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/20"
                        )}
                        variant="outline"
                      >
                        {tx.type === "income" ? t.income : t.expense}
                      </Badge>
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right font-semibold tabular-nums",
                        tx.type === "income" ? "text-green-400" : "text-red-400"
                      )}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {formatEur(tx.amount)}
                    </td>
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      {tx.doc_count > 0 ? (
                        <button
                          onClick={() => toggleDocs(tx.id)}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          {tx.doc_count}
                          {expandedDocs === tx.id ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                  {expandedDocs === tx.id && (
                    <tr key={`${tx.id}-docs`} className="bg-background/20">
                      <td colSpan={7} className="px-6 py-3">
                        {!docsCache[tx.id] ? (
                          <p className="text-xs text-muted-foreground">Chargement des documents...</p>
                        ) : docsCache[tx.id].length === 0 ? (
                          <p className="text-xs text-muted-foreground">Aucun document.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {docsCache[tx.id].map((doc) => (
                              <a
                                key={doc.id}
                                href={`/api/accounting/transactions/${tx.id}/docs?docId=${doc.id}`}
                                className="inline-flex items-center gap-1.5 text-xs bg-card border border-border rounded-md px-3 py-1.5 text-foreground hover:bg-primary/10 hover:border-primary/40 transition-colors"
                                download={doc.filename}
                              >
                                <Paperclip className="w-3 h-3 text-primary" />
                                {doc.filename}
                              </a>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.addTransaction}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Label */}
            <div className="space-y-1.5">
              <Label htmlFor="tx-label">{t.transactionLabel}</Label>
              <Input
                id="tx-label"
                value={form.label}
                onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                placeholder="Ex: Loyer, Matériel..."
              />
            </div>

            {/* Type toggle */}
            <div className="space-y-1.5">
              <Label>{t.transactionType}</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, type: "income" }))}
                  className={cn(
                    "flex-1 rounded-md border py-2 px-3 text-sm font-medium transition-colors",
                    form.type === "income"
                      ? "bg-green-500/20 border-green-500/50 text-green-400"
                      : "border-border text-muted-foreground hover:bg-card"
                  )}
                >
                  {t.income}
                </button>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, type: "expense" }))}
                  className={cn(
                    "flex-1 rounded-md border py-2 px-3 text-sm font-medium transition-colors",
                    form.type === "expense"
                      ? "bg-red-500/20 border-red-500/50 text-red-400"
                      : "border-border text-muted-foreground hover:bg-card"
                  )}
                >
                  {t.expense}
                </button>
              </div>
            </div>

            {/* Amount + Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tx-amount">{t.transactionAmount}</Label>
                <div className="relative">
                  <Input
                    id="tx-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                    placeholder="0.00"
                    className="pr-7"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    €
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tx-date">{t.transactionDate}</Label>
                <Input
                  id="tx-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label>{t.categories}</Label>
              <Select
                value={form.category_id || "none"}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, category_id: v === "none" ? "" : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sans catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sans catégorie</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="tx-notes">{t.transactionNotes}</Label>
              <Textarea
                id="tx-notes"
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Notes optionnelles..."
                rows={2}
              />
            </div>

            {/* Documents */}
            <div className="space-y-1.5">
              <Label>{t.transactionDocs}</Label>
              <div
                className="border border-dashed border-border rounded-md p-4 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []).slice(0, 5);
                    setSelectedFiles(files);
                  }}
                />
                {selectedFiles.length === 0 ? (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <Paperclip className="w-5 h-5" />
                    <p className="text-xs">
                      Cliquez pour ajouter des fichiers (max 5 — PDF, PNG, JPG, WEBP)
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {selectedFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-foreground">
                        <Paperclip className="w-3 h-3 text-primary shrink-0" />
                        <span className="truncate">{f.name}</span>
                        <span className="text-muted-foreground shrink-0 ml-auto">
                          {(f.size / 1024).toFixed(0)} ko
                        </span>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                      Cliquez pour modifier la sélection
                    </p>
                  </div>
                )}
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                resetForm();
              }}
            >
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
