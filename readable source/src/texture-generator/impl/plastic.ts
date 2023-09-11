import { edgeBlend, ShaderUtils } from "../../util/shader-utils.js";
import { TextureCollection } from "../texture-collection.js";
import { FBM } from "../noise/fbm.js";
import { VoronoiGrayscale } from "../noise/voronoi.js";
import { NormalMapShader } from "../normal-map.js";
import { ca } from "../../util/webgl.js";

export function PlasticTexture(w: number, h: number,
    scale = 5,
    minRoughness = 0.5, maxRoughness = 1.0,
    baseColor: [number, number, number] = [0.3, 0.22, 0.07],
    normalIntensity = 0.5): TextureCollection
{
    const shader = (isAlbedo: boolean) => `
vec4 getColor(vec2 uv)
{
    vec2 coord = uv * float(${scale});
    vec2 noise = vec2(fbm(coord, 5, 1.0, 2.0), fbm(coord + vec2(1.23, 4.56), 5, 1.0, 2.0));
    float voro = sqrt(voronoi(noise * 10.0, 1.0).y) * 1.5;

    ${isAlbedo
            ? `
        vec4 albedo = colorRamp(vec4(0.95, 0.95, 0.95, 1), 0.2, vec4(1.0, 1.0, 1.0, 1), 0.8, mix(voro, noise.x, 0.5)) * vec4(${baseColor.join(",")}, 1);
        return albedo;
        `
            : `
        return vec4(vec3(remap(0.0, 1.0, float(${minRoughness}), float(${maxRoughness}), saturate(valueRamp(0.4, 0.3, 0.6, 0.7, voro)) * 0.2 - noise.x * 1.0)), 1);
        `
        }
}`;

    const mainImage = `
    outColor = edgeBlend(vPixelCoord);
    `;

    const albedo = ca.CreateTexture(w, h);
    ca.DrawWithShader([ShaderUtils, FBM, VoronoiGrayscale, shader(true), edgeBlend("getColor")], mainImage, w, h, [], albedo);

    const heightMap = ca.CreateTexture(w, h);
    ca.DrawWithShader([ShaderUtils, FBM, VoronoiGrayscale, shader(false), edgeBlend("getColor")], mainImage, w, h, [], heightMap);

    const normalMap = ca.CreateTexture(w, h);
    ca.DrawWithShader([], NormalMapShader(normalIntensity), w, h, [heightMap], normalMap);

    return {
        albedo,
        roughness: heightMap,
        normalMap
    };
}
