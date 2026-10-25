# Infrastructure roadmap

PR-001 only establishes CI, agent conventions and the infrastructure folder. No networked service exists yet. In later approved PRs we will add Docker Compose for local Node.js/web plus required persistence, isolated credentials via environment variables, healthchecks, migrations, deploy environments and secret management. Avoid inventing production providers or credentials here.
