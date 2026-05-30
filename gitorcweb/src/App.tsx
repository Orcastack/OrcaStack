import React from 'react';

const services = [
  {
    name: 'Git Service',
    role: 'Own Git RPC, refs, commits, trees, packfile ingestion',
    port: '8081 / 9081',
  },
  {
    name: 'Code Review',
    role: 'Changes, patchsets, approvals, merge rules',
    port: '8082 / 9082',
  },
  {
    name: 'CI Engine',
    role: 'Pipelines, workers, logs to HBase, artifacts to HDFS',
    port: '8083 / 9083',
  },
  {
    name: 'CD Engine',
    role: 'Promotions, environment history, rollback orchestration',
    port: '8084 / 9084',
  },
  {
    name: 'Analytics',
    role: 'Risk scoring, failure patterns, developer and branch metrics',
    port: '8085 / 9085',
  },
];

const pillars = [
  'Self-hosted on a local machine or a private VM cluster',
  'Own Git transport and metadata model instead of depending on SaaS APIs',
  'Gerrit-style review gates with rules, policy, and AI hooks',
  'Big-data backbone using HBase, HDFS, and event streaming',
];

export function App() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">gitorc platform</p>
        <h1>Self-hosted Git, review, CI/CD, and analytics in one control plane.</h1>
        <p className="lede">
          This workspace now starts from a local-first monorepo structure designed for Git hosting,
          Gerrit-style reviews, pipelines, deployments, and HBase/Hadoop-backed intelligence.
        </p>
      </section>

      <section className="grid two-up">
        <article className="panel">
          <h2>What is in place</h2>
          <ul>
            {pillars.map((pillar) => (
              <li key={pillar}>{pillar}</li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <h2>Default local endpoints</h2>
          <ul>
            <li>Gateway UI/API: http://localhost:5173 and http://localhost:8080</li>
            <li>Postgres metadata store: localhost:5432</li>
            <li>Redpanda event bus: localhost:9092</li>
            <li>HDFS NameNode UI: http://localhost:9870</li>
            <li>HBase master UI: http://localhost:16010</li>
          </ul>
        </article>
      </section>

      <section className="panel">
        <h2>Platform services</h2>
        <div className="card-grid">
          {services.map((service) => (
            <article key={service.name} className="card">
              <h3>{service.name}</h3>
              <p>{service.role}</p>
              <span>{service.port}</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
