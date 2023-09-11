import { TextureCollection } from "../texture-generator/texture-collection.js";
import { Matrix3x3, Matrix4x4, NewMatrix3x3, NewMatrix4x4, NewVector3, Vector3 } from "../util/linear.js";
import { Clamp } from "../util/math.js";
import { Geometry } from "./geometry.js";
import
{
    gl_activeTexture,
    gl_BACK,
    gl_bindTexture,
    gl_bindVertexArray,
    gl_BLEND,
    gl_blendFunc,
    gl_cullFace,
    gl_CULL_FACE,
    gl_depthMask,
    gl_disable,
    gl_drawElements,
    gl_enable,
    gl_ONE_MINUS_SRC_ALPHA,
    gl_SRC_ALPHA,
    gl_TEXTURE0,
    gl_TEXTURE_2D,
    gl_TRIANGLES,
    gl_uniform1f,
    gl_uniform1i,
    gl_uniform3f,
    gl_uniform3fv,
    gl_uniform4f,
    gl_uniformMatrix3fv,
    gl_uniformMatrix4fv,
    gl_UNSIGNED_INT,
    gl_useProgram
} from "./global-canvas.js";
import { GetOrCreateShadowProgram, GetOrCreateStandardMaterial, Material } from "./material.js";
import { Renderable } from "./renderable.js";
import { DirectionalLight, RenderMode, ViewMatrices } from "./scene.js";

const tmpWorldViewMatrix = NewMatrix4x4();
const tmpWorldViewProjectionMatrix = NewMatrix4x4();
const tmpWorldViewNormalMatrix = NewMatrix3x3();
const tmpWorldNormalMatrix = NewMatrix3x3();
const tmpTransformMatrix = NewMatrix4x4();
const tmpVec3 = NewVector3();

export class Mesh extends Renderable
{
    private program: WebGLProgram;
    private shadowProgram: WebGLProgram;
    private uniforms: Map<string, WebGLUniformLocation>;
    public material: Material;
    private textures = new Map<number, WebGLTexture>();
    public castShadows = true;
    public receiveShadows = true;
    public cull: number | null = gl_BACK;

    constructor(geometry: Geometry, material: Material)
    {
        const positionLoc = 0;  // from shader
        const normalLoc = 1;    // same

        super(geometry, positionLoc, normalLoc);

        const { program, uniformLocations } = GetOrCreateStandardMaterial();
        this.program = program;
        this.uniforms = uniformLocations;

        gl_useProgram(program);

        this.material = { ...material };

        // shadows
        this.shadowProgram = GetOrCreateShadowProgram().program;
    }

    private prepareMaterial()
    {
        const { uniforms, material } = this;

        gl_uniform1i(uniforms.get("isUnlit")!, (material.unlit ?? false) ? 1 : 0)

        gl_uniform1i(uniforms.get("albedo")!, 0);
        gl_uniform1i(uniforms.get("normalMap")!, 1);
        gl_uniform1i(uniforms.get("roughnessMap")!, 2);

        gl_uniform1i(uniforms.get("hasAlbedo")!, 0);
        gl_uniform1i(uniforms.get("hasNormalMap")!, 0);
        gl_uniform1i(uniforms.get("hasRoughnessMap")!, 0);

        gl_uniform1f(uniforms.get("sharpness")!, 1);
        gl_uniform3f(uniforms.get("scale")!, 1, 1, 1);
        gl_uniform3f(uniforms.get("offset")!, 0, 0, 0);
        gl_uniform1f(uniforms.get("lightIntensity")!, 0.5);
        gl_uniform1i(uniforms.get("enableShadows")!, this.receiveShadows ? 1 : 0);

        for (let i = 0; i < 8; ++i)
        {
            gl_activeTexture(gl_TEXTURE0 + i);
            gl_bindTexture(gl_TEXTURE_2D, null);
        }

        if (material)
        {
            gl_uniform4f(uniforms.get("baseColor")!, material.r, material.g, material.b, material.a);
            gl_uniform1f(uniforms.get("metallic")!, material.metallic ?? 0);

            const coeff = 0.2;
            const eps = 1e-5;
            const roughness = 1.0 + coeff - coeff / Clamp(material.roughness ?? 0.5, eps, 1.0 - eps);

            gl_uniform1f(uniforms.get("roughness")!, roughness);

            gl_uniform1f(uniforms.get("sharpness")!, material.textureBlendSharpness ?? 1);
            material.textureScale && gl_uniform3fv(uniforms.get("scale")!, material.textureScale);
            material.textureOffset && gl_uniform3fv(uniforms.get("offset")!, material.textureOffset);

            for (const [slot, tex] of this.textures)
            {
                gl_activeTexture(gl_TEXTURE0 + slot);
                gl_bindTexture(gl_TEXTURE_2D, tex);
                gl_uniform1i(uniforms.get(["hasAlbedo", "hasNormalMap", "hasRoughnessMap"][slot])!, tex ? 1 : 0);
            }
        }

        if (this.cull !== null)
        {
            gl_enable(gl_CULL_FACE);
            gl_cullFace(this.cull);
        }
        else
        {
            gl_disable(gl_CULL_FACE);
        }

        if (this.transparent)
        {
            gl_enable(gl_BLEND);
            gl_blendFunc(gl_SRC_ALPHA, gl_ONE_MINUS_SRC_ALPHA);
        }
        else
        {
            gl_disable(gl_BLEND);
        }
    }

