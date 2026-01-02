import * as admin from "firebase-admin";

import { runDailyClientTasks } from "../automation/dailyClientTasks";

const parseArgs = (): {
  date?: Date;
  tenantIds?: string[];
  branchIdsByTenant?: Record<string, string[]>;
  dryRun: boolean;
} => {
  const args = process.argv.slice(2);
  const branchIdsByTenant: Record<string, string[]> = {};
  let date: Date | undefined;
  let tenantIds: string[] | undefined;
  let dryRun = true;

  args.forEach((arg) => {
    if (arg.startsWith("--date=")) {
      const value = arg.slice("--date=".length);
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        date = parsed;
      }
      return;
    }

    if (arg === "--no-dry-run") {
      dryRun = false;
      return;
    }

    if (arg.startsWith("--tenants=")) {
      const raw = arg.slice("--tenants=".length);
      tenantIds = raw
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      return;
    }

    if (arg.startsWith("--branches=")) {
      const raw = arg.slice("--branches=".length);
      raw.split(";").forEach((tenantSpec) => {
        const [tenantId, branchesRaw] = tenantSpec.split(":");
        if (!tenantId || !branchesRaw) return;
        const branches = branchesRaw
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);
        if (branches.length) {
          branchIdsByTenant[tenantId.trim()] = branches;
        }
      });
    }
  });

  return {
    date,
    tenantIds,
    branchIdsByTenant: Object.keys(branchIdsByTenant).length ? branchIdsByTenant : undefined,
    dryRun,
  };
};

const log = {
  info: (message: string, data?: unknown) => console.log(`[info] ${message}`, data ?? ""),
  warn: (message: string, data?: unknown) => console.warn(`[warn] ${message}`, data ?? ""),
  error: (message: string, data?: unknown) => console.error(`[error] ${message}`, data ?? ""),
};

const bootstrap = async (): Promise<void> => {
  if (admin.apps.length === 0) {
    admin.initializeApp();
  }

  const options = parseArgs();

  log.info("runDailyClientTasks:options", {
    date: options.date?.toISOString(),
    tenantIds: options.tenantIds,
    branchIdsByTenant: options.branchIdsByTenant,
    dryRun: options.dryRun,
  });

  const result = await runDailyClientTasks({
    date: options.date,
    tenantIds: options.tenantIds,
    branchIdsByTenant: options.branchIdsByTenant,
    logger: log,
    dryRun: options.dryRun,
  });

  console.log(JSON.stringify(result, null, 2));
};

bootstrap().catch((err) => {
  log.error("runDailyClientTasks:failed", err);
  process.exitCode = 1;
});
