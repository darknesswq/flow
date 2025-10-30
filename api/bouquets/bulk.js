import { getSupabaseAdmin } from '../supabaseClient.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const supabase = getSupabaseAdmin();
  try {
    const payload = Array.isArray(req.body) ? req.body : (req.body?.items || []);
    if (!Array.isArray(payload) || payload.length === 0) return res.status(400).json({ error: 'No items to insert' });
    const { data, error } = await supabase.from('bouquets').insert(payload).select('*');
    if (error) throw error;
    return res.status(200).json({ inserted: data.length });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}


