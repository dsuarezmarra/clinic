// Database service: always export a Supabase-compatible shim that mimics the
// Prisma client API. Other modules `require('./services/database')` will get
// an object they can call like `prisma.model.findMany(...)`.
const { getDbManager } = require('../database/database-manager');

// Export a proxy that returns a per-model proxy object. This preserves the
// shape `prisma.model.findMany(...)` instead of making `prisma.model` itself
// a function (which caused `findMany is not a function`).
const prismaProxy = new Proxy({}, {
  get(_, modelName) {
    // Special-case top-level client methods like $transaction which are functions on
    // the Prisma client itself (not per-model). If someone accesses prisma.$transaction
    // we must return a real function that will resolve the DB manager and delegate.
    if (modelName === '$transaction') {
      return async function (...args) {
        // Build a tx proxy that mirrors the client model methods but forwards to
        // the manager-created client. This ensures tx.model.update exists.
        const manager = await getDbManager();
        if (!manager) throw new Error('DatabaseManager no disponible');
        const client = manager.createPrismaCompatibleInterface();

        const tx = new Proxy({}, {
          get(_, modelName2) {
            // Return a proxy for the model that exposes methods (findMany, update, etc.)
            return new Proxy({}, {
              get(__, methodName) {
                return async function (...mArgs) {
                  const model = client[modelName2];
                  if (!model) throw new Error(`Modelo no encontrado en tx: ${modelName2}`);
                  const fn = model[methodName];
                  if (typeof fn !== 'function') throw new Error(`Método no disponible en modelo ${modelName2}: ${methodName}`);
                  return fn.apply(model, mArgs);
                };
              }
            });
          }
        });

        // If caller passed a function, invoke it with the tx proxy
        if (typeof args[0] === 'function') {
          return await args[0](tx);
        }

        // If caller passed an array of operations, run sequentially with tx
        if (Array.isArray(args[0])) {
          const results = [];
          for (const op of args[0]) {
            if (typeof op === 'function') results.push(await op(tx));
            else results.push(op);
          }
          return results;
        }

        throw new Error('$transaction expects a function or an array of functions');
      };
    }

    // Return a proxy that resolves the manager and forwards method calls to
    // the corresponding model object created by DatabaseManager.
    return new Proxy({}, {
      get(__, methodName) {
        return async function (...args) {
          const manager = await getDbManager();
          if (!manager) throw new Error('DatabaseManager no disponible');
          const client = manager.createPrismaCompatibleInterface();
          const model = client[modelName];
          if (!model) throw new Error(`Modelo no encontrado en cliente DB: ${modelName}`);
          const fn = model[methodName];
          if (typeof fn !== 'function') {
            throw new Error(`Método no disponible en modelo ${modelName}: ${methodName}`);
          }
          return fn.apply(model, args);
        };
      }
    });
  }
});

module.exports = prismaProxy;
