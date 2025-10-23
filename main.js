<<<<<<< HEAD
// ...existing code from <script>...</script> in index.html...
mapboxgl.accessToken = 'pk.eyJ1IjoiZ2dwbGF5ZXIiLCJhIjoiY200OXBzcmI1MGR6bzJxcTFrdDJ1MGJyNSJ9.o_VpEScSsAPdt8U8PDB58Q';

// Mapインスタンスをグローバル(window)にする
window.map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/satellite-streets-v12', // 衛星画像固定
    projection: 'globe',
    zoom: 4,
    center: [138, 36],
    // モバイル対応の設定
    touchZoomRotate: true,
    touchPitch: true,
    dragPan: true,
    dragRotate: true,
    scrollZoom: true,
    boxZoom: true,
    doubleClickZoom: true,
    keyboard: true,
    // モバイルでのパフォーマンス最適化
    renderWorldCopies: false,
    maxTileCacheSize: 50,
    // タッチ操作の感度調整
    touchAction: 'pan-x pan-y'
=======

// ...existing code from <script>...</script> in index.html...
mapboxgl.accessToken = 'pk.eyJ1IjoiZ2dwbGF5ZXIiLCJhIjoiY200OXBzcmI1MGR6bzJxcTFrdDJ1MGJyNSJ9.o_VpEScSsAPdt8U8PDB58Q';

const SATELLITE_STYLE = 'mapbox://styles/mapbox/satellite-streets-v12';
const STREETS_STYLE = 'mapbox://styles/mapbox/streets-v11';

// Mapインスタンスをグローバル(window)にする
window.map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/satellite-streets-v12', // サテライトを初期表示
    projection: 'globe',
    zoom: 4,
    center: [138, 36]
>>>>>>> a09663c (connect)
});

map.addControl(new mapboxgl.NavigationControl());

// --- ここが重要 ---
// fetchBoundaryData()の呼び出しはDOMContentLoadedではなく、必ず「map.on('style.load', ...)」の中で一度だけ呼ぶ
let boundaryLoaded = false;
map.on('style.load', () => {
    map.setFog({});
    // ラベルレイヤーを非表示にする
    map.getStyle().layers.forEach(layer => {
        if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
            map.setLayoutProperty(layer.id, 'visibility', 'none');
        }
    });
    // アイコンとレイヤーを再登録
    loadIconsAndAddLayer();
    if (boundaryGeoJson) {
        drawOuterBoundary(boundaryGeoJson);
    }
    
    // おすすめスポットのレイヤーも再初期化
    if (lastRecommendedSpotsGeoJson) {
        try {
            if (!map.getSource('recommended-spots')) {
                map.addSource('recommended-spots', { 
                    type: 'geojson', 
                    data: lastRecommendedSpotsGeoJson 
                });
            }
            
            if (!map.getLayer('recommended-spots-layer')) {
                map.addLayer({
                    id: 'recommended-spots-layer',
                    type: 'symbol',
                    source: 'recommended-spots',
                    layout: {
                        'icon-image': ['get', 'icon'],
<<<<<<< HEAD
                        'icon-size': 0.1, // 小さめに
                        'icon-allow-overlap': true
                    },
                    paint: {
                        'icon-opacity': 0
=======
                        'icon-size': 0.08, // さらに小さく
                        'icon-allow-overlap': true
                    },
                    paint: {
                        'icon-opacity': 1
>>>>>>> a09663c (connect)
                    }
                });
            }
            console.log('✅ Recommended spots layer re-initialized on style load');
        } catch (error) {
            console.error('❌ Failed to re-initialize recommended spots layer:', error);
        }
    }
});

