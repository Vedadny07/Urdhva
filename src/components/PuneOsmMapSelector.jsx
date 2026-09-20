import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Globe,
  Layers,
  Sparkles,
  Building2,
  Check,
  RefreshCw,
  Maximize2,
  Navigation,
  Compass,
  Send,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Info,
  Search,
  X,
  Loader2
} from 'lucide-react';
import useStore from '../store';
import { useTranslation } from '../utils/i18n';

// ─── PUNE CADASTRAL ZONES & BOOKMARKS ────────────────────────────────────────
const PUNE_ZONES = [
  {
    id: 'shivajinagar',
    name: 'Shivajinagar / FC Road',
    desc: 'Commercial & Institutional Ward',
    lat: 18.5314,
    lng: 73.8446,
    defaultSize: 220,
  },
  {
    id: 'kothrud',
    name: 'Kothrud / Paud Road',
    desc: 'High-Density Residential Sector',
    lat: 18.5074,
    lng: 73.8077,
    defaultSize: 240,
  },
  {
    id: 'vimannagar',
    name: 'Viman Nagar / Phoenix',
    desc: 'Mixed Commercial & High-Rise IT Hub',
    lat: 18.5679,
    lng: 73.9143,
    defaultSize: 260,
  },
  {
    id: 'hinjewadi',
    name: 'Hinjewadi IT Park (Phase 1)',
    desc: 'Special Economic Zone & Tech Campuses',
    lat: 18.5913,
    lng: 73.7389,
    defaultSize: 300,
  },
  {
    id: 'baner',
    name: 'Baner / Balewadi High St',
    desc: 'Modern Commercial & Retail Towers',
    lat: 18.5590,
    lng: 73.7868,
    defaultSize: 250,
  },
  {
    id: 'punestation',
    name: 'Pune Station / Camp',
    desc: 'Heritage Transit & Central Business District',
    lat: 18.5284,
    lng: 73.8744,
    defaultSize: 240,
  },
  {
    id: 'swargate',
    name: 'Swargate / Sarasbaug',
    desc: 'Southern Transit Cadastral Cluster',
    lat: 18.5018,
    lng: 73.8587,
    defaultSize: 220,
  }
];

// Zone descriptions are translated at render time via this id → key map
// (zone display names like "Shivajinagar / FC Road" stay as proper nouns).
const ZONE_DESC_KEYS = {
  shivajinagar: 'shivajinagar',
  kothrud: 'kothrud',
  vimannagar: 'vimannagar',
  hinjewadi: 'hinjewadi',
  baner: 'baner',
  punestation: 'punestation',
  swargate: 'swargate',
};

// Meters per degree at Pune latitude (~18.52° N)
const LAT_METERS = 110650;
const LNG_METERS = 111320 * Math.cos((18.52 * Math.PI) / 180); // ~105550m

// Public Overpass API is frequently slow/overloaded on any single instance.
// Trying several known mirrors in turn — with a client timeout generous
// enough to actually match the server-side [timeout:] we ask for — makes
// falling back to the procedural synthesizer the exception rather than the
// rule, so the rendered 3D city actually matches what was picked on the 2D
// map far more often.
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
  'https://overpass.openstreetmap.fr/api/interpreter',
];

// ─── AUTHENTIC REAL-WORLD PUNE BUILDING & LANDMARK NAMES ──────────────────────
// Used as realistic authentic fallback names whenever an OSM footprint lacks an explicit name tag.
const ZONE_BUILDING_NAMES = {
  shivajinagar: [
    'Fergusson College Main Heritage Hall',
    'Amrapali Arcade & Offices',
    'Deccan Gymkhana Sports Pavilion',
    'Gokhale Institute Academic Center',
    'Vaishali Commercial Arcade',
    'Roopali Heritage Court',
    'British Council Library Complex',
    'Modern College Science Block',
    'Sancheti Healthcare Tower',
    'Pride Portal Business Center',
    'ICC Trade Tower Wing A',
    'Deccan Heritage Residency',
    'Ghole Road Municipal Arcade',
    'Sumukha Commercial Plaza',
    'Dnyaneshwar Paduka Chambers',
    'Sudharshan Arts Hall',
    'FC Road Highstreet Arcade',
    'Wadia Research Annex',
    'Shivaji Housing Society Block B',
    'Chitale Bandhu Heritage Center',
    'Venus Traders Commercial Annex',
    'Bhandarkar Oriental Research Block',
    'Lakshmi Commercial Center',
    'Apte Road Professional Suites'
  ],
  kothrud: [
    'MIT World Peace Dome Tower',
    'Karve Road Commercial Plaza',
    'Dahanukar Colony Heights',
    'Mayur Colony Residency Phase 2',
    'Ashish Garden Commercial Center',
    'Kothrud Central Market Complex',
    'Paud Road Trade Center',
    'Vanaz Metro Station Annex',
    'Shubhashree Residential Enclave',
    'Cummins India Corporate Office',
    'Ideal Colony Society Block 4',
    'Suvarna Heights Commercial',
    'Mahatma Society Tower 3',
    'City Pride Multiplex Arcade',
    'Yashwantrao Chavan Natyagruha Complex',
    'Guheshwar Commercial Center',
    'Pratibha Towers Residential',
    'Paramhans Nagar Heights',
    'Bhusari Colony Commercial Wing',
    'Shivtirth Nagar Residency'
  ],
  vimannagar: [
    'Phoenix Marketcity Retail Mall',
    'Symbiosis International Campus Block A',
    'EON Free Zone IT Wing 1',
    'Nyati Empress Corporate Suites',
    'Town Square Shopping Arcade',
    'Giga Space IT Park Alpha',
    'Marvel Cerise Luxury Enclave',
    'Lunkad Sky Vista Commercial',
    'Konark Nagar Cooperative Residency',
    'Clover Park View Enclave',
    'Weikfield IT Citi InfoPark',
    'Vascon Weikfield Chambers',
    'Dorabjee Heritage Complex',
    'Skyline Corporate Hub',
    'Air Force Station Transit Enclave',
    'M效应 Tech Hub Phase 2',
    'Sakore Nagar Residency Block C',
    'Viman Platinum Plaza'
  ],
  hinjewadi: [
    'Infosys Campus Phase 1 Main Block',
    'Wipro Technologies Development Center',
    'TCS Sahyadri Park Tower A',
    'Tech Mahindra Innovation Hub',
    'Cognizant Technology Solutions Block 3',
    'Persistent Systems Campus',
    'Quadron Business Park Wing B',
    'Embassy Tech Zone Block 1.2',
    'Blue Ridge Residential Tower 9',
    'Hinjewadi Megapolis Splendour',
    'Ascendas IT Park Phase 1',
    'Xeno Commercial Plaza',
    'Godrej 24 Tech Residency',
    'Mindtree Kalinga Pune Center',
    'Tata AutoComp Systems HQ',
    'DLF Cybercity Campus Hinjewadi',
    'L&T Infotech Innovation Labs',
    'Siemens Technology IT Wing'
  ],
  baner: [
    'Balewadi High Street Retail Boulevard',
    'Amar Business Park Tower 1',
    'Panchshil Business Bay',
    'Supreme Headwinds Corporate Park',
    'Sadanand Commercial Enclave',
    'Kundan Eternia Residency',
    'VTP Alpine Commercial Complex',
    'Pride Valencia Luxury Suites',
    'Jupiter Hospital Medical Campus',
    'Chitale Bandhu Baner Hub',
    'Teerth Technospace IT Park',
    'Nandan Prospera Residential Tower',
    'Regent Plaza Commercial Center',
    'Veerbhadra Heights Baner',
    'Primrose Mall & Business Suites',
    'Icon Tower Baner Road'
  ],
  punestation: [
    'Pune Central Railway Divisional HQ',
    'Sassoon General Hospital Heritage Ward',
    'Council Hall Administrative Secretariat',
    'Collectorate Office Administrative Wing',
    'Camp Central Post Office Heritage Building',
    'Aurora Towers Commercial Arcade',
    'MG Road Fashion Street Plaza',
    'General Thimayya Commercial Complex',
    'Jehangir Hospital Healthcare Tower',
    'Ruby Hall Clinic Medical Block',
    'Cantonment Board Administrative Hall',
    'Westend Center Camp',
    'Kayani Bakery Heritage Quarters',
    'Dorabjee & Co Departmental Arcade',
    'Moledina Commercial Court',
    'Station View Executive Suites'
  ],
  swargate: [
    'Sarasbaug Temple Heritage Pavilion',
    'Peshwe Park Botanical Center',
    'Swargate Multimodal Metro Hub',
    'Nehru Stadium Sports Pavilion',
    'Laxmi Road Traditional Textile Market',
    'Tilak Smarak Mandir Cultural Hall',
    'Shaniwar Wada Administrative Annex',
    'Dagdusheth Halwai Ganpati Bhavan',
    'Mandai Municipal Market Heritage Wing',
    'Tulshibaug Commercial Arcade',
    'Satara Road Trade Center',
    'Bibwewadi Cooperative Housing Block A',
    'Sahyadri Super Speciality Hospital',
    'Mukund Nagar Executive Suites',
    'Market Yard Agricultural Exchange Block',
    'Parvati Heritage View Residency'
  ]
};

