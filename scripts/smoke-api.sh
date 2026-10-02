#!/usr/bin/env bash

set -euo pipefail

API_BASE="${API_BASE_URL:-http://localhost:3001/api}"
TMP_DIR="$(mktemp -d)"
SUMMARY_INPUT="${TMP_DIR}/summary-input.ndjson"
SMOKE_SUFFIX="$(date +%s)"
TEAM_NAME="DB Proof Team ${SMOKE_SUFFIX}"
JOB_TITLE="DB Foundation Flow ${SMOKE_SUFFIX}"
UPDATED_JOB_TITLE="${JOB_TITLE} Updated"
CUSTOMER_REPORT_TITLE="Phase 7 Customer Report ${SMOKE_SUFFIX}"
UPDATED_CUSTOMER_REPORT_TITLE="${CUSTOMER_REPORT_TITLE} Updated"
PHASE7_ATTACHMENT_CAPTION="Phase 7 snapshot evidence ${SMOKE_SUFFIX}"
OTHER_PHASE7_ATTACHMENT_CAPTION="Other company Phase 7 evidence ${SMOKE_SUFFIX}"
PHASE7_MUTATED_JOB_TITLE="Phase 7 Mutated Job ${SMOKE_SUFFIX}"
PHASE7_MUTATED_CUSTOMER_NAME="Phase 7 Mutated Customer ${SMOKE_SUFFIX}"
PHASE7_MUTATED_OBJECT_NAME="Phase 7 Mutated Object ${SMOKE_SUFFIX}"
PHASE7_MUTATED_AREA_NAME="Phase 7 Mutated Area ${SMOKE_SUFFIX}"
WORKDAY_SHEET_TITLE="Phase 8 Workday Sheet ${SMOKE_SUFFIX}"
UPDATED_WORKDAY_SHEET_TITLE="${WORKDAY_SHEET_TITLE} Updated"
WORKDAY_SHEET_DATE="$(date +%F)"

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

append_summary_json() {
  local key="$1"
  local value="$2"

  printf '%s\n' "$value" |
    jq -c --arg key "$key" '{key: $key, value: .}' >> "$SUMMARY_INPUT"
}

append_summary_string() {
  local key="$1"
  local value="$2"

  jq -cn --arg key "$key" --arg value "$value" '{key: $key, value: $value}' >> "$SUMMARY_INPUT"
}

trap cleanup EXIT

require_command curl
require_command jq

printf 'fake-jpg-data' > "${TMP_DIR}/proof.jpg"
proof_upload_path="${TMP_DIR}/proof.jpg"
if command -v cygpath >/dev/null 2>&1; then
  proof_upload_path="$(cygpath -w "$proof_upload_path")"
fi

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
  -F "file=@${proof_upload_path};type=image/jpeg")"
attachment_id="$(printf '%s' "$upload_attachment" | jq -r '.attachments[0].id')"

photos="$(json_get "${API_BASE}/attachments/photos" "$token")"
attachment_meta="$(json_get "${API_BASE}/attachments/${attachment_id}" "$token")"
attachment_file_status="$(curl -fsS -o "${TMP_DIR}/proof-download.bin" -w '%{http_code} %{content_type}' "${API_BASE}/attachments/${attachment_id}/file" -H "Authorization: Bearer ${token}")"
job_detail="$(json_get "${API_BASE}/jobs/${job_id}" "$token")"

create_customer="$(json_post "${API_BASE}/customers" "{\"name\":\"Smoke Customer ${SMOKE_SUFFIX}\",\"type\":\"BUSINESS\",\"email\":\"customer.${SMOKE_SUFFIX}@example.de\",\"phone\":\"0201 123456\",\"notes\":\"Directory smoke proof\"}" "$token")"
customer_id="$(printf '%s' "$create_customer" | jq -r '.id')"
update_customer="$(json_patch "${API_BASE}/customers/${customer_id}" '{"phone":"0201 654321"}' "$token")"

create_address="$(json_post "${API_BASE}/addresses" "{\"customerId\":\"${customer_id}\",\"label\":\"Smoke Hauptadresse\",\"street\":\"Teststrasse 42\",\"postalCode\":\"45127\",\"city\":\"Essen\",\"country\":\"DE\"}" "$token")"
address_id="$(printf '%s' "$create_address" | jq -r '.id')"
update_address="$(json_patch "${API_BASE}/addresses/${address_id}" '{"notes":"Address update proof"}' "$token")"

create_object="$(json_post "${API_BASE}/objects" "{\"customerId\":\"${customer_id}\",\"addressId\":\"${address_id}\",\"name\":\"Smoke Object ${SMOKE_SUFFIX}\",\"type\":\"FACILITY\",\"status\":\"ACTIVE\"}" "$token")"
object_id="$(printf '%s' "$create_object" | jq -r '.id')"
update_object="$(json_patch "${API_BASE}/objects/${object_id}" '{"notes":"Object update proof"}' "$token")"
create_area="$(json_post "${API_BASE}/objects/${object_id}/areas" '{"name":"Eingang A","type":"ENTRANCE"}' "$token")"
area_id="$(printf '%s' "$create_area" | jq -r '.id')"
update_area="$(json_patch "${API_BASE}/objects/${object_id}/areas/${area_id}" '{"notes":"Area update proof"}' "$token")"

customers="$(json_get "${API_BASE}/customers" "$token")"
addresses="$(json_get "${API_BASE}/addresses" "$token")"
objects="$(json_get "${API_BASE}/objects" "$token")"
object_detail="$(json_get "${API_BASE}/objects/${object_id}" "$token")"
relation_options="$(json_get "${API_BASE}/jobs/relation-options" "$token")"

link_job="$(json_patch "${API_BASE}/jobs/${job_id}" "{\"customerId\":\"${customer_id}\",\"addressId\":\"${address_id}\",\"objectId\":\"${object_id}\",\"objectAreaId\":\"${area_id}\"}" "$token")"
job_detail="$(json_get "${API_BASE}/jobs/${job_id}" "$token")"

linked_job="$(json_post "${API_BASE}/jobs" "{\"title\":\"Linked Job ${SMOKE_SUFFIX}\",\"description\":\"Job relation create proof\",\"customerName\":\"Legacy Linked Customer\",\"location\":\"Legacy Linked Location\",\"scheduledStart\":\"2026-04-19T08:00:00.000Z\",\"priority\":\"NORMAL\",\"customerId\":\"${customer_id}\",\"addressId\":\"${address_id}\",\"objectId\":\"${object_id}\",\"objectAreaId\":\"${area_id}\"}" "$token")"
linked_job_id="$(printf '%s' "$linked_job" | jq -r '.job.id')"

second_object="$(json_post "${API_BASE}/objects" "{\"name\":\"Second Smoke Object ${SMOKE_SUFFIX}\",\"type\":\"OTHER\",\"status\":\"ACTIVE\"}" "$token")"
second_object_id="$(printf '%s' "$second_object" | jq -r '.id')"
missing_object_status="$(curl -sS -o "${TMP_DIR}/missing-object.json" -w '%{http_code}' -X POST "${API_BASE}/jobs" -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' -d "{\"title\":\"Invalid Missing Object\",\"customerName\":\"Validation\",\"location\":\"Validation\",\"scheduledStart\":\"2026-04-20T08:00:00.000Z\",\"priority\":\"NORMAL\",\"objectAreaId\":\"${area_id}\"}")"
mismatched_area_status="$(curl -sS -o "${TMP_DIR}/mismatched-area.json" -w '%{http_code}' -X POST "${API_BASE}/jobs" -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' -d "{\"title\":\"Invalid Area Object\",\"customerName\":\"Validation\",\"location\":\"Validation\",\"scheduledStart\":\"2026-04-20T09:00:00.000Z\",\"priority\":\"NORMAL\",\"objectId\":\"${second_object_id}\",\"objectAreaId\":\"${area_id}\"}")"

create_item_category="$(json_post "${API_BASE}/item-categories" "{\"name\":\"Smoke Material ${SMOKE_SUFFIX}\",\"description\":\"Initial category description\",\"kind\":\"MATERIAL\"}" "$token")"
item_category_id="$(printf '%s' "$create_item_category" | jq -r '.id')"
update_item_category="$(json_patch "${API_BASE}/item-categories/${item_category_id}" '{"description":"Updated category description","isActive":true}' "$token")"
item_categories="$(json_get "${API_BASE}/item-categories" "$token")"

create_quantity_item="$(json_post "${API_BASE}/items" "{\"categoryId\":\"${item_category_id}\",\"name\":\"Smoke Quantity Item ${SMOKE_SUFFIX}\",\"description\":\"Quantity item proof\",\"kind\":\"MATERIAL\",\"unit\":\"KG\",\"trackingMode\":\"QUANTITY\",\"quantity\":12.5,\"status\":\"ACTIVE\"}" "$token")"
quantity_item_id="$(printf '%s' "$create_quantity_item" | jq -r '.id')"
quantity_item_custom_id="$(printf '%s' "$create_quantity_item" | jq -r '.customId')"
quantity_item_detail="$(json_get "${API_BASE}/items/${quantity_item_id}" "$token")"
update_quantity_item="$(json_patch "${API_BASE}/items/${quantity_item_id}" '{"name":"Updated Smoke Quantity Item","quantity":10.25,"notes":"Quantity update proof"}' "$token")"
items="$(json_get "${API_BASE}/items" "$token")"
duplicate_custom_id_status="$(curl -sS -o "${TMP_DIR}/duplicate-custom-id.json" -w '%{http_code}' -X POST "${API_BASE}/items" -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' -d "{\"customId\":\"${quantity_item_custom_id}\",\"name\":\"Duplicate Custom ID\",\"kind\":\"OTHER\",\"unit\":\"PIECE\",\"trackingMode\":\"QUANTITY\",\"quantity\":1}")"
create_serialized_item="$(json_post "${API_BASE}/items" "{\"name\":\"Smoke Serialized Item ${SMOKE_SUFFIX}\",\"kind\":\"TOOL\",\"unit\":\"PIECE\",\"trackingMode\":\"SERIALIZED\"}" "$token")"
serialized_item_id="$(printf '%s' "$create_serialized_item" | jq -r '.id')"
invalid_serialized_status="$(curl -sS -o "${TMP_DIR}/invalid-serialized.json" -w '%{http_code}' -X POST "${API_BASE}/items" -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' -d "{\"name\":\"Invalid Serialized Item\",\"kind\":\"TOOL\",\"unit\":\"PIECE\",\"trackingMode\":\"SERIALIZED\",\"quantity\":2}")"

team_job_assignment="$(json_post "${API_BASE}/assignments" "{\"sourceType\":\"TEAM\",\"sourceId\":\"${team_id}\",\"targetType\":\"JOB\",\"targetId\":\"${job_id}\",\"kind\":\"RESPONSIBLE\",\"status\":\"ACTIVE\",\"startsAt\":\"2026-04-18T08:00:00.000Z\",\"notes\":\"Team assignment proof\"}" "$token")"
team_job_assignment_id="$(printf '%s' "$team_job_assignment" | jq -r '.id')"
duplicate_active_assignment_status="$(curl -sS -o "${TMP_DIR}/duplicate-active-assignment.json" -w '%{http_code}' -X POST "${API_BASE}/assignments" -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' -d "{\"sourceType\":\"TEAM\",\"sourceId\":\"${team_id}\",\"targetType\":\"JOB\",\"targetId\":\"${job_id}\",\"kind\":\"RESPONSIBLE\",\"status\":\"ACTIVE\"}")"
item_job_assignment="$(json_post "${API_BASE}/assignments" "{\"sourceType\":\"ITEM\",\"sourceId\":\"${quantity_item_id}\",\"targetType\":\"JOB\",\"targetId\":\"${job_id}\",\"kind\":\"ALLOCATED\",\"status\":\"ACTIVE\"}" "$token")"
item_job_assignment_id="$(printf '%s' "$item_job_assignment" | jq -r '.id')"
item_object_assignment="$(json_post "${API_BASE}/assignments" "{\"sourceType\":\"ITEM\",\"sourceId\":\"${serialized_item_id}\",\"targetType\":\"OBJECT\",\"targetId\":\"${object_id}\",\"kind\":\"RESERVED\",\"status\":\"PLANNED\",\"startsAt\":\"2026-04-19T08:00:00.000Z\"}" "$token")"
item_object_assignment_id="$(printf '%s' "$item_object_assignment" | jq -r '.id')"
update_item_object_assignment="$(json_patch "${API_BASE}/assignments/${item_object_assignment_id}" '{"status":"ACTIVE","startsAt":"2026-04-19T08:00:00.000Z","endsAt":"2026-04-19T12:00:00.000Z","notes":"Assignment update proof"}' "$token")"
assignment_detail="$(json_get "${API_BASE}/assignments/${team_job_assignment_id}" "$token")"
assignments="$(json_get "${API_BASE}/assignments" "$token")"
assignment_options="$(json_get "${API_BASE}/assignments/options" "$token")"
job_after_assignments="$(json_get "${API_BASE}/jobs/${job_id}" "$token")"
invalid_assignment_time_status="$(curl -sS -o "${TMP_DIR}/invalid-assignment-time.json" -w '%{http_code}' -X POST "${API_BASE}/assignments" -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' -d "{\"sourceType\":\"USER\",\"sourceId\":\"${user_id}\",\"targetType\":\"JOB\",\"targetId\":\"${job_id}\",\"kind\":\"SCHEDULED\",\"startsAt\":\"2026-04-20T12:00:00.000Z\",\"endsAt\":\"2026-04-20T10:00:00.000Z\"}")"

material_cost="$(json_post "${API_BASE}/jobs/${job_id}/costs" "{\"itemId\":\"${quantity_item_id}\",\"kind\":\"MATERIAL_PURCHASE\",\"description\":\"Smoke repair material\",\"quantity\":2.5,\"unit\":\"KG\",\"unitCost\":12.4,\"currency\":\"EUR\",\"taxRate\":19,\"costDate\":\"2026-04-18T12:00:00.000Z\",\"vendorName\":\"Smoke Supplier\",\"receiptReference\":\"SMOKE-RECEIPT\"}" "$token")"
material_cost_id="$(printf '%s' "$material_cost" | jq -r '.id')"
labor_cost="$(json_post "${API_BASE}/jobs/${job_id}/costs" '{"kind":"LABOR","description":"Smoke labor time","quantity":3,"unit":"HOUR","unitCost":45,"currency":"EUR","costDate":"2026-04-18T12:00:00.000Z"}' "$token")"
labor_cost_id="$(printf '%s' "$labor_cost" | jq -r '.id')"
external_cost="$(json_post "${API_BASE}/jobs/${job_id}/costs" '{"kind":"EXTERNAL_SERVICE","description":"Smoke external service","quantity":1,"unit":"FLAT_RATE","totalCost":250,"currency":"EUR","costDate":"2026-04-18T12:00:00.000Z"}' "$token")"
external_cost_id="$(printf '%s' "$external_cost" | jq -r '.id')"
update_material_cost="$(json_patch "${API_BASE}/jobs/${job_id}/costs/${material_cost_id}" '{"quantity":3,"notes":"Updated cost proof"}' "$token")"
job_costs="$(json_get "${API_BASE}/jobs/${job_id}/costs" "$token")"
job_cost_summary="$(json_get "${API_BASE}/jobs/${job_id}/cost-summary" "$token")"
wrong_job_cost_status="$(curl -sS -o "${TMP_DIR}/wrong-job-cost.json" -w '%{http_code}' -X PATCH "${API_BASE}/jobs/${linked_job_id}/costs/${material_cost_id}" -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' -d '{"notes":"Wrong job update"}')"

