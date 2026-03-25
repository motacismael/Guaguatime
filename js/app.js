import { loadAllData } from './dataLoader.js';
import { findRoutes, rankRoutes } from './routeFinder.js';
import * as UI from './ui.js';

let appData = null;
let lastFoundRoutes = [];

async function init() {
    UI.initDOM();
    UI.setupDarkMode();

    try { appData = await loadAllData(); }
    catch (e) { console.error('[App]', e.message); return; }

    UI.renderSectores(appData.sectores);
    UI.renderCondiciones(appData.condiciones, handleConditionsChange);
    UI.setupSearch(appData.sectores);
    UI.setupSwap();
    UI.onSelectChange(() => UI.updateSearchButton());
    UI.onSearchClick(handleSearch);
    UI.onRankingChange(handleRankingChange);
    UI.renderFavorites();
    registerServiceWorker();
}

function handleSearch() {
    const { origen, destino } = UI.getSelectedValues();
    if (!origen || !destino || origen === destino) return;

    lastFoundRoutes = findRoutes(origen, destino, appData.rutas);
    const condiciones = getCondicionesActivas();
    UI.renderAlertBanner(condiciones);
    UI.renderResults(rankRoutes(lastFoundRoutes, UI.getActiveRanking(), condiciones), appData.sectores);
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function handleRankingChange(criterio) {
    if (lastFoundRoutes.length === 0) return;
    const condiciones = getCondicionesActivas();
    UI.renderResults(rankRoutes(lastFoundRoutes, criterio, condiciones), appData.sectores);
}

function handleConditionsChange() {
    const condiciones = getCondicionesActivas();
    UI.renderAlertBanner(condiciones);
    if (lastFoundRoutes.length > 0) {
        UI.renderResults(rankRoutes(lastFoundRoutes, UI.getActiveRanking(), condiciones), appData.sectores);
    }
}

function getCondicionesActivas() {
    const ids = UI.getActiveConditionIds();
    return appData.condiciones.filter(c => ids.includes(c.id));
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    }
}

document.addEventListener('DOMContentLoaded', init);
