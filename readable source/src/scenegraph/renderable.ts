import { Geometry } from "./geometry.js";
import
{
    gl_ARRAY_BUFFER,
    gl_bindBuffer,
    gl_bindVertexArray,
    gl_bufferData,
    gl_createBuffer,
    gl_createVertexArray,
    gl_deleteBuffer,
    gl_ELEMENT_ARRAY_BUFFER,
    gl_enableVertexAttribArray,
    gl_FLOAT,
    gl_STATIC_DRAW,
    gl_vertexAttribPointer
} from "./global-canvas.js";
import { SceneNode } from "./scene.js";

interface GeometryData
{
    vao: WebGLVertexArrayObject;
    vertexBuffer: WebGLBuffer;
    indexBuffer: WebGLBuffer;
    triangleCount: number;
    useCount: number;
}

const geometryMap = new Map<Geometry, GeometryData>();

export class Renderable extends SceneNode
{
    public vao: WebGLVertexArrayObject;
    public triangleCount: number;

    private vertexBuffer: WebGLBuffer;
    private indexBuffer: WebGLBuffer;

    private geometry: Geometry;

    constructor(geometry: Geometry, positionLoc: number, normalLoc?: number)
    {
        super();
        this.geometry = geometry;

        const data = geometryMap.get(geometry);
        if (data !== undefined)
        {
            this.vao = data.vao;
            this.vertexBuffer = data.vertexBuffer;
            this.indexBuffer = data.indexBuffer;
            ++data.useCount;
        }
        else
        {
            this.vao = gl_createVertexArray()!;
            gl_bindVertexArray(this.vao);

            // setup buffers

            this.vertexBuffer = gl_createBuffer()!;
            gl_bindBuffer(gl_ARRAY_BUFFER, this.vertexBuffer);
            gl_bufferData(gl_ARRAY_BUFFER, geometry.vertices, gl_STATIC_DRAW);
            gl_enableVertexAttribArray(positionLoc);
            gl_vertexAttribPointer(positionLoc, 3, gl_FLOAT, false, 0, 0);

            this.indexBuffer = gl_createBuffer()!;
            gl_bindBuffer(gl_ELEMENT_ARRAY_BUFFER, this.indexBuffer);
            gl_bufferData(gl_ELEMENT_ARRAY_BUFFER, geometry.triangles, gl_STATIC_DRAW);

            if (geometry.normals && normalLoc !== undefined)
            {
                const normalBuffer = gl_createBuffer()!;
                gl_bindBuffer(gl_ARRAY_BUFFER, normalBuffer);
                gl_bufferData(gl_ARRAY_BUFFER, geometry.normals, gl_STATIC_DRAW);
                gl_enableVertexAttribArray(normalLoc);
                gl_vertexAttribPointer(normalLoc, 3, gl_FLOAT, true, 0, 0);
            }

            gl_bindVertexArray(null);

            geometryMap.set(geometry, {
                vao: this.vao,
                vertexBuffer: this.vertexBuffer,
                indexBuffer: this.indexBuffer,
                triangleCount: geometry.triangles.length,
                useCount: 1
            });
        }

        this.triangleCount = geometry.triangles.length;
    }

    public dispose()
    {
        const data = geometryMap.get(this.geometry);
        if (data && --data.useCount === 0)
        {
            gl_deleteBuffer(data.vertexBuffer);
            gl_deleteBuffer(data.indexBuffer);
            geometryMap.delete(this.geometry);
        }

        super.dispose();
    }
}
