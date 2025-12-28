const supabase = require('../config/supabase');

const TABLE = 'filaments';

async function getAll() {
  const { data, error } = await supabase
    .from(TABLE)
    .select(`
      *,
      vendors (name)
    `)
    .order('id', { ascending: true });

  if (error) throw error;

  return (data || []).map(f => ({
    ...f,
    vendor_name: f.vendors?.name || null,
    vendors: undefined
  }));
}

async function getById(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select(`
      *,
      vendors (name)
    `)
    .eq('id', parseInt(id))
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;

  return {
    ...data,
    vendor_name: data.vendors?.name || null,
    vendors: undefined
  };
}

async function create(filamentData) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([{
      ...filamentData,
      current_stock_kg: 0
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function update(id, filamentData) {
  const { data, error } = await supabase
    .from(TABLE)
    .update(filamentData)
    .eq('id', parseInt(id))
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') throw new Error('Filament not found');
    throw error;
  }
  return data;
}

async function updateStock(id, quantityChange) {
  // First get current stock
  const { data: current, error: fetchError } = await supabase
    .from(TABLE)
    .select('current_stock_kg')
    .eq('id', parseInt(id))
    .single();

  if (fetchError) throw fetchError;

  const newStock = (current.current_stock_kg || 0) + quantityChange;

  const { data, error } = await supabase
    .from(TABLE)
    .update({ current_stock_kg: newStock })
    .eq('id', parseInt(id))
    .select()
    .single();

  if (error) throw error;
  return { id: parseInt(id), quantityChange, newStock };
}

async function remove(id) {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', parseInt(id));

  if (error) throw error;
  return { id: parseInt(id) };
}

async function getLowStockAlerts() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .filter('current_stock_kg', 'lte', 'min_stock_alert_kg');

  if (error) {
    // Fallback: get all and filter in JS
    const all = await getAll();
    return all.filter(f => (f.current_stock_kg || 0) <= (f.min_stock_alert_kg || 0));
  }
  return data || [];
}

async function getInventoryValue() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('current_stock_kg, cost_per_kg');

  if (error) throw error;

  return (data || []).reduce((sum, f) => {
    return sum + ((f.current_stock_kg || 0) * (f.cost_per_kg || 0));
  }, 0);
}

async function getStockByType() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('type, current_stock_kg');

  if (error) throw error;

  const stockByType = {};
  (data || []).forEach(f => {
    const type = f.type || 'Unknown';
    stockByType[type] = (stockByType[type] || 0) + (f.current_stock_kg || 0);
  });

  return Object.keys(stockByType).map(type => ({
    type,
    total_stock: stockByType[type]
  }));
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  updateStock,
  remove,
  getLowStockAlerts,
  getInventoryValue,
  getStockByType
};
