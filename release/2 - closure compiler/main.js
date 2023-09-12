"use strict";
let LoadEverything = () => {
    let getElementById = document.getElementById.bind(document), createElement = document.createElement.bind(document);
    let minifiedCSS = `#overlay,.fullscreen{top:0;width:100vw;height:100vh;position:absolute;left:0}#overlay,.hb{background:#000;display:flex}body{background:#323639;color:#fff;user-select:none;font-family:Verdana,sans-serif;overflow:hidden}canvas{z-index:-10;filter:saturate(1.3) brightness(1.4) contrast(1.4);position:absolute;top:0;left:0}.fullscreen{pointer-events:none;display:flex;flex-direction:column;align-items:center;z-index:9}#overlay{opacity:1;visibility:visible;transition:opacity .5s linear,visibility .5s linear;justify-content:space-evenly;font-size:4vh;text-align:center;white-space:pre-line;flex-direction:column;justify-content:center;align-items:center;gap:5vh}.we{position:absolute;z-index:-9;transform:translate(-50%,-50%);pointer-events:none;user-select:none}.hb{width:8vh;height:.6vh}.hb>div{margin:.15vh}#bc,#bi{position:absolute;width:30vh;height:fit-content;font-size:1.2vh;background:#000000e0;border-radius:1vh;margin:1vh;padding:1.5vh;white-space:pre-line}#bi{bottom:5vh;right:20%}#bc{display:flex;flex-direction:column;bottom:0;left:0;gap:1vh}#bi>div{display:flex;flex-direction:column;gap:3vh;width:100%}button{cursor:pointer;width:100%;font-size:1.2vh;background:#0064bb;color:#fff;padding:.8vh;border:0;border-radius:1vh}button:hover{background:#4084c0}button:disabled{background:#5f6e7a;pointer-events:none}.ability-container{display:flex;flex-direction:column;gap:1vh}.title{font-size:2vh;font-weight:700}@keyframes pulse{50%{color:#c75555}}.danger{animation:1s ease-in-out infinite pulse}#overlay.hidden{opacity:0;visibility:hidden}`;
    let minifiedHTML = `<div id=bc></div><div id=bi style=display:none></div><div style=position:absolute;top:0;right:20%;display:flex;background:#000000a0;border-radius:1vh;padding:1vh;margin:1vh;font-size:2vh;gap:4vh><div style=display:flex;gap:1vh;align-items:center><div id=food-count></div><svg style=height:2vh viewBox="0 0 120 100" stroke-width=5 stroke=#000><path d="M60 100q-10 0-10-10V40c0-10-10-10-10-20Q30 0 70 0q40 0 40 20c0 10-10 10-10 20v50q0 10-10 10z" fill=#faae3b /><path d="M20 100q-10 0-10-10V40C10 30 0 30 0 20Q0 0 40 0q40 0 40 20c0 10-10 10-10 20v50q0 10-10 10z" fill=#f8e6c5 /></svg></div><div style=display:flex;gap:1vh;align-items:center><div id=gold-count></div><svg style=height:2vh viewBox="0 0 125 100" stroke-width=5 stroke=#000><circle cx=75 cy=50 r=50 fill=#ff960c /><circle cx=50 cy=50 r=50 fill=#ffc60c /></svg></div></div><div id=overlay><div id=overlay-text></div><button id=start-level style="width:auto;font-size:4vh;padding:2vh 5vh"></button></div>`;
    getElementById("st").innerHTML = minifiedCSS;
    getElementById("ui").innerHTML = minifiedHTML;
    // util/math.ts
    let { PI, abs, sin, cos, atan2, round, sqrt, sign, min, max, random, imul } = Math;
    let HalfPI = PI / 2;
    let NegHalfPI = -HalfPI;
    let TwoPI = PI * 2;
    let Lerp = (a, b, t) => a + (b - a) * t;
    let Clamp = (x, a, b) => x < a ? a : (x > b ? b : x);
    let Smoothstep = (edge0, edge1, x) => {
        let t = Clamp((x - edge0) / (edge1 - edge0), 0, 1);
        return t * t * (3 - 2 * t);
    };
    // util/util.ts
    let Mulberry32 = (seed) => () => {
        let t = seed += 0x6D2B79F5;
        t = imul(t ^ t >>> 15, t | 1);
        t ^= t + imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    let f32a = Float32Array;
    let u32a = Uint32Array;
    let RemoveItemFromArray = (arr, item) => {
        let idx = arr.indexOf(item);
        if (idx > -1) {
            arr.splice(idx, 1);
        }
    };
    /** @noinline */
    let splitmap = (s) => s.split(",").map(n => +n);
    // util/linear.ts
    class VectorBase extends f32a {
        constructor(len, elements) {
            super(len);
            this.set(elements ?? []);
        }
        c = () => this.n.set(this); // clone
        set(array, offset) {
            super.set(array, offset);
            return this;
        }
        copyFrom = (other) => this.set(other);
        setValues = (...vals) => this.set(vals);
        setScalar = (num) => this.fill(num);
        a(other) {
            for (let i = 0; i < this.length; ++i) {
                this[i] += other[i];
            }
            return this;
        }
        s(other) {
            for (let i = 0; i < this.length; ++i) {
                this[i] -= other[i];
            }
            return this;
        }
        div(other) {
            for (let i = 0; i < this.length; ++i) {
                this[i] /= other[i];
            }
            return this;
        }
        mulScalar(other) {
            for (let i = 0; i < this.length; ++i) {
                this[i] *= other;
            }
            return this;
        }
        dot(other) {
            let d = 0;
            for (let i = 0; i < this.length; ++i) {
                d += this[i] * other[i];
            }
            return d;
        }
        get lengthSqr() {
            return this.dot(this);
        }
        get len() {
            return sqrt(this.lengthSqr);
        }
        distanceSqr = (other) => this.t.copyFrom(this).s(other).lengthSqr;
        distance = (other) => this.t.copyFrom(this).s(other).len;
        r = () => this.mulScalar(1 / this.len); // normalize
        safeNormalize = () => this.len > 1e-9 ? this.mulScalar(1 / this.len) : this.setScalar(0);
        lerpVectors(a, b, t) {
            for (let i = 0; i < this.length; ++i) {
                this[i] = Lerp(a[i], b[i], t);
            }
            return this;
        }
        lerp = (other, t) => this.lerpVectors(this, other, t);
        clamp(min, max) {
            for (let i = 0; i < this.length; ++i) {
                this[i] = Clamp(this[i], min[i], max[i]);
            }
            return this;
        }
    }
    class Vector3 extends VectorBase {
        constructor(x = 0, y, z) {
            super(3, [x, y ?? x, z ?? x]);
        }
        get n() {
            return NewVector3();
        }
        get t() {
            return tmpVec3_linear_ts;
        }
        get x() {
            return this[0];
        }
        set x(v) {
            this[0] = v;
        }
        get y() {
            return this[1];
        }
        set y(v) {
            this[1] = v;
        }
        get z() {
            return this[2];
        }
        set z(v) {
            this[2] = v;
        }
        crossVectors = (a, b) => this.setValues(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
        applyQuaternion(q) {
            let [px, py, pz] = this;
            let [x, y, z, w] = q;
            let ix = w * px + y * pz - z * py;
            let iy = w * py + z * px - x * pz;
            let iz = w * pz + x * py - y * px;
            let iw = x * px + y * py + z * pz;
            this.x = ix * w + iw * x - iy * z + iz * y;
            this.y = iy * w + iw * y - iz * x + ix * z;
            this.z = iz * w + iw * z - ix * y + iy * x;
            return this;
        }
        applyMatrix3x3(mat) {
            let [x, y, z] = this;
            let [m11, m21, m31, m12, m22, m32, m13, m23, m33] = mat;
            this.x = m11 * x + m12 * y + m13 * z;
            this.y = m21 * x + m22 * y + m23 * z;
            this.z = m31 * x + m32 * y + m33 * z;
            return this;
        }
        applyMatrix4x4(mat) {
            let [x, y, z] = this;
            let [m11, m21, m31, m41, m12, m22, m32, m42, m13, m23, m33, m43, m14, m24, m34, m44] = mat;
            let iw = m41 * x + m42 * y + m43 * z + m44;
            this.x = (m11 * x + m12 * y + m13 * z + m14) / iw;
            this.y = (m21 * x + m22 * y + m23 * z + m24) / iw;
            this.z = (m31 * x + m32 * y + m33 * z + m34) / iw;
            return this;
        }
    }
    class Vector2 extends VectorBase {
        constructor(x = 0, y = 0) {
            super(2, [x, y]);
        }
        get n() {
            return NewVector2();
        }
        get t() {
            return tmpVec2;
        }
        get x() {
            return this[0];
        }
        set x(v) {
            this[0] = v;
        }
        get y() {
            return this[1];
        }
        set y(v) {
            this[1] = v;
        }
    }
    // https://github.com/mrdoob/three.js/blob/dev/src/math/Quaternion.js
    class Quaternion extends VectorBase {
        constructor(x = 0, y = 0, z = 0, w = 1) {
            super(4, [x, y, z, w]);
        }
        get n() {
            return NewQuaternion();
        }
        get t() {
            return tmpQuaternion;
        }
        setFromAxisAngle(x, y, z, angle) {
            let half = angle / 2;
            let s = sin(half);
            return this.setValues(x * s, y * s, z * s, cos(half));
        }
        invert() {
            this[3] = -this[3];
            return this;
        }
        multiplyQuaternions(a, b) {
            let [x, y, z, w] = a;
            let [bx, by, bz, bw] = b;
            return this.setValues(x * bw + w * bx + y * bz - z * by, y * bw + w * by + z * bx - x * bz, z * bw + w * bz + x * by - y * bx, w * bw - x * bx - y * by - z * bz);
        }
        multiply = (other) => this.multiplyQuaternions(this, other);
        premultiply = (other) => this.multiplyQuaternions(other, this);
        premultiplyAxisAngle = (x_, y_, z_, angle) => this.premultiply(this.t.setFromAxisAngle(x_, y_, z_, angle));
        setFromUnitVectors(from, to) {
            let r = from.dot(to) + 1;
            let [x, y, z] = from;
            if (r < 1e-7) {
                if (abs(x) > abs(z)) {
                    this.setValues(-y, x, 0, 0);
                }
                else {
                    this.setValues(0, -z, y, 0);
                }
            }
            else {
                this.setValues(y * to.z - z * to.y, z * to.x - x * to.z, x * to.y - y * to.x, r);
            }
            return this.r();
        }
    }
    // https://github.com/mrdoob/three.js/blob/dev/src/math/Matrix3.js
    class Matrix3x3 extends f32a {
        constructor() {
            super(9);
        }
        set(array, offset) {
            super.set(array, offset);
            return this;
        }
        invert() {
            let [n11, n21, n31, n12, n22, n32, n13, n23, n33] = this;
            let t11 = n33 * n22 - n32 * n23, t12 = n32 * n13 - n33 * n12, t13 = n23 * n12 - n22 * n13;
            let det = n11 * t11 + n21 * t12 + n31 * t13;
            return this.set([
                t11 / det,
                (n31 * n23 - n33 * n21) / det,
                (n32 * n21 - n31 * n22) / det,
                t12 / det,
                (n33 * n11 - n31 * n13) / det,
                (n31 * n12 - n32 * n11) / det,
                t13 / det,
                (n21 * n13 - n23 * n11) / det,
                (n22 * n11 - n21 * n12) / det,
            ]);
        }
        transpose() {
            let tmp;
            tmp = this[1];
            this[1] = this[3];
            this[3] = tmp;
            tmp = this[2];
            this[2] = this[6];
            this[6] = tmp;
            tmp = this[5];
            this[5] = this[7];
            this[7] = tmp;
            return this;
        }
    }
    // https://github.com/mrdoob/three.js/blob/dev/src/math/Matrix4.js
    class Matrix4x4 extends f32a {
        constructor() {
            super(16);
        }
        c = () => NewMatrix4x4().set(this); // clone
        set(array, offset) {
            super.set(array, offset);
            return this;
        }
        m = (other) => // multiply
         this.multiplyMatrices(this, other);
        p = (other) => // premultiply
         this.multiplyMatrices(other, this);
        multiplyMatrices(a, b) {
            let [a11, a21, a31, a41, a12, a22, a32, a42, a13, a23, a33, a43, a14, a24, a34, a44] = a;
            let [b11, b21, b31, b41, b12, b22, b32, b42, b13, b23, b33, b43, b14, b24, b34, b44] = b;
            return this.set([
                a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41,
                a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41,
                a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41,
                a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41,
                a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42,
                a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42,
                a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42,
                a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42,
                a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43,
                a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43,
                a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43,
                a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43,
                a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44,
                a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44,
                a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44,
                a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44,
            ]);
        }
        compose(position, rotation, scale) {
            let [x, y, z, w] = rotation;
            let [sx, sy, sz] = scale;
            let x2 = x + x;
            let y2 = y + y;
            let z2 = z + z;
            let xx = x * x2;
            let xy = x * y2;
            let xz = x * z2;
            let yy = y * y2;
            let yz = y * z2;
            let zz = z * z2;
            let wx = w * x2;
            let wy = w * y2;
            let wz = w * z2;
            return this.set([
                (1 - (yy + zz)) * sx,
                (xy + wz) * sx,
                (xz - wy) * sx,
                0,
                (xy - wz) * sy,
                (1 - (xx + zz)) * sy,
                (yz + wx) * sy,
                0,
                (xz + wy) * sz,
                (yz - wx) * sz,
                (1 - (xx + yy)) * sz,
                0,
                position.x,
                position.y,
                position.z,
                1,
            ]);
        }
        makePerspective(left, right, top, bottom, near, far) {
            return this.set([
                2 * near / (right - left),
                0,
                0,
                0,
                0,
                2 * near / (top - bottom),
                0,
                0,
                (right + left) / (right - left),
                (top + bottom) / (top - bottom),
                (near + far) / (near - far),
                -1,
                0,
                0,
                2 * near * far / (near - far),
                0,
            ]);
        }
        makeOrthographic(left, right, top, bottom, near, far) {
            let w = 1 / (right - left);
            let h = 1 / (top - bottom);
            let p = 1 / (far - near);
            return this.set([
                2 * w,
                0,
                0,
                0,
                0,
                2 * h,
                0,
                0,
                0,
                0,
                -2 * p,
                0,
                (-right - left) * w,
                (-top - bottom) * h,
                (-far - near) * p,
                1,
            ]);
        }
        topLeft3x3 = (target) => (target ?? NewMatrix3x3()).set([
            this[0], this[1], this[2],
            this[4], this[5], this[6],
            this[8], this[9], this[10]
        ]);
    }
    /** @noinline */
    let NewVector2 = (x, y) => new Vector2(x, y);
    /** @noinline */
    let NewVector3 = (x, y, z) => new Vector3(x, y, z);
    /** @noinline */
    let NewQuaternion = (x, y, z, w) => new Quaternion(x, y, z, w);
    /** @noinline */
    let NewMatrix3x3 = () => new Matrix3x3();
    /** @noinline */
    let NewMatrix4x4 = () => new Matrix4x4();
    /** @noinline */
    let NewQuaternionFromAxisAngle = (x, y, z, angle) => NewQuaternion().setFromAxisAngle(x, y, z, angle);
    /** @noinline */
    let NewMatrix4x4Compose = (position, rotation, scale) => NewMatrix4x4().compose(position, rotation, scale);
    /** @noinline */
    let tmpVec2 = NewVector2();
    /** @noinline */
    let tmpVec3_linear_ts = NewVector3();
    /** @noinline */
    let tmpQuaternion = NewQuaternion();
    // util/math-geometry.ts
    class Ray {
        o; // origin
        d; // direction
        constructor(origin, direction) {
            this.o = origin.c();
            this.d = direction.c().r();
        }
        getPoint = (distance, target) => (target ?? NewVector3()).copyFrom(this.d).mulScalar(distance).a(this.o);
    }
    let GroundPlaneLineIntersectionDistance = ({ o: origin, d: direction }) => 
    // ground plane is on the y axis, 0 coordinate
    -origin.y / direction.y;
    let IntersectRayBoundingBox = ({ o: origin, d: direction }, bboxMin, bboxMax) => {
        let tmin = -Infinity;
        let tmax = Infinity;
        // order is important for min/max, it will get rid of NaN values
        let min_ = (x, y) => x < y ? x : y;
        let max_ = (x, y) => x > y ? x : y;
        let invDir = NewVector3(1).div(direction); // can have infinity if a component is zero
        for (let i = 0; i < 3; ++i) {
            let t1 = (bboxMin[i] - origin[i]) * invDir[i];
            let t2 = (bboxMax[i] - origin[i]) * invDir[i];
            tmin = min_(max_(t1, tmin), max_(t2, tmin));
            tmax = max_(min_(t1, tmax), min_(t2, tmax));
        }
        if (tmin > tmax) {
            return null;
        }
        if (tmax < 0) {
            return null;
        }
        if (tmin < 0) {
            tmin = tmax;
        }
        return tmin;
    };
    let globalVolume = 0.2;
    let GenerateCurve = (numSamples, curve) => new f32a(numSamples).map((_, idx) => curve(idx / (numSamples - 1)));
    let x4FadeOutCurve = GenerateCurve(16, t => (1 - t) ** 4);
    let actx = new AudioContext();
    let globalVolumeNode = actx.createGain();
    globalVolumeNode.gain.value = globalVolume;
    let globalFilterNode = actx.createBiquadFilter();
    globalFilterNode.type = "lowpass";
    globalFilterNode.frequency.value = 20000;
    globalFilterNode.connect(globalVolumeNode).connect(actx.destination);
    let globalTargetNode = globalFilterNode;
    let rng = Mulberry32(0);
    let noiseBuffers = [];
    for (let i = 0; i < 10; ++i) {
        let noiseSamplesLeft = new f32a(actx.sampleRate).map(_ => rng() * 2 - 1);
        let noiseSamplesRight = new f32a(actx.sampleRate).map(_ => rng() * 2 - 1);
        let noiseBuffer = actx.createBuffer(2, actx.sampleRate * 1, actx.sampleRate);
        noiseBuffer.copyToChannel(noiseSamplesLeft, 0);
        noiseBuffer.copyToChannel(noiseSamplesRight, 1);
        noiseBuffers.push(noiseBuffer);
    }
    let CreateNoiseNode = (bufferIdx = 0) => {
        let node = actx.createBufferSource();
        node.buffer = noiseBuffers[bufferIdx];
        node.loop = true;
        return node;
    };
    // audio/instruments/string.ts
    let CreateInstrumentFromWave = (numWaves, attack, real, imag) => {
        let wave = actx.createPeriodicWave(real, imag);
        return (octave, note, volume, when, duration, fadeOutDuration = 0.2, Q = 0, targetNode) => {
            let target = targetNode ?? globalTargetNode;
            let frequency = (2 ** (Math.log2(440) + octave - 4 + (note - 9) / 12)) / numWaves;
            let fadeInDuration = 0.001;
            let oscillator = actx.createOscillator();
            let gain = actx.createGain();
            let filter = actx.createBiquadFilter();
            oscillator.frequency.value = frequency;
            gain.gain.value = 0;
            let time = when;
            gain.gain.linearRampToValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(attack ? volume * 1.4 : volume, time += fadeInDuration);
            gain.gain.linearRampToValueAtTime(volume, time += 0.05);
            gain.gain.linearRampToValueAtTime(volume, time += duration);
            gain.gain.linearRampToValueAtTime(0, time += fadeOutDuration);
            filter.type = "bandpass";
            filter.frequency.value = frequency;
            filter.Q.value = -Q;
            filter.Q.linearRampToValueAtTime(-Q, when);
            filter.Q.linearRampToValueAtTime(0, when + fadeInDuration);
            filter.Q.linearRampToValueAtTime(Q, time);
            oscillator.connect(gain).connect(filter).connect(target);
            oscillator.setPeriodicWave(wave);
            oscillator.start(when);
            oscillator.stop(time);
            if (attack) {
                let noise = CreateNoiseNode();
                let gain2 = actx.createGain();
                let filter2 = actx.createBiquadFilter();
                filter2.frequency.value = 8000;
                filter2.Q.value = 2;
                gain2.gain.value = 0;
                gain2.gain.linearRampToValueAtTime(0, when);
                gain2.gain.linearRampToValueAtTime(volume * 0.2, when + fadeInDuration);
                gain2.gain.linearRampToValueAtTime(0, when + fadeInDuration + 0.001);
                noise.start(when);
                noise.stop(when + fadeInDuration + 0.001);
                noise.connect(gain2).connect(filter2).connect(target);
            }
        };
    };
    let Guitar2 = CreateInstrumentFromWave(1, true, splitmap("-.02,-.2,-.4,-.1,1,-.04,-.07,0,.1,-.3,-.1,.2,.15,.15,-.02,-.02,.02,-.1,.1,-.1"), splitmap("0,-4,.5,-.5,.07,0,-.17,-.05,.06,.21,-.46,-.3,-.14,.05,.07,.01,-.08,-.13,.04,-.01"));
    let Bass1 = CreateInstrumentFromWave(1, false, splitmap("-.02,-1,.17,.31,.18,.05,.06,.03,.02,.01,.01,.01"), splitmap("0,-.46,.72,.17,.11,.11,.08,.02,.01,.01,0,0"));
    // audio/instruments/percussion.ts
    let Drum = (volume, when, sourceNode, filter, filterFrequency, Q, fadeInDuration = 0.01, fadeOutDuration = 0.1, duration = 0, fadeOutCurve = x4FadeOutCurve, target) => {
        let gainNode = actx.createGain();
        let filterNode = actx.createBiquadFilter();
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
    };
    let Snare = (when, duration = 0.25, target) => {
        let volume = 0.7;
        {
            let sourceNode = actx.createOscillator();
            let startFreq = 150;
            let timeOffset = 0.005;
            sourceNode.frequency.value = startFreq;
            sourceNode.frequency.linearRampToValueAtTime(startFreq, when + 0.01 + timeOffset);
            sourceNode.frequency.linearRampToValueAtTime(70, when + 0.03 + timeOffset);
            Drum(volume, when + timeOffset, sourceNode, false, 0, 0, 0.001, 0.2, 0, undefined, target);
        }
        {
            let vol = 0.4;
            let noise = CreateNoiseNode();
            let filter = actx.createBiquadFilter();
            filter.Q.value = 0;
            filter.frequency.value = 5000;
            let gain = actx.createGain();
            noise.start(when);
            noise.stop(when + duration);
            gain.gain.value = vol;
            gain.gain.linearRampToValueAtTime(vol, when + 0.005);
            gain.gain.linearRampToValueAtTime(vol * 0.15, when + 0.01);
            gain.gain.linearRampToValueAtTime(vol * 0.15, when + 0.02);
            gain.gain.linearRampToValueAtTime(0, when + duration);
            noise.connect(filter).connect(gain).connect(target ?? globalTargetNode);
        }
    };
    let HiHat = (when, frequency = 8000, fadeOutDuration = 0.1, target) => Drum(1, when, CreateNoiseNode(), true, frequency, 3, 0.001, fadeOutDuration, 0.005, undefined, target);
    // scenegraph/global-canvas.ts
    let globalCanvas = createElement("canvas");
    document.body.appendChild(globalCanvas);
    let gl = globalCanvas.getContext("webgl2");
    // util/webgl-utils.ts
    const webglDebugMode = false; // using a const bool so relevant parts can be easily removed by the minifier
    let CreateShader = (shaderType, shaderSource) => {
        let shaderObj = gl.createShader(shaderType);
        if (webglDebugMode) {
            if (shaderObj === null) {
                throw new Error("Cannot create shader object");
            }
        }
        gl.shaderSource(shaderObj, shaderSource);
        gl.compileShader(shaderObj);
        if (webglDebugMode) {
            let shaderError = gl.getShaderInfoLog(shaderObj);
            if (shaderError && shaderError.length !== 0) {
                console.error(shaderError);
                // log shader with line numbers
                let lines = shaderSource.split("\n");
                let padCount = Math.log10(lines.length + 1) | 0 + 4;
                console.error("\n" + lines.map((line, idx) => (idx + 1).toString().padEnd(padCount, " ") + line).join("\n"));
                throw new Error(`Error compiling ${shaderType === gl.VERTEX_SHADER ? "vertex" : "fragment"} shader`);
            }
        }
        return shaderObj;
    };
    let CreateAndLinkProgram = (vertexShader, fragmentShader) => {
        let program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (webglDebugMode) {
            let success = gl.getProgramParameter(program, gl.LINK_STATUS);
            let programInfo = gl.getProgramInfoLog(program);
            if (programInfo && programInfo.length !== 0) {
                if (success) {
                    console.warn(programInfo);
                }
                else {
                    console.error(programInfo);
                    throw new Error("Error linking program");
                }
            }
        }
        return program;
    };
    let CreateWebglProgram = (vertexShaderSource, fragmentShaderSource, ...uniforms) => {
        let vertShaderObj = CreateShader(gl.VERTEX_SHADER, vertexShaderSource);
        let fragShaderObj = CreateShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
        let program = CreateAndLinkProgram(vertShaderObj, fragShaderObj);
        // gl.useProgram(program);
        let uniformLocations = new Map();
        uniforms.forEach(u => uniformLocations.set(u, gl.getUniformLocation(program, u)));
        return { program, uniformLocations };
    };
    let CreateWebglCanvas = () => {
        let vertexShader = `#version 300 es
in vec2 p;uniform float a;out vec2 pc;void main(){pc=(p+vec2(1))*.5;gl_Position=vec4(p,0,1);}`;
        let vertShaderObj = CreateShader(gl.VERTEX_SHADER, vertexShader);
        let vertexBuffer = gl.createBuffer();
        let vertexPositions = new f32a([-1, -1, 1, -1, -1, 1, 1, 1]);
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexPositions, gl.STATIC_DRAW);
        let framebuffer = gl.createFramebuffer();
        let DrawWithShader = (shaderFunctions, shaderMainImage, width, height, inputTextures, resultTexture) => {
            // size setup
            globalCanvas.width = width;
            globalCanvas.height = height;
            gl.viewport(0, 0, width, height);
            // shader and program setup
            let fragmentShaderSource = `#version 300 es
precision highp float;
in vec2 pc;out vec4 oc;uniform float a;const vec2 ps=vec2(${1 / width},${1 / height});
${inputTextures.map((_, idx) => `uniform sampler2D t${idx};`).join("\n")}
${shaderFunctions.join("\n")}
void main(){${shaderMainImage}}`;
            let fragShaderObj = CreateShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
            let program = CreateAndLinkProgram(vertShaderObj, fragShaderObj);
            gl.useProgram(program);
            // setup attributes and uniforms
            let vertexLocation = gl.getAttribLocation(program, "p");
            gl.uniform1f(gl.getUniformLocation(program, "a"), width / height);
            // textures
            inputTextures.forEach((tex, idx) => {
                gl.activeTexture(gl.TEXTURE0 + idx);
                gl.bindTexture(gl.TEXTURE_2D, tex);
                let loc = gl.getUniformLocation(program, "t" + idx);
                gl.uniform1i(loc, idx);
            });
            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, resultTexture, 0);
            // draw
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.enableVertexAttribArray(vertexLocation);
            gl.vertexAttribPointer(vertexLocation, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexPositions.length / 2);
            // cleanup
            gl.deleteShader(fragShaderObj);
            gl.deleteProgram(program);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.bindTexture(gl.TEXTURE_2D, resultTexture);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.bindTexture(gl.TEXTURE_2D, null);
        };
        let CreateTexture = (width, height) => {
            let tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB10_A2, width, height, 0, gl.RGBA, gl.UNSIGNED_INT_2_10_10_10_REV, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            // only needed for non power of 2 textures
            // {
            //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            // }
            let ext = gl.getExtension("EXT_texture_filter_anisotropic");
            ext && gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, min(16, gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
            return tex;
        };
        let returnObject = { DrawWithShader, CreateTexture };
        return returnObject;
    };
    let ca = CreateWebglCanvas();
    // Generated with Shader Minifier 1.3.6 (https://github.com/laurentlb/Shader_Minifier/)
    let standardMaterial_var_ALBEDO = "d";
    let standardMaterial_var_BASECOLOR = "B";
    let standardMaterial_var_DEPTHMAP = "h";
    let standardMaterial_var_ENABLESHADOWS = "M";
    let standardMaterial_var_FRAGCOLOR = "o";
    let standardMaterial_var_HASALBEDO = "D";
    let standardMaterial_var_HASNORMALMAP = "E";
    let standardMaterial_var_HASROUGHNESSMAP = "C";
    let standardMaterial_var_LIGHTPOS = "K";
    let standardMaterial_var_LIGHTPOSWORLD = "L";
    let standardMaterial_var_METALLIC = "F";
    let standardMaterial_var_MODELNORMAL = "n";
    let standardMaterial_var_MODELPOS = "f";
    let standardMaterial_var_NORMALMAP = "a";
    let standardMaterial_var_OFFSET = "J";
    let standardMaterial_var_ROUGHNESS = "A";
    let standardMaterial_var_ROUGHNESSMAP = "w";
    let standardMaterial_var_SCALE = "I";
    let standardMaterial_var_SHADOWMVP = "p";
    let standardMaterial_var_SHADOWPOS = "i";
    let standardMaterial_var_SHARPNESS = "H";
    let standardMaterial_var_VNORMAL = "m";
    let standardMaterial_var_VPOSITION = "v";
    let standardMaterial_var_VIEWNORMAL = "u";
    let standardMaterial_var_VIEWPOS = "y";
    let standardMaterial_var_WORLDMAT = "s";
    let standardMaterial_var_WORLDNORMAL = "z";
    let standardMaterial_var_WORLDNORMALMAT = "b";
    let standardMaterial_var_WORLDPOS = "r";
    let standardMaterial_var_WORLDVIEWMAT = "t";
    let standardMaterial_var_WORLDVIEWNORMALMAT = "l";
    let standardMaterial_var_WORLDVIEWPROJMAT = "e";
    let standardMaterialProgram = null;
    let GetOrCreateStandardMaterial = () => {
        if (!standardMaterialProgram) {
            let vert_glsl = `#version 300 es
layout(location=0) in vec4 v;layout(location=1) in vec3 m;out vec3 y,u,f,n,r,z;out vec4 i;uniform mat4 s;uniform mat3 b;uniform mat4 t;uniform mat3 l;uniform mat4 e,p;void main(){y=(t*v).xyz;u=l*m;f=v.xyz;n=m;r=(s*v).xyz;z=b*m;gl_Position=e*v;i=p*s*v*.5+.5;}`;
            let frag_glsl = `#version 300 es
precision highp float;precision highp sampler2DShadow;uniform sampler2D d,a,w;uniform sampler2DShadow h;uniform mat3 b,l;uniform bool D,E,C;uniform vec4 B;uniform float A,F,G,H;uniform vec3 I,J,K,L;uniform bool M;in vec3 y,u,f,n,r,z;in vec4 i;out vec4 o;vec3 g(vec3 v){vec3 m=pow(abs(v),vec3(H));return m/vec3(dot(m,vec3(1)));}vec4 g(sampler2D v,vec3 m,vec3 y){vec3 i=g(y);return texture(v,m.zy)*i.x+texture(v,m.zx)*i.y+texture(v,m.xy)*i.z;}vec3 N(sampler2D v,vec3 m,vec3 y){vec3 i=g(y),n=texture(v,m.zx).xyz*2.-1.;return normalize(vec3(0,(texture(v,m.zy).xyz*2.-1.).yx)*i.x+vec3(n.y,0,n)*i.y+vec3((texture(v,m.xy).xyz*2.-1.).xy,0)*i.z+y);}float N(vec3 v,vec3 m){return max(dot(v,m),0.);}vec3 g(vec3 v,float m){return v+(1.-v)*pow(1.-m,5.);}vec3 N(vec3 v,vec3 m,vec3 y,vec3 b,vec3 s,vec3 n,vec3 d,float f){float I=N(v,y);vec3 x=normalize(y+m),J=g(d,dot(y,x));float e=pow(N(v,x),f)*(f+2.)/8.,u=0.;if(M){vec3 l=i.xyz/i.w;vec2 B=abs(vec2(.5)-l.xy);u=l.z>1.||B.x>.5||B.y>.5?1.:(l.z-=max(.001*(1.-dot(normalize(z),L)),1e-4)/i.w,texture(h,l));}else u=1.;vec3 o=u*(n+J*e)*I*b;o+=n*s;return o;}vec3 O(vec3 v,vec3 m){vec3 y=normalize(n);v=E?normalize(l*N(a,f*I+J,y)):v;vec3 s=D?g(d,f*I+J,y).xyz*B.xyz:B.xyz;float u=C?g(w,f*I+J,y).x:A;vec3 i=mix(s*(1.-vec3(.04).x),vec3(0),F)/acos(-1.),r=mix(vec3(.04),s,F);u=1.2-.2/clamp(u,1e-5,.99999);float x=log(2.-u)*185.;vec3 o=vec3(0),G[]=vec3[1](K),H[]=vec3[1](vec3(1)),p[]=vec3[1](vec3(1));{vec3 b=p[0]*(1.-N(z,-L)*.1);o+=N(v,m,G[0],H[0],b,i,r,x);}return o;}void main(){vec3 v=O(normalize(u),normalize(-y));o=vec4(mix(v,vec3(.4,.45,.5),smoothstep(150.,250.,length(r))),B.w);}`;
            standardMaterialProgram = CreateWebglProgram(vert_glsl, frag_glsl, standardMaterial_var_WORLDVIEWMAT, standardMaterial_var_WORLDVIEWNORMALMAT, standardMaterial_var_WORLDVIEWPROJMAT, standardMaterial_var_WORLDMAT, standardMaterial_var_WORLDNORMALMAT, standardMaterial_var_SHADOWMVP, standardMaterial_var_ALBEDO, standardMaterial_var_NORMALMAP, standardMaterial_var_ROUGHNESSMAP, standardMaterial_var_DEPTHMAP, standardMaterial_var_HASALBEDO, standardMaterial_var_HASNORMALMAP, standardMaterial_var_HASROUGHNESSMAP, standardMaterial_var_BASECOLOR, standardMaterial_var_METALLIC, standardMaterial_var_ROUGHNESS, standardMaterial_var_SHARPNESS, standardMaterial_var_SCALE, standardMaterial_var_OFFSET, standardMaterial_var_LIGHTPOS, standardMaterial_var_LIGHTPOSWORLD, standardMaterial_var_ENABLESHADOWS);
            gl.useProgram(standardMaterialProgram.program);
            gl.uniform1i(standardMaterialProgram.uniformLocations.get(standardMaterial_var_ALBEDO), 0);
            gl.uniform1i(standardMaterialProgram.uniformLocations.get(standardMaterial_var_NORMALMAP), 1);
            gl.uniform1i(standardMaterialProgram.uniformLocations.get(standardMaterial_var_ROUGHNESSMAP), 2);
            gl.uniform1i(standardMaterialProgram.uniformLocations.get(standardMaterial_var_DEPTHMAP), 3);
        }
        return standardMaterialProgram;
    };
    let shadow_var_DEPTHMVP = "e";
    let shadow_var_TEX = "t";
    let shadow_var_UV = "v";
    let shadow_var_VPOSITION = "m";
    let shadow_var_WORLDMAT = "d";
    let shadowProgram = null;
    let GetOrCreateShadowProgram = () => {
        if (!shadowProgram) {
            shadowProgram = CreateWebglProgram(`#version 300 es
layout(location=0) in vec4 m;out vec2 v;uniform mat4 e,d;void main(){v=m.xy+.5;gl_Position=e*d*m;}`, `#version 300 es
precision highp float;uniform sampler2D t;in vec2 v;void main(){if(texture(t,v).w<.5)discard;}`, shadow_var_DEPTHMVP, shadow_var_WORLDMAT, shadow_var_TEX);
        }
        return shadowProgram;
    };
    let JoinGeometries = (...geometries) => {
        let vertices = [];
        let triangles = [];
        let normals = [];
        for (let geometry of geometries) {
            let startIndex = vertices.length / 3;
            vertices.push(...geometry.v);
            normals.push(...geometry.n);
            triangles.push(...geometry.t.map(tri => tri + startIndex));
        }
        return { v: new f32a(vertices), t: new u32a(triangles), n: new f32a(normals) };
    };
    let TransformGeometry = (geometry, transform) => {
        let { v: vertices, n: normals } = geometry;
        let normalTransform = transform.topLeft3x3().invert().transpose();
        let v = NewVector3();
        for (let i = 0; i < vertices.length; i += 3) {
            v.set(vertices.slice(i, i + 3));
            v.applyMatrix4x4(transform);
            vertices.set(v, i);
            v.set(normals.slice(i, i + 3));
            v.applyMatrix3x3(normalTransform);
            normals.set(v, i);
        }
        return geometry;
    };
    let tmpTransformMatrix_geometry_ts = NewMatrix4x4();
    let TranslateGeometry = (geometry, x, y, z) => TransformGeometry(geometry, tmpTransformMatrix_geometry_ts.compose(NewVector3(x, y, z), NewQuaternion(), NewVector3(1)));
    let RotateGeometry = (geometry, rotation) => TransformGeometry(geometry, tmpTransformMatrix_geometry_ts.compose(NewVector3(), rotation, NewVector3(1)));
    let RotateGeometryWithAxisAngle = (geometry, x, y, z, angle) => RotateGeometry(geometry, NewQuaternionFromAxisAngle(x, y, z, angle));
    // @ts-ignore
    let structuredClone_ = structuredClone;
    let CloneGeometry = (geometry) => structuredClone_(geometry);
    let CreateBoxGeometry = (width = 1, height = 1, depth = 1) => {
        let halfWidth = width / 2;
        let halfHeight = height / 2;
        let halfDepth = depth / 2;
        let vertices = new f32a([
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
        let triangles = new u32a(splitmap("0,3,1,0,2,3,4,7,5,4,6,7,8,11,9,8,10,11,12,15,13,12,14,15,16,19,17,16,18,19,20,23,21,20,22,23"));
        let normals = new f32a(splitmap("0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,1,0,0,1,0,0,1,0,0,1,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,1,0,0,1,0,0,1,0,0,1,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0,1,0,0,1,0,0,1,0,0,1,0,0"));
        return { v: vertices, t: triangles, n: normals };
    };
    let CreateSphereGeometry = (radius = 1) => {
        let horizontalSubdivisions = 16, verticalSubdivisions = 24;
        // just convert normals to vertices later by multiplying with the radius
        let normals = [];
        let triangles = [];
        // note: the geometry is not closed, and contains degenerate triangles at the poles
        // but this allows the code to be smaller, and it doesn't affect the rendering anyways
        for (let i = 0; i < horizontalSubdivisions; ++i) {
            let angleY = NegHalfPI + PI * i / (horizontalSubdivisions - 1);
            let yCoord = sin(-angleY);
            let yMultiplier = cos(-angleY);
            for (let j = 0; j < verticalSubdivisions; ++j) {
                let angleXZ = TwoPI * j / (verticalSubdivisions - 1);
                normals.push(cos(angleXZ) * yMultiplier, yCoord, sin(angleXZ) * yMultiplier);
            }
        }
        // triangles
        for (let i = 0; i < horizontalSubdivisions; ++i) {
            let startIndex = i * verticalSubdivisions;
            let nextRowStartIndex = startIndex + verticalSubdivisions;
            for (let j = 0; j < verticalSubdivisions; ++j) {
                triangles.push(startIndex + j, startIndex + j + 1, nextRowStartIndex + j + 1, startIndex + j, nextRowStartIndex + j + 1, nextRowStartIndex + j);
            }
        }
        let normalsF32 = new f32a(normals);
        return { v: normalsF32.map(n => n * radius), t: new u32a(triangles), n: normalsF32 };
    };
    let CreateCapsuleGeometry = (radius = 1, height = 1) => JoinGeometries(TranslateGeometry(CreateSphereGeometry(radius), 0, height / 2, 0), TranslateGeometry(CreateSphereGeometry(radius), 0, -height / 2, 0), CreateCylinderGeometry(height, radius, radius));
    let CreateCylinderGeometry = (height, bottomRadius, topRadius, subdivisions = 16) => {
        let halfHeight = height / 2;
        // the cylinder is on the y axis
        let vertices = [];
        let normals = [];
        let triangles = [];
        // around
        for (let i = 0; i <= subdivisions; ++i) {
            let t = i / subdivisions * TwoPI;
            let c = cos(t);
            let s = sin(t);
            vertices.push(c * bottomRadius, -halfHeight, s * bottomRadius, c * topRadius, halfHeight, s * topRadius);
            normals.push(c, 0, s, c, 0, s);
        }
        vertices.push(...vertices); // copy all vertices for top/bottom
        // top/bottom normals
        for (let i = 0; i <= subdivisions; ++i) {
            normals.push(0, -1, 0, 0, 1, 0);
        }
        // triangles
        // sides
        for (let i = 0; i < subdivisions * 2; i += 2) {
            triangles.push(i, i + 1, i + 3, i, i + 3, i + 2);
        }
        // top/bottom
        let baseIndex = (subdivisions + 1) * 2;
        for (let i = 2; i < subdivisions; ++i) {
            triangles.push(baseIndex, baseIndex + i * 2 - 2, baseIndex + i * 2, baseIndex + 1, baseIndex + i * 2 + 1, baseIndex + i * 2 - 1);
        }
        return { v: new f32a(vertices), n: new f32a(normals), t: new u32a(triangles) };
    };
    let CreateExtrudedGeometryConvex = (polyline, extrudeThickness) => {
        // triangulated from the first point in the polygon, so it's only guaranteed to work for convex polygons
        // polyline is in the xy plane, extruded in the z direction
        let vertices = [];
        let triangles = [];
        let normals = [];
        let points = [];
        for (let i = 0; i < polyline.length; i += 2) {
            points.push(NewVector2(polyline[i], polyline[i + 1]));
        }
        // front and back
        for (let { x, y } of points) {
            vertices.push(x, y, extrudeThickness / -2, x, y, extrudeThickness / 2);
            normals.push(0, 0, -1, 0, 0, 1);
        }
        for (let i = 2; i < points.length; ++i) {
            let i1 = i - 1;
            triangles.push(0, i1 * 2, i * 2, 1, i * 2 + 1, i1 * 2 + 1);
        }
        // sides
        let prev = points[points.length - 1];
        for (let point of points) {
            let idx = vertices.length / 3;
            vertices.push(prev.x, prev.y, extrudeThickness / 2, prev.x, prev.y, extrudeThickness / -2, point.x, point.y, extrudeThickness / 2, point.x, point.y, extrudeThickness / -2);
            let normal = point.c().s(prev).r(), y = normal.x, x = -normal.y;
            prev = point;
            normals.push(x, y, 0, x, y, 0, x, y, 0, x, y, 0);
            triangles.push(idx, idx + 3, idx + 1, idx, idx + 2, idx + 3);
        }
        return { v: new f32a(vertices), t: new u32a(triangles), n: new f32a(normals) };
    };
    let FlatShade = (geometry) => {
        // separates all triangles, and calculates flat normals
        let { v: vertices, t: triangles } = geometry;
        let newVertices = [];
        let newTriangles = [];
        let newNormals = [];
        let tmpVec3_0 = NewVector3();
        let tmpVec3_1 = NewVector3();
        let tmpVec3_2 = NewVector3();
        for (let i = 0; i < triangles.length; i += 3) {
            let idx0 = triangles[i] * 3;
            let idx1 = triangles[i + 1] * 3;
            let idx2 = triangles[i + 2] * 3;
            tmpVec3_0.set(vertices.subarray(idx0, idx0 + 3));
            tmpVec3_1.set(vertices.subarray(idx1, idx1 + 3));
            tmpVec3_2.set(vertices.subarray(idx2, idx2 + 3));
            newVertices.push(...tmpVec3_0, ...tmpVec3_1, ...tmpVec3_2);
            newTriangles.push(i, i + 1, i + 2);
            tmpVec3_1.s(tmpVec3_0);
            tmpVec3_2.s(tmpVec3_0);
            tmpVec3_0.crossVectors(tmpVec3_1, tmpVec3_2).r();
            newNormals.push(...tmpVec3_0, ...tmpVec3_0, ...tmpVec3_0);
        }
        geometry.v = new f32a(newVertices);
        geometry.t = new u32a(newTriangles);
        geometry.n = new f32a(newNormals);
        return geometry;
    };
    // scenegraph/audio.ts
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
    let AttachAudioListener = (node) => {
        let { listener } = actx;
        node.onAfterRender.push(() => {
            let worldPos = node.worldPosition;
            let { u: up, f: forward } = node.dirs;
            listener.setPosition(worldPos.x, worldPos.y, worldPos.z);
            listener.setOrientation(forward.x, forward.y, forward.z, up.x, up.y, up.z);
            // UpdateAudioVector(listener.positionX, listener.positionY, listener.positionZ, node.worldPosition);
            // UpdateAudioVector(listener.forwardX, listener.forwardY, listener.forwardZ, forward);
            // UpdateAudioVector(listener.upX, listener.upY, listener.upZ, up);
        });
    };
    let AttachAudioSource = (node) => {
        let panner = actx.createPanner();
        let gain = actx.createGain();
        gain.gain.value = 0.2;
        panner.connect(gain).connect(globalTargetNode);
        panner.refDistance = 10;
        node.onAfterRender.push(() => {
            let worldPos = node.worldPosition;
            let forward = node.dirs.f;
            panner.setPosition(worldPos.x, worldPos.y, worldPos.z);
            panner.setOrientation(forward.x, forward.y, forward.z);
            // UpdateAudioVector(panner.positionX, panner.positionY, panner.positionZ, node.worldPosition);
            // UpdateAudioVector(panner.orientationX, panner.orientationY, panner.orientationZ, node.dirs.forward);
        });
        return panner;
    };
    // scenegraph/scene.ts
    let tmpTransformMatrix_scene_ts = NewMatrix4x4();
    let tmpVec3_0 = NewVector3();
    let tmpVec3_1 = NewVector3();
    let fixedDeltaTime = 1 / 60.001;
    let accumulatedFixedDeltaTime = fixedDeltaTime / 2;
    class SceneNode {
        c = new Set(); // children
        p = null; // parent
        onUpdate = [];
        onFixedUpdate = [];
        onAfterRender = [];
        P = NewVector3(); // position
        R = NewQuaternion(); // rotation
        S = NewVector3(1, 1, 1); // scale
        v = true; // visible
        renderOrder = 0;
        transparent = false;
        //// Transform
        matrix = (target) => (target ?? NewMatrix4x4()).compose(this.P, this.R, this.S);
        matrixInverse = (target) => {
            let invRotation = this.R.c().invert();
            return (target ?? NewMatrix4x4()).compose(this.P.c().mulScalar(-1).applyQuaternion(invRotation), invRotation, NewVector3(1, 1, 1).div(this.S));
        };
        //// Hierarchy
        a(...nodes) {
            nodes.forEach(n => {
                this.c.add(n);
                n.p = this;
            });
            return this;
        }
        r(node) {
            this.c.delete(node);
            node.p = null;
        }
        traverse(callback) {
            (function traverseInner(node) {
                callback(node);
                node.c.forEach(traverseInner);
            })(this);
        }
        //// Transforms
        localToWorldMatrix() {
            let mat = this.matrix();
            return this.p?.localToWorldMatrix().c().m(mat) ?? mat.c();
        }
        worldToLocalMatrix() {
            // TODO: test this to make sure this is correct
            // seems to work without parents, but not tested with parents
            let mat = this.matrixInverse();
            return this.p?.worldToLocalMatrix().c().p(mat) ?? mat.c();
        }
        get worldPosition() {
            return this.transformPoint(NewVector3());
        }
        get worldRotation() {
            let rot = NewQuaternion();
            let node = this;
            while (node) {
                // TODO: this might be premultiply
                rot.multiply(node.R);
                node = node.p;
            }
            return rot;
        }
        transformPoint = (point) => point.applyMatrix4x4(this.localToWorldMatrix());
        transformDirection = (dir) => dir.applyQuaternion(this.worldRotation).r();
        get dirs() {
            let worldRot = this.worldRotation;
            return {
                r: NewVector3(1, 0, 0).applyQuaternion(worldRot).r(),
                u: NewVector3(0, 1, 0).applyQuaternion(worldRot).r(),
                f: NewVector3(0, 0, -1).applyQuaternion(worldRot).r(), // forward
            };
        }
        //// Render
        render(_mode, _viewMatrices, _worldMatrix, _light) { }
        //// Misc
        dispose() {
            this.p?.r(this);
            this.onUpdate = [];
            this.onFixedUpdate = [];
            this.onAfterRender = [];
            this.c.forEach(child => child.dispose());
        }
    }
    class Camera extends SceneNode {
        projectionMatrix = NewMatrix4x4();
        projectionParams = null;
        setProjectionMatrixPerspecive(fov = 75, aspect = 1, near = 0.01, far = 100) {
            //                          to radian, x0.5
            let top = near * Math.tan(0.00872664626 * fov);
            let height = 2 * top;
            let width = aspect * height;
            let right = width / 2;
            this.projectionMatrix.makePerspective(right - width, right, top, top - height, near, far);
            this.projectionParams = { top, right, near, isPerspective: true };
        }
        setProjectionMatrixOrthographic(width = 4, height = 4, near = 0.01, far = 100) {
            let right = width / 2;
            let top = height / 2;
            this.projectionMatrix.makeOrthographic(-right, right, top, -top, near, far);
            this.projectionParams = { top, right, near, isPerspective: false };
        }
        getLocalRay(screenX, screenY) {
            // 1 +---------+
            //   |         |
            //   |         |
            // 0 +---------+
            //   0         1
            let p = this.projectionParams;
            let x = Lerp(-p.right, p.right, screenX);
            let y = Lerp(-p.top, p.top, screenY);
            let z = -p.near;
            let v = NewVector3(x, y, z);
            return p.isPerspective
                ? new Ray(NewVector3(), v.r())
                : new Ray(v, NewVector3(0, 0, -1));
        }
        getWorldRay(screenX, screenY) {
            let localRay = this.getLocalRay(screenX, screenY);
            this.transformPoint(localRay.o);
            this.transformDirection(localRay.d);
            return localRay;
        }
        getWorldRayFromMouseEvent(ev) {
            return this.getWorldRay(ev.clientX / window.innerWidth, 1 - ev.clientY / window.innerHeight);
        }
        getScreenPosition(worldPosition, target) {
            return target.copyFrom(worldPosition).applyMatrix4x4(Scene.lastViewProjectionMatrix);
        }
    }
    class DirectionalLight extends Camera {
        depthFrameBuffer;
        depthTexture;
        depthMVP = NewMatrix4x4();
        resolution;
        worldMatLocation;
        constructor() {
            super();
            this.resolution = min(gl.getParameter(gl.MAX_TEXTURE_SIZE), 2048);
            let size = 250;
            let near = -100;
            let far = 500;
            this.setProjectionMatrixOrthographic(size, size, near, far);
            this.depthFrameBuffer = gl.createFramebuffer();
            this.depthTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this.depthTexture);
            // use DEPTH_STENCIL for higher depth precision
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH24_STENCIL8, this.resolution, this.resolution, 0, gl.DEPTH_STENCIL, gl.UNSIGNED_INT_24_8, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.depthFrameBuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.TEXTURE_2D, this.depthTexture, 0);
            this.worldMatLocation = GetOrCreateShadowProgram().uniformLocations.get(shadow_var_WORLDMAT);
        }
        prepare() {
            // let frustumCenter = NewVector3();
            // let lightView = NewMatrix4x4().lookAt(frustumCenter.c().a(lightDirection), frustumCenter, NewVector3(0, 1, 0));
            let lightView = NewMatrix4x4().set([0.894, 0.358, -0.267, 0, 0, 0.6, 0.8, 0, 0.447, -0.717, 0.535, 0, 0, 0, -1, 1]);
            this.depthMVP.set(this.projectionMatrix).m(lightView);
            let shadowProgram = GetOrCreateShadowProgram();
            gl.useProgram(shadowProgram.program);
            gl.uniformMatrix4fv(shadowProgram.uniformLocations.get(shadow_var_DEPTHMVP), false, this.depthMVP);
        }
    }
    let matrixPool = [];
    class Scene extends SceneNode {
        light;
        clearColor = NewVector3();
        static deltaTime = 0.01;
        static now = 0;
        static lastViewProjectionMatrix = NewMatrix4x4();
        constructor() {
            super();
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);
            gl.enable(gl.CULL_FACE);
            gl.cullFace(gl.BACK);
            this.light = new DirectionalLight();
            Scene.now = performance.now() / 1000;
        }
        updateScene(now) {
            Scene.deltaTime = now - Scene.now;
            Scene.now = now;
            accumulatedFixedDeltaTime += Scene.deltaTime;
            let fixedUpdateCount = (accumulatedFixedDeltaTime / fixedDeltaTime) | 0;
            accumulatedFixedDeltaTime -= fixedDeltaTime * fixedUpdateCount;
            // limit fixed update count, so there won't be thousands of fixed updates
            // if the page becomes inactive for a longer time, then activated
            fixedUpdateCount = min(fixedUpdateCount, 10);
            this.traverse(node => {
                node.onUpdate = node.onUpdate.filter(callback => callback(node) !== false);
                for (let i = 0; i < fixedUpdateCount; ++i) {
                    node.onFixedUpdate = node.onFixedUpdate.filter(callback => callback(node) !== false);
                }
            });
        }
        renderScene(camera) {
            let { light, clearColor } = this;
            // shadow maps first
            gl.viewport(0, 0, light.resolution, light.resolution);
            // gl.cullFace(gl.FRONT);
            gl.bindFramebuffer(gl.FRAMEBUFFER, light.depthFrameBuffer);
            gl.clear(gl.DEPTH_BUFFER_BIT);
            light.prepare();
            this.renderSceneInternal(light, 1 /* Shadow */, light);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            // gl.cullFace(gl.BACK);
            // normal render
            gl.viewport(0, 0, globalCanvas.width, globalCanvas.height);
            gl.clearColor(clearColor.x, clearColor.y, clearColor.z, 1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            this.renderSceneInternal(camera, 0 /* Normal */, light);
            this.traverse(node => {
                node.onAfterRender = node.onAfterRender.filter(callback => callback(node) !== false);
            });
        }
        renderSceneInternal(camera, mode, light) {
            let viewMatrix = camera.worldToLocalMatrix();
            let cameraWorldPos = camera.worldPosition;
            let cameraWorldForward = camera.dirs.f;
            let viewProjectionMatrix = Scene.lastViewProjectionMatrix.set(camera.projectionMatrix).m(viewMatrix);
            let viewMatrices = { viewMatrix, viewProjectionMatrix, cameraPosition: cameraWorldPos };
            let distanceFn = camera.projectionParams.isPerspective
                ? (worldPos) => cameraWorldPos.distanceSqr(worldPos)
                : (worldPos) => cameraWorldForward.dot(tmpVec3_0.copyFrom(worldPos).s(cameraWorldPos));
            let renderData = [];
            let visitNode = (node, worldMatrix) => {
                if (!node.v) {
                    return;
                }
                let tmpMatrix = matrixPool.pop() ?? NewMatrix4x4();
                let currentWorldMatrix = tmpMatrix.multiplyMatrices(worldMatrix, node.matrix(tmpTransformMatrix_scene_ts));
                let worldPos = tmpVec3_1.setScalar(0).applyMatrix4x4(currentWorldMatrix);
                renderData.push({ n: node, worldMatrix: currentWorldMatrix, distanceFromCamera: distanceFn(worldPos) });
                node.c.forEach(c => visitNode(c, currentWorldMatrix));
            };
            visitNode(this, this.localToWorldMatrix());
            renderData.sort((a, b) => {
                let multiplier = a.n.transparent ? 1 : -1;
                if (a.n.transparent != b.n.transparent) {
                    // different transparency, always render opaque first
                    return multiplier;
                }
                if (a.n.renderOrder != b.n.renderOrder) {
                    // different render order, render the node with the lower render order first
                    return a.n.renderOrder - b.n.renderOrder;
                }
                // transparency and render order is the same, sort by distance
                // for opaque, render near -> far
                // for transparent, render far -> near
                return (b.distanceFromCamera - a.distanceFromCamera) * multiplier;
            });
            renderData.forEach(({ n: node, worldMatrix }) => {
                node.render(mode, viewMatrices, worldMatrix, light);
                matrixPool.push(worldMatrix);
            });
        }
    }
    let geometryMap = new Map();
    class Renderable extends SceneNode {
        vao;
        triangleCount;
        vertexBuffer;
        indexBuffer;
        geometry;
        constructor(geometry, positionLoc, normalLoc) {
            super();
            this.geometry = geometry;
            let data = geometryMap.get(geometry);
            if (data) {
                this.vao = data.vao;
                this.vertexBuffer = data.vertexBuffer;
                this.indexBuffer = data.indexBuffer;
                ++data.useCount;
            }
            else {
                this.vao = gl.createVertexArray();
                gl.bindVertexArray(this.vao);
                // setup buffers
                this.vertexBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, geometry.v, gl.STATIC_DRAW);
                gl.enableVertexAttribArray(positionLoc);
                gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
                this.indexBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.t, gl.STATIC_DRAW);
                if (geometry.n && normalLoc) {
                    let normalBuffer = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
                    gl.bufferData(gl.ARRAY_BUFFER, geometry.n, gl.STATIC_DRAW);
                    gl.enableVertexAttribArray(normalLoc);
                    gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, true, 0, 0);
                }
                gl.bindVertexArray(null);
                geometryMap.set(geometry, {
                    vao: this.vao,
                    vertexBuffer: this.vertexBuffer,
                    indexBuffer: this.indexBuffer,
                    triangleCount: geometry.t.length,
                    useCount: 1
                });
            }
            this.triangleCount = geometry.t.length;
        }
    }
    // scenegraph/mesh.ts
    let tmpWorldViewMatrix = NewMatrix4x4();
    let tmpWorldViewProjectionMatrix = NewMatrix4x4();
    let tmpWorldViewNormalMatrix = NewMatrix3x3();
    let tmpWorldNormalMatrix = NewMatrix3x3();
    let tmpTransformMatrix_mesh_ts = NewMatrix4x4();
    let tmpVec3 = NewVector3();
    class Mesh extends Renderable {
        program;
        shadowProgram;
        uniforms;
        material;
        textures = new Map();
        castShadows = true;
        receiveShadows = true;
        cull = gl.BACK;
        constructor(geometry, material) {
            let positionLoc = 0; // from shader
            let normalLoc = 1; // same
            super(geometry, positionLoc, normalLoc);
            let { program, uniformLocations } = GetOrCreateStandardMaterial();
            this.program = program;
            this.uniforms = uniformLocations;
            gl.useProgram(program);
            this.material = { ...material };
            // shadows
            this.shadowProgram = GetOrCreateShadowProgram().program;
        }
        prepareMaterial() {
            let { uniforms, material } = this;
            gl.uniform1i(uniforms.get(standardMaterial_var_ALBEDO), 0);
            gl.uniform1i(uniforms.get(standardMaterial_var_NORMALMAP), 1);
            gl.uniform1i(uniforms.get(standardMaterial_var_ROUGHNESSMAP), 2);
            gl.uniform1i(uniforms.get(standardMaterial_var_HASALBEDO), 0);
            gl.uniform1i(uniforms.get(standardMaterial_var_HASNORMALMAP), 0);
            gl.uniform1i(uniforms.get(standardMaterial_var_HASROUGHNESSMAP), 0);
            gl.uniform1i(uniforms.get(standardMaterial_var_ENABLESHADOWS), this.receiveShadows ? 1 : 0);
            gl.uniform1f(uniforms.get(standardMaterial_var_SHARPNESS), 1);
            gl.uniform3f(uniforms.get(standardMaterial_var_SCALE), 1, 1, 1);
            gl.uniform3f(uniforms.get(standardMaterial_var_OFFSET), 0, 0, 0);
            for (let i = 0; i < 8; ++i) {
                gl.activeTexture(gl.TEXTURE0 + i);
                gl.bindTexture(gl.TEXTURE_2D, null);
            }
            if (material) {
                gl.uniform4f(uniforms.get(standardMaterial_var_BASECOLOR), material.r, material.g, material.b, material.a);
                gl.uniform1f(uniforms.get(standardMaterial_var_METALLIC), material.metallic ?? 0);
                let coeff = 0.2;
                let eps = 1e-5;
                let roughness = 1.0 + coeff - coeff / Clamp(material.roughness ?? 0.5, eps, 1.0 - eps);
                gl.uniform1f(uniforms.get(standardMaterial_var_ROUGHNESS), roughness);
                gl.uniform1f(uniforms.get(standardMaterial_var_SHARPNESS), material.textureBlendSharpness ?? 1);
                material.textureScale && gl.uniform3fv(uniforms.get(standardMaterial_var_SCALE), material.textureScale);
                material.textureOffset && gl.uniform3fv(uniforms.get(standardMaterial_var_OFFSET), material.textureOffset);
                for (let [slot, tex] of this.textures) {
                    gl.activeTexture(gl.TEXTURE0 + slot);
                    gl.bindTexture(gl.TEXTURE_2D, tex);
                    gl.uniform1i(uniforms.get([
                        standardMaterial_var_HASALBEDO,
                        standardMaterial_var_HASNORMALMAP,
                        standardMaterial_var_HASROUGHNESSMAP
                    ][slot]), tex ? 1 : 0);
                }
            }
            if (this.cull != null) {
                gl.enable(gl.CULL_FACE);
                gl.cullFace(this.cull);
            }
            else {
                gl.disable(gl.CULL_FACE);
            }
            if (this.transparent) {
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            }
            else {
                gl.disable(gl.BLEND);
            }
        }
        setTextures(textures) {
            this.textures.set(0 /* Albedo */, textures.albedo);
            this.textures.set(1 /* Normal */, textures.normalMap);
            this.textures.set(2 /* Roughness */, textures.roughness);
            return this;
        }
        render(mode, viewMatrices, worldMatrix, light) {
            if (mode == 1 /* Shadow */ && !this.castShadows) {
                return;
            }
            let { uniforms } = this;
            let { viewMatrix, viewProjectionMatrix } = viewMatrices;
            gl.useProgram(mode == 0 /* Normal */ ? this.program : this.shadowProgram);
            gl.bindVertexArray(this.vao);
            if (mode == 0 /* Normal */) {
                let worldViewMatrix = tmpWorldViewMatrix.set(viewMatrix).m(worldMatrix);
                let worldViewProjectionMatrix = tmpWorldViewProjectionMatrix.set(viewProjectionMatrix).m(worldMatrix);
                let worldViewNormalMatrix = worldViewMatrix.topLeft3x3(tmpWorldViewNormalMatrix).invert() /* .transpose() */;
                let worldNormalMatrix = worldMatrix.topLeft3x3(tmpWorldNormalMatrix).invert() /* .transpose() */;
                gl.uniformMatrix4fv(uniforms.get(standardMaterial_var_WORLDVIEWMAT), false, worldViewMatrix);
                gl.uniformMatrix4fv(uniforms.get(standardMaterial_var_WORLDVIEWPROJMAT), false, worldViewProjectionMatrix);
                gl.uniformMatrix4fv(uniforms.get(standardMaterial_var_WORLDMAT), false, worldMatrix);
                gl.uniformMatrix3fv(uniforms.get(standardMaterial_var_WORLDVIEWNORMALMAT), true, worldViewNormalMatrix);
                gl.uniformMatrix3fv(uniforms.get(standardMaterial_var_WORLDNORMALMAT), true, worldNormalMatrix);
                gl.uniform3fv(uniforms.get(standardMaterial_var_LIGHTPOS), tmpVec3
                    .copyFrom(light.P)
                    .a(viewMatrices.cameraPosition)
                    .applyMatrix4x4(light.matrix(tmpTransformMatrix_mesh_ts).p(viewMatrix))
                    .r());
                gl.uniform3fv(uniforms.get(standardMaterial_var_LIGHTPOSWORLD), tmpVec3.copyFrom(light.P).r());
                this.prepareMaterial();
                gl.activeTexture(gl.TEXTURE0 + 3);
                gl.bindTexture(gl.TEXTURE_2D, light.depthTexture);
                gl.uniformMatrix4fv(uniforms.get(standardMaterial_var_SHADOWMVP), false, light.depthMVP);
                gl.depthMask(!this.transparent);
            }
            else {
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, null);
                gl.uniformMatrix4fv(light.worldMatLocation, false, worldMatrix);
                gl.depthMask(true);
            }
            gl.drawElements(gl.TRIANGLES, this.triangleCount, gl.UNSIGNED_INT, 0);
            gl.bindVertexArray(null);
            gl.depthMask(true); // re-enable depth write so it doesn't mess up other stuff
        }
    }
    // scenegraph/camera-control.ts
    let mouseToScreenPercent = (speed, mouseDelta) => mouseDelta * speed / window.innerHeight;
    let minCameraControlTargetPosition = NewVector3(-120, 0, -120);
    let maxCameraControlTargetPosition = NewVector3(120, 0, 120);
    class CameraControl extends SceneNode {
        camera;
        yaw = 0;
        pitch = 0.8;
        distanceFromTarget = 50;
        constructor(camera) {
            super();
            this.camera = camera;
            this.a(camera);
            this.updateTransform();
        }
        rotate(mouseDeltaX, mouseDeltaY) {
            let rotateSpeed = 2;
            let speed = rotateSpeed * window.innerHeight / 1000;
            this.yaw += mouseToScreenPercent(speed, mouseDeltaX);
            this.pitch += mouseToScreenPercent(speed, mouseDeltaY);
            this.updateTransform();
        }
        pan(mouseDeltaX, mouseDeltaY) {
            let { r, u } = this.camera.dirs;
            let panSpeed = 1.5;
            let speed = panSpeed * window.innerHeight / 1000;
            let currentX = mouseToScreenPercent(this.distanceFromTarget * speed, mouseDeltaX);
            let currentY = mouseToScreenPercent(this.distanceFromTarget * speed, mouseDeltaY);
            let offset = r.mulScalar(currentX).s(u.mulScalar(currentY));
            this.P.s(offset);
            this.P.clamp(minCameraControlTargetPosition, maxCameraControlTargetPosition);
        }
        zoom(mouseWheelDelta) {
            let minZoom = 10;
            let maxZoom = 200;
            let zoomSpeed = 0.07;
            let newScale = this.distanceFromTarget * (1 + sign(mouseWheelDelta) * zoomSpeed);
            this.distanceFromTarget = Clamp(newScale, minZoom, maxZoom);
            this.updateTransform();
        }
        updateTransform() {
            let minPitch = 0.3;
            let maxPitch = HalfPI;
            this.pitch = Clamp(this.pitch, minPitch, maxPitch);
            let horizontalRotation = NewQuaternionFromAxisAngle(0, 1, 0, -this.yaw);
            let verticalRotation = NewQuaternionFromAxisAngle(1, 0, 0, -this.pitch);
            let rotation = horizontalRotation.multiply(verticalRotation);
            let localPosition = NewVector3(0, 0, this.distanceFromTarget).applyQuaternion(rotation);
            this.camera.R.copyFrom(rotation);
            this.camera.P.copyFrom(localPosition);
        }
    }
    // texture-generator/normal-map.ts
    let NormalMapShader = (intensity) => `vec3 o=vec3(-1,1,0);oc=vec4(normalize(vec3(float(${intensity})*(texture(t0,pc+ps*o.xz).x-texture(t0,pc+ps*o.yz).x),float(${intensity})*(texture(t0,pc+ps*o.zx).x-texture(t0,pc+ps*o.zy).x),ps.y*100.))*.5+.5,1);`;
    // texture-generator/noise/voronoi.ts
    // https://iquilezles.org/www/articles/smoothvoronoi/smoothvoronoi.htm
    // yzw - cell color, x - distance to cell
    /** @noinline */
    let Voronoi = `vec4 voro(vec2 i,float s){vec2 v=floor(i),f=fract(i);vec4 d=vec4(8,0,0,0);for(int w=-2;w<=2;++w)for(int x=-2;x<=2;++x){vec2 h=vec2(x,w),P=h2(v+h);float O=length(h-f+P);vec3 m=.5+.5*sin(h1(dot(v+h,vec2(7,113)))*2.5+3.5+vec3(2,3,0));m*=m;float M=smoothstep(0.,1.,.5+.5*(d.x-O)/s);d.x=mix(d.x,O,M)-M*(1.-M)*s/(1.+3.*s);d.yzw=mix(d.yzw,m,M)-M*(1.-M)*s/(1.+3.*s);}return d;}`;
    // x - cell color, y - distance to cell
    /** @noinline */
    let VoronoiGrayscale = `vec2 voro(vec2 i,float s){vec2 v=floor(i),f=fract(i),d=vec2(0,8);for(int x=-2;x<=2;++x)for(int y=-2;y<=2;++y){vec2 h=vec2(y,x),N=h2(v+h);float M=length(h-f+N),L=.5+.5*sin(h1(dot(v+h,vec2(7,113)))*2.5+5.),K=smoothstep(0.,1.,.5+.5*(d.y-M)/s);d.y=mix(d.y,M,K)-K*(1.-K)*s/(1.+3.*s);d.x=mix(d.x,L,K)-K*(1.-K)*s/(1.+3.*s);}return d;}`;
    // https://www.iquilezles.org/www/articles/voronoilines/voronoilines.htm
    /** @noinline */
    let VoronoiDistance = `float vD(vec2 i){vec2 v=floor(i),n=fract(i),d,D;float f=8.;for(int h=-1;h<=1;++h)for(int M=-1;M<=1;++M){vec2 m=vec2(M,h),K=m+h2(v+m)-n;float J=dot(K,K);if(J<f)f=J,D=K,d=m;}f=8.;for(int h=-2;h<=2;++h)for(int M=-2;M<=2;++M){vec2 m=d+vec2(M,h),K=m+h2(v+m)-n;float J=dot(.5*(D+K),normalize(K-D));f=min(f,J);}return f;}`;
    // util/shader-utils.ts
    // https://iquilezles.org/www/articles/fbm/fbm.htm
    // https://www.shadertoy.com/view/XdXGW8
    /** @noinline */
    let ShaderUtilsWithFBM = `float h1(float n){return fract(sin(n)*43758.5453);}vec2 h2(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return fract(sin(p)*43758.5453);}float se(float x){return clamp(x,0.,1.);}float ul(float a,float b,float x){return(x-a)/(b-a);}float rp(float a,float b,float c,float d,float x){return mix(c,d,ul(a,b,x));}float sr(float e,float f,float x){return se(ul(e,f,x));}vec4 cr(vec4 a,float A,vec4 b,float B,float t){return mix(a,b,sr(A,B,t));}vec3 cr3(vec3 a,float A,vec3 b,float B,float t){return mix(a,b,sr(A,B,t));}float vr(float a,float A,float b,float B,float t){return mix(a,b,sr(A,B,t));}vec2 grad(ivec2 x){int f=x.x+x.y*11111;f=f<<13^f;f=f*(f*f*15731+789221)+1376312589>>16;return vec2(cos(float(f)),sin(float(f)));}float noise(vec2 f){ivec2 g=ivec2(floor(f));vec2 x=fract(f),d=x*x*(3.-2.*x),i=vec2(ivec2(0,1));return mix(mix(dot(grad(g+ivec2(0,1).xx),x-i.xx),dot(grad(g+ivec2(0,1).yx),x-i.yx),d.x),mix(dot(grad(g+ivec2(0,1).xy),x-i.xy),dot(grad(g+ivec2(0,1).yy),x-i.yy),d.x),d.y)*.5+.5;}float fbm(vec2 f,int g,float x,float y){float d=0.,i=1.;for(int r=0;r<g;++r)i*=.5,d+=i*noise(f*x),f*=y;return d/(1.-i);}`;
    let edgeBlend = (fnName, blend = 0.2, returnType = "vec4", edgeBlendFnName = "eb") => `
${returnType} ${edgeBlendFnName}(vec2 u){vec2 w=vec2(${blend}),s=1.-w,o=u*s,b=clamp((u-s)/w,0.,1.);return b.y*b.x*${fnName}(fract(o+(w*2.)))+b.y*(1.-b.x)*${fnName}(vec2(fract(o.x+w.x),fract(o.y+(w.y*2.))))+(1.-b.y)*(1.-b.x)*${fnName}(fract(o+w))+(1.-b.y)*b.x*${fnName}(vec2(fract(o.x+(w.x*2.)),fract(o.y+w.y)));}`;
    // texture-generator/impl/brick.ts
    let BrickTexture = (w, h, rowCount = 4, // or voronoi scale for voronoi mode
    colCount = 2, mortarSize = 0.03, rowOffset = 0.5, // (colCount + 1) * rowCount should be an integer for nice repeating pattern
    noiseScale0 = 0.05, noiseScale1 = 0.2, noiseFrequency = 1, edgeThickness = 0.1, voronoiPattern = false, minRoughness = 0.5, maxRoughness = 1.0, baseColor = [0.3, 0.22, 0.07], mortarColor = [0.8, 0.75, 0.7], normalIntensity = 0.5) => {
        let rowHeight = 1 / rowCount;
        let colWidth = 1 / colCount;
        let invAspect = rowHeight / colWidth;
        let shader = (isAlbedo) => `
vec2 gn(vec2 c){c*=float(${noiseFrequency});return vec2(fbm(c,5,10.,2.),fbm(c+vec2(1.23,4.56),5,10.,2.));}
float gv(vec2 c){return vD(c*${rowCount}.);}
${edgeBlend("gn", 0.2, "vec2", "gsn")}
${edgeBlend("gv", 0.01, "float", "gsv")}
vec4 gc(vec2 c){vec2 n=gsn(c)-.5;c+=n*float(${noiseScale0});${voronoiPattern
            ? `float d=smoothstep(float(${mortarSize}),float(${mortarSize + edgeThickness}),gsv(c));`
            : `float rh=float(${rowHeight}),cw=float(${colWidth}),y=c.y/rh,x=c.x/cw,ox=floor(y)*float(${rowOffset}),iy=.5-float(${mortarSize})-n.x*float(${noiseScale1}),ay=iy-float(${edgeThickness}),ix=.5-(float(${mortarSize})-n.y*float(${noiseScale1}))*float(${invAspect}),ax=ix-float(${edgeThickness})*float(${invAspect}),d=min(smoothstep(ix,ax,abs(.5-fract(x+ox))),smoothstep(iy,ay,abs(.5-fract(y))));`}${isAlbedo
            ? `d+=(n.x+n.y-.05)*.5;vec3 q=mix(vec3(${mortarColor.join(",")}),vec3(${baseColor.join(",")}),vec3(d));return vec4(q,1);`
            : `d+=n.x+n.y-.05;return vec4(vec3(rp(0.,1.,float(${minRoughness}),float(${maxRoughness}),d)),1);`}}`;
        let mainImage = `oc=gc(pc);`;
        let albedo = ca.CreateTexture(w, h);
        ca.DrawWithShader([ShaderUtilsWithFBM, VoronoiDistance, shader(true)], mainImage, w, h, [], albedo);
        let heightMap = ca.CreateTexture(w, h);
        ca.DrawWithShader([ShaderUtilsWithFBM, VoronoiDistance, shader(false)], mainImage, w, h, [], heightMap);
        let normalMap = ca.CreateTexture(w, h);
        ca.DrawWithShader([], NormalMapShader(normalIntensity), w, h, [heightMap], normalMap);
        let roughness = ca.CreateTexture(w, h);
        ca.DrawWithShader([ShaderUtilsWithFBM], `oc=vec4(vec3(float(${minRoughness})+float(${maxRoughness})-texture(t0,pc).x),1);`, w, h, [heightMap], roughness);
        // c.TextureToImage?.(roughness, 512, 512).then(img =>
        // {
        //     document.body.appendChild(img);
        //     img.style.position = "absolute";
        // });
        return {
            albedo,
            roughness,
            normalMap
        };
    };
    // texture-generator/impl/dirt.ts
    let DirtTexture = () => {
        let w = 1024, h = 1024, normalIntensity = 1;
        let shader = (isAlbedo) => `vec4 gc(vec2 u){vec2 c=u*50.;float q=rp(0.,1.,.3,1.,fbm(c*1.5,3,1.,2.)),h=se(1.-se(1.-vD(vec2(1)-vec2(fbm(c,5,1.,2.),fbm(c+vec2(1.23,4.56),5,1.,2.))*4.)*40.)*sr(.45,.52,fbm(c*2.,3,1.,2.)))*q;${isAlbedo
            ? `return cr(vec4(0,0,0,1),.08,vec4(.7,.9,.4,1),.67,q)*vec4(h,h,h,1);`
            : `return vec4(vec3(rp(0.,1.,.7,1.,h)),1);`}}`;
        let mainImage = `oc=eb(pc);`;
        let albedo = ca.CreateTexture(w, h);
        ca.DrawWithShader([ShaderUtilsWithFBM, VoronoiDistance, shader(true), edgeBlend("gc")], mainImage, w, h, [], albedo);
        let heightMap = ca.CreateTexture(w, h);
        ca.DrawWithShader([ShaderUtilsWithFBM, VoronoiDistance, shader(false), edgeBlend("gc")], mainImage, w, h, [], heightMap);
        let normalMap = ca.CreateTexture(w, h);
        ca.DrawWithShader([], NormalMapShader(normalIntensity), w, h, [heightMap], normalMap);
        return {
            albedo,
            roughness: heightMap,
            normalMap
        };
    };
    // texture-generator/impl/plastic.ts
    let PlasticTexture = () => {
        let w = 1024, h = 1024, normalIntensity = 5;
        let shader = (isAlbedo) => `vec4 gc(vec2 u){vec2 c=u*10.,n=vec2(fbm(c,5,1.,2.),fbm(c+vec2(1.23,4.56),5,1.,2.));float v=sqrt(voro(n*10.,1.).y)*1.5;${isAlbedo
            ? `return cr(vec4(.95,.95,.95,1),.2,vec4(1),.8,mix(v,n.x,.5))*vec4(1);`
            : `return vec4(vec3(rp(0.,1.,.8,1.,se(vr(.4,.3,.6,.7,v))*.2-n.x*1.)),1);`}}`;
        let mainImage = `oc=eb(pc);`;
        let albedo = ca.CreateTexture(w, h);
        ca.DrawWithShader([ShaderUtilsWithFBM, VoronoiGrayscale, shader(true), edgeBlend("gc")], mainImage, w, h, [], albedo);
        let heightMap = ca.CreateTexture(w, h);
        ca.DrawWithShader([ShaderUtilsWithFBM, VoronoiGrayscale, shader(false), edgeBlend("gc")], mainImage, w, h, [], heightMap);
        let normalMap = ca.CreateTexture(w, h);
        ca.DrawWithShader([], NormalMapShader(normalIntensity), w, h, [heightMap], normalMap);
        return {
            albedo,
            roughness: heightMap,
            normalMap
        };
    };
    // texture-generator/impl/wood.ts
    let WoodTexture = () => {
        let w = 2048, h = 2048, normalIntensity = 0.5;
        let shader = (isAlbedo) => `vec4 gc(vec2 u){u.y*=.1;float n=rp(.1,.6,0.,1.,fbm(voro(u*15.,1.5)*vec2(10,3),4,10.,3.));${isAlbedo
            ? `return vec4(n<.65?cr3(vec3(0),.35,vec3(.55,.35,.2),.65,n):n<.85?cr3(vec3(.55,.35,.2),.65,vec3(.75,.55,.45),.85,n):cr3(vec3(.75,.55,.45),.85,vec3(.75,.6,.5),.9,n),1);`
            : `return vec4(vec3(mix(.5,1.,smoothstep(.4,.8,n))),1);`}}`;
        let mainImage = `oc=eb(pc);`;
        let albedo = ca.CreateTexture(w, h);
        ca.DrawWithShader([ShaderUtilsWithFBM, VoronoiGrayscale, shader(true), edgeBlend("gc")], mainImage, w, h, [], albedo);
        let heightMap = ca.CreateTexture(w, h);
        ca.DrawWithShader([ShaderUtilsWithFBM, VoronoiGrayscale, shader(false), edgeBlend("gc")], mainImage, w, h, [], heightMap);
        let normalMap = ca.CreateTexture(w, h);
        ca.DrawWithShader([], NormalMapShader(normalIntensity), w, h, [heightMap], normalMap);
        return {
            albedo,
            roughness: heightMap,
            normalMap
        };
    };
    let woodColor = { r: 0.3, g: 0.23, b: 0.05, a: 1 };
    let whiteColor = { r: 1, g: 1, b: 1, a: 1 };
    // game-2023/buildings.ts
    let InitializeBuildingData = () => {
        let defaultMaterial = {
            ...whiteColor,
            metallic: 0,
            roughness: 1,
            textureScale: NewVector3(1)
        };
        let greyBrickTexture = BrickTexture(1024, 1024, 6, 3, 0.05, undefined, 0.05, 0.5, 1.1, undefined, false, undefined, undefined, [1, 1, 1], undefined, 3);
        let woodTexture = WoodTexture();
        let houseRoofTexture = BrickTexture(1024, 1024, 1, 8, 0.01, 0, 0.05, 0.05, 1, 0.05, false, 0.5, 0.8, [1, 1, 1], [1, 1, 1], 2);
        // house length = 8
        // house width = 5
        // roof max height = 5
        let houseRoofGeometry = CreateExtrudedGeometryConvex([
            0, 5,
            3, 3,
            2.5, 3,
            0, 4.66,
            -2.5, 3,
            -3, 3
        ], 8);
        let houseBaseGeometry = CreateExtrudedGeometryConvex([
            0, 4.8,
            2.4, 3.1,
            2.4, 0,
            -2.4, 0,
            -2.4, 3.1
        ], 7.5);
        let houseDoorGeometry = CreateBoxGeometry(1.2, 2.2, 0.1);
        let houseWindowGeometry = CreateBoxGeometry(0.1, 1, 0.8);
        let House = (isBlacksmith) => {
            /** @noinline */
            let randAround0 = (size) => (random() - 0.5) * size;
            let r = 0.8 + randAround0(0.4);
            let g = 0.5 + randAround0(0.3);
            let b = 0.35 + randAround0(0.2);
            let base = new Mesh(houseBaseGeometry, defaultMaterial);
            let roof = new Mesh(houseRoofGeometry, {
                ...defaultMaterial,
                r, g, b, a: 1,
                textureScale: NewVector3(0.1, 0.3, 0.3 + randAround0(0.2)),
                textureOffset: NewVector3(0.5, 0.5, 0),
                textureBlendSharpness: 10
            });
            let door = new Mesh(houseDoorGeometry, { ...defaultMaterial, textureScale: NewVector3(0.5) });
            let windowMaterial = { ...defaultMaterial, r: 0.2, g: 0.2, b: 0.2, a: 1, roughness: 0.2 };
            let window0 = new Mesh(houseWindowGeometry, windowMaterial);
            let window1 = new Mesh(houseWindowGeometry, windowMaterial);
            let window2 = new Mesh(houseWindowGeometry, windowMaterial);
            base.setTextures(greyBrickTexture);
            door.setTextures(woodTexture);
            roof.setTextures(houseRoofTexture);
            door.P.setValues(0, 2.2 * 0.5, -7.5 * 0.5);
            window0.P.setValues(2.4, 1.8, -2);
            window1.P.setValues(2.4, 1.8, 2);
            window2.P.setValues(-2.4, 1.8, 1);
            let group = new SceneNode();
            group.R.setFromAxisAngle(0, 1, 0, PI / (random() < 0.5 ? -2 : 2));
            if (isBlacksmith) {
                base.material.r = base.material.g = base.material.b = 0.6;
                roof.material.r = roof.material.g = roof.material.b = 0.2;
            }
            return group.a(base, roof, door, window0, window1, window2);
        };
        let windmillRoofTexture = PlasticTexture();
        let windmillHeight = 8;
        let windmillRoofHeight = 2.5;
        let windmillBaseGeometry = CreateCylinderGeometry(windmillHeight, 4, 3, 32);
        let windmillRoofGeometry = CreateCylinderGeometry(windmillRoofHeight, 3.2, 0, 32);
        let windmillBladeGeometry = JoinGeometries(TransformGeometry(CreateCylinderGeometry(5, 0.2, 0.2), NewMatrix4x4Compose(NewVector3(0, 0, 2), NewQuaternionFromAxisAngle(1, 0, 0, HalfPI), NewVector3(1))), CreateBoxGeometry(0.3, 12, 0.3), CreateBoxGeometry(12, 0.3, 0.3));
        let windmillFieldGeometry = (() => {
            let rng = Mulberry32(1);
            let minX = -6;
            let maxX = 6;
            let minHeight = 0.8;
            let maxHeight = 1.2;
            let minZ = -20;
            let maxZ = 0;
            let minScale = 0.3;
            let maxScale = 0.6;
            let rotate = NewQuaternion();
            let count = 2000;
            let geometries = [];
            for (let i = 0; i < count; ++i) {
                let x = Lerp(minX, maxX, rng());
                let height = Lerp(minHeight, maxHeight, rng());
                let z = Lerp(minZ, maxZ, rng());
                let scale = Lerp(minScale, maxScale, rng());
                let rotation = rng() * TwoPI;
                let tilt = rng() * 0.1;
                let box = CreateBoxGeometry(0.05, height, 0.05 * scale);
                TranslateGeometry(box, 0, height / 2, 0);
                RotateGeometry(box, rotate.setFromAxisAngle(1, 0, 0, tilt));
                RotateGeometry(box, rotate.setFromAxisAngle(0, 1, 0, rotation));
                TranslateGeometry(box, x, 0, z);
                geometries.push(box);
            }
            return JoinGeometries(...geometries);
        })();
        let windmillBladeClothGeometry = (() => {
            let cloth0 = CreateBoxGeometry(1, 5, 0.01);
            let transform = NewMatrix4x4Compose(NewVector3(0.5, 3.4, 0), NewQuaternion(), NewVector3(1));
            let rotation = NewMatrix4x4Compose(NewVector3(), NewQuaternionFromAxisAngle(0, 0, 1, HalfPI), NewVector3(1));
            let cloth1 = CloneGeometry(cloth0);
            TransformGeometry(cloth0, transform);
            let cloth2 = CloneGeometry(cloth1);
            TransformGeometry(cloth1, transform.p(rotation));
            let cloth3 = CloneGeometry(cloth2);
            TransformGeometry(cloth2, transform.p(rotation));
            TransformGeometry(cloth3, transform.p(rotation));
            return JoinGeometries(cloth0, cloth1, cloth2, cloth3);
        })();
        let Windmill = () => {
            let base = new Mesh(windmillBaseGeometry, { ...defaultMaterial, textureScale: NewVector3(0.75), textureBlendSharpness: 100 });
            let roof = new Mesh(windmillRoofGeometry, { r: 0.4, g: 0.4, b: 0.4, a: 1, textureBlendSharpness: 100 });
            let blades = new Mesh(windmillBladeGeometry, defaultMaterial);
            let bladesCloth = new Mesh(windmillBladeClothGeometry, defaultMaterial);
            let door = new Mesh(houseDoorGeometry, { ...defaultMaterial, textureScale: NewVector3(0.5) });
            let field = new Mesh(windmillFieldGeometry, { r: 1, g: 0.9, b: 0, a: 1, metallic: 0, roughness: 0.9 });
            base.setTextures(greyBrickTexture);
            roof.setTextures(windmillRoofTexture);
            blades.setTextures(woodTexture);
            door.setTextures(woodTexture);
            base.P.y = windmillHeight / 2;
            roof.P.y = windmillHeight + windmillRoofHeight / 2;
            door.P.setValues(3.85, 2.2 * 0.5, 0);
            door.R.setFromAxisAngle(0, 1, 0, HalfPI).multiply(NewQuaternionFromAxisAngle(1, 0, 0, -0.13));
            field.P.z = -5;
            let bladesContainer = new SceneNode();
            bladesContainer.P.setValues(0, 8.5, -4);
            bladesContainer.a(blades, bladesCloth);
            let group = new SceneNode();
            group.a(base, roof, bladesContainer, field);
            let timeOffset = random() * HalfPI;
            bladesContainer.onUpdate.push(n => n.R.setFromAxisAngle(0, 0, 1, Scene.now * 0.1 + timeOffset));
            let pivot = new SceneNode();
            group.P.z = 10.5;
            pivot.R.setFromAxisAngle(0, 1, 0, HalfPI);
            return pivot.a(group);
        };
        let towerBaseHeight = 8;
        let towerTopHeight = 1;
        let towerTopRadius = 2.4;
        let CreateTowerTopSide = (angle) => {
            let thickness = 0.4;
            let length = 1.4;
            let height = 0.8;
            let radius = towerTopRadius - thickness / 2 - 0.08;
            let box = CreateBoxGeometry(thickness, height, length);
            RotateGeometryWithAxisAngle(box, 0, 1, 0, -angle);
            return TranslateGeometry(box, cos(angle) * radius, towerBaseHeight + towerTopHeight + height / 2, sin(angle) * radius);
        };
        let towerGeometry = JoinGeometries(TranslateGeometry(CreateCylinderGeometry(towerBaseHeight, 2, 2), 0, towerBaseHeight / 2, 0), // base
        FlatShade(TranslateGeometry(CreateCylinderGeometry(towerTopHeight, towerTopRadius, towerTopRadius, 12), 0, towerBaseHeight + towerTopHeight / 2, 0)), // top
        // sides
        ...[1, 3, 5, 7, 9, 11].map(a => CreateTowerTopSide(PI / 12 + PI / 6 * a)));
        let Tower = () => {
            let tower = new Mesh(towerGeometry, { r: 0.8, g: 0.8, b: 0.8, a: 1, textureScale: NewVector3(0.75), textureBlendSharpness: 100 });
            tower.setTextures(greyBrickTexture);
            return tower;
        };
        let wallHeight = 8;
        let wallLength = 50;
        let wallHalfThickness = 1;
        let wallTopExtraThickness = 0.4;
        let wallTopSpacing = 2.7;
        let GenerateWallTop = (count) => [...Array(count).keys()]
            .map(idx => TranslateGeometry(CreateBoxGeometry(1.8, 0.8, 0.4), (idx - (count - 1) / 2) * wallTopSpacing, wallHeight + 0.8 / 2, 1.4 - 0.4 / 2));
        let WallBaseGeometry = (length) => RotateGeometryWithAxisAngle(CreateExtrudedGeometryConvex([
            -wallHalfThickness, wallHeight,
            wallHalfThickness + wallTopExtraThickness, wallHeight,
            wallHalfThickness + wallTopExtraThickness, wallHeight - 1,
            wallHalfThickness, wallHeight - 2,
            wallHalfThickness, 0,
            -wallHalfThickness, 0
        ], length), 0, 1, 0, NegHalfPI);
        let wallGeometry = JoinGeometries(WallBaseGeometry(wallLength), ...GenerateWallTop(17));
        let Wall = () => new Mesh(wallGeometry, { r: 0.8, g: 0.8, b: 0.8, a: 1, textureScale: NewVector3(0.75), textureBlendSharpness: 100 })
            .setTextures(greyBrickTexture);
        let castleWallLength = 14;
        let halfCastleWallLength = castleWallLength / 2;
        let castleWallGeometry = JoinGeometries(WallBaseGeometry(castleWallLength), ...GenerateWallTop(5));
        let topCastleWallLength = 8;
        let halfTopCastleWallLength = topCastleWallLength / 2;
        let topCastleWallGeometry = JoinGeometries(WallBaseGeometry(topCastleWallLength + 2.8), ...GenerateWallTop(3));
        let transformCastleWall = (geometry, angle, x, y, z) => TranslateGeometry(RotateGeometryWithAxisAngle(CloneGeometry(geometry), 0, 1, 0, angle), x, y, z);
        let secondFloorOffset = 5;
        let bigTowerOffset = 8;
        let allCastleWallsAndTowers = JoinGeometries(
        // ground walls
        transformCastleWall(castleWallGeometry, 0 * HalfPI, 0, 0, halfCastleWallLength), transformCastleWall(castleWallGeometry, 1 * HalfPI, halfCastleWallLength, 0, 0), transformCastleWall(castleWallGeometry, 2 * HalfPI, 0, 0, -halfCastleWallLength), transformCastleWall(castleWallGeometry, 3 * HalfPI, -halfCastleWallLength, 0, 0), 
        // ground towers
        TranslateGeometry(CloneGeometry(towerGeometry), halfCastleWallLength, 0, halfCastleWallLength), TranslateGeometry(CloneGeometry(towerGeometry), -halfCastleWallLength, 0, halfCastleWallLength), TranslateGeometry(CloneGeometry(towerGeometry), halfCastleWallLength, 0, -halfCastleWallLength), TranslateGeometry(CloneGeometry(towerGeometry), -halfCastleWallLength, 0, -halfCastleWallLength), 
        // second floor walls
        transformCastleWall(topCastleWallGeometry, 0 * HalfPI, 0, secondFloorOffset, halfTopCastleWallLength), transformCastleWall(topCastleWallGeometry, 1 * HalfPI, halfTopCastleWallLength, secondFloorOffset, 0), transformCastleWall(topCastleWallGeometry, 2 * HalfPI, 0, secondFloorOffset, -halfTopCastleWallLength), transformCastleWall(topCastleWallGeometry, 3 * HalfPI, -halfTopCastleWallLength, secondFloorOffset, 0), 
        // second floor towers
        TranslateGeometry(CloneGeometry(towerGeometry), halfTopCastleWallLength, secondFloorOffset, halfTopCastleWallLength), TranslateGeometry(CloneGeometry(towerGeometry), -halfTopCastleWallLength, secondFloorOffset, halfTopCastleWallLength), TranslateGeometry(CloneGeometry(towerGeometry), halfTopCastleWallLength, secondFloorOffset, -halfTopCastleWallLength), TranslateGeometry(CloneGeometry(towerGeometry), -halfTopCastleWallLength, secondFloorOffset, -halfTopCastleWallLength), 
        // big middle tower
        TransformGeometry(CloneGeometry(towerGeometry), NewMatrix4x4Compose(NewVector3(0, bigTowerOffset, 0), NewQuaternion(), NewVector3(1.5, 1, 1.5))), 
        // center fill
        TranslateGeometry(CreateBoxGeometry(castleWallLength, 2, castleWallLength), 0, wallHeight - 1, 0), 
        // second floor center fill
        TranslateGeometry(CreateBoxGeometry(topCastleWallLength, 2, topCastleWallLength), 0, wallHeight + secondFloorOffset - 1, 0));
        let castleRoofHeight = 3;
        let castleTopRoofHeight = 6;
        let allCastleTowerRoofs = JoinGeometries(TranslateGeometry(CreateCylinderGeometry(castleRoofHeight, 2.2, 0, 32), halfCastleWallLength, towerBaseHeight + towerTopHeight + castleRoofHeight / 2, halfCastleWallLength), TranslateGeometry(CreateCylinderGeometry(castleRoofHeight, 2.2, 0, 32), -halfCastleWallLength, towerBaseHeight + towerTopHeight + castleRoofHeight / 2, halfCastleWallLength), TranslateGeometry(CreateCylinderGeometry(castleRoofHeight, 2.2, 0, 32), halfCastleWallLength, towerBaseHeight + towerTopHeight + castleRoofHeight / 2, -halfCastleWallLength), TranslateGeometry(CreateCylinderGeometry(castleRoofHeight, 2.2, 0, 32), -halfCastleWallLength, towerBaseHeight + towerTopHeight + castleRoofHeight / 2, -halfCastleWallLength), TranslateGeometry(CreateCylinderGeometry(castleTopRoofHeight, 3.5, 0, 32), 0, bigTowerOffset + towerBaseHeight + towerTopHeight + castleTopRoofHeight / 2, 0));
        let castleDoorGeometry = CreateExtrudedGeometryConvex([
            1.5, 0,
            -1.5, 0,
            -1.5, 4,
            -1.2, 4.5,
            -0.8, 4.8,
            0, 5,
            0.8, 4.8,
            1.2, 4.5,
            1.5, 4
        ], 0.2);
        let Castle = () => {
            let group = new SceneNode();
            let walls = new Mesh(allCastleWallsAndTowers, { r: 0.6, g: 0.6, b: 0.6, a: 1, textureScale: NewVector3(0.75), textureBlendSharpness: 100 });
            let roofs = new Mesh(allCastleTowerRoofs, {
                ...defaultMaterial,
                r: 0.8, g: 0.5, b: 0.35, a: 1,
                textureScale: NewVector3(0.1, 0.3, 0.3),
                textureOffset: NewVector3(0.5, 0.5, 0),
                textureBlendSharpness: 1
            });
            let door = new Mesh(castleDoorGeometry, { r: 0.7, g: 0.7, b: 0.7, a: 1, textureScale: NewVector3(0.5) });
            walls.setTextures(greyBrickTexture);
            roofs.setTextures(windmillRoofTexture);
            door.setTextures(woodTexture);
            door.P.z = castleWallLength / 2 + wallHalfThickness;
            return group.a(walls, roofs, door);
        };
        let churchTowerBaseHeight = 12;
        let churchTowerWidth = 5;
        let churchTowerRoofHeight = 5;
        let churchScaleMatrix = NewMatrix4x4Compose(NewVector3(), NewQuaternion(), NewVector3(1.5, 1.7, 2));
        let churchRoofGeometry = TransformGeometry(CloneGeometry(houseRoofGeometry), churchScaleMatrix);
        let churchTowerRoofGeometry = TranslateGeometry(RotateGeometryWithAxisAngle(FlatShade(CreateCylinderGeometry(churchTowerRoofHeight, 3.6, 0, 4)), 0, 1, 0, HalfPI / 2), 0, churchTowerBaseHeight + churchTowerRoofHeight / 2, -10);
        let churchBaseGeometry = JoinGeometries(
        // main building
        TransformGeometry(CloneGeometry(houseBaseGeometry), churchScaleMatrix), 
        // tower
        TranslateGeometry(CreateBoxGeometry(churchTowerWidth, churchTowerBaseHeight, churchTowerWidth), 0, churchTowerBaseHeight / 2, -10));
        let churchWindowGeometry = TransformGeometry(CloneGeometry(castleDoorGeometry), NewMatrix4x4Compose(NewVector3(), NewQuaternionFromAxisAngle(0, 1, 0, HalfPI), NewVector3(0.5)));
        let churchCombinedWindowGeometries = JoinGeometries(TranslateGeometry(CloneGeometry(churchWindowGeometry), 3.6, 1.7, -3), TranslateGeometry(CloneGeometry(churchWindowGeometry), 3.6, 1.7, 3), TranslateGeometry(CloneGeometry(churchWindowGeometry), -3.6, 1.7, -3), TranslateGeometry(CloneGeometry(churchWindowGeometry), -3.6, 1.7, 3), TranslateGeometry(CloneGeometry(churchWindowGeometry), 2.5, 8, -10), TranslateGeometry(CloneGeometry(churchWindowGeometry), -2.5, 8, -10));
        let Church = () => {
            let base = new Mesh(churchBaseGeometry, defaultMaterial);
            let roofMaterial = {
                r: 0.8, g: 0.4, b: 0.3, a: 1,
                textureScale: NewVector3(0.1, 0.3, 0.3),
                textureOffset: NewVector3(0.5, 0.5, 0),
                textureBlendSharpness: 10
            };
            let roof = new Mesh(churchRoofGeometry, roofMaterial);
            let towerRoof = new Mesh(churchTowerRoofGeometry, roofMaterial);
            let windowMaterial = { ...defaultMaterial, r: 0.2, g: 0.2, b: 0.2, a: 1, roughness: 0.2 };
            let windows = new Mesh(churchCombinedWindowGeometries, windowMaterial);
            base.setTextures(greyBrickTexture);
            roof.setTextures(houseRoofTexture);
            towerRoof.setTextures(windmillRoofTexture);
            let group = new SceneNode();
            group.a(base, roof, towerRoof, windows);
            group.P.z += 2.5;
            let pivot = new SceneNode();
            pivot.R.setFromAxisAngle(0, 1, 0, PI / (random() < 0.5 ? -2 : 2) + HalfPI);
            return pivot.a(group);
        };
        return {
            House: () => House(false),
            Blacksmith: () => House(true),
            Windmill,
            Tower,
            Wall,
            Castle,
            Church,
        };
    };
    // game-2023/audio.ts
    let SwordImpactSound = (target) => {
        let when = actx.currentTime + 0.05;
        let PlaySound = (freq, fadeOutDuration, volume) => {
            let sourceNode = actx.createOscillator();
            let startFreq = freq;
            sourceNode.frequency.value = startFreq;
            Drum(volume, when, sourceNode, false, 0, 0, 0.001, fadeOutDuration, 0.001, undefined, target);
        };
        PlaySound(6000, 0.1, 0.5);
        PlaySound(5000, 0.9, 0.3);
        PlaySound(4500, 0.3, 0.3);
        PlaySound(3500, 0.4, 1);
        PlaySound(1500, 1, 0.4);
        HiHat(when, 3500, 0.13, target);
    };
    let BowShotSound = (target) => {
        let when = actx.currentTime + 0.05;
        Snare(when, 0.05, target);
        Drum(0.3, when + 0.01, CreateNoiseNode(), false, 0, 0, 0.05, 0.5, 0.001, undefined, target);
    };
    let StartMusic = () => {
        let scheduledDuration = actx.currentTime + 0.1;
        let scheduledCount = 0;
        let duration = 6;
        let scheduleAheadTime = 3;
        let rng = Mulberry32(0);
        let noteRng = Mulberry32(0);
        let update = () => {
            let half = duration / 2;
            let quarter = duration / 4;
            let eight = duration / 8;
            let sixteenth = duration / 16;
            let thirtytwoeth = duration / 32;
            let sixtyFourth = duration / 64;
            let elapsed = actx.currentTime;
            let requiredDuration = elapsed + scheduleAheadTime;
            while (scheduledDuration < requiredDuration) {
                if (scheduledCount++ % 2 == 0) {
                    let maxNoteSequenceCount = 10;
                    noteRng = Mulberry32(rng() * maxNoteSequenceCount | 0);
                }
                let currentStart = scheduledDuration;
                scheduledDuration += duration;
                let guitar = (octave, note, when) => Guitar2(octave, note, 1, when, 0.2, undefined, 0.5 + rng() * 4);
                let bass = (octave, note, when) => Bass1(octave, note, 0.4, when, 0.2, 0.4, 0.1);
                let when = currentStart;
                when += eight;
                let snareDuration = 0.4;
                Snare(when, snareDuration);
                when += quarter;
                Snare(when, snareDuration);
                when += quarter;
                Snare(when, snareDuration);
                when += quarter;
                Snare(when, snareDuration);
                let tones = [
                    [0, 2, 4, 7, 9],
                    [2, 4, 7, 9, 12],
                    [4, 7, 9, 12, 14]
                ];
                let row = tones[noteRng() * tones.length | 0];
                let randomTone = () => row[noteRng() * row.length | 0] - 3;
                for (let i = 0; i < 16; ++i) {
                    let tone = randomTone();
                    bass(2, tone, currentStart + sixteenth * i);
                    if (noteRng() > 0.8) {
                        guitar(2, tone, currentStart + thirtytwoeth * (i * 2));
                        guitar(2, randomTone(), currentStart + thirtytwoeth * (i * 2 + 1));
                    }
                    else {
                        guitar(2, tone, currentStart + sixteenth * i);
                    }
                    ++i;
                    tone = randomTone();
                    let r = noteRng();
                    if (r > 0.95) { }
                    else if (r > 0.6) {
                        guitar(2, tone, currentStart + thirtytwoeth * (i * 2));
                        guitar(2, randomTone(), currentStart + thirtytwoeth * (i * 2 + 1));
                    }
                    else {
                        guitar(2, tone, currentStart + sixteenth * i);
                    }
                }
            }
        };
        update();
        let interval = setInterval(update, 1379);
        return {
            stop: () => clearInterval(interval),
            setDuration: (d) => duration = d
        };
    };
    // game-2023/models.ts
    //// shield
    let shieldGeometry = CreateExtrudedGeometryConvex([
        0, -0.4,
        -0.3, -0.2,
        -0.3, 0.3,
        0, 0.3,
        0.3, 0.3,
        0.3, -0.2
    ], 0.04);
    let indicesToMove = [0, 1, 16, 17, 14, 15, 6, 7, 28, 29, 26, 27];
    indicesToMove.forEach(idx => shieldGeometry.v[idx * 3 + 2] += 0.1); // move z coordinate
    FlatShade(shieldGeometry);
    let ShieldObject = () => new Mesh(shieldGeometry, { r: 0.5, g: 1, b: 0.5, a: 1, metallic: 0.6, roughness: 0, textureScale: NewVector3(2) });
    //// sword
    let swordBladeGeometry = CreateExtrudedGeometryConvex([
        0, 0.8,
        0.02, 0.75,
        0.02, 0,
        -0.02, 0,
        -0.02, 0.75
    ], 0.005);
    let swordHandleGeometry = JoinGeometries(CreateBoxGeometry(0.15, 0.03, 0.03), TranslateGeometry(CreateCylinderGeometry(0.14, 0.015, 0.015), 0, -0.07, 0));
    let SwordObject = () => {
        let group = new SceneNode();
        let blade = new Mesh(swordBladeGeometry, { r: 4, g: 4, b: 4, a: 1, metallic: 0.8, roughness: 0.4 });
        let handle = new Mesh(swordHandleGeometry, { ...woodColor, metallic: 0, roughness: 0.8 });
        return group.a(blade, handle);
    };
    //// bow
    let bowGeometry = JoinGeometries(CreateCylinderGeometry(0.3, 0.02, 0.02), TranslateGeometry(RotateGeometryWithAxisAngle(CreateCylinderGeometry(0.3, 0.02, 0.02), 1, 0, 0, 0.5), 0, 0.27, 0.07), TranslateGeometry(RotateGeometryWithAxisAngle(CreateCylinderGeometry(0.3, 0.02, 0.02), 1, 0, 0, -0.5), 0, -0.27, 0.07));
    let bowStringGeometry = TranslateGeometry(CreateCylinderGeometry(0.75, 0.005, 0.005), 0, 0, 0.14);
    let BowObject = () => {
        let group = new SceneNode();
        let bow = new Mesh(bowGeometry, { ...woodColor });
        let bowString = new Mesh(bowStringGeometry, { ...whiteColor });
        return group.a(bow, bowString);
    };
    //// tree
    let treeLeavesGeometry = JoinGeometries(TranslateGeometry(CreateCylinderGeometry(2.3, 2.3 * 0.8, 0.02), 0, 1.4, 0), TranslateGeometry(CreateCylinderGeometry(2.0, 2.0 * 0.8, 0.02), 0, 2.0, 0), TranslateGeometry(CreateCylinderGeometry(1.7, 1.7 * 0.8, 0.02), 0, 2.6, 0), TranslateGeometry(CreateCylinderGeometry(1.4, 1.4 * 0.8, 0.02), 0, 3.2, 0), TranslateGeometry(CreateCylinderGeometry(1.1, 1.1 * 0.8, 0.02), 0, 3.8, 0), TranslateGeometry(CreateCylinderGeometry(0.8, 0.8 * 0.8, 0.02), 0, 4.3, 0));
    let TreeObject = () => {
        // no trunk, just floating leaves, to save draw calls
        let tree = new Mesh(treeLeavesGeometry, { r: 0, g: 0.4 + random() * 0.4, b: 0.2 * random(), a: 1 });
        let verticalScale = 0.8 + random();
        let horizontalScale = 0.9 + random() * 0.2;
        tree.S.setValues(horizontalScale, verticalScale, horizontalScale);
        return tree;
    };
    // game-2023/human.ts
    let defaultMaterial = { ...whiteColor, metallic: 0.6, roughness: 0.2, textureScale: NewVector3(5), textureBlendSharpness: 20 };
    let headGeometry = CreateSphereGeometry(0.025);
    let bodyGeometry = CreateCapsuleGeometry(0.3, 0.2);
    let lowerBodyGeometry = CreateCylinderGeometry(0.5, 0.3, 0.25);
    let upperLegGeometry = TranslateGeometry(CreateCylinderGeometry(0.4, 0.08, 0.1), 0, -0.2, 0);
    let lowerLegGeometry = TranslateGeometry(CreateCylinderGeometry(0.4, 0.07, 0.1), 0, -0.2, 0);
    let footGeometry = RotateGeometryWithAxisAngle(CreateExtrudedGeometryConvex([
        0.08, 0,
        -0.22, 0,
        -0.22, 0.035,
        -0.20, 0.05,
        -0.03, 0.1,
        0.05, 0.1,
        0.08, 0.03
    ], 0.14), 0, 1, 0, NegHalfPI);
    let upperArmGeometry = TranslateGeometry(CreateCylinderGeometry(0.3, 0.05, 0.08), 0, -0.15, 0);
    let lowerArmGeometry = TranslateGeometry(CreateCylinderGeometry(0.4, 0.03, 0.05), 0, -0.2, 0);
    let Pulse = (t, base, radius) => {
        // get fractional part from t, and remap to [-1, 1]
        t = (t % 1) * 2 - 1;
        let sgn = sign(t);
        let x = PI - sgn * t * radius;
        return sgn * sin(x) * (base ** x);
    };
    let CreateHuman = (isEnemy, isArcher) => {
        /** @noinline */
        let meshFactory = (geometry) => new Mesh(geometry, { ...defaultMaterial, roughness: 0.6 });
        let head = meshFactory(headGeometry);
        let body = meshFactory(bodyGeometry);
        let lowerBody = meshFactory(lowerBodyGeometry);
        let leftUpperLeg = meshFactory(upperLegGeometry);
        let leftLowerLeg = meshFactory(lowerLegGeometry);
        let leftFoot = meshFactory(footGeometry);
        let rightUpperLeg = meshFactory(upperLegGeometry);
        let rightLowerLeg = meshFactory(lowerLegGeometry);
        let rightFoot = meshFactory(footGeometry);
        let leftUpperArm = meshFactory(upperArmGeometry);
        let leftLowerArm = meshFactory(lowerArmGeometry);
        let rightUpperArm = meshFactory(upperArmGeometry);
        let rightLowerArm = meshFactory(lowerArmGeometry);
        let walkMultiplier = 0;
        let walkSpeed = 3;
        let animationTimeOffset = random();
        let now = () => Scene.now + animationTimeOffset;
        let UpperLegWalk = (node, offset, multiplier) => {
            let speed = 2;
            let magnitude = 1.0;
            let offset2 = 0.6;
            let t = (sin(now() * walkSpeed * speed + offset * TwoPI) + 1) / 2;
            node.R.setFromAxisAngle(1, 0, 0, (offset2 - (t ** 1.2)) * magnitude * multiplier);
        };
        let LowerLegWalk = (node, offset, multiplier) => {
            let speed = 5;
            let magnitude = 0.15;
            offset += 0.05;
            let t = now() * walkSpeed / PI + offset;
            node.R.setFromAxisAngle(1, 0, 0, (Pulse(t, 2, speed) * magnitude - 4 * magnitude) * multiplier);
        };
        let BodyMovement = (node, multiplier) => {
            let t = now() * walkSpeed * 4;
            let zOffset = 2;
            let zMagnitude = 0.05 * multiplier;
            node.P.z = (((sin(t + zOffset) + 1) / 2) ** 2) * zMagnitude;
            let yOffset = 1;
            let yMagnitude = 0.04;
            node.P.y = Lerp(0.02, (((sin(t + yOffset) + 1) / 2) ** 2) * yMagnitude - 0.05, multiplier);
        };
        leftUpperLeg.onUpdate.push(node => UpperLegWalk(node, 0, walkMultiplier));
        rightUpperLeg.onUpdate.push(node => UpperLegWalk(node, 0.5, walkMultiplier));
        leftLowerLeg.onUpdate.push(node => LowerLegWalk(node, 0, walkMultiplier));
        rightLowerLeg.onUpdate.push(node => LowerLegWalk(node, 0.5, walkMultiplier));
        head.P.y = 1.55;
        head.S.setValues(3.5, 4.5, 4);
        body.P.y = 1.05;
        body.S.setValues(0.7, 1, 0.5);
        lowerBody.P.y = 0.95;
        lowerBody.S.setValues(0.75, 1, 0.5);
        leftUpperLeg.P.setValues(-0.11, 0.8, 0);
        rightUpperLeg.P.setValues(0.11, 0.8, 0);
        leftLowerLeg.P.setValues(0, -0.4, 0);
        leftLowerLeg.S.setValues(0.85, 1, 0.85);
        rightLowerLeg.P.setValues(0, -0.4, 0);
        rightLowerLeg.S.setValues(0.85, 1, 0.85);
        leftUpperLeg.a(leftLowerLeg);
        rightUpperLeg.a(rightLowerLeg);
        leftFoot.P.y = -0.4;
        rightFoot.P.y = -0.4;
        leftLowerLeg.a(leftFoot);
        rightLowerLeg.a(rightFoot);
        leftUpperArm.P.setValues(-0.15, 1.32, 0);
        leftUpperArm.a(leftLowerArm);
        leftLowerArm.P.setValues(0, -0.3, 0);
        rightUpperArm.P.setValues(0.15, 1.32, 0);
        rightUpperArm.a(rightLowerArm);
        let setRightUpperArmDefaultRotation = () => rightUpperArm.R.setFromAxisAngle(0, 0, 1, 0.5).premultiplyAxisAngle(1, 0, 0, 0.5);
        rightLowerArm.P.setValues(0, -0.3, 0);
        let node = new SceneNode();
        let bodyContainer = new SceneNode();
        node.a(bodyContainer.a(head, body, lowerBody, leftUpperLeg, rightUpperLeg, leftUpperArm, rightUpperArm));
        bodyContainer.onUpdate.push(node => BodyMovement(node, walkMultiplier));
        let bow = null;
        if (isArcher) {
            leftUpperArm.R.setFromAxisAngle(1, 0, 0, 1).premultiplyAxisAngle(0, 1, 0, 0.4);
            leftLowerArm.R.setFromAxisAngle(0, 0, 1, 1).premultiplyAxisAngle(1, 0, 0, 1);
            rightUpperArm.R.setFromAxisAngle(0, 1, 0, 0.5).premultiplyAxisAngle(1, 0, 0, 1.3);
            rightLowerArm.R.setFromAxisAngle(1, 0, 0, 0.4);
            bow = BowObject();
            bow.P.y = -0.4;
            bow.R.setFromAxisAngle(0, 1, 0, -0.2).premultiplyAxisAngle(1, 0, 0, -HalfPI);
            rightLowerArm.a(bow);
        }
        else {
            leftUpperArm.R.setFromAxisAngle(1, 0, 0, 1).premultiplyAxisAngle(0, 1, 0, 0.4);
            leftLowerArm.R.setFromAxisAngle(0, 0, 1, 1.8);
            rightLowerArm.R.setFromAxisAngle(1, 0, 0, 1.2);
            setRightUpperArmDefaultRotation();
            let shield = ShieldObject();
            if (isEnemy) {
                shield.material.r = 1;
                shield.material.g = 0.3;
            }
            leftLowerArm.a(shield);
            shield.P.y = -0.15;
            shield.R.setFromAxisAngle(0, 0, 1, HalfPI).premultiplyAxisAngle(0, 1, 0, -2.2);
            let sword = SwordObject();
            rightLowerArm.a(sword);
            sword.P.setValues(0, -0.35, -0.06);
            sword.R.setFromAxisAngle(1, 0, 0, NegHalfPI).premultiplyAxisAngle(0, 0, 1, HalfPI);
        }
        let walkChangeRequest = 0;
        let walkChangeSpeed = 2;
        return {
            node,
            isEnemy,
            health: 100,
            maxHealth: 100,
            isWalking: false,
            bow,
            startWalking() {
                let req = ++walkChangeRequest;
                node.onUpdate.push(_ => {
                    walkMultiplier = min(walkMultiplier + Scene.deltaTime * walkChangeSpeed, 1);
                    return walkChangeRequest == req && walkMultiplier < 1;
                });
            },
            stopWalking() {
                let req = ++walkChangeRequest;
                node.onUpdate.push(_ => {
                    walkMultiplier = max(walkMultiplier - Scene.deltaTime * walkChangeSpeed, 0);
                    return walkChangeRequest == req && walkMultiplier > 0;
                });
            },
            playAttackAnimation() {
                let startTime = Scene.now;
                let animationDuration = 1.5;
                node.onUpdate.push(_ => {
                    let t = min((Scene.now - startTime) / animationDuration, 1);
                    let multiplier = sin(PI * (2 * t - 0.5)) / 2 + 0.5;
                    setRightUpperArmDefaultRotation().premultiplyAxisAngle(1, 0, 0, (1 - t - Pulse(t, 2, 6) / 2) * multiplier);
                    return t < 1;
                });
            }
        };
    };
    // game-2023/road.ts
    let tmp0 = NewVector2();
    let tmp1 = NewVector2();
    let tmpResult = NewVector2();
    let GetOffsetDirection = (prevPoint, currentPoint, nextPoint, offset, target) => {
        let dir0 = tmp0.copyFrom(currentPoint).s(prevPoint).r();
        let dir1 = tmp1.copyFrom(nextPoint).s(currentPoint).r();
        let bisector = dir0.a(dir1).r();
        return target.setValues(bisector.y, -bisector.x).mulScalar(offset);
    };
    let CreateRoadGeometry = (polyline, widthRadius) => {
        let prev = NewVector2();
        let current = NewVector2();
        let next = NewVector2();
        // let prevDir = tmp0.clone().setValues(polyline[2], polyline[3]).sub(tmp1.setValues(polyline[0], polyline[1]));
        // prevDir.setValues(prevDir.y, -prevDir.x);
        let vertices = [];
        let triangles = [];
        let normals = [];
        for (let i = 2; i < polyline.length - 2; i += 2) {
            prev.setValues(polyline[i - 2], polyline[i - 1]);
            current.setValues(polyline[i], polyline[i + 1]);
            next.setValues(polyline[i + 2], polyline[i + 3]);
            GetOffsetDirection(prev, current, next, widthRadius, tmpResult);
            vertices.push(current.x + tmpResult.x, 0, current.y + tmpResult.y, current.x - tmpResult.x, 0, current.y - tmpResult.y);
            if (i != polyline.length - 4) {
                triangles.push(i - 2, i - 1, i, i, i - 1, i + 1);
            }
        }
        for (let i = 0; i < vertices.length; i += 3) {
            normals.push(0, 1, 0);
        }
        return { v: new f32a(vertices), t: new u32a(triangles), n: new f32a(normals) };
    };
    // game-2023/main.ts
    let scene = new Scene();
    let camera = new Camera();
    let cameraControl = new CameraControl(camera);
    cameraControl.distanceFromTarget = 50;
    cameraControl.updateTransform();
    scene.a(cameraControl);
    AttachAudioListener(camera);
    let panButton = 1;
    let rotateButton = 2;
    let cameraPanning = false;
    let cameraRotating = false;
    let Resize = () => {
        let fov = 80;
        camera.setProjectionMatrixPerspecive(fov, (globalCanvas.width = window.innerWidth) / (globalCanvas.height = window.innerHeight), 0.4, 500);
    };
    requestAnimationFrame(Resize);
    window.addEventListener("resize", Resize);
    let buildingInfoContainer = getElementById("bi");
    let selectedBuildingData = null;
    globalCanvas.addEventListener("mousedown", ev => {
        if (ev.button == panButton) {
            cameraPanning = true;
        }
        if (ev.button == rotateButton) {
            cameraRotating = true;
        }
        if (ev.button == 0) {
            // click on a building
            let closestHitBuilding = GetHoveredBuilding(ev);
            buildingInfoContainer.style.display = closestHitBuilding ? "flex" : "none";
            selectedBuildingData?.uiElement.hide();
            selectedBuildingData = closestHitBuilding;
            selectedBuildingData?.uiElement.show();
            // if (selectedBuildingData)
            // {
            //     let time = Scene.now;
            //     let duration = 0.2;
            //     selectedBuildingData.node.onUpdate.push(n =>
            //     {
            //         let t = min((Scene.now - time) / duration, 1);
            //         n.transform.scale.setScalar(1 + (1 - cos(TwoPI * t)) * 0.02);
            //         return t < 1;
            //     });
            // }
        }
    });
    let GetHoveredBuilding = (ev) => {
        if (buildingInProgress) {
            return null;
        }
        let ray = camera.getWorldRayFromMouseEvent(ev);
        let closestHitDistance = null;
        let closestHitBuilding = null;
        for (let data of buildingDatas) {
            let hitDistance = IntersectRayBoundingBox(ray, data.bboxMin, data.bboxMax);
            if (hitDistance != null) {
                if (closestHitDistance == null || hitDistance < closestHitDistance) {
                    closestHitDistance = hitDistance;
                    closestHitBuilding = data;
                }
            }
        }
        return closestHitBuilding;
    };
    let UpdateHoveredBuilding = (ev) => {
        let hover = GetHoveredBuilding(ev);
        globalCanvas.style.cursor = hover ? "pointer" : "";
    };
    globalCanvas.addEventListener("mousemove", UpdateHoveredBuilding);
    window.addEventListener("mouseup", ev => {
        if (ev.button == panButton) {
            cameraPanning = false;
        }
        if (ev.button == rotateButton) {
            cameraRotating = false;
        }
    });
    window.addEventListener("mousemove", ev => {
        if (cameraPanning) {
            cameraControl.pan(ev.movementX, ev.movementY);
        }
        if (cameraRotating) {
            cameraControl.rotate(ev.movementX, ev.movementY);
        }
    });
    globalCanvas.addEventListener("wheel", ev => {
        ev.preventDefault();
        cameraControl.zoom(ev.deltaY);
        UpdateHoveredBuilding(ev);
    });
    window.addEventListener("contextmenu", ev => ev.preventDefault());
    window.addEventListener("keydown", ev => {
        if (ev.key == "Escape") {
            cancelBuilding();
        }
    });
    let running = false;
    let Render = (now) => {
        requestAnimationFrame(Render);
        if (!running) {
            return;
        }
        // ms -> seconds
        now /= 1000;
        scene.updateScene(now);
        scene.renderScene(camera);
    };
    requestAnimationFrame(Render);
    scene.clearColor.setValues(0.4, 0.45, 0.5);
    scene.light.P.setValues(-1, 3, 2);
    let roadTexture = BrickTexture(2048, 2048, 90, 90, 0.02, 0.5, 0.03, 0.4, 4, 0.2, true, 0.7, 1, [0.85, 0.85, 0.8], [0.5, 0.5, 0.5], 3);
    let roadMaterial = { ...whiteColor, textureScale: NewVector3(0.03) };
    let groundTexture = DirtTexture();
    let groundMaterial = { ...whiteColor, textureScale: NewVector3(0.2) };
    let groundMesh = new Mesh(CreateBoxGeometry(500, 1, 500), groundMaterial);
    groundMesh.setTextures(groundTexture);
    groundMesh.P.y = -0.5;
    groundMesh.renderOrder = 100;
    scene.a(groundMesh);
    //// create road
    let roadSamplePoints = splitmap("-400,20,-354.78,20,-300,20,-240,20,-184,20,-138.4,20,-115.6,20,-107,20,-99,20,-93.58,20,-87.42,20,-80.8,20,-73.51,19.77,-66,19.18,-58.64,18.6,-51.37,18.41,-44.4,19,-38,20.74,-32.31,24.14,-26.96,28.64,-21.78,33.35,-16.59,37.35,-11.23,39.77,-5.73,40.16,.15,39.38,6.11,37.67,11.79,35.28,16.8,32.41,20.68,29.39,23.62,26.27,26.26,22.66,28.36,18.79,29.72,14.89,30.12,11.16,29,7.5,25.75,3.94,21.25,.47,16.45,-3,12.33,-6.6,9.85,-10.37,9.02,-13.92,8.88,-17.69,9.17,-21.52,9.62,-25.22,9.95,-28.62");
    let roadColliderSampleRadius = 4;
    let roadGeometry = CreateRoadGeometry(roadSamplePoints, 3);
    let road = new Mesh(roadGeometry, roadMaterial);
    road.P.y = 0.02;
    road.setTextures(roadTexture);
    scene.a(road);
    let roadColliderPoints = [];
    for (let i = 0; i < roadSamplePoints.length; i += 2) {
        roadColliderPoints.push(NewVector2(roadSamplePoints[i], roadSamplePoints[i + 1]));
    }
    let tmpScreenPos = NewVector3();
    let tmpWorldForScreenPos = NewVector3();
    let UpdateElementScreenPositionFromWorldPosition = (target, yOffset, element, display = "") => {
        tmpWorldForScreenPos.copyFrom(target.P).y += yOffset;
        camera.getScreenPosition(tmpWorldForScreenPos, tmpScreenPos);
        element.style.display = tmpScreenPos.z > 1 ? "none" : display; // only show if not behind the camera
        element.style.left = round((tmpScreenPos.x + 1) / 2 * window.innerWidth) + "px";
        element.style.top = round((1 - tmpScreenPos.y) / 2 * window.innerHeight) + "px";
    };
    let CreateHealthBar = (target, yOffset) => {
        let healthBarContainer = createElement("div");
        healthBarContainer.className = "we hb";
        document.body.appendChild(healthBarContainer);
        let healthBar = createElement("div");
        healthBarContainer.appendChild(healthBar);
        target.onAfterRender.push(_ => UpdateElementScreenPositionFromWorldPosition(target, yOffset, healthBarContainer));
        return {
            healthBarContainer,
            healthBar,
            setHealthPercent(currentHealth, maxHealth) {
                healthBar.style.width = max(currentHealth / maxHealth * 100, 0) + "%";
            }
        };
    };
    let { House, Blacksmith, Windmill, Tower, Wall, Castle, Church } = InitializeBuildingData();
    let castleMaxHealth = 2000;
    let castleHealth = castleMaxHealth;
    let allHumans = new Set();
    let tmpCollisionCheckVec3 = NewVector3();
    let HumanBehavior = (human) => {
        let { isEnemy, node, node: { P, R, S }, startWalking, stopWalking } = human;
        if (isEnemy) {
            let maxHealth = 100 + 100 * currentLevel;
            human.maxHealth = maxHealth;
            human.health = maxHealth;
        }
        // health bar
        let { setHealthPercent, healthBar, healthBarContainer } = CreateHealthBar(node, 2);
        healthBar.style.background = isEnemy ? "#f00" : "#0f0";
        node.onAfterRender.push(_ => setHealthPercent(human.health, human.maxHealth));
        let secondsPerFood = 1;
        let foodTimerCancelFn = isEnemy ? () => { } : CreateFixedUpdateTimer(secondsPerFood, true, () => {
            if (!TryUpdateFood(-1)) {
                human.health -= 10;
            }
            ;
        });
        // audio
        let audioNode = AttachAudioSource(node);
        // waypoints
        let castleWaypointIndex = 42;
        let enemySpawnWaypointIndex = 3;
        let targetWaypointIndex = isEnemy ? enemySpawnWaypointIndex : castleWaypointIndex;
        let spawnPosition2d = roadColliderPoints[targetWaypointIndex];
        P.setValues(spawnPosition2d.x, 0, spawnPosition2d.y);
        R.setFromAxisAngle(0, 1, 0, isEnemy ? HalfPI : PI - 0.1);
        let offsetRadius = 2;
        let offset = Math.random() * offsetRadius * 2 - offsetRadius;
        let waypoint = NewVector3();
        let waypoint2D = NewVector2();
        let NextWaypoint = () => {
            if (isEnemy) {
                if (targetWaypointIndex >= castleWaypointIndex) {
                    return false;
                }
                ++targetWaypointIndex;
            }
            else {
                let finalWaypointIndex = currentLevel == 0 ? 15 : (currentLevel == 1 ? 13 : 9);
                if (targetWaypointIndex < finalWaypointIndex) {
                    return false;
                }
                --targetWaypointIndex;
            }
            // these are flipped for enemies, but it doesn't matter, since the offset is random
            let prevWaypoint2D = roadColliderPoints[targetWaypointIndex + 1];
            let currentWaypoint2D = roadColliderPoints[targetWaypointIndex];
            let nextWaypoint2D = roadColliderPoints[targetWaypointIndex - 1];
            GetOffsetDirection(prevWaypoint2D, currentWaypoint2D, nextWaypoint2D, offset, waypoint2D).a(currentWaypoint2D);
            waypoint.setValues(waypoint2D.x, 0, waypoint2D.y);
            return true;
        };
        NextWaypoint();
        NextWaypoint();
        // walking state, directions
        let state = 0 /* WalkingTowardsWaypoint */;
        startWalking();
        let targetEnemy = null;
        let rawWalkDir = isEnemy ? NewVector3(1, 0, 0) : NewVector3(0, 0, 1);
        let smoothedWalkDir = rawWalkDir.c();
        let walkSpeed = 2.5;
        let distanceThreshold = 1;
        let distanceThresholdSqr = distanceThreshold * distanceThreshold;
        let turnFactor = 0.05;
        let damagePerAttack = 10 * 4;
        let attackTimer = 1.5;
        let attackDelay = 0.8; // delay the actual damage dealing, to match the animation
        let remainingAttackTimer = 0;
        let currentAttackDelay = attackDelay;
        let dead = false;
        node.onFixedUpdate.push(_ => {
            if (dead) {
                // clean up
                stopWalking();
                cleanupFn(false);
                let animationStartTime = Scene.now;
                let animationDuration = 1;
                let rotationSnapshot = R.c();
                node.onUpdate.push(_ => {
                    // death animation
                    let t = (Scene.now - animationStartTime) / animationDuration;
                    if (t < 1) {
                        let t2 = t * t * t * t * t;
                        R.copyFrom(rotationSnapshot).multiply(NewQuaternionFromAxisAngle(1, 0, 0, HalfPI * t2));
                    }
                    else if (t < 4) {
                        P.y = -max(t - 3, 0) * 0.4;
                    }
                    else {
                        node.dispose();
                        return false;
                    }
                    return true;
                });
                return false;
            }
            if (nextLevelLoading) {
                stopWalking();
                return false;
            }
            if (!isEnemy || judgmentRemainingDuration <= 0) {
                let isWalkingTowardsEnemy = state == 1 /* WalkingTowardsEnemy */;
                let isWalking = state == 0 /* WalkingTowardsWaypoint */ || isWalkingTowardsEnemy;
                let targetPosition = targetEnemy?.node.P ?? waypoint;
                if (isWalking) {
                    if (P.distanceSqr(targetPosition) < distanceThresholdSqr) {
                        if (isWalkingTowardsEnemy) {
                            state = 2 /* AttackingEnemy */;
                            isWalking = false;
                            stopWalking();
                        }
                        else if (!NextWaypoint()) {
                            state = 3 /* Stopped */;
                            isWalking = false;
                            stopWalking();
                        }
                    }
                }
                smoothedWalkDir.r().lerp(rawWalkDir.r(), turnFactor).r();
                rawWalkDir.copyFrom(targetPosition).s(P).r();
                // always rotate towards the target, even when not walking
                R.setFromAxisAngle(0, 1, 0, atan2(-smoothedWalkDir.x, -smoothedWalkDir.z));
                if (isWalking) {
                    // update position
                    P.a(smoothedWalkDir.mulScalar(fixedDeltaTime * walkSpeed));
                }
                if (state == 0 /* WalkingTowardsWaypoint */ || state == 3 /* Stopped */) {
                    // look for enemies
                    let searchRadius = 5;
                    let searchRadiusSqr = searchRadius * searchRadius;
                    let closestEnemyDistance = searchRadiusSqr;
                    for (let { human: otherHuman } of allHumans) {
                        // skip friendly units
                        if (otherHuman.isEnemy != isEnemy) {
                            let dist = otherHuman.node.P.distanceSqr(P);
                            if (dist < closestEnemyDistance) {
                                closestEnemyDistance = dist;
                                targetEnemy = otherHuman;
                                state = 1 /* WalkingTowardsEnemy */;
                                startWalking();
                            }
                        }
                    }
                }
                else {
                    // already has a target
                    if (targetEnemy.health <= 0) {
                        targetEnemy = null;
                        state = 0 /* WalkingTowardsWaypoint */;
                        startWalking();
                    }
                }
                let tryAttack = () => {
                    if (remainingAttackTimer < 0) {
                        remainingAttackTimer += attackTimer;
                        currentAttackDelay = attackDelay;
                        human.playAttackAnimation();
                    }
                    currentAttackDelay -= fixedDeltaTime;
                    if (currentAttackDelay < 0) {
                        currentAttackDelay = attackDelay;
                        return true;
                    }
                    return false;
                };
                remainingAttackTimer -= fixedDeltaTime;
                if (state == 2 /* AttackingEnemy */) {
                    if (tryAttack()) {
                        let enemyDamageMultiplier = 1 + currentLevel;
                        let damageMultiplier = isEnemy
                            // reduce damage dealt by enemies, by armor upgrade percent
                            // also increase damage for every level
                            ? (0.95 ** totalArmorUpgrade) * enemyDamageMultiplier
                            // increase damage dealt by friendly units, by damage upgrade percent
                            : (1.05 ** totalDamageUpgrade);
                        targetEnemy.health -= damagePerAttack * damageMultiplier;
                        SwordImpactSound(audioNode);
                    }
                }
                else if (isEnemy && state == 3 /* Stopped */) {
                    // enemy has reached the last waypoint, attack the castle
                    if (castleHealth > 0 && tryAttack()) {
                        castleHealth -= damagePerAttack;
                        SwordImpactSound(audioNode);
                    }
                }
                else {
                    remainingAttackTimer = max(0, remainingAttackTimer);
                }
                human.isWalking = isWalking;
            }
            // make sure that the humans are not inside each other
            // push other humans out of the way
            let doubleCollisionRadius = 0.8;
            for (let { human: otherHuman } of allHumans) {
                let position = otherHuman.node.P;
                let dir = tmpCollisionCheckVec3.copyFrom(P).s(position);
                let collisionResolveDistance = doubleCollisionRadius - dir.len;
                if (collisionResolveDistance > 0) {
                    // note: the distance will be zero for self (and will do nothing because of safeNormalize),
                    // so no need to check if the current human is equal to the other human
                    dir.safeNormalize().mulScalar(collisionResolveDistance * (otherHuman.isWalking ? 1 : 0.3)); // move standing units with a lower force
                    position.s(dir);
                }
            }
            if (human.health <= 0) {
                // clean up next frame
                dead = true;
                if (isEnemy) {
                    UpdateGold(10);
                    if (--requiredNumberOfEnemiesToKill == 0) {
                        nextLevelLoading = true;
                        FadeOutMusic();
                        CreateFixedUpdateTimer(2, false, () => LoadLevel(currentLevel + 1, false));
                    }
                }
            }
            return true;
        });
        let cleanupFn = (immediately) => {
            foodTimerCancelFn();
            allHumans.delete(data);
            healthBarContainer.remove();
            if (immediately) {
                node.dispose();
            }
        };
        let data = {
            human,
            cleanupFn: () => cleanupFn(true)
        };
        allHumans.add(data);
        return () => cleanupFn(true);
    };
    let levelDatas = [{
            cityRadius: 60,
            wallOffset: 5,
            wallRotation: -0.1,
            enemySpawnTimes: splitmap("0,0,0,0,0,0,30,30,30,30,30,30,30,30,30,60,60,60,60,60,60,60,60,60,60,60,60,60,60,60"),
            startingGold: 50,
            startingFood: 30,
        }, {
            cityRadius: 75,
            wallOffset: 4,
            wallRotation: -0.1,
            enemySpawnTimes: splitmap("0,0,0,0,0,15,15,15,15,30,30,30,30,30,45,45,45,45,45,60,60,60,60,60,60,60,60,90,90,90,90,90,90,90,90"),
            startingGold: 100,
            startingFood: 50,
        }, {
            cityRadius: 100,
            wallOffset: 3,
            wallRotation: -0.05,
            enemySpawnTimes: splitmap("0,0,0,0,0,0,15,15,15,15,15,15,30,30,30,30,30,30,45,45,45,45,45,45,60,60,60,60,60,60,60,90,90,90,90,90,90,90,120,120,120,120,120,120,120,125,125,125,125,125,125,125,130,130,130,130,130,130,130"),
            startingGold: 150,
            startingFood: 100,
        }];
    let activeLevelObjects = new Set();
    let AddLevelObject = (obj) => {
        scene.a(obj);
        activeLevelObjects.add(obj);
    };
    let BoundingBoxOverlap = (min0, max0, min1, max1) => {
        return min1.x < max0.x && min1.y < max0.y && max1.x > min0.x && max1.y > min0.y;
    };
    let DefaultShowHideFnForHtmlElement = (elem, onDestroy) => {
        return {
            show: () => elem.style.display = "",
            hide: () => elem.style.display = "none",
            destroy: () => {
                elem.remove();
                onDestroy();
            },
            container: elem
        };
    };
    let CreateAbilityContainer = (buttonText, description, onClick, cooldown, cost, customReadyText, customCooldownText) => {
        let c = createElement("div");
        let b = createElement("button");
        let d = createElement("div");
        c.className = "ability-container";
        b.textContent = buttonText;
        d.textContent = description;
        c.appendChild(b);
        c.appendChild(d);
        let onCooldown = false;
        let updateButtonDisabledState = () => {
            b.disabled = onCooldown || totalGold < (cost ?? 0);
        };
        if (cooldown) {
            let cooldownTextElement = createElement("div");
            let setReadyText = () => cooldownTextElement.textContent = customReadyText ?? `Can be used every ${cooldown} seconds.`;
            setReadyText();
            c.appendChild(cooldownTextElement);
            b.onclick = _ => {
                onCooldown = true;
                updateButtonDisabledState();
                let currentCooldown = cooldown;
                scene.onFixedUpdate.push(_ => {
                    currentCooldown -= fixedDeltaTime;
                    if (currentCooldown < 0) {
                        setReadyText();
                        onCooldown = false;
                        updateButtonDisabledState();
                        return false;
                    }
                    let cooldownText = currentCooldown.toFixed(1);
                    cooldownTextElement.textContent = customCooldownText?.(cooldownText) ?? `Ready in ${cooldownText} seconds.`;
                    return true;
                });
                onClick();
            };
        }
        else {
            b.onclick = onClick;
        }
        if (cost) {
            onGoldChanged.push(updateButtonDisabledState);
        }
        return { c, d, b };
    };
    // abilities/upgrades
    let CreateUIContainerBase = (title, description) => {
        let container = createElement("div");
        container.style.display = "none";
        buildingInfoContainer.appendChild(container);
        let titleDiv = createElement("div");
        titleDiv.textContent = title;
        titleDiv.className = "title";
        container.appendChild(titleDiv);
        let descriptionDiv = createElement("div");
        descriptionDiv.textContent = description;
        container.appendChild(descriptionDiv);
        return container;
    };
    let CreateFixedUpdateTimer = (time, repeat, tick) => {
        let accumulatedTime = time;
        let cancelled = false;
        let cancel = () => cancelled = true;
        scene.onFixedUpdate.push(() => {
            if (cancelled) {
                return false;
            }
            accumulatedTime -= fixedDeltaTime;
            if (accumulatedTime < 0) {
                accumulatedTime += time;
                tick();
                return repeat;
            }
            return true;
        });
        return cancel;
    };
    let totalGold = 0;
    let totalFood = 0;
    let goldText = getElementById("gold-count");
    let foodText = getElementById("food-count");
    let onGoldChanged = [];
    let UpdateGold = (delta) => {
        goldText.textContent = (totalGold += delta).toString();
        onGoldChanged.forEach(callback => callback());
    };
    let secondsPerGold = 1;
    let goldPerSecond = 1;
    CreateFixedUpdateTimer(secondsPerGold, true, () => UpdateGold(goldPerSecond));
    let TryUpdateFood = (delta) => {
        if (totalFood + delta < 0) {
            return false;
        }
        foodText.textContent = (totalFood += delta).toString();
        if (totalFood == 0) {
            foodText.classList.add("danger");
        }
        else {
            foodText.classList.remove("danger");
        }
        return true;
    };
    let secondsPerFood = 1;
    let windmillTotalLevelCount = 0;
    CreateFixedUpdateTimer(secondsPerFood, true, () => TryUpdateFood(windmillTotalLevelCount));
    let CreateHouseUI = () => {
        let container = CreateUIContainerBase("House", "Houses increase the amount of gold you receive per second.");
        let upgradeLevel = 1;
        let UpdateValues = () => {
            upgrade.b.disabled = totalGold < 30;
            upgrade.d.textContent = `You receive ${upgradeLevel} additional gold per second. (${upgradeLevel}/3)`;
        };
        let upgrade = CreateAbilityContainer("Upgrade (30 gold)", "", () => {
            if (++upgradeLevel == 3) {
                upgrade.b.remove();
            }
            ++goldPerSecond;
            UpdateGold(-30);
        });
        container.appendChild(upgrade.c);
        ++goldPerSecond;
        UpdateValues();
        onGoldChanged.push(UpdateValues);
        return DefaultShowHideFnForHtmlElement(container, () => {
            goldPerSecond -= upgradeLevel;
            RemoveItemFromArray(onGoldChanged, UpdateValues);
        });
    };
    let CreateCastleUI = () => {
        let container = CreateUIContainerBase("Castle", "The main building of the city. You must protect the castle from enemies.");
        let recruit = CreateAbilityContainer("Recruit soldier (5 gold)", "You can recruit soldiers to fight enemies.", () => {
            let human = CreateHuman(false, false);
            scene.a(human.node);
            HumanBehavior(human);
            UpdateGold(-5);
        }, 3, 5, "You can recruit a soldier every 3 seconds.", c => `You can recruit a new soldier in ${c} seconds.`);
        container.appendChild(recruit.c);
        container.appendChild(CreateAbilityContainer("Repair castle", "Instantly repair 20% damage done to the castle.", () => {
            castleHealth = min(castleMaxHealth, castleHealth + castleMaxHealth * 0.2);
        }, 60).c);
        return DefaultShowHideFnForHtmlElement(container, () => { });
    };
    let judgmentRemainingDuration = 0;
    scene.onFixedUpdate.push(_ => {
        judgmentRemainingDuration = max(judgmentRemainingDuration - fixedDeltaTime, 0);
    });
    let CreateChurchUI = () => {
        let container = CreateUIContainerBase("Church", "Provides abilities that can turn the combat in your favor.");
        let blessingHealthRestorePercent = 0;
        let judgmentStunDuration = 0;
        let upgradeLevel = 1;
        let UpdateValues = () => {
            blessingHealthRestorePercent = upgradeLevel * 0.2;
            blessing.d.textContent = `Restores ${upgradeLevel * 20}% health to all friendly soldiers.`;
            judgmentStunDuration = upgradeLevel * 2;
            judgment.d.textContent = `Stuns all enemies, making them unable to move or attack for ${judgmentStunDuration} seconds.`;
            upgrade.b.disabled = totalGold < 20;
            upgrade.d.textContent = `Increase the power of the church's abilities. (${upgradeLevel}/3)`;
        };
        let blessing = CreateAbilityContainer("Blessing", "", () => {
            for (let { human } of allHumans) {
                if (!human.isEnemy) {
                    human.health = min(human.maxHealth, human.health + human.maxHealth * blessingHealthRestorePercent);
                }
            }
        }, 15);
        let judgment = CreateAbilityContainer("Judgment", "", () => {
            judgmentRemainingDuration += judgmentStunDuration;
        }, 30);
        let upgrade = CreateAbilityContainer("Upgrade (20 gold)", "", () => {
            if (++upgradeLevel == 3) {
                upgrade.b.remove();
            }
            UpdateGold(-20);
        });
        container.appendChild(blessing.c);
        container.appendChild(judgment.c);
        container.appendChild(upgrade.c);
        UpdateValues();
        onGoldChanged.push(UpdateValues);
        return DefaultShowHideFnForHtmlElement(container, () => {
            RemoveItemFromArray(onGoldChanged, UpdateValues);
        });
    };
    let totalArmorUpgrade = 0;
    let totalDamageUpgrade = 0;
    let CreateBlacksmithUI = () => {
        let container = CreateUIContainerBase("Blacksmith", "Improves the equipment of your soldiers.");
        let armorUpgradeLevel = 1;
        let damageUpgradeLevel = 1;
        let getUpgradeValue = (level) => 1 - (0.95 ** level);
        let UpdateValues = () => {
            let armorPercent = round(getUpgradeValue(armorUpgradeLevel) * 100);
            let damagePercent = round(getUpgradeValue(damageUpgradeLevel) * 100);
            armorUpgrade.b.disabled = totalGold < 20;
            armorUpgrade.d.textContent = `Reduces damage taken by friendly soldiers, by ${armorPercent}%. (${armorUpgradeLevel}/3)`;
            damageUpgrade.b.disabled = totalGold < 20;
            damageUpgrade.d.textContent = `Increases damage dealt by friendly soldiers, by ${damagePercent}%. (${damageUpgradeLevel}/3)`;
        };
        let armorUpgrade = CreateAbilityContainer("Armor reinforcement (20 gold)", "", () => {
            if (++armorUpgradeLevel == 3) {
                armorUpgrade.b.remove();
            }
            ++totalArmorUpgrade;
            UpdateGold(-20);
        });
        let damageUpgrade = CreateAbilityContainer("Sharpened swords (20 gold)", "", () => {
            if (++damageUpgradeLevel == 3) {
                damageUpgrade.b.remove();
            }
            ++totalDamageUpgrade;
            UpdateGold(-20);
        });
        container.appendChild(armorUpgrade.c);
        container.appendChild(damageUpgrade.c);
        UpdateValues();
        onGoldChanged.push(UpdateValues);
        return DefaultShowHideFnForHtmlElement(container, () => {
            RemoveItemFromArray(onGoldChanged, UpdateValues);
            totalDamageUpgrade -= damageUpgradeLevel - 1;
            totalArmorUpgrade -= armorUpgradeLevel - 1;
        });
    };
    let CreateWindmillUI = () => {
        let container = CreateUIContainerBase("Windmill", "Produces food. Soldiers need food to survive.");
        let upgradeLevel = 1;
        ++windmillTotalLevelCount;
        let UpdateValues = () => {
            upgrade.b.disabled = totalGold < 20;
            upgrade.d.textContent = `Produces ${upgradeLevel} food per second. (${upgradeLevel}/3)`;
        };
        let upgrade = CreateAbilityContainer("Upgrade food production (20 gold)", "", () => {
            if (++upgradeLevel == 3) {
                upgrade.b.remove();
            }
            ++windmillTotalLevelCount;
            UpdateGold(-20);
        });
        container.appendChild(upgrade.c);
        UpdateValues();
        onGoldChanged.push(UpdateValues);
        return DefaultShowHideFnForHtmlElement(container, () => {
            RemoveItemFromArray(onGoldChanged, UpdateValues);
            windmillTotalLevelCount -= upgradeLevel;
        });
    };
    let towerRangeIndicatorGeometry = CreateCylinderGeometry(0.5, 1, 1, 64);
    let arrowProjectileGeometry = CreateCylinderGeometry(0.8, 0.05, 0.05);
    let CreateTowerUI = (node) => {
        let container = CreateUIContainerBase("Archer tower", "Periodically attacks the closest enemy.");
        let rangeIndicator = new Mesh(towerRangeIndicatorGeometry, { r: 0, g: 0.2, b: 0.8, a: 0.3 });
        rangeIndicator.transparent = true;
        rangeIndicator.castShadows = false;
        rangeIndicator.receiveShadows = false;
        rangeIndicator.v = false;
        node.a(rangeIndicator);
        let rangeUpgradeLevel = 0;
        let damageUpgradeLevel = 0;
        let rangeRadius = 0;
        let damageMultiplier = 0;
        let baseDamage = 30;
        let UpdateValues = () => {
            rangeUpgrade.b.disabled = totalGold < 20;
            rangeRadius = 12 + rangeUpgradeLevel * 4;
            rangeUpgrade.d.textContent = `Attack enemies in a ${rangeRadius} meter radius. (${rangeUpgradeLevel + 1}/3)`;
            rangeIndicator.S.setValues(rangeRadius, 1, rangeRadius);
            damageUpgrade.b.disabled = totalGold < 10;
            damageMultiplier = (1.05 ** damageUpgradeLevel);
            let damageIncreasePercent = round((1 - (0.95 ** damageUpgradeLevel)) * 100);
            damageUpgrade.d.textContent = `Damage done increased by ${damageIncreasePercent}%. (${damageUpgradeLevel}/3)`;
        };
        let rangeUpgrade = CreateAbilityContainer("Increase range by 3 meters (20 gold)", "", () => {
            if (++rangeUpgradeLevel == 2) {
                rangeUpgrade.b.remove();
            }
            UpdateGold(-20);
        });
        let damageUpgrade = CreateAbilityContainer("Increase damage done by 5% (10 gold)", "", () => {
            if (++damageUpgradeLevel == 3) {
                damageUpgrade.b.remove();
            }
            UpdateGold(-10);
        });
        container.appendChild(rangeUpgrade.c);
        container.appendChild(damageUpgrade.c);
        UpdateValues();
        onGoldChanged.push(UpdateValues);
        let archer = CreateHuman(false, true);
        archer.node.P.y = 9;
        node.a(archer.node);
        let audioNode = AttachAudioSource(archer.node);
        let attackInterval = 2;
        let attackTimer = attackInterval;
        let tmpDir = NewVector3(0, 0, -1);
        let smoothedDir = NewVector3(0, 0, -1);
        let projectilePositionUpdater = () => true;
        let running = true;
        node.onFixedUpdate.push(_ => {
            if (castleHealth <= 0) {
                return false;
            }
            attackTimer -= fixedDeltaTime;
            let closestEnemy = null;
            let closestDistanceSqr = Infinity;
            for (let { human } of allHumans) {
                if (human.isEnemy) {
                    let distSqr = node.P.distanceSqr(human.node.P);
                    if (distSqr < closestDistanceSqr) {
                        closestDistanceSqr = distSqr;
                        closestEnemy = human;
                    }
                }
            }
            if (closestEnemy) {
                // always turn towards the closest enemy, even if out of range (but only attack if it's close enough)
                tmpDir.copyFrom(closestEnemy.node.P).s(node.P).r();
                smoothedDir.lerp(tmpDir, 0.05).r();
                archer.node.R.setFromAxisAngle(0, 1, 0, atan2(-smoothedDir.x, -smoothedDir.z));
                if (attackTimer <= 0 && closestDistanceSqr < rangeRadius * rangeRadius) {
                    closestEnemy.health -= baseDamage * damageMultiplier;
                    attackTimer = attackInterval;
                    BowShotSound(audioNode);
                    let srcPosition = archer.bow.worldPosition;
                    let targetPosition = closestEnemy.node.P.c();
                    targetPosition.y += 1.5;
                    let dir = targetPosition.c().s(srcPosition).r();
                    let projectile = new Mesh(arrowProjectileGeometry, { ...woodColor });
                    projectile.R.setFromUnitVectors(NewVector3(0, 1, 0), dir);
                    scene.a(projectile);
                    let duration = 0.1;
                    let elapsed = 0;
                    projectilePositionUpdater = () => {
                        elapsed += fixedDeltaTime;
                        let t = elapsed / duration;
                        projectile.P.lerpVectors(srcPosition, targetPosition, t);
                        if (elapsed > duration) {
                            projectile.dispose();
                            return false;
                        }
                        return true;
                    };
                }
            }
            if (!projectilePositionUpdater()) {
                projectilePositionUpdater = () => true;
            }
            return running;
        });
        return {
            show() {
                container.style.display = "";
                rangeIndicator.v = true;
            },
            hide() {
                container.style.display = "none";
                rangeIndicator.v = false;
            },
            destroy() {
                RemoveItemFromArray(onGoldChanged, UpdateValues);
                container.remove();
                running = false;
            },
            container
        };
    };
    let buildingTemplates = {
        [0 /* House */]: {
            s: NewVector3(10, 6, 7),
            c: 25,
            n: "house"
        },
        [1 /* Blacksmith */]: {
            s: NewVector3(10, 6, 7),
            c: 25,
            n: "blacksmith"
        },
        [2 /* Windmill */]: {
            s: NewVector3(31, 8, 14),
            c: 15,
            n: "windmill",
        },
        [3 /* Tower */]: {
            s: NewVector3(6, 9, 6),
            c: 40,
            n: "archer tower",
        },
        [5 /* Castle */]: {
            s: NewVector3(22, 23, 22),
            c: 0,
            n: "castle",
        },
        [4 /* Church */]: {
            s: NewVector3(10, 10, 22),
            c: 25,
            n: "church",
        }
    };
    let buildingDatas = [];
    let buildingPlaceholder = new Mesh(TranslateGeometry(CreateBoxGeometry(), 0, 0.5, 0), { r: 1, g: 0, b: 0, a: 0.3 });
    buildingPlaceholder.transparent = true;
    buildingPlaceholder.castShadows = false;
    buildingPlaceholder.receiveShadows = false;
    buildingPlaceholder.cull = null;
    let cancelBuilding = () => { };
    let startLevelPromiseResolver = () => { };
    let overlay = getElementById("overlay");
    let overlayTextDiv = getElementById("overlay-text");
    let startButton = getElementById("start-level");
    let currentLevelData = levelDatas[0];
    let currentLevel = 0;
    let requiredNumberOfEnemiesToKill = 0;
    let castleHealthBarContainer = null;
    let nextLevelLoading = false;
    let enemySpawnTimerCancellerFns = [];
    let LoadLevel = async (level, isRestart) => {
        overlay.classList.remove("hidden");
        running = false;
        if (isRestart) {
            overlayTextDiv.textContent = "The enemy destroyed your castle...";
            startButton.textContent = "Try again";
        }
        else if (level == 0) {
            overlayTextDiv.textContent = "The enemy is attacking the city, you need to defend it!\nAre you ready?";
            startButton.textContent = "Let's go!";
        }
        else if (level == 1) {
            overlayTextDiv.textContent = "You won the battle, but the war is still far from over.\nThe enemy will be back very soon. You must prepare.";
            startButton.textContent = "I'm ready!";
            musicDurationSetterFn(5.5);
            setTimeout(() => musicDurationSetterFn(5), 10000);
        }
        else if (level == 2) {
            overlayTextDiv.textContent = "This is the final attack. The enemy is stronger than ever.\nCan you defend the city one last time?";
            startButton.textContent = "Let's do it!";
            musicDurationSetterFn(4.5);
            setTimeout(() => musicDurationSetterFn(4), 10000);
        }
        else {
            overlayTextDiv.textContent = "Congratulations!\n\nYou have successfully defended the city from all attacks.\nThe war is finally over.";
            startButton.style.display = "none";
            globalVolumeNode.gain.linearRampToValueAtTime(globalVolume, actx.currentTime + 0.1);
            globalVolumeNode.gain.linearRampToValueAtTime(0, actx.currentTime + 20);
            setTimeout(musicStopFn, 25000);
            return;
        }
        await new Promise(resolve => startLevelPromiseResolver = resolve);
        startLevelPromiseResolver = () => { };
        let { cityRadius, wallRotation } = currentLevelData = levelDatas[currentLevel = level];
        nextLevelLoading = false;
        //// unload previous level
        cancelBuilding();
        buildingDatas.forEach(({ uiElement }) => {
            uiElement.destroy();
            uiElement.container.remove();
        });
        buildingDatas = [];
        buildingInfoContainer.style.display = "none";
        activeLevelObjects.forEach(node => node.dispose());
        activeLevelObjects.clear();
        castleHealthBarContainer?.remove();
        allHumans.forEach(data => data.cleanupFn());
        allHumans.clear();
        enemySpawnTimerCancellerFns.forEach(fn => fn());
        enemySpawnTimerCancellerFns = [];
        //// create walls
        let castleWallLength = 50;
        let cityCircumference = cityRadius * TwoPI;
        let cityCircumferenceReduction = 20;
        let steps = Math.ceil((cityCircumference - cityCircumferenceReduction) / castleWallLength);
        for (let i = 0; i < steps; ++i) {
            let t = i * castleWallLength / cityCircumference;
            let x = cos(t * TwoPI + wallRotation) * cityRadius;
            let y = sin(t * TwoPI + wallRotation) * cityRadius;
            let tower = Tower();
            tower.P.setValues(-x, 0, -y);
            AddLevelObject(tower);
            if (i != steps - 1) {
                let wall = Wall();
                AddLevelObject(wall);
                let wallPlacementRadius = cityRadius - currentLevelData.wallOffset;
                let t = (i + 0.5) * castleWallLength / cityCircumference;
                let x2 = cos(t * TwoPI + wallRotation) * wallPlacementRadius;
                let y2 = sin(t * TwoPI + wallRotation) * wallPlacementRadius;
                wall.P.setValues(-x2, 0, -y2);
                wall.R.setFromAxisAngle(0, 1, 0, -atan2(y2, x2) - HalfPI);
            }
        }
        //// castle
        let castle = Castle();
        let castleX = 10;
        let castleY = -30;
        castle.P.setValues(castleX, 0, castleY);
        castle.R.setFromAxisAngle(0, 1, 0, -0.1);
        AddLevelObject(castle);
        let { setHealthPercent, healthBar, healthBarContainer } = CreateHealthBar(castle, 25);
        healthBar.style.background = "#0f0";
        healthBarContainer.style.width = "25vh";
        castle.onAfterRender.push(_ => setHealthPercent(castleHealth, castleMaxHealth));
        castleHealthBarContainer = healthBarContainer;
        castleHealth = castleMaxHealth;
        // prevent building inside the castle
        let { s: bboxSize } = buildingTemplates[5 /* Castle */];
        let castleBuildingData = {
            node: castle,
            type: 5 /* Castle */,
            bboxMin: NewVector3(castleX - bboxSize.x / 2, 0, castleY - bboxSize.z / 2),
            bboxMax: NewVector3(castleX + bboxSize.x / 2, bboxSize.y, castleY + bboxSize.z / 2),
            uiElement: CreateCastleUI(),
        };
        buildingDatas.push(castleBuildingData);
        let isCastleDestroyed = false;
        let castleDestroyTime = 0;
        castle.onUpdate.push(_ => {
            let animationDuration = 3;
            if (isCastleDestroyed) {
                let t = min((Scene.now - castleDestroyTime) / animationDuration, 1);
                castle.P.y = -t * t * t * 25;
                return t < 1;
            }
            else if (castleHealth <= 0) {
                isCastleDestroyed = true;
                castleDestroyTime = Scene.now;
                healthBarContainer.remove();
                RemoveItemFromArray(buildingDatas, castleBuildingData);
                castleBuildingData.uiElement.destroy();
                buildingInfoContainer.style.display = "none";
                nextLevelLoading = true;
                FadeOutMusic();
                CreateFixedUpdateTimer(animationDuration, false, () => LoadLevel(currentLevel, true));
            }
            ;
            return true;
        });
        // timers for enemy spawning
        for (let time of currentLevelData.enemySpawnTimes) {
            enemySpawnTimerCancellerFns.push(CreateFixedUpdateTimer(time, false, () => {
                let enemy = CreateHuman(true, false);
                scene.a(enemy.node);
                HumanBehavior(enemy);
            }));
        }
        requiredNumberOfEnemiesToKill = currentLevelData.enemySpawnTimes.length;
        // resources
        totalGold = currentLevelData.startingGold;
        totalFood = currentLevelData.startingFood;
        // trigger change events
        UpdateGold(0);
        TryUpdateFood(0);
        // trees
        let rng = Mulberry32(0);
        for (let i = 0; i < 100; ++i) {
            let maxDistance = 250;
            let minDistance = cityRadius + 20;
            let radius = sqrt(rng()) * maxDistance;
            if (radius < minDistance) {
                continue;
            }
            let angle = rng() * TwoPI;
            let x = cos(angle) * radius;
            let y = sin(angle) * radius;
            if (x < 0 && abs(y - 20) < 10) {
                // no trees on the road
                continue;
            }
            let tree = TreeObject();
            tree.P.setValues(x, 0, y);
            AddLevelObject(tree);
        }
    };
    let buildingInProgress = false;
    let BuildBuilding = (buildingType) => {
        buildingInProgress = true;
        buildingInfoContainer.style.display = "none";
        let { s: bboxSize, c: cost } = buildingTemplates[buildingType];
        buildingPlaceholder.S.copyFrom(bboxSize);
        let buildingHalfSize2D = NewVector2(bboxSize.x, bboxSize.z).mulScalar(0.5);
        let groundPosition2D = NewVector2();
        let currentBBoxMin = NewVector2();
        let currentBBoxMax = NewVector2();
        let tmpDistanceFromOrigin = NewVector2();
        cancelBuilding();
        cancelBuilding = () => {
            buildingInProgress = false;
            scene.r(buildingPlaceholder);
            globalCanvas.removeEventListener("click", Click);
            globalCanvas.removeEventListener("mousemove", Move);
        };
        let canBuild = false;
        let Click = (ev) => {
            if (!canBuild) {
                return;
            }
            cancelBuilding();
            cancelBuilding = () => { };
            let ray = camera.getWorldRayFromMouseEvent(ev);
            let hitDistance = GroundPlaneLineIntersectionDistance(ray);
            let building = [House, Blacksmith, Windmill, Tower, Church][buildingType]();
            ray.getPoint(hitDistance, building.P);
            AddLevelObject(building);
            let buildStartTime = Scene.now;
            let bouncyAnimation = (elapsed, invert) => {
                let duration = 0.7;
                let originalT = min(elapsed / duration, 1);
                let t = invert ? 1 - originalT : originalT;
                let p = 8;
                let q = 1.3;
                let x = max(1e-3, (p * t) ** q);
                building.S.y = 1 - sin(x) / x * Smoothstep(1, 0, t);
                return originalT < 1;
            };
            building.onUpdate.push(_ => bouncyAnimation(Scene.now - buildStartTime, false));
            let uiElement = [CreateHouseUI, CreateBlacksmithUI, CreateWindmillUI, CreateTowerUI, CreateChurchUI][buildingType](building);
            let buildingData = {
                node: building,
                type: buildingType,
                bboxMin: NewVector3(currentBBoxMin.x, 0, currentBBoxMin.y),
                bboxMax: NewVector3(currentBBoxMax.x, bboxSize.y, currentBBoxMax.y),
                uiElement,
            };
            let destroy = CreateAbilityContainer("Destroy building", "Destroys this building, freeing up space for other buildings.", () => {
                RemoveItemFromArray(buildingDatas, buildingData);
                uiElement.destroy();
                uiElement.container.remove();
                buildingInfoContainer.style.display = "none";
                let destroyStartTime = Scene.now;
                building.onUpdate.push(_ => {
                    let running = bouncyAnimation(Scene.now - destroyStartTime, true);
                    if (!running) {
                        building.dispose();
                    }
                    return running;
                });
            });
            destroy.b.style.background = "#b33";
            uiElement.container.appendChild(destroy.c);
            buildingDatas.push(buildingData);
            UpdateGold(-cost);
            UpdateHoveredBuilding(ev);
        };
        let tmpVec2_min = NewVector2();
        let tmpVec2_max = NewVector2();
        let Move = (ev) => {
            let ray = camera.getWorldRayFromMouseEvent(ev);
            let hitDistance = GroundPlaneLineIntersectionDistance(ray);
            ray.getPoint(hitDistance, buildingPlaceholder.P);
            let cityPadding = 8; // minimum build distance from the edge
            // ensure that the placeholder is inside the city
            if (buildingPlaceholder.P.len > (currentLevelData.cityRadius - cityPadding)) {
                buildingPlaceholder.P.r().mulScalar(currentLevelData.cityRadius - cityPadding);
            }
            buildingPlaceholder.P.y -= 0.01; // to prevent z-fight
            scene.a(buildingPlaceholder); // only add to scene on mouse move, so that the position is correct
            let { x, z } = buildingPlaceholder.P;
            groundPosition2D.setValues(x, z);
            currentBBoxMin.copyFrom(groundPosition2D).s(buildingHalfSize2D);
            currentBBoxMax.copyFrom(groundPosition2D).a(buildingHalfSize2D);
            // check overlap with other buildings
            canBuild = true;
            for (let { bboxMin, bboxMax } of buildingDatas) {
                if (BoundingBoxOverlap(currentBBoxMin, currentBBoxMax, tmpVec2_min.setValues(bboxMin.x, bboxMin.z), tmpVec2_max.setValues(bboxMax.x, bboxMax.z))) {
                    canBuild = false;
                    break;
                }
            }
            // check overlap with road
            let roadSampleRadiusSqr = roadColliderSampleRadius * roadColliderSampleRadius;
            if (canBuild) {
                let tmpVec2 = NewVector2();
                for (let point of roadColliderPoints) {
                    let closestPoint = tmpVec2.copyFrom(point).clamp(currentBBoxMin, currentBBoxMax);
                    if (point.distanceSqr(closestPoint) < roadSampleRadiusSqr) {
                        canBuild = false;
                        break;
                    }
                }
            }
            // check if inside the city
            if (canBuild) {
                // check corners of the bounding box, if any are outside, then the building cannot be placed there
                for (let [x, y] of [
                    [currentBBoxMin.x, currentBBoxMin.y],
                    [currentBBoxMax.x, currentBBoxMin.y],
                    [currentBBoxMin.x, currentBBoxMax.y],
                    [currentBBoxMax.x, currentBBoxMax.y],
                ]) {
                    if (tmpDistanceFromOrigin.setValues(x, y).len > currentLevelData.cityRadius - cityPadding) {
                        canBuild = false;
                        break;
                    }
                }
            }
            buildingPlaceholder.material.r = canBuild ? 0 : 1;
            buildingPlaceholder.material.g = canBuild ? 1 : 0;
        };
        globalCanvas.addEventListener("click", Click);
        globalCanvas.addEventListener("mousemove", Move);
    };
    let buildingButtonsContainer = getElementById("bc");
    for (let buildingType of [0 /* House */, 1 /* Blacksmith */, 2 /* Windmill */, 3 /* Tower */, 4 /* Church */]) {
        let { c: cost, n: name } = buildingTemplates[buildingType];
        let button = createElement("button");
        button.textContent = `Build ${name} (${cost} gold)`;
        button.onclick = () => BuildBuilding(buildingType);
        buildingButtonsContainer.appendChild(button);
        onGoldChanged.push(() => {
            button.disabled = totalGold < cost;
        });
    }
    let musicStopFn = () => { };
    let musicDurationSetterFn = (_) => { };
    let musicStarted = false;
    startButton.onclick = () => {
        overlay.classList.add("hidden");
        running = true;
        startLevelPromiseResolver();
        if (!musicStarted) {
            globalFilterNode.frequency.value = 200;
            let { stop, setDuration } = StartMusic();
            musicStopFn = stop;
            musicDurationSetterFn = setDuration;
            musicStarted = true;
        }
        globalFilterNode.frequency.exponentialRampToValueAtTime(200, actx.currentTime + 0.1);
        globalFilterNode.frequency.exponentialRampToValueAtTime(6000, actx.currentTime + 3);
        globalFilterNode.frequency.exponentialRampToValueAtTime(20000, actx.currentTime + 4);
    };
    let FadeOutMusic = () => {
        globalFilterNode.frequency.linearRampToValueAtTime(20000, actx.currentTime + 0.1);
        globalFilterNode.frequency.linearRampToValueAtTime(200, actx.currentTime + 4);
    };
    getElementById("lo").style.display = "none";
    LoadLevel(0, false);
};
setTimeout(LoadEverything, 100);
//# sourceMappingURL=main.js.map