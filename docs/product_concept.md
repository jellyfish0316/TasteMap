# TasteMap 整體概念

TasteMap 的核心不是取代 Google Maps，而是：

把不同平台上的美食推薦內容，疊加到 Google Maps 地點資料上，形成個人化的美食地圖。

因此每一筆餐廳資料最後都會對齊到一個：

google_place_id

Google Maps / Places 負責提供穩定的地點基底資料，包括：

- 正式店名
- 地址
- 電話
- 營業時間
- 評分
- 照片
- Google Maps 連結

TasteMap 則補上 Google Maps 原本不擅長整理的「推薦脈絡」，包括：

- 誰推薦
- 從哪個平台來
- 推薦菜色
- 重點評語
- 影片時間點
- 貼文連結
- 個人收藏狀態
- 分類標籤
- 所屬清單 / collection

也就是說，Google Maps 解決的是「這家店在哪裡、基本資訊是什麼」，而 TasteMap 解決的是「這家店是誰推薦的、為什麼值得去、我要把它放進哪個清單」。

Google Places 的 Place Details 可以回傳地址、電話、評分、評論、照片等地點資訊；Places API 也要求使用 field mask 指定需要的欄位，這很適合當作 TasteMap 的地點資料基底。


# TasteMap 功能層級設計

TasteMap 可以分成三個層級來實作。

## Level 1：跨平台內容匯入與地點整理

這是 TasteMap 的核心 MVP。

使用者可以從 Instagram、Google Maps、YouTube、X / Twitter、Threads 等平台匯入美食推薦內容。系統會解析來源內容，抽取餐廳名稱、推薦菜色、重點評語、影片時間點與來源連結，並透過 Google Places 將每家餐廳對齊到同一個 google_place_id。

Level 1 的重點是：

不同來源的美食推薦  
→ 抽取餐廳資訊  
→ 對齊 Google Places  
→ 加入個人 collection  
→ 形成主題美食地圖


## Level 2：追蹤其他使用者

TasteMap 的主要目標不是做完整社群平台，但可以在 Level 2 加入「追蹤別人」的功能，讓使用者建立自己的 Taste Circle。

使用者可以追蹤自己信任的人，例如：

- 朋友
- 美食帳號
- 同學
- 常去相似地區的人
- 口味相近的使用者

被追蹤者的公開清單或公開收藏，可以出現在使用者的探索頁中。

例如：

使用者 A 追蹤了使用者 B  
        ↓  
B 新增了一家台南咖啡廳到公開清單  
        ↓  
A 可以在探索頁看到這家店  
        ↓  
A 可以選擇存到自己的清單  

Level 2 的重點不是做完整社群，而是建立一個簡單的信任網路：

我追蹤誰  
→ 我更容易看到誰推薦的餐廳  
→ 推薦來源變得更可信  

這讓 TasteMap 從單純的個人收藏工具，進一步變成「基於信任關係的美食探索工具」。

## Level 3：用 PageRank 推薦可追蹤的人

Level 3 可以加入演算法推薦，根據使用者之間的追蹤關係與收藏行為，推薦「你可能會想追蹤的人」。

TasteMap 可以把使用者之間的追蹤關係建成一張 graph：

- 節點：TasteMap 使用者
- 邊：A 追蹤 B
- 邊的權重：A 和 B 的口味相似度、收藏重疊度、地區重疊度、互動頻率

接著使用 PageRank 或 Personalized PageRank，找出在使用者信任網路中具有影響力，且和目前使用者口味接近的人。

例如：

你追蹤的人 A、B、C 都常收藏某位使用者 D 的餐廳  
        ↓  
D 在你的 taste network 中權重變高  
        ↓  
系統推薦你追蹤 D  

或是：

你常收藏台南咖啡廳  
        ↓  
某位使用者也大量收藏台南咖啡廳  
        ↓  
而且被你信任圈內的人追蹤  
        ↓  
系統推薦你追蹤這位使用者  

PageRank 在 TasteMap 裡不是直接拿來推薦餐廳，而是用來推薦「值得追蹤的人」。

因為 TasteMap 的核心假設是：

比起陌生平台上的平均評分，人更相信自己信任的人或口味相近的人。

