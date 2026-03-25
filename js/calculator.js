// Tiempo = Σ tiempo_min × (1 + tiempo_pct/100) × (1 + Σ condicion_pct/100) → redondeado
// Costo  = Σ costo_base + (num_tramos × Σ cargo_extra)

export function calcularTiempo(tramos, condicionesActivas = []) {
    const totalModificador = condicionesActivas.reduce((sum, c) => sum + (c.modificador_tiempo_pct || 0), 0);

    const tiempoTotal = tramos.reduce((total, tramo) => {
        const tiempoBase = tramo.tiempo_min * (1 + tramo.tiempo_pct / 100);
        return total + tiempoBase * (1 + totalModificador / 100);
    }, 0);

    return Math.round(tiempoTotal);
}

export function calcularCosto(tramos, condicionesActivas = []) {
    const costoBase = tramos.reduce((total, tramo) => total + tramo.costo, 0);
    const cargoExtra = condicionesActivas.reduce((sum, c) => sum + (c.cargo_extra || 0), 0);
    return costoBase + (tramos.length * cargoExtra);
}

export function calcularRuta(ruta, condicionesActivas = []) {
    return {
        tiempo: calcularTiempo(ruta.tramos, condicionesActivas),
        costo: calcularCosto(ruta.tramos, condicionesActivas),
        transbordos: ruta.transbordos || 0
    };
}
