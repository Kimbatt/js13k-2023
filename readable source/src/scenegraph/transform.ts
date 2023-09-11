import { Matrix4x4, NewMatrix4x4, NewQuaternion, NewVector3, Quaternion, Vector3 } from "../util/linear.js";

export class Transform
{
    public position = NewVector3();
    public rotation = NewQuaternion();
    public scale = NewVector3(1, 1, 1);

    public matrix = (target?: Matrix4x4) => (target ?? NewMatrix4x4()).compose(this.position, this.rotation, this.scale);

    public matrixInverse = (target?: Matrix4x4) =>
    {
        const invRotation = this.rotation.clone().invert();
        return (target ?? NewMatrix4x4()).compose(
            this.position.clone().mulScalar(-1).applyQuaternion(invRotation),
            invRotation,
            NewVector3(1, 1, 1).div(this.scale)
        );
    }
}
