import { actx, CreateNoiseNode } from "../audio/audio.js";
import { Drum, HiHat, Snare } from "../audio/instruments/percussion.js";
import { Bass1, Guitar1, Guitar2, Guitar5, Guitar6 } from "../audio/instruments/string.js";
import { Mulberry32 } from "../util/util.js";

export function SwordImpactSound(target: AudioNode)
{
    const when = actx.currentTime + 0.05;

    function PlaySound(freq: number, fadeOutDuration: number, volume: number)
    {
        const sourceNode = actx.createOscillator();
        const startFreq = freq;
        sourceNode.frequency.value = startFreq;

        Drum(volume, when, sourceNode, false, 0, 0, 0.001, fadeOutDuration, 0.001, undefined, target);
    }

    PlaySound(6000, 0.1, 0.5);
    PlaySound(5000, 0.9, 0.3);
    PlaySound(4500, 0.3, 0.3);
    PlaySound(3500, 0.4, 1);
    PlaySound(1500, 1, 0.4);
    HiHat(when, 3500, 0.13, target);
}

export function BowShotSound(target: AudioNode)
{
    const when = actx.currentTime + 0.05;
    Snare(when, 0.05, target);
    Drum(0.3, when + 0.01, CreateNoiseNode(), false, 0, 0, 0.05, 0.5, 0.001, undefined, target);
}

export function StartMusic()
{
    let scheduledDuration = actx.currentTime + 0.1;
    let scheduledCount = 0;

    let duration = 6;
    const scheduleAheadTime = 3;

    let rng = Mulberry32(0);
    let noteRng = Mulberry32(0);

    let update = () =>
    {
        const half = duration / 2;
        const quarter = duration / 4;
        const eight = duration / 8;
        const sixteenth = duration / 16;
        const thirtytwoeth = duration / 32;
        const sixtyFourth = duration / 64;

        const elapsed = actx.currentTime;
        const requiredDuration = elapsed + scheduleAheadTime;

        while (scheduledDuration < requiredDuration)
        {
            if (scheduledCount++ % 2 === 0)
            {
                const maxNoteSequenceCount = 10;
                noteRng = Mulberry32(rng() * maxNoteSequenceCount | 0);
            }

            const currentStart = scheduledDuration;
            scheduledDuration += duration;

            const guitar = (octave: number, note: number, when: number) => Guitar2(octave, note, 1, when, 0.2, undefined, 0.5 + rng() * 4);
            const bass = (octave: number, note: number, when: number) => Bass1(octave, note, 0.4, when, 0.2, 0.4, 0.1);

            let when = currentStart;

            when += eight;
            const snareDuration = 0.4;
            Snare(when, snareDuration);
            when += quarter;
            Snare(when, snareDuration);
            when += quarter;
            Snare(when, snareDuration);
            when += quarter;
            Snare(when, snareDuration);

            const tones = [
                [0, 2, 4, 7, 9],
                [2, 4, 7, 9, 12],
                [4, 7, 9, 12, 14]
            ];
            const row = tones[noteRng() * tones.length | 0];
            const randomTone = () => row[noteRng() * row.length | 0] - 3;

            for (let i = 0; i < 16; ++i)
            {
                let tone = randomTone();
                bass(2, tone, currentStart + sixteenth * i);

                if (noteRng() > 0.8)
                {
                    guitar(2, tone, currentStart + thirtytwoeth * (i * 2));
                    guitar(2, randomTone(), currentStart + thirtytwoeth * (i * 2 + 1));
                }
                else
                {
                    guitar(2, tone, currentStart + sixteenth * i);
                }

                ++i;

                tone = randomTone();
                const r = noteRng();
                if (r > 0.95) { }
                else if (r > 0.6)
                {
                    guitar(2, tone, currentStart + thirtytwoeth * (i * 2));
                    guitar(2, randomTone(), currentStart + thirtytwoeth * (i * 2 + 1));
                }
                else
                {
                    guitar(2, tone, currentStart + sixteenth * i);
                }
            }
        }
    };

    update();
    const interval = setInterval(update, 1379);
    return {
        stop: () => clearInterval(interval),
        setDuration: (d: number) => duration = d
    };
}
