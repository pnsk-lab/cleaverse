# The Cleaverse Prorocol

Cleaverse は、分散型のオープンワールドを構築するためのプロトコルです。

## 0. 概要

Cleaverse は、ブロックチェーンを用いない分散型の一つのオープンワールドを構築するためのプロトコルです。
プロトコル上では、一つの大規模なオープンワールドが構築されます。 

## 1. Bot

Bot は、Cleaverse ネットワーク上の最小単位です。Cleaverse ではコンピュータによる自動操作されたプレイヤーも、人間が操作しているプレイヤーも等しく Bot です。

### Bot の作成

Botは、ECDSA の公開鍵と秘密鍵を持ちます。Bot の作成にはこの 2 つの鍵が必須です。公開鍵が Bot を示す Bot のアイデンティティとなります。

さらに、Bot を作成したことを Cleaverse ネットワークに送信する必要があります。スキーマは以下のように定義されます :
```ts
interface CreatedEvent {
  type: 'cleaverse.bot.created'
}
```
これにより、Bot が作成されます。Bot を作成したときの座標は (0, 0) でなければいけません。

### Bot の操作

#### Bot の移動

Bot は移動可能です。Bot の移動は以下のスキーマで表現できます。
```ts
interface BotMoveEvent {
  type: 'cleaverse.world.bot.move'
  pos: [x: number, y: number]
}
```
ただし、これを用いてテレポーテーションをすることはできません。前回の移動イベントの送信時間(秒)を $t_0$, 今回送信する時間(秒)を $t$ とするとき、移動可能距離 $d$ は以下のように求まります。
```math
\displaylines{d = \frac{8}{t-t_0+1} \\ (t-t_0 > 0.1)}
```
これは、多く移動ビーコンを送信するほど、高速に移動できることを意味します。ただし、0.1 秒以上の間隔を空けなければなりません。

## 2. メッセージとイベント

### 2.1. メッセージ

Bot やピア同士の通信には、JSON を使用します。
以下のスキーマで定義された JSON を用います:
```ts
interface Message {
  /** Base64 エンコードされた Bot の公開鍵 */
  from: string

  /** JSON で文字列になったイベント, 2.2 で定義される */
  event: string

  /** event の ECDSA/SHA-256 署名 */
  sign: string
}
```

### 2.2. イベント

また、イベントは以下のように定義されます:
```ts
interface BaseEvent {
  /** イベントのタイプを識別するための文字列 */
  type: string
}
```
これは `type` のみが必須のフィールドであり、タイプごとに拡張可能です。

## 3. メッセージの通信

メッセージはさまざまな方法で通信することができます。

### 3.1. WebSocket

WebSocket を用いて通信する方法は、極めて単純です。2.1. で定義されたメッセージを JSON 配列にして、テキスト形式で双方が送信します。

### 3.2. Nostr

Nostr を用いると、リレーを介すことによりクライアント同士が通信することが可能になります。

### 3.3. WebRTC

## 4. ワールドの管理

### 4.1. Block
### 4.2. Chunk

#### 4.2.1. Chunk の定義

ワールドは、16*16 の Chunk に分割されます。Chunk には、Block が含まれます。
チャンクは座標を持ちます。チャンクの座標 $\boldsymbol{C}$ は、ワールド上の座標 $\boldsymbol{P}$ から、以下のように求めることができます。
```math
\begin{pmatrix} \boldsymbol{C}_x \\ \boldsymbol{C}_y \end{pmatrix}
=
\begin{pmatrix} \lfloor \frac{1}{16}\boldsymbol{P}_x \rfloor \\ \lfloor \frac{1}{16}\boldsymbol{P}_y \rfloor \end{pmatrix}
```

#### 4.2.2. Chunk の表現

Chunk に存在するブロックは、以下のスキーマで表現されます。
```ts
type ChunkBlocks = Block[][]
```
これは (16, 16) のマトリックスです。(x, y) で表現されます。

また、現在のチャンクの状態は以下のスキーマで定義されます:
```ts
interface Chunk {
  blocks: ChunkBlocks
}
```

#### 4.2.3. チャンクの取得

最新のチャンクを取得するには、以下のイベントを送ります。
```ts
interface ChunkGetRequestEvent {
  type: 'cleaverse.world.chunk.meta.request'
  chunk: [x: number, y: number] // チャンクの座標
}
```
結果は、以下のように送信されます。
```ts
interface ChunkGetRequestEvent {
  type: 'cleaverse.world.chunk.meta.data'
  chunk: [x: number, y: number] // チャンクの座標
  version: number
  hash: string // SHA256 されたチャンクのデータ
}
```

さまざまなピアから送られたチャンクのデータを集計して、本物のチャンクのデータを計算します。
まず、version と hash のペアの個数を計算します。個数をかけるときには、送信してきた Bot のレピュテーションスコアを重みとして書けます。
最も多い version と hash のペアを本物のチャンクとします。

本物のチャンクの version で、異なる hash を送ってきた Bot は、不正とみなします。

hash からチャンクを取得するには、以下のイベントを利用します:
```ts
interface ChunkRequest {
  type: 'cleaverse.world.chunk.request'
  hash: string
}
```
結果は、以下のようなイベントで送信してください。
```ts
interface ChunkData {
  type: 'cleaverse.world.chunk.data'
  hash: string
  chunk: Chunk
}
```

#### 4.2.4. チャンクの変更

チャンクに存在するブロックは変更可能です。

## 5. レピュテーションスコア

### 5.1. 定義

レピュテーションスコアは、Bot が不正なイベントを送信することを防ぐためのシステムです。
レピュテーションスコアは、各クライアントがそれぞれ計算するため、クライアント同士で同じスコアになるとは限りません。

### 5.2. 表現

レピュテーションスコアは、Bot の ID をキー、浮動小数点数のスコアをバリューとする Key-Value ストアです。
初期値は 0 です。
レピュテーションスコアを実際に計算するときは、
```math
x' = \sigma(x) = \frac{1}{1 + e^{-x}}
```
のようにシグモイド関数を用いて表現します。

### 5.3. 不正の検出

不正を検出した場合、以下のような不正検知イベントを送信する必要があります。
```ts
interface ReputationNoticeEvent {
  type: 'cleaverse.reputation.notice'
  target: string // 不正行為をした Bot の ID
  source: ReputationNoticeSource // 不正行為の根拠
}
```

### 5.4. 不正の種類

#### 不正な移動スピード

不正な移動の場合、以下のような ReputationNoticeSource になります:
```ts
interface ReputationNoticeSource {
  type: 'cleaverse::world::invalid-speed'
  target: string // 不正行為をした Bot の ID
  source: {
    type: 'cleaverse.world.bot.move'
    last: Message<BotMoveEvent>
    now: Message<BotMoveEvent>
  }
}
```
この場合、レピュテーションスコアは 1 減少します。