worker_login="$(json_post "${API_BASE}/auth/development-login" '{"email":"worker@luetjens.example.de","displayName":"Worker Proof","companySlug":"luetjens","companyName":"Luetjens Service","membershipRole":"WORKER"}')"
worker_token="$(printf '%s' "$worker_login" | jq -r '.token')"
worker_user_id="$(printf '%s' "$worker_login" | jq -r '.session.user.id')"
add_worker_member="$(json_post "${API_BASE}/teams/${team_id}/members" "{\"userId\":\"${worker_user_id}\",\"roleLabel\":\"Field Worker\"}" "$token")"
worker_finding="$(json_post "${API_BASE}/jobs/${job_id}/reports" '{"type":"WORKER_FINDING","summary":"Worker finding proof","findingSummary":"Pipe connection is leaking","workPerformed":"Water supply isolated and area secured","workStillNeeded":"Replace damaged connector","followUpRequired":true,"followUpNotes":"Office should schedule repair","details":"Tenant informed"}' "$worker_token")"
worker_finding_id="$(printf '%s' "$worker_finding" | jq -r '.reports[] | select(.summary == "Worker finding proof") | .id')"
worker_review_status="$(curl -sS -o "${TMP_DIR}/worker-review.json" -w '%{http_code}' -X PATCH "${API_BASE}/jobs/${job_id}/reports/${worker_finding_id}/review" -H "Authorization: Bearer ${worker_token}" -H 'Content-Type: application/json' -d '{"reviewStatus":"APPROVED"}')"
approve_worker_finding="$(json_patch "${API_BASE}/jobs/${job_id}/reports/${worker_finding_id}/review" '{"reviewStatus":"APPROVED","reviewNotes":"Finding verified by office"}' "$token")"
revision_report="$(json_post "${API_BASE}/jobs/${job_id}/reports" '{"type":"INCIDENT_REPORT","summary":"Incident revision proof","findingSummary":"Moisture visible near service shaft","followUpRequired":true,"followUpNotes":"Clarify affected floor"}' "$token")"
revision_report_id="$(printf '%s' "$revision_report" | jq -r '.reports[] | select(.summary == "Incident revision proof") | .id')"
needs_revision_report="$(json_patch "${API_BASE}/jobs/${job_id}/reports/${revision_report_id}/review" '{"reviewStatus":"NEEDS_REVISION","reviewNotes":"Add exact floor and another photo"}' "$token")"
worker_inaccessible_report_status="$(curl -sS -o "${TMP_DIR}/worker-inaccessible-report.json" -w '%{http_code}' -X POST "${API_BASE}/jobs/${linked_job_id}/reports" -H "Authorization: Bearer ${worker_token}" -H 'Content-Type: application/json' -d '{"type":"WORKER_FINDING","summary":"Forbidden unrelated finding","findingSummary":"Should not be accepted"}')"
wrong_job_report_review_status="$(curl -sS -o "${TMP_DIR}/wrong-job-report-review.json" -w '%{http_code}' -X PATCH "${API_BASE}/jobs/${linked_job_id}/reports/${worker_finding_id}/review" -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' -d '{"reviewStatus":"REJECTED"}')"
invalid_finding_status="$(curl -sS -o "${TMP_DIR}/invalid-finding.json" -w '%{http_code}' -X POST "${API_BASE}/jobs/${job_id}/reports" -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' -d '{"type":"WORKER_FINDING","summary":"Missing meaningful body"}')"
worker_objects="$(json_get "${API_BASE}/objects" "$worker_token")"
worker_relation_options="$(json_get "${API_BASE}/jobs/relation-options" "$worker_token")"
worker_item_categories="$(json_get "${API_BASE}/item-categories" "$worker_token")"
worker_items="$(json_get "${API_BASE}/items" "$worker_token")"
worker_item_detail="$(json_get "${API_BASE}/items/${quantity_item_id}" "$worker_token")"
worker_assignments="$(json_get "${API_BASE}/assignments" "$worker_token")"
worker_assignment_options="$(json_get "${API_BASE}/assignments/options" "$worker_token")"
worker_assignment_detail="$(json_get "${API_BASE}/assignments/${team_job_assignment_id}" "$worker_token")"
worker_job_costs="$(json_get "${API_BASE}/jobs/${job_id}/costs" "$worker_token")"
worker_job_cost_summary="$(json_get "${API_BASE}/jobs/${job_id}/cost-summary" "$worker_token")"
worker_write_status="$(curl -sS -o "${TMP_DIR}/worker-write.json" -w '%{http_code}' -X POST "${API_BASE}/customers" -H "Authorization: Bearer ${worker_token}" -H 'Content-Type: application/json' -d '{"name":"Forbidden Worker Customer","type":"OTHER"}')"
worker_job_write_status="$(curl -sS -o "${TMP_DIR}/worker-job-write.json" -w '%{http_code}' -X POST "${API_BASE}/jobs" -H "Authorization: Bearer ${worker_token}" -H 'Content-Type: application/json' -d "{\"title\":\"Forbidden Worker Job\",\"customerName\":\"Validation\",\"location\":\"Validation\",\"scheduledStart\":\"2026-04-20T11:00:00.000Z\",\"priority\":\"NORMAL\",\"customerId\":\"${customer_id}\"}")"
worker_category_write_status="$(curl -sS -o "${TMP_DIR}/worker-category-write.json" -w '%{http_code}' -X POST "${API_BASE}/item-categories" -H "Authorization: Bearer ${worker_token}" -H 'Content-Type: application/json' -d '{"name":"Forbidden Worker Category","kind":"OTHER"}')"
worker_item_write_status="$(curl -sS -o "${TMP_DIR}/worker-item-write.json" -w '%{http_code}' -X PATCH "${API_BASE}/items/${quantity_item_id}" -H "Authorization: Bearer ${worker_token}" -H 'Content-Type: application/json' -d '{"notes":"Forbidden worker update"}')"
worker_assignment_write_status="$(curl -sS -o "${TMP_DIR}/worker-assignment-write.json" -w '%{http_code}' -X POST "${API_BASE}/assignments" -H "Authorization: Bearer ${worker_token}" -H 'Content-Type: application/json' -d "{\"sourceType\":\"ITEM\",\"sourceId\":\"${quantity_item_id}\",\"targetType\":\"JOB\",\"targetId\":\"${job_id}\",\"kind\":\"SUPPORTING\"}")"
worker_assignment_update_status="$(curl -sS -o "${TMP_DIR}/worker-assignment-update.json" -w '%{http_code}' -X PATCH "${API_BASE}/assignments/${team_job_assignment_id}" -H "Authorization: Bearer ${worker_token}" -H 'Content-Type: application/json' -d '{"notes":"Forbidden worker assignment update"}')"
worker_cost_write_status="$(curl -sS -o "${TMP_DIR}/worker-cost-write.json" -w '%{http_code}' -X POST "${API_BASE}/jobs/${job_id}/costs" -H "Authorization: Bearer ${worker_token}" -H 'Content-Type: application/json' -d '{"kind":"OTHER","description":"Forbidden worker cost","quantity":1,"unit":"FLAT_RATE","totalCost":1}')"
worker_cost_update_status="$(curl -sS -o "${TMP_DIR}/worker-cost-update.json" -w '%{http_code}' -X PATCH "${API_BASE}/jobs/${job_id}/costs/${labor_cost_id}" -H "Authorization: Bearer ${worker_token}" -H 'Content-Type: application/json' -d '{"notes":"Forbidden worker cost update"}')"

phase7_attachment_upload="$(curl -fsS -X POST "${API_BASE}/jobs/${job_id}/attachments" \
  -H "Authorization: Bearer ${token}" \
  -F "kind=PHOTO" \
  -F "caption=${PHASE7_ATTACHMENT_CAPTION}" \
  -F "reportId=${worker_finding_id}" \
  -F "teamId=${team_id}" \
  -F "file=@${proof_upload_path};type=image/jpeg")"
phase7_attachment_id="$(printf '%s' "$phase7_attachment_upload" | jq -r --arg caption "$PHASE7_ATTACHMENT_CAPTION" '.attachments[] | select(.caption == $caption) | .id')"
customer_report_source="$(json_get "${API_BASE}/jobs/${job_id}/customer-report-source-data" "$token")"

create_customer_report="$(json_post "${API_BASE}/customer-reports" "{\"jobId\":\"${job_id}\",\"type\":\"INCIDENT\",\"title\":\"${CUSTOMER_REPORT_TITLE}\",\"recipientName\":\"Phase 7 Recipient ${SMOKE_SUFFIX}\",\"periodStart\":\"2026-04-18T08:00:00.000Z\",\"periodEnd\":\"2026-04-18T12:00:00.000Z\",\"issueSummary\":\"Customer-visible leak summary\",\"findingSummary\":\"Approved worker finding copied into customer proof\",\"workPerformedSummary\":\"Water supply isolated and area secured\",\"workStillNeededSummary\":\"Damaged connector still needs replacement\",\"followUpSummary\":\"Office will schedule the repair\",\"costSummaryText\":\"Selected lines and the complete job summary are attached\",\"internalNotes\":\"Phase 7 draft proof\",\"selectedJobReportIds\":[\"${worker_finding_id}\"],\"selectedAttachmentIds\":[\"${phase7_attachment_id}\"],\"selectedCostLineIds\":[\"${material_cost_id}\",\"${labor_cost_id}\"],\"includeFullCostSummary\":true}" "$token")"
customer_report_id="$(printf '%s' "$create_customer_report" | jq -r '.customerReport.id')"
customer_report_list="$(json_get "${API_BASE}/customer-reports?jobId=${job_id}" "$token")"
customer_report_detail="$(json_get "${API_BASE}/customer-reports/${customer_report_id}" "$token")"
update_customer_report="$(json_patch "${API_BASE}/customer-reports/${customer_report_id}" "{\"title\":\"${UPDATED_CUSTOMER_REPORT_TITLE}\",\"internalNotes\":\"Updated Phase 7 draft proof\"}" "$token")"

ineligible_customer_report_source_status="$(curl -sS -o "${TMP_DIR}/ineligible-customer-report-source.json" -w '%{http_code}' -X POST "${API_BASE}/customer-reports" -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' -d "{\"jobId\":\"${job_id}\",\"type\":\"INCIDENT\",\"title\":\"Invalid unapproved source\",\"recipientName\":\"Validation\",\"selectedJobReportIds\":[\"${revision_report_id}\"]}")"
duplicate_customer_report_source_status="$(curl -sS -o "${TMP_DIR}/duplicate-customer-report-source.json" -w '%{http_code}' -X POST "${API_BASE}/customer-reports" -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' -d "{\"jobId\":\"${job_id}\",\"type\":\"INCIDENT\",\"title\":\"Invalid duplicate source\",\"recipientName\":\"Validation\",\"selectedJobReportIds\":[\"${worker_finding_id}\",\"${worker_finding_id}\"]}")"
wrong_job_customer_report_report_status="$(curl -sS -o "${TMP_DIR}/wrong-job-customer-report-report.json" -w '%{http_code}' -X POST "${API_BASE}/customer-reports" -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' -d "{\"jobId\":\"${linked_job_id}\",\"type\":\"OTHER\",\"title\":\"Invalid wrong-job report source\",\"recipientName\":\"Validation\",\"selectedJobReportIds\":[\"${worker_finding_id}\"]}")"
wrong_job_customer_report_attachment_status="$(curl -sS -o "${TMP_DIR}/wrong-job-customer-report-attachment.json" -w '%{http_code}' -X POST "${API_BASE}/customer-reports" -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' -d "{\"jobId\":\"${linked_job_id}\",\"type\":\"OTHER\",\"title\":\"Invalid wrong-job attachment source\",\"recipientName\":\"Validation\",\"selectedAttachmentIds\":[\"${phase7_attachment_id}\"]}")"
wrong_job_customer_report_cost_status="$(curl -sS -o "${TMP_DIR}/wrong-job-customer-report-cost.json" -w '%{http_code}' -X POST "${API_BASE}/customer-reports" -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' -d "{\"jobId\":\"${linked_job_id}\",\"type\":\"OTHER\",\"title\":\"Invalid wrong-job cost source\",\"recipientName\":\"Validation\",\"selectedCostLineIds\":[\"${material_cost_id}\"]}")"

invalid_draft_approval_status="$(curl -sS -o "${TMP_DIR}/invalid-draft-approval.json" -w '%{http_code}' -X PATCH "${API_BASE}/customer-reports/${customer_report_id}/status" -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' -d '{"status":"APPROVED"}')"
ready_customer_report="$(json_patch "${API_BASE}/customer-reports/${customer_report_id}/status" '{"status":"READY_FOR_REVIEW"}' "$token")"
ready_customer_report_update_status="$(curl -sS -o "${TMP_DIR}/ready-customer-report-update.json" -w '%{http_code}' -X PATCH "${API_BASE}/customer-reports/${customer_report_id}" -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' -d '{"internalNotes":"Forbidden ready update"}')"
draft_again_customer_report="$(json_patch "${API_BASE}/customer-reports/${customer_report_id}/status" '{"status":"DRAFT"}' "$token")"
ready_again_customer_report="$(json_patch "${API_BASE}/customer-reports/${customer_report_id}/status" '{"status":"READY_FOR_REVIEW"}' "$token")"
approved_customer_report="$(json_patch "${API_BASE}/customer-reports/${customer_report_id}/status" '{"status":"APPROVED"}' "$token")"
invalid_approved_draft_status="$(curl -sS -o "${TMP_DIR}/invalid-approved-draft.json" -w '%{http_code}' -X PATCH "${API_BASE}/customer-reports/${customer_report_id}/status" -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' -d '{"status":"DRAFT"}')"

