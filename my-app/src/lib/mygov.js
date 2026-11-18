/**
 * Live MyGov quizzes & pledges for the daily-task MyGov sections.
 *
 * Sources (both public):
 *   Quizzes  https://quiz.mygov.in/  — each card has a Start Date and End Date
 *   Pledges  https://static.mygov.in/media/pledge/pledge_new_translated.json
 *            (the data behind https://pledge.mygov.in/#ongoing; "ongoing" = status "open",
 *            pledges have no end date)
 *
 * The lists are refreshed at most every REFRESH_MS and the last good copy is kept in
 * the database, so a MyGov outage never empties the students' task lists. Quizzes are
 * filtered against their end date on every request, so an expired quiz disappears the
 * moment its end date passes (end of day, IST) even before the next refresh.
 */
import pool from '@/lib/db';

const QUIZ_URL = 'https://quiz.mygov.in/';
const PLEDGE_FEED_URL = 'https://static.mygov.in/media/pledge/pledge_new_translated.json';
const REFRESH_MS = 6 * 60 * 60 * 1000; // 6 hours
const FETCH_TIMEOUT_MS = 20000;
const USER_AGENT = 'Mozilla/5.0 (compatible; KLU-SocialInternship/1.0; +https://socialinternship.kluniversity.in)';

const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

/** "Nov 26, 2026" → ISO string. endOfDay: 23:59:59 IST, otherwise 00:00 IST. */
function parseMyGovDate(text, endOfDay) {
  const m = String(text || '').trim().match(/^([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})$/);
  if (!m) return null;
  const month = MONTHS[m[1].toLowerCase()];
  if (month === undefined) return null;
  const day = Number(m[2]);
  const year = Number(m[3]);
  // IST is UTC+05:30
  const utc = Date.UTC(year, month, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0) - 5.5 * 3600 * 1000;
  return new Date(utc).toISOString();
}

function decodeEntities(s) {
  return String(s || '')
    .replace(/<[^>]*>/g, '')
    // numeric entities, e.g. &#038; (&), &#8217; (’), &#x2013; (–)
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&ndash;/g, '–').replace(/&mdash;/g, '—')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&') // last, so "&amp;lt;" doesn't double-decode
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchWithTimeout(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: '*/*' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`${url} responded ${res.status}`);
  return res;
}

/** Parse the quiz cards on quiz.mygov.in. */
export function parseQuizzes(html) {
  const quizzes = [];
  for (const block of String(html).split('<div class="list-item">').slice(1)) {
    const title = block.match(/<h3>([\s\S]*?)<\/h3>/)?.[1];
    const url = block.match(/href="(https:\/\/quiz\.mygov\.in\/quiz\/[^"]+)"[^>]*class="btn-3 start-quiz"/)?.[1]
      || block.match(/href="(https:\/\/quiz\.mygov\.in\/quiz\/[^"]+)"/)?.[1];
    const start = block.match(/class="sdate">\s*Start Date\s*<span>([^<]+)<\/span>/)?.[1];
    const end = block.match(/class="edate">\s*End Date\s*<span>([^<]+)<\/span>/)?.[1];
    const endDate = parseMyGovDate(end, true);
    if (!title || !url || !endDate) continue;
    quizzes.push({ title: decodeEntities(title), url, startDate: parseMyGovDate(start, false), endDate });
  }
  // de-duplicate by URL
  return [...new Map(quizzes.map((q) => [q.url, q])).values()];
}

/** Ongoing pledges from the pledge.mygov.in data feed, newest first. */
export function parsePledges(feed) {
  const list = Array.isArray(feed?.pledges) ? feed.pledges : [];
  return list
    .filter((p) => p?.status === 'open' && typeof p.url === 'string' && p.url.startsWith('https://pledge.mygov.in/'))
    .map((p) => ({
      title: decodeEntities(p.content?.en?.title || p.content?.en?.name || p.index_name),
      url: p.url,
      startDate: p.start_date || null,
    }))
    .filter((p) => p.title)
    .sort((a, b) => String(b.startDate || '').localeCompare(String(a.startDate || '')));
}

/* ── Cache (memory + database) ─────────────────────────────────────────────── */

