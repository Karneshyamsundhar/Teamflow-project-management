import { Response } from "express";
import { prisma } from "../db/prisma.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { IncidentStatus, IncidentSeverity, NotificationType } from "@prisma/client";

export class IncidentController {
  // Create an Incident
  static async createIncident(req: AuthenticatedRequest, res: Response) {
    try {
      const { title, description, projectId, severity, assigneeId } = req.body;

      if (!title || !title.trim() || !description || !description.trim() || !projectId) {
        return res.status(400).json({ error: "Missing required fields (title, description, projectId)." });
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

      // If assignee is specified, verify membership in project roster
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
          return res.status(400).json({ error: "Assignee is not a member of this project roster." });
        }
      }

      const newIncident = await prisma.incident.create({
        data: {
          title: title.trim(),
          description: description.trim(),
          projectId: parsedProjectId,
          status: IncidentStatus.Open,
          severity: (severity || IncidentSeverity.High) as IncidentSeverity,
          assigneeId: parsedAssigneeId
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

      // Notify assignee if assigned on creation
      if (parsedAssigneeId) {
        await prisma.notification.create({
          data: {
            userId: parsedAssigneeId,
            title: "Incident Assigned",
            message: `You have been assigned incident '${newIncident.title}' in project '${project.name}'.`,
            type: NotificationType.INCIDENT_ASSIGNED
          }
        });
      }

      return res.status(201).json({
        message: "Incident reported successfully.",
        incident: {
          id: newIncident.id,
          title: newIncident.title,
          description: newIncident.description,
          projectId: newIncident.projectId,
          status: newIncident.status,
          severity: newIncident.severity,
          assigneeId: newIncident.assigneeId,
          assigneeName: newIncident.assignee ? newIncident.assignee.name : "Unassigned",
          createdAt: newIncident.createdAt.toISOString(),
          updatedAt: newIncident.updatedAt.toISOString()
        }
      });
    } catch (error: any) {
      console.error("Create incident failed:", error);
      return res.status(500).json({ error: error.message || "Failed to report incident." });
    }
  }

  // Get incidents for a project
  static async getIncidents(req: AuthenticatedRequest, res: Response) {
    try {
      const projectId = Number(req.query.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Query parameter projectId is required and must be a number." });
      }

      const incidents = await prisma.incident.findMany({
        where: { projectId },
        include: {
          assignee: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      });

      const enrichedIncidents = incidents.map(i => ({
        id: i.id,
        title: i.title,
        description: i.description,
        projectId: i.projectId,
        status: i.status,
        severity: i.severity,
        assigneeId: i.assigneeId,
        assigneeName: i.assignee ? i.assignee.name : "Unassigned",
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString()
      }));

      return res.json({ incidents: enrichedIncidents });
    } catch (error: any) {
      console.error("Retrieve incidents failed:", error);
      return res.status(500).json({ error: error.message || "Failed to retrieve incidents." });
    }
  }

  // Update Incident details / status
  static async updateIncident(req: AuthenticatedRequest, res: Response) {
    try {
      const incidentId = Number(req.params.id);
      if (isNaN(incidentId)) {
        return res.status(400).json({ error: "Invalid Incident ID." });
      }

      const { title, description, status, severity, assigneeId } = req.body;

      const incident = await prisma.incident.findUnique({
        where: { id: incidentId }
      });

      if (!incident) {
        return res.status(404).json({ error: "Incident not found." });
      }

      const updateData: any = {};

      if (title !== undefined) {
        if (!title.trim()) {
          return res.status(400).json({ error: "Incident title cannot be empty." });
        }
        updateData.title = title.trim();
      }

      if (description !== undefined) {
        if (!description.trim()) {
          return res.status(400).json({ error: "Incident description cannot be empty." });
        }
        updateData.description = description.trim();
      }

      if (severity !== undefined) {
        updateData.severity = severity as IncidentSeverity;
      }

      if (status !== undefined) {
        if (!Object.values(IncidentStatus).includes(status)) {
          return res.status(400).json({ error: "Invalid status value." });
        }
        updateData.status = status as IncidentStatus;
      }

      // Assignee verification and tracking
      if (assigneeId !== undefined) {
        const parsedAssigneeId = assigneeId ? Number(assigneeId) : null;
        if (parsedAssigneeId !== null) {
          const isMember = await prisma.projectMember.findUnique({
            where: {
              projectId_userId: {
                projectId: incident.projectId,
                userId: parsedAssigneeId
              }
            }
          });

          if (!isMember) {
            return res.status(400).json({ error: "Assignee is not a member of this project roster." });
          }
        }
        updateData.assigneeId = parsedAssigneeId;
      }

      const updated = await prisma.incident.update({
        where: { id: incidentId },
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

      // Trigger notification if assignee was changed/newly set
      if (updateData.assigneeId && updateData.assigneeId !== incident.assigneeId) {
        await prisma.notification.create({
          data: {
            userId: updateData.assigneeId,
            title: "Incident Assigned",
            message: `You have been assigned the incident '${updated.title}' in project '${updated.project.name}'.`,
            type: NotificationType.INCIDENT_ASSIGNED
          }
        });
      }

      return res.json({
        message: "Incident updated successfully.",
        incident: {
          id: updated.id,
          title: updated.title,
          description: updated.description,
          projectId: updated.projectId,
          status: updated.status,
          severity: updated.severity,
          assigneeId: updated.assigneeId,
          assigneeName: updated.assignee ? updated.assignee.name : "Unassigned",
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString()
        }
      });
    } catch (error: any) {
      console.error("Update incident failed:", error);
      return res.status(500).json({ error: error.message || "Failed to update incident." });
    }
  }

  // Delete Incident
  static async deleteIncident(req: AuthenticatedRequest, res: Response) {
    try {
      const incidentId = Number(req.params.id);
      if (isNaN(incidentId)) {
        return res.status(400).json({ error: "Invalid Incident ID." });
      }

      const exists = await prisma.incident.findUnique({
        where: { id: incidentId }
      });

      if (!exists) {
        return res.status(404).json({ error: "Incident not found." });
      }

      await prisma.incident.delete({
        where: { id: incidentId }
      });

      return res.json({ message: "Incident deleted successfully." });
    } catch (error: any) {
      console.error("Delete incident failed:", error);
      return res.status(500).json({ error: error.message || "Failed to delete incident." });
    }
  }
}
