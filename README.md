# NEXUS Cyber-SP 2099 — 次世代ホログラフィック・スマホWebOS

[![GitHub Pages](https://img.shields.io/badge/Live_Demo-GitHub_Pages-00f5ff?style=for-the-badge&logo=github)](https://yurupoi.github.io/sugoi_html/)
[![Three.js](https://img.shields.io/badge/Engine-Three.js_r128-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![Web Audio API](https://img.shields.io/badge/Audio-Procedural_Synth-ff007f?style=for-the-badge)](https://developer.mozilla.org/ja/docs/Web/API/Web_Audio_API)
[![Zero CDN](https://img.shields.io/badge/Dependencies-Zero_CDN-22c55e?style=for-the-badge)](#)

> **暗黒のサイバー空間に浮遊するチタン製近未来スマートフォンと、画面から照射される立体ホログラムAR光線。**  
> **画面内では量子流体パウダー、カオスアトラクタ、Web Audioシンセサイザー、生体スキャンHUDがリアルタイムに動作。**  
> **PCとスマートフォン実機双方に完全対応した、Web表現の極限を追求するインタラクティブHTMLデモ。**

---

## 🌐 公開URL (GitHub Pages)

👉 **[https://yurupoi.github.io/sugoi_html/](https://yurupoi.github.io/sugoi_html/)**

---

## 🌟 主な機能と特徴

### 1. デュアルモード（3D空間 ⇔ SP全画面）のシームレス切替
- **3Dホロ空間モード（PC向け）**:
  - Three.jsによるチタン＆曲面ガラスの3Dスマートフォン筐体。
  - 画面から空中へ照射されるホログラムコーンビーム＆同心円リング。
  - 3D空間をマウスドラッグで自由回転・ズーム。
  - **3Dスマホ画面上をクリック・ドラッグすると、画面内アプリが直接反応する仮想タッチスクリーン！**
- **Direct SPモード（スマートフォン実機向け）**:
  - スマートフォン実機で開いた際は、ベゼルレスの全画面ネイティブアプリ体験に自動最適化。
  - 端末の傾き（ジャイロ・加速度センサー）にリアルタイム連動。

### 2. 完全スタンドアロン（外部通信ゼロ）
- 外部CDN（unpkg, cdnjs等）に一切依存せず、ローカルアセットのみで高速起動。
- 音声ファイル通信もゼロ。Web Audio APIにより、クリック音・ホログラムワープ音・ドラムビート・シンセ音・生体心音をすべて完全リアルタイムプロシージャル合成。

### 3. 触って遊べる4大内蔵アプリケーション
1. 🌊 **QUANTUM FLUID（量子重力パウダー）**: 3,200個の微粒子が渦巻き引力・衝撃波・重力ベクトルに沿って流動。
2. 🌀 **CHAOS NEBULA（ニューラルアトラクタ）**: クリフォード幾何学カオス方程式による発光軌道。タッチで時空パラメータがモーフィング。
3. 🎹 **BEAT MATRIX（サイバーシンセ＆ドラム）**: 16ステップ4トラックの本格ドラムシーケンサー＋リアルタイムオシロスコープ波形＋8鍵盤タッチシンセ。
4. 🧬 **CORE TELEMETRY（生体＆システム診断）**: リアルタイムFPS/メモリ監視、回転レーダースキャナー、心電図ECG波形、長押しインタラクティブ生体バイオ同期スキャン。

---

## 🎮 操作方法

| ボタン / 操作 | 説明 |
|---|---|
| **🌐 3Dホロ空間中 (SP切替)** | 3D浮遊デバイス空間とSP全画面ダイレクト操作を切り替えます |
| **🔇 音声 OFF / ON** | Web Audio APIプロシージャル効果音を有効化します |
| **🎵 BGM OFF / ON** | サイバーパンク・シンセウェーブの自動BGM演奏を開始します |
| **🔄 3D自転 ON / OFF** | 3D空間でのスマートフォンの自転アニメーションを制御します |
| **最下部マスタードック** | 4つの内蔵アプリ（FLUID, CHAOS, SYNTH, BIO-HUD）をいつでも切り替え |
| **スマホ画面ドラッグ** | 流体渦巻き、アトラクタ時空ワープ、鍵盤演奏、生体認証を操作 |

---

## 📁 ディレクトリ構成

```
.
├── index.html                  # メインHTML（ビューポート、HUD、マスタードック）
├── README.md                   # 本ドキュメント
├── .nojekyll                   # GitHub Pages用Jekyllバイパス設定
├── css/
│   └── style.css               # サイバーパンク・ガラスモーフィズムCSS
├── lib/
│   ├── three.min.js            # ローカル完全 Three.js r128 バンドル
│   └── OrbitControls.js        # ローカル OrbitControls
└── js/
    ├── synth_audio.js          # Web Audio API プロシージャルSF音響エンジン
    ├── app_quantum_fluid.js    # アプリ1: 量子流体・重力パウダー物理
    ├── app_neural_attractor.js # アプリ2: ニューラルカオス・アトラクタ星雲
    ├── app_cyber_synth.js      # アプリ3: 16ステップ・ドラム＆シンセ
    ├── app_telemetry.js        # アプリ4: 生体パルス＆システムHUD診断
    ├── device_3d.js            # Three.js 3Dスマホ筐体＆ホログラムシェーダー
    └── main.js                 # 全体オーケストレーター、OLEDステータス描画
```

---

## 📜 ライセンス
MIT License
