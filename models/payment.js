const supabase = require('../config/supabase');
const orderModel = require('./order');

const TABLE = 'payments';

async function getAll() {
  const { data, error } = await supabase
    .from(TABLE)
    .select(`
      *,
      orders (customer_name, total_amount)
    `)
    .order('id', { ascending: false });

  if (error) throw error;

  return (data || []).map(p => ({
    ...p,
    customer_name: p.orders?.customer_name || null,
    order_total: p.orders?.total_amount || null,
    orders: undefined
  }));
}

async function getById(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select(`
      *,
      orders (customer_name, total_amount)
    `)
    .eq('id', parseInt(id))
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;

  return {
    ...data,
    customer_name: data.orders?.customer_name || null,
    order_total: data.orders?.total_amount || null,
    orders: undefined
  };
}

async function getByOrderId(orderId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('order_id', parseInt(orderId))
    .order('id', { ascending: true });

  if (error) throw error;
  return data || [];
}

async function create(paymentData) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([paymentData])
    .select()
    .single();

  if (error) throw error;

  // Update order payment status
  await orderModel.updatePaymentStatus(paymentData.order_id);

  return data;
}

async function remove(id) {
  // Get payment first to know the order_id
  const { data: payment, error: fetchError } = await supabase
    .from(TABLE)
    .select('order_id')
    .eq('id', parseInt(id))
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') throw new Error('Payment not found');
    throw fetchError;
  }

  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', parseInt(id));

  if (error) throw error;

  // Update order payment status
  await orderModel.updatePaymentStatus(payment.order_id);

  return { id: parseInt(id) };
}

async function getPendingReceivables() {
  const { data, error } = await supabase
    .from('orders')
    .select('balance_amount')
    .neq('payment_status', 'fully_paid');

  if (error) throw error;

  return (data || []).reduce((sum, o) => sum + (o.balance_amount || 0), 0);
}

async function getTotalRevenue() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('amount');

  if (error) throw error;

  return (data || []).reduce((sum, p) => sum + (p.amount || 0), 0);
}

module.exports = {
  getAll,
  getById,
  getByOrderId,
  create,
  remove,
  getPendingReceivables,
  getTotalRevenue
};
