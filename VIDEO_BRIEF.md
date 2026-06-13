# 動画編集 セッション引き継ぎ（コンパクト版）

> CLI で起動したら最初に「VIDEO_BRIEF.md を読んで。動画編集の続きをやりたい」と伝えること。
> 作業完了後このファイルは削除する。

---

## プロジェクト概要

- **アプリ**: Lily Memo（STEM 教育向け AI 学習アプリ）
- **目的**: DSH Hacks V1 ハッカソン（AI × STEM Education）の提出用デモ動画を作る
- **締切**: 2026年6月14日 23:45 CDT

## 完了済み提出物

| ファイル | 説明 |
|---|---|
| `lily-memo-project-description.pdf` | Devpost「Upload a File」用 1ページ PDF |
| Devpost「About the project」 | 英語テキスト生成済み（この会話内） |

## 動画の方針

- **本編**: iPad で撮った画面収録（英語モード）
- **編集**: Shotstack API（$0.30/分の従量課金、予算3000円）または fal.ai（Seedance）でオープニング演出
- **字幕**: 英語で追加
- **ナレーション**: なし（テロップのみ）
- **長さ**: 約3分

## 動画構成（撮影台本）

| 時間 | シーン | 字幕 |
|---|---|---|
| 0:00–0:08 | タイトルカード（AI生成） | Lily Memo — Turn your notes into active learning |
| 0:08–0:40 | メモ基本機能（テキスト・チェックボックス・コード・表・画像・検索） | Rich notes: checkboxes, code, tables, images — all offline |
| 0:40–1:00 | Lily に解説させる | Lily reads your notes and explains — accuracy first |
| 1:00–1:20 | メモから問題生成 → メモに挿入 | One tap: your notes become quizzes |
| 1:20–1:35 | 図・グラフ生成 → 挿入 | Diagrams and charts, generated and inserted |
| 1:35–1:40 | 思考モード・履歴チラ見せ | Extended thinking, web research, saved conversations |
| 1:40–2:10 | Sikun（ドラッグ・要約・単語説明・QA・タイマー） | Sikun: instant answers without leaving your note |
| 2:10–2:25 | Todo & カレンダー | Tasks, pins, and a weekly calendar |
| 2:25–2:40 | 学習記録（レベル・バッジ・トロフィールーム） | Track study time, level up, earn badges |
| 2:40–3:05 | PDF + Sikun解説 + PDF→Markdown変換 | Read PDFs with AI — convert them to Markdown notes |
| 3:05–3:15 | エンドカード（AI生成） | Built with Gemini 2.5 · Next.js |

## API キー・認証情報

- **Shotstack API key**: 環境変数 `SHOTSTACK_API_KEY` に設定すること（stage環境）
- **fal.ai**: アカウント未取得（必要なら取得する）

## Google Drive クリップ

| ファイル名 | Drive ID | 内容 | 台本のシーン |
|---|---|---|---|
| hackathon(1).MP4 | `1msjIZmrhEhIk2fA72q4RCN413El6WkJt` | AI が図を作ってメモに挿入 | 1:20–1:35 |

※ 残りのクリップは撮影済みだが Drive にまだアップロードされていない

## 次のアクション（CLI で再開する場合）

1. Drive から clip1 をダウンロード（Drive アクセスは CLI なら制限なし）
2. 残りのクリップの Drive リンクをユーザーから受け取る
3. Shotstack API でレンダリングスクリプトを書くか、ffmpeg で編集するか決める
4. タイトルカード・エンドカードを生成（静止画 or AI生成）
5. 全クリップ結合 → 字幕追加 → 完成

## 技術メモ

- ffmpeg: `v6.1.1`（このリポジトリの環境にインストール済み）
- Shotstack: REST API、stage 環境のエンドポイントは `https://api.shotstack.io/edit/stage/`
- node_modules に pdfkit インストール済み（PDF生成に使用）
- ブランチ: `claude/determined-archimedes-774l8l`

## 撮影指示（ユーザー向け）

- iPad・英語モードで録画
- 操作はゆっくり（後で倍速可能）
- 各クリップに内容がわかる名前をつけて Drive にアップ
- 公開設定：「リンクを知っている全員が閲覧可能」
