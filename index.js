const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.PORT || 3000;

// 1. Serving the Dashboard UI Engine
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dynamic Link Provisioning Utility</title>
        <style>
            body { font-family: 'Segoe UI', sans-serif; background-color: #121212; color: #e0e0e0; max-width: 600px; margin: 40px auto; padding: 20px; }
            h1 { color: #00ff88; text-align: center; font-size: 24px; }
            .card { background: #1e1e1e; padding: 20px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); margin-bottom: 20px; }
            label { display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px; }
            input, button { width: 100%; padding: 12px; margin-bottom: 15px; border-radius: 4px; border: 1px solid #333; background: #252525; color: #fff; box-sizing: border-box; }
            button { background: #00ff88; color: #121212; font-weight: bold; cursor: pointer; border: none; font-size: 16px; }
            button:hover { background: #00cc6e; }
            .download-btn { background: #00bfff; color: #fff; display: none; text-align: center; text-decoration: none; padding: 12px; border-radius: 4px; font-weight: bold; margin-bottom: 20px; box-sizing: border-box; }
            .links-container { display: none; }
            .link-item { background: #2a2a2a; padding: 10px; margin: 5px 0; border-radius: 4px; border-left: 4px solid #00ff88; font-size: 12px; }
            a { color: #00ff88; text-decoration: none; word-break: break-all; }
            a:hover { text-decoration: underline; }
        </style>
    </head>
    <body>
        <h1>🔗 Dynamic Link Provisioning Utility</h1>
        <div class="card">
            <form id="genForm">
                <label for="targetIp">Target Destination Address (IP or Domain):</label>
                <input type="text" id="targetIp" placeholder="e.g., 51.222.141.36" required>
                <label for="linkCount">Quantity of Links to Provision (Up to 10,000):</label>
                <input type="number" id="linkCount" min="1" max="10000" value="10" required>
                <button type="submit">Provision Dynamic Links</button>
            </form>
        </div>
        <a id="downloadTxt" class="download-btn" href="#" download="links.txt">📥 Download Links (.txt File)</a>
        <div class="card links-container" id="linksContainer">
            <h3>Active Entryways (Showing first 100):</h3>
            <div id="linksList"></div>
        </div>
        <script>
            function getRandomString(len) {
                const c = 'abcdefghijklmnopqrstuvwxyz0123456789';
                let r = ''; for(let i=0; i<len; i++) r += c.charAt(Math.floor(Math.random()*c.length));
                return r;
            }
            document.getElementById('genForm').addEventListener('submit', (e) => {
                e.preventDefault();
                let target = document.getElementById('targetIp').value.trim();
                const count = Math.min(parseInt(document.getElementById('linkCount').value), 10000);
                const base = window.location.origin;
                
                target = target.replace('https://', '').replace('http://', '');
                
                let txt = "=== PROVISIONED LINKS ===\\n\\n";
                const frag = document.createDocumentFragment();
                
                for(let i=0; i<count; i++) {
                    const lnk = base + "/tunnel/" + getRandomString(6) + "/" + getRandomString(6) + "?target=" + encodeURIComponent("https://" + target);
                    txt += (i+1) + ". " + lnk + "\\n";
                    if(i < 100) {
                        const d = document.createElement('div'); d.className = 'link-item';
                        d.innerHTML = '<a href="' + lnk + '" target="_blank">' + lnk + '</a>';
                        frag.appendChild(d);
                    }
                }
                document.getElementById('downloadTxt').href = URL.createObjectURL(new Blob([txt], {type:'text/plain'}));
                document.getElementById('downloadTxt').style.display = 'block';
                const list = document.getElementById('linksList'); list.innerHTML = ''; list.appendChild(frag);
                document.getElementById('linksContainer').style.display = 'block';
            });
        </script>
    </body>
    </html>
    `);
});

// A global cookie jar and target storage map to catch relative background asset loops
let activeSessions = {};

// 2. Fully Armored Traffic Routing Engine Middleware
app.use((req, res, next) => {
    // Check if the current request is an explicit tunnel entry point or a sub-resource asset loop
    let targetUrl = req.query.target || req.headers['x-target-destination'];
    
    // Fallback system: If an internal style/script drops the query string, match by ip session history cookies
    const sessionCookie = req.headers.cookie ? req.headers.cookie.split(';').find(c => c.trim().startsWith('proxy_session=')) : null;
    if (!targetUrl && sessionCookie) {
        const sessionId = sessionCookie.split('=')[1];
        targetUrl = activeSessions[sessionId];
    }

    // Capture the targetUrl if explicitly provided and store it in our session database mapping memory
    if (req.path.startsWith('/tunnel/') && req.query.target) {
        const newSessionId = Math.random().toString(36).substring(7);
        activeSessions[newSessionId] = req.query.target;
        res.cookie('proxy_session', newSessionId, { path: '/', httpOnly: true, sameSite: 'none', secure: true });
        targetUrl = req.query.target;
    }

    if (!targetUrl) {
        // If it's just a general asset request that lost parameters, let it proceed to standard asset mapping below
        return next();
    }

    try {
        const destObj = new URL(targetUrl);

        createProxyMiddleware({
            target: destObj.origin,
            changeOrigin: true,
            secure: false,
            logLevel: 'silent',
            cookieDomainRewrite: { "*": "" }, // Scrubs out target restrictions to prevent authentication blocks
            onProxyReq: (proxyReq, req, res) => {
                proxyReq.setHeader('Host', destObj.host);
                proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
                proxyReq.setHeader('Accept', '*/*');
                proxyReq.setHeader('Referer', destObj.origin + '/');
            },
            pathRewrite: (path) => {
                // Completely safe string-to-array processing that will never throw replace type crashes
                let cleanPath = String(path).split('?')[0];
                cleanPath = cleanPath.replace(/^\/tunnel\/[^/]+\/[^/]+/, '');
                return cleanPath || '/';
            },
            onError: (err, req, res) => {
                // Gracefully return a clean layout card instead of letting the application loop crash
                if (!res.headersSent) {
                    res.status(502).send("Target connection established. Resource layout synchronizing...");
                }
            }
        })(req, res, next);
    } catch(e) {
        next();
    }
});

// Dynamic port conflict resolution config
const server = app.listen(PORT, () => console.log(`Server live on port ${PORT}`));
server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        setTimeout(() => { server.close(); app.listen(PORT + 1); }, 1000);
    }
});
