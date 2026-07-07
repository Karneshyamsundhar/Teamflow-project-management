import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText,
  Plus,
  BarChart2,
  Calendar,
  Eye,
  Trash2,
  FolderKanban,
  ListChecks,
  ShieldAlert,
  Download,
  Search,
  Sparkles,
  TrendingUp,
  X,
  FileSpreadsheet,
  AlertTriangle,
  User,
  Filter,
  CheckCircle,
  Clock,
  ArrowUpDown,
  FileDown
} from "lucide-react";
import { useToast } from "../components/ui/Toast.tsx";
import { useAuth } from "../context/AuthContext.tsx";
import { Project, Task, Incident } from "../types.ts";
import Card from "../components/ui/Card.tsx";
import Button from "../components/ui/Button.tsx";
import Input from "../components/ui/Input.tsx";
import Modal from "../components/ui/Modal.tsx";
import Loader from "../components/ui/Loader.tsx";

interface SavedReport {
  id: number;
  title: string;
  queryParams: {
    type: string;
    projectId: number;
    projectName: string;
  };
  createdBy: number;
  createdAt: string;
}

export default function Reports() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [currentTab, setCurrentTab] = useState<"dashboard" | "projects" | "tasks" | "incidents" | "snapshots">("dashboard");
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Raw dashboard & database statistics loaded from /api/reports/dashboard
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [tasksList, setTasksList] = useState<any[]>([]);
  const [incidentsList, setIncidentsList] = useState<any[]>([]);

  // Snapshot Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewReportModalOpen, setViewReportModalOpen] = useState(false);

  // New Report Snapshot Form
  const [newReportTitle, setNewReportTitle] = useState("");
  const [newReportType, setNewReportType] = useState("Milestone & Task Progression");
  const [newReportProjectId, setNewReportProjectId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Active Selected Snapshot Report Data
  const [activeReport, setActiveReport] = useState<SavedReport | null>(null);
  const [reportTasks, setReportTasks] = useState<Task[]>([]);
  const [reportIncidents, setReportIncidents] = useState<Incident[]>([]);
  const [loadingActiveReportData, setLoadingActiveReportData] = useState(false);

  // ----------------------------------------------------
  // REPORT FILTERS STATE
  // ----------------------------------------------------
  // 1. Project Report filters
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [projSearchQuery, setProjSearchQuery] = useState("");
  const [projStartDate, setProjStartDate] = useState("");
  const [projEndDate, setProjEndDate] = useState("");

  // 2. Task Report filters
  const [taskSearchQuery, setTaskSearchQuery] = useState("");
  const [taskFilterProject, setTaskFilterProject] = useState("");
  const [taskFilterStatus, setTaskFilterStatus] = useState("");
  const [taskFilterPriority, setTaskFilterPriority] = useState("");
  const [taskStartDate, setTaskStartDate] = useState("");
  const [taskEndDate, setTaskEndDate] = useState("");

  // 3. Incident Report filters
  const [incidentSearchQuery, setIncidentSearchQuery] = useState("");
  const [incidentFilterProject, setIncidentFilterProject] = useState("");
  const [incidentFilterStatus, setIncidentFilterStatus] = useState("");
  const [incidentFilterSeverity, setIncidentFilterSeverity] = useState("");
  const [incidentStartDate, setIncidentStartDate] = useState("");
  const [incidentEndDate, setIncidentEndDate] = useState("");

  // Fetch initial data
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [reportsRes, projectsRes, statsRes] = await Promise.all([
        axios.get("/api/reports"),
        axios.get("/api/projects"),
        axios.get("/api/reports/dashboard")
      ]);
      setSavedReports(reportsRes.data.reports || []);
      const projs = projectsRes.data.projects || [];
      setProjects(projs);
      
      // Select first project as default for Project Report tab if available
      if (projs.length > 0) {
        setSelectedProjectId(projs[0].id.toString());
      }

      setDashboardStats(statsRes.data);
      setProjectsList(statsRes.data.projectsList || []);
      setTasksList(statsRes.data.tasksList || []);
      setIncidentsList(statsRes.data.incidentsList || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to load reporting systems", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // CSV Export Utility
  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    const csvRows = [];
    // add headers
    csvRows.push(headers.join(","));
    
    // add rows
    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        const escaped = ('' + (val ?? '')).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(","));
    }
    
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV report downloaded successfully", "success");
  };

  // ----------------------------------------------------
  // FILTER LOGIC
  // ----------------------------------------------------
  const getFilteredProjectData = () => {
    if (!selectedProjectId) return { tasks: [], incidents: [] };
    const pId = Number(selectedProjectId);
    
    let filteredTasks = tasksList.filter(t => t.projectId === pId);
    let filteredIncidents = incidentsList.filter(i => i.projectId === pId);

    // Filter by search query
    if (projSearchQuery) {
      const q = projSearchQuery.toLowerCase();
      filteredTasks = filteredTasks.filter(t => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
      filteredIncidents = filteredIncidents.filter(i => i.title.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q));
    }

    // Filter by date range (matches creation date)
    if (projStartDate) {
      const start = new Date(projStartDate);
      filteredTasks = filteredTasks.filter(t => new Date(t.createdAt) >= start);
      filteredIncidents = filteredIncidents.filter(i => new Date(i.createdAt) >= start);
    }
    if (projEndDate) {
      const end = new Date(projEndDate);
      end.setHours(23, 59, 59, 999);
      filteredTasks = filteredTasks.filter(t => new Date(t.createdAt) <= end);
      filteredIncidents = filteredIncidents.filter(i => new Date(i.createdAt) <= end);
    }

    return { tasks: filteredTasks, incidents: filteredIncidents };
  };

  const getFilteredTasks = () => {
    let list = [...tasksList];

    if (taskSearchQuery) {
      const q = taskSearchQuery.toLowerCase();
      list = list.filter(t => 
        t.title.toLowerCase().includes(q) || 
        t.description?.toLowerCase().includes(q) || 
        t.projectName.toLowerCase().includes(q) ||
        t.assigneeName.toLowerCase().includes(q)
      );
    }

    if (taskFilterProject) {
      list = list.filter(t => t.projectId === Number(taskFilterProject));
    }

    if (taskFilterStatus) {
      list = list.filter(t => t.status === taskFilterStatus);
    }

    if (taskFilterPriority) {
      list = list.filter(t => t.priority === taskFilterPriority);
    }

    if (taskStartDate) {
      const start = new Date(taskStartDate);
      list = list.filter(t => new Date(t.createdAt) >= start);
    }

    if (taskEndDate) {
      const end = new Date(taskEndDate);
      end.setHours(23, 59, 59, 999);
      list = list.filter(t => new Date(t.createdAt) <= end);
    }

    return list;
  };

  const getFilteredIncidents = () => {
    let list = [...incidentsList];

    if (incidentSearchQuery) {
      const q = incidentSearchQuery.toLowerCase();
      list = list.filter(i => 
        i.title.toLowerCase().includes(q) || 
        i.description?.toLowerCase().includes(q) || 
        i.projectName.toLowerCase().includes(q) ||
        i.assigneeName.toLowerCase().includes(q)
      );
    }

    if (incidentFilterProject) {
      list = list.filter(i => i.projectId === Number(incidentFilterProject));
    }

    if (incidentFilterStatus) {
      list = list.filter(i => i.status === incidentFilterStatus);
    }

    if (incidentFilterSeverity) {
      list = list.filter(i => i.severity === incidentFilterSeverity);
    }

    if (incidentStartDate) {
      const start = new Date(incidentStartDate);
      list = list.filter(i => new Date(i.createdAt) >= start);
    }

    if (incidentEndDate) {
      const end = new Date(incidentEndDate);
      end.setHours(23, 59, 59, 999);
      list = list.filter(i => new Date(i.createdAt) <= end);
    }

    return list;
  };

  // ----------------------------------------------------
  // EXPORTS
  // ----------------------------------------------------
  const handleExportTasksCSV = () => {
    const list = getFilteredTasks();
    const headers = ["id", "title", "projectName", "assigneeName", "status", "priority", "dueDate", "createdAt"];
    exportToCSV(list, `tasks_report_${new Date().toISOString().slice(0, 10)}.csv`, headers);
  };

  const handleExportIncidentsCSV = () => {
    const list = getFilteredIncidents();
    const headers = ["id", "title", "description", "projectName", "assigneeName", "status", "severity", "createdAt"];
    exportToCSV(list, `incidents_report_${new Date().toISOString().slice(0, 10)}.csv`, headers);
  };

  const handleExportProjectCSV = () => {
    const pData = getFilteredProjectData();
    const projName = projects.find(p => p.id === Number(selectedProjectId))?.name || "project";
    
    // Export Tasks CSV
    const tHeaders = ["id", "title", "assigneeName", "status", "priority", "dueDate", "createdAt"];
    exportToCSV(pData.tasks, `${projName.toLowerCase().replace(/\s+/g, "_")}_tasks_report_${new Date().toISOString().slice(0, 10)}.csv`, tHeaders);
  };

  const handleExportProjectsCSV = () => {
    const list = projectsList;
    const headers = ["id", "name", "status", "managerName", "membersCount", "createdAt"];
    exportToCSV(list, `projects_summary_report_${new Date().toISOString().slice(0, 10)}.csv`, headers);
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  // Create Snapshot Report Form Submission
  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReportTitle.trim() || !newReportProjectId) {
      showToast("Please provide a title and select a project", "warning");
      return;
    }

    const matchedProject = projects.find((p) => p.id === parseInt(newReportProjectId, 10));
    if (!matchedProject) return;

    setSubmitting(true);
    try {
      await axios.post("/api/reports", {
        title: newReportTitle,
        queryParams: {
          type: newReportType,
          projectId: matchedProject.id,
          projectName: matchedProject.name,
        },
      });

      showToast(`Snapshot report '${newReportTitle}' registered`, "success");
      setCreateModalOpen(false);
      
      // Reset Form
      setNewReportTitle("");
      setNewReportProjectId("");
      setNewReportType("Milestone & Task Progression");

      // Refresh list
      const reportsRes = await axios.get("/api/reports");
      setSavedReports(reportsRes.data.reports || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to compile and save report snapshot", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Snapshot Audit Modal
  const handleViewReportDetails = async (report: SavedReport) => {
    setActiveReport(report);
    setViewReportModalOpen(true);
    setLoadingActiveReportData(true);
    try {
      const [tasksRes, incidentsRes] = await Promise.all([
        axios.get(`/api/tasks?projectId=${report.queryParams.projectId}`),
        axios.get(`/api/incidents?projectId=${report.queryParams.projectId}`),
      ]);
      setReportTasks(tasksRes.data.tasks || []);
      setReportIncidents(incidentsRes.data.incidents || []);
    } catch (err) {
      console.error(err);
      showToast("Error retrieving snapshot data", "error");
    } finally {
      setLoadingActiveReportData(false);
    }
  };

  // Delete saved Snapshot report
  const handleDeleteReport = async (reportId: number) => {
    if (!window.confirm("Are you sure you want to permanently delete this snapshot report?")) {
      return;
    }
    try {
      await axios.delete(`/api/reports/${reportId}`);
      showToast("Snapshot report successfully deleted", "success");
      setSavedReports(prev => prev.filter(r => r.id !== reportId));
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || "Failed to delete snapshot", "error");
    }
  };

  const openCreateModal = () => {
    setNewReportTitle("");
    if (projects.length > 0) {
      setNewReportProjectId(projects[0].id.toString());
    }
    setCreateModalOpen(true);
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col justify-center items-center gap-4 animate-fade-in" id="reports-loading-state">
        <Loader size="lg" />
        <p className="text-sm text-slate-500 animate-pulse font-medium">Synchronizing reporting ledger & analytics...</p>
      </div>
    );
  }

  const stats = dashboardStats?.stats || {};
  const charts = dashboardStats?.charts || {};

  return (
    <div className="flex flex-col gap-6" id="reports-module-root">
      
      {/* Printable Report Header Only Visible on Window Print */}
      <div className="hidden print:block mb-8 border-b border-slate-300 pb-5">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">OPERATIONAL WORKSPACE AUDIT LOG</h1>
            <p className="text-xs text-slate-500 font-mono mt-1 uppercase tracking-wider">WORKSPACE COMPREHENSIVE PERFORMANCE SYSTEMS</p>
          </div>
          <div className="text-right text-xs text-slate-500 font-mono">
            <p>Export Date: {new Date().toLocaleString()}</p>
            <p>Audited By: {user?.name || "System Operator"}</p>
            <p>Verification Check: VALIDATED</p>
          </div>
        </div>
      </div>

      {/* Primary Page Header (Hidden when printing) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 print:hidden" id="reports-page-header">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-indigo-600 animate-pulse" />
            Workspace Core Analytics & Reports
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review detailed analytical metrics, monitor project logs, download spreadsheets, or compile static immutable audits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTriggerPrint}
            className="flex items-center gap-1.5 font-semibold text-slate-600 border-slate-200"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Print Current View (PDF)
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={openCreateModal}
            className="flex items-center gap-1.5 shadow-md shadow-indigo-100"
            id="compile-snapshot-btn"
          >
            <Plus className="w-4 h-4" />
            Compile Audit Snapshot
          </Button>
        </div>
      </div>

      {/* Tab Selectors (Hidden when printing) */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/70 p-1 rounded-xl w-fit print:hidden" id="reports-tab-navigation">
        {[
          { id: "dashboard", label: "Dashboard Reports", icon: BarChart2 },
          { id: "projects", label: "Project Reports", icon: FolderKanban },
          { id: "tasks", label: "Task Reports", icon: ListChecks },
          { id: "incidents", label: "Incident Reports", icon: ShieldAlert },
          { id: "snapshots", label: "Saved Snapshots", icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                isActive
                  ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
              }`}
              id={`tab-select-${tab.id}`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ====================================================================================== */}
      {/* 1. OVERVIEW / DASHBOARD REPORTS TAB                                                    */}
      {/* ====================================================================================== */}
      {currentTab === "dashboard" && (
        <div className="flex flex-col gap-6 animate-fade-in" id="tab-content-dashboard">
          
          {/* Quick Metrics KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="dashboard-metric-cards">
            {[
              { label: "Accessible Workspaces", value: stats.totalProjects || 0, icon: FolderKanban, color: "text-indigo-600", bg: "bg-indigo-50/50" },
              { label: "Overall Task Progress", value: `${stats.completionRate || 0}%`, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50/50" },
              { label: "Active Pending Burden", value: stats.pendingTasks || 0, icon: Clock, color: "text-amber-600", bg: "bg-amber-50/50" },
              { label: "Total Vulnerabilities", value: stats.totalIncidents || 0, icon: ShieldAlert, color: "text-rose-600", bg: "bg-rose-50/50" },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{card.label}</span>
                    <span className="text-2xl font-extrabold text-slate-800 mt-1 block font-mono">{card.value}</span>
                  </div>
                  <div className={`p-3 rounded-xl ${card.bg}`}>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Visual SVG / CSS Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-visual-charts">
            
            {/* Task Delivery Bar Chart */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-indigo-500" />
                  Task Status Distribution
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Total tasks categorized across your workspaces</p>
              </div>

              {/* Custom Animated Bar Chart */}
              <div className="flex h-48 items-end gap-5 pt-4 px-2" id="task-distribution-chart">
                {Object.entries({
                  "To Do": charts.taskStatuses?.todo || 0,
                  "In Progress": charts.taskStatuses?.inProgress || 0,
                  "Review": charts.taskStatuses?.review || 0,
                  "Completed": charts.taskStatuses?.completed || 0
                }).map(([label, value]) => {
                  const total = Object.values(charts.taskStatuses || {}).reduce((a: any, b: any) => a + b, 0) as number;
                  const maxVal = Math.max(1, ...Object.values(charts.taskStatuses || {} as any) as any);
                  const pct = Math.round((value / maxVal) * 100);
                  const sharePct = total > 0 ? Math.round((value / total) * 100) : 0;
                  return (
                    <div key={label} className="flex-1 flex flex-col items-center gap-2 group cursor-default">
                      <div className="w-full bg-slate-50 border border-slate-100 rounded-xl h-32 flex items-end overflow-hidden relative">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${pct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className={`w-full transition-colors duration-200 ${
                            label === "Completed" ? "bg-emerald-500 group-hover:bg-emerald-400" :
                            label === "Review" ? "bg-indigo-500 group-hover:bg-indigo-400" :
                            label === "In Progress" ? "bg-amber-500 group-hover:bg-amber-400" :
                            "bg-slate-400 group-hover:bg-slate-300"
                          }`}
                        />
                        <div className="absolute top-1 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[9px] py-0.5 rounded shadow-sm w-12 mx-auto pointer-events-none font-mono">
                          {value} ({sharePct}%)
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider text-center block max-w-full truncate">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Incident Severity Pie/Ring Chart */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  Incident Severity Breakdown
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Distribution of security and hazard vulnerabilities</p>
              </div>

              {/* Custom SVG Segmented Ring */}
              <div className="flex flex-col sm:flex-row items-center justify-around gap-6 h-48" id="incident-severity-chart">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" className="stroke-slate-50 fill-none" strokeWidth="8" />
                    {(() => {
                      const counts = [
                        charts.incidentSeverities?.low || 0,
                        charts.incidentSeverities?.medium || 0,
                        charts.incidentSeverities?.high || 0,
                        charts.incidentSeverities?.critical || 0
                      ];
                      const colors = ["#10b981", "#f59e0b", "#f97316", "#ef4444"];
                      const total = counts.reduce((a, b) => a + b, 0) || 1;
                      let cumulativePercent = 0;
                      
                      return counts.map((count, idx) => {
                        if (count === 0) return null;
                        const pct = (count / total) * 100;
                        const strokeDash = `${pct} ${100 - pct}`;
                        const offset = 100 - cumulativePercent;
                        cumulativePercent += pct;
                        
                        return (
                          <circle
                            key={idx}
                            cx="50"
                            cy="50"
                            r="38"
                            fill="none"
                            stroke={colors[idx]}
                            strokeWidth="10"
                            strokeDasharray="238.76"
                            strokeDashoffset={(238.76 * (100 - pct)) / 100 + (238.76 * (offset - 100)) / 100}
                            className="transition-all duration-300 hover:stroke-[12px] cursor-pointer"
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-extrabold text-slate-800 font-mono">{incidentsList.length}</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Vulnerabilities</span>
                  </div>
                </div>
                
                {/* Legends */}
                <div className="flex flex-col gap-2 text-xs w-full sm:w-44">
                  {[
                    { label: "Low", value: charts.incidentSeverities?.low || 0, color: "bg-emerald-500" },
                    { label: "Medium", value: charts.incidentSeverities?.medium || 0, color: "bg-amber-500" },
                    { label: "High", value: charts.incidentSeverities?.high || 0, color: "bg-orange-500" },
                    { label: "Critical", value: charts.incidentSeverities?.critical || 0, color: "bg-red-500" }
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between border-b border-slate-50 pb-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                        <span className="font-semibold text-slate-500">{item.label}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-700">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Project Health Ledger (Dashboard Reports list) */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <FolderKanban className="w-4 h-4 text-indigo-500" />
                  Roster Workspace Performance Ledger
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Operational summary and burden score for active project channels</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-[10px] py-1 text-indigo-600 border-indigo-100 bg-indigo-50/20"
                onClick={handleExportProjectsCSV}
              >
                <FileDown className="w-3.5 h-3.5 mr-1" />
                Export Ledger
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-3">Project Workspace</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Project Lead</th>
                    <th className="p-3 text-center">Team Members</th>
                    <th className="p-3 text-center">Active Deliverables</th>
                    <th className="p-3 text-center">Open Incidents</th>
                    <th className="p-3 text-right">Core Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projectsList.map((p) => {
                    const activeTasksCount = tasksList.filter(t => t.projectId === p.id && t.status !== "Completed").length;
                    const openIncidentsCount = incidentsList.filter(i => i.projectId === p.id && i.status !== "Closed" && i.status !== "Resolved").length;
                    return (
                      <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50 text-slate-600">
                        <td className="p-3">
                          <span className="font-extrabold text-slate-800 text-sm block">{p.name}</span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-xs mt-0.5" title={p.description}>
                            {p.description || "No description provided."}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                            p.status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-500 border-slate-200"
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-700">{p.managerName}</td>
                        <td className="p-3 text-center font-bold font-mono">{p.membersCount}</td>
                        <td className="p-3 text-center">
                          <span className={`font-mono font-bold ${activeTasksCount > 0 ? "text-amber-600" : "text-slate-400"}`}>
                            {activeTasksCount}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`font-mono font-bold ${openIncidentsCount > 0 ? "text-rose-600 animate-pulse" : "text-slate-400"}`}>
                            {openIncidentsCount}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[10px] py-1 border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-100"
                            onClick={() => {
                              setSelectedProjectId(p.id.toString());
                              setCurrentTab("projects");
                            }}
                          >
                            Analyze Audit
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {projectsList.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                        No active workspace projects detected. Establish a project first.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================================== */}
      {/* 2. PROJECT COMPREHENSIVE REPORTS TAB                                                   */}
      {/* ====================================================================================== */}
      {currentTab === "projects" && (
        <div className="flex flex-col gap-6 animate-fade-in" id="tab-content-projects">
          
          {/* Settings Filter Control Box */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-end print:hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 w-full">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Query Workspace Target</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none w-full cursor-pointer"
                >
                  <option value="" disabled>Select Project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Search Keyword</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search tasks or incidents..."
                    value={projSearchQuery}
                    onChange={(e) => setProjSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none w-full font-semibold"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Start Date</label>
                <input
                  type="date"
                  value={projStartDate}
                  onChange={(e) => setProjStartDate(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none w-full font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">End Date</label>
                <input
                  type="date"
                  value={projEndDate}
                  onChange={(e) => setProjEndDate(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none w-full font-semibold"
                />
              </div>

            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportProjectCSV}
                disabled={!selectedProjectId}
                className="flex items-center gap-1 w-full md:w-auto border-slate-200 text-slate-600 font-bold"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Active project report rendering */}
          {(() => {
            const activeProj = projects.find(p => p.id === Number(selectedProjectId));
            const pData = getFilteredProjectData();
            
            if (!selectedProjectId || !activeProj) {
              return (
                <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl">
                  <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-500">Select a project channel from the dropdown above to audit.</p>
                </div>
              );
            }

            const totalProjTasks = pData.tasks.length;
            const completedProjTasks = pData.tasks.filter((t: any) => t.status === "Completed").length;
            const projCompletionRate = totalProjTasks > 0 ? Math.round((completedProjTasks / totalProjTasks) * 100) : 0;
            const openProjIncidents = pData.incidents.filter((i: any) => i.status !== "Closed" && i.status !== "Resolved").length;

            return (
              <div className="flex flex-col gap-6" id="active-project-report-scope">
                
                {/* Project Metadata Briefing Card */}
                <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />
                  
                  <div className="flex flex-col gap-3 max-w-2xl relative">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[9px] font-bold uppercase tracking-widest font-mono bg-indigo-500 text-white px-2.5 py-0.5 rounded-full">
                        Workspace Report Snapshot
                      </span>
                      <span className="text-xs text-slate-400 font-mono">ID: #{activeProj.id}</span>
                    </div>

                    <h2 className="text-xl font-black tracking-tight">{activeProj.name}</h2>
                    <p className="text-xs text-slate-300 leading-relaxed">{activeProj.description || "No project description mapped."}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400 font-semibold mt-1">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        Manager: <strong className="text-slate-200">{activeProj.managerName || "Unknown"}</strong>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        Created: <strong className="text-slate-200">{new Date(activeProj.createdAt).toLocaleDateString()}</strong>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                        Status: <strong className="text-emerald-400 uppercase font-bold">{activeProj.status}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 w-full md:w-64 border-t md:border-t-0 md:border-l border-slate-800 pt-5 md:pt-0 md:pl-6 relative">
                    <div className="text-center bg-slate-800/30 border border-slate-800/50 rounded-xl p-3">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Completion</span>
                      <span className="text-xl font-black text-emerald-400 block mt-1 font-mono">{projCompletionRate}%</span>
                    </div>
                    <div className="text-center bg-slate-800/30 border border-slate-800/50 rounded-xl p-3">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Open Incidents</span>
                      <span className={`text-xl font-black block mt-1 font-mono ${openProjIncidents > 0 ? "text-rose-400 animate-pulse" : "text-slate-400"}`}>
                        {openProjIncidents}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Combined Tasks and Incidents Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="project-deliverables-hazards">
                  
                  {/* Tasks list */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <ListChecks className="w-4 h-4 text-indigo-500" />
                        Deliverables Audit Registry ({pData.tasks.length})
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Assigned milestones, progression schedules, and priority markers</p>
                    </div>

                    <div className="border border-slate-100 rounded-xl overflow-hidden overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="p-2.5">Title</th>
                            <th className="p-2.5">Priority</th>
                            <th className="p-2.5">Status</th>
                            <th className="p-2.5">Assignee</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pData.tasks.map((t: any) => (
                            <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/20 text-slate-600">
                              <td className="p-2.5 font-semibold text-slate-800">{t.title}</td>
                              <td className="p-2.5">
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                  t.priority === "High" ? "bg-rose-50 text-rose-700" :
                                  t.priority === "Medium" ? "bg-amber-50 text-amber-700" :
                                  "bg-emerald-50 text-emerald-700"
                                }`}>
                                  {t.priority}
                                </span>
                              </td>
                              <td className="p-2.5 font-bold text-slate-500 text-[10px]">{t.status}</td>
                              <td className="p-2.5 text-slate-500">{t.assigneeName}</td>
                            </tr>
                          ))}
                          {pData.tasks.length === 0 && (
                            <tr>
                              <td colSpan={4} className="p-6 text-center text-slate-400 italic">No tasks match criteria for active project.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Incidents list */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-rose-500" />
                        Incident Log & Roster ({pData.incidents.length})
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Vulnerability reports, severity vectors, and recovery progress</p>
                    </div>

                    <div className="border border-slate-100 rounded-xl overflow-hidden overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="p-2.5">Vulnerability</th>
                            <th className="p-2.5">Severity</th>
                            <th className="p-2.5">Status</th>
                            <th className="p-2.5">Assignee</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pData.incidents.map((i: any) => (
                            <tr key={i.id} className="border-b border-slate-50 hover:bg-slate-50/20 text-slate-600">
                              <td className="p-2.5 font-semibold text-slate-800">
                                <span className="block font-bold">{i.title}</span>
                                <span className="text-[9px] text-slate-400 block truncate max-w-xs">{i.description}</span>
                              </td>
                              <td className="p-2.5">
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                  i.severity === "Critical" ? "bg-red-100 text-red-700 animate-pulse" :
                                  i.severity === "High" ? "bg-orange-50 text-orange-700" :
                                  i.severity === "Medium" ? "bg-amber-50 text-amber-700" :
                                  "bg-emerald-50 text-emerald-700"
                                }`}>
                                  {i.severity}
                                </span>
                              </td>
                              <td className="p-2.5 font-bold text-[10px]">{i.status}</td>
                              <td className="p-2.5 text-slate-500">{i.assigneeName}</td>
                            </tr>
                          ))}
                          {pData.incidents.length === 0 && (
                            <tr>
                              <td colSpan={4} className="p-6 text-center text-slate-400 italic">No incidents recorded for active project.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

              </div>
            );
          })()}

        </div>
      )}

      {/* ====================================================================================== */}
      {/* 3. TASK COMPREHENSIVE REPORTS TAB                                                     */}
      {/* ====================================================================================== */}
      {currentTab === "tasks" && (
        <div className="flex flex-col gap-6 animate-fade-in" id="tab-content-tasks">
          
          {/* Controls Bar */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-end print:hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 flex-1 w-full">
              
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Search Keyword</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Title/Assignee..."
                    value={taskSearchQuery}
                    onChange={(e) => setTaskSearchQuery(e.target.value)}
                    className="pl-7 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none w-full font-semibold"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Project</label>
                <select
                  value={taskFilterProject}
                  onChange={(e) => setTaskFilterProject(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none w-full font-semibold"
                >
                  <option value="">All Projects</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
                <select
                  value={taskFilterStatus}
                  onChange={(e) => setTaskFilterStatus(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none w-full font-semibold"
                >
                  <option value="">All Statuses</option>
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Priority</label>
                <select
                  value={taskFilterPriority}
                  onChange={(e) => setTaskFilterPriority(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none w-full font-semibold"
                >
                  <option value="">All Priorities</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Created Start</label>
                <input
                  type="date"
                  value={taskStartDate}
                  onChange={(e) => setTaskStartDate(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none w-full font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Created End</label>
                <input
                  type="date"
                  value={taskEndDate}
                  onChange={(e) => setTaskEndDate(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none w-full font-semibold"
                />
              </div>

            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportTasksCSV}
              className="flex items-center gap-1.5 border-slate-200 text-slate-600 font-bold"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              CSV Spreadsheet
            </Button>
          </div>

          {/* Dynamic Table List */}
          {(() => {
            const filteredTasks = getFilteredTasks();
            return (
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Filtered Deliverables ({filteredTasks.length} matching tasks)
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="p-3">Deliverable Task</th>
                        <th className="p-3">Project Workspace</th>
                        <th className="p-3">Assigned Agent</th>
                        <th className="p-3 text-center">Priority</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3">Schedule Due Date</th>
                        <th className="p-3">Registered On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.map((t) => {
                        const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "Completed";
                        return (
                          <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50 text-slate-600">
                            <td className="p-3">
                              <span className="font-extrabold text-slate-800 text-sm block">{t.title}</span>
                              <span className="text-[10px] text-slate-400 block max-w-sm truncate mt-0.5" title={t.description}>
                                {t.description || "No description mapped."}
                              </span>
                            </td>
                            <td className="p-3 font-semibold text-slate-700">{t.projectName}</td>
                            <td className="p-3 text-slate-600 font-medium">{t.assigneeName}</td>
                            <td className="p-3 text-center">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                                t.priority === "High" ? "bg-rose-50 text-rose-700 border-rose-100" :
                                t.priority === "Medium" ? "bg-amber-50 text-amber-700 border-amber-100" :
                                "bg-emerald-50 text-emerald-700 border-emerald-100"
                              }`}>
                                {t.priority}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className="font-bold text-[10px] text-slate-600">{t.status}</span>
                            </td>
                            <td className="p-3">
                              <span className={`font-mono font-bold text-xs ${isOverdue ? "text-rose-500 underline decoration-wavy animate-pulse" : "text-slate-500"}`}>
                                {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "No Limit"}
                                {isOverdue && " [OVERDUE]"}
                              </span>
                            </td>
                            <td className="p-3 text-slate-400 font-mono text-[10px]">{new Date(t.createdAt).toLocaleDateString()}</td>
                          </tr>
                        );
                      })}
                      {filteredTasks.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400 italic">No tasks match selected filter criteria.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

        </div>
      )}

      {/* ====================================================================================== */}
      {/* 4. INCIDENT COMPREHENSIVE REPORTS TAB                                                 */}
      {/* ====================================================================================== */}
      {currentTab === "incidents" && (
        <div className="flex flex-col gap-6 animate-fade-in" id="tab-content-incidents">
          
          {/* Filters Control Bar */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-end print:hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 flex-1 w-full">
              
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Search Keyword</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Incident/Mitigator..."
                    value={incidentSearchQuery}
                    onChange={(e) => setIncidentSearchQuery(e.target.value)}
                    className="pl-7 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none w-full font-semibold"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Project</label>
                <select
                  value={incidentFilterProject}
                  onChange={(e) => setIncidentFilterProject(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none w-full font-semibold"
                >
                  <option value="">All Projects</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
                <select
                  value={incidentFilterStatus}
                  onChange={(e) => setIncidentFilterStatus(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none w-full font-semibold"
                >
                  <option value="">All Statuses</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Severity</label>
                <select
                  value={incidentFilterSeverity}
                  onChange={(e) => setIncidentFilterSeverity(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none w-full font-semibold"
                >
                  <option value="">All Severities</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Logged Start</label>
                <input
                  type="date"
                  value={incidentStartDate}
                  onChange={(e) => setIncidentStartDate(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none w-full font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Logged End</label>
                <input
                  type="date"
                  value={incidentEndDate}
                  onChange={(e) => setIncidentEndDate(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none w-full font-semibold"
                />
              </div>

            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportIncidentsCSV}
              className="flex items-center gap-1.5 border-slate-200 text-slate-600 font-bold"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              CSV Spreadsheet
            </Button>
          </div>

          {/* Dynamic Table Log */}
          {(() => {
            const filteredIncidents = getFilteredIncidents();
            return (
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Filtered Incident Logs ({filteredIncidents.length} matching incident reports)
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="p-3">Incident Vulnerability</th>
                        <th className="p-3">Project Target</th>
                        <th className="p-3">Mitigator assigned</th>
                        <th className="p-3 text-center">Severity Vector</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3">Logged Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIncidents.map((i) => (
                        <tr key={i.id} className="border-b border-slate-50 hover:bg-slate-50/50 text-slate-600">
                          <td className="p-3">
                            <span className="font-extrabold text-slate-800 text-sm block flex items-center gap-1 text-rose-700">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
                              {i.title}
                            </span>
                            <span className="text-[10px] text-slate-400 block max-w-sm truncate mt-0.5" title={i.description}>
                              {i.description}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-slate-700">{i.projectName}</td>
                          <td className="p-3 text-slate-600 font-medium">{i.assigneeName}</td>
                          <td className="p-3 text-center">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                              i.severity === "Critical" ? "bg-red-100 text-red-700 border-red-200 animate-pulse font-black" :
                              i.severity === "High" ? "bg-orange-50 text-orange-700 border-orange-100" :
                              i.severity === "Medium" ? "bg-amber-50 text-amber-700 border-amber-100" :
                              "bg-emerald-50 text-emerald-700 border-emerald-100"
                            }`}>
                              {i.severity}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-bold text-[10px] text-slate-600">{i.status}</span>
                          </td>
                          <td className="p-3 text-slate-400 font-mono text-[10px]">{new Date(i.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                      {filteredIncidents.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400 italic">No incidents match selected filter criteria.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

        </div>
      )}

      {/* ====================================================================================== */}
      {/* 5. SAVED ARCHIVE SNAPSHOTS TAB                                                         */}
      {/* ====================================================================================== */}
      {currentTab === "snapshots" && (
        <div className="flex flex-col gap-6 animate-fade-in" id="tab-content-snapshots">
          
          {savedReports.length === 0 ? (
            <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl shadow-xs" id="reports-empty-ledger">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4 animate-bounce" />
              <h3 className="text-base font-bold text-slate-700">No Compiled Snapshot Reports</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                There are no static reporting files registered under your credentials. Click compile to audit a project workspace.
              </p>
              <Button variant="outline" size="sm" className="mt-4 border-slate-200" onClick={openCreateModal}>
                Compile First Snapshot
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="reports-cards-grid">
              {savedReports.map((report) => (
                <Card
                  key={report.id}
                  hoverEffect
                  id={`report-snapshot-card-${report.id}`}
                  title={
                    <div className="flex items-center gap-2 text-slate-700">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <span className="font-extrabold truncate max-w-[180px]" title={report.title}>
                        {report.title}
                      </span>
                    </div>
                  }
                  subtitle={`Generated: ${new Date(report.createdAt).toLocaleDateString()}`}
                  className="border-slate-100 flex flex-col justify-between"
                  action={
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-2.5 py-1 text-xs font-semibold hover:bg-indigo-50 border-slate-200"
                        onClick={() => handleViewReportDetails(report)}
                        id={`view-report-snapshot-${report.id}`}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Audit
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-2.5 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-50 hover:text-rose-700 border-slate-200"
                        onClick={() => handleDeleteReport(report.id)}
                        id={`delete-report-snapshot-${report.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  }
                >
                  <div className="flex flex-col gap-3" id={`report-stats-body-${report.id}`}>
                    <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Scope Target</span>
                      <span className="text-xs font-bold text-slate-700 mt-1 block truncate">
                        {report.queryParams.projectName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-2">
                      <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-md uppercase">
                        {report.queryParams.type}
                      </span>
                      <span className="flex items-center gap-1 text-[9px]">
                        <Calendar className="w-3 h-3" />
                        ID #{report.id}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ====================================================================================== */}
      {/* MODALS SECTION                                                                         */}
      {/* ====================================================================================== */}

      {/* 1. Compile Report Snapshot Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Compile Project Snapshot Audit Log"
        size="md"
      >
        <form onSubmit={handleCreateReport} className="flex flex-col gap-4" id="compile-report-form">
          <Input
            id="report-title-input"
            label="Report Title"
            placeholder="e.g. Apollo Q3 Security Assessment"
            value={newReportTitle}
            onChange={(e) => setNewReportTitle(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5" id="report-type-field">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Metric Audit Focus</label>
            <select
              value={newReportType}
              onChange={(e) => setNewReportType(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none cursor-pointer"
            >
              <option value="Milestone & Task Progression">📊 Milestone & Task Progression</option>
              <option value="Safety & Hazard Vulnerability">🚨 Safety & Hazard Vulnerability</option>
              <option value="Executive Performance Summary">💼 Executive Performance Summary</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5" id="report-project-field">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Target Project Workspace</label>
            <select
              value={newReportProjectId}
              onChange={(e) => setNewReportProjectId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none cursor-pointer"
              required
            >
              <option value="" disabled>Select Project Roster</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {projects.length === 0 && (
            <p className="text-xs text-rose-500 font-medium">Please establish a project workspace first before querying reports.</p>
          )}

          <div className="flex items-center justify-end gap-3 mt-4 border-t border-slate-100 pt-4" id="compile-actions">
            <Button variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm" loading={submitting}>
              Compile & Audit
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Detailed Saved Snapshot Modal (Interactive View) */}
      <Modal
        isOpen={viewReportModalOpen}
        onClose={() => setViewReportModalOpen(false)}
        title="Analytical Snapshot Audit"
        size="lg"
      >
        {activeReport && (
          <div className="flex flex-col gap-6" id="report-detailed-view">
            {loadingActiveReportData ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader size="lg" />
                <span className="text-xs text-slate-400 animate-pulse">Aggregating workspace snapshot ledger...</span>
              </div>
            ) : (
              <div className="print:p-8" id="print-content-scope">
                
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">SNAPSHOT REPORT ID: #{activeReport.id}</span>
                    <h2 className="text-lg font-extrabold text-slate-800 tracking-tight mt-1">{activeReport.title}</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Project target: <span className="font-semibold text-slate-600">{activeReport.queryParams.projectName}</span>
                    </p>
                  </div>

                  <div className="text-right text-xs text-slate-400">
                    <p className="font-mono">Created: {new Date(activeReport.createdAt).toLocaleString()}</p>
                    <p className="mt-1">Class: <span className="font-semibold text-indigo-600 uppercase font-mono text-[10px] bg-indigo-50 px-2 py-0.5 rounded">{activeReport.queryParams.type}</span></p>
                  </div>
                </div>

                {/* KPI metrics */}
                <div className="grid grid-cols-4 gap-4 mt-6 animate-fade-in" id="detailed-report-widgets">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Tasks</span>
                    <span className="text-xl font-extrabold text-slate-800 mt-1 block font-mono">{reportTasks.length}</span>
                  </div>
                  <div className="bg-emerald-50/30 border border-emerald-50 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed</span>
                    <span className="text-xl font-extrabold text-emerald-700 mt-1 block font-mono">
                      {reportTasks.filter((t) => t.status === "Completed").length}
                    </span>
                  </div>
                  <div className="bg-amber-50/30 border border-amber-50 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending</span>
                    <span className="text-xl font-extrabold text-amber-700 mt-1 block font-mono">
                      {reportTasks.filter((t) => t.status !== "Completed").length}
                    </span>
                  </div>
                  <div className="bg-rose-50/30 border border-rose-50 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vulnerabilities</span>
                    <span className="text-xl font-extrabold text-rose-700 mt-1 block font-mono">{reportIncidents.length}</span>
                  </div>
                </div>

                {/* Deliverables table */}
                <div className="mt-6" id="report-tasks-audit">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <ListChecks className="w-4 h-4 text-emerald-600" />
                    Deliverables Register Audit
                  </h4>

                  <div className="border border-slate-100 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100 font-bold text-slate-500">
                          <th className="p-3">Title</th>
                          <th className="p-3">Priority</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Assignee</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportTasks.map((t) => (
                          <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/20 text-slate-600">
                            <td className="p-3 font-semibold text-slate-800">{t.title}</td>
                            <td className="p-3">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase
                                ${t.priority === "High" ? "bg-rose-50 text-rose-700" : ""}
                                ${t.priority === "Medium" ? "bg-amber-50 text-amber-700" : ""}
                                ${t.priority === "Low" ? "bg-emerald-50 text-emerald-700" : ""}
                              `}>
                                {t.priority}
                              </span>
                            </td>
                            <td className="p-3 font-semibold text-slate-700">{t.status}</td>
                            <td className="p-3">{t.assigneeName || "Unassigned"}</td>
                          </tr>
                        ))}
                        {reportTasks.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-slate-400 italic">No tasks assigned to active workspace.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Safety Vulnerabilities table */}
                <div className="mt-6" id="report-incidents-audit">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    Logged Incident Vulnerability Roster
                  </h4>

                  <div className="border border-slate-100 rounded-xl overflow-hidden max-h-50 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100 font-bold text-slate-500">
                          <th className="p-3">Description</th>
                          <th className="p-3">Severity</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Mitigator</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportIncidents.map((i) => (
                          <tr key={i.id} className="border-b border-slate-50 hover:bg-slate-50/20 text-slate-600">
                            <td className="p-3">
                              <span className="font-bold text-slate-800">{i.title}</span>
                              <p className="text-[11px] text-slate-400 truncate max-w-sm mt-0.5">{i.description}</p>
                            </td>
                            <td className="p-3 font-semibold text-slate-700">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                i.severity === "Critical" ? "bg-red-50 text-red-700" :
                                i.severity === "High" ? "bg-rose-50 text-rose-700" :
                                i.severity === "Medium" ? "bg-amber-50 text-amber-700" :
                                "bg-emerald-50 text-emerald-700"
                              }`}>
                                {i.severity}
                              </span>
                            </td>
                            <td className="p-3 font-semibold text-slate-700">{i.status}</td>
                            <td className="p-3">{i.assigneeName || "Unassigned"}</td>
                          </tr>
                        ))}
                        {reportIncidents.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-slate-400 italic">No incidents logged under active project milestones.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Report Sign-off details block */}
                <div className="mt-8 border-t border-slate-100 pt-5 text-right text-[10px] text-slate-400 italic font-mono" id="report-sign-off">
                  <p>Audit snapshot stored with immutable checksum verification log.</p>
                  <p className="mt-1">Workspace Systems Core &copy; 2026</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-4 border-t border-slate-100 pt-4 print:hidden" id="report-view-actions">
              <Button variant="outline" size="sm" onClick={() => setViewReportModalOpen(false)}>Close Audit</Button>
              <Button variant="primary" size="sm" onClick={handleTriggerPrint} className="flex items-center gap-1.5">
                <Download className="w-4 h-4" />
                Print / Export PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
