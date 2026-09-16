const router = require('express').Router();
const fs = require('fs');
const os = require('os');
const path = require('path');
const db = require('../db/knex');

// Resuelve la DB viva igual que knexfile.js (funciona local y en Docker).
function resolveDbPath() {
  return process.env.DB_FILENAME || path.join(__dirname, '..', 'db', 'imperio_del_dinero.sqlite3');
}

function stamp(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// GET /api/respaldo/sqlite — descarga un snapshot consistente de la DB.
// Usa VACUUM INTO (snapshot transaccional) en vez de copiar el archivo vivo,
// así la copia nunca sale a medias aunque haya una escritura en curso.
// La DB original solo se lee: no hay riesgo de corrupción.
router.get('/sqlite', async (req, res) => {
  const dbPath = resolveDbPath();
  if (!fs.existsSync(dbPath)) {
    return res.status(404).json({ error: 'Base de datos no encontrada' });
  }

  const tmpPath = path.join(os.tmpdir(), `imperio_del_dinero_${Date.now()}.sqlite3`);
  try {
    await db.raw('VACUUM INTO ?', [tmpPath]);
  } catch (err) {
    return res.status(500).json({ error: 'No se pudo generar el respaldo' });
  }

  res.download(tmpPath, `imperio_del_dinero_${stamp()}.sqlite3`, (err) => {
    fs.unlink(tmpPath, () => {});
    if (err && !res.headersSent) {
      res.status(500).json({ error: 'No se pudo descargar el respaldo' });
    }
  });
});

module.exports = router;
