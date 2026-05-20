"use client";
import { useEffect, useState } from "react";
import { Users, Server, Package, TrendingUp, Circle, CheckSquare } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";

interface Stats { staff: number; servers: number; plugins: number; finishedPlugins: number; }

type Priority = "low" | "medium" | "high";

interface MyTask {
  id: string;
  text: string;
  description?: string;
  priority: Priority;
  due_date?: string;
  done: boolean;
  gs_cluster: { id: string; name: string } | null;
}

const priorityColors: Record<Priority, string> = {
  low: "text-blue-400",
  medium: "text-yellow-500",
  high: "text-red-500",
};

export default function DashboardPage() {
  const { t } = useLang();
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats>({ staff: 0, servers: 0, plugins: 0, finishedPlugins: 0 });
  const [myTasks, setMyTasks] = useState<MyTask[]>([]);

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

  useEffect(() => {
    if (!session?.user?.name) return;
    fetch(`/api/tasks?username=${encodeURIComponent(session.user.name)}`)
      .then((r) => r.json())
      .then(setMyTasks);
  }, [session?.user?.name]);

  const formatDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString(undefined, { day: "2-digit", month: "short" });

  const cards = [
    { label: t.staffMembers, value: stats.staff, icon: Users, color: "text-amber-500" },
    { label: t.servers, value: stats.servers, icon: Server, color: "text-blue-500" },
    { label: t.totalPlugins, value: stats.plugins, icon: Package, color: "text-purple-500" },
    { label: t.finishedPlugins, value: stats.finishedPlugins, icon: TrendingUp, color: "text-green-500" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">{t.dashboard}</h1>
        <p className="text-muted-foreground mt-1">{t.dashboardSubtitle}</p>
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

      <div className="mt-6 bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{t.myTasks}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{t.myTasksSubtitle}</p>
          </div>
          {myTasks.length > 0 && (
            <span className="text-sm font-semibold text-primary">{myTasks.length}</span>
          )}
        </div>

        {myTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">{t.noMyTasks}</p>
        ) : (
          <div className="space-y-2">
            {myTasks.map((task) => (
              <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border">
                <CheckSquare className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Circle className={`w-2 h-2 shrink-0 fill-current ${priorityColors[task.priority ?? "medium"]}`} />
                    <span className="text-sm font-medium text-foreground">{task.text}</span>
                    {task.gs_cluster && (
                      <Badge variant="secondary" className="text-xs shrink-0">{task.gs_cluster.name}</Badge>
                    )}
                    {task.due_date && (
                      <span className="text-xs text-muted-foreground shrink-0">{formatDate(task.due_date)}</span>
                    )}
                  </div>
                  {task.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-foreground mb-2">{t.welcomeTitle}</h2>
        <p className="text-muted-foreground text-sm">{t.welcomeText}</p>
      </div>
    </div>
  );
}
