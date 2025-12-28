/**
 * Input Validation Utilities
 * Centralized validation functions for all API inputs
 */

// Email validation
const isValidEmail = (email) => {
    if (!email) return true; // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Phone validation (10-15 digits)
const isValidPhone = (phone) => {
    if (!phone) return true; // Optional field
    const phoneRegex = /^\d{10,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-]/g, ''));
};

// Indian GST validation (15 characters)
const isValidGST = (gst) => {
    if (!gst) return true; // Optional field
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gst.toUpperCase());
};

// Indian Pincode validation (6 digits)
const isValidPincode = (pincode) => {
    if (!pincode) return true; // Optional field
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    return pincodeRegex.test(pincode);
};

// Date validation (YYYY-MM-DD format)
const isValidDate = (dateStr) => {
    if (!dateStr) return true; // Optional field
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date);
};

// Check if date is not in future
const isNotFutureDate = (dateStr) => {
    if (!dateStr) return true;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return date <= today;
};

// Check if end date is after start date
const isDateAfterOrEqual = (startDate, endDate) => {
    if (!startDate || !endDate) return true;
    return new Date(endDate) >= new Date(startDate);
};

// Number range validation
const isInRange = (value, min, max) => {
    if (value === null || value === undefined) return true;
    const num = parseFloat(value);
    return !isNaN(num) && num >= min && num <= max;
};

// Positive number validation
const isPositiveNumber = (value) => {
    if (value === null || value === undefined) return true;
    const num = parseFloat(value);
    return !isNaN(num) && num > 0;
};

// Non-negative number validation
const isNonNegativeNumber = (value) => {
    if (value === null || value === undefined) return true;
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0;
};

// Enum validation
const isValidEnum = (value, allowedValues) => {
    if (!value) return true; // Optional field
    return allowedValues.includes(value.toLowerCase());
};

// String length validation
const isValidLength = (str, min, max) => {
    if (!str) return true;
    return str.length >= min && str.length <= max;
};

// Required field validation
const isRequired = (value) => {
    return value !== null && value !== undefined && value !== '';
};

// Temperature range validation (for filaments)
const isValidTemperature = (temp) => {
    if (temp === null || temp === undefined) return true;
    return isInRange(temp, 150, 400);
};

// ==========================================
// ENUM DEFINITIONS
// ==========================================

const ENUMS = {
    PAYMENT_TERMS: ['advance', 'cod', 'net15', 'net30', 'net60'],
    ORDER_PRIORITY: ['normal', 'urgent', 'express'],
    ORDER_STATUS: ['pending', 'in_progress', 'completed', 'delivered', 'cancelled'],
    PAYMENT_STATUS: ['pending', 'partially_paid', 'fully_paid'],
    PAYMENT_TYPE: ['advance', 'balance', 'refund'],
    PAYMENT_METHOD: ['cash', 'upi', 'bank_transfer', 'card', 'cheque'],
    PROCUREMENT_STATUS: ['pending', 'shipped', 'delivered', 'delayed', 'cancelled'],
    PROCUREMENT_PAYMENT: ['pending', 'paid', 'partial'],
    FILAMENT_TYPE: ['pla', 'abs', 'petg', 'tpu', 'asa', 'nylon', 'pc', 'pva', 'hips', 'wood', 'metal', 'carbon', 'other'],
    QUALITY_GRADE: ['standard', 'premium', 'industrial'],
    PRINT_STATUS: ['success', 'failed', 'partial', 'cancelled'],
    INDIAN_STATES: [
        'andhra pradesh', 'arunachal pradesh', 'assam', 'bihar', 'chhattisgarh',
        'goa', 'gujarat', 'haryana', 'himachal pradesh', 'jharkhand', 'karnataka',
        'kerala', 'madhya pradesh', 'maharashtra', 'manipur', 'meghalaya', 'mizoram',
        'nagaland', 'odisha', 'punjab', 'rajasthan', 'sikkim', 'tamil nadu',
        'telangana', 'tripura', 'uttar pradesh', 'uttarakhand', 'west bengal',
        'delhi', 'jammu and kashmir', 'ladakh', 'puducherry', 'chandigarh',
        'andaman and nicobar', 'dadra and nagar haveli', 'daman and diu', 'lakshadweep'
    ]
};

