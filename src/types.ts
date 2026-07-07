// TeamFlow: Client-Side TypeScript Domain Models

export interface Role {
  id: number;
  name: "Admin" | "Manager" | "Developer";
  description: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  roleId: number;
  roleName: string;
  createdAt?: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  managerId: number;
  managerName?: string;
  status: "Active" | "Closed";
  membersCount?: number;
  createdAt: string;
  updatedAt: string;
  members?: User[];
}

export interface Task {
  id: number;
  title: string;
  description: string;
  projectId: number;
  assigneeId: number | null;
  assigneeName?: string;
  status: "To Do" | "In Progress" | "Review" | "Completed";
  priority: "Low" | "Medium" | "High";
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  dependencies?: { id: number; title: string; status: string }[];
}

export interface Incident {
  id: number;
  title: string;
  description: string;
  projectId: number;
  projectName?: string;
  status: "Open" | "In_Progress" | "Resolved" | "Closed";
  severity: "Low" | "Medium" | "High" | "Critical";
  assigneeId: number | null;
  assigneeName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  isRead: boolean;
  type: "Task Assigned" | "Task Completed" | "Project Updated" | "Incident Assigned";
  createdAt: string;
}

export interface DashboardStats {
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
}

export interface DashboardCharts {
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
}
