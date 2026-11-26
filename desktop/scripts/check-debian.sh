#!/usr/bin/env bash
set -u
printf '=== Sistema ===\n'
uname -m
cat /etc/os-release
printf '\n=== Recursos ===\n'
free -h
df -h .
printf '\n=== Herramientas ===\n'
for tool in git python3 rustc cargo pkg-config gcc; do
  if command -v "$tool" >/dev/null 2>&1; then "$tool" --version | head -n 1; else printf '%s: falta\n' "$tool"; fi
done
printf '\n=== WebKitGTK ===\n'
if command -v pkg-config >/dev/null 2>&1; then pkg-config --modversion webkit2gtk-4.1 || true; fi
printf '\n=== Puertos existentes (solo lectura) ===\n'
ss -ltn | grep -E ':(5901|5910|5911|5920)[[:space:]]' || true
