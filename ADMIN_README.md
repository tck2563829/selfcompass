# selfcompass 管理者README

このファイルは、今後このアプリを変更する管理者向けの案内です。機能追加や仕様変更をしたら、必ずこのREADMEの「変更履歴」と該当する説明も更新してください。

## まず読む場所

| 変更したいもの | 編集するファイル |
| --- | --- |
| 質問、カテゴリ、目標の選択肢 | `src/main.jsx` の `categories` / `values` |
| 診断スコアの計算 | `src/main.jsx` の `scores` |
| 画面の構造、ログイン、保存処理 | `src/main.jsx` の `App` |
| 目標画面 | `src/main.jsx` の `GoalView` |
| 成長ログ画面 | `src/main.jsx` の `GrowthView` |
| 色、レイアウト、スマホ表示 | `src/styles.css` |
| Supabaseのテーブルと権限 | `supabase-schema.sql` |
| Renderの公開設定 | `render.yaml` |
| 公開前の環境変数 | `.env`（`.env.example`を複製） |
| Claude分析API | `server.js` の `/api/analyze` |
| AI分析結果の表示 | `src/main.jsx` の `addLog` / `GrowthView` |

## ローカル開発

```bash
npm install
npm run dev
```

Supabaseを使う場合は`.env.example`を`.env`にコピーし、SupabaseプロジェクトのURLとanon keyを設定します。値を設定しない場合もゲストモードで動作し、記録はブラウザのlocalStorageに保存されます。

## ログインとデータ保存の仕組み

- Supabase Authがメールアドレスとパスワードを管理します。
- `profiles.id`をログイン中のユーザーIDにし、回答、目標、成長ログ、AI分析後のスコアをユーザー単位で保存します。
- Row Level Securityで、自分のプロフィールだけ読み書きできます。
- SupabaseのSQL Editorで`supabase-schema.sql`を一度実行してください。既存テーブルにもAIスコア列が追加されます。
Renderには`VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`、`CLAUDE_API_KEY`を環境変数として登録してからデプロイしてください。Claudeのキーは必ずサーバー側の`CLAUDE_API_KEY`に置き、`VITE_`を付けてブラウザへ公開しないでください。

## Claudeによる成長分析

- 成長ログを登録すると、ブラウザが`/api/analyze`へログ、現在のスコア、目標を送信します。
- `server.js`がClaude APIを呼び出し、「進歩した特徴」「次の一歩」「スコア変化」をJSONで返します。
- 返却されたスコアは画面のレーダーとAIアシスタント表示に反映されます。
- APIキー未設定時は、ログ自体は保存されますがAI分析だけがエラー表示になります。
- Claudeの利用料金が発生するため、公開時はAPIキーの利用上限とレート制限を設定してください。

## 機能追加の手順

1. `src/main.jsx`で状態、画面、保存対象を追加します。
2. DBに新しい項目が必要なら`supabase-schema.sql`を更新し、既存ユーザーへの初期値を決めます。
3. `src/styles.css`でデスクトップとスマホの表示を確認します。
4. README、特に「まず読む場所」「ログインとデータ保存の仕組み」「変更履歴」を更新します。
5. AIの分析項目を変更する場合は`server.js`のプロンプトとJSON形式も更新します。
6. `npm run build`を実行してからGitHubへpushします。

## Render公開

Build Commandは`npm install && npm run build`、Start Commandは`npm start`です。環境変数をRender側にも登録してください。GitHubのmainブランチへのpushで自動デプロイされます。

## 変更履歴

| 日付 | 内容 |
| --- | --- |
| 2026-09-15 | Supabaseログイン、ユーザー別プロフィール保存、管理者向けREADMEを追加 |
| 2026-09-15 | Claudeによる成長ログ分析、スコア更新、AIアシスタント表示を追加 |
