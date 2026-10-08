'use server';

import { redirect } from 'next/navigation';

import { createJobReportData, uploadJobAttachmentData } from './operations';

function required(formData: FormData, key: string, label: string) {
  const value = formData.get(key);
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} ist erforderlich.`);
  }
  return value.trim();
}

function optional(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function safeReturnTo(formData: FormData, jobId: string) {
  const value = optional(formData, 'returnTo');
  if (
    value === '/workday-sheets/today' ||
    value === `/jobs/${jobId}` ||
    (value !== undefined && /^\/workday-sheets\/[a-z0-9]+$/i.test(value))
  ) {
    return value;
  }
  return `/jobs/${jobId}`;
}

function redirectWith(path: string, values: Record<string, string | undefined>): never {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => value && params.set(key, value));
  redirect(params.size ? `${path}?${params.toString()}` : path);
}

export async function createWorkerFindingAction(jobId: string, formData: FormData) {
  const returnTo = safeReturnTo(formData, jobId);
  let outcome: Record<string, string | undefined>;

  try {
    const summary = required(formData, 'summary', 'Kurzfassung');
    const findingResult = await createJobReportData(jobId, {
      type: 'WORKER_FINDING',
      summary,
      findingSummary: required(formData, 'findingSummary', 'Feststellung'),
      details: optional(formData, 'details'),
      followUpRequired: formData.get('followUpRequired') === 'on',
      followUpNotes: optional(formData, 'followUpNotes'),
    });

    if (!findingResult.ok || !findingResult.data?.createdReport) {
      throw new Error(findingResult.error ?? 'Der Fund konnte nicht gespeichert werden.');
    }

    const file = formData.get('file');
    if (file instanceof File && file.size > 0) {
      const upload = new FormData();
      upload.append('file', file, file.name);
      upload.append('reportId', findingResult.data.createdReport.id);
      upload.append('caption', summary);

      const uploadResult = await uploadJobAttachmentData(jobId, upload);
      if (!uploadResult.ok) {
        outcome = {
          error: `Der Fund wurde gespeichert, der Nachweis aber nicht hochgeladen: ${
            uploadResult.error ?? 'Unbekannter Uploadfehler'
          }`,
        };
      } else {
        outcome = { notice: 'finding-with-evidence-created' };
      }
    } else {
      outcome = { notice: 'finding-created' };
    }
  } catch (error) {
    outcome = {
      error: error instanceof Error ? error.message : 'Der Fund konnte nicht gespeichert werden.',
    };
  }

  redirectWith(returnTo, outcome);
}
