#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
VERSION=${1:-${GITHUB_REF_NAME#v}}
if [[ -z "${VERSION}" ]]; then
  echo "usage: $0 <version>" >&2
  exit 1
fi

VERSION=${VERSION#v}
BUILD_DIR="$ROOT_DIR/dist/release"
BIN_DIR="$BUILD_DIR/bin"
PKG_DIR="$BUILD_DIR/packages"
ARCHIVE_ROOT="$BUILD_DIR/archive-root"
RPM_TOPDIR="$BUILD_DIR/rpmbuild"
RPM_DBPATH="$RPM_TOPDIR/db"

rm -rf "$BUILD_DIR"
mkdir -p "$BIN_DIR" "$PKG_DIR" "$ARCHIVE_ROOT" "$RPM_TOPDIR"/{BUILD,BUILDROOT,RPMS,SOURCES,SPECS,SRPMS} "$RPM_DBPATH"

for tool in dpkg-deb rpmbuild sha256sum; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "missing required tool: $tool" >&2
    exit 1
  fi
done

LDFLAGS="-s -w -X main.version=${VERSION} -X main.commit=${GITHUB_SHA:-local} -X main.date=$(date -u +%Y-%m-%dT%H:%M:%SZ)"

CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags "$LDFLAGS" -o "$BIN_DIR/orcastack" "$ROOT_DIR"
(
  cd "$ROOT_DIR/orcastackapi"
  CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o "$BIN_DIR/orcastack-gateway" ./cmd/orcastack-gateway
)

cp "$ROOT_DIR/README.md" "$BUILD_DIR/README.md"
cp "$ROOT_DIR/LICENSE" "$BUILD_DIR/LICENSE"
cp "$ROOT_DIR/packaging/systemd/orcastack.service" "$BUILD_DIR/orcastack.service"

mkdir -p "$ARCHIVE_ROOT/orcastack"
cp "$BIN_DIR/orcastack" "$ARCHIVE_ROOT/orcastack/"
cp "$BIN_DIR/orcastack-gateway" "$ARCHIVE_ROOT/orcastack/"
cp "$BUILD_DIR/README.md" "$ARCHIVE_ROOT/orcastack/"
cp "$BUILD_DIR/LICENSE" "$ARCHIVE_ROOT/orcastack/"
mkdir -p "$ARCHIVE_ROOT/orcastack/etc/systemd/system"
cp "$BUILD_DIR/orcastack.service" "$ARCHIVE_ROOT/orcastack/etc/systemd/system/"

tar -C "$ARCHIVE_ROOT" -czf "$PKG_DIR/orcastack.tar.gz" orcastack

DEB_ROOT="$BUILD_DIR/deb-root"
mkdir -p "$DEB_ROOT/DEBIAN" "$DEB_ROOT/usr/bin" "$DEB_ROOT/usr/lib/orcastack" "$DEB_ROOT/usr/share/doc/orcastack" "$DEB_ROOT/etc/systemd/system"
cp "$BIN_DIR/orcastack" "$DEB_ROOT/usr/bin/"
cp "$BIN_DIR/orcastack-gateway" "$DEB_ROOT/usr/lib/orcastack/"
cp "$BUILD_DIR/README.md" "$DEB_ROOT/usr/share/doc/orcastack/README.md"
cp "$BUILD_DIR/LICENSE" "$DEB_ROOT/usr/share/doc/orcastack/LICENSE"
cp "$BUILD_DIR/orcastack.service" "$DEB_ROOT/etc/systemd/system/"
cat > "$DEB_ROOT/DEBIAN/control" <<EOF
Package: orcastack
Version: ${VERSION}
Section: admin
Priority: optional
Architecture: amd64
Maintainer: Atonix Corp <opensource@atonixcorp.com>
Description: ORCASTACK CI/CD automation gateway launcher and packaged service runtime.
EOF
dpkg-deb --build --root-owner-group "$DEB_ROOT" "$PKG_DIR/orcastack.deb"

tar -C "$ARCHIVE_ROOT/orcastack" -czf "$RPM_TOPDIR/SOURCES/orcastack-${VERSION}.tar.gz" .
cat > "$RPM_TOPDIR/SPECS/orcastack.spec" <<EOF
%global debug_package %{nil}
%undefine _missing_build_ids_terminate_build
Name: orcastack
Version: ${VERSION}
Release: 1%{?dist}
Summary: ORCASTACK CI/CD automation gateway launcher and packaged service runtime
License: Proprietary
BuildArch: x86_64
Source0: orcastack-${VERSION}.tar.gz

%description
ORCASTACK CI/CD automation gateway launcher and packaged service runtime.

%prep
%setup -q -c -T
tar -xzf %{SOURCE0}

%install
mkdir -p %{buildroot}/usr/bin %{buildroot}/usr/lib/orcastack %{buildroot}/usr/share/doc/orcastack %{buildroot}/etc/systemd/system
install -m 0755 orcastack %{buildroot}/usr/bin/orcastack
install -m 0755 orcastack-gateway %{buildroot}/usr/lib/orcastack/orcastack-gateway
install -m 0644 README.md %{buildroot}/usr/share/doc/orcastack/README.md
install -m 0644 LICENSE %{buildroot}/usr/share/doc/orcastack/LICENSE
install -m 0644 etc/systemd/system/orcastack.service %{buildroot}/etc/systemd/system/orcastack.service

%files
/usr/bin/orcastack
/usr/lib/orcastack/orcastack-gateway
/usr/share/doc/orcastack/README.md
/usr/share/doc/orcastack/LICENSE
/etc/systemd/system/orcastack.service
EOF
rpmbuild --define "_topdir ${RPM_TOPDIR}" --define "_dbpath ${RPM_DBPATH}" -bb "$RPM_TOPDIR/SPECS/orcastack.spec"
cp "$RPM_TOPDIR/RPMS/x86_64"/*.rpm "$PKG_DIR/orcastack.rpm"

pushd "$PKG_DIR" >/dev/null
sha256sum orcastack.deb > orcastack.deb.sha256
sha256sum orcastack.rpm > orcastack.rpm.sha256
sha256sum orcastack.tar.gz > orcastack.tar.gz.sha256
popd >/dev/null

if [[ -n "${GPG_KEY_ID:-}" ]]; then
  pushd "$PKG_DIR" >/dev/null
  gpg --batch --yes --armor --local-user "$GPG_KEY_ID" --detach-sign orcastack.deb
  gpg --batch --yes --armor --local-user "$GPG_KEY_ID" --detach-sign orcastack.rpm
  gpg --batch --yes --armor --local-user "$GPG_KEY_ID" --detach-sign orcastack.tar.gz
  popd >/dev/null
fi