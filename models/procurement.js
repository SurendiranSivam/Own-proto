const supabase = require('../config/supabase');
const filamentModel = require('./filament');

const TABLE = 'procurement';

async function getAll() {
  const { data, error } = await supabase
    .from(TABLE)
    .select(`
      *,
      vendors (name),
      filaments (type, brand, color)
    `)
    .order('id', { ascending: false });

  if (error) throw error;

  return (data || []).map(p => ({
    ...p,
    vendor_name: p.vendors?.name || null,
    filament_type: p.filaments?.type || null,
    filament_brand: p.filaments?.brand || null,
    filament_color: p.filaments?.color || null,
    vendors: undefined,
    filaments: undefined
  }));
}

async function getById(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select(`
      *,
      vendors (name),
      filaments (type, brand, color)
    `)
    .eq('id', parseInt(id))
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;

  return {
    ...data,
    vendor_name: data.vendors?.name || null,
    filament_type: data.filaments?.type || null,
    filament_brand: data.filaments?.brand || null,
    filament_color: data.filaments?.color || null,
    vendors: undefined,
    filaments: undefined
  };
}

async function create(procurementData) {
  const total_amount = procurementData.quantity_kg * procurementData.cost_per_kg;

  const { data, error } = await supabase
    .from(TABLE)
    .insert([{
      ...procurementData,
      total_amount,
      status: 'pending'
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function update(id, procurementData) {
  // Get existing procurement
  const { data: existing, error: fetchError } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', parseInt(id))
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') throw new Error('Procurement not found');
    throw fetchError;
  }

  let status = 'delivered';

  if (procurementData.final_delivery_date && existing.eta_delivery) {
    const deliveryDate = new Date(procurementData.final_delivery_date);
    const etaDate = new Date(existing.eta_delivery);
    if (deliveryDate > etaDate) {
      status = 'delayed';
    }
  }

  // If marking as delivered for the first time, update filament stock
  if (procurementData.final_delivery_date && !existing.final_delivery_date) {
    await filamentModel.updateStock(existing.filament_id, existing.quantity_kg);
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update({
      ...procurementData,
      status
    })
    .eq('id', parseInt(id))
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function getPending() {
  const { data, error } = await supabase
    .from(TABLE)
    .select(`
      *,
      vendors (name),
      filaments (type, brand, color)
    `)
    .or('status.eq.pending,final_delivery_date.is.null')
    .order('eta_delivery', { ascending: true });

  if (error) throw error;

  return (data || []).map(p => ({
    ...p,
    vendor_name: p.vendors?.name || null,
    filament_type: p.filaments?.type || null,
    filament_brand: p.filaments?.brand || null,
    filament_color: p.filaments?.color || null,
    vendors: undefined,
    filaments: undefined
  }));
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  getPending
};
