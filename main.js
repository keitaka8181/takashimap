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
                        'icon-size': 0.1, // 小さめに
                        'icon-allow-overlap': true
                    },
                    paint: {
                        'icon-opacity': 0
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
    // 思い出要素（みんなのおすすめスポット）用のアイコンのみ読み込み
    const iconFiles = [
        { name: 'mayor-icon', url: '市長.png' },
        { name: 'male-icon', url: '男性.png' },
        { name: 'female-icon', url: '女性.png' },
        { name: 'girl-icon', url: '女性.png' },
        { name: 'boy-icon', url: '男性.png' },
        { name: 'grandfather-icon', url: 'おじいちゃん.png' },
        { name: 'grandmother-icon', url: 'おばあちゃん.png' }
    ];
    
    let loaded = 0;
    let failed = 0;
    
    iconFiles.forEach(icon => {
        // 画像読み込みのタイムアウトを設定
        const timeoutId = setTimeout(() => {
            console.warn(`⏰ 画像読み込みタイムアウト: ${icon.url}`);
            failed++;
            loaded++;
            checkAllLoaded();
        }, 5000); // 5秒でタイムアウト
        
        map.loadImage(icon.url, (error, image) => {
            clearTimeout(timeoutId);
            
            if (error) {
                console.error(`❌ 画像の読み込み失敗: ${icon.url}`, error);
                failed++;
            } else {
                if (!map.hasImage(icon.name)) {
                    try {
                        map.addImage(icon.name, image);
                        console.log(`✅ 画像登録: ${icon.name} (${icon.url})`);
                    } catch (e) {
                        console.error(`❌ addImage失敗: ${icon.name}`, e);
                        failed++;
                    }
                } else {
                    console.log(`ℹ️ 既に登録済み: ${icon.name}`);
                }
            }
            loaded++;
            checkAllLoaded();
        });
    });
    
    function checkAllLoaded() {
        // すべての画像の読み込みが完了したら
        if (loaded === iconFiles.length) {
            console.log(`📊 画像読み込み完了: 成功 ${loaded - failed}件, 失敗 ${failed}件`);
            
            // みんなのおすすめスポットのソースとレイヤーを追加
            try {
                if (!map.getSource('recommended-spots')) {
                    map.addSource('recommended-spots', { 
                        type: 'geojson', 
                        data: lastRecommendedSpotsGeoJson || { type: 'FeatureCollection', features: [] } 
                    });
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
                                'mayor-icon', 0.08,
                                'male-icon', 0.08,
                                'female-icon', 0.08,
                                'grandfather-icon', 0.08,
                                'grandmother-icon', 0.08,
                                0.1
                            ],
                            'icon-allow-overlap': true
                        },
                        paint: {
                            'icon-opacity': 1
                        }
                    });
                    console.log('✅ recommended-spots-layer追加');
                    
                    // ポップアップ機能を追加
                    setupRecommendedSpotsPopup();
                } else {
                    console.log('ℹ️ recommended-spots-layerは既に存在');
                }
            } catch (e) {
                console.error('❌ recommended-spots-layer追加失敗', e);
            }
        }
    }
}

