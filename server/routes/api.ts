import { Router } from "express";
import { authenticateJWT, authorizeRoles } from "../middleware/authMiddleware.js";
import { AuthController } from "../controllers/authController.js";
import { ProjectController } from "../controllers/projectController.js";
import { TaskController } from "../controllers/taskController.js";
import { IncidentController } from "../controllers/incidentController.js";
import { NotificationController } from "../controllers/notificationController.js";
import { ReportController } from "../controllers/reportController.js";

const router = Router();

// ==========================================
// 1. AUTHENTICATION & USERS
// ==========================================
router.post("/auth/register", AuthController.register);
router.post("/auth/login", AuthController.login);
router.get("/auth/profile", authenticateJWT, AuthController.getProfile);
router.put("/auth/profile", authenticateJWT, AuthController.updateProfile);
router.get("/auth/users", authenticateJWT, AuthController.getAllUsers);
router.post("/auth/forgot-password", AuthController.forgotPassword);
router.post("/auth/reset-password", AuthController.resetPassword);
router.post("/auth/change-password", authenticateJWT, AuthController.changePassword);

// ==========================================
// 2. PROJECTS (Admins & Managers can create/update/delete)
// ==========================================
router.post(
  "/projects", 
  authenticateJWT, 
  authorizeRoles(1, 2), // Admin, Manager
  ProjectController.createProject
);
router.get("/projects", authenticateJWT, ProjectController.getProjects);
router.get("/projects/:id", authenticateJWT, ProjectController.getProjectById);
router.put(
  "/projects/:id", 
  authenticateJWT, 
  authorizeRoles(1, 2), 
  ProjectController.updateProject
);
router.delete(
  "/projects/:id", 
  authenticateJWT, 
  authorizeRoles(1, 2), 
  ProjectController.deleteProject
);

// Project Member Associations
router.post(
  "/projects/:id/members", 
  authenticateJWT, 
  authorizeRoles(1, 2), 
  ProjectController.addMember
);
router.delete(
  "/projects/:id/members/:userId", 
  authenticateJWT, 
  authorizeRoles(1, 2), 
  ProjectController.removeMember
);

// ==========================================
// 3. TASKS
// ==========================================
router.post("/tasks", authenticateJWT, TaskController.createTask);
router.get("/tasks", authenticateJWT, TaskController.getTasks);
router.get("/tasks/:id", authenticateJWT, TaskController.getTaskById);
router.put("/tasks/:id", authenticateJWT, TaskController.updateTask);
router.put("/tasks/:id/status", authenticateJWT, TaskController.updateTaskStatus);
router.delete("/tasks/:id", authenticateJWT, TaskController.deleteTask);

// Task Dependencies
router.post("/tasks/:id/dependencies", authenticateJWT, TaskController.addTaskDependency);
router.delete("/tasks/:id/dependencies/:dependsOnTaskId", authenticateJWT, TaskController.removeTaskDependency);

// ==========================================
// 4. INCIDENTS
// ==========================================
router.post("/incidents", authenticateJWT, IncidentController.createIncident);
router.get("/incidents", authenticateJWT, IncidentController.getIncidents);
router.put("/incidents/:id", authenticateJWT, IncidentController.updateIncident);
router.delete("/incidents/:id", authenticateJWT, IncidentController.deleteIncident);

// ==========================================
// 5. NOTIFICATIONS
// ==========================================
router.get("/notifications", authenticateJWT, NotificationController.getNotifications);
router.put("/notifications/read-all", authenticateJWT, NotificationController.markAllAsRead);
router.put("/notifications/:id/read", authenticateJWT, NotificationController.markAsRead);

// ==========================================
// 6. REPORTS & DASHBOARD
// ==========================================
router.get("/reports/dashboard", authenticateJWT, ReportController.getDashboardStats);
router.post("/reports", authenticateJWT, ReportController.saveReport);
router.get("/reports", authenticateJWT, ReportController.getSavedReports);
router.delete("/reports/:id", authenticateJWT, ReportController.deleteReport);

export { router as apiRouter };
