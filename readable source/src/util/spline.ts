import { NewVector2, Vector2 } from "./linear.js";
import { Lerp, pow } from "./math.js";

const tmpVec2_0 = NewVector2();
const tmpVec2_1 = NewVector2();
const tmpVec2_2 = NewVector2();
const tmpVec2_3 = NewVector2();
const tmpVec2_4 = NewVector2();
const tmpVec2_5 = NewVector2();

export class CatmullRomSpline
{
    private points: Vector2[]; // should work with vec3 too
    private halfAlpha: number;

    constructor(points: Vector2[], alpha = 0.5)
    {
        this.points = points;
        this.halfAlpha = alpha / 2;
    }

    public getValue(t: number, target?: Vector2)
    {
        const segmentIndex = t | 0;
        t %= 1;

        const getT = (time: number, pA: Vector2, pB: Vector2) => pow(pA.distanceSqr(pB), this.halfAlpha) + time;

        const p0 = this.points[segmentIndex];
        const p1 = this.points[segmentIndex + 1];
        const p2 = this.points[segmentIndex + 2];
        const p3 = this.points[segmentIndex + 3];

        const t1 = getT(0, p0, p1);
        const t2 = getT(t1, p1, p2);
        const t3 = getT(t2, p2, p3);
        t = Lerp(t1, t2, t);

        const a1 = tmpVec2_1.copyFrom(p0).mulScalar((t1 - t) / t1).add(tmpVec2_0.copyFrom(p1).mulScalar(t / t1));
        const a2 = tmpVec2_2.copyFrom(p1).mulScalar((t2 - t) / (t2 - t1)).add(tmpVec2_0.copyFrom(p2).mulScalar((t - t1) / (t2 - t1)));
        const a3 = tmpVec2_3.copyFrom(p2).mulScalar((t3 - t) / (t3 - t2)).add(tmpVec2_0.copyFrom(p3).mulScalar((t - t2) / (t3 - t2)));
        const b1 = tmpVec2_4.copyFrom(a1).mulScalar((t2 - t) / t2).add(tmpVec2_0.copyFrom(a2).mulScalar(t / t2));
        const b2 = tmpVec2_5.copyFrom(a2).mulScalar((t3 - t) / (t3 - t1)).add(tmpVec2_0.copyFrom(a3).mulScalar((t - t1) / (t3 - t1)));
        return (target ?? NewVector2()).copyFrom(b1.mulScalar((t2 - t) / (t2 - t1)).add(b2.mulScalar((t - t1) / (t2 - t1))));
    }

    public get maxTime()
    {
        return this.points.length - 3;
    }

    public samplePoints(timeStep: number)
    {
        const { maxTime } = this;

        const result: Vector2[] = [];

        let t = 0;
        while (t < maxTime)
        {
            result.push(this.getValue(t));
            t += timeStep;
        }

        if (maxTime - t > 1e-3)
        {
            result.push(this.getValue(maxTime));
        }

        return result;
    }
}
