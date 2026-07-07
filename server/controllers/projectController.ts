import { Response } from "express";
import { prisma } from "../db/prisma.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { ProjectStatus, NotificationType } from "@prisma/client";

export class ProjectController {
  // Create a new project
  static async createProject(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, description, managerId } = req.body;
      // Default manager to current authenticated user unless specified (useful for Admins)
      const targetManagerId = managerId ? Number(managerId) : req.user?.id;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Project name is required and cannot be empty." });
      }

      if (!targetManagerId) {
        return res.status(401).json({ error: "Unauthorized. Missing user context." });
      }

      // Check if target manager exists
      const managerUser = await prisma.user.findUnique({
        where: { id: targetManagerId }
      });

      if (!managerUser) {
        return res.status(404).json({ error: "The designated Project Manager does not exist." });
      }

      // Create Project and automatically add the manager to project members
      const newProject = await prisma.project.create({
        data: {
          name: name.trim(),
          description: description || "",
          managerId: targetManagerId,
          status: ProjectStatus.Active,
          members: {
            create: {
              userId: targetManagerId
            }
          }
        },
        include: {
          manager: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // Create notification for the manager
      await prisma.notification.create({
        data: {
          userId: targetManagerId,
          title: "Project Established",
          message: `You successfully established the project '${newProject.name}' and have been registered as its Project Manager.`,
          type: NotificationType.PROJECT_UPDATED
        }
      });

      return res.status(201).json({
        message: "Project created successfully.",
        project: {
          ...newProject,
          managerName: newProject.manager.name,
          membersCount: 1
        }
      });
    } catch (error: any) {
      console.error("Create project failed:", error);
      return res.status(500).json({ error: error.message || "Failed to create project." });
    }
  }

  // Get list of projects with optional searching and pagination
  static async getProjects(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized." });
      }

      const { search, page, limit } = req.query;
      
      // Build filters
      const whereClause: any = {};

      // 1. Role-Based Visibility Check:
      // Admins (roleId 1) can view everything.
      // Managers (roleId 2) can view projects they manage OR are a member of.
      // Developers (roleId 3) can ONLY view projects they are a member of.
      if (req.user.roleId !== 1) {
        const myUserId = req.user.id;
        whereClause.OR = [
          { managerId: myUserId },
          {
            members: {
              some: { userId: myUserId }
            }
          }
        ];
      }

      // 2. Search filter: search matches name or description
      if (search) {
        const query = String(search).trim();
        whereClause.AND = [
          ...(whereClause.AND || []),
          {
            OR: [
              { name: { contains: query } },
              { description: { contains: query } }
            ]
          }
        ];
      }

      // 3. Pagination calculation
      let skip: number | undefined = undefined;
      let take: number | undefined = undefined;
      let pageNum = 1;
      let limitNum = 10;

      if (page || limit) {
        pageNum = Math.max(1, parseInt(String(page || 1), 10));
        limitNum = Math.max(1, parseInt(String(limit || 10), 10));
        skip = (pageNum - 1) * limitNum;
        take = limitNum;
      }

      // Get total matching records
      const totalCount = await prisma.project.count({
        where: whereClause
      });

      // Retrieve filtered and sliced records from MySQL
      const projects = await prisma.project.findMany({
        where: whereClause,
        include: {
          manager: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              members: true
            }
          }
        },
        orderBy: {
          updatedAt: "desc"
        },
        ...(skip !== undefined ? { skip } : {}),
        ...(take !== undefined ? { take } : {})
      });

      // Enrich objects for client dashboard expectation
      const enrichedProjects = projects.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        managerId: p.managerId,
        status: p.status,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        managerName: p.manager?.name || "Unknown",
        membersCount: p._count?.members || 0
      }));

      // Return unified response. Supports both simple requests and paginated requests
      return res.json({
        projects: enrichedProjects,
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(totalCount / limitNum)
        }
      });
    } catch (error: any) {
      console.error("Retrieve projects failed:", error);
      return res.status(500).json({ error: error.message || "Failed to retrieve projects." });
    }
  }

  // Get single project detailed configurations and current roster
  static async getProjectById(req: AuthenticatedRequest, res: Response) {
    try {
      const projectId = Number(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid Project ID." });
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
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
                include: {
                  role: true
                }
              }
            }
          }
        }
      });

      if (!project) {
        return res.status(404).json({ error: `Project with ID ${projectId} not found.` });
      }

      // Format members list for frontend table/avatars and sort properly: Admin (roleId 1), Manager (roleId 2), Developer (roleId 3)
      const formattedMembers = project.members.map(m => ({
        id: m.userId,
        name: m.user.name,
        email: m.user.email,
        roleId: m.user.roleId,
        roleName: m.user.role.name,
        joinedAt: m.joinedAt
      })).sort((a, b) => {
        if (a.roleId !== b.roleId) {
          return a.roleId - b.roleId;
        }
        return a.name.localeCompare(b.name);
      });

      return res.json({
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          managerId: project.managerId,
          managerName: project.manager?.name || "Unknown",
          status: project.status,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          members: formattedMembers
        }
      });
    } catch (error: any) {
      console.error("Retrieve project details failed:", error);
      return res.status(500).json({ error: error.message || "Failed to retrieve project detail." });
    }
  }

  // Update Project configuration and status
  static async updateProject(req: AuthenticatedRequest, res: Response) {
    try {
      const projectId = Number(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid Project ID." });
      }

      const { name, description, status, managerId } = req.body;

      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });

      if (!project) {
        return res.status(404).json({ error: "Project not found." });
      }

      // Authorization: Only the current Manager of the project or Admin can update it
      if (req.user?.roleId !== 1 && project.managerId !== req.user?.id) {
        return res.status(403).json({ error: "You are not authorized to edit this project." });
      }

      const updateData: any = {};
      if (name !== undefined) {
        if (!name.trim()) {
          return res.status(400).json({ error: "Project name cannot be empty." });
        }
        updateData.name = name.trim();
      }

      if (description !== undefined) {
        updateData.description = description;
      }

      if (status !== undefined) {
        if (status !== ProjectStatus.Active && status !== ProjectStatus.Closed) {
          return res.status(400).json({ error: "Invalid status value. Must be Active or Closed." });
        }
        updateData.status = status;
      }

      let managerChanged = false;
      let newManagerIdNum = 0;

      if (managerId !== undefined) {
        newManagerIdNum = Number(managerId);
        if (isNaN(newManagerIdNum)) {
          return res.status(400).json({ error: "Invalid Manager User ID." });
        }

        if (newManagerIdNum !== project.managerId) {
          // Check if new manager exists
          const managerUser = await prisma.user.findUnique({
            where: { id: newManagerIdNum }
          });
          if (!managerUser) {
            return res.status(404).json({ error: "Selected Project Manager does not exist." });
          }
          updateData.managerId = newManagerIdNum;
          managerChanged = true;
        }
      }

      // Execute atomic transaction update in Prisma
      const updatedProject = await prisma.project.update({
        where: { id: projectId },
        data: updateData,
        include: {
          manager: {
            select: {
              id: true,
              name: true
            }
          },
          members: {
            select: {
              userId: true
            }
          }
        }
      });

      // If manager changed, automatically add them to the project members roster if they aren't already there
      if (managerChanged) {
        const isMember = updatedProject.members.some(m => m.userId === newManagerIdNum);
        if (!isMember) {
          await prisma.projectMember.upsert({
            where: {
              projectId_userId: {
                projectId,
                userId: newManagerIdNum
              }
            },
            update: {},
            create: {
              projectId,
              userId: newManagerIdNum
            }
          });
        }

        // Notify new manager
        await prisma.notification.create({
          data: {
            userId: newManagerIdNum,
            title: "Assigned as Project Manager",
            message: `You have been assigned as the Project Manager of project '${updatedProject.name}'.`,
            type: NotificationType.PROJECT_UPDATED
          }
        });
      }

      // Send general notification to all members about project updates
      const memberNotifications = updatedProject.members.map(m => ({
        userId: m.userId,
        title: "Project Configuration Updated",
        message: `The project '${updatedProject.name}' configurations or lifecycle status have been updated.`,
        type: NotificationType.PROJECT_UPDATED
      }));

      if (memberNotifications.length > 0) {
        await prisma.notification.createMany({
          data: memberNotifications
        });
      }

      return res.json({
        message: "Project updated successfully.",
        project: {
          ...updatedProject,
          managerName: updatedProject.manager?.name || "Unknown",
          membersCount: updatedProject.members.length
        }
      });
    } catch (error: any) {
      console.error("Update project failed:", error);
      return res.status(500).json({ error: error.message || "Failed to update project." });
    }
  }

  // Delete project from database (Cascade deletes tasks, members, incidents)
  static async deleteProject(req: AuthenticatedRequest, res: Response) {
    try {
      const projectId = Number(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid Project ID." });
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });

      if (!project) {
        return res.status(404).json({ error: "Project not found." });
      }

      // Authorization: Only manager of the project or Admin can delete
      if (req.user?.roleId !== 1 && project.managerId !== req.user?.id) {
        return res.status(403).json({ error: "You are not authorized to delete this project." });
      }

      // Perform cascade delete in Prisma (Prisma handles relations on cascade delete specified in schema)
      await prisma.project.delete({
        where: { id: projectId }
      });

      return res.json({ 
        message: "Project and all associated tasks, members, incidents, and dependencies have been deleted successfully." 
      });
    } catch (error: any) {
      console.error("Delete project failed:", error);
      return res.status(500).json({ error: error.message || "Failed to delete project." });
    }
  }

  // Add a user to project members roster
  static async addMember(req: AuthenticatedRequest, res: Response) {
    try {
      const projectId = Number(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid Project ID." });
      }

      const userId = Number(req.body.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "A valid User ID is required." });
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });

      if (!project) {
        return res.status(404).json({ error: "Project not found." });
      }

      // Authorization: Project Manager or Admin can manage roster
      if (req.user?.roleId !== 1 && project.managerId !== req.user?.id) {
        return res.status(403).json({ error: "You are not authorized to add members to this project roster." });
      }

      // Check if target user exists in database
      const userToAdd = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!userToAdd) {
        return res.status(404).json({ error: "The selected user does not exist." });
      }

      // Check if they are already a member
      const existingMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId
          }
        }
      });

      if (existingMember) {
        return res.status(400).json({ error: "This user is already enrolled in the project roster." });
      }

      // Enroll member
      await prisma.projectMember.create({
        data: {
          projectId,
          userId
        }
      });

      // Send enrollment notification
      await prisma.notification.create({
        data: {
          userId,
          title: "Added to Project Roster",
          message: `You have been successfully added to the roster of the project '${project.name}'.`,
          type: NotificationType.PROJECT_UPDATED
        }
      });

      return res.json({ message: "Member successfully added to project roster." });
    } catch (error: any) {
      console.error("Add member failed:", error);
      return res.status(500).json({ error: error.message || "Failed to add project member." });
    }
  }

  // Remove member from project roster
  static async removeMember(req: AuthenticatedRequest, res: Response) {
    try {
      const projectId = Number(req.params.id);
      const userId = Number(req.params.userId);

      if (isNaN(projectId) || isNaN(userId)) {
        return res.status(400).json({ error: "Invalid project ID or user ID parameters." });
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });

      if (!project) {
        return res.status(404).json({ error: "Project not found." });
      }

      // Authorization
      if (req.user?.roleId !== 1 && project.managerId !== req.user?.id) {
        return res.status(403).json({ error: "You are not authorized to manage this project's roster." });
      }

      // Prevent removing the manager of the project
      if (userId === project.managerId) {
        return res.status(400).json({ error: "The designated Project Manager cannot be dismissed from the project roster." });
      }

      // Verify membership exists
      const existingMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId
          }
        }
      });

      if (!existingMember) {
        return res.status(404).json({ error: "The user is not registered on this project roster." });
      }

      // Perform transaction to remove from project roster and clean up task assignments
      await prisma.$transaction([
        // 1. Remove from project member table
        prisma.projectMember.delete({
          where: {
            projectId_userId: {
              projectId,
              userId
            }
          }
        }),
        // 2. Unassign tasks in this project currently assigned to this user
        prisma.task.updateMany({
          where: {
            projectId,
            assigneeId: userId
          },
          data: {
            assigneeId: null
          }
        })
      ]);

      return res.json({ 
        message: "Member dismissed from roster successfully, and all their task assignments in this project were reset to unassigned." 
      });
    } catch (error: any) {
      console.error("Remove member failed:", error);
      return res.status(500).json({ error: error.message || "Failed to remove member." });
    }
  }
}
