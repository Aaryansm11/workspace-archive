import {
  Action,
  ActionPanel,
  Clipboard,
  Detail,
  Form,
  Toast,
  getPreferenceValues,
  showToast,
  useNavigation,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { resolveClaude, runClaude } from "./claude";

interface Prefs {
  vaultPath: string;
  claudePath: string;
  claudeOauthToken?: string;
}

function Answer({ question }: { question: string }) {
  const { vaultPath, claudePath, claudeOauthToken } = getPreferenceValues<Prefs>();
  const [md, setMd] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const bin = resolveClaude(claudePath);
    const { promise, kill } = runClaude(bin, ["-p", question, "--allowedTools", "Read,Grep,Glob,LS"], vaultPath, claudeOauthToken);
    promise.then(({ stdout, stderr, code }) => {
      if (cancelled) return; // ignore a run we tore down (dev double-mount kills the first process)
      if (code !== 0) {
        const detail = [stderr.trim(), stdout.trim()].filter(Boolean).join("\n") || `exit code ${code}`;
        const hint = /not logged in|\/login/i.test(detail)
          ? `**You're not logged in.** Open Terminal, run \`claude\`, complete the login once, then retry.`
          : `Check **Claude CLI Path** in this command's preferences, and that you've logged in (\`claude\` in a terminal).`;
        setMd(`# Couldn't reach Claude\n\n\`\`\`\n${detail}\n\`\`\`\n\n${hint}`);
      } else {
        setMd(stdout.trim() || "_(empty answer)_");
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
      kill();
    };
  }, [question]);

  const body = loading ? `# Asking the vault…\n\n> ${question}` : `> **${question}**\n\n---\n\n${md}`;
  return (
    <Detail
      isLoading={loading}
      markdown={body}
      actions={
        <ActionPanel>
          <Action
            title="Copy Answer"
            onAction={async () => {
              await Clipboard.copy(md);
              await showToast({ style: Toast.Style.Success, title: "Copied" });
            }}
          />
        </ActionPanel>
      }
    />
  );
}

export default function Ask() {
  const { push } = useNavigation();
  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Ask the Vault"
            onSubmit={(v: { question: string }) => {
              const q = (v.question || "").trim();
              if (!q) {
                showToast({ style: Toast.Style.Failure, title: "Type a question" });
                return;
              }
              push(<Answer question={q} />);
            }}
          />
        </ActionPanel>
      }
    >
      <Form.Description text="Ask anything about your KB. The answer ends with a confidence verdict (✅ confident / ⚠️ may be stale / ❓ not in vault)." />
      <Form.TextArea id="question" title="Question" placeholder="e.g. KRA vs CKYC — which applies for a broking client?" />
    </Form>
  );
}
