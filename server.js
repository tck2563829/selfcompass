import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = process.env.PORT || 10000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json({ limit: '32kb' }));

app.get('/healthz', (_request, response) => response.json({ status: 'ok' }));

app.post('/api/analyze', async (request, response) => {
  if (!process.env.CLAUDE_API_KEY) {
    return response.status(503).json({ error: 'CLAUDE_API_KEYが設定されていません。' });
  }

  const { note, logs, scores, goal } = request.body || {};
  if (typeof note !== 'string' || !note.trim() || !Array.isArray(scores) || scores.length !== 4) {
    return response.status(400).json({ error: '分析に必要なデータが不足しています。' });
  }

  const prompt = `あなたは自己成長を支援するAIアシスタントです。診断結果を決めつけたり、医療的な診断をしたりせず、本人の行動を具体的に認めてください。
目標: ${goal || '自分の軸で選べる人'}
現在のカテゴリ順（協調性、好奇心、回復力、自己決定）のスコア: ${JSON.stringify(scores)}
今日の成長ログ: ${note.trim()}
過去の成長ログ: ${JSON.stringify(Array.isArray(logs) ? logs.slice(0, 10) : [])}

次のJSONだけを返してください。Markdownや説明文は不要です。
{
  "summary": "今日の行動から見える特徴を40字以内で",
  "progress": "どの性格特徴が、なぜ進歩したかを80字以内で",
  "tip": "次に試す具体的で小さな行動を60字以内で",
  "category": "協調性|好奇心|回復力|自己決定のいずれか",
  "scoreChange": 1
}
scoreChangeは0から5までの整数で、ログから明確な進歩が読み取れる時だけ1から5にしてください。`;

  try {
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
        max_tokens: 400,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const payload = await claudeResponse.json();
    if (!claudeResponse.ok) return response.status(502).json({ error: payload.error?.message || 'Claude APIの呼び出しに失敗しました。' });
    const text = payload.content?.find((item) => item.type === 'text')?.text || '';
    const result = JSON.parse(text.replace(/^```json\s*|\s*```$/g, '').trim());
    const categoryNames = ['協調性', '好奇心', '回復力', '自己決定'];
    const categoryIndex = categoryNames.indexOf(result.category);
    const nextScores = scores.map((score, index) => index === categoryIndex ? Math.min(100, score + Math.max(0, Math.min(5, Number(result.scoreChange) || 0))) : score);
    return response.json({ ...result, scores: nextScores });
  } catch (error) {
    return response.status(502).json({ error: error instanceof SyntaxError ? 'Claudeから有効な分析結果を受け取れませんでした。' : 'AI分析中にエラーが発生しました。' });
  }
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get(/.*/, (_request, response) => response.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(port, () => console.log(`selfcompass server listening on port ${port}`));