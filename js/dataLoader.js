async function loadJSON(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Error cargando ${path}: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`[DataLoader] ${error.message}`);
        return null;
    }
}

export async function loadAllData() {
    const [sectores, rutas, condiciones] = await Promise.all([
        loadJSON('data/sectores.json'),
        loadJSON('data/rutas.json'),
        loadJSON('data/condiciones.json')
    ]);

    if (!sectores || !rutas || !condiciones) {
        throw new Error('No se pudieron cargar los datos.');
    }

    return { sectores, rutas, condiciones };
}
