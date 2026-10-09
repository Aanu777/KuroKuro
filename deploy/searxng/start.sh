#!/bin/sh
set -eu

: "${KUROKURO_API_TOKEN:?Set KUROKURO_API_TOKEN in the hosting dashboard}"
: "${SEARXNG_SECRET:?Set SEARXNG_SECRET in the hosting dashboard}"

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

# The hosting platform may mount /etc/searxng read-only. Create the
# runtime config in /tmp, inject the secret, and point SearXNG at it.
cp /etc/searxng/settings.yml /tmp/kurokuro-settings.yml
python3 -c 'import os,pathlib; p=pathlib.Path("/tmp/kurokuro-settings.yml"); s=p.read_text(); p.write_text(s.replace("replace-at-runtime-with-SEARXNG_SECRET", os.environ["SEARXNG_SECRET"]))'
export SEARXNG_SETTINGS_PATH=/tmp/kurokuro-settings.yml

# Start SearXNG using the entrypoint included in the official image.
# Its listener remains private on port 8080.
/usr/local/searxng/entrypoint.sh &
SEARXNG_PID=$!

ready=0
attempt=0
while [ "$attempt" -lt 45 ]; do
  if python3 -c 'import urllib.request; urllib.request.urlopen("http://127.0.0.1:8080/", timeout=1).read(1)' >/dev/null 2>&1; then
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

exec python3 /app/proxy.py
