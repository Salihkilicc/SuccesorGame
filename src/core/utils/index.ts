export const formatScreenTitle = (title: string) => title.trim();
export { getRandomEvent } from './randomEvent';

export const formatMoney = (value: number): string => {
    const abs = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (abs >= 1_000_000_000_000) {
        return `${sign}$${(abs / 1_000_000_000_000).toFixed(1)}T`;
    }
    if (abs >= 1_000_000_000) {
        return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`;
    }
    if (abs >= 1_000_000) {
        return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
    }
    if (abs >= 1_000) {
        return `${sign}$${(abs / 1_000).toFixed(1)}k`;
    }
    return `${sign}$${abs.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
};
