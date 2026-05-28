# Releasing `@autosend/convex`

This package publishes to npm via a **GitHub Actions OIDC Trusted Publisher** with a required-reviewer environment gate. No long-lived `NPM_TOKEN` exists or is needed.

## Who can release

Anyone can **propose** a release by opening a PR that bumps the version and updates the changelog. Only repo collaborators with **push access to tags** can trigger the workflow, and only **`npm-publish` environment reviewers** can approve the actual publish step.

## Release steps

1. **Bump the version**
   - Update `version` in `package.json` (semver).
   - Update `README.md` / changelog with notable changes.
   - Open a PR, get review, merge to `main`.

2. **Tag the release** (after the version-bump commit lands on `main`)
   ```bash
   git checkout main
   git pull --ff-only
   git tag v0.4.2 # match the version in package.json
   git push origin v0.4.2
   ```
   For prereleases, use a semver-prerelease tag like `v0.4.2-rc.0`. The workflow auto-detects the prerelease identifier (`rc`, `beta`, etc.) and publishes under that dist-tag so `latest` keeps pointing at the most recent stable.

3. **Approve the publish**
   - The push triggers `.github/workflows/publish.yml`.
   - The job pauses at the `npm-publish` environment gate.
   - An environment reviewer opens the run → **Review deployments → Approve and deploy**.
   - On approval: typecheck, tests, build, then `npm publish --provenance`.

4. **Verify**
   ```bash
   npm view @autosend/convex version          # should match the tag
   npm view @autosend/convex dist-tags        # `latest` for stable, `rc`/`beta`/… for prereleases
   npm view @autosend/convex dist.signatures  # provenance signature present
   ```

## What protects the supply chain

| Layer | Guarantee |
|---|---|
| `id-token: write` only on `publish.yml` | Other workflows can't impersonate the publisher |
| Trusted Publisher bound to repo + workflow + environment on npmjs.com | A fork or a different workflow can't publish, even with a valid OIDC token |
| Required reviewers on `npm-publish` env | Human approval is required for every publish, even for a tag push by a collaborator |
| Tag↔`package.json` version check | A mistagged release fails before `npm publish` runs |
| `--provenance` on publish | Sigstore transparency log entry binding the tarball to this repo + commit |

## Troubleshooting

- **`npm publish` exits with 404 / "Not Found"** — almost always an OIDC failure. Check that:
  - The Trusted Publisher on npmjs.com has `repository = autosendhq/autosend-convex`, `workflow filename = publish.yml`, `environment = npm-publish`.
  - The workflow's `npm install -g npm@latest` step ran (Trusted Publishers requires npm ≥ 11.5.1; Node ships with npm 10 which silently fails the exchange).
  - The job's `environment:` matches the npm config.
- **"You must specify a tag using --tag when publishing a prerelease version"** — the version contains `-` but the workflow didn't pass `--tag`. Should be auto-handled; if it fails, verify the regex in the publish step still matches your version format.
- **"Tag version does not match package.json version"** — the tag was created without bumping `version`, or the bump wasn't pushed to `main` before tagging. Delete the tag (`git tag -d vX.Y.Z && git push origin :refs/tags/vX.Y.Z`) and start over.
- **Workflow doesn't start at all** — tags must match `v*`. `release-1.0` won't trigger.

---

## One-time setup (maintainers only)

These steps configure the publish pipeline. They must be done **once** by a repo admin + npm package owner. Order matters — the npm side must reference an environment that exists on GitHub.

### 1. GitHub: create the `npm-publish` environment

Repo → **Settings → Environments → New environment** → name it `npm-publish`.

Configure:
- **Required reviewers**: add every maintainer who is allowed to approve a release.
- **Prevent self-review** (recommended for multi-maintainer projects): the reviewer cannot be the same person who pushed the tag.
- **Allow administrators to bypass configured protection rules**: uncheck for stricter enforcement.
- **Deployment branches and tags** → **Selected branches and tags** → add a rule:
  - Ref type: **Tag**
  - Pattern: `v*`

### 2. (Recommended) GitHub: protect `main`

Repo → **Settings → Branches → Add branch protection rule** for `main`:
- Require pull request before merging
- Require status check **CI / Lint, typecheck, test, build** to pass
- (Optional) Require signed commits

### 3. npmjs.com: add the Trusted Publisher

Sign in to npm as an account with publish rights on `@autosend/convex`. Then:

`@autosend/convex` package page → **Settings → Trusted Publishers → Add publisher** → GitHub Actions.

| Field | Value |
|---|---|
| Repository owner | `autosendhq` |
| Repository name | `autosend-convex` |
| Workflow filename | `publish.yml` |
| Environment | `npm-publish` |

### 4. Verify the wiring with a dry run

1. Bump to a prerelease in a branch (e.g. `0.4.2-rc.0`), merge, tag `v0.4.2-rc.0`, push the tag.
2. Watch the workflow pause at the environment gate. Approve.
3. Confirm: `npm view @autosend/convex@0.4.2-rc.0 dist.signatures` shows a sigstore signature.
4. Clean up: `npm unpublish @autosend/convex@0.4.2-rc.0` (within 72 hours), `git tag -d v0.4.2-rc.0 && git push origin :refs/tags/v0.4.2-rc.0`, revert the version bump.

### Rotating maintainers

- **Adding/removing a reviewer**: Settings → Environments → `npm-publish` → adjust required reviewers list. npm only knows the workflow identity, not individual humans, so npm config doesn't change.
- **Transferring the repo**: the Trusted Publisher on npm is keyed on `<owner>/<repo>`. After any rename/transfer, update the npm Trusted Publisher entry to match the new slug, or the next publish will fail with a 404.
