const supabase = require('../config/supabase');
const filamentModel = require('./filament');

const TABLE = 'print_usage';

async function getAll() {
  const { data, error } = await supabase
    .from(TABLE)
    .select(`
      *,
      orders (customer_name, order_description),
      filaments (type, brand, color)
    `)
    .order('id', { ascending: false });

  if (error) throw error;

  return (data || []).map(pu => ({
    ...pu,
    customer_name: pu.orders?.customer_name || null,
    order_description: pu.orders?.order_description || null,
    filament_type: pu.filaments?.type || null,
    filament_brand: pu.filaments?.brand || null,
    filament_color: pu.filaments?.color || null,
    orders: undefined,
    filaments: undefined
  }));
}

async function getById(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select(`
      *,
      orders (customer_name, order_description),
      filaments (type, brand, color)
    `)
    .eq('id', parseInt(id))
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;

  return {
    ...data,
    customer_name: data.orders?.customer_name || null,
    order_description: data.orders?.order_description || null,
    filament_type: data.filaments?.type || null,
    filament_brand: data.filaments?.brand || null,
    filament_color: data.filaments?.color || null,
    orders: undefined,
    filaments: undefined
  };
}

async function getByOrderId(orderId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select(`
      *,
      filaments (type, brand, color)
    `)
    .eq('order_id', parseInt(orderId))
    .order('id', { ascending: true });

  if (error) throw error;

  return (data || []).map(pu => ({
    ...pu,
    filament_type: pu.filaments?.type || null,
    filament_brand: pu.filaments?.brand || null,
    filament_color: pu.filaments?.color || null,
    filaments: undefined
  }));
}

async function create(usageData) {
  // Get filament to check stock and calculate cost
  const { data: filament, error: filamentError } = await supabase
    .from('filaments')
    .select('current_stock_kg, cost_per_kg')
    .eq('id', usageData.filament_id)
    .single();

  if (filamentError) throw new Error('Filament not found');

  if ((filament.current_stock_kg || 0) < usageData.quantity_used_kg) {
    throw new Error(`Insufficient stock. Available: ${filament.current_stock_kg || 0} kg`);
  }

  const cost_consumed = usageData.quantity_used_kg * filament.cost_per_kg;

  const { data, error } = await supabase
    .from(TABLE)
    .insert([{
      ...usageData,
      cost_consumed
    }])
    .select()
    .single();

  if (error) throw error;

  // Deduct from filament stock
  await filamentModel.updateStock(usageData.filament_id, -usageData.quantity_used_kg);

  return data;
}

async function remove(id) {
  // Get usage entry first
  const { data: usage, error: fetchError } = await supabase
    .from(TABLE)
    .select('filament_id, quantity_used_kg')
    .eq('id', parseInt(id))
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') throw new Error('Print usage entry not found');
    throw fetchError;
  }

  // Restore filament stock
  await filamentModel.updateStock(usage.filament_id, usage.quantity_used_kg);

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
  getByOrderId,
  create,
  remove
};
