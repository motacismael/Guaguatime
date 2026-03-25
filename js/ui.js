import { debounce, formatCurrency, formatTime } from './utils.js';
import { isFavorite, saveFavorite, removeFavorite, getFavorites } from './favorites.js';

const dom = {};

export function initDOM() {
    dom.inputOrigen = document.getElementById('input-origen');
    dom.selectOrigen = document.getElementById('select-origen');
    dom.inputDestino = document.getElementById('input-destino');
    dom.selectDestino = document.getElementById('select-destino');
    dom.btnSwap = document.getElementById('btn-swap');
    dom.btnSearch = document.getElementById('btn-search');
    dom.btnDarkMode = document.getElementById('btn-dark-mode');
    dom.conditionsGrid = document.getElementById('conditions-grid');
    dom.alertBanner = document.getElementById('alert-banner');
    dom.resultsSection = document.getElementById('results-section');
    dom.resultsMeta = document.getElementById('results-meta');
    dom.resultsGrid = document.getElementById('results-grid');
    dom.noResults = document.getElementById('no-results');
    dom.favoritesGrid = document.getElementById('favorites-grid');
    dom.favoritesEmpty = document.getElementById('favorites-empty');
}

export function renderSectores(sectores) {
    const sorted = [...sectores].sort((a, b) =>
        a.zona !== b.zona ? a.zona.localeCompare(b.zona) : a.nombre.localeCompare(b.nombre)
    );

    const buildOptions = (select) => {
        const zonas = {};
        sorted.forEach(s => { if (!zonas[s.zona]) zonas[s.zona] = []; zonas[s.zona].push(s); });

        Object.entries(zonas).forEach(([zona, sects]) => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = zona;
            sects.forEach(s => {
                const option = document.createElement('option');
                option.value = s.id;
                option.textContent = s.nombre;
                optgroup.appendChild(option);
            });
            select.appendChild(optgroup);
        });
    };

    buildOptions(dom.selectOrigen);
    buildOptions(dom.selectDestino);
}

export function renderCondiciones(condiciones, onChange) {
    dom.conditionsGrid.innerHTML = '';
    condiciones.forEach(cond => {
        const label = document.createElement('label');
        label.className = 'condition-chip';
        label.style.setProperty('--chip-color', cond.color);
        if (cond.activo_por_defecto) label.classList.add('is-active');

        label.innerHTML = `
            <input type="checkbox" value="${cond.id}" ${cond.activo_por_defecto ? 'checked' : ''}>
            <span class="condition-chip__indicator">${cond.activo_por_defecto ? '✓' : ''}</span>
            <span>${cond.nombre}</span>
        `;

        label.querySelector('input').addEventListener('change', (e) => {
            label.classList.toggle('is-active', e.target.checked);
            label.querySelector('.condition-chip__indicator').textContent = e.target.checked ? '✓' : '';
            onChange();
        });

        dom.conditionsGrid.appendChild(label);
    });
}

