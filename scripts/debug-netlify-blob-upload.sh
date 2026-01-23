#!/bin/bash
# Debug script for Netlify blob upload failures
# Logs diagnostic information to debug.log

LOG_PATH="/Users/macbook/Desktop/carehaven/.cursor/debug.log"
TIMESTAMP=$(date +%s000)

log_json() {
    local location=$1
    local message=$2
    local hypothesis_id=$3
    local data=$4
    echo "{\"id\":\"log_${TIMESTAMP}_$(date +%N)\",\"timestamp\":${TIMESTAMP},\"location\":\"${location}\",\"message\":\"${message}\",\"data\":${data},\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"${hypothesis_id}\"}" >> "$LOG_PATH"
}

echo "Starting Netlify blob upload diagnostic..."
echo "Logging to: $LOG_PATH"

# Hypothesis A: Network connectivity issue to Netlify API
log_json "debug-netlify-blob-upload.sh:45" "Testing network connectivity to Netlify API" "A" "{}"
if curl -s --max-time 10 -o /dev/null -w "%{http_code}" https://api.netlify.com > /tmp/netlify_api_test.txt 2>&1; then
    API_STATUS=$(cat /tmp/netlify_api_test.txt)
    log_json "debug-netlify-blob-upload.sh:48" "Netlify API connectivity test result" "A" "{\"apiStatusCode\":\"${API_STATUS}\",\"reachable\":true}"
else
    CURL_ERROR=$(cat /tmp/netlify_api_test.txt 2>&1)
    log_json "debug-netlify-blob-upload.sh:51" "Netlify API connectivity test failed" "A" "{\"reachable\":false,\"error\":\"${CURL_ERROR}\"}"
fi

# Hypothesis B: DNS resolution failure
log_json "debug-netlify-blob-upload.sh:55" "Testing DNS resolution" "B" "{}"
if command -v dig &> /dev/null; then
    DNS_RESULT=$(dig +short api.netlify.com 2>&1)
    log_json "debug-netlify-blob-upload.sh:58" "DNS resolution for api.netlify.com" "B" "{\"resolved\":true,\"ips\":\"${DNS_RESULT}\"}"
else
    NSLOOKUP_RESULT=$(nslookup api.netlify.com 2>&1)
    log_json "debug-netlify-blob-upload.sh:61" "DNS resolution via nslookup" "B" "{\"result\":\"${NSLOOKUP_RESULT}\"}"
fi

# Hypothesis C: Build artifacts too large
log_json "debug-netlify-blob-upload.sh:65" "Checking build artifact sizes" "C" "{}"
if [ -d ".next" ]; then
    BUILD_SIZE=$(du -sh .next 2>/dev/null | awk '{print $1}')
    BUILD_SIZE_BYTES=$(du -sb .next 2>/dev/null | awk '{print $1}')
    FILE_COUNT=$(find .next -type f 2>/dev/null | wc -l | tr -d ' ')
    log_json "debug-netlify-blob-upload.sh:69" "Build artifact size analysis" "C" "{\"sizeHuman\":\"${BUILD_SIZE}\",\"sizeBytes\":${BUILD_SIZE_BYTES},\"fileCount\":${FILE_COUNT}}"
else
    log_json "debug-netlify-blob-upload.sh:71" ".next directory not found" "C" "{\"exists\":false}"
fi

# Hypothesis D: Authentication/authorization issue
log_json "debug-netlify-blob-upload.sh:75" "Checking Netlify CLI authentication" "D" "{}"
NETLIFY_STATUS_OUTPUT=$(npx netlify-cli status 2>&1)
NETLIFY_STATUS_EXIT=$?
log_json "debug-netlify-blob-upload.sh:78" "Netlify CLI status check" "D" "{\"exitCode\":${NETLIFY_STATUS_EXIT},\"output\":\"${NETLIFY_STATUS_OUTPUT}\"}"

# Hypothesis E: Environment variables not set correctly
log_json "debug-netlify-blob-upload.sh:82" "Checking deployment environment variables" "E" "{}"
ENV_VARS=$(env | grep -E "^(NETLIFY_|NODE_OPTIONS)" | tr '\n' '|')
log_json "debug-netlify-blob-upload.sh:84" "Relevant environment variables" "E" "{\"vars\":\"${ENV_VARS}\"}"

# Hypothesis F: Proxy/firewall blocking
log_json "debug-netlify-blob-upload.sh:88" "Checking proxy/firewall settings" "F" "{}"
if [ -n "$http_proxy" ] || [ -n "$HTTP_PROXY" ] || [ -n "$https_proxy" ] || [ -n "$HTTPS_PROXY" ]; then
    PROXY_SETTINGS="http_proxy=${http_proxy:-$HTTP_PROXY},https_proxy=${https_proxy:-$HTTPS_PROXY}"
    log_json "debug-netlify-blob-upload.sh:91" "Proxy settings detected" "F" "{\"proxyConfigured\":true,\"settings\":\"${PROXY_SETTINGS}\"}"
else
    log_json "debug-netlify-blob-upload.sh:93" "No proxy settings detected" "F" "{\"proxyConfigured\":false}"
fi

# Hypothesis G: Netlify service outage or rate limiting
log_json "debug-netlify-blob-upload.sh:97" "Checking Netlify service status" "G" "{}"
NETLIFY_STATUS_API=$(curl -s --max-time 5 https://www.netlifystatus.com/api/v2/status.json 2>&1)
if [ $? -eq 0 ]; then
    log_json "debug-netlify-blob-upload.sh:100" "Netlify status page API response" "G" "{\"statusData\":\"${NETLIFY_STATUS_API}\"}"
else
    log_json "debug-netlify-blob-upload.sh:102" "Could not fetch Netlify status" "G" "{\"error\":\"Failed to fetch status page\"}"
fi

# Hypothesis H: File system or permissions issue
log_json "debug-netlify-blob-upload.sh:106" "Checking file system permissions" "H" "{}"
if [ -d ".next" ]; then
    PERMISSIONS=$(ls -ld .next 2>&1)
    CAN_WRITE=$(test -w .next && echo "true" || echo "false")
    log_json "debug-netlify-blob-upload.sh:110" "File system permissions check" "H" "{\"permissions\":\"${PERMISSIONS}\",\"writable\":${CAN_WRITE}}"
fi

# Test actual blob upload attempt with detailed logging
log_json "debug-netlify-blob-upload.sh:114" "Attempting test deployment with detailed logging" "ALL" "{}"
echo ""
echo "Attempting deployment with debug logging..."
NETLIFY_CDN_UPLOAD_CONCURRENCY=3 NETLIFY_CDN_UPLOAD_TIMEOUT=300 NODE_OPTIONS="--max-old-space-size=4096 --dns-result-order=ipv4first" npx netlify-cli deploy --dir=.next --prod --functions=netlify/functions --timeout=900 --message="Debug deployment" 2>&1 | tee /tmp/netlify_deploy_output.txt

DEPLOY_EXIT=$?
DEPLOY_OUTPUT=$(cat /tmp/netlify_deploy_output.txt)
log_json "debug-netlify-blob-upload.sh:118" "Deployment attempt completed" "ALL" "{\"exitCode\":${DEPLOY_EXIT},\"output\":\"${DEPLOY_OUTPUT}\"}"

echo ""
echo "Diagnostic complete. Check $LOG_PATH for detailed logs."
