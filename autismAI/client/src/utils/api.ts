// Client-side API wrappers with simple localStorage caching and offline fallbacks.
// All calls go to backend /api endpoints, never expose API keys here.

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function fetchJSON<T>(url: string, body?: any, opts?: { cacheKey?: string; timeoutMs?: number; fallbackData?: T }): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), opts?.timeoutMs ?? 12000);
  const cacheKey = opts?.cacheKey;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(t);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (cacheKey) {
      localStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), data }));
    }
    return { ok: true, data };
  } catch (e: any) {
    clearTimeout(t);
    // Offline fallback via cache, else provided fallbackData
    if (cacheKey) {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        try { return { ok: true, data: JSON.parse(raw).data } } catch {}
      }
    }
    if (opts?.fallbackData) return { ok: true, data: opts.fallbackData };
    return { ok: false, error: e?.message || 'request_failed' };
  }
}

export function apiSummarize(payload: { childProfile: any; daySummary: any }) {
  return fetchJSON<{ text: string }>('/api/summarize', payload, {
    cacheKey: `api:summarize:${payload.childProfile?.id || ''}:${payload.daySummary?.date || ''}`,
    fallbackData: { text: 'Today we focused on routine and engagement. We will build on strengths tomorrow.' },
  });
}

export function apiMicroCoach(payload: { context: any }) {
  return fetchJSON<{ text: string }>('/api/microcoach', payload, {
    cacheKey: `api:microcoach:${JSON.stringify(payload.context)?.slice(0,128)}`,
    fallbackData: { text: 'Give one clear instruction and praise specific effort.' },
  });
}

export function apiActivity(payload: { constraints: any }) {
  return fetchJSON<{ activity: { title: string; steps: string[]; materials: string[] } }>('/api/activity', payload, {
    cacheKey: `api:activity:${JSON.stringify(payload.constraints)?.slice(0,128)}`,
    fallbackData: { activity: { title: 'Picture Matching', steps: ['Match pictures'], materials: ['Cards'] } },
  });
}

export function apiTimetableRationale(payload: { entries: any[]; childProfile: any }) {
  return fetchJSON<{ text: string }>('/api/timetable/rationale', payload, {
    cacheKey: `api:rationale:${payload.childProfile?.id || ''}:${payload.entries?.length || 0}`,
    fallbackData: { text: 'We alternated focus and movement, kept routines predictable, and aligned with known peak times.' },
  });
}

export function apiWeekly(payload: { logs: any[]; audience: string }) {
  return fetchJSON<{ text: string }>('/api/weekly', payload, {
    cacheKey: `api:weekly:${payload.audience}:${payload.logs?.length || 0}`,
    fallbackData: { text: 'Observations: steady engagement. Next steps: maintain routines, add short movement breaks.' },
  });
}

export function apiAnon(payload: { logs: any[] }) {
  return fetchJSON<{ logs: any[] }>('/api/anon', payload, {
    cacheKey: `api:anon:${payload.logs?.length || 0}`,
    fallbackData: { logs: [] },
  });
}
