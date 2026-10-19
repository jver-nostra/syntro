import type { APIRoute } from 'astro';

export const prerender = false;

// Descargables del curso: viven fuera de /public y solo se sirven a alumnos con pago verificado.
// El middleware ya redirige a /aula/login si no hay sesión; aquí se exige además el pago.
const files = import.meta.glob('/src/private/ens/*', { query: '?inline', import: 'default', eager: true }) as Record<string, string>;

const TYPES: Record<string, string> = {
  ndjson: 'application/x-ndjson; charset=utf-8',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export const GET: APIRoute = async ({ params, locals }) => {
  if (!locals.user || locals.paymentPending) {
    return new Response('No autorizado', { status: 403 });
  }

  const name = params.file ?? '';
  const entry = Object.entries(files).find(([path]) => path.endsWith('/' + name));
  if (!entry) return new Response('No encontrado', { status: 404 });

  const body = Buffer.from(entry[1].split(',')[1], 'base64');
  const ext = name.split('.').pop() ?? '';
  return new Response(body, {
    headers: {
      'Content-Type': TYPES[ext] ?? 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${name}"`,
      'Cache-Control': 'private, no-store',
    },
  });
};
