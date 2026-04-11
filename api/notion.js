module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'NOTION_API_KEY not configured' });

  const { notionPath, notionMethod = 'GET', notionBody } = req.body || {};
  if (!notionPath) return res.status(400).json({ error: 'notionPath required' });

  try {
    const resp = await fetch(`https://api.notion.com/v1/${notionPath}`, {
      method: notionMethod,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: notionBody ? JSON.stringify(notionBody) : undefined,
    });
    const data = await resp.json();
    return res.status(resp.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
