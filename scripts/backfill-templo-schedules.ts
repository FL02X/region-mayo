/**
 * Backfill structured schedules for templos in Sanity.
 *
 * Usage:
 *   pnpm ts-node scripts/backfill-templo-schedules.ts --commit
 *
 * Notes:
 * - Matches by normalized temploName with tolerant keyword scoring.
 * - Only writes `schedule` field.
 * - Does not delete legacy `description` notes.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createClient } = require("@sanity/client") as typeof import("@sanity/client");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require("fs") as typeof import("fs");

function loadEnvFromFiles(filePaths: string[]) {
  for (const filePath of filePaths) {
    try {
      if (!fs.existsSync(filePath)) continue;
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const idx = trimmed.indexOf("=");
        if (idx <= 0) continue;
        const key = trimmed.slice(0, idx).trim();
        let value = trimmed.slice(idx + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    } catch {
      // ignore
    }
  }
}

loadEnvFromFiles([
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
]);

const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
  process.env.SANITY_PROJECT_ID ||
  process.env.SANITY_STUDIO_PROJECT_ID ||
  "iqybd074";

const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET ||
  process.env.SANITY_DATASET ||
  process.env.SANITY_STUDIO_DATASET ||
  "production";

const token = process.env.SANITY_WRITE_TOKEN;

if (!token) {
  console.error("❌ Missing SANITY_WRITE_TOKEN in environment.");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2025-01-01",
  token,
  useCdn: false,
});

type ServiceInput = {
  day:
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";
  startTime: string;
  endTime?: string;
  label?: string;
};

type ScheduleTarget = {
  key: string;
  matchAny: string[];
  requiredAny?: string[];
  services?: ServiceInput[];
};

const TUES_THU_SUN_630_630_1000: ServiceInput[] = [
  { day: "tuesday", startTime: "18:30", label: "Culto" },
  { day: "thursday", startTime: "18:30", label: "Culto" },
  { day: "sunday", startTime: "10:00", label: "Culto" },
];

const targets: ScheduleTarget[] = [
  {
    key: "bethel-villa-juarez",
    matchAny: ["bethel villa juarez", "1ra iglesia gentil de cristo villa juarez"],
    services: TUES_THU_SUN_630_630_1000,
  },
  {
    key: "antioquia-navojoa",
    matchAny: ["antioquia navojoa", "1ra iglesia gentil de cristo navojoa"],
    requiredAny: ["antioquia", "1ra"],
    services: [
      { day: "tuesday", startTime: "19:00", label: "Culto" },
      { day: "thursday", startTime: "19:00", label: "Culto" },
      { day: "sunday", startTime: "10:00", label: "Culto" },
    ],
  },
  {
    key: "2da-navojoa",
    matchAny: ["2da iglesia gentil de cristo navojoa", "2da navojoa"],
    requiredAny: ["2da"],
    services: [
      { day: "tuesday", startTime: "19:00", label: "Culto" },
      { day: "thursday", startTime: "19:00", label: "Culto" },
      { day: "sunday", startTime: "18:00", label: "Culto" },
    ],
  },
  {
    key: "jerusalen-villa-juarez",
    matchAny: ["jerusalen villa juarez", "2da iglesia gentil de cristo villa juarez"],
    services: [
      { day: "tuesday", startTime: "18:30", label: "Culto" },
      { day: "thursday", startTime: "18:30", label: "Culto" },
      { day: "sunday", startTime: "10:00", label: "Culto" },
    ],
  },
  {
    key: "campo-bacobampo",
    matchAny: ["campo de evangelizmo en bacobampo", "campo de evangelismo en bacobampo", "bacobampo"],
  },
  {
    key: "campo-lopez-mateos",
    matchAny: ["campo de evangelizmo en lopez mateos", "campo de evangelismo en lopez mateos", "lopez mateos"],
  },
  {
    key: "campo-quiriego",
    matchAny: ["campo de evangelizmo en quiriego", "campo de evangelismo en quiriego", "quiriego"],
  },
  {
    key: "campo-sirebampo",
    matchAny: ["campo de evangelizmo en sirebampo", "campo de evangelismo en sirebampo", "sirebampo"],
  },
  {
    key: "bachantahui",
    matchAny: ["iglesia bachantahui", "bachantahui"],
    services: TUES_THU_SUN_630_630_1000,
  },
  {
    key: "col-union-huatabampo",
    matchAny: ["iglesia col union huatabanpo", "iglesia col union huatabampo", "union huatabampo"],
    services: TUES_THU_SUN_630_630_1000,
  },
  {
    key: "buasyaciacobe",
    matchAny: ["iglesia gentil de cristo buasyaciacobe", "buasyaciacobe"],
    services: [
      { day: "tuesday", startTime: "18:30", label: "Culto" },
      { day: "thursday", startTime: "18:30", label: "Culto" },
      { day: "sunday", startTime: "17:00", label: "Culto" },
    ],
  },
  {
    key: "elim-huirachaca",
    matchAny: ["iglesia gentil de cristo huirachaca", "templo elim", "huirachaca"],
    services: [
      { day: "tuesday", startTime: "17:00", label: "Culto" },
      { day: "thursday", startTime: "17:00", label: "Culto" },
      { day: "sunday", startTime: "10:00", label: "Culto" },
    ],
  },
  {
    key: "sifon",
    matchAny: ["iglesia gentil de cristo sifon", "sifon"],
    services: TUES_THU_SUN_630_630_1000,
  },
  {
    key: "siviral",
    matchAny: ["iglesia gentil de cristo en siviral", "siviral"],
    services: [
      { day: "tuesday", startTime: "19:00", label: "Culto" },
      { day: "thursday", startTime: "19:00", label: "Culto" },
      { day: "sunday", startTime: "09:00", label: "Culto" },
    ],
  },
  {
    key: "marte-r-gomez-salem",
    matchAny: ["iglesia marte r gomez", "templo salem", "marte r gomez"],
    services: [
      { day: "tuesday", startTime: "19:00", label: "Culto" },
      { day: "thursday", startTime: "19:00", label: "Culto" },
      { day: "sunday", startTime: "11:00", label: "Culto" },
    ],
  },
];

function normalizeText(value: string): string {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getBestMatch(temploName: string, target: ScheduleTarget): number {
  const normalized = normalizeText(temploName);

  if (target.requiredAny && target.requiredAny.length > 0) {
    const hasRequired = target.requiredAny.some((token) =>
      normalized.includes(normalizeText(token))
    );
    if (!hasRequired) return 0;
  }

  let best = 0;

  for (const candidate of target.matchAny) {
    const c = normalizeText(candidate);
    if (!c) continue;

    if (normalized.includes(c)) {
      best = Math.max(best, c.length + 100);
      continue;
    }

    const parts = c.split(" ").filter((p) => p.length >= 4);
    let score = 0;
    for (const p of parts) {
      if (normalized.includes(p)) score += p.length;
    }
    best = Math.max(best, score);
  }

  return best;
}

function buildServices(services: ServiceInput[]) {
  return services.map((s, idx) => ({
    _type: "serviceSlot",
    _key: `${s.day}-${s.startTime}-${idx}`,
    day: s.day,
    startTime: s.startTime,
    ...(s.endTime ? { endTime: s.endTime } : {}),
    ...(s.label ? { label: s.label } : {}),
  }));
}

async function main() {
  const commit = process.argv.includes("--commit");

  console.log("🔄 Backfill de horarios estructurados de templos\n");
  console.log(`Project: ${projectId} | Dataset: ${dataset}`);
  console.log(`Mode: ${commit ? "COMMIT" : "DRY RUN"}\n`);

  const templos = await client.fetch(`*[_type == "templo" && !defined(deletedAt)]{_id, temploName}`);
  console.log(`Templos encontrados: ${templos.length}\n`);
  const usedTemploIds = new Set<string>();

  let updated = 0;
  let withoutSchedule = 0;
  const unmatchedTargets: string[] = [];

  for (const target of targets) {
    let bestDoc: { _id: string; temploName: string } | null = null;
    let bestScore = 0;

    for (const templo of templos) {
      if (usedTemploIds.has(templo._id)) continue;
      const score = getBestMatch(templo.temploName, target);
      if (score > bestScore) {
        bestScore = score;
        bestDoc = templo;
      }
    }

    if (!bestDoc || bestScore < 8) {
      unmatchedTargets.push(target.key);
      console.log(`⚠️  Sin match: ${target.key}`);
      continue;
    }

    if (!target.services || target.services.length === 0) {
      withoutSchedule++;
      usedTemploIds.add(bestDoc._id);
      console.log(`ℹ️  Sin horarios (se omite): ${bestDoc.temploName}`);
      continue;
    }

    const patch = {
      schedule: {
        timezone: "America/Hermosillo",
        services: buildServices(target.services),
      },
    };

    if (commit) {
      await client.patch(bestDoc._id).set(patch).commit();
    }

    usedTemploIds.add(bestDoc._id);
    updated++;
    console.log(`✅ ${bestDoc.temploName} <- ${target.key}`);
  }

  console.log("\n" + "━".repeat(60));
  console.log("Resumen");
  console.log("━".repeat(60));
  console.log(`Actualizados con horario: ${updated}`);
  console.log(`Objetivos sin horario (intencional): ${withoutSchedule}`);
  console.log(`Objetivos sin match: ${unmatchedTargets.length}`);

  if (unmatchedTargets.length > 0) {
    console.log("\nUnmatched:");
    for (const key of unmatchedTargets) console.log(`  - ${key}`);
  }

  if (!commit) {
    console.log("\nTip: ejecuta con --commit para guardar cambios reales.");
  }
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