const DEFAULT_PUNE_NAMES = [
  'Chhatrapati Shivaji Maharaj Bhavan',
  'Sahyadri Corporate Chambers',
  'Saraswati Commercial Plaza',
  'Deccan Pride Executive Tower',
  'Sinhagad Heights Residency',
  'Maratha Chamber of Commerce Center',
  'Mayur Vihar Residential Enclave',
  'Ganesh Krupa Commercial Complex',
  'Vrindavan Cooperative Housing Society',
  'Panchshil Business Suites',
  'Amanora Vertex Heights',
  'Kothrud Central Arcade',
  'Fergusson Heritage Block',
  'Balewadi High Point Tower',
  'Magarpatta Cyber One Hub',
  'Shubham Commercial Center',
  'Sai Krupa Residency Block B',
  'Navratna Business Arcade',
  'Omkar Heights Residential',
  'Lokmanya Tilak Memorial Wing'
];

export default function PuneOsmMapSelector() {
  const { t } = useTranslation();
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const rectLayerRef = useRef(null);
  const markerLayerRef = useRef(null);
  const searchDebounceRef = useRef(null);
  const searchBoxRef = useRef(null);

  const importOsmPuneBoundaryAndBuildings = useStore((s) => s.importOsmPuneBoundaryAndBuildings);
  const setDataSurveyMode = useStore((s) => s.setDataSurveyMode);

  // Map state
  const [selectedZone, setSelectedZone] = useState(PUNE_ZONES[0]);
  const [centerCoord, setCenterCoord] = useState({ lat: 18.5314, lng: 73.8446 });
  const [boxSizeMeters, setBoxSizeMeters] = useState(240); // 240m x 240m default

  // Location search state (Nominatim geocoding, biased to the Pune area)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchError, setSearchError] = useState(false);

  // Status state
  const [isFetchingOSM, setIsFetchingOSM] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [generatedStats, setGeneratedStats] = useState(null);

  // Calculate bounding box in lat/lng from center and size
  const getBoundsFromCenterAndSize = useCallback((center, sizeMeters) => {
    const halfLat = (sizeMeters / 2) / LAT_METERS;
    const halfLng = (sizeMeters / 2) / LNG_METERS;
    return [
      [center.lat - halfLat, center.lng - halfLng],
      [center.lat + halfLat, center.lng + halfLng]
    ];
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (leafletMapRef.current) return;

    // Create Map
    const map = L.map(mapContainerRef.current, {
      center: [centerCoord.lat, centerCoord.lng],
      zoom: 16,
      minZoom: 12,
      maxZoom: 19,
      zoomControl: false,
      attributionControl: false,
    });

    // Add Zoom Control at top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Standard OpenStreetMap Tile Layer
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Add initial Selection Rectangle
    const initialBounds = getBoundsFromCenterAndSize(centerCoord, boxSizeMeters);
    const rect = L.rectangle(initialBounds, {
      color: '#10b981',
      weight: 2.5,
      dashArray: '6, 6',
      fillColor: '#06b6d4',
      fillOpacity: 0.18,
    }).addTo(map);

    // Center pin icon
    const centerIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div style="
          width: 14px; 
          height: 14px; 
          background: #10b981; 
          border: 2px solid #ffffff; 
          border-radius: 50%; 
          box-shadow: 0 0 10px #10b981;
        "></div>
      `,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    const marker = L.marker([centerCoord.lat, centerCoord.lng], {
      icon: centerIcon,
      draggable: true,
    }).addTo(map);

    marker.on('drag', (e) => {
      const newPos = e.target.getLatLng();
      setCenterCoord({ lat: newPos.lat, lng: newPos.lng });
      const newBounds = getBoundsFromCenterAndSize(newPos, boxSizeMeters);
      rect.setBounds(newBounds);
    });

    // Click map to reposition boundary center
    map.on('click', (e) => {
      const clicked = e.latlng;
      setCenterCoord({ lat: clicked.lat, lng: clicked.lng });
      marker.setLatLng(clicked);
      const newBounds = getBoundsFromCenterAndSize(clicked, boxSizeMeters);
      rect.setBounds(newBounds);
    });

    leafletMapRef.current = map;
    rectLayerRef.current = rect;
    markerLayerRef.current = marker;

    // Trigger invalidateSize after container renders
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, [getBoundsFromCenterAndSize]);

  // Update selection rectangle when centerCoord or boxSizeMeters changes
  useEffect(() => {
    if (!leafletMapRef.current || !rectLayerRef.current || !markerLayerRef.current) return;
    const newBounds = getBoundsFromCenterAndSize(centerCoord, boxSizeMeters);
    rectLayerRef.current.setBounds(newBounds);
    markerLayerRef.current.setLatLng([centerCoord.lat, centerCoord.lng]);
  }, [centerCoord, boxSizeMeters, getBoundsFromCenterAndSize]);

  // Jump to Preset Pune Zone
  const handleZoneSelect = (zone) => {
    setSelectedZone(zone);
    setCenterCoord({ lat: zone.lat, lng: zone.lng });
    setBoxSizeMeters(zone.defaultSize || 240);
    setSearchQuery('');
    setSearchResults([]);
    setSearchOpen(false);

    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([zone.lat, zone.lng], 16, { duration: 0.8 });
    }
  };

  // ─── LOCATION SEARCH (Nominatim geocoding, biased to Pune) ────────────────
  // Close the results dropdown when clicking outside the search box
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const runLocationSearch = useCallback(async (query) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    setSearchError(false);
    try {
      // Bias results to the Pune metropolitan area (roughly), without
      // strictly excluding nearby matches outside the box.
      const params = new URLSearchParams({
        format: 'json',
        q: trimmed.toLowerCase().includes('pune') ? trimmed : `${trimmed}, Pune, Maharashtra, India`,
        limit: '6',
        addressdetails: '1',
        viewbox: '73.70,18.65,74.05,18.38',
        bounded: '0',
      });
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        headers: { 'Accept-Language': 'en' },
      });
      if (!res.ok) throw new Error('Geocoding request failed');
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (err) {
      setSearchResults([]);
      setSearchError(true);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchInputChange = (value) => {
    setSearchQuery(value);
    setSearchOpen(true);
    setSearchError(false);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => runLocationSearch(value), 500);
  };

  const flyToSearchResult = (lat, lng, label, fullLabel) => {
    const zoneLike = {
      id: 'search-result',
      name: label,
      desc: fullLabel || label,
      lat,
      lng,
      defaultSize: 240,
    };
    setSelectedZone(zoneLike);
    setCenterCoord({ lat, lng });
    setBoxSizeMeters(zoneLike.defaultSize);
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([lat, lng], 17, { duration: 0.8 });
    }
  };

  const handleSearchResultSelect = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;
    const shortLabel = result.display_name?.split(',').slice(0, 2).join(',').trim() || searchQuery;
    flyToSearchResult(lat, lng, shortLabel, result.display_name);
    setSearchQuery(shortLabel);
    setSearchResults([]);
    setSearchOpen(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (searchResults.length > 0) {
      handleSearchResultSelect(searchResults[0]);
    } else if (searchQuery.trim()) {
      runLocationSearch(searchQuery);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchOpen(false);
    setSearchError(false);
  };

  // ─── FETCH OSM BUILDINGS VIA OVERPASS & PROCEDURAL FALLBACK ───────────────
  const fetchOsmBuildingsAndProject = async () => {
    setIsFetchingOSM(true);
    setStatusMessage(t('datasurvey.osmSearch.statusQuerying'));

    const bounds = getBoundsFromCenterAndSize(centerCoord, boxSizeMeters);
    const south = bounds[0][0];
    const west = bounds[0][1];
    const north = bounds[1][0];
    const east = bounds[1][1];

    // 2D Cadastral Boundary Corners in 3D local coordinate space
    const halfWidth = boxSizeMeters / 2;
    const halfLength = boxSizeMeters / 2;
    const boundaryPolygon = [
      { x: -halfWidth, z: -halfLength },
      { x: halfWidth, z: -halfLength },
      { x: halfWidth, z: halfLength },
      { x: -halfWidth, z: halfLength },
    ];

    let osmBuildings = [];
    let osmRoads = [];
    let osmWater = [];
    let dataSource = 'procedural'; // 'live' once a real Overpass response yields usable data
    let lastError = null;

    // Overpass QL Query for buildings, roads, and water features (rivers,
    // streams, lakes/riverbanks) — water was previously never queried at
    // all, which is why a river visible on the 2D OSM picker never showed
    // up in the generated 3D scene.
    const query = `
      [out:json][timeout:20];
      (
        way["building"](${south},${west},${north},${east});
        relation["building"](${south},${west},${north},${east});
        way["highway"~"primary|secondary|tertiary|residential|trunk|service"](${south},${west},${north},${east});
        way["waterway"~"river|stream|canal|drain"](${south},${west},${north},${east});
        way["natural"="water"](${south},${west},${north},${east});
        relation["natural"="water"](${south},${west},${north},${east});
        way["landuse"="reservoir"](${south},${west},${north},${east});
      );
      out body;
      >;
      out skel qt;
    `;

    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        setStatusMessage(t('datasurvey.osmSearch.statusQueryingHost', { host: new URL(endpoint).hostname }));

        const controller = new AbortController();
        // Give the client comfortably longer than the server-side [timeout:20]
        // we requested, rather than aborting before the server itself would.
        const timeoutId = setTimeout(() => controller.abort(), 22000);

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(query)}`,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          lastError = new Error(`Overpass mirror ${endpoint} responded ${res.status}`);
          continue; // try the next mirror
        }

        const data = await res.json();
        const nodes = {};
        const wayById = {};
        (data.elements || []).forEach((el) => {
          if (el.type === 'node') nodes[el.id] = [el.lat, el.lon];
          if (el.type === 'way') wayById[el.id] = el;
        });

        // Resolve a tagged relation (multipolygon) down to its "outer" ring
        // way(s), carrying the relation's tags onto each resolved way. This
        // is what a building or a water body mapped as a relation (common
        // for larger/irregular footprints and for rivers/lakes) looks like
        // in the raw Overpass response — without this, every relation-based
        // feature was silently dropped even though its geometry was right
        // there in the response, which is why some buildings visible on the
        // 2D OSM picker never appeared in the generated 3D scene.
        const resolveRelationOuterWays = (relations) => {
          const resolved = [];
          relations.forEach((rel) => {
            const outerMembers = (rel.members || []).filter(
              (m) => m.type === 'way' && (m.role === 'outer' || !m.role)
            );
            outerMembers.forEach((m) => {
              const way = wayById[m.ref];
              if (way && way.nodes && way.nodes.length >= 3) {
                resolved.push({ ...way, tags: { ...way.tags, ...rel.tags } });
              }
            });
          });
          return resolved;
        };

        // 1. STRICT BUILDING FILTER: Must have 'building' tag and NOT have 'highway'
        const buildingWaysDirect = (data.elements || []).filter((el) => {
          if (el.type !== 'way' || !el.tags || !el.nodes) return false;
          // Reject anything tagged as a highway or road!
          if (el.tags.highway) return false;
          // Must have an explicit building tag
          if (!el.tags.building || el.tags.building === 'no') return false;
          return true;
        });
        const buildingRelations = (data.elements || []).filter(
          (el) => el.type === 'relation' && el.tags && el.tags.building && el.tags.building !== 'no'
        );
        const buildingWays = [...buildingWaysDirect, ...resolveRelationOuterWays(buildingRelations)];

        if (buildingWays.length >= 2) {
          setStatusMessage(t('datasurvey.osmSearch.statusFound', { count: buildingWays.length }));
          dataSource = 'live';

          // Render every matched building in the surveyed parcel (capped
          // generously, only to guard against a pathological response) so
          // the 3D scene actually matches what's visible on the 2D picker
          // instead of dropping buildings past an arbitrary early cutoff.
          const maxBuildingsToLoad = Math.min(300, buildingWays.length);

          osmBuildings = buildingWays.slice(0, maxBuildingsToLoad).map((way, idx) => {
            const wayCoords = way.nodes.map((nodeId) => nodes[nodeId]).filter(Boolean);
            if (wayCoords.length < 3) return null;

            // Convert GPS (lat, lng) to local 3D meter space (x, z) relative to boundary center
            const localPts = wayCoords.map(([lat, lng]) => {
              const dx = (lng - centerCoord.lng) * LNG_METERS;
              const dz = (centerCoord.lat - lat) * LAT_METERS;
              return [Number(dx.toFixed(2)), Number(dz.toFixed(2))];
            });

            // Calculate bounding box and center of building
            const xs = localPts.map((p) => p[0]);
            const zs = localPts.map((p) => p[1]);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minZ = Math.min(...zs);
            const maxZ = Math.max(...zs);

            const bw = Math.max(6, Number((maxX - minX).toFixed(1)));
            const bl = Math.max(6, Number((maxZ - minZ).toFixed(1)));

            // Reject any corrupt slivers or massive bounding polygons that span the whole city
            if (bw > boxSizeMeters * 0.95 || bl > boxSizeMeters * 0.95) return null;

            const bCenterX = Number(((minX + maxX) / 2).toFixed(1));
            const bCenterZ = Number(((minZ + maxZ) / 2).toFixed(1));

            // Building levels from OSM tags or realistic defaults
            const levelsTag = way.tags['building:levels'] || way.tags['levels'];
            const heightTag = way.tags['height'];
            let detectedFloors = 5;
            if (levelsTag && !isNaN(parseInt(levelsTag))) {
              detectedFloors = Math.max(2, Math.min(24, parseInt(levelsTag)));
            } else if (heightTag && !isNaN(parseFloat(heightTag))) {
              detectedFloors = Math.max(2, Math.min(24, Math.round(parseFloat(heightTag) / 3.2)));
            } else {
              detectedFloors = bw * bl > 400 ? 8 : (bw * bl > 200 ? 6 : 4);
            }

            // ─── EXTRACT AUTHENTIC REAL-WORLD BUILDING NAME ───
            let buildingName = 
              way.tags.name || 
              way.tags['name:en'] || 
              way.tags['name:mr'] || 
              way.tags.operator || 
              way.tags.brand || 
              way.tags.alt_name;

            // If no direct name tag, check specific amenity/office/shop/tourism tags
            if (!buildingName) {
              if (way.tags['addr:housename']) {
                buildingName = way.tags['addr:housename'];
              } else if (way.tags.amenity) {
                const amenityType = way.tags.amenity.replace(/_/g, ' ');
                const formattedAmenity = amenityType.charAt(0).toUpperCase() + amenityType.slice(1);
                buildingName = `${formattedAmenity} Bhavan`;
              } else if (way.tags.office) {
                const officeType = way.tags.office.replace(/_/g, ' ');
                const formattedOffice = officeType.charAt(0).toUpperCase() + officeType.slice(1);
                buildingName = `${formattedOffice} Tower`;
              } else if (way.tags.shop) {
                const shopType = way.tags.shop.replace(/_/g, ' ');
                const formattedShop = shopType.charAt(0).toUpperCase() + shopType.slice(1);
                buildingName = `${formattedShop} Plaza`;
              } else if (way.tags['addr:street'] && way.tags['addr:housenumber']) {
                buildingName = `${way.tags['addr:street']} Enclave (No. ${way.tags['addr:housenumber']})`;
              }
            }

            // High-fidelity fallback: Use authentic sector landmarks and heritage residency names
            if (!buildingName) {
              const zoneLandmarks = ZONE_BUILDING_NAMES[selectedZone.id] || DEFAULT_PUNE_NAMES;
              buildingName = zoneLandmarks[idx % zoneLandmarks.length];
            }
            const bldId = `osm-pune-${idx + 1}`;

            // Centered footprint coordinates for FloorBox polygon rendering
            const centeredFootprint = localPts.map(([px, pz]) => [
              Number((px - bCenterX).toFixed(2)),
              Number((pz - bCenterZ).toFixed(2))
            ]);

            // Construct 3D floors and units
            const floors = [];
            const units = [];

            for (let f = 1; f <= detectedFloors; f++) {
              const floorHeight = 3.2;
              const zMin = (f - 1) * floorHeight;
              const zMax = f * floorHeight;

              floors.push({
                floor_index: f - 1,
                z_height: Number(zMin.toFixed(2)),
                slab_thickness: floorHeight,
                footprint: centeredFootprint,
                fit_type: 'polygon',
                iou_score: 0.98,
              });

              units.push({
                ulpin: `MH-PUN-${selectedZone.id.toUpperCase()}-${String(idx + 1).padStart(3, '0')}-F${String(f).padStart(2, '0')}`,
                floorNumber: f,
                type: 'floor',
                zRange: [Number(zMin.toFixed(2)), Number(zMax.toFixed(2))],
                owner: `${buildingName} — Floor ${f}`,
                status: 'approved',
                footprint: centeredFootprint,
                actualDimensions: [bw, floorHeight, bl],
                approvedDimensions: [bw, floorHeight, bl],
              });
            }

            return {
              id: bldId,
              name: buildingName,
              buildingName: buildingName,
              position: [bCenterX, 0, bCenterZ],
              footprint: [bw, bl],
              floorsDetected: detectedFloors,
              actualFloors: detectedFloors,
              approvedFloors: detectedFloors,
              sourceType: 'OSM',
              isSurvey: true,
              isSurveyAsset: true,
              shape: 'polygon',
              floors,
              units,
              tags: way.tags,
            };
          }).filter(Boolean);
        }

        // 2. STRICT HIGHWAY EXTRACTION: Only ways that have 'highway' tag
        const roadWays = (data.elements || []).filter((el) => el.type === 'way' && el.tags && el.tags.highway && el.nodes);
        if (roadWays.length > 0) {
          osmRoads = roadWays.slice(0, 80).map((way, idx) => {
            const wayCoords = way.nodes.map((nodeId) => nodes[nodeId]).filter(Boolean);
            if (wayCoords.length < 2) return null;
            const localPts = wayCoords.map(([lat, lng]) => {
              const dx = (lng - centerCoord.lng) * LNG_METERS;
              const dz = (centerCoord.lat - lat) * LAT_METERS;
              return [Number(dx.toFixed(1)), Number(dz.toFixed(1))];
            });
            return {
              id: `osm-road-${way.id || idx}`,
              name: way.tags.name || `${selectedZone.name} Street #${idx + 1}`,
              type: way.tags.highway || 'residential',
              width: way.tags.highway === 'primary' || way.tags.highway === 'trunk' ? 14 : (way.tags.highway === 'secondary' ? 11 : 8),
              points: localPts,
            };
          }).filter(Boolean);
        }

        // 3. WATER FEATURES: river/stream centerlines (rendered as a wide
        // blue ribbon) and water polygons — lakes, reservoirs, or a
        // riverbank mapped as a closed way/relation (rendered as a flat
        // blue fill). Previously nothing queried "waterway" or
        // "natural=water" at all, so a river visible on the 2D OSM picker
        // simply never made it into the 3D scene.
        const waterLineWays = (data.elements || []).filter(
          (el) => el.type === 'way' && el.tags && el.nodes && el.tags.waterway
        );
        const waterPolyWaysDirect = (data.elements || []).filter(
          (el) => el.type === 'way' && el.tags && el.nodes &&
            (el.tags.natural === 'water' || el.tags.landuse === 'reservoir') &&
            !el.tags.waterway
        );
        const waterRelations = (data.elements || []).filter(
          (el) => el.type === 'relation' && el.tags && el.tags.natural === 'water'
        );
        const waterPolyWays = [...waterPolyWaysDirect, ...resolveRelationOuterWays(waterRelations)];

        const toLocalPts = (way) => {
          const wayCoords = way.nodes.map((nodeId) => nodes[nodeId]).filter(Boolean);
          return wayCoords.map(([lat, lng]) => [
            Number(((lng - centerCoord.lng) * LNG_METERS).toFixed(1)),
            Number(((centerCoord.lat - lat) * LAT_METERS).toFixed(1)),
          ]);
        };

        const waterLines = waterLineWays.slice(0, 20).map((way, idx) => {
          const localPts = toLocalPts(way);
          if (localPts.length < 2) return null;
          return {
            id: `osm-water-line-${way.id || idx}`,
            kind: 'line',
            name: way.tags.name || 'River',
            width: way.tags.waterway === 'river' ? 16 : (way.tags.waterway === 'canal' ? 10 : 6),
            points: localPts,
          };
        }).filter(Boolean);

        const waterPolys = waterPolyWays.slice(0, 20).map((way, idx) => {
          const localPts = toLocalPts(way);
          if (localPts.length < 3) return null;
          return {
            id: `osm-water-poly-${way.id || idx}`,
            kind: 'polygon',
            name: way.tags.name || 'Water Body',
            points: localPts,
          };
        }).filter(Boolean);

        osmWater = [...waterLines, ...waterPolys];

        // Got a usable response from this mirror — no need to try the rest.
        if (dataSource === 'live') break;
      } catch (err) {
        lastError = err;
        console.warn(`Overpass mirror ${endpoint} failed, trying next mirror if available.`, err);
        continue;
      }
    }

    if (dataSource !== 'live') {
      console.warn('All Overpass mirrors failed or returned no usable buildings for this area. Engaging high-fidelity Pune cadastral synthesizer.', lastError);
    }

    // Ensure sector roads exist if OSM returned none
    if (osmRoads.length === 0) {
      osmRoads = [
        {
          id: `pune-sec-road-1`,
          name: `${selectedZone.name} Central Boulevard`,
          type: 'secondary',
          width: 11,
          points: [[-halfWidth, 0], [halfWidth, 0]]
        },
        {
          id: `pune-sec-road-2`,
          name: `${selectedZone.name} Cross Link`,
          type: 'residential',
          width: 8,
          points: [[0, -halfLength], [0, halfLength]]
        },
        {
          id: `pune-sec-road-3`,
          name: `${selectedZone.name} North Lane`,
          type: 'residential',
          width: 7,
          points: [[-halfWidth * 0.8, -halfLength * 0.5], [halfWidth * 0.8, -halfLength * 0.5]]
        },
        {
          id: `pune-sec-road-4`,
          name: `${selectedZone.name} South Lane`,
          type: 'residential',
          width: 7,
          points: [[-halfWidth * 0.8, halfLength * 0.5], [halfWidth * 0.8, halfLength * 0.5]]
        }
      ];
    }

    // ─── HIGH-FIDELITY PROCEDURAL FALLBACK ────────────────────────────────────
    if (osmBuildings.length < 3) {
      setStatusMessage(t('datasurvey.osmSearch.statusSynthesizing'));
      osmBuildings = generatePuneProceduralBuildings(selectedZone, boxSizeMeters);
    }

    // ─── SAFETY CHECK: AABB-VS-ROAD-CENTERLINE OVERLAP VERIFICATION ───────────
    // Run verification on all buildings (live OSM or procedural fallback) to catch any road overlaps
    let overlapCount = 0;
    osmBuildings.forEach((bld) => {
      const bPos = bld.position || [0, 0, 0];
      const [bw, bl] = bld.footprint || [10, 10];
      const bMinX = bPos[0] - bw / 2;
      const bMaxX = bPos[0] + bw / 2;
      const bMinZ = bPos[2] - bl / 2;
      const bMaxZ = bPos[2] + bl / 2;

      osmRoads.forEach((road) => {
        const roadWidth = road.width || 8;
        const roadRadius = roadWidth / 2;
        const pts = road.points || [];
        for (let i = 0; i < pts.length - 1; i++) {
          if (doesSegmentOverlapAABB(pts[i], pts[i + 1], bMinX, bMaxX, bMinZ, bMaxZ, roadRadius)) {
            overlapCount++;
            console.warn(
              `[Pune OSM Cadastre] Road overlap detected for building "${bld.name || bld.id}" (ID: ${bld.id}) with road "${road.name || road.id}". ` +
              `Building AABB: [${bMinX.toFixed(1)}, ${bMinZ.toFixed(1)}] to [${bMaxX.toFixed(1)}, ${bMaxZ.toFixed(1)}], ` +
              `Road corridor half-width: ${roadRadius}m.`
            );
            break;
          }
        }
      });
    });

    if (overlapCount > 0) {
      console.warn(`[Pune OSM Cadastre] Total building/road overlaps detected: ${overlapCount}.`);
    }

    // Prepare Boundary Parcel
    const parcelArea = Math.round(boxSizeMeters * boxSizeMeters);
    const boundaryParcel = {
      id: `pune-osm-${selectedZone.id}-${Date.now()}`,
      name: `PMC Ward: ${selectedZone.name}`,
      polygon: boundaryPolygon,
      corners: boundaryPolygon,
      status: 'imported',
      properties: {
        area: parcelArea,
        perimeter: Math.round(boxSizeMeters * 4),
        plotNumber: `PMC-${selectedZone.id.toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`,
        zone: selectedZone.name,
        source: dataSource === 'live'
          ? 'OpenStreetMap (live data, Pune, Maharashtra)'
          : 'Procedural approximation (live OSM data unavailable for this area)',
        dataSource,
        buildingCount: osmBuildings.length,
        roadCount: osmRoads.length,
      }
    };

    // Commit to 3D Scene in Zustand Store (Boundary, Buildings, Roads)
    importOsmPuneBoundaryAndBuildings(boundaryParcel, osmBuildings, osmRoads, osmWater);

    setIsFetchingOSM(false);
    setStatusMessage('');
    setGeneratedStats({
      zoneName: selectedZone.name,
      areaM2: parcelArea,
      hectares: (parcelArea / 10000).toFixed(2),
      buildingCount: osmBuildings.length,
      roadCount: osmRoads.length,
      totalUnits: osmBuildings.reduce((s, b) => s + (b.units?.length || 0), 0),
      timestamp: new Date().toLocaleTimeString(),
      // Surfaced in the UI so it's always clear whether the rendered 3D
      // city is real OpenStreetMap geometry for this exact spot (which
      // will match the 2D map) or a procedural approximation (which won't
      // — same building count in the ballpark, but different layout).
      dataSource,
    });
  };

  // ─── GEOMETRIC UTILITY: 2D LINE SEGMENT VS AABB OVERLAP TEST ───────────────
  const doesSegmentOverlapAABB = (p1, p2, boxMinX, boxMaxX, boxMinZ, boxMaxZ, radius) => {
    const x1 = p1[0];
    const z1 = p1[1];
    const x2 = p2[0];
    const z2 = p2[1];

    const dx = x2 - x1;
    const dz = z2 - z1;
    const lenSq = dx * dx + dz * dz;

    const tValues = [0, 1];

    if (Math.abs(dx) > 1e-6) {
      const tx1 = (boxMinX - x1) / dx;
      const tx2 = (boxMaxX - x1) / dx;
      if (tx1 >= 0 && tx1 <= 1) tValues.push(tx1);
      if (tx2 >= 0 && tx2 <= 1) tValues.push(tx2);
    }

    if (Math.abs(dz) > 1e-6) {
      const tz1 = (boxMinZ - z1) / dz;
      const tz2 = (boxMaxZ - z1) / dz;
      if (tz1 >= 0 && tz1 <= 1) tValues.push(tz1);
      if (tz2 >= 0 && tz2 <= 1) tValues.push(tz2);
    }

    if (lenSq > 1e-6) {
      const centerX = (boxMinX + boxMaxX) / 2;
      const centerZ = (boxMinZ + boxMaxZ) / 2;
      const tProj = Math.max(0, Math.min(1, ((centerX - x1) * dx + (centerZ - z1) * dz) / lenSq));
      tValues.push(tProj);
    }

    const rSq = radius * radius;
    for (const t of tValues) {
      const px = x1 + t * dx;
      const pz = z1 + t * dz;
      const distX = Math.max(boxMinX - px, 0, px - boxMaxX);
      const distZ = Math.max(boxMinZ - pz, 0, pz - boxMaxZ);
      if (distX * distX + distZ * distZ <= rSq) {
        return true;
      }
    }

    return false;
  };

  // ─── PROCEDURAL PUNE BUILDINGS GENERATOR (BLOCK-AWARE) ────────────────────
  const generatePuneProceduralBuildings = (zone, sizeMeters) => {
    const buildings = [];
    // Scale building count dynamically from 12 up to 48 based on parcel size
    const totalTargetCount = Math.max(12, Math.min(48, Math.floor((sizeMeters * sizeMeters) / 3200)));

    const halfWidth = sizeMeters / 2;
    const halfLength = sizeMeters / 2;

    // Road corridor half-widths and setbacks
    const SETBACK = 4.0; // Minimum 3-4m setback so corners don't clip curbs
    const PLOT_MARGIN = 8.0; // Perimeter boundary margin

    // Fallback road corridor definitions:
    // 1. Central Boulevard along z=0 (width 11m -> half-width 5.5m)
    // 2. Cross Link along x=0 (width 8m -> half-width 4.0m)
    // 3. North Lane along z=-halfLength*0.5 (width 7m -> half-width 3.5m)
    // 4. South Lane along z=+halfLength*0.5 (width 7m -> half-width 3.5m)
    const centralRoadHalfWidth = 11 / 2;
    const crossRoadHalfWidth = 8 / 2;
    const laneHalfWidth = 7 / 2;

    // Inset boundaries from road centerlines:
    const xWestMin = -halfWidth + PLOT_MARGIN;
    const xWestMax = -(crossRoadHalfWidth + SETBACK); // -8.0m
    const xEastMin = +(crossRoadHalfWidth + SETBACK);  // +8.0m
    const xEastMax = halfWidth - PLOT_MARGIN;

    const zNorthFarMin = -halfLength + PLOT_MARGIN;
    const zNorthFarMax = -halfLength * 0.5 - (laneHalfWidth + SETBACK); // -halfLength * 0.5 - 7.5m
    const zNorthNearMin = -halfLength * 0.5 + (laneHalfWidth + SETBACK); // -halfLength * 0.5 + 7.5m
    const zNorthNearMax = -(centralRoadHalfWidth + SETBACK); // -9.5m

    const zSouthNearMin = +(centralRoadHalfWidth + SETBACK); // +9.5m
    const zSouthNearMax = +halfLength * 0.5 - (laneHalfWidth + SETBACK); // +halfLength * 0.5 - 7.5m
    const zSouthFarMin = +halfLength * 0.5 + (laneHalfWidth + SETBACK); // +halfLength * 0.5 + 7.5m
    const zSouthFarMax = halfLength - PLOT_MARGIN;

    // 8 distinct urban blocks created by the central cross + north/south lanes
    const blocks = [
      // Quadrant 1 (NW): West + North
      { name: 'NW Outer Block', minX: xWestMin, maxX: xWestMax, minZ: zNorthFarMin, maxZ: zNorthFarMax },
      { name: 'NW Inner Block', minX: xWestMin, maxX: xWestMax, minZ: zNorthNearMin, maxZ: zNorthNearMax },
      // Quadrant 2 (NE): East + North
      { name: 'NE Outer Block', minX: xEastMin, maxX: xEastMax, minZ: zNorthFarMin, maxZ: zNorthFarMax },
      { name: 'NE Inner Block', minX: xEastMin, maxX: xEastMax, minZ: zNorthNearMin, maxZ: zNorthNearMax },
      // Quadrant 3 (SW): West + South
      { name: 'SW Inner Block', minX: xWestMin, maxX: xWestMax, minZ: zSouthNearMin, maxZ: zSouthNearMax },
      { name: 'SW Outer Block', minX: xWestMin, maxX: xWestMax, minZ: zSouthFarMin, maxZ: zSouthFarMax },
      // Quadrant 4 (SE): East + South
      { name: 'SE Inner Block', minX: xEastMin, maxX: xEastMax, minZ: zSouthNearMin, maxZ: zSouthNearMax },
      { name: 'SE Outer Block', minX: xEastMin, maxX: xEastMax, minZ: zSouthFarMin, maxZ: zSouthFarMax },
    ];

    const puneBuildingTypes = [
      { name: 'Shivaji Commercial Center', shape: 'rectangle', floors: 9, w: 22, l: 18 },
      { name: 'Saraswati Cooperative Housing', shape: 'rectangle', floors: 7, w: 20, l: 16 },
      { name: 'Sahyadri Corporate Tower', shape: 'rectangle', floors: 12, w: 24, l: 20 },
      { name: 'Deccan IT Plaza', shape: 'rectangle', floors: 10, w: 26, l: 18 },
      { name: 'Maratha Chamber Complex', shape: 'rectangle', floors: 8, w: 20, l: 18 },
      { name: 'Sinhagad Residency', shape: 'rectangle', floors: 6, w: 18, l: 16 },
      { name: 'Mayur Vihar Heights', shape: 'rectangle', floors: 8, w: 22, l: 16 },
      { name: 'Ganesh Krupa Commercial', shape: 'rectangle', floors: 5, w: 18, l: 14 },
      { name: 'Vrindavan Enclave', shape: 'rectangle', floors: 6, w: 16, l: 14 },
      { name: 'Kothrud Heights Tower', shape: 'rectangle', floors: 11, w: 22, l: 19 },
      { name: 'Amanora Vertex Hub', shape: 'rectangle', floors: 14, w: 25, l: 22 },
      { name: 'Magarpatta Cyber One', shape: 'rectangle', floors: 10, w: 24, l: 20 },
      { name: 'Balewadi High Point', shape: 'rectangle', floors: 8, w: 19, l: 16 },
      { name: 'Viman Arcade Commercial', shape: 'rectangle', floors: 7, w: 21, l: 17 },
    ];

    // Distribute total target buildings across available blocks
    const basePerBlock = Math.floor(totalTargetCount / blocks.length);
    const remainder = totalTargetCount % blocks.length;

    let bldIdx = 0;

    blocks.forEach((block, blockIndex) => {
      const numBldsInBlock = basePerBlock + (blockIndex < remainder ? 1 : 0);
      if (numBldsInBlock <= 0) return;

      const blockWidth = block.maxX - block.minX;
      const blockLength = block.maxZ - block.minZ;
      if (blockWidth < 12 || blockLength < 12) return;

      // Determine grid layout for this specific block
      let cols = 1;
      let rows = 1;
      if (numBldsInBlock === 2) {
        cols = blockWidth >= blockLength ? 2 : 1;
        rows = blockWidth >= blockLength ? 1 : 2;
      } else if (numBldsInBlock === 3) {
        cols = blockWidth >= blockLength ? 3 : 1;
        rows = blockWidth >= blockLength ? 1 : 3;
      } else if (numBldsInBlock >= 4) {
        cols = blockWidth >= blockLength ? Math.ceil(Math.sqrt(numBldsInBlock * 1.3)) : Math.floor(Math.sqrt(numBldsInBlock / 1.3));
        cols = Math.max(1, cols);
        rows = Math.max(1, Math.ceil(numBldsInBlock / cols));
      }

      const slotW = blockWidth / cols;
      const slotL = blockLength / rows;

      let placedInBlock = 0;
      for (let r = 0; r < rows && placedInBlock < numBldsInBlock; r++) {
        for (let c = 0; c < cols && placedInBlock < numBldsInBlock; c++) {
          const type = puneBuildingTypes[bldIdx % puneBuildingTypes.length];
          const bldId = `osm-pune-${bldIdx + 1}`;

          // Scale building footprint if needed so it stays comfortably inside its slot
          let bw = Math.min(type.w, Math.max(8, Number((slotW - 4).toFixed(1))));
          let bl = Math.min(type.l, Math.max(8, Number((slotL - 4).toFixed(1))));
          const totalFloors = type.floors;

          // Slot boundaries
          const slotMinX = block.minX + c * slotW;
          const slotMaxX = slotMinX + slotW;
          const slotMinZ = block.minZ + r * slotL;
          const slotMaxZ = slotMinZ + slotL;

          // Safe center boundaries ensuring [bx - bw/2, bx + bw/2] stays within the slot and block
          const validMinX = slotMinX + bw / 2;
          const validMaxX = slotMaxX - bw / 2;
          const validMinZ = slotMinZ + bl / 2;
          const validMaxZ = slotMaxZ - bl / 2;

          const baseX = (validMinX + validMaxX) / 2;
          const baseZ = (validMinZ + validMaxZ) / 2;

          // Reduced random jitter (±1.5m) and clamped so it never crosses the inset boundary
          const jitterX = Math.random() * 3 - 1.5;
          const jitterZ = Math.random() * 3 - 1.5;

          const bx = validMinX <= validMaxX
            ? Number(Math.min(validMaxX, Math.max(validMinX, baseX + jitterX)).toFixed(1))
            : Number(baseX.toFixed(1));
          const bz = validMinZ <= validMaxZ
            ? Number(Math.min(validMaxZ, Math.max(validMinZ, baseZ + jitterZ)).toFixed(1))
            : Number(baseZ.toFixed(1));

          const baseFp = [
            [-bw / 2, -bl / 2],
            [bw / 2, -bl / 2],
            [bw / 2, bl / 2],
            [-bw / 2, bl / 2],
            [-bw / 2, -bl / 2]
          ];

          const floors = [];
          const units = [];

          for (let f = 1; f <= totalFloors; f++) {
            const floorHeight = 3.2;
            const zMin = (f - 1) * floorHeight;
            const zMax = f * floorHeight;

            floors.push({
              floor_index: f - 1,
              z_height: Number(zMin.toFixed(2)),
              slab_thickness: floorHeight,
              footprint: baseFp,
              fit_type: 'rectangle',
              iou_score: 0.99,
            });

            units.push({
              ulpin: `MH-PUN-${zone.id.toUpperCase()}-${String(bldIdx + 1).padStart(3, '0')}-F${String(f).padStart(2, '0')}`,
              floorNumber: f,
              type: 'floor',
              zRange: [Number(zMin.toFixed(2)), Number(zMax.toFixed(2))],
              owner: `${type.name} — Unit F-${f}01`,
              status: 'approved',
              footprint: baseFp,
              actualDimensions: [bw, floorHeight, bl],
              approvedDimensions: [bw, floorHeight, bl],
            });
          }

          // Select an authentic real-world building name for this zone
          const zoneLandmarks = ZONE_BUILDING_NAMES[zone.id] || DEFAULT_PUNE_NAMES;
          const bldProperName = zoneLandmarks[bldIdx % zoneLandmarks.length] || type.name;

          buildings.push({
            id: bldId,
            name: bldProperName,
            buildingName: bldProperName,
            position: [bx, 0, bz],
            footprint: [bw, bl],
            floorsDetected: totalFloors,
            actualFloors: totalFloors,
            approvedFloors: totalFloors,
            sourceType: 'OSM',
            isSurvey: true,
            isSurveyAsset: true,
            shape: 'rectangle',
            floors,
            units,
          });

          bldIdx++;
          placedInBlock++;
        }
      }
    });

    return buildings;
  };

  const areaSqM = Math.round(boxSizeMeters * boxSizeMeters);
  const areaHectares = (areaSqM / 10000).toFixed(2);

  return (
    <div className="space-y-3.5 select-none text-slate-200">
      {/* Header Banner */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-cyan-950/80 border border-emerald-500/40 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {t('datasurvey.osmSearch.bannerTitle')}
            </span>
          </div>
          <p className="text-[10px] text-slate-300 mt-0.5">
            {t('datasurvey.osmSearch.bannerDesc')}
          </p>
        </div>
        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/40">
          {t('datasurvey.osmSearch.puneBadge')}
        </span>
      </div>

      {/* Location Search */}
      <div className="space-y-1.5 relative" ref={searchBoxRef}>
        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
          <Search className="w-3 h-3 text-emerald-400" />
          <span>{t('datasurvey.osmSearch.label')}</span>
        </label>
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            onFocus={() => { if (searchResults.length > 0) setSearchOpen(true); }}
            placeholder={t('datasurvey.osmSearch.placeholder')}
            className="w-full bg-slate-900/70 border border-slate-700 rounded-lg pl-8 pr-16 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isSearching && <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />}
            {!isSearching && searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="p-1 text-slate-500 hover:text-slate-300 rounded transition-colors cursor-pointer"
                title="Clear"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <button
              type="submit"
              className="px-2 py-1 rounded-md bg-emerald-600/80 hover:bg-emerald-500 text-white text-[10px] font-bold transition-colors cursor-pointer"
            >
              {t('datasurvey.osmSearch.button')}
            </button>
          </div>
        </form>

        {searchOpen && (searchQuery.trim().length > 0) && (
          <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto bg-slate-900 border border-slate-700 rounded-lg shadow-xl">
            {isSearching ? (
              <div className="px-3 py-2 text-[11px] text-slate-400 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('datasurvey.osmSearch.searching')}
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((result, idx) => (
                <button
                  key={`${result.place_id || idx}`}
                  type="button"
                  onClick={() => handleSearchResultSelect(result)}
                  className="w-full text-left px-3 py-2 text-[11px] text-slate-200 hover:bg-emerald-950/60 border-b border-slate-800 last:border-b-0 transition-colors cursor-pointer flex items-start gap-2"
                >
                  <MapPin className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                  <span className="truncate">{result.display_name}</span>
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-[11px] text-slate-500">
                {t('datasurvey.osmSearch.noResults')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pune Zone Presets */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
          <Navigation className="w-3 h-3 text-emerald-400" />
          <span>{t('datasurvey.osmSearch.selectSector')}</span>
        </label>
        <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
          {PUNE_ZONES.map((zone) => {
            const isSel = selectedZone.id === zone.id;
            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => handleZoneSelect(zone)}
                className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSel
                    ? 'bg-emerald-950/70 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isSel ? 'text-emerald-200' : 'text-slate-200'}`}>
                    {zone.name}
                  </span>
                  {isSel && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
                </div>
                <span className="text-[9px] text-slate-400 mt-0.5 leading-tight">
                  {zone.id && ZONE_DESC_KEYS[zone.id] ? t(`datasurvey.osmSearch.zones.${ZONE_DESC_KEYS[zone.id]}`) : zone.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Leaflet OpenStreetMap Viewport */}
      <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500/50 shadow-[0_0_20px_rgba(0,0,0,0.8)] bg-slate-950">
        <div
          ref={mapContainerRef}
          className="w-full h-56 relative z-0"
          style={{ minHeight: '224px' }}
        />

        {/* Live Coordinate & Area HUD Overlay on Map */}
        <div className="absolute bottom-2 left-2 right-2 z-10 bg-slate-950/85 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-700/80 flex items-center justify-between text-[10px] font-mono">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">📍 {t('datasurvey.osmSearch.center')}:</span>
            <span className="text-slate-300">{centerCoord.lat.toFixed(4)}°N, {centerCoord.lng.toFixed(4)}°E</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-bold">📐 {t('datasurvey.osmSearch.area')}:</span>
            <span className="text-white font-bold">{boxSizeMeters}m × {boxSizeMeters}m ({areaHectares} ha)</span>
          </div>
        </div>

        {/* Map Instructions Pill */}
        <div className="absolute top-2 left-2 z-10 bg-slate-900/90 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] text-slate-300 border border-slate-700 pointer-events-none flex items-center gap-1">
          <span>🖱️ {t('datasurvey.osmSearch.clickToRecenter')}</span>
        </div>
      </div>

      {/* Area Size Slider */}
      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('datasurvey.osmSearch.boundaryExtent')}</span>
          </span>
          <span className="font-mono text-emerald-300 font-bold text-[11px]">
            {boxSizeMeters}m × {boxSizeMeters}m • {areaSqM.toLocaleString()} m²
          </span>
        </div>

        <input
          type="range"
          min="120"
          max="800"
          step="40"
          value={boxSizeMeters}
          onChange={(e) => setBoxSizeMeters(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />

        <div className="flex justify-between text-[9px] text-slate-500 font-mono">
          <span>120m</span>
          <span>240m ({t('datasurvey.osmSearch.sizeWard')})</span>
          <span>400m ({t('datasurvey.osmSearch.sizeTownship')})</span>
          <span>600m ({t('datasurvey.osmSearch.sizeSubCity')})</span>
          <span>800m ({t('datasurvey.osmSearch.sizeMega')})</span>
        </div>
      </div>

      {/* Main Action Button */}
      <button
        type="button"
        disabled={isFetchingOSM}
        onClick={fetchOsmBuildingsAndProject}
        className={`w-full py-3 px-4 rounded-xl text-xs font-extrabold text-white shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
          isFetchingOSM
            ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
            : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-[0_0_25px_rgba(16,185,129,0.45)] active:scale-98'
        }`}
      >
        {isFetchingOSM ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
            <span>{t('datasurvey.osmSearch.processing')}</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{t('datasurvey.osmSearch.projectBoundary')}</span>
          </>
        )}
      </button>

      {/* Status Progress Text */}
      {statusMessage && (
        <div className="text-center text-[10px] text-emerald-400 font-mono animate-pulse">
          {statusMessage}
        </div>
      )}

      {/* Success Notification Banner */}
      {generatedStats && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border-2 border-emerald-400 text-xs shadow-[0_0_20px_rgba(16,185,129,0.35)] space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between text-white font-bold">
            <span className="flex items-center gap-1.5">
              <span>✅</span>
              <span>{t('datasurvey.osmSearch.generated')}</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-300">{generatedStats.timestamp}</span>
          </div>

          {/* Data-source transparency: makes it explicit whether the 3D
              buildings/roads just generated are real OpenStreetMap geometry
              for this exact spot (will match the 2D map) or a procedural
              approximation (won't — same rough density, different layout). */}
          {generatedStats.dataSource === 'live' ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-900/60 border border-emerald-500/50 text-[10px] font-bold text-emerald-300">
              <span>🛰️</span>
              <span>{t('datasurvey.osmSearch.liveData')}</span>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 px-2 py-1 rounded-lg bg-amber-900/50 border border-amber-500/50 text-[10px] font-bold text-amber-300">
              <span className="flex items-center gap-1.5">
                <span>⚠️</span>
                <span>{t('datasurvey.osmSearch.proceduralData')}</span>
              </span>
              <button
                type="button"
                onClick={fetchOsmBuildingsAndProject}
                disabled={isFetchingOSM}
                className="shrink-0 px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-[9px] font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {t('datasurvey.osmSearch.retryLive')}
              </button>
            </div>
          )}

          <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-[9px] text-slate-500 block">{t('datasurvey.osmSearch.stat3dTowers')}</span>
              <span className="text-cyan-300 font-bold text-xs">{generatedStats.buildingCount}</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-[9px] text-slate-500 block">{t('datasurvey.osmSearch.stat3dRoads')}</span>
              <span className="text-yellow-400 font-bold text-xs">{generatedStats.roadCount || 4} {t('datasurvey.osmSearch.streets')}</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-[9px] text-slate-500 block">{t('datasurvey.osmSearch.statUlpinFloors')}</span>
              <span className="text-emerald-300 font-bold text-xs">{generatedStats.totalUnits} {t('datasurvey.osmSearch.units')}</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-[9px] text-slate-500 block">{t('datasurvey.osmSearch.statParcelArea')}</span>
              <span className="text-amber-300 font-bold text-xs">{generatedStats.hectares} ha</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-emerald-500/30">
            <span className="text-[10px] text-slate-300">
              {t('datasurvey.osmSearch.boundaryActive')}
            </span>
            <button
              type="button"
              onClick={() => setDataSurveyMode('sendMap')}
              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shadow flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap ml-2"
            >
              <Send className="w-3 h-3" />
              <span>{t('datasurvey.tabs.sendMap')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
