export const {
    PI,
    abs,
    sin,
    cos,
    tan,
    atan2,
    ceil,
    floor,
    round,
    sqrt,
    hypot,
    sign,
    min,
    max,
    pow,
    log2,
    random,
    imul
} = Math;

export const HalfPI = PI / 2;
export const NegHalfPI = -HalfPI;
export const ThreeHalfPI = HalfPI * 3;
export const TwoPI = PI * 2;

export const RandRange = (min: number, max: number) => random() * (min - max) + min;

export function Lerp(a: number, b: number, t: number)
{
    return a + (b - a) * t;
}

export function Unlerp(a: number, b: number, x: number)
{
    return (x - a) / (b - a);
}

export function Clamp(x: number, a: number, b: number)
{
    return x < a ? a : (x > b ? b : x);
}

export function Fract(x: number)
{
    return x - floor(x);
}

export function Smoothstep(edge0: number, edge1: number, x: number)
{
    const t = Clamp(Unlerp(edge0, edge1, x), 0, 1);
    return t * t * (3 - 2 * t);
}
