const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  body: JSON.stringify(body),
});

const requiredFields = ['id', 'economico', 'marca', 'modelo', 'serie', 'categoria', 'folio', 'area', 'fecha', 'estado'];

function supabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Faltan las variables SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en Netlify.');
  return { url: `${url.replace(/\/$/, '')}/rest/v1/economicos`, key };
}

async function request(path = '', options = {}) {
  const { url, key } = supabaseConfig();
  const response = await fetch(`${url}${path}`, {
    ...options,
    headers: { apikey: key, Authorization: `Bearer ${key}`, ...(options.headers || {}) },
  });
  if (!response.ok) throw new Error((await response.text()) || `Supabase respondió ${response.status}.`);
  return response;
}

function normalize(record) {
  const output = {};
  for (const field of requiredFields) output[field] = String(record[field] ?? '').trim();
  output.monto = record.monto === '' || record.monto == null ? null : Number(record.monto);
  output.observaciones = String(record.observaciones ?? '');
  output.photos = Array.isArray(record.photos) ? record.photos : [];
  if (requiredFields.some(field => !output[field])) throw new Error('Cada económico debe tener todos sus campos obligatorios.');
  if (!['1', '2', '3'].includes(output.categoria)) throw new Error('La categoría solo puede ser 1, 2 o 3.');
  if (!['operativo', 'mantenimiento'].includes(output.estado)) throw new Error('El estado no es válido.');
  if (output.monto !== null && !Number.isFinite(output.monto)) throw new Error('El monto no es válido.');
  return output;
}

exports.handler = async event => {
  try {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': '*' }, body: '' };
    if (event.queryStringParameters?.status === '1') { supabaseConfig(); return json(200, { configured: true, provider: 'supabase' }); }
    if (event.httpMethod === 'GET') {
      const response = await request('?select=*&order=economico.asc');
      return json(200, await response.json());
    }
    if (event.httpMethod === 'PUT') {
      const records = JSON.parse(event.body || '[]');
      if (!Array.isArray(records)) throw new Error('El formato de datos no es válido.');
      if (records.length > 1000) throw new Error('La carga supera el límite de 1,000 registros.');
      const normalized = records.map(normalize);
      await request('?id=not.is.null', { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
      if (normalized.length) await request('', { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(normalized) });
      return json(200, { ok: true, count: normalized.length });
    }
    return json(405, { error: 'Método no permitido.' });
  } catch (error) {
    return json(500, { error: error.message || 'No se pudo completar la operación.' });
  }
};
