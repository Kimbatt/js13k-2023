import { Clamp, hypot } from "../util/math.js";

export function GenerateNormalMap(heightMap: Float32Array, width: number, height: number, intensity = 1, flipY = false, pixels?: Float32Array)
{
    pixels ??= new Float32Array(width * height * 4);
    const yDirection = flipY ? -1.0 : 1.0;

    function GetPixel(x: number, y: number)
    {
        return heightMap[(width * Clamp(y, 0, height - 1) + Clamp(x, 0, width - 1)) * 4];
    }

    for (let j = 0; j < height; ++j)
    {
        for (let i = 0; i < width; ++i)
        {
            const p0 = GetPixel(i - 1, j + 1);
            const p1 = GetPixel(i, j + 1);
            const p2 = GetPixel(i + 1, j + 1);
            const p3 = GetPixel(i - 1, j);
            const p5 = GetPixel(i + 1, j);
            const p6 = GetPixel(i - 1, j - 1);
            const p7 = GetPixel(i, j - 1);
            const p8 = GetPixel(i + 1, j - 1);

            let normalX = intensity * (p0 - p2 - 2 * (p5 - p3) - p8 + p6);
            let normalY = intensity * (p0 - p6 - 2 * (p7 - p1) - p8 + p2) * yDirection;
            let normalZ = 1;

            const len = hypot(normalX, normalY, normalZ);
            normalX /= len;
            normalY /= len;
            normalZ /= len;

            // map from [-1, 1] to [0, 255]
            const idx = width * j + i;
            pixels[idx * 4 + 0] = (normalX + 1) / 2;
            pixels[idx * 4 + 1] = (normalY + 1) / 2;
            pixels[idx * 4 + 2] = (normalZ + 1) / 2;
            pixels[idx * 4 + 3] = 1;
        }
    }

    return pixels;
}

export function NormalMapShader(intensity: number, invert = false)
{
    intensity = invert ? -intensity : intensity;
    return `
const vec3 off = vec3(-1, 1, 0);

float top = texture(t0, vPixelCoord + pixelSize * off.zy).x;
float bottom = texture(t0, vPixelCoord + pixelSize * off.zx).x;
float left = texture(t0, vPixelCoord + pixelSize * off.xz).x;
float right = texture(t0, vPixelCoord + pixelSize * off.yz).x;

vec3 normal = vec3(float(${intensity}) * (left - right), float(${intensity}) * (bottom - top), pixelSize.y * 100.0);
outColor = vec4(normalize(normal) * 0.5 + 0.5, 1);
`;
}
