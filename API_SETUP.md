# API セットアップガイド

## 必要な API キーの取得

このアプリケーションは fal.ai の API を使用して服装合成を行います。

### 1. fal.ai アカウントの作成

1. [fal.ai](https://fal.ai) にアクセス
2. "Sign up" をクリックしてアカウントを作成
3. メールアドレスを確認

### 2. API キーの取得

1. [fal.ai Dashboard](https://fal.ai/dashboard) にログイン
2. "API Keys" セクションに移動
3. "Create New API Key" をクリック
4. API キーをコピー（例: `fal_xxxxxxxxxxxxxxxxxxxxxxxxxx`）

### 3. ローカル環境の設定

1. プロジェクトルートに `.env.local` ファイルを作成（既に作成済み）
2. API キーを設定:

```env
FAL_KEY=fal_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 4. Vercel デプロイ環境の設定

1. [Vercel Dashboard](https://vercel.com) にログイン
2. プロジェクトを選択
3. "Settings" → "Environment Variables" に移動
4. 以下の環境変数を追加:
   - Name: `FAL_KEY`
   - Value: あなたの fal.ai API キー
   - Environment: Production, Preview, Development すべてにチェック

5. "Save" をクリック
6. デプロイを再実行（新しい環境変数を反映させるため）

### 5. API の使用制限

- **Nano Banana API**: 1分間に10リクエストまで
- **SeeDream API**: 1分間に10リクエストまで
- 無料プランでは月間の制限があります

### トラブルシューティング

#### エラー: "FAL_KEYが設定されていません"
- `.env.local` ファイルに正しいAPIキーが設定されているか確認
- サーバーを再起動: `npm run dev`

#### エラー: "APIキーが無効です"
- API キーが正しくコピーされているか確認
- fal.ai ダッシュボードでAPIキーが有効か確認

#### エラー: "レート制限に達しました"
- 1分待ってから再度試してください
- 有料プランへのアップグレードを検討

## サポートされているAPI

### 1. Nano Banana (高速処理)
- エンドポイント: `https://fal.run/fal-ai/nano-bananana`
- 特徴: 高速処理、多様なスタイル対応
- 推奨: カジュアルな使用

### 2. SeeDream (ByteDance)
- エンドポイント: `https://fal.run/fal-ai/seedream`
- 特徴: 最先端AI、超高品質
- 推奨: プロフェッショナルな仕上がり

## 開発者向け情報

### APIクライアントの場所
- Nano Banana: `/src/lib/nano-banana-client.ts`
- SeeDream: `/src/lib/seedream-client.ts`

### APIエンドポイント
- `/api/synthesize` - 服装合成
- `/api/generate-clothing` - 服装画像生成（デモ用）