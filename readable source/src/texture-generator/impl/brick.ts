import { edgeBlend, ShaderUtils } from "../../util/shader-utils.js";
import { TextureCollection } from "../texture-collection.js";
import { FBM } from "../noise/fbm.js";
import { VoronoiDistance, VoronoiGrayscale } from "../noise/voronoi.js";
import { NormalMapShader } from "../normal-map.js";
import { ca } from "../../util/webgl.js";

export function BrickTexture(w: number, h: number,
    rowCount = 4, // or voronoi scale for voronoi mode
    colCount = 2,
    mortarSize = 0.03,
    rowOffset = 0.5, // (colCount + 1) * rowCount should be an integer for nice repeating pattern
    noiseScale0 = 0.05,
    noiseScale1 = 0.2,
    noiseFrequency = 1,
    edgeThickness = 0.1,
    voronoiPattern = false,
    minRoughness = 0.5, maxRoughness = 1.0,
    baseColor: [number, number, number] = [0.3, 0.22, 0.07],
    mortarColor: [number, number, number] = [0.8, 0.75, 0.7],
    normalIntensity = 0.5): TextureCollection
{
    const rowHeight = 1 / rowCount;
    const colWidth = 1 / colCount;
    const invAspect = rowHeight / colWidth;

    const shader = (isAlbedo: boolean) => `

vec2 getNoise(vec2 coord)
{
    coord *= float(float(${noiseFrequency}));
    return vec2(fbm(coord, 5, 10.0, 2.0), fbm(coord + vec2(1.23, 4.56), 5, 10.0, 2.0));
}

float getVoronoi(vec2 coord)
{
    return voronoiDistance(coord * float(${rowCount}));
}

${edgeBlend("getNoise", 0.2, "vec2", "getSeamlessNoise")}
${edgeBlend("getVoronoi", 0.01, "float", "getSeamlessVoronoi")}

vec4 getColor(vec2 uv)
{
    vec2 coord = uv;
    vec2 noise = getSeamlessNoise(coord) - 0.5;
    coord += noise * float(${noiseScale0});

    ${voronoiPattern
            ? `float dist = smoothstep(float(${mortarSize}), float(${mortarSize + edgeThickness}), getSeamlessVoronoi(coord));`
            : `
        float rowHeight = float(${rowHeight});
        float colWidth = float(${colWidth});

        float y = coord.y / rowHeight;
        float x = coord.x / colWidth;
        float row = floor(y);

        float offsetX = row * float(${rowOffset});

        float minY = 0.5 - float(${mortarSize}) - noise.x * float(${noiseScale1});
        float maxY = minY - float(${edgeThickness});
        float minX = 0.5 - (float(${mortarSize}) - noise.y * float(${noiseScale1})) * float(${invAspect});
        float maxX = minX - float(${edgeThickness}) * float(${invAspect});

        float distanceFromEdgeY = smoothstep(minY, maxY, abs(0.5 - fract(y)));
        float distanceFromEdgeX = smoothstep(minX, maxX, abs(0.5 - fract(x + offsetX)));
        float dist = min(distanceFromEdgeX, distanceFromEdgeY);
        `
        }

    ${isAlbedo
            ? `
            dist += (noise.x + noise.y - 0.05) * 0.5;
            vec3 rgb = mix(vec3(${mortarColor.join(",")}), vec3(${baseColor.join(",")}), vec3(dist));
            return vec4(rgb, 1);`
            : `
            dist += noise.x + noise.y - 0.05;
            return vec4(vec3(remap(0.0, 1.0, float(${minRoughness}), float(${maxRoughness}), dist)), 1);`
        }
}`;

    const mainImage = `
    outColor = getColor(vPixelCoord);
    `;

    const albedo = ca.CreateTexture(w, h);
    ca.DrawWithShader([ShaderUtils, FBM, VoronoiDistance, shader(true)], mainImage, w, h, [], albedo);

    const heightMap = ca.CreateTexture(w, h);
    ca.DrawWithShader([ShaderUtils, FBM, VoronoiDistance, shader(false)], mainImage, w, h, [], heightMap);

    const normalMap = ca.CreateTexture(w, h);
    ca.DrawWithShader([], NormalMapShader(normalIntensity), w, h, [heightMap], normalMap);

    const roughness = ca.CreateTexture(w, h);
    ca.DrawWithShader([ShaderUtils], `
        // flip min and max values
        outColor = vec4(vec3(float(${minRoughness}) + float(${maxRoughness}) - texture(t0, vPixelCoord).x), 1);
        `,
        w, h, [heightMap], roughness);

    // c.TextureToImage?.(roughness, 512, 512).then(img =>
    // {
    //     document.body.appendChild(img);
    //     img.style.position = "absolute";
    // });

    return {
        albedo,
        roughness,
        normalMap
    };
}
