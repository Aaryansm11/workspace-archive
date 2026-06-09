import fs from "fs";
import os from "os";
import { spawn } from "child_process";

/** Resolve the claude binary: preference first, then common install locations, then bare name. */
export function resolveClaude(pref?: string): string {
  const home = process.env.HOME ?? "";
  const candidates = [
    pref,
    "/opt/homebrew/bin/claude",
    "/usr/local/bin/claude",
    `${home}/.npm-global/bin/claude`,
    `${home}/.local/bin/claude`,
  ].filter(Boolean) as string[];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) return c;
    } catch {
      /* ignore */
    }
  }
  return "claude";
}

/**
 * Raycast spawns with a minimal environment. claude needs:
 *  - PATH that includes Homebrew/npm bins (to find node + ripgrep)
 *  - USER / LOGNAME / HOME so macOS can locate the Keychain login token
 *    (missing these is what makes claude wrongly report "Not logged in").
 */
export function claudeEnv(oauthToken?: string): NodeJS.ProcessEnv {
  const home = process.env.HOME ?? os.homedir();
  let user = process.env.USER || process.env.LOGNAME;
  if (!user) {
    try {
      user = os.userInfo().username;
    } catch {
      /* ignore */
    }
  }
  const token = (oauthToken ?? "").trim();
  return {
    ...process.env,
    HOME: home,
    ...(user ? { USER: user, LOGNAME: user } : {}),
    // Headless auth — bypasses the macOS Keychain, which Raycast-spawned processes can't read.
    ...(token ? { CLAUDE_CODE_OAUTH_TOKEN: token } : {}),
    PATH: `/opt/homebrew/bin:/usr/local/bin:${home}/.npm-global/bin:${process.env.PATH ?? ""}`,
  };
}

export interface ClaudeRun {
  promise: Promise<{ stdout: string; stderr: string; code: number | null }>;
  kill: () => void;
}

/**
 * Run claude headlessly. stdin is set to "ignore" (= /dev/null) so the CLI doesn't
 * wait on an empty input stream — that's the cause of the "no stdin data received" hang.
 */
export function runClaude(bin: string, args: string[], cwd: string, oauthToken?: string): ClaudeRun {
  const child = spawn(bin, args, {
    cwd,
    env: claudeEnv(oauthToken),
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  child.stdout?.on("data", (d) => (stdout += d.toString()));
  child.stderr?.on("data", (d) => (stderr += d.toString()));
  const promise = new Promise<{ stdout: string; stderr: string; code: number | null }>((resolve) => {
    child.on("close", (code) => resolve({ stdout, stderr, code }));
    child.on("error", (e) => resolve({ stdout, stderr: `${stderr}${e instanceof Error ? e.message : String(e)}`, code: -1 }));
  });
  return {
    promise,
    kill: () => {
      try {
        child.kill();
      } catch {
        /* ignore */
      }
    },
  };
}

/**
 * Fire-and-forget: spawn claude fully detached so it keeps running after the Raycast
 * command exits (Raycast kills view commands when the window loses focus). Output is
 * appended to logPath so the result is recoverable.
 */
export function runClaudeDetached(bin: string, args: string[], cwd: string, logPath: string, oauthToken?: string): void {
  const out = fs.openSync(logPath, "a");
  const child = spawn(bin, args, {
    cwd,
    env: claudeEnv(oauthToken),
    stdio: ["ignore", out, out],
    detached: true,
  });
  child.unref();
}