export function getActiveConditionIds() {
    const checkboxes = dom.conditionsGrid.querySelectorAll('input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value).filter(id => id !== 'normal');
}

export function renderAlertBanner(condicionesActivas) {
    if (condicionesActivas.length === 0) { dom.alertBanner.hidden = true; return; }

    const principal = condicionesActivas.reduce((max, c) =>
        c.modificador_tiempo_pct > max.modificador_tiempo_pct ? c : max
    );

    dom.alertBanner.hidden = false;
    dom.alertBanner.className = `alert-banner alert-banner--${principal.id}`;
    dom.alertBanner.querySelector('.alert-banner__icon').textContent = principal.nombre.split(' ')[0];
    dom.alertBanner.querySelector('.alert-banner__text').textContent =
        `${principal.nombre.replace(/^[^\s]+\s/, '')} activa — Tiempo +${condicionesActivas.reduce((s, c) => s + c.modificador_tiempo_pct, 0)}%`
        + (condicionesActivas.some(c => c.cargo_extra > 0)
            ? ` · Cargo extra +${formatCurrency(condicionesActivas.reduce((s, c) => s + c.cargo_extra, 0))}`
            : '');
}

function getTypeColor(tipo) {
    return { concho: 'var(--c-concho)', guagua: 'var(--c-guagua)', motoconcho: 'var(--c-moto)', mixto: 'var(--c-mixto)' }[tipo] || 'var(--primary)';
}

export function renderResults(rutas, sectores) {
    const sectorMap = {};
    sectores.forEach(s => sectorMap[s.id] = s.nombre);

    if (rutas.length === 0) {
        dom.resultsSection.hidden = false;
        dom.resultsGrid.innerHTML = '';
        dom.noResults.hidden = false;
        dom.resultsMeta.textContent = '';
        return;
    }

    dom.noResults.hidden = true;
    dom.resultsSection.hidden = false;
    dom.resultsMeta.textContent = `${rutas.length} ruta${rutas.length > 1 ? 's' : ''} encontrada${rutas.length > 1 ? 's' : ''}`;

    dom.resultsGrid.innerHTML = rutas.map((ruta, index) => {
        const isBest = index === 0;
        const fav = isFavorite(ruta.id);

        const segmentsHTML = ruta.tramos.map((tramo, i) => {
            const parts = [];
            if (i === 0) parts.push(`<span class="route-card__segment">${sectorMap[tramo.desde] || tramo.desde}</span>`);
            parts.push(`<span class="route-card__arrow">→</span>`);
            parts.push(`<span class="route-card__segment">${sectorMap[tramo.hasta] || tramo.hasta}</span>`);
            return parts.join('');
        }).join('');

        return `
            <article class="route-card ${isBest ? 'route-card--best' : ''}" role="listitem"
                     style="--card-accent: ${getTypeColor(ruta.tipo)}">
                <div class="route-card__header">
                    <div class="route-card__info">
                        <span class="route-card__type">${ruta.icono} ${ruta.tipo}</span>
                        <h3 class="route-card__name">${ruta.nombre}</h3>
                    </div>
                    <button class="btn--favorite ${fav ? 'is-saved' : ''}"
                            data-route-id="${ruta.id}"
                            aria-label="${fav ? 'Quitar de favoritos' : 'Guardar como favorito'}">
                        ${fav ? '⭐' : '☆'}
                    </button>
                </div>
                <div class="route-card__stats">
                    <div class="route-card__stat">
                        <span class="route-card__stat-value">${formatTime(ruta.tiempo)}</span>
                        <span class="route-card__stat-label">Tiempo</span>
                    </div>
                    <div class="route-card__stat">
                        <span class="route-card__stat-value">${formatCurrency(ruta.costo)}</span>
                        <span class="route-card__stat-label">Costo</span>
                    </div>
                    <div class="route-card__stat">
                        <span class="route-card__stat-value">${ruta.transbordos}</span>
                        <span class="route-card__stat-label">Transbordos</span>
                    </div>
                </div>
                <div class="route-card__segments">${segmentsHTML}</div>
            </article>`;
    }).join('');

    dom.resultsGrid.querySelectorAll('.btn--favorite').forEach(btn => {
        btn.addEventListener('click', () => {
            const routeId = btn.dataset.routeId;
            const ruta = rutas.find(r => r.id === routeId);
            if (!ruta) return;

            if (isFavorite(routeId)) {
                removeFavorite(routeId);
                btn.textContent = '☆';
                btn.classList.remove('is-saved');
            } else {
                saveFavorite(ruta);
                btn.textContent = '⭐';
                btn.classList.add('is-saved');
            }
            renderFavorites();
        });
    });
}

export function renderFavorites() {
    const favorites = getFavorites();
    if (favorites.length === 0) { dom.favoritesGrid.innerHTML = ''; dom.favoritesEmpty.hidden = false; return; }

    dom.favoritesEmpty.hidden = true;
    dom.favoritesGrid.innerHTML = favorites.map(fav => `
        <div class="favorite-card" role="listitem">
            <div class="favorite-card__info">
                <div class="favorite-card__name">${fav.icono} ${fav.nombre}</div>
                <div class="favorite-card__meta">
                    ${formatTime(fav.tiempo)} · ${formatCurrency(fav.costo)} · ${fav.transbordos} transbordo${fav.transbordos !== 1 ? 's' : ''}
                </div>
            </div>
            <button class="btn btn--remove-fav" data-fav-id="${fav.id}">✕ Eliminar</button>
        </div>
    `).join('');

    dom.favoritesGrid.querySelectorAll('.btn--remove-fav').forEach(btn => {
        btn.addEventListener('click', () => { removeFavorite(btn.dataset.favId); renderFavorites(); });
    });
}

export function setupSearch(sectores) {
    const filterSelect = (input, select) => {
        const query = input.value.toLowerCase().trim();
        select.querySelectorAll('option').forEach(opt => {
            if (!opt.value) return;
            opt.style.display = !query || opt.textContent.toLowerCase().includes(query) ? '' : 'none';
        });
        select.querySelectorAll('optgroup').forEach(og => {
            og.style.display = og.querySelectorAll('option:not([style*="display: none"])').length > 0 ? '' : 'none';
        });
    };

    dom.inputOrigen.addEventListener('input', debounce(() => filterSelect(dom.inputOrigen, dom.selectOrigen)));
    dom.inputDestino.addEventListener('input', debounce(() => filterSelect(dom.inputDestino, dom.selectDestino)));
}

export function setupSwap() {
    dom.btnSwap.addEventListener('click', () => {
        [dom.selectOrigen.value, dom.selectDestino.value] = [dom.selectDestino.value, dom.selectOrigen.value];
        [dom.inputOrigen.value, dom.inputDestino.value] = [dom.inputDestino.value, dom.inputOrigen.value];
        updateSearchButton();
    });
}

export function updateSearchButton() {
    const o = dom.selectOrigen.value, d = dom.selectDestino.value;
    dom.btnSearch.disabled = !(o && d && o !== d);
}

export function setupDarkMode() {
    const iconSun = dom.btnDarkMode.querySelector('.icon-sun');
    const iconMoon = dom.btnDarkMode.querySelector('.icon-moon');

    if (localStorage.getItem('guaguatime_darkmode') === 'true') {
        document.body.classList.add('dark-mode');
        iconSun.style.display = 'none';
        iconMoon.style.display = '';
    }

    dom.btnDarkMode.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-mode');
        iconSun.style.display = isDark ? 'none' : '';
        iconMoon.style.display = isDark ? '' : 'none';
        localStorage.setItem('guaguatime_darkmode', isDark);
    });
}

export function getSelectedValues() {
    return { origen: dom.selectOrigen.value, destino: dom.selectDestino.value };
}

export function onSelectChange(cb) {
    dom.selectOrigen.addEventListener('change', cb);
    dom.selectDestino.addEventListener('change', cb);
}

export function onSearchClick(cb) { dom.btnSearch.addEventListener('click', cb); }

export function onRankingChange(cb) {
    document.querySelectorAll('[data-sort]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-sort]').forEach(b => { b.classList.remove('btn--active'); b.setAttribute('aria-pressed', 'false'); });
            btn.classList.add('btn--active');
            btn.setAttribute('aria-pressed', 'true');
            cb(btn.dataset.sort);
        });
    });
}

export function getActiveRanking() {
    const active = document.querySelector('[data-sort].btn--active');
    return active ? active.dataset.sort : 'tiempo';
}
