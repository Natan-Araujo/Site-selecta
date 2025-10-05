const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(bodyParser.json());

const dbFile = path.join(__dirname, '..', '..', 'db.sqlite');
const db = new sqlite3.Database(dbFile);

// Criar tabelas iniciais (jobs, candidates, applications)
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT,
    title TEXT,
    description TEXT,
    created_at TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    resume TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER,
    candidate_id INTEGER,
    score INTEGER DEFAULT 0,
    progress TEXT,
    created_at TEXT
  )`);
});

// Rotas: publicar vaga
app.post('/api/jobs', (req, res) => {
  const { company, title, description } = req.body;
  const created_at = new Date().toISOString();
  const stmt = db.prepare(`INSERT INTO jobs (company, title, description, created_at) VALUES (?,?,?,?)`);
  stmt.run(company, title, description, created_at, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

// Listar vagas
app.get('/api/jobs', (req, res) => {
  db.all('SELECT * FROM jobs ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Candidatar-se: cria candidate e application
app.post('/api/apply', (req, res) => {
  const { name, email, resume, job_id } = req.body;
  if (!name || !email || !job_id) return res.status(400).json({ error: 'name, email e job_id são obrigatórios' });
  db.run(`INSERT INTO candidates (name,email,resume) VALUES (?,?,?)`, [name,email,resume], function(err){
    if (err) return res.status(500).json({ error: err.message });
    const candidate_id = this.lastID;
    const created_at = new Date().toISOString();
    db.run(`INSERT INTO applications (job_id, candidate_id, progress, created_at) VALUES (?,?,?,?)`,
      [job_id, candidate_id, JSON.stringify({ stage: 0 }), created_at], function(err){
        if (err) return res.status(500).json({ error: err.message });
        res.json({ application_id: this.lastID });
      });
  });
});

// Atualizar progresso (ex: pontuação da etapa gamificada)
app.post('/api/application/:id/progress', (req, res) => {
  const id = req.params.id;
  const { score, progress } = req.body; // progress é um objeto JSON
  db.run(`UPDATE applications SET score = ?, progress = ? WHERE id = ?`, [score || 0, JSON.stringify(progress || {}), id], function(err){
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
});

// Obter candidatura
app.get('/api/application/:id', (req, res) => {
  const id = req.params.id;
  db.get(`SELECT a.*, c.name, c.email FROM applications a JOIN candidates c ON a.candidate_id = c.id WHERE a.id = ?`, [id], (err,row)=>{
    if (err) return res.status(500).json({ error: err.message });
    res.json(row);
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=> console.log(`Backend rodando em http://localhost:${PORT}`));
