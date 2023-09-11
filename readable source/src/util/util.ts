import { imul } from "./math.js";

export function FloatPixelsRGBAToUint8RGBA(pixels: Float32Array)
{
    // short but slow version
    // return Uint8ClampedArray.from(pixels, p => p * 255);

    // faster version

    const resultPixels = new Uint8ClampedArray(pixels.length);
    for (let i = 0; i < pixels.length; ++i)
    {
        resultPixels[i] = pixels[i] * 255;
    }

    return resultPixels;
}

export function Uint8PixelsRGBAToFloatRGBA(pixels: Uint8ClampedArray)
{
    // short but slow version
    // return Float32Array.from(pixels, p => p / 255);

    // faster version

    const resultPixels = new Float32Array(pixels.length);
    for (let i = 0; i < pixels.length; ++i)
    {
        resultPixels[i] = pixels[i] / 255;
    }

    return resultPixels;
}

export function HexToColor(hex: string)
{
    const r = Number.parseInt(hex.substring(0, 2), 16) / 255;
    const g = Number.parseInt(hex.substring(2, 4), 16) / 255;
    const b = Number.parseInt(hex.substring(4, 6), 16) / 255;

    return { r, g, b, a: 1 };
}

export function HexToColorArrayRGB(hex: string): [number, number, number]
{
    const r = Number.parseInt(hex.substring(0, 2), 16) / 255;
    const g = Number.parseInt(hex.substring(2, 4), 16) / 255;
    const b = Number.parseInt(hex.substring(4, 6), 16) / 255;

    return [r, g, b];
}

export function Mulberry32(seed: number)
{
    return () =>
    {
        let t = seed += 0x6D2B79F5;
        t = imul(t ^ t >>> 15, t | 1);
        t ^= t + imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

export type FixedLengthArray<T, L extends number, TObj = [T, ...Array<T>]> =
    Pick<TObj, Exclude<keyof TObj, 'splice' | 'push' | 'pop' | 'shift' | 'unshift'>> & {
        readonly length: L
        [I: number]: T
        [Symbol.iterator]: () => IterableIterator<T>
    };
