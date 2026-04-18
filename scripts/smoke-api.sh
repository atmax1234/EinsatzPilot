#!/usr/bin/env bash

set -euo pipefail

API_BASE="${API_BASE_URL:-http://localhost:3001/api}"
TMP_DIR="$(mktemp -d)"
SMOKE_SUFFIX="$(date +%s)"
TEAM_NAME="DB Proof Team ${SMOKE_SUFFIX}"
JOB_TITLE="DB Foundation Flow ${SMOKE_SUFFIX}"
UPDATED_JOB_TITLE="${JOB_TITLE} Updated"

cleanup() {
  rm -rf "$TMP_DIR"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Required command not found: $1" >&2
    exit 1
  fi
}

json_post() {
  local url="$1"
  local body="$2"
  local auth_header="${3:-}"

  if [[ -n "$auth_header" ]]; then
    curl -fsS -X POST "$url" \
      -H "Authorization: Bearer ${auth_header}" \
      -H "Content-Type: application/json" \
      -d "$body"
    return
  fi

  curl -fsS -X POST "$url" \
    -H "Content-Type: application/json" \
    -d "$body"
}

json_patch() {
  local url="$1"
  local body="$2"
  local auth_header="$3"

  curl -fsS -X PATCH "$url" \
    -H "Authorization: Bearer ${auth_header}" \
    -H "Content-Type: application/json" \
    -d "$body"
}

json_get() {
  local url="$1"
  local auth_header="${2:-}"

  if [[ -n "$auth_header" ]]; then
    curl -fsS "$url" -H "Authorization: Bearer ${auth_header}"
    return
  fi

  curl -fsS "$url"
}

trap cleanup EXIT

require_command curl
require_command jq

printf 'fake-jpg-data' > "${TMP_DIR}/proof.jpg"

health="$(json_get "${API_BASE}/health")"

login="$(json_post "${API_BASE}/auth/development-login" '{"email":"office@example.de","displayName":"Buero Test","companySlug":"luetjens","companyName":"Luetjens Service","membershipRole":"OFFICE"}')"
token="$(printf '%s' "$login" | jq -r '.token')"
user_id="$(printf '%s' "$login" | jq -r '.session.user.id')"

session="$(json_get "${API_BASE}/auth/session" "$token")"
dashboard="$(json_get "${API_BASE}/dashboard" "$token")"
jobs="$(json_get "${API_BASE}/jobs" "$token")"
teams="$(json_get "${API_BASE}/teams" "$token")"
first_job_id="$(printf '%s' "$jobs" | jq -r '.jobs[0].id')"

create_team="$(json_post "${API_BASE}/teams" "{\"name\":\"${TEAM_NAME}\",\"code\":\"DB${SMOKE_SUFFIX}\",\"specialty\":\"Dokumentation\",\"status\":\"ACTIVE\",\"currentAssignment\":\"Foundation Proof\"}" "$token")"
team_id="$(printf '%s' "$create_team" | jq -r '.id')"

add_member="$(json_post "${API_BASE}/teams/${team_id}/members" "{\"userId\":\"${user_id}\",\"roleLabel\":\"Office Review\"}" "$token")"

create_job="$(json_post "${API_BASE}/jobs" "{\"title\":\"${JOB_TITLE}\",\"description\":\"Created during live DB verification\",\"customerName\":\"Testkunde\",\"location\":\"Teststrasse 42, Essen\",\"scheduledStart\":\"2026-04-18T08:00:00.000Z\",\"scheduledEnd\":\"2026-04-18T10:00:00.000Z\",\"priority\":\"NORMAL\"}" "$token")"
job_id="$(printf '%s' "$create_job" | jq -r '.job.id')"

assign_team="$(json_patch "${API_BASE}/jobs/${job_id}" "{\"teamId\":\"${team_id}\"}" "$token")"
change_status="$(json_patch "${API_BASE}/jobs/${job_id}/status" '{"status":"IN_PROGRESS"}' "$token")"
edit_job="$(json_patch "${API_BASE}/jobs/${job_id}" "{\"title\":\"${UPDATED_JOB_TITLE}\",\"priority\":\"HIGH\",\"description\":\"Updated after team assignment\"}" "$token")"

create_report="$(json_post "${API_BASE}/jobs/${job_id}/reports" "{\"summary\":\"DB proof report\",\"details\":\"Report created against real Postgres flow\",\"teamId\":\"${team_id}\"}" "$token")"
report_id="$(printf '%s' "$create_report" | jq -r '.reports[0].id')"

