import { getApiBaseUrl } from '../../../../../lib/api';
import { getStoredSessionToken } from '../../../../../lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  context: { params: Promise<{ attachmentId: string }> },
) {
  const token = await getStoredSessionToken();

  if (!token) {
    return new Response('Nicht angemeldet.', {
      status: 401,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }

  const { attachmentId } = await context.params;
  const response = await fetch(`${getApiBaseUrl()}/api/attachments/${attachmentId}/file`, {
    headers: {
      authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!response.ok || !response.body) {
    return new Response(await response.text(), {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') ?? 'text/plain; charset=utf-8',
      },
    });
  }

  const headers = new Headers();
  const contentType = response.headers.get('content-type');
  const contentDisposition = response.headers.get('content-disposition');
  const cacheControl = response.headers.get('cache-control');

  if (contentType) {
    headers.set('content-type', contentType);
  }

  if (contentDisposition) {
    headers.set('content-disposition', contentDisposition);
  }

  if (cacheControl) {
    headers.set('cache-control', cacheControl);
  }

  return new Response(response.body, {
    status: response.status,
    headers,
  });
}
