import { Response } from "express";
import { prisma } from "../db/prisma.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { TaskStatus, TaskPriority } from "@prisma/client";

const STATUS_FROM_PRISMA = {
  [TaskStatus.TO_DO]: "To Do",
  [TaskStatus.IN_PROGRESS]: "In Progress",
  [TaskStatus.REVIEW]: "Review",
  [TaskStatus.COMPLETED]: "Completed"
} as const;

function toClientStatus(status: TaskStatus): "To Do" | "In Progress" | "Review" | "Completed" {
  return (STATUS_FROM_PRISMA[status] || "To Do") as any;
}

const PRIORITY_FROM_PRISMA = {
  [TaskPriority.LOW]: "Low",
  [TaskPriority.MEDIUM]: "Medium",
  [TaskPriority.HIGH]: "High"
} as const;

function toClientPriority(priority: TaskPriority): "Low" | "Medium" | "High" {
  return (PRIORITY_FROM_PRISMA[priority] || "Medium") as any;
}

export class ReportController {
  // Get dashboard statistics (summary metrics + chart counts)
  static async getDashboardStats(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized." });
      }

      const myUserId = req.user.id;
      const isAdmin = req.user.roleId === 1;

      // 1. Fetch Projects based on role accessibility
      let projects;
      if (isAdmin) {
        projects = await prisma.project.findMany({
          include: {
            manager: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        });
      } else {
        projects = await prisma.project.findMany({
          where: {
            OR: [
              { managerId: myUserId },
              {
                members: {
                  some: {
                    userId: myUserId
                  }
                }
              }
            ]
          },
          include: {
            manager: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        });
      }

      const projectIds = projects.map(p => p.id);

      // 2. Fetch Tasks belonging to accessible projects
      const tasks = await prisma.task.findMany({
        where: {
          projectId: { in: projectIds }
        },
        include: {
          assignee: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // 3. Fetch Incidents belonging to accessible projects
      const incidents = await prisma.incident.findMany({
        where: {
          projectId: { in: projectIds }
        },
        include: {
          assignee: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // 4. Calculate stats
      const totalProjects = projects.length;
      const activeProjects = projects.filter(p => p.status === "Active").length;
      const closedProjects = projects.filter(p => p.status === "Closed").length;

      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
      const pendingTasks = totalTasks - completedTasks;

      const totalIncidents = incidents.length;
      const openIncidents = incidents.filter(i => i.status === "Open" || i.status === "In_Progress").length;
      const resolvedIncidents = incidents.filter(i => i.status === "Resolved" || i.status === "Closed").length;

      // 5. Chart Data: Task status distribution
      const taskStatuses = {
        todo: tasks.filter(t => t.status === TaskStatus.TO_DO).length,
        inProgress: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
        review: tasks.filter(t => t.status === TaskStatus.REVIEW).length,
        completed: completedTasks
      };

      // 6. Chart Data: Task priority distribution
      const taskPriorities = {
        low: tasks.filter(t => t.priority === TaskPriority.LOW).length,
        medium: tasks.filter(t => t.priority === TaskPriority.MEDIUM).length,
        high: tasks.filter(t => t.priority === TaskPriority.HIGH).length
      };

      // 7. Chart Data: Incident severity distribution
      const incidentSeverities = {
        low: incidents.filter(i => i.severity === "Low").length,
        medium: incidents.filter(i => i.severity === "Medium").length,
        high: incidents.filter(i => i.severity === "High").length,
        critical: incidents.filter(i => i.severity === "Critical").length
      };

      // 8. Stagger recent tasks and incidents for timeline
      const recentTasksMapped = tasks.map(t => {
        const proj = projects.find(p => p.id === t.projectId);
        return {
          id: t.id,
          title: t.title,
          type: "Task" as const,
          projectName: proj ? proj.name : "Unknown",
          assigneeName: t.assignee ? t.assignee.name : "Unassigned",
          status: toClientStatus(t.status),
          createdAt: t.createdAt
        };
      });

      const recentIncidentsMapped = incidents.map(i => {
        const proj = projects.find(p => p.id === i.projectId);
        return {
          id: i.id,
          title: `⚠️ [Incident] ${i.title}`,
          type: "Incident" as const,
          projectName: proj ? proj.name : "Unknown",
          assigneeName: i.assignee ? i.assignee.name : "Unassigned",
          status: i.status.replace("_", " "),
          createdAt: i.createdAt
        };
      });

      const unifiedActivityStream = [...recentTasksMapped, ...recentIncidentsMapped]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5)
        .map(item => ({
          id: item.id,
          title: item.title,
          type: item.type,
          projectName: item.projectName,
          assigneeName: item.assigneeName,
          status: item.status,
          createdAt: item.createdAt.toISOString()
        }));

      // Map raw data arrays for interactive frontend reports
      const projectsListMapped = projects.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        createdAt: p.createdAt.toISOString(),
        managerName: p.manager ? p.manager.name : "Unknown",
        membersCount: p.members ? p.members.length : 0,
        members: p.members ? p.members.map(m => m.user.name) : []
      }));

      const tasksListMapped = tasks.map(t => {
        const proj = projects.find(p => p.id === t.projectId);
        return {
          id: t.id,
          title: t.title,
          description: t.description,
          projectId: t.projectId,
          projectName: proj ? proj.name : "Unknown",
          assigneeId: t.assigneeId,
          assigneeName: t.assignee ? t.assignee.name : "Unassigned",
          status: toClientStatus(t.status),
          priority: toClientPriority(t.priority),
          dueDate: t.dueDate ? t.dueDate.toISOString() : null,
          createdAt: t.createdAt.toISOString()
        };
      });

      const incidentsListMapped = incidents.map(i => {
        const proj = projects.find(p => p.id === i.projectId);
        return {
          id: i.id,
          title: i.title,
          description: i.description,
          projectId: i.projectId,
          projectName: proj ? proj.name : "Unknown",
          assigneeId: i.assigneeId,
          assigneeName: i.assignee ? i.assignee.name : "Unassigned",
          status: i.status.replace("_", " "),
          severity: i.severity,
          createdAt: i.createdAt.toISOString()
        };
      });

      return res.json({
        stats: {
          totalProjects,
          activeProjects,
          closedProjects,
          totalTasks,
          completedTasks,
          pendingTasks,
          totalIncidents,
          openIncidents,
          resolvedIncidents,
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        },
        charts: {
          taskStatuses,
          taskPriorities,
          incidentSeverities
        },
        recentActivity: unifiedActivityStream,
        projectsList: projectsListMapped,
        tasksList: tasksListMapped,
        incidentsList: incidentsListMapped
      });
    } catch (error: any) {
      console.error("Retrieve dashboard statistics failed:", error);
      return res.status(500).json({ error: error.message || "Failed to retrieve dashboard reports." });
    }
  }

  // Save/Create a report configuration
  static async saveReport(req: AuthenticatedRequest, res: Response) {
    try {
      const { title, queryParams } = req.body;
      const creatorId = req.user?.id;

      if (!title || !title.trim() || !creatorId) {
        return res.status(400).json({ error: "Report title and authentication are required." });
      }

      // Query params stored as a robust stringified JSON object
      const stringifiedParams = queryParams ? JSON.stringify(queryParams) : "{}";

      const report = await prisma.report.create({
        data: {
          title: title.trim(),
          queryParams: stringifiedParams,
          createdBy: creatorId
        }
      });

      return res.status(201).json({
        message: "Report saved successfully.",
        report: {
          id: report.id,
          title: report.title,
          queryParams: queryParams || {},
          createdBy: report.createdBy,
          createdAt: report.createdAt.toISOString()
        }
      });
    } catch (error: any) {
      console.error("Save report configuration failed:", error);
      return res.status(500).json({ error: error.message || "Failed to save report configuration." });
    }
  }

  // Retrieve saved reports
  static async getSavedReports(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized." });
      }

      const list = await prisma.report.findMany({
        where: { createdBy: req.user.id },
        orderBy: { createdAt: "desc" }
      });

      const reports = list.map(r => {
        let parsedParams = {};
        try {
          if (r.queryParams) {
            parsedParams = JSON.parse(r.queryParams);
          }
        } catch (e) {
          console.error("Failed to parse report query params:", e);
        }

        return {
          id: r.id,
          title: r.title,
          queryParams: parsedParams,
          createdBy: r.createdBy,
          createdAt: r.createdAt.toISOString()
        };
      });

      return res.json({ reports });
    } catch (error: any) {
      console.error("Retrieve saved reports failed:", error);
      return res.status(500).json({ error: error.message || "Failed to retrieve saved reports." });
    }
  }

  // Delete a saved report
  static async deleteReport(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized." });
      }

      const reportId = Number(req.params.id);
      if (isNaN(reportId)) {
        return res.status(400).json({ error: "Invalid report ID." });
      }

      const report = await prisma.report.findUnique({
        where: { id: reportId }
      });

      if (!report) {
        return res.status(404).json({ error: "Report not found." });
      }

      // Check if user owns the report (unless they are admin)
      if (report.createdBy !== req.user.id && req.user.roleId !== 1) {
        return res.status(403).json({ error: "Forbidden. You can only delete your own snapshots." });
      }

      await prisma.report.delete({
        where: { id: reportId }
      });

      return res.json({ message: "Snapshot report deleted successfully." });
    } catch (error: any) {
      console.error("Delete report failed:", error);
      return res.status(500).json({ error: error.message || "Failed to delete report." });
    }
  }
}
