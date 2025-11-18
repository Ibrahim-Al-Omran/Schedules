import { createClient } from '@supabase/supabase-js';

// Admin client with service role key for server-side operations
// This bypasses Row Level Security and has full database access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zlxuzrylcizsojckggxp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables');
}

console.log('Supabase Admin Client Config:', {
  url: supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  keyLength: supabaseServiceKey?.length,
  keyPrefix: supabaseServiceKey?.substring(0, 20) + '...'
});

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    }
  }
});

// Helper functions for common operations
export const adminDb = {
  // Users
  users: {
    async findByEmail(email: string) {
      const { data, error } = await supabaseAdmin
        .from('User')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },

    async findById(id: string) {
      const { data, error } = await supabaseAdmin
        .from('User')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },

    async create(userData: { name: string; email: string; password: string }) {
      const now = new Date().toISOString();
      const { data, error } = await supabaseAdmin
        .from('User')
        .insert({
          ...userData,
          createdAt: now,
          updatedAt: now
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async update(id: string, updates: Record<string, unknown>) {
      const { data, error } = await supabaseAdmin
        .from('User')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async findAll() {
      const { data, error } = await supabaseAdmin
        .from('User')
        .select('id, name, email, createdAt');
      
      if (error) throw error;
      return data || [];
    }
  },

  // Shifts
  shifts: {
    async findMany(where?: { userId?: string; id?: string }, orderBy?: { field: string; order: 'asc' | 'desc' }) {
      let query = supabaseAdmin.from('Shift').select('*, user:User(id, name, email)');
      
      if (where?.userId) query = query.eq('userId', where.userId);
      if (where?.id) query = query.eq('id', where.id);
      if (orderBy) query = query.order(orderBy.field, { ascending: orderBy.order === 'asc' });
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async findById(id: string) {
      const { data, error } = await supabaseAdmin
        .from('Shift')
        .select('*, user:User(id, name, email)')
        .eq('id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },

    async create(shiftData: Record<string, unknown>) {
      const { data, error } = await supabaseAdmin
        .from('Shift')
        .insert(shiftData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async update(id: string, updates: Record<string, unknown>) {
      const { data, error } = await supabaseAdmin
        .from('Shift')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabaseAdmin
        .from('Shift')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },

    async deleteMany(userId: string) {
      const { error } = await supabaseAdmin
        .from('Shift')
        .delete()
        .eq('userId', userId);
      
      if (error) throw error;
    }
  }
};
