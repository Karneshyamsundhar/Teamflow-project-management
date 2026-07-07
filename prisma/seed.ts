import { PrismaClient, ProjectStatus, IncidentStatus, IncidentSeverity, NotificationType, TaskStatus, TaskPriority } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  // 1. Roles
  const roles = [
    { id: 1, name: "Admin", description: "Full administrative control over all projects, users, and settings." },
    { id: 2, name: "Manager", description: "Can create projects, assign tasks, manage members, and view reports." },
    { id: 3, name: "Developer", description: "Can view projects, update task statuses, report incidents, and receive notifications." }
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: {
        name: role.name,
        description: role.description
      },
      create: {
        id: role.id,
        name: role.name,
        description: role.description
      }
    });
  }
  console.log("Seeded 3 Roles successfully.");

  // 2. Users (1 Admin, 2 Managers, 5 Developers)
  // Password hash is for 'password123' using bcryptjs
  const defaultPasswordHash = "$2a$10$tMh4E82/OIdK18U9I98B3.yTf13/hIqZJj3YgP.93iFzY/oE0eGby";

  const users = [
    // 1 Admin
    { id: 1, name: "Alice Admin", email: "admin@teamflow.com", passwordHash: defaultPasswordHash, roleId: 1 },
    // 2 Managers
    { id: 2, name: "Marcus Manager", email: "manager@teamflow.com", passwordHash: defaultPasswordHash, roleId: 2 },
    { id: 3, name: "Mina Manager", email: "mina@teamflow.com", passwordHash: defaultPasswordHash, roleId: 2 },
    // 5 Developers
    { id: 4, name: "Devin Developer", email: "dev@teamflow.com", passwordHash: defaultPasswordHash, roleId: 3 },
    { id: 5, name: "David Developer", email: "david@teamflow.com", passwordHash: defaultPasswordHash, roleId: 3 },
    { id: 6, name: "Diana Developer", email: "diana@teamflow.com", passwordHash: defaultPasswordHash, roleId: 3 },
    { id: 7, name: "Dan Developer", email: "dan@teamflow.com", passwordHash: defaultPasswordHash, roleId: 3 },
    { id: 8, name: "Derek Developer", email: "derek@teamflow.com", passwordHash: defaultPasswordHash, roleId: 3 }
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {
        name: u.name,
        email: u.email,
        passwordHash: u.passwordHash,
        roleId: u.roleId
      },
      create: {
        id: u.id,
        name: u.name,
        email: u.email,
        passwordHash: u.passwordHash,
        roleId: u.roleId
      }
    });
  }
  console.log("Seeded 8 Users successfully (1 Admin, 2 Managers, 5 Developers).");

  // 3. Projects (2 Projects)
  const projects = [
    { id: 1, name: "Alpha Platform Core", description: "Rebuilding the core ledger backend engine and transactional payment gateways.", managerId: 2, status: ProjectStatus.Active },
    { id: 2, name: "Mobile App Redesign", description: "Modernizing UI for iOS and Android apps with new motion charts and fast dashboards.", managerId: 3, status: ProjectStatus.Active }
  ];

  for (const p of projects) {
    await prisma.project.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        description: p.description,
        managerId: p.managerId,
        status: p.status
      },
      create: {
        id: p.id,
        name: p.name,
        description: p.description,
        managerId: p.managerId,
        status: p.status
      }
    });
  }
  console.log("Seeded 2 Projects successfully.");

  // 4. Project Members
  const projectMembers = [
    // Project 1 Members
    { projectId: 1, userId: 1 },
    { projectId: 1, userId: 2 },
    { projectId: 1, userId: 4 },
    { projectId: 1, userId: 5 },
    { projectId: 1, userId: 6 },
    // Project 2 Members
    { projectId: 2, userId: 1 },
    { projectId: 2, userId: 3 },
    { projectId: 2, userId: 7 },
    { projectId: 2, userId: 8 }
  ];

  for (const m of projectMembers) {
    await prisma.projectMember.upsert({
      where: {
        projectId_userId: { projectId: m.projectId, userId: m.userId }
      },
      update: {},
      create: {
        projectId: m.projectId,
        userId: m.userId
      }
    });
  }
  console.log("Seeded Project Members successfully.");

  // 5. Tasks (10 Tasks across the 2 projects)
  const tasks = [
    // Project 1 Tasks
    { id: 1, title: "Database Schema Design", description: "Design the initial relational DB tables for core ledger transactions.", projectId: 1, assigneeId: 4, status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    { id: 2, title: "API Endpoint Specs", description: "Document REST endpoints and JSON contracts for the internal ledger API.", projectId: 1, assigneeId: 5, status: TaskStatus.COMPLETED, priority: TaskPriority.MEDIUM, dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    { id: 3, title: "Implement Ledger Logic", description: "Write transactional database queries ensuring zero ledger drift.", projectId: 1, assigneeId: 4, status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) },
    { id: 4, title: "Integrate Payment Gateway", description: "Implement Stripe Checkout webhook handlers and direct bank payouts.", projectId: 1, assigneeId: 6, status: TaskStatus.TO_DO, priority: TaskPriority.HIGH, dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },
    { id: 5, title: "Load Testing Backend", description: "Run k6 load generator scripts to find and resolve DB bottlenecks.", projectId: 1, assigneeId: 5, status: TaskStatus.TO_DO, priority: TaskPriority.MEDIUM, dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) },

    // Project 2 Tasks
    { id: 6, title: "Figma Mockups Design", description: "Prepare full UI patterns for dashboard, transactions list, and incident reporting.", projectId: 2, assigneeId: 7, status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { id: 7, title: "Setup React Native Expo", description: "Scaffold mobile workspace, config ESLint, and install state manager dependencies.", projectId: 2, assigneeId: 8, status: TaskStatus.COMPLETED, priority: TaskPriority.MEDIUM, dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
    { id: 8, title: "Code Dashboard Component", description: "Implement modern dashboard panels with motion transition charts.", projectId: 2, assigneeId: 7, status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000) },
    { id: 9, title: "Secure Storage Integration", description: "Configure secure storage for JWT persistence on keychain and keystore.", projectId: 2, assigneeId: 8, status: TaskStatus.TO_DO, priority: TaskPriority.HIGH, dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000) },
    { id: 10, title: "App Store Packaging", description: "Prepare fastlane match credentials, build parameters, and screenshots.", projectId: 2, assigneeId: 7, status: TaskStatus.TO_DO, priority: TaskPriority.LOW, dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000) }
  ];

  for (const t of tasks) {
    await prisma.task.upsert({
      where: { id: t.id },
      update: {
        title: t.title,
        description: t.description,
        projectId: t.projectId,
        assigneeId: t.assigneeId,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate
      },
      create: {
        id: t.id,
        title: t.title,
        description: t.description,
        projectId: t.projectId,
        assigneeId: t.assigneeId,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate
      }
    });
  }
  console.log("Seeded 10 Tasks successfully.");

  // 6. Task Dependencies
  const dependencies = [
    { taskId: 3, dependsOnTaskId: 1 },
    { taskId: 3, dependsOnTaskId: 2 },
    { taskId: 4, dependsOnTaskId: 2 },
    { taskId: 5, dependsOnTaskId: 3 },
    { taskId: 8, dependsOnTaskId: 6 },
    { taskId: 8, dependsOnTaskId: 7 },
    { taskId: 9, dependsOnTaskId: 7 },
    { taskId: 10, dependsOnTaskId: 8 }
  ];

  // Clean existing dependencies to avoid duplicates
  await prisma.taskDependency.deleteMany();
  for (const dep of dependencies) {
    await prisma.taskDependency.create({
      data: {
        taskId: dep.taskId,
        dependsOnTaskId: dep.dependsOnTaskId
      }
    });
  }
  console.log("Seeded Task Dependencies successfully.");

  // 7. Incidents (5 Incidents)
  const incidents = [
    { id: 1, title: "Transaction API Timeout", description: "Stripe connection times out under load during testing.", projectId: 1, status: IncidentStatus.In_Progress, severity: IncidentSeverity.Critical, assigneeId: 4 },
    { id: 2, title: "Database Connection Pool Leak", description: "Active connections exceed MySQL limit during load testing.", projectId: 1, status: IncidentStatus.Open, severity: IncidentSeverity.High, assigneeId: null },
    { id: 3, title: "Duplicate Ledger Entries", description: "Found duplicate items for single checkouts without unique transaction constraint.", projectId: 1, status: IncidentStatus.Resolved, severity: IncidentSeverity.Critical, assigneeId: 4 },
    { id: 4, title: "Dashboard Crashes on Android", description: "Null pointer crash occurs on Android when rendering empty charts lists.", projectId: 2, status: IncidentStatus.In_Progress, severity: IncidentSeverity.Medium, assigneeId: 7 },
    { id: 5, title: "Logout Button Delay", description: "Takes 3 seconds to clear session and redirect client upon logout click.", projectId: 2, status: IncidentStatus.Closed, severity: IncidentSeverity.Low, assigneeId: 8 }
  ];

  for (const inc of incidents) {
    await prisma.incident.upsert({
      where: { id: inc.id },
      update: {
        title: inc.title,
        description: inc.description,
        projectId: inc.projectId,
        status: inc.status,
        severity: inc.severity,
        assigneeId: inc.assigneeId
      },
      create: {
        id: inc.id,
        title: inc.title,
        description: inc.description,
        projectId: inc.projectId,
        status: inc.status,
        severity: inc.severity,
        assigneeId: inc.assigneeId
      }
    });
  }
  console.log("Seeded 5 Incidents successfully.");

  // 8. Notifications
  const notifications = [
    { id: 1, userId: 4, title: "Task Assigned", message: "You have been assigned to 'Database Schema Design'", isRead: true, type: NotificationType.TASK_ASSIGNED },
    { id: 2, userId: 4, title: "Incident Assigned", message: "A critical incident 'Transaction API Timeout' has been assigned to you.", isRead: false, type: NotificationType.INCIDENT_ASSIGNED },
    { id: 3, userId: 7, title: "Task Completed", message: "Your assigned task 'Figma Mockups Design' was marked as Completed.", isRead: true, type: NotificationType.TASK_COMPLETED },
    { id: 4, userId: 1, title: "Project Updated", message: "Alpha Platform Core specifications were updated by Marcus Manager.", isRead: false, type: NotificationType.PROJECT_UPDATED }
  ];

  for (const n of notifications) {
    await prisma.notification.upsert({
      where: { id: n.id },
      update: {
        userId: n.userId,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        type: n.type
      },
      create: {
        id: n.id,
        userId: n.userId,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        type: n.type
      }
    });
  }
  console.log("Seeded Notifications successfully.");

  // 9. Reports
  const reports = [
    { id: 1, title: "Q3 Task Velocity Report", queryParams: JSON.stringify({ projectId: 1, groupBy: "assignee" }), createdBy: 1 },
    { id: 2, title: "Ledger Outages Summary", queryParams: JSON.stringify({ severity: "Critical", resolved: true }), createdBy: 1 }
  ];

  for (const r of reports) {
    await prisma.report.upsert({
      where: { id: r.id },
      update: {
        title: r.title,
        queryParams: r.queryParams,
        createdBy: r.createdBy
      },
      create: {
        id: r.id,
        title: r.title,
        queryParams: r.queryParams,
        createdBy: r.createdBy
      }
    });
  }
  console.log("Seeded Reports successfully.");

  console.log("Seeding complete! Database is successfully populated.");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
