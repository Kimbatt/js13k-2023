// https://iquilezles.org/www/articles/smoothvoronoi/smoothvoronoi.htm

// yzw - cell color, x - distance to cell
export const Voronoi = `
vec4 voronoi(vec2 x, float w)
{
    vec2 n = floor(x);
    vec2 f = fract(x);

    vec4 m = vec4(8.0, 0.0, 0.0, 0.0);
    for (int j = -2; j <= 2; ++j)
    for (int i = -2; i <= 2; ++i)
    {
        vec2 g = vec2(i, j);
        vec2 o = hash2(n + g);

        // distance to cell
        float d = length(g - f + o);

        // cell color
        vec3 col = 0.5 + 0.5 * sin(hash1(dot(n + g, vec2(7.0, 113.0))) * 2.5 + 3.5 + vec3(2.0, 3.0, 0.0));
        // in linear space
        col = col * col;

        // do the smooth min for colors and distances
        float h = smoothstep(0.0, 1.0, 0.5 + 0.5 * (m.x - d) / w);
        m.x = mix(m.x, d, h) - h * (1.0 - h) * w / (1.0 + 3.0 * w); // distance
        m.yzw = mix(m.yzw, col, h) - h * (1.0 - h) * w / (1.0 + 3.0 * w); // color
    }

    return m;
}
`;

// x - cell color, y - distance to cell
export const VoronoiGrayscale = `
vec2 voronoi(vec2 x, float w)
{
    vec2 n = floor(x);
    vec2 f = fract(x);

    vec2 m = vec2(0.0, 8.0);
    for (int j = -2; j <= 2; ++j)
    for (int i = -2; i <= 2; ++i)
    {
        vec2 g = vec2(i, j);
        vec2 o = hash2(n + g);

        // distance to cell
        float d = length(g - f + o);

        // cell color
        float col = 0.5 + 0.5 * sin(hash1(dot(n + g, vec2(7.0, 113.0))) * 2.5 + 5.0);

        // do the smooth min for colors and distances
        float h = smoothstep(0.0, 1.0, 0.5 + 0.5 * (m.y - d) / w);
        m.y = mix(m.y, d, h) - h * (1.0 - h) * w / (1.0 + 3.0 * w); // distance
        m.x = mix(m.x, col, h) - h * (1.0 - h) * w / (1.0 + 3.0 * w); // color
    }

    return m;
}
`;

// https://www.iquilezles.org/www/articles/voronoilines/voronoilines.htm
export const VoronoiDistance = `
float voronoiDistance(vec2 x)
{
    vec2 p = floor(x);
    vec2 f = fract(x);

    vec2 mb;
    vec2 mr;

    float res = 8.0;
    for (int j = -1; j <= 1; ++j)
    for (int i = -1; i <= 1; ++i)
    {
        vec2 b = vec2(i, j);
        vec2 r = b + hash2(p + b) - f;
        float d = dot(r, r);

        if (d < res)
        {
            res = d;
            mr = r;
            mb = b;
        }
    }

    res = 8.0;
    for (int j = -2; j <= 2; ++j)
    for (int i = -2; i <= 2; ++i)
    {
        vec2 b = mb + vec2(i, j);
        vec2 r = b + hash2(p + b) - f;
        float d = dot(0.5 * (mr + r), normalize(r - mr));

        res = min(res, d);
    }

    return res;
}
`;
