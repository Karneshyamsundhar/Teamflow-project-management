import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "motion/react";
import {
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Plus,
  Clock,
  ArrowRight,
  ShieldAlert,
  ListChecks,
  RefreshCw,
  TrendingUp,
  CircleDot
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { useToast } from "../components/ui/Toast.tsx";
import { useAuth } from "../context/AuthContext.tsx";
import Card from "../components/ui/Card.tsx";
import Button from "../components/ui/Button.tsx";
import Loader from "../components/ui/Loader.tsx";

interface DashboardData {
  stats: {
    totalProjects: number;
    activeProjects: number;
    closedProjects: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    totalIncidents: number;
    openIncidents: number;
    resolvedIncidents: number;
    completionRate: number;
  };
  charts: {
    taskStatuses: {
      todo: number;
      inProgress: number;
      review: number;
      completed: number;
    };
    taskPriorities: {
      low: number;
      medium: number;
      high: number;
    };
    incidentSeverities: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
  };
  recentActivity: Array<{
    id: number;
    title: string;
    type: "Task" | "Project" | "Incident";
    status: string;
    projectName: string;
    assigneeName: string | null;
    createdAt: string;
  }>;
}

const COLORS = ["#4f46e5", "#06b6d4", "#22c55e", "#ef4444"];
const PRIORITY_COLORS = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#ef4444",
};

