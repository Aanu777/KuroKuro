FROM searxng/searxng:2026.10.4-d48c4b555

USER root

# Use the image's Debian package manager; apk is only available on Alpine.
RUN apt-get update \
    && apt-get install -y --no-install-recommends nginx wget \
    && rm -rf /var/lib/apt/lists/*

COPY settings.yml /etc/searxng/settings.yml
COPY nginx-proxy.conf.template /etc/nginx/kurokuro-proxy.conf.template
COPY start.sh /app/start.sh

RUN chmod 755 /app/start.sh

ENV SEARXNG_PORT=8080
ENV SEARXNG_BIND_ADDRESS=0.0.0.0
ENV SEARXNG_LIMITER=false
ENV SEARXNG_PUBLIC_INSTANCE=false
ENV SEARXNG_IMAGE_PROXY=false

EXPOSE 7860

ENTRYPOINT ["/bin/sh", "/app/start.sh"]
