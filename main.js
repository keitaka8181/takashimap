// main.js - cleaned version

mapboxgl.accessToken = 'pk.eyJ1IjoiZ2dwbGF5ZXIiLCJhIjoiY200OXBzcmI1MGR6bzJxcTFrdDJ1MGJyNSJ9.o_VpEScSsAPdt8U8PDB58Q';

const SATELLITE_STYLE = 'mapbox://styles/mapbox/satellite-streets-v12';
const STREETS_STYLE = 'mapbox://styles/mapbox/streets-v11';

window.map = new mapboxgl.Map({
    container: 'map',
    style: SATELLITE_STYLE,
    projection: 'globe',
    zoom: 4,
    center: [138, 36]
});

map.addControl(new mapboxgl.NavigationControl());

let boundaryGeoJson = null;
let lastRecommendedSpotsGeoJson = null;
let recommendedSpotsMarkers = [];

// --- アイコン読み込み ---
function loadIcons() {
    const iconFiles = [
        { name: 'mayor-icon', url: '市長.png' },
        { name: 'male-icon', url: '男性.png' },
        { name: 'female-icon', url: '女性.png' },
        { name: 'girl-icon', url: '女性.png' },
        { name: 'boy-icon', url: '男性.png' },
        { name: 'grandfather-icon', url: 'おじいちゃん.png' },
        { name: 'grandmother-icon', url: 'おばあちゃん.png' }
    ];

    iconFiles.forEach(icon => {
        map.loadImage(icon.url, (err, img) => {
            if (!err && !map.hasImage(icon.name)) map.addImage(icon.name, img);
        });
    });
}

// --- GeoJSON境界描画 ---
function drawOuterBoundary(geojsonData) {
    boundaryGeoJson = geojsonData;
    if (map.getLayer('takasima-outer-boundary')) map.removeLayer('takasima-outer-boundary');
    if (map.getSource('takasima-outer-boundary')) map.removeSource('takasima-outer-boundary');

    map.addSource('takasima-outer-boundary', { type: 'geojson', data: boundaryGeoJson });
    map.addLayer({
        id: 'takasima-outer-boundary',
        type: 'line',
        source: 'takasima-outer-boundary',
        paint: { 'line-color': '#FF0000', 'line-width': 3 }
    });
}

async function fetchBoundaryData() {
    try {
        const resp = await fetch('./map.geojson');
        if (!resp.ok) throw new Error('Failed to fetch GeoJSON data');
        const geojsonData = await resp.json();
        drawOuterBoundary(geojsonData);
    } catch (error) {
        console.error('Error fetching GeoJSON data:', error);
    }
}

// --- Recommended spots ---
async function fetchRecommendedSpotsData() {
    const spreadsheetId = '1kshDopEBMw-7chK-TyV8_vp9Qhwe25ScoZ-BYmIJnL8';
    const sheetName = 'おすすめスポット';
    const apiKey = 'AIzaSyAj_tQf-bp0v3j6Pl8S7HQVO5I-D5WI0GQ';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}?key=${apiKey}`;

    try {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        if (!data.values || data.values.length === 0) return [];
        return data.values;
    } catch (error) {
        console.error('Error fetching recommended spots:', error);
        return [];
    }
}

// --- Hiragana icon generator ---
function createHiraganaIcon(character) {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.font = `bold ${Math.floor(size * 0.7)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(character, size / 2, size / 2);
    return ctx.getImageData(0, 0, size, size);
}

// --- Recommended spots init ---
async function initRecommendedSpots() {
    let points = await fetchRecommendedSpotsData();
    if (!points || points.length === 0) {
        points = [
            ['2025-01-01', 'けんた', '高島市市役所', '７月２３日麗澤大学と高島市の協定調印式！', '35.353044, 136.035733', '市長']
        ];
    }

    recommendedSpotsMarkers = [];

    points.forEach((row, index) => {
        if (index === 0) return; // skip header
        const [timestamp, nickname, place, reason, coordStr, iconVal] = row;
        if (!coordStr || !place) return;

        const [latStr, lonStr] = coordStr.split(',').map(s => s.trim());
        const lat = parseFloat(latStr), lon = parseFloat(lonStr);
        if (isNaN(lat) || isNaN(lon)) return;

        let iconName = 'mayor-icon';
        switch (iconVal) {
            case '市長': iconName = 'mayor-icon'; break;
            case '男性': iconName = 'male-icon'; break;
            case '女性': iconName = 'female-icon'; break;
            case '女子': iconName = 'girl-icon'; break;
            case '男子': iconName = 'boy-icon'; break;
            case 'おじいちゃん': iconName = 'grandfather-icon'; break;
            case 'おばあちゃん': iconName = 'grandmother-icon'; break;
            default:
                if (/^[\u3040-\u309F]$/.test(iconVal)) {
                    iconName = `hiragana-${iconVal}`;
                    if (!map.hasImage(iconName)) map.addImage(iconName, createHiraganaIcon(iconVal));
                }
        }

        recommendedSpotsMarkers.push({
            coordinates: [lon, lat],
            properties: { nickname, recommendedPlace: place, reason, icon: iconName }
        });
    });

    lastRecommendedSpotsGeoJson = {
        type: 'FeatureCollection',
        features: recommendedSpotsMarkers.map(m => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: m.coordinates },
            properties: m.properties
        }))
    };

    if (!map.getSource('recommended-spots')) {
        map.addSource('recommended-spots', { type: 'geojson', data: lastRecommendedSpotsGeoJson });
    } else {
        map.getSource('recommended-spots').setData(lastRecommendedSpotsGeoJson);
    }

    if (!map.getLayer('recommended-spots-layer')) {
        map.addLayer({
            id: 'recommended-spots-layer',
            type: 'symbol',
            source: 'recommended-spots',
            layout: { 'icon-image': ['get', 'icon'], 'icon-size': 0.12, 'icon-allow-overlap': true },
            paint: { 'icon-opacity': 1 }
        });
    }
}

// --- 初期化 ---
document.addEventListener('DOMContentLoaded', async () => {
    loadIcons();
    await fetchBoundaryData();
    await initRecommendedSpots();
});