function loadIconsAndAddLayer() {
    const iconFiles = [
<<<<<<< HEAD
        // みんなのおすすめスポット用のアイコン
=======
        // みんなのおすすめスポット用のアイコンのみ
>>>>>>> a09663c (connect)
        { name: 'mayor-icon', url: '市長.png' },
        { name: 'male-icon', url: '男性.png' },
        { name: 'female-icon', url: '女性.png' },
        { name: 'girl-icon', url: '女性.png' }, // 女子は女性アイコンを使用
        { name: 'boy-icon', url: '男性.png' }, // 男子は男性アイコンを使用
        { name: 'grandfather-icon', url: 'おじいちゃん.png' },
        { name: 'grandmother-icon', url: 'おばあちゃん.png' }
    ];
    let loaded = 0;
    iconFiles.forEach(icon => {
        map.loadImage(icon.url, (error, image) => {
            if (error) {
                console.error(`❌ 画像の読み込み失敗: ${icon.url}`, error);
            } else {
                if (!map.hasImage(icon.name)) {
                    try {
                        map.addImage(icon.name, image);
                        console.log(`✅ 画像登録: ${icon.name} (${icon.url})`);
                    } catch (e) {
                        console.error(`❌ addImage失敗: ${icon.name}`, e);
                    }
                } else {
                    console.log(`ℹ️ 既に登録済み: ${icon.name}`);
                }
            }
            loaded++;
            if (loaded === iconFiles.length) {
<<<<<<< HEAD
                // ジャンル用のソースとレイヤーを再追加
                try {
                    if (!map.getSource('genre-markers')) {
                        map.addSource('genre-markers', { type: 'geojson', data: lastGenreMarkersGeoJson || { type: 'FeatureCollection', features: [] } });
                        console.log('✅ genre-markersソース追加');
                    } else {
                        map.getSource('genre-markers').setData(lastGenreMarkersGeoJson || { type: 'FeatureCollection', features: [] });
                        console.log('ℹ️ genre-markersソース更新');
                    }
                } catch (e) {
                    console.error('❌ genre-markersソース追加/更新失敗', e);
                }
                try {
                    if (!map.getLayer('genre-marker-layer')) {
                        map.addLayer({
                            id: 'genre-marker-layer',
                            type: 'symbol',
                            source: 'genre-markers',
                            layout: {
                                'icon-image': ['get', 'icon'],
                                'icon-size': 0.2,
                                'icon-allow-overlap': true
                            },
                            paint: {
                                'icon-opacity': 0
                            }
                        });
                        console.log('✅ genre-marker-layer追加');
                    } else {
                        console.log('ℹ️ genre-marker-layerは既に存在');
                    }
                } catch (e) {
                    console.error('❌ genre-marker-layer追加失敗', e);
                }
                
=======
                // ソースとレイヤーを再追加（おすすめのみ）
>>>>>>> a09663c (connect)
                // みんなのおすすめスポットのソースとレイヤーを再追加
                try {
                    if (!map.getSource('recommended-spots')) {
                        map.addSource('recommended-spots', { type: 'geojson', data: lastRecommendedSpotsGeoJson || { type: 'FeatureCollection', features: [] } });
                        console.log('✅ recommended-spotsソース追加');
                    } else {
                        map.getSource('recommended-spots').setData(lastRecommendedSpotsGeoJson || { type: 'FeatureCollection', features: [] });
                        console.log('ℹ️ recommended-spotsソース更新');
                    }
                } catch (e) {
                    console.error('❌ recommended-spotsソース追加/更新失敗', e);
                }
                try {
                    if (!map.getLayer('recommended-spots-layer')) {
                        map.addLayer({
                            id: 'recommended-spots-layer',
                            type: 'symbol',
                            source: 'recommended-spots',
                            layout: {
                                'icon-image': ['get', 'icon'],
                                'icon-size': [
                                    'match',
                                    ['get', 'icon'],
<<<<<<< HEAD
                        'mayor-icon', 0.15,
                        'male-icon', 0.15,
                        'female-icon', 0.15,
                        'grandfather-icon', 0.15,
                        'grandmother-icon', 0.15,
=======
                                    'mayor-icon', 0.13,
                                    'male-icon', 0.13,
                                    'female-icon', 0.13,
                                    'grandfather-icon', 0.13,
                                    'grandmother-icon', 0.13,
>>>>>>> a09663c (connect)
                                    0.2
                                ],
                                'icon-allow-overlap': true
                            },
                            paint: {
<<<<<<< HEAD
                                'icon-opacity': 1 // デフォルト表示に変更
=======
                                'icon-opacity': 1
>>>>>>> a09663c (connect)
                            }
                        });
                        console.log('✅ recommended-spots-layer追加');
                    } else {
                        console.log('ℹ️ recommended-spots-layerは既に存在');
                    }
                } catch (e) {
                    console.error('❌ recommended-spots-layer追加失敗', e);
                }
            }
        });
    });
}

// 高島市以外を雲で隠すアニメーション
function applyFogAnimation() {
    map.setFog({
        range: [0.5, 10],
        color: 'white',
        "horizon-blend": 0.1
    });
    gsap.to(map.getFog(), {
        duration: 2,
        range: [0.1, 2],
        "horizon-blend": 0.8,
        onUpdate: () => {
            map.setFog({
                range: gsap.getProperty(map.getFog(), "range"),
                color: 'white',
                "horizon-blend": gsap.getProperty(map.getFog(), "horizon-blend")
            });
        }
    });
}

function highlightTakasima() {
    map.flyTo({
        center: [135.94635242951762, 35.37786887726864],
        zoom: 10,
        pitch: 45,
        bearing: 0,
        speed: 0.8,
        curve: 1.5
    });
    applyFogAnimation();
}

const sheetNames = ['takasima_map'];
const spreadsheetId = '1AZgfYRfWLtVXH7rx7BeEPmbmdy7EfnGDbAwi6bMSNsU';
const apiKey = 'AIzaSyAj_tQf-bp0v3j6Pl8S7HQVO5I-D5WI0GQ';

// みんなのおすすめスポット用の設定
const recommendedSpotsSpreadsheetId = '1kshDopEBMw-7chK-TyV8_vp9Qhwe25ScoZ-BYmIJnL8';
const recommendedSpotsSheetName = 'おすすめスポット'; // 正しいシート名

let data = {};
<<<<<<< HEAD
let genreMarkers = []; // markersをgenreMarkersに変更
let recommendedSpotsMarkers = [];
let genres = new Set(); // categoriesをgenresに変更
let boundaryGeoJson = null;
let lastGenreMarkersGeoJson = null; // lastMarkersGeoJsonをlastGenreMarkersGeoJsonに変更
let lastRecommendedSpotsGeoJson = null;
// みんなのおすすめスポットは常に表示（トグル機能削除）
let recommendedSpotsVisible = true; // 常に表示
=======
let markers = [];
let recommendedSpotsMarkers = [];
let categories = new Set();
let boundaryGeoJson = null;
let lastMarkersGeoJson = null;
let lastRecommendedSpotsGeoJson = null;
let recommendedSpotsVisible = false; // おすすめスポットの表示状態を管理
>>>>>>> a09663c (connect)

async function fetchData(sheetName) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}?key=${apiKey}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();
        data.values.shift();
        return data.values;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

