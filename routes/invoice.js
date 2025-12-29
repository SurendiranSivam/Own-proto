const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// Generate invoice number
function generateInvoiceNumber(orderId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `INV-${year}${month}-${String(orderId).padStart(4, '0')}`;
}

// Get invoice data for an order
router.get('/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const { data: payments } = await supabase
            .from('payments')
            .select('*')
            .eq('order_id', orderId)
            .order('payment_date', { ascending: true });

        const totalPaid = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
        const invoiceNumber = generateInvoiceNumber(orderId);

        const subtotal = order.total_amount || 0;
        const discountAmount = subtotal * (order.discount_percentage || 0) / 100;
        const afterDiscount = subtotal - discountAmount;
        const gstAmount = afterDiscount * (order.gst_percentage || 0) / 100;
        const grandTotal = afterDiscount + gstAmount;

        res.json({
            invoiceNumber,
            invoiceDate: new Date().toISOString().split('T')[0],
            order,
            payments: payments || [],
            summary: { subtotal, discount: discountAmount, afterDiscount, gst: gstAmount, total: grandTotal, paid: totalPaid, balance: grandTotal - totalPaid }
        });
    } catch (error) {
        console.error('Invoice fetch error:', error);
        res.status(500).json({ error: 'Failed to generate invoice' });
    }
});

