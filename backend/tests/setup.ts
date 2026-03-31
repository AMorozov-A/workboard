/// <reference types="vitest/globals" />

import { execSync } from 'node:child_process';
import path from 'node:path';
import { createApp } from '../src/app';
import { prisma } from '../src/db/client';

/** Для прямого использования в тестах (Supertest, Prisma). */
export { prisma, createApp };

const backendRoot = path.resolve(__dirname, '..');

beforeAll(() => {
  execSync('npx prisma migrate deploy', {
    cwd: backendRoot,
    env: process.env,
    stdio: 'pipe',
  });
});

beforeEach(async () => {
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
