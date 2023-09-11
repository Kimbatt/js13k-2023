import { edgeBlend, ShaderUtils } from "../../util/shader-utils.js";
import { TextureCollection } from "../texture-collection.js";
import { FBM } from "../noise/fbm.js";
import { Voronoi } from "../noise/voronoi.js";
import { NormalMapShader } from "../normal-map.js";
import { ca } from "../../util/webgl.js";

export function MetalTexture(w: number, h: number,
    scale = 5,
    minRoughness = 0.5, maxRoughness = 1.0,
    baseColor: [number, number, number] = [1, 1, 1],
    normalIntensity = 0.2): TextureCollection
{
    const shader = (isAlbedo: boolean) => `
vec4 getColor(vec2 uv)
{
    vec2 coord = uv * float(${scale});
    vec2 noise = vec2(fbm(coord, 5, 1.0, 2.0), fbm(coord + vec2(1.23, 4.56), 5, 1.0, 2.0)) * 5.0;
    float voro = sqrt(voronoi(coord * 5.0 + noise, 0.01).y) * 1.5 - noise.x;
    // voro = valueRamp(0.4, 0.3, 0.6, 0.7, voro);

    ${isAlbedo
            ? `
        vec4 albedo = colorRamp(vec4(0.0, 0.0, 0.0, 1), 0.2, vec4(1.0, 1.0, 1.0, 1), 0.8, voro) * vec4(${baseColor.join(",")}, 1);
        return vec4(${baseColor.join(",")}, 1);
        // return albedo;
        `
            : `
        return vec4(vec3(remap(0.0, 1.0, float(${minRoughness}), float(${maxRoughness}), remap(0.0, 1.0, 0.9, 1.0, voro))), 1);
        `
        }
}`;

    const mainImage = `
    outColor = edgeBlend(vPixelCoord);
    `;

    const albedo = ca.CreateTexture(w, h);
    ca.DrawWithShader([ShaderUtils, FBM, Voronoi, shader(true), edgeBlend("getColor")], mainImage, w, h, [], albedo);

    const heightMap = ca.CreateTexture(w, h);
    ca.DrawWithShader([ShaderUtils, FBM, Voronoi, shader(false), edgeBlend("getColor")], mainImage, w, h, [], heightMap);

    const normalMap = ca.CreateTexture(w, h);
    ca.DrawWithShader([], NormalMapShader(normalIntensity), w, h, [heightMap], normalMap);

    return {
        albedo,
        roughness: heightMap,
        normalMap
    };
}
