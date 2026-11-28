#!/bin/bash
set -euo pipefail
root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)
cd "$root"
source /etc/os-release
if [[ "$ID" != debian || "$VERSION_ID" != 12 || "$(dpkg --print-architecture)" != amd64 ]]; then
    echo 'Construí este paquete en Debian 12 amd64.' >&2
    exit 1
fi

manifest=desktop/src-tauri/Cargo.toml
version=$(sed -n 's/^version = "\([^"]*\)"/\1/p' "$manifest")
[[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+-alpha\.[0-9]+$ ]]
version=${version/-alpha./~alpha.}
target=$(mktemp -d)
trap 'rm -rf -- "$target"' EXIT
cargo build --manifest-path "$manifest" --release --target-dir "$target/build"

stage=$target/stage
install -d "$stage/DEBIAN" "$stage/usr/share/sim-desktop" "$stage/usr/share/doc/sim-desktop"
install -Dm755 "$target/build/release/sim-desktop" "$stage/usr/lib/sim-desktop/sim-desktop"
install -Dm755 desktop/debian/sim-desktop "$stage/usr/bin/sim-desktop"
install -Dm644 desktop/debian/ar.lemeit.sim.desktop "$stage/usr/share/applications/ar.lemeit.sim.desktop"
install -Dm644 desktop/debian/ar.lemeit.sim.desktop.xml "$stage/usr/share/mime/packages/ar.lemeit.sim.desktop.xml"
install -Dm644 desktop/src-tauri/icons/icon.png "$stage/usr/share/icons/hicolor/256x256/apps/ar.lemeit.sim.desktop.png"
install -m644 server.py dynamic_tank_mcp.py recycle.py package.json "$stage/usr/share/sim-desktop/"
cp -R site "$stage/usr/share/sim-desktop/"
install -m644 desktop/README.md desktop/DISTRIBUTION.md "$stage/usr/share/doc/sim-desktop/"
install -m644 LICENSE "$stage/usr/share/doc/sim-desktop/copyright"
cat > "$stage/DEBIAN/control" <<CONTROL
Package: sim-desktop
Version: $version
Section: science
Priority: optional
Architecture: amd64
Maintainer: Lemeit <contacto@lemeit.ar>
Depends: python3 (>= 3.11), libwebkit2gtk-4.1-0, libgtk-3-0, libglib2.0-0, libc6, libgcc-s1, shared-mime-info
Recommends: zenity
Homepage: https://github.com/lemeit/lemeit-sim
Description: Simulador educativo de procesos (paquete piloto Desktop)
 Incluye el editor y gateway local. Requiere un motor DWSIM MCP
 previamente configurado en el mismo equipo.
CONTROL
out=${1:-desktop/dist}
mkdir -p "$out"
name="sim-desktop_${version}_amd64.deb"
dpkg-deb --root-owner-group --build "$stage" "$out/$name"
(cd "$out" && sha256sum "$name" > "$name.sha256")
