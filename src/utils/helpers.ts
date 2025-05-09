import {type BoardConfiguration} from "~/components/Types";
import {ulid} from 'ulidx';

export const uniqueId = function (prefix?: string) {
    if (prefix != undefined) return `${prefix}-${ulid()}`;
    return `id-${ulid()}`;
};

export function getUserIdFromSessionStorage() {
    let userId: string;
    if (typeof window !== 'undefined') {
        const sessionUserId = sessionStorage.getItem('userId');
        userId = sessionUserId ?? uniqueId('user');
        if (sessionUserId !== userId)
            sessionStorage.setItem('userId', userId);
        return userId;
    }
}

export function getRandomIntInclusive(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min); // The maximum is inclusive and the minimum is inclusive
}

export function isPointerEvent(event: Event): event is PointerEvent {
    return event instanceof PointerEvent;
}

export function isEventTarget(element: EventTarget | HTMLDivElement): element is EventTarget {
    return element instanceof EventTarget;
}

export function isHTMLDivElement(element: EventTarget): element is HTMLDivElement {
    return element instanceof HTMLDivElement;
}

export function assert(condition: unknown, msg?: string): asserts condition {
    if (condition === false) throw new Error(msg)
}

export const sleep = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay))



export function isOverlapping(element1: HTMLElement, element2: HTMLElement, threshold: number): boolean {
    const rect1 = element1.getBoundingClientRect();
    const rect2 = element2.getBoundingClientRect();

    // Calculate the area of overlap.
    const overlappingArea = (rect1.top < rect2.bottom ? rect1.bottom - rect2.top : 0) *
        (rect1.left < rect2.right ? rect1.right - rect2.left : 0);

    // Calculate the total area of both elements.
    const totalArea = rect1.width * rect1.height + rect2.width * rect2.height;

    // Calculate the percentage of overlap.
    const overlapPercentage = overlappingArea / totalArea * 100;

    // Return true if the percentage of overlap is greater than or equal to the threshold.
    return overlapPercentage >= threshold;
}

export function safeStringToInt(str: string): number | typeof NaN {
    // Trim the string to remove leading and trailing whitespace.
    str = str.trim();

    // If the string is empty, return NaN.
    if (str === '') {
        return NaN;
    }

    // Try to parse the string as an integer. If the parse fails, return NaN.
    const num = parseInt(str, 10);
    if (isNaN(num)) {
        return NaN;
    }

    // Return the parsed integer.
    return num;
}

function cloneMap<K, V>(map: Map<K, V>): Map<K, V> {
    const newMap = new Map<K, V>();
    for (const [key, value] of map.entries()) {
        newMap.set(key, value);
    }
    return newMap;
}
/**
 *
 * @param array An array
 * @param index1 The first index
 * @param index2 The second index
 * @returns A new array
 */
export function swap<T>(array: T[], index1: number, index2: number) {
    const newArray = array.slice();
    const value1 = newArray[index1];
    const value2 = newArray[index2];
    if (value1 == undefined || value2 == undefined) throw new Error('Index out of range');
    newArray.splice(index1, 1, value2);
    newArray.splice(index2, 1, value1);
    return newArray;
}

export function swapCells(board: BoardConfiguration, cell1: number, cell2: number) {
    /* const newMap: BoardConfiguration = cloneMap(map);
    const value1 = map.get(cell1);
    const value2 = map.get(cell2);

    if (value1 == undefined || value2 == undefined) throw new Error('Map does not contain index');
    newMap.set(cell1, value2);
    newMap.set(cell2, value1);

    return newMap; */
    const boardCopy = board.slice();
    boardCopy.map(x => {
        if (x.cellId === cell1) { x.cellId = cell2 }
        else if (x.cellId === cell2) { x.cellId = cell1 }
        return x;
    })
    return boardCopy;

}

// moved from src/utils/api.ts because nextjs route handler was crashing on import
export const getBaseUrl = () => {
    if (typeof window !== "undefined") return ""; // browser should use relative url
    // need to look at VERCEL_ENV. VERCEL_URL is used in vercel dev since serverless functions are vercel-simulated
    if (process.env.VERCEL_ENV === "development") return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
    throw new Error('VERCEL_URL env var not set and you are in production/preview');
}