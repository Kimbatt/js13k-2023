import { Matrix4x4, NewMatrix4x4, NewQuaternion, NewQuaternionFromAxisAngle, NewVector2, NewVector3, Quaternion, Vector2, Vector3 } from "../util/linear.js";
import { cos, NegHalfPI, PI, sin, TwoPI } from "../util/math.js";

export interface Geometry
{
    vertices: Float32Array;
    triangles: Uint32Array;
    normals: Float32Array;
}

export function JoinGeometries(...geometries: Geometry[]): Geometry
{
    const vertices: number[] = [];
    const triangles: number[] = [];
    const normals: number[] = [];

    for (const geometry of geometries)
    {
        const startIndex = vertices.length / 3;
        vertices.push(...geometry.vertices);
        normals.push(...geometry.normals);
        triangles.push(...geometry.triangles.map(tri => tri + startIndex));
    }

    return { vertices: new Float32Array(vertices), triangles: new Uint32Array(triangles), normals: new Float32Array(normals) };
}

export function TransformGeometry(geometry: Geometry, transform: Matrix4x4)
{
    const { vertices, normals } = geometry;
    const normalTransform = transform.topLeft3x3().invert().transpose();

    const v = NewVector3();
    for (let i = 0; i < vertices.length; i += 3)
    {
        v.set(vertices.slice(i, i + 3));
        v.applyMatrix4x4(transform);
        vertices.set(v, i);

        v.set(normals.slice(i, i + 3));
        v.applyMatrix3x3(normalTransform);
        normals.set(v, i);
    }

    return geometry;
}

const tmpTransformMatrix = NewMatrix4x4();

export function TranslateGeometry(geometry: Geometry, x: number, y: number, z: number)
{
    return TransformGeometry(geometry, tmpTransformMatrix.compose(NewVector3(x, y, z), NewQuaternion(), NewVector3(1)));
}

export function RotateGeometry(geometry: Geometry, rotation: Quaternion)
{
    return TransformGeometry(geometry, tmpTransformMatrix.compose(NewVector3(), rotation, NewVector3(1)));
}

export function RotateGeometryWithAxisAngle(geometry: Geometry, x: number, y: number, z: number, angle: number)
{
    return RotateGeometry(geometry, NewQuaternionFromAxisAngle(x, y, z, angle));
}

export function CloneGeometry(geometry: Geometry): Geometry
{
    // @ts-ignore
    return structuredClone(geometry)
}

export function CreateBoxGeometry(width = 1, height = 1, depth = 1): Geometry
{
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const halfDepth = depth / 2;

    const vertices = new Float32Array([
        // back
        -halfWidth, -halfHeight, -halfDepth,
        halfWidth, -halfHeight, -halfDepth,
        -halfWidth, halfHeight, -halfDepth,
        halfWidth, halfHeight, -halfDepth,

        // front
        halfWidth, -halfHeight, halfDepth,
        -halfWidth, -halfHeight, halfDepth,
        halfWidth, halfHeight, halfDepth,
        -halfWidth, halfHeight, halfDepth,

        // bottom
        halfWidth, -halfHeight, -halfDepth,
        -halfWidth, -halfHeight, -halfDepth,
        halfWidth, -halfHeight, halfDepth,
        -halfWidth, -halfHeight, halfDepth,

        // top
        -halfWidth, halfHeight, -halfDepth,
        halfWidth, halfHeight, -halfDepth,
        -halfWidth, halfHeight, halfDepth,
        halfWidth, halfHeight, halfDepth,

        // left
        -halfWidth, -halfHeight, -halfDepth,
        -halfWidth, halfHeight, -halfDepth,
        -halfWidth, -halfHeight, halfDepth,
        -halfWidth, halfHeight, halfDepth,

        // right
        halfWidth, halfHeight, -halfDepth,
        halfWidth, -halfHeight, -halfDepth,
        halfWidth, halfHeight, halfDepth,
        halfWidth, -halfHeight, halfDepth,
    ]);

    const triangles = new Uint32Array([
        0,
        0 + 3,
        0 + 1,
        0,
        0 + 2,
        0 + 3,

        4,
        4 + 3,
        4 + 1,
        4,
        4 + 2,
        4 + 3,

        8,
        8 + 3,
        8 + 1,
        8,
        8 + 2,
        8 + 3,

        12,
        12 + 3,
        12 + 1,
        12,
        12 + 2,
        12 + 3,

        16,
        16 + 3,
        16 + 1,
        16,
        16 + 2,
        16 + 3,

        20,
        20 + 3,
        20 + 1,
        20,
        20 + 2,
        20 + 3,
    ]);

    const normals = new Float32Array([
        // front
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,

        // back
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,

        // bottom
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,

        // top
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,

        // left
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,

        // right
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
    ]);

    return { vertices, triangles, normals };
}

