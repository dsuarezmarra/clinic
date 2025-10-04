/**
 * Plugin de Vite para inyectar CLIENT_ID en index.html
 * 
 * Este plugin reemplaza el placeholder __VITE_CLIENT_ID__ en el HTML
 * con el valor real de la variable de entorno VITE_CLIENT_ID
 */

export function injectClientIdPlugin() {
  return {
    name: 'inject-client-id',
    transformIndexHtml(html) {
      const clientId = process.env.VITE_CLIENT_ID || 'masajecorporaldeportivo';
      
      console.log(`\n🎨 [inject-client-id] Inyectando CLIENT_ID: ${clientId}\n`);
      
      // Reemplazar el placeholder con el valor real
      return html.replace(/__VITE_CLIENT_ID__/g, clientId);
    }
  };
}
