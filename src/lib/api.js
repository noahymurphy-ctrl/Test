// Talks to the local Fair Copy backend. In dev, Vite proxies /api to
// http://localhost:8000 (see vite.config.js); in a plain static build it
// still just hits relative /api paths, so the same code works either way
// as long as the backend is running.

async function request(path, options) {
  const res = await fetch(`/api${path}`, options);
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.detail) message = body.detail;
    } catch {
      // ignore — not JSON
    }
    throw new Error(message);
  }
  return res;
}

export async function checkHealth() {
  const res = await request("/health");
  return res.json();
}

export async function uploadFile(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await request("/convert", { method: "POST", body: form });
  return res.json(); // { job_id }
}

export async function getJob(jobId) {
  const res = await request(`/jobs/${jobId}`);
  return res.json();
}

export async function listLibrary() {
  const res = await request("/library");
  return res.json();
}

export async function getPiece(pieceId) {
  const res = await request(`/library/${pieceId}`);
  return res.json();
}

export function musicxmlUrl(pieceId) {
  return `/api/library/${pieceId}/musicxml`;
}

export function downloadUrl(pieceId, format) {
  return `/api/library/${pieceId}/download/${format}`;
}

export async function deletePiece(pieceId) {
  await request(`/library/${pieceId}`, { method: "DELETE" });
}
