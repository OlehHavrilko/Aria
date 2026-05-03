export interface Skill {
  name: string;
  trigger: string;
  description: string;
  steps: string[];
  approval: boolean;
}

export const BUILTIN_SKILLS: Skill[] = [
  { 
    name: 'git-commit', 
    trigger: '/commit', 
    description: 'Commit changes with a message',
    steps: ['git add -A', 'git commit -m "{message}"'],
    approval: true
  },
  { 
    name: 'docker-deploy', 
    trigger: '/deploy', 
    description: 'Build and run containers',
    steps: ['docker build -t app .', 'docker-compose up -d'],
    approval: true
  },
  { 
    name: 'pg-backup', 
    trigger: '/backup', 
    description: 'Backup PostgreSQL database',
    steps: ['pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql'],
    approval: false
  },
  { 
    name: 'git-init', 
    trigger: '/init', 
    description: 'Initialize new repository',
    steps: ['git init', 'git add .', 'git commit -m "Auto: System Init"'],
    approval: true
  },
  { 
    name: 'npm-install', 
    trigger: '/install', 
    description: 'Install dependencies',
    steps: ['npm install'],
    approval: false
  },
  { 
    name: 'docker-run', 
    trigger: '/run', 
    description: 'Run container instances',
    steps: ['docker ps -a', 'docker run --rm hello-world'],
    approval: true
  },
];
