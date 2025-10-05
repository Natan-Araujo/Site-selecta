import React, {useEffect, useState} from 'react'
import Landing from './components/Landing'
import JobCard from './components/JobCard'
import About from "./components/About";
import React, { useEffect, useState } from 'react'
export default function App(){
  const [jobs, setJobs] = useState([])

  useEffect(()=>{
    fetch('/api/jobs')
      .then(r=>r.json())
      .then(setJobs)
      .catch(()=>setJobs([]))
  },[])

  return (
    <div className="app-root">
       <Topbar />
      <Landing />
      <section className="jobs">
        {jobs.length === 0 ? <p>Nenhuma vaga publicada ainda.</p> : jobs.map(j=> <JobCard key={j.id} job={j} />)}
      </section>
    </div>
  )
}
return (
  <div className="app-root">
    <Topbar />
    <Landing />
    
    <section className="jobs">
      {jobs.length === 0 
        ? <p>Nenhuma vaga publicada ainda.</p> 
        : jobs.map(j => <JobCard key={j.id} job={j} />)}
    </section>

    {/* Aqui você renderiza a seção nova */}
    <About />
  </div>
);

 <section className="about">
  <h2>Sobre o Selecta</h2>
  <p>
    O Selecta é uma plataforma inovadora de <strong>recrutamento gamificado</strong> que
    transforma a forma como empresas encontram talentos e candidatos participam dos
    processos seletivos.
  </p>
  <p>
    Combinando <strong>tecnologia, inteligência de dados e desafios interativos</strong>, o
    Selecta vai além do currículo tradicional: os candidatos demonstram suas habilidades
    na prática, enquanto as empresas acompanham métricas reais de desempenho.
  </p>
  <p>
    O objetivo é <strong>tornar a seleção mais justa, dinâmica e eficiente</strong>, reduzindo
    a burocracia e aproximando profissionais e organizações de maneira transparente.
  </p>
  <p>
    Se você é uma empresa em busca de talentos ou um candidato pronto para novos
    desafios, o Selecta é o lugar certo para conectar oportunidades e transformar o
    recrutamento em uma experiência única.
  </p>
</section>
