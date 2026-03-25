const STORAGE_KEY = 'guaguatime_favorites';

export function getFavorites() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

export function saveFavorite(route) {
    const favorites = getFavorites();
    if (favorites.some(f => f.id === route.id)) return false;

    favorites.push({
        id: route.id, nombre: route.nombre, tipo: route.tipo,
        icono: route.icono, tiempo: route.tiempo, costo: route.costo,
        transbordos: route.transbordos, savedAt: new Date().toISOString()
    });

    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites)); return true; }
    catch { return false; }
}

export function removeFavorite(routeId) {
    let favorites = getFavorites();
    const len = favorites.length;
    favorites = favorites.filter(f => f.id !== routeId);
    if (favorites.length === len) return false;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites)); return true; }
    catch { return false; }
}

export function isFavorite(routeId) {
    return getFavorites().some(f => f.id === routeId);
}
