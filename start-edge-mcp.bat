@echo off
echo ================================================================
echo 🚀 Starting Google AI Edge Gallery Video MCP (StreamableHTTP)
echo ================================================================

start /b "" node ./node_modules/supergateway/dist/index.js --port 8000 --stdio "node dist/index.js" --outputTransport streamableHttp
timeout /t 3 >nul

echo 🌐 Creating Cloudflare HTTPS Tunnel...
.\cloudflared.exe tunnel --url http://localhost:8000
