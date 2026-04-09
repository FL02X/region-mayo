import {
  getRegionConfig,
  getRegionPresident,
  getEvents,
  getPastors,
  getCoros,
  getDirectiva,
  getAvailableRegions,
  getSiteSettings,
  getTemplos,
} from "../lib/api";
import fs from "fs";
import path from "path";
import util from "util";

// Enable Sanity inside the script overriding process.env if needed
process.env.SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "iqybd074";
process.env.SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

async function run() {
  console.log("Fetching data from Sanity...");
  
  const regionMayo = await getRegionConfig("mayo");
  const regionPresident = await getRegionPresident("mayo");
  const eventsData = await getEvents("mayo");
  const pastorsData = await getPastors("mayo");
  const corosData = await getCoros("mayo");
  const directivaData = await getDirectiva("mayo");
  const availableRegions = await getAvailableRegions();
  const siteSettingsData = await getSiteSettings("mayo");
  const templosData = await getTemplos("mayo");

  console.log("Data fetched successfully.");

  function formatObject(obj: any): string {
    return util.inspect(obj, { depth: null, maxArrayLength: null });
  }

  const output = `// ============================================
// Region Mayo - Auto-generated Mock Data from Sanity
// Generated on: ${new Date().toISOString()}
// ============================================

import type {
  Region,
  Event,
  Pastor,
  Coro,
  DirectivaMember,
  RegionPresident,
  SiteSettings,
  Templo,
} from "./types";

export const regionMayo: Region = ${formatObject(regionMayo)};

export const regionPresident: RegionPresident = ${formatObject(regionPresident)};

export const eventsData: Event[] = ${formatObject(eventsData)};

export const pastorsData: Pastor[] = ${formatObject(pastorsData)};

export const corosData: Coro[] = ${formatObject(corosData)};

export const directivaData: DirectivaMember[] = ${formatObject(directivaData)};

export const availableRegions = ${formatObject(availableRegions)};

export const siteSettingsData: SiteSettings = ${formatObject(siteSettingsData)};

export const templosData: Templo[] = ${formatObject(templosData)};
`.replace(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/g, 'new Date("$1")');

  const outputPath = path.join(__dirname, "../lib/mock-data.ts");
  fs.writeFileSync(outputPath, output);
  console.log("Updated lib/mock-data.ts with connected Sanity output");
}

run().catch(console.error);
