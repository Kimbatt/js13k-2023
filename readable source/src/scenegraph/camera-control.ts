import { NewQuaternionFromAxisAngle, NewVector3, Quaternion, Vector3 } from "../util/linear.js";
import { Clamp, sign } from "../util/math.js";
import { Camera, SceneNode } from "./scene.js";

const mouseToScreenPercent = (speed: number, mouseDelta: number) => mouseDelta * speed / window.innerHeight;

export class CameraControl extends SceneNode
{
    public camera: Camera;

    public panSpeed = 1;
    public rotateSpeed = 2;
    public zoomSpeed = 0.05;

    // in radians
    public minPitch = -1.5707;
    public maxPitch = 1.5707;

    public minZoom = 1e-3;
    public maxZoom = 1e3;

    public minTargetPosition = NewVector3(-Infinity);
    public maxTargetPosition = NewVector3(Infinity);

    public yaw = 0;
    public pitch = 0;
    public distanceFromTarget = 2;

    constructor(camera: Camera)
    {
        super();

        this.camera = camera;
        this.add(camera);
        this.updateTransform();
    }

    public rotate(mouseDeltaX: number, mouseDeltaY: number)
    {
        const speed = this.rotateSpeed * window.innerHeight / 1000;
        this.yaw += mouseToScreenPercent(speed, mouseDeltaX);
        this.pitch += mouseToScreenPercent(speed, mouseDeltaY);
        this.updateTransform();
    }

    public pan(mouseDeltaX: number, mouseDeltaY: number)
    {
        const { right, up } = this.camera.dirs;

        const speed = this.panSpeed * window.innerHeight / 1000;
        const currentX = mouseToScreenPercent(this.distanceFromTarget * speed, mouseDeltaX);
        const currentY = mouseToScreenPercent(this.distanceFromTarget * speed, mouseDeltaY);

        const offset = right.mulScalar(currentX).sub(up.mulScalar(currentY));
        const { position } = this.transform;
        position.sub(offset);
        position.clamp(this.minTargetPosition, this.maxTargetPosition);
    }

    public zoom(mouseWheelDelta: number)
    {
        const newScale = this.distanceFromTarget * (1 + sign(mouseWheelDelta) * this.zoomSpeed);
        this.distanceFromTarget = Clamp(newScale, this.minZoom, this.maxZoom);
        this.updateTransform();
    }

    public updateTransform()
    {
        this.pitch = Clamp(this.pitch, this.minPitch, this.maxPitch);
        const horizontalRotation = NewQuaternionFromAxisAngle(0, 1, 0, -this.yaw);
        const verticalRotation = NewQuaternionFromAxisAngle(1, 0, 0, -this.pitch);
        const rotation = horizontalRotation.multiply(verticalRotation);
        const localPosition = NewVector3(0, 0, this.distanceFromTarget).applyQuaternion(rotation);

        this.camera.transform.rotation.copyFrom(rotation);
        this.camera.transform.position.copyFrom(localPosition);
    }
}
