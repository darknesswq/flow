import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;
const storageBucket = import.meta.env.VITE_SUPABASE_BUCKET || 'uploads';

const Flower = {
  list: async (order) => {
    if (!supabaseUrl || !supabaseAnon) throw new Error('Supabase not configured');
    const supabase = createSupabaseClient(supabaseUrl, supabaseAnon);
    
    let query = supabase.from('flowers').select('*');
    
    if (order) {
      const isDesc = order.startsWith('-');
      const field = isDesc ? order.substring(1) : order;
      query = query.order(field, { ascending: !isDesc });
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
  filter: async (filters = {}, order) => {
    if (!supabaseUrl || !supabaseAnon) throw new Error('Supabase not configured');
    const supabase = createSupabaseClient(supabaseUrl, supabaseAnon);
    
    let query = supabase.from('flowers').select('*');
    
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    if (order) {
      const isDesc = order.startsWith('-');
      const field = isDesc ? order.substring(1) : order;
      query = query.order(field, { ascending: !isDesc });
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
  create: async (dataToCreate) => {
    if (!supabaseUrl || !supabaseAnon) throw new Error('Supabase not configured');
    const supabase = createSupabaseClient(supabaseUrl, supabaseAnon);
    
    const { data, error } = await supabase.from('flowers').insert(dataToCreate).select('*').single();
    if (error) throw error;
    return data;
  },
  update: async (id, dataToUpdate) => {
    if (!supabaseUrl || !supabaseAnon) throw new Error('Supabase not configured');
    const supabase = createSupabaseClient(supabaseUrl, supabaseAnon);
    
    const { data, error } = await supabase.from('flowers').update(dataToUpdate).eq('id', id).select('*').single();
    if (error) throw error;
    return data;
  },
  delete: async (id) => {
    if (!supabaseUrl || !supabaseAnon) throw new Error('Supabase not configured');
    const supabase = createSupabaseClient(supabaseUrl, supabaseAnon);
    
    const { error } = await supabase.from('flowers').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },
  bulkCreate: async (items) => {
    if (!supabaseUrl || !supabaseAnon) throw new Error('Supabase not configured');
    const supabase = createSupabaseClient(supabaseUrl, supabaseAnon);
    
    const { data, error } = await supabase.from('flowers').insert(items).select('*');
    if (error) throw error;
    return data;
  },
};

const Bouquet = {
  list: async (order) => {
    if (!supabaseUrl || !supabaseAnon) throw new Error('Supabase not configured');
    const supabase = createSupabaseClient(supabaseUrl, supabaseAnon);
    
    let query = supabase.from('bouquets').select('*');
    
    if (order) {
      const isDesc = order.startsWith('-');
      const field = isDesc ? order.substring(1) : order;
      query = query.order(field, { ascending: !isDesc });
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
  filter: async (filters = {}, order) => {
    if (!supabaseUrl || !supabaseAnon) throw new Error('Supabase not configured');
    const supabase = createSupabaseClient(supabaseUrl, supabaseAnon);
    
    let query = supabase.from('bouquets').select('*');
    
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    if (order) {
      const isDesc = order.startsWith('-');
      const field = isDesc ? order.substring(1) : order;
      query = query.order(field, { ascending: !isDesc });
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
  create: async (dataToCreate) => {
    if (!supabaseUrl || !supabaseAnon) throw new Error('Supabase not configured');
    const supabase = createSupabaseClient(supabaseUrl, supabaseAnon);
    
    const { data, error } = await supabase.from('bouquets').insert(dataToCreate).select('*').single();
    if (error) throw error;
    return data;
  },
  update: async (id, dataToUpdate) => {
    if (!supabaseUrl || !supabaseAnon) throw new Error('Supabase not configured');
    const supabase = createSupabaseClient(supabaseUrl, supabaseAnon);
    
    const { data, error } = await supabase.from('bouquets').update(dataToUpdate).eq('id', id).select('*').single();
    if (error) throw error;
    return data;
  },
  delete: async (id) => {
    if (!supabaseUrl || !supabaseAnon) throw new Error('Supabase not configured');
    const supabase = createSupabaseClient(supabaseUrl, supabaseAnon);
    
    const { error } = await supabase.from('bouquets').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },
  bulkCreate: async (items) => {
    if (!supabaseUrl || !supabaseAnon) throw new Error('Supabase not configured');
    const supabase = createSupabaseClient(supabaseUrl, supabaseAnon);
    
    const { data, error } = await supabase.from('bouquets').insert(items).select('*');
    if (error) throw error;
    return data;
  },
};

const Backup = {
  list: async (order) => {
    if (!supabaseUrl || !supabaseAnon) throw new Error('Supabase not configured');
    const supabase = createSupabaseClient(supabaseUrl, supabaseAnon);
    
    let query = supabase.from('backups').select('*');
    
    if (order) {
      const isDesc = order.startsWith('-');
      const field = isDesc ? order.substring(1) : order;
      query = query.order(field, { ascending: !isDesc });
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
  create: async (dataToCreate) => {
    if (!supabaseUrl || !supabaseAnon) throw new Error('Supabase not configured');
    const supabase = createSupabaseClient(supabaseUrl, supabaseAnon);
    
    const { data, error } = await supabase.from('backups').insert(dataToCreate).select('*').single();
    if (error) throw error;
    return data;
  },
  delete: async (id) => {
    if (!supabaseUrl || !supabaseAnon) throw new Error('Supabase not configured');
    const supabase = createSupabaseClient(supabaseUrl, supabaseAnon);
    
    const { error } = await supabase.from('backups').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  },
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

