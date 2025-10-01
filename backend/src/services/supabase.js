const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Configure Node.js to ignore SSL errors in development
if (process.env.SUPABASE_IGNORE_TLS === 'true') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.warn('[supabase] SSL verification disabled for development');
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('[supabase] SUPABASE_URL or SUPABASE_KEY not set; supabase adapter will not work without env vars');
}

const supabase = createClient(SUPABASE_URL || '', SUPABASE_KEY || '', {
    auth: { persistSession: false }
});

// Helpers to map simple Prisma-like calls to Supabase
function table(name) {
    const tbl = supabase.from(name);

    return {
        findMany: async (opts = {}) => {
            // support where (simple eq), include ignored, orderBy (single), skip/take
            let query = supabase.from(name).select('*');

            if (opts.where) {
                // simple AND/OR limited support
                for (const k of Object.keys(opts.where)) {
                    const v = opts.where[k];
                    if (k === 'OR' && Array.isArray(v)) {
                        // use or filter
                        const clauses = v.map(cond => {
                            const key = Object.keys(cond)[0];
                            const val = cond[key];
                            const op = typeof val === 'object' && val !== null ? Object.keys(val)[0] : 'eq';
                            const rhs = typeof val === 'object' && val !== null ? val[op] : val;
                            return `${key}.eq.${encodeURIComponent(rhs)}`;
                        });
                        query = supabase.from(name).select('*').or(clauses.join(','));
                    } else if (typeof v === 'object' && v !== null) {
                        if (v.hasOwnProperty('contains')) {
                            query = query.ilike(k, `%${v.contains}%`);
                        } else if (v.hasOwnProperty('gt')) {
                            query = query.gt(k, v.gt);
                        } else if (v.hasOwnProperty('gte')) {
                            query = query.gte(k, v.gte);
                        } else if (v.hasOwnProperty('lt')) {
                            query = query.lt(k, v.lt);
                        } else if (v.hasOwnProperty('lte')) {
                            query = query.lte(k, v.lte);
                        } else if (v.hasOwnProperty('not')) {
                            query = query.ne(k, v.not);
                        } else if (v.hasOwnProperty('not')) {
                            query = query.not(k, v.not);
                        } else if (v.hasOwnProperty('in')) {
                            query = query.in(k, v.in);
                        } else if (v.hasOwnProperty('gte') || v.hasOwnProperty('lte')) {
                            // handled above
                        } else if (v && v.hasOwnProperty('equals')) {
                            query = query.eq(k, v.equals);
                        } else if (typeof v === 'object' && v !== null && v.hasOwnProperty('not')) {
                            // skip
                        } else if (k === 'id' && v && v.not) {
                            query = query.not('id', 'eq', v.not);
                        } else if (k === 'unitsRemaining' && v && v.gt !== undefined) {
                            query = query.gt(k, v.gt);
                        } else {
                            // direct eq
                            query = query.eq(k, v);
                        }
                    } else {
                        query = query.eq(k, v);
                    }
                }
            }

            if (opts.orderBy) {
                const key = Object.keys(opts.orderBy)[0];
                const dir = opts.orderBy[key];
                query = query.order(key, { ascending: dir === 'asc' });
            }

            if (opts.skip) query = query.range(opts.skip, (opts.skip || 0) + (opts.take || 1000) - 1);
            if (opts.take && !opts.skip) query = query.limit(opts.take);

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        },

        findUnique: async ({ where }) => {
            const key = Object.keys(where)[0];
            const val = where[key];
            const { data, error } = await supabase.from(name).select('*').eq(key, val).maybeSingle();
            if (error) throw error;
            return data || null;
        },

        findFirst: async (opts = {}) => {
            const arr = await table(name).findMany(opts);
            return arr && arr.length > 0 ? arr[0] : null;
        },

        create: async ({ data }) => {
            // ensure id exists
            if (!data.id) data.id = uuidv4();
            const { data: d, error } = await supabase.from(name).insert([data]).select().single();
            if (error) throw error;
            return d;
        },

        update: async ({ where, data }) => {
            const key = Object.keys(where)[0];
            const val = where[key];
            const { data: d, error } = await supabase.from(name).update(data).eq(key, val).select().maybeSingle();
            if (error) throw error;
            return d;
        },

        delete: async ({ where }) => {
            const key = Object.keys(where)[0];
            const val = where[key];
            const { error } = await supabase.from(name).delete().eq(key, val);
            if (error) throw error;
            return { count: 1 };
        },

        deleteMany: async ({ where }) => {
            let query = supabase.from(name).delete();
            if (where) {
                for (const k of Object.keys(where)) {
                    const v = where[k];
                    if (typeof v === 'object' && v !== null && v.hasOwnProperty('in')) {
                        query = query.in(k, v.in);
                    } else if (typeof v === 'object' && v !== null && v.hasOwnProperty('not')) {
                        query = query.not(k, 'eq', v.not);
                    } else {
                        query = query.eq(k, v);
                    }
                }
            }
            const { data, error } = await query;
            if (error) throw error;
            return { count: Array.isArray(data) ? data.length : 0 };
        },

        count: async ({ where } = {}) => {
            let query = supabase.from(name).select('id', { count: 'exact', head: true });
            if (where) {
                for (const k of Object.keys(where)) {
                    const v = where[k];
                    if (typeof v === 'object' && v !== null && v.hasOwnProperty('gt')) {
                        query = query.gt(k, v.gt);
                    } else {
                        query = query.eq(k, v);
                    }
                }
            }
            const { count, error } = await query;
            if (error) throw error;
            return count || 0;
        }
    };
}

// Export a proxy that mimics minimal prisma usage
const models = ['patient', 'patientFile', 'appointment', 'creditPack', 'creditRedemption'];

const adapter = {};
for (const m of models) {
    const tableName = {
        patient: 'patients',
        patientFile: 'patient_files',
        appointment: 'appointments',
        creditPack: 'credit_packs',
        creditRedemption: 'credit_redemptions'
    }[m];

    adapter[m] = table(tableName);
}

// Minimal transaction support: not supported via supabase-js in same way; throw if used.
adapter.$transaction = async () => {
    throw new Error('Transactions are not supported when USE_SUPABASE=true. Run with Prisma or implement transactional logic.');
};

module.exports = adapter;
