import { createClient } from '@supabase/supabase-js';

// Supabase client with API key (much faster than Prisma connection strings)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zlxuzrylcizsojckggxp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  }
});

// Type definitions matching your Prisma schema
export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  googleAccessToken?: string | null;
  googleRefreshToken?: string | null;
  resetToken?: string | null;
  resetTokenExpiry?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Shift = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  coworkers: string;
  notes?: string | null;
  uploaded: boolean;
  createdAt: string;
  userId: string;
};

// Database operations using Supabase REST API (instant, no connection overhead)
export const db = {
  // Users
  users: {
    async create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
      const { data: user, error } = await supabase
        .from('User')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return user;
    },
    
    async findUnique(where: { id?: string; email?: string }) {
      let query = supabase.from('User').select();
      if (where.id) query = query.eq('id', where.id);
      if (where.email) query = query.eq('email', where.email);
      const { data, error } = await query.single();
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
      return data;
    },
    
    async findMany(where?: { id?: string }) {
      let query = supabase.from('User').select();
      if (where?.id) query = query.eq('id', where.id);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    
    async update(where: { id: string }, data: Partial<User>) {
      const { data: user, error } = await supabase
        .from('User')
        .update(data)
        .eq('id', where.id)
        .select()
        .single();
      if (error) throw error;
      return user;
    },
    
    async delete(where: { id: string }) {
      const { error } = await supabase
        .from('User')
        .delete()
        .eq('id', where.id);
      if (error) throw error;
    }
  },
  
  // Shifts
  shifts: {
    async create(data: Omit<Shift, 'id' | 'createdAt'>) {
      const { data: shift, error } = await supabase
        .from('Shift')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return shift;
    },
    
    async findMany(where?: { userId?: string; id?: string }, orderBy?: { date: 'asc' | 'desc' }) {
      let query = supabase.from('Shift').select('*, user:User(id, name, email)');
      if (where?.userId) query = query.eq('userId', where.userId);
      if (where?.id) query = query.eq('id', where.id);
      if (orderBy?.date) query = query.order('date', { ascending: orderBy.date === 'asc' });
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    
    async findUnique(where: { id: string }) {
      const { data, error } = await supabase
        .from('Shift')
        .select('*, user:User(id, name, email)')
        .eq('id', where.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    
    async update(where: { id: string }, data: Partial<Shift>) {
      const { data: shift, error } = await supabase
        .from('Shift')
        .update(data)
        .eq('id', where.id)
        .select()
        .single();
      if (error) throw error;
      return shift;
    },
    
    async delete(where: { id: string }) {
      const { error } = await supabase
        .from('Shift')
        .delete()
        .eq('id', where.id);
      if (error) throw error;
    },
    
    async deleteMany(where: { userId: string }) {
      const { error } = await supabase
        .from('Shift')
        .delete()
        .eq('userId', where.userId);
      if (error) throw error;
    }
  }
};
