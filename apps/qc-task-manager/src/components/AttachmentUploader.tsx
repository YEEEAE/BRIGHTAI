// AttachmentUploader — React island for uploading a file to a task.
//
// POSTs to /api/tasks/[id]/attachments as multipart/form-data; the server
// validates extension + MIME + 10 MB (src/lib/taskUpdates.ts). On success the
// page reloads so the server-rendered attachment list updates. The button
// shows a loading state while the request is in flight, and validation errors
// appear inline (no page navigation).

import { useState } from 'react';
import ActionFeedback from './ui/ActionFeedback';

interface Props {
  taskId: number;
}

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT =
  '.pdf,.png,.jpg,.jpeg,.gif,.webp,.txt,.md,.csv,.json,.log,.xml,.sql,.xlsx,.xls,.docx,.doc,.pptx,.ppt,.zip';

export default function AttachmentUploader({ taskId }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function reload() {
    window.location.href = window.location.pathname;
  }

  async function upload() {
    if (uploading || !file) return;
    if (file.size > MAX_BYTES) {
      setError('The file exceeds the 10 MB upload limit.');
      return;
    }
    setUploading(true);
    setError(null);
    setNotice(null);
    try {
      const form = new FormData();
      form.set('file', file);
      const res = await fetch(`/api/tasks/${taskId}/attachments`, {
        method: 'POST',
        body: form,
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Could not upload the file. Check the file and try Upload again.');
        return;
      }
      setNotice('File uploaded. Refreshing the attachment list…');
      reload();
    } catch {
      setError('Network error while uploading the file. Check your connection, then try Upload again.');
      setUploading(false);
    }
  }

  return (
    <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-slate-50/60 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept={ACCEPT}
          disabled={uploading}
          onChange={(e) => {
            setError(null);
            setFile(e.target.files?.[0] ?? null);
          }}
          aria-label="Choose a file to attach"
          className="block max-w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-brand-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-brand-700"
        />
        <button
          type="button"
          onClick={upload}
          disabled={uploading || !file}
          aria-busy={uploading}
          className="min-h-11 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-content-inverse transition-colors hover:bg-accent-hover active:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Max 10 MB · pdf, png, jpg, gif, webp, txt, md, csv, json, log, xml, sql, xlsx, xls, docx, doc, pptx, ppt, zip
      </p>
      {file && (
        <p className="mt-1 text-xs text-slate-600">
          Selected: {file.name} ({Math.round(file.size / 1024)} KB)
        </p>
      )}
      <ActionFeedback tone="error" message={error} />
      <ActionFeedback tone="success" message={notice} />
    </div>
  );
}
