/**
 * wilson: append one NDJSON line per search so empty or weak searches can be found
 * afterwards, whatever interface ran them (Claude sessions, /files, WilsonHub).
 *
 * Destination: $QMD_SEARCH_LOG, else ~/.local/log/qmd-search.ndjson when ~/.local/log
 * exists. QMD_SEARCH_LOG=off disables it. QMD_CALLER labels the caller (e.g.
 * "wilsonhub", "files"); it defaults to "cli". Best effort: a logging failure never
 * affects the search.
 */
import { appendFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

function logPath(): string | null {
  const env = process.env.QMD_SEARCH_LOG;
  if (env === "off" || env === "0") return null;
  if (env) return env;
  const dir = join(homedir(), ".local", "log");
  return existsSync(dir) ? join(dir, "qmd-search.ndjson") : null;
}

export function logSearchEvent(
  command: "search" | "vsearch" | "query",
  query: string,
  collections: readonly string[] | undefined,
  limit: number,
  hits: number,
  partial: number,
  ms: number,
): void {
  const path = logPath();
  if (!path) return;
  try {
    appendFileSync(path, JSON.stringify({
      ts: new Date().toISOString(),
      caller: process.env.QMD_CALLER || "cli",
      command,
      query,
      collections: collections && collections.length > 0 ? collections : null,
      limit,
      hits,
      partial,
      empty: hits + partial === 0,
      ms,
    }) + "\n");
  } catch {
    // never let logging break a search
  }
}