worker_customer_report_source_status="$(curl -sS -o "${TMP_DIR}/worker-customer-report-source.json" -w '%{http_code}' "${API_BASE}/jobs/${job_id}/customer-report-source-data" -H "Authorization: Bearer ${worker_token}")"
worker_customer_report_list_status="$(curl -sS -o "${TMP_DIR}/worker-customer-report-list.json" -w '%{http_code}' "${API_BASE}/customer-reports?jobId=${job_id}" -H "Authorization: Bearer ${worker_token}")"
worker_customer_report_detail_status="$(curl -sS -o "${TMP_DIR}/worker-customer-report-detail.json" -w '%{http_code}' "${API_BASE}/customer-reports/${customer_report_id}" -H "Authorization: Bearer ${worker_token}")"
worker_customer_report_create_status="$(curl -sS -o "${TMP_DIR}/worker-customer-report-create.json" -w '%{http_code}' -X POST "${API_BASE}/customer-reports" -H "Authorization: Bearer ${worker_token}" -H 'Content-Type: application/json' -d "{\"jobId\":\"${job_id}\",\"type\":\"OTHER\",\"title\":\"Forbidden worker customer report\",\"recipientName\":\"Validation\"}")"
worker_customer_report_update_status="$(curl -sS -o "${TMP_DIR}/worker-customer-report-update.json" -w '%{http_code}' -X PATCH "${API_BASE}/customer-reports/${customer_report_id}" -H "Authorization: Bearer ${worker_token}" -H 'Content-Type: application/json' -d '{"title":"Forbidden worker update"}')"
worker_customer_report_status_status="$(curl -sS -o "${TMP_DIR}/worker-customer-report-status.json" -w '%{http_code}' -X PATCH "${API_BASE}/customer-reports/${customer_report_id}/status" -H "Authorization: Bearer ${worker_token}" -H 'Content-Type: application/json' -d '{"status":"ARCHIVED"}')"

phase7_mutated_job="$(json_patch "${API_BASE}/jobs/${job_id}" "{\"title\":\"${PHASE7_MUTATED_JOB_TITLE}\",\"customerName\":\"Phase 7 Mutated Legacy Customer\",\"location\":\"Phase 7 Mutated Location\"}" "$token")"
phase7_mutated_customer="$(json_patch "${API_BASE}/customers/${customer_id}" "{\"name\":\"${PHASE7_MUTATED_CUSTOMER_NAME}\"}" "$token")"
phase7_mutated_address="$(json_patch "${API_BASE}/addresses/${address_id}" '{"street":"Changed Street 99"}' "$token")"
phase7_mutated_object="$(json_patch "${API_BASE}/objects/${object_id}" "{\"name\":\"${PHASE7_MUTATED_OBJECT_NAME}\"}" "$token")"
phase7_mutated_area="$(json_patch "${API_BASE}/objects/${object_id}/areas/${area_id}" "{\"name\":\"${PHASE7_MUTATED_AREA_NAME}\"}" "$token")"
phase7_mutated_material_cost="$(json_patch "${API_BASE}/jobs/${job_id}/costs/${material_cost_id}" '{"quantity":4,"notes":"Phase 7 live-source mutation"}' "$token")"
customer_report_source_after_mutation="$(json_get "${API_BASE}/jobs/${job_id}/customer-report-source-data" "$token")"
customer_report_after_mutation="$(json_get "${API_BASE}/customer-reports/${customer_report_id}" "$token")"
archived_customer_report="$(json_patch "${API_BASE}/customer-reports/${customer_report_id}/status" '{"status":"ARCHIVED"}' "$token")"

create_archived_draft_report="$(json_post "${API_BASE}/customer-reports" "{\"jobId\":\"${job_id}\",\"type\":\"OTHER\",\"title\":\"Phase 7 direct archive ${SMOKE_SUFFIX}\",\"recipientName\":\"Phase 7 Recipient ${SMOKE_SUFFIX}\",\"issueSummary\":\"Direct draft archive proof\"}" "$token")"
archived_draft_report_id="$(printf '%s' "$create_archived_draft_report" | jq -r '.customerReport.id')"
archived_draft_report="$(json_patch "${API_BASE}/customer-reports/${archived_draft_report_id}/status" '{"status":"ARCHIVED"}' "$token")"

other_login="$(json_post "${API_BASE}/auth/development-login" '{"email":"owner@otherco.example.de","displayName":"Other Owner","companySlug":"otherco","companyName":"Other Co","membershipRole":"OWNER"}')"
other_token="$(printf '%s' "$other_login" | jq -r '.token')"
cross_report_read_status="$(curl -sS -o "${TMP_DIR}/cross-report-read.json" -w '%{http_code}' "${API_BASE}/jobs/${job_id}/reports" -H "Authorization: Bearer ${other_token}")"
cross_report_review_status="$(curl -sS -o "${TMP_DIR}/cross-report-review.json" -w '%{http_code}' -X PATCH "${API_BASE}/jobs/${job_id}/reports/${worker_finding_id}/review" -H "Authorization: Bearer ${other_token}" -H 'Content-Type: application/json' -d '{"reviewStatus":"REJECTED"}')"
cross_status="$(curl -sS -o "${TMP_DIR}/cross-company.json" -w '%{http_code}' "${API_BASE}/jobs/${job_id}" -H "Authorization: Bearer ${other_token}")"
cross_body="$(cat "${TMP_DIR}/cross-company.json")"
cross_object_status="$(curl -sS -o "${TMP_DIR}/cross-object.json" -w '%{http_code}' "${API_BASE}/objects/${object_id}" -H "Authorization: Bearer ${other_token}")"
other_address="$(json_post "${API_BASE}/addresses" '{"label":"Other Address","street":"Other Street 1","postalCode":"10115","city":"Berlin","country":"DE"}' "$other_token")"
other_address_id="$(printf '%s' "$other_address" | jq -r '.id')"
other_customer="$(json_post "${API_BASE}/customers" '{"name":"Other Customer","type":"OTHER"}' "$other_token")"
other_customer_id="$(printf '%s' "$other_customer" | jq -r '.id')"
other_object="$(json_post "${API_BASE}/objects" "{\"customerId\":\"${other_customer_id}\",\"addressId\":\"${other_address_id}\",\"name\":\"Other Object\",\"type\":\"OTHER\"}" "$other_token")"
other_object_id="$(printf '%s' "$other_object" | jq -r '.id')"
other_area="$(json_post "${API_BASE}/objects/${other_object_id}/areas" '{"name":"Other Area","type":"OTHER"}' "$other_token")"
other_area_id="$(printf '%s' "$other_area" | jq -r '.id')"
other_item_category="$(json_post "${API_BASE}/item-categories" "{\"name\":\"Other Category ${SMOKE_SUFFIX}\",\"kind\":\"OTHER\"}" "$other_token")"
other_item_category_id="$(printf '%s' "$other_item_category" | jq -r '.id')"
other_item="$(json_post "${API_BASE}/items" "{\"categoryId\":\"${other_item_category_id}\",\"name\":\"Other Item ${SMOKE_SUFFIX}\",\"kind\":\"OTHER\",\"unit\":\"PIECE\",\"trackingMode\":\"QUANTITY\",\"quantity\":1}" "$other_token")"
other_item_id="$(printf '%s' "$other_item" | jq -r '.id')"
other_assignment="$(json_post "${API_BASE}/assignments" "{\"sourceType\":\"ITEM\",\"sourceId\":\"${other_item_id}\",\"targetType\":\"OBJECT\",\"targetId\":\"${other_object_id}\",\"kind\":\"ALLOCATED\"}" "$other_token")"
other_assignment_id="$(printf '%s' "$other_assignment" | jq -r '.id')"
other_phase7_job="$(json_post "${API_BASE}/jobs" "{\"title\":\"Other Phase 7 Job ${SMOKE_SUFFIX}\",\"description\":\"Foreign source validation fixture\",\"customerName\":\"Other Legacy Customer\",\"location\":\"Other Street 1, Berlin\",\"scheduledStart\":\"2026-04-21T08:00:00.000Z\",\"priority\":\"NORMAL\",\"customerId\":\"${other_customer_id}\",\"addressId\":\"${other_address_id}\",\"objectId\":\"${other_object_id}\",\"objectAreaId\":\"${other_area_id}\"}" "$other_token")"
other_phase7_job_id="$(printf '%s' "$other_phase7_job" | jq -r '.job.id')"
other_phase7_report="$(json_post "${API_BASE}/jobs/${other_phase7_job_id}/reports" '{"type":"INCIDENT_REPORT","summary":"Other company approved finding","findingSummary":"Foreign tenant finding proof","followUpRequired":false}' "$other_token")"
other_phase7_report_id="$(printf '%s' "$other_phase7_report" | jq -r '.reports[] | select(.summary == "Other company approved finding") | .id')"
other_phase7_approved_report="$(json_patch "${API_BASE}/jobs/${other_phase7_job_id}/reports/${other_phase7_report_id}/review" '{"reviewStatus":"APPROVED","reviewNotes":"Foreign source fixture approved"}' "$other_token")"
other_phase7_attachment_upload="$(curl -fsS -X POST "${API_BASE}/jobs/${other_phase7_job_id}/attachments" \
  -H "Authorization: Bearer ${other_token}" \
  -F "kind=PHOTO" \
  -F "caption=${OTHER_PHASE7_ATTACHMENT_CAPTION}" \
  -F "reportId=${other_phase7_report_id}" \
  -F "file=@${proof_upload_path};type=image/jpeg")"
other_phase7_attachment_id="$(printf '%s' "$other_phase7_attachment_upload" | jq -r --arg caption "$OTHER_PHASE7_ATTACHMENT_CAPTION" '.attachments[] | select(.caption == $caption) | .id')"
other_phase7_cost="$(json_post "${API_BASE}/jobs/${other_phase7_job_id}/costs" '{"kind":"OTHER","description":"Foreign tenant cost source","quantity":1,"unit":"FLAT_RATE","totalCost":9,"currency":"EUR","costDate":"2026-04-21T10:00:00.000Z"}' "$other_token")"
other_phase7_cost_id="$(printf '%s' "$other_phase7_cost" | jq -r '.id')"
cross_customer_report_source_status="$(curl -sS -o "${TMP_DIR}/cross-customer-report-source.json" -w '%{http_code}' "${API_BASE}/jobs/${job_id}/customer-report-source-data" -H "Authorization: Bearer ${other_token}")"
cross_customer_report_read_status="$(curl -sS -o "${TMP_DIR}/cross-customer-report-read.json" -w '%{http_code}' "${API_BASE}/customer-reports/${customer_report_id}" -H "Authorization: Bearer ${other_token}")"
cross_customer_report_selected_report_status="$(curl -sS -o "${TMP_DIR}/cross-customer-report-selected-report.json" -w '%{http_code}' -X POST "${API_BASE}/customer-reports" -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' -d "{\"jobId\":\"${job_id}\",\"type\":\"OTHER\",\"title\":\"Invalid foreign report source\",\"recipientName\":\"Validation\",\"selectedJobReportIds\":[\"${other_phase7_report_id}\"]}")"
cross_customer_report_selected_attachment_status="$(curl -sS -o "${TMP_DIR}/cross-customer-report-selected-attachment.json" -w '%{http_code}' -X POST "${API_BASE}/customer-reports" -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' -d "{\"jobId\":\"${job_id}\",\"type\":\"OTHER\",\"title\":\"Invalid foreign attachment source\",\"recipientName\":\"Validation\",\"selectedAttachmentIds\":[\"${other_phase7_attachment_id}\"]}")"
cross_customer_report_selected_cost_status="$(curl -sS -o "${TMP_DIR}/cross-customer-report-selected-cost.json" -w '%{http_code}' -X POST "${API_BASE}/customer-reports" -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' -d "{\"jobId\":\"${job_id}\",\"type\":\"OTHER\",\"title\":\"Invalid foreign cost source\",\"recipientName\":\"Validation\",\"selectedCostLineIds\":[\"${other_phase7_cost_id}\"]}")"
cross_relation_status="$(curl -sS -o "${TMP_DIR}/cross-relation.json" -w '%{http_code}' -X POST "${API_BASE}/objects" -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' -d "{\"addressId\":\"${other_address_id}\",\"name\":\"Invalid Cross Tenant Object\",\"type\":\"OTHER\"}")"
cross_job_relation_status="$(curl -sS -o "${TMP_DIR}/cross-job-relation.json" -w '%{http_code}' -X POST "${API_BASE}/jobs" -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' -d "{\"title\":\"Invalid Cross Tenant Job\",\"customerName\":\"Validation\",\"location\":\"Validation\",\"scheduledStart\":\"2026-04-20T10:00:00.000Z\",\"priority\":\"NORMAL\",\"addressId\":\"${other_address_id}\"}")"
cross_job_customer_status="$(curl -sS -o "${TMP_DIR}/cross-job-customer.json" -w '%{http_code}' -X POST "${API_BASE}/jobs" -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' -d "{\"title\":\"Invalid Cross Tenant Customer\",\"customerName\":\"Validation\",\"location\":\"Validation\",\"scheduledStart\":\"2026-04-20T12:00:00.000Z\",\"priority\":\"NORMAL\",\"customerId\":\"${other_customer_id}\"}")"
cross_job_object_status="$(curl -sS -o "${TMP_DIR}/cross-job-object.json" -w '%{http_code}' -X POST "${API_BASE}/jobs" -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' -d "{\"title\":\"Invalid Cross Tenant Object Job\",\"customerName\":\"Validation\",\"location\":\"Validation\",\"scheduledStart\":\"2026-04-20T13:00:00.000Z\",\"priority\":\"NORMAL\",\"objectId\":\"${other_object_id}\"}")"
cross_job_area_status="$(curl -sS -o "${TMP_DIR}/cross-job-area.json" -w '%{http_code}' -X POST "${API_BASE}/jobs" -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' -d "{\"title\":\"Invalid Cross Tenant Area Job\",\"customerName\":\"Validation\",\"location\":\"Validation\",\"scheduledStart\":\"2026-04-20T14:00:00.000Z\",\"priority\":\"NORMAL\",\"objectId\":\"${object_id}\",\"objectAreaId\":\"${other_area_id}\"}")"
cross_item_status="$(curl -sS -o "${TMP_DIR}/cross-item.json" -w '%{http_code}' "${API_BASE}/items/${other_item_id}" -H "Authorization: Bearer ${token}")"
cross_item_category_status="$(curl -sS -o "${TMP_DIR}/cross-item-category.json" -w '%{http_code}' -X PATCH "${API_BASE}/item-categories/${other_item_category_id}" -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' -d '{"description":"Forbidden cross-company update"}')"
cross_item_relation_status="$(curl -sS -o "${TMP_DIR}/cross-item-relation.json" -w '%{http_code}' -X POST "${API_BASE}/items" -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' -d "{\"categoryId\":\"${other_item_category_id}\",\"name\":\"Invalid Cross Tenant Item\",\"kind\":\"OTHER\",\"unit\":\"PIECE\",\"trackingMode\":\"QUANTITY\",\"quantity\":1}")"
cross_assignment_read_status="$(curl -sS -o "${TMP_DIR}/cross-assignment-read.json" -w '%{http_code}' "${API_BASE}/assignments/${other_assignment_id}" -H "Authorization: Bearer ${token}")"
cross_assignment_source_status="$(curl -sS -o "${TMP_DIR}/cross-assignment-source.json" -w '%{http_code}' -X POST "${API_BASE}/assignments" -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' -d "{\"sourceType\":\"ITEM\",\"sourceId\":\"${other_item_id}\",\"targetType\":\"JOB\",\"targetId\":\"${job_id}\",\"kind\":\"OTHER\"}")"
cross_assignment_target_status="$(curl -sS -o "${TMP_DIR}/cross-assignment-target.json" -w '%{http_code}' -X POST "${API_BASE}/assignments" -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' -d "{\"sourceType\":\"ITEM\",\"sourceId\":\"${quantity_item_id}\",\"targetType\":\"OBJECT\",\"targetId\":\"${other_object_id}\",\"kind\":\"OTHER\"}")"
cross_cost_job_status="$(curl -sS -o "${TMP_DIR}/cross-cost-job.json" -w '%{http_code}' "${API_BASE}/jobs/${job_id}/costs" -H "Authorization: Bearer ${other_token}")"
cross_cost_update_status="$(curl -sS -o "${TMP_DIR}/cross-cost-update.json" -w '%{http_code}' -X PATCH "${API_BASE}/jobs/${job_id}/costs/${material_cost_id}" -H "Authorization: Bearer ${other_token}" -H 'Content-Type: application/json' -d '{"notes":"Forbidden cross-company update"}')"
cross_cost_item_status="$(curl -sS -o "${TMP_DIR}/cross-cost-item.json" -w '%{http_code}' -X POST "${API_BASE}/jobs/${job_id}/costs" -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' -d "{\"itemId\":\"${other_item_id}\",\"kind\":\"MATERIAL_USED\",\"description\":\"Forbidden cross-company item\",\"quantity\":1,\"unit\":\"PIECE\",\"unitCost\":1}")"

