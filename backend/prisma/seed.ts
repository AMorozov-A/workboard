import { PrismaClient, ProjectStatus, TaskPriority, TaskStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction([
    prisma.taskNote.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.task.deleteMany(),
    prisma.project.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const passwordHash = await bcrypt.hash('demo123', 10);

  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@workboard.app',
      passwordHash,
      name: 'Demo User',
    },
  });

  const projectsSeed = [
    {
      key: 'ECOM',
      taskKeyPrefix: 'T',
      title: 'E-commerce redesign',
      description: 'Refresh storefront UX, improve conversion, and modernize the UI kit.',
      status: ProjectStatus.active,
      tasks: [
        {
          key: 'T-1',
          title: 'Audit current checkout funnel',
          description: 'Collect baseline metrics and identify top drop-off points.',
          status: TaskStatus.todo,
          priority: TaskPriority.high,
        },
        {
          key: 'T-2',
          title: 'Create updated product page wireframes',
          description: 'Draft wireframes for mobile and desktop.',
          status: TaskStatus.in_progress,
          priority: TaskPriority.medium,
        },
        {
          key: 'T-3',
          title: 'Define design tokens and component inventory',
          description: 'List components and propose tokens for typography, spacing, and colors.',
          status: TaskStatus.in_progress,
          priority: TaskPriority.low,
        },
        {
          key: 'T-4',
          title: 'Implement new header and navigation',
          description: 'Roll out responsive header and mega menu.',
          status: TaskStatus.done,
          priority: TaskPriority.medium,
        },
        {
          key: 'T-5',
          title: 'Set up A/B test for CTA copy',
          description: 'Run an experiment on key landing pages.',
          status: TaskStatus.todo,
          priority: TaskPriority.low,
        },
      ],
    },
    {
      key: 'MOB',
      taskKeyPrefix: 'T',
      title: 'Mobile app MVP',
      description: 'Ship the first usable version with auth, core flows, and analytics.',
      status: ProjectStatus.active,
      tasks: [
        {
          key: 'T-1',
          title: 'Define MVP scope and success metrics',
          description: 'Agree on must-haves, nice-to-haves, and tracking.',
          status: TaskStatus.done,
          priority: TaskPriority.high,
        },
        {
          key: 'T-2',
          title: 'Implement onboarding flow',
          description: 'First-time user onboarding with permissions and hints.',
          status: TaskStatus.in_progress,
          priority: TaskPriority.high,
        },
        {
          key: 'T-3',
          title: 'Integrate push notifications',
          description: 'Add device token registration and basic notification types.',
          status: TaskStatus.todo,
          priority: TaskPriority.medium,
        },
        {
          key: 'T-4',
          title: 'Add offline mode for key screens',
          description: 'Cache critical data and show stale indicators.',
          status: TaskStatus.todo,
          priority: TaskPriority.low,
        },
      ],
    },
    {
      key: 'API',
      taskKeyPrefix: 'T',
      title: 'API integration',
      description: 'Connect external provider, add retries, and harden error handling.',
      status: ProjectStatus.paused,
      tasks: [
        {
          key: 'T-1',
          title: 'Review provider API docs and rate limits',
          description: 'Document endpoints, pagination, and limits.',
          status: TaskStatus.done,
          priority: TaskPriority.medium,
        },
        {
          key: 'T-2',
          title: 'Implement OAuth token refresh',
          description: 'Store tokens and refresh on 401.',
          status: TaskStatus.in_progress,
          priority: TaskPriority.high,
        },
        {
          key: 'T-3',
          title: 'Add retry/backoff strategy',
          description: 'Retry transient errors with exponential backoff.',
          status: TaskStatus.todo,
          priority: TaskPriority.high,
        },
        {
          key: 'T-4',
          title: 'Create integration health dashboard',
          description: 'Surface error rates and last successful sync.',
          status: TaskStatus.todo,
          priority: TaskPriority.low,
        },
        {
          key: 'T-5',
          title: 'Write integration tests against mock server',
          description: 'Cover token refresh and retry flows.',
          status: TaskStatus.todo,
          priority: TaskPriority.medium,
        },
      ],
    },
  ] as const;

  const createdProjects = await Promise.all(
    projectsSeed.map((p) =>
      prisma.project.create({
        data: {
          userId: demoUser.id,
          key: p.key,
          taskKeyPrefix: p.taskKeyPrefix,
          title: p.title,
          description: p.description,
          status: p.status,
          tasks: {
            create: p.tasks.map((t) => ({
              key: t.key,
              title: t.title,
              description: t.description,
              status: t.status,
              priority: t.priority,
              dueDate:
                t.status === TaskStatus.done
                  ? new Date(Date.now() - 1000 * 60 * 60 * 24 * 3)
                  : new Date(Date.now() + 1000 * 60 * 60 * 24 * (t.priority === TaskPriority.high ? 3 : 10)),
              labels: t.priority === TaskPriority.high ? ['urgent', 'demo'] : ['demo'],
            })),
          },
        },
        include: { tasks: true },
      }),
    ),
  );

  const byProjectKey = new Map(createdProjects.map((p) => [p.key, p]));

  const ecom = byProjectKey.get('ECOM');
  const mob = byProjectKey.get('MOB');
  const api = byProjectKey.get('API');

  if (!ecom || !mob || !api) {
    throw new Error('Seed error: expected projects were not created');
  }

  const pickTask = (projectKey: string, taskKey: string) => {
    const project = byProjectKey.get(projectKey);
    const task = project?.tasks.find((t) => t.key === taskKey);
    if (!project || !task) {
      throw new Error(`Seed error: task not found (${projectKey}/${taskKey})`);
    }
    return task;
  };

  const commentSeeds = [
    {
      task: pickTask('ECOM', 'T-2'),
      body: 'Wireframes look good — please add a quick variant for the sticky CTA on mobile.',
    },
    {
      task: pickTask('MOB', 'T-2'),
      body: 'Let’s keep onboarding to 3 steps max. Add analytics events for each step.',
    },
    {
      task: pickTask('API', 'T-2'),
      body: 'Token refresh should be resilient: guard against concurrent refresh storms.',
    },
  ] as const;

  await prisma.comment.createMany({
    data: commentSeeds.map((c) => ({
      taskId: c.task.id,
      authorId: demoUser.id,
      body: c.body,
    })),
  });

  const noteSeeds = [
    {
      task: pickTask('ECOM', 'T-1'),
      key: 'baseline',
      title: 'Baseline metrics',
      body: 'Capture conversion rate, checkout abandonment, and top device breakdown before changes.',
    },
    {
      task: pickTask('API', 'T-3'),
      key: 'retry-strategy',
      title: 'Retry strategy',
      body: 'Use exponential backoff with jitter. Only retry on 429/5xx and network timeouts.',
    },
  ] as const;

  await prisma.taskNote.createMany({
    data: noteSeeds.map((n) => ({
      taskId: n.task.id,
      key: n.key,
      title: n.title,
      body: n.body,
    })),
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
