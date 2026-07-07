import { prisma } from "./prisma.js";
import fs from "fs";
import path from "path";

const STORE_PATH = path.join(process.cwd(), "database", "store.json");

let useFallback = false;
let fallbackChecked = false;

async function checkDatabaseConnection(): Promise<boolean> {
  if (fallbackChecked) {
    return !useFallback;
  }
  if (!process.env.DATABASE_URL) {
    console.warn("No DATABASE_URL found in environment variables. Falling back to local JSON store.");
    useFallback = true;
    fallbackChecked = true;
    return false;
  }
  try {
    await prisma.$connect();
    useFallback = false;
    fallbackChecked = true;
    return true;
  } catch (err) {
    console.warn("Could not connect to MySQL database via Prisma, using local JSON store fallback instead.");
    useFallback = true;
    fallbackChecked = true;
    return false;
  }
}

function readFallback(): DbSchema {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const content = fs.readFileSync(STORE_PATH, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error reading JSON fallback database:", err);
  }
  return {
    roles: [],
    users: [],
    projects: [],
    projectMembers: [],
    tasks: [],
    taskDependencies: [],
    incidents: [],
    notifications: [],
    reports: []
  };
}

function writeFallback(data: DbSchema): void {
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing JSON fallback database:", err);
  }
}

