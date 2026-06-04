# Installation

## Download options

GITORC publishes these release artifacts for Linux distribution and manual installation:

- `gitorc.deb`
- `gitorc.rpm`
- `gitorc.tar.gz`
- `go install github.com/atonixcorp/gitorc@latest`

## Debian and Ubuntu

Manual package install:

```bash
sudo apt install ./gitorc.deb
```

APT repository install:

```bash
curl -fsSL https://atonixcorp.github.io/gitorc/apt/gitorc-archive-keyring.asc | sudo gpg --dearmor -o /usr/share/keyrings/gitorc-archive-keyring.gpg
echo 'deb [signed-by=/usr/share/keyrings/gitorc-archive-keyring.gpg] https://atonixcorp.github.io/gitorc/apt stable main' | sudo tee /etc/apt/sources.list.d/gitorc.list
sudo apt update
sudo apt install gitorc
```

## RPM distributions

```bash
sudo rpm -i gitorc.rpm
```

## Tarball

```bash
tar -xvf gitorc.tar.gz
cd gitorc
sudo install -m 0755 gitorc /usr/bin/gitorc
sudo install -m 0755 gitorc-gateway /usr/lib/gitorc/gitorc-gateway
sudo install -m 0644 etc/systemd/system/gitorc.service /etc/systemd/system/gitorc.service
```

## Go install

```bash
go install github.com/atonixcorp/gitorc@latest
```

The installed `gitorc` binary is the platform launcher. Package-based installs also ship the packaged `gitorc-gateway` service binary used by `gitorc serve`.

## Systemd service

All Linux package formats include `/etc/systemd/system/gitorc.service`.

```bash
sudo systemctl daemon-reload
sudo systemctl enable gitorc
sudo systemctl start gitorc
sudo systemctl status gitorc
```

## Verification

Every tagged release publishes SHA-256 checksum files and detached GPG signatures:

- `gitorc.deb.sha256`
- `gitorc.rpm.sha256`
- `gitorc.tar.gz.sha256`
- `gitorc.deb.asc`
- `gitorc.rpm.asc`
- `gitorc.tar.gz.asc`