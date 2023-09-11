// https://iquilezles.org/www/articles/fbm/fbm.htm
// https://www.shadertoy.com/view/XdXGW8

export const FBM = `
vec2 grad(ivec2 z)  // replace this anything that returns a random vector
{
    // 2D to 1D (feel free to replace by some other)
    int n = z.x + z.y * 11111;

    // Hugo Elias hash (feel free to replace by another one)
    n = (n << 13) ^ n;
    n = (n * (n * n * 15731 + 789221) + 1376312589) >> 16;

    // simple random vectors
    return vec2(cos(float(n)), sin(float(n)));
}

float noise(vec2 p)
{
    ivec2 i = ivec2(floor(p));
    vec2 f = fract(p);

    vec2 u = f * f * (3.0 - 2.0 * f); // feel free to replace by a quintic smoothstep instead
    ivec2 oi = ivec2(0, 1);
    vec2 of = vec2(oi);

    return mix(mix(dot(grad(i + oi.xx), f - of.xx),
                   dot(grad(i + oi.yx), f - of.yx), u.x),
               mix(dot(grad(i + oi.xy), f - of.xy),
                   dot(grad(i + oi.yy), f - of.yy), u.x), u.y)
        * 0.5 + 0.5;
}

float fbm(vec2 p, int numOctaves, float scale, float lacunarity)
{
    float t = 0.0;
    float z = 1.0;
    for (int i = 0; i < numOctaves; ++i)
    {
        z *= 0.5;
        t += z * noise(p * scale);
        p = p * lacunarity;
    }

    return t / (1.0 - z);
}
`;
