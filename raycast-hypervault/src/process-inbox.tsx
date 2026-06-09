import { Action, ActionPanel, Clipboard, Detail, Toast, getPreferenceValues, showToast } from "@raycast/api";
import { useEffect, useState } from "react";
import { resolveClaude, runClaude } from "./claude";

interface Prefs {
  vaultPath: string;
  claudePath: string;
  claudeOauthToken?: string;
}

const INSTRUCTION =
  "Process every raw capture in 00-Inbox/ (notes tagged [inbox] / [capture], and any loose files). " +
  "For each, follow CLAUDE.md and 95-Maps/00-Conventions.md: promote it into a proper note in the right pillar " +
  "(01-Aaryan / 02-SA-Role / 03-HyperVerge / 04-Clients) with full frontmatter, link into 80-Sources where relevant, " +
  "and supersede (never delete) anything it updates. Leave the original capture only if it can't be confidently placed. " +
  "Then give a concise bullet summary of what you filed and where.";

export default function ProcessInbox() {
  const { vaultPath, claudePath, claudeOauthToken } = getPreferenceValues<Prefs>();
  const [md, setMd] = useState("# Processing inbox…\n\nReading captures and filing them per your conventions.");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const bin = resolveClaude(claudePath);
    const args = ["-p", INSTRUCTION, "--allowedTools", "Read,Grep,Glob,LS,Edit,Write", "--permission-mode", "acceptEdits"];
    const { promise, kill } = runClaude(bin, args, vaultPath, claudeOauthToken);
    promise.then(({ stdout, stderr, code }) => {
      if (cancelled) return; // ignore a run we tore down (dev double-mount kills the first process)
      if (code !== 0) {
        const detail = [stderr.trim(), stdout.trim()].filter(Boolean).join("\n") || `exit code ${code}`;
        const hint = /not logged in|\/login/i.test(detail)
          ? `\n\n**You're not logged in.** Open Terminal, run \`claude\`, log in once, then retry.`
          : "";
        setMd(`# Couldn't reach Claude\n\n\`\`\`\n${detail}\n\`\`\`${hint}`);
      } else {
        setMd(`# Inbox processed\n\n${stdout.trim() || "_(done — no summary returned)_"}`);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
      kill();
    };
  }, []);

  return (
    <Detail
      isLoading={loading}
      markdown={md}
      actions={
        <ActionPanel>
          <Action title="Copy Summary" onAction={async () => { await Clipboard.copy(md); await showToast({ style: Toast.Style.Success, title: "Copied" }); }} />
        </ActionPanel>
      }
    />
  );
}
