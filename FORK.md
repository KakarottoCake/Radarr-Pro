# What this fork changes

The reasoning behind each of Radarr Pro's changes, and the trade-offs they carry.
[README.md](README.md) covers what the features are and how to install; this file
covers why they work the way they do.

Everything is additive: an untouched install behaves like upstream, because every
new behaviour is either off by default, opt-in, or defaults to the path that
already existed. The two exceptions are deliberate and listed under *Downloading*
and *What's removed*.

Forked from upstream `develop` at `0a097de`. Features are ported from
[Sonarr Pro](https://github.com/KakarottoCake/Sonarr-Pro) and adapted for movies;
Sonarr Pro's TV-only features (alternative metadata sources, episode orderings,
multi-season packs, season pack trimming) have no movie equivalent and are not here.

---

## Downloading

### Fake release filtering — on by default

Radarr fetches the `.torrent` before handing it to the download client, and that
file lists everything inside. Four shapes are rejected before anything reaches the
client:

- a media extension followed by an executable one, such as `Movie.mkv.exe`
- executables, installers or scripts
- archives with no video alongside a file advertising a password
- neither video nor archives, so nothing to import

Split RAR sets with no loose video pass; the password rule only fires when video is
absent too. If the file list cannot be read the grab proceeds — a safety net, not a
gate. BEP-47 padding files are ignored.

`FakeReleaseException` derives from `ReleaseBlockedException`, not
`ReleaseDownloadException`, so an indexer is never penalised (and eventually
disabled) for carrying a release it didn't create. The rejection reason is returned
to interactive search so the card says *why*.

Usenet has no pre-grab file list and is unaffected.

### Grabs that fail are reported as failures

Upstream's torrent-file path had two problems. A blocked release could fall back to
its magnet link (which is the same content), and the magnet fallback condition was
inverted: with no magnet available, a failed `.torrent` fetch was swallowed, the
client returned `null`, and Radarr logged and published the grab as sent. Blocked
releases now always fail, and other failures only fall back when a magnet exists.
This is the one behaviour change that applies with every setting at its default.

### qBittorrent download reuse

When a grabbed release is already loaded in qBittorrent (API v2.3+), Radarr adds the
tag `radarr-pro-reuse-<category>` and tracks it in place instead of adding it again.
Torrents carrying that tag are listed even though they sit in another category, are
never moved or removed (`CanMoveFiles`/`CanBeRemoved` are false and `RemoveItem`
refuses), and skip the post-import category change. The tag is scoped to the
instance's category so two Radarr instances never claim each other's reuse.

Older qBittorrent versions keep the previous add behaviour.

### Blocklisting from interactive search (Radarr#5911)

`POST /api/v3/release/blocklist` takes the same `guid`/`indexerId` as a grab, looks
the release up in the interactive search cache, and blocklists it for the movie
without downloading anything.

---

## Library

### Compression

Radarr never runs an encoder, accepts a filesystem path from the browser, or needs
the Docker socket. `MovieCompressionController` only forwards four authenticated
calls (`capabilities`, status, start, cancel) to an optional worker over a private
Unix socket. The worker runs on the host as the media user, reads Radarr's API key
from `config.xml`, and only ever touches files Radarr reports for that movie.

Safety rules, all enforced by `docker/compression/test_worker.py`:

- the file must resolve inside its movie folder and a configured media root
- HDR, high bit-depth, HEVC/AV1, multiple video streams and cover art are skipped
- output must save at least 2%, keep duration, dimensions, every stream, language,
  disposition and chapter, and fully decode before it replaces the original
- the source and its Radarr association are rechecked at the commit boundary
- replacement is an atomic rename, so hard-linked torrent originals keep seeding

When anything was compressed the worker asks Radarr for a `RescanMovie`, which
refreshes sizes and media info without a metadata refresh or search.

### Folder renaming and `{Plex Id}`

The edit dialog only edits the last path segment, so a rename can't accidentally
move a movie to another parent. *Use Naming Format* fills the segment from
`/api/v3/movie/{id}/folder`. Saving still asks whether to move the files, as any path
change does.

`{Plex Id}` prefers `{tmdb-…}` because TMDb is Radarr's own identifier and is
always present; `{imdb-…}` is used only when no TMDb id exists and the IMDb id is
well formed. An empty token leaves no stray braces.

### Change File Date also sets the folder date (Radarr#1880)

The disk provider cannot read a folder's own timestamp (it reports the newest file
inside), so the folder date is simply set alongside the file date on each rescan.

---

## Interface

- **Interactive search** shows cards instead of a fourteen-column table, which made
  rejections and flags hover-only and was unusable on a phone. Cards collapse with
  container queries, so they respond to the modal's width rather than the window's.
- **Mobile navigation** replaces the hamburger with a bottom bar and turns every
  toolbar menu into a bottom sheet on small screens. The sidebar is still reachable
  through *More*.
- **Path filter**, **sticky table headers** (Radarr#5813), **next/previous that follow
  the current filter** (Radarr#11456), **interactive search from the index**
  (Radarr#10620), **collection links** (Radarr#9235) and **Rotten Tomatoes /
  Metacritic links** (Radarr#6764) are small, independent changes.

---

## What's removed

Radarr Pro ships as a Docker image and updates with `docker pull`, so:

- the update provider never offers a package and the scheduled update check is gone
  (anything offered would be upstream Radarr, replacing this build);
- Sentry crash reporting is not registered, backend or browser;
- the server-side notification health check no longer calls radarr.servarr.com.

Movie metadata still goes through Radarr's metadata service, exactly as upstream.

---

## Notes for whoever works on this next

- **Build the solution.** Building a bare `.csproj` drops the StyleCop configuration
  and fails on every `using`. `TreatWarningsAsErrors` is on.
- **`Radarr.Api.V3` has its own `System` namespace.** Use `global::System.IO` there.
- The Servarr NuGet feeds (FFMpegCore, FFprobe, Mono.Posix) are on Azure DevOps; a
  sandbox without access to `pkgs.dev.azure.com` cannot restore the solution.
- Six Core tests fail on upstream `develop` without network access or a real
  `ffprobe`; they fail identically here. Don't chase them as regressions.
