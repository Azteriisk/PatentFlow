import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { url } = req.query;
  const apiKey = req.headers['x-api-key'] || '';

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing url query parameter' });
  }

  try {
    // Perform server-side fetch. Node's native fetch automatically follows 302/301 redirects.
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-KEY': typeof apiKey === 'string' ? apiKey : '',
        'Accept': '*/*'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `USPTO server returned error status: ${response.status} ${response.statusText}` 
      });
    }

    // Set CORS headers so the client-side browser is allowed to read this same-origin response
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'X-API-KEY, Content-Type');
    
    // Set headers matching the document
    const contentType = response.headers.get('content-type') || 'application/pdf';
    res.setHeader('Content-Type', contentType);
    
    const contentDisposition = response.headers.get('content-disposition');
    if (contentDisposition) {
      res.setHeader('Content-Disposition', contentDisposition);
    }

    // Convert response stream to buffer and send it
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    return res.send(buffer);
  } catch (error: any) {
    console.error('Serverless download proxy failed:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
