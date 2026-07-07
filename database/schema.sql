-- TeamFlow: Project Management & Incident Tracking System
-- MySQL 8.0 Relational Database Schema (3NF Normalized)

CREATE DATABASE IF NOT EXISTS teamflow_db;
USE teamflow_db;

-- 1. ROLES TABLE
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    INDEX idx_user_email (email)
) ENGINE=InnoDB;

-- 3. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    manager_id INT NOT NULL,
    status ENUM('Active', 'Closed') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_project_manager (manager_id)
) ENGINE=InnoDB;

-- 4. PROJECT MEMBERS TABLE (Junction table for Many-to-Many project-user relation)
CREATE TABLE IF NOT EXISTS project_members (
    project_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_member_user (user_id)
) ENGINE=InnoDB;

-- 5. TASKS TABLE
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    project_id INT NOT NULL,
    assignee_id INT,
    status ENUM('To Do', 'In Progress', 'Review', 'Completed') DEFAULT 'To Do',
    priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_task_project (project_id),
    INDEX idx_task_assignee (assignee_id)
) ENGINE=InnoDB;

-- 6. TASK DEPENDENCIES TABLE
CREATE TABLE IF NOT EXISTS task_dependencies (
    task_id INT NOT NULL,
    depends_on_task_id INT NOT NULL,
    PRIMARY KEY (task_id, depends_on_task_id),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    CONSTRAINT chk_no_self_dependency CHECK (task_id <> depends_on_task_id)
) ENGINE=InnoDB;

-- 7. INCIDENTS TABLE
CREATE TABLE IF NOT EXISTS incidents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    project_id INT NOT NULL,
    status ENUM('Open', 'In_Progress', 'Resolved', 'Closed') DEFAULT 'Open',
    severity ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'High',
    assignee_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_incident_project (project_id),
    INDEX idx_incident_assignee (assignee_id)
) ENGINE=InnoDB;

-- 8. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    type ENUM('Task Assigned', 'Task Completed', 'Project Updated', 'Incident Assigned') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notification_user (user_id)
) ENGINE=InnoDB;

-- 9. REPORTS TABLE
CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    query_params JSON,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_report_creator (created_by)
) ENGINE=InnoDB;

-- INITIAL SEED DATA
INSERT INTO roles (name, description) VALUES
('Admin', 'Full administrative control over all projects, users, and settings.'),
('Manager', 'Can create projects, assign tasks, manage members, and view reports.'),
('Developer', 'Can view projects, update task statuses, report incidents, and receive notifications.');
