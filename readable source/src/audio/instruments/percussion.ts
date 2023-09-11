import { actx, CreateNoiseNode, globalTargetNode, linearFadeOutCurve, NumberArray, x4FadeOutCurve } from "../audio.js";

export function Drum(volume: number, when: number, sourceNode: AudioScheduledSourceNode, filter: boolean, filterFrequency: number, Q: number,
    fadeInDuration = 0.01, fadeOutDuration = 0.1, duration = 0, fadeOutCurve: number[] | Float32Array = x4FadeOutCurve, target?: AudioNode)
{
    const gainNode = actx.createGain();
    const filterNode = actx.createBiquadFilter();

    gainNode.gain.value = 0;
    let time = when;
    gainNode.gain.linearRampToValueAtTime(0, time);
    time += fadeInDuration;
    gainNode.gain.linearRampToValueAtTime(volume, time);
    time += duration;
    gainNode.gain.setValueCurveAtTime(fadeOutCurve.map(v => v * volume), time, fadeOutDuration);
    time += fadeOutDuration;

    filterNode.type = filter ? "bandpass" : "allpass";
    filterNode.frequency.value = filterFrequency;
    filterNode.Q.value = Q;

    sourceNode.connect(gainNode).connect(filterNode).connect(target ?? globalTargetNode);

    sourceNode.start(when);
    sourceNode.stop(time);
}

// dampened
export function Kick1(when: number)
{
    const volume = 1;
    {
        const sourceNode = actx.createOscillator();
        const startFreq = 120;
        const timeOffset = 0;
        sourceNode.frequency.value = startFreq;
        sourceNode.frequency.linearRampToValueAtTime(startFreq, when + 0.01 + timeOffset);
        sourceNode.frequency.linearRampToValueAtTime(55, when + 0.03 + timeOffset);

        Drum(volume, when + timeOffset, sourceNode, false, 0, 0, 0.02, 0.4, 0.05);
    }

    {
        const sourceNode = actx.createOscillator();
        sourceNode.frequency.value = 500;

        Drum(volume * 0.1, when, sourceNode, false, 0, 0, 0.0003, 0.001, 0.0003);
    }
}

// stronger kick
export function Kick2(when: number)
{
    const volume = 1;
    Kick1(when);

    {
        const duration = 0.02;
        const vol = volume * 0.03;

        const sourceNode = actx.createOscillator();
        sourceNode.frequency.value = 4000;
        sourceNode.frequency.setValueCurveAtTime([4000, 3000, 1000, 300, 50, 50, 50, 50, 50], when, duration);
        sourceNode.start(when);
        sourceNode.stop(when + duration);

        const gain = actx.createGain();
        gain.gain.value = 0;
        gain.gain.linearRampToValueAtTime(0, when);
        gain.gain.linearRampToValueAtTime(vol, when + 0.0004);
        gain.gain.linearRampToValueAtTime(0, when + duration);

        sourceNode.connect(gain).connect(globalTargetNode);
    }

    {
        const duration = 0.01;
        const vol = volume * 0.03;

        const noiseNode = CreateNoiseNode();
        const gain = actx.createGain();
        gain.gain.value = vol;
        gain.gain.linearRampToValueAtTime(vol, when);
        gain.gain.linearRampToValueAtTime(0, when + duration);

        noiseNode.start(when);
        noiseNode.stop(when + duration);

        noiseNode.connect(gain).connect(globalTargetNode);
    }
}

export function Snare(when: number, duration = 0.25, target?: AudioNode)
{
    const volume = 0.7;
    {
        const sourceNode = actx.createOscillator();
        const startFreq = 150;
        const timeOffset = 0.005;
        sourceNode.frequency.value = startFreq;
        sourceNode.frequency.linearRampToValueAtTime(startFreq, when + 0.01 + timeOffset);
        sourceNode.frequency.linearRampToValueAtTime(70, when + 0.03 + timeOffset);

        Drum(volume, when + timeOffset, sourceNode, false, 0, 0, 0.001, 0.2, 0, undefined, target);
    }

    {
        const vol = 0.4;
        const noise = CreateNoiseNode();
        const filter = actx.createBiquadFilter();
        filter.Q.value = 0;
        filter.frequency.value = 5000;

        const gain = actx.createGain();
        noise.start(when);
        noise.stop(when + duration);

        gain.gain.value = vol;
        gain.gain.linearRampToValueAtTime(vol, when + 0.005);
        gain.gain.linearRampToValueAtTime(vol * 0.15, when + 0.01);
        gain.gain.linearRampToValueAtTime(vol * 0.15, when + 0.02);
        gain.gain.linearRampToValueAtTime(0, when + duration);

        noise.connect(filter).connect(gain).connect(target ?? globalTargetNode);
    }
}

export function Snare2(when: number, duration = 0.15)
{
    const volume = 1;
    Drum(volume, when, CreateNoiseNode(), true, 2000, 1, 0.001, 0.05, duration, linearFadeOutCurve);
}

export function HiHat(when: number, frequency = 8000, fadeOutDuration = 0.1, target?: AudioNode)
{
    const volume = 1;
    Drum(volume, when, CreateNoiseNode(), true, frequency, 3, 0.001, fadeOutDuration, 0.005, undefined, target);
}

export function HiHat2(when: number, frequency = 8000, fadeOutDuration = 0.07)
{
    const volume = 1;
    Drum(volume, when, CreateNoiseNode(), true, frequency, 3, 0.01, fadeOutDuration, 0.005, linearFadeOutCurve);
}

export function Clap(when: number, duration = 0.15)
{
    const volume = 1;
    const fadeOutCurve = [1, 0.4, 0.2, 0];

    Drum(volume, when, CreateNoiseNode(0), true, 1000, 1, 0.001, 0.005, 0.001, fadeOutCurve);
    Drum(volume, when + 0.005, CreateNoiseNode(1), true, 2000, 1, 0.001, 0.005, 0.001, fadeOutCurve);
    Drum(volume, when + 0.01, CreateNoiseNode(2), true, 1500, 2, 0.001, duration, 0.001, fadeOutCurve);
}
