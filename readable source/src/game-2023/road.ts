import { Geometry } from "../scenegraph/geometry.js";
import { NewVector2, Vector2 } from "../util/linear.js";

const tmp0 = NewVector2();
const tmp1 = NewVector2();
const tmpResult = NewVector2();

export function GetOffsetDirection(prevPoint: Vector2, currentPoint: Vector2, nextPoint: Vector2, offset: number, target: Vector2)
{
    const dir0 = tmp0.copyFrom(currentPoint).sub(prevPoint).normalize();
    const dir1 = tmp1.copyFrom(nextPoint).sub(currentPoint).normalize();
    const bisector = dir0.add(dir1).normalize();
    return target.setValues(bisector.y, -bisector.x).mulScalar(offset);
}

export function CreateRoadGeometry(polyline: number[], widthRadius: number): Geometry
{
    const prev = NewVector2();
    const current = NewVector2();
    const next = NewVector2();

    // const prevDir = tmp0.clone().setValues(polyline[2], polyline[3]).sub(tmp1.setValues(polyline[0], polyline[1]));
    // prevDir.setValues(prevDir.y, -prevDir.x);

    const vertices: number[] = [];
    const triangles: number[] = [];
    const normals: number[] = [];

    for (let i = 2; i < polyline.length - 2; i += 2)
    {
        prev.setValues(polyline[i - 2], polyline[i - 1]);
        current.setValues(polyline[i], polyline[i + 1]);
        next.setValues(polyline[i + 2], polyline[i + 3]);

        GetOffsetDirection(prev, current, next, widthRadius, tmpResult);

        vertices.push(
            current.x + tmpResult.x, 0, current.y + tmpResult.y,
            current.x - tmpResult.x, 0, current.y - tmpResult.y
        );

        if (i !== polyline.length - 4)
        {
            triangles.push(
                i - 2, i - 1, i,
                i, i - 1, i + 1
            );
        }
    }

    for (let i = 0; i < vertices.length; i += 3)
    {
        normals.push(0, 1, 0);
    }

    return { vertices: new Float32Array(vertices), triangles: new Uint32Array(triangles), normals: new Float32Array(normals) };
}