    public setTexture(slot: MeshTextureSlot, tex: WebGLTexture | null)
    {
        if (tex)
        {
            this.textures.set(slot, tex);
        }
        else
        {
            this.textures.delete(slot);
        }
    }

    public setTextures(textures: TextureCollection)
    {
        this.setTexture(MeshTextureSlot.Albedo, textures.albedo);
        this.setTexture(MeshTextureSlot.Normal, textures.normalMap);
        this.setTexture(MeshTextureSlot.Roughness, textures.roughness);
    }

    public render(mode: RenderMode, viewMatrices: ViewMatrices, worldMatrix: Matrix4x4, light: DirectionalLight)
    {
        if (mode === RenderMode.Shadow && !this.castShadows)
        {
            return;
        }

        const { uniforms } = this;
        const { viewMatrix, viewProjectionMatrix } = viewMatrices;

        gl_useProgram(mode === RenderMode.Normal ? this.program : this.shadowProgram);
        gl_bindVertexArray(this.vao);

        if (mode === RenderMode.Normal)
        {
            const worldViewMatrix = tmpWorldViewMatrix.copy(viewMatrix).multiply(worldMatrix);
            const worldViewProjectionMatrix = tmpWorldViewProjectionMatrix.copy(viewProjectionMatrix).multiply(worldMatrix);
            const worldViewNormalMatrix = worldViewMatrix.topLeft3x3(tmpWorldViewNormalMatrix).invert() /* .transpose() */;
            const worldNormalMatrix = worldMatrix.topLeft3x3(tmpWorldNormalMatrix).invert() /* .transpose() */;

            gl_uniformMatrix4fv(uniforms.get("worldViewMat")!, false, worldViewMatrix);
            gl_uniformMatrix4fv(uniforms.get("worldViewProjMat")!, false, worldViewProjectionMatrix);
            gl_uniformMatrix3fv(uniforms.get("worldViewNormalMat")!, true, worldViewNormalMatrix);
            gl_uniformMatrix4fv(uniforms.get("worldMat")!, false, worldMatrix);
            gl_uniformMatrix3fv(uniforms.get("worldNormalMat")!, true, worldNormalMatrix);
            gl_uniform3fv(uniforms.get("lightPos")!,
                tmpVec3
                    .copyFrom(light.transform.position)
                    .add(viewMatrices.cameraPosition)
                    .applyMatrix4x4(light.transform.matrix(tmpTransformMatrix).preMultiply(viewMatrix))
                    .normalize()
            );
            gl_uniform3fv(uniforms.get("lightPosWorld")!, tmpVec3.copyFrom(light.transform.position).normalize());

            this.prepareMaterial();

            gl_activeTexture(gl_TEXTURE0 + 3);
            gl_bindTexture(gl_TEXTURE_2D, light.depthTexture);

            gl_uniformMatrix4fv(uniforms.get("shadowMVP")!, false, light.depthMVP);

            gl_depthMask(!this.transparent);
        }
        else
        {
            gl_activeTexture(gl_TEXTURE0);
            gl_bindTexture(gl_TEXTURE_2D, null);
            gl_uniformMatrix4fv(light.worldMatLocation, false, worldMatrix);
            gl_depthMask(true);
        }

        gl_drawElements(gl_TRIANGLES, this.triangleCount, gl_UNSIGNED_INT, 0);

        gl_bindVertexArray(null);
        gl_depthMask(true); // re-enable depth write so it doesn't mess up other stuff
    }
}

export const enum MeshTextureSlot
{
    Albedo = 0,
    Normal = 1,
    Roughness = 2
}
