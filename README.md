# 写真館 着せ替えアプリ

AIを使って服装を自由に変更できるWebアプリケーションです。

## 🌟 機能

- **AI着せ替え合成** - 人物写真と服の画像を組み合わせて自然な着せ替えを実現
- **参考画像生成** - 日本語プロンプトで服装の参考画像を生成
- **画像ギャラリー** - 作成した画像の保存・管理
- **クリップボード対応** - 画像の貼り付けに対応
- **ローカル保存** - 最大50MBまでの画像データを保存

## 🚀 デプロイ済みURL

https://photo-studio-aiaejpgwv-yasuus-projects.vercel.app

## 📋 必要な環境変数

`.env.local` ファイルを作成し、以下の環境変数を設定してください：

```env
# Nano Banana (fal.ai) API Key
FAL_KEY=your_fal_api_key_here

# Next.js Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# Security (任意)
API_SECRET_KEY=generate_a_random_secret_key_here
```

## 🛠️ 開発環境のセットアップ

1. リポジトリをクローン
```bash
git clone https://github.com/yannsunn/photo-studio-app.git
cd photo-studio-app
```

2. 依存関係をインストール
```bash
npm install
```

3. 環境変数を設定
```bash
cp .env.local.example .env.local
# .env.localファイルを編集してAPIキーを設定
```

4. 開発サーバーを起動
```bash
npm run dev
```

http://localhost:3000 でアプリケーションにアクセスできます。

## 📦 ビルドとデプロイ

### ローカルビルド
```bash
npm run build
npm start
```

### Vercelへのデプロイ
```bash
vercel --prod
```

## 🔧 技術スタック

- **フレームワーク**: Next.js 15.5 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **AI API**: Nano Banana (fal.ai)
- **ストレージ**: LocalStorage (ブラウザ)
- **デプロイ**: Vercel

## 📝 使い方

1. **新規作成タブ**
   - 人物写真をアップロード（ドラッグ&ドロップ、ファイル選択、URL指定）
   - 服の画像を選択（同上、または参考画像から選択）
   - 「着せ替え実行」ボタンをクリック
   - 結果を保存またはダウンロード

2. **参考画像生成**
   - カテゴリを選択（トップス、ボトムス、アクセサリー、靴）
   - テンプレートまたは自由記述でプロンプトを入力
   - 「参考画像を生成」をクリック

3. **保存済み画像タブ**
   - 過去に保存した画像の閲覧
   - 画像の詳細表示
   - ダウンロードまたは削除

## ⚠️ 注意事項

- 画像処理には10〜30秒かかる場合があります
- アップロード画像は10MB以下にしてください
- ローカルストレージの容量は最大50MBです
- APIレート制限: 1分間に10リクエストまで

## 🔒 セキュリティ

- APIキーは環境変数で管理
- レート制限実装
- 入力値の検証とサニタイゼーション
- CORS設定

## 📄 ライセンス

MIT

## 👥 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。

## 🐛 バグ報告

[GitHub Issues](https://github.com/yannsunn/photo-studio-app/issues)でバグを報告してください。