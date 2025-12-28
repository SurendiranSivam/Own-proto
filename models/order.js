const supabase = require('../config/supabase');

const TABLE = 'orders';

async function getAll() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('id', { ascending: false });

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

async function create(orderData) {
  const advance_amount = (orderData.total_amount * (orderData.advance_percentage || 0)) / 100;
  const balance_amount = orderData.total_amount - advance_amount;

  let payment_status = 'pending';
  if (advance_amount >= orderData.total_amount) {
    payment_status = 'fully_paid';
  } else if (advance_amount > 0) {
    payment_status = 'partially_paid';
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert([{
      ...orderData,
      advance_amount,
      balance_amount,
      payment_status,
      status: 'in_progress'
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function update(id, orderData) {
  // Get existing order first
  const { data: existing, error: fetchError } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', parseInt(id))
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') throw new Error('Order not found');
    throw fetchError;
  }

  let advance_amount, balance_amount, payment_status;

  if (orderData.total_amount !== undefined && orderData.advance_percentage !== undefined) {
    advance_amount = (orderData.total_amount * orderData.advance_percentage) / 100;
    balance_amount = orderData.total_amount - advance_amount;

    payment_status = 'pending';
    if (advance_amount >= orderData.total_amount) {
      payment_status = 'fully_paid';
    } else if (advance_amount > 0) {
      payment_status = 'partially_paid';
    }
  } else {
    advance_amount = existing.advance_amount;
    balance_amount = existing.balance_amount;
    payment_status = existing.payment_status;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update({
      ...orderData,
      advance_amount,
      balance_amount,
      payment_status
    })
    .eq('id', parseInt(id))
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function getActive() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .in('status', ['in_progress', 'completed'])
    .order('id', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function updatePaymentStatus(orderId) {
  // Get order
  const { data: order, error: orderError } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', parseInt(orderId))
    .single();

  if (orderError) throw new Error('Order not found');

  // Get all payments for this order
  const { data: payments, error: paymentError } = await supabase
    .from('payments')
    .select('amount')
    .eq('order_id', parseInt(orderId));

  if (paymentError) throw paymentError;

  const totalPaid = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalAmount = order.total_amount;
  const balanceAmount = totalAmount - totalPaid;

  let paymentStatus = 'pending';
  if (totalPaid >= totalAmount) {
    paymentStatus = 'fully_paid';
  } else if (totalPaid > 0) {
    paymentStatus = 'partially_paid';
  }

  const { error } = await supabase
    .from(TABLE)
    .update({
      advance_amount: totalPaid,
      balance_amount: balanceAmount,
      payment_status: paymentStatus
    })
    .eq('id', parseInt(orderId));

  if (error) throw error;

  return { paymentStatus, totalPaid, balanceAmount };
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  getActive,
  updatePaymentStatus
};
