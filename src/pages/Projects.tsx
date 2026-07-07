import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "motion/react";
import {
  FolderKanban,
  Plus,
  Search,
  Users,
  Clock,
  Trash2,
  Edit,
  User,
  PlusCircle,
  MinusCircle,
  Calendar,
  AlertCircle,
  CheckCircle2,
  X,
  Play,
  RotateCcw,
  Check,
  Eye,
  Paperclip,
  Share2,
  GitBranch,
  LayoutGrid,
  List
} from "lucide-react";
import { useToast } from "../components/ui/Toast.tsx";
import { useAuth } from "../context/AuthContext.tsx";
import { Project, Task, User as DomainUser } from "../types.ts";
import Card from "../components/ui/Card.tsx";
import Button from "../components/ui/Button.tsx";
import Input from "../components/ui/Input.tsx";
import Modal from "../components/ui/Modal.tsx";
import Loader from "../components/ui/Loader.tsx";

const getAvatarColor = (roleName?: string, name?: string) => {
  if (roleName === "Admin") return "bg-rose-500 text-white";
  if (roleName === "Manager") return "bg-indigo-600 text-white";
  
  if (!name) return "bg-slate-500 text-white";
  const charCode = name.charCodeAt(0) + (name.charCodeAt(1) || 0);
  const colors = [
    "bg-emerald-600 text-white",
    "bg-teal-600 text-white",
    "bg-blue-600 text-white",
    "bg-cyan-600 text-white",
    "bg-violet-600 text-white",
    "bg-fuchsia-600 text-white",
    "bg-amber-600 text-white",
  ];
  return colors[charCode % colors.length];
};