// ==========================================
// VALIDATION RESULT HELPER
// ==========================================

class ValidationError extends Error {
    constructor(field, message) {
        super(message);
        this.field = field;
        this.name = 'ValidationError';
    }
}

const validate = (condition, field, message) => {
    if (!condition) {
        throw new ValidationError(field, message);
    }
};

// ==========================================
// ENTITY-SPECIFIC VALIDATORS
// ==========================================

const validateVendor = (data, isUpdate = false) => {
    const errors = [];

    // Required fields (only on create)
    if (!isUpdate && !isRequired(data.name)) {
        errors.push({ field: 'name', message: 'Vendor name is required' });
    }

    // Name length
    if (data.name && !isValidLength(data.name, 2, 255)) {
        errors.push({ field: 'name', message: 'Name must be 2-255 characters' });
    }

    // Email format
    if (data.email && !isValidEmail(data.email)) {
        errors.push({ field: 'email', message: 'Invalid email format' });
    }

    // Phone format
    if (data.contact && !isValidPhone(data.contact)) {
        errors.push({ field: 'contact', message: 'Contact must be 10-15 digits' });
    }

    // GST format
    if (data.gst && !isValidGST(data.gst)) {
        errors.push({ field: 'gst', message: 'Invalid GST format (15 characters)' });
    }

    // Pincode format
    if (data.pincode && !isValidPincode(data.pincode)) {
        errors.push({ field: 'pincode', message: 'Invalid pincode (6 digits)' });
    }

    // Payment terms enum
    if (data.payment_terms && !isValidEnum(data.payment_terms, ENUMS.PAYMENT_TERMS)) {
        errors.push({ field: 'payment_terms', message: `Payment terms must be one of: ${ENUMS.PAYMENT_TERMS.join(', ')}` });
    }

    return errors;
};

const validateOrder = (data, isUpdate = false) => {
    const errors = [];

    // Required fields
    if (!isUpdate) {
        if (!isRequired(data.customer_name)) {
            errors.push({ field: 'customer_name', message: 'Customer name is required' });
        }
        if (!isRequired(data.order_date)) {
            errors.push({ field: 'order_date', message: 'Order date is required' });
        }
        if (!isRequired(data.total_amount)) {
            errors.push({ field: 'total_amount', message: 'Total amount is required' });
        }
    }

    // Customer name length
    if (data.customer_name && !isValidLength(data.customer_name, 2, 255)) {
        errors.push({ field: 'customer_name', message: 'Customer name must be 2-255 characters' });
    }

    // Email format
    if (data.customer_email && !isValidEmail(data.customer_email)) {
        errors.push({ field: 'customer_email', message: 'Invalid email format' });
    }

    // Phone format
    if (data.contact_number && !isValidPhone(data.contact_number)) {
        errors.push({ field: 'contact_number', message: 'Contact must be 10-15 digits' });
    }

    // Total amount must be positive
    if (data.total_amount !== undefined && !isPositiveNumber(data.total_amount)) {
        errors.push({ field: 'total_amount', message: 'Total amount must be greater than 0' });
    }

    // Percentage validations
    if (data.advance_percentage !== undefined && !isInRange(data.advance_percentage, 0, 100)) {
        errors.push({ field: 'advance_percentage', message: 'Advance percentage must be 0-100' });
    }

    if (data.discount_percentage !== undefined && !isInRange(data.discount_percentage, 0, 100)) {
        errors.push({ field: 'discount_percentage', message: 'Discount percentage must be 0-100' });
    }

    if (data.gst_percentage !== undefined && !isInRange(data.gst_percentage, 0, 28)) {
        errors.push({ field: 'gst_percentage', message: 'GST percentage must be 0-28' });
    }

    // Date validation
    if (data.order_date && !isValidDate(data.order_date)) {
        errors.push({ field: 'order_date', message: 'Invalid order date format' });
    }

    if (data.eta_delivery && !isValidDate(data.eta_delivery)) {
        errors.push({ field: 'eta_delivery', message: 'Invalid ETA date format' });
    }

    // ETA must be after order date
    if (data.order_date && data.eta_delivery && !isDateAfterOrEqual(data.order_date, data.eta_delivery)) {
        errors.push({ field: 'eta_delivery', message: 'ETA must be on or after order date' });
    }

    // Priority enum
    if (data.priority && !isValidEnum(data.priority, ENUMS.ORDER_PRIORITY)) {
        errors.push({ field: 'priority', message: `Priority must be one of: ${ENUMS.ORDER_PRIORITY.join(', ')}` });
    }

    // Status enum
    if (data.status && !isValidEnum(data.status, ENUMS.ORDER_STATUS)) {
        errors.push({ field: 'status', message: `Status must be one of: ${ENUMS.ORDER_STATUS.join(', ')}` });
    }

    return errors;
};

