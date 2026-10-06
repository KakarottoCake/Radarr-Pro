# syntax=docker/dockerfile:1

# Radarr Pro
#
# Three stages: the React UI, the .NET backend, then a runtime image holding only
# the published output. Building the UI separately means a backend-only change does
# not reinstall node_modules, and vice versa.

# ---------------------------------------------------------------------------
# UI
# ---------------------------------------------------------------------------
FROM node:22-bookworm AS ui

WORKDIR /src

# Copy the manifests alone first so the dependency layer is reused whenever
# application source changes but dependencies do not.
COPY package.json yarn.lock .yarnrc ./
RUN yarn install --frozen-lockfile --network-timeout 600000

COPY tsconfig.json ./
COPY frontend/ ./frontend/

# --env production is required: without it webpack emits eval source maps and the
# UI loads as a blank page.
RUN yarn build --env production

# ---------------------------------------------------------------------------
# Backend
# ---------------------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/sdk:8.0-noble AS backend

ARG TARGETARCH
WORKDIR /src

COPY . .

# global.json pins an exact SDK. If the base image carries a different 8.0 feature
# band, install the pinned one next to it rather than editing global.json.
RUN set -eux; \
    wanted="$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' global.json)"; \
    if ! dotnet --list-sdks | grep -q "^${wanted} "; then \
      curl -sSL https://dot.net/v1/dotnet-install.sh -o /tmp/dotnet-install.sh; \
      bash /tmp/dotnet-install.sh --version "${wanted}" --install-dir /usr/share/dotnet; \
    fi; \
    dotnet --version

# Map Docker's architecture names onto the .NET runtime identifiers, then build the
# way upstream's build.sh does. SelfContained keeps the runtime with the app so the
# final image needs no SDK.
#
# Platform is Posix for every Linux target. It names the OS family, not the CPU; the
# architecture is carried by RuntimeIdentifiers instead.
RUN set -eux; \
    case "${TARGETARCH}" in \
      amd64) RID=linux-x64   ;; \
      arm64) RID=linux-arm64 ;; \
      *) echo "Unsupported architecture: ${TARGETARCH}" >&2; exit 1 ;; \
    esac; \
    dotnet msbuild -restore src/Radarr.sln \
      -p:SelfContained=true \
      -p:Configuration=Release \
      -p:Platform=Posix \
      -p:RuntimeIdentifiers="${RID}" \
      -t:PublishAllRids; \
    mkdir -p /app; \
    cp -r "_output/net8.0/${RID}/publish/." /app/

# The UI is built separately and is not produced by the .NET build.
COPY --from=ui /src/_output/UI /app/UI

# The publish output carries assemblies a Linux image can never use. Radarr.Update
# goes too, because updating happens through Docker here.
RUN set -eux; \
    rm -rf /app/Radarr.Update; \
    rm -f /app/Radarr.Windows.*; \
    rm -f /app/ServiceInstall.* /app/ServiceUninstall.*; \
    chmod +x /app/Radarr; \
    find /app -name ffprobe -exec chmod +x {} \;

# ---------------------------------------------------------------------------
# Runtime
# ---------------------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/runtime-deps:8.0-noble AS runtime

# runtime-deps already carries ICU, ca-certificates and tzdata. gosu drops
# privileges in the entrypoint; libsqlite3-0 backs the database.
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
      gosu \
      libsqlite3-0; \
    rm -rf /var/lib/apt/lists/*

COPY --from=backend /app /app
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# This image is a binary distribution of GPLv3 software, so it carries its licence
# and a pointer to the corresponding source.
COPY LICENSE /app/LICENSE

# /config holds the database, config.xml and logs. Everything else is media.
VOLUME ["/config"]
EXPOSE 7878

ENV XDG_CONFIG_HOME=/config \
    PUID=1000 \
    PGID=1000 \
    TZ=Etc/UTC \
    COMPlus_EnableDiagnostics=0

ENTRYPOINT ["/entrypoint.sh"]
CMD ["/app/Radarr", "-nobrowser", "-data=/config"]

LABEL org.opencontainers.image.title="Radarr Pro" \
      org.opencontainers.image.description="A fork of Radarr with fake release filtering, qBittorrent download reuse, per-movie compression, Plex-friendly folder naming and a responsive UI." \
      org.opencontainers.image.source="https://github.com/KakarottoCake/Radarr-Pro" \
      org.opencontainers.image.licenses="GPL-3.0-only"