所以 Level 3 的 PageRank 用途是：

從使用者關係圖中找出值得被信任的推薦來源，幫助使用者擴大自己的 Taste Circle。


# 0. 共通匯入歸類 Flow

不論使用者從哪個平台匯入資料，TasteMap 都會在完成地點比對後，讓使用者選擇這批餐廳要加入哪一個清單。

共通流程如下：

使用者從 Instagram / Google Maps / YouTube / X / Threads 匯入內容  
        ↓  
系統解析來源內容  
        ↓  
AI 抽取餐廳名稱、推薦菜色、重點評語、來源連結  
        ↓  
Google Places 比對餐廳  
        ↓  
產生一批待加入的餐廳卡片  
        ↓  
使用者選擇儲存方式：  
- 加入既有清單  
- 建立新清單  
        ↓  
使用者確認匯入  
        ↓  
餐廳加入 TasteMap 個人地圖與指定 collection  

## 匯入時的清單選擇

每次匯入時，使用者都可以選擇：

### 1. 加入既有清單

例如：

- 台南想吃
- 台北咖啡廳
- 日本旅行備案
- 朋友推薦
- 約會餐廳

### 2. 建立新清單

使用者可以自行命名，例如：

- @tainan_foodie 推薦
- 台南牛肉湯清單
- 東京咖啡廳 Vlog
- 台北拉麵 thread
- 2026 京都旅行美食

建立新清單時，系統可以讓使用者補充：

- 清單名稱
- 是否公開 / 私人

如果清單設定為公開，未來就可以被追蹤者看到，並成為 Level 2 和 Level 3 推薦系統的資料來源。

## 自動推薦清單名稱

為了降低使用者整理成本，TasteMap 可以根據匯入來源自動推薦清單名稱。

例如：

Instagram Profile Import：

輸入：  
https://www.instagram.com/tainan_foodie/

系統建議清單名稱：  
@tainan_foodie 推薦地圖

YouTube Video Import：

影片標題：  
台南必吃 10 家美食

系統建議清單名稱：  
台南必吃 10 家美食

X Thread Import：

Thread 主題：  
台北拉麵推薦串

系統建議清單名稱：  
台北拉麵推薦串

Google Maps List Import：

原始清單名稱：  
東京咖啡廳

系統建議清單名稱：  
東京咖啡廳

## 這個設計的價值

TasteMap 不只是把餐廳存進資料庫，而是讓每次匯入都可以被整理成有意義的 collection。

也就是：

一次匯入  
→ 一批餐廳  
→ 一個清單  
→ 一張主題美食地圖  

這會讓 TasteMap 更接近「個人化美食地圖管理工具」，而不是單純的餐廳收藏 app。



# 1. Instagram Flow

Instagram 應該支援三種輸入：

1. Profile URL
2. Post URL
3. Reel URL

## 1A. Instagram Profile Import

### 使用情境

使用者想整理某個美食帳號過去推薦過的店。

輸入：

https://www.instagram.com/tainan_foodie/

### 系統流程

使用者輸入 Instagram profile URL  
        ↓  
系統辨識 username  
        ↓  
Instagram profile scraper 抓公開貼文列表  
        ↓  
取得每篇 post / reel 的：  
- URL  
- caption  
- 發文時間  
- thumbnail  
- location tag if available  
        ↓  
系統過濾美食相關內容  
        ↓  
AI 逐篇抽取：  
- 餐廳名稱  
- 地區線索  
- 推薦菜色  
- 重點評語  
- 是否業配 / 是否踩雷  
        ↓  
Google Places 搜尋餐廳  
        ↓  
取得 google_place_id  
        ↓  
合併重複地點  
        ↓  
生成該 profile 的推薦地圖  
        ↓  
使用者選擇加入既有清單或建立新清單  

### 產出

@tainan_foodie 推薦地圖

- 共掃描：120 篇貼文
- 美食相關：54 篇
- 成功比對地點：38 間
- 需要人工確認：6 間

### Instagram Profile 的價值

這是最像「爬東西整合」的功能。

它的核心亮點是：

一個創作者 profile  
→ 一份創作者美食地圖

## 1B. Instagram Post Import

