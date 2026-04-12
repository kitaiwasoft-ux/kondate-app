module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

  const { meals } = req.body || {};
  if (!meals || !meals.length) return res.status(400).json({ error: 'meals required' });

  const mealList = meals.map(m => `・${m.day} ${m.slot}：${m.name}`).join('\n');

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `以下の週間献立から、買い物に必要な食材リストを作成してください。

${mealList}

ルール：
- 食材は「野菜」「肉・魚」「調味料・その他」「乾物・缶詰」のカテゴリに分けてください
- 各食材は重複なく、シンプルな名前で書いてください
- 料理名から推測できる主な食材のみ（詳しすぎなくてOK）
- JSON形式で返してください：{"野菜":["..."],"肉・魚":["..."],"調味料・その他":["..."],"乾物・缶詰":["..."]}`
        }]
      })
    });

    const data = await resp.json();
    if (!resp.ok) return res.status(resp.status).json(data);

    const text = data.content[0].text;
    // Extract JSON from response
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: 'Invalid response format' });

    const items = JSON.parse(match[0]);
    return res.status(200).json({ items });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
