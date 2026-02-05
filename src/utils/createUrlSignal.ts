import { Signal, createSignal, createEffect } from "solid-js";
import { useSearchParams } from "@solidjs/router";

/**
 * Stores the value in the URL (query string) and updates it when the value changes.
 */
export function createUrlSignal<T>(initialValue: T, name: string): Signal<T> {
    const [searchParams, setSearchParams] = useSearchParams();
    
    let setValue = initialValue;
    const paramValue = searchParams[name];
    
    if (paramValue !== undefined) {
        if (typeof initialValue === "string") {
            setValue = (Array.isArray(paramValue) ? paramValue[0] : paramValue) as T;
        } else if (typeof initialValue === "number") {
            const strValue = Array.isArray(paramValue) ? paramValue[0] : paramValue;
            setValue = Number(strValue) as T;
        } else {
            throw new Error("Unsupported type");
        }
    }
    
    const [getter, setter] = createSignal(setValue, {
        name,
    });
    
    createEffect(() => {
        const v = getter();
        if (v !== initialValue && v !== "") {
            setSearchParams({ [name]: "" + v });
        } else {
            setSearchParams({ [name]: undefined });
        }
    });
    
    return [getter, setter];
}
