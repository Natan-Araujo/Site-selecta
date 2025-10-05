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
      if (data.error) return alert('Erro: ' + data.error)
      alert('Candidatura enviada! ID: ' + data.application_id + '\nAgora você pode acessar sua trilha gamificada via perfil.')
    }).catch(e=>alert('Erro ao enviar candidatura'))
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