// みんなのおすすめスポットのデータを取得
async function fetchRecommendedSpotsData() {
    console.log('Fetching recommended spots data from', recommendedSpotsSheetName);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${recommendedSpotsSpreadsheetId}/values/${recommendedSpotsSheetName}?key=${apiKey}`;
    console.log('Request URL:', url);

    try {
        // GitHub Pagesでの動作を確実にするため、タイムアウトを設定
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒でタイムアウト

        const response = await fetch(url, {
            signal: controller.signal,
            mode: 'cors',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to fetch recommended spots data`);
        }
        const data = await response.json();
        console.log('Fetched recommended spots data:', data);
        
        if (!data.values || data.values.length === 0) {
            console.log('No recommended spots data found');
            return [];
        }
        
        // 参考コードと同じように、ヘッダー行を削除しない
        console.log('Processed recommended spots rows:', data.values);
        return data.values;
    } catch (error) {
        console.error('Error fetching recommended spots data:', error);
        if (error.name === 'AbortError') {
            console.log('Request timed out, using fallback data');
        }
        return [];
    }
}

<<<<<<< HEAD
// ジャンル名から英単語を抽出する関数
function extractEnglishFromGenre(genre) {
    // 英単語のみを抽出する正規表現
    const englishWords = genre.match(/[a-zA-Z]+/g);
    if (englishWords && englishWords.length > 0) {
        // 最初の英単語を返す（複数ある場合は最初のもの）
        return englishWords[0];
    }
    
    // 英単語がない場合のマッピング
    const genreMapping = {
        'グルメ': 'Food',
        '景色': 'View',
        '体験': 'Experience',
        '思い出': 'Memory',
        'その他': 'Other',
        '観光': 'Tour',
        '自然': 'Nature',
        '文化': 'Culture',
        '歴史': 'History',
        'スポーツ': 'Sports',
        'アート': 'Art',
        'ショッピング': 'Shop'
    };
    
    return genreMapping[genre] || 'Other';
}

// ジャンル別のアイコンマッピング関数
function getIconForGenre(genre) {
    const iconMapping = {
        'グルメ': 'grandmother-icon',
        '景色': 'male-icon',
        '体験': 'mayor-icon',
        '思い出': 'female-icon',
        'その他': 'grandfather-icon'
    };
    return iconMapping[genre] || 'mayor-icon';
}

// ジャンル別のスタイル定義（動的に更新）
const GENRE_STYLES = {};

function updateGenreStyles() {
    const warmColors = [
        '#ff8c00',   // ダークオレンジ
        '#ffa500',   // オレンジ  
        '#ffd700',   // ゴールド
        '#ff7f50',   // コーラル
        '#daa520',   // ゴールデンロッド
        '#cd853f',   // ペルー
        '#d2691e',   // チョコレート
        '#f4a460',   // サンディブラウン
        '#bc8f8f'    // ロージーブラウン
    ];
    let colorIndex = 0;
    
    Array.from(genres).forEach(genre => {
        if (!GENRE_STYLES[genre]) {
            GENRE_STYLES[genre] = {
                color: warmColors[colorIndex % warmColors.length],
                icon: getIconForGenre(genre)
            };
            colorIndex++;
        }
    });
}

// アイコンを読み込む関数（観光用のアイコンを削除）
function loadIcons() {
    const iconFiles = [
        // みんなのおすすめスポット用のアイコンのみ
        { name: 'mayor-icon', url: '市長.png' },
        { name: 'male-icon', url: '男性.png' },
        { name: 'female-icon', url: '女性.png' },
        { name: 'grandfather-icon', url: 'おじいちゃん.png' },
        { name: 'grandmother-icon', url: 'おばあちゃん.png' }
=======
// 観光カテゴリー定義は廃止

// アイコンを読み込む関数
function loadIcons() {
    const iconFiles = [
        { name: 'mountain-icon', url: 'mountain.png' },
        { name: 'camp-icon', url: 'camp.png' },
        { name: 'kankochi-icon', url: 'kankochi.png' },
        { name: 'event-icon', url: 'event.png' },
        { name: 'shrine-icon', url: 'shrine.png' },
        { name: 'hotel-icon', url: 'hotel.png' },
        { name: 'food-icon', url: 'food.png' }
>>>>>>> a09663c (connect)
    ];

    iconFiles.forEach(icon => {
        map.loadImage(icon.url, (error, image) => {
            if (error) {
                console.error(`Error loading icon ${icon.url}:`, error);
                return;
            }
            if (!map.hasImage(icon.name)) {
                map.addImage(icon.name, image);
            }
        });
    });
}

async function init() {
<<<<<<< HEAD
    // アイコンを読み込む
    loadIcons();
    
    // 空のジャンルマーカーを初期化（おすすめスポットのみ使用）
    genreMarkers = [];
    
    console.log('Main init completed - waiting for recommended spots data');
}

// 動的にカテゴリーボタンを生成する関数（Googleマップ風）
function generateGenreButtons() {
    const categoryScroll = document.getElementById('category-scroll');
    categoryScroll.innerHTML = '';
    
    // すべてのジャンル名を取得
    const allGenres = Array.from(genres);
    

    // 各ジャンルボタンを追加
    allGenres.forEach(genre => {
        const style = GENRE_STYLES[genre] || { color: '#CCCCCC', icon: 'male-icon' };
        const genreButton = document.createElement('button');
        genreButton.className = 'category-button';
        
        // ジャンルに応じたアイコンを設定
        let iconSvg = '';
        switch(genre) {
            case 'グルメ':
                iconSvg = `<svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" class="category-icon">
                    <path d="M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z"/>
                </svg>`;
                break;
            case '景色':
                iconSvg = `<svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" class="category-icon">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>`;
                break;
            case '体験':
                iconSvg = `<svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" class="category-icon">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>`;
                break;
            default:
                iconSvg = `<img src="${style.icon.replace('-icon', '.png')}" alt="${genre}" class="category-icon">`;
        }
        
        genreButton.innerHTML = `
            ${iconSvg}
            <span>${genre}</span>
        `;
        genreButton.title = `${genre}を表示`;
        genreButton.dataset.genre = genre;
        genreButton.dataset.active = 'false';
        genreButton.onclick = (e) => {
            e.preventDefault();
            // ON/OFF切り替え
            const isActive = genreButton.classList.toggle('active');
            genreButton.dataset.active = isActive ? 'true' : 'false';
            updateRecommendedSpotsFilter();
        };
        categoryScroll.appendChild(genreButton);
    });
}

// スクロールボタンの設定（新しいレイアウトでは不要）

// おすすめスポットのジャンルフィルター機能
function updateRecommendedSpotsFilter() {
    const genreButtons = Array.from(document.querySelectorAll('.category-button'));
    const activeGenres = genreButtons.filter(btn => btn.classList.contains('active')).map(btn => btn.dataset.genre);
    
    let filteredFeatures;
    if (activeGenres.length === 0) {
        // すべてOFF: 全部表示
        filteredFeatures = recommendedSpotsMarkers.map(marker => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: marker.coordinates },
            properties: marker.properties
        }));
    } else {
        // ONのジャンルのみ表示
        filteredFeatures = recommendedSpotsMarkers
            .filter(marker => activeGenres.includes(marker.properties.genre))
            .map(marker => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: marker.coordinates },
                properties: marker.properties
            }));
    }
    
    const source = map.getSource('recommended-spots');
    if (source) {
        source.setData({
            type: 'FeatureCollection',
            features: filteredFeatures
        });
    }
