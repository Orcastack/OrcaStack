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

CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags "$LDFLAGS" -o "$BIN_DIR/gitorc" "$ROOT_DIR"
(
  cd "$ROOT_DIR/gitorcapi"
  CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o "$BIN_DIR/gitorc-gateway" ./cmd/gitorc-gateway
)

cp "$ROOT_DIR/README.md" "$BUILD_DIR/README.md"
cp "$ROOT_DIR/LICENSE" "$BUILD_DIR/LICENSE"
cp "$ROOT_DIR/packaging/systemd/gitorc.service" "$BUILD_DIR/gitorc.service"

mkdir -p "$ARCHIVE_ROOT/gitorc"
cp "$BIN_DIR/gitorc" "$ARCHIVE_ROOT/gitorc/"
cp "$BIN_DIR/gitorc-gateway" "$ARCHIVE_ROOT/gitorc/"
cp "$BUILD_DIR/README.md" "$ARCHIVE_ROOT/gitorc/"
cp "$BUILD_DIR/LICENSE" "$ARCHIVE_ROOT/gitorc/"
mkdir -p "$ARCHIVE_ROOT/gitorc/etc/systemd/system"
cp "$BUILD_DIR/gitorc.service" "$ARCHIVE_ROOT/gitorc/etc/systemd/system/"

tar -C "$ARCHIVE_ROOT" -czf "$PKG_DIR/gitorc.tar.gz" gitorc

DEB_ROOT="$BUILD_DIR/deb-root"
mkdir -p "$DEB_ROOT/DEBIAN" "$DEB_ROOT/usr/bin" "$DEB_ROOT/usr/lib/gitorc" "$DEB_ROOT/usr/share/doc/gitorc" "$DEB_ROOT/etc/systemd/system"
cp "$BIN_DIR/gitorc" "$DEB_ROOT/usr/bin/"
cp "$BIN_DIR/gitorc-gateway" "$DEB_ROOT/usr/lib/gitorc/"
cp "$BUILD_DIR/README.md" "$DEB_ROOT/usr/share/doc/gitorc/README.md"
cp "$BUILD_DIR/LICENSE" "$DEB_ROOT/usr/share/doc/gitorc/LICENSE"
cp "$BUILD_DIR/gitorc.service" "$DEB_ROOT/etc/systemd/system/"
cat > "$DEB_ROOT/DEBIAN/control" <<EOF
Package: gitorc
Version: ${VERSION}
Section: admin
Priority: optional
Architecture: amd64
Maintainer: Atonix Corp <opensource@atonixcorp.com>
Description: GITORC CI/CD automation gateway launcher and packaged service runtime.
EOF
dpkg-deb --build --root-owner-group "$DEB_ROOT" "$PKG_DIR/gitorc.deb"

tar -C "$ARCHIVE_ROOT/gitorc" -czf "$RPM_TOPDIR/SOURCES/gitorc-${VERSION}.tar.gz" .
cat > "$RPM_TOPDIR/SPECS/gitorc.spec" <<EOF
%global debug_package %{nil}
%undefine _missing_build_ids_terminate_build
Name: gitorc
Version: ${VERSION}
Release: 1%{?dist}
Summary: GITORC CI/CD automation gateway launcher and packaged service runtime
License: Proprietary
BuildArch: x86_64
Source0: gitorc-${VERSION}.tar.gz

%description
GITORC CI/CD automation gateway launcher and packaged service runtime.

%prep
%setup -q -c -T
tar -xzf %{SOURCE0}

%install
mkdir -p %{buildroot}/usr/bin %{buildroot}/usr/lib/gitorc %{buildroot}/usr/share/doc/gitorc %{buildroot}/etc/systemd/system
install -m 0755 gitorc %{buildroot}/usr/bin/gitorc
install -m 0755 gitorc-gateway %{buildroot}/usr/lib/gitorc/gitorc-gateway
install -m 0644 README.md %{buildroot}/usr/share/doc/gitorc/README.md
install -m 0644 LICENSE %{buildroot}/usr/share/doc/gitorc/LICENSE
install -m 0644 etc/systemd/system/gitorc.service %{buildroot}/etc/systemd/system/gitorc.service

%files
/usr/bin/gitorc
/usr/lib/gitorc/gitorc-gateway
/usr/share/doc/gitorc/README.md
/usr/share/doc/gitorc/LICENSE
/etc/systemd/system/gitorc.service
EOF
rpmbuild --define "_topdir ${RPM_TOPDIR}" --define "_dbpath ${RPM_DBPATH}" -bb "$RPM_TOPDIR/SPECS/gitorc.spec"
cp "$RPM_TOPDIR/RPMS/x86_64"/*.rpm "$PKG_DIR/gitorc.rpm"

pushd "$PKG_DIR" >/dev/null
sha256sum gitorc.deb > gitorc.deb.sha256
sha256sum gitorc.rpm > gitorc.rpm.sha256
sha256sum gitorc.tar.gz > gitorc.tar.gz.sha256
popd >/dev/null

if [[ -n "${GPG_KEY_ID:-}" ]]; then
  pushd "$PKG_DIR" >/dev/null
  gpg --batch --yes --armor --local-user "$GPG_KEY_ID" --detach-sign gitorc.deb
  gpg --batch --yes --armor --local-user "$GPG_KEY_ID" --detach-sign gitorc.rpm
  gpg --batch --yes --armor --local-user "$GPG_KEY_ID" --detach-sign gitorc.tar.gz
  popd >/dev/null
fi