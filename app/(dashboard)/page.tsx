"use client";
import { useEffect, useState } from "react";
import { Users, Server, Package, TrendingUp } from "lucide-react";

interface Stats {
  staff: number;
  servers: number;
  plugins: number;
  finishedPlugins: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ staff: 0, servers: 0, plugins: 0, finishedPlugins: 0 });

  useEffect(() => {
    Promise.all([
      fetch("/api/staff").then((r) => r.json()),
      fetch("/api/servers").then((r) => r.json()),
      fetch("/api/bbb").then((r) => r.json()),
    ]).then(([staff, servers, plugins]) => {
      setStats({
        staff: staff.length,
        servers: servers.length,
        plugins: plugins.length,
        finishedPlugins: plugins.filter((p: { state: string }) => p.state === "finished").length,
      });
    });
  }, []);

  const cards = [
    { label: "Membres du staff", value: stats.staff, icon: Users, color: "text-amber-500" },
    { label: "Serveurs", value: stats.servers, icon: Server, color: "text-blue-500" },
    { label: "Plugins total", value: stats.plugins, icon: Package, color: "text-purple-500" },
    { label: "Plugins terminés", value: stats.finishedPlugins, icon: TrendingUp, color: "text-green-500" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-muted-foreground mt-1">Vue d&apos;ensemble de GlowStudio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">{label}</span>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="text-3xl font-bold text-foreground">{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-foreground mb-2">Bienvenue sur GlowStudio Dashboard</h2>
        <p className="text-muted-foreground text-sm">
          Gérez votre staff, vos serveurs et vos plugins depuis ce tableau de bord centralisé.
        </p>
      </div>
    </div>
  );
}