=======
    // 観光（通常マーカー）は廃止

    map.on('load', () => {
        // アイコンを読み込む
        loadIcons();
        
        // 既存の観光マーカー関連のレイヤー・イベントは作成しない

        // クリックでおすすめポップアップを閉じる
        map.on('click', (e) => {
            const recommendedFeatures = map.queryRenderedFeatures(e.point, { layers: ['recommended-spots-layer'] });
            if (recommendedFeatures.length === 0) {
                recommendedSpotsPopup.remove();
                isRecommendedSpotsPopupFixed = false;
            }
        });

        // みんなのおすすめスポット用のポップアップ
        const recommendedSpotsPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });
        let isRecommendedSpotsPopupFixed = false;

        map.on('mouseenter', 'recommended-spots-layer', (e) => {
            map.getCanvas().style.cursor = 'pointer';
            if (!isRecommendedSpotsPopupFixed) {
                const features = map.queryRenderedFeatures(e.point, { layers: ['recommended-spots-layer'] });
                if (features.length > 0) {
                    const feature = features[0];
                    const coordinates = feature.geometry.coordinates.slice();
                    const properties = feature.properties;
                    const html = `
                        <div class="popup">
                            <h3>${properties.recommendedPlace}</h3>
                            <p><strong>${properties.nickname}</strong>のおすすめ</p>
                            ${properties.reason ? `<p>${properties.reason}</p>` : ''}
                        </div>
                    `;
                    recommendedSpotsPopup.setLngLat(coordinates).setHTML(html).addTo(map);
                }
            }
        });

        map.on('mouseleave', 'recommended-spots-layer', () => {
            map.getCanvas().style.cursor = '';
            if (!isRecommendedSpotsPopupFixed) recommendedSpotsPopup.remove();
        });

        map.on('click', 'recommended-spots-layer', (e) => {
            const features = map.queryRenderedFeatures(e.point, { layers: ['recommended-spots-layer'] });
            if (features.length > 0) {
                const feature = features[0];
                const coordinates = feature.geometry.coordinates.slice();
                const properties = feature.properties;
                const html = `
                    <div class="popup">
                        <h3>${properties.recommendedPlace}</h3>
                        <p><strong>${properties.nickname}</strong>のおすすめ</p>
                        ${properties.reason ? `<p>${properties.reason}</p>` : ''}
                    </div>
                `;
                recommendedSpotsPopup.remove();
                recommendedSpotsPopup.setLngLat(coordinates).setHTML(html).addTo(map);
                isRecommendedSpotsPopupFixed = true;
            }
        });

        // カテゴリーフィルター機能を削除 - 思い出マップ用に簡素化
    });
>>>>>>> a09663c (connect)
}