const validatePayment = (data) => {
    const errors = [];

    // Required fields
    if (!isRequired(data.order_id)) {
        errors.push({ field: 'order_id', message: 'Order ID is required' });
    }

    if (!isRequired(data.amount)) {
        errors.push({ field: 'amount', message: 'Amount is required' });
    }

    if (!isRequired(data.payment_type)) {
        errors.push({ field: 'payment_type', message: 'Payment type is required' });
    }

    if (!isRequired(data.payment_date)) {
        errors.push({ field: 'payment_date', message: 'Payment date is required' });
    }

    // Amount must be positive
    if (data.amount !== undefined && !isPositiveNumber(data.amount)) {
        errors.push({ field: 'amount', message: 'Amount must be greater than 0' });
    }

    // Payment type enum
    if (data.payment_type && !isValidEnum(data.payment_type, ENUMS.PAYMENT_TYPE)) {
        errors.push({ field: 'payment_type', message: `Payment type must be one of: ${ENUMS.PAYMENT_TYPE.join(', ')}` });
    }

    // Payment method enum
    if (data.payment_method && !isValidEnum(data.payment_method, ENUMS.PAYMENT_METHOD)) {
        errors.push({ field: 'payment_method', message: `Payment method must be one of: ${ENUMS.PAYMENT_METHOD.join(', ')}` });
    }

    // Date validation
    if (data.payment_date && !isValidDate(data.payment_date)) {
        errors.push({ field: 'payment_date', message: 'Invalid payment date format' });
    }

    return errors;
};

const validateFilament = (data, isUpdate = false) => {
    const errors = [];

    // Required fields
    if (!isUpdate) {
        if (!isRequired(data.type)) {
            errors.push({ field: 'type', message: 'Filament type is required' });
        }
        if (!isRequired(data.brand)) {
            errors.push({ field: 'brand', message: 'Brand is required' });
        }
        if (!isRequired(data.color)) {
            errors.push({ field: 'color', message: 'Color is required' });
        }
        if (!isRequired(data.cost_per_kg)) {
            errors.push({ field: 'cost_per_kg', message: 'Cost per kg is required' });
        }
    }

    // Type enum
    if (data.type && !isValidEnum(data.type, ENUMS.FILAMENT_TYPE)) {
        errors.push({ field: 'type', message: `Type must be one of: ${ENUMS.FILAMENT_TYPE.join(', ')}` });
    }

    // Cost must be positive
    if (data.cost_per_kg !== undefined && !isPositiveNumber(data.cost_per_kg)) {
        errors.push({ field: 'cost_per_kg', message: 'Cost per kg must be greater than 0' });
    }

    // Temperature validations
    if (data.print_temp_min !== undefined && !isValidTemperature(data.print_temp_min)) {
        errors.push({ field: 'print_temp_min', message: 'Print temp must be 150-400°C' });
    }

    if (data.print_temp_max !== undefined && !isValidTemperature(data.print_temp_max)) {
        errors.push({ field: 'print_temp_max', message: 'Print temp must be 150-400°C' });
    }

    if (data.print_temp_min && data.print_temp_max && data.print_temp_min > data.print_temp_max) {
        errors.push({ field: 'print_temp_max', message: 'Max temp must be >= min temp' });
    }

    // Quality grade enum
    if (data.quality_grade && !isValidEnum(data.quality_grade, ENUMS.QUALITY_GRADE)) {
        errors.push({ field: 'quality_grade', message: `Quality grade must be one of: ${ENUMS.QUALITY_GRADE.join(', ')}` });
    }

    return errors;
};

