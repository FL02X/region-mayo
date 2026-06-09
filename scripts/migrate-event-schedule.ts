// @ts-nocheck
/**
 * Migrates legacy event date/endDate/time fields into event.schedule.
 *
 * Usage:
 *   pnpm exec ts-node scripts/migrate-event-schedule.ts
 *   pnpm exec ts-node scripts/migrate-event-schedule.ts --commit
 */

const fs = require("fs") as typeof import("fs");
const { createClient } = require("@sanity/client") as typeof import("@sanity/client");

type LegacyEventDoc = {
  _id: string;
  title?: string;
  date?: string;
  endDate?: string;
  time?: string;
  schedule?: Array<{
    _key?: string;
    _type?: string;
    date?: string;
    time?: string;
    note?: string;
  }>;
};

function loadEnvFromFiles(filePaths: string[]) {
  for (const filePath of filePaths) {
    try {
      if (!fs.existsSync(filePath)) continue;
      const content = fs.readFileSync(filePath, "utf-8");
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const idx = trimmed.indexOf("=");
        if (idx <= 0) continue;
        const key = trimmed.slice(0, idx).trim();
        let value = trimmed.slice(idx + 1).trim();
        if (
          (value.startsWith("\"") && value.endsWith("\"")) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = value;
      }
    } catch {
      // Explicit environment variables take precedence; local env file failures are non-fatal.
    }
  }
}

const regionFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Hermosillo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function toRegionDateInput(value?: string) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return regionFormatter.format(date);
}

function addDays(dateInput: string, days: number) {
  const [year, month, day] = dateInput.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days, 12));
  return [
    String(date.getUTCFullYear()).padStart(4, "0"),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function buildSchedule(event: LegacyEventDoc) {
  const startDate = toRegionDateInput(event.date);
  if (!startDate) return null;

  const endDate = toRegionDateInput(event.endDate);
  const lastDate = endDate && endDate >= startDate ? endDate : startDate;
  const time = event.time?.trim() || "Por confirmar";
  const schedule = [];

  for (let index = 0, currentDate = startDate; currentDate <= lastDate; index += 1, currentDate = addDays(currentDate, 1)) {
    schedule.push({
      _key: `${currentDate.replace(/-/g, "")}-${index}`,
      _type: "occurrence",
      date: currentDate,
      time,
    });
  }

  return schedule;
}

async function main() {
  loadEnvFromFiles([".env.local", ".env"]);

  const commit = process.argv.includes("--commit");
  const projectId = process.env.SANITY_PROJECT_ID;
  const dataset = process.env.SANITY_DATASET;
  const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_READ_TOKEN;

  if (!projectId) throw new Error("Missing SANITY_PROJECT_ID");
  if (!dataset) throw new Error("Missing SANITY_DATASET");
  if (!token) throw new Error("Missing SANITY_WRITE_TOKEN or SANITY_READ_TOKEN");

  const client = createClient({
    projectId,
    dataset,
    apiVersion: process.env.SANITY_API_VERSION || "2024-01-01",
    token,
    useCdn: false,
  });

  const events = await client.fetch<LegacyEventDoc[]>(
    `*[_type == "event" && !defined(deletedAt)]{
      _id,
      title,
      date,
      endDate,
      time,
      schedule[]{_key, _type, date, time, note}
    } | order(title asc)`,
  );

  let patched = 0;
  let skippedExistingSchedule = 0;
  let skippedMissingDate = 0;
  let occurrences = 0;

  for (const event of events) {
    if (Array.isArray(event.schedule) && event.schedule.length > 0) {
      skippedExistingSchedule += 1;
      continue;
    }

    const schedule = buildSchedule(event);
    if (!schedule) {
      skippedMissingDate += 1;
      console.log(`[skip] ${event.title || event._id}: missing/invalid legacy date`);
      continue;
    }

    patched += 1;
    occurrences += schedule.length;
    console.log(
      `[${commit ? "patch" : "dry"}] ${event.title || event._id}: ${schedule.map((item) => `${item.date} ${item.time}`).join(", ")}`,
    );

    if (commit) {
      await client.patch(event._id).set({ schedule }).commit();
    }
  }

  console.log(
    `\nEvent schedule migration complete (commit=${commit}) events=${events.length} patched=${patched} occurrences=${occurrences} skippedExistingSchedule=${skippedExistingSchedule} skippedMissingDate=${skippedMissingDate}`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
