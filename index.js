const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. Serving the Dashboard UI
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dynamic Link Provisioning Utility</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #121212; color: #e0e0e0; max-width: 600px; margin: 40px auto; padding: 20px; }
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
                const target = document.getElementById('targetIp').value.trim();
                const count = Math.min(parseInt(document.getElementById('linkCount').value), 10000);
                const base = window.location.origin;
                
                let txt = "=== PROVISIONED LINKS ===\\n\\n";
                const frag = document.createDocumentFragment();
                
                for(let i=0; i<count; i++) {
                    const lnk = base + "/route/" + getRandomString(6) + "/" + getRandomString(6) + "?dest=" + btoa(target).replace(/=/g,"");
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

// 2. Real-Time Traffic Routing Engine Middleware (Fixed Infinite Loop)
app.use('/route/:fld/:file', (req, res, next) => {
    const encodedDest = req.query.dest;
    if (!encodedDest) return res.status(400).send("Missing target routing parameters.");
    
    try {
        // Decode the target destination securely
        let target = Buffer.from(encodedDest, 'base64').toString('ascii');
        if (!target.startsWith('http')) target = 'https://' + target;

        // Establish the secure server-to-server data pipe
        createProxyMiddleware({
            target: target,
            changeOrigin: true,
            secure: false, // Prevents SSL mismatches when using raw IP targets
            logLevel: 'silent',
            onError: (err, req, res) => {
                res.status(502).send("Target server connection timeout or host offline.");
            }
        })(req, res, next);
    } catch (e) {
        res.status(400).send("Invalid configuration string.");
    }
});

app.listen(PORT, () => console.log('Server active.'));


app.listen(PORT, () => console.log('Server active.'));
