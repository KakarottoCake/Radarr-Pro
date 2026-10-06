# Radarr Pro

A fork of [Radarr](https://github.com/Radarr/Radarr) that carries over the downloading, library and interface improvements from [Sonarr Pro](https://github.com/KakarottoCake/Sonarr-Pro), adapted for movies, and ships as a single Docker image.

> **Unofficial.** Radarr Pro is not affiliated with, endorsed by, or supported by the Radarr project. Please don't raise Radarr Pro problems on Radarr's issue tracker, forums, or Discord — they can't help with code they didn't write. Report them [here](https://github.com/KakarottoCake/Radarr-Pro/issues) instead.

## Built with AI, and not quiet about it

This fork was written with Claude, the same way Sonarr Pro was, and the commit trailers say so. It isn't a pull request upstream for the same reason Sonarr Pro isn't: Radarr's maintainers have their own position on AI-assisted contributions, and forking means nobody upstream has to review, maintain or support any of this.

Radarr is excellent, this is built entirely on their work, and it's only possible because they made it GPL.

---

## What's added

**Fake release filtering** — the `.torrent` file is inspected before it reaches your download client, rejecting `Movie.mkv.exe`, bare executables and installers, password-bait archives with no video, and torrents with nothing importable. Split RAR sets pass. On by default (Settings → Indexers), and every rejection says exactly why — in the log and on the release in interactive search.

**qBittorrent download reuse** — if a release you grab is already loaded in qBittorrent (from another instance, or added by hand), Radarr tags it `radarr-pro-reuse-<category>` and imports from it in place instead of adding it again. Its category, save path and seeding are left alone and Radarr never moves or removes it.

**Per-movie compression** — a *Save space* panel on each movie page re-encodes its file through an optional host worker (FFmpeg on the host, Intel VAAPI if available), with persistent progress, cancellation and per-file results. Every encode is fully validated before the original is replaced, HDR and already-efficient codecs are skipped, and hard-linked torrent originals stay intact. See [docker/compression/README.md](docker/compression/README.md).

**Easy folder renaming and Plex IDs** — rename a movie's folder from its edit dialog without touching the parent path, or fill in the name from your naming format in one click. A new `{Plex Id}` token emits `{tmdb-603}` (or `{imdb-tt0133093}`), with a Plex-friendly preset in the naming dialog.

**Path filter** — filter the movie index by drive or library folder.

**Interactive search, redesigned** — releases are shown as responsive cards with clear Ready/Rejected status, a title/indexer text filter, a sort picker, large Download / Choose Movie buttons, and a one-click **Blocklist Release**.

**Mobile navigation** — a bottom bar for Movies, Calendar, Wanted and Queue, bottom-sheet menus with real touch targets, sticky header, safe-area support.

### Requested upstream, done here

| Upstream issue | What changed |
|---|---|
| [Radarr#5911](https://github.com/Radarr/Radarr/issues/5911) | Blocklist a release straight from interactive search |
| [Radarr#10620](https://github.com/Radarr/Radarr/issues/10620) | Interactive search from the movie index (posters, overview, table) |
| [Radarr#11456](https://github.com/Radarr/Radarr/issues/11456) | Next/previous movie follows the index's current filter and sort |
| [Radarr#5813](https://github.com/Radarr/Radarr/issues/5813) | Movie table column headers stay visible while scrolling |
| [Radarr#9235](https://github.com/Radarr/Radarr/issues/9235) | Collection name on the movie page links to that collection |
| [Radarr#6764](https://github.com/Radarr/Radarr/issues/6764) | Rotten Tomatoes and Metacritic in the movie links |
| [Radarr#1880](https://github.com/Radarr/Radarr/issues/1880) | Change File Date also sets the movie folder's date |

Also fixed: a grab whose `.torrent` failed to download (or was blocked) with no magnet fallback used to be reported as *sent to the download client*. It now fails with the real reason.

Full reasoning and trade-offs are in [FORK.md](FORK.md).

## What's removed

Radarr Pro doesn't contact Radarr's servers for updates, crash reports (backend or browser), or announcements. Those endpoints describe upstream Radarr builds, so an update offered there would replace this program with a different one — and the Radarr team shouldn't receive crash reports or install metrics for a fork they don't maintain. Updates happen through Docker instead. Movie metadata still comes through Radarr's metadata service exactly as upstream.

---

## Getting started

You need [Docker](https://docs.docker.com/get-docker/).

### Quick start

```bash
docker run -d --name radarr-pro -p 7979:7878 -e PUID=1000 -e PGID=1000 -e TZ=Etc/UTC -v radarr-pro-config:/config -v /path/to/media:/media --restart unless-stopped ghcr.io/kakarottocake/radarr-pro:latest
```

Then open **http://localhost:7979**. Upstream Radarr can keep using port 7878.

### Or with Compose

Grab [`docker-compose.yml`](docker-compose.yml), edit the media path, and run `docker compose up -d`. Set `RADARR_PRO_PORT` to change the host port. Keep this Compose project and its `/config` separate from upstream Radarr, and give each instance its own download category.

### Updating

```bash
docker compose pull && docker compose up -d
```

Your database and settings live in `/config` and survive the upgrade.

### Settings that matter

| Variable | Default | What it does |
|---|---|---|
| `PUID` / `PGID` | `1000` | The user files are written as. Use the numbers from `id` on the host. |
| `TZ` | `Etc/UTC` | Timezone for scheduled tasks and logs. |
| `UMASK` | `022` | File permission mask. `UMASK_SET` is also accepted. |
| `RADARR_COMPRESSION_SOCKET` | `/compression/worker.sock` | Where Radarr looks for the optional compression worker. |

Mount your download client's completed folder and your library under a **single** `/media` parent so imports are instant moves rather than copies.

### Coming from Radarr

The config directory layout is unchanged, so pointing Radarr Pro's `/config` at a **copy** of an existing Radarr config works. Copy it, don't move it, and keep the original until you're satisfied.

---

## Contributing

Contributions are welcome, including AI-assisted ones. Explain the reasoning, say what you actually verified, and run `dotnet build src/Radarr.sln`, `yarn lint` and `yarn stylelint-linux` first — CI runs them anyway. See [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md).

### Building locally

```bash
dotnet build src/Radarr.sln -c Debug
yarn install && yarn build --env production
```

Build the **solution**, not individual project files — `Directory.Build.props` loads `stylecop.json` through `$(SolutionDir)`. `--env production` is not optional for the UI: without it webpack emits eval source maps and the UI loads as a blank page.

---

## License

[GPL-3.0](LICENSE), the same as upstream Radarr. Radarr Pro is a derivative work of [Radarr](https://github.com/Radarr/Radarr), copyright the Radarr contributors, whose copyright notices are retained.