export function CreateSphereGeometry(radius = 1, horizontalSubdivisions = 16, verticalSubdivisions = 24): Geometry
{
    // just convert normals to vertices later by multiplying with the radius
    const normals: number[] = [];
    const triangles: number[] = [];

    // note: the geometry is not closed, and contains degenerate triangles at the poles
    // but this allows the code to be smaller, and it doesn't affect the rendering anyways

    for (let i = 0; i < horizontalSubdivisions; ++i)
    {
        const angleY = NegHalfPI + PI * i / (horizontalSubdivisions - 1);
        const yCoord = sin(-angleY);
        const yMultiplier = cos(-angleY);

        for (let j = 0; j < verticalSubdivisions; ++j)
        {
            const angleXZ = TwoPI * j / (verticalSubdivisions - 1);
            normals.push(cos(angleXZ) * yMultiplier, yCoord, sin(angleXZ) * yMultiplier);
        }
    }

    // triangles
    for (let i = 0; i < horizontalSubdivisions; ++i)
    {
        const startIndex = i * verticalSubdivisions;
        const nextRowStartIndex = startIndex + verticalSubdivisions;

        for (let j = 0; j < verticalSubdivisions; ++j)
        {
            triangles.push(
                startIndex + j,
                startIndex + j + 1,
                nextRowStartIndex + j + 1,

                startIndex + j,
                nextRowStartIndex + j + 1,
                nextRowStartIndex + j
            );
        }
    }

    const normalsF32 = new Float32Array(normals);
    return { vertices: normalsF32.map(n => n * radius), triangles: new Uint32Array(triangles), normals: normalsF32 };
}

export function CreateCapsuleGeometry(radius = 1, height = 1, horizontalSubdivisions = 16, verticalSubdivisions = 24): Geometry
{
    // the capsule is on the y axis
    const vertices: number[] = [];
    const normals: number[] = [];
    const triangles: number[] = [];

    // note: the geometry is not closed, and contains degenerate triangles at the poles
    // but this allows the code to be smaller, and it doesn't affect the rendering anyways

    // TODO: make sure this works properly

    for (let i = 0; i <= horizontalSubdivisions / 2; ++i)
    {
        const angleY = NegHalfPI + PI * i / (horizontalSubdivisions - 1);
        const yCoord = sin(-angleY);
        const yMultiplier = cos(-angleY);

        for (let j = 0; j < verticalSubdivisions; ++j)
        {
            const angleXZ = TwoPI * j / (verticalSubdivisions - 1);
            const x = cos(angleXZ) * yMultiplier;
            const y = yCoord;
            const z = sin(angleXZ) * yMultiplier;
            normals.push(x, y, z);
            vertices.push(x * radius, y * radius + height / 2, z * radius);
        }
    }

    for (let i = horizontalSubdivisions / 2; i < horizontalSubdivisions; ++i)
    {
        const angleY = NegHalfPI + PI * i / (horizontalSubdivisions - 1);
        const yCoord = sin(-angleY);
        const yMultiplier = cos(-angleY);

        for (let j = 0; j < verticalSubdivisions; ++j)
        {
            const angleXZ = TwoPI * j / (verticalSubdivisions - 1);
            const x = cos(angleXZ) * yMultiplier;
            const y = yCoord;
            const z = sin(angleXZ) * yMultiplier;
            normals.push(x, y, z);
            vertices.push(x * radius, y * radius - height / 2, z * radius);
        }
    }

    // triangles
    for (let i = 0; i < horizontalSubdivisions + 1; ++i)
    {
        const startIndex = i * verticalSubdivisions;
        const nextRowStartIndex = startIndex + verticalSubdivisions;

        for (let j = 0; j < verticalSubdivisions; ++j)
        {
            triangles.push(
                startIndex + j,
                startIndex + j + 1,
                nextRowStartIndex + j + 1,

                startIndex + j,
                nextRowStartIndex + j + 1,
                nextRowStartIndex + j
            );
        }
    }

    return { vertices: new Float32Array(vertices), triangles: new Uint32Array(triangles), normals: new Float32Array(normals) };
}

export function CreateCylinderGeometry(height: number, bottomRadius: number, topRadius: number, subdivisions = 16): Geometry
{
    const halfHeight = height / 2;

    // the cylinder is on the y axis
    const vertices: number[] = [];
    const normals: number[] = [];
    const triangles: number[] = [];

    // around
    for (let i = 0; i <= subdivisions; ++i)
    {
        const t = i / subdivisions * TwoPI;
        const c = cos(t);
        const s = sin(t);

        vertices.push(
            c * bottomRadius, -halfHeight, s * bottomRadius,
            c * topRadius, halfHeight, s * topRadius
        );

        normals.push(
            c, 0, s,
            c, 0, s
        );
    }

    vertices.push(...vertices); // copy all vertices for top/bottom

    // top/bottom normals
    for (let i = 0; i <= subdivisions; ++i)
    {
        normals.push(
            0, -1, 0,
            0, 1, 0
        );
    }

    // triangles

    // sides
    for (let i = 0; i < subdivisions * 2; i += 2)
    {
        triangles.push(
            i, i + 1, i + 3,
            i, i + 3, i + 2,
        );
    }

    // top/bottom
    const baseIndex = (subdivisions + 1) * 2;
    for (let i = 2; i < subdivisions; ++i)
    {
        triangles.push(
            baseIndex, baseIndex + i * 2 - 2, baseIndex + i * 2,
            baseIndex + 1, baseIndex + i * 2 + 1, baseIndex + i * 2 - 1,
        );
    }

    return { vertices: new Float32Array(vertices), normals: new Float32Array(normals), triangles: new Uint32Array(triangles) };
}