unrelated_worker_login="$(json_post "${API_BASE}/auth/development-login" '{"email":"unrelated.worker@luetjens.example.de","displayName":"Unrelated Worker","companySlug":"luetjens","companyName":"Luetjens Service","membershipRole":"WORKER"}')"
unrelated_worker_token="$(printf '%s' "$unrelated_worker_login" | jq -r '.token')"

workday_sheet_options="$(json_get "${API_BASE}/workday-sheets/options" "$token")"
create_workday_sheet="$(json_post "${API_BASE}/workday-sheets" "{\"date\":\"${WORKDAY_SHEET_DATE}\",\"title\":\"${WORKDAY_SHEET_TITLE}\",\"teamId\":\"${team_id}\",\"workerUserId\":\"${worker_user_id}\",\"internalNotes\":\"Office-only Phase 8 note\",\"rows\":[{\"startTime\":\"07:00\",\"endTime\":\"09:00\",\"plannedText\":\"Musterstr. 1 - Treppen und H.M.S.\",\"notes\":\"Phase 8 linked row\",\"customerId\":\"${customer_id}\",\"addressId\":\"${address_id}\",\"objectId\":\"${object_id}\",\"objectAreaId\":\"${area_id}\",\"jobId\":\"${job_id}\"}]}" "$token")"
workday_sheet_id="$(printf '%s' "$create_workday_sheet" | jq -r '.workdaySheet.id')"
workday_sheet_row_id="$(printf '%s' "$create_workday_sheet" | jq -r '.workdaySheet.rows[0].id')"
update_workday_sheet="$(json_patch "${API_BASE}/workday-sheets/${workday_sheet_id}" "{\"title\":\"${UPDATED_WORKDAY_SHEET_TITLE}\"}" "$token")"
update_workday_sheet_row="$(json_patch "${API_BASE}/workday-sheets/${workday_sheet_id}/rows/${workday_sheet_row_id}" '{"plannedText":"Musterstr. 1 - Treppen, H.M.S. und Eingang pruefen"}' "$token")"
add_workday_sheet_row="$(json_post "${API_BASE}/workday-sheets/${workday_sheet_id}/rows" '{"startTime":"11:00","plannedText":"Tischler reinlassen / Schluesseluebergabe"}' "$token")"
workday_sheet_second_row_id="$(printf '%s' "$add_workday_sheet_row" | jq -r '.workdaySheet.rows[1].id')"
workday_sheet_list="$(json_get "${API_BASE}/workday-sheets" "$token")"
filtered_workday_sheet_list="$(json_get "${API_BASE}/workday-sheets?date=${WORKDAY_SHEET_DATE}&status=DRAFT&teamId=${team_id}&workerUserId=${worker_user_id}" "$token")"
invalid_workday_filter_status="$(curl -sS -o "${TMP_DIR}/invalid-workday-filter.json" -w '%{http_code}' "${API_BASE}/workday-sheets?status=NOT_A_STATUS" -H "Authorization: Bearer ${token}")"
worker_draft_read_status="$(curl -sS -o "${TMP_DIR}/worker-draft-sheet.json" -w '%{http_code}' "${API_BASE}/workday-sheets/${workday_sheet_id}" -H "Authorization: Bearer ${worker_token}")"
worker_create_sheet_status="$(curl -sS -o "${TMP_DIR}/worker-create-sheet.json" -w '%{http_code}' -X POST "${API_BASE}/workday-sheets" -H "Authorization: Bearer ${worker_token}" -H 'Content-Type: application/json' -d '{"date":"2026-04-22","rows":[{"plannedText":"Forbidden worker plan"}]}')"
worker_sheet_options_status="$(curl -sS -o "${TMP_DIR}/worker-sheet-options.json" -w '%{http_code}' "${API_BASE}/workday-sheets/options" -H "Authorization: Bearer ${worker_token}")"
cross_workday_relation_status="$(curl -sS -o "${TMP_DIR}/cross-workday-relation.json" -w '%{http_code}' -X POST "${API_BASE}/workday-sheets" -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' -d "{\"date\":\"2026-04-22\",\"workerUserId\":\"${worker_user_id}\",\"rows\":[{\"plannedText\":\"Forbidden foreign relation\",\"customerId\":\"${other_customer_id}\"}]}")"
sent_workday_sheet="$(json_patch "${API_BASE}/workday-sheets/${workday_sheet_id}/status" '{"status":"SENT"}' "$token")"
worker_sent_workday_sheet="$(json_get "${API_BASE}/workday-sheets/${workday_sheet_id}" "$worker_token")"
worker_workday_sheet_list="$(json_get "${API_BASE}/workday-sheets" "$worker_token")"
unrelated_worker_workday_sheet_list="$(json_get "${API_BASE}/workday-sheets" "$unrelated_worker_token")"
unrelated_worker_read_status="$(curl -sS -o "${TMP_DIR}/unrelated-worker-sheet-read.json" -w '%{http_code}' "${API_BASE}/workday-sheets/${workday_sheet_id}" -H "Authorization: Bearer ${unrelated_worker_token}")"
unrelated_worker_update_status="$(curl -sS -o "${TMP_DIR}/unrelated-worker-sheet-update.json" -w '%{http_code}' -X PATCH "${API_BASE}/workday-sheets/${workday_sheet_id}/rows/${workday_sheet_row_id}" -H "Authorization: Bearer ${unrelated_worker_token}" -H 'Content-Type: application/json' -d '{"actualText":"Forbidden unrelated actual"}')"
unrelated_worker_submit_status="$(curl -sS -o "${TMP_DIR}/unrelated-worker-sheet-submit.json" -w '%{http_code}' -X PATCH "${API_BASE}/workday-sheets/${workday_sheet_id}/status" -H "Authorization: Bearer ${unrelated_worker_token}" -H 'Content-Type: application/json' -d '{"status":"SUBMITTED"}')"
worker_planned_update_status="$(curl -sS -o "${TMP_DIR}/worker-planned-update.json" -w '%{http_code}' -X PATCH "${API_BASE}/workday-sheets/${workday_sheet_id}/rows/${workday_sheet_row_id}" -H "Authorization: Bearer ${worker_token}" -H 'Content-Type: application/json' -d '{"plannedText":"Forbidden worker plan edit"}')"
worker_first_actual="$(json_patch "${API_BASE}/workday-sheets/${workday_sheet_id}/rows/${workday_sheet_row_id}" '{"actualText":"Treppen und Eingang gereinigt; Tuergriff locker festgestellt"}' "$worker_token")"
incomplete_workday_submit_status="$(curl -sS -o "${TMP_DIR}/incomplete-workday-submit.json" -w '%{http_code}' -X PATCH "${API_BASE}/workday-sheets/${workday_sheet_id}/status" -H "Authorization: Bearer ${worker_token}" -H 'Content-Type: application/json' -d '{"status":"SUBMITTED"}')"
worker_second_actual="$(json_patch "${API_BASE}/workday-sheets/${workday_sheet_id}/rows/${workday_sheet_second_row_id}" '{"actualText":"Tischler um 11:05 eingelassen und Schluessel zurueckgenommen"}' "$worker_token")"
worker_today_workday_sheets="$(json_get "${API_BASE}/workday-sheets/today" "$worker_token")"
unrelated_worker_today_workday_sheets="$(json_get "${API_BASE}/workday-sheets/today" "$unrelated_worker_token")"
office_actual_update_status="$(curl -sS -o "${TMP_DIR}/office-actual-update.json" -w '%{http_code}' -X PATCH "${API_BASE}/workday-sheets/${workday_sheet_id}/rows/${workday_sheet_row_id}" -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' -d '{"actualText":"Forbidden office actual edit"}')"
submitted_workday_sheet="$(json_patch "${API_BASE}/workday-sheets/${workday_sheet_id}/status" '{"status":"SUBMITTED"}' "$worker_token")"
post_submit_actual_status="$(curl -sS -o "${TMP_DIR}/post-submit-actual.json" -w '%{http_code}' -X PATCH "${API_BASE}/workday-sheets/${workday_sheet_id}/rows/${workday_sheet_row_id}" -H "Authorization: Bearer ${worker_token}" -H 'Content-Type: application/json' -d '{"actualText":"Forbidden late actual edit"}')"
worker_review_workday_status="$(curl -sS -o "${TMP_DIR}/worker-review-workday.json" -w '%{http_code}' -X PATCH "${API_BASE}/workday-sheets/${workday_sheet_id}/status" -H "Authorization: Bearer ${worker_token}" -H 'Content-Type: application/json' -d '{"status":"REVIEWED"}')"
invalid_workday_archive_status="$(curl -sS -o "${TMP_DIR}/invalid-workday-archive.json" -w '%{http_code}' -X PATCH "${API_BASE}/workday-sheets/${workday_sheet_id}/status" -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' -d '{"status":"ARCHIVED"}')"
reviewed_workday_sheet="$(json_patch "${API_BASE}/workday-sheets/${workday_sheet_id}/status" '{"status":"REVIEWED","reviewNotes":"Phase 8 office review complete"}' "$token")"
reviewed_plan_update_status="$(curl -sS -o "${TMP_DIR}/reviewed-plan-update.json" -w '%{http_code}' -X PATCH "${API_BASE}/workday-sheets/${workday_sheet_id}/rows/${workday_sheet_row_id}" -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' -d '{"plannedText":"Forbidden reviewed plan edit"}')"
archived_workday_sheet="$(json_patch "${API_BASE}/workday-sheets/${workday_sheet_id}/status" '{"status":"ARCHIVED"}' "$token")"
archived_actual_update_status="$(curl -sS -o "${TMP_DIR}/archived-actual-update.json" -w '%{http_code}' -X PATCH "${API_BASE}/workday-sheets/${workday_sheet_id}/rows/${workday_sheet_row_id}" -H "Authorization: Bearer ${worker_token}" -H 'Content-Type: application/json' -d '{"actualText":"Forbidden archived actual edit"}')"
repeat_workday_archive_status="$(curl -sS -o "${TMP_DIR}/repeat-workday-archive.json" -w '%{http_code}' -X PATCH "${API_BASE}/workday-sheets/${workday_sheet_id}/status" -H "Authorization: Bearer ${token}" -H 'Content-Type: application/json' -d '{"status":"ARCHIVED"}')"
cross_workday_read_status="$(curl -sS -o "${TMP_DIR}/cross-workday-read.json" -w '%{http_code}' "${API_BASE}/workday-sheets/${workday_sheet_id}" -H "Authorization: Bearer ${other_token}")"
job_detail="$(json_get "${API_BASE}/jobs/${job_id}" "$token")"

: > "$SUMMARY_INPUT"

