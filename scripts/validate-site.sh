#!/usr/bin/env bash
#
# Static-site validation. The site has no package.json and standing up a JS test
# runner for two HTML files is not worth it, so the "tests" for this repo are
# these checks — run by Site CI on every push and pull request.
#
# Usage: ./scripts/validate-site.sh   (run from the repository root)

set -euo pipefail

fail_count=0

pass() { printf '  ok   %s\n' "$1"; }
fail() { printf '  FAIL %s\n' "$1"; fail_count=$((fail_count + 1)); }

echo "==> Required pages and assets"
for required in index.html security.html styles.css assets/logo.png; do
  if [[ -f "$required" ]]; then
    pass "$required exists"
  else
    fail "$required is missing"
  fi
done

echo "==> Local links and assets resolve"
# Pull every href/src that is not an anchor, absolute URL, or mailto, strip any
# #fragment or ?query, and confirm the file is actually present in the repo.
for page in index.html security.html; do
  [[ -f "$page" ]] || continue

  while read -r target; do
    [[ -n "$target" ]] || continue
    resolved="${target%%[#?]*}"
    [[ -n "$resolved" ]] || continue

    if [[ -e "$resolved" ]]; then
      pass "$page -> $resolved"
    else
      fail "$page references missing local file: $resolved"
    fi
  done < <(
    grep -oE '(href|src)="[^"]+"' "$page" \
      | sed -E 's/^(href|src)="//; s/"$//' \
      | grep -vE '^(https?:|mailto:|#|//|data:)' \
      | sort -u
  )
done

echo "==> Security disclosure page"
if grep -q "Security Disclosure" security.html; then
  pass "security.html has its disclosure heading"
else
  fail "security.html lost its 'Security Disclosure' heading"
fi

if grep -q "security.html" index.html; then
  pass "index.html links to the security page"
else
  fail "index.html no longer links to security.html"
fi

if grep -q "security/advisories/new" security.html; then
  pass "security.html points at a working advisory intake"
else
  fail "security.html has no advisory reporting link"
fi

echo "==> Installer downloads"
shopt -s nullglob
win_installers=(downloads/Orbit-Chat-Setup-*.exe)
mac_installers=(downloads/Orbit-Chat-*-mac.zip)
shopt -u nullglob

if (( ${#win_installers[@]} > 0 )); then
  pass "Windows installer present (${win_installers[0]})"
else
  fail "no Windows installer in downloads/"
fi

if (( ${#mac_installers[@]} > 0 )); then
  pass "macOS installer present (${mac_installers[0]})"
else
  fail "no macOS installer in downloads/"
fi

echo "==> Advertised version matches the shipped installers"
# Guards the drift the roadmap calls out (§4.9): the page claimed 0.9.0 while
# the committed installers were 0.9.3.
if (( ${#win_installers[@]} > 0 )); then
  installer_version="$(basename "${win_installers[0]}" | sed -E 's/^Orbit-Chat-Setup-(.+)\.exe$/\1/')"

  page_versions="$(grep -oE '[0-9]+\.[0-9]+\.[0-9]+' index.html | sort -u || true)"
  if [[ -z "$page_versions" ]]; then
    fail "index.html advertises no version at all"
  else
    while read -r version; do
      [[ -n "$version" ]] || continue
      if [[ "$version" == "$installer_version" ]]; then
        pass "index.html version $version matches the installer"
      else
        fail "index.html advertises $version but the installer is $installer_version"
      fi
    done <<< "$page_versions"
  fi
fi

echo
if (( fail_count > 0 )); then
  echo "site validation FAILED with $fail_count problem(s)"
  exit 1
fi

echo "site validation passed"
