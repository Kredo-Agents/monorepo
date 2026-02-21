import { randomUUID } from "crypto";
import { TRPCError } from "@trpc/server";
import { ENV } from "./_core/env";
import * as db from "./db";
import * as fs from "fs/promises";
import * as path from "path";

export type CronSchedule =
  | { kind: "at"; at: string }
  | { kind: "every"; everyMs: number }
  | { kind: "cron"; expr: string; tz?: string };

export type CronPayload =
  | { kind: "systemEvent"; text: string }
  | { kind: "agentTurn"; message: string; model?: string; timeoutSeconds?: number };

export type CronDelivery = {
  mode: "announce" | "webhook" | "none";
  channel?: string;
  to?: string;
  bestEffort?: boolean;
};

export type CronJob = {
  jobId: string;
  name: string;
  description?: string;
  enabled: boolean;
  schedule: CronSchedule;
  sessionTarget: "main" | "isolated";
  payload: CronPayload;
  delivery?: CronDelivery;
  deleteAfterRun?: boolean;
  wakeMode?: "now" | "next-heartbeat";
  agentId?: string;
};

export type CronRun = {
  runId: string;
  jobId: string;
  startedAt: string;
  completedAt?: string;
  status: "success" | "error" | "running";
  error?: string;
};

// ─── File paths ───────────────────────────────────────────────────────────────

function cronPaths(instanceId: number) {
  const configPath = path.join(ENV.instancesBasePath, instanceId.toString(), "config");
  const cronDir = path.join(configPath, "cron");
  return {
    jobsFile: path.join(cronDir, "jobs.json"),
    runsDir: path.join(cronDir, "runs"),
  };
}

async function readJobsFile(instanceId: number): Promise<CronJob[]> {
  const { jobsFile } = cronPaths(instanceId);
  try {
    const content = await fs.readFile(jobsFile, "utf-8");
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.jobs)) return parsed.jobs;
    return [];
  } catch (err: any) {
    if (err.code === "ENOENT") return [];
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Failed to read cron jobs: ${err.message}` });
  }
}

async function writeJobsFile(instanceId: number, jobs: CronJob[]): Promise<void> {
  const { jobsFile } = cronPaths(instanceId);
  await fs.mkdir(path.dirname(jobsFile), { recursive: true });
  await fs.writeFile(jobsFile, JSON.stringify(jobs, null, 2), "utf-8");
}

// ─── Auth guard ───────────────────────────────────────────────────────────────

async function getInstanceForCron(instanceId: number, userId: number) {
  const instance = await db.getInstanceByIdForUser(instanceId, userId);
  if (!instance) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Instance not found" });
  }
  return instance;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function listJobs(instanceId: number, userId: number): Promise<CronJob[]> {
  await getInstanceForCron(instanceId, userId);
  return readJobsFile(instanceId);
}

export async function addJob(
  instanceId: number,
  userId: number,
  job: Omit<CronJob, "jobId" | "enabled">
): Promise<CronJob> {
  await getInstanceForCron(instanceId, userId);
  const jobs = await readJobsFile(instanceId);
  const newJob: CronJob = {
    ...job,
    jobId: `job-${randomUUID().replace(/-/g, "").slice(0, 12)}`,
    enabled: true,
  };
  jobs.push(newJob);
  await writeJobsFile(instanceId, jobs);
  return newJob;
}

export async function updateJob(
  instanceId: number,
  userId: number,
  jobId: string,
  patch: Partial<Pick<CronJob, "enabled" | "name" | "schedule" | "payload" | "delivery">>
): Promise<{ success: boolean }> {
  await getInstanceForCron(instanceId, userId);
  const jobs = await readJobsFile(instanceId);
  const idx = jobs.findIndex(j => j.jobId === jobId);
  if (idx === -1) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
  }
  jobs[idx] = { ...jobs[idx], ...patch };
  await writeJobsFile(instanceId, jobs);
  return { success: true };
}

export async function removeJob(
  instanceId: number,
  userId: number,
  jobId: string
): Promise<{ success: boolean }> {
  await getInstanceForCron(instanceId, userId);
  const jobs = await readJobsFile(instanceId);
  const filtered = jobs.filter(j => j.jobId !== jobId);
  if (filtered.length === jobs.length) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
  }
  await writeJobsFile(instanceId, filtered);
  return { success: true };
}

export async function runJob(
  instanceId: number,
  userId: number,
  jobId: string
): Promise<{ success: boolean }> {
  await getInstanceForCron(instanceId, userId);
  const jobs = await readJobsFile(instanceId);
  const job = jobs.find(j => j.jobId === jobId);
  if (!job) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Job not found" });
  }
  // Trigger by setting wakeMode to "now" — the agent will pick this up on its next heartbeat
  const idx = jobs.findIndex(j => j.jobId === jobId);
  jobs[idx] = { ...jobs[idx], wakeMode: "now" };
  await writeJobsFile(instanceId, jobs);
  return { success: true };
}

export async function getJobRuns(
  instanceId: number,
  userId: number,
  jobId: string
): Promise<CronRun[]> {
  await getInstanceForCron(instanceId, userId);
  const { runsDir } = cronPaths(instanceId);
  const runsFile = path.join(runsDir, `${jobId}.jsonl`);
  try {
    const content = await fs.readFile(runsFile, "utf-8");
    return content
      .split("\n")
      .filter(line => line.trim())
      .map(line => JSON.parse(line) as CronRun)
      .reverse() // newest first
      .slice(0, 50);
  } catch (err: any) {
    if (err.code === "ENOENT") return [];
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Failed to read run history: ${err.message}` });
  }
}