// 思い出要素のポップアップ機能を設定
function setupRecommendedSpotsPopup() {
    // ポップアップインスタンスを作成
    const popup = new mapboxgl.Popup({ 
        closeButton: true, 
        closeOnClick: false,
        maxWidth: '300px'
    });
    
    // マウスオーバー時の処理
    map.on('mouseenter', 'recommended-spots-layer', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        
        const features = map.queryRenderedFeatures(e.point, { layers: ['recommended-spots-layer'] });
        if (features.length > 0) {
            const feature = features[0];
            const properties = feature.properties;
            const coordinates = feature.geometry.coordinates.slice();
            
            // ポップアップの内容を作成
            const html = `
                <div style="padding: 10px; font-family: Arial, sans-serif;">
                    <h3 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">
                        ${properties.recommendedPlace}
                    </h3>
                    <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">
                        <strong>${properties.nickname}</strong>の思い出
                    </p>
                    ${properties.reason ? `
                        <p style="margin: 0; color: #555; font-size: 13px; line-height: 1.4;">
                            ${properties.reason}
                        </p>
                    ` : ''}
                </div>
            `;
            
            popup.setLngLat(coordinates).setHTML(html).addTo(map);
        }
    });
    
    // マウスアウト時の処理
    map.on('mouseleave', 'recommended-spots-layer', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
    });
    
    // クリック時の処理
    map.on('click', 'recommended-spots-layer', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['recommended-spots-layer'] });
        if (features.length > 0) {
            const feature = features[0];
            const properties = feature.properties;
            const coordinates = feature.geometry.coordinates.slice();
            
            // 詳細ポップアップの内容を作成
            const html = `
                <div style="padding: 15px; font-family: Arial, sans-serif; max-width: 300px;">
                    <h2 style="margin: 0 0 10px 0; color: #333; font-size: 18px; border-bottom: 2px solid #007bff; padding-bottom: 5px;">
                        ${properties.recommendedPlace}
                    </h2>
                    <div style="margin: 10px 0; padding: 8px; background: #f8f9fa; border-radius: 5px;">
                        <p style="margin: 0 0 5px 0; color: #666; font-size: 14px;">
                            <strong>投稿者:</strong> ${properties.nickname}
                        </p>
                        <p style="margin: 0; color: #666; font-size: 14px;">
                            <strong>投稿日:</strong> ${new Date().toLocaleDateString('ja-JP')}
                        </p>
                    </div>
                    ${properties.reason ? `
                        <div style="margin: 10px 0; padding: 10px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 3px;">
                            <h4 style="margin: 0 0 5px 0; color: #856404; font-size: 14px;">思い出の内容</h4>
                            <p style="margin: 0; color: #856404; font-size: 13px; line-height: 1.5;">
                                ${properties.reason}
                            </p>
                        </div>
                    ` : ''}
                    <div style="margin-top: 10px; text-align: center;">
                        <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                                style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                            閉じる
                        </button>
                    </div>
                </div>
            `;
            
            // 既存のポップアップを削除してから新しいものを表示
            popup.remove();
            popup.setLngLat(coordinates).setHTML(html).addTo(map);
        }
    });
    
    // 地図の他の部分をクリックしたときにポップアップを閉じる
    map.on('click', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['recommended-spots-layer'] });
        if (features.length === 0) {
            popup.remove();
        }
    });
    
    console.log('✅ 思い出要素のポップアップ機能を設定しました');
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
let markers = [];
let recommendedSpotsMarkers = [];
let categories = new Set();
let boundaryGeoJson = null;
let lastMarkersGeoJson = null;
let lastRecommendedSpotsGeoJson = null;
let recommendedSpotsVisible = false; // おすすめスポットの表示状態を管理

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

const CATEGORY_STYLES = {
    '山': { color: '#3357FF', size: 8, icon: 'mountain.png' },
    'キャンプ場': { color: '#33FF57', size: 8, icon: 'camp.png' },
    '観光地名': { color: 'black', size: 8, icon: 'kankochi.png' },
    'イベント': { color: '#FFD700', size: 8, icon: 'event.png' },
    '神社': { color: '#8A2BE2', size: 8, icon: 'shrine.png' },
    '宿泊施設': { color: '#FF69B4', size: 8, icon: 'hotel.png' },
    '飲食店': { color: '#FF4500', size: 8, icon: 'food.png' }
};

// 古いアイコン読み込み関数は削除（思い出要素のみのため不要）

async function init() {
    // 観光要素は削除し、思い出要素（みんなのおすすめスポット）のみを使用
    console.log('思い出要素のみを表示するモードに変更');
}

// みんなのおすすめスポットの初期化
async function initRecommendedSpots() {
    let points = await fetchRecommendedSpotsData();
    
    // データが取得できない場合はテスト用のダミーデータを使用
    if (!points || points.length === 0) {
        console.log('Using dummy data for testing - API access failed or no data available');
        points = [
            ['2025-01-01', 'けんた', '高島市市役所', '７月２３日麗澤大学と高島市の協定調印式！', '35.353044, 136.035733', '市長'],
            ['2025-01-01', 'テストユーザー', '琵琶湖', '美しい湖の景色', '35.377868, 135.946352', '男性'],
            ['2025-01-01', '地元の方', 'マキノサニービーチ', '夏の海水浴場として人気', '35.416667, 136.016667', '女性'],
            ['2025-01-01', '観光客', '高島市観光案内所', '観光情報が充実', '35.353044, 136.035733', 'おじいちゃん']
        ];
    }

    recommendedSpotsMarkers = [];

    points.forEach((point, index) => {
        // ヘッダー行をスキップ
        if (index === 0) return;
        
        const [timestamp, nickname, recommendedPlace, reason, coordinates, icon] = point;
        
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
                icon: iconName
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

        // ソースとレイヤーを追加（初期状態では非表示）
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
                    'icon-size': 0.1,
                    'icon-allow-overlap': true
                },
                paint: {
                    'icon-opacity': 1
                }
            });
        }
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

