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
    // ボーダーラインのGeoJSONが未ロードならfetch
    if (!boundaryLoaded) {
        fetchBoundaryData();
        boundaryLoaded = true;
    } else if (window.boundaryGeoJson) {
        drawOuterBoundary(window.boundaryGeoJson);
    }
});

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
let data = {};
let markers = [];
let categories = new Set();
let boundaryGeoJson = null;
let lastMarkersGeoJson = null;

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

const CATEGORY_STYLES = {
    '山': { color: '#3357FF', size: 8 },
    'キャンプ場': { color: '#33FF57', size: 8 },
    '観光地名': { color: 'black', size: 8 },
    'イベント': { color: '#FFD700', size: 8 },
    '神社': { color: '#8A2BE2', size: 8 },
    '宿泊施設': { color: '#FF69B4', size: 8 },
    '飲食店': { color: '#FF4500', size: 8 }
};

async function init() {
    const points = await fetchData(sheetNames[0]);
    if (!points) return;

    markers = [];
    categories.clear();

    points.forEach(point => {
        const [id, category, subcategory, name, place, latitude, longitude, description, link] = point;
        let lat, lon;
        try {
            lat = parseFloat(latitude?.replace(/,/g, '.'));
            lon = parseFloat(longitude?.replace(/,/g, '.'));
        } catch (e) {
            return;
        }
        if (isNaN(lat) || isNaN(lon) || lat === 0 || lon === 0) return;
        categories.add(category);
        markers.push({
            id,
            category,
            coordinates: [lon, lat],
            properties: { name, place, description, link }
        });
    });

    lastMarkersGeoJson = {
        type: 'FeatureCollection',
        features: markers.map(marker => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: marker.coordinates },
            properties: { ...marker.properties, category: marker.category }
        }))
    };

    map.on('load', () => {
        if (!map.getSource('markers')) {
            map.addSource('markers', { type: 'geojson', data: lastMarkersGeoJson });
        } else {
            map.getSource('markers').setData(lastMarkersGeoJson);
        }
        if (!map.getLayer('marker-layer')) {
            map.addLayer({
                id: 'marker-layer',
                type: 'circle',
                source: 'markers',
                paint: {
                    'circle-radius': [
                        'match',
                        ['get', 'category'],
                        ...Object.entries(CATEGORY_STYLES).flatMap(([cat, style]) => [cat, style.size]),
                        6
                    ],
                    'circle-color': [
                        'match',
                        ['get', 'category'],
                        ...Object.entries(CATEGORY_STYLES).flatMap(([cat, style]) => [cat, style.color]),
                        '#CCCCCC'
                    ],
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#FFFFFF'
                }
            });
        }

        const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });
        let isPopupFixed = false;

        map.on('mouseenter', 'marker-layer', (e) => {
            map.getCanvas().style.cursor = 'pointer';
            if (!isPopupFixed) {
                const features = map.queryRenderedFeatures(e.point, { layers: ['marker-layer'] });
                if (features.length > 0) {
                    const feature = features[0];
                    const coordinates = feature.geometry.coordinates.slice();
                    const properties = feature.properties;
                    const html = `
                        <div class="popup">
                            <h3>${properties.name}</h3>
                            <p>${properties.place || ''}</p>
                            ${properties.description ? `<p>${properties.description}</p>` : ''}
                            ${properties.link ? `<p><a href="${properties.link}" target="_blank">詳細を見る</a></p>` : ''}
                        </div>
                    `;
                    popup.setLngLat(coordinates).setHTML(html).addTo(map);
                }
            }
        });

        map.on('mouseleave', 'marker-layer', () => {
            map.getCanvas().style.cursor = '';
            if (!isPopupFixed) popup.remove();
        });

        map.on('click', 'marker-layer', (e) => {
            const features = map.queryRenderedFeatures(e.point, { layers: ['marker-layer'] });
            if (features.length > 0) {
                const feature = features[0];
                const coordinates = feature.geometry.coordinates.slice();
                const properties = feature.properties;
                const html = `
                    <div class="popup">
                        <h3>${properties.name}</h3>
                        <p>${properties.place || ''}</p>
                        ${properties.description ? `<p>${properties.description}</p>` : ''}
                        ${properties.link ? `<p><a href="${properties.link}" target="_blank">詳細を見る</a></p>` : ''}
                    </div>
                `;
                popup.remove();
                popup.setLngLat(coordinates).setHTML(html).addTo(map);
                isPopupFixed = true;
            }
        });

        map.on('click', (e) => {
            const features = map.queryRenderedFeatures(e.point, { layers: ['marker-layer'] });
            if (features.length === 0) {
                popup.remove();
                isPopupFixed = false;
            }
        });

        const filterContainer = document.getElementById('filter-container');
        filterContainer.innerHTML = '';
        Array.from(categories).forEach(category => {
            const style = CATEGORY_STYLES[category] || { color: '#CCCCCC', size: 6 };
            const categoryRow = document.createElement('div');
            categoryRow.className = 'category-row';
            const categoryLabel = document.createElement('label');
            categoryLabel.innerHTML = `
                <input type="checkbox" class="category-filter" data-category="${category}" checked>
                <span class="category-color" style="background-color: ${style.color}"></span>
                ${category}
            `;
            const toggleButton = document.createElement('button');
            toggleButton.className = 'toggle-button';
            toggleButton.innerHTML = '🔍';
            toggleButton.title = 'これだけ表示';
            let isSoloMode = false;
            toggleButton.onclick = (e) => {
                e.preventDefault();
                const checkboxes = document.querySelectorAll('.category-filter');
                const currentCategory = category;
                if (!isSoloMode) {
                    checkboxes.forEach(checkbox => {
                        checkbox.checked = (checkbox.dataset.category === currentCategory);
                    });
                    toggleButton.title = '全表示';
                    isSoloMode = true;
                    showCategoryInfo(currentCategory);
                } else {
                    checkboxes.forEach(checkbox => { checkbox.checked = true; });
                    toggleButton.title = 'これだけ表示';
                    isSoloMode = false;
                    hideInfoPopup();
                }
                updateMarkers();
            };
            categoryRow.appendChild(categoryLabel);
            categoryRow.appendChild(toggleButton);
            filterContainer.appendChild(categoryRow);
        });

        function updateMarkers() {
            const activeCategories = Array.from(document.querySelectorAll('.category-filter:checked')).map(
                checkbox => checkbox.dataset.category
            );
            const filteredFeatures = markers
                .filter(({ category }) => activeCategories.includes(category))
                .map(marker => ({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: marker.coordinates },
                    properties: { ...marker.properties, category: marker.category }
                }));
            const source = map.getSource('markers');
            if (source) {
                source.setData({
                    type: 'FeatureCollection',
                    features: filteredFeatures
                });
            }
        }

        document.querySelectorAll('.category-filter').forEach(checkbox => {
            checkbox.addEventListener('change', updateMarkers);
        });
        updateMarkers();
    });
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

