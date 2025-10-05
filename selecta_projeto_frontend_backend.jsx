# Selecta — Plataforma Gamificada de Recrutamento

Projeto inicial (frontend + backend) para o site **Selecta**. A ideia: plataforma gamificada para recrutamento onde empresas publicam vagas (estágio, emprego) e candidatos passam por fases gamificadas (mini-challenges, quizzes, etapas) + análise de currículo.

Este repositório contém um scaffold simples, pronto para abrir no Visual Studio Code e subir no GitHub. Não é um produto final — é um ponto de partida com código funcional, arquitetura, e instruções de deploy como projeto (sem hospedagem obrigatória).

---

## Tecnologias sugeridas

- Frontend: React (Vite) + CSS simples (ou Tailwind se preferir)
- Backend: Node.js + Express
- DB: SQLite (para desenvolvimento) ou PostgreSQL (produção)
- Autenticação básica: JWT
- Versionamento: GitHub repo (pasta `frontend/` e `backend/`)

---

## Estrutura sugerida do repositório

```
selecta/
├─ frontend/          # app React (Vite)
│  ├─ src/
│  │  ├─ App.jsx
│  │  ├─ main.jsx
│  │  ├─ components/
│  │  │  ├─ Landing.jsx
│  │  │  ├─ JobCard.jsx
│  │  │  ├─ CandidateFlow.jsx
│  │  └─ styles.css
│  └─ package.json
└─ backend/
   ├─ src/
   │  ├─ server.js
   │  ├─ routes/
   │  │  ├─ jobs.js
   │  │  ├─ candidates.js
   │  └─ db.sqlite    # arquivo sqlite (gerado)
   └─ package.json
```

---

## Como usar (resumo rápido)

1. Clone o repositório no GitHub.
2. No VS Code abra as pastas `frontend` e `backend` em terminals separados.
3. Backend: `npm install` -> `npm run dev` (ou `node src/server.js`).
4. Frontend: `npm install` -> `npm run dev` (Vite) e abra `http://localhost:5173`.
5. Para enviar ao GitHub: criar repositório e `git push`.

---

## Backend — arquivo inicial `server.js`

```js
// backend/src/server.js
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(bodyParser.json());

const dbFile = path.join(__dirname, '..', 'db.sqlite');
const db = new sqlite3.Database(dbFile);

// Criar tabelas iniciais (jobs, candidates, stages, applications)
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
    progress JSON,
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
  db.run(`UPDATE applications SET score = ?, progress = ? WHERE id = ?`, [score, JSON.stringify(progress), id], function(err){
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
```

---

## Frontend — arquivos iniciais

### package.json (resumido)

```json
{
  "name": "selecta-frontend",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### src/main.jsx

```jsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')).render(<App />)
```

### src/App.jsx (layout simples)

```jsx
import React, {useEffect, useState} from 'react'
import Landing from './components/Landing'
import JobCard from './components/JobCard'

export default function App(){
  const [jobs, setJobs] = useState([])

  useEffect(()=>{
    fetch('/api/jobs')
      .then(r=>r.json())
      .then(setJobs)
  },[])

  return (
    <div className="app-root">
      <Landing />
      <section className="jobs">
        {jobs.map(j=> <JobCard key={j.id} job={j} />)}
      </section>
    </div>
  )
}
```

### src/components/Landing.jsx

```jsx
import React from 'react'

export default function Landing(){
  return (
    <header className="landing">
      <h1>Selecta</h1>
      <p>Plataforma gamificada de recrutamento — publique vagas, avalie candidatos por desafios e dinâmicas.</p>
    </header>
  )
}
```

### src/components/JobCard.jsx

```jsx
import React from 'react'

export default function JobCard({job}){
  const apply = () => {
    const name = prompt('Seu nome')
    const email = prompt('Seu email')
    const resume = prompt('Link para currículo ou texto resumido')
    if(!name || !email) return alert('nome e email obrigatórios')
    fetch('/api/apply', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ name, email, resume, job_id: job.id })
    }).then(r=>r.json()).then(data=>{
      alert('Candidatura enviada! ID: ' + data.application_id + '\nAgora você pode acessar sua trilha gamificada via perfil.')
    })
  }

  return (
    <div className="job-card">
      <h3>{job.title}</h3>
      <p><strong>Empresa:</strong> {job.company}</p>
      <p>{job.description}</p>
      <button onClick={apply}>Candidatar-se</button>
    </div>
  )
}
```

---

## Modelagem de Gamificação (conceito)

- Cada aplicação tem um campo `progress` (JSON) que guarda etapas: `[{stage:1, type:'quiz', score:40, passed:true}, ...]`.
- Pontuação total (`score`) é soma das etapas.
- Exemplo de etapas: Quiz técnica, Mini-game lógico (responder em X tempo), Simulação de atendimento (texto), Análise de currículo (manual pelo RH da empresa).
- Empresas visualizam dashboard com lista de candidatos e scores, e podem marcar para entrevista os candidatos com maiores pontuações.

---

## API endpoints recomendados

- `GET /api/jobs` — lista vagas
- `POST /api/jobs` — criar vaga
- `POST /api/apply` — criar candidatura (candidato + application)
- `GET /api/application/:id` — obter candidatura
- `POST /api/application/:id/progress` — atualizar progresso/score
- `GET /api/company/:companyId/applications` — listar candidaturas para empresa (protegido)

---

## README.md (exemplo de texto pronto para o GitHub)

```md
# Selecta

