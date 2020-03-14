export function last<T>(array: T[]): T | undefined {
    return array[array.length - 1];
}

export function sleep(timeMs: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        setTimeout(resolve, timeMs)
    })
}

// Use as filter
export function dedupe<T>(value: T, index: number, array: T[]) {
    return array.indexOf(value) === index;
}