// みんなのおすすめスポットの初期化
async function initRecommendedSpots() {
    let points = await fetchRecommendedSpotsData();
    
    // データが取得できない場合はテスト用のダミーデータを使用
    if (!points || points.length === 0) {
        console.log('Using dummy data for testing - API access failed or no data available');
        points = [
<<<<<<< HEAD
            ['タイムスタンプ', 'ニックネーム', 'おすすめの場所', '理由', '座標', 'アイコン', 'グルメ'], // ヘッダー行
            ['2025-01-01', 'けんた', '高島市市役所', '７月２３日麗澤大学と高島市の協定調印式！', '35.353044, 136.035733', '市長', '体験'],
            ['2025-01-01', 'テストユーザー', '琵琶湖', '美しい湖の景色', '35.377868, 135.946352', '男性', '景色'],
            ['2025-01-01', '地元の方', 'マキノサニービーチ', '夏の海水浴場として人気', '35.416667, 136.016667', '女性', ''],
            ['2025-01-01', '観光客', '高島市観光案内所', '観光情報が充実', '35.353044, 136.035733', 'おじいちゃん', 'グルメ']
=======
            ['2025-01-01', 'けんた', '高島市市役所', '７月２３日麗澤大学と高島市の協定調印式！', '35.353044, 136.035733', '市長'],
            ['2025-01-01', 'テストユーザー', '琵琶湖', '美しい湖の景色', '35.377868, 135.946352', '男性'],
            ['2025-01-01', '地元の方', 'マキノサニービーチ', '夏の海水浴場として人気', '35.416667, 136.016667', '女性'],
            ['2025-01-01', '観光客', '高島市観光案内所', '観光情報が充実', '35.353044, 136.035733', 'おじいちゃん']
>>>>>>> a09663c (connect)
        ];
    }

    recommendedSpotsMarkers = [];
<<<<<<< HEAD
    genres.clear(); // ジャンルセットをクリア
=======
>>>>>>> a09663c (connect)

    points.forEach((point, index) => {
        // ヘッダー行をスキップ
        if (index === 0) return;
        
<<<<<<< HEAD
        const [timestamp, nickname, recommendedPlace, reason, coordinates, icon, genreFromSheet] = point;
=======
        const [timestamp, nickname, recommendedPlace, reason, coordinates, icon, genre] = point;
>>>>>>> a09663c (connect)
        
        if (!coordinates || !recommendedPlace) return;
        
        // 緯度経度を解析
        let lat, lon;
        try {
            const coords = coordinates.split(',').map(coord => coord.trim());
            lat = parseFloat(coords[0]);
            lon = parseFloat(coords[1]);
        } catch (e) {
            console.warn('Invalid coordinates format:', coordinates);
            return;
        }
        
        if (isNaN(lat) || isNaN(lon)) return;
        
<<<<<<< HEAD
        // ジャンルの処理（G列から取得、空白の場合は「その他」）
        let genre = (genreFromSheet && genreFromSheet.trim()) ? genreFromSheet.trim() : 'その他';
        genres.add(genre); // ジャンルをセットに追加
        
=======
>>>>>>> a09663c (connect)
        // アイコン名を決定
        let iconName = 'mayor-icon'; // デフォルト
        if (icon) {
            switch (icon.trim()) {
                case '市長':
                    iconName = 'mayor-icon';
                    break;
                case '男性':
                    iconName = 'male-icon';
                    break;
                case '女性':
                    iconName = 'female-icon';
                    break;
                case '女子':
                    iconName = 'girl-icon';
                    break;
                case '男子':
                    iconName = 'boy-icon';
                    break;
                case 'おじいちゃん':
                    iconName = 'grandfather-icon';
                    break;
                case 'おばあちゃん':
                    iconName = 'grandmother-icon';
                    break;
            }
        }
        
        recommendedSpotsMarkers.push({
            coordinates: [lon, lat],
            properties: { 
                nickname: nickname || '匿名',
                recommendedPlace: recommendedPlace,
                reason: reason || '',
                icon: iconName,
<<<<<<< HEAD
                genre: genre // ジャンル情報を追加
=======
                genre: genre || '' // G列のジャンル情報
>>>>>>> a09663c (connect)
            }
        });
    });

    lastRecommendedSpotsGeoJson = {
        type: 'FeatureCollection',
        features: recommendedSpotsMarkers.map(marker => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: marker.coordinates },
            properties: marker.properties
        }))
    };

<<<<<<< HEAD
    // ジャンルスタイルを更新
    updateGenreStyles();
    
    // ジャンル用のボタンを生成
    generateGenreButtons();

    // ソースとレイヤーを追加（デフォルト表示）
=======
        // ソースとレイヤーを追加（初期状態では非表示）
