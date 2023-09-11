import { Smoothstep, sqrt } from "../util/math.js";
import { Mulberry32 } from "../util/util.js";

export type NumberArray = number[] | Float32Array;

export const globalVolume = 0.2;

let hadFirstInteraction = false;
export async function EnsureContextCreated()
{
    if (hadFirstInteraction)
    {
        return;
    }

    await new Promise<void>(resolve =>
    {
        function OnInteraction()
        {
            hadFirstInteraction = true;
            window.removeEventListener("pointerdown", OnInteraction);
            window.removeEventListener("keydown", OnInteraction);
            resolve();
        }

        window.addEventListener("pointerdown", OnInteraction);
        window.addEventListener("keydown", OnInteraction);
    });
}

function GenerateCurve(numSamples: number, curve: (t: number) => number)
{
    return new Float32Array(numSamples).map((_, idx) => curve(idx / (numSamples - 1)));
}

export const linearFadeOutCurve = GenerateCurve(2, t => 1 - t);
export const sqrtFadeOutCurve = GenerateCurve(16, t => sqrt(1 - t));
export const x2FadeOutCurve = GenerateCurve(16, t => (1 - t) ** 2);
export const x4FadeOutCurve = GenerateCurve(16, t => (1 - t) ** 4);
export const x8FadeOutCurve = GenerateCurve(16, t => (1 - t) ** 8);
export const x16FadeOutCurve = GenerateCurve(16, t => (1 - t) ** 16);
export const smoothStepFadeOutCurve = GenerateCurve(16, t => Smoothstep(0, 1, 1 - t));


// await EnsureContextCreated();

export const actx = new AudioContext();

export const globalVolumeNode = actx.createGain();
globalVolumeNode.gain.value = globalVolume;

export const globalFilterNode = actx.createBiquadFilter();
globalFilterNode.type = "lowpass";
globalFilterNode.frequency.value = 20000;

globalFilterNode.connect(globalVolumeNode).connect(actx.destination);

export const globalTargetNode: AudioNode = globalFilterNode;

const rng = Mulberry32(0);
const noiseBuffers: AudioBuffer[] = [];
for (let i = 0; i < 10; ++i)
{
    const noiseSamplesLeft = new Float32Array(actx.sampleRate).map(_ => rng() * 2 - 1);
    const noiseSamplesRight = new Float32Array(actx.sampleRate).map(_ => rng() * 2 - 1);

    const noiseBuffer = actx.createBuffer(2, actx.sampleRate * 1, actx.sampleRate);
    noiseBuffer.copyToChannel(noiseSamplesLeft, 0);
    noiseBuffer.copyToChannel(noiseSamplesRight, 1);
    noiseBuffers.push(noiseBuffer);
}

export function CreateNoiseNode(bufferIdx = 0)
{
    const node = actx.createBufferSource();
    node.buffer = noiseBuffers[bufferIdx];
    node.loop = true;
    return node;
}