upload_attachment="$(curl -fsS -X POST "${API_BASE}/jobs/${job_id}/attachments" \
  -H "Authorization: Bearer ${token}" \
  -F "kind=PHOTO" \
  -F "caption=Foundation upload proof" \
  -F "reportId=${report_id}" \
  -F "teamId=${team_id}" \
  -F "file=@${TMP_DIR}/proof.jpg;type=image/jpeg")"
attachment_id="$(printf '%s' "$upload_attachment" | jq -r '.attachments[0].id')"

photos="$(json_get "${API_BASE}/attachments/photos" "$token")"
attachment_meta="$(json_get "${API_BASE}/attachments/${attachment_id}" "$token")"
attachment_file_status="$(curl -fsS -o "${TMP_DIR}/proof-download.bin" -w '%{http_code} %{content_type}' "${API_BASE}/attachments/${attachment_id}/file" -H "Authorization: Bearer ${token}")"
job_detail="$(json_get "${API_BASE}/jobs/${job_id}" "$token")"

other_login="$(json_post "${API_BASE}/auth/development-login" '{"email":"owner@otherco.example.de","displayName":"Other Owner","companySlug":"otherco","companyName":"Other Co","membershipRole":"OWNER"}')"
other_token="$(printf '%s' "$other_login" | jq -r '.token')"
cross_status="$(curl -sS -o "${TMP_DIR}/cross-company.json" -w '%{http_code}' "${API_BASE}/jobs/${job_id}" -H "Authorization: Bearer ${other_token}")"
cross_body="$(cat "${TMP_DIR}/cross-company.json")"

jq -n \
  --argjson health "$health" \
  --argjson session "$session" \
  --argjson dashboard "$dashboard" \
  --argjson teams "$teams" \
  --argjson addMember "$add_member" \
  --argjson assignTeam "$assign_team" \
  --argjson changeStatus "$change_status" \
  --argjson editJob "$edit_job" \
  --argjson createReport "$create_report" \
  --argjson uploadAttachment "$upload_attachment" \
  --argjson photos "$photos" \
  --argjson attachmentMeta "$attachment_meta" \
  --argjson jobDetail "$job_detail" \
  --arg crossStatus "$cross_status" \
  --arg crossBody "$cross_body" \
  --arg attachmentFileStatus "$attachment_file_status" \
  --arg firstJobId "$first_job_id" \
  --arg teamName "$TEAM_NAME" \
  --arg updatedJobTitle "$UPDATED_JOB_TITLE" \
  '{
    healthOk: $health.ok,
    sessionAuthenticated: $session.authenticated,
    dashboardTotalJobs: $dashboard.summary.totalJobs,
    initialTeamCount: ($teams.teams | length),
    createdTeamName: $teamName,
    firstSeededJobId: $firstJobId,
    addMemberCount: ($addMember.members | length),
    assignedTeamName: $assignTeam.job.assignedTeam.name,
    changedStatus: $changeStatus.job.status,
    editedTitle: $editJob.job.title,
    jobActivityCount: ($jobDetail.job.activity | length),
    jobReportCount: ($jobDetail.job.reports | length),
    jobAttachmentCount: ($jobDetail.job.attachments | length),
    photoLibraryCount: ($photos.attachments | length),
    attachmentMetadataKind: $attachmentMeta.attachment.kind,
    attachmentFileFetch: $attachmentFileStatus,
    crossCompanyStatus: $crossStatus,
    crossCompanyBody: $crossBody
  }' > "${TMP_DIR}/summary.json"

jq -e \
  --arg teamName "$TEAM_NAME" \
  --arg updatedJobTitle "$UPDATED_JOB_TITLE" \
  '
    .healthOk == true and
    .sessionAuthenticated == true and
    .dashboardTotalJobs >= 1 and
    .initialTeamCount >= 1 and
    .addMemberCount >= 1 and
    .assignedTeamName == $teamName and
    .changedStatus == "IN_PROGRESS" and
    .editedTitle == $updatedJobTitle and
    .jobActivityCount >= 4 and
    .jobReportCount >= 1 and
    .jobAttachmentCount >= 1 and
    .photoLibraryCount >= 1 and
    .attachmentMetadataKind == "PHOTO" and
    .attachmentFileFetch == "200 image/jpeg" and
    .crossCompanyStatus == "404"
  ' "${TMP_DIR}/summary.json" >/dev/null

cat "${TMP_DIR}/summary.json"