let memory = null;      // { quizzes, pledges, fetchedAt }
let refreshing = null;  // in-flight refresh promise (prevents parallel refreshes)
let lastAttemptAt = 0;  // when MyGov was last contacted
const RETRY_BACKOFF_MS = 10 * 60 * 1000; // don't hammer MyGov (or slow pages) while it's down

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS mygovTasksCache (
      id        TINYINT PRIMARY KEY,
      data      JSON NOT NULL,
      fetchedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}

async function readDbCache() {
  try {
    await ensureTable();
    const [rows] = await pool.query('SELECT data FROM mygovTasksCache WHERE id = 1');
    if (!rows.length) return null;
    return typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data;
  } catch (err) {
    console.warn('[mygov] could not read DB cache:', err.message);
    return null;
  }
}

async function writeDbCache(snapshot) {
  try {
    await ensureTable();
    await pool.query(
      'INSERT INTO mygovTasksCache (id, data) VALUES (1, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)',
      [JSON.stringify(snapshot)]
    );
  } catch (err) {
    console.warn('[mygov] could not write DB cache:', err.message);
  }
}

/** Fetch both sources. A failed source keeps its previous data instead of going empty. */
async function refresh(previous) {
  const [quizRes, pledgeRes] = await Promise.allSettled([
    fetchWithTimeout(QUIZ_URL).then((r) => r.text()).then(parseQuizzes),
    fetchWithTimeout(PLEDGE_FEED_URL).then((r) => r.json()).then(parsePledges),
  ]);

  if (quizRes.status === 'rejected') console.warn('[mygov] quiz fetch failed:', quizRes.reason?.message);
  if (pledgeRes.status === 'rejected') console.warn('[mygov] pledge fetch failed:', pledgeRes.reason?.message);

  const quizzes = quizRes.status === 'fulfilled' && quizRes.value.length ? quizRes.value : previous?.quizzes || [];
  const pledges = pledgeRes.status === 'fulfilled' && pledgeRes.value.length ? pledgeRes.value : previous?.pledges || [];
  const anyFresh = (quizRes.status === 'fulfilled' && quizRes.value.length) || (pledgeRes.status === 'fulfilled' && pledgeRes.value.length);

  const snapshot = {
    quizzes,
    pledges,
    fetchedAt: anyFresh ? new Date().toISOString() : previous?.fetchedAt || null,
    lastError: anyFresh ? null : 'MyGov sites could not be reached',
  };
  if (anyFresh) await writeDbCache(snapshot);
  return snapshot;
}

/**
 * Current MyGov tasks. Quizzes are limited to those open right now.
 * force: refresh immediately (admin "Refresh now").
 */
export async function getMyGovTasks({ force = false } = {}) {
  if (!memory) memory = await readDbCache();

  const hasData = Boolean(memory?.quizzes?.length || memory?.pledges?.length);
  const stale = !memory?.fetchedAt || Date.now() - new Date(memory.fetchedAt).getTime() > REFRESH_MS;
  const backingOff = Date.now() - lastAttemptAt < RETRY_BACKOFF_MS;

  if (force || ((stale || !hasData) && !backingOff)) {
    if (!refreshing) {
      lastAttemptAt = Date.now();
      refreshing = refresh(memory)
        .then((snapshot) => { memory = snapshot; return snapshot; })
        .catch((err) => { console.warn('[mygov] refresh failed:', err.message); return memory; })
        .finally(() => { refreshing = null; });
    }
    // Serve cached data immediately; only wait when there is nothing to show yet
    // (or an admin explicitly asked for a refresh).
    if (force || !hasData) await refreshing;
  }

  const now = Date.now();
  const quizzes = (memory?.quizzes || [])
    .filter((q) => new Date(q.endDate).getTime() >= now && (!q.startDate || new Date(q.startDate).getTime() <= now))
    // most time remaining first, so students aren't sent to a quiz that closes in an hour
    .sort((a, b) => new Date(b.endDate) - new Date(a.endDate));

  return {
    quizzes,
    pledges: memory?.pledges || [],
    fetchedAt: memory?.fetchedAt || null,
    lastError: memory?.lastError || null,
  };
}