export default function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const containerVariants: any = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.05
      }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 12 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring", stiffness: 260, damping: 25 } 
    }
  };

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get("/api/reports/dashboard");
      setData(res.data);
    } catch (err: any) {
      console.error(err);
      showToast("Failed to load dashboard insights", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col justify-center items-center gap-4" id="dashboard-loader">
        <Loader size="lg" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">Aggregating TeamFlow Workspace reports...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center p-12 bg-white rounded-2xl border border-slate-100 shadow-xs" id="dashboard-empty-error">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800">Unable to Fetch Insights</h3>
        <p className="text-sm text-slate-500 mt-2">The analytics service is temporarily unavailable. Please retry.</p>
        <Button variant="primary" size="md" className="mt-4" onClick={handleRefresh}>
          Retry Now
        </Button>
      </div>
    );
  }

  // Formatting chart data
  const taskStatusData = [
    { name: "To Do", value: data.charts.taskStatuses.todo || 0 },
    { name: "In Progress", value: data.charts.taskStatuses.inProgress || 0 },
    { name: "Review", value: data.charts.taskStatuses.review || 0 },
    { name: "Completed", value: data.charts.taskStatuses.completed || 0 },
  ].filter(item => item.value > 0);

  const taskPriorityData = [
    { name: "Low", value: data.charts.taskPriorities.low || 0, fill: PRIORITY_COLORS.low },
    { name: "Medium", value: data.charts.taskPriorities.medium || 0, fill: PRIORITY_COLORS.medium },
    { name: "High", value: data.charts.taskPriorities.high || 0, fill: PRIORITY_COLORS.high },
  ];

  const incidentSeverityData = [
    { name: "Low", value: data.charts.incidentSeverities.low || 0 },
    { name: "Medium", value: data.charts.incidentSeverities.medium || 0 },
    { name: "High", value: data.charts.incidentSeverities.high || 0 },
    { name: "Critical", value: data.charts.incidentSeverities.critical || 0 },
  ].filter(item => item.value > 0);

  // Cards layout configurations
  const metricCards = [
    {
      title: "Projects Hub",
      subtitle: `${data.stats.activeProjects} active, ${data.stats.closedProjects} completed`,
      value: data.stats.totalProjects,
      icon: <FolderKanban className="w-5 h-5 text-indigo-600" />,
      color: "indigo",
      bgColor: "bg-indigo-50/50",
      link: "/projects",
    },
    {
      title: "Workspace Tasks",
      subtitle: `${data.stats.completedTasks} finished, ${data.stats.pendingTasks} in backlog`,
      value: data.stats.totalTasks,
      icon: <ListChecks className="w-5 h-5 text-emerald-600" />,
      color: "emerald",
      bgColor: "bg-emerald-50/50",
      link: "/projects",
    },
    {
      title: "Active Incidents",
      subtitle: `${data.stats.openIncidents} open reports, ${data.stats.resolvedIncidents} closed`,
      value: data.stats.totalIncidents,
      icon: <ShieldAlert className="w-5 h-5 text-rose-600" />,
      color: "rose",
      bgColor: "bg-rose-50/50",
      link: "/incidents",
    },
    {
      title: "Completion Ratio",
      subtitle: "Overall task completion rate",
      value: `${Math.round(data.stats.completionRate)}%`,
      icon: <TrendingUp className="w-5 h-5 text-amber-600" />,
      color: "amber",
      bgColor: "bg-amber-50/50",
      link: null,
    },
  ];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-6" 
      id="dashboard-view-wrapper"
    >
      {/* Dashboard Top Row Header */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-5" 
        id="dashboard-header-row"
      >
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight font-display">Workspace Overview</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time analytics engine and team workflow performance tracker
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            loading={refreshing}
            className="flex items-center gap-1.5"
            id="refresh-dashboard-btn"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>

          {user?.roleId !== 3 && ( // Non-Developer Quick Actions
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("/projects")}
              className="flex items-center gap-1.5"
              id="new-project-dashboard-btn"
            >
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          )}
        </div>
      </motion.div>

      {/* Metrics Bento Grid */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" 
        id="dashboard-metrics-grid"
      >
        {metricCards.map((card, i) => {
          const CardContent = (
            <Card hoverEffect className="h-full border-slate-100/70" id={`metric-card-${i}`}>
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">{card.title}</span>
                  <span className="text-3xl font-extrabold text-slate-800 font-display mt-1">{card.value}</span>
                </div>
                <div className={`p-3 rounded-xl ${card.bgColor} border border-slate-100`}>{card.icon}</div>
              </div>
              <div className="mt-4 pt-3.5 border-t border-slate-100/50 flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium">{card.subtitle}</span>
                {card.link && <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform duration-200" />}
              </div>
            </Card>
          );

          return card.link ? (
            <Link key={i} to={card.link} className="block group">
              {CardContent}
            </Link>
          ) : (
            <div key={i}>{CardContent}</div>
          );
        })}
      </motion.div>

      {/* Analytics Visualizers (Charts Section) */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-3 gap-5" 
        id="dashboard-charts-grid"
      >
        {/* Task Status Share (Pie Chart) */}
        <Card title={<span className="font-display font-bold text-slate-800">Task State Breakdown</span>} subtitle="Distribution across workspace columns" className="col-span-1 border-slate-100/70">
          <div className="h-64 flex items-center justify-center relative" id="task-status-chart-container">
            {taskStatusData.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-12">No tasks available in projects.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={78}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "none", borderRadius: "12px", color: "#fff", fontSize: "11px", fontFamily: "Inter, sans-serif" }}
                  />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "11px", fontWeight: "600", color: "#475569" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Task Priority Bar Chart */}
        <Card title={<span className="font-display font-bold text-slate-800">Task Priority Volume</span>} subtitle="Urgency level metrics across active pipelines" className="col-span-1 border-slate-100/70">
          <div className="h-64 flex items-center justify-center" id="task-priority-chart-container">
            {data.stats.totalTasks === 0 ? (
              <div className="text-center text-xs text-slate-400 py-12">No tasks logged in active rosters.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskPriorityData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(241, 245, 249, 0.4)", radius: 8 }}
                    contentStyle={{ background: "#0f172a", border: "none", borderRadius: "12px", color: "#fff", fontSize: "11px" }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={32}>
                    {taskPriorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Incident Severity Share */}
        <Card title={<span className="font-display font-bold text-slate-800">Incident Risk Severity</span>} subtitle="Critical risk categories for mitigation" className="col-span-1 border-slate-100/70">
          <div className="h-64 flex items-center justify-center" id="incident-severity-chart-container">
            {incidentSeverityData.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-12">No safety incidents reported. Excellent work!</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incidentSeverityData}
                    cx="50%"
                    cy="50%"
                    outerRadius={78}
                    innerRadius={40}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {incidentSeverityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "none", borderRadius: "12px", color: "#fff", fontSize: "11px" }}
                  />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "11px", fontWeight: "600", color: "#475569" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Dashboard Bottom Ledger: Live Activities & System Guides */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-3 gap-5" 
        id="dashboard-ledger-grid"
      >
        {/* Recent Work/Activities Ledger */}
        <Card
          title={<span className="font-display font-bold text-slate-800">Recent Activity Stream</span>}
          subtitle="Real-time chronological timeline of project and task activity"
          className="col-span-1 lg:col-span-2 border-slate-100/70"
          action={
            <Link to="/projects" className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 transition-colors">
              Manage Boards
              <ArrowRight className="w-3 h-3" />
            </Link>
          }
        >
          <div className="flow-root mt-1" id="activity-ledger-container">
            {data.recentActivity.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-12">No activity logged yet. Add a project task to start!</div>
            ) : (
              <ul className="-mb-8">
                {data.recentActivity.map((activity, idx) => (
                  <li key={activity.id} id={`activity-item-${idx}`}>
                    <div className="relative pb-8">
                      {idx !== data.recentActivity.length - 1 && (
                        <span className="absolute top-5 left-5 -ml-px h-full w-[1.5px] bg-slate-100" aria-hidden="true" />
                      )}
                      <div className="relative flex space-x-3.5 items-start">
                        <div>
                          <span className={`h-10 w-10 rounded-xl flex items-center justify-center ring-8 ring-white border border-slate-100/40
                            ${activity.type === "Project" ? "bg-indigo-50 text-indigo-600" : ""}
                            ${activity.type === "Task" ? "bg-emerald-50 text-emerald-600" : ""}
                            ${activity.type === "Incident" ? "bg-rose-50 text-rose-600" : ""}
                          `}>
                            {activity.type === "Project" && <FolderKanban className="w-4 h-4" />}
                            {activity.type === "Task" && <CheckCircle2 className="w-4 h-4" />}
                            {activity.type === "Incident" && <ShieldAlert className="w-4 h-4" />}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-xs font-semibold text-slate-800">
                              {activity.title}{" "}
                              <span className="font-normal text-slate-400">
                                in project <span className="font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer">{activity.projectName}</span>
                              </span>
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              Assigned to: <span className="font-medium text-slate-500">{activity.assigneeName || "Unassigned"}</span>
                            </p>
                          </div>
                          <div className="text-right text-[10px] whitespace-nowrap text-slate-400 flex flex-col items-end gap-1.5">
                            <span className="font-mono bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md border border-slate-200/50 uppercase text-[9px]">
                              {activity.status}
                            </span>
                            <span className="font-mono text-slate-400">{new Date(activity.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        {/* Quick System Reference Manual */}
        <Card title={<span className="font-display font-bold text-slate-800">Rosters & Access Permissions</span>} subtitle="System privileges for sandbox accounts" className="border-slate-100/70 col-span-1">
          <div className="flex flex-col gap-4 mt-1" id="reference-panel-body">
            <div className="flex gap-3.5 items-start" id="ref-admin-role">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-slate-700 font-sans">Administrative Operations</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Only System Admins can read system schema logs, manage all workspace projects, register accounts, and assign Managers.
                </p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start" id="ref-manager-role">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-slate-700 font-sans">Project Planning & Assignment</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Project Managers oversee project boards, assign engineering tasks, review Developer items, and resolve logged safety incidents.
                </p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start" id="ref-developer-role">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-slate-700 font-sans">Engineering Workspaces</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Developers update their task progression directly on the kanban, collaborate on deliverables, and trigger incident risk alerts.
                </p>
              </div>
            </div>

            <div className="mt-3 p-3.5 bg-indigo-50/20 rounded-xl border border-indigo-100/30 flex items-start gap-2.5" id="ref-disclaimer">
              <CircleDot className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0 animate-pulse" />
              <p className="text-[10px] text-indigo-700/80 leading-normal font-semibold">
                To simulate user scenarios (Admin vs. Manager vs. Dev), sign out via the top right profile widget and quick-login with alternative sandbox cards.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
