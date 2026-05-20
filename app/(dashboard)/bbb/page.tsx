"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLang } from "@/lib/i18n";

type PluginState = "not_started" | "in_progress" | "polishing" | "review" | "finished";
type PluginStatus = "not_ready" | "ready" | "on_bbb_free" | "on_bbb_paid";
type PluginAuthor = "Mystic" | "MacSig";

interface Plugin {
  id: string;
  name: string;
  plugin_name: string;
  description: string;
  author: PluginAuthor;
  price: number;
  state: PluginState;
  licensed: boolean;
  obfuscated: boolean;
  status: PluginStatus;
  created_at: string;
}

const stateColors: Record<PluginState, string> = {
  not_started: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  polishing: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  review: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  finished: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

const statusColors: Record<PluginStatus, string> = {
  not_ready: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  ready: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  on_bbb_free: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  on_bbb_paid: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

const emptyForm = {
  name: "",
  pluginName: "",
  description: "",
  author: "Mystic" as PluginAuthor,
  price: "0",
  state: "not_started" as PluginState,
  licensed: false,
  obfuscated: false,
  status: "not_ready" as PluginStatus,
};

export default function BBBPage() {
  const { t } = useLang();
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchPlugins = () =>
    fetch("/api/bbb").then((r) => r.json()).then((d) => setPlugins(Array.isArray(d) ? d : []));

  useEffect(() => { fetchPlugins(); }, []);

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setOpen(true); };

  const openEdit = (plugin: Plugin) => {
    setEditingId(plugin.id);
    setForm({
      name: plugin.name,
      pluginName: plugin.plugin_name,
      description: plugin.description,
      author: plugin.author,
      price: plugin.price.toString(),
      state: plugin.state,
      licensed: plugin.licensed,
      obfuscated: plugin.obfuscated,
      status: plugin.status,
    });
    setOpen(true);
  };

  const save = async () => {
    const body = { ...form, price: parseFloat(form.price) || 0 };
    if (editingId) {
      await fetch(`/api/bbb/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } else {
      await fetch("/api/bbb", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    }
    setOpen(false);
    fetchPlugins();
  };

  const deletePlugin = async (id: string) => {
    await fetch(`/api/bbb/${id}`, { method: "DELETE" });
    fetchPlugins();
  };

  const updateField = (field: keyof typeof emptyForm, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const stateKeys: PluginState[] = ["not_started", "in_progress", "polishing", "review", "finished"];
  const statusKeys: PluginStatus[] = ["not_ready", "ready", "on_bbb_free", "on_bbb_paid"];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.bbb}</h1>
          <p className="text-muted-foreground mt-1">{t.bbbSubtitle(plugins.length)}</p>
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4" />{t.addPlugin}</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? t.editPlugin : t.addPlugin}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="col-span-2">
              <Label>{t.projectName}</Label>
              <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder={t.projectName} className="mt-1" />
            </div>
            <div className="col-span-2">
              <Label>{t.pluginName}</Label>
              <Input value={form.pluginName} onChange={(e) => updateField("pluginName", e.target.value)} placeholder="PluginName" className="mt-1 font-mono" />
            </div>
            <div className="col-span-2">
              <Label>{t.description}</Label>
              <Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder={t.descriptionPlaceholder} className="mt-1" />
            </div>
            <div>
              <Label>{t.author}</Label>
              <Select value={form.author} onValueChange={(v) => updateField("author", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mystic">Mystic</SelectItem>
                  <SelectItem value="MacSig">MacSig</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t.price}</Label>
              <Input type="number" value={form.price} onChange={(e) => updateField("price", e.target.value)} min="0" step="0.01" className="mt-1" />
            </div>
            <div>
              <Label>{t.state}</Label>
              <Select value={form.state} onValueChange={(v) => updateField("state", v as PluginState)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {stateKeys.map((k) => <SelectItem key={k} value={k}>{t[k]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t.status}</Label>
              <Select value={form.status} onValueChange={(v) => updateField("status", v as PluginStatus)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusKeys.map((k) => <SelectItem key={k} value={k}>{t[k]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.licensed} onCheckedChange={(v) => updateField("licensed", v)} />
              <Label>{t.licensed}</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.obfuscated} onCheckedChange={(v) => updateField("obfuscated", v)} />
              <Label>{t.obfuscated}</Label>
            </div>
            <Button onClick={save} className="col-span-2 w-full mt-2">{t.save}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted border-b border-border">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.name}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.pluginName}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.description}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.author}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.price}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.state}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.licensed}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.obfuscated}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t.status}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {plugins.map((plugin, i) => (
              <tr key={plugin.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? "bg-card" : "bg-muted/30"} hover:bg-accent/30 transition-colors`}>
                <td className="px-4 py-3 font-medium text-foreground">{plugin.name}</td>
                <td className="px-4 py-3 font-mono text-foreground">{plugin.plugin_name}</td>
                <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{plugin.description}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    plugin.author === "Mystic"
                      ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}>{plugin.author}</span>
                </td>
                <td className="px-4 py-3 text-foreground">{plugin.price > 0 ? `${plugin.price}€` : t.free}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${stateColors[plugin.state]}`}>
                    {t[plugin.state]}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {plugin.licensed ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-muted-foreground mx-auto" />}
                </td>
                <td className="px-4 py-3 text-center">
                  {plugin.obfuscated ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-muted-foreground mx-auto" />}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[plugin.status]}`}>
                    {t[plugin.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(plugin)} className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deletePlugin(plugin.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {plugins.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                  {t.noPlugins}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
