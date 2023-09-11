import { edgeBlend, ShaderUtils } from "../../util/shader-utils.js";
import { TextureCollection } from "../texture-collection.js";
import { FBM } from "../noise/fbm.js";
import { VoronoiGrayscale } from "../noise/voronoi.js";
import { NormalMapShader } from "../normal-map.js";
import { ca } from "../../util/webgl.js";

export function WoodTexture(w: number, h: number,
    minRoughness = 0.5, maxRoughness = 1.0,
    color0: [number, number, number] = [0, 0, 0],
    color1: [number, number, number] = [0.55, 0.35, 0.2],
    color2: [number, number, number] = [0.75, 0.55, 0.45],
    color3: [number, number, number] = [0.75, 0.6, 0.5],
    scale = 5,
    normalIntensity = 0.5): TextureCollection
{
    const shader = (isAlbedo: boolean) => `

vec4 getColor(vec2 uv)
{
    vec2 coord = uv;
    coord.y *= 0.1;
    vec2 voronoise = voronoi(coord * float(${scale}), 1.5);
    voronoise *= vec2(10, 3);
    float noise = remap(0.1, 0.6, 0.0, 1.0, fbm(voronoise, 4, 10.0, 3.0));
    ${isAlbedo
            ? `
            vec3 color0 = vec3(${color0});
            vec3 color1 = vec3(${color1});
            vec3 color2 = vec3(${color2});
            vec3 color3 = vec3(${color3});

            vec3 rgb =
                noise < 0.65
                ? colorRamp3(color0, 0.35, color1, 0.65, noise)
                : noise < 0.85
                ? colorRamp3(color1, 0.65, color2, 0.85, noise)
                : colorRamp3(color2, 0.85, color3, 0.90, noise);

            return vec4(rgb, 1);`
            : `
            return vec4(vec3(mix(float(${minRoughness}), float(${maxRoughness}), smoothstep(0.4, 0.8, noise))), 1);`
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
