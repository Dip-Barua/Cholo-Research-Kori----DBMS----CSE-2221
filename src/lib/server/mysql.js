import mysql from "mysql2/promise"

let pool

function getDatabaseConfig() {
  return {
    host: process.env.MYSQL_HOST || process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306),
    user: process.env.MYSQL_USER || process.env.DB_USER || "root",
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME || "cholo_research_kori",
    connectionLimit: 5,
    waitForConnections: true,
    namedPlaceholders: true,
  }
}

export function getPool() {
  if (!pool) {
    pool = mysql.createPool(getDatabaseConfig())
  }

  return pool
}

export async function ensureAppTables() {
  const connection = await getPool().getConnection()
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(128) PRIMARY KEY,
        name VARCHAR(191) NOT NULL,
        email VARCHAR(191) NOT NULL UNIQUE,
        password VARCHAR(191) NOT NULL,
        university VARCHAR(191),
        department VARCHAR(191),
        role VARCHAR(64) NOT NULL,
        bio TEXT,
        research_interests JSON,
        skills JSON,
        avatar_seed VARCHAR(32),
        joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        active TINYINT(1) NOT NULL DEFAULT 1
      )
    `)

    await connection.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(128) PRIMARY KEY,
        supervisor_id VARCHAR(128) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        field VARCHAR(191),
        skills JSON,
        status VARCHAR(64),
        progress INT NOT NULL DEFAULT 0,
        max_members INT,
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        lab_id VARCHAR(128),
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    await connection.query(`
      CREATE TABLE IF NOT EXISTS project_members (
        id VARCHAR(128) PRIMARY KEY,
        project_id VARCHAR(128) NOT NULL,
        user_id VARCHAR(128) NOT NULL,
        joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY idx_project_members_project (project_id),
        KEY idx_project_members_user (user_id)
      )
    `)

    await connection.query(`
      CREATE TABLE IF NOT EXISTS project_skills (
        id VARCHAR(128) PRIMARY KEY,
        project_id VARCHAR(128) NOT NULL,
        skill VARCHAR(191) NOT NULL,
        KEY idx_project_skills_project (project_id)
      )
    `)

    await connection.query(`
      CREATE TABLE IF NOT EXISTS labs (
        id VARCHAR(128) PRIMARY KEY,
        supervisor_id VARCHAR(128) NOT NULL,
        name VARCHAR(191) NOT NULL,
        department VARCHAR(191),
        description TEXT,
        research_areas JSON,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    await connection.query(`
      CREATE TABLE IF NOT EXISTS lab_members (
        id VARCHAR(128) PRIMARY KEY,
        lab_id VARCHAR(128) NOT NULL,
        user_id VARCHAR(128) NOT NULL,
        joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY idx_lab_members_lab (lab_id),
        KEY idx_lab_members_user (user_id)
      )
    `)

    await connection.query(`
      CREATE TABLE IF NOT EXISTS lab_projects (
        id VARCHAR(128) PRIMARY KEY,
        lab_id VARCHAR(128) NOT NULL,
        project_id VARCHAR(128) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY idx_lab_projects_lab (lab_id),
        KEY idx_lab_projects_project (project_id)
      )
    `)

    await connection.query(`
      CREATE TABLE IF NOT EXISTS conversation_participants (
        id VARCHAR(128) PRIMARY KEY,
        conversation_id VARCHAR(128) NOT NULL,
        user_id VARCHAR(128) NOT NULL,
        joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY idx_conv_part_conv (conversation_id),
        KEY idx_conv_part_user (user_id)
      )
    `)

    await connection.query(`
      CREATE TABLE IF NOT EXISTS collaboration_requests (
        id VARCHAR(128) PRIMARY KEY,
        sender_id VARCHAR(128) NOT NULL,
        receiver_id VARCHAR(128) NOT NULL,
        project_id VARCHAR(128),
        message TEXT,
        status VARCHAR(32) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    await connection.query(`
      CREATE TABLE IF NOT EXISTS collaborations (
        id VARCHAR(128) PRIMARY KEY,
        project_id VARCHAR(128),
        user_ids JSON,
        role VARCHAR(64),
        status VARCHAR(64),
        started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    await connection.query(`
      CREATE TABLE IF NOT EXISTS collaboration_members (
        id VARCHAR(128) PRIMARY KEY,
        collaboration_id VARCHAR(128) NOT NULL,
        user_id VARCHAR(128) NOT NULL,
        role VARCHAR(64),
        joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY idx_collab_members_collab (collaboration_id),
        KEY idx_collab_members_user (user_id)
      )
    `)

    await connection.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(128) PRIMARY KEY,
        subject VARCHAR(255),
        participant_ids JSON,
        message_ids JSON,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    await connection.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(128) PRIMARY KEY,
        conversation_id VARCHAR(128) NOT NULL,
        sender_id VARCHAR(128) NOT NULL,
        receiver_id VARCHAR(128) NOT NULL,
        content TEXT,
        read_flag TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await connection.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(128) PRIMARY KEY,
        project_id VARCHAR(128),
        assigned_to VARCHAR(128),
        created_by VARCHAR(128) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        priority VARCHAR(32),
        status VARCHAR(32),
        due_date DATE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    await connection.query(`
      CREATE TABLE IF NOT EXISTS milestones (
        id VARCHAR(128) PRIMARY KEY,
        project_id VARCHAR(128),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        due_date DATE,
        status VARCHAR(32),
        progress INT NOT NULL DEFAULT 0,
        created_by VARCHAR(128),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    await connection.query(`
      CREATE TABLE IF NOT EXISTS publications (
        id VARCHAR(128) PRIMARY KEY,
        project_id VARCHAR(128),
        author_ids JSON,
        title VARCHAR(255) NOT NULL,
        venue VARCHAR(191),
        year INT,
        status VARCHAR(64),
        link TEXT,
        created_by VARCHAR(128),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    await connection.query(`
      CREATE TABLE IF NOT EXISTS publication_authors (
        id VARCHAR(128) PRIMARY KEY,
        publication_id VARCHAR(128) NOT NULL,
        author_id VARCHAR(128) NOT NULL,
        author_order INT NOT NULL DEFAULT 0,
        KEY idx_pub_auth_pub (publication_id),
        KEY idx_pub_auth_author (author_id)
      )
    `)

    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(128) PRIMARY KEY,
        user_id VARCHAR(128) NOT NULL,
        type VARCHAR(64),
        title VARCHAR(255),
        message TEXT,
        href VARCHAR(255),
        related_id VARCHAR(128),
        read_flag TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id VARCHAR(128) PRIMARY KEY,
        user_id VARCHAR(128) NOT NULL UNIQUE,
        notifications JSON,
        appearance JSON,
        privacy JSON,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    await connection.query(`
      CREATE TABLE IF NOT EXISTS auth_sessions (
        id VARCHAR(128) PRIMARY KEY,
        user_id VARCHAR(128) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    await connection.query(`
      CREATE TABLE IF NOT EXISTS app_state (
        id TINYINT PRIMARY KEY,
        payload JSON NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    const columnMigrations = [
      ["labs", "member_ids", "JSON"],
      ["collaboration_requests", "lab_id", "VARCHAR(128)"],
      ["conversations", "conversation_type", "VARCHAR(32) DEFAULT 'direct'"],
      ["conversations", "project_id", "VARCHAR(128)"],
      ["conversations", "lab_id", "VARCHAR(128)"],
      ["collaborations", "lab_id", "VARCHAR(128)"],
    ]

    for (const [table, column, definition] of columnMigrations) {
      try {
        await connection.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
      } catch (error) {
        if (error.code !== "ER_DUP_FIELDNAME") {
          throw error
        }
      }
    }
  } finally {
    connection.release()
  }
}
