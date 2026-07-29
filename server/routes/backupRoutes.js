const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { db, logAudit, backupsDir } = require('../db');
const { authenticateToken, requireAdmin } = require('../auth');

const dbPath = process.env.DB_PATH || './data/database.sqlite';

// GET /api/backups - List all backups
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  const backups = db.prepare('SELECT * FROM backups ORDER BY created_at DESC').all();
  res.json({ backups });
});

// POST /api/backups/create - Trigger a database backup
router.post('/create', authenticateToken, requireAdmin, (req, res) => {
  try {
    const filename = `backup_${Date.now()}.sqlite`;
    const destPath = path.join(backupsDir, filename);

    // SQLite online backup / safe file copy
    db.backup(destPath)
      .then(() => {
        const stats = fs.statSync(destPath);
        const info = db.prepare(`
          INSERT INTO backups (file_name, file_path, created_by, file_size)
          VALUES (?, ?, ?, ?)
        `).run(filename, destPath, req.user.name || req.user.username, stats.size);

        logAudit(req.user.username, 'CREATE_BACKUP', `Created database backup ${filename}`, req.ip, req.user.id);
        res.json({ message: 'Backup created successfully', backupId: info.lastInsertRowid, filename });
      })
      .catch(err => {
        console.error('Backup creation error:', err);
        res.status(500).json({ error: `Backup failed: ${err.message}` });
      });

  } catch (err) {
    console.error('Backup trigger error:', err);
    res.status(500).json({ error: `Failed to trigger backup: ${err.message}` });
  }
});

// GET /api/backups/download/:id - Download backup file
router.get('/download/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const backup = db.prepare('SELECT * FROM backups WHERE id = ?').get(id);

  if (!backup || !fs.existsSync(backup.file_path)) {
    return res.status(404).json({ error: 'Backup file not found on disk.' });
  }

  logAudit(req.user.username, 'DOWNLOAD_BACKUP', `Downloaded backup ${backup.file_name}`, req.ip, req.user.id);
  res.download(backup.file_path, backup.file_name);
});

module.exports = router;