### 使用情境

使用者看到單篇美食貼文，想存進自己的地圖。

分享 / 貼上：

https://www.instagram.com/p/xxxx/

### 系統流程

使用者分享 Instagram post 到 TasteMap  
        ↓  
系統取得 post URL  
        ↓  
嘗試取得：  
- embed preview  
- caption  
- creator username  
- 圖片文字 OCR if needed  
        ↓  
AI 判斷是否為美食推薦  
        ↓  
AI 抽取：  
- 餐廳名稱  
- 推薦菜色  
- 重點評語  
        ↓  
Google Places 比對地點  
        ↓  
使用者確認  
        ↓  
選擇加入既有清單或建立新清單  
        ↓  
加入個人地圖  

Instagram 官方 oEmbed 主要用途是用一個 Instagram post URL 取得嵌入 HTML 與基本 metadata，適合拿來顯示來源預覽，但不是拿來抓整個 profile feed。

### 產出

餐廳：某某咖啡  
來源：@xxx Instagram post  
推薦菜色：布丁、拿鐵  
重點評語：環境安靜，適合下午讀書  


## 1C. Instagram Reel Import

### 使用情境

使用者看到美食 Reels，裡面可能講多家店或一道菜。

### 系統流程

使用者分享 Reel URL  
        ↓  
系統取得 Reel URL / preview  
        ↓  
可用資料來源：  
- caption  
- hashtags  
- on-screen text OCR  
- audio transcript if available / optional  
        ↓  
AI 解析內容  
        ↓  
如果是單店：  
產生一張餐廳卡片  
        ↓  
如果是多店推薦：  
產生多張餐廳卡片  
        ↓  
Google Places 逐一比對  
        ↓  
使用者選擇加入既有清單或建立新清單  
        ↓  
加入地圖  

### Reel 特點

Reel 很多資訊在畫面文字裡，不一定在 caption，所以這裡要支援：

OCR 截圖 / 影片畫面文字

### Instagram 不應該主打的功能

MVP 不建議主打：

- 抓限動
- 抓私人帳號
- 抓留言
- 抓完整圖片內容

MVP 先做公開 profile、post、reel 就好。

# 2. Google Maps Flow

Google Maps 的主要功能不是解析內容，而是：

把使用者已經存在 Google Maps 裡的店家 / 清單匯入 TasteMap。

Google Maps 應該支援兩種輸入：

1. 單一 Place 分享
2. Google Maps List 分享

## 2A. Google Maps Place Import

### 使用情境

使用者在 Google Maps 看到一家餐廳，想加入 TasteMap。

分享：

Google Maps place URL

### 系統流程

使用者分享 Google Maps 店家連結  
        ↓  
TasteMap 解析 Google Maps URL  
        ↓  
取得店名 / place_id 或用 URL 中資訊重新查詢  
        ↓  
Google Places Details 補資料：  
- 正式店名  
- 地址  
- 電話  
- 營業時間  
- 評分  
- 照片  
- Google Maps link  
        ↓  
使用者選擇收藏狀態：  
- 想去  
- 已吃  
- 朋友推薦  
- 排入口袋清單  
        ↓  
使用者可選填：  
- 推薦菜色  
- 備註  
- 分類  
        ↓  
使用者選擇加入既有清單或建立新清單  
        ↓  
加入個人地圖  

### 產出

餐廳：某某餐酒館  
Google 資訊：地址、電話、營業時間、評分  
TasteMap 資訊：想去、約會餐廳、朋友推薦  

這裡不需要 AI 解析，因為地點本來就是明確的。

## 2B. Google Maps List Import

### 使用情境

使用者已經在 Google Maps 有一份清單，例如：

- 台南想吃
- 東京咖啡廳
- 朋友推薦餐廳

想整份搬到 TasteMap。

### 系統流程

使用者分享 Google Maps List URL  
        ↓  
TasteMap 讀取 / 解析 list 頁面可見的地點  
        ↓  
抽出每個地點：  
- 店名  
- Google Maps URL  
- 地址 if visible  
        ↓  
逐一用 Google Places 補 place_id  
        ↓  
批次建立 TasteMap collection  
        ↓  