export function CreatePlaneGeometry(width = 1, depth = 1)
{
    const halfWidth = width / 2;
    const halfDepth = depth / 2;

    const vertices = new Float32Array([
        // bottom
        halfWidth, 0, -halfDepth,
        -halfWidth, 0, -halfDepth,
        halfWidth, 0, halfDepth,
        -halfWidth, 0, halfDepth,

        // top
        -halfWidth, 0, -halfDepth,
        halfWidth, 0, -halfDepth,
        -halfWidth, 0, halfDepth,
        halfWidth, 0, halfDepth,
    ]);

    const triangles = new Uint32Array([
        0,
        0 + 3,
        0 + 1,
        0,
        0 + 2,
        0 + 3,

        4,
        4 + 3,
        4 + 1,
        4,
        4 + 2,
        4 + 3
    ]);

    const normals = new Float32Array([
        // bottom
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,

        // top
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0
    ]);

    return { vertices, triangles, normals };
}

export function CreateExtrudedGeometryConvex(polyline: number[], extrudeThickness: number): Geometry
{
    // triangulated from the first point in the polygon, so it's only guaranteed to work for convex polygons
    // polyline is in the xy plane, extruded in the z direction
    const vertices: number[] = [];
    const triangles: number[] = [];
    const normals: number[] = [];

    const points: Vector2[] = [];
    for (let i = 0; i < polyline.length; i += 2)
    {
        points.push(NewVector2(polyline[i], polyline[i + 1]));
    }

    // front and back
    for (const point of points)
    {
        vertices.push(point.x, point.y, extrudeThickness / -2);
        vertices.push(point.x, point.y, extrudeThickness / 2);
        normals.push(0, 0, -1);
        normals.push(0, 0, 1);
    }

    for (let i = 2; i < points.length; ++i)
    {
        const i1 = i - 1;
        triangles.push(
            0, i1 * 2, i * 2,
            1, i * 2 + 1, i1 * 2 + 1
        );
    }

    // sides
    let prev = points[points.length - 1];
    for (const point of points)
    {
        const idx = vertices.length / 3;
        vertices.push(
            prev.x, prev.y, extrudeThickness / 2,
            prev.x, prev.y, extrudeThickness / -2,
            point.x, point.y, extrudeThickness / 2,
            point.x, point.y, extrudeThickness / -2,
        );

        const normal = point.clone().sub(prev).normalize();
        const x = normal.x;
        normal.x = -normal.y;
        normal.y = x;
        prev = point;

        normals.push(normal.x, normal.y, 0);
        normals.push(normal.x, normal.y, 0);
        normals.push(normal.x, normal.y, 0);
        normals.push(normal.x, normal.y, 0);

        triangles.push(idx, idx + 3, idx + 1, idx, idx + 2, idx + 3);
    }

    return { vertices: new Float32Array(vertices), triangles: new Uint32Array(triangles), normals: new Float32Array(normals) };
}

export function FlatShade(geometry: Geometry)
{
    // separates all triangles, and calculates flat normals

    const { vertices, triangles, normals } = geometry;

    const newVertices: number[] = [];
    const newTriangles: number[] = [];
    const newNormals: number[] = [];

    const tmpVec3_0 = NewVector3();
    const tmpVec3_1 = NewVector3();
    const tmpVec3_2 = NewVector3();

    for (let i = 0; i < triangles.length; i += 3)
    {
        const idx0 = triangles[i] * 3;
        const idx1 = triangles[i + 1] * 3;
        const idx2 = triangles[i + 2] * 3;

        tmpVec3_0.set(vertices.subarray(idx0, idx0 + 3));
        tmpVec3_1.set(vertices.subarray(idx1, idx1 + 3));
        tmpVec3_2.set(vertices.subarray(idx2, idx2 + 3));
        newVertices.push(...tmpVec3_0, ...tmpVec3_1, ...tmpVec3_2);
        newTriangles.push(i, i + 1, i + 2);

        tmpVec3_1.sub(tmpVec3_0);
        tmpVec3_2.sub(tmpVec3_0);
        tmpVec3_0.crossVectors(tmpVec3_1, tmpVec3_2).normalize();

        newNormals.push(...tmpVec3_0, ...tmpVec3_0, ...tmpVec3_0);
    }

    geometry.vertices = new Float32Array(newVertices);
    geometry.triangles = new Uint32Array(newTriangles);
    geometry.normals = new Float32Array(newNormals);
    return geometry;
}
