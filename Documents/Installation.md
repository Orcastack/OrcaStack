# Installation

## Download options

ORCASTACK publishes these release artifacts for Linux distribution and manual installation:

- `orcastack.deb`
- `orcastack.rpm`
- `orcastack.tar.gz`
- `go install github.com/atonixcorp/orcastack@latest`

## Debian and Ubuntu

Manual package install:

```bash
sudo apt install ./orcastack.deb
```

APT repository install:

```bash
curl -fsSL https://atonixcorp.github.io/orcastack/apt/orcastack-archive-keyring.asc | sudo gpg --dearmor -o /usr/share/keyrings/orcastack-archive-keyring.gpg
echo 'deb [signed-by=/usr/share/keyrings/orcastack-archive-keyring.gpg] https://atonixcorp.github.io/orcastack/apt stable main' | sudo tee /etc/apt/sources.list.d/orcastack.list
sudo apt update
sudo apt install orcastack
```

## RPM distributions

```bash
sudo rpm -i orcastack.rpm
```

## Tarball

```bash
tar -xvf orcastack.tar.gz
cd orcastack
sudo install -m 0755 orcastack /usr/bin/orcastack
sudo install -m 0755 orcastack-gateway /usr/lib/orcastack/orcastack-gateway
sudo install -m 0644 etc/systemd/system/orcastack.service /etc/systemd/system/orcastack.service
```

## Go install

```bash
go install github.com/atonixcorp/orcastack@latest
```

The installed `orcastack` binary is the platform launcher. Package-based installs also ship the packaged `orcastack-gateway` service binary used by `orcastack serve`.

## Systemd service

All Linux package formats include `/etc/systemd/system/orcastack.service`.

```bash
sudo systemctl daemon-reload
sudo systemctl enable orcastack
sudo systemctl start orcastack
sudo systemctl status orcastack
```

## Verification

Every tagged release publishes SHA-256 checksum files and detached GPG signatures:

- `orcastack.deb.sha256`
- `orcastack.rpm.sha256`
- `orcastack.tar.gz.sha256`
- `orcastack.deb.asc`
- `orcastack.rpm.asc`
- `orcastack.tar.gz.asc`