// 矢印ボタンは削除されたため、この処理は不要

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

// ポップアップの閉じるボタンのイベントリスナー（要素が存在する場合のみ）
const infoPopupClose = document.getElementById('info-popup-close');
if (infoPopupClose) {
    infoPopupClose.addEventListener('click', hideInfoPopup);
}

// 地図は常に航空写真（衛星画像）を使用

// みんなのおすすめスポットを常に表示
function setupRecommendedSpotsToggle() {
    console.log('思い出要素（みんなのおすすめスポット）を常に表示');
    // トグル機能は削除し、常に表示
}

// マーカーの表示を更新する関数（思い出要素のみのため簡素化）
function updateMarkers() {
    // 思い出要素のみ表示するため、この関数は不要
    console.log('思い出要素のみ表示中');
}

// 検索UIの表示・非表示（要素が存在する場合のみ）
const searchToggle = document.getElementById('search-toggle');
const searchBox = document.getElementById('search-box');
const searchIconBtn = document.getElementById('search-icon-btn');
const searchCloseBtn = document.getElementById('search-close-btn');
const searchInput = document.getElementById('search-input');
const searchCategory = document.getElementById('search-category');
const searchResults = document.getElementById('search-results');

// 検索ボックスを開く
if (searchIconBtn && searchBox && searchInput) {
    searchIconBtn.addEventListener('click', () => {
        searchBox.classList.remove('hidden');
        searchInput.focus();
    });
}

// 閉じる
if (searchCloseBtn && searchBox && searchInput && searchResults) {
    searchCloseBtn.addEventListener('click', () => {
        searchBox.classList.add('hidden');
        searchInput.value = '';
        searchResults.innerHTML = '';
    });
}

// 検索カテゴリーリストを思い出要素のみに限定
function updateSearchCategoryOptions() {
    if (!searchCategory) return;
    
    searchCategory.innerHTML = '<option value="">すべての思い出</option>';
    // 思い出のカテゴリーを追加
    const memoryCategories = [
        { value: '市長', text: '市長の思い出' },
        { value: '男性', text: '男性の思い出' },
        { value: '女性', text: '女性の思い出' },
        { value: 'おじいちゃん', text: 'おじいちゃんの思い出' },
        { value: 'おばあちゃん', text: 'おばあちゃんの思い出' }
    ];
    
    memoryCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.value;
        option.textContent = cat.text;
        searchCategory.appendChild(option);
    });
}

// 検索処理（思い出要素のみ）
function doSearch() {
    if (!searchInput || !searchCategory || !searchResults || !searchBox) return;
    
    const keyword = searchInput.value.trim().toLowerCase();
    const cat = searchCategory.value;
    let filtered = [];
    
    // 思い出要素（みんなのおすすめスポット）のみを検索
    filtered = recommendedSpotsMarkers;
    
    // カテゴリーでフィルタリング
    if (cat) {
        filtered = filtered.filter(m => {
            const icon = m.properties.icon;
            switch (cat) {
                case '市長': return icon === 'mayor-icon';
                case '男性': return icon === 'male-icon';
                case '女性': return icon === 'female-icon';
                case 'おじいちゃん': return icon === 'grandfather-icon';
                case 'おばあちゃん': return icon === 'grandmother-icon';
                default: return true;
            }
        });
    }
    
    // キーワードでフィルタリング
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
        searchResults.innerHTML = '<div style="color:#888;padding:8px;">該当する思い出がありません</div>';
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

// 入力イベント（要素が存在する場合のみ）
if (searchInput) {
    searchInput.addEventListener('input', doSearch);
}
if (searchCategory) {
    searchCategory.addEventListener('change', doSearch);
}

// カテゴリーリスト初期化・更新
// markers/categoriesが初期化された後(initの最後)で呼ぶ
const _origInit = init;
init = async function() {
    await _origInit.apply(this, arguments);
    updateSearchCategoryOptions();
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Starting initialization');
    
    // 思い出要素のみの初期化
    init().then(() => {
        console.log('Main init completed');
        // 思い出要素（みんなのおすすめスポット）を初期化
        return initRecommendedSpots();
    }).then(() => {
        console.log('Recommended spots init completed');
        // トグルスイッチの設定（常に表示）
        setupRecommendedSpotsToggle();
        // 高島市にズームして思い出を表示
        setTimeout(highlightTakasima, 1000);
    }).catch(error => {
        console.error('Initialization error:', error);
        // エラーが発生しても高島市への移動を実行
        setupRecommendedSpotsToggle();
        setTimeout(highlightTakasima, 1000);
    });
});
