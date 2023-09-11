import { edgeBlend, ShaderUtils } from "../../util/shader-utils.js";
import { TextureCollection } from "../texture-collection.js";
import { FBM } from "../noise/fbm.js";
import { VoronoiDistance } from "../noise/voronoi.js";
import { NormalMapShader } from "../normal-map.js";
import { ca } from "../../util/webgl.js";

export function DirtTexture(w: number, h: number,
    scale = 5,
    minRoughness = 0.5, maxRoughness = 1.0,
    baseColor: [number, number, number] = [0.3, 0.22, 0.07],
    normalIntensity = 1): TextureCollection
{
    const shader = (isAlbedo: boolean) => `
vec4 getColor(vec2 uv)
{
    vec2 coord = uv * float(${scale});
    vec2 noise = vec2(1) - vec2(fbm(coord, 5, 1.0, 2.0), fbm(coord + vec2(1.23, 4.56), 5, 1.0, 2.0));
    float voro = voronoiDistance(noise * 4.0) * 2.0;
    voro = saturate(1.0 - voro * 20.0);


    float noise2 = fbm(coord * 2.0, 3, 1.0, 2.0);
    noise2 = sharpstep(0.45, 0.52, noise2);
    float detail = saturate(1.0 - voro * noise2);


    float noise3 = remap(0.0, 1.0, 0.3, 1.0, fbm(coord * 1.5, 3, 1.0, 2.0));
    float height = detail * noise3;

    ${isAlbedo
            ? `
        vec4 albedo = colorRamp(vec4(0, 0, 0, 1), 0.08, vec4(${baseColor.join(",")}, 1), 0.67, noise3);
        albedo.rgb *= vec3(height);
        return albedo;
        `
            : `
        return vec4(vec3(remap(0.0, 1.0, float(${minRoughness}), float(${maxRoughness}), height)), 1);
        `
        }
}`;

    const mainImage = `
    outColor = edgeBlend(vPixelCoord);
    `;

    const albedo = ca.CreateTexture(w, h);
    ca.DrawWithShader([ShaderUtils, FBM, VoronoiDistance, shader(true), edgeBlend("getColor")], mainImage, w, h, [], albedo);

    const heightMap = ca.CreateTexture(w, h);
    ca.DrawWithShader([ShaderUtils, FBM, VoronoiDistance, shader(false), edgeBlend("getColor")], mainImage, w, h, [], heightMap);

    const normalMap = ca.CreateTexture(w, h);
    ca.DrawWithShader([], NormalMapShader(normalIntensity), w, h, [heightMap], normalMap);

    return {
        albedo,
        roughness: heightMap,
        normalMap
    };
}