// Download invoice as PDF
router.get('/:orderId/pdf', async (req, res) => {
    try {
        const { orderId } = req.params;

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const { data: payments } = await supabase
            .from('payments')
            .select('*')
            .eq('order_id', orderId)
            .order('payment_date', { ascending: true });

        const totalPaid = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
        const invoiceNumber = generateInvoiceNumber(orderId);

        // Calculate totals
        const subtotal = order.total_amount || 0;
        const discountAmount = subtotal * (order.discount_percentage || 0) / 100;
        const afterDiscount = subtotal - discountAmount;
        const gstAmount = afterDiscount * (order.gst_percentage || 0) / 100;
        const grandTotal = afterDiscount + gstAmount;
        const balance = grandTotal - totalPaid;

        // Create PDF - A4 size
        const doc = new PDFDocument({ size: 'A4', margin: 40 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${invoiceNumber}.pdf`);
        doc.pipe(res);

        const pageWidth = 595;
        const leftMargin = 40;
        const rightMargin = pageWidth - 40;
        const contentWidth = rightMargin - leftMargin;

        // ============ HEADER ============
        const logoPath = path.join(__dirname, '../public/images/logo.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, leftMargin, 30, { width: 50 });
        }

        doc.font('Helvetica-Bold').fontSize(20).text('Own Proto', leftMargin + 60, 35);
        doc.font('Helvetica').fontSize(9).text('3D Printing Solutions', leftMargin + 60, 55);

        // Invoice box - right side
        doc.font('Helvetica-Bold').fontSize(16).text('TAX INVOICE', rightMargin - 120, 35);
        doc.font('Helvetica').fontSize(9);
        doc.text(`Invoice: ${invoiceNumber}`, rightMargin - 120, 55);
        doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, rightMargin - 120, 67);

        // Horizontal line
        doc.moveTo(leftMargin, 90).lineTo(rightMargin, 90).stroke();

        // ============ BILL TO & ORDER INFO ============
        let y = 105;

        // Bill To section
        doc.font('Helvetica-Bold').fontSize(10).text('BILL TO:', leftMargin, y);
        doc.font('Helvetica').fontSize(10);
        y += 15;
        doc.text(order.customer_name || 'N/A', leftMargin, y);
        y += 12;
        if (order.customer_email) { doc.text(order.customer_email, leftMargin, y); y += 12; }
        if (order.contact_number) { doc.text(`Ph: ${order.contact_number}`, leftMargin, y); y += 12; }
        if (order.delivery_address) {
            doc.text(order.delivery_address, leftMargin, y, { width: 200 });
            y += 24;
        }

        // Order Info - right column
        const rightColX = 350;
        let rightY = 105;
        doc.font('Helvetica-Bold').fontSize(10).text('ORDER DETAILS:', rightColX, rightY);
        doc.font('Helvetica').fontSize(10);
        rightY += 15;
        doc.text(`Order ID: #${order.id}`, rightColX, rightY); rightY += 12;
        doc.text(`Order Date: ${order.order_date ? new Date(order.order_date).toLocaleDateString('en-IN') : '-'}`, rightColX, rightY); rightY += 12;
        doc.text(`Priority: ${(order.priority || 'normal').toUpperCase()}`, rightColX, rightY); rightY += 12;
        doc.text(`Status: ${(order.status || 'pending').replace('_', ' ').toUpperCase()}`, rightColX, rightY);

        // Move to below both sections
        y = Math.max(y, rightY) + 20;

        // ============ ITEMS TABLE ============
        // Table header
        const colDesc = leftMargin;
        const colQty = 320;
        const colRate = 400;
        const colAmount = 480;
        const tableWidth = contentWidth;

        doc.rect(leftMargin, y, tableWidth, 22).fill('#1e3a5f');
        doc.fillColor('white').font('Helvetica-Bold').fontSize(10);
        doc.text('Description', colDesc + 10, y + 6);
        doc.text('Qty', colQty, y + 6);
        doc.text('Rate', colRate, y + 6);
        doc.text('Amount', colAmount, y + 6);
        doc.fillColor('black');
        y += 22;

        // Table row
        doc.rect(leftMargin, y, tableWidth, 50).stroke();
        doc.font('Helvetica-Bold').fontSize(10);
        // Show Print Type prominently
        const printType = order.print_type || '3D Printing';
        doc.text(`${printType} - 3D Print Service`, colDesc + 10, y + 5, { width: 250 });
        doc.font('Helvetica').fontSize(9).fillColor('gray');
        if (order.order_description) {
            doc.text(order.order_description, colDesc + 10, y + 18, { width: 250 });
        }
        if (order.filament_type) {
            doc.text(`Filament: ${order.filament_type} ${order.filament_color || ''}`, colDesc + 10, y + 32);
        }
        doc.fillColor('black').fontSize(10);
        const qty = order.estimated_quantity_units || 1;
        const unitPrice = subtotal / qty;
        doc.text(qty.toString(), colQty, y + 18);
        doc.text(`Rs.${unitPrice.toFixed(2)}`, colRate, y + 18);
        doc.text(`Rs.${subtotal.toFixed(2)}`, colAmount, y + 18);
        y += 50;

        // ============ SUMMARY SECTION ============
        y += 15;

        // Define summary box dimensions
        const boxX = 340;
        const boxWidth = 210;
        const labelX = boxX + 10;
        const valueX = boxX + boxWidth - 10; // Right edge for values

        // Calculate box height based on content
        let boxHeight = 100; // Base height
        if (order.discount_percentage > 0) boxHeight += 18;
        if (order.gst_percentage > 0) boxHeight += 18;

        // Draw the summary box first
        doc.rect(boxX, y - 5, boxWidth, boxHeight).stroke();

        const startY = y;

        doc.font('Helvetica').fontSize(10);
        doc.text('Subtotal:', labelX, y);
        doc.text(`Rs.${subtotal.toFixed(2)}`, valueX - 80, y, { width: 80, align: 'right' });
        y += 18;

        if (order.discount_percentage > 0) {
            doc.fillColor('green');
            doc.text(`Discount (${order.discount_percentage}%):`, labelX, y);
            doc.text(`-Rs.${discountAmount.toFixed(2)}`, valueX - 80, y, { width: 80, align: 'right' });
            doc.fillColor('black');
            y += 18;
        }

        if (order.gst_percentage > 0) {
            doc.text(`GST (${order.gst_percentage}%):`, labelX, y);
            doc.text(`+Rs.${gstAmount.toFixed(2)}`, valueX - 80, y, { width: 80, align: 'right' });
            y += 18;
        }

        // Line before grand total
        doc.moveTo(labelX, y).lineTo(valueX, y).stroke();
        y += 8;

        doc.font('Helvetica-Bold').fontSize(11);
        doc.text('Grand Total:', labelX, y);
        doc.text(`Rs.${grandTotal.toFixed(2)}`, valueX - 80, y, { width: 80, align: 'right' });
        y += 20;

        doc.font('Helvetica').fontSize(10);
        doc.text('Paid:', labelX, y);
        doc.fillColor('green').text(`Rs.${totalPaid.toFixed(2)}`, valueX - 80, y, { width: 80, align: 'right' });
        doc.fillColor('black');
        y += 18;

        doc.font('Helvetica-Bold');
        doc.text('Balance Due:', labelX, y);
        if (balance > 0) {
            doc.fillColor('red').text(`Rs.${balance.toFixed(2)}`, valueX - 80, y, { width: 80, align: 'right' });
        } else {
            doc.fillColor('green').text('PAID', valueX - 80, y, { width: 80, align: 'right' });
        }
        doc.fillColor('black');

        y += 40;

        // ============ PAYMENT HISTORY ============
        if (payments && payments.length > 0) {
            doc.font('Helvetica-Bold').fontSize(10).text('Payment History:', leftMargin, y);
            y += 15;
            doc.font('Helvetica').fontSize(9);
            payments.forEach(p => {
                doc.text(`• ${new Date(p.payment_date).toLocaleDateString('en-IN')} - Rs.${p.amount.toFixed(2)} (${(p.payment_method || 'cash').toUpperCase()})`, leftMargin + 10, y);
                y += 14;
            });
        }

        // ============ FOOTER ============
        doc.font('Helvetica').fontSize(9);
        doc.text('Thank you for your business!', leftMargin, 760, { align: 'center', width: contentWidth });
        doc.fontSize(8).fillColor('gray');
        doc.text('Own Proto - 3D Printing Services', leftMargin, 775, { align: 'center', width: contentWidth });

        doc.end();
    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

module.exports = router;
