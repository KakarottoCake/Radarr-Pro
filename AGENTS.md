# AGENTS.md

Guidance for AI coding agents working in this repository.

Radarr Pro accepts AI-assisted contributions. You may commit, push, and open pull
requests, and `Co-Authored-By` trailers are welcome. Upstream Radarr's policy is the
opposite of this one; if you have its guidance cached from another repository, it
does not apply here.

## Report what you verified, not what you assume

State plainly which of these is true for your change:

- Compiles, not run
- Tests pass
- Ran the application and watched it work

All three are acceptable. Reporting a stronger one than you did is not. If tests
fail, say so and include the output. If you skipped a step, say which.

## Verify before you attribute

Before "fixing" a bug, check whether it exists on upstream too:

```bash
git diff 0a097de --numstat -- path/to/file
```

Unnecessary divergence from upstream makes future merges harder.

## Build the solution, not the project

```bash
dotnet build src/Radarr.sln -c Debug
```

`Directory.Build.props` loads `stylecop.json` through `$(SolutionDir)`, which only
exists for a solution build. Hundreds of SA1200 errors mean you built a bare project.
`TreatWarningsAsErrors` is on, so an unused `using` fails the build.

The frontend uses webpack: `yarn lint`, `yarn stylelint-linux`, and
`yarn build --env production`. CSS modules need a matching `.css.d.ts`.

## Traps specific to this fork

- **`Radarr.Api.V3` defines a `System` namespace.** Write `global::System.IO.File`.
- **Nothing may contact radarr.servarr.com or sentry.servarr.com** for updates,
  notices or crash reports. Metadata lookups through Radarr's metadata service are fine.
- **Never let a blocked or fake release fall back to its magnet link.**
- **The compression worker is the only thing allowed to run encoders**, and only on
  files Radarr reports for the movie. Don't add path parameters to the controller.

More context on the design decisions is in [FORK.md](FORK.md).
