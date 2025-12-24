const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

class DatabaseManager {
    constructor(tenantSlug = null) {
        this.supabase = null;
        this.isConnected = false;
        this.tenantSlug = tenantSlug; // 🆕 Almacenar el tenant slug
        
        this.supabaseUrl = process.env.SUPABASE_URL;
        this.supabaseKey = process.env.SUPABASE_SERVICE_KEY;

        console.log('🔄 Inicializando DatabaseManager...');
        console.log(`   📋 URL: ${this.supabaseUrl ? 'configurada' : '❌ falta'}`);
        console.log(`   🔑 Service Key: ${this.supabaseKey ? 'configurada' : '❌ falta'}`);
        if (tenantSlug) {
            console.log(`   🏢 Tenant: ${tenantSlug}`);
        }
        // In-memory fallback for configuration table when DB table is missing
        // This allows the app to continue operating until the DB schema is fixed.
        this._inMemoryConfiguration = new Map();
    }

    async initialize() {
        try {
            if (!this.supabaseUrl || !this.supabaseKey) {
                console.warn('⚠️ Faltan credenciales de Supabase en .env - el sistema continuará en modo desconectado (sin acceso a Supabase)');
                this.isConnected = false;
                this.supabase = null;
                return null;
            }

            this.supabase = createClient(this.supabaseUrl, this.supabaseKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                },
                db: {
                    schema: 'public'
                },
                global: {
                    headers: {
                        'Authorization': `Bearer ${this.supabaseKey}`,
                        'apikey': this.supabaseKey,
                        'Prefer': 'return=representation'
                    }
                }
            });
            await this.testConnection();

