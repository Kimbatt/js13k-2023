import { Vector3 } from "../util/linear.js";
import { CreateWebglProgram } from "../util/webgl-utils.js";
import { gl_uniform1i, gl_useProgram } from "./global-canvas.js";

export interface Material
{
    r: number;
    g: number;
    b: number;
    a: number;
    metallic?: number;
    roughness?: number;
    textureScale?: Vector3;
    textureOffset?: Vector3;
    textureBlendSharpness?: number;
    unlit?:boolean;
}

let standardMaterialProgram: ReturnType<typeof CreateWebglProgram> | null = null;
export function GetOrCreateStandardMaterial()
{
    if (standardMaterialProgram === null)
    {
        const vertexShaderSource = `#version 300 es
        layout (location = 0)
        in vec4 vPosition;                      // position in modelSpace
        layout (location = 1)
        in vec3 vNormal;                        // normal in modelSpace

        out vec3 viewPos;                       // position in viewSpace
        out vec3 viewNormal;                    // normal in viewSpace
        out vec3 modelPos;                      // position in modelSpace
        out vec3 modelNormal;                   // normal in modelSpace
        out vec3 worldPos;                      // position in worldSpace
        out vec3 worldNormal;                   // normal in worldSpace
        out vec4 shadowPos;

        uniform mat4 worldMat;                  // transforms from modelSpace to worldSpace
        uniform mat3 worldNormalMat;            // transforms normal vectors from modelSpace to worldSpace
        uniform mat4 worldViewMat;              // transforms from modelSpace to viewSpace
        uniform mat3 worldViewNormalMat;        // transforms normal vectors from modelSpace to viewSpace
        uniform mat4 worldViewProjMat;          // transforms from modelSpace to NDC space
        uniform mat4 shadowMVP;

        void main()
        {
            viewPos = (worldViewMat * vPosition).xyz;
            viewNormal = worldViewNormalMat * vNormal;
            modelPos = vPosition.xyz;
            modelNormal = vNormal;
            worldPos = (worldMat * vPosition).xyz;
            worldNormal = worldNormalMat * vNormal;
            gl_Position = worldViewProjMat * vPosition;
            shadowPos = shadowMVP * worldMat * vPosition * 0.5 + 0.5;
        }
`;

        const fragmentShaderSource = `#version 300 es

        precision highp float;
        precision highp sampler2DShadow;

        uniform bool isUnlit;

        uniform sampler2D albedo;
        uniform sampler2D normalMap;
        uniform sampler2D roughnessMap;
        uniform sampler2DShadow depthMap;

        uniform mat3 worldNormalMat;
        uniform mat3 worldViewNormalMat;

        uniform bool hasAlbedo;
        uniform bool hasNormalMap;
        uniform bool hasRoughnessMap;

        uniform vec4 baseColor;
        uniform float roughness;
        uniform float metallic;
        uniform float lightIntensity;

        uniform float sharpness;
        uniform vec3 scale;
        uniform vec3 offset;

        uniform vec3 lightPos;
        uniform vec3 lightPosWorld;
        uniform bool enableShadows;

        in vec3 viewPos;
        in vec3 viewNormal;
        in vec3 modelPos;
        in vec3 modelNormal;
        in vec3 worldPos;
        in vec3 worldNormal;
        in vec4 shadowPos;
        out vec4 fragColor;


        vec3 triplanarBlendFactor(vec3 normal)
        {
            vec3 weights = pow(abs(normal), vec3(sharpness));
            float dotValue = dot(weights, vec3(1));
            return weights / vec3(dotValue);
        }

#define VOLLEYBALL_TRIPLANAR 0

        vec4 tex2DTriplanar(sampler2D tex, vec3 uvw, vec3 normal)
        {
            vec3 blend = triplanarBlendFactor(normal);

            // read the three texture projections, for x,y,z axes
#if VOLLEYBALL_TRIPLANAR
            vec4 cx = texture(tex, uvw.yz);
#else
            vec4 cx = texture(tex, uvw.zy);
#endif
            vec4 cy = texture(tex, uvw.zx);
            vec4 cz = texture(tex, uvw.xy);

            // blend the textures based on weights
            return cx * blend.x + cy * blend.y + cz * blend.z;
        }

        // https://bgolus.medium.com/normal-mapping-for-a-triplanar-shader-10bf39dca05a
        vec3 getTriplanarNormal(sampler2D tex, vec3 uvw, vec3 normal)
        {
            vec3 blend = triplanarBlendFactor(normal);

            // Triplanar uvs

#if VOLLEYBALL_TRIPLANAR
            vec2 uvX = uvw.yz; // x facing plane
#else
            vec2 uvX = uvw.zy; // x facing plane
#endif
            vec2 uvY = uvw.zx; // y facing plane
            vec2 uvZ = uvw.xy; // z facing plane

            // Tangent space normal maps
            vec3 tnormalX = texture(tex, uvX).rgb * 2.0 - 1.0;
            vec3 tnormalY = texture(tex, uvY).rgb * 2.0 - 1.0;
            vec3 tnormalZ = texture(tex, uvZ).rgb * 2.0 - 1.0;

            // Swizzle tangent normals into world space and zero out "z"
#if VOLLEYBALL_TRIPLANAR
            vec3 normalX = vec3(0.0, tnormalX.xy);
#else
            vec3 normalX = vec3(0.0, tnormalX.yx);
#endif
            vec3 normalY = vec3(tnormalY.y, 0.0, tnormalY.x);
            vec3 normalZ = vec3(tnormalZ.xy, 0.0);

            // Triblend normals and add to world normal
            return normalize(
                normalX * blend.x +
                normalY * blend.y +
                normalZ * blend.z +
                normal
            );
        }


        const float PI = 3.1415926535897932384626433832795;

        float clampedDot(vec3 a, vec3 b)
        {
            return max(dot(a, b), 0.0);
        }

        vec3 fresnel(vec3 color, float dotAngle)
        {
            // Schlick's approximation
            return color + (1.0 - color) * pow(1.0 - dotAngle, 5.0);
        }

        vec3 calculateReflectance(
            vec3 N, vec3 V,
            vec3 L, vec3 lightDirect, vec3 lightAmbient,
            vec3 cDiff, vec3 F0, float specPower)
        {
            float lambertTerm = clampedDot(N, L);

            // calculate half vector
            vec3 H = normalize(L + V);

            vec3 F = fresnel(F0, dot(L, H));

            // normal distribution term multiplied with implicit Geometry term (with normalization factor)
            float GD = pow(clampedDot(N, H), specPower) * (specPower + 2.0) / 8.0;

            vec3 specular = F * GD;
            vec3 diffuse = cDiff;


            float shadowLightValue = 0.0;
            if (enableShadows)
            {
                vec3 shadowPosLightSpace = shadowPos.xyz / shadowPos.w;
                vec2 uvDistanceFromCenter = abs(vec2(0.5) - shadowPosLightSpace.xy);

                if (shadowPosLightSpace.z > 1.0 || uvDistanceFromCenter.x > 0.5 || uvDistanceFromCenter.y > 0.5)
                {
                    // if the coordinate is outside the shadowmap, then it's in light
                    shadowLightValue = 1.0;
                }
                else
                {
                    float bias = max(0.001 * (1.0 - dot(normalize(worldNormal), lightPosWorld)), 0.0001);
                    // float bias = 0.005;
                    shadowPosLightSpace.z -= bias / shadowPos.w;

                    shadowLightValue = texture(depthMap, shadowPosLightSpace);
                    // shadowLightValue = 0.0;
                }
            }
            else
            {
                shadowLightValue = 1.0;
            }

            vec3 refl = shadowLightValue * (diffuse + specular) * lambertTerm * lightDirect;
            refl += cDiff * lightAmbient;

            return refl;
        }


        vec3 calculateReflectances(vec3 N, vec3 V)
        {
        #if 0 // triplanar use world space

            vec3 triplanarPos = worldPos;
            vec3 triplanarNormal = normalize(worldNormal);

        #else // triplanar use model space

            vec3 triplanarPos = modelPos;
            vec3 triplanarNormal = normalize(modelNormal);

        #endif

            // normal map
            N = hasNormalMap
                ? normalize(worldViewNormalMat * getTriplanarNormal(normalMap, triplanarPos * scale + offset, triplanarNormal))
                : N;

            // albedo/specular base
            vec3 col = hasAlbedo
                ? tex2DTriplanar(albedo, triplanarPos * scale + offset, triplanarNormal).rgb * baseColor.rgb
                : baseColor.rgb;

            // roughness TODO? needs testing
            float rgh = hasRoughnessMap
                ? tex2DTriplanar(roughnessMap, triplanarPos * scale + offset, triplanarNormal).r
                : roughness;

            const vec3 dielectricSpecular = vec3(0.04, 0.04, 0.04);
            const vec3 black = vec3(0.0, 0.0, 0.0);

            // sub-surface scattering reflectance
            vec3 cDiff = mix(col * (1.0 - dielectricSpecular.r), black, metallic) / PI;

            // fresnel reflectance at normal incidence
            vec3 F0 = mix(dielectricSpecular, col, metallic);

            // map roughness in [0,1] into shininess in [0, 128] with a logarithmic rate
            rgh = 1.2 - 0.2 / clamp(rgh, 0.00001, 0.99999);
            float specPower = log(2.0 - rgh) * 185.0;

            // total irradiance
            vec3 refl = vec3(0.0, 0.0, 0.0);

            vec3 lightPositions[] = vec3[1](lightPos);
            vec3 lightColors[] = vec3[1](vec3(1.0, 1.0, 1.0) * 1.0);
            vec3 lightAmbientColors[] = vec3[1](vec3(1.0, 1.0, 1.0) * 1.0);

            // vec3 hemisphereLightPosition = normalize(-lightPos);

            // for (int i = 0; i < lightPositions.length(); ++i)
            int i = 0;
            {
                vec3 L = lightPositions[i];
                vec3 cL = lightColors[i];
                vec3 aL = lightAmbientColors[i] * (1.0 - clampedDot(worldNormal, -lightPosWorld) * 0.1);
                refl += calculateReflectance(
                    N, V,
                    L, cL, aL,
                    cDiff, F0, specPower);
            }

            return refl;
        }

        void main()
        {
            if (isUnlit)
            {
                // no textures in unlit mode currently
                fragColor = baseColor;
                return;
            }

            vec3 N = normalize(viewNormal);
            vec3 V = normalize(-viewPos);
            vec3 rgb = calculateReflectances(N, V);

        #if 0
            // final gamma correction
            // rgb *= rgb;
            rgb = sqrt(rgb);
        #endif

            float fogFactor = smoothstep(150.0, 250.0, length(worldPos));
            const vec3 fogColor = vec3(0.4, 0.45, 0.5);

            fragColor = vec4(mix(rgb, fogColor, fogFactor), baseColor.a);
        }
`;

        standardMaterialProgram = CreateWebglProgram(vertexShaderSource, fragmentShaderSource,
            "worldViewMat", "worldViewNormalMat", "worldViewProjMat", "worldMat", "worldNormalMat", "shadowMVP", "isUnlit",
            "albedo", "normalMap", "roughnessMap", "depthMap",
            "hasAlbedo", "hasNormalMap", "hasRoughnessMap",
            "baseColor", "metallic", "roughness", "lightIntensity",
            "sharpness", "scale", "offset",
            "lightPos", "lightPosWorld", "enableShadows"
        );

        gl_useProgram(standardMaterialProgram.program);
        gl_uniform1i(standardMaterialProgram.uniformLocations.get("albedo")!, 0);
        gl_uniform1i(standardMaterialProgram.uniformLocations.get("normalMap")!, 1);
        gl_uniform1i(standardMaterialProgram.uniformLocations.get("roughnessMap")!, 2);
        gl_uniform1i(standardMaterialProgram.uniformLocations.get("depthMap")!, 3);
    }

    return standardMaterialProgram;
}

let shadowProgram: ReturnType<typeof CreateWebglProgram> | null = null;
export function GetOrCreateShadowProgram()
{
    if (shadowProgram === null)
    {
        shadowProgram = CreateWebglProgram(`#version 300 es

layout (location = 0)
in vec4 vPosition;
out vec2 uv;

uniform mat4 depthMVP;
uniform mat4 worldMat;

void main()
{
    uv = vPosition.xy + 0.5;
    gl_Position = depthMVP * worldMat * vPosition;
}
`,

            `#version 300 es

precision highp float;

uniform sampler2D tex;

in vec2 uv;

void main()
{
    if (texture(tex, uv).a < 0.5)
    {
        discard;
    }
}
`,
            "depthMVP", "worldMat", "tex"
        );
    }

    return shadowProgram;
}
