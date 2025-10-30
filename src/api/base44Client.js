import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;
const storageBucket = import.meta.env.VITE_SUPABASE_BUCKET || 'uploads';

function getHeaders() {
  return { 'Content-Type': 'application/json' };
}

async function http(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: method === 'GET' ? undefined : getHeaders(),
    body: method === 'GET' ? undefined : JSON.stringify(body ?? {})
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status}`);
  return data;
}

const Flower = {
  list: async (order) => http('GET', `/api/flowers${order ? `?order=${encodeURIComponent(order)}` : ''}`),
  create: async (data) => http('POST', '/api/flowers', data),
  update: async (id, data) => http('PUT', '/api/flowers', { id, data }),
  delete: async (id) => http('DELETE', '/api/flowers', { id }),
  bulkCreate: async (items) => http('POST', '/api/flowers/bulk', items),
};

const Bouquet = {
  list: async (order) => http('GET', `/api/bouquets${order ? `?order=${encodeURIComponent(order)}` : ''}`),
  create: async (data) => http('POST', '/api/bouquets', data),
  update: async (id, data) => http('PUT', '/api/bouquets', { id, data }),
  delete: async (id) => http('DELETE', '/api/bouquets', { id }),
  bulkCreate: async (items) => http('POST', '/api/bouquets/bulk', items),
};

const Backup = {
  list: async (order) => http('GET', `/api/backups${order ? `?order=${encodeURIComponent(order)}` : ''}`),
  create: async (data) => http('POST', '/api/backups', data),
  delete: async (id) => http('DELETE', '/api/backups', { id }),
};

function parseCsv(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(Boolean);
  if (lines.length === 0) return [];
  const headers = [];
  // simple CSV parser with quotes
  function splitLine(line) {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) { result.push(cur); cur = ''; }
      else { cur += ch; }
    }
    result.push(cur);
    return result;
  }
  const headerRow = splitLine(lines[0]).map(h => h.trim());
  for (const h of headerRow) headers.push(h);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitLine(lines[i]);
    if (cols.every(c => c.trim() === '')) continue;
    const row = {};
    headers.forEach((h, idx) => { row[h] = cols[idx] !== undefined ? cols[idx] : null; });
    rows.push(row);
  }
  return { headers, rows };
}

const Core = {
  UploadFile: async ({ file }) => {
    if (!supabaseUrl || !supabaseAnon) throw new Error('Supabase env not configured');
    const supabase = createSupabaseClient(supabaseUrl, supabaseAnon);
    const ext = (file.name?.split('.').pop() || 'bin').toLowerCase();
    const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(storageBucket).upload(path, file, { upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from(storageBucket).getPublicUrl(path);
    return { file_url: data.publicUrl };
  },
  ExtractDataFromUploadedFile: async ({ file_url, json_schema }) => {
    const res = await fetch(file_url);
    const text = await res.text();
    const parsed = parseCsv(text);
    if (!parsed.rows) return { status: 'error', details: 'Empty file' };
    const properties = json_schema?.properties || {};
    const topKey = Object.keys(properties)[0] || 'items';
    const itemSchema = properties[topKey]?.items?.properties || {};
    const casted = parsed.rows.map((r) => {
      const obj = {};
      for (const [key, def] of Object.entries(itemSchema)) {
        let v = r[key];
        if (v === undefined) continue;
        if (def.type === 'number' || def.type === 'integer') v = v === '' ? null : Number(v);
        if (def.type === 'boolean') v = String(v).toLowerCase().trim() === 'true' || v === '1';
        obj[key] = v;
      }
      return obj;
    });
    return { status: 'success', output: { [topKey]: casted } };
  },
};

export const base44 = {
  entities: { Flower, Bouquet, Backup },
  integrations: { Core },
  auth: {},
};