append_summary_json health "$health"
append_summary_json session "$session"
append_summary_json dashboard "$dashboard"
append_summary_json teams "$teams"
append_summary_json addMember "$add_member"
append_summary_json createJob "$create_job"
append_summary_json assignTeam "$assign_team"
append_summary_json changeStatus "$change_status"
append_summary_json editJob "$edit_job"
append_summary_json createReport "$create_report"
append_summary_json uploadAttachment "$upload_attachment"
append_summary_json photos "$photos"
append_summary_json attachmentMeta "$attachment_meta"
append_summary_json jobDetail "$job_detail"
append_summary_json updateCustomer "$update_customer"
append_summary_json updateAddress "$update_address"
append_summary_json updateObject "$update_object"
append_summary_json updateArea "$update_area"
append_summary_json customers "$customers"
append_summary_json addresses "$addresses"
append_summary_json objects "$objects"
append_summary_json objectDetail "$object_detail"
append_summary_json relationOptions "$relation_options"
append_summary_json linkJob "$link_job"
append_summary_json linkedJob "$linked_job"
append_summary_json workerObjects "$worker_objects"
append_summary_json workerRelationOptions "$worker_relation_options"
append_summary_json createItemCategory "$create_item_category"
append_summary_json updateItemCategory "$update_item_category"
append_summary_json itemCategories "$item_categories"
append_summary_json createQuantityItem "$create_quantity_item"
append_summary_json quantityItemDetail "$quantity_item_detail"
append_summary_json updateQuantityItem "$update_quantity_item"
append_summary_json items "$items"
append_summary_json createSerializedItem "$create_serialized_item"
append_summary_json workerItemCategories "$worker_item_categories"
append_summary_json workerItems "$worker_items"
append_summary_json workerItemDetail "$worker_item_detail"
append_summary_json teamJobAssignment "$team_job_assignment"
append_summary_json itemJobAssignment "$item_job_assignment"
append_summary_json itemObjectAssignment "$item_object_assignment"
append_summary_json updateItemObjectAssignment "$update_item_object_assignment"
append_summary_json assignmentDetail "$assignment_detail"
append_summary_json assignments "$assignments"
append_summary_json assignmentOptions "$assignment_options"
append_summary_json jobAfterAssignments "$job_after_assignments"
append_summary_json materialCost "$material_cost"
append_summary_json laborCost "$labor_cost"
append_summary_json externalCost "$external_cost"
append_summary_json updateMaterialCost "$update_material_cost"
append_summary_json jobCosts "$job_costs"
append_summary_json jobCostSummary "$job_cost_summary"
append_summary_json workerAssignments "$worker_assignments"
append_summary_json workerAssignmentOptions "$worker_assignment_options"
append_summary_json workerAssignmentDetail "$worker_assignment_detail"
append_summary_json workerJobCosts "$worker_job_costs"
append_summary_json workerJobCostSummary "$worker_job_cost_summary"
append_summary_json addWorkerMember "$add_worker_member"
append_summary_json workerFinding "$worker_finding"
append_summary_json approveWorkerFinding "$approve_worker_finding"
append_summary_json needsRevisionReport "$needs_revision_report"
append_summary_json customerReportSource "$customer_report_source"
append_summary_json createCustomerReport "$create_customer_report"
append_summary_json customerReportList "$customer_report_list"
append_summary_json customerReportDetail "$customer_report_detail"
append_summary_json updateCustomerReport "$update_customer_report"
append_summary_json readyCustomerReport "$ready_customer_report"
append_summary_json draftAgainCustomerReport "$draft_again_customer_report"
append_summary_json readyAgainCustomerReport "$ready_again_customer_report"
append_summary_json approvedCustomerReport "$approved_customer_report"
append_summary_json phase7MutatedMaterialCost "$phase7_mutated_material_cost"
append_summary_json customerReportSourceAfterMutation "$customer_report_source_after_mutation"
append_summary_json customerReportAfterMutation "$customer_report_after_mutation"
append_summary_json archivedCustomerReport "$archived_customer_report"
append_summary_json createArchivedDraftReport "$create_archived_draft_report"
append_summary_json archivedDraftReport "$archived_draft_report"
append_summary_json workdaySheetOptions "$workday_sheet_options"
append_summary_json createWorkdaySheet "$create_workday_sheet"
append_summary_json updateWorkdaySheet "$update_workday_sheet"
append_summary_json updateWorkdaySheetRow "$update_workday_sheet_row"
append_summary_json addWorkdaySheetRow "$add_workday_sheet_row"
append_summary_json workdaySheetList "$workday_sheet_list"
append_summary_json filteredWorkdaySheetList "$filtered_workday_sheet_list"
append_summary_json sentWorkdaySheet "$sent_workday_sheet"
append_summary_json workerSentWorkdaySheet "$worker_sent_workday_sheet"
append_summary_json workerWorkdaySheetList "$worker_workday_sheet_list"
append_summary_json unrelatedWorkerWorkdaySheetList "$unrelated_worker_workday_sheet_list"
append_summary_json workerFirstActual "$worker_first_actual"
append_summary_json workerSecondActual "$worker_second_actual"
append_summary_json workerTodayWorkdaySheets "$worker_today_workday_sheets"
append_summary_json unrelatedWorkerTodayWorkdaySheets "$unrelated_worker_today_workday_sheets"
append_summary_json submittedWorkdaySheet "$submitted_workday_sheet"
append_summary_json reviewedWorkdaySheet "$reviewed_workday_sheet"
append_summary_json archivedWorkdaySheet "$archived_workday_sheet"

append_summary_string crossStatus "$cross_status"
append_summary_string crossBody "$cross_body"
append_summary_string crossObjectStatus "$cross_object_status"
append_summary_string crossRelationStatus "$cross_relation_status"
append_summary_string crossJobRelationStatus "$cross_job_relation_status"
append_summary_string crossJobCustomerStatus "$cross_job_customer_status"
append_summary_string crossJobObjectStatus "$cross_job_object_status"
append_summary_string crossJobAreaStatus "$cross_job_area_status"
append_summary_string missingObjectStatus "$missing_object_status"
append_summary_string mismatchedAreaStatus "$mismatched_area_status"
append_summary_string workerWriteStatus "$worker_write_status"
append_summary_string workerJobWriteStatus "$worker_job_write_status"
append_summary_string workerCategoryWriteStatus "$worker_category_write_status"
append_summary_string workerItemWriteStatus "$worker_item_write_status"
append_summary_string duplicateCustomIdStatus "$duplicate_custom_id_status"
append_summary_string invalidSerializedStatus "$invalid_serialized_status"
append_summary_string crossItemStatus "$cross_item_status"
append_summary_string crossItemCategoryStatus "$cross_item_category_status"
append_summary_string crossItemRelationStatus "$cross_item_relation_status"
append_summary_string duplicateActiveAssignmentStatus "$duplicate_active_assignment_status"
append_summary_string invalidAssignmentTimeStatus "$invalid_assignment_time_status"
append_summary_string workerAssignmentWriteStatus "$worker_assignment_write_status"
append_summary_string workerAssignmentUpdateStatus "$worker_assignment_update_status"
append_summary_string workerReviewStatus "$worker_review_status"
append_summary_string workerInaccessibleReportStatus "$worker_inaccessible_report_status"
append_summary_string wrongJobReportReviewStatus "$wrong_job_report_review_status"
append_summary_string invalidFindingStatus "$invalid_finding_status"
append_summary_string crossReportReadStatus "$cross_report_read_status"
append_summary_string crossReportReviewStatus "$cross_report_review_status"
append_summary_string crossAssignmentReadStatus "$cross_assignment_read_status"
append_summary_string crossAssignmentSourceStatus "$cross_assignment_source_status"
append_summary_string crossAssignmentTargetStatus "$cross_assignment_target_status"
append_summary_string wrongJobCostStatus "$wrong_job_cost_status"
append_summary_string workerCostWriteStatus "$worker_cost_write_status"
append_summary_string workerCostUpdateStatus "$worker_cost_update_status"
append_summary_string crossCostJobStatus "$cross_cost_job_status"
append_summary_string crossCostUpdateStatus "$cross_cost_update_status"
append_summary_string crossCostItemStatus "$cross_cost_item_status"
append_summary_string attachmentFileStatus "$attachment_file_status"
append_summary_string firstJobId "$first_job_id"
append_summary_string teamName "$TEAM_NAME"
append_summary_string updatedJobTitle "$UPDATED_JOB_TITLE"
append_summary_string jobId "$job_id"
append_summary_string userId "$user_id"
append_summary_string customerId "$customer_id"
append_summary_string addressId "$address_id"
append_summary_string objectId "$object_id"
append_summary_string areaId "$area_id"
append_summary_string itemCategoryId "$item_category_id"
append_summary_string quantityItemId "$quantity_item_id"
append_summary_string serializedItemId "$serialized_item_id"
append_summary_string teamId "$team_id"
append_summary_string teamJobAssignmentId "$team_job_assignment_id"
append_summary_string itemJobAssignmentId "$item_job_assignment_id"
append_summary_string itemObjectAssignmentId "$item_object_assignment_id"
append_summary_string reportId "$report_id"
append_summary_string workerFindingId "$worker_finding_id"
append_summary_string workerUserId "$worker_user_id"
append_summary_string revisionReportId "$revision_report_id"
append_summary_string materialCostId "$material_cost_id"
append_summary_string laborCostId "$labor_cost_id"
append_summary_string externalCostId "$external_cost_id"
append_summary_string phase7AttachmentId "$phase7_attachment_id"
append_summary_string customerReportId "$customer_report_id"
append_summary_string customerReportTitle "$CUSTOMER_REPORT_TITLE"
append_summary_string updatedCustomerReportTitle "$UPDATED_CUSTOMER_REPORT_TITLE"
append_summary_string phase7MutatedJobTitle "$PHASE7_MUTATED_JOB_TITLE"
append_summary_string phase7MutatedCustomerName "$PHASE7_MUTATED_CUSTOMER_NAME"
append_summary_string phase7MutatedObjectName "$PHASE7_MUTATED_OBJECT_NAME"
append_summary_string phase7MutatedAreaName "$PHASE7_MUTATED_AREA_NAME"
append_summary_string ineligibleCustomerReportSourceStatus "$ineligible_customer_report_source_status"
append_summary_string duplicateCustomerReportSourceStatus "$duplicate_customer_report_source_status"
append_summary_string wrongJobCustomerReportReportStatus "$wrong_job_customer_report_report_status"
append_summary_string wrongJobCustomerReportAttachmentStatus "$wrong_job_customer_report_attachment_status"
append_summary_string wrongJobCustomerReportCostStatus "$wrong_job_customer_report_cost_status"
append_summary_string invalidDraftApprovalStatus "$invalid_draft_approval_status"
append_summary_string readyCustomerReportUpdateStatus "$ready_customer_report_update_status"
append_summary_string invalidApprovedDraftStatus "$invalid_approved_draft_status"
append_summary_string workerCustomerReportSourceStatus "$worker_customer_report_source_status"
append_summary_string workerCustomerReportListStatus "$worker_customer_report_list_status"
append_summary_string workerCustomerReportDetailStatus "$worker_customer_report_detail_status"
append_summary_string workerCustomerReportCreateStatus "$worker_customer_report_create_status"
append_summary_string workerCustomerReportUpdateStatus "$worker_customer_report_update_status"
append_summary_string workerCustomerReportStatusStatus "$worker_customer_report_status_status"
append_summary_string crossCustomerReportSourceStatus "$cross_customer_report_source_status"
append_summary_string crossCustomerReportReadStatus "$cross_customer_report_read_status"
append_summary_string crossCustomerReportSelectedReportStatus "$cross_customer_report_selected_report_status"
append_summary_string crossCustomerReportSelectedAttachmentStatus "$cross_customer_report_selected_attachment_status"
append_summary_string crossCustomerReportSelectedCostStatus "$cross_customer_report_selected_cost_status"
append_summary_string workdaySheetId "$workday_sheet_id"
append_summary_string workdaySheetRowId "$workday_sheet_row_id"
append_summary_string workdaySheetSecondRowId "$workday_sheet_second_row_id"
append_summary_string updatedWorkdaySheetTitle "$UPDATED_WORKDAY_SHEET_TITLE"
append_summary_string workdaySheetDate "$WORKDAY_SHEET_DATE"
append_summary_string invalidWorkdayFilterStatus "$invalid_workday_filter_status"
append_summary_string workerDraftReadStatus "$worker_draft_read_status"
append_summary_string workerCreateSheetStatus "$worker_create_sheet_status"
append_summary_string workerSheetOptionsStatus "$worker_sheet_options_status"
append_summary_string crossWorkdayRelationStatus "$cross_workday_relation_status"
append_summary_string unrelatedWorkerReadStatus "$unrelated_worker_read_status"
append_summary_string unrelatedWorkerUpdateStatus "$unrelated_worker_update_status"
append_summary_string unrelatedWorkerSubmitStatus "$unrelated_worker_submit_status"
append_summary_string workerPlannedUpdateStatus "$worker_planned_update_status"
append_summary_string incompleteWorkdaySubmitStatus "$incomplete_workday_submit_status"
append_summary_string officeActualUpdateStatus "$office_actual_update_status"
append_summary_string postSubmitActualStatus "$post_submit_actual_status"
append_summary_string workerReviewWorkdayStatus "$worker_review_workday_status"
append_summary_string invalidWorkdayArchiveStatus "$invalid_workday_archive_status"
append_summary_string reviewedPlanUpdateStatus "$reviewed_plan_update_status"
append_summary_string archivedActualUpdateStatus "$archived_actual_update_status"
append_summary_string repeatWorkdayArchiveStatus "$repeat_workday_archive_status"
append_summary_string crossWorkdayReadStatus "$cross_workday_read_status"

