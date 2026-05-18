import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap, LayersControl } from "react-leaflet";
import { FaPhone, FaRoute, FaCar, FaWalking, FaMotorcycle, FaTimes, FaLocationArrow } from "react-icons/fa";
import { MdMyLocation, MdLocalHospital, MdNavigation } from "react-icons/md";
import { getNearbyBloodBanks as getHospitalNearbyBanks } from "../../services/hospitalService";
import { fetchRoute, calculateDistance, toLeaflet, formatDuration, watchUserLocation } from "../../services/mapService";
import toast from "react-hot-toast";

const FitBounds = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(positions, { padding: [50, 50], maxZoom: 14 });
    }
  }, [positions, map]);
  return null;
};

const RecenterMap = ({ position, active }) => {
  const map = useMap();
  useEffect(() => {
    if (active && position) {
      map.setView(position, map.getZoom(), { animate: true });
    }
  }, [position, active, map]);
  return null;
};

const HospitalMap = () => {
  const [hospitalPos, setHospitalPos] = useState(null);
  const [livePos, setLivePos] = useState(null); // live GPS position
  const [banks, setBanks] = useState([]);
  const [routeLine, setRouteLine] = useState(null);
  const [loading, setLoading] = useState(true);

  // Navigation state
  const [navActive, setNavActive] = useState(false);
  const [navDestination, setNavDestination] = useState(null);
  const [navDestName, setNavDestName] = useState("");
  const [navMode, setNavMode] = useState("car");
  const [navDistance, setNavDistance] = useState(null);
  const [navDuration, setNavDuration] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [followUser, setFollowUser] = useState(true);

  const watchIdRef = useRef(null);
  const recalcRouteRef = useRef(null);

  useEffect(() => {
    loadMapData();
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (recalcRouteRef.current) clearInterval(recalcRouteRef.current);
    };
  }, []);

  // Recalculate route when mode changes during active navigation
  useEffect(() => {
    const currentPos = livePos || hospitalPos;
    if (navActive && navDestination && currentPos) {
      calculateRoute(currentPos, navDestination, navMode);
    }
  }, [navMode]);

  const loadMapData = async () => {
    setLoading(true);
    try {
      const banksRes = await getHospitalNearbyBanks();
      if (banksRes.success) {
        setBanks(banksRes.bloodBanks || []);
        if (banksRes.hospitalLocation?.coordinates) {
          const pos = toLeaflet(banksRes.hospitalLocation.coordinates);
          setHospitalPos(pos);
          setLivePos(pos);
        }
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load map data");
    } finally {
      setLoading(false);
    }
  };

  const calculateRoute = async (from, to, mode) => {
    setRouteLoading(true);
    try {
      const result = await fetchRoute(from, to, mode);
      if (result) {
        setRouteLine(result.route);
        setNavDistance(result.distance);
        setNavDuration(result.duration);
      } else {
        setRouteLine([from, to]);
        const dist = calculateDistance(from, to);
        setNavDistance(parseFloat(dist));
        const speeds = { car: 40, bike: 25, walk: 5 };
        setNavDuration(Math.ceil((parseFloat(dist) / speeds[mode]) * 60));
      }
    } catch {
      setRouteLine([from, to]);
    } finally {
      setRouteLoading(false);
    }
  };

  const startNavigation = (destCoords, destName) => {
    const currentPos = livePos || hospitalPos;
    if (!currentPos) return;

    setNavActive(true);
    setNavDestination(destCoords);
    setNavDestName(destName);
    setFollowUser(true);
    calculateRoute(currentPos, destCoords, navMode);

    // Start live GPS tracking
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);

    watchIdRef.current = watchUserLocation(
      (newPos) => {
        setLivePos(newPos);
        if (destCoords) {
          const dist = calculateDistance(newPos, destCoords);
          setNavDistance(parseFloat(dist));
          const speeds = { car: 40, bike: 25, walk: 5 };
          setNavDuration(Math.ceil((parseFloat(dist) / speeds[navMode]) * 60));
        }
      },
      () => toast.error("Location tracking lost")
    );

    // Recalculate actual route every 30 seconds
    if (recalcRouteRef.current) clearInterval(recalcRouteRef.current);
    recalcRouteRef.current = setInterval(() => {
      if (livePos && destCoords) calculateRoute(livePos, destCoords, navMode);
    }, 30000);

    toast.success("Navigation started! 🧭");
  };

  const stopNavigation = () => {
    setNavActive(false);
    setNavDestination(null);
    setNavDestName("");
    setRouteLine(null);
    setNavDistance(null);
    setNavDuration(null);
    setFollowUser(false);
    if (watchIdRef.current !== null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
    if (recalcRouteRef.current) { clearInterval(recalcRouteRef.current); recalcRouteRef.current = null; }
    toast("Navigation stopped", { icon: "🛑" });
  };

  const modeConfig = [
    { key: "car", icon: <FaCar />, label: "Car" },
    { key: "bike", icon: <FaMotorcycle />, label: "Bike" },
    { key: "walk", icon: <FaWalking />, label: "Walk" },
  ];
  const routeColors = { car: "#4285F4", bike: "#FF9800", walk: "#4CAF50" };

  const currentPos = livePos || hospitalPos;

  const allPositions = [
    ...(currentPos ? [currentPos] : []),
    ...banks.filter((b) => b.location?.coordinates).map((b) => toLeaflet(b.location.coordinates)),
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Loading map...</p>
        </div>
      </div>
    );
  }

  if (!currentPos) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border max-w-md">
          <MdLocalHospital className="text-5xl text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Location Not Set</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Please set your hospital location in the Profile page to use the map.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Hospital Map</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Nearby Blood Banks within 50km</p>
        </div>
        <button
          onClick={() => { stopNavigation(); loadMapData(); }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all"
        >
          <MdMyLocation /> Refresh
        </button>
      </div>

      {/* Navigation Panel */}
      {navActive && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MdNavigation className="text-xl animate-pulse" />
              <div>
                <p className="text-xs opacity-80">Navigating to</p>
                <p className="font-bold text-sm">{navDestName}</p>
              </div>
            </div>
            <button onClick={stopNavigation} className="p-2 bg-white dark:bg-gray-800/20 rounded-lg hover:bg-white dark:hover:bg-gray-700/30 transition-all">
              <FaTimes />
            </button>
          </div>
          <div className="px-4 py-3 flex items-center gap-4 sm:gap-6 border-b border-gray-200 dark:border-gray-700">
            <div className="text-center flex-1">
              <p className="text-2xl font-black text-gray-800 dark:text-gray-200">{routeLoading ? "..." : navDistance !== null ? `${navDistance}` : "--"}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase">km remaining</p>
            </div>
            <div className="w-px h-10 bg-gray-200 dark:bg-gray-700"></div>
            <div className="text-center flex-1">
              <p className="text-2xl font-black text-blue-600">{routeLoading ? "..." : navDuration !== null ? formatDuration(navDuration) : "--"}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase">est. arrival</p>
            </div>
          </div>
          <div className="px-4 py-2 grid grid-cols-3 gap-2">
            {modeConfig.map((m) => (
              <button key={m.key} onClick={() => setNavMode(m.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${navMode === m.key ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"}`}>
                {m.icon} {m.label}
              </button>
            ))}
          </div>
          <div className="px-4 pb-3 pt-1">
            <button onClick={() => setFollowUser(!followUser)}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${followUser ? "bg-green-50 dark:bg-green-900/25 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700" : "bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700"}`}>
              <FaLocationArrow className={followUser ? "text-green-500" : ""} />
              {followUser ? "Live Tracking ON" : "Live Tracking OFF"}
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      {!navActive && (
        <div className="flex flex-wrap gap-3 sm:gap-4 bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <span className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-400">
            <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span> Your Hospital
          </span>
          <span className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-400">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span> Blood Banks ({banks.length})
          </span>
        </div>
      )}

      {/* Map */}
      <div className={`relative z-0 rounded-3xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 ${navActive ? "h-[45vh] sm:h-[50vh]" : "h-[52vh] sm:h-[65vh]"}`}>
        <MapContainer className="themed-leaflet-map" center={currentPos} zoom={12} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Street">
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satellite">
              <TileLayer attribution='&copy; <a href="https://www.esri.com">Esri</a>' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Terrain">
              <TileLayer attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a>' url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" />
            </LayersControl.BaseLayer>
          </LayersControl>

          {!navActive && <FitBounds positions={allPositions} />}
          <RecenterMap position={currentPos} active={navActive && followUser} />

          {/* Hospital / User location */}
          <CircleMarker center={currentPos} radius={navActive ? 8 : 12}
            pathOptions={{ fillColor: "#22c55e", color: navActive ? "#16a34a" : "#fff", weight: navActive ? 4 : 3, fillOpacity: 1 }}>
            <Popup><div className="text-center font-bold text-gray-800 dark:text-gray-200">🏥 Your Hospital</div></Popup>
          </CircleMarker>
          {navActive && (
            <CircleMarker center={currentPos} radius={20}
              pathOptions={{ fillColor: "#22c55e", color: "#22c55e", weight: 1, fillOpacity: 0.15, opacity: 0.3 }} />
          )}

          {/* Destination marker */}
          {navActive && navDestination && (
            <CircleMarker center={navDestination} radius={10}
              pathOptions={{ fillColor: "#ef4444", color: "#fff", weight: 3, fillOpacity: 1 }}>
              <Popup><div className="text-center font-bold text-gray-800 dark:text-gray-200">📍 {navDestName}</div></Popup>
            </CircleMarker>
          )}

          {/* Blood Banks — hidden during navigation */}
          {!navActive && banks.map((bank) => {
            const pos = toLeaflet(bank.location?.coordinates);
            const dist = calculateDistance(currentPos, pos);
            const totalStock = Object.values(bank.stockSummary || {}).reduce((a, b) => a + b, 0);

            return (
              <CircleMarker key={bank._id} center={pos} radius={8} pathOptions={{ fillColor: "#ef4444", color: "#fff", weight: 2, fillOpacity: 0.9 }}>
                <Popup>
                  <div className="min-w-[250px]">
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-1">{bank.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{bank.address?.city}, {bank.address?.state}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">📞 {bank.phone}</p>
                    <p className="text-xs font-bold text-blue-600 mb-1">📏 {dist} km away</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {bank.is24x7 ? "🟢 Open 24x7" : `⏰ ${bank.operatingHours?.open} - ${bank.operatingHours?.close}`}
                    </p>

                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Stock ({totalStock} units)</p>
                      <div className="grid grid-cols-4 gap-1 text-[10px] text-center">
                        {Object.entries(bank.stockSummary || {}).map(([group, units]) => (
                          <span key={group} className={`px-1 py-0.5 rounded ${units > 0 ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" : "bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-300"}`}>
                            {group}: {units}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Transport mode picker */}
                    <div className="flex gap-1 mt-2 mb-2">
                      {modeConfig.map((m) => (
                        <button key={m.key} onClick={() => setNavMode(m.key)}
                          className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[10px] font-bold ${navMode === m.key ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}>
                          {m.icon}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => startNavigation(pos, bank.name)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700">
                        <FaRoute /> Navigate
                      </button>
                      <a href={`tel:${bank.phone}`}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700">
                        <FaPhone /> Call
                      </a>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* Route line */}
          {routeLine && (
            <Polyline positions={routeLine}
              pathOptions={{ color: routeColors[navMode] || "#4285F4", weight: 5, opacity: 0.85, lineCap: "round", lineJoin: "round" }} />
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default HospitalMap;