>>>>>>> a09663c (connect)
    try {
        if (map.getSource('recommended-spots')) {
            map.getSource('recommended-spots').setData(lastRecommendedSpotsGeoJson);
        } else {
            map.addSource('recommended-spots', { 
                type: 'geojson', 
                data: lastRecommendedSpotsGeoJson 
            });
        }
        
        if (!map.getLayer('recommended-spots-layer')) {
            map.addLayer({
                id: 'recommended-spots-layer',
                type: 'symbol',
                source: 'recommended-spots',
                layout: {
                    'icon-image': ['get', 'icon'],
<<<<<<< HEAD
                    'icon-size': [
                        'match',
                        ['get', 'icon'],
                        'mayor-icon', 0.15,
                        'male-icon', 0.15,
                        'female-icon', 0.15,
                        'grandfather-icon', 0.15,
                        'grandmother-icon', 0.15,
                        0.15
                    ],
                    'icon-allow-overlap': true
                },
                paint: {
                    'icon-opacity': 1 // デフォルト表示
                }
            });
        }
        
        // みんなのおすすめスポット用のポップアップ処理を追加
        const recommendedSpotsPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });
        let isRecommendedSpotsPopupFixed = false;

        map.on('mouseenter', 'recommended-spots-layer', (e) => {
            map.getCanvas().style.cursor = 'pointer';
            if (!isRecommendedSpotsPopupFixed) {
                const features = map.queryRenderedFeatures(e.point, { layers: ['recommended-spots-layer'] });
                if (features.length > 0) {
                    const feature = features[0];
                    const coordinates = feature.geometry.coordinates.slice();
                    const properties = feature.properties;
                    const html = `
                        <div class="popup">
                            <h3>${properties.recommendedPlace}</h3>
                            <p><strong>${properties.nickname}</strong>のおすすめ</p>
                            ${properties.genre ? `<p class="genre-tag" style="background: ${GENRE_STYLES[properties.genre]?.color || '#ccc'}; color: white; padding: 2px 6px; border-radius: 10px; font-size: 11px; display: inline-block; margin: 2px 0;">${properties.genre}</p>` : ''}
                            ${properties.reason ? `<p>${properties.reason}</p>` : ''}
                        </div>
                    `;
                    recommendedSpotsPopup.setLngLat(coordinates).setHTML(html).addTo(map);
                }
            }
        });

        map.on('mouseleave', 'recommended-spots-layer', () => {
            map.getCanvas().style.cursor = '';
            if (!isRecommendedSpotsPopupFixed) recommendedSpotsPopup.remove();
        });

        map.on('click', 'recommended-spots-layer', (e) => {
            const features = map.queryRenderedFeatures(e.point, { layers: ['recommended-spots-layer'] });
            if (features.length > 0) {
                const feature = features[0];
                const coordinates = feature.geometry.coordinates.slice();
                const properties = feature.properties;
                const html = `
                    <div class="popup">
                        <h3>${properties.recommendedPlace}</h3>
                        <p><strong>${properties.nickname}</strong>のおすすめ</p>
                        ${properties.genre ? `<p class="genre-tag" style="background: ${GENRE_STYLES[properties.genre]?.color || '#ccc'}; color: white; padding: 2px 6px; border-radius: 10px; font-size: 11px; display: inline-block; margin: 2px 0;">${properties.genre}</p>` : ''}
                        ${properties.reason ? `<p>${properties.reason}</p>` : ''}
                    </div>
                `;
                recommendedSpotsPopup.remove();
                recommendedSpotsPopup.setLngLat(coordinates).setHTML(html).addTo(map);
                isRecommendedSpotsPopupFixed = true;
            }
        });

        // 一般的なクリック処理
        map.on('click', (e) => {
            const recommendedFeatures = map.queryRenderedFeatures(e.point, { layers: ['recommended-spots-layer'] });
            
            if (recommendedFeatures.length === 0) {
                recommendedSpotsPopup.remove();
                isRecommendedSpotsPopupFixed = false;
            }
        });
        
=======
                    'icon-size': 0.12,
                    'icon-allow-overlap': true
                },
                paint: {
                    'icon-opacity': 1
                }
            });
        }
>>>>>>> a09663c (connect)
        console.log('✅ Recommended spots layer initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize recommended spots layer:', error);
    }
}

// 高島市の外枠を描画する関数
function drawOuterBoundary(geojsonData) {
    boundaryGeoJson = geojsonData;
    if (map.getLayer('takasima-outer-boundary')) {
        map.removeLayer('takasima-outer-boundary');
    }
    if (map.getSource('takasima-outer-boundary')) {
        map.removeSource('takasima-outer-boundary');
    }
    map.addSource('takasima-outer-boundary', {
        type: 'geojson',
        data: boundaryGeoJson
    });
    map.addLayer({
        id: 'takasima-outer-boundary',
        type: 'line',
        source: 'takasima-outer-boundary',
        layout: {},
        paint: {
            'line-color': '#FF0000',
            'line-width': 3
        }
    });
}

// 初回ロード時に必ず境界データを取得
fetchBoundaryData();

// GeoJSONファイルを読み込む関数
async function fetchBoundaryData() {
    try {
        const response = await fetch('./map.geojson');
        if (!response.ok) throw new Error('Failed to fetch GeoJSON data');
        const geojsonData = await response.json();
        boundaryGeoJson = geojsonData;
        window.boundaryGeoJson = geojsonData; // どちらでも参照できるように
        drawOuterBoundary(boundaryGeoJson);
    } catch (error) {
        console.error('Error fetching GeoJSON data:', error);
    }
}

<<<<<<< HEAD
// 古い矢印ボタンのイベントは削除（新しいレイアウトでは不要）

// 情報ポップアップを表示する関数
function showCategoryInfo(category) {
    const infoPopup = document.getElementById('info-popup');
    const infoPopupTitle = document.getElementById('info-popup-title');
    const infoPopupContent = document.getElementById('info-popup-content');
    infoPopupTitle.textContent = `${category}の情報`;
    const categoryMarkers = markers.filter(marker => marker.category === category);
    let contentHTML = '';
    categoryMarkers.forEach(marker => {
        contentHTML += `
            <div class="info-item" onclick="flyToMarker(${marker.coordinates[0]}, ${marker.coordinates[1]})">
                <h4>${marker.properties.name}</h4>
                ${marker.properties.place ? `<p class="place">${marker.properties.place}</p>` : ''}
                ${marker.properties.description ? `<p class="description">${marker.properties.description}</p>` : ''}
            </div>
        `;
    });
    infoPopupContent.innerHTML = contentHTML;
    infoPopup.classList.add('show');
}

// 情報ポップアップを非表示にする関数
function hideInfoPopup() {
    const infoPopup = document.getElementById('info-popup');
    infoPopup.classList.remove('show');
}
=======
// 矢印ボタンのイベントリスナーを削除 - カテゴリーフィルター機能を削除

// 情報ポップアップ機能を削除 - 思い出マップ用に簡素化
>>>>>>> a09663c (connect)

// マーカーに飛ぶ関数
window.flyToMarker = function(lon, lat, markerData = null) {
    map.flyTo({
        center: [lon, lat],
        zoom: 15,
        speed: 1.2
    });
    
    // おすすめスポットの場合はポップアップを表示
    if (markerData && markerData.properties && markerData.properties.recommendedPlace) {
        setTimeout(() => {
            const html = `
                <div class="popup">
                    <h3>${markerData.properties.recommendedPlace}</h3>
                    <p><strong>${markerData.properties.nickname}</strong>のおすすめ</p>
                    ${markerData.properties.reason ? `<p>${markerData.properties.reason}</p>` : ''}
                </div>
            `;
            const popup = new mapboxgl.Popup({ closeButton: true, closeOnClick: false });
            popup.setLngLat([lon, lat]).setHTML(html).addTo(map);
        }, 1500); // 飛行完了後に表示
    }
};