const validateProcurement = (data, isUpdate = false) => {
    const errors = [];

    // Required fields
    if (!isUpdate) {
        if (!isRequired(data.vendor_id)) {
            errors.push({ field: 'vendor_id', message: 'Vendor is required' });
        }
        if (!isRequired(data.filament_id)) {
            errors.push({ field: 'filament_id', message: 'Filament is required' });
        }
        if (!isRequired(data.quantity_kg)) {
            errors.push({ field: 'quantity_kg', message: 'Quantity is required' });
        }
        if (!isRequired(data.cost_per_kg)) {
            errors.push({ field: 'cost_per_kg', message: 'Cost per kg is required' });
        }
    }

    // Quantity must be positive
    if (data.quantity_kg !== undefined && !isPositiveNumber(data.quantity_kg)) {
        errors.push({ field: 'quantity_kg', message: 'Quantity must be greater than 0' });
    }

    // Cost must be positive
    if (data.cost_per_kg !== undefined && !isPositiveNumber(data.cost_per_kg)) {
        errors.push({ field: 'cost_per_kg', message: 'Cost per kg must be greater than 0' });
    }

    // Status enum
    if (data.status && !isValidEnum(data.status, ENUMS.PROCUREMENT_STATUS)) {
        errors.push({ field: 'status', message: `Status must be one of: ${ENUMS.PROCUREMENT_STATUS.join(', ')}` });
    }

    // Payment status enum
    if (data.payment_status && !isValidEnum(data.payment_status, ENUMS.PROCUREMENT_PAYMENT)) {
        errors.push({ field: 'payment_status', message: `Payment status must be one of: ${ENUMS.PROCUREMENT_PAYMENT.join(', ')}` });
    }

    return errors;
};

const validatePrintUsage = (data) => {
    const errors = [];

    // Required fields
    if (!isRequired(data.order_id)) {
        errors.push({ field: 'order_id', message: 'Order is required' });
    }

    if (!isRequired(data.filament_id)) {
        errors.push({ field: 'filament_id', message: 'Filament is required' });
    }

    if (!isRequired(data.quantity_used_kg)) {
        errors.push({ field: 'quantity_used_kg', message: 'Quantity used is required' });
    }

    // Quantity must be positive
    if (data.quantity_used_kg !== undefined && !isPositiveNumber(data.quantity_used_kg)) {
        errors.push({ field: 'quantity_used_kg', message: 'Quantity must be greater than 0' });
    }

    // Duration must be positive if provided
    if (data.print_duration_mins !== undefined && !isPositiveNumber(data.print_duration_mins)) {
        errors.push({ field: 'print_duration_mins', message: 'Duration must be greater than 0' });
    }

    // Print status enum
    if (data.print_status && !isValidEnum(data.print_status, ENUMS.PRINT_STATUS)) {
        errors.push({ field: 'print_status', message: `Print status must be one of: ${ENUMS.PRINT_STATUS.join(', ')}` });
    }

    // Failure reason required if status is failed
    if (data.print_status === 'failed' && !data.failure_reason) {
        errors.push({ field: 'failure_reason', message: 'Failure reason is required when print failed' });
    }

    return errors;
};

// ==========================================
// EXPRESS MIDDLEWARE
// ==========================================

const validationMiddleware = (validator) => {
    return (req, res, next) => {
        const isUpdate = req.method === 'PUT' || req.method === 'PATCH';
        const errors = validator(req.body, isUpdate);

        if (errors.length > 0) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors
            });
        }

        next();
    };
};

module.exports = {
    // Basic validators
    isValidEmail,
    isValidPhone,
    isValidGST,
    isValidPincode,
    isValidDate,
    isNotFutureDate,
    isDateAfterOrEqual,
    isInRange,
    isPositiveNumber,
    isNonNegativeNumber,
    isValidEnum,
    isValidLength,
    isRequired,
    isValidTemperature,

    // Entity validators
    validateVendor,
    validateOrder,
    validatePayment,
    validateFilament,
    validateProcurement,
    validatePrintUsage,

    // Middleware
    validationMiddleware,

    // Enums
    ENUMS,

    // Error class
    ValidationError
};
