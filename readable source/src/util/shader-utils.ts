
export const ShaderUtils = `
float hash1(float n)
{
    return fract(sin(n) * 43758.5453);
}

vec2 hash2(vec2 p)
{
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p)*43758.5453);
}

float saturate(float x)
{
    return clamp(x, 0.0, 1.0);
}

float unlerp(float a, float b, float x)
{
    return (x - a) / (b - a);
}

float remap(float from0, float from1, float to0, float to1, float x)
{
    return mix(to0, to1, unlerp(from0, from1, x));
}

float sharpstep(float edge0, float edge1, float x)
{
    return saturate(unlerp(edge0, edge1, x));
}

vec4 colorRamp(vec4 colorA, float posA, vec4 colorB, float posB, float t)
{
    return mix(colorA, colorB, sharpstep(posA, posB, t));
}

vec3 colorRamp3(vec3 colorA, float posA, vec3 colorB, float posB, float t)
{
    return mix(colorA, colorB, sharpstep(posA, posB, t));
}

float valueRamp(float colorA, float posA, float colorB, float posB, float t)
{
    return mix(colorA, colorB, sharpstep(posA, posB, t));
}

`;

export const edgeBlend = (fnName: string, blend = 0.2, returnType = "vec4", edgeBlendFnName = "edgeBlend") => `
${returnType} ${edgeBlendFnName}(vec2 uv)
{
    const vec2 fadeWidth = vec2(${blend});
    const vec2 scaling = 1.0 - fadeWidth;
    vec2 offsetuv = uv * scaling;
    vec2 blend = clamp((uv - scaling) / fadeWidth, 0.0, 1.0);

    return
        blend.y * blend.x * ${fnName}(fract(offsetuv + (fadeWidth * 2.0))) +
        blend.y * (1.0 - blend.x) * ${fnName}(vec2(fract(offsetuv.x + fadeWidth.x), fract(offsetuv.y + (fadeWidth.y * 2.0)))) +
        (1.0 - blend.y) * (1.0 - blend.x) * ${fnName}(fract(offsetuv + fadeWidth)) +
        (1.0 - blend.y) * blend.x * ${fnName}(vec2(fract(offsetuv.x + (fadeWidth.x * 2.0)), fract(offsetuv.y + fadeWidth.y)));
}

`;
