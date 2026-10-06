# Contributing to Radarr Pro

Contributions are welcome, **including AI-assisted ones**. There's no CLA and no
template to fill in.

What's asked instead:

- **Explain the reasoning, not just the change.** Say what broke and why this is the
  right fix.
- **Say what you actually verified** — "compiles", "tests pass", or "ran it and
  watched it work". Claiming more than you did is the one thing that isn't fine.
- **Check upstream first.** If a bug also exists in upstream Radarr, it's usually
  better fixed there; if you fix it here, say so in the commit.
- Run `dotnet build src/Radarr.sln`, `yarn lint` and `yarn stylelint-linux` before
  opening a pull request. CI runs them, the Core tests and the compression worker
  tests anyway.

## Building

```bash
dotnet build src/Radarr.sln -c Debug
yarn install && yarn build --env production
```

Run the app from `_output/net8.0/` with `./Radarr -nobrowser -data=/some/folder`
after copying `_output/UI` next to it.

## Tests

```bash
dotnet test src/NzbDrone.Core.Test/Radarr.Core.Test.csproj --no-build \
  --filter "Category!=ManualTest&Category!=WINDOWS&Category!=IntegrationTest&Category!=AutomationTest"
python3 docker/compression/test_worker.py
```

See [AGENTS.md](AGENTS.md) for the traps specific to this fork and [FORK.md](FORK.md)
for why things work the way they do.