            console.log('✅ DatabaseManager inicializado correctamente con Supabase');
            this.isConnected = true;
            return this.supabase;

        } catch (error) {
            console.error('🚨 Error inicializando DatabaseManager:', error.message);
            this.isConnected = false;
            throw error;
        }
    }

    async testConnection() {
        try {
            const { data, error, count } = await this.supabase
                .from(this.getTableName('patients'))
                .select('*', { count: 'exact', head: true });
            
            if (error) {
                const errorMsg = error.message || error.details || error.hint || JSON.stringify(error);
                throw new Error(`Test conexión Supabase: ${errorMsg}`);
            }
            
            console.log('✅ Test de conexión a Supabase exitoso - Pacientes:', count);
            this.isConnected = true;
            return true;
        } catch (error) {
            const errorMsg = error.message || error.details || error.hint || JSON.stringify(error);
            console.error('🚨 Test conexión falló:', errorMsg);
            console.warn('⚠️ No se pudo verificar Supabase, se continuará sin conexión a la base de datos remota:', errorMsg);
            this.isConnected = false;
            return false;
        }
    }

    getStatus() {
        return 'supabase-postgresql';
    }

    /**
     * 🆕 Helper para obtener el nombre de tabla con el sufijo del tenant
     * Si tenantSlug está configurado, agrega el sufijo (_tenantSlug)
     * Si no, devuelve el nombre base (compatibilidad hacia atrás)
     */
    getTableName(baseTableName) {
        if (this.tenantSlug) {
            const tableName = `${baseTableName}_${this.tenantSlug}`;
            console.log(`📋 [Multi-Tenant] Usando tabla: ${tableName} (base: ${baseTableName}, tenant: ${this.tenantSlug})`);
            return tableName;
        }
        // Fallback: sin tenant slug, usar nombre base (para compatibilidad)
        console.log(`📋 [Legacy] Usando tabla base: ${baseTableName} (sin tenant)`);
        return baseTableName;
    }

    createPrismaCompatibleInterface() {
        if (!this.supabase) {
            throw new Error('Cliente Supabase no inicializado');
        }
        // Helper para normalizar campos numéricos en credit_packs
        const normalizePack = (p) => {
            if (!p) return p;
            return {
                ...p,
                unitsRemaining: Number(p.unitsRemaining) || 0,
                unitsTotal: Number(p.unitsTotal) || 0,
                unitMinutes: Number(p.unitMinutes) || 30,
                paid: !!p.paid,
                createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
                updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : null
            };
        };

        // Helper para adjuntar includes comunes a un objeto patient
        // Soporta creditPacks (plural o singular), files y appointments básicos
        const attachIncludesToPatient = async (patientData, options = {}) => {
            // Attach credit packs if requested (support singular/plural)
            try {
                const wantsCreditPacks = options.include && (options.include.creditPacks || options.include.creditPack);
                if (wantsCreditPacks) {
                    const cpInclude = options.include.creditPacks || options.include.creditPack || {};
                    let orderField = 'createdAt';
                    let asc = false;
                    if (cpInclude.orderBy) {
                        const k = Object.keys(cpInclude.orderBy)[0];
                        orderField = k || orderField;
                        asc = cpInclude.orderBy[k] === 'asc';
                    }
                    const { data: packs, error: packsErr } = await this.supabase
                        .from(this.getTableName('credit_packs'))
                        .select('*')
                        .eq('patientId', patientData.id)
                        .order(orderField, { ascending: asc });

                    if (!packsErr) {
                        patientData.creditPacks = (packs || []).map(p => normalizePack(p));
                    } else {
                        console.warn('[DB-SHIM] Error fetching credit_packs for attachIncludesToPatient:', packsErr.message || packsErr);
                        patientData.creditPacks = [];
                    }
                }
            } catch (e) {
                console.warn('[DB-SHIM] attachIncludesToPatient creditPacks error:', e && e.message ? e.message : e);
                patientData.creditPacks = patientData.creditPacks || [];
            }

            // Attach files (basic)
            try {
                if (options.include && options.include.files) {
                    const filesInclude = options.include.files || {};
                    const { data: files, error: filesErr } = await this.supabase
                        .from(this.getTableName('patient_files'))
                        .select('*')
                        .eq('patientId', patientData.id)
                        .order('createdAt', { ascending: false });
                    patientData.files = filesErr ? [] : (files || []);
                }
            } catch (e) {
                console.warn('[DB-SHIM] attachIncludesToPatient files error:', e && e.message ? e.message : e);
                patientData.files = patientData.files || [];
            }

            // Attach appointments (basic, limited)
            try {
                if (options.include && options.include.appointments) {
                    const apInclude = options.include.appointments || {};
                    const limit = apInclude.take || 10;
                    const { data: apps, error: appsErr } = await this.supabase
                        .from(this.getTableName('appointments'))
                        .select('*')
                        .eq('patientId', patientData.id)
                        .order('start', { ascending: false })
                        .limit(limit);
                    patientData.appointments = appsErr ? [] : (apps || []);
                }
            } catch (e) {
                console.warn('[DB-SHIM] attachIncludesToPatient appointments error:', e && e.message ? e.message : e);
                patientData.appointments = patientData.appointments || [];
            }

            // _count: provide basic counts if requested
            try {
                if (options.include && options.include._count) {
                    const counts = {};
                    try {
                        const { data: filesCount } = await this.supabase.from(this.getTableName('patient_files')).select('id', { count: 'exact', head: true }).eq('patientId', patientData.id);
                        counts.files = filesCount || 0;
                    } catch (e) {
                        counts.files = (patientData.files || []).length;
                    }
                    try {
                        const { data: appsCount } = await this.supabase.from(this.getTableName('appointments')).select('id', { count: 'exact', head: true }).eq('patientId', patientData.id);
                        counts.appointments = appsCount || 0;
                    } catch (e) {
                        counts.appointments = (patientData.appointments || []).length;
                    }
                    patientData._count = counts;
                }
            } catch (e) {
                console.warn('[DB-SHIM] attachIncludesToPatient _count error:', e && e.message ? e.message : e);
            }

            return patientData;
        };

        const interface_tables = {
            patients: {
                findMany: async (options = {}) => {
                    try {
                        let query = this.supabase.from(this.getTableName('patients')).select('*');
                        
                        if (options.where) {
                            if (options.where.OR) {
                                const orConditions = options.where.OR;
                                const results = [];
                                const addedIds = new Set();
                                
                                for (const condition of orConditions) {
                                    for (const [field, value] of Object.entries(condition)) {
                                        if (typeof value === 'object' && value.contains) {
                                            const { data } = await this.supabase
                                                .from(this.getTableName('patients'))
                                                .select('*')
                                                .ilike(field, `%${value.contains}%`);
                                            
                                            if (data) {
                                                data.forEach(item => {
                                                    if (!addedIds.has(item.id)) {
                                                        results.push(item);
                                                        addedIds.add(item.id);
                                                    }
                                                });
                                            }
                                        }
                                    }
                                }
                                
                                // Apply the same logic for creditPacks and _count to search results
                                const patients = results;
                                console.log('[DB-SHIM] Search results found:', patients.length, 'patients');
                                
                                // Handle creditPacks for search results
                                try {
                                    const wantsCreditPacks = options && options.include && (options.include.creditPacks || options.include.creditPack);
                                    if (wantsCreditPacks && Array.isArray(patients) && patients.length > 0) {
                                        const ids = patients.map(p => p.id).filter(Boolean);
                                        if (ids.length > 0) {
                                            const cpInclude = options.include.creditPacks || options.include.creditPack || {};
                                            let orderField = 'createdAt';
                                            let asc = false;
                                            if (cpInclude.orderBy) {
                                                const k = Object.keys(cpInclude.orderBy)[0];
                                                orderField = k || orderField;
                                                asc = cpInclude.orderBy[k] === 'asc';
                                            }
                                            const { data: packs, error: packsErr } = await this.supabase
                                                .from(this.getTableName('credit_packs'))
                                                .select('*')
                                                .in('patientId', ids)
                                                .order(orderField, { ascending: asc });

                                            const packsByPatient = (packs || []).reduce((acc, pack) => {
                                                const pid = pack.patientId || pack.patient_id || pack.patientID;
                                                if (!acc[pid]) acc[pid] = [];
                                                acc[pid].push(pack);
                                                return acc;
                                            }, {});

                                            patients.forEach(pt => {
                                                const raw = packsByPatient[pt.id] || [];
                                                pt.creditPacks = raw.map(p => normalizePack(p));
                                            });

                                            console.log(`[DB-SHIM] Search: attached credit_packs for ${patients.length} patients (packs fetched=${(packs||[]).length})`);
                                        }
                                    }
                                } catch (e) {
                                    console.warn('[DB-SHIM] Search: attach credit_packs error:', e && e.message ? e.message : e);
                                    patients.forEach(pt => { if (!pt.creditPacks) pt.creditPacks = []; });
                                }

                                // Handle _count for search results  
                                console.log('[DB-SHIM] Search: Processing _count request...');
                                try {
                                    const wantsCount = options && options.include && options.include._count;
                                    console.log('[DB-SHIM] Search: _count requested:', !!wantsCount, 'for', patients.length, 'patients');
                                    if (wantsCount && Array.isArray(patients) && patients.length > 0) {
                                        const ids = patients.map(p => p.id).filter(Boolean);
                                        console.log('[DB-SHIM] Search: Fetching counts for patient IDs:', ids.slice(0, 3), '...');
                                        if (ids.length > 0) {
                                            // Fetch counts for appointments, files, and creditPacks for all patients
                                            const [appointmentCounts, fileCounts, creditPackCounts] = await Promise.all([
                                                this.supabase.from(this.getTableName('appointments')).select('patientId').in('patientId', ids),
                                                this.supabase.from(this.getTableName('patient_files')).select('patientId').in('patientId', ids),
                                                this.supabase.from(this.getTableName('credit_packs')).select('patientId').in('patientId', ids)
                                            ]);

                                            console.log('[DB-SHIM] Search: Count results:', {
                                                appointments: appointmentCounts.data?.length || 0,
                                                files: fileCounts.data?.length || 0,
                                                creditPacks: creditPackCounts.data?.length || 0
                                            });

                                            // Group counts by patient ID
                                            const appointmentCountsByPatient = {};
                                            const fileCountsByPatient = {};
                                            const creditPackCountsByPatient = {};

                                            (appointmentCounts.data || []).forEach(item => {
                                                const pid = item.patientId;
                                                appointmentCountsByPatient[pid] = (appointmentCountsByPatient[pid] || 0) + 1;
                                            });

                                            (fileCounts.data || []).forEach(item => {
                                                const pid = item.patientId;
                                                fileCountsByPatient[pid] = (fileCountsByPatient[pid] || 0) + 1;
                                            });

                                            (creditPackCounts.data || []).forEach(item => {
                                                const pid = item.patientId;
                                                creditPackCountsByPatient[pid] = (creditPackCountsByPatient[pid] || 0) + 1;
                                            });

                                            // Attach _count to each patient
                                            patients.forEach(patient => {
                                                patient._count = {
                                                    appointments: appointmentCountsByPatient[patient.id] || 0,
                                                    files: fileCountsByPatient[patient.id] || 0,
                                                    creditPacks: creditPackCountsByPatient[patient.id] || 0
                                                };
                                            });
                                            
                                            console.log('[DB-SHIM] Search: Sample patient with _count:', {
                                                id: patients[0]?.id,
                                                name: patients[0]?.firstName,
                                                _count: patients[0]?._count
                                            });
                                        }
                                    }
                                } catch (e) {
                                    console.warn('[DB-SHIM] Search: attach _count error:', e && e.message ? e.message : e);
                                    patients.forEach(pt => { if (!pt._count) pt._count = { appointments: 0, files: 0, creditPacks: 0 }; });
                                }

                                return patients;
                            }
                            
                            for (const [field, value] of Object.entries(options.where)) {
                                if (typeof value === 'object' && value.contains) {
                                    query = query.ilike(field, `%${value.contains}%`);
                                } else {
                                    query = query.eq(field, value);
                                }
                            }
                        }
                        
                        if (options.orderBy) {
                            const orderField = Object.keys(options.orderBy)[0];
                            const orderDirection = options.orderBy[orderField];
                            query = query.order(orderField, { ascending: orderDirection === 'asc' });
                        }
                        
                        if (options.take) {
                            query = query.limit(options.take);
                        }
                        
                        const { data, error } = await query;
                        
                        if (error) {
                            const errorMsg = error.message || error.details || JSON.stringify(error);
                            throw new Error(`Error en findMany: ${errorMsg}`);
                        }

                        const patients = data || [];

                        // If caller requested includes for creditPacks, fetch them in bulk and attach
                        try {
                            const wantsCreditPacks = options && options.include && (options.include.creditPacks || options.include.creditPack);
                            if (wantsCreditPacks && Array.isArray(patients) && patients.length > 0) {
                                const ids = patients.map(p => p.id).filter(Boolean);
                                if (ids.length > 0) {
                                    const cpInclude = options.include.creditPacks || options.include.creditPack || {};
                                    let orderField = 'createdAt';
                                    let asc = false;
                                    if (cpInclude.orderBy) {
                                        const k = Object.keys(cpInclude.orderBy)[0];
                                        orderField = k || orderField;
                                        asc = cpInclude.orderBy[k] === 'asc';
                                    }
                                    const { data: packs, error: packsErr } = await this.supabase
                                        .from(this.getTableName('credit_packs'))
                                        .select('*')
                                        .in('patientId', ids)
                                        .order(orderField, { ascending: asc });

                                    const packsByPatient = (packs || []).reduce((acc, pack) => {
                                        const pid = pack.patientId || pack.patient_id || pack.patientID;
                                        if (!acc[pid]) acc[pid] = [];
                                        acc[pid].push(pack);
                                        return acc;
                                    }, {});

                                    patients.forEach(pt => {
                                        const raw = packsByPatient[pt.id] || [];
                                        pt.creditPacks = raw.map(p => normalizePack(p));
                                    });

                                    console.log(`[DB-SHIM] patients.findMany attached credit_packs for ${patients.length} patients (packs fetched=${(packs||[]).length})`);
                                }
                            }
                        } catch (e) {
                            console.warn('[DB-SHIM] patients.findMany attach credit_packs error:', e && e.message ? e.message : e);
                            patients.forEach(pt => { if (!pt.creditPacks) pt.creditPacks = []; });
                        }

                        // Handle _count if requested
                        console.log('[DB-SHIM] Processing _count request...');
                        try {
                            const wantsCount = options && options.include && options.include._count;
                            console.log('[DB-SHIM] _count requested:', !!wantsCount, 'for', patients.length, 'patients');
                            if (wantsCount && Array.isArray(patients) && patients.length > 0) {
                                const ids = patients.map(p => p.id).filter(Boolean);
                                console.log('[DB-SHIM] Fetching counts for patient IDs:', ids.slice(0, 3), '...');
                                if (ids.length > 0) {
                                    // Fetch counts for appointments, files, and creditPacks for all patients
                                    const [appointmentCounts, fileCounts, creditPackCounts] = await Promise.all([
                                        this.supabase.from(this.getTableName('appointments')).select('patientId').in('patientId', ids),
                                        this.supabase.from(this.getTableName('patient_files')).select('patientId').in('patientId', ids),
                                        this.supabase.from(this.getTableName('credit_packs')).select('patientId').in('patientId', ids)
                                    ]);

                                    console.log('[DB-SHIM] Count results:', {
                                        appointments: appointmentCounts.data?.length || 0,
                                        files: fileCounts.data?.length || 0,
                                        creditPacks: creditPackCounts.data?.length || 0
                                    });

                                    // Group counts by patient ID
                                    const appointmentCountsByPatient = {};
                                    const fileCountsByPatient = {};
                                    const creditPackCountsByPatient = {};

                                    (appointmentCounts.data || []).forEach(item => {
                                        const pid = item.patientId;
                                        appointmentCountsByPatient[pid] = (appointmentCountsByPatient[pid] || 0) + 1;
                                    });

                                    (fileCounts.data || []).forEach(item => {
                                        const pid = item.patientId;
                                        fileCountsByPatient[pid] = (fileCountsByPatient[pid] || 0) + 1;
                                    });

                                    (creditPackCounts.data || []).forEach(item => {
                                        const pid = item.patientId;
                                        creditPackCountsByPatient[pid] = (creditPackCountsByPatient[pid] || 0) + 1;
                                    });

                                    // Attach _count to each patient
                                    patients.forEach(patient => {
                                        patient._count = {
                                            appointments: appointmentCountsByPatient[patient.id] || 0,
                                            files: fileCountsByPatient[patient.id] || 0,
                                            creditPacks: creditPackCountsByPatient[patient.id] || 0
                                        };
                                    });
                                    
                                    console.log('[DB-SHIM] Sample patient with _count:', {
                                        id: patients[0]?.id,
                                        name: patients[0]?.firstName,
                                        _count: patients[0]?._count
                                    });
                                }
                            }
                        } catch (e) {
                            console.warn('[DB-SHIM] patients.findMany attach _count error:', e && e.message ? e.message : e);
                            patients.forEach(pt => { if (!pt._count) pt._count = { appointments: 0, files: 0, creditPacks: 0 }; });
                        }

                        return patients;
                    } catch (error) {
                        console.error('❌ Error en patient.findMany:', error);
                        throw error;
                    }
                },

                count: async (options = {}) => {
                    try {
                        let query = this.supabase.from(this.getTableName('patients')).select('*', { count: 'exact', head: true });
                        
                        if (options.where) {
                            // Manejar búsquedas complejas como las de OR
                            if (options.where.OR) {
                                // Para OR complicados, usar findMany y contar los resultados
                                const results = await this.supabase.from(this.getTableName('patients')).select('id');
                                
                                const orConditions = options.where.OR;
                                const matchingIds = new Set();
                                
                                for (const condition of orConditions) {
                                    for (const [field, value] of Object.entries(condition)) {
                                        if (typeof value === 'object' && value.contains) {
                                            const { data } = await this.supabase
                                                .from(this.getTableName('patients'))
                                                .select('id')
                                                .ilike(field, `%${value.contains}%`);
                                            
                                            if (data) {
                                                data.forEach(item => matchingIds.add(item.id));
                                            }
                                        }
                                    }
                                }
                                return matchingIds.size;
                            }
                            
                            // Para filtros simples
                            for (const [field, value] of Object.entries(options.where)) {
                                if (typeof value === 'object' && value.contains) {
                                    query = query.ilike(field, `%${value.contains}%`);
                                } else {
                                    query = query.eq(field, value);
                                }
                            }
                        }
                        
                        const { count, error } = await query;
                        
                        if (error) {
                            console.log('⚠️ Error en count, intentando fallback:', error.message);
                            // Fallback: hacer un findMany y contar manualmente
                            const { data: fallbackData } = await this.supabase.from(this.getTableName('patients')).select('id');
                            return fallbackData ? fallbackData.length : 0;
                        }
                        
                        return count || 0;
                    } catch (error) {
                        console.error('❌ Error en patients.count:', error);
                        // Fallback final: devolver 0
                        return 0;
                    }
                },

                create: async (options) => {
                    try {
                        console.log('🔧 Datos limpiados para insertar:', options.data);
                        
                        const cleanData = {};
                        for (const [key, value] of Object.entries(options.data)) {
                            if (value !== undefined && value !== null) {
                                cleanData[key] = value;
                            }
                        }
                        // Si la tabla espera un id y no se ha proporcionado, generar uno aquí
                        if (!cleanData.id || cleanData.id === '') {
                            const generated = uuidv4();
                            console.log('🔑 Generando id para registro (falta/ vacío):', generated);
                            cleanData.id = generated;
                        }
                        // Loguear de forma explícita el id y tipo antes del insert para depuración
                        console.log('🔍 Insertando cleanData.id:', cleanData.id, 'typeof:', typeof cleanData.id);
                        // Asegurar campos de marca temporal si la tabla los requiere
                        const nowIso = (new Date()).toISOString();
                        if (!cleanData.createdAt) {
                            cleanData.createdAt = nowIso;
                            console.log('🕒 Añadiendo createdAt por defecto:', cleanData.createdAt);
                        }
                        if (!cleanData.updatedAt) {
                            cleanData.updatedAt = nowIso;
                            console.log('🕒 Añadiendo updatedAt por defecto:', cleanData.updatedAt);
                        }
                        console.log('🔍 Insertando cleanData (preview):', Object.assign({}, cleanData));
                        
                        const { data, error } = await this.supabase
                            .from(this.getTableName('patients'))
                            .insert([cleanData])
                            .select()
                            .single();
                        
                        if (error) {
                            console.error('❗ Supabase insert error object:', error);
                            const errorMsg = error.message || error.details || JSON.stringify(error);
                            throw new Error(`Error en create: ${errorMsg}`);
                        }
                        
                        return data;
                    } catch (error) {
                        console.error('❌ Error en patient.create:', error);
                        throw error;
                    }
                },

                findUnique: async (options) => {
                    try {
                        const { data, error } = await this.supabase
                                .from(this.getTableName('patients'))
                                .select('*')
                                .eq('id', options.where.id);

                        // Delegate include attachment to helper (keeps this function small and testable)
                        if (data && options && options.include) {
                            try {
                                await attachIncludesToPatient.call(this, data, options);
                            } catch (e) {
                                console.warn('[DB-SHIM] attachIncludesToPatient failed:', e && e.message ? e.message : e);
                            }
                        }

                        if (error && error.code !== 'PGRST116') {
                            const errorMsg = error.message || error.details || JSON.stringify(error);
                            throw new Error(`Error en findUnique: ${errorMsg}`);
                        }
                            return data ? data[0] : null;
                    } catch (error) {
                        const errorMsg = error.message || error.details || JSON.stringify(error);
                        console.error('❌ Error en patient.findUnique:', errorMsg);
                        throw new Error(`Error en findUnique: ${errorMsg}`);
                    }
                },

                update: async (options) => {
                    try {
                        const { data, error } = await this.supabase
                                .from(this.getTableName('patients'))
                                .update(options.data)
                                .eq('id', options.where.id)
                                .select();
                        
                        if (error) {
                            const errorMsg = error.message || error.details || JSON.stringify(error);
                            throw new Error(`Error en update: ${errorMsg}`);
                        }
                            return data ? data[0] : null;
                    } catch (error) {
                        const errorMsg = error.message || error.details || JSON.stringify(error);
                        console.error('❌ Error en patient.update:', errorMsg);
                        throw new Error(`Error en update: ${errorMsg}`);
                    }
                },

                delete: async (options) => {
                    try {
                        const { data, error } = await this.supabase
                            .from(this.getTableName('patients'))
                            .delete()
                            .eq('id', options.where.id)
                            .select();
                        
                        if (error) {
                            const errorMsg = error.message || error.details || JSON.stringify(error);
                            throw new Error(`Error en delete: ${errorMsg}`);
                        }
                        return data ? data[0] : null;
                    } catch (error) {
                        const errorMsg = error.message || error.details || JSON.stringify(error);
                        console.error('❌ Error en patient.delete:', errorMsg);
                        throw new Error(`Error en delete: ${errorMsg}`);
                    }
                },

                deleteMany: async (options = {}) => {
                    try {
                        let query = this.supabase.from(this.getTableName('patients')).delete();
                        
                        if (options.where) {
                            for (const [field, value] of Object.entries(options.where)) {
                                query = query.eq(field, value);
                            }
                        }
                        
                        const { count, error } = await query;
                        
                        if (error) {
                            const errorMsg = error.message || error.details || JSON.stringify(error);
                            throw new Error(`Error en deleteMany: ${errorMsg}`);
                        }
                        return { count: count || 0 };
                    } catch (error) {
                        const errorMsg = error.message || error.details || JSON.stringify(error);
                        console.error('❌ Error en patient.deleteMany:', errorMsg);
                        throw new Error(`Error en deleteMany: ${errorMsg}`);
                    }
                }
            },

            // Tabla appointments
            appointments: {
                findFirst: async (options = {}) => {
                    try {
                        // Si vienen condiciones OR, iteramos cada sub-condición y devolvemos el primer match
                        if (options.where && options.where.OR && Array.isArray(options.where.OR)) {
                            for (const cond of options.where.OR) {
                                let q = this.supabase.from(this.getTableName('appointments')).select('*');
                                for (const [k, v] of Object.entries(cond)) {
                                    if (v && typeof v === 'object') {
                                        if (v.gte !== undefined) q = q.gte(k, v.gte instanceof Date ? v.gte.toISOString() : v.gte);
                                        else if (v.lte !== undefined) q = q.lte(k, v.lte instanceof Date ? v.lte.toISOString() : v.lte);
                                        else if (v.gt !== undefined) q = q.gt(k, v.gt instanceof Date ? v.gt.toISOString() : v.gt);
                                        else if (v.lt !== undefined) q = q.lt(k, v.lt instanceof Date ? v.lt.toISOString() : v.lt);
                                        else if (v.in) q = q.in(k, Array.isArray(v.in) ? v.in.map(x => x instanceof Date ? x.toISOString() : x) : v.in);
                                        else if (v.contains) q = q.ilike(k, `%${v.contains}%`);
                                        else if (v.not !== undefined) q = q.neq(k, v.not);
                                        else q = q.eq(k, v);
                                    } else {
                                        q = q.eq(k, v instanceof Date ? v.toISOString() : v);
                                    }
                                }
                                const { data, error } = await q.limit(1);
                                if (error) continue;
                                if (data && data.length > 0) return data[0];
                            }
                            return null;
                        }

                        let query = this.supabase.from(this.getTableName('appointments')).select('*');
                        if (options.where) {
                            for (const [key, value] of Object.entries(options.where)) {
                                if (value && typeof value === 'object') {
                                    if (value.gte !== undefined) query = query.gte(key, value.gte instanceof Date ? value.gte.toISOString() : value.gte);
                                    else if (value.lte !== undefined) query = query.lte(key, value.lte instanceof Date ? value.lte.toISOString() : value.lte);
                                    else if (value.gt !== undefined) query = query.gt(key, value.gt instanceof Date ? value.gt.toISOString() : value.gt);
                                    else if (value.lt !== undefined) query = query.lt(key, value.lt instanceof Date ? value.lt.toISOString() : value.lt);
                                    else if (value.in) query = query.in(key, Array.isArray(value.in) ? value.in.map(x => x instanceof Date ? x.toISOString() : x) : value.in);
                                    else if (value.contains) query = query.ilike(key, `%${value.contains}%`);
                                    else if (value.not !== undefined) query = query.neq(key, value.not);
                                    else query = query.eq(key, value);
                                } else {
                                    query = query.eq(key, value instanceof Date ? value.toISOString() : value);
                                }
                            }
                        }

                        const { data, error } = await query.limit(1);
                        if (error) {
                            const errorMsg = error.message || error.details || JSON.stringify(error);
                            throw new Error(`Error en findFirst: ${errorMsg}`);
                        }
                        return data && data.length > 0 ? data[0] : null;
                    } catch (error) {
                        console.error('❌ Error en appointment.findFirst:', error);
                        throw error;
                    }
                },
                findMany: async (options = {}) => {
                    try {
                        let query = this.supabase.from(this.getTableName('appointments')).select('*');

                        // Helper to normalize Date objects to ISO strings accepted by Postgres
                        const normalize = (v) => {
                            if (v instanceof Date) return v.toISOString();
                            if (Array.isArray(v)) return v.map(item => item instanceof Date ? item.toISOString() : item);
                            return v;
                        };

                        if (options.where) {
                            Object.entries(options.where).forEach(([key, value]) => {
                                // Range filters for start/end (Prisma-like API passes Date objects)
                                if (key === 'start' && value && value.gte !== undefined) {
                                    query = query.gte('start', normalize(value.gte));
                                    return;
                                }
                                if (key === 'end' && value && value.lte !== undefined) {
                                    query = query.lte('end', normalize(value.lte));
                                    return;
                                }

                                // Contains/ilike
                                if (typeof value === 'object' && value !== null && value.contains) {
                                    query = query.ilike(key, `%${value.contains}%`);
                                    return;
                                }

                                // IN filters
                                if (typeof value === 'object' && value !== null && value.in) {
                                    query = query.in(key, normalize(value.in));
                                    return;
                                }

                                // Simple equality
                                if (!(typeof value === 'object')) {
                                    query = query.eq(key, normalize(value));
                                }
                            });
                        }
                        
                        if (options.include) {
                            // Para includes, necesitamos hacer queries separadas
                            // Por ahora, solo devolvemos los datos básicos
                        }
                        
                        if (options.orderBy) {
                            const orderField = Object.keys(options.orderBy)[0];
                            const orderDir = options.orderBy[orderField];
                            query = query.order(orderField, { ascending: orderDir === 'asc' });
                        }
                        
                        const { data, error } = await query;
                        if (error) {
                            const errorMsg = error.message || error.details || JSON.stringify(error);
                            throw new Error(`Error en findMany: ${errorMsg}`);
                        }

                        const rows = data || [];

                        // Support include.patient and include.creditRedemptions by fetching related rows in bulk
                        if (options.include) {
                            // Attach patient objects if requested
                            if (options.include.patient) {
                                try {
                                    const pids = Array.from(new Set(rows.map(r => r.patientId).filter(Boolean)));
                                    if (pids.length > 0) {
                                        const { data: patients, error: pErr } = await this.supabase
                                            .from(this.getTableName('patients'))
                                            .select('*')
                                            .in('id', pids);
                                        const patientsById = (patients || []).reduce((acc, p) => { acc[p.id] = p; return acc; }, {});
                                        rows.forEach(r => { r.patient = patientsById[r.patientId] || null; });
                                    } else {
                                        rows.forEach(r => { r.patient = null; });
                                    }
                                } catch (e) {
                                    console.warn('[DB-SHIM] appointments.findMany attach patient error:', e && e.message ? e.message : e);
                                    rows.forEach(r => { if (r.patient === undefined) r.patient = null; });
                                }
                            }

                            // Attach creditRedemptions (and nested creditPack) if requested
                            if (options.include.creditRedemptions) {
                                try {
                                    const apIds = Array.from(new Set(rows.map(r => r.id).filter(Boolean)));
                                    if (apIds.length > 0) {
                                        const { data: reds, error: redsErr } = await this.supabase
                                            .from(this.getTableName('credit_redemptions'))
                                            .select('*')
                                            .in('appointmentId', apIds);

                                        if (!redsErr && reds && reds.length > 0) {
                                            // Fetch packs in bulk for attached creditPack objects
                                            const packIds = Array.from(new Set(reds.map(rr => rr.creditPackId || rr.credit_pack_id || rr.credit_packid || rr.creditPack_id).filter(Boolean)));
                                            let packs = [];
                                            if (packIds.length > 0) {
                                                const { data: packsData } = await this.supabase
                                                    .from(this.getTableName('credit_packs'))
                                                    .select('*')
                                                    .in('id', packIds);
                                                packs = packsData || [];
                                            }
                                            const packsById = (packs || []).reduce((acc, p) => { acc[p.id] = normalizePack(p); return acc; }, {});

                                            const redsByAp = {};
                                            (reds || []).forEach(rr => {
                                                const fk = rr.creditPackId || rr.credit_pack_id || rr.credit_packid || rr.creditPack_id || rr.creditpackid || rr.creditPackId;
                                                rr.creditPack = fk ? (packsById[fk] || null) : null;
                                                if (!redsByAp[rr.appointmentId]) redsByAp[rr.appointmentId] = [];
                                                redsByAp[rr.appointmentId].push(rr);
                                            });

                                            rows.forEach(r => {
                                                r.creditRedemptions = redsByAp[r.id] || [];
                                            });
                                        } else {
                                            rows.forEach(r => { r.creditRedemptions = []; });
                                        }
                                    } else {
                                        rows.forEach(r => { r.creditRedemptions = []; });
                                    }
                                } catch (e) {
                                    console.warn('[DB-SHIM] appointments.findMany attach creditRedemptions error:', e && e.message ? e.message : e);
                                    rows.forEach(r => { if (r.creditRedemptions === undefined) r.creditRedemptions = []; });
                                }
                            }
                        }

                        // Return enriched rows
                        return rows;
                    } catch (error) {
                        const errorMsg = error.message || error.details || JSON.stringify(error);
                        console.error('❌ Error en appointment.findMany:', errorMsg);
                        throw new Error(`Error en findMany: ${errorMsg}`);
                    }
                },

                findUnique: async (options) => {
                    try {
                        const { data, error } = await this.supabase
                            .from(this.getTableName('appointments'))
                            .select('*')
                            .eq('id', options.where.id);

                        if (error && error.code !== 'PGRST116') {
                            const errorMsg = error.message || error.details || JSON.stringify(error);
                            throw new Error(`Error en findUnique: ${errorMsg}`);
                        }
                        return data && data.length > 0 ? data[0] : null;
                    } catch (error) {
                        const errorMsg = error.message || error.details || JSON.stringify(error);
                        console.error('❌ Error en appointment.findUnique:', errorMsg);
                        throw new Error(`Error en findUnique: ${errorMsg}`);
                    }
                },

                create: async (options) => {
                    try {
                        const { data, error } = await this.supabase
                            .from(this.getTableName('appointments'))
                            .insert(options.data)
                            .select();

                        if (error) {
                            const errorMsg = error.message || error.details || JSON.stringify(error);
                            throw new Error(`Error en create: ${errorMsg}`);
                        }
                        return data ? data[0] : null;
                    } catch (error) {
                        const errorMsg = error.message || error.details || JSON.stringify(error);
                        console.error('❌ Error en appointment.create:', errorMsg);
                        throw new Error(`Error en create: ${errorMsg}`);
                    }
                },

                update: async (options) => {
                    try {
                        const { data, error } = await this.supabase
                            .from(this.getTableName('appointments'))
                            .update(options.data)
                            .eq('id', options.where.id)
                            .select();
                        
                        if (error) {
                            const errorMsg = error.message || error.details || JSON.stringify(error);
                            throw new Error(`Error en update: ${errorMsg}`);
                        }
                        return data ? data[0] : null;
                    } catch (error) {
                        const errorMsg = error.message || error.details || JSON.stringify(error);
                        console.error('❌ Error en appointment.update:', errorMsg);
                        throw new Error(`Error en update: ${errorMsg}`);
                    }
                },

                delete: async (options) => {
                    try {
                        const { data, error } = await this.supabase
                            .from(this.getTableName('appointments'))
                            .delete()
                            .eq('id', options.where.id)
                            .select();

                        if (error) {
                            const errorMsg = error.message || error.details || JSON.stringify(error);
                            throw new Error(`Error en delete: ${errorMsg}`);
                        }
                        return data ? data[0] : null;
                    } catch (error) {
                        const errorMsg = error.message || error.details || JSON.stringify(error);
                        console.error('❌ Error en appointment.delete:', errorMsg);
                        throw new Error(`Error en delete: ${errorMsg}`);
                    }
                }
                ,
                deleteMany: async (options = {}) => {
                    try {
                        let query = this.supabase.from(this.getTableName('appointments')).delete();

                        if (options.where) {
                            Object.entries(options.where).forEach(([key, value]) => {
                                if (typeof value === 'object' && value.in) {
                                    query = query.in(key, value.in);
                                } else {
                                    query = query.eq(key, value);
                                }
                            });
                        }

                        const { data, error } = await query.select();
                        if (error) {
                            const errorMsg = error.message || error.details || JSON.stringify(error);
                            throw new Error(`Error en deleteMany: ${errorMsg}`);
                        }
                        return { count: data?.length || 0 };
                    } catch (error) {
                        const errorMsg = error.message || error.details || JSON.stringify(error);
                        console.error('❌ Error en appointment.deleteMany:', errorMsg);
                        throw new Error(`Error en deleteMany: ${errorMsg}`);
                    }
                }
            },

            // Tabla credit_packs (creditPack en Prisma)
            credit_packs: {
                findFirst: async (options = {}) => {
                    try {
                        let query = this.supabase.from(this.getTableName('credit_packs')).select('*');
                        if (options.where) {
                            for (const [key, value] of Object.entries(options.where)) {
                                if (value && typeof value === 'object') {
                                    if (value.gte !== undefined) query = query.gte(key, value.gte);
                                    else if (value.lte !== undefined) query = query.lte(key, value.lte);
                                    else if (value.gt !== undefined) query = query.gt(key, value.gt);
                                    else if (value.lt !== undefined) query = query.lt(key, value.lt);
                                    else if (value.in) query = query.in(key, value.in);
                                    else query = query.eq(key, value);
                                } else {
                                    query = query.eq(key, value);
                                }
                            }
                        }
                        const { data, error } = await query.limit(1);
                        if (error) {
                            const errorMsg = error.message || error.details || JSON.stringify(error);
                            throw new Error(`Error en findFirst: ${errorMsg}`);
                        }
                        return data && data.length > 0 ? data[0] : null;
                    } catch (error) {
                        console.error('❌ Error en credit_packs.findFirst:', error);
                        throw error;
                    }
                },
                findMany: async (options = {}) => {
                    try {
                        let query = this.supabase.from(this.getTableName('credit_packs')).select('*');

                        if (options.where) {
                            for (const [key, value] of Object.entries(options.where)) {
                                if (value && typeof value === 'object') {
                                    if (value.gt !== undefined) query = query.gt(key, value.gt);
                                    else if (value.gte !== undefined) query = query.gte(key, value.gte);
                                    else if (value.lt !== undefined) query = query.lt(key, value.lt);
                                    else if (value.lte !== undefined) query = query.lte(key, value.lte);
                                    else if (value.in) query = query.in(key, value.in);
                                    else if (value.contains) query = query.ilike(key, `%${value.contains}%`);
                                    else if (value.not !== undefined) query = query.neq(key, value.not);
                                    else query = query.eq(key, value);
                                } else {
                                    query = query.eq(key, value);
                                }
                            }
                        }

                        if (options.orderBy) {
                            const orderField = Object.keys(options.orderBy)[0];
                            const orderDir = options.orderBy[orderField];
                            query = query.order(orderField, { ascending: orderDir === 'asc' });
                        }

                        const { data, error } = await query;
                        if (error) {
                            const errorMsg = error.message || error.details || JSON.stringify(error);
                            throw new Error(`Error en findMany: ${errorMsg}`);
                        }
                        return data || [];
                    } catch (error) {
                        const errorMsg = error.message || error.details || JSON.stringify(error);
                        console.error('❌ Error en creditPack.findMany:', errorMsg);
                        throw new Error(`Error en findMany: ${errorMsg}`);
                    }
                },

                create: async (options) => {
                    try {
                        const { data, error } = await this.supabase
                            .from(this.getTableName('credit_packs'))
                            .insert(options.data)
                            .select();

                        if (error) {
                            const errorMsg = error.message || error.details || JSON.stringify(error);
                            throw new Error(`Error en create: ${errorMsg}`);
                        }
                        return normalizePack(data ? data[0] : null);
                    } catch (error) {
                        const errorMsg = error.message || error.details || JSON.stringify(error);
                        console.error('❌ Error en creditPack.create:', errorMsg);
                        throw new Error(`Error en create: ${errorMsg}`);
                    }
                },

                update: async (options) => {
                    try {
                        const { data, error } = await this.supabase
                            .from(this.getTableName('credit_packs'))
                            .update(options.data)
                            .eq('id', options.where.id)
                            .select();

                        if (error) {
                            const errorMsg = error.message || error.details || JSON.stringify(error);
                            throw new Error(`Error en update: ${errorMsg}`);
                        }
                        return normalizePack(data ? data[0] : null);
                    } catch (error) {
                        const errorMsg = error.message || error.details || JSON.stringify(error);
                        console.error('❌ Error en creditPack.update:', errorMsg);
                        throw new Error(`Error en update: ${errorMsg}`);
                    }
                },

                findUnique: async (options) => {
                    try {
                        const { data, error } = await this.supabase
                            .from(this.getTableName('credit_packs'))
                            .select('*')
                            .eq('id', options.where.id);

                        if (error && error.code !== 'PGRST116') {
                            const errorMsg = error.message || error.details || JSON.stringify(error);
                            throw new Error(`Error en findUnique: ${errorMsg}`);
                        }
                        return normalizePack(data ? data[0] : null);
                    } catch (error) {
                        const errorMsg = error.message || error.details || JSON.stringify(error);
                        console.error('❌ Error en creditPack.findUnique:', errorMsg);
                        throw new Error(`Error en findUnique: ${errorMsg}`);
                    }
                },

                delete: async (options) => {
                    try {
                        const { data, error } = await this.supabase
                            .from(this.getTableName('credit_packs'))
                            .delete()
                            .eq('id', options.where.id)
                            .select();

                        if (error) {
                            const errorMsg = error.message || error.details || JSON.stringify(error);
                            throw new Error(`Error en delete: ${errorMsg}`);
                        }
                        return data ? data[0] : null;
                    } catch (error) {
                        const errorMsg = error.message || error.details || JSON.stringify(error);
                        console.error('❌ Error en creditPack.delete:', errorMsg);
                        throw new Error(`Error en delete: ${errorMsg}`);
                    }
                }
                ,
                deleteMany: async (options = {}) => {
                    try {
                        let query = this.supabase.from(this.getTableName('credit_packs')).delete();

                        if (options.where) {
                            Object.entries(options.where).forEach(([key, value]) => {
                                if (typeof value === 'object' && value.in) {
                                    query = query.in(key, value.in);
                                } else {
                                    query = query.eq(key, value);
                                }
                            });
                        }

                        const { data, error } = await query.select();
                        if (error) {
                            const errorMsg = error.message || error.details || JSON.stringify(error);
                            throw new Error(`Error en deleteMany: ${errorMsg}`);
                        }
                        return { count: data?.length || 0, items: (data || []).map(normalizePack) };
                    } catch (error) {
                        const errorMsg = error.message || error.details || JSON.stringify(error);
                        console.error('❌ Error en creditPack.deleteMany:', errorMsg);
                        throw new Error(`Error en deleteMany: ${errorMsg}`);
                    }
                },

                count: async (options = {}) => {
                    try {
                        let query = this.supabase
                            .from(this.getTableName('credit_packs'))
                            .select('id', { count: 'exact', head: true });

                        if (options.where) {
                            for (const [key, value] of Object.entries(options.where)) {
                                if (value && typeof value === 'object') {
                                    if (value.gt !== undefined) query = query.gt(key, value.gt);
                                    else if (value.gte !== undefined) query = query.gte(key, value.gte);
                                    else if (value.lt !== undefined) query = query.lt(key, value.lt);
                                    else if (value.lte !== undefined) query = query.lte(key, value.lte);
                                    else if (value.in) query = query.in(key, value.in);
                                    else if (value.not !== undefined) query = query.neq(key, value.not);
                                    else query = query.eq(key, value);
                                } else {
                                    query = query.eq(key, value);
                                }
                            }
                        }

                        const { count, error } = await query;

                        if (error) {
                            console.log(' Error en credit_packs.count, intentando fallback:', error.message);
                            const { data: fallbackData } = await this.supabase
                                .from(this.getTableName('credit_packs'))
                                .select('id');
                            return fallbackData ? fallbackData.length : 0;
                        }

                        return count || 0;
                    } catch (error) {
                        console.error(' Error en credit_packs.count:', error);
                        return 0;
                    }
                },

                count: async (options = {}) => {
                    try {
                        let query = this.supabase
                            .from(this.getTableName('credit_packs'))
                            .select('id', { count: 'exact', head: true });

                        if (options.where) {
                            for (const [key, value] of Object.entries(options.where)) {
                                if (value && typeof value === 'object') {
                                    if (value.gt !== undefined) query = query.gt(key, value.gt);
                                    else if (value.gte !== undefined) query = query.gte(key, value.gte);
                                    else if (value.lt !== undefined) query = query.lt(key, value.lt);
                                    else if (value.lte !== undefined) query = query.lte(key, value.lte);
                                    else if (value.in) query = query.in(key, value.in);
                                    else if (value.not !== undefined) query = query.neq(key, value.not);
                                    else query = query.eq(key, value);
                                } else {
                                    query = query.eq(key, value);
                                }
                            }
                        }

                        const { count, error } = await query;

                        if (error) {
                            console.log('Warning: Error en credit_packs.count, intentando fallback:', error.message);
                            const { data: fallbackData } = await this.supabase
                                .from(this.getTableName('credit_packs'))
                                .select('id');
                            return fallbackData ? fallbackData.length : 0;
                        }

                        return count || 0;
                    } catch (error) {
                        console.error('Error en credit_packs.count:', error);
                        return 0;
                    }
                },

                count: async (options = {}) => {
                    try {
                        let query = this.supabase
                            .from(this.getTableName('credit_packs'))
                            .select('id', { count: 'exact', head: true });

                        if (options.where) {
                            for (const [key, value] of Object.entries(options.where)) {
                                if (value && typeof value === 'object') {
                                    if (value.gt !== undefined) query = query.gt(key, value.gt);
                                    else if (value.gte !== undefined) query = query.gte(key, value.gte);
                                    else if (value.lt !== undefined) query = query.lt(key, value.lt);
                                    else if (value.lte !== undefined) query = query.lte(key, value.lte);
                                    else if (value.in) query = query.in(key, value.in);
                                    else if (value.not !== undefined) query = query.neq(key, value.not);
                                    else query = query.eq(key, value);
                                } else {
                                    query = query.eq(key, value);
                                }
                            }
                        }

                        const { count, error } = await query;

                        if (error) {
                            console.log('Warning: Error en credit_packs.count:', error.message);
                            const { data: fallbackData } = await this.supabase
                                .from(this.getTableName('credit_packs'))
                                .select('id');
                            return fallbackData ? fallbackData.length : 0;
                        }

                        return count || 0;
                    } catch (error) {
                        console.error('Error en credit_packs.count:', error);
                        return 0;
                    }
                }
            },

            // Tabla credit_redemptions (creditRedemption en Prisma)
            credit_redemptions: {
                findFirst: async (options = {}) => {
                    try {
                        let query = this.supabase.from(this.getTableName('credit_redemptions')).select('*');
                        if (options.where) {
                            for (const [key, value] of Object.entries(options.where)) {
                                if (value && typeof value === 'object') {
                                    if (value.gte !== undefined) query = query.gte(key, value.gte);
                                    else if (value.lte !== undefined) query = query.lte(key, value.lte);
                                    else if (value.in) query = query.in(key, value.in);
                                    else query = query.eq(key, value);
                                } else {
                                    query = query.eq(key, value);
                                }
                            }
                        }
                        const { data, error } = await query.limit(1);
                        if (error) {
                            const errorMsg = error.message || error.details || JSON.stringify(error);
                            throw new Error(`Error en findFirst: ${errorMsg}`);
                        }
                        const row = data && data.length > 0 ? data[0] : null;
                        // Support include.creditPack: attach the referenced pack object
                        if (row && options && options.include && options.include.creditPack) {
                            try {
                                // Accept multiple possible FK column names returned by Supabase
                                const fk = row.creditPackId || row.credit_pack_id || row.credit_packid || row.creditPack_id || row.creditpackid || row.creditPackId;
                                if (fk) {
                                    const { data: pack, error: packErr } = await this.supabase
                                        .from(this.getTableName('credit_packs'))
                                        .select('*')
                                        .eq('id', fk)
                                        .single();
                                    row.creditPack = packErr ? null : normalizePack(pack);
                                } else {
                                    row.creditPack = null;
                                }
                            } catch (e) {
                                console.warn('[DB-SHIM] credit_redemptions.findFirst attach creditPack error:', e && e.message ? e.message : e);
                                row.creditPack = null;
                            }
                        }
                        return row;
                    } catch (error) {
                        console.error('❌ Error en credit_redemptions.findFirst:', error);
                        throw error;
                    }
                },
                findMany: async (options = {}) => {
                    try {
                        let query = this.supabase.from(this.getTableName('credit_redemptions')).select('*');

                        if (options.where) {
                            for (const [key, value] of Object.entries(options.where)) {
                                if (value && typeof value === 'object') {
                                    if (value.gt !== undefined) query = query.gt(key, value.gt);
                                    else if (value.gte !== undefined) query = query.gte(key, value.gte);
                                    else if (value.lt !== undefined) query = query.lt(key, value.lt);
                                    else if (value.lte !== undefined) query = query.lte(key, value.lte);
                                    else if (value.in) query = query.in(key, value.in);
                                    else if (value.contains) query = query.ilike(key, `%${value.contains}%`);
                                    else if (value.not !== undefined) query = query.neq(key, value.not);
                                    else query = query.eq(key, value);
                                } else {
                                    query = query.eq(key, value);
                                }
                            }
                        }

                        const { data, error } = await query;
                        if (error) {
                            const errorMsg = error.message || error.details || JSON.stringify(error);
                            throw new Error(`Error en findMany: ${errorMsg}`);
                        }
                        const rows = data || [];

                        // Support include.creditPack: fetch packs in bulk and attach
                        if (rows.length > 0 && options && options.include && options.include.creditPack) {
                            try {
                                const ids = Array.from(new Set(rows.map(r => r.creditPackId || r.credit_pack_id || r.credit_packid || r.creditPack_id || r.creditpackid || r.creditPackId).filter(Boolean)));
                                if (ids.length > 0) {
                                    const { data: packs, error: packsErr } = await this.supabase
                                        .from(this.getTableName('credit_packs'))
                                        .select('*')
                                        .in('id', ids);

                                    const packsById = (packs || []).reduce((acc, p) => { acc[p.id] = normalizePack(p); return acc; }, {});
                                    rows.forEach(r => {
                                        const fk = r.creditPackId || r.credit_pack_id || r.credit_packid || r.creditPack_id || r.creditpackid || r.creditPackId;
                                        r.creditPack = fk ? (packsById[fk] || null) : null;
                                    });
                                } else {
                                    rows.forEach(r => { r.creditPack = null; });
                                }
                            } catch (e) {
                                console.warn('[DB-SHIM] credit_redemptions.findMany attach creditPack error:', e && e.message ? e.message : e);
                                rows.forEach(r => { if (r.creditPack === undefined) r.creditPack = null; });
                            }
                        }

                        return rows;
                    } catch (error) {
                        const errorMsg = error.message || error.details || JSON.stringify(error);
                        console.error('❌ Error en creditRedemption.findMany:', errorMsg);
                        throw new Error(`Error en findMany: ${errorMsg}`);
                    }
                },

                create: async (options) => {
                    try {
                        const { data, error } = await this.supabase
                            .from(this.getTableName('credit_redemptions'))
                            .insert(options.data)
                            .select();

                        if (error) {
                            const errorMsg = error.message || error.details || JSON.stringify(error);
                            throw new Error(`Error en create: ${errorMsg}`);
                        }
                        return data ? data[0] : null;
                    } catch (error) {
                        const errorMsg = error.message || error.details || JSON.stringify(error);
                        console.error('❌ Error en creditRedemption.create:', errorMsg);
                        throw new Error(`Error en create: ${errorMsg}`);
                    }
                },

                deleteMany: async (options) => {
                    try {
                        let query = this.supabase.from(this.getTableName('credit_redemptions')).delete();
                        
                        if (options.where) {
                            Object.entries(options.where).forEach(([key, value]) => {
                                query = query.eq(key, value);
                            });
                        }
                        
                        const { data, error } = await query.select();
                        
                        if (error) {
                            const errorMsg = error.message || error.details || JSON.stringify(error);
                            throw new Error(`Error en deleteMany: ${errorMsg}`);
                        }
                        return { count: data?.length || 0 };
                    } catch (error) {
                        const errorMsg = error.message || error.details || JSON.stringify(error);
                        console.error('❌ Error en creditRedemption.deleteMany:', errorMsg);
                        throw new Error(`Error en deleteMany: ${errorMsg}`);
                    }
                },

                count: async (options = {}) => {
                    try {
                        let query = this.supabase.from(this.getTableName('credit_redemptions')).select('*', { count: 'exact', head: true });
                        
                        if (options.where) {
                            Object.entries(options.where).forEach(([key, value]) => {
                                if (typeof value === 'object' && value.in) {
                                    query = query.in(key, value.in);
                                } else {
                                    query = query.eq(key, value);
                                }
                            });
                        }
                        
                        const { count, error } = await query;
                        if (error) {
                            const errorMsg = error.message || error.details || JSON.stringify(error);
                            throw new Error(`Error en count: ${errorMsg}`);
                        }
                        return count || 0;
                    } catch (error) {
                        const errorMsg = error.message || error.details || JSON.stringify(error);
                        console.error('❌ Error en creditRedemption.count:', errorMsg);
                        throw new Error(`Error en count: ${errorMsg}`);
                    }
                }
            },

            // Tabla patient_files (patientFile en Prisma)
            patient_files: {
                findMany: async (options = {}) => {
                    try {
                        let query = this.supabase.from(this.getTableName('patient_files')).select('*');
                        
                        if (options.where) {
                            Object.entries(options.where).forEach(([key, value]) => {
                                query = query.eq(key, value);
                            });
                        }
                        
                        if (options.orderBy) {
                            const orderField = Object.keys(options.orderBy)[0];
                            const orderDirection = options.orderBy[orderField];
                            query = query.order(orderField, { ascending: orderDirection === 'asc' });
                        }
                        
                        const { data, error } = await query;
                        if (error) {
                            const errorMsg = error.message || error.details || JSON.stringify(error);
                            throw new Error(`Error en findMany: ${errorMsg}`);
                        }
                        return data || [];
                    } catch (error) {
                        const errorMsg = error.message || error.details || JSON.stringify(error);
                        console.error('❌ Error en patient_files.findMany:', errorMsg);
                        throw new Error(`Error en findMany: ${errorMsg}`);
                    }
                },

                findUnique: async (options) => {
                    try {
                        const { data, error } = await this.supabase
                            .from(this.getTableName('patient_files'))
                            .select('*')
                            .eq('id', options.where.id);

                        if (error && error.code !== 'PGRST116') {
                            const errorMsg = error.message || error.details || JSON.stringify(error);
                            throw new Error(`Error en findUnique: ${errorMsg}`);
                        }
                        return data && data.length > 0 ? data[0] : null;
                    } catch (error) {
                        const errorMsg = error.message || error.details || JSON.stringify(error);
                        console.error('❌ Error en patient_files.findUnique:', errorMsg);
                        throw new Error(`Error en findUnique: ${errorMsg}`);
                    }
                },

                findFirst: async (options) => {
                    try {
                        let query = this.supabase.from(this.getTableName('patient_files')).select('*');
                        
                        if (options.where) {
                            Object.entries(options.where).forEach(([key, value]) => {
                                query = query.eq(key, value);
                            });
                        }
                        
                        const { data, error } = await query.limit(1);
                        if (error) {
                            const errorMsg = error.message || error.details || JSON.stringify(error);
                            throw new Error(`Error en findFirst: ${errorMsg}`);
                        }
                        return data && data.length > 0 ? data[0] : null;
                    } catch (error) {
                        const errorMsg = error.message || error.details || JSON.stringify(error);
                        console.error('❌ Error en patient_files.findFirst:', errorMsg);
                        throw new Error(`Error en findFirst: ${errorMsg}`);
                    }
                },

                create: async (options) => {
                    try {
                        const { data, error } = await this.supabase
                            .from(this.getTableName('patient_files'))
                            .insert(options.data)
                            .select();
                        
                        if (error) {
                            const errorMsg = error.message || error.details || JSON.stringify(error);
                            throw new Error(`Error en create: ${errorMsg}`);
                        }
                        return data ? data[0] : null;
                    } catch (error) {
                        const errorMsg = error.message || error.details || JSON.stringify(error);
                        console.error('❌ Error en patient_files.create:', errorMsg);
                        throw new Error(`Error en create: ${errorMsg}`);
                    }
                },

                update: async (options) => {
                    try {
                        const { data, error } = await this.supabase
                            .from(this.getTableName('patient_files'))
                            .update(options.data)
                            .eq('id', options.where.id)
                            .select();
                        
                        if (error) {
                            const errorMsg = error.message || error.details || JSON.stringify(error);
                            throw new Error(`Error en update: ${errorMsg}`);
                        }
                        return data ? data[0] : null;
                    } catch (error) {
                        const errorMsg = error.message || error.details || JSON.stringify(error);
                        console.error('❌ Error en patient_files.update:', errorMsg);
                        throw new Error(`Error en update: ${errorMsg}`);
                    }
                },

                delete: async (options) => {
                    try {
                        const { data, error } = await this.supabase
                            .from(this.getTableName('patient_files'))
                            .delete()
                            .eq('id', options.where.id)
                            .select();
                        
                        if (error) {
                            const errorMsg = error.message || error.details || JSON.stringify(error);
                            throw new Error(`Error en delete: ${errorMsg}`);
                        }
                        return data ? data[0] : null;
                    } catch (error) {
                        const errorMsg = error.message || error.details || JSON.stringify(error);
                        console.error('❌ Error en patient_files.delete:', errorMsg);
                        throw new Error(`Error en delete: ${errorMsg}`);
                    }
                },

                count: async (options = {}) => {
                    try {
                        let query = this.supabase.from(this.getTableName('patient_files')).select('*', { count: 'exact', head: true });
                        
                        if (options.where) {
                            Object.entries(options.where).forEach(([key, value]) => {
                                query = query.eq(key, value);
                            });
                        }
                        
                        const { count, error } = await query;
                        if (error) {
                            const errorMsg = error.message || error.details || JSON.stringify(error);
                            throw new Error(`Error en count: ${errorMsg}`);
                        }
                        return count || 0;
                    } catch (error) {
                        const errorMsg = error.message || error.details || JSON.stringify(error);
                        console.error('❌ Error en patient_files.count:', errorMsg);
                        throw new Error(`Error en count: ${errorMsg}`);
                    }
                }
            }
        };

    // Añadir modelo 'configurations' (alias 'configuration' mantenido para compatibilidad)
    // Se expone como interface_tables.configuration para compatibilidad con el código que espera prisma.configuration
    interface_tables.configuration = {
            // findMany soporta filtro por key.in y tiene fallback in-memory si la tabla no existe
            findMany: async (options = {}) => {
                try {
                    // Preferimos la tabla real en Supabase: 'configurations'
                    let query = this.supabase.from(this.getTableName('configurations')).select('*');
                    if (options.where && options.where.key && options.where.key.in) {
                        query = query.in('key', options.where.key.in);
                    }
                    const { data, error } = await query;
                    if (error) {
                        const errorMsg = error.message || error.details || JSON.stringify(error);
                        // If the table is not present, return values from in-memory fallback
                        if (errorMsg && (errorMsg.includes("Could not find the table") || errorMsg.includes('does not exist'))) {
                            console.warn('⚠️ configurations.findMany: table not found, using in-memory fallback');
                            const arr = Array.from(this._inMemoryConfiguration.entries()).map(([key, value]) => ({ key, value }));
                            if (options.where && options.where.key && options.where.key.in) {
                                const wanted = new Set(options.where.key.in);
                                return arr.filter(item => wanted.has(item.key));
                            }
                            return arr;
                        }
                        throw new Error(`Error en configurations.findMany: ${errorMsg}`);
                    }
                    return data || [];
                } catch (err) {
                    const msg = err && err.message ? err.message : '';
                    if (msg.includes("Could not find the table") || msg.includes('does not exist')) {
                        console.warn('⚠️ configurations.findMany: missing table error caught, returning in-memory fallback:', msg);
                        return Array.from(this._inMemoryConfiguration.entries()).map(([key, value]) => ({ key, value }));
                    }
                    console.error('❌ Error en configurations.findMany:', err);
                    throw err;
                }
            },
            // findUnique soporta búsqueda por id o por key
            findUnique: async (options) => {
                try {
                    if (options && options.where && options.where.key) {
                        // use select() to avoid .single() throwing when no rows found
                        const { data, error } = await this.supabase.from(this.getTableName('configurations')).select('*').eq('key', options.where.key);
                        if (error) {
                            const msg = error.message || '';
                            if (msg.includes("Could not find the table") || msg.includes('does not exist')) {
                                console.warn('⚠️ configurations.findUnique: table not found, using in-memory fallback for key:', options.where.key);
                                const val = this._inMemoryConfiguration.get(options.where.key);
                                return val ? { key: options.where.key, value: val } : null;
                            }
                            throw new Error(error.message || JSON.stringify(error));
                        }
                        return (data && data.length > 0) ? data[0] : null;
                    }

                    if (options && options.where && options.where.id) {
                        const { data, error } = await this.supabase.from(this.getTableName('configurations')).select('*').eq('id', options.where.id);
                        if (error) {
                            const msg = error.message || '';
                            if (msg.includes("Could not find the table") || msg.includes('does not exist')) {
                                // In-memory fallback cannot search by id reliably
                                console.warn('⚠️ configuration.findUnique: table not found while searching by id:', options.where.id);
                                return null;
                            }
                            throw new Error(error.message || JSON.stringify(error));
                        }
                        return (data && data.length > 0) ? data[0] : null;
                    }

                    return null;
                } catch (err) {
                    console.error('❌ Error en configurations.findUnique:', err);
                    throw err;
                }
            },
            // create con fallback in-memory
            create: async (options) => {
                try {
                    const { data, error } = await this.supabase.from(this.getTableName('configurations')).insert(options.data).select();
                    if (error) {
                        const msg = error.message || '';
                        if (msg.includes("Could not find the table") || msg.includes('does not exist')) {
                            // store in-memory
                            const key = options.data.key;
                            const value = options.data.value;
                            this._inMemoryConfiguration.set(key, value);
                            console.warn('⚠️ configurations.create: table not found, saved to in-memory fallback key=', key);
                            return { key, value };
                        }
                        throw new Error(error.message || JSON.stringify(error));
                    }
                    return (data && data.length > 0) ? data[0] : null;
                } catch (err) {
                    console.error('❌ Error en configuration.create:', err);
                    throw err;
                }
            },
            // update con fallback in-memory
            update: async (options) => {
                try {
                    if (options.where && options.where.key) {
                        const { data, error } = await this.supabase.from(this.getTableName('configuration')).update(options.data).eq('key', options.where.key).select();
                        if (error) {
                            const msg = error.message || '';
                            if (msg.includes("Could not find the table") || msg.includes('does not exist')) {
                                this._inMemoryConfiguration.set(options.where.key, options.data.value);
                                    console.warn('⚠️ configurations.update: table not found, updated in-memory key=', options.where.key);
                                return { key: options.where.key, value: options.data.value };
                            }
                            throw new Error(error.message || JSON.stringify(error));
                        }
                        return (data && data.length > 0) ? data[0] : null;
                    }

                    if (options.where && options.where.id) {
                        const { data, error } = await this.supabase.from(this.getTableName('configuration')).update(options.data).eq('id', options.where.id).select();
                        if (error) throw new Error(error.message || JSON.stringify(error));
                        return (data && data.length > 0) ? data[0] : null;
                    }

                    throw new Error('configuration.update: missing where clause');
                } catch (err) {
                    console.error('❌ Error en configuration.update:', err);
                    throw err;
                }
            },
            // upsert: soporta where.key y where.id, con fallback in-memory
            upsert: async (options) => {
                try {
                    // If where.key provided, try to upsert by key
                    if (options.where && options.where.key) {
                        // Try DB first
                        // check existing without .single() to avoid throwing when there's no row
                        const { data: selData, error: selError } = await this.supabase.from(this.getTableName('configurations')).select('*').eq('key', options.where.key);
                        if (selError) {
                            const msg = selError.message || '';
                            if (msg.includes("Could not find the table") || msg.includes('does not exist')) {
                                // operate on in-memory map
                                const key = options.where.key;
                                const newValue = (options.update && options.update.value) || (options.create && options.create.value) || (options.data && options.data.value);
                                this._inMemoryConfiguration.set(key, newValue);
                                console.warn('⚠️ configurations.upsert: table not found, saved to in-memory key=', key);
                                return { key, value: newValue };
                            }
                            throw new Error(selError.message || JSON.stringify(selError));
                        }

                        const existing = (selData && selData.length > 0) ? selData[0] : null;

                        if (existing && existing.id) {
                            const { data, error } = await this.supabase.from(this.getTableName('configurations')).update(options.update || options.data || options.create).eq('key', options.where.key).select();
                            if (error) throw new Error(error.message || JSON.stringify(error));
                            return (data && data.length > 0) ? data[0] : null;
                        }

                        // Use upsert to avoid primary key conflicts if payload contains existing id or key
                        {
                            const payload = options.create || options.data;
                            let res;
                            if (payload && payload.key) {
                                res = await this.supabase.from(this.getTableName('configurations')).upsert(payload, { onConflict: 'key' }).select();
                            } else if (payload && payload.id) {
                                res = await this.supabase.from(this.getTableName('configurations')).upsert(payload, { onConflict: 'id' }).select();
                            } else {
                                res = await this.supabase.from(this.getTableName('configurations')).insert(payload).select();
                            }
                            if (res.error) throw new Error(res.error.message || JSON.stringify(res.error));
                            const data = res.data || res;
                            return (data && data.length > 0) ? data[0] : null;
                        }
                    }

                    // Fallback to previous behavior for where.id
                    if (options.where && options.where.id) {
                        const { data: selData, error: selError } = await this.supabase.from(this.getTableName('configurations')).select('*').eq('id', options.where.id);
                        if (selError) throw new Error(selError.message || JSON.stringify(selError));
                        const existing = (selData && selData.length > 0) ? selData[0] : null;
                        if (existing) {
                            const { data, error } = await this.supabase.from(this.getTableName('configurations')).update(options.create || options.update || options.data).eq('id', options.where.id).select();
                            if (error) throw new Error(error.message || JSON.stringify(error));
                            return (data && data.length > 0) ? data[0] : null;
                        }
                        // Use upsert when inserting by id fallback to avoid PK conflicts
                        {
                            const payload = options.create || options.data;
                            let res;
                            if (payload && payload.id) {
                                res = await this.supabase.from(this.getTableName('configurations')).upsert(payload, { onConflict: 'id' }).select();
                            } else if (payload && payload.key) {
                                res = await this.supabase.from(this.getTableName('configurations')).upsert(payload, { onConflict: 'key' }).select();
                            } else {
                                res = await this.supabase.from(this.getTableName('configurations')).insert(payload).select();
                            }
                            if (res.error) throw new Error(res.error.message || JSON.stringify(res.error));
                            const data = res.data || res;
                            return (data && data.length > 0) ? data[0] : null;
                        }
                    }

                    // If no where provided, insert
                    // If no where provided, attempt upsert/insert depending on payload to avoid PK conflicts
                    try {
                        const payload = options.create || options.data;
                        let res;
                        if (payload && payload.id) {
                            res = await this.supabase.from(this.getTableName('configurations')).upsert(payload, { onConflict: 'id' }).select();
                        } else if (payload && payload.key) {
                            res = await this.supabase.from(this.getTableName('configurations')).upsert(payload, { onConflict: 'key' }).select();
                        } else {
                            res = await this.supabase.from(this.getTableName('configurations')).insert(payload).select();
                        }
                        if (res.error) {
                            const msg = res.error.message || JSON.stringify(res.error);
                            if (msg.includes("Could not find the table") || msg.includes('does not exist')) {
                                // Insert into in-memory fallback using provided key
                                if (payload && payload.key) {
                                    this._inMemoryConfiguration.set(payload.key, payload.value);
                                    console.warn('⚠️ configurations.upsert: table not found on final insert, saved to in-memory key=', payload.key);
                                    return { key: payload.key, value: payload.value };
                                }
                            }
                            throw new Error(msg);
                        }
                        const insData = res.data || res;
                        return (insData && insData.length > 0) ? insData[0] : null;
                    } catch (insErr) {
                        console.error('❌ Error en configurations.upsert (final insert):', insErr);
                        throw insErr;
                    }
                } catch (err) {
                    console.error('❌ Error en configuration.upsert:', err);
                    throw err;
                }
            },
            // deleteMany with fallback
            deleteMany: async (options = {}) => {
                try {
                    // If DB exists, try DB delete
                        const { data, error } = await this.supabase.from(this.getTableName('configurations')).delete().match(options.where || {}).select();
                    if (error) {
                        const msg = error.message || '';
                        if (msg.includes("Could not find the table") || msg.includes('does not exist')) {
                            // apply deletion on in-memory
                            if (!options.where) {
                                this._inMemoryConfiguration.clear();
                                return { count: 0 };
                            }
                            if (options.where.key && options.where.key.in) {
                                for (const k of options.where.key.in) this._inMemoryConfiguration.delete(k);
                                return { count: 0 };
                            }
                            // unsupported where shape => no-op
                            return { count: 0 };
                        }
                        throw new Error(error.message || JSON.stringify(error));
                    }
                    return data || [];
                } catch (err) {
                    console.error('❌ Error en configuration.deleteMany:', err);
                    throw err;
                }
            },
            // createMany con fallback
            createMany: async (options = {}) => {
                try {
                    const { data, error } = await this.supabase.from(this.getTableName('configurations')).insert(options.data).select();
                    if (error) {
                        const msg = error.message || '';
                        if (msg.includes("Could not find the table") || msg.includes('does not exist')) {
                            for (const row of options.data || []) {
                                if (row.key) this._inMemoryConfiguration.set(row.key, row.value);
                            }
                            return Array.from(this._inMemoryConfiguration.entries()).map(([key, value]) => ({ key, value }));
                        }
                        throw new Error(error.message || JSON.stringify(error));
                    }
                    return data || [];
                } catch (err) {
                    console.error('❌ Error en configuration.createMany:', err);
                    throw err;
                }
            }
        };

        // Agregar aliases para compatibilidad con código existente de Prisma
        const interface_with_aliases = {
            ...interface_tables,
            // Alias para compatibilidad con nombres CamelCase que usa Prisma
            patient: interface_tables.patients,
            appointment: interface_tables.appointments,
            creditPack: interface_tables.credit_packs,
            creditRedemption: interface_tables.credit_redemptions,
            patientFile: interface_tables.patient_files
        };

        // Emulate prisma.$transaction(fn) by providing the same client shape as 'tx'
        // Note: this is not a real DB transaction (Supabase REST doesn't support it here),
        // but it ensures code that expects tx.appointment, tx.creditPack, etc. works.
        interface_with_aliases.$transaction = async (cb) => {
            if (typeof cb === 'function') {
                // pass the same interface as the tx object
                return await cb(interface_with_aliases);
            }
            if (Array.isArray(cb)) {
                const results = [];
                for (const op of cb) {
                    if (typeof op === 'function') {
                        results.push(await op());
                    } else {
                        results.push(op);
                    }
                }
                return results;
            }
            throw new Error('$transaction expects a function or an array of functions');
        };

        return interface_with_aliases;
    }
}

let dbManagerInstance = null;

async function getDbManager() {
    if (!dbManagerInstance) {
        dbManagerInstance = new DatabaseManager();
        try {
            await dbManagerInstance.initialize();
        } catch (error) {
            console.warn('⚠️ DatabaseManager falló al inicializar, continuando en modo degradado');
        }
    }
    return dbManagerInstance;
}

module.exports = { DatabaseManager, getDbManager };