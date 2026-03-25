import { calcularRuta } from './calculator.js';

export function findRoutes(origenId, destinoId, todasLasRutas) {
    if (!origenId || !destinoId || origenId === destinoId) return [];

    return todasLasRutas.filter(ruta => {
        if (!ruta.tramos || ruta.tramos.length === 0) return false;
        const primero = ruta.tramos[0];
        const ultimo = ruta.tramos[ruta.tramos.length - 1];
        return primero.desde === origenId && ultimo.hasta === destinoId;
    });
}

export function rankRoutes(rutas, criterio = 'tiempo', condicionesActivas = []) {
    const rutasConStats = rutas.map(ruta => ({
        ...ruta,
        ...calcularRuta(ruta, condicionesActivas)
    }));

    rutasConStats.sort((a, b) => {
        switch (criterio) {
            case 'costo': return a.costo - b.costo;
            case 'transbordos': return a.transbordos - b.transbordos || a.tiempo - b.tiempo;
            default: return a.tiempo - b.tiempo;
        }
    });

    return rutasConStats;
}