jq -s '
  from_entries |
  .health as $health |
  .session as $session |
  .dashboard as $dashboard |
  .teams as $teams |
  .addMember as $addMember |
  .createJob as $createJob |
  .assignTeam as $assignTeam |
  .changeStatus as $changeStatus |
  .editJob as $editJob |
  .createReport as $createReport |
  .uploadAttachment as $uploadAttachment |
  .photos as $photos |
  .attachmentMeta as $attachmentMeta |
  .jobDetail as $jobDetail |
  .updateCustomer as $updateCustomer |
  .updateAddress as $updateAddress |
  .updateObject as $updateObject |
  .updateArea as $updateArea |
  .customers as $customers |
  .addresses as $addresses |
  .objects as $objects |
  .objectDetail as $objectDetail |
  .relationOptions as $relationOptions |
  .linkJob as $linkJob |
  .linkedJob as $linkedJob |
  .workerObjects as $workerObjects |
  .workerRelationOptions as $workerRelationOptions |
  .createItemCategory as $createItemCategory |
  .updateItemCategory as $updateItemCategory |
  .itemCategories as $itemCategories |
  .createQuantityItem as $createQuantityItem |
  .quantityItemDetail as $quantityItemDetail |
  .updateQuantityItem as $updateQuantityItem |
  .items as $items |
  .createSerializedItem as $createSerializedItem |
  .workerItemCategories as $workerItemCategories |
  .workerItems as $workerItems |
  .workerItemDetail as $workerItemDetail |
  .teamJobAssignment as $teamJobAssignment |
  .itemJobAssignment as $itemJobAssignment |
  .itemObjectAssignment as $itemObjectAssignment |
  .updateItemObjectAssignment as $updateItemObjectAssignment |
  .assignmentDetail as $assignmentDetail |
  .assignments as $assignments |
  .assignmentOptions as $assignmentOptions |
  .jobAfterAssignments as $jobAfterAssignments |
  .materialCost as $materialCost |
  .laborCost as $laborCost |
  .externalCost as $externalCost |
  .updateMaterialCost as $updateMaterialCost |
  .jobCosts as $jobCosts |
  .jobCostSummary as $jobCostSummary |
  .workerAssignments as $workerAssignments |
  .workerAssignmentOptions as $workerAssignmentOptions |
  .workerAssignmentDetail as $workerAssignmentDetail |
  .workerJobCosts as $workerJobCosts |
  .workerJobCostSummary as $workerJobCostSummary |
  .addWorkerMember as $addWorkerMember |
  .workerFinding as $workerFinding |
  .approveWorkerFinding as $approveWorkerFinding |
  .needsRevisionReport as $needsRevisionReport |
  .customerReportSource as $customerReportSource |
  .createCustomerReport as $createCustomerReport |
  .customerReportList as $customerReportList |
  .customerReportDetail as $customerReportDetail |
  .updateCustomerReport as $updateCustomerReport |
  .readyCustomerReport as $readyCustomerReport |
  .draftAgainCustomerReport as $draftAgainCustomerReport |
  .readyAgainCustomerReport as $readyAgainCustomerReport |
  .approvedCustomerReport as $approvedCustomerReport |
  .phase7MutatedMaterialCost as $phase7MutatedMaterialCost |
  .customerReportSourceAfterMutation as $customerReportSourceAfterMutation |
  .customerReportAfterMutation as $customerReportAfterMutation |
  .archivedCustomerReport as $archivedCustomerReport |
  .createArchivedDraftReport as $createArchivedDraftReport |
  .archivedDraftReport as $archivedDraftReport |
  .crossStatus as $crossStatus |
  .crossBody as $crossBody |
  .crossObjectStatus as $crossObjectStatus |
  .crossRelationStatus as $crossRelationStatus |
  .crossJobRelationStatus as $crossJobRelationStatus |
  .crossJobCustomerStatus as $crossJobCustomerStatus |
  .crossJobObjectStatus as $crossJobObjectStatus |
  .crossJobAreaStatus as $crossJobAreaStatus |
  .missingObjectStatus as $missingObjectStatus |
  .mismatchedAreaStatus as $mismatchedAreaStatus |
  .workerWriteStatus as $workerWriteStatus |
  .workerJobWriteStatus as $workerJobWriteStatus |
  .workerCategoryWriteStatus as $workerCategoryWriteStatus |
  .workerItemWriteStatus as $workerItemWriteStatus |
  .duplicateCustomIdStatus as $duplicateCustomIdStatus |
  .invalidSerializedStatus as $invalidSerializedStatus |
  .crossItemStatus as $crossItemStatus |
  .crossItemCategoryStatus as $crossItemCategoryStatus |
  .crossItemRelationStatus as $crossItemRelationStatus |
  .duplicateActiveAssignmentStatus as $duplicateActiveAssignmentStatus |
  .invalidAssignmentTimeStatus as $invalidAssignmentTimeStatus |
  .workerAssignmentWriteStatus as $workerAssignmentWriteStatus |
  .workerAssignmentUpdateStatus as $workerAssignmentUpdateStatus |
  .workerReviewStatus as $workerReviewStatus |
  .workerInaccessibleReportStatus as $workerInaccessibleReportStatus |
  .wrongJobReportReviewStatus as $wrongJobReportReviewStatus |
  .invalidFindingStatus as $invalidFindingStatus |
  .crossReportReadStatus as $crossReportReadStatus |
  .crossReportReviewStatus as $crossReportReviewStatus |
  .crossAssignmentReadStatus as $crossAssignmentReadStatus |
  .crossAssignmentSourceStatus as $crossAssignmentSourceStatus |
  .crossAssignmentTargetStatus as $crossAssignmentTargetStatus |
  .wrongJobCostStatus as $wrongJobCostStatus |
  .workerCostWriteStatus as $workerCostWriteStatus |
  .workerCostUpdateStatus as $workerCostUpdateStatus |
  .crossCostJobStatus as $crossCostJobStatus |
  .crossCostUpdateStatus as $crossCostUpdateStatus |
  .crossCostItemStatus as $crossCostItemStatus |
  .attachmentFileStatus as $attachmentFileStatus |
  .firstJobId as $firstJobId |
  .teamName as $teamName |
  .updatedJobTitle as $updatedJobTitle |
  .jobId as $jobId |
  .userId as $userId |
  .customerId as $customerId |
  .addressId as $addressId |
  .objectId as $objectId |
  .areaId as $areaId |
  .itemCategoryId as $itemCategoryId |
  .quantityItemId as $quantityItemId |
  .serializedItemId as $serializedItemId |
  .teamId as $teamId |
  .teamJobAssignmentId as $teamJobAssignmentId |
  .itemJobAssignmentId as $itemJobAssignmentId |
  .itemObjectAssignmentId as $itemObjectAssignmentId |
  .reportId as $reportId |
  .workerFindingId as $workerFindingId |
  .workerUserId as $workerUserId |
  .revisionReportId as $revisionReportId |
  .materialCostId as $materialCostId |
  .laborCostId as $laborCostId |
  .externalCostId as $externalCostId |
  .phase7AttachmentId as $phase7AttachmentId |
  .customerReportId as $customerReportId |
  .customerReportTitle as $customerReportTitle |
  .updatedCustomerReportTitle as $updatedCustomerReportTitle |
  .phase7MutatedJobTitle as $phase7MutatedJobTitle |
  .phase7MutatedCustomerName as $phase7MutatedCustomerName |
  .phase7MutatedObjectName as $phase7MutatedObjectName |
  .phase7MutatedAreaName as $phase7MutatedAreaName |
  .ineligibleCustomerReportSourceStatus as $ineligibleCustomerReportSourceStatus |
  .duplicateCustomerReportSourceStatus as $duplicateCustomerReportSourceStatus |
  .wrongJobCustomerReportReportStatus as $wrongJobCustomerReportReportStatus |
  .wrongJobCustomerReportAttachmentStatus as $wrongJobCustomerReportAttachmentStatus |
  .wrongJobCustomerReportCostStatus as $wrongJobCustomerReportCostStatus |
  .invalidDraftApprovalStatus as $invalidDraftApprovalStatus |
  .readyCustomerReportUpdateStatus as $readyCustomerReportUpdateStatus |
  .invalidApprovedDraftStatus as $invalidApprovedDraftStatus |
  .workerCustomerReportSourceStatus as $workerCustomerReportSourceStatus |
  .workerCustomerReportListStatus as $workerCustomerReportListStatus |
  .workerCustomerReportDetailStatus as $workerCustomerReportDetailStatus |
  .workerCustomerReportCreateStatus as $workerCustomerReportCreateStatus |
  .workerCustomerReportUpdateStatus as $workerCustomerReportUpdateStatus |
  .workerCustomerReportStatusStatus as $workerCustomerReportStatusStatus |
  .crossCustomerReportSourceStatus as $crossCustomerReportSourceStatus |
  .crossCustomerReportReadStatus as $crossCustomerReportReadStatus |
  .crossCustomerReportSelectedReportStatus as $crossCustomerReportSelectedReportStatus |
  .crossCustomerReportSelectedAttachmentStatus as $crossCustomerReportSelectedAttachmentStatus |
  .crossCustomerReportSelectedCostStatus as $crossCustomerReportSelectedCostStatus |
  {
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
    legacyReportType: ($createReport.reports[] | select(.id == $reportId) | .type),
    legacyReportReviewStatus: ($createReport.reports[] | select(.id == $reportId) | .reviewStatus),
    reportAttachmentLinked: (
      [$jobDetail.job.attachments[] | select(.id == $attachmentMeta.attachment.id) | .report.id] |
      index($reportId) != null
    ),
    workerAddedToAssignedTeam: ([$addWorkerMember.members[].id] | index($workerUserId) != null),
    workerFindingCreated: (
      ($workerFinding.reports[] | select(.id == $workerFindingId) | .type) == "WORKER_FINDING" and
      ($workerFinding.reports[] | select(.id == $workerFindingId) | .reviewStatus) == "PENDING_REVIEW"
    ),
    workerFindingFollowUpRequired: ($workerFinding.reports[] | select(.id == $workerFindingId) | .followUpRequired),
    approvedReportStatus: $approveWorkerFinding.reviewStatus,
    approvedReportReviewerPresent: ($approveWorkerFinding.reviewedBy.id != null),
    needsRevisionReportStatus: $needsRevisionReport.reviewStatus,
    workerReviewStatus: $workerReviewStatus,
    workerInaccessibleReportStatus: $workerInaccessibleReportStatus,
    wrongJobReportReviewStatus: $wrongJobReportReviewStatus,
    invalidFindingStatus: $invalidFindingStatus,
    crossReportReadStatus: $crossReportReadStatus,
    crossReportReviewStatus: $crossReportReviewStatus,
    reportReviewActivityLogged: ([$jobDetail.job.activity[].title] | map(startswith("Bericht freigegeben:") or startswith("Bericht zur Ueberarbeitung zurueckgegeben:")) | any),
    updatedCustomerPhone: $updateCustomer.phone,
    updatedAddressNotes: $updateAddress.notes,
    updatedObjectNotes: $updateObject.notes,
    updatedAreaNotes: $updateArea.notes,
    customerCount: ($customers.customers | length),
    addressCount: ($addresses.addresses | length),
    objectCount: ($objects.objects | length),
    objectAreaCount: ($objectDetail.object.areas | length),
    legacyJobHasNoDirectoryLinks: (
      ($createJob.job.customerId == null) and
      ($createJob.job.addressId == null) and
      ($createJob.job.objectId == null) and
      ($createJob.job.objectAreaId == null)
    ),
    relationOptionsContainCreatedRecords: (
      ([$relationOptions.customers[].id] | index($customerId) != null) and
      ([$relationOptions.addresses[].id] | index($addressId) != null) and
      ([$relationOptions.objects[].id] | index($objectId) != null) and
      ([$relationOptions.objectAreas[].id] | index($areaId) != null)
    ),
    updatedJobRelationIdsMatch: (
      ($linkJob.job.customerId == $customerId) and
      ($linkJob.job.addressId == $addressId) and
      ($linkJob.job.objectId == $objectId) and
      ($linkJob.job.objectAreaId == $areaId)
    ),
    createdJobRelationIdsMatch: (
      ($linkedJob.job.customerId == $customerId) and
      ($linkedJob.job.addressId == $addressId) and
      ($linkedJob.job.objectId == $objectId) and
      ($linkedJob.job.objectAreaId == $areaId)
    ),
    relationActivityLogged: (
      ([$jobDetail.job.activity[].title] | index("Kundenverknuepfung geaendert") != null) and
      ([$jobDetail.job.activity[].title] | index("Adressverknuepfung geaendert") != null) and
      ([$jobDetail.job.activity[].title] | index("Objektverknuepfung geaendert") != null) and
      ([$jobDetail.job.activity[].title] | index("Objektbereichsverknuepfung geaendert") != null)
    ),
    missingObjectStatus: $missingObjectStatus,
    mismatchedAreaStatus: $mismatchedAreaStatus,
    workerObjectCount: ($workerObjects.objects | length),
    workerRelationOptionCount: ($workerRelationOptions.objects | length),
    workerWriteStatus: $workerWriteStatus,
    workerJobWriteStatus: $workerJobWriteStatus,
    crossCompanyStatus: $crossStatus,
    crossCompanyBody: $crossBody,
    crossObjectStatus: $crossObjectStatus,
    crossRelationStatus: $crossRelationStatus,
    crossJobRelationStatus: $crossJobRelationStatus,
    crossJobCustomerStatus: $crossJobCustomerStatus,
    crossJobObjectStatus: $crossJobObjectStatus,
    crossJobAreaStatus: $crossJobAreaStatus,
    createdItemCategoryKind: $createItemCategory.kind,
    updatedItemCategoryDescription: $updateItemCategory.description,
    itemCategoryListContainsCreated: ([$itemCategories.categories[].id] | index($itemCategoryId) != null),
    autoCustomIdGenerated: ($createQuantityItem.customId | test("^ITEM-[A-Z0-9]{12}$")),
    quantityItemCreateValue: $createQuantityItem.quantity,
    quantityItemDetailMatches: ($quantityItemDetail.item.id == $quantityItemId),
    quantityItemUpdatedValue: $updateQuantityItem.quantity,
    quantityItemUpdatedNotes: $updateQuantityItem.notes,
    itemListContainsCreated: ([$items.items[].id] | index($quantityItemId) != null),
    duplicateCustomIdStatus: $duplicateCustomIdStatus,
    serializedItemDefaultQuantity: $createSerializedItem.quantity,
    serializedItemCreated: ($createSerializedItem.id == $serializedItemId),
    invalidSerializedStatus: $invalidSerializedStatus,
    workerItemCategoryCount: ($workerItemCategories.categories | length),
    workerItemCount: ($workerItems.items | length),
    workerItemDetailMatches: ($workerItemDetail.item.id == $quantityItemId),
    workerCategoryWriteStatus: $workerCategoryWriteStatus,
    workerItemWriteStatus: $workerItemWriteStatus,
    crossItemStatus: $crossItemStatus,
    crossItemCategoryStatus: $crossItemCategoryStatus,
    crossItemRelationStatus: $crossItemRelationStatus,
    teamJobAssignmentValid: (
      ($teamJobAssignment.id == $teamJobAssignmentId) and
      ($teamJobAssignment.sourceType == "TEAM") and
      ($teamJobAssignment.targetType == "JOB")
    ),
    itemJobAssignmentValid: (
      ($itemJobAssignment.id == $itemJobAssignmentId) and
      ($itemJobAssignment.sourceType == "ITEM") and
      ($itemJobAssignment.targetType == "JOB")
    ),
    itemObjectAssignmentValid: (
      ($itemObjectAssignment.id == $itemObjectAssignmentId) and
      ($itemObjectAssignment.sourceType == "ITEM") and
      ($itemObjectAssignment.targetType == "OBJECT")
    ),
    assignmentUpdateStatus: $updateItemObjectAssignment.status,
    assignmentUpdateNotes: $updateItemObjectAssignment.notes,
    assignmentDetailMatches: ($assignmentDetail.assignment.id == $teamJobAssignmentId),
    assignmentListContainsCreated: (
      ([$assignments.assignments[].id] | index($teamJobAssignmentId) != null) and
      ([$assignments.assignments[].id] | index($itemJobAssignmentId) != null) and
      ([$assignments.assignments[].id] | index($itemObjectAssignmentId) != null)
    ),
    assignmentOptionsContainCreatedEntities: (
      ([$assignmentOptions.entities.TEAM[].id] | index($teamId) != null) and
      ([$assignmentOptions.entities.JOB[].id] | index($firstJobId) != null) and
      ([$assignmentOptions.entities.ITEM[].id] | index($quantityItemId) != null) and
      ([$assignmentOptions.entities.OBJECT[].id] | index($objectId) != null)
    ),
    duplicateActiveAssignmentStatus: $duplicateActiveAssignmentStatus,
    invalidAssignmentTimeStatus: $invalidAssignmentTimeStatus,
    jobTeamIdUnchangedAfterAssignments: ($jobAfterAssignments.job.assignedTeam.id == $teamId),
    workerAssignmentCount: ($workerAssignments.assignments | length),
    workerAssignmentOptionTeamCount: ($workerAssignmentOptions.entities.TEAM | length),
    workerAssignmentDetailMatches: ($workerAssignmentDetail.assignment.id == $teamJobAssignmentId),
    workerAssignmentWriteStatus: $workerAssignmentWriteStatus,
    workerAssignmentUpdateStatus: $workerAssignmentUpdateStatus,
    crossAssignmentReadStatus: $crossAssignmentReadStatus,
    crossAssignmentSourceStatus: $crossAssignmentSourceStatus,
    crossAssignmentTargetStatus: $crossAssignmentTargetStatus,
    materialCostDerivedTotal: $materialCost.totalCost,
    materialCostItemMatches: ($materialCost.item.id == $quantityItemId),
    laborCostDerivedTotal: $laborCost.totalCost,
    externalCostManualTotal: $externalCost.totalCost,
    externalCostHasNoUnitCost: ($externalCost.unitCost == null),
    updatedMaterialCostTotal: $updateMaterialCost.totalCost,
    updatedMaterialCostNotes: $updateMaterialCost.notes,
    costListContainsCreated: (
      ([$jobCosts.costLines[].id] | index($materialCost.id) != null) and
      ([$jobCosts.costLines[].id] | index($laborCost.id) != null) and
      ([$jobCosts.costLines[].id] | index($externalCost.id) != null)
    ),
    costListLineCount: ($jobCosts.costLines | length),
    costSummaryMaterial: $jobCostSummary.materialTotal,
    costSummaryLabor: $jobCostSummary.laborTotal,
    costSummaryTravel: $jobCostSummary.travelTotal,
    costSummaryExternal: $jobCostSummary.externalServiceTotal,
    costSummaryOther: $jobCostSummary.otherTotal,
    costSummaryGrand: $jobCostSummary.grandTotal,
    costSummaryCurrency: $jobCostSummary.currency,
    costListSummaryMatches: ($jobCosts.summary == $jobCostSummary),
    wrongJobCostStatus: $wrongJobCostStatus,
    workerCostLineCount: ($workerJobCosts.costLines | length),
    workerCostSummaryGrand: $workerJobCostSummary.grandTotal,
    workerCostWriteStatus: $workerCostWriteStatus,
    workerCostUpdateStatus: $workerCostUpdateStatus,
    crossCostJobStatus: $crossCostJobStatus,
    crossCostUpdateStatus: $crossCostUpdateStatus,
    crossCostItemStatus: $crossCostItemStatus,
    customerReportSourceContextMatches: (
      ($customerReportSource.job.id == $jobId) and
      ($customerReportSource.customer.id == $customerId) and
      ($customerReportSource.address.id == $addressId) and
      ($customerReportSource.object.id == $objectId) and
      ($customerReportSource.objectArea.id == $areaId)
    ),
    customerReportSourceEligibilityMatches: (
      ([$customerReportSource.jobReports[] | select(.id == $workerFindingId and .reviewStatus == "APPROVED" and .selectable == true)] | length) == 1 and
      ([$customerReportSource.jobReports[] | select(.id == $revisionReportId and .reviewStatus == "NEEDS_REVISION" and .selectable == false)] | length) == 1 and
      ([$customerReportSource.jobReports[] | select(.id == $reportId and .reviewStatus == "SUBMITTED" and .selectable == false)] | length) == 1
    ),
    customerReportSourceAttachmentMatches: (
      ([$customerReportSource.attachments[] | select(.id == $phase7AttachmentId and .reportId == $workerFindingId and .selectable == true)] | length) == 1
    ),
    customerReportSourceCostsMatch: (
      ([$customerReportSource.costLines[].id] | index($materialCostId) != null) and
      ([$customerReportSource.costLines[].id] | index($laborCostId) != null) and
      ([$customerReportSource.costLines[].id] | index($externalCostId) != null) and
      ($customerReportSource.costSummary.lineCount == 3) and
      ($customerReportSource.costSummary.grandTotal == 422.2) and
      ($customerReportSource.costSummary.currency == "EUR")
    ),
    customerReportCreated: (
      ($createCustomerReport.customerReport.id == $customerReportId) and
      ($createCustomerReport.customerReport.type == "INCIDENT") and
      ($createCustomerReport.customerReport.status == "DRAFT") and
      ($createCustomerReport.customerReport.title == $customerReportTitle) and
      ($createCustomerReport.customerReport.createdBy.id == $userId)
    ),
    customerReportScalarSnapshotMatches: (
      ($createCustomerReport.customerReport.jobId == $jobId) and
      ($createCustomerReport.customerReport.customerId == $customerId) and
      ($createCustomerReport.customerReport.addressId == $addressId) and
      ($createCustomerReport.customerReport.objectId == $objectId) and
      ($createCustomerReport.customerReport.objectAreaId == $areaId) and
      ($createCustomerReport.customerReport.snapshotCustomerName == $customerReportSource.customer.name) and
      ($createCustomerReport.customerReport.snapshotAddressLabel == $customerReportSource.address.label) and
      ($createCustomerReport.customerReport.snapshotObjectName == $customerReportSource.object.name) and
      ($createCustomerReport.customerReport.snapshotObjectAreaName == $customerReportSource.objectArea.name) and
      ($createCustomerReport.customerReport.snapshotJobReference == $customerReportSource.job.reference) and
      ($createCustomerReport.customerReport.snapshotJobTitle == $customerReportSource.job.title)
    ),
    customerReportStructuredSnapshotMatches: (
      ($createCustomerReport.customerReport.snapshotSourceData.schemaVersion == 1) and
      ($createCustomerReport.customerReport.snapshotSourceData.job == $customerReportSource.job) and
      ($createCustomerReport.customerReport.snapshotSourceData.customer == $customerReportSource.customer) and
      ($createCustomerReport.customerReport.snapshotSourceData.address == $customerReportSource.address) and
      ($createCustomerReport.customerReport.snapshotSourceData.object == $customerReportSource.object) and
      ($createCustomerReport.customerReport.snapshotSourceData.objectArea == $customerReportSource.objectArea)
    ),
    customerReportSelectedSourcesMatch: (
      ($createCustomerReport.customerReport.snapshotSourceData.selectedJobReportIds == [$workerFindingId]) and
      ($createCustomerReport.customerReport.snapshotSourceData.selectedAttachmentIds == [$phase7AttachmentId]) and
      ($createCustomerReport.customerReport.snapshotSourceData.selectedCostLineIds == [$materialCostId, $laborCostId]) and
      ($createCustomerReport.customerReport.snapshotSourceData.includeFullCostSummary == true) and
      (($createCustomerReport.customerReport.snapshotSourceData.jobReports | length) == 1) and
      ($createCustomerReport.customerReport.snapshotSourceData.jobReports[0].id == $workerFindingId) and
      ($createCustomerReport.customerReport.snapshotSourceData.jobReports[0].reviewStatus == "APPROVED") and
      ($createCustomerReport.customerReport.snapshotSourceData.jobReports[0].findingSummary == "Pipe connection is leaking") and
      (($createCustomerReport.customerReport.snapshotSourceData.attachments | length) == 1) and
      ($createCustomerReport.customerReport.snapshotSourceData.attachments[0].id == $phase7AttachmentId) and
      ($createCustomerReport.customerReport.snapshotSourceData.attachments[0].reportId == $workerFindingId)
    ),
    customerReportSelectedCostsMatch: (
      ($createCustomerReport.customerReport.snapshotCostBreakdown.schemaVersion == 1) and
      ($createCustomerReport.customerReport.snapshotCostBreakdown.includeFullCostSummary == true) and
      ([$createCustomerReport.customerReport.snapshotCostBreakdown.selectedLines[].sourceCostLineId] == [$materialCostId, $laborCostId]) and
      ($createCustomerReport.customerReport.snapshotCostBreakdown.selectedLines[0].quantity == 3) and
      ($createCustomerReport.customerReport.snapshotCostBreakdown.selectedLines[0].totalCost == 37.2) and
      ($createCustomerReport.customerReport.snapshotCostBreakdown.selectedLines[0].taxRate == 19) and
      ($createCustomerReport.customerReport.snapshotCostBreakdown.selectedLines[1].totalCost == 135) and
      ($createCustomerReport.customerReport.snapshotCostBreakdown.selectedLineSummary.lineCount == 2) and
      ($createCustomerReport.customerReport.snapshotCostBreakdown.selectedLineSummary.grandTotal == 172.2)
    ),
    customerReportFullCostSummaryMatches: (
      ($createCustomerReport.customerReport.snapshotCostBreakdown.fullJobSummary.lineCount == 3) and
      ($createCustomerReport.customerReport.snapshotCostBreakdown.fullJobSummary.materialTotal == 37.2) and
      ($createCustomerReport.customerReport.snapshotCostBreakdown.fullJobSummary.laborTotal == 135) and
      ($createCustomerReport.customerReport.snapshotCostBreakdown.fullJobSummary.externalServiceTotal == 250) and
      ($createCustomerReport.customerReport.snapshotCostBreakdown.fullJobSummary.grandTotal == 422.2) and
      ($createCustomerReport.customerReport.snapshotCostGrandTotal == 422.2) and
      ($createCustomerReport.customerReport.snapshotCostCurrency == "EUR")
    ),
    customerReportListContainsCreated: ([$customerReportList.customerReports[].id] | index($customerReportId) != null),
    customerReportDetailMatches: (
      ($customerReportDetail.customerReport.id == $customerReportId) and
      ($customerReportDetail.customerReport.snapshotSourceData == $createCustomerReport.customerReport.snapshotSourceData)
    ),
    customerReportDraftUpdated: (
      ($updateCustomerReport.customerReport.title == $updatedCustomerReportTitle) and
      ($updateCustomerReport.customerReport.internalNotes == "Updated Phase 7 draft proof") and
      ($updateCustomerReport.customerReport.status == "DRAFT")
    ),
    invalidDraftApprovalStatus: $invalidDraftApprovalStatus,
    readyCustomerReportStatus: $readyCustomerReport.customerReport.status,
    readyCustomerReportUpdateStatus: $readyCustomerReportUpdateStatus,
    draftAgainCustomerReportStatus: $draftAgainCustomerReport.customerReport.status,
    readyAgainCustomerReportStatus: $readyAgainCustomerReport.customerReport.status,
    approvedCustomerReportStatus: $approvedCustomerReport.customerReport.status,
    approvedCustomerReportActorMatches: (
      ($approvedCustomerReport.customerReport.approvedBy.id == $userId) and
      ($approvedCustomerReport.customerReport.approvedAt != null)
    ),
    invalidApprovedDraftStatus: $invalidApprovedDraftStatus,
    customerReportLiveMutationVisible: (
      ($phase7MutatedMaterialCost.totalCost == 49.6) and
      ($customerReportSourceAfterMutation.job.title == $phase7MutatedJobTitle) and
      ($customerReportSourceAfterMutation.customer.name == $phase7MutatedCustomerName) and
      ($customerReportSourceAfterMutation.address.street == "Changed Street 99") and
      ($customerReportSourceAfterMutation.object.name == $phase7MutatedObjectName) and
      ($customerReportSourceAfterMutation.objectArea.name == $phase7MutatedAreaName) and
      ($customerReportSourceAfterMutation.costSummary.materialTotal == 49.6) and
      ($customerReportSourceAfterMutation.costSummary.grandTotal == 434.6)
    ),
    customerReportSnapshotRemainsImmutable: (
      ($customerReportAfterMutation.customerReport.title == $updatedCustomerReportTitle) and
      ($customerReportAfterMutation.customerReport.snapshotSourceData == $createCustomerReport.customerReport.snapshotSourceData) and
      ($customerReportAfterMutation.customerReport.snapshotCostBreakdown == $createCustomerReport.customerReport.snapshotCostBreakdown) and
      ($customerReportAfterMutation.customerReport.snapshotCustomerName == $createCustomerReport.customerReport.snapshotCustomerName) and
      ($customerReportAfterMutation.customerReport.snapshotAddressText == $createCustomerReport.customerReport.snapshotAddressText) and
      ($customerReportAfterMutation.customerReport.snapshotObjectName == $createCustomerReport.customerReport.snapshotObjectName) and
      ($customerReportAfterMutation.customerReport.snapshotObjectAreaName == $createCustomerReport.customerReport.snapshotObjectAreaName) and
      ($customerReportAfterMutation.customerReport.snapshotJobTitle == $createCustomerReport.customerReport.snapshotJobTitle) and
      ($customerReportAfterMutation.customerReport.snapshotCostGrandTotal == 422.2)
    ),
    archivedCustomerReportStatus: $archivedCustomerReport.customerReport.status,
    directArchivedDraftValid: (
      ($createArchivedDraftReport.customerReport.status == "DRAFT") and
      ($archivedDraftReport.customerReport.status == "ARCHIVED") and
      ($archivedDraftReport.customerReport.approvedBy == null) and
      ($archivedDraftReport.customerReport.approvedAt == null)
    ),
    customerReportActivityLogged: (
      ([$jobDetail.job.activity[].title] | map(startswith("Kundenbericht erstellt:")) | any) and
      ([$jobDetail.job.activity[].title] | map(startswith("Kundenbericht zur Pruefung bereitgestellt:")) | any) and
      ([$jobDetail.job.activity[].title] | map(startswith("Kundenbericht freigegeben:")) | any) and
      ([$jobDetail.job.activity[].title] | map(startswith("Kundenbericht archiviert:")) | any)
    ),
    ineligibleCustomerReportSourceStatus: $ineligibleCustomerReportSourceStatus,
    duplicateCustomerReportSourceStatus: $duplicateCustomerReportSourceStatus,
    wrongJobCustomerReportReportStatus: $wrongJobCustomerReportReportStatus,
    wrongJobCustomerReportAttachmentStatus: $wrongJobCustomerReportAttachmentStatus,
    wrongJobCustomerReportCostStatus: $wrongJobCustomerReportCostStatus,
    workerCustomerReportSourceStatus: $workerCustomerReportSourceStatus,
    workerCustomerReportListStatus: $workerCustomerReportListStatus,
    workerCustomerReportDetailStatus: $workerCustomerReportDetailStatus,
    workerCustomerReportCreateStatus: $workerCustomerReportCreateStatus,
    workerCustomerReportUpdateStatus: $workerCustomerReportUpdateStatus,
    workerCustomerReportStatusStatus: $workerCustomerReportStatusStatus,
    crossCustomerReportSourceStatus: $crossCustomerReportSourceStatus,
    crossCustomerReportReadStatus: $crossCustomerReportReadStatus,
    crossCustomerReportSelectedReportStatus: $crossCustomerReportSelectedReportStatus,
    crossCustomerReportSelectedAttachmentStatus: $crossCustomerReportSelectedAttachmentStatus,
    crossCustomerReportSelectedCostStatus: $crossCustomerReportSelectedCostStatus
  }' "$SUMMARY_INPUT" > "${TMP_DIR}/summary.json"

