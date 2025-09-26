# API設定セキュリティドキュメント

## 現在の設定状況

### ✅ 設定済みAPIキー

#### fal.ai APIキー
- **環境変数**: `FAL_KEY`
- **形式**: `eaab85c2-22d2-4e0b-8f75-f1ea42934ad3:340e7dbcbc0e9df9c00ac6f27ad3d07d`
- **用途**:
  - Nano Banana API (服装合成)
  - SeeDream API (高品質Virtual Try-On)
- **設定場所**: `/photo-studio-app/.env.local`

### 🔐 セキュリティ設定

#### APIキーの保護
1. **環境変数での管理**: すべてのAPIキーは`.env.local`で管理
2. **Gitignore設定**: `.env.local`はGitリポジトリに含まれない
3. **サーバーサイド実行**: APIキーはサーバーサイドのみで使用
4. **クライアント非公開**: フロントエンドコードにAPIキーは含まれない

#### APIクライアントの実装

##### Nano Banana Client (`/src/lib/nano-banana-client.ts`)
- **エンドポイント**: `https://fal.run/fal-ai/nano-banana/edit`
- **認証方式**: `Authorization: Key ${FAL_KEY}`
- **主な機能**:
  - 服装合成
  - ポーリングによる結果取得
  - エラーハンドリング（401, 404, 429）

##### SeeDream Client (`/src/lib/seedream-client.ts`)
- **エンドポイント**: `https://fal.run/fal-ai/bytedance/seedream/v4/edit`
- **認証方式**: `Authorization: Key ${FAL_KEY}`
- **主な機能**:
  - 高品質Virtual Try-On
  - 服のタイプ自動判定
  - 詳細なエラーハンドリング

### 🛡️ セキュリティベストプラクティス

1. **入力検証**:
   - URLバリデーション実装済み
   - プロンプトのサニタイゼーション実装済み

2. **エラーハンドリング**:
   - APIキー無効（401）
   - エンドポイント不明（404）
   - レート制限（429）
   - 詳細なエラーログ（開発環境のみ）

3. **APIキー管理**:
   - 改行・不正文字の自動除去
   - トリミング処理実装済み

### ⚙️ APIエンドポイント設定

#### 本番環境
- Nano Banana: `https://fal.run/fal-ai/nano-banana/edit`
- SeeDream: `https://fal.run/fal-ai/bytedance/seedream/v4/edit`

#### オプション設定（未使用）
```env
# FAL_NANO_BANANA_URL=https://fal.run/fal-ai/nano-bananana
# FAL_SEEDREAM_URL=https://fal.run/fal-ai/seedream
```

### 📝 使用上の注意

1. **APIキーの更新時**:
   - `.env.local`ファイルを編集
   - サーバーの再起動が必要
   - 形式: `key_id:key_secret`

2. **開発環境でのデバッグ**:
   - `NODE_ENV=development`で詳細ログ出力
   - APIリクエスト/レスポンスの確認可能

3. **本番環境への展開**:
   - Vercelの環境変数に`FAL_KEY`を設定
   - `.env.local`はデプロイに含めない

### 🔄 更新履歴
- 2025-09-23: 初回ドキュメント作成
- APIキー設定確認済み
- セキュリティ設定検証済み