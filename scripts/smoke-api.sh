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
job_detail="$(json_get "${API_BASE}/jobs/${job_id}" "$token")"

jq -n \
  --argjson health "$health" \
  --argjson session "$session" \
  --argjson dashboard "$dashboard" \
  --argjson teams "$teams" \
  --argjson addMember "$add_member" \
  --argjson createJob "$create_job" \
  --argjson assignTeam "$assign_team" \
  --argjson changeStatus "$change_status" \
  --argjson editJob "$edit_job" \
  --argjson createReport "$create_report" \
  --argjson uploadAttachment "$upload_attachment" \
  --argjson photos "$photos" \
  --argjson attachmentMeta "$attachment_meta" \
  --argjson jobDetail "$job_detail" \
  --argjson updateCustomer "$update_customer" \
  --argjson updateAddress "$update_address" \
  --argjson updateObject "$update_object" \
  --argjson updateArea "$update_area" \
  --argjson customers "$customers" \
  --argjson addresses "$addresses" \
  --argjson objects "$objects" \
  --argjson objectDetail "$object_detail" \
  --argjson relationOptions "$relation_options" \
  --argjson linkJob "$link_job" \
  --argjson linkedJob "$linked_job" \
  --argjson workerObjects "$worker_objects" \
  --argjson workerRelationOptions "$worker_relation_options" \
  --argjson createItemCategory "$create_item_category" \
  --argjson updateItemCategory "$update_item_category" \
  --argjson itemCategories "$item_categories" \
  --argjson createQuantityItem "$create_quantity_item" \
  --argjson quantityItemDetail "$quantity_item_detail" \
  --argjson updateQuantityItem "$update_quantity_item" \
  --argjson items "$items" \
  --argjson createSerializedItem "$create_serialized_item" \
  --argjson workerItemCategories "$worker_item_categories" \
  --argjson workerItems "$worker_items" \
  --argjson workerItemDetail "$worker_item_detail" \
  --argjson teamJobAssignment "$team_job_assignment" \
  --argjson itemJobAssignment "$item_job_assignment" \
  --argjson itemObjectAssignment "$item_object_assignment" \
  --argjson updateItemObjectAssignment "$update_item_object_assignment" \
  --argjson assignmentDetail "$assignment_detail" \
  --argjson assignments "$assignments" \
  --argjson assignmentOptions "$assignment_options" \
  --argjson jobAfterAssignments "$job_after_assignments" \
  --argjson materialCost "$material_cost" \
  --argjson laborCost "$labor_cost" \
  --argjson externalCost "$external_cost" \
  --argjson updateMaterialCost "$update_material_cost" \
  --argjson jobCosts "$job_costs" \
  --argjson jobCostSummary "$job_cost_summary" \
  --argjson workerAssignments "$worker_assignments" \
  --argjson workerAssignmentOptions "$worker_assignment_options" \
  --argjson workerAssignmentDetail "$worker_assignment_detail" \
  --argjson workerJobCosts "$worker_job_costs" \
  --argjson workerJobCostSummary "$worker_job_cost_summary" \
  --argjson addWorkerMember "$add_worker_member" \
  --argjson workerFinding "$worker_finding" \
  --argjson approveWorkerFinding "$approve_worker_finding" \
  --argjson needsRevisionReport "$needs_revision_report" \
  --arg crossStatus "$cross_status" \
  --arg crossBody "$cross_body" \
  --arg crossObjectStatus "$cross_object_status" \
  --arg crossRelationStatus "$cross_relation_status" \
  --arg crossJobRelationStatus "$cross_job_relation_status" \
  --arg crossJobCustomerStatus "$cross_job_customer_status" \
  --arg crossJobObjectStatus "$cross_job_object_status" \
  --arg crossJobAreaStatus "$cross_job_area_status" \
  --arg missingObjectStatus "$missing_object_status" \
  --arg mismatchedAreaStatus "$mismatched_area_status" \
  --arg workerWriteStatus "$worker_write_status" \
  --arg workerJobWriteStatus "$worker_job_write_status" \
  --arg workerCategoryWriteStatus "$worker_category_write_status" \
  --arg workerItemWriteStatus "$worker_item_write_status" \
  --arg duplicateCustomIdStatus "$duplicate_custom_id_status" \
  --arg invalidSerializedStatus "$invalid_serialized_status" \
  --arg crossItemStatus "$cross_item_status" \
  --arg crossItemCategoryStatus "$cross_item_category_status" \
  --arg crossItemRelationStatus "$cross_item_relation_status" \
  --arg duplicateActiveAssignmentStatus "$duplicate_active_assignment_status" \
  --arg invalidAssignmentTimeStatus "$invalid_assignment_time_status" \
  --arg workerAssignmentWriteStatus "$worker_assignment_write_status" \
  --arg workerAssignmentUpdateStatus "$worker_assignment_update_status" \
  --arg workerReviewStatus "$worker_review_status" \
  --arg workerInaccessibleReportStatus "$worker_inaccessible_report_status" \
  --arg wrongJobReportReviewStatus "$wrong_job_report_review_status" \
  --arg invalidFindingStatus "$invalid_finding_status" \
  --arg crossReportReadStatus "$cross_report_read_status" \
  --arg crossReportReviewStatus "$cross_report_review_status" \
  --arg crossAssignmentReadStatus "$cross_assignment_read_status" \
  --arg crossAssignmentSourceStatus "$cross_assignment_source_status" \
  --arg crossAssignmentTargetStatus "$cross_assignment_target_status" \
  --arg wrongJobCostStatus "$wrong_job_cost_status" \
  --arg workerCostWriteStatus "$worker_cost_write_status" \
  --arg workerCostUpdateStatus "$worker_cost_update_status" \
  --arg crossCostJobStatus "$cross_cost_job_status" \
  --arg crossCostUpdateStatus "$cross_cost_update_status" \
  --arg crossCostItemStatus "$cross_cost_item_status" \
  --arg attachmentFileStatus "$attachment_file_status" \
  --arg firstJobId "$first_job_id" \
  --arg teamName "$TEAM_NAME" \
  --arg updatedJobTitle "$UPDATED_JOB_TITLE" \
  --arg customerId "$customer_id" \
  --arg addressId "$address_id" \
  --arg objectId "$object_id" \
  --arg areaId "$area_id" \
  --arg itemCategoryId "$item_category_id" \
  --arg quantityItemId "$quantity_item_id" \
  --arg serializedItemId "$serialized_item_id" \
  --arg teamId "$team_id" \
  --arg teamJobAssignmentId "$team_job_assignment_id" \
  --arg itemJobAssignmentId "$item_job_assignment_id" \
  --arg itemObjectAssignmentId "$item_object_assignment_id" \
  --arg reportId "$report_id" \
  --arg workerFindingId "$worker_finding_id" \
  --arg workerUserId "$worker_user_id" \
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
    crossCostItemStatus: $crossCostItemStatus
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
    .crossCostItemStatus == "404"
  ' "${TMP_DIR}/summary.json" >/dev/null

cat "${TMP_DIR}/summary.json"