jq -s '
  from_entries |
  . as $phase8 |
  {
    workdaySheetOptionsContainAssignments: (
      ([.workdaySheetOptions.teams[].id] | index($phase8.teamId) != null) and
      ([.workdaySheetOptions.workers[].id] | index($phase8.workerUserId) != null)
    ),
    workdaySheetDraftCreated: (
      (.createWorkdaySheet.workdaySheet.id == .workdaySheetId) and
      (.createWorkdaySheet.workdaySheet.status == "DRAFT") and
      (.createWorkdaySheet.workdaySheet.date == .workdaySheetDate) and
      (.createWorkdaySheet.workdaySheet.teamId == .teamId) and
      (.createWorkdaySheet.workdaySheet.workerUserId == .workerUserId) and
      (.createWorkdaySheet.workdaySheet.internalNotes == "Office-only Phase 8 note") and
      ((.createWorkdaySheet.workdaySheet.rows | length) == 1)
    ),
    workdaySheetRelationsValid: (
      (.createWorkdaySheet.workdaySheet.rows[0].customerId == .customerId) and
      (.createWorkdaySheet.workdaySheet.rows[0].addressId == .addressId) and
      (.createWorkdaySheet.workdaySheet.rows[0].objectId == .objectId) and
      (.createWorkdaySheet.workdaySheet.rows[0].objectAreaId == .areaId) and
      (.createWorkdaySheet.workdaySheet.rows[0].jobId == .jobId)
    ),
    workdaySheetDraftUpdated: (
      (.updateWorkdaySheet.workdaySheet.title == .updatedWorkdaySheetTitle) and
      (.updateWorkdaySheetRow.workdaySheet.rows[0].plannedText == "Musterstr. 1 - Treppen, H.M.S. und Eingang pruefen") and
      ((.addWorkdaySheetRow.workdaySheet.rows | length) == 2) and
      (.addWorkdaySheetRow.workdaySheet.rows[1].id == .workdaySheetSecondRowId)
    ),
    workdaySheetListContainsCreated: ([.workdaySheetList.workdaySheets[].id] | index($phase8.workdaySheetId) != null),
    workdaySheetFiltersValid: (
      ((.filteredWorkdaySheetList.workdaySheets | length) == 1) and
      (.filteredWorkdaySheetList.workdaySheets[0].id == .workdaySheetId) and
      (.filteredWorkdaySheetList.workdaySheets[0].rowCount == 2) and
      (.filteredWorkdaySheetList.workdaySheets[0].completedRowCount == 0)
    ),
    invalidWorkdayFilterStatus: .invalidWorkdayFilterStatus,
    workerDraftReadStatus: .workerDraftReadStatus,
    workerCreateSheetStatus: .workerCreateSheetStatus,
    workerSheetOptionsStatus: .workerSheetOptionsStatus,
    crossWorkdayRelationStatus: .crossWorkdayRelationStatus,
    sentWorkdaySheetValid: (
      (.sentWorkdaySheet.workdaySheet.status == "SENT") and
      (.sentWorkdaySheet.workdaySheet.sentBy.id == .userId) and
      (.sentWorkdaySheet.workdaySheet.sentAt != null)
    ),
    workerSentSheetVisibleWithoutInternalNotes: (
      (.workerSentWorkdaySheet.workdaySheet.id == .workdaySheetId) and
      (.workerSentWorkdaySheet.workdaySheet.status == "SENT") and
      (.workerSentWorkdaySheet.workdaySheet | has("internalNotes") | not)
    ),
    workerListContainsAssignedSheet: ([.workerWorkdaySheetList.workdaySheets[].id] | index($phase8.workdaySheetId) != null),
    unrelatedWorkerListExcludesSheet: ([.unrelatedWorkerWorkdaySheetList.workdaySheets[].id] | index($phase8.workdaySheetId) == null),
    unrelatedWorkerReadStatus: .unrelatedWorkerReadStatus,
    unrelatedWorkerUpdateStatus: .unrelatedWorkerUpdateStatus,
    unrelatedWorkerSubmitStatus: .unrelatedWorkerSubmitStatus,
    workerPlannedUpdateStatus: .workerPlannedUpdateStatus,
    workerActualUpdatesValid: (
      (.workerFirstActual.workdaySheet.rows[0].actualText == "Treppen und Eingang gereinigt; Tuergriff locker festgestellt") and
      (.workerSecondActual.workdaySheet.rows[1].actualText == "Tischler um 11:05 eingelassen und Schluessel zurueckgenommen")
    ),
    workerTodaySheetValid: (
      (.workerTodayWorkdaySheets.date == .workdaySheetDate) and
      ([.workerTodayWorkdaySheets.workdaySheets[] |
        select(
          .id == $phase8.workdaySheetId and
          .completedRowCount == 2 and
          .rowCount == 2 and
          (has("internalNotes") | not)
        )
      ] | length) == 1
    ),
    unrelatedWorkerTodayExcludesSheet: (
      ([.unrelatedWorkerTodayWorkdaySheets.workdaySheets[].id] | index($phase8.workdaySheetId) == null)
    ),
    incompleteWorkdaySubmitStatus: .incompleteWorkdaySubmitStatus,
    officeActualUpdateStatus: .officeActualUpdateStatus,
    submittedWorkdaySheetValid: (
      (.submittedWorkdaySheet.workdaySheet.status == "SUBMITTED") and
      (.submittedWorkdaySheet.workdaySheet.submittedBy.id == .workerUserId) and
      (.submittedWorkdaySheet.workdaySheet.submittedAt != null)
    ),
    postSubmitActualStatus: .postSubmitActualStatus,
    workerReviewWorkdayStatus: .workerReviewWorkdayStatus,
    invalidWorkdayArchiveStatus: .invalidWorkdayArchiveStatus,
    reviewedWorkdaySheetValid: (
      (.reviewedWorkdaySheet.workdaySheet.status == "REVIEWED") and
      (.reviewedWorkdaySheet.workdaySheet.reviewedBy.id == .userId) and
      (.reviewedWorkdaySheet.workdaySheet.reviewNotes == "Phase 8 office review complete") and
      (.reviewedWorkdaySheet.workdaySheet.reviewedAt != null)
    ),
    reviewedPlanUpdateStatus: .reviewedPlanUpdateStatus,
    archivedWorkdaySheetValid: (
      (.archivedWorkdaySheet.workdaySheet.status == "ARCHIVED") and
      (.archivedWorkdaySheet.workdaySheet.archivedBy.id == .userId) and
      (.archivedWorkdaySheet.workdaySheet.archivedAt != null)
    ),
    archivedActualUpdateStatus: .archivedActualUpdateStatus,
    repeatWorkdayArchiveStatus: .repeatWorkdayArchiveStatus,
    crossWorkdayReadStatus: .crossWorkdayReadStatus
  }' "$SUMMARY_INPUT" > "${TMP_DIR}/phase8-summary.json"