使用者可為整份清單設定：  
- collection name  
- 是否公開 / 私人  
        ↓  
完成匯入  

### 產出

Collection：台南想吃

- 匯入 25 間店
- 成功比對 23 間
- 需要確認 2 間

### 注意點

Google Maps 沒有一個很乾淨的公開 API 讓你直接讀取某個使用者的 saved places。很多討論也指出「取得 Google Maps My Places / saved places list」沒有正式 API。

所以這裡在專題上可以設計成：

使用者分享公開 / 可見的 Google Maps list URL  
→ 系統解析頁面中可見地點  

而不是說：

登入 Google 帳號後同步所有收藏

這樣比較合理。

# 3. YouTube Flow

YouTube 應該支援兩種輸入：

1. Video URL
2. Channel URL

## 3A. YouTube Video Import

### 使用情境

使用者看到一支美食影片，例如：

- 台南必吃 10 家
- 東京咖啡廳 Vlog
- 台北拉麵排名

### 系統流程

使用者分享 YouTube video URL  
        ↓  
系統取得：  
- video title  
- description  
- chapters  
- transcript / subtitles if available  
        ↓  
AI 判斷影片類型：  
- 單店介紹  
- 多店清單  
- 旅遊美食 Vlog  
        ↓  
AI 從 transcript / description 抽取：  
- 餐廳名稱  
- 出現時間點  
- 推薦菜色  
- 主持人評語  
- 優缺點  
        ↓  
逐一用 Google Places 比對  
        ↓  
建立「影片美食地圖」  
        ↓  
使用者選擇加入既有清單或建立新清單  

YouTube Data API 可以取得影片、頻道、playlist 等 metadata；字幕 / transcript 方面，官方 captions API 對權限有要求，實務 demo 常用公開字幕或 transcript 工具作 fallback。YouTube Data API 的官方文件列出可讀取 videos、channels、playlists 等資源；youtube-transcript-api 這類工具則可抓影片 transcript / subtitles，包括自動字幕。

### 產出

影片：台南必吃 10 家

餐廳 1：文章牛肉湯  
時間點：02:13  
推薦菜色：牛肉湯  
評語：湯頭清甜，肉質新鮮  

餐廳 2：阿堂鹹粥  
時間點：05:40  
推薦菜色：虱目魚粥  
評語：傳統台南早餐  

### YouTube Video 的特色功能

餐廳卡片可以跳回影片對應時間點。

這是其他平台沒有的。

## 3B. YouTube Channel Import

### 使用情境

使用者想整理某個美食 YouTuber 的推薦店。

輸入：

https://www.youtube.com/@foodvlogger

### 系統流程

使用者輸入 YouTube channel URL  
        ↓  
系統抓取頻道影片列表  
        ↓  
篩選美食相關影片  
        ↓  
對每支影片執行 Video Import  
        ↓  
抽取多家店  
        ↓  
合併重複 google_place_id  
        ↓  
生成該 YouTuber 的推薦地圖  
        ↓  
使用者選擇加入既有清單或建立新清單  

### 產出

@foodvlogger 推薦地圖

- 分析影片：35 支
- 抽取餐廳：120 間
- 成功比對：102 間

### YouTube 不應該做的事

不需要解析留言當主資料來源。

留言雜訊太多，MVP 先不要碰。


# 4. X / Twitter Flow

X 應該支援三種輸入：

1. Single Post URL
2. Thread URL
3. Profile URL

## 4A. X Single Post Import

### 使用情境

使用者看到一則短評：

台北這家拉麵真的強，醬油湯頭很乾淨，叉燒也好吃。

### 系統流程

使用者分享 X post URL  
        ↓  
系統取得 post text  
        ↓  
AI 抽取餐廳、菜色、評語  
        ↓  
Google Places 比對  
        ↓  
使用者選擇加入既有清單或建立新清單  
        ↓  
加入地圖  

## 4B. X Thread Import

### 使用情境

使用者看到美食推薦串：

- 台北 10 家拉麵推薦 thread
- 台南早餐清單 thread

### 系統流程

使用者分享 thread URL  
        ↓  
系統抓取 thread 中相關 posts  
        ↓  
AI 判斷每段對應哪家店  
        ↓  