// GeoJSONファイルを読み込む関数
async function fetchBoundaryData() {
    try {
        const response = await fetch('./map.geojson');
        if (!response.ok) throw new Error('Failed to fetch GeoJSON data');
        const geojsonData = await response.json();
        window.boundaryGeoJson = geojsonData;
        drawOuterBoundary(window.boundaryGeoJson);
    } catch (error) {
        console.error('Error fetching GeoJSON data:', error);
    }
}

// 矢印ボタンのクリックイベント
document.getElementById('toggle-arrow').addEventListener('click', () => {
    const filterContainer = document.getElementById('filter-container');
    const toggleArrow = document.getElementById('toggle-arrow');
    filterContainer.classList.toggle('hidden');
    toggleArrow.classList.toggle('collapsed');
    if (filterContainer.classList.contains('hidden')) {
        toggleArrow.style.left = '20px';
    } else {
        toggleArrow.style.left = '220px';
    }
});

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
window.flyToMarker = function(lon, lat) {
    map.flyTo({
        center: [lon, lat],
        zoom: 15,
        speed: 1.2
    });
};

// ポップアップの閉じるボタンのイベントリスナー
document.getElementById('info-popup-close').addEventListener('click', hideInfoPopup);

const basemapToggle = document.getElementById('basemap-toggle');
const basemapLabel = document.getElementById('basemap-label');
basemapToggle.addEventListener('change', () => {
    if (basemapToggle.checked) {
        map.setStyle(SATELLITE_STYLE);
        basemapLabel.textContent = 'サテライト';
    } else {
        map.setStyle(STREETS_STYLE);
        basemapLabel.textContent = '標準地図';
    }
});

map.on('style.load', () => {
    map.setFog({});
    if (boundaryGeoJson) {
        drawOuterBoundary(boundaryGeoJson);
    }
    if (lastMarkersGeoJson) {
        if (!map.getSource('markers')) {
            map.addSource('markers', {
                type: 'geojson',
                data: lastMarkersGeoJson
            });
        } else {
            map.getSource('markers').setData(lastMarkersGeoJson);
        }
        if (!map.getLayer('marker-layer')) {
            map.addLayer({
                id: 'marker-layer',
                type: 'circle',
                source: 'markers',
                paint: {
                    'circle-radius': [
                        'match',
                        ['get', 'category'],
                        ...Object.entries(CATEGORY_STYLES).flatMap(([cat, style]) => [cat, style.size]),
                        6
                    ],
                    'circle-color': [
                        'match',
                        ['get', 'category'],
                        ...Object.entries(CATEGORY_STYLES).flatMap(([cat, style]) => [cat, style.color]),
                        '#CCCCCC'
                    ],
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#FFFFFF'
                }
            });
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    init();
    setTimeout(highlightTakasima, 2000);
});
