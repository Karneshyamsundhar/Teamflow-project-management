import { Response } from "express";
import { prisma } from "../db/prisma.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { TaskStatus, TaskPriority, NotificationType } from "@prisma/client";

// Status translation helpers
const STATUS_TO_PRISMA = {
  "To Do": TaskStatus.TO_DO,
  "In Progress": TaskStatus.IN_PROGRESS,
  "Review": TaskStatus.REVIEW,
  "Completed": TaskStatus.COMPLETED
} as const;

function toPrismaStatus(status: string): TaskStatus {
  return (STATUS_TO_PRISMA[status as keyof typeof STATUS_TO_PRISMA] || TaskStatus.TO_DO) as TaskStatus;
}

const STATUS_FROM_PRISMA = {
  [TaskStatus.TO_DO]: "To Do",
  [TaskStatus.IN_PROGRESS]: "In Progress",
  [TaskStatus.REVIEW]: "Review",
  [TaskStatus.COMPLETED]: "Completed"
} as const;

function toClientStatus(status: TaskStatus): "To Do" | "In Progress" | "Review" | "Completed" {
  return (STATUS_FROM_PRISMA[status] || "To Do") as any;
}

// Priority translation helpers
const PRIORITY_TO_PRISMA = {
  "Low": TaskPriority.LOW,
  "Medium": TaskPriority.MEDIUM,
  "High": TaskPriority.HIGH
} as const;

function toPrismaPriority(priority: string): TaskPriority {
  return (PRIORITY_TO_PRISMA[priority as keyof typeof PRIORITY_TO_PRISMA] || TaskPriority.MEDIUM) as TaskPriority;
}

const PRIORITY_FROM_PRISMA = {
  [TaskPriority.LOW]: "Low",
  [TaskPriority.MEDIUM]: "Medium",
  [TaskPriority.HIGH]: "High"
} as const;

function toClientPriority(priority: TaskPriority): "Low" | "Medium" | "High" {
  return (PRIORITY_FROM_PRISMA[priority] || "Medium") as any;
}

export class TaskController {
  // Create a new task
  static async createTask(req: AuthenticatedRequest, res: Response) {
    try {
      const { title, description, projectId, assigneeId, priority, dueDate } = req.body;

      if (!title || !title.trim() || !projectId) {
        return res.status(400).json({ error: "Task title and project ID are required." });
      }

      const parsedProjectId = Number(projectId);
      const parsedAssigneeId = assigneeId ? Number(assigneeId) : null;

      // Check if project exists
      const project = await prisma.project.findUnique({
        where: { id: parsedProjectId }
      });

      if (!project) {
        return res.status(404).json({ error: "Target project workspace does not exist." });
      }

      // If assignee is assigned, verify they belong to the project roster
      if (parsedAssigneeId) {
        const isMember = await prisma.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId: parsedProjectId,
              userId: parsedAssigneeId
            }
          }
        });

        if (!isMember) {
          return res.status(400).json({ error: "The designated assignee is not a member of this project roster." });
        }
      }

      // Create the task in MySQL using Prisma
      const newTask = await prisma.task.create({
        data: {
          title: title.trim(),
          description: description || "",
          projectId: parsedProjectId,
          assigneeId: parsedAssigneeId,
          status: TaskStatus.TO_DO,
          priority: toPrismaPriority(priority || "Medium"),
          dueDate: dueDate ? new Date(dueDate) : null
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

      // Trigger automatic notification to assignee
      if (parsedAssigneeId) {
        await prisma.notification.create({
          data: {
            userId: parsedAssigneeId,
            title: "Task Assigned",
            message: `You have been assigned the task '${newTask.title}' in project '${project.name}'.`,
            type: NotificationType.TASK_ASSIGNED
          }
        });
      }

      return res.status(201).json({
        message: "Task created successfully.",
        task: {
          id: newTask.id,
          title: newTask.title,
          description: newTask.description,
          projectId: newTask.projectId,
          assigneeId: newTask.assigneeId,
          assigneeName: newTask.assignee?.name || "Unassigned",
          status: "To Do",
          priority: priority || "Medium",
          dueDate: newTask.dueDate ? newTask.dueDate.toISOString() : null,
          createdAt: newTask.createdAt.toISOString(),
          updatedAt: newTask.updatedAt.toISOString(),
          dependencies: []
        }
      });
    } catch (error: any) {
      console.error("Create task failed:", error);
      return res.status(500).json({ error: error.message || "Failed to create task." });
    }
  }

  // Get tasks for a project
  static async getTasks(req: AuthenticatedRequest, res: Response) {
    try {
      const projectId = Number(req.query.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Query parameter projectId is required and must be a number." });
      }

      const tasks = await prisma.task.findMany({
        where: { projectId },
        include: {
          assignee: {
            select: {
              id: true,
              name: true
            }
          },
          dependencies: {
            include: {
              dependsOnTask: {
                select: {
                  id: true,
                  title: true,
                  status: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: "asc"
        }
      });

      const enrichedTasks = tasks.map(t => {
        const dependsOnList = t.dependencies.map(d => ({
          id: d.dependsOnTaskId,
          title: d.dependsOnTask?.title || "Deleted Task",
          status: toClientStatus(d.dependsOnTask?.status || TaskStatus.COMPLETED)
        }));

        return {
          id: t.id,
          title: t.title,
          description: t.description || "",
          projectId: t.projectId,
          assigneeId: t.assigneeId,
          assigneeName: t.assignee ? t.assignee.name : "Unassigned",
          status: toClientStatus(t.status),
          priority: toClientPriority(t.priority),
          dueDate: t.dueDate ? t.dueDate.toISOString() : null,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
          dependencies: dependsOnList
        };
      });

      return res.json({ tasks: enrichedTasks });
    } catch (error: any) {
      console.error("Retrieve tasks failed:", error);
      return res.status(500).json({ error: error.message || "Failed to retrieve tasks." });
    }
  }

  // Get single task detail
  static async getTaskById(req: AuthenticatedRequest, res: Response) {
    try {
      const taskId = Number(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ error: "Invalid Task ID." });
      }

      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          assignee: {
            select: {
              id: true,
              name: true
            }
          },
          dependencies: {
            include: {
              dependsOnTask: {
                select: {
                  id: true,
                  title: true,
                  status: true
                }
              }
            }
          }
        }
      });

      if (!task) {
        return res.status(404).json({ error: "Task not found." });
      }

      const dependsOnList = task.dependencies.map(d => ({
        id: d.dependsOnTaskId,
        title: d.dependsOnTask?.title || "Deleted Task",
        status: toClientStatus(d.dependsOnTask?.status || TaskStatus.COMPLETED)
      }));

      return res.json({
        task: {
          id: task.id,
          title: task.title,
          description: task.description || "",
          projectId: task.projectId,
          assigneeId: task.assigneeId,
          assigneeName: task.assignee ? task.assignee.name : "Unassigned",
          status: toClientStatus(task.status),
          priority: toClientPriority(task.priority),
          dueDate: task.dueDate ? task.dueDate.toISOString() : null,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
          dependencies: dependsOnList
        }
      });
    } catch (error: any) {
      console.error("Retrieve task detail failed:", error);
      return res.status(500).json({ error: error.message || "Failed to retrieve task details." });
    }
  }

  // Update Task details
  static async updateTask(req: AuthenticatedRequest, res: Response) {
    try {
      const taskId = Number(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ error: "Invalid Task ID." });
      }

      const { title, description, assigneeId, priority, dueDate } = req.body;

      const task = await prisma.task.findUnique({
        where: { id: taskId }
      });

      if (!task) {
        return res.status(404).json({ error: "Task not found." });
      }

      const updateData: any = {};

      if (title !== undefined) {
        if (!title.trim()) {
          return res.status(400).json({ error: "Task title cannot be empty." });
        }
        updateData.title = title.trim();
      }

      if (description !== undefined) {
        updateData.description = description || "";
      }

      if (priority !== undefined) {
        updateData.priority = toPrismaPriority(priority);
      }

      if (dueDate !== undefined) {
        updateData.dueDate = dueDate ? new Date(dueDate) : null;
      }

      // Handle assignee change verification
      if (assigneeId !== undefined) {
        const parsedAssigneeId = assigneeId ? Number(assigneeId) : null;
        if (parsedAssigneeId !== null) {
          const isMember = await prisma.projectMember.findUnique({
            where: {
              projectId_userId: {
                projectId: task.projectId,
                userId: parsedAssigneeId
              }
            }
          });

          if (!isMember) {
            return res.status(400).json({ error: "The designated assignee is not a member of this project roster." });
          }
        }
        updateData.assigneeId = parsedAssigneeId;
      }

      const updated = await prisma.task.update({
        where: { id: taskId },
        data: updateData,
        include: {
          assignee: {
            select: {
              id: true,
              name: true
            }
          },
          project: {
            select: {
              name: true
            }
          }
        }
      });

      // Notify if a new assignee was set
      if (updateData.assigneeId && updateData.assigneeId !== task.assigneeId) {
        await prisma.notification.create({
          data: {
            userId: updateData.assigneeId,
            title: "Task Assigned",
            message: `You have been assigned the task '${updated.title}' in project '${updated.project.name}'.`,
            type: NotificationType.TASK_ASSIGNED
          }
        });
      }

      return res.json({
        message: "Task details updated successfully.",
        task: {
          id: updated.id,
          title: updated.title,
          description: updated.description || "",
          projectId: updated.projectId,
          assigneeId: updated.assigneeId,
          assigneeName: updated.assignee ? updated.assignee.name : "Unassigned",
          status: toClientStatus(updated.status),
          priority: toClientPriority(updated.priority),
          dueDate: updated.dueDate ? updated.dueDate.toISOString() : null,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString()
        }
      });
    } catch (error: any) {
      console.error("Update task details failed:", error);
      return res.status(500).json({ error: error.message || "Failed to update task details." });
    }
  }

  // Update Task Status with strict dependency gatekeeping
  static async updateTaskStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const taskId = Number(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ error: "Invalid Task ID." });
      }

      const { status } = req.body; // client friendly, e.g. "Completed"
      if (!status) {
        return res.status(400).json({ error: "Status is required." });
      }

      if (!["To Do", "In Progress", "Review", "Completed"].includes(status)) {
        return res.status(400).json({ error: "Invalid task status." });
      }

      const task = await prisma.task.findUnique({
        where: { id: taskId }
      });

      if (!task) {
        return res.status(404).json({ error: "Task not found." });
      }

      // STRICT GATEKEEPER: Check dependencies if moving beyond "To Do"
      if (status !== "To Do") {
        const dependencies = await prisma.taskDependency.findMany({
          where: { taskId },
          include: {
            dependsOnTask: {
              select: {
                id: true,
                title: true,
                status: true
              }
            }
          }
        });

        for (const dep of dependencies) {
          if (dep.dependsOnTask?.status !== TaskStatus.COMPLETED) {
            return res.status(400).json({
              error: `Dependency block active! Task depends on completed status of task: '${dep.dependsOnTask?.title}'.`
            });
          }
        }
      }

      const prismaStatus = toPrismaStatus(status);
      const updated = await prisma.task.update({
        where: { id: taskId },
        data: {
          status: prismaStatus,
          updatedAt: new Date()
        },
        include: {
          project: {
            select: {
              id: true,
              managerId: true,
              name: true
            }
          }
        }
      });

      // Send PM notification upon task completion
      if (status === "Completed") {
        await prisma.notification.create({
          data: {
            userId: updated.project.managerId,
            title: "Task Completed",
            message: `The task '${updated.title}' has been marked completed by ${req.user?.name || "assignee"}.`,
            type: NotificationType.TASK_COMPLETED
          }
        });
      }

      return res.json({
        message: `Task status updated to ${status}.`,
        task: {
          id: updated.id,
          title: updated.title,
          description: updated.description || "",
          projectId: updated.projectId,
          assigneeId: updated.assigneeId,
          status,
          priority: toClientPriority(updated.priority),
          dueDate: updated.dueDate ? updated.dueDate.toISOString() : null,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString()
        }
      });
    } catch (error: any) {
      console.error("Update task status failed:", error);
      return res.status(500).json({ error: error.message || "Failed to update task status." });
    }
  }

  // Add Task Dependency (preventing Directed Acyclic Graph cycles)
  static async addTaskDependency(req: AuthenticatedRequest, res: Response) {
    try {
      const taskId = Number(req.params.id);
      const dependsOnTaskId = Number(req.body.dependsOnTaskId);

      if (isNaN(taskId) || isNaN(dependsOnTaskId)) {
        return res.status(400).json({ error: "Invalid task ID parameters." });
      }

      if (taskId === dependsOnTaskId) {
        return res.status(400).json({ error: "A task cannot depend on itself." });
      }

      // Check existence
      const taskA = await prisma.task.findUnique({ where: { id: taskId } });
      const taskB = await prisma.task.findUnique({ where: { id: dependsOnTaskId } });

      if (!taskA || !taskB) {
        return res.status(404).json({ error: "One or both tasks do not exist." });
      }

      if (taskA.projectId !== taskB.projectId) {
        return res.status(400).json({ error: "Tasks must belong to the same project workspace." });
      }

      // Retrieve all dependency relationships to check for infinite cycle
      const allDependencies = await prisma.taskDependency.findMany();

      // Cycle checker DFS algorithm
      const hasPath = (start: number, end: number, visited = new Set<number>()): boolean => {
        if (start === end) return true;
        visited.add(start);
        const nextTasks = allDependencies
          .filter(d => d.taskId === start)
          .map(d => d.dependsOnTaskId);
        for (const next of nextTasks) {
          if (!visited.has(next)) {
            if (hasPath(next, end, visited)) return true;
          }
        }
        return false;
      };

      if (hasPath(dependsOnTaskId, taskId)) {
        return res.status(400).json({ error: "Circular dependency detected! This relationship is not allowed." });
      }

      // Register dependency relationship
      await prisma.taskDependency.upsert({
        where: {
          taskId_dependsOnTaskId: {
            taskId,
            dependsOnTaskId
          }
        },
        update: {},
        create: {
          taskId,
          dependsOnTaskId
        }
      });

      return res.json({ message: "Task dependency added successfully." });
    } catch (error: any) {
      console.error("Add task dependency failed:", error);
      return res.status(500).json({ error: error.message || "Failed to add task dependency." });
    }
  }

  // Remove Task Dependency
  static async removeTaskDependency(req: AuthenticatedRequest, res: Response) {
    try {
      const taskId = Number(req.params.id);
      const dependsOnTaskId = Number(req.params.dependsOnTaskId);

      if (isNaN(taskId) || isNaN(dependsOnTaskId)) {
        return res.status(400).json({ error: "Invalid task ID parameters." });
      }

      const exists = await prisma.taskDependency.findUnique({
        where: {
          taskId_dependsOnTaskId: {
            taskId,
            dependsOnTaskId
          }
        }
      });

      if (!exists) {
        return res.status(404).json({ error: "Dependency relation not found." });
      }

      await prisma.taskDependency.delete({
        where: {
          taskId_dependsOnTaskId: {
            taskId,
            dependsOnTaskId
          }
        }
      });

      return res.json({ message: "Dependency removed successfully." });
    } catch (error: any) {
      console.error("Remove task dependency failed:", error);
      return res.status(500).json({ error: error.message || "Failed to remove task dependency." });
    }
  }

  // Delete Task
  static async deleteTask(req: AuthenticatedRequest, res: Response) {
    try {
      const taskId = Number(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ error: "Invalid Task ID." });
      }

      const exists = await prisma.task.findUnique({
        where: { id: taskId }
      });

      if (!exists) {
        return res.status(404).json({ error: "Task not found." });
      }

      await prisma.task.delete({
        where: { id: taskId }
      });

      return res.json({ message: "Task deleted successfully." });
    } catch (error: any) {
      console.error("Delete task failed:", error);
      return res.status(500).json({ error: error.message || "Failed to delete task." });
    }
  }
}