抽出多個餐廳  
        ↓  
逐一比對 Google Places  
        ↓  
生成一份清單地圖  
        ↓  
使用者選擇加入既有清單或建立新清單  

### 產出

Collection：台北拉麵推薦串

- 共抽出 10 家店
- 每家包含短評與來源 post

這是 X 很適合做的功能，因為它常有「串文清單」。


## 4C. X Profile Import

### 使用情境

使用者輸入一個美食帳號：

https://x.com/taipei_eats

### 系統流程

使用者輸入 X profile URL  
        ↓  
系統解析 username  
        ↓  
抓取該 user 近期 posts  
        ↓  
篩選美食推薦 posts  
        ↓  
抽取餐廳與推薦資訊  
        ↓  
Google Places 比對  
        ↓  
生成 creator 推薦地圖  
        ↓  
使用者選擇加入既有清單或建立新清單  

X API v2 有 GET /2/users/{id}/tweets 可以取得指定使用者發出的 posts，因此 X 是比較適合做 profile import 的平台之一。


# 5. Threads Flow

Threads 應該支援：

1. Single Post URL
2. Profile URL / prototype profile scan

## 5A. Threads Post Import

### 使用情境

Threads 常是短文字心得，例如：

今天吃到一家超適合讀書的咖啡廳，布丁跟拿鐵都不錯。

### 系統流程

使用者分享 Threads post URL  
        ↓  
系統取得可見文字  
        ↓  
AI 抽取：  
- 餐廳名稱  
- 推薦菜色  
- 重點短評  
- 適合情境  
        ↓  
Google Places 比對  
        ↓  
使用者選擇加入既有清單或建立新清單  
        ↓  
加入地圖  

### 特色

Threads 很適合抽：

- 適合情境
- 短評
- 優缺點

例如：

- 適合讀書
- 適合約會
- 排隊很久

## 5B. Threads Profile Import

### 使用情境

整理某個 Threads 美食帳號。

### 系統流程

使用者輸入 Threads profile URL  
        ↓  
prototype scraper 掃描公開 posts  
        ↓  
篩選美食相關貼文  
        ↓  
抽取地點與推薦資訊  
        ↓  
Google Places 比對  
        ↓  
生成 profile 地圖  
        ↓  
使用者選擇加入既有清單或建立新清單  

Threads 和 Instagram 一樣，不一定要作為第一優先平台。MVP 可以先做 post import，再把 profile scan 當進階功能。


# 最合理的產品說法

TasteMap 不是把所有平台都硬套成同一種爬蟲，而是根據各平台的資料型態設計不同的匯入流程。

Google Maps 負責匯入既有地點與清單，作為餐廳資料基底；Instagram 支援 profile、post、reel 解析，整理創作者推薦；YouTube 支援 video 和 channel，透過 transcript 產生影片美食地圖；X 支援 post、thread、profile，特別適合把推薦串轉成地圖；Threads 則適合整理短文字心得與情境式推薦。

所有來源最後都會透過 Google Places 對齊到同一個 google_place_id，形成統一的個人化美食地圖。每次匯入完成後，使用者都可以選擇加入既有清單，或是建立新的 collection，例如「台南想吃」、「東京咖啡廳」、「@tainan_foodie 推薦地圖」、「台北拉麵 thread」。

在進階功能上，TasteMap 可以加入追蹤其他使用者的功能，讓使用者看到朋友、同學、美食帳號或口味相近者的公開收藏。再進一步，TasteMap 可以使用 PageRank / Personalized PageRank，根據使用者追蹤關係、收藏重疊度與地區偏好，推薦值得追蹤的人。

因此 TasteMap 的完整定位是：

Level 1：跨平台匯入美食推薦，整理成個人化美食地圖。  
Level 2：追蹤其他使用者，形成基於信任關係的 Taste Circle。  
Level 3：用 PageRank 推薦值得追蹤的人，擴大使用者的美食探索來源。

TasteMap 的核心價值不是取代 Google Maps，而是把分散在 Instagram、YouTube、X、Threads 和 Google Maps 上的美食推薦內容，整理成可以收藏、分類、追蹤與重新探索的個人化美食地圖。