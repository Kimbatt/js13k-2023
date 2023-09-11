import { Ray } from "../util/math-geometry.js";
import { Matrix4x4, NewMatrix4x4, NewQuaternion, NewVector3, Quaternion, Vector2, Vector3 } from "../util/linear.js";
import { floor, Lerp, max, min, tan } from "../util/math.js";
import { globalCanvas, gl_BACK, gl_bindFramebuffer, gl_bindTexture, gl_clear, gl_clearColor, gl_COLOR_BUFFER_BIT, gl_COMPARE_REF_TO_TEXTURE, gl_createFramebuffer, gl_createTexture, gl_cullFace, gl_CULL_FACE, gl_DEPTH24_STENCIL8, gl_depthFunc, gl_DEPTH_BUFFER_BIT, gl_DEPTH_STENCIL, gl_DEPTH_STENCIL_ATTACHMENT, gl_DEPTH_TEST, gl_enable, gl_FRAMEBUFFER, gl_framebufferTexture2D, gl_getParameter, gl_LEQUAL, gl_LINEAR, gl_MAX_TEXTURE_SIZE, gl_texImage2D, gl_texParameteri, gl_TEXTURE_2D, gl_TEXTURE_COMPARE_MODE, gl_TEXTURE_MAG_FILTER, gl_TEXTURE_MIN_FILTER, gl_uniformMatrix4fv, gl_UNSIGNED_INT_24_8, gl_useProgram, gl_viewport } from "./global-canvas.js";
import { GetOrCreateShadowProgram } from "./material.js";
import { Transform } from "./transform.js";

const tmpTransformMatrix = NewMatrix4x4();
const tmpVec3_0 = NewVector3()
const tmpVec3_1 = NewVector3()

export const enum RenderMode
{
    Normal, Shadow
}

export interface ViewMatrices
{
    viewMatrix: Matrix4x4;
    viewProjectionMatrix: Matrix4x4;
    cameraPosition: Vector3;
}

type OnUpdateCallback = (node: SceneNode) => (unknown | false); // the callback can return false to remove itself
export const fixedDeltaTime = 1 / 60;
let accumulatedFixedDeltaTime = fixedDeltaTime / 2;

export class SceneNode
{
    public children = new Set<SceneNode>();
    protected parent: SceneNode | null = null;
    public transform = new Transform();
    public onUpdate: OnUpdateCallback[] = [];
    public onFixedUpdate: OnUpdateCallback[] = [];
    public onAfterRender: OnUpdateCallback[] = [];

    public visible = true;
    public renderOrder = 0;
    public transparent = false;

    //// Hierarchy

    public add(...nodes: SceneNode[])
    {
        nodes.forEach(n =>
        {
            this.children.add(n);
            n.parent = this;
        });
    }

    public remove(node: SceneNode)
    {
        this.children.delete(node);
        node.parent = null;
    }

    public setParent(parent?: SceneNode)
    {
        this.parent?.remove(this);
        parent?.add(this);
    }

    public traverse(callback: (node: SceneNode) => void)
    {
        (function traverseInner(node: SceneNode)
        {
            callback(node);
            node.children.forEach(traverseInner);
        })(this);
    }

    //// Transforms

    public localToWorldMatrix(): Matrix4x4
    {
        const mat = this.transform.matrix();
        return this.parent?.localToWorldMatrix().clone().multiply(mat) ?? mat.clone();
    }

    public worldToLocalMatrix(): Matrix4x4
    {
        // TODO: test this to make sure this is correct
        // seems to work without parents, but not tested with parents
        const mat = this.transform.matrixInverse();
        return this.parent?.worldToLocalMatrix().clone().preMultiply(mat) ?? mat.clone();
    }

    public get worldPosition()
    {
        return this.transformPoint(NewVector3());
    }

    public get worldRotation()
    {
        const rot = NewQuaternion();
        let node: SceneNode | null = this;
        while (node !== null)
        {
            // TODO: this might be premultiply
            rot.multiply(node.transform.rotation);
            node = node.parent;
        }

        return rot;
    }

    public transformPoint = (point: Vector3) => point.applyMatrix4x4(this.localToWorldMatrix());
    public transformDirection = (dir: Vector3) => dir.applyQuaternion(this.worldRotation).normalize();

    public get dirs()
    {
        const worldRot = this.worldRotation;

        return {
            right: NewVector3(1, 0, 0).applyQuaternion(worldRot).normalize(),
            up: NewVector3(0, 1, 0).applyQuaternion(worldRot).normalize(),
            forward: NewVector3(0, 0, -1).applyQuaternion(worldRot).normalize(),
        };
    }

    //// Render

    public render(_mode: RenderMode, _viewMatrices: ViewMatrices, _worldMatrix: Matrix4x4, _light: DirectionalLight) { }

    //// Misc

    public dispose()
    {
        this.setParent();
        this.onUpdate = [];
        this.onFixedUpdate = [];
        this.onAfterRender = [];

        this.children.forEach(child => child.dispose());
    }
}

interface ProjectionParams
{
    // assuming top === -bottom, and right === -left
    top: number;
    right: number;
    near: number;
    isPerspective: boolean;
}

export class Camera extends SceneNode
{
    public projectionMatrix = NewMatrix4x4();
    public projectionParams: ProjectionParams | null = null;

    public setProjectionMatrixPerspecive(fov = 75, aspect = 1, near = 0.01, far = 100)
    {
        //                          to radian, x0.5
        const top = near * tan(0.00872664626 * fov);
        const height = 2 * top;
        const width = aspect * height;
        const right = width / 2;
        this.projectionMatrix.makePerspective(right - width, right, top, top - height, near, far);
        this.projectionParams = { top, right, near, isPerspective: true };
    }

    public setProjectionMatrixOrthographic(width = 4, height = 4, near = 0.01, far = 100)
    {
        const right = width / 2;
        const top = height / 2;
        this.projectionMatrix.makeOrthographic(-right, right, top, -top, near, far);
        this.projectionParams = { top, right, near, isPerspective: false };
    }

    public getLocalRay(screenX: number, screenY: number): Ray
    {
        // 1 +---------+
        //   |         |
        //   |         |
        // 0 +---------+
        //   0         1

        const p = this.projectionParams!;
        const x = Lerp(-p.right, p.right, screenX);
        const y = Lerp(-p.top, p.top, screenY);
        const z = -p.near;
        const v = NewVector3(x, y, z);
        return p.isPerspective
            ? new Ray(NewVector3(), v.normalize())
            : new Ray(v, NewVector3(0, 0, -1));
    }

    public getWorldRay(screenX: number, screenY: number)
    {
        const localRay = this.getLocalRay(screenX, screenY);
        this.transformPoint(localRay.origin);
        this.transformDirection(localRay.direction);
        return localRay;
    }

    public getWorldRayFromMouseEvent(ev: MouseEvent)
    {
        return this.getWorldRay(ev.clientX / window.innerWidth, 1 - ev.clientY / window.innerHeight);
    }

    public getScreenPosition(worldPosition: Vector3, target: Vector3)
    {
        return target.copyFrom(worldPosition).applyMatrix4x4(Scene.lastViewProjectionMatrix);
    }
}

export class DirectionalLight extends Camera
{
    public depthFrameBuffer: WebGLFramebuffer;
    public depthTexture: WebGLTexture;
    public depthMVP = NewMatrix4x4();
    public resolution: number;
    public worldMatLocation: WebGLUniformLocation;
    public target = NewVector3();

    constructor(size: number)
    {
        super();

        this.resolution = min(gl_getParameter(gl_MAX_TEXTURE_SIZE), 2048);

        const near = -100;
        const far = 500;
        this.setProjectionMatrixOrthographic(size, size, near, far);

        this.depthFrameBuffer = gl_createFramebuffer()!;
        this.depthTexture = gl_createTexture()!;

        gl_bindTexture(gl_TEXTURE_2D, this.depthTexture);
        // use DEPTH_STENCIL for higher depth precision
        gl_texImage2D(gl_TEXTURE_2D, 0, gl_DEPTH24_STENCIL8, this.resolution, this.resolution, 0, gl_DEPTH_STENCIL, gl_UNSIGNED_INT_24_8, null);
        gl_texParameteri(gl_TEXTURE_2D, gl_TEXTURE_MIN_FILTER, gl_LINEAR);
        gl_texParameteri(gl_TEXTURE_2D, gl_TEXTURE_MAG_FILTER, gl_LINEAR);
        gl_texParameteri(gl_TEXTURE_2D, gl_TEXTURE_COMPARE_MODE, gl_COMPARE_REF_TO_TEXTURE);
        gl_bindFramebuffer(gl_FRAMEBUFFER, this.depthFrameBuffer);
        gl_framebufferTexture2D(gl_FRAMEBUFFER, gl_DEPTH_STENCIL_ATTACHMENT, gl_TEXTURE_2D, this.depthTexture, 0);

        this.worldMatLocation = GetOrCreateShadowProgram().uniformLocations.get("worldMat")!;
    }

    public prepare(camera: Camera, centerDistanceFromCamera: number)
    {
        const lightDirection = this.transform.position.clone().sub(this.target).normalize();

        // for the 2023 game, it's better to have the shadow center at a fixed position
        // so don't move the shadow with the camera
        const frustumCenter = NewVector3();

        // const frustumCenter = NewVector3(0, 0, -centerDistanceFromCamera).applyMatrix4x4(camera.localToWorldMatrix());
        const lightView = NewMatrix4x4().lookAt(frustumCenter.clone().add(lightDirection), frustumCenter, NewVector3(0, 1, 0));

        this.depthMVP.copy(this.projectionMatrix).multiply(lightView);
        const shadowProgram = GetOrCreateShadowProgram();
        gl_useProgram(shadowProgram.program);
        gl_uniformMatrix4fv(shadowProgram.uniformLocations.get("depthMVP")!, false, this.depthMVP);
    }
}

const matrixPool: Matrix4x4[] = [];

export class Scene extends SceneNode
{
    public light: DirectionalLight;
    public clearColor = NewVector3();

    public static deltaTime = 0.01;
    public static now = 0;
    public static lastViewProjectionMatrix = NewMatrix4x4();

    constructor()
    {
        super();

        gl_enable(gl_DEPTH_TEST);
        gl_depthFunc(gl_LEQUAL);
        gl_enable(gl_CULL_FACE);
        gl_cullFace(gl_BACK);

        this.light = new DirectionalLight(250);
        this.light.transform.position.setValues(0, 1, 1);

        Scene.now = performance.now() / 1000;
    }

    public updateScene(now: number)
    {
        Scene.deltaTime = now - Scene.now;
        Scene.now = now;

        accumulatedFixedDeltaTime += Scene.deltaTime;
        let fixedUpdateCount = floor(accumulatedFixedDeltaTime / fixedDeltaTime);
        accumulatedFixedDeltaTime -= fixedDeltaTime * fixedUpdateCount;

        // limit fixed update count, so there won't be thousands of fixed updates
        // if the page becomes inactive for a longer time, then activated
        fixedUpdateCount = min(fixedUpdateCount, 10);

        this.traverse(node =>
        {
            node.onUpdate = node.onUpdate.filter(callback => callback(node) !== false);

            for (let i = 0; i < fixedUpdateCount; ++i)
            {
                node.onFixedUpdate = node.onFixedUpdate.filter(callback => callback(node) !== false);
            }
        });
    }

    public renderScene(camera: Camera)
    {
        const { light, clearColor } = this;

        // shadow maps first
        gl_viewport(0, 0, light.resolution, light.resolution);
        // gl_cullFace(gl_FRONT);
        gl_bindFramebuffer(gl_FRAMEBUFFER, light.depthFrameBuffer);
        gl_clear(gl_DEPTH_BUFFER_BIT);
        light.prepare(camera, 35);
        this.renderSceneInternal(light, RenderMode.Shadow, light);
        gl_bindFramebuffer(gl_FRAMEBUFFER, null);
        // gl_cullFace(gl_BACK);

        // normal render
        gl_viewport(0, 0, globalCanvas.width, globalCanvas.height);
        gl_clearColor(clearColor.x, clearColor.y, clearColor.z, 1);
        gl_clear(gl_COLOR_BUFFER_BIT | gl_DEPTH_BUFFER_BIT);
        this.renderSceneInternal(camera, RenderMode.Normal, light);

        this.traverse(node =>
        {
            node.onAfterRender = node.onAfterRender.filter(callback => callback(node) !== false);
        });
    }

    private renderSceneInternal(camera: Camera, mode: RenderMode, light: DirectionalLight)
    {
        const viewMatrix = camera.worldToLocalMatrix();
        const cameraWorldPos = camera.worldPosition;
        const cameraWorldForward = camera.dirs.forward;
        const viewProjectionMatrix = Scene.lastViewProjectionMatrix.copy(camera.projectionMatrix).multiply(viewMatrix);

        const viewMatrices: ViewMatrices = { viewMatrix, viewProjectionMatrix, cameraPosition: cameraWorldPos };

        interface RenderData
        {
            node: SceneNode;
            worldMatrix: Matrix4x4;
            distanceFromCamera: number;
        }

        const distanceFn = camera.projectionParams!.isPerspective
            ? (worldPos: Vector3) => cameraWorldPos.distanceSqr(worldPos)
            : (worldPos: Vector3) => cameraWorldForward.dot(tmpVec3_0.copyFrom(worldPos).sub(cameraWorldPos));

        const renderData: RenderData[] = [];

        const visitNode = (node: SceneNode, worldMatrix: Matrix4x4) =>
        {
            if (!node.visible)
            {
                return;
            }

            const tmpMatrix = matrixPool.pop() ?? NewMatrix4x4();
            const currentWorldMatrix = tmpMatrix.multiplyMatrices(worldMatrix, node.transform.matrix(tmpTransformMatrix));
            const worldPos = tmpVec3_1.setScalar(0).applyMatrix4x4(currentWorldMatrix);
            renderData.push({ node, worldMatrix: currentWorldMatrix, distanceFromCamera: distanceFn(worldPos) });

            node.children.forEach(c => visitNode(c, currentWorldMatrix));
        };

        visitNode(this, this.localToWorldMatrix());

        renderData.sort((a, b) =>
        {
            const multiplier = a.node.transparent ? 1 : -1;
            if (a.node.transparent !== b.node.transparent)
            {
                // different transparency, always render opaque first
                return multiplier;
            }

            if (a.node.renderOrder !== b.node.renderOrder)
            {
                // different render order, render the node with the lower render order first
                return a.node.renderOrder - b.node.renderOrder;
            }

            // transparency and render order is the same, sort by distance
            // for opaque, render near -> far
            // for transparent, render far -> near
            return (b.distanceFromCamera - a.distanceFromCamera) * multiplier;
        });

        renderData.forEach(({ node, worldMatrix }) =>
        {
            node.render(mode, viewMatrices, worldMatrix, light);
            matrixPool.push(worldMatrix);
        });
    }
}
