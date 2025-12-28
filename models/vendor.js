const supabase = require('../config/supabase');

const TABLE = 'vendors';

async function getAll() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('id', { ascending: true });

  if (error) throw error;
  return data || [];
}

async function getById(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', parseInt(id))
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

async function create(vendorData) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([vendorData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function update(id, vendorData) {
  const { data, error } = await supabase
    .from(TABLE)
    .update(vendorData)
    .eq('id', parseInt(id))
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') throw new Error('Vendor not found');
    throw error;
  }
  return data;
}

async function remove(id) {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', parseInt(id));

  if (error) throw error;
  return { id: parseInt(id) };
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove
};
