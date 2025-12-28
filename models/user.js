/**
 * User Model - Supabase
 */

const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

const userModel = {
    async getAll() {
        const { data, error } = await supabase
            .from('users')
            .select('id, email, name, role, is_active, last_login, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getById(id) {
        const { data, error } = await supabase
            .from('users')
            .select('id, email, name, role, is_active, last_login, created_at')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    async getByEmail(email) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email.toLowerCase())
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    async create(userData) {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(userData.password, salt);

        const { data, error } = await supabase
            .from('users')
            .insert([{
                email: userData.email.toLowerCase(),
                password_hash,
                name: userData.name,
                role: userData.role || 'executive',
                is_active: true
            }])
            .select('id, email, name, role, is_active, created_at')
            .single();

        if (error) throw error;
        return data;
    },

    async update(id, userData) {
        const updateData = {
            name: userData.name,
            role: userData.role,
            is_active: userData.is_active
        };

        // If password is being updated
        if (userData.password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password_hash = await bcrypt.hash(userData.password, salt);
        }

        const { data, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', id)
            .select('id, email, name, role, is_active')
            .single();

        if (error) throw error;
        return data;
    },

    async updateLastLogin(id) {
        const { error } = await supabase
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
    },

    async verifyPassword(plainPassword, hashedPassword) {
        return bcrypt.compare(plainPassword, hashedPassword);
    },

    async setResetToken(email, token, expires) {
        const { error } = await supabase
            .from('users')
            .update({
                reset_token: token,
                reset_token_expires: expires
            })
            .eq('email', email.toLowerCase());

        if (error) throw error;
    },

    async getByResetToken(token) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('reset_token', token)
            .gt('reset_token_expires', new Date().toISOString())
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    async resetPassword(userId, newPassword) {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(newPassword, salt);

        const { error } = await supabase
            .from('users')
            .update({
                password_hash,
                reset_token: null,
                reset_token_expires: null
            })
            .eq('id', userId);

        if (error) throw error;
    },

    async remove(id) {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    }
};

module.exports = userModel;