jq -s '.[0] + .[1]' "${TMP_DIR}/summary.json" "${TMP_DIR}/phase8-summary.json" > "${TMP_DIR}/combined-summary.json"
mv "${TMP_DIR}/combined-summary.json" "${TMP_DIR}/summary.json"

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
    .legacyReportType == "GENERAL" and
    .legacyReportReviewStatus == "SUBMITTED" and
    .reportAttachmentLinked == true and
    .workerAddedToAssignedTeam == true and
    .workerFindingCreated == true and
    .workerFindingFollowUpRequired == true and
    .approvedReportStatus == "APPROVED" and
    .approvedReportReviewerPresent == true and
    .needsRevisionReportStatus == "NEEDS_REVISION" and
    .workerReviewStatus == "403" and
    .workerInaccessibleReportStatus == "403" and
    .wrongJobReportReviewStatus == "404" and
    .invalidFindingStatus == "400" and
    .crossReportReadStatus == "404" and
    .crossReportReviewStatus == "404" and
    .reportReviewActivityLogged == true and
    .updatedCustomerPhone == "0201 654321" and
    .updatedAddressNotes == "Address update proof" and
    .updatedObjectNotes == "Object update proof" and
    .updatedAreaNotes == "Area update proof" and
    .customerCount >= 1 and
    .addressCount >= 1 and
    .objectCount >= 1 and
    .objectAreaCount == 1 and
    .legacyJobHasNoDirectoryLinks == true and
    .relationOptionsContainCreatedRecords == true and
    .updatedJobRelationIdsMatch == true and
    .createdJobRelationIdsMatch == true and
    .relationActivityLogged == true and
    .missingObjectStatus == "400" and
    .mismatchedAreaStatus == "400" and
    .workerObjectCount >= 1 and
    .workerRelationOptionCount >= 1 and
    .workerWriteStatus == "403" and
    .workerJobWriteStatus == "403" and
    .crossCompanyStatus == "404" and
    .crossObjectStatus == "404" and
    .crossRelationStatus == "404" and
    .crossJobRelationStatus == "404" and
    .crossJobCustomerStatus == "404" and
    .crossJobObjectStatus == "404" and
    .crossJobAreaStatus == "404" and
    .createdItemCategoryKind == "MATERIAL" and
    .updatedItemCategoryDescription == "Updated category description" and
    .itemCategoryListContainsCreated == true and
    .autoCustomIdGenerated == true and
    .quantityItemCreateValue == 12.5 and
    .quantityItemDetailMatches == true and
    .quantityItemUpdatedValue == 10.25 and
    .quantityItemUpdatedNotes == "Quantity update proof" and
    .itemListContainsCreated == true and
    .duplicateCustomIdStatus == "409" and
    .serializedItemDefaultQuantity == 1 and
    .serializedItemCreated == true and
    .invalidSerializedStatus == "400" and
    .workerItemCategoryCount >= 1 and
    .workerItemCount >= 2 and
    .workerItemDetailMatches == true and
    .workerCategoryWriteStatus == "403" and
    .workerItemWriteStatus == "403" and
    .crossItemStatus == "404" and
    .crossItemCategoryStatus == "404" and
    .crossItemRelationStatus == "404" and
    .teamJobAssignmentValid == true and
    .itemJobAssignmentValid == true and
    .itemObjectAssignmentValid == true and
    .assignmentUpdateStatus == "ACTIVE" and
    .assignmentUpdateNotes == "Assignment update proof" and
    .assignmentDetailMatches == true and
    .assignmentListContainsCreated == true and
    .assignmentOptionsContainCreatedEntities == true and
    .duplicateActiveAssignmentStatus == "409" and
    .invalidAssignmentTimeStatus == "400" and
    .jobTeamIdUnchangedAfterAssignments == true and
    .workerAssignmentCount >= 3 and
    .workerAssignmentOptionTeamCount >= 1 and
    .workerAssignmentDetailMatches == true and
    .workerAssignmentWriteStatus == "403" and
    .workerAssignmentUpdateStatus == "403" and
    .crossAssignmentReadStatus == "404" and
    .crossAssignmentSourceStatus == "404" and
    .crossAssignmentTargetStatus == "404" and
    .materialCostDerivedTotal == 31 and
    .materialCostItemMatches == true and
    .laborCostDerivedTotal == 135 and
    .externalCostManualTotal == 250 and
    .externalCostHasNoUnitCost == true and
    .updatedMaterialCostTotal == 37.2 and
    .updatedMaterialCostNotes == "Updated cost proof" and
    .costListContainsCreated == true and
    .costListLineCount == 3 and
    .costSummaryMaterial == 37.2 and
    .costSummaryLabor == 135 and
    .costSummaryTravel == 0 and
    .costSummaryExternal == 250 and
    .costSummaryOther == 0 and
    .costSummaryGrand == 422.2 and
    .costSummaryCurrency == "EUR" and
    .costListSummaryMatches == true and
    .wrongJobCostStatus == "404" and
    .workerCostLineCount == 3 and
    .workerCostSummaryGrand == 422.2 and
    .workerCostWriteStatus == "403" and
    .workerCostUpdateStatus == "403" and
    .crossCostJobStatus == "404" and
    .crossCostUpdateStatus == "404" and
    .crossCostItemStatus == "404" and
    .customerReportSourceContextMatches == true and
    .customerReportSourceEligibilityMatches == true and
    .customerReportSourceAttachmentMatches == true and
    .customerReportSourceCostsMatch == true and
    .customerReportCreated == true and
    .customerReportScalarSnapshotMatches == true and
    .customerReportStructuredSnapshotMatches == true and
    .customerReportSelectedSourcesMatch == true and
    .customerReportSelectedCostsMatch == true and
    .customerReportFullCostSummaryMatches == true and
    .customerReportListContainsCreated == true and
    .customerReportDetailMatches == true and
    .customerReportDraftUpdated == true and
    .invalidDraftApprovalStatus == "400" and
    .readyCustomerReportStatus == "READY_FOR_REVIEW" and
    .readyCustomerReportUpdateStatus == "400" and
    .draftAgainCustomerReportStatus == "DRAFT" and
    .readyAgainCustomerReportStatus == "READY_FOR_REVIEW" and
    .approvedCustomerReportStatus == "APPROVED" and
    .approvedCustomerReportActorMatches == true and
    .invalidApprovedDraftStatus == "400" and
    .customerReportLiveMutationVisible == true and
    .customerReportSnapshotRemainsImmutable == true and
    .archivedCustomerReportStatus == "ARCHIVED" and
    .directArchivedDraftValid == true and
    .customerReportActivityLogged == true and
    .ineligibleCustomerReportSourceStatus == "400" and
    .duplicateCustomerReportSourceStatus == "400" and
    .wrongJobCustomerReportReportStatus == "404" and
    .wrongJobCustomerReportAttachmentStatus == "404" and
    .wrongJobCustomerReportCostStatus == "404" and
    .workerCustomerReportSourceStatus == "403" and
    .workerCustomerReportListStatus == "403" and
    .workerCustomerReportDetailStatus == "403" and
    .workerCustomerReportCreateStatus == "403" and
    .workerCustomerReportUpdateStatus == "403" and
    .workerCustomerReportStatusStatus == "403" and
    .crossCustomerReportSourceStatus == "404" and
    .crossCustomerReportReadStatus == "404" and
    .crossCustomerReportSelectedReportStatus == "404" and
    .crossCustomerReportSelectedAttachmentStatus == "404" and
    .crossCustomerReportSelectedCostStatus == "404" and
    .workdaySheetOptionsContainAssignments == true and
    .workdaySheetDraftCreated == true and
    .workdaySheetRelationsValid == true and
    .workdaySheetDraftUpdated == true and
    .workdaySheetListContainsCreated == true and
    .workdaySheetFiltersValid == true and
    .invalidWorkdayFilterStatus == "400" and
    .workerDraftReadStatus == "404" and
    .workerCreateSheetStatus == "403" and
    .workerSheetOptionsStatus == "403" and
    .crossWorkdayRelationStatus == "404" and
    .sentWorkdaySheetValid == true and
    .workerSentSheetVisibleWithoutInternalNotes == true and
    .workerListContainsAssignedSheet == true and
    .unrelatedWorkerListExcludesSheet == true and
    .unrelatedWorkerReadStatus == "404" and
    .unrelatedWorkerUpdateStatus == "404" and
    .unrelatedWorkerSubmitStatus == "404" and
    .workerPlannedUpdateStatus == "400" and
    .workerActualUpdatesValid == true and
    .workerTodaySheetValid == true and
    .unrelatedWorkerTodayExcludesSheet == true and
    .incompleteWorkdaySubmitStatus == "400" and
    .officeActualUpdateStatus == "400" and
    .submittedWorkdaySheetValid == true and
    .postSubmitActualStatus == "400" and
    .workerReviewWorkdayStatus == "403" and
    .invalidWorkdayArchiveStatus == "400" and
    .reviewedWorkdaySheetValid == true and
    .reviewedPlanUpdateStatus == "400" and
    .archivedWorkdaySheetValid == true and
    .archivedActualUpdateStatus == "400" and
    .repeatWorkdayArchiveStatus == "400" and
    .crossWorkdayReadStatus == "404"
  ' "${TMP_DIR}/summary.json" >/dev/null

cat "${TMP_DIR}/summary.json"
