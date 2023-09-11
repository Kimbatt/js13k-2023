import { NewVector3, Vector3 } from "./linear.js";

export class Ray
{
    public origin: Vector3;
    public direction: Vector3;

    constructor(origin: Vector3, direction: Vector3)
    {
        this.origin = origin.clone();
        this.direction = direction.clone().normalize();
    }

    public getPoint = (distance: number, target?: Vector3) => (target ?? NewVector3()).copyFrom(this.direction).mulScalar(distance).add(this.origin);
}

export function GroundPlaneLineIntersectionDistance({ origin, direction }: Ray)
{
    // ground plane is on the y axis, 0 coordinate
    return -origin.y / direction.y;
}

export function IntersectRayBoundingBox({ origin, direction }: Ray, bboxMin: Vector3, bboxMax: Vector3): number | null
{
    let tmin = -Infinity;
    let tmax = Infinity;

    // order is important for min/max, it will get rid of NaN values
    const min_ = (x: number, y: number) => x < y ? x : y;
    const max_ = (x: number, y: number) => x > y ? x : y;

    const invDir = NewVector3(1).div(direction); // can have infinity if a component is zero

    for (let i = 0; i < 3; ++i)
    {
        const t1 = (bboxMin[i] - origin[i]) * invDir[i];
        const t2 = (bboxMax[i] - origin[i]) * invDir[i];

        tmin = min_(max_(t1, tmin), max_(t2, tmin));
        tmax = max_(min_(t1, tmax), min_(t2, tmax));
    }

    if (tmin > tmax)
    {
        return null;
    }

    if (tmax < 0)
    {
        return null
    }

    if (tmin < 0)
    {
        tmin = tmax;
    }

    return tmin;
}