Plataforma gamificada de recrutamento — projeto educacional / portfólio.

## Como rodar

**Backend**

```bash
cd backend
npm install
node src/server.js
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Abra http://localhost:5173 (ou URL do Vite) e certifique-se que o backend está em http://localhost:4000. Para desenvolvimento local, configure proxy no `vite.config.js`.
```

---

## Próximos passos (sugestões de melhorias)

1. Implementar autenticação JWT para empresas e candidatos.
2. Painel administrativo para empresas com filtro por score, download de currículos e marcardor de entrevistas.
3. Implementar mini-games com canvas / React state (etapas gamificadas).
4. Melhorar UI com Tailwind ou componente pronto.
5. Testes automatizados (Jest + supertest)

---

Se quiser, eu já crio os arquivos iniciais com o conteúdo exato prontos para copiar/colar (server.js, App.jsx, etc.) — ou eu posso gerar um ZIP com os arquivos para você baixar. O que prefere que eu faça agora?

---

## Passo a passo DETALHADO — Visual Studio Code (Windows) e GitHub

Abaixo está o passo-a-passo prático para **abrir o projeto no Visual Studio Code** e **subir para o GitHub**. Todos os arquivos (server.js, App.jsx, componentes, package.json, vite.config.js, README, .gitignore) já estão neste documento — você pode copiar/colar diretamente para os arquivos no VS Code.

### Pré-requisitos

- Node.js (v16+ recomendado) instalado.
- Git instalado e configurado (git config --global user.name "Seu Nome"; git config --global user.email "seu@email")
- Visual Studio Code (VS Code)
- Conta no GitHub

---

### 1) Abrir o projeto no Visual Studio Code (modo rápido)

Opção A — se já tiver o repositório local (ou ZIP):

1. Extraia a pasta `selecta/` (se você fez o download como ZIP).
2. Abra o VS Code -> **File > Open Folder...** -> selecione a pasta `selecta`.
3. Abra dois terminais no VS Code (Terminal > New Terminal). Em um você roda o backend, no outro o frontend.

**Backend (terminal 1)**

```bash
cd backend
npm install
npm run dev
```

> `npm run dev` roda `nodemon src/server.js` (se tiver nodemon) ou `node src/server.js` se preferir.

**Frontend (terminal 2)**

```bash
cd frontend
npm install
npm run dev
```

Depois disso: abra `http://localhost:5173` para ver o frontend. O backend por padrão roda em `http://localhost:4000`.

---

### 2) Estrutura de pastas (recapitulando - veja os arquivos no documento)

```
selecta/
├─ frontend/
│  ├─ index.html
│  ├─ package.json
│  ├─ vite.config.js
│  └─ src/
│     ├─ main.jsx
│     ├─ App.jsx
│     ├─ components/
│     │  ├─ Landing.jsx
│     │  └─ JobCard.jsx
│     └─ styles.css
└─ backend/
   ├─ package.json
   └─ src/
      └─ server.js

.gitignore
README.md
```

> Observação: o conteúdo exato de cada arquivo está no topo do documento — copie/cole nos ficheiros correspondentes quando criar no VS Code.

---

### 3) Configurar proxy (frontend) — já incluído no `vite.config.js`

O `vite.config.js` deste projeto direciona chamadas `'/api'` para `http://localhost:4000`. Assim, no frontend você pode chamar `/api/jobs` sem lidar com CORS.

---

### 4) Criar repositório no GitHub e subir (passo-a-passo)

1. Crie um novo repositório em GitHub (por exemplo `selecta` ou `selecta-portfolio`). Você pode usar um único repositório (monorepo) com `frontend/` e `backend/` dentro.

2. No terminal (no diretório raiz `selecta/`):

```bash
git init
git add .
git commit -m "Initial commit — Selecta scaffold"
git branch -M main
# substitua <seu-usuario> e <seu-repo>
git remote add origin https://github.com/<seu-usuario>/<seu-repo>.git
git push -u origin main
```

3. Se quiser manter frontend e backend em repositórios separados, crie dois repositórios e repita o processo dentro de cada pasta (`frontend/` e `backend/`).

**.gitignore recomendado (já incluído no projeto):**

```
node_modules
frontend/node_modules
backend/node_modules
db.sqlite
.env
.DS_Store
/dist
```

---

### 5) Comandos úteis e dicas

- Instalar dependências apenas no backend e frontend com `npm install` em cada pasta.
- Se preferir usar `yarn` substitua por `yarn` / `yarn dev`.
- Para rodar o backend automaticamente quando salvar (dev): `npm install -D nodemon` e usar `"dev": "nodemon src/server.js"` no `package.json` do backend.
- Para testar endpoints use `curl` ou Insomnia/Postman.

---

### 6) Publicar apenas no GitHub (sem hospedar)

Se a ideia é apenas deixar o projeto como portfólio (sem hospedar), basta: `git push` — o código ficará visível no GitHub. Se quiser uma imagem demonstrativa, adicione screenshots na pasta `docs/` ou direto no README.

---

### 7) Próximo passo que eu posso fazer agora (opções)

- Gerar um arquivo ZIP com todo o projeto pronto (para baixar e abrir no VS Code). ✅
- Criar instruções extras para Windows (PowerShell) ou GitHub Desktop.
- Gerar um README mais detalhado (já existe um exemplo nesse documento).

Diga qual dessas opções prefere (ou eu posso gerar o ZIP agora e te passar o link). 

---

