import * as React from "react";
import { useEffect } from "react";

export function usePrevious<T>(value: T) {
    const ref = React.useRef<T>();
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
}

