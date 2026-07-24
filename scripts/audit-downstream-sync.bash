#!/usr/bin/env bash
# spell-checker: ignore pipefail lastsync nameWithOwner ahead's
# Audits every repo downstream of this template, sorted by how stale its
# last template sync is (oldest first).
#
# Downstream projects record the template commit they last synced from in a
# `.lastsync` file (written by `ts-utils copy-from-template`). This script
# discovers those repos via GitHub code search, reads each pinned SHA, and
# resolves its date + how many template commits it is behind.
#
# Requires: gh (authenticated), git. Override the org with SYNC_AUDIT_ORG.
set -euo pipefail; if [ -n "${DEBUG-}" ]; then set -x; fi

project_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"

cd "$project_dir"

org="${SYNC_AUDIT_ORG:-openstax}"

# this template's repo (owner/name) and canonical branch, derived from origin
template_repo="$(gh repo view --json nameWithOwner --jq '.nameWithOwner' 2>/dev/null)"
default_branch="$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name' 2>/dev/null || echo main)"

echo "Fetching latest template history ($template_repo $default_branch)..." >&2
git fetch origin "$default_branch" --quiet
head_ref="origin/$default_branch"
head_sha="$(git rev-parse "$head_ref")"

echo "Discovering downstream repos in org:$org..." >&2
# code search indexes default branches; per_page caps at 100 (plenty here)
repos="$(gh api -X GET search/code \
  -f q="filename:.lastsync org:$org" -f per_page=100 \
  --jq '.items[].repository.full_name' 2>/dev/null | sort -u)"

if [ -z "$repos" ]; then
  echo "No downstream repos found." >&2
  exit 0
fi

now_epoch="$(date +%s)"
rows=""

# Convert an ISO-8601 timestamp to a Unix epoch, portably across GNU and BSD
# (macOS) date. Only needed for the API fallback below; the local-git path
# reads the epoch straight from git and never calls this.
to_epoch() {
  local iso="$1" e
  if e="$(date -d "$iso" +%s 2>/dev/null)"; then
    printf '%s' "$e"; return 0
  fi
  # BSD/macOS: normalize 'Z' and '+HH:MM' offsets, then parse explicitly
  iso="${iso/Z/+0000}"
  iso="$(printf '%s' "$iso" | sed -E 's/([+-][0-9]{2}):([0-9]{2})$/\1\2/')"
  date -j -f "%Y-%m-%dT%H:%M:%S%z" "$iso" +%s 2>/dev/null
}

for repo in $repos; do
  [ "$repo" = "$template_repo" ] && continue

  # skip archived repos (the code-search API ignores an archived: qualifier,
  # so we check each repo's status directly)
  if [ "$(gh api "repos/$repo" --jq '.archived' 2>/dev/null)" = "true" ]; then
    echo "skipping archived repo: $repo" >&2
    continue
  fi

  sha="$(gh api "repos/$repo/contents/.lastsync" --jq '.content' 2>/dev/null \
    | base64 -d 2>/dev/null | tr -d '[:space:]')"
  if [ -z "$sha" ]; then
    rows+="9999999999\t${repo##*/}\t<no .lastsync>\t?\t?\n"
    continue
  fi

  # commit epoch + short date: prefer local history (git emits both directly,
  # avoiding non-portable `date -d` parsing), fall back to the API
  read -r epoch synced < <(git show -s --format='%ct %cs' "$sha" 2>/dev/null) || true
  if [ -z "$epoch" ]; then
    date_iso="$(gh api "repos/$template_repo/commits/$sha" --jq '.commit.committer.date' 2>/dev/null || true)"
    if [ -n "$date_iso" ]; then
      synced="${date_iso:0:10}"
      epoch="$(to_epoch "$date_iso")"
    fi
  fi
  if [ -z "$epoch" ]; then
    rows+="9999999999\t${repo##*/}\t${sha:0:9} (unknown commit)\t?\t?\n"
    continue
  fi

  days_ago=$(( (now_epoch - epoch) / 86400 ))

  # commits behind HEAD: prefer local, fall back to the compare API
  if behind="$(git rev-list --count "$sha..$head_ref" 2>/dev/null)" && [ -n "$behind" ]; then
    :
  else
    behind="$(gh api "repos/$template_repo/compare/$sha...$default_branch" --jq '.ahead_by' 2>/dev/null || echo '?')"
  fi

  rows+="${epoch}\t${repo##*/}\t${synced}\t${days_ago}\t${behind}\n"
done

echo
printf '%-32s %-14s %-12s %s\n' "PROJECT" "LAST SYNCED" "DAYS AGO" "COMMITS BEHIND"
printf '%-32s %-14s %-12s %s\n' "--------------------------------" "------------" "--------" "--------------"
# sort by sync epoch ascending (stalest first), then drop the sort key
printf "%b" "$rows" | sort -t$'\t' -k1,1n | while IFS=$'\t' read -r _epoch name synced days behind; do
  [ -z "$name" ] && continue
  printf '%-32s %-14s %-12s %s\n' "$name" "$synced" "$days" "$behind"
done

echo
echo "template HEAD: ${head_sha:0:9} ($(git show -s --format='%cs' "$head_ref"))"
