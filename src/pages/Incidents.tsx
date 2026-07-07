import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldAlert,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Trash2,
  Edit,
  User,
  Activity,
  FolderKanban,
  FileText,
  Search,
  Filter,
  Check
} from "lucide-react";
import { useToast } from "../components/ui/Toast.tsx";
import { useAuth } from "../context/AuthContext.tsx";
import { Project, Incident, User as DomainUser } from "../types.ts";
import Card from "../components/ui/Card.tsx";
import Button from "../components/ui/Button.tsx";
import Input from "../components/ui/Input.tsx";
import Modal from "../components/ui/Modal.tsx";
import Loader from "../components/ui/Loader.tsx";

export default function Incidents() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  // State flags
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingIncidents, setLoadingIncidents] = useState(false);

  // Modals state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);

  // Form states - Report Incident
  const [incTitle, setIncTitle] = useState("");
  const [incDesc, setIncDesc] = useState("");
  const [incSeverity, setIncSeverity] = useState<"Low" | "Medium" | "High" | "Critical">("High");
  const [incAssigneeId, setIncAssigneeId] = useState("");

  // Form states - Manage Incident (Update)
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [updateStatus, setUpdateStatus] = useState<"Open" | "In_Progress" | "Resolved" | "Closed">("Open");
  const [updateSeverity, setUpdateSeverity] = useState<"Low" | "Medium" | "High" | "Critical">("High");
  const [updateAssigneeId, setUpdateAssigneeId] = useState("");
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateDesc, setUpdateDesc] = useState("");

  // Filters
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const isManagerOrAdmin = user?.roleId === 1 || user?.roleId === 2;

  // 1. Fetch All Projects
  const fetchProjects = async (selectFirst = false) => {
    try {
      setLoadingProjects(true);
      const res = await axios.get("/api/projects");
      const list = res.data.projects || [];
      setProjects(list);

      if (list.length > 0) {
        if (selectFirst || !selectedProject) {
          handleSelectProject(list[0]);
        } else {
          const updated = list.find((p: Project) => p.id === selectedProject.id);
          if (updated) {
            setSelectedProject(updated);
          }
        }
      } else {
        setSelectedProject(null);
        setIncidents([]);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to load project database", "error");
    } finally {
      setLoadingProjects(false);
    }
  };

  // 2. Fetch Project Incidents & details
  const handleSelectProject = async (project: Project) => {
    setSelectedProject(project);
    setLoadingIncidents(true);
    try {
      // Refresh detailed project to ensure roster info is up-to-date
      const projRes = await axios.get(`/api/projects/${project.id}`);
      setSelectedProject(projRes.data.project);

      // Fetch incidents
      const incRes = await axios.get(`/api/incidents?projectId=${project.id}`);
      setIncidents(incRes.data.incidents || []);
    } catch (err) {
      console.error(err);
      showToast("Error retrieving incident logbook", "error");
    } finally {
      setLoadingIncidents(false);
    }
  };

  useEffect(() => {
    fetchProjects(true);
  }, []);

  // 3. Report Incident Submit Handler
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    if (!incTitle.trim() || !incDesc.trim()) {
      showToast("Please provide incident title and descriptive summary", "warning");
      return;
    }

    try {
      await axios.post("/api/incidents", {
        title: incTitle,
        description: incDesc,
        projectId: selectedProject.id,
        severity: incSeverity,
        assigneeId: incAssigneeId ? parseInt(incAssigneeId, 10) : null,
      });
      showToast("Incident report logged in system registry", "success");
      setReportModalOpen(false);
      
      // Reset forms
      setIncTitle("");
      setIncDesc("");
      setIncSeverity("High");
      setIncAssigneeId("");

      handleSelectProject(selectedProject);
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || "Failed to log incident report", "error");
    }
  };

  // 4. Update/Manage Incident Submit Handler
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIncident || !selectedProject) return;

    try {
      await axios.put(`/api/incidents/${activeIncident.id}`, {
        title: updateTitle,
        description: updateDesc,
        status: updateStatus,
        severity: updateSeverity,
        assigneeId: updateAssigneeId ? parseInt(updateAssigneeId, 10) : null,
      });
      showToast("Incident entry updated successfully", "success");
      setManageModalOpen(false);
      handleSelectProject(selectedProject);
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || "Failed to update incident entry", "error");
    }
  };

  // 5. Delete Incident Action
  const handleDeleteIncident = async (incidentId: number) => {
    if (!selectedProject) return;
    if (!window.confirm("Are you absolutely sure you want to permanently delete this incident report?")) {
      return;
    }

    try {
      await axios.delete(`/api/incidents/${incidentId}`);
      showToast("Incident record removed from logbook", "success");
      setManageModalOpen(false);
      handleSelectProject(selectedProject);
    } catch (err) {
      console.error(err);
      showToast("Failed to delete incident entry", "error");
    }
  };

  const openManageIncident = (incident: Incident) => {
    setActiveIncident(incident);
    setUpdateTitle(incident.title);
    setUpdateDesc(incident.description);
    setUpdateStatus(incident.status);
    setUpdateSeverity(incident.severity);
    setUpdateAssigneeId(incident.assigneeId ? incident.assigneeId.toString() : "");
    setManageModalOpen(true);
  };

  // Severity style helper
  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case "Critical":
        return "bg-rose-500/10 text-rose-600 border-rose-200 font-extrabold";
      case "High":
        return "bg-orange-500/10 text-orange-600 border-orange-200 font-bold";
      case "Medium":
        return "bg-amber-500/10 text-amber-600 border-amber-200 font-semibold";
      default:
        return "bg-emerald-500/10 text-emerald-600 border-emerald-200 font-semibold";
    }
  };

  // Status style helper
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-red-50 text-red-700 border-red-100 font-bold";
      case "In_Progress":
        return "bg-blue-50 text-blue-700 border-blue-100 font-semibold";
      case "Resolved":
        return "bg-emerald-50 text-emerald-700 border-emerald-100 font-semibold";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200 font-medium";
    }
  };

  // Filters execution
  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch =
      inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inc.assigneeName && inc.assigneeName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSeverity = severityFilter === "All" || inc.severity === severityFilter;
    const matchesStatus = statusFilter === "All" || inc.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-6rem)]" id="incidents-workspace-wrapper">
      
      {/* ---------------------------------------------------- */}
      {/* LEFT COLUMN: PROJECTS SELECTION                      */}
      {/* ---------------------------------------------------- */}
      <div 
        id="incidents-projects-sidebar"
        className="w-full md:w-80 flex-shrink-0 bg-white border border-slate-100 rounded-2xl flex flex-col overflow-hidden shadow-xs"
      >
        <div className="p-4 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-rose-500" />
            <span className="text-sm font-bold text-slate-800 uppercase tracking-tight">Active Rosters</span>
          </div>
        </div>

        {/* Project Directories List */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2" id="projects-directory-list">
          {loadingProjects ? (
            <div className="py-12 flex flex-col items-center gap-2">
              <Loader size="sm" />
              <span className="text-xs text-slate-400">Loading rosters...</span>
            </div>
          ) : projects.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No projects established.</div>
          ) : (
            projects.map((project) => {
              const isSelected = selectedProject?.id === project.id;
              return (
                <button
                  key={project.id}
                  onClick={() => handleSelectProject(project)}
                  id={`project-item-${project.id}`}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group
                    ${
                      isSelected
                        ? "bg-rose-50/20 border-rose-200 shadow-xs text-rose-950 font-bold"
                        : "bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200"
                    }`}
                >
                  <div className="flex flex-col gap-1.5 overflow-hidden">
                    <span className="text-sm font-bold text-slate-800 truncate group-hover:text-rose-600 transition-colors">
                      {project.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium truncate">
                      {project.description || "No description provided."}
                    </span>
                  </div>
                  <ShieldAlert className={`w-4.5 h-4.5 flex-shrink-0 ${isSelected ? "text-rose-600" : "text-slate-300"}`} />
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* RIGHT SIDE: INCIDENTS LOGBOOK BOARD                  */}
      {/* ---------------------------------------------------- */}
      <div 
        id="incidents-board-pane"
        className="flex-1 flex flex-col bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs"
      >
        {selectedProject ? (
          <>
            {/* Incident Workspace Header */}
            <div className="p-5 border-b border-slate-50 bg-slate-50/10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-rose-600 animate-pulse" />
                  <h2 className="text-lg font-extrabold text-slate-800 tracking-tight" id="active-project-name">
                    Risk Assessment Logbook
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Project: <span className="font-semibold text-slate-700">{selectedProject.name}</span> &nbsp;|&nbsp; Enlist, classify, and mitigate safety and technical vulnerabilities.
                </p>
              </div>

              <Button
                variant="danger"
                size="sm"
                onClick={() => setReportModalOpen(true)}
                className="flex items-center gap-1.5 shadow-md shadow-rose-200"
                id="report-incident-board-btn"
              >
                <Plus className="w-4 h-4" />
                Report Incident
              </Button>
            </div>

            {/* Filter and Search Bar Row */}
            <div className="px-5 py-3 border-b border-slate-50 bg-slate-50/5 flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search logs by keyword or assignee..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 text-slate-800 transition-all"
                  id="incident-log-search-input"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Severity:</span>
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
                    id="severity-filter-select"
                  >
                    <option value="All">All Severities</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
                    id="status-filter-select"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Open">Open</option>
                    <option value="In_Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Incidents Grid/List container */}
            <div className="flex-1 overflow-y-auto p-5" id="incidents-logs-list-pane">
              {loadingIncidents ? (
                <div className="h-full flex flex-col items-center justify-center gap-3">
                  <Loader size="lg" />
                  <span className="text-xs text-slate-400">Loading risk assessment records...</span>
                </div>
              ) : filteredIncidents.length === 0 ? (
                <div className="py-24 text-center" id="incidents-empty-view">
                  <CheckCircle2 className="w-16 h-16 text-emerald-500/20 mx-auto mb-3 animate-bounce" />
                  <h3 className="text-base font-bold text-slate-800">No Logged Risk Incidents</h3>
                  <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                    This project workspace is fully pristine. There are no active threats or safety failures logged under this roster.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="incidents-items-grid">
                  {filteredIncidents.map((inc) => (
                    <div
                      key={inc.id}
                      onClick={() => openManageIncident(inc)}
                      id={`incident-card-${inc.id}`}
                      className="bg-white border border-slate-100 hover:border-slate-200 hover:shadow-xs rounded-xl p-4 transition-all cursor-pointer flex flex-col gap-3 group relative"
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* Quick Severity change dropdown */}
                        <div onClick={(e) => e.stopPropagation()} className="relative">
                          <select
                            value={inc.severity}
                            disabled={!isManagerOrAdmin}
                            onChange={async (e) => {
                              try {
                                await axios.put(`/api/incidents/${inc.id}`, { severity: e.target.value });
                                showToast(`Incident severity updated to ${e.target.value}`, "success");
                                handleSelectProject(selectedProject!);
                              } catch (err: any) {
                                console.error(err);
                                showToast(err.response?.data?.error || "Failed to update severity", "error");
                              }
                            }}
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase cursor-pointer outline-none transition-colors ${getSeverityStyle(inc.severity)} disabled:cursor-not-allowed`}
                            id={`inc-severity-selector-${inc.id}`}
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                          </select>
                        </div>
                        
                        {/* Quick Status change dropdown */}
                        <div onClick={(e) => e.stopPropagation()} className="relative">
                          <select
                            value={inc.status}
                            onChange={async (e) => {
                              try {
                                await axios.put(`/api/incidents/${inc.id}`, { status: e.target.value });
                                showToast(`Incident status updated to ${e.target.value.replace("_", " ")}`, "success");
                                handleSelectProject(selectedProject!);
                              } catch (err: any) {
                                console.error(err);
                                showToast(err.response?.data?.error || "Failed to update status", "error");
                              }
                            }}
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase cursor-pointer outline-none transition-colors ${getStatusStyle(inc.status)}`}
                            id={`inc-status-selector-${inc.id}`}
                          >
                            <option value="Open">Open</option>
                            <option value="In_Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Closed">Closed</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-rose-600 transition-colors">
                          {inc.title}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {inc.description}
                        </p>
                      </div>

                      <div className="border-t border-slate-50 pt-3 flex items-center justify-between text-[10px] text-slate-400 mt-1.5 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Logged: {new Date(inc.createdAt).toLocaleDateString()}
                        </span>

                        {/* Quick Assignee change dropdown */}
                        <div 
                          onClick={(e) => e.stopPropagation()} 
                          className="flex items-center gap-1.5 text-slate-500 font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-100 px-2 py-0.5 rounded-full max-w-[140px] transition-all cursor-pointer"
                        >
                          <User className="w-3 h-3 text-slate-400" />
                          <select
                            value={inc.assigneeId || ""}
                            disabled={!isManagerOrAdmin}
                            onChange={async (e) => {
                              try {
                                const val = e.target.value ? parseInt(e.target.value, 10) : null;
                                await axios.put(`/api/incidents/${inc.id}`, { assigneeId: val });
                                showToast("Incident assignee updated successfully", "success");
                                handleSelectProject(selectedProject!);
                              } catch (err: any) {
                                console.error(err);
                                showToast(err.response?.data?.error || "Failed to update assignee", "error");
                              }
                            }}
                            className="text-[10px] bg-transparent text-slate-500 font-semibold cursor-pointer outline-none border-none p-0 w-full truncate disabled:cursor-not-allowed"
                            id={`inc-assignee-selector-${inc.id}`}
                          >
                            <option value="">Unassigned</option>
                            {selectedProject?.members?.map((m) => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center p-12 text-center" id="board-empty-pane">
            <ShieldAlert className="w-16 h-16 text-rose-600/20 mb-4 animate-bounce" />
            <h3 className="text-base font-bold text-slate-800">Risk Assessment Roster</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-sm leading-relaxed">
              Enlist or choose a project workspace from the left directory to track ongoing risk, safety mitigations, and issue resolutions.
            </p>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* MODALS SECTION                                       */}
      {/* ---------------------------------------------------- */}

      {/* 1. Report Incident Modal */}
      <Modal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="Report System Safety Incident"
        size="md"
      >
        {selectedProject && (
          <form onSubmit={handleReportSubmit} className="flex flex-col gap-4" id="incident-report-form">
            <Input
              id="inc-title-input"
              label="Incident Title"
              placeholder="e.g. Memory leak in production pod container"
              value={incTitle}
              onChange={(e) => setIncTitle(e.target.value)}
              required
            />

            <div className="flex flex-col gap-1.5" id="inc-desc-field">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Descriptive Summary & Impact</label>
              <textarea
                value={incDesc}
                onChange={(e) => setIncDesc(e.target.value)}
                placeholder="List context, error logs, replicas affected, and immediate safety steps..."
                className="w-full min-h-24 px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 text-slate-800"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4" id="inc-fields-row">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Severity Classification</label>
                <select
                  value={incSeverity}
                  onChange={(e) => setIncSeverity(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none"
                >
                  <option value="Critical">🚨 Critical Impact</option>
                  <option value="High">🔴 High Priority</option>
                  <option value="Medium">🟡 Medium Impact</option>
                  <option value="Low">🟢 Low Impact</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Assignee Mitigator</label>
                <select
                  value={incAssigneeId}
                  onChange={(e) => setIncAssigneeId(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {selectedProject.members?.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.roleName})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-4 border-t border-slate-100 pt-4" id="report-actions">
              <Button variant="outline" size="sm" onClick={() => setReportModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="danger" size="sm">
                Submit Report
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* 2. Manage/Update Incident Modal (For resolution and assignments) */}
      <Modal
        isOpen={manageModalOpen}
        onClose={() => setManageModalOpen(false)}
        title="Manage Incident Mitigation"
        size="md"
      >
        {activeIncident && selectedProject && (
          <form onSubmit={handleUpdateSubmit} className="flex flex-col gap-4" id="incident-manage-form">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3" id="manage-title-section">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase">INCIDENT ID: #{activeIncident.id}</span>
                <h3 className="text-sm font-extrabold text-slate-800 mt-0.5">{activeIncident.title}</h3>
              </div>
              
              {isManagerOrAdmin && (
                <button
                  type="button"
                  onClick={() => handleDeleteIncident(activeIncident.id)}
                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                  title="Permanently remove incident entry"
                  id="delete-incident-report-btn"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Read-Only description if current user is Dev and didn't write it, but editable for manager/admin */}
            {isManagerOrAdmin ? (
              <>
                <Input
                  id="update-inc-title"
                  label="Title Summary"
                  value={updateTitle}
                  onChange={(e) => setUpdateTitle(e.target.value)}
                  required
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Vulnerability Logs / Description</label>
                  <textarea
                    value={updateDesc}
                    onChange={(e) => setUpdateDesc(e.target.value)}
                    className="w-full min-h-24 px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none"
                    required
                  />
                </div>
              </>
            ) : (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100" id="dev-read-only-description">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Impact details</span>
                <p className="text-xs text-slate-600 leading-relaxed">{activeIncident.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4" id="manage-fields-grid">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Incident Mitigator</label>
                <select
                  value={updateAssigneeId}
                  onChange={(e) => setUpdateAssigneeId(e.target.value)}
                  disabled={!isManagerOrAdmin}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none disabled:bg-slate-50 disabled:cursor-not-allowed"
                >
                  <option value="">Unassigned</option>
                  {selectedProject.members?.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.roleName})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Severity Classification</label>
                <select
                  value={updateSeverity}
                  onChange={(e) => setUpdateSeverity(e.target.value as any)}
                  disabled={!isManagerOrAdmin}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none disabled:bg-slate-50 disabled:cursor-not-allowed"
                >
                  <option value="Critical">🚨 Critical</option>
                  <option value="High">🔴 High</option>
                  <option value="Medium">🟡 Medium</option>
                  <option value="Low">🟢 Low</option>
                </select>
              </div>
            </div>

            {/* Status updates is allowed for both managers AND assigned devs! */}
            <div className="flex flex-col gap-1.5" id="update-status-field">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Resolution Status</label>
              <select
                value={updateStatus}
                onChange={(e) => setUpdateStatus(e.target.value as any)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none"
              >
                <option value="Open">🔴 Open Incident</option>
                <option value="In_Progress">🔵 Active Mitigation (In Progress)</option>
                <option value="Resolved">🟢 Resolved Threat</option>
                <option value="Closed">⚫ Closed Entry</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 mt-4 border-t border-slate-100 pt-4" id="manage-actions">
              <Button variant="outline" size="sm" onClick={() => setManageModalOpen(false)}>Close</Button>
              <Button type="submit" variant="primary" size="sm">
                Save Adjustments
              </Button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
}