<<<<<<< HEAD
// ポップアップの閉じるボタンのイベントリスナー
document.getElementById('info-popup-close').addEventListener('click', hideInfoPopup);

// 新しい検索機能
function setupSearchFunctionality() {
    const searchInputMain = document.getElementById('search-input-main');
    
    // 検索実行
    const performSearch = () => {
        const keyword = searchInputMain.value.trim().toLowerCase();
        if (!keyword) return;
        
        // おすすめスポットから検索
        const filtered = recommendedSpotsMarkers.filter(marker =>
            (marker.properties.recommendedPlace && marker.properties.recommendedPlace.toLowerCase().includes(keyword)) ||
            (marker.properties.nickname && marker.properties.nickname.toLowerCase().includes(keyword)) ||
            (marker.properties.reason && marker.properties.reason.toLowerCase().includes(keyword)) ||
            (marker.properties.genre && marker.properties.genre.toLowerCase().includes(keyword))
        );
        
        if (filtered.length > 0) {
            // 最初の結果に移動
            const firstResult = filtered[0];
            flyToMarker(firstResult.coordinates[0], firstResult.coordinates[1], firstResult);
        }
    };
    
    // Enterキーで検索
    searchInputMain.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

// モバイル対応のタッチイベントハンドラー
function setupMobileTouchHandlers() {
    // タッチデバイスかどうかを判定
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (isTouchDevice) {
        // タッチ操作時のスクロール防止
        document.addEventListener('touchstart', function(e) {
            if (e.target.closest('#map')) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // ダブルタップでズーム
        let lastTap = 0;
        document.addEventListener('touchend', function(e) {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 500 && tapLength > 0) {
                // ダブルタップ検出
                if (e.target.closest('#map')) {
                    e.preventDefault();
                    // 現在のズームレベルを取得して1段階ズーム
                    const currentZoom = map.getZoom();
                    map.zoomTo(currentZoom + 1, { duration: 300 });
                }
            }
            lastTap = currentTime;
        });
        
        // ピンチズーム時のパフォーマンス最適化
        map.on('touchstart', function() {
            map.getCanvas().style.cursor = 'grabbing';
        });
        
        map.on('touchend', function() {
            map.getCanvas().style.cursor = 'grab';
        });
    }
}

// モバイルでのUI要素のタッチ最適化
function optimizeMobileUI() {
    // フィルターコンテナのタッチ操作最適化
    const filterContainer = document.getElementById('filter-container');
    if (filterContainer) {
        filterContainer.addEventListener('touchstart', function(e) {
            e.stopPropagation();
        });
    }
    
    // 検索ボックスのタッチ操作最適化
    const searchBox = document.getElementById('search-box');
    if (searchBox) {
        searchBox.addEventListener('touchstart', function(e) {
            e.stopPropagation();
        });
    }
    
    // ボタンのタッチフィードバック
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        button.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
        
        button.addEventListener('touchcancel', function() {
            this.style.transform = 'scale(1)';
        });
    });
}
=======
// ポップアップの閉じるボタンのイベントリスナーを削除 - 情報ポップアップ機能を削除

// ベースマップ切り替え機能を削除 - 航空写真オンリー

// みんなのおすすめスポットのトグル機能を削除 - 思い出マップ用に簡素化

// カテゴリーフィルター機能を削除 - 思い出マップ用に簡素化

// 検索UIの表示・非表示
const searchToggle = document.getElementById('search-toggle');
const searchBox = document.getElementById('search-box');
const searchIconBtn = document.getElementById('search-icon-btn');
const searchCloseBtn = document.getElementById('search-close-btn');
const searchInput = document.getElementById('search-input');
// ラジオボタンに変更
const searchCategories = document.querySelectorAll('input[name="category"]');
const searchResults = document.getElementById('search-results');

// 検索ボックスを開く
searchIconBtn.addEventListener('click', () => {
    searchBox.classList.remove('hidden');
    document.body.classList.add('search-open'); // スマホ対応のクラス追加
    searchInput.focus();
    // 検索ボックスを開いたら最初からすべての思い出を表示
    document.getElementById('category-all').checked = true; // すべてを選択
    searchInput.value = ''; // キーワードをクリア
    doSearch(); // 検索実行してすべて表示
});
// 閉じる
searchCloseBtn.addEventListener('click', () => {
    searchBox.classList.add('hidden');
    document.body.classList.remove('search-open'); // スマホ対応のクラス削除
    searchInput.value = '';
    searchResults.innerHTML = '';
});

// カテゴリマッチング関数
function isCategoryMatch(text, categories) {
    const categoryKeywords = {
        'ROMANCE': ['恋人', 'キス', '手をつなぐ', 'デート', '愛', 'ロマンス', 'カップル', '二人', '一緒', '想い出'],
        'NOSTALGIA': ['子供', '昔', '懐かしい', '幼い', '家族', '学校', '遊び場', '思い出', '懐かし', '古い'],
        'FUN': ['笑', '楽しい', '面白', '冒険', '夏祭り', 'イベント', '祭り', '盛り上が', 'ワクワク', '興奮'],
        'DISCOVERY': ['初めて', '発見', '感動', '驚き', '新しい', '知らなかった', '初体験', '目から鱗', '気づき'],
        'ADVENTURE': ['迷子', '道に迷', 'チャレンジ', '挑戦', '困難', '道なき道', '冒険', '未知', '探検', '踏み出']
    };
    
    for (const category of categories) {
        const keywords = categoryKeywords[category] || [];
        for (const keyword of keywords) {
            if (text.includes(keyword)) {
                return true;
            }
        }
    }
    return false;
}