export default function Projects() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [systemUsers, setSystemUsers] = useState<DomainUser[]>([]);

  // State flags
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Modals state
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [taskDetailModalOpen, setTaskDetailModalOpen] = useState(false);
  const [dependencyModalOpen, setDependencyModalOpen] = useState(false);

  // Form states - Project
  const [projName, setProjName] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projStatus, setProjStatus] = useState<"Active" | "Closed">("Active");

  // Form states - Task
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskAssigneeId, setTaskAssigneeId] = useState<string>("");
  const [taskPriority, setTaskPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [taskDueDate, setTaskDueDate] = useState("");

  // Selected entities for actions
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Filters & Search
  const [taskSearchQuery, setTaskSearchQuery] = useState("");
  const [taskPriorityFilter, setTaskPriorityFilter] = useState("All");
  const [taskStatusFilter, setTaskStatusFilter] = useState("All");
  const [taskAssigneeFilter, setTaskAssigneeFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
          // Keep current selected project updated
          const updatedSelected = list.find((p: Project) => p.id === selectedProject.id);
          if (updatedSelected) {
            setSelectedProject(updatedSelected);
          }
        }
      } else {
        setSelectedProject(null);
        setTasks([]);
      }
    } catch (err: any) {
      console.error(err);
      showToast("Failed to retrieve projects list", "error");
    } finally {
      setLoadingProjects(false);
    }
  };

  // 2. Fetch Project Details & Workspace Tasks
  const handleSelectProject = async (project: Project) => {
    setSelectedProject(project);
    setLoadingTasks(true);
    try {
      // Get detailed project with members info
      const projRes = await axios.get(`/api/projects/${project.id}`);
      setSelectedProject(projRes.data.project);

      // Get tasks associated with this project
      const tasksRes = await axios.get(`/api/tasks?projectId=${project.id}`);
      setTasks(tasksRes.data.tasks || []);
    } catch (err: any) {
      console.error(err);
      showToast("Error synchronizing project dashboard", "error");
    } finally {
      setLoadingTasks(false);
    }
  };

  // 3. Fetch All System Users (for roster assignment dropdown options)
  const fetchSystemUsers = async () => {
    try {
      const res = await axios.get("/api/auth/users");
      setSystemUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProjects(true);
    fetchSystemUsers();
  }, []);

  // 4. Create or Edit Project handler
  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) {
      showToast("Please provide a project name", "warning");
      return;
    }

    try {
      if (isEditingProject && selectedProject) {
        await axios.put(`/api/projects/${selectedProject.id}`, {
          name: projName,
          description: projDesc,
          status: projStatus,
        });
        showToast("Project configurations updated successfully", "success");
      } else {
        const res = await axios.post("/api/projects", {
          name: projName,
          description: projDesc,
        });
        showToast(`Project '${res.data.project.name}' established`, "success");
      }
      setProjectModalOpen(false);
      fetchProjects();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || "Failed to submit project", "error");
    }
  };

  const openEditProject = () => {
    if (!selectedProject) return;
    setIsEditingProject(true);
    setProjName(selectedProject.name);
    setProjDesc(selectedProject.description);
    setProjStatus(selectedProject.status);
    setProjectModalOpen(true);
  };

  const openCreateProject = () => {
    setIsEditingProject(false);
    setProjName("");
    setProjDesc("");
    setProjStatus("Active");
    setProjectModalOpen(true);
  };

  // Delete Project Action
  const handleDeleteProject = async () => {
    if (!selectedProject) return;
    if (!window.confirm(`Are you absolutely sure you want to delete '${selectedProject.name}'? All project tasks and logs will be permanently deleted.`)) {
      return;
    }

    try {
      await axios.delete(`/api/projects/${selectedProject.id}`);
      showToast(`Deleted project '${selectedProject.name}'`, "success");
      setSelectedProject(null);
      fetchProjects(true);
    } catch (err) {
      console.error(err);
      showToast("Failed to delete project", "error");
    }
  };

  // 5. Add Task Handler
  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    if (!taskTitle.trim()) {
      showToast("Please provide a task title", "warning");
      return;
    }

    try {
      if (isEditingTask && activeTask) {
        await axios.put(`/api/tasks/${activeTask.id}`, {
          title: taskTitle,
          description: taskDesc,
          assigneeId: taskAssigneeId ? parseInt(taskAssigneeId, 10) : null,
          priority: taskPriority,
          dueDate: taskDueDate || null,
        });
        showToast("Task updated successfully", "success");
      } else {
        await axios.post("/api/tasks", {
          title: taskTitle,
          description: taskDesc,
          projectId: selectedProject.id,
          assigneeId: taskAssigneeId ? parseInt(taskAssigneeId, 10) : null,
          priority: taskPriority,
          dueDate: taskDueDate || null,
        });
        showToast("Task added to project backlog", "success");
      }
      setTaskModalOpen(false);
      handleSelectProject(selectedProject);
    } catch (err: any) {
      console.error(err);
      showToast("Failed to submit task", "error");
    }
  };

  const openCreateTask = () => {
    setIsEditingTask(false);
    setTaskTitle("");
    setTaskDesc("");
    setTaskAssigneeId("");
    setTaskPriority("Medium");
    setTaskDueDate("");
    setTaskModalOpen(true);
  };

  const openEditTask = (task: Task) => {
    setIsEditingTask(true);
    setActiveTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description);
    setTaskAssigneeId(task.assigneeId ? task.assigneeId.toString() : "");
    setTaskPriority(task.priority);
    setTaskDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
    setTaskModalOpen(true);
  };

  // Delete Task Action
  const handleDeleteTask = async (taskId: number) => {
    if (!selectedProject) return;
    if (!window.confirm("Delete this task?")) return;

    try {
      await axios.delete(`/api/tasks/${taskId}`);
      showToast("Task removed successfully", "success");
      setTaskDetailModalOpen(false);
      handleSelectProject(selectedProject);
    } catch (err) {
      console.error(err);
      showToast("Failed to delete task", "error");
    }
  };

  // 6. Project Members Add/Remove Management
  const handleAddMember = async (userId: number) => {
    if (!selectedProject) return;
    try {
      await axios.post(`/api/projects/${selectedProject.id}/members`, { userId });
      showToast("Member enrolled in project workspace roster", "success");
      handleSelectProject(selectedProject);
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || "Failed to enroll member", "error");
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!selectedProject) return;
    try {
      await axios.delete(`/api/projects/${selectedProject.id}/members/${userId}`);
      showToast("Member dismissed from roster", "success");
      handleSelectProject(selectedProject);
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || "Failed to remove member", "error");
    }
  };

  // 7. Change Task status with rapid single click API calls
  const handleTaskStatusTransition = async (task: Task, newStatus: "To Do" | "In Progress" | "Review" | "Completed") => {
    try {
      await axios.put(`/api/tasks/${task.id}/status`, { status: newStatus });
      showToast(`Task moved to ${newStatus}`, "success");
      if (selectedProject) {
        handleSelectProject(selectedProject);
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || "Dependency block active! Check requirements.", "error");
    }
  };

  // Quick Change Priority with rapid single click API calls
  const handleTaskPriorityTransition = async (task: Task, newPriority: "Low" | "Medium" | "High") => {
    try {
      await axios.put(`/api/tasks/${task.id}`, { priority: newPriority });
      showToast(`Task priority updated to ${newPriority}`, "success");
      if (selectedProject) {
        handleSelectProject(selectedProject);
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || "Failed to update task priority", "error");
    }
  };

  // 8. Task Dependencies Form Handlers
  const handleAddDependency = async (dependsOnTaskId: number) => {
    if (!activeTask || !selectedProject) return;
    try {
      await axios.post(`/api/tasks/${activeTask.id}/dependencies`, { dependsOnTaskId });
      showToast("Workspace dependency link added", "success");
      
      // Refresh detailed view & tasks list
      const tasksRes = await axios.get(`/api/tasks?projectId=${selectedProject.id}`);
      setTasks(tasksRes.data.tasks || []);
      const updatedTask = tasksRes.data.tasks.find((t: Task) => t.id === activeTask.id);
      if (updatedTask) {
        setActiveTask(updatedTask);
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || "Failed to map dependency link", "error");
    }
  };

  const handleRemoveDependency = async (dependsOnTaskId: number) => {
    if (!activeTask || !selectedProject) return;
    try {
      await axios.delete(`/api/tasks/${activeTask.id}/dependencies/${dependsOnTaskId}`);
      showToast("Workspace dependency removed", "success");

      // Refresh
      const tasksRes = await axios.get(`/api/tasks?projectId=${selectedProject.id}`);
      setTasks(tasksRes.data.tasks || []);
      const updatedTask = tasksRes.data.tasks.find((t: Task) => t.id === activeTask.id);
      if (updatedTask) {
        setActiveTask(updatedTask);
      }
    } catch (err: any) {
      console.error(err);
      showToast("Failed to remove dependency", "error");
    }
  };

  const handleOpenTaskDetails = (task: Task) => {
    setActiveTask(task);
    setTaskDetailModalOpen(true);
  };

  // Filters mapping
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(taskSearchQuery.toLowerCase())) ||
      (task.assigneeName && task.assigneeName.toLowerCase().includes(taskSearchQuery.toLowerCase()));

    const matchesPriority = taskPriorityFilter === "All" || task.priority === taskPriorityFilter;
    const matchesStatus = taskStatusFilter === "All" || task.status === taskStatusFilter;
    const matchesAssignee = taskAssigneeFilter === "All" || 
      (taskAssigneeFilter === "Unassigned" && !task.assigneeId) ||
      (taskAssigneeFilter !== "Unassigned" && task.assigneeId?.toString() === taskAssigneeFilter);

    return matchesSearch && matchesPriority && matchesStatus && matchesAssignee;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [taskSearchQuery, taskPriorityFilter, taskStatusFilter, taskAssigneeFilter, pageSize]);

  // Pagination calculations
  const totalItems = filteredTasks.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTasks = filteredTasks.slice(startIndex, startIndex + pageSize);

  const todoTasks = filteredTasks.filter((t) => t.status === "To Do");
  const progressTasks = filteredTasks.filter((t) => t.status === "In Progress");
  const reviewTasks = filteredTasks.filter((t) => t.status === "Review");
  const completedTasks = filteredTasks.filter((t) => t.status === "Completed");

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-6rem)]" id="projects-workspace-wrapper">
      
      {/* ---------------------------------------------------- */}
      {/* LEFT COLUMN: PROJECTS DIRECTORY                      */}
      {/* ---------------------------------------------------- */}
      <div 
        id="projects-directory-sidebar"
        className="w-full md:w-80 flex-shrink-0 bg-white border border-slate-100 rounded-2xl flex flex-col overflow-hidden shadow-xs"
      >
        <div className="p-4 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-indigo-600 animate-pulse" />
            <span className="text-sm font-bold text-slate-800 uppercase tracking-tight">Projects</span>
          </div>
          {isManagerOrAdmin && (
            <button
              onClick={openCreateProject}
              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
              title="Add Project"
              id="create-new-project-btn"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Projects List Container */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2" id="projects-directory-list">
          {loadingProjects ? (
            <div className="py-12 flex flex-col items-center gap-2">
              <Loader size="sm" />
              <span className="text-xs text-slate-400">Loading rosters...</span>
            </div>
          ) : projects.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-xs text-slate-400">No project established yet.</p>
              {isManagerOrAdmin && (
                <Button variant="outline" size="sm" className="mt-3" onClick={openCreateProject}>
                  Establish First Project
                </Button>
              )}
            </div>
          ) : (
            projects.map((project) => {
              const isSelected = selectedProject?.id === project.id;
              return (
                <button
                  key={project.id}
                  onClick={() => handleSelectProject(project)}
                  id={`project-item-${project.id}`}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 relative group
                    ${
                      isSelected
                        ? "bg-indigo-50/50 border-indigo-200 shadow-xs"
                        : "bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200"
                    }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      {project.name}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase
                      ${project.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {project.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {project.description || "No project description provided."}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-slate-50 pt-2.5 mt-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {project.membersCount || 0} members
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* RIGHT SIDE: SELECTED PROJECT KANBAN BOARD            */}
      {/* ---------------------------------------------------- */}
      <div 
        id="project-workspace-board-pane"
        className="flex-1 flex flex-col bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs"
      >
        {selectedProject ? (
          <>
            {/* Project Title / Quick details Bar */}
            <div className="p-5 border-b border-slate-50 bg-slate-50/10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-extrabold text-slate-800 tracking-tight" id="active-project-name">
                    {selectedProject.name}
                  </h2>
                  {isManagerOrAdmin && (
                    <div className="flex items-center gap-1" id="project-admin-actions">
                      <button
                        onClick={openEditProject}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                        title="Edit Project Name/Desc"
                        id="edit-project-settings-btn"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleDeleteProject}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                        title="Delete Project"
                        id="delete-project-btn"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {selectedProject.description || "No project description provided."}
                </p>
              </div>

              {/* Roster / Members view and Quick actions */}
              <div className="flex flex-wrap items-center gap-4" id="project-roster-section">
                {/* Visual Members Profile Overlap Row */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider select-none shrink-0">Roster:</span>
                  <div className="flex -space-x-1.5 overflow-visible items-center pl-1">
                    {selectedProject.members && selectedProject.members.length > 0 ? (
                      selectedProject.members.map((m) => (
                        <div
                          key={m.id}
                          className={`h-8 w-8 rounded-full ring-2 ring-white flex items-center justify-center text-[10px] font-extrabold cursor-pointer hover:scale-115 transition-transform hover:z-10 relative shadow-xs shrink-0 select-none ${getAvatarColor(m.roleName, m.name)}`}
                          title={`${m.name} (${m.roleName})`}
                        >
                          <span className="leading-none whitespace-nowrap">
                            {m.name.trim().split(/\s+/).slice(0, 2).map(n => n[0]).join("").toUpperCase()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 font-medium pl-1">No members enrolled</span>
                    )}
                  </div>
                  {isManagerOrAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMemberModalOpen(true)}
                      className="h-7 w-7 rounded-full p-0 flex items-center justify-center cursor-pointer ml-1.5"
                      title="Manage Workspace Roster"
                      id="manage-roster-btn"
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-600" />
                    </Button>
                  )}
                </div>

                <div className="h-6 w-px bg-slate-100 hidden lg:block" />

                {isManagerOrAdmin && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={openCreateTask}
                    className="flex items-center gap-1.5"
                    id="add-task-board-btn"
                  >
                    <Plus className="w-4 h-4" />
                    Add Task
                  </Button>
                )}
              </div>
            </div>

            {/* Sub Filter and Search Controls */}
            <div className="px-5 py-3 border-b border-slate-50 bg-slate-50/5 flex flex-col xl:flex-row items-center justify-between gap-3">
              <div className="relative w-full xl:w-72">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tasks, descriptions, or users..."
                  value={taskSearchQuery}
                  onChange={(e) => setTaskSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-800 transition-all"
                  id="task-board-search-input"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
                {/* Assignee Filter */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400 font-medium hidden md:inline">Assignee:</span>
                  <select
                    value={taskAssigneeFilter}
                    onChange={(e) => setTaskAssigneeFilter(e.target.value)}
                    className="px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none cursor-pointer"
                    id="assignee-filter-select"
                  >
                    <option value="All">All Assignees</option>
                    <option value="Unassigned">Unassigned</option>
                    {selectedProject.members?.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                {/* Priority Filter */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400 font-medium hidden md:inline">Priority:</span>
                  <select
                    value={taskPriorityFilter}
                    onChange={(e) => setTaskPriorityFilter(e.target.value)}
                    className="px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none cursor-pointer"
                    id="priority-filter-select"
                  >
                    <option value="All">All Priorities</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400 font-medium hidden md:inline">Status:</span>
                  <select
                    value={taskStatusFilter}
                    onChange={(e) => setTaskStatusFilter(e.target.value)}
                    className="px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none cursor-pointer"
                    id="status-filter-select"
                  >
                    <option value="All">All Statuses</option>
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div className="h-6 w-px bg-slate-100 mx-1 hidden xl:block" />

                {/* View Mode Toggle Buttons */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/50" id="view-mode-toggle">
                  <button
                    onClick={() => setViewMode("kanban")}
                    className={`p-1 rounded-md transition-all cursor-pointer ${viewMode === "kanban" ? "bg-white text-indigo-600 shadow-xs font-bold" : "text-slate-400 hover:text-slate-600"}`}
                    title="Kanban Board View"
                    id="kanban-view-btn"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-1 rounded-md transition-all cursor-pointer ${viewMode === "list" ? "bg-white text-indigo-600 shadow-xs font-bold" : "text-slate-400 hover:text-slate-600"}`}
                    title="Paginated List View"
                    id="list-view-btn"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* TASK VIEW PORT (KANBAN vs LIST) */}
            <div className="flex-1 overflow-y-auto bg-slate-50/30 flex flex-col" id="kanban-scroller-viewport">
              {loadingTasks ? (
                <div className="h-full flex-1 flex flex-col items-center justify-center gap-3">
                  <Loader size="lg" />
                  <span className="text-xs text-slate-400">Loading project task metrics...</span>
                </div>
              ) : viewMode === "kanban" ? (
                /* KANBAN BOARD VIEW */
                <div className="flex gap-4 min-w-[900px] h-full p-5" id="kanban-grid-cols">
                  {/* Status Column Builder Function */}
                  {[
                    { id: "To Do", title: "To Do", list: todoTasks, theme: "bg-slate-100/60 border-slate-100 text-slate-600" },
                    { id: "In Progress", title: "In Progress", list: progressTasks, theme: "bg-indigo-50/30 border-indigo-50 text-indigo-700" },
                    { id: "Review", title: "Review Board", list: reviewTasks, theme: "bg-amber-50/30 border-amber-50 text-amber-700" },
                    { id: "Completed", title: "Completed", list: completedTasks, theme: "bg-emerald-50/30 border-emerald-50 text-emerald-700" },
                  ].map((column) => (
                    <div
                      key={column.id}
                      className="flex-1 flex flex-col bg-slate-50/40 border border-slate-100 rounded-xl p-3.5 min-w-[220px]"
                      id={`kanban-col-${column.id.toLowerCase().replace(" ", "-")}`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${column.theme}`}>
                            {column.title}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">({column.list.length})</span>
                        </div>
                      </div>

                      {/* Tasks scrollable block inside column */}
                      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1" id={`column-scroller-${column.id}`}>
                        {column.list.length === 0 ? (
                          <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200/50 rounded-xl bg-white/20">
                            No tasks.
                          </div>
                        ) : (
                          column.list.map((task) => (
                            <div
                              key={task.id}
                              onClick={() => handleOpenTaskDetails(task)}
                              id={`task-card-${task.id}`}
                              className="bg-white border border-slate-100 hover:border-slate-200 hover:shadow-xs rounded-xl p-3.5 transition-all cursor-pointer group relative flex flex-col gap-2.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div onClick={(e) => e.stopPropagation()} className="relative">
                                  <select
                                    value={task.priority}
                                    onChange={(e) => handleTaskPriorityTransition(task, e.target.value as any)}
                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase cursor-pointer outline-none border border-transparent transition-colors
                                      ${task.priority === "High" ? "bg-rose-50 text-rose-700 hover:bg-rose-100" : ""}
                                      ${task.priority === "Medium" ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : ""}
                                      ${task.priority === "Low" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : ""}
                                    `}
                                    id={`task-priority-selector-${task.id}`}
                                  >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                  </select>
                                </div>
                                
                                {/* Status quick drop dropdown trigger inside card to avoid dragging failures on iframes */}
                                <div onClick={(e) => e.stopPropagation()} className="relative">
                                  <select
                                    value={task.status}
                                    onChange={(e) => handleTaskStatusTransition(task, e.target.value as any)}
                                    className="text-[10px] font-semibold text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md px-1.5 py-0.5 cursor-pointer outline-none"
                                    id={`task-status-selector-${task.id}`}
                                  >
                                    <option value="To Do">To Do</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Review">Review</option>
                                    <option value="Completed">Completed</option>
                                  </select>
                                </div>
                              </div>

                              <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                                {task.title}
                              </h4>

                              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                {task.description || "No detail description."}
                              </p>

                              <div className="flex items-center justify-between text-[10px] border-t border-slate-50 pt-2.5 mt-1 text-slate-400">
                                <span className="flex items-center gap-1 font-mono">
                                  <Calendar className="w-3 h-3" />
                                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString([], { month: "short", day: "numeric" }) : "No limit"}
                                </span>

                                <div className="flex items-center gap-1.5">
                                  {task.dependencies && task.dependencies.length > 0 && (
                                    <span className="flex items-center text-indigo-600 font-bold" title={`${task.dependencies.length} blocked requirements`}>
                                      <GitBranch className="w-3.5 h-3.5 mr-0.5 animate-pulse" />
                                      {task.dependencies.length}
                                    </span>
                                  )}
                                  <div className="flex items-center gap-1 text-slate-500 font-semibold bg-slate-50 px-1.5 py-0.5 rounded-full border border-slate-100">
                                    <User className="w-3 h-3" />
                                    <span className="truncate max-w-[64px]">{task.assigneeName || "Unassigned"}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* LIST/TABLE VIEW (PAGINATED) */
                <div className="flex-1 flex flex-col p-5 overflow-hidden" id="tasks-list-view-pane">
                  {totalItems === 0 ? (
                    <div className="flex-1 flex flex-col justify-center items-center py-16 border border-dashed border-slate-200 rounded-2xl bg-white m-2">
                      <List className="w-12 h-12 text-slate-300 mb-3" />
                      <p className="text-sm font-bold text-slate-700">No tasks match the active filters</p>
                      <p className="text-xs text-slate-400 mt-1">Try resetting your search query or dropdown filter settings.</p>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col justify-between" id="tasks-table-wrapper">
                      {/* Responsive Table Container */}
                      <div className="overflow-x-auto border border-slate-100 rounded-xl bg-white shadow-xs">
                        <table className="min-w-full divide-y divide-slate-100 text-left text-xs" id="tasks-list-table">
                          <thead className="bg-slate-50/60 font-bold text-slate-500 uppercase tracking-wider">
                            <tr>
                              <th className="px-4 py-3">Task Deliverable</th>
                              <th className="px-4 py-3">Assignee</th>
                              <th className="px-4 py-3 text-center">Priority</th>
                              <th className="px-4 py-3 text-center">Status</th>
                              <th className="px-4 py-3">Due Date</th>
                              <th className="px-4 py-3 text-center">Gates</th>
                              <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                            {paginatedTasks.map((task) => (
                              <tr
                                key={task.id}
                                className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                                onClick={() => handleOpenTaskDetails(task)}
                                id={`table-row-task-${task.id}`}
                              >
                                {/* Task Name & Description */}
                                <td className="px-4 py-3.5 max-w-xs md:max-w-sm">
                                  <div className="flex flex-col gap-1">
                                    <span className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                                      {task.title}
                                    </span>
                                    <span className="text-[11px] text-slate-400 line-clamp-1">
                                      {task.description || "No detail description."}
                                    </span>
                                  </div>
                                </td>

                                {/* Assignee */}
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-1.5 text-slate-600" onClick={(e) => e.stopPropagation()}>
                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                    <select
                                      value={task.assigneeId || ""}
                                      onChange={async (e) => {
                                        try {
                                          const val = e.target.value ? parseInt(e.target.value, 10) : null;
                                          await axios.put(`/api/tasks/${task.id}`, { assigneeId: val });
                                          showToast("Assignee updated successfully", "success");
                                          handleSelectProject(selectedProject!);
                                        } catch (err: any) {
                                          console.error(err);
                                          showToast(err.response?.data?.error || "Failed to update assignee", "error");
                                        }
                                      }}
                                      className="text-xs font-semibold text-slate-600 bg-transparent hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded px-1 py-0.5 cursor-pointer outline-none transition-all"
                                      id={`table-assignee-selector-${task.id}`}
                                    >
                                      <option value="">Unassigned</option>
                                      {selectedProject?.members?.map((m) => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                </td>

                                {/* Priority Dropdown Badge */}
                                <td className="px-4 py-3.5 text-center">
                                  <div onClick={(e) => e.stopPropagation()} className="inline-block">
                                    <select
                                      value={task.priority}
                                      onChange={(e) => handleTaskPriorityTransition(task, e.target.value as any)}
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase cursor-pointer outline-none border border-transparent transition-colors
                                        ${task.priority === "High" ? "bg-rose-50 text-rose-700 hover:bg-rose-100" : ""}
                                        ${task.priority === "Medium" ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : ""}
                                        ${task.priority === "Low" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : ""}
                                      `}
                                      id={`table-priority-selector-${task.id}`}
                                    >
                                      <option value="Low">Low</option>
                                      <option value="Medium">Medium</option>
                                      <option value="High">High</option>
                                    </select>
                                  </div>
                                </td>

                                {/* Status Dropdown Selector */}
                                <td className="px-4 py-3.5 text-center">
                                  <div onClick={(e) => e.stopPropagation()} className="inline-block">
                                    <select
                                      value={task.status}
                                      onChange={(e) => handleTaskStatusTransition(task, e.target.value as any)}
                                      className="text-[11px] font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md px-2 py-0.5 cursor-pointer outline-none"
                                      id={`table-status-selector-${task.id}`}
                                    >
                                      <option value="To Do">To Do</option>
                                      <option value="In Progress">In Progress</option>
                                      <option value="Review">Review</option>
                                      <option value="Completed">Completed</option>
                                    </select>
                                  </div>
                                </td>

                                {/* Due Date */}
                                <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" }) : "No limit"}
                                  </div>
                                </td>

                                {/* Dependency count */}
                                <td className="px-4 py-3.5 text-center font-mono font-bold text-[11px]">
                                  {task.dependencies && task.dependencies.length > 0 ? (
                                    <span className="inline-flex items-center text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md" title={`${task.dependencies.length} blocked requirements`}>
                                      <GitBranch className="w-3 h-3 mr-0.5" />
                                      {task.dependencies.length}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300">-</span>
                                  )}
                                </td>

                                {/* Quick actions */}
                                <td className="px-4 py-3.5 text-right">
                                  <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      onClick={() => handleOpenTaskDetails(task)}
                                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                      title="View specifications"
                                      id={`table-view-btn-${task.id}`}
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    {isManagerOrAdmin && (
                                      <>
                                        <button
                                          onClick={() => openEditTask(task)}
                                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded transition-colors"
                                          title="Edit details"
                                          id={`table-edit-btn-${task.id}`}
                                        >
                                          <Edit className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteTask(task.id)}
                                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                          title="Delete task"
                                          id={`table-delete-btn-${task.id}`}
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* PAGINATION CONTROLS PANELS */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-5 pt-4 border-t border-slate-100" id="table-pagination-controls">
                        {/* Summary metadata */}
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                          Showing {startIndex + 1} to {Math.min(startIndex + pageSize, totalItems)} of {totalItems} tasks
                        </span>

                        {/* Interactive Buttons block */}
                        <div className="flex items-center gap-3">
                          {/* Page Size select */}
                          <div className="flex items-center gap-1.5 mr-2">
                            <span className="text-[11px] text-slate-400 font-medium">Rows:</span>
                            <select
                              value={pageSize}
                              onChange={(e) => {
                                setPageSize(parseInt(e.target.value, 10));
                                setCurrentPage(1);
                              }}
                              className="px-2 py-1 text-xs bg-white border border-slate-200 rounded text-slate-600 outline-none cursor-pointer"
                              id="pagination-pagesize-select"
                            >
                              <option value="5">5</option>
                              <option value="10">10</option>
                              <option value="20">20</option>
                              <option value="50">50</option>
                            </select>
                          </div>

                          {/* Prev page button */}
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className={`px-2.5 py-1 text-xs font-bold border rounded-lg transition-colors cursor-pointer
                              ${currentPage === 1 ? "bg-slate-50 border-slate-100 text-slate-300 pointer-events-none" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                            id="pagination-prev-btn"
                          >
                            Prev
                          </button>

                          {/* Numeric pages list */}
                          <div className="flex items-center gap-1.5" id="pagination-pages-list">
                            {Array.from({ length: totalPages }).map((_, idx) => {
                              const pageNum = idx + 1;
                              const isSelected = pageNum === currentPage;
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setCurrentPage(pageNum)}
                                  className={`h-7 w-7 flex items-center justify-center text-xs font-bold rounded-lg transition-all cursor-pointer
                                    ${isSelected ? "bg-indigo-600 text-white shadow-xs" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                                  id={`pagination-page-btn-${pageNum}`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                          </div>

                          {/* Next page button */}
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className={`px-2.5 py-1 text-xs font-bold border rounded-lg transition-colors cursor-pointer
                              ${currentPage === totalPages ? "bg-slate-50 border-slate-100 text-slate-300 pointer-events-none" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                            id="pagination-next-btn"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center p-12 text-center" id="board-empty-pane">
            <FolderKanban className="w-16 h-16 text-indigo-600/30 mb-4 animate-bounce" />
            <h3 className="text-base font-bold text-slate-800">No Selected Workspace</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-sm leading-relaxed">
              Enlist or choose a project workspace from the left pane directory to map out tasks, milestones, and rosters.
            </p>
            {isManagerOrAdmin && (
              <Button variant="primary" size="sm" className="mt-4" onClick={openCreateProject}>
                Establish Project
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* MODALS SECTION                                       */}
      {/* ---------------------------------------------------- */}

      {/* 1. Establish/Configure Project Modal */}
      <Modal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        title={isEditingProject ? "Configure Project Settings" : "Establish New Project"}
        size="md"
      >
        <form onSubmit={handleProjectSubmit} className="flex flex-col gap-4" id="project-form">
          <Input
            id="proj-name-input"
            label="Project Name"
            placeholder="e.g. Apollo Engine Core"
            value={projName}
            onChange={(e) => setProjName(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5" id="proj-desc-field">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Project Objective & Context</label>
            <textarea
              value={projDesc}
              onChange={(e) => setProjDesc(e.target.value)}
              placeholder="Enumerate the goals, team guidelines, and scopes..."
              className="w-full min-h-24 px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-800"
            />
          </div>

          {isEditingProject && (
            <div className="flex flex-col gap-1.5" id="proj-status-field">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Project Lifecycle State</label>
              <select
                value={projStatus}
                onChange={(e) => setProjStatus(e.target.value as any)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              >
                <option value="Active">Active Workspace (Ongoing)</option>
                <option value="Closed">Closed / Archive (Finalized)</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 mt-4 border-t border-slate-100 pt-4" id="project-form-actions">
            <Button variant="outline" size="sm" onClick={() => setProjectModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm">
              {isEditingProject ? "Save Project" : "Establish Project"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Project Workspace Members Roster management Modal */}
      <Modal
        isOpen={memberModalOpen}
        onClose={() => setMemberModalOpen(false)}
        title="Workspace Roster Enrollment"
        size="md"
      >
        {selectedProject && (
          <div className="flex flex-col gap-5" id="members-modal-inner">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Current Project Members</h4>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto" id="current-roster-list">
                {selectedProject.members && selectedProject.members.length > 0 ? (
                  selectedProject.members.map((member) => (
                    <div
                      key={member.id}
                      className="p-2.5 border border-slate-100 bg-slate-50/20 rounded-xl flex items-center justify-between gap-3 text-xs"
                      id={`member-roster-item-${member.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-[9px]">
                          {member.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-800">{member.name}</span>
                          <span className="text-[10px] text-indigo-600 font-bold ml-2 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                            {member.roleName}
                          </span>
                        </div>
                      </div>
                      
                      {/* Admins/Managers can dismiss other roles, but not themselves unless they wish to leave */}
                      {member.id !== user?.id && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Dismiss from project roster"
                          id={`dismiss-member-${member.id}`}
                        >
                          <MinusCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 text-center py-4">No active members in roster.</span>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Add Workspace Associates</h4>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto" id="addable-roster-list">
                {systemUsers
                  .filter((su) => !selectedProject.members?.some((m) => m.id === su.id))
                  .map((su) => (
                    <div
                      key={su.id}
                      className="p-2.5 border border-slate-100 bg-white hover:bg-slate-50 rounded-xl flex items-center justify-between gap-3 text-xs"
                      id={`available-user-${su.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-700 text-[9px]">
                          {su.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-800">{su.name}</span>
                          <span className="text-[10px] text-slate-400 ml-2">{su.email}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddMember(su.id)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer flex items-center gap-1"
                        id={`add-member-${su.id}`}
                      >
                        <PlusCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 3. Create or Edit Task Modal */}
      <Modal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        title={isEditingTask ? "Edit Workspace Task" : "Add Task to Backlog"}
        size="md"
      >
        <form onSubmit={handleTaskSubmit} className="flex flex-col gap-4" id="task-creation-form">
          <Input
            id="task-title-input"
            label="Task Title"
            placeholder="e.g. Implement OIDC Authorization flows"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5" id="task-desc-field">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Functional Description</label>
            <textarea
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              placeholder="Map out deliverables, requirements, and testing criteria..."
              className="w-full min-h-24 px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-4" id="task-fields-row">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Roster Assignee</label>
              <select
                value={taskAssigneeId}
                onChange={(e) => setTaskAssigneeId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-indigo-100"
              >
                <option value="">Unassigned</option>
                {selectedProject?.members?.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Work Priority</label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as any)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5" id="task-due-field">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Due Date</label>
            <input
              type="date"
              value={taskDueDate}
              onChange={(e) => setTaskDueDate(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex items-center justify-end gap-3 mt-4 border-t border-slate-100 pt-4" id="task-form-actions">
            <Button variant="outline" size="sm" onClick={() => setTaskModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm">
              {isEditingTask ? "Save Task" : "Deploy Task"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 4. Complete Task Details & Dependency Workspace Modal */}
      <Modal
        isOpen={taskDetailModalOpen}
        onClose={() => setTaskDetailModalOpen(false)}
        title="Workspace Deliverable Specifications"
        size="lg"
      >
        {activeTask && (
          <div className="flex flex-col gap-5 text-slate-800" id="task-detail-container">
            <div className="flex items-start justify-between gap-4 border-b border-slate-50 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 leading-snug">{activeTask.title}</h3>
                <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase">
                  Project: {selectedProject?.name} &nbsp;|&nbsp; STATUS:{" "}
                  <span className="font-bold text-indigo-600">{activeTask.status}</span>
                </p>
              </div>

              {isManagerOrAdmin && (
                <div className="flex items-center gap-1.5 flex-shrink-0" id="task-detail-actions">
                  <Button
                    variant="outline"
                    size="sm"
                    className="p-2 h-8 w-8"
                    onClick={() => {
                      setTaskDetailModalOpen(false);
                      openEditTask(activeTask);
                    }}
                    title="Edit Task"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="p-2 h-8 w-8"
                    onClick={() => handleDeleteTask(activeTask.id)}
                    title="Delete Task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>

            {/* Task Description */}
            <div id="task-detail-desc">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Task Objective</h4>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                {activeTask.description || "No description provided for this workspace deliverable."}
              </p>
            </div>

            {/* Task Meta Stats Row */}
            <div className="grid grid-cols-3 gap-4 border-t border-b border-slate-50 py-4" id="task-meta-grid">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Assignee</span>
                <span className="text-xs font-semibold text-slate-700 mt-1 block">
                  {activeTask.assigneeName || "Unassigned"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Work Priority</span>
                <span className={`text-xs font-bold mt-1 block uppercase
                  ${activeTask.priority === "High" ? "text-rose-600" : ""}
                  ${activeTask.priority === "Medium" ? "text-amber-500" : ""}
                  ${activeTask.priority === "Low" ? "text-emerald-500" : ""}
                `}>
                  {activeTask.priority}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Target Due Limit</span>
                <span className="text-xs font-semibold text-slate-700 mt-1 block">
                  {activeTask.dueDate ? new Date(activeTask.dueDate).toLocaleDateString() : "No Due Date"}
                </span>
              </div>
            </div>

            {/* DEPENDENCY GATES MANAGER */}
            <div id="dependency-gates-box">
              <div className="flex items-center justify-between gap-4 mb-2.5">
                <div className="flex items-center gap-1.5">
                  <GitBranch className="w-4 h-4 text-indigo-600 animate-pulse" />
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dependency Gates</h4>
                </div>
                
                {/* Dependency additions button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDependencyModalOpen(true)}
                  className="text-xs py-1 px-2 gap-1"
                  id="add-dependency-btn"
                >
                  <Plus className="w-3 h-3" />
                  Map gate requirement
                </Button>
              </div>

              {/* Dependencies lists */}
              <div className="flex flex-col gap-2 max-h-40 overflow-y-auto" id="task-dependencies-list">
                {activeTask.dependencies && activeTask.dependencies.length > 0 ? (
                  activeTask.dependencies.map((dep) => (
                    <div
                      key={dep.id}
                      className="p-2.5 border border-slate-100 rounded-xl bg-slate-50/20 flex items-center justify-between text-xs"
                      id={`dep-item-${dep.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${dep.status === "Completed" ? "bg-emerald-500" : "bg-rose-500 animate-ping"}`} />
                        <div>
                          <span className="font-semibold text-slate-700">{dep.title}</span>
                          <span className={`text-[9px] font-bold ml-2.5 px-1.5 py-0.5 rounded-md uppercase
                            ${dep.status === "Completed" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                            {dep.status}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveDependency(dep.id)}
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Remove dependency gate"
                        id={`remove-dep-${dep.id}`}
                      >
                        <MinusCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50/10 rounded-xl border border-slate-100">
                    No active dependency gates. This deliverable can proceed freely.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-4 border-t border-slate-100 pt-4" id="task-detail-footer">
              <Button variant="secondary" size="sm" onClick={() => setTaskDetailModalOpen(false)}>Close Specifications</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 5. Map Dependency Gate Selection Modal */}
      <Modal
        isOpen={dependencyModalOpen}
        onClose={() => setDependencyModalOpen(false)}
        title="Map Dependency Gate"
        size="md"
      >
        {activeTask && (
          <div className="flex flex-col gap-4" id="dependency-modal-inner">
            <p className="text-xs text-slate-400 leading-relaxed">
              Select other project deliverables that must reach the <span className="font-semibold text-emerald-600">Completed</span> state before this task can be progressed.
            </p>

            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto" id="available-dependencies-list">
              {tasks
                .filter((t) => t.id !== activeTask.id && !activeTask.dependencies?.some((d) => d.id === t.id))
                .map((availableTask) => (
                  <div
                    key={availableTask.id}
                    className="p-3 border border-slate-100 hover:bg-slate-50 rounded-xl flex items-center justify-between gap-3 text-xs"
                    id={`available-dep-${availableTask.id}`}
                  >
                    <div>
                      <p className="font-bold text-slate-800 leading-snug">{availableTask.title}</p>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase">
                        Priority: {availableTask.priority} &nbsp;|&nbsp; Current State:{" "}
                        <span className="font-bold text-indigo-600">{availableTask.status}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddDependency(availableTask.id)}
                      className="text-xs py-1 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold rounded-lg cursor-pointer flex items-center gap-1 transition-all"
                      id={`link-dep-${availableTask.id}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Map Gate
                    </button>
                  </div>
                ))}

              {tasks.filter((t) => t.id !== activeTask.id && !activeTask.dependencies?.some((d) => d.id === t.id)).length === 0 && (
                <span className="text-xs text-slate-400 text-center py-6">No other deliverables to map.</span>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 mt-4 border-t border-slate-100 pt-4" id="dependency-footer">
              <Button variant="secondary" size="sm" onClick={() => setDependencyModalOpen(false)}>Done</Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
