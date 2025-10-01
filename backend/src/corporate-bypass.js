// Configuración para bypass de restricciones corporativas
const https = require('https');
const http = require('http');
const { HttpsProxyAgent } = require('https-proxy-agent');

console.log('🔧 Configurando bypass corporativo...');

// 1. Bypass SSL verification (común en entornos corporativos)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
console.log('✅ SSL verification deshabilitada');

// 2. Detectar proxies corporativos automáticamente
const detectProxy = () => {
    const proxyCandidates = [
        process.env.HTTPS_PROXY,
        process.env.HTTP_PROXY,
        process.env.https_proxy,
        process.env.http_proxy,
        'http://proxy.internal:8080',
        'http://proxy.internal:3128',
        'http://proxy:8080',
        'http://proxy:3128',
        'http://10.0.0.1:8080',
        'http://192.168.1.1:8080',
        'http://172.16.0.1:8080'
    ].filter(Boolean);
    
    console.log('🔍 Proxies detectados:', proxyCandidates);
    return proxyCandidates[0];
};

// 3. Configurar agentes HTTP globales
const setupGlobalAgents = () => {
    const proxy = detectProxy();
    
    // Agente HTTPS personalizado
    const httpsAgent = new https.Agent({
        rejectUnauthorized: false,
        keepAlive: true,
        timeout: 30000,
        secureProtocol: 'TLSv1_2_method'
    });
    
    // Agente HTTP personalizado
    const httpAgent = new http.Agent({
        keepAlive: true,
        timeout: 30000
    });
    
    if (proxy) {
        console.log('🌐 Usando proxy:', proxy);
        const proxyAgent = new HttpsProxyAgent(proxy);
        
        // Configurar fetch global con proxy
        global.fetch = require('node-fetch').default;
        global.fetch.defaults = {
            agent: proxyAgent
        };
    }
    
    return { httpsAgent, httpAgent, proxy };
};

// 4. Patch fetch para Supabase
const patchFetchForSupabase = () => {
    const originalFetch = global.fetch || require('node-fetch').default;
    
    global.fetch = async (url, options = {}) => {
        const proxy = detectProxy();
        
        // Configuración para bypass corporativo
        const modifiedOptions = {
            ...options,
            timeout: 30000,
            headers: {
                ...options.headers,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };
        
        // Si hay proxy, usarlo
        if (proxy) {
            const { HttpsProxyAgent } = require('https-proxy-agent');
            modifiedOptions.agent = new HttpsProxyAgent(proxy);
        } else {
            // Agente personalizado para bypass SSL
            modifiedOptions.agent = new https.Agent({
                rejectUnauthorized: false,
                keepAlive: true,
                timeout: 30000
            });
        }
        
        console.log(`🌐 Fetch to: ${url} with agent:`, !!modifiedOptions.agent);
        
        try {
            return await originalFetch(url, modifiedOptions);
        } catch (error) {
            console.log('❌ Fetch failed:', error.message);
            
            // Retry sin agente como fallback
            delete modifiedOptions.agent;
            console.log('🔄 Retrying without agent...');
            return await originalFetch(url, modifiedOptions);
        }
    };
    
    console.log('✅ Fetch patched para bypass corporativo');
};

module.exports = {
    setupGlobalAgents,
    patchFetchForSupabase,
    detectProxy
};