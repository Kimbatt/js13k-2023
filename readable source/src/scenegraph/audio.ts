import { actx, globalTargetNode } from "../audio/audio.js";
import { Vector3 } from "../util/linear.js";
import { SceneNode } from "./scene.js";

// need to use setPosition/setPosition because firefox doesn't support the other method

// function UpdateAudioVector(x: AudioParam, y: AudioParam, z: AudioParam, v: Vector3)
// {
//     // need to update the audio params with a delay and with a transition, otherwise the audio will crackle
//     // a very small delay is not noticeable anyways
//     const delay = 0.02;
//     const now = actx.currentTime;
//     x.linearRampToValueAtTime(v.x, now + delay);
//     y.linearRampToValueAtTime(v.y, now + delay);
//     z.linearRampToValueAtTime(v.z, now + delay);
// }

export function AttachAudioListener(node: SceneNode)
{
    const { listener } = actx;

    node.onAfterRender.push(() =>
    {
        const worldPos = node.worldPosition;
        const { up, forward } = node.dirs;

        if (isNaN(worldPos.x) || isNaN(worldPos.y) || isNaN(worldPos.z) ||
            !isFinite(worldPos.x) || !isFinite(worldPos.y) || !isFinite(worldPos.z))
        {
            debugger;
        }

        listener.setPosition(worldPos.x, worldPos.y, worldPos.z);
        listener.setOrientation(forward.x, forward.y, forward.z, up.x, up.y, up.z);

        // UpdateAudioVector(listener.positionX, listener.positionY, listener.positionZ, node.worldPosition);
        // UpdateAudioVector(listener.forwardX, listener.forwardY, listener.forwardZ, forward);
        // UpdateAudioVector(listener.upX, listener.upY, listener.upZ, up);
    });
}

export function AttachAudioSource(node: SceneNode)
{
    const panner = actx.createPanner();
    const gain = actx.createGain();
    gain.gain.value = 0.2;
    panner.connect(gain).connect(globalTargetNode);
    panner.refDistance = 10;

    node.onAfterRender.push(() =>
    {
        const worldPos = node.worldPosition;
        const forward = node.dirs.forward;

        if (isNaN(worldPos.x) || isNaN(worldPos.y) || isNaN(worldPos.z) ||
            !isFinite(worldPos.x) || !isFinite(worldPos.y) || !isFinite(worldPos.z))
        {
            debugger;
            const worldPos2 = node.worldPosition;

            if (true)
            {

            }
        }

        panner.setPosition(worldPos.x, worldPos.y, worldPos.z);
        panner.setOrientation(forward.x, forward.y, forward.z);
        // UpdateAudioVector(panner.positionX, panner.positionY, panner.positionZ, node.worldPosition);
        // UpdateAudioVector(panner.orientationX, panner.orientationY, panner.orientationZ, node.dirs.forward);
    });

    return panner;
}
