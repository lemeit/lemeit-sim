#!/bin/bash
set -euo pipefail
if [[ $# != 3 ]]; then
    echo 'Uso: bash desktop/scripts/index-apt.sh ARCHIVO.deb RAIZ_APT HUELLA_GPG' >&2
    exit 2
fi
package=$(realpath "$1")
output=$2
fingerprint=$3
[[ "$fingerprint" =~ ^[A-Fa-f0-9]{40}$ ]]
[[ "$(dpkg-deb -f "$package" Package)" == sim-desktop ]]
[[ "$(dpkg-deb -f "$package" Architecture)" == amd64 ]]
version=$(dpkg-deb -f "$package" Version)
dpkg --validate-version "$version"
mkdir -p "$output"
cd "$output"
pool=pool/main/s/sim-desktop
dist=dists/bookworm
index=$dist/main/binary-amd64
mkdir -p "$pool" "$index/by-hash/SHA256"
dest="$pool/sim-desktop_${version}_amd64.deb"
if [[ -e "$dest" ]]; then
    cmp "$package" "$dest"
else
    install -m644 "$package" "$dest"
fi

work=$(mktemp -d "$dist/.index.XXXXXX")
trap 'rm -rf -- "$work"' EXIT
dpkg-scanpackages --multiversion "$pool" /dev/null > "$work/Packages"
gzip -n -c "$work/Packages" > "$work/Packages.gz"
{
    printf '%s\n' 'Origin: Lemeit' 'Label: ΣIM Desktop' 'Suite: bookworm' 'Codename: bookworm' 'Architectures: amd64' 'Components: main' 'Acquire-By-Hash: yes'
    printf 'Date: %s\nSHA256:\n' "$(LC_ALL=C date -Ru)"
    for file in Packages Packages.gz; do
        digest=$(sha256sum "$work/$file")
        digest=${digest%% *}
        printf ' %s %s main/binary-amd64/%s\n' "$digest" "$(wc -c < "$work/$file")" "$file"
        install -m644 "$work/$file" "$index/by-hash/SHA256/$digest"
    done
} > "$work/Release"
gpg --batch --local-user "$fingerprint" --clearsign --output "$work/InRelease" "$work/Release"
for file in Packages Packages.gz; do mv -f "$work/$file" "$index/$file"; done
mv -f "$work/Release" "$dist/Release"
mv -f "$work/InRelease" "$dist/InRelease"
