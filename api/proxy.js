export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const target = req.query.url;
  if (!target) {
    return res.status(400).json({ error: 'Missing ?url= parameter' });
  }

  // Forward header penting
  const forwardHeaders = {};
  const keys = [
    'content-type', 'user-agent', 'x-android-package', 'x-android-cert',
    'authorization', 'firebase-instance-id-token', 'x-forwarded-for',
    'x-real-ip', 'client-ip', 'x-client-ip', 'x-originating-ip',
    'x-cluster-client-ip'
  ];
  for (const k of keys) {
    if (req.headers[k]) forwardHeaders[k] = req.headers[k];
  }

  try {
    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (typeof req.body === 'string') body = req.body;
      else if (Buffer.isBuffer(req.body)) body = req.body;
      else body = JSON.stringify(req.body || {});
    }

    const resp = await fetch(target, {
      method: req.method,
      headers: forwardHeaders,
      body: body
    });

    const text = await resp.text();
    res.status(resp.status);
    resp.headers.forEach((v, k) => {
      if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection'].includes(k.toLowerCase())) {
        res.setHeader(k, v);
      }
    });
    return res.send(text);
  } catch (err) {
    return res.status(502).json({ error: 'Proxy error: ' + err.message });
  }
}
