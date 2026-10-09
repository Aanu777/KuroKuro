#!/bin/sh
set -eu

: "${KUROKURO_API_TOKEN:?Set KUROKURO_API_TOKEN in the hosting dashboard}"
: "${SEARXNG_SECRET:?Set SEARXNG_SECRET in the hosting dashboard}"

# Keep the proxy token safe for insertion into the nginx configuration.
case "$KUROKURO_API_TOKEN" in
  *[!a-fA-F0-9]*|'')
    echo "KUROKURO_API_TOKEN must be a hexadecimal secret." >&2
    exit 1
    ;;
esac
if [ "${#KUROKURO_API_TOKEN}" -lt 48 ]; then
  echo "KUROKURO_API_TOKEN must be at least 48 hexadecimal characters." >&2
  exit 1
fi

sed "s/__KUROKURO_API_TOKEN__/$KUROKURO_API_TOKEN/g" \
  /etc/nginx/kurokuro-proxy.conf.template > /tmp/kurokuro-proxy.conf

# Start the official SearXNG entrypoint in the background. Its HTTP listener
# stays inside this container; only the authenticated proxy port is exposed.
/usr/local/searxng/dockerfiles/docker-entrypoint.sh &
SEARXNG_PID=$!

ready=0
attempt=0
while [ "$attempt" -lt 45 ]; do
  if wget -q -O /dev/null http://127.0.0.1:8080/; then
    ready=1
    break
  fi
  if ! kill -0 "$SEARXNG_PID" 2>/dev/null; then
    wait "$SEARXNG_PID" || true
    echo "SearXNG exited before becoming ready." >&2
    exit 1
  fi
  attempt=$((attempt + 1))
  sleep 1
done

if [ "$ready" -ne 1 ]; then
  echo "SearXNG did not become ready within 45 seconds." >&2
  kill "$SEARXNG_PID" 2>/dev/null || true
  exit 1
fi

exec nginx -c /tmp/kurokuro-proxy.conf -g "daemon off;"
