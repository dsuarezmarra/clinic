/**
 * Script para crear usuarios de Supabase Auth
 * 
 * Uso:
 *   node scripts/create-auth-user.js <email> <password> <tenant_slug> [display_name]
 * 
 * Ejemplo:
 *   node scripts/create-auth-user.js fisio@masajecorporaldeportivo.com MiPassword123 masajecorporaldeportivo "Juan Garcia"
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_URL y SUPABASE_SERVICE_KEY son requeridos en .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createUser(email, password, tenantSlug, displayName) {
  console.log('\n=== Creando usuario en Supabase Auth ===\n');
  console.log('Email:', email);
  console.log('Tenant:', tenantSlug);
  console.log('Display Name:', displayName || '(auto)');
  
  try {
    // Crear usuario usando la Admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: {
        tenant_slug: tenantSlug,
        display_name: displayName || email.split('@')[0]
      }
    });
    
    if (error) {
      console.error('\nError al crear usuario:', error.message);
      
      if (error.message.includes('already been registered')) {
        console.log('\nEl usuario ya existe. Puedes actualizar su contrasena desde el dashboard de Supabase.');
      }
      
      return null;
    }
    
    console.log('\n? Usuario creado exitosamente!');
    console.log('\nDetalles:');
    console.log('  ID:', data.user.id);
    console.log('  Email:', data.user.email);
    console.log('  Tenant:', data.user.user_metadata?.tenant_slug);
    console.log('  Creado:', data.user.created_at);
    
    return data.user;
    
  } catch (err) {
    console.error('\nError inesperado:', err.message);
    return null;
  }
}

async function listUsers(tenantSlug) {
  console.log('\n=== Listando usuarios ===\n');
  
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('Error al listar usuarios:', error.message);
      return;
    }
    
    const filteredUsers = tenantSlug 
      ? users.filter(u => u.user_metadata?.tenant_slug === tenantSlug)
      : users;
    
    if (filteredUsers.length === 0) {
      console.log('No hay usuarios registrados' + (tenantSlug ? ` para el tenant: ${tenantSlug}` : ''));
      return;
    }
    
    console.log(`Encontrados ${filteredUsers.length} usuario(s):\n`);
    
    filteredUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Tenant: ${user.user_metadata?.tenant_slug || '(no definido)'}`);
      console.log(`   Creado: ${user.created_at}`);
      console.log('');
    });
    
  } catch (err) {
    console.error('Error inesperado:', err.message);
  }
}

async function deleteUser(email) {
  console.log('\n=== Eliminando usuario ===\n');
  console.log('Email:', email);
  
  try {
    // Primero buscar el usuario por email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error al buscar usuario:', listError.message);
      return;
    }
    
    const user = users.find(u => u.email === email);
    
    if (!user) {
      console.log('Usuario no encontrado');
      return;
    }
    
    // Eliminar usuario
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    
    if (error) {
      console.error('Error al eliminar usuario:', error.message);
      return;
    }
    
    console.log('? Usuario eliminado exitosamente');
    
  } catch (err) {
    console.error('Error inesperado:', err.message);
  }
}

// Procesar argumentos
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
Uso:
  node create-auth-user.js create <email> <password> <tenant_slug> [display_name]
  node create-auth-user.js list [tenant_slug]
  node create-auth-user.js delete <email>

Ejemplos:
  node create-auth-user.js create fisio@clinica.com Password123 masajecorporaldeportivo "Dr. Garcia"
  node create-auth-user.js list masajecorporaldeportivo
  node create-auth-user.js delete fisio@clinica.com
`);
  process.exit(0);
}

const command = args[0];

switch (command) {
  case 'create':
    if (args.length < 4) {
      console.error('Error: Se requieren email, password y tenant_slug');
      console.log('Uso: node create-auth-user.js create <email> <password> <tenant_slug> [display_name]');
      process.exit(1);
    }
    createUser(args[1], args[2], args[3], args[4]).then(() => process.exit(0));
    break;
    
  case 'list':
    listUsers(args[1]).then(() => process.exit(0));
    break;
    
  case 'delete':
    if (args.length < 2) {
      console.error('Error: Se requiere email');
      console.log('Uso: node create-auth-user.js delete <email>');
      process.exit(1);
    }
    deleteUser(args[1]).then(() => process.exit(0));
    break;
    
  default:
    // Compatibilidad con el uso antiguo (sin comando)
    if (args.length >= 3) {
      createUser(args[0], args[1], args[2], args[3]).then(() => process.exit(0));
    } else {
      console.error('Comando no reconocido:', command);
      process.exit(1);
    }
}
