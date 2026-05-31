#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
VERSION=${1:-${GITHUB_REF_NAME#v}}
if [[ -z "${VERSION}" ]]; then
  echo "usage: $0 <version>" >&2
  exit 1
fi

DIST_DIR="$ROOT_DIR/dist/release"
APT_DIR="$DIST_DIR/apt"
POOL_DIR="$APT_DIR/pool/main/g/gitorc"
PKG_FILE="$DIST_DIR/packages/gitorc.deb"
LIST_FILE="$ROOT_DIR/packaging/apt/gitorc.list"

mkdir -p "$POOL_DIR" "$APT_DIR/dists/stable/main/binary-amd64"
cp "$PKG_FILE" "$POOL_DIR/gitorc_${VERSION}_amd64.deb"
cp "$LIST_FILE" "$APT_DIR/gitorc.list"

pushd "$APT_DIR" >/dev/null
dpkg-scanpackages --multiversion pool > dists/stable/main/binary-amd64/Packages
gzip -9c dists/stable/main/binary-amd64/Packages > dists/stable/main/binary-amd64/Packages.gz
apt-ftparchive release dists/stable > dists/stable/Release

if [[ -n "${GPG_KEY_ID:-}" ]]; then
  gpg --batch --yes --local-user "$GPG_KEY_ID" --armor --detach-sign -o dists/stable/Release.gpg dists/stable/Release
  gpg --batch --yes --local-user "$GPG_KEY_ID" --clearsign -o dists/stable/InRelease dists/stable/Release
  gpg --batch --yes --armor --export "$GPG_KEY_ID" > gitorc-archive-keyring.asc
fi
popd >/dev/null