# selfcompass

自分を知り、育てるための自己分析アプリです。

## 起動

```bash
npm install
npm run dev
```

ブラウザで表示されたローカルURLを開いてください。

## 記録の保存

回答、なりたい自分、成長ログはブラウザの `localStorage` に自動保存されます。同じブラウザで次回開いた時も記録が残ります。

## GitHub と Render への公開

1. GitHubで新しいリポジトリを作成し、このフォルダをpushします。
2. Renderで **New +** → **Web Service** を選び、GitHubリポジトリを接続します。
3. Renderが `render.yaml` を読み込みます。手動で設定する場合は以下を指定します。

	- Build Command: `npm install && npm run build`
	- Start Command: `npm start`
	- 環境変数: `CLAUDE_API_KEY`、`VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`

Renderのデプロイ後に発行されるURLからアプリを利用できます。ClaudeのAPIキーはRenderの環境変数にだけ登録し、コードやGitHubには書き込みません。
`/healthz` がRenderのヘルスチェックに使われます。無料プランでは一定時間アクセスがないとスリープするため、再アクセス時に起動待ちが発生することがあります。

ログインと複数端末同期を有効にする手順は [ADMIN_README.md](ADMIN_README.md) を確認してください。