// Define TypeScript interfaces for our 3NF Relational models
export interface Role {
  id: number;
  name: "Admin" | "Manager" | "Developer";
  description: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  roleId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  managerId: number;
  status: "Active" | "Closed";
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  projectId: number;
  userId: number;
  joinedAt: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  projectId: number;
  assigneeId: number | null;
  status: "To Do" | "In Progress" | "Review" | "Completed";
  priority: "Low" | "Medium" | "High";
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskDependency {
  taskId: number;
  dependsOnTaskId: number;
}

export interface Incident {
  id: number;
  title: string;
  description: string;
  projectId: number;
  status: "Open" | "In_Progress" | "Resolved" | "Closed";
  severity: "Low" | "Medium" | "High" | "Critical";
  assigneeId: number | null;
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

export interface Report {
  id: number;
  title: string;
  queryParams: any;
  createdBy: number;
  createdAt: string;
}

// Database schema container
export interface DbSchema {
  roles: Role[];
  users: User[];
  projects: Project[];
  projectMembers: ProjectMember[];
  tasks: Task[];
  taskDependencies: TaskDependency[];
  incidents: Incident[];
  notifications: Notification[];
  reports: Report[];
}

// Helper functions for mapping dates
const mapDate = (d: Date | null | undefined): string | null => {
  return d ? d.toISOString() : null;
};

const mapDateRequired = (d: Date): string => {
  return d.toISOString();
};

export class LocalDb {
  static async ensureSeeded(): Promise<void> {
    const isDbConnected = await checkDatabaseConnection();
    if (!isDbConnected) {
      const db = readFallback();
      let modified = false;
      if (!db.roles || db.roles.length === 0) {
        db.roles = [
          { id: 1, name: "Admin", description: "Full administrative control over all projects, users, and settings." },
          { id: 2, name: "Manager", description: "Can create projects, assign tasks, manage members, and view reports." },
          { id: 3, name: "Developer", description: "Can view projects, update task statuses, report incidents, and receive notifications." }
        ];
        modified = true;
      }
      if (!db.users || db.users.length === 0) {
        db.users = [
          {
            id: 1,
            name: "Alice Admin",
            email: "admin@teamflow.com",
            passwordHash: "$2a$10$tMh4E82/OIdK18U9I98B3.yTf13/hIqZJj3YgP.93iFzY/oE0eGby", // password123
            roleId: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 2,
            name: "Marcus Manager",
            email: "manager@teamflow.com",
            passwordHash: "$2a$10$tMh4E82/OIdK18U9I98B3.yTf13/hIqZJj3YgP.93iFzY/oE0eGby", // password123
            roleId: 2,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 3,
            name: "Devin Developer",
            email: "dev@teamflow.com",
            passwordHash: "$2a$10$tMh4E82/OIdK18U9I98B3.yTf13/hIqZJj3YgP.93iFzY/oE0eGby", // password123
            roleId: 3,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        modified = true;
      }
      if (modified) {
        writeFallback(db);
      }
      return;
    }

    try {
      // Seed roles if empty
      const roleCount = await prisma.role.count();
      if (roleCount === 0) {
        await prisma.role.createMany({
          data: [
            { id: 1, name: "Admin", description: "Full administrative control over all projects, users, and settings." },
            { id: 2, name: "Manager", description: "Can create projects, assign tasks, manage members, and view reports." },
            { id: 3, name: "Developer", description: "Can view projects, update task statuses, report incidents, and receive notifications." }
          ]
        });
      }

      // Seed users if empty
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        await prisma.user.createMany({
          data: [
            {
              id: 1,
              name: "Alice Admin",
              email: "admin@teamflow.com",
              passwordHash: "$2a$10$tMh4E82/OIdK18U9I98B3.yTf13/hIqZJj3YgP.93iFzY/oE0eGby", // password123
              roleId: 1
            },
            {
              id: 2,
              name: "Marcus Manager",
              email: "manager@teamflow.com",
              passwordHash: "$2a$10$tMh4E82/OIdK18U9I98B3.yTf13/hIqZJj3YgP.93iFzY/oE0eGby", // password123
              roleId: 2
            },
            {
              id: 3,
              name: "Devin Developer",
              email: "dev@teamflow.com",
              passwordHash: "$2a$10$tMh4E82/OIdK18U9I98B3.yTf13/hIqZJj3YgP.93iFzY/oE0eGby", // password123
              roleId: 3
            }
          ]
        });
      }
    } catch (e) {
      console.error("Seeding failed: either DB connection is not configured or seeding error occurred.", e);
    }
  }

  static async read(): Promise<DbSchema> {
    await this.ensureSeeded();

    if (useFallback) {
      return readFallback();
    }

    try {
      const dbRoles = await prisma.role.findMany().catch(() => []);
      const dbUsers = await prisma.user.findMany().catch(() => []);
      const dbProjects = await prisma.project.findMany().catch(() => []);
      const dbMembers = await prisma.projectMember.findMany().catch(() => []);
      const dbTasks = await prisma.task.findMany().catch(() => []);
      const dbDeps = await prisma.taskDependency.findMany().catch(() => []);
      const dbIncidents = await prisma.incident.findMany().catch(() => []);
      const dbNotifications = await prisma.notification.findMany().catch(() => []);
      const dbReports = await prisma.report.findMany().catch(() => []);

      return {
        roles: dbRoles.map(r => ({
          id: r.id,
          name: r.name as any,
          description: r.description || ""
        })),
        users: dbUsers.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          passwordHash: u.passwordHash,
          roleId: u.roleId,
          createdAt: mapDateRequired(u.createdAt),
          updatedAt: mapDateRequired(u.updatedAt)
        })),
        projects: dbProjects.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || "",
          managerId: p.managerId,
          status: p.status as any,
          createdAt: mapDateRequired(p.createdAt),
          updatedAt: mapDateRequired(p.updatedAt)
        })),
        projectMembers: dbMembers.map(m => ({
          projectId: m.projectId,
          userId: m.userId,
          joinedAt: mapDateRequired(m.joinedAt)
        })),
        tasks: dbTasks.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description || "",
          projectId: t.projectId,
          assigneeId: t.assigneeId,
          status: (t.status === "TO_DO" ? "To Do" : t.status === "IN_PROGRESS" ? "In Progress" : t.status === "REVIEW" ? "Review" : "Completed") as any,
          priority: (t.priority === "LOW" ? "Low" : t.priority === "MEDIUM" ? "Medium" : "High") as any,
          dueDate: mapDate(t.dueDate),
          createdAt: mapDateRequired(t.createdAt),
          updatedAt: mapDateRequired(t.updatedAt)
        })),
        taskDependencies: dbDeps.map(d => ({
          taskId: d.taskId,
          dependsOnTaskId: d.dependsOnTaskId
        })),
        incidents: dbIncidents.map(i => ({
          id: i.id,
          title: i.title,
          description: i.description,
          projectId: i.projectId,
          status: i.status as any,
          severity: i.severity as any,
          assigneeId: i.assigneeId,
          createdAt: mapDateRequired(i.createdAt),
          updatedAt: mapDateRequired(i.updatedAt)
        })),
        notifications: dbNotifications.map(n => ({
          id: n.id,
          userId: n.userId,
          title: n.title,
          message: n.message,
          isRead: n.isRead,
          type: (n.type === "TASK_ASSIGNED" ? "Task Assigned" : n.type === "TASK_COMPLETED" ? "Task Completed" : n.type === "PROJECT_UPDATED" ? "Project Updated" : "Incident Assigned") as any,
          createdAt: mapDateRequired(n.createdAt)
        })),
        reports: dbReports.map(r => ({
          id: r.id,
          title: r.title,
          queryParams: r.queryParams || {},
          createdBy: r.createdBy,
          createdAt: mapDateRequired(r.createdAt)
        }))
      };
    } catch (err) {
      console.error("Failed to read from Prisma, falling back to JSON read.", err);
      return readFallback();
    }
  }

  static async write(data: DbSchema): Promise<void> {
    await this.ensureSeeded();

    if (useFallback) {
      writeFallback(data);
      return;
    }

    try {
      // 1. Users
      for (const u of data.users) {
        await prisma.user.upsert({
          where: { id: u.id },
          update: {
            name: u.name,
            email: u.email.toLowerCase(),
            passwordHash: u.passwordHash,
            roleId: u.roleId,
            updatedAt: new Date(u.updatedAt)
          },
          create: {
            id: u.id,
            name: u.name,
            email: u.email.toLowerCase(),
            passwordHash: u.passwordHash,
            roleId: u.roleId,
            createdAt: new Date(u.createdAt),
            updatedAt: new Date(u.updatedAt)
          }
        }).catch(err => console.error("Error upserting user:", err));
      }

      // 2. Projects
      for (const p of data.projects) {
        await prisma.project.upsert({
          where: { id: p.id },
          update: {
            name: p.name,
            description: p.description,
            managerId: p.managerId,
            status: p.status as any,
            updatedAt: new Date(p.updatedAt)
          },
          create: {
            id: p.id,
            name: p.name,
            description: p.description,
            managerId: p.managerId,
            status: p.status as any,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt)
          }
        }).catch(err => console.error("Error upserting project:", err));
      }

      const projectIds = data.projects.map(p => p.id);
      await prisma.project.deleteMany({
        where: { id: { notIn: projectIds } }
      }).catch(err => console.error("Error deleting projects:", err));

      // 3. Project Members
      await prisma.projectMember.deleteMany({}).catch(err => console.error("Error clearing project members:", err));
      for (const m of data.projectMembers) {
        await prisma.projectMember.create({
          data: {
            projectId: m.projectId,
            userId: m.userId,
            joinedAt: new Date(m.joinedAt)
          }
        }).catch(err => console.error("Error creating project member:", err));
      }

      // 4. Tasks
      for (const t of data.tasks) {
        const prismaStatus = t.status === "To Do" ? "TO_DO" :
                             t.status === "In Progress" ? "IN_PROGRESS" :
                             t.status === "Review" ? "REVIEW" : "COMPLETED";

        const prismaPriority = t.priority === "Low" ? "LOW" :
                               t.priority === "Medium" ? "MEDIUM" : "HIGH";

        await prisma.task.upsert({
          where: { id: t.id },
          update: {
            title: t.title,
            description: t.description,
            projectId: t.projectId,
            assigneeId: t.assigneeId,
            status: prismaStatus as any,
            priority: prismaPriority as any,
            dueDate: t.dueDate ? new Date(t.dueDate) : null,
            updatedAt: new Date(t.updatedAt)
          },
          create: {
            id: t.id,
            title: t.title,
            description: t.description,
            projectId: t.projectId,
            assigneeId: t.assigneeId,
            status: prismaStatus as any,
            priority: prismaPriority as any,
            dueDate: t.dueDate ? new Date(t.dueDate) : null,
            createdAt: new Date(t.createdAt),
            updatedAt: new Date(t.updatedAt)
          }
        }).catch(err => console.error("Error upserting task:", err));
      }

      const taskIds = data.tasks.map(t => t.id);
      await prisma.task.deleteMany({
        where: { id: { notIn: taskIds } }
      }).catch(err => console.error("Error deleting tasks:", err));

      // 5. Task Dependencies
      await prisma.taskDependency.deleteMany({}).catch(err => console.error("Error clearing task dependencies:", err));
      for (const d of data.taskDependencies) {
        await prisma.taskDependency.create({
          data: {
            taskId: d.taskId,
            dependsOnTaskId: d.dependsOnTaskId
          }
        }).catch(err => console.error("Error creating task dependency:", err));
      }

      // 6. Incidents
      for (const i of data.incidents) {
        await prisma.incident.upsert({
          where: { id: i.id },
          update: {
            title: i.title,
            description: i.description,
            projectId: i.projectId,
            status: i.status as any,
            severity: i.severity as any,
            assigneeId: i.assigneeId,
            updatedAt: new Date(i.updatedAt)
          },
          create: {
            id: i.id,
            title: i.title,
            description: i.description,
            projectId: i.projectId,
            status: i.status as any,
            severity: i.severity as any,
            assigneeId: i.assigneeId,
            createdAt: new Date(i.createdAt),
            updatedAt: new Date(i.updatedAt)
          }
        }).catch(err => console.error("Error upserting incident:", err));
      }

      const incidentIds = data.incidents.map(i => i.id);
      await prisma.incident.deleteMany({
        where: { id: { notIn: incidentIds } }
      }).catch(err => console.error("Error deleting incidents:", err));

      // 7. Notifications
      for (const n of data.notifications) {
        const prismaType = n.type === "Task Assigned" ? "TASK_ASSIGNED" :
                           n.type === "Task Completed" ? "TASK_COMPLETED" :
                           n.type === "Project Updated" ? "PROJECT_UPDATED" : "INCIDENT_ASSIGNED";

        await prisma.notification.upsert({
          where: { id: n.id },
          update: {
            userId: n.userId,
            title: n.title,
            message: n.message,
            isRead: n.isRead
          },
          create: {
            id: n.id,
            userId: n.userId,
            title: n.title,
            message: n.message,
            isRead: n.isRead,
            type: prismaType as any,
            createdAt: new Date(n.createdAt)
          }
        }).catch(err => console.error("Error upserting notification:", err));
      }

      const notificationIds = data.notifications.map(n => n.id);
      await prisma.notification.deleteMany({
        where: { id: { notIn: notificationIds } }
      }).catch(err => console.error("Error deleting notifications:", err));

      // 8. Reports
      for (const r of data.reports) {
        await prisma.report.upsert({
          where: { id: r.id },
          update: {
            title: r.title,
            queryParams: r.queryParams || {},
            createdBy: r.createdBy
          },
          create: {
            id: r.id,
            title: r.title,
            queryParams: r.queryParams || {},
            createdBy: r.createdBy,
            createdAt: new Date(r.createdAt)
          }
        }).catch(err => console.error("Error upserting report:", err));
      }

      const reportIds = data.reports.map(r => r.id);
      await prisma.report.deleteMany({
        where: { id: { notIn: reportIds } }
      }).catch(err => console.error("Error deleting reports:", err));

    } catch (err) {
      console.error("Prisma write error, writing to JSON fallback.", err);
      writeFallback(data);
    }
  }

  static async createUser(user: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    await this.ensureSeeded();

    if (useFallback) {
      const db = readFallback();
      const emailExists = db.users.some(u => u.email.toLowerCase() === user.email.toLowerCase());
      if (emailExists) {
        throw new Error(`Email '${user.email}' is already registered.`);
      }
      const roleExists = db.roles.some(r => r.id === user.roleId);
      if (!roleExists) {
        throw new Error(`Role ID ${user.roleId} does not exist.`);
      }
      const newUser: User = {
        id: db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1,
        name: user.name,
        email: user.email.toLowerCase(),
        passwordHash: user.passwordHash,
        roleId: user.roleId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.users.push(newUser);
      writeFallback(db);
      return newUser;
    }

    const emailExists = await prisma.user.findFirst({
      where: { email: { equals: user.email.toLowerCase() } }
    });
    if (emailExists) {
      throw new Error(`Email '${user.email}' is already registered.`);
    }

    const roleExists = await prisma.role.findUnique({
      where: { id: user.roleId }
    });
    if (!roleExists) {
      throw new Error(`Role ID ${user.roleId} does not exist.`);
    }

    const created = await prisma.user.create({
      data: {
        name: user.name,
        email: user.email.toLowerCase(),
        passwordHash: user.passwordHash,
        roleId: user.roleId
      }
    });

    return {
      id: created.id,
      name: created.name,
      email: created.email,
      passwordHash: created.passwordHash,
      roleId: created.roleId,
      createdAt: mapDateRequired(created.createdAt),
      updatedAt: mapDateRequired(created.updatedAt)
    };
  }

  static async createProject(project: Omit<Project, "id" | "createdAt" | "updatedAt">): Promise<Project> {
    await this.ensureSeeded();

    if (useFallback) {
      const db = readFallback();
      const manager = db.users.find(u => u.id === project.managerId);
      if (!manager) {
        throw new Error(`Manager with ID ${project.managerId} does not exist.`);
      }
      if (manager.roleId !== 2 && manager.roleId !== 1) {
        throw new Error(`User with ID ${project.managerId} is not authorized to manage projects (Must be Manager or Admin).`);
      }
      const newProj: Project = {
        id: db.projects.length > 0 ? Math.max(...db.projects.map(p => p.id)) + 1 : 1,
        name: project.name,
        description: project.description,
        managerId: project.managerId,
        status: project.status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.projects.push(newProj);
      db.projectMembers.push({
        projectId: newProj.id,
        userId: project.managerId,
        joinedAt: new Date().toISOString()
      });
      writeFallback(db);
      return newProj;
    }

    const manager = await prisma.user.findUnique({
      where: { id: project.managerId }
    });
    if (!manager) {
      throw new Error(`Manager with ID ${project.managerId} does not exist.`);
    }
    if (manager.roleId !== 2 && manager.roleId !== 1) {
      throw new Error(`User with ID ${project.managerId} is not authorized to manage projects (Must be Manager or Admin).`);
    }

    const created = await prisma.project.create({
      data: {
        name: project.name,
        description: project.description,
        managerId: project.managerId,
        status: project.status as any
      }
    });

    await prisma.projectMember.create({
      data: {
        projectId: created.id,
        userId: project.managerId
      }
    });

    return {
      id: created.id,
      name: created.name,
      description: created.description || "",
      managerId: created.managerId,
      status: created.status as any,
      createdAt: mapDateRequired(created.createdAt),
      updatedAt: mapDateRequired(created.updatedAt)
    };
  }

  static async deleteProject(projectId: number): Promise<void> {
    await this.ensureSeeded();

    if (useFallback) {
      const db = readFallback();
      const index = db.projects.findIndex(p => p.id === projectId);
      if (index === -1) {
        throw new Error(`Project with ID ${projectId} not found.`);
      }
      db.projects.splice(index, 1);
      db.projectMembers = db.projectMembers.filter(m => m.projectId !== projectId);
      db.tasks = db.tasks.filter(t => t.projectId !== projectId);
      db.taskDependencies = db.taskDependencies.filter(d => {
        const t1 = db.tasks.find(t => t.id === d.taskId);
        const t2 = db.tasks.find(t => t.id === d.dependsOnTaskId);
        return t1 && t2;
      });
      db.incidents = db.incidents.filter(i => i.projectId !== projectId);
      writeFallback(db);
      return;
    }

    const exists = await prisma.project.findUnique({
      where: { id: projectId }
    });
    if (!exists) {
      throw new Error(`Project with ID ${projectId} not found.`);
    }

    await prisma.project.delete({
      where: { id: projectId }
    });
  }

  static async createTask(task: Omit<Task, "id" | "createdAt" | "updatedAt">): Promise<Task> {
    await this.ensureSeeded();

    if (useFallback) {
      const db = readFallback();
      const project = db.projects.find(p => p.id === task.projectId);
      if (!project) {
        throw new Error(`Project with ID ${task.projectId} does not exist.`);
      }
      if (project.status === "Closed") {
        throw new Error("Closed projects cannot accept new tasks.");
      }
      if (task.assigneeId !== null) {
        const isMember = db.projectMembers.some(m => m.projectId === task.projectId && m.userId === task.assigneeId);
        if (!isMember) {
          throw new Error(`Assignee is not a member of project ID ${task.projectId}.`);
        }
      }
      const newT: Task = {
        id: db.tasks.length > 0 ? Math.max(...db.tasks.map(t => t.id)) + 1 : 1,
        title: task.title,
        description: task.description,
        projectId: task.projectId,
        assigneeId: task.assigneeId,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.tasks.push(newT);
      writeFallback(db);
      return newT;
    }

    const project = await prisma.project.findUnique({
      where: { id: task.projectId }
    });
    if (!project) {
      throw new Error(`Project with ID ${task.projectId} does not exist.`);
    }
    if (project.status === "Closed") {
      throw new Error("Closed projects cannot accept new tasks.");
    }

    if (task.assigneeId !== null) {
      const isMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: task.projectId,
            userId: task.assigneeId
          }
        }
      });
      if (!isMember) {
        throw new Error(`Assignee is not a member of project ID ${task.projectId}.`);
      }
    }

    const created = await prisma.task.create({
      data: {
        title: task.title,
        description: task.description,
        projectId: task.projectId,
        assigneeId: task.assigneeId,
        status: (task.status === "To Do" ? "TO_DO" : task.status) as any,
        priority: (task.priority === "Low" ? "LOW" : task.priority === "Medium" ? "MEDIUM" : "HIGH") as any,
        dueDate: task.dueDate ? new Date(task.dueDate) : null
      }
    });

    return {
      id: created.id,
      title: created.title,
      description: created.description || "",
      projectId: created.projectId,
      assigneeId: created.assigneeId,
      status: task.status,
      priority: task.priority,
      dueDate: mapDate(created.dueDate),
      createdAt: mapDateRequired(created.createdAt),
      updatedAt: mapDateRequired(created.updatedAt)
    };
  }

  static async addTaskDependency(taskId: number, dependsOnTaskId: number): Promise<void> {
    await this.ensureSeeded();

    if (taskId === dependsOnTaskId) {
      throw new Error("A task cannot depend on itself.");
    }

    if (useFallback) {
      const db = readFallback();
      const taskA = db.tasks.find(t => t.id === taskId);
      const taskB = db.tasks.find(t => t.id === dependsOnTaskId);
      if (!taskA || !taskB) {
        throw new Error("One or both tasks do not exist.");
      }

      const hasPath = (start: number, end: number, visited = new Set<number>()): boolean => {
        if (start === end) return true;
        visited.add(start);
        const nextTasks = db.taskDependencies
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
        throw new Error("Circular dependency detected! This relationship is not allowed.");
      }

      const exists = db.taskDependencies.some(d => d.taskId === taskId && d.dependsOnTaskId === dependsOnTaskId);
      if (!exists) {
        db.taskDependencies.push({ taskId, dependsOnTaskId });
        writeFallback(db);
      }
      return;
    }

    const taskAExists = await prisma.task.findUnique({ where: { id: taskId } });
    const taskBExists = await prisma.task.findUnique({ where: { id: dependsOnTaskId } });
    if (!taskAExists || !taskBExists) {
      throw new Error("One or both tasks do not exist.");
    }

    const dependencies = await prisma.taskDependency.findMany();
    const hasPath = (start: number, end: number, visited = new Set<number>()): boolean => {
      if (start === end) return true;
      visited.add(start);
      const nextTasks = dependencies
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
      throw new Error("Circular dependency detected! This relationship is not allowed.");
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
      await prisma.taskDependency.create({
        data: {
          taskId,
          dependsOnTaskId
        }
      });
    }
  }

  static async updateTaskStatus(taskId: number, newStatus: Task["status"]): Promise<Task> {
    await this.ensureSeeded();

    if (useFallback) {
      const db = readFallback();
      const taskIndex = db.tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) {
        throw new Error(`Task with ID ${taskId} not found.`);
      }
      const task = db.tasks[taskIndex];

      if (newStatus !== "To Do") {
        const dependencies = db.taskDependencies.filter(d => d.taskId === taskId);
        for (const dep of dependencies) {
          const dependentTask = db.tasks.find(t => t.id === dep.dependsOnTaskId);
          if (dependentTask && dependentTask.status !== "Completed") {
            throw new Error(
              `Cannot update status. Task B depends on completed status of task: '${dependentTask.title}'.`
            );
          }
        }
      }

      task.status = newStatus;
      task.updatedAt = new Date().toISOString();
      db.tasks[taskIndex] = task;
      writeFallback(db);
      return task;
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found.`);
    }

    if (newStatus !== "To Do") {
      const dependencies = await prisma.taskDependency.findMany({
        where: { taskId }
      });
      for (const dep of dependencies) {
        const dependentTask = await prisma.task.findUnique({
          where: { id: dep.dependsOnTaskId }
        });
        if (dependentTask && dependentTask.status !== "COMPLETED") {
          throw new Error(
            `Cannot update status. Task B depends on completed status of task: '${dependentTask.title}'.`
          );
        }
      }
    }

    const prismaStatus = newStatus === "To Do" ? "TO_DO" :
                         newStatus === "In Progress" ? "IN_PROGRESS" :
                         newStatus === "Review" ? "REVIEW" : "COMPLETED";

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: prismaStatus as any,
        updatedAt: new Date()
      }
    });

    return {
      id: updated.id,
      title: updated.title,
      description: updated.description || "",
      projectId: updated.projectId,
      assigneeId: updated.assigneeId,
      status: newStatus,
      priority: (updated.priority === "LOW" ? "Low" : updated.priority === "MEDIUM" ? "Medium" : "High") as any,
      dueDate: mapDate(updated.dueDate),
      createdAt: mapDateRequired(updated.createdAt),
      updatedAt: mapDateRequired(updated.updatedAt)
    };
  }

  static async createIncident(incident: Omit<Incident, "id" | "createdAt" | "updatedAt">): Promise<Incident> {
    await this.ensureSeeded();

    if (useFallback) {
      const db = readFallback();
      const projectExists = db.projects.some(p => p.id === incident.projectId);
      if (!projectExists) {
        throw new Error(`Project with ID ${incident.projectId} does not exist.`);
      }
      const newInc: Incident = {
        id: db.incidents.length > 0 ? Math.max(...db.incidents.map(i => i.id)) + 1 : 1,
        title: incident.title,
        description: incident.description,
        projectId: incident.projectId,
        status: incident.status,
        severity: incident.severity,
        assigneeId: incident.assigneeId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.incidents.push(newInc);
      writeFallback(db);
      return newInc;
    }

    const projectExists = await prisma.project.findUnique({
      where: { id: incident.projectId }
    });
    if (!projectExists) {
      throw new Error(`Project with ID ${incident.projectId} does not exist.`);
    }

    const created = await prisma.incident.create({
      data: {
        title: incident.title,
        description: incident.description,
        projectId: incident.projectId,
        status: incident.status as any,
        severity: incident.severity as any,
        assigneeId: incident.assigneeId
      }
    });

    return {
      id: created.id,
      title: created.title,
      description: created.description,
      projectId: created.projectId,
      status: created.status as any,
      severity: created.severity as any,
      assigneeId: created.assigneeId,
      createdAt: mapDateRequired(created.createdAt),
      updatedAt: mapDateRequired(created.updatedAt)
    };
  }

  static async triggerNotification(userId: number, title: string, message: string, type: Notification["type"]): Promise<Notification> {
    await this.ensureSeeded();

    if (useFallback) {
      const db = readFallback();
      const userExists = db.users.some(u => u.id === userId);
      if (!userExists) {
        throw new Error(`User with ID ${userId} does not exist.`);
      }
      const newNotif: Notification = {
        id: db.notifications.length > 0 ? Math.max(...db.notifications.map(n => n.id)) + 1 : 1,
        userId,
        title,
        message,
        isRead: false,
        type,
        createdAt: new Date().toISOString()
      };
      db.notifications.push(newNotif);
      writeFallback(db);
      return newNotif;
    }

    const userExists = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!userExists) {
      throw new Error(`User with ID ${userId} does not exist.`);
    }

    const prismaType = type === "Task Assigned" ? "TASK_ASSIGNED" :
                       type === "Task Completed" ? "TASK_COMPLETED" :
                       type === "Project Updated" ? "PROJECT_UPDATED" : "INCIDENT_ASSIGNED";

    const created = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        isRead: false,
        type: prismaType as any
      }
    });

    return {
      id: created.id,
      userId: created.userId,
      title: created.title,
      message: created.message,
      isRead: created.isRead,
      type,
      createdAt: mapDateRequired(created.createdAt)
    };
  }
}
