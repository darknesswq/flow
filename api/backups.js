import { getSupabaseAdmin } from './supabaseClient.js';

export default async function handler(req, res) {
  const supabase = getSupabaseAdmin();
  try {
    if (req.method === 'GET') {
      const { order } = req.query;
      let query = supabase.from('backups').select('*');
      if (order === '-created_date') query = query.order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data ?? []);
    }
    if (req.method === 'POST') {
      const payload = req.body;
      const { data, error } = await supabase.from('backups').insert(payload).select('*').single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { error } = await supabase.from('backups').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}