// 検索処理
function doSearch() {
    const keyword = searchInput.value.trim().toLowerCase();
    const selectedCategory = document.querySelector('input[name="category"]:checked');
    const categoryValue = selectedCategory ? selectedCategory.value : '';

    console.log('検索実行:', { keyword, categoryValue, selectedCategory });

    let filtered = recommendedSpotsMarkers;

    // カテゴリで絞り込み（空文字はすべて）
    if (categoryValue) {
        console.log('カテゴリフィルタ適用:', categoryValue);
        filtered = filtered.filter(m => {
            const reason = m.properties.reason || '';
            const place = m.properties.recommendedPlace || '';
            const text = (reason + ' ' + place).toLowerCase();
            
            if (categoryValue === 'その他') {
                // その他: どのカテゴリにも該当しないもの
                return !isCategoryMatch(text, ['ROMANCE', 'NOSTALGIA', 'FUN', 'DISCOVERY', 'ADVENTURE']);
            } else {
                // 指定されたカテゴリと一致
                return isCategoryMatch(text, [categoryValue]);
            }
        });
        console.log('フィルタ後件数:', filtered.length);
    }

    // キーワードで絞り込み
        if (keyword) {
            filtered = filtered.filter(m =>
                (m.properties.recommendedPlace && m.properties.recommendedPlace.toLowerCase().includes(keyword)) ||
                (m.properties.nickname && m.properties.nickname.toLowerCase().includes(keyword)) ||
                (m.properties.reason && m.properties.reason.toLowerCase().includes(keyword))
            );
        }

        // 結果表示
        searchResults.innerHTML = '';
        if (filtered.length === 0) {
            searchResults.innerHTML = '<div style="color:#888;padding:8px;">該当なし</div>';
            return;
        }
        filtered.forEach(marker => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.innerHTML = `<strong>${marker.properties.recommendedPlace}</strong><br><span style="font-size:12px;color:#666;">${marker.properties.nickname}${marker.properties.reason ? ' / ' + marker.properties.reason : ''}</span>`;
            div.onclick = () => {
                flyToMarker(marker.coordinates[0], marker.coordinates[1], marker);
            searchBox.classList.add('hidden');
        };
        searchResults.appendChild(div);
    });
}

// 「みんなのおすすめ一覧」ボタンのイベント
// recommendedListBtn.onclick = () => {
//     // 一覧表示
//     searchCategory.value = '__recommended__';
//     searchInput.value = '';
//     doSearch();
//     searchBox.classList.remove('hidden');
// };

// 入力イベント
searchInput.addEventListener('input', doSearch);

// インフォメーションボタンの動作
document.addEventListener('DOMContentLoaded', () => {
    const infoButton = document.getElementById('info-button');
    const infoPopup = document.getElementById('info-popup');
    const infoCloseBtn = document.getElementById('info-popup-close');
    
    if (infoButton && infoPopup && infoCloseBtn) {
        infoButton.addEventListener('click', () => {
            infoPopup.classList.toggle('hidden');
        });
        
        infoCloseBtn.addEventListener('click', () => {
            infoPopup.classList.add('hidden');
        });
        
        // ポップアップ外をクリックで閉じる
        infoPopup.addEventListener('click', (e) => {
            if (e.target === infoPopup) {
                infoPopup.classList.add('hidden');
            }
        });
    }
    
    // 検索ボックス外をクリックで閉じる（スマホ対応）
    document.addEventListener('click', (e) => {
        if (!searchBox.classList.contains('hidden') && 
            !searchBox.contains(e.target) && 
            !searchIconBtn.contains(e.target)) {
            searchBox.classList.add('hidden');
            document.body.classList.remove('search-open');
            searchInput.value = '';
            searchResults.innerHTML = '';
        }
    });
});
>>>>>>> a09663c (connect)

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Starting initialization');
    
<<<<<<< HEAD
    // モバイル対応の初期化
    setupMobileTouchHandlers();
    optimizeMobileUI();
    
    // 検索機能の初期化
    setupSearchFunctionality();
=======
    // ラジオボタンの変更イベントを設定
    const searchCategories = document.querySelectorAll('input[name="category"]');
    console.log('ラジオボタン数:', searchCategories.length);
    
    searchCategories.forEach(radio => {
        radio.addEventListener('change', (e) => {
            console.log('ラジオボタン変更:', e.target.value);
            doSearch();
        });
    });
>>>>>>> a09663c (connect)
    
    // 初期化を順次実行
    init().then(() => {
        console.log('Main init completed');
        // メインの初期化が完了してから、おすすめスポットを初期化
        return initRecommendedSpots();
    }).then(() => {
        console.log('Recommended spots init completed');
<<<<<<< HEAD
=======
        // トグルスイッチ機能を削除 - 思い出マップ用に簡素化
>>>>>>> a09663c (connect)
        // 両方の初期化が完了してから高島市に移動
        setTimeout(highlightTakasima, 2000);
    }).catch(error => {
        console.error('Initialization error:', error);
        // エラーが発生しても高島市への移動を実行
        setTimeout(highlightTakasima, 2000);
    });
});
