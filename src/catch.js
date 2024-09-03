import { deepcopy } from "./deep";

const cache = [];

export function getCache() {
    return deepcopy(cache);
}

export function addCache(data) {
    cache.push(data);  
}

export function clearCache() {
    cache.length = 0;
}
