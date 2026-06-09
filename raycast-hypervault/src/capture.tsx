import { Action, ActionPanel, Form, Toast, showToast, popToRoot, getPreferenceValues } from "@raycast/api";
import { useState } from "react";
import fs from "fs";
import path from "path";

interface Prefs {
  vaultPath: string;
}

const pad = (n: number) => n.toString().padStart(2, "0");
const slugify = (s: string) =>
  (s || "capture")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "capture";

interface Values {
  text: string;
  files: string[];
  title: string;
}

export default function Capture() {
  const { vaultPath } = getPreferenceValues<Prefs>();
  const [loading, setLoading] = useState(false);

  async function onSubmit(values: Values) {
    const text = (values.text || "").trim();
    const files = values.files || [];
    if (!text && files.length === 0) {
      await showToast({ style: Toast.Style.Failure, title: "Nothing to capture" });
      return;
    }
    try {
      setLoading(true);
      const inbox = path.join(vaultPath, "00-Inbox");
      const attachments = path.join(inbox, "attachments");
      fs.mkdirSync(attachments, { recursive: true });

      const now = new Date();
      const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
      const firstLine = text ? text.split("\n")[0].slice(0, 60) : files.length ? path.basename(files[0]) : "capture";
      const title = values.title?.trim() || firstLine;
      const noteName = `${stamp}-${slugify(values.title?.trim() || title)}.md`;
      const notePath = path.join(inbox, noteName);

      const copied: string[] = [];
      for (const f of files) {
        try {
          const dest = path.join(attachments, `${stamp}-${path.basename(f)}`);
          fs.copyFileSync(f, dest);
          copied.push(path.relative(inbox, dest));
        } catch {
          /* skip unreadable file */
        }
      }

      const lines = [
        "---",
        "type: log",
        "half_life: short",
        "status: current",
        `created: ${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
        "review_by:",
        "tags: [inbox, capture]",
        "source_url: raycast-capture",
        "---",
        "",
        `# ${title}`,
        "",
        `> Captured ${now.toISOString()} via Raycast. Raw — promote to a real note with **Process Inbox**.`,
        "",
      ];
      if (text) lines.push(text, "");
      if (copied.length) {
        lines.push("## Attachments");
        for (const c of copied) lines.push(`- [[${path.posix.join("00-Inbox", c)}|${path.basename(c)}]]`);
        lines.push("");
      }
      fs.writeFileSync(notePath, lines.join("\n"), "utf8");

      await showToast({ style: Toast.Style.Success, title: "Captured to Inbox", message: noteName });
      await popToRoot();
    } catch (e) {
      await showToast({ style: Toast.Style.Failure, title: "Capture failed", message: e instanceof Error ? e.message : String(e) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form
      isLoading={loading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Capture to Vault" onSubmit={onSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description text="Drop files and/or paste text. Lands instantly in 00-Inbox; curate later with Process Inbox." />
      <Form.TextArea id="text" title="Text" placeholder="Paste or type anything…" />
      <Form.FilePicker id="files" title="Files" allowMultipleSelection />
      <Form.TextField id="title" title="Title (optional)" placeholder="short label for the note" />
    </Form>
  );
}
