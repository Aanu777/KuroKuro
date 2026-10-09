FROM searxng/searxng:2026.10.4-d48c4b555

USER root

# The official image is intentionally minimal and has no package manager.
# Reuse its existing Python runtime for the small authenticated proxy.
COPY settings.yml /etc/searxng/settings.yml
COPY proxy.py /app/proxy.py
COPY start.sh /app/start.sh

RUN chmod 755 /app/start.sh /app/proxy.py

ENV SEARXNG_PORT=8080
ENV SEARXNG_BIND_ADDRESS=0.0.0.0
ENV SEARXNG_LIMITER=false
ENV SEARXNG_PUBLIC_INSTANCE=false
ENV SEARXNG_IMAGE_PROXY=false

EXPOSE 7860

ENTRYPOINT ["/bin/sh", "/app/start.sh"]
