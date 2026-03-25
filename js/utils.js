export function debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

export function formatCurrency(value) {
    return `RD$ ${Math.round(value)}`;
}

export function formatTime(minutes) {
    const rounded = Math.round(minutes);
    if (rounded >= 60) {
        const h = Math.floor(rounded / 60);
        const m = rounded % 60;
        return m > 0 ? `${h}h ${m}min` : `${h}h`;
    }
    return `${rounded} min`;
}

export function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
