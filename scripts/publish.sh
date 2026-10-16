#!/usr/bin/env bash
# Publishes each package whose version is not on the registry yet, schema first.
#
# `pnpm pack` writes the manifest that ships (`publishConfig.exports`, `workspace:^` resolved);
# `npm publish` uploads it, because npm is the client npm's trusted publishing supports.
set -euo pipefail

out="$(mktemp -d)"
for dir in packages/schema packages/react; do
  name="$(node -p "require('./$dir/package.json').name")"
  version="$(node -p "require('./$dir/package.json').version")"
  if npm view "$name@$version" version >/dev/null 2>&1; then
    echo "$name@$version is already published"
    continue
  fi
  tarball="$(cd "$dir" && pnpm pack --pack-destination "$out" | tail -n 1)"
  npm publish "$tarball" --access public
done
