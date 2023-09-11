
// util/math.ts

const {
    PI,
    abs,
    sin,
    cos,
    tan,
    atan2,
    ceil,
    floor,
    round,
    sqrt,
    hypot,
    sign,
    min,
    max,
    pow,
    log2,
    random,
    imul
} = Math;

const HalfPI = PI / 2;
const NegHalfPI = -HalfPI;
const ThreeHalfPI = HalfPI * 3;
const TwoPI = PI * 2;

const RandRange = (min: number, max: number) => random() * (min - max) + min;

function Lerp(a: number, b: number, t: number)
{
    return a + (b - a) * t;
}

function Unlerp(a: number, b: number, x: number)
{
    return (x - a) / (b - a);
}

function Clamp(x: number, a: number, b: number)
{
    return x < a ? a : (x > b ? b : x);
}

function Fract(x: number)
{
    return x - floor(x);
}

function Smoothstep(edge0: number, edge1: number, x: number)
{
    const t = Clamp(Unlerp(edge0, edge1, x), 0, 1);
    return t * t * (3 - 2 * t);
}













// util/util.ts

function FloatPixelsRGBAToUint8RGBA(pixels: Float32Array)
{
    // short but slow version
    // return Uint8ClampedArray.from(pixels, p => p * 255);

    // faster version

    const resultPixels = new Uint8ClampedArray(pixels.length);
    for (let i = 0; i < pixels.length; ++i)
    {
        resultPixels[i] = pixels[i] * 255;
    }

    return resultPixels;
}

function Uint8PixelsRGBAToFloatRGBA(pixels: Uint8ClampedArray)
{
    // short but slow version
    // return Float32Array.from(pixels, p => p / 255);

    // faster version

    const resultPixels = new Float32Array(pixels.length);
    for (let i = 0; i < pixels.length; ++i)
    {
        resultPixels[i] = pixels[i] / 255;
    }

    return resultPixels;
}

function HexToColor(hex: string)
{
    const r = Number.parseInt(hex.substring(0, 2), 16) / 255;
    const g = Number.parseInt(hex.substring(2, 4), 16) / 255;
    const b = Number.parseInt(hex.substring(4, 6), 16) / 255;

    return { r, g, b, a: 1 };
}

function HexToColorArrayRGB(hex: string): [number, number, number]
{
    const r = Number.parseInt(hex.substring(0, 2), 16) / 255;
    const g = Number.parseInt(hex.substring(2, 4), 16) / 255;
    const b = Number.parseInt(hex.substring(4, 6), 16) / 255;

    return [r, g, b];
}

function Mulberry32(seed: number)
{
    return () =>
    {
        let t = seed += 0x6D2B79F5;
        t = imul(t ^ t >>> 15, t | 1);
        t ^= t + imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

type FixedLengthArray<T, L extends number, TObj = [T, ...Array<T>]> =
    Pick<TObj, Exclude<keyof TObj, 'splice' | 'push' | 'pop' | 'shift' | 'unshift'>> & {
        readonly length: L
        [I: number]: T
        [Symbol.iterator]: () => IterableIterator<T>
    };














// util/linear.ts

abstract class VectorBase<Length extends number, T extends VectorBase<Length, T>> extends Float32Array
{
    constructor(len: Length, elements?: FixedLengthArray<number, Length> | VectorBase<Length, T>)
    {
        super(len);
        this.set(elements ?? []);
    }

    public abstract get new(): T;
    public abstract get tmp(): T;
    public clone = () => this.new.set(this);

    public set(array: ArrayLike<number>, offset?: number | undefined)
    {
        super.set(array, offset);
        return this;
    }

    public copyFrom = (other: VectorBase<Length, T>) => this.set(other);

    public setValues = (...vals: FixedLengthArray<number, Length>) => this.set(vals);

    public setScalar(num: number)
    {
        return this.fill(num);
    }

    public add(other: VectorBase<Length, T>)
    {
        for (let i = 0; i < super.length; ++i)
        {
            this[i] += other[i];
        }

        return this;
    }

    public sub(other: VectorBase<Length, T>)
    {
        for (let i = 0; i < super.length; ++i)
        {
            this[i] -= other[i];
        }

        return this;
    }

    public mul(other: VectorBase<Length, T>)
    {
        for (let i = 0; i < super.length; ++i)
        {
            this[i] *= other[i];
        }

        return this;
    }

    public div(other: VectorBase<Length, T>)
    {
        for (let i = 0; i < super.length; ++i)
        {
            this[i] /= other[i];
        }

        return this;
    }

    public addScalar(other: number)
    {
        for (let i = 0; i < super.length; ++i)
        {
            this[i] += other;
        }

        return this;
    }

    public subScalar(other: number)
    {
        for (let i = 0; i < super.length; ++i)
        {
            this[i] -= other;
        }

        return this;
    }

    public mulScalar(other: number)
    {
        for (let i = 0; i < super.length; ++i)
        {
            this[i] *= other;
        }

        return this;
    }

    public divScalar(other: number)
    {
        for (let i = 0; i < super.length; ++i)
        {
            this[i] /= other;
        }

        return this;
    }

    public dot = (other: VectorBase<Length, T>): number =>
    {
        let d = 0;
        for (let i = 0; i < super.length; ++i)
        {
            d += this[i] * other[i];
        }

        return d;
    };

    public get lengthSqr()
    {
        return this.dot(this);
    }

    public get length()
    {
        return sqrt(this.lengthSqr);
    }

    public distanceSqr = (other: VectorBase<Length, T>) => this.tmp.copyFrom(this).sub(other).lengthSqr;

    public distance = (other: VectorBase<Length, T>) => this.tmp.copyFrom(this).sub(other).length;

    public normalize = () => this.divScalar(this.length);

    public safeNormalize()
    {
        const len = this.length;
        return len > 1e-9 ? this.divScalar(len) : this.setScalar(0);
    }

    public lerpVectors(a: VectorBase<Length, T>, b: VectorBase<Length, T>, t: number)
    {
        for (let i = 0; i < super.length; ++i)
        {
            this[i] = Lerp(a[i], b[i], t);
        }

        return this;
    }

    public lerp = (other: VectorBase<Length, T>, t: number) => this.lerpVectors(this, other, t);

    public clamp(min: VectorBase<Length, T>, max: VectorBase<Length, T>)
    {
        for (let i = 0; i < super.length; ++i)
        {
            this[i] = Clamp(this[i], min[i], max[i]);
        }

        return this;
    }
}

abstract class Vector4Base<T extends VectorBase<4, T>> extends VectorBase<4, T>
{
    constructor(x = 0, y = 0, z = 0, w = 0)
    {
        super(4, [x, y, z, w]);
    }

    get x()
    {
        return this[0];
    }

    set x(v)
    {
        this[0] = v;
    }

    get y()
    {
        return this[1];
    }

    set y(v)
    {
        this[1] = v;
    }

    get z()
    {
        return this[2];
    }

    set z(v)
    {
        this[2] = v;
    }

    get w()
    {
        return this[3];
    }

    set w(v)
    {
        this[3] = v;
    }
}

class Vector4 extends Vector4Base<Vector4>
{
    public get new()
    {
        return NewVector4();
    }

    public get tmp()
    {
        return tmpVec4;
    }
}

class Vector3 extends VectorBase<3, Vector3>
{
    constructor(x = 0, y?: number, z?: number)
    {
        super(3, [x, y ?? x, z ?? x]);
    }

    public get new()
    {
        return NewVector3();
    }

    public get tmp()
    {
        return tmpVec3_linear_ts;
    }

    get x()
    {
        return this[0];
    }

    set x(v)
    {
        this[0] = v;
    }

    get y()
    {
        return this[1];
    }

    set y(v)
    {
        this[1] = v;
    }

    get z()
    {
        return this[2];
    }

    set z(v)
    {
        this[2] = v;
    }

    public crossVectors = (a: Vector3, b: Vector3) => this.setValues(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);

    public cross = (other: Vector3) => this.crossVectors(this, other);

    public setFromMatrixPosition = (mat: Matrix4x4) => this.set(mat.subarray(12, 15));

    public setFromMatrixColumn = (mat: Matrix4x4, col: number) => this.set(mat.subarray(col * 4, (col + 1) * 4));

    public applyQuaternion(q: Quaternion)
    {
        const { x: px, y: py, z: pz } = this;
        const { x, y, z, w } = q;

        const ix = w * px + y * pz - z * py;
        const iy = w * py + z * px - x * pz;
        const iz = w * pz + x * py - y * px;
        const iw = x * px + y * py + z * pz;

        this.x = ix * w + iw * x - iy * z + iz * y;
        this.y = iy * w + iw * y - iz * x + ix * z;
        this.z = iz * w + iw * z - ix * y + iy * x;
        return this;
    }

    applyMatrix3x3(mat: Matrix3x3)
    {
        const { x, y, z } = this;
        const [m11, m21, m31, m12, m22, m32, m13, m23, m33] = mat;

        this.x = m11 * x + m12 * y + m13 * z;
        this.y = m21 * x + m22 * y + m23 * z;
        this.z = m31 * x + m32 * y + m33 * z;

        return this;
    }

    public applyMatrix4x4(mat: Matrix4x4)
    {
        const { x, y, z } = this;
        const [m11, m21, m31, m41, m12, m22, m32, m42, m13, m23, m33, m43, m14, m24, m34, m44] = mat;

        const iw = m41 * x + m42 * y + m43 * z + m44;
        this.x = (m11 * x + m12 * y + m13 * z + m14) / iw;
        this.y = (m21 * x + m22 * y + m23 * z + m24) / iw;
        this.z = (m31 * x + m32 * y + m33 * z + m34) / iw;

        return this;
    }
}

class Vector2 extends VectorBase<2, Vector2>
{
    constructor(x = 0, y = 0)
    {
        super(2, [x, y]);
    }

    public get new()
    {
        return NewVector2();
    }

    public get tmp()
    {
        return tmpVec2;
    }

    get x()
    {
        return this[0];
    }

    set x(v)
    {
        this[0] = v;
    }

    get y()
    {
        return this[1];
    }

    set y(v)
    {
        this[1] = v;
    }
}

// https://github.com/mrdoob/three.js/blob/dev/src/math/Quaternion.js
class Quaternion extends Vector4Base<Quaternion>
{
    constructor(x = 0, y = 0, z = 0, w = 1)
    {
        super(x, y, z, w);
    }

    public get new()
    {
        return NewQuaternion();
    }

    public get tmp()
    {
        return tmpQuaternion;
    }

    public setFromAxisAngle(x: number, y: number, z: number, angle: number)
    {
        const half = angle / 2;
        const s = sin(half);

        return this.setValues(x * s, y * s, z * s, cos(half));
    }

    public invert()
    {
        this.w = -this.w;
        return this;
    }

    public setFromEulerXYZ(x: number, y: number, z: number)
    {
        const c1 = cos(x / 2);
        const c2 = cos(y / 2);
        const c3 = cos(z / 2);

        const s1 = sin(x / 2);
        const s2 = sin(y / 2);
        const s3 = sin(z / 2);

        return this.setValues(
            s1 * c2 * c3 + c1 * s2 * s3,
            c1 * s2 * c3 - s1 * c2 * s3,
            c1 * c2 * s3 + s1 * s2 * c3,
            c1 * c2 * c3 - s1 * s2 * s3
        );
    }

    public multiplyQuaternions(a: Quaternion, b: Quaternion)
    {
        const { x, y, z, w } = a;
        const { x: bx, y: by, z: bz, w: bw } = b;

        return this.setValues(
            x * bw + w * bx + y * bz - z * by,
            y * bw + w * by + z * bx - x * bz,
            z * bw + w * bz + x * by - y * bx,
            w * bw - x * bx - y * by - z * bz,
        );
    }

    public multiply = (other: Quaternion) => this.multiplyQuaternions(this, other);

    public premultiply = (other: Quaternion) => this.multiplyQuaternions(other, this);

    public premultiplyAxisAngle = (x: number, y: number, z: number, angle: number) =>
        this.premultiply(this.tmp.setFromAxisAngle(x, y, z, angle));

    public setFromRotationMatrix(mat: Matrix4x4)
    {
        const [m11, m21, m31, m12, m22, m32, m13, m23, m33] = mat;
        const trace = m11 + m22 + m33;

        if (trace > 0)
        {
            const s = 0.5 / sqrt(trace + 1.0);
            return this.setValues((m32 - m23) * s, (m13 - m31) * s, (m21 - m12) * s, 0.25 / s);
        }
        else if (m11 > m22 && m11 > m33)
        {
            const s = 2.0 * sqrt(1.0 + m11 - m22 - m33);
            return this.setValues(0.25 * s, (m12 + m21) / s, (m13 + m31) / s, (m32 - m23) / s);
        }
        else if (m22 > m33)
        {
            const s = 2.0 * sqrt(1.0 + m22 - m11 - m33);
            return this.setValues((m12 + m21) / s, 0.25 * s, (m23 + m32) / s, (m13 - m31) / s);
        }
        else
        {
            const s = 2.0 * sqrt(1.0 + m33 - m11 - m22);
            return this.setValues((m13 + m31) / s, (m23 + m32) / s, 0.25 * s, (m21 - m12) / s);
        }
    }

    public setFromUnitVectors(from: Vector3, to: Vector3)
    {
        const r = from.dot(to) + 1;
        const { x, y, z } = from;

        if (r < Number.EPSILON)
        {
            if (abs(x) > abs(z))
            {
                this.setValues(-y, x, 0, 0);
            }
            else
            {
                this.setValues(0, -z, y, 0);
            }
        }
        else
        {
            this.setValues(
                y * to.z - z * to.y,
                z * to.x - x * to.z,
                x * to.y - y * to.x,
                r
            );
        }

        return this.normalize();
    }
}

// https://github.com/mrdoob/three.js/blob/dev/src/math/Matrix3.js
class Matrix3x3 extends Float32Array
{
    constructor(elements?: FixedLengthArray<number, 9> | Matrix3x3)
    {
        super(9);
        this.set(elements ?? [
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
        ]);
    }

    public clone = () => NewMatrix3x3().set(this);

    public set(array: FixedLengthArray<number, 9> | Matrix3x3, offset?: number | undefined)
    {
        super.set(array, offset);
        return this;
    }

    public copy(other: Matrix3x3)
    {
        return this.set(other);
    }

    public multiply(other: Matrix3x3)
    {
        return this.multiplyMatrices(this, other);
    }

    public multiplyMatrices(a: Matrix3x3, b: Matrix3x3)
    {
        const [a11, a21, a31, a12, a22, a32, a13, a23, a33] = a;
        const [b11, b21, b31, b12, b22, b32, b13, b23, b33] = b;

        return this.set([
            a11 * b11 + a12 * b21 + a13 * b31,
            a21 * b11 + a22 * b21 + a23 * b31,
            a31 * b11 + a32 * b21 + a33 * b31,
            a11 * b12 + a12 * b22 + a13 * b32,
            a21 * b12 + a22 * b22 + a23 * b32,
            a31 * b12 + a32 * b22 + a33 * b32,
            a11 * b13 + a12 * b23 + a13 * b33,
            a21 * b13 + a22 * b23 + a23 * b33,
            a31 * b13 + a32 * b23 + a33 * b33,
        ]);
    }

    public invert()
    {
        const [n11, n21, n31, n12, n22, n32, n13, n23, n33] = this;
        const
            t11 = n33 * n22 - n32 * n23,
            t12 = n32 * n13 - n33 * n12,
            t13 = n23 * n12 - n22 * n13;

        const det = n11 * t11 + n21 * t12 + n31 * t13;

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

    public transpose()
    {
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
class Matrix4x4 extends Float32Array
{
    constructor(elements?: FixedLengthArray<number, 16> | Matrix4x4)
    {
        super(16);
        this.set(elements ?? [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }

    public clone = () => NewMatrix4x4().set(this);

    public set(array: FixedLengthArray<number, 16> | Matrix4x4, offset?: number | undefined)
    {
        super.set(array, offset);
        return this;
    }

    public copy(other: Matrix4x4)
    {
        return this.set(other);
    }

    public multiply(other: Matrix4x4)
    {
        return this.multiplyMatrices(this, other);
    }

    public preMultiply(other: Matrix4x4)
    {
        return this.multiplyMatrices(other, this);
    }

    public multiplyMatrices(a: Matrix4x4, b: Matrix4x4)
    {
        const [a11, a21, a31, a41, a12, a22, a32, a42, a13, a23, a33, a43, a14, a24, a34, a44] = a;
        const [b11, b21, b31, b41, b12, b22, b32, b42, b13, b23, b33, b43, b14, b24, b34, b44] = b;

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

    public invert()
    {
        const [m11, m21, m31, m41, m12, m22, m32, m42, m13, m23, m33, m43, m14, m24, m34, m44] = this;
        const
            t1 = m23 * m34 * m42 - m24 * m33 * m42 + m24 * m32 * m43 - m22 * m34 * m43 - m23 * m32 * m44 + m22 * m33 * m44,
            t2 = m14 * m33 * m42 - m13 * m34 * m42 - m14 * m32 * m43 + m12 * m34 * m43 + m13 * m32 * m44 - m12 * m33 * m44,
            t3 = m13 * m24 * m42 - m14 * m23 * m42 + m14 * m22 * m43 - m12 * m24 * m43 - m13 * m22 * m44 + m12 * m23 * m44,
            t4 = m14 * m23 * m32 - m13 * m24 * m32 - m14 * m22 * m33 + m12 * m24 * m33 + m13 * m22 * m34 - m12 * m23 * m34;

        const det = m11 * t1 + m21 * t2 + m31 * t3 + m41 * t4;

        return this.set([
            t1 / det,
            (m24 * m33 * m41 - m23 * m34 * m41 - m24 * m31 * m43 + m21 * m34 * m43 + m23 * m31 * m44 - m21 * m33 * m44) / det,
            (m22 * m34 * m41 - m24 * m32 * m41 + m24 * m31 * m42 - m21 * m34 * m42 - m22 * m31 * m44 + m21 * m32 * m44) / det,
            (m23 * m32 * m41 - m22 * m33 * m41 - m23 * m31 * m42 + m21 * m33 * m42 + m22 * m31 * m43 - m21 * m32 * m43) / det,
            t2 / det,
            (m13 * m34 * m41 - m14 * m33 * m41 + m14 * m31 * m43 - m11 * m34 * m43 - m13 * m31 * m44 + m11 * m33 * m44) / det,
            (m14 * m32 * m41 - m12 * m34 * m41 - m14 * m31 * m42 + m11 * m34 * m42 + m12 * m31 * m44 - m11 * m32 * m44) / det,
            (m12 * m33 * m41 - m13 * m32 * m41 + m13 * m31 * m42 - m11 * m33 * m42 - m12 * m31 * m43 + m11 * m32 * m43) / det,
            t3 / det,
            (m14 * m23 * m41 - m13 * m24 * m41 - m14 * m21 * m43 + m11 * m24 * m43 + m13 * m21 * m44 - m11 * m23 * m44) / det,
            (m12 * m24 * m41 - m14 * m22 * m41 + m14 * m21 * m42 - m11 * m24 * m42 - m12 * m21 * m44 + m11 * m22 * m44) / det,
            (m13 * m22 * m41 - m12 * m23 * m41 - m13 * m21 * m42 + m11 * m23 * m42 + m12 * m21 * m43 - m11 * m22 * m43) / det,
            t4 / det,
            (m13 * m24 * m31 - m14 * m23 * m31 + m14 * m21 * m33 - m11 * m24 * m33 - m13 * m21 * m34 + m11 * m23 * m34) / det,
            (m14 * m22 * m31 - m12 * m24 * m31 - m14 * m21 * m32 + m11 * m24 * m32 + m12 * m21 * m34 - m11 * m22 * m34) / det,
            (m12 * m23 * m31 - m13 * m22 * m31 + m13 * m21 * m32 - m11 * m23 * m32 - m12 * m21 * m33 + m11 * m22 * m33) / det,
        ]);
    }

    public compose(position: Vector3, rotation: Quaternion, scale: Vector3)
    {
        const { x, y, z, w } = rotation;
        const { x: sx, y: sy, z: sz } = scale;

        const x2 = x + x;
        const y2 = y + y;
        const z2 = z + z;
        const xx = x * x2;
        const xy = x * y2;
        const xz = x * z2;
        const yy = y * y2;
        const yz = y * z2;
        const zz = z * z2;
        const wx = w * x2;
        const wy = w * y2;
        const wz = w * z2;

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

    public makePerspective(left: number, right: number, top: number, bottom: number, near: number, far: number)
    {
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

    public makeOrthographic(left: number, right: number, top: number, bottom: number, near: number, far: number)
    {
        const w = 1 / (right - left);
        const h = 1 / (top - bottom);
        const p = 1 / (far - near);

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

    public lookAt(eye: Vector3, center: Vector3, up: Vector3)
    {
        const f = center.clone().sub(eye).normalize();
        const s = f.clone().cross(up).normalize();
        const u = s.clone().cross(f);

        return this.set([
            s.x, u.x, -f.x, 0,
            s.y, u.y, -f.y, 0,
            s.z, u.z, -f.z, 0,
            -eye.dot(s), -eye.dot(u), eye.dot(f), 1
        ]);
    }

    public topLeft3x3 = (target?: Matrix3x3) => (target ?? NewMatrix3x3()).set([
        this[0], this[1], this[2],
        this[4], this[5], this[6],
        this[8], this[9], this[10]
    ]);
}

const NewVector2 = (x?: number, y?: number) => new Vector2(x, y);
const NewVector3 = (x?: number, y?: number, z?: number) => new Vector3(x, y, z);
const NewVector4 = (x?: number, y?: number, z?: number, w?: number) => new Vector4(x, y, z, w);
const NewQuaternion = (x?: number, y?: number, z?: number, w?: number) => new Quaternion(x, y, z, w);
const NewMatrix3x3 = () => new Matrix3x3();
const NewMatrix4x4 = () => new Matrix4x4();

const NewQuaternionFromAxisAngle = (x: number, y: number, z: number, angle: number) => NewQuaternion().setFromAxisAngle(x, y, z, angle);
const NewMatrix4x4Compose = (position: Vector3, rotation: Quaternion, scale: Vector3) => NewMatrix4x4().compose(position, rotation, scale);

const tmpVec2 = NewVector2();
const tmpVec3_linear_ts = NewVector3();
const tmpVec4 = NewVector4();
const tmpQuaternion = NewQuaternion();
















// util/math-geometry.ts

class Ray
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

function GroundPlaneLineIntersectionDistance({ origin, direction }: Ray)
{
    // ground plane is on the y axis, 0 coordinate
    return -origin.y / direction.y;
}

function IntersectRayBoundingBox({ origin, direction }: Ray, bboxMin: Vector3, bboxMax: Vector3): number | null
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













// util/spline.ts

const tmpVec2_0 = NewVector2();
const tmpVec2_1 = NewVector2();
const tmpVec2_2 = NewVector2();
const tmpVec2_3 = NewVector2();
const tmpVec2_4 = NewVector2();
const tmpVec2_5 = NewVector2();

class CatmullRomSpline
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












// audio/audio.ts


type NumberArray = number[] | Float32Array;

const globalVolume = 0.2;

let hadFirstInteraction = false;
async function EnsureContextCreated()
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

const linearFadeOutCurve = GenerateCurve(2, t => 1 - t);
const sqrtFadeOutCurve = GenerateCurve(16, t => sqrt(1 - t));
const x2FadeOutCurve = GenerateCurve(16, t => (1 - t) ** 2);
const x4FadeOutCurve = GenerateCurve(16, t => (1 - t) ** 4);
const x8FadeOutCurve = GenerateCurve(16, t => (1 - t) ** 8);
const x16FadeOutCurve = GenerateCurve(16, t => (1 - t) ** 16);
const smoothStepFadeOutCurve = GenerateCurve(16, t => Smoothstep(0, 1, 1 - t));


// await EnsureContextCreated();

const actx = new AudioContext();

const globalVolumeNode = actx.createGain();
globalVolumeNode.gain.value = globalVolume;

const globalFilterNode = actx.createBiquadFilter();
globalFilterNode.type = "lowpass";
globalFilterNode.frequency.value = 20000;

globalFilterNode.connect(globalVolumeNode).connect(actx.destination);

const globalTargetNode: AudioNode = globalFilterNode;

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

function CreateNoiseNode(bufferIdx = 0)
{
    const node = actx.createBufferSource();
    node.buffer = noiseBuffers[bufferIdx];
    node.loop = true;
    return node;
}













// audio/instruments/string.ts


function CreateInstrumentFromWave(numWaves: number, attack: boolean, real: NumberArray, imag: NumberArray)
{
    const wave = actx.createPeriodicWave(real, imag);

    return (octave: number, note: number, volume: number, when: number, duration: number, fadeOutDuration = 0.2, Q = 0, targetNode?: AudioNode) =>
    {
        const target = targetNode ?? globalTargetNode;

        const frequency = (2 ** (log2(440) + octave - 4 + (note - 9) / 12)) / numWaves;
        const fadeInDuration = 0.001;

        const oscillator = actx.createOscillator();
        const gain = actx.createGain();
        const filter = actx.createBiquadFilter();

        oscillator.frequency.value = frequency;

        gain.gain.value = 0;
        let time = when;
        gain.gain.linearRampToValueAtTime(0, time);
        time += fadeInDuration;
        gain.gain.linearRampToValueAtTime(attack ? volume * 1.4 : volume, time);
        time += 0.05;
        gain.gain.linearRampToValueAtTime(volume, time);
        time += duration;
        gain.gain.linearRampToValueAtTime(volume, time);
        time += fadeOutDuration;
        gain.gain.linearRampToValueAtTime(0, time);

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


        if (attack)
        {
            const noise = CreateNoiseNode();
            const gain2 = actx.createGain();
            const filter2 = actx.createBiquadFilter();

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
}

const Guitar1 = CreateInstrumentFromWave(1, true,
    [0.03, 0.4, -1, 0.04, 0.4, 0.4, -0.15, -0.01, 0.04, -0.03, 0.02, -0.01, -0.01, -0.02, 0.01, 0.01, 0, 0, -0.01, 0, 0.01, -0.01, 0.01, 0, 0, 0, 0.01, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -0.01],
    [0, -0.24, -1.7, -0.43, -0.5, 0.2, 0.05, -0.08, 0.15, -0.04, -0.01, 0, 0.01, -0.02, -0.01, 0, -0.01, 0.01, 0, -0.01, 0.01, 0, 0, 0, 0, 0, -0.01, 0.01, -0.01, 0, 0, 0, 0, 0, 0, 0, -0.01, 0.01, 0]
);

const Guitar2 = CreateInstrumentFromWave(1, true,
    [-0.02, -0.2, -0.4, -0.1, 1, -0.04, -0.07, 0, 0.1, -0.3, -0.1, 0.2, 0.15, 0.15, -0.02, -0.02, 0.02, -0.1, 0.1, -0.1, -0.06, 0.01, 0, 0.01, 0.01, 0.01, 0, 0, 0, 0, 0.01, 0.01, 0, -0.01, 0, 0.01, 0.01, 0.01, 0.01, 0.01, 0.03, -0.03, -0.02, -0.04, 0, -0.03, 0, -0.01, 0, -0.03, 0, -0.03, -0.03, -0.01, 0.01, 0, -0.01, -0.02, -0.02, 0.04, -0.01, 0.04, 0.01, 0, 0.01, 0, 0, 0, 0, 0, -0.01, 0, 0.01, 0, 0, 0, 0, -0.01],
    [0, -4, 0.5, -0.5, 0.07, 0, -0.17, -0.05, 0.06, 0.21, -0.46, -0.3, -0.14, 0.05, 0.07, 0.01, -0.08, -0.13, 0.04, -0.01, 0.02, 0, -0.01, -0.01, -0.03, 0.02, -0.02, 0, -0.01, -0.01, -0.01, -0.01, 0.02, 0.01, -0.04, 0.03, -0.02, 0, -0.03, 0.02, -0.02, 0, -0.02, 0.04, -0.03, 0, -0.01, 0, -0.02, 0.04, -0.01, -0.04, -0.02, 0.01, 0.01, 0.01, -0.01, 0.05, 0.01, -0.01, -0.01, 0.01, 0.01, -0.01, -0.01, -0.01, -0.01, 0, 0, -0.01, 0, 0, 0.01, 0, 0, 0, 0, 0.01]
);

const Guitar3 = CreateInstrumentFromWave(1, true,
    [0.06, 0.7, -1, 0.42, -0.06, 0.02, -0.01, -0.03, -0.04, -0.04, -0.04, -0.06, -0.03, -0.14, -0.04, 0.15, 0.06, 0.03, 0.01, 0.16, -0.08, -0.07, 0, 0, -0.01, 0.01, -0.01, -0.01, -0.05, 0.02, 0.07, -0.07, 0.14, -0.05, -0.03, -0.11, 0.13],
    [0, -2.72, -1.52, -1.4, -0.03, -0.04, 0.06, 0.07, 0.08, 0.07, 0.08, 0.1, 0.03, 0.09, 0.01, -0.06, 0.01, 0.01, -0.08, 0.12, -0.03, -0.03, 0.01, 0.01, 0.01, 0.02, 0.01, 0.04, 0.02, 0, 0.06, -0.2, -0.03, -0.1, -0.03, 0.03, 0.01]
);

const Guitar4 = CreateInstrumentFromWave(4, true,
    [0, 0, 0, 0.1, -0.4, 0, 1, 0, -0.9, 0.1, 0.4, -0.1, 0, 0.2, -0.1, 0.1, 0, 0, 0.1, 0.1, 0, 0, 0, 0, 0, 0.1, 0.2, -0.2, -0.3, 0.1, 0.1, -0.2, 0, 0, 0.1, 0, -0.1, -0.4, 0.2, 0.4, 0.1, 0.3, 0.3, 0, 0, -0.2, 0.1, -0.1, -0.1, -0.3, 0.1, -0.1, 0, 0, 0.1, 0.1, 0, 0.1, 0.1, -0.2, 0, -0.1, -0.1, 0, 0, -0.1, -0.2, 0, 0.1, 0, -0.1, 0.1, -0.1, 0, 0, -0.1, -0.1, 0, -0.1, -0.1],
    [0, 0, 0, -0.1, 0.2, 0, -0.3, 0.1, -0.5, -0.8, 0, 0, -0.4, 0, -0.3, -0.1, 0, 0, 0, 0, 0.1, 0.1, 0, -0.1, 0, 0.1, -0.4, 0.1, -0.1, -0.2, 0, 0, -0.1, 0, 0.1, -0.2, 0, -0.2, 0, -0.2, 0, 0.4, 0, -0.4, 0.3, 0.1, 0, -0.1, 0.2, -0.1, 0.2, -0.1, -0.2, -0.2, 0.2, 0, -0.2, 0.1, -0.2, -0.2, 0, 0, 0, 0, 0.1, -0.1, -0.1, 0, 0.1, 0, 0, 0.1, 0, 0, 0, 0, 0, 0, 0, 0]
);

const Guitar5 = CreateInstrumentFromWave(1, true,
    [-0.05, 0.63, 1, 0.19, -0.11, -0.01, 0.12, -0.21, 0.02, -0.71, 0.01, -0.07, -0.37, 0, 0.02, -0.01, -0.03, 0.01, -0.11, -0.02, -0.04, -0.44, 0.05, 0.03, 0.02, 0, -0.02, -0.04, 0.02, 0.01, 0.02, 0, 0.01, 0.02, 0, 0.01, 0.03, -0.03, -0.01, -0.01, 0.02, 0.01, 0.02, -0.05],
    [0, 0.39, 0.3, 0.5, -0.25, -0.23, 0.06, 0.14, -0.02, -0.7, -0.01, -0.07, -0.39, -0.01, -0.03, 0.01, -0.01, -0.03, -0.44, 0, -0.01, -0.14, 0.02, 0, 0.01, 0, 0.01, 0.02, -0.01, -0.02, -0.06, 0.01, 0, 0, 0, -0.01, -0.02, 0.02, 0.01, 0.02, -0.02, -0.01, -0.02, 0.03]
);

const Guitar6 = CreateInstrumentFromWave(1, true,
    [1, -0.43, 0.34, -0.09, -0.15, -0.01, 0.22, 0.08, -0.21, -0.04, 0.07, -0.02, -0.13, 0.04, 0.03, -0.09, 0.19, 0.11, -0.09, 0.1, -0.02, 0.05, 0.01, -0.02, 0.13, -0.07, 0.01, 0.06, -0.04, -0.07, -0.05, 0.04, -0.02, -0.02, -0.07, -0.05, 0, -0.06, 0.03, -0.07, -0.08, 0.01, -0.01, 0, 0.01, -0.01, 0, 0, 0.02, -0.01, -0.01, 0, 0.01, 0, -0.04, 0.02, -0.01, 0.01, 0.02, -0.02, 0.02, -0.02, 0.02, 0.04, -0.04, 0.02, 0.01, 0, 0.01, 0, 0.01, -0.02, 0.02, 0.02, 0, -0.01, -0.01, 0.01, 0, 0.01, -0.01, -0.01, 0.01, -0.01, 0.01, 0, -0.02, 0.01, -0.01, 0, -0.01, 0, 0.01, -0.01, 0.01, -0.01, -0.01, 0.01],
    [0, -0.3, -0.84, -0.03, 0.16, 0.03, -0.06, 0.02, -0.1, -0.17, 0.14, 0.12, -0.16, -0.11, 0.15, -0.02, -0.18, 0.08, -0.07, -0.11, 0.02, -0.03, -0.03, -0.11, -0.01, -0.03, -0.08, -0.05, 0, -0.02, -0.02, -0.03, 0.03, -0.01, -0.04, 0, 0.07, -0.03, -0.08, 0.09, -0.02, 0.04, 0.04, -0.04, 0, 0.03, 0.05, -0.01, -0.04, 0.02, -0.03, 0, 0, 0.02, -0.01, 0, 0.03, 0.01, 0, -0.02, 0.01, 0.02, -0.02, 0.01, -0.02, -0.01, 0.02, -0.01, -0.01, -0.02, 0.02, 0.01, -0.02, 0.01, 0.01, 0, 0, -0.01, -0.01, -0.03, 0, -0.01, 0, 0, -0.03, 0.02, -0.01, 0, 0.01, -0.01, -0.01, -0.01, 0.01, -0.01, -0.02, 0, 0, 0.01]
);

const Guitar7 = CreateInstrumentFromWave(1, true,
    [1, -0.51, 0.14, -0.16, 0, -0.02, -0.01, 0.06, -0.05, -0.1, -0.07, 0.04, 0.01, 0.08, -0.04, -0.08, 0.18, 0.02, 0.03, -0.03, -0.08, 0.03, -0.01, 0.07, -0.07, -0.07, 0.03, -0.07, 0.01, 0.02, -0.03, -0.01, 0.06, 0.02, -0.03, 0, -0.03, 0.01, 0, -0.03, -0.02, -0.02, 0, -0.06, -0.04, -0.04, -0.01, -0.02, -0.03, 0.01, 0.01, 0.01, -0.01, 0.03, 0.01, -0.02, 0.03, 0.02, 0.05, 0.03, 0, 0, 0.02, 0.01, -0.01, 0, 0.01, 0.01, 0.01, -0.01, 0, 0, 0, 0.01, 0.01, 0.01, 0, -0.01, 0.01, 0, 0, -0.04, 0.01, 0.02, 0.01, 0, -0.01, 0, 0.01, 0.01, 0, 0, 0.01, 0.02, 0, -0.01, -0.02, -0.01, 0, -0.01],
    [0, -0.17, -1.02, -0.2, 0.17, 0.25, -0.04, -0.09, -0.1, 0.05, 0.19, -0.11, -0.31, -0.27, 0.19, -0.03, -0.12, 0.02, -0.1, 0.07, -0.08, -0.07, -0.02, 0.02, 0.04, -0.08, 0.01, 0, -0.06, -0.07, 0, -0.11, -0.06, 0.05, -0.05, 0.07, 0.05, 0.01, 0.03, -0.02, 0.03, 0.07, 0.04, 0.02, -0.01, 0.01, 0.05, -0.01, -0.01, -0.03, 0.01, 0.02, -0.02, -0.02, 0.01, -0.01, 0.01, -0.02, -0.01, 0.03, 0.02, 0.01, 0.01, 0.01, 0.02, -0.01, -0.02, 0.02, 0, -0.01, 0, 0, 0, 0.02, -0.01, 0, 0.01, -0.02, -0.01, 0, 0, -0.01, -0.03, -0.01, -0.01, -0.02, -0.01, 0, 0, 0, -0.02, 0, 0.01, 0.01, 0, 0.01, 0.01, 0, 0.01, -0.02]
);

const Bass1 = CreateInstrumentFromWave(1, false,
    [-0.02, -1, 0.17, 0.31, 0.18, 0.05, 0.06, 0.03, 0.02, 0.01, 0.01, 0.01, 0, 0, 0, 0.01, 0.01, 0, 0, 0, 0, 0.01, 0, -0.01, 0, 0, 0, 0, 0, 0, 0, 0, 0, -0.01, 0.01, -0.01],
    [0, -0.46, 0.72, 0.17, 0.11, 0.11, 0.08, 0.02, 0.01, 0.01, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.01, 0, -0.01, 0, 0, 0, 0, 0, 0, 0, 0, 0.01, 0, 0.01]
);
















// audio/instruments/percussion.ts


function Drum(volume: number, when: number, sourceNode: AudioScheduledSourceNode, filter: boolean, filterFrequency: number, Q: number,
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
function Kick1(when: number)
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
function Kick2(when: number)
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

function Snare(when: number, duration = 0.25, target?: AudioNode)
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

function Snare2(when: number, duration = 0.15)
{
    const volume = 1;
    Drum(volume, when, CreateNoiseNode(), true, 2000, 1, 0.001, 0.05, duration, linearFadeOutCurve);
}

function HiHat(when: number, frequency = 8000, fadeOutDuration = 0.1, target?: AudioNode)
{
    const volume = 1;
    Drum(volume, when, CreateNoiseNode(), true, frequency, 3, 0.001, fadeOutDuration, 0.005, undefined, target);
}

function HiHat2(when: number, frequency = 8000, fadeOutDuration = 0.07)
{
    const volume = 1;
    Drum(volume, when, CreateNoiseNode(), true, frequency, 3, 0.01, fadeOutDuration, 0.005, linearFadeOutCurve);
}

function Clap(when: number, duration = 0.15)
{
    const volume = 1;
    const fadeOutCurve = [1, 0.4, 0.2, 0];

    Drum(volume, when, CreateNoiseNode(0), true, 1000, 1, 0.001, 0.005, 0.001, fadeOutCurve);
    Drum(volume, when + 0.005, CreateNoiseNode(1), true, 2000, 1, 0.001, 0.005, 0.001, fadeOutCurve);
    Drum(volume, when + 0.01, CreateNoiseNode(2), true, 1500, 2, 0.001, duration, 0.001, fadeOutCurve);
}










// scenegraph/global-canvas.ts

const globalCanvas = document.createElement("canvas");

const gl = globalCanvas.getContext("webgl2")!;

const
    gl_createProgram = gl.createProgram.bind(gl),
    gl_useProgram = gl.useProgram.bind(gl),
    gl_linkProgram = gl.linkProgram.bind(gl),
    gl_deleteProgram = gl.deleteProgram.bind(gl),
    gl_getProgramParameter = gl.getProgramParameter.bind(gl),
    gl_getProgramInfoLog = gl.getProgramInfoLog.bind(gl),

    gl_createShader = gl.createShader.bind(gl),
    gl_shaderSource = gl.shaderSource.bind(gl),
    gl_compileShader = gl.compileShader.bind(gl),
    gl_attachShader = gl.attachShader.bind(gl),
    gl_deleteShader = gl.deleteShader.bind(gl),
    gl_getShaderInfoLog = gl.getShaderInfoLog.bind(gl),

    gl_createVertexArray = gl.createVertexArray.bind(gl),
    gl_bindVertexArray = gl.bindVertexArray.bind(gl),
    gl_enableVertexAttribArray = gl.enableVertexAttribArray.bind(gl),
    gl_vertexAttribPointer = gl.vertexAttribPointer.bind(gl),
    gl_getAttribLocation = gl.getAttribLocation.bind(gl),

    gl_enable = gl.enable.bind(gl),
    gl_disable = gl.disable.bind(gl),

    gl_drawElements = gl.drawElements.bind(gl),
    gl_drawArrays = gl.drawArrays.bind(gl),

    gl_createBuffer = gl.createBuffer.bind(gl),
    gl_deleteBuffer = gl.deleteBuffer.bind(gl),
    gl_bindBuffer = gl.bindBuffer.bind(gl),
    gl_bufferData = gl.bufferData.bind(gl),

    gl_createTexture = gl.createTexture.bind(gl),
    gl_activeTexture = gl.activeTexture.bind(gl),
    gl_bindTexture = gl.bindTexture.bind(gl),
    gl_deleteTexture = gl.deleteTexture.bind(gl),
    gl_texImage2D = gl.texImage2D.bind(gl),
    gl_texParameteri = gl.texParameteri.bind(gl),
    gl_texParameterf = gl.texParameterf.bind(gl),
    gl_generateMipmap = gl.generateMipmap.bind(gl),

    gl_createFramebuffer = gl.createFramebuffer.bind(gl),
    gl_bindFramebuffer = gl.bindFramebuffer.bind(gl),
    gl_framebufferTexture2D = gl.framebufferTexture2D.bind(gl),

    gl_uniform1i = gl.uniform1i.bind(gl),
    gl_uniform1f = gl.uniform1f.bind(gl),
    gl_uniform3f = gl.uniform3f.bind(gl),
    gl_uniform3fv = gl.uniform3fv.bind(gl),
    gl_uniform4f = gl.uniform4f.bind(gl),
    gl_uniformMatrix3fv = gl.uniformMatrix3fv.bind(gl),
    gl_uniformMatrix4fv = gl.uniformMatrix4fv.bind(gl),
    gl_getUniformLocation = gl.getUniformLocation.bind(gl),

    gl_depthFunc = gl.depthFunc.bind(gl),
    gl_depthMask = gl.depthMask.bind(gl),
    gl_cullFace = gl.cullFace.bind(gl),
    gl_viewport = gl.viewport.bind(gl),

    gl_clear = gl.clear.bind(gl),
    gl_clearColor = gl.clearColor.bind(gl),

    gl_blendFunc = gl.blendFunc.bind(gl),

    gl_getExtension = gl.getExtension.bind(gl),
    gl_getParameter = gl.getParameter.bind(gl),

    gl_readPixels = gl.readPixels.bind(gl);

const {
    LINK_STATUS: gl_LINK_STATUS,

    VERTEX_SHADER: gl_VERTEX_SHADER,
    FRAGMENT_SHADER: gl_FRAGMENT_SHADER,

    ARRAY_BUFFER: gl_ARRAY_BUFFER,
    ELEMENT_ARRAY_BUFFER: gl_ELEMENT_ARRAY_BUFFER,

    TRIANGLES: gl_TRIANGLES,
    TRIANGLE_STRIP: gl_TRIANGLE_STRIP,
    UNSIGNED_BYTE: gl_UNSIGNED_BYTE,
    UNSIGNED_INT: gl_UNSIGNED_INT,
    UNSIGNED_INT_24_8: gl_UNSIGNED_INT_24_8,
    FLOAT: gl_FLOAT,
    RGB10_A2: gl_RGB10_A2,
    UNSIGNED_INT_2_10_10_10_REV: gl_UNSIGNED_INT_2_10_10_10_REV,

    STATIC_DRAW: gl_STATIC_DRAW,
    MAX_TEXTURE_SIZE: gl_MAX_TEXTURE_SIZE,

    TEXTURE0: gl_TEXTURE0,
    TEXTURE_2D: gl_TEXTURE_2D,
    DEPTH_STENCIL: gl_DEPTH_STENCIL,
    DEPTH24_STENCIL8: gl_DEPTH24_STENCIL8,
    TEXTURE_MIN_FILTER: gl_TEXTURE_MIN_FILTER,
    TEXTURE_MAG_FILTER: gl_TEXTURE_MAG_FILTER,
    LINEAR: gl_LINEAR,
    LINEAR_MIPMAP_NEAREST: gl_LINEAR_MIPMAP_NEAREST,
    TEXTURE_COMPARE_MODE: gl_TEXTURE_COMPARE_MODE,
    COMPARE_REF_TO_TEXTURE: gl_COMPARE_REF_TO_TEXTURE,
    TEXTURE_WRAP_S: gl_TEXTURE_WRAP_S,
    TEXTURE_WRAP_T: gl_TEXTURE_WRAP_T,
    REPEAT: gl_REPEAT,
    LINEAR_MIPMAP_LINEAR: gl_LINEAR_MIPMAP_LINEAR,
    RGBA: gl_RGBA,

    FRAMEBUFFER: gl_FRAMEBUFFER,
    DEPTH_STENCIL_ATTACHMENT: gl_DEPTH_STENCIL_ATTACHMENT,
    COLOR_ATTACHMENT0: gl_COLOR_ATTACHMENT0,

    DEPTH_TEST: gl_DEPTH_TEST,
    LEQUAL: gl_LEQUAL,
    LESS: gl_LESS,

    CULL_FACE: gl_CULL_FACE,
    BACK: gl_BACK,
    FRONT: gl_FRONT,

    COLOR_BUFFER_BIT: gl_COLOR_BUFFER_BIT,
    DEPTH_BUFFER_BIT: gl_DEPTH_BUFFER_BIT,

    BLEND: gl_BLEND,
    SRC_ALPHA: gl_SRC_ALPHA,
    ONE_MINUS_SRC_ALPHA: gl_ONE_MINUS_SRC_ALPHA,
} = gl;















// util/webgl-utils.ts

const webglDebugMode = true; // using a const bool so relevant parts can be easily removed by the minifier

function CreateShader(shaderType: number, shaderSource: string)
{
    const shaderObj = gl_createShader(shaderType)!;

    if (webglDebugMode)
    {
        if (shaderObj === null)
        {
            throw new Error("Cannot create shader object");
        }
    }

    gl_shaderSource(shaderObj, shaderSource);
    gl_compileShader(shaderObj);

    if (webglDebugMode)
    {
        const shaderError = gl_getShaderInfoLog(shaderObj);
        if (shaderError && shaderError.length !== 0)
        {
            console.error(shaderError);

            // log shader with line numbers
            const lines = shaderSource.split("\n");
            const padCount = Math.log10(lines.length + 1) | 0 + 4;
            console.error("\n" + lines.map((line, idx) => (idx + 1).toString().padEnd(padCount, " ") + line).join("\n"));

            throw new Error(`Error compiling ${shaderType === gl_VERTEX_SHADER ? "vertex" : "fragment"} shader`);
        }
    }

    return shaderObj;
}

function CreateAndLinkProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader)
{
    const program = gl_createProgram()!;

    gl_attachShader(program, vertexShader);
    gl_attachShader(program, fragmentShader);
    gl_linkProgram(program);

    if (webglDebugMode)
    {
        const success = gl_getProgramParameter(program, gl_LINK_STATUS) as boolean;

        const programInfo = gl_getProgramInfoLog(program);
        if (programInfo && programInfo.length !== 0)
        {
            if (success)
            {
                console.warn(programInfo);
            }
            else
            {
                console.error(programInfo);
                throw new Error("Error linking program");
            }
        }
    }

    return program;
}

function CreateWebglProgram(vertexShaderSource: string, fragmentShaderSource: string, ...uniforms: string[])
{
    const vertShaderObj = CreateShader(gl_VERTEX_SHADER, vertexShaderSource);
    const fragShaderObj = CreateShader(gl_FRAGMENT_SHADER, fragmentShaderSource);

    const program = CreateAndLinkProgram(vertShaderObj, fragShaderObj);

    // gl_useProgram(program);

    const uniformLocations = new Map<string, WebGLUniformLocation>();
    uniforms.forEach(u => uniformLocations.set(u, gl_getUniformLocation(program, u)!));

    return { program, uniformLocations };
}












// util/webgl.ts

function CreateWebglCanvas()
{
    const vertexShader = `#version 300 es
in vec2 aVertexPosition;
uniform float uAspect;
out vec2 vPixelCoord;
void main()
{
    vPixelCoord = (aVertexPosition + vec2(1)) * 0.5;
    gl_Position = vec4(aVertexPosition, 0, 1);
}`;

    const vertShaderObj = CreateShader(gl_VERTEX_SHADER, vertexShader);

    const vertexBuffer = gl_createBuffer()!;
    const vertexPositions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    gl_bindBuffer(gl_ARRAY_BUFFER, vertexBuffer);
    gl_bufferData(gl_ARRAY_BUFFER, vertexPositions, gl_STATIC_DRAW);

    const framebuffer = gl_createFramebuffer()!;

    function DrawWithShader(shaderFunctions: string[], shaderMainImage: string, width: number, height: number,
        inputTextures: WebGLTexture[], resultTexture: WebGLTexture)
    {
        // size setup
        globalCanvas.width = width;
        globalCanvas.height = height;
        gl_viewport(0, 0, width, height);

        // shader and program setup
        const fragmentShaderSource = `#version 300 es
precision highp float;
in vec2 vPixelCoord;
out vec4 outColor;

uniform float uAspect;
const vec2 pixelSize = vec2(${1 / width}, ${1 / height});

${inputTextures.map((_, idx) => `uniform sampler2D t${idx};`).join("\n")}

${shaderFunctions.join("\n")}

void main()
{
${shaderMainImage}
}`;

        const fragShaderObj = CreateShader(gl_FRAGMENT_SHADER, fragmentShaderSource);
        const program = CreateAndLinkProgram(vertShaderObj, fragShaderObj);

        gl_useProgram(program);

        // setup attributes and uniforms
        const vertexLocation = gl_getAttribLocation(program, "aVertexPosition");
        gl_uniform1f(gl_getUniformLocation(program, "uAspect"), width / height);

        // textures
        inputTextures.forEach((tex, idx) =>
        {
            gl_activeTexture(gl_TEXTURE0 + idx);
            gl_bindTexture(gl_TEXTURE_2D, tex);
            const loc = gl_getUniformLocation(program, "t" + idx);
            gl_uniform1i(loc, idx);
        });

        gl_bindFramebuffer(gl_FRAMEBUFFER, framebuffer);
        gl_framebufferTexture2D(gl_FRAMEBUFFER, gl_COLOR_ATTACHMENT0, gl_TEXTURE_2D, resultTexture, 0);

        // draw
        gl_bindBuffer(gl_ARRAY_BUFFER, vertexBuffer);
        gl_enableVertexAttribArray(vertexLocation);
        gl_vertexAttribPointer(vertexLocation, 2, gl_FLOAT, false, 0, 0);
        gl_drawArrays(gl_TRIANGLE_STRIP, 0, vertexPositions.length / 2);

        // cleanup
        gl_deleteShader(fragShaderObj);
        gl_deleteProgram(program);
        gl_bindFramebuffer(gl_FRAMEBUFFER, null);

        gl_bindTexture(gl_TEXTURE_2D, resultTexture);
        gl_generateMipmap(gl_TEXTURE_2D);
        gl_bindTexture(gl_TEXTURE_2D, null);
    }

    function CreateTexture(width: number, height: number)
    {
        const tex = gl_createTexture()!;
        gl_bindTexture(gl_TEXTURE_2D, tex);
        gl_texParameteri(gl_TEXTURE_2D, gl_TEXTURE_WRAP_S, gl_REPEAT);
        gl_texParameteri(gl_TEXTURE_2D, gl_TEXTURE_WRAP_T, gl_REPEAT);
        gl_texImage2D(gl_TEXTURE_2D, 0, gl_RGB10_A2, width, height, 0, gl_RGBA, gl_UNSIGNED_INT_2_10_10_10_REV, null);

        gl_texParameteri(gl_TEXTURE_2D, gl_TEXTURE_MIN_FILTER, gl_LINEAR_MIPMAP_LINEAR);

        // only needed for non power of 2 textures
        // {
        //     gl_texParameteri(gl_TEXTURE_2D, gl_TEXTURE_MAG_FILTER, gl_LINEAR);
        //     gl_texParameteri(gl_TEXTURE_2D, gl_TEXTURE_WRAP_S, gl_REPEAT);
        //     gl_texParameteri(gl_TEXTURE_2D, gl_TEXTURE_WRAP_T, gl_REPEAT);
        // }

        const ext = gl_getExtension("EXT_texture_filter_anisotropic");
        ext && gl_texParameterf(gl_TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, min(16, gl_getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));

        return tex;
    }

    function DeleteTexture(texture: WebGLTexture)
    {
        gl_deleteTexture(texture);
    }

    interface ReturnObject
    {
        DrawWithShader: typeof DrawWithShader;
        CreateTexture: typeof CreateTexture;
        DeleteTexture: typeof DeleteTexture;
        canvas: HTMLCanvasElement;
        GetTexturePixels?: (texture: WebGLTexture, width: number, height: number, pixels?: Uint8ClampedArray) => Uint8ClampedArray;
        DrawTexture?: (texture: WebGLTexture, width: number, height: number) => void;
        TextureToImage?: (texture: WebGLTexture, width: number, height: number) => Promise<HTMLImageElement>;
    }

    const returnObject: ReturnObject = { DrawWithShader, CreateTexture, DeleteTexture, canvas: globalCanvas };

    if (webglDebugMode)
    {
        // for debug
        function GetTexturePixels(texture: WebGLTexture, width: number, height: number, pixels?: Uint8ClampedArray)
        {
            pixels ??= new Uint8ClampedArray(width * height * 4);
            gl_framebufferTexture2D(gl_FRAMEBUFFER, gl_COLOR_ATTACHMENT0, gl_TEXTURE_2D, texture, 0);
            gl_readPixels(0, 0, width, height, gl_RGBA, gl_UNSIGNED_BYTE, pixels);
            return pixels;
        }

        async function TextureToImage(texture: WebGLTexture, width: number, height: number)
        {
            DrawTexture(texture, width, height);
            const dataUrl = globalCanvas.toDataURL();

            return await new Promise<HTMLImageElement>((resolve, reject) =>
            {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = dataUrl;
            });
        }

        const debugDrawVertexShader = `attribute vec2 aVertexPosition;
varying vec2 vPixelCoord;
void main()
{
    vPixelCoord = (aVertexPosition + vec2(1.0)) * 0.5;
    gl_Position = vec4(aVertexPosition, 0.0, 1.0);
}`;

        const debugDrawFragmentShader = `precision highp float;
varying vec2 vPixelCoord;
uniform sampler2D tex;

void main()
{
    gl_FragColor = texture2D(tex, vPixelCoord);
}`;

        const debugDrawProgram = gl_createProgram()!;
        gl_attachShader(debugDrawProgram, CreateShader(gl_VERTEX_SHADER, debugDrawVertexShader));
        gl_attachShader(debugDrawProgram, CreateShader(gl_FRAGMENT_SHADER, debugDrawFragmentShader));
        gl_linkProgram(debugDrawProgram);

        const debugDrawVertexLocation = gl_getAttribLocation(debugDrawProgram, "aVertexPosition");

        function DrawTexture(texture: WebGLTexture, width: number, height: number)
        {
            globalCanvas.width = width;
            globalCanvas.height = height;
            gl_viewport(0, 0, width, height);

            gl_useProgram(debugDrawProgram);
            gl_activeTexture(gl_TEXTURE0);
            gl_bindTexture(gl_TEXTURE_2D, texture);

            // draw
            gl_bindBuffer(gl_ARRAY_BUFFER, vertexBuffer);
            gl_enableVertexAttribArray(debugDrawVertexLocation);
            gl_vertexAttribPointer(debugDrawVertexLocation, 2, gl_FLOAT, false, 0, 0);
            gl_drawArrays(gl_TRIANGLE_STRIP, 0, vertexPositions.length / 2);
        }

        returnObject.GetTexturePixels = GetTexturePixels;
        returnObject.DrawTexture = DrawTexture;
        returnObject.TextureToImage = TextureToImage;
    }

    return returnObject;
}

const ca = CreateWebglCanvas();















// util/shader-utils.ts

const ShaderUtils = `
float hash1(float n)
{
    return fract(sin(n) * 43758.5453);
}

vec2 hash2(vec2 p)
{
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p)*43758.5453);
}

float saturate(float x)
{
    return clamp(x, 0.0, 1.0);
}

float unlerp(float a, float b, float x)
{
    return (x - a) / (b - a);
}

float remap(float from0, float from1, float to0, float to1, float x)
{
    return mix(to0, to1, unlerp(from0, from1, x));
}

float sharpstep(float edge0, float edge1, float x)
{
    return saturate(unlerp(edge0, edge1, x));
}

vec4 colorRamp(vec4 colorA, float posA, vec4 colorB, float posB, float t)
{
    return mix(colorA, colorB, sharpstep(posA, posB, t));
}

vec3 colorRamp3(vec3 colorA, float posA, vec3 colorB, float posB, float t)
{
    return mix(colorA, colorB, sharpstep(posA, posB, t));
}

float valueRamp(float colorA, float posA, float colorB, float posB, float t)
{
    return mix(colorA, colorB, sharpstep(posA, posB, t));
}

`;

const edgeBlend = (fnName: string, blend = 0.2, returnType = "vec4", edgeBlendFnName = "edgeBlend") => `
${returnType} ${edgeBlendFnName}(vec2 uv)
{
    const vec2 fadeWidth = vec2(${blend});
    const vec2 scaling = 1.0 - fadeWidth;
    vec2 offsetuv = uv * scaling;
    vec2 blend = clamp((uv - scaling) / fadeWidth, 0.0, 1.0);

    return
        blend.y * blend.x * ${fnName}(fract(offsetuv + (fadeWidth * 2.0))) +
        blend.y * (1.0 - blend.x) * ${fnName}(vec2(fract(offsetuv.x + fadeWidth.x), fract(offsetuv.y + (fadeWidth.y * 2.0)))) +
        (1.0 - blend.y) * (1.0 - blend.x) * ${fnName}(fract(offsetuv + fadeWidth)) +
        (1.0 - blend.y) * blend.x * ${fnName}(vec2(fract(offsetuv.x + (fadeWidth.x * 2.0)), fract(offsetuv.y + fadeWidth.y)));
}

`;










// scenegraph/transform.ts

class Transform
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











// scenegraph/material.ts


interface Material
{
    r: number;
    g: number;
    b: number;
    a: number;
    metallic?: number;
    roughness?: number;
    textureScale?: Vector3;
    textureOffset?: Vector3;
    textureBlendSharpness?: number;
    unlit?: boolean;
}

let standardMaterialProgram: ReturnType<typeof CreateWebglProgram> | null = null;
function GetOrCreateStandardMaterial()
{
    if (standardMaterialProgram === null)
    {
        const vertexShaderSource = `#version 300 es
        layout (location = 0)
        in vec4 vPosition;                      // position in modelSpace
        layout (location = 1)
        in vec3 vNormal;                        // normal in modelSpace

        out vec3 viewPos;                       // position in viewSpace
        out vec3 viewNormal;                    // normal in viewSpace
        out vec3 modelPos;                      // position in modelSpace
        out vec3 modelNormal;                   // normal in modelSpace
        out vec3 worldPos;                      // position in worldSpace
        out vec3 worldNormal;                   // normal in worldSpace
        out vec4 shadowPos;

        uniform mat4 worldMat;                  // transforms from modelSpace to worldSpace
        uniform mat3 worldNormalMat;            // transforms normal vectors from modelSpace to worldSpace
        uniform mat4 worldViewMat;              // transforms from modelSpace to viewSpace
        uniform mat3 worldViewNormalMat;        // transforms normal vectors from modelSpace to viewSpace
        uniform mat4 worldViewProjMat;          // transforms from modelSpace to NDC space
        uniform mat4 shadowMVP;

        void main()
        {
            viewPos = (worldViewMat * vPosition).xyz;
            viewNormal = worldViewNormalMat * vNormal;
            modelPos = vPosition.xyz;
            modelNormal = vNormal;
            worldPos = (worldMat * vPosition).xyz;
            worldNormal = worldNormalMat * vNormal;
            gl_Position = worldViewProjMat * vPosition;
            shadowPos = shadowMVP * worldMat * vPosition * 0.5 + 0.5;
        }
`;

        const fragmentShaderSource = `#version 300 es

        precision highp float;
        precision highp sampler2DShadow;

        uniform bool isUnlit;

        uniform sampler2D albedo;
        uniform sampler2D normalMap;
        uniform sampler2D roughnessMap;
        uniform sampler2DShadow depthMap;

        uniform mat3 worldNormalMat;
        uniform mat3 worldViewNormalMat;

        uniform bool hasAlbedo;
        uniform bool hasNormalMap;
        uniform bool hasRoughnessMap;

        uniform vec4 baseColor;
        uniform float roughness;
        uniform float metallic;
        uniform float lightIntensity;

        uniform float sharpness;
        uniform vec3 scale;
        uniform vec3 offset;

        uniform vec3 lightPos;
        uniform vec3 lightPosWorld;
        uniform bool enableShadows;

        in vec3 viewPos;
        in vec3 viewNormal;
        in vec3 modelPos;
        in vec3 modelNormal;
        in vec3 worldPos;
        in vec3 worldNormal;
        in vec4 shadowPos;
        out vec4 fragColor;


        vec3 triplanarBlendFactor(vec3 normal)
        {
            vec3 weights = pow(abs(normal), vec3(sharpness));
            float dotValue = dot(weights, vec3(1));
            return weights / vec3(dotValue);
        }

#define VOLLEYBALL_TRIPLANAR 0

        vec4 tex2DTriplanar(sampler2D tex, vec3 uvw, vec3 normal)
        {
            vec3 blend = triplanarBlendFactor(normal);

            // read the three texture projections, for x,y,z axes
#if VOLLEYBALL_TRIPLANAR
            vec4 cx = texture(tex, uvw.yz);
#else
            vec4 cx = texture(tex, uvw.zy);
#endif
            vec4 cy = texture(tex, uvw.zx);
            vec4 cz = texture(tex, uvw.xy);

            // blend the textures based on weights
            return cx * blend.x + cy * blend.y + cz * blend.z;
        }

        // https://bgolus.medium.com/normal-mapping-for-a-triplanar-shader-10bf39dca05a
        vec3 getTriplanarNormal(sampler2D tex, vec3 uvw, vec3 normal)
        {
            vec3 blend = triplanarBlendFactor(normal);

            // Triplanar uvs

#if VOLLEYBALL_TRIPLANAR
            vec2 uvX = uvw.yz; // x facing plane
#else
            vec2 uvX = uvw.zy; // x facing plane
#endif
            vec2 uvY = uvw.zx; // y facing plane
            vec2 uvZ = uvw.xy; // z facing plane

            // Tangent space normal maps
            vec3 tnormalX = texture(tex, uvX).rgb * 2.0 - 1.0;
            vec3 tnormalY = texture(tex, uvY).rgb * 2.0 - 1.0;
            vec3 tnormalZ = texture(tex, uvZ).rgb * 2.0 - 1.0;

            // Swizzle tangent normals into world space and zero out "z"
#if VOLLEYBALL_TRIPLANAR
            vec3 normalX = vec3(0.0, tnormalX.xy);
#else
            vec3 normalX = vec3(0.0, tnormalX.yx);
#endif
            vec3 normalY = vec3(tnormalY.y, 0.0, tnormalY.x);
            vec3 normalZ = vec3(tnormalZ.xy, 0.0);

            // Triblend normals and add to world normal
            return normalize(
                normalX * blend.x +
                normalY * blend.y +
                normalZ * blend.z +
                normal
            );
        }


        const float PI = 3.1415926535897932384626433832795;

        float clampedDot(vec3 a, vec3 b)
        {
            return max(dot(a, b), 0.0);
        }

        vec3 fresnel(vec3 color, float dotAngle)
        {
            // Schlick's approximation
            return color + (1.0 - color) * pow(1.0 - dotAngle, 5.0);
        }

        vec3 calculateReflectance(
            vec3 N, vec3 V,
            vec3 L, vec3 lightDirect, vec3 lightAmbient,
            vec3 cDiff, vec3 F0, float specPower)
        {
            float lambertTerm = clampedDot(N, L);

            // calculate half vector
            vec3 H = normalize(L + V);

            vec3 F = fresnel(F0, dot(L, H));

            // normal distribution term multiplied with implicit Geometry term (with normalization factor)
            float GD = pow(clampedDot(N, H), specPower) * (specPower + 2.0) / 8.0;

            vec3 specular = F * GD;
            vec3 diffuse = cDiff;


            float shadowLightValue = 0.0;
            if (enableShadows)
            {
                vec3 shadowPosLightSpace = shadowPos.xyz / shadowPos.w;
                vec2 uvDistanceFromCenter = abs(vec2(0.5) - shadowPosLightSpace.xy);

                if (shadowPosLightSpace.z > 1.0 || uvDistanceFromCenter.x > 0.5 || uvDistanceFromCenter.y > 0.5)
                {
                    // if the coordinate is outside the shadowmap, then it's in light
                    shadowLightValue = 1.0;
                }
                else
                {
                    float bias = max(0.001 * (1.0 - dot(normalize(worldNormal), lightPosWorld)), 0.0001);
                    // float bias = 0.005;
                    shadowPosLightSpace.z -= bias / shadowPos.w;

                    shadowLightValue = texture(depthMap, shadowPosLightSpace);
                    // shadowLightValue = 0.0;
                }
            }
            else
            {
                shadowLightValue = 1.0;
            }

            vec3 refl = shadowLightValue * (diffuse + specular) * lambertTerm * lightDirect;
            refl += cDiff * lightAmbient;

            return refl;
        }


        vec3 calculateReflectances(vec3 N, vec3 V)
        {
        #if 0 // triplanar use world space

            vec3 triplanarPos = worldPos;
            vec3 triplanarNormal = normalize(worldNormal);

        #else // triplanar use model space

            vec3 triplanarPos = modelPos;
            vec3 triplanarNormal = normalize(modelNormal);

        #endif

            // normal map
            N = hasNormalMap
                ? normalize(worldViewNormalMat * getTriplanarNormal(normalMap, triplanarPos * scale + offset, triplanarNormal))
                : N;

            // albedo/specular base
            vec3 col = hasAlbedo
                ? tex2DTriplanar(albedo, triplanarPos * scale + offset, triplanarNormal).rgb * baseColor.rgb
                : baseColor.rgb;

            // roughness TODO? needs testing
            float rgh = hasRoughnessMap
                ? tex2DTriplanar(roughnessMap, triplanarPos * scale + offset, triplanarNormal).r
                : roughness;

            const vec3 dielectricSpecular = vec3(0.04, 0.04, 0.04);
            const vec3 black = vec3(0.0, 0.0, 0.0);

            // sub-surface scattering reflectance
            vec3 cDiff = mix(col * (1.0 - dielectricSpecular.r), black, metallic) / PI;

            // fresnel reflectance at normal incidence
            vec3 F0 = mix(dielectricSpecular, col, metallic);

            // map roughness in [0,1] into shininess in [0, 128] with a logarithmic rate
            rgh = 1.2 - 0.2 / clamp(rgh, 0.00001, 0.99999);
            float specPower = log(2.0 - rgh) * 185.0;

            // total irradiance
            vec3 refl = vec3(0.0, 0.0, 0.0);

            vec3 lightPositions[] = vec3[1](lightPos);
            vec3 lightColors[] = vec3[1](vec3(1.0, 1.0, 1.0) * 1.0);
            vec3 lightAmbientColors[] = vec3[1](vec3(1.0, 1.0, 1.0) * 1.0);

            // vec3 hemisphereLightPosition = normalize(-lightPos);

            // for (int i = 0; i < lightPositions.length(); ++i)
            int i = 0;
            {
                vec3 L = lightPositions[i];
                vec3 cL = lightColors[i];
                vec3 aL = lightAmbientColors[i] * (1.0 - clampedDot(worldNormal, -lightPosWorld) * 0.1);
                refl += calculateReflectance(
                    N, V,
                    L, cL, aL,
                    cDiff, F0, specPower);
            }

            return refl;
        }

        void main()
        {
            if (isUnlit)
            {
                // no textures in unlit mode currently
                fragColor = baseColor;
                return;
            }

            vec3 N = normalize(viewNormal);
            vec3 V = normalize(-viewPos);
            vec3 rgb = calculateReflectances(N, V);

        #if 0
            // final gamma correction
            // rgb *= rgb;
            rgb = sqrt(rgb);
        #endif

            float fogFactor = smoothstep(150.0, 250.0, length(worldPos));
            const vec3 fogColor = vec3(0.4, 0.45, 0.5);

            fragColor = vec4(mix(rgb, fogColor, fogFactor), baseColor.a);
        }
`;

        standardMaterialProgram = CreateWebglProgram(vertexShaderSource, fragmentShaderSource,
            "worldViewMat", "worldViewNormalMat", "worldViewProjMat", "worldMat", "worldNormalMat", "shadowMVP", "isUnlit",
            "albedo", "normalMap", "roughnessMap", "depthMap",
            "hasAlbedo", "hasNormalMap", "hasRoughnessMap",
            "baseColor", "metallic", "roughness", "lightIntensity",
            "sharpness", "scale", "offset",
            "lightPos", "lightPosWorld", "enableShadows"
        );

        gl_useProgram(standardMaterialProgram.program);
        gl_uniform1i(standardMaterialProgram.uniformLocations.get("albedo")!, 0);
        gl_uniform1i(standardMaterialProgram.uniformLocations.get("normalMap")!, 1);
        gl_uniform1i(standardMaterialProgram.uniformLocations.get("roughnessMap")!, 2);
        gl_uniform1i(standardMaterialProgram.uniformLocations.get("depthMap")!, 3);
    }

    return standardMaterialProgram;
}

let shadowProgram: ReturnType<typeof CreateWebglProgram> | null = null;
function GetOrCreateShadowProgram()
{
    if (shadowProgram === null)
    {
        shadowProgram = CreateWebglProgram(`#version 300 es

layout (location = 0)
in vec4 vPosition;
out vec2 uv;

uniform mat4 depthMVP;
uniform mat4 worldMat;

void main()
{
    uv = vPosition.xy + 0.5;
    gl_Position = depthMVP * worldMat * vPosition;
}
`,

            `#version 300 es

precision highp float;

uniform sampler2D tex;

in vec2 uv;

void main()
{
    if (texture(tex, uv).a < 0.5)
    {
        discard;
    }
}
`,
            "depthMVP", "worldMat", "tex"
        );
    }

    return shadowProgram;
}














// scenegraph/geometry.ts

interface Geometry
{
    vertices: Float32Array;
    triangles: Uint32Array;
    normals: Float32Array;
}

function JoinGeometries(...geometries: Geometry[]): Geometry
{
    const vertices: number[] = [];
    const triangles: number[] = [];
    const normals: number[] = [];

    for (const geometry of geometries)
    {
        const startIndex = vertices.length / 3;
        vertices.push(...geometry.vertices);
        normals.push(...geometry.normals);
        triangles.push(...geometry.triangles.map(tri => tri + startIndex));
    }

    return { vertices: new Float32Array(vertices), triangles: new Uint32Array(triangles), normals: new Float32Array(normals) };
}

function TransformGeometry(geometry: Geometry, transform: Matrix4x4)
{
    const { vertices, normals } = geometry;
    const normalTransform = transform.topLeft3x3().invert().transpose();

    const v = NewVector3();
    for (let i = 0; i < vertices.length; i += 3)
    {
        v.set(vertices.slice(i, i + 3));
        v.applyMatrix4x4(transform);
        vertices.set(v, i);

        v.set(normals.slice(i, i + 3));
        v.applyMatrix3x3(normalTransform);
        normals.set(v, i);
    }

    return geometry;
}

const tmpTransformMatrix_geometry_ts = NewMatrix4x4();

function TranslateGeometry(geometry: Geometry, x: number, y: number, z: number)
{
    return TransformGeometry(geometry, tmpTransformMatrix_geometry_ts.compose(NewVector3(x, y, z), NewQuaternion(), NewVector3(1)));
}

function RotateGeometry(geometry: Geometry, rotation: Quaternion)
{
    return TransformGeometry(geometry, tmpTransformMatrix_geometry_ts.compose(NewVector3(), rotation, NewVector3(1)));
}

function RotateGeometryWithAxisAngle(geometry: Geometry, x: number, y: number, z: number, angle: number)
{
    return RotateGeometry(geometry, NewQuaternionFromAxisAngle(x, y, z, angle));
}

function CloneGeometry(geometry: Geometry): Geometry
{
    // @ts-ignore
    return structuredClone(geometry)
}

function CreateBoxGeometry(width = 1, height = 1, depth = 1): Geometry
{
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const halfDepth = depth / 2;

    const vertices = new Float32Array([
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

    const triangles = new Uint32Array([
        0,
        0 + 3,
        0 + 1,
        0,
        0 + 2,
        0 + 3,

        4,
        4 + 3,
        4 + 1,
        4,
        4 + 2,
        4 + 3,

        8,
        8 + 3,
        8 + 1,
        8,
        8 + 2,
        8 + 3,

        12,
        12 + 3,
        12 + 1,
        12,
        12 + 2,
        12 + 3,

        16,
        16 + 3,
        16 + 1,
        16,
        16 + 2,
        16 + 3,

        20,
        20 + 3,
        20 + 1,
        20,
        20 + 2,
        20 + 3,
    ]);

    const normals = new Float32Array([
        // front
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,

        // back
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,

        // bottom
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,

        // top
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,

        // left
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,

        // right
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
    ]);

    return { vertices, triangles, normals };
}

function CreateSphereGeometry(radius = 1, horizontalSubdivisions = 16, verticalSubdivisions = 24): Geometry
{
    // just convert normals to vertices later by multiplying with the radius
    const normals: number[] = [];
    const triangles: number[] = [];

    // note: the geometry is not closed, and contains degenerate triangles at the poles
    // but this allows the code to be smaller, and it doesn't affect the rendering anyways

    for (let i = 0; i < horizontalSubdivisions; ++i)
    {
        const angleY = NegHalfPI + PI * i / (horizontalSubdivisions - 1);
        const yCoord = sin(-angleY);
        const yMultiplier = cos(-angleY);

        for (let j = 0; j < verticalSubdivisions; ++j)
        {
            const angleXZ = TwoPI * j / (verticalSubdivisions - 1);
            normals.push(cos(angleXZ) * yMultiplier, yCoord, sin(angleXZ) * yMultiplier);
        }
    }

    // triangles
    for (let i = 0; i < horizontalSubdivisions; ++i)
    {
        const startIndex = i * verticalSubdivisions;
        const nextRowStartIndex = startIndex + verticalSubdivisions;

        for (let j = 0; j < verticalSubdivisions; ++j)
        {
            triangles.push(
                startIndex + j,
                startIndex + j + 1,
                nextRowStartIndex + j + 1,

                startIndex + j,
                nextRowStartIndex + j + 1,
                nextRowStartIndex + j
            );
        }
    }

    const normalsF32 = new Float32Array(normals);
    return { vertices: normalsF32.map(n => n * radius), triangles: new Uint32Array(triangles), normals: normalsF32 };
}

function CreateCapsuleGeometry(radius = 1, height = 1, horizontalSubdivisions = 16, verticalSubdivisions = 24): Geometry
{
    // the capsule is on the y axis
    const vertices: number[] = [];
    const normals: number[] = [];
    const triangles: number[] = [];

    // note: the geometry is not closed, and contains degenerate triangles at the poles
    // but this allows the code to be smaller, and it doesn't affect the rendering anyways

    // TODO: make sure this works properly

    for (let i = 0; i <= horizontalSubdivisions / 2; ++i)
    {
        const angleY = NegHalfPI + PI * i / (horizontalSubdivisions - 1);
        const yCoord = sin(-angleY);
        const yMultiplier = cos(-angleY);

        for (let j = 0; j < verticalSubdivisions; ++j)
        {
            const angleXZ = TwoPI * j / (verticalSubdivisions - 1);
            const x = cos(angleXZ) * yMultiplier;
            const y = yCoord;
            const z = sin(angleXZ) * yMultiplier;
            normals.push(x, y, z);
            vertices.push(x * radius, y * radius + height / 2, z * radius);
        }
    }

    for (let i = horizontalSubdivisions / 2; i < horizontalSubdivisions; ++i)
    {
        const angleY = NegHalfPI + PI * i / (horizontalSubdivisions - 1);
        const yCoord = sin(-angleY);
        const yMultiplier = cos(-angleY);

        for (let j = 0; j < verticalSubdivisions; ++j)
        {
            const angleXZ = TwoPI * j / (verticalSubdivisions - 1);
            const x = cos(angleXZ) * yMultiplier;
            const y = yCoord;
            const z = sin(angleXZ) * yMultiplier;
            normals.push(x, y, z);
            vertices.push(x * radius, y * radius - height / 2, z * radius);
        }
    }

    // triangles
    for (let i = 0; i < horizontalSubdivisions + 1; ++i)
    {
        const startIndex = i * verticalSubdivisions;
        const nextRowStartIndex = startIndex + verticalSubdivisions;

        for (let j = 0; j < verticalSubdivisions; ++j)
        {
            triangles.push(
                startIndex + j,
                startIndex + j + 1,
                nextRowStartIndex + j + 1,

                startIndex + j,
                nextRowStartIndex + j + 1,
                nextRowStartIndex + j
            );
        }
    }

    return { vertices: new Float32Array(vertices), triangles: new Uint32Array(triangles), normals: new Float32Array(normals) };
}

function CreateCylinderGeometry(height: number, bottomRadius: number, topRadius: number, subdivisions = 16): Geometry
{
    const halfHeight = height / 2;

    // the cylinder is on the y axis
    const vertices: number[] = [];
    const normals: number[] = [];
    const triangles: number[] = [];

    // around
    for (let i = 0; i <= subdivisions; ++i)
    {
        const t = i / subdivisions * TwoPI;
        const c = cos(t);
        const s = sin(t);

        vertices.push(
            c * bottomRadius, -halfHeight, s * bottomRadius,
            c * topRadius, halfHeight, s * topRadius
        );

        normals.push(
            c, 0, s,
            c, 0, s
        );
    }

    vertices.push(...vertices); // copy all vertices for top/bottom

    // top/bottom normals
    for (let i = 0; i <= subdivisions; ++i)
    {
        normals.push(
            0, -1, 0,
            0, 1, 0
        );
    }

    // triangles

    // sides
    for (let i = 0; i < subdivisions * 2; i += 2)
    {
        triangles.push(
            i, i + 1, i + 3,
            i, i + 3, i + 2,
        );
    }

    // top/bottom
    const baseIndex = (subdivisions + 1) * 2;
    for (let i = 2; i < subdivisions; ++i)
    {
        triangles.push(
            baseIndex, baseIndex + i * 2 - 2, baseIndex + i * 2,
            baseIndex + 1, baseIndex + i * 2 + 1, baseIndex + i * 2 - 1,
        );
    }

    return { vertices: new Float32Array(vertices), normals: new Float32Array(normals), triangles: new Uint32Array(triangles) };
}

function CreatePlaneGeometry(width = 1, depth = 1)
{
    const halfWidth = width / 2;
    const halfDepth = depth / 2;

    const vertices = new Float32Array([
        // bottom
        halfWidth, 0, -halfDepth,
        -halfWidth, 0, -halfDepth,
        halfWidth, 0, halfDepth,
        -halfWidth, 0, halfDepth,

        // top
        -halfWidth, 0, -halfDepth,
        halfWidth, 0, -halfDepth,
        -halfWidth, 0, halfDepth,
        halfWidth, 0, halfDepth,
    ]);

    const triangles = new Uint32Array([
        0,
        0 + 3,
        0 + 1,
        0,
        0 + 2,
        0 + 3,

        4,
        4 + 3,
        4 + 1,
        4,
        4 + 2,
        4 + 3
    ]);

    const normals = new Float32Array([
        // bottom
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,

        // top
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0
    ]);

    return { vertices, triangles, normals };
}

function CreateExtrudedGeometryConvex(polyline: number[], extrudeThickness: number): Geometry
{
    // triangulated from the first point in the polygon, so it's only guaranteed to work for convex polygons
    // polyline is in the xy plane, extruded in the z direction
    const vertices: number[] = [];
    const triangles: number[] = [];
    const normals: number[] = [];

    const points: Vector2[] = [];
    for (let i = 0; i < polyline.length; i += 2)
    {
        points.push(NewVector2(polyline[i], polyline[i + 1]));
    }

    // front and back
    for (const point of points)
    {
        vertices.push(point.x, point.y, extrudeThickness / -2);
        vertices.push(point.x, point.y, extrudeThickness / 2);
        normals.push(0, 0, -1);
        normals.push(0, 0, 1);
    }

    for (let i = 2; i < points.length; ++i)
    {
        const i1 = i - 1;
        triangles.push(
            0, i1 * 2, i * 2,
            1, i * 2 + 1, i1 * 2 + 1
        );
    }

    // sides
    let prev = points[points.length - 1];
    for (const point of points)
    {
        const idx = vertices.length / 3;
        vertices.push(
            prev.x, prev.y, extrudeThickness / 2,
            prev.x, prev.y, extrudeThickness / -2,
            point.x, point.y, extrudeThickness / 2,
            point.x, point.y, extrudeThickness / -2,
        );

        const normal = point.clone().sub(prev).normalize();
        const x = normal.x;
        normal.x = -normal.y;
        normal.y = x;
        prev = point;

        normals.push(normal.x, normal.y, 0);
        normals.push(normal.x, normal.y, 0);
        normals.push(normal.x, normal.y, 0);
        normals.push(normal.x, normal.y, 0);

        triangles.push(idx, idx + 3, idx + 1, idx, idx + 2, idx + 3);
    }

    return { vertices: new Float32Array(vertices), triangles: new Uint32Array(triangles), normals: new Float32Array(normals) };
}

function FlatShade(geometry: Geometry)
{
    // separates all triangles, and calculates flat normals

    const { vertices, triangles, normals } = geometry;

    const newVertices: number[] = [];
    const newTriangles: number[] = [];
    const newNormals: number[] = [];

    const tmpVec3_0 = NewVector3();
    const tmpVec3_1 = NewVector3();
    const tmpVec3_2 = NewVector3();

    for (let i = 0; i < triangles.length; i += 3)
    {
        const idx0 = triangles[i] * 3;
        const idx1 = triangles[i + 1] * 3;
        const idx2 = triangles[i + 2] * 3;

        tmpVec3_0.set(vertices.subarray(idx0, idx0 + 3));
        tmpVec3_1.set(vertices.subarray(idx1, idx1 + 3));
        tmpVec3_2.set(vertices.subarray(idx2, idx2 + 3));
        newVertices.push(...tmpVec3_0, ...tmpVec3_1, ...tmpVec3_2);
        newTriangles.push(i, i + 1, i + 2);

        tmpVec3_1.sub(tmpVec3_0);
        tmpVec3_2.sub(tmpVec3_0);
        tmpVec3_0.crossVectors(tmpVec3_1, tmpVec3_2).normalize();

        newNormals.push(...tmpVec3_0, ...tmpVec3_0, ...tmpVec3_0);
    }

    geometry.vertices = new Float32Array(newVertices);
    geometry.triangles = new Uint32Array(newTriangles);
    geometry.normals = new Float32Array(newNormals);
    return geometry;
}











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

function AttachAudioListener(node: SceneNode)
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

function AttachAudioSource(node: SceneNode)
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











// scenegraph/scene.ts


const tmpTransformMatrix_scene_ts = NewMatrix4x4();
const tmpVec3_0 = NewVector3()
const tmpVec3_1 = NewVector3()

const enum RenderMode
{
    Normal, Shadow
}

interface ViewMatrices
{
    viewMatrix: Matrix4x4;
    viewProjectionMatrix: Matrix4x4;
    cameraPosition: Vector3;
}

type OnUpdateCallback = (node: SceneNode) => (unknown | false); // the callback can return false to remove itself
const fixedDeltaTime = 1 / 60;
let accumulatedFixedDeltaTime = fixedDeltaTime / 2;

class SceneNode
{
    public children = new Set<SceneNode>();
    protected parent: SceneNode | null = null;
    public transform = new Transform();
    public onUpdate: OnUpdateCallback[] = [];
    public onFixedUpdate: OnUpdateCallback[] = [];
    public onAfterRender: OnUpdateCallback[] = [];

    public visible = true;
    public renderOrder = 0;
    public transparent = false;

    //// Hierarchy

    public add(...nodes: SceneNode[])
    {
        nodes.forEach(n =>
        {
            this.children.add(n);
            n.parent = this;
        });
    }

    public remove(node: SceneNode)
    {
        this.children.delete(node);
        node.parent = null;
    }

    public setParent(parent?: SceneNode)
    {
        this.parent?.remove(this);
        parent?.add(this);
    }

    public traverse(callback: (node: SceneNode) => void)
    {
        (function traverseInner(node: SceneNode)
        {
            callback(node);
            node.children.forEach(traverseInner);
        })(this);
    }

    //// Transforms

    public localToWorldMatrix(): Matrix4x4
    {
        const mat = this.transform.matrix();
        return this.parent?.localToWorldMatrix().clone().multiply(mat) ?? mat.clone();
    }

    public worldToLocalMatrix(): Matrix4x4
    {
        // TODO: test this to make sure this is correct
        // seems to work without parents, but not tested with parents
        const mat = this.transform.matrixInverse();
        return this.parent?.worldToLocalMatrix().clone().preMultiply(mat) ?? mat.clone();
    }

    public get worldPosition()
    {
        return this.transformPoint(NewVector3());
    }

    public get worldRotation()
    {
        const rot = NewQuaternion();
        let node: SceneNode | null = this;
        while (node !== null)
        {
            // TODO: this might be premultiply
            rot.multiply(node.transform.rotation);
            node = node.parent;
        }

        return rot;
    }

    public transformPoint = (point: Vector3) => point.applyMatrix4x4(this.localToWorldMatrix());
    public transformDirection = (dir: Vector3) => dir.applyQuaternion(this.worldRotation).normalize();

    public get dirs()
    {
        const worldRot = this.worldRotation;

        return {
            right: NewVector3(1, 0, 0).applyQuaternion(worldRot).normalize(),
            up: NewVector3(0, 1, 0).applyQuaternion(worldRot).normalize(),
            forward: NewVector3(0, 0, -1).applyQuaternion(worldRot).normalize(),
        };
    }

    //// Render

    public render(_mode: RenderMode, _viewMatrices: ViewMatrices, _worldMatrix: Matrix4x4, _light: DirectionalLight) { }

    //// Misc

    public dispose()
    {
        this.setParent();
        this.onUpdate = [];
        this.onFixedUpdate = [];
        this.onAfterRender = [];

        this.children.forEach(child => child.dispose());
    }
}

interface ProjectionParams
{
    // assuming top === -bottom, and right === -left
    top: number;
    right: number;
    near: number;
    isPerspective: boolean;
}

class Camera extends SceneNode
{
    public projectionMatrix = NewMatrix4x4();
    public projectionParams: ProjectionParams | null = null;

    public setProjectionMatrixPerspecive(fov = 75, aspect = 1, near = 0.01, far = 100)
    {
        //                          to radian, x0.5
        const top = near * tan(0.00872664626 * fov);
        const height = 2 * top;
        const width = aspect * height;
        const right = width / 2;
        this.projectionMatrix.makePerspective(right - width, right, top, top - height, near, far);
        this.projectionParams = { top, right, near, isPerspective: true };
    }

    public setProjectionMatrixOrthographic(width = 4, height = 4, near = 0.01, far = 100)
    {
        const right = width / 2;
        const top = height / 2;
        this.projectionMatrix.makeOrthographic(-right, right, top, -top, near, far);
        this.projectionParams = { top, right, near, isPerspective: false };
    }

    public getLocalRay(screenX: number, screenY: number): Ray
    {
        // 1 +---------+
        //   |         |
        //   |         |
        // 0 +---------+
        //   0         1

        const p = this.projectionParams!;
        const x = Lerp(-p.right, p.right, screenX);
        const y = Lerp(-p.top, p.top, screenY);
        const z = -p.near;
        const v = NewVector3(x, y, z);
        return p.isPerspective
            ? new Ray(NewVector3(), v.normalize())
            : new Ray(v, NewVector3(0, 0, -1));
    }

    public getWorldRay(screenX: number, screenY: number)
    {
        const localRay = this.getLocalRay(screenX, screenY);
        this.transformPoint(localRay.origin);
        this.transformDirection(localRay.direction);
        return localRay;
    }

    public getWorldRayFromMouseEvent(ev: MouseEvent)
    {
        return this.getWorldRay(ev.clientX / window.innerWidth, 1 - ev.clientY / window.innerHeight);
    }

    public getScreenPosition(worldPosition: Vector3, target: Vector3)
    {
        return target.copyFrom(worldPosition).applyMatrix4x4(Scene.lastViewProjectionMatrix);
    }
}

class DirectionalLight extends Camera
{
    public depthFrameBuffer: WebGLFramebuffer;
    public depthTexture: WebGLTexture;
    public depthMVP = NewMatrix4x4();
    public resolution: number;
    public worldMatLocation: WebGLUniformLocation;
    public target = NewVector3();

    constructor(size: number)
    {
        super();

        this.resolution = min(gl_getParameter(gl_MAX_TEXTURE_SIZE), 2048);

        const near = -100;
        const far = 500;
        this.setProjectionMatrixOrthographic(size, size, near, far);

        this.depthFrameBuffer = gl_createFramebuffer()!;
        this.depthTexture = gl_createTexture()!;

        gl_bindTexture(gl_TEXTURE_2D, this.depthTexture);
        // use DEPTH_STENCIL for higher depth precision
        gl_texImage2D(gl_TEXTURE_2D, 0, gl_DEPTH24_STENCIL8, this.resolution, this.resolution, 0, gl_DEPTH_STENCIL, gl_UNSIGNED_INT_24_8, null);
        gl_texParameteri(gl_TEXTURE_2D, gl_TEXTURE_MIN_FILTER, gl_LINEAR);
        gl_texParameteri(gl_TEXTURE_2D, gl_TEXTURE_MAG_FILTER, gl_LINEAR);
        gl_texParameteri(gl_TEXTURE_2D, gl_TEXTURE_COMPARE_MODE, gl_COMPARE_REF_TO_TEXTURE);
        gl_bindFramebuffer(gl_FRAMEBUFFER, this.depthFrameBuffer);
        gl_framebufferTexture2D(gl_FRAMEBUFFER, gl_DEPTH_STENCIL_ATTACHMENT, gl_TEXTURE_2D, this.depthTexture, 0);

        this.worldMatLocation = GetOrCreateShadowProgram().uniformLocations.get("worldMat")!;
    }

    public prepare(camera: Camera, centerDistanceFromCamera: number)
    {
        const lightDirection = this.transform.position.clone().sub(this.target).normalize();

        // for the 2023 game, it's better to have the shadow center at a fixed position
        // so don't move the shadow with the camera
        const frustumCenter = NewVector3();

        // const frustumCenter = NewVector3(0, 0, -centerDistanceFromCamera).applyMatrix4x4(camera.localToWorldMatrix());
        const lightView = NewMatrix4x4().lookAt(frustumCenter.clone().add(lightDirection), frustumCenter, NewVector3(0, 1, 0));

        this.depthMVP.copy(this.projectionMatrix).multiply(lightView);
        const shadowProgram = GetOrCreateShadowProgram();
        gl_useProgram(shadowProgram.program);
        gl_uniformMatrix4fv(shadowProgram.uniformLocations.get("depthMVP")!, false, this.depthMVP);
    }
}

const matrixPool: Matrix4x4[] = [];

class Scene extends SceneNode
{
    public light: DirectionalLight;
    public clearColor = NewVector3();

    public static deltaTime = 0.01;
    public static now = 0;
    public static lastViewProjectionMatrix = NewMatrix4x4();

    constructor()
    {
        super();

        gl_enable(gl_DEPTH_TEST);
        gl_depthFunc(gl_LEQUAL);
        gl_enable(gl_CULL_FACE);
        gl_cullFace(gl_BACK);

        this.light = new DirectionalLight(250);
        this.light.transform.position.setValues(0, 1, 1);

        Scene.now = performance.now() / 1000;
    }

    public updateScene(now: number)
    {
        Scene.deltaTime = now - Scene.now;
        Scene.now = now;

        accumulatedFixedDeltaTime += Scene.deltaTime;
        let fixedUpdateCount = floor(accumulatedFixedDeltaTime / fixedDeltaTime);
        accumulatedFixedDeltaTime -= fixedDeltaTime * fixedUpdateCount;

        // limit fixed update count, so there won't be thousands of fixed updates
        // if the page becomes inactive for a longer time, then activated
        fixedUpdateCount = min(fixedUpdateCount, 10);

        this.traverse(node =>
        {
            node.onUpdate = node.onUpdate.filter(callback => callback(node) !== false);

            for (let i = 0; i < fixedUpdateCount; ++i)
            {
                node.onFixedUpdate = node.onFixedUpdate.filter(callback => callback(node) !== false);
            }
        });
    }

    public renderScene(camera: Camera)
    {
        const { light, clearColor } = this;

        // shadow maps first
        gl_viewport(0, 0, light.resolution, light.resolution);
        // gl_cullFace(gl_FRONT);
        gl_bindFramebuffer(gl_FRAMEBUFFER, light.depthFrameBuffer);
        gl_clear(gl_DEPTH_BUFFER_BIT);
        light.prepare(camera, 35);
        this.renderSceneInternal(light, RenderMode.Shadow, light);
        gl_bindFramebuffer(gl_FRAMEBUFFER, null);
        // gl_cullFace(gl_BACK);

        // normal render
        gl_viewport(0, 0, globalCanvas.width, globalCanvas.height);
        gl_clearColor(clearColor.x, clearColor.y, clearColor.z, 1);
        gl_clear(gl_COLOR_BUFFER_BIT | gl_DEPTH_BUFFER_BIT);
        this.renderSceneInternal(camera, RenderMode.Normal, light);

        this.traverse(node =>
        {
            node.onAfterRender = node.onAfterRender.filter(callback => callback(node) !== false);
        });
    }

    private renderSceneInternal(camera: Camera, mode: RenderMode, light: DirectionalLight)
    {
        const viewMatrix = camera.worldToLocalMatrix();
        const cameraWorldPos = camera.worldPosition;
        const cameraWorldForward = camera.dirs.forward;
        const viewProjectionMatrix = Scene.lastViewProjectionMatrix.copy(camera.projectionMatrix).multiply(viewMatrix);

        const viewMatrices: ViewMatrices = { viewMatrix, viewProjectionMatrix, cameraPosition: cameraWorldPos };

        interface RenderData
        {
            node: SceneNode;
            worldMatrix: Matrix4x4;
            distanceFromCamera: number;
        }

        const distanceFn = camera.projectionParams!.isPerspective
            ? (worldPos: Vector3) => cameraWorldPos.distanceSqr(worldPos)
            : (worldPos: Vector3) => cameraWorldForward.dot(tmpVec3_0.copyFrom(worldPos).sub(cameraWorldPos));

        const renderData: RenderData[] = [];

        const visitNode = (node: SceneNode, worldMatrix: Matrix4x4) =>
        {
            if (!node.visible)
            {
                return;
            }

            const tmpMatrix = matrixPool.pop() ?? NewMatrix4x4();
            const currentWorldMatrix = tmpMatrix.multiplyMatrices(worldMatrix, node.transform.matrix(tmpTransformMatrix_scene_ts));
            const worldPos = tmpVec3_1.setScalar(0).applyMatrix4x4(currentWorldMatrix);
            renderData.push({ node, worldMatrix: currentWorldMatrix, distanceFromCamera: distanceFn(worldPos) });

            node.children.forEach(c => visitNode(c, currentWorldMatrix));
        };

        visitNode(this, this.localToWorldMatrix());

        renderData.sort((a, b) =>
        {
            const multiplier = a.node.transparent ? 1 : -1;
            if (a.node.transparent !== b.node.transparent)
            {
                // different transparency, always render opaque first
                return multiplier;
            }

            if (a.node.renderOrder !== b.node.renderOrder)
            {
                // different render order, render the node with the lower render order first
                return a.node.renderOrder - b.node.renderOrder;
            }

            // transparency and render order is the same, sort by distance
            // for opaque, render near -> far
            // for transparent, render far -> near
            return (b.distanceFromCamera - a.distanceFromCamera) * multiplier;
        });

        renderData.forEach(({ node, worldMatrix }) =>
        {
            node.render(mode, viewMatrices, worldMatrix, light);
            matrixPool.push(worldMatrix);
        });
    }
}












// scenegraph/renderable.ts

interface GeometryData
{
    vao: WebGLVertexArrayObject;
    vertexBuffer: WebGLBuffer;
    indexBuffer: WebGLBuffer;
    triangleCount: number;
    useCount: number;
}

const geometryMap = new Map<Geometry, GeometryData>();

class Renderable extends SceneNode
{
    public vao: WebGLVertexArrayObject;
    public triangleCount: number;

    private vertexBuffer: WebGLBuffer;
    private indexBuffer: WebGLBuffer;

    private geometry: Geometry;

    constructor(geometry: Geometry, positionLoc: number, normalLoc?: number)
    {
        super();
        this.geometry = geometry;

        const data = geometryMap.get(geometry);
        if (data !== undefined)
        {
            this.vao = data.vao;
            this.vertexBuffer = data.vertexBuffer;
            this.indexBuffer = data.indexBuffer;
            ++data.useCount;
        }
        else
        {
            this.vao = gl_createVertexArray()!;
            gl_bindVertexArray(this.vao);

            // setup buffers

            this.vertexBuffer = gl_createBuffer()!;
            gl_bindBuffer(gl_ARRAY_BUFFER, this.vertexBuffer);
            gl_bufferData(gl_ARRAY_BUFFER, geometry.vertices, gl_STATIC_DRAW);
            gl_enableVertexAttribArray(positionLoc);
            gl_vertexAttribPointer(positionLoc, 3, gl_FLOAT, false, 0, 0);

            this.indexBuffer = gl_createBuffer()!;
            gl_bindBuffer(gl_ELEMENT_ARRAY_BUFFER, this.indexBuffer);
            gl_bufferData(gl_ELEMENT_ARRAY_BUFFER, geometry.triangles, gl_STATIC_DRAW);

            if (geometry.normals && normalLoc !== undefined)
            {
                const normalBuffer = gl_createBuffer()!;
                gl_bindBuffer(gl_ARRAY_BUFFER, normalBuffer);
                gl_bufferData(gl_ARRAY_BUFFER, geometry.normals, gl_STATIC_DRAW);
                gl_enableVertexAttribArray(normalLoc);
                gl_vertexAttribPointer(normalLoc, 3, gl_FLOAT, true, 0, 0);
            }

            gl_bindVertexArray(null);

            geometryMap.set(geometry, {
                vao: this.vao,
                vertexBuffer: this.vertexBuffer,
                indexBuffer: this.indexBuffer,
                triangleCount: geometry.triangles.length,
                useCount: 1
            });
        }

        this.triangleCount = geometry.triangles.length;
    }

    public dispose()
    {
        const data = geometryMap.get(this.geometry);
        if (data && --data.useCount === 0)
        {
            gl_deleteBuffer(data.vertexBuffer);
            gl_deleteBuffer(data.indexBuffer);
            geometryMap.delete(this.geometry);
        }

        super.dispose();
    }
}














// scenegraph/mesh.ts



const tmpWorldViewMatrix = NewMatrix4x4();
const tmpWorldViewProjectionMatrix = NewMatrix4x4();
const tmpWorldViewNormalMatrix = NewMatrix3x3();
const tmpWorldNormalMatrix = NewMatrix3x3();
const tmpTransformMatrix_mesh_ts = NewMatrix4x4();
const tmpVec3 = NewVector3();

class Mesh extends Renderable
{
    private program: WebGLProgram;
    private shadowProgram: WebGLProgram;
    private uniforms: Map<string, WebGLUniformLocation>;
    public material: Material;
    private textures = new Map<number, WebGLTexture>();
    public castShadows = true;
    public receiveShadows = true;
    public cull: number | null = gl_BACK;

    constructor(geometry: Geometry, material: Material)
    {
        const positionLoc = 0;  // from shader
        const normalLoc = 1;    // same

        super(geometry, positionLoc, normalLoc);

        const { program, uniformLocations } = GetOrCreateStandardMaterial();
        this.program = program;
        this.uniforms = uniformLocations;

        gl_useProgram(program);

        this.material = { ...material };

        // shadows
        this.shadowProgram = GetOrCreateShadowProgram().program;
    }

    private prepareMaterial()
    {
        const { uniforms, material } = this;

        gl_uniform1i(uniforms.get("isUnlit")!, (material.unlit ?? false) ? 1 : 0)

        gl_uniform1i(uniforms.get("albedo")!, 0);
        gl_uniform1i(uniforms.get("normalMap")!, 1);
        gl_uniform1i(uniforms.get("roughnessMap")!, 2);

        gl_uniform1i(uniforms.get("hasAlbedo")!, 0);
        gl_uniform1i(uniforms.get("hasNormalMap")!, 0);
        gl_uniform1i(uniforms.get("hasRoughnessMap")!, 0);

        gl_uniform1f(uniforms.get("sharpness")!, 1);
        gl_uniform3f(uniforms.get("scale")!, 1, 1, 1);
        gl_uniform3f(uniforms.get("offset")!, 0, 0, 0);
        gl_uniform1f(uniforms.get("lightIntensity")!, 0.5);
        gl_uniform1i(uniforms.get("enableShadows")!, this.receiveShadows ? 1 : 0);

        for (let i = 0; i < 8; ++i)
        {
            gl_activeTexture(gl_TEXTURE0 + i);
            gl_bindTexture(gl_TEXTURE_2D, null);
        }

        if (material)
        {
            gl_uniform4f(uniforms.get("baseColor")!, material.r, material.g, material.b, material.a);
            gl_uniform1f(uniforms.get("metallic")!, material.metallic ?? 0);

            const coeff = 0.2;
            const eps = 1e-5;
            const roughness = 1.0 + coeff - coeff / Clamp(material.roughness ?? 0.5, eps, 1.0 - eps);

            gl_uniform1f(uniforms.get("roughness")!, roughness);

            gl_uniform1f(uniforms.get("sharpness")!, material.textureBlendSharpness ?? 1);
            material.textureScale && gl_uniform3fv(uniforms.get("scale")!, material.textureScale);
            material.textureOffset && gl_uniform3fv(uniforms.get("offset")!, material.textureOffset);

            for (const [slot, tex] of this.textures)
            {
                gl_activeTexture(gl_TEXTURE0 + slot);
                gl_bindTexture(gl_TEXTURE_2D, tex);
                gl_uniform1i(uniforms.get(["hasAlbedo", "hasNormalMap", "hasRoughnessMap"][slot])!, tex ? 1 : 0);
            }
        }

        if (this.cull !== null)
        {
            gl_enable(gl_CULL_FACE);
            gl_cullFace(this.cull);
        }
        else
        {
            gl_disable(gl_CULL_FACE);
        }

        if (this.transparent)
        {
            gl_enable(gl_BLEND);
            gl_blendFunc(gl_SRC_ALPHA, gl_ONE_MINUS_SRC_ALPHA);
        }
        else
        {
            gl_disable(gl_BLEND);
        }
    }

    public setTexture(slot: MeshTextureSlot, tex: WebGLTexture | null)
    {
        if (tex)
        {
            this.textures.set(slot, tex);
        }
        else
        {
            this.textures.delete(slot);
        }
    }

    public setTextures(textures: TextureCollection)
    {
        this.setTexture(MeshTextureSlot.Albedo, textures.albedo);
        this.setTexture(MeshTextureSlot.Normal, textures.normalMap);
        this.setTexture(MeshTextureSlot.Roughness, textures.roughness);
    }

    public render(mode: RenderMode, viewMatrices: ViewMatrices, worldMatrix: Matrix4x4, light: DirectionalLight)
    {
        if (mode === RenderMode.Shadow && !this.castShadows)
        {
            return;
        }

        const { uniforms } = this;
        const { viewMatrix, viewProjectionMatrix } = viewMatrices;

        gl_useProgram(mode === RenderMode.Normal ? this.program : this.shadowProgram);
        gl_bindVertexArray(this.vao);

        if (mode === RenderMode.Normal)
        {
            const worldViewMatrix = tmpWorldViewMatrix.copy(viewMatrix).multiply(worldMatrix);
            const worldViewProjectionMatrix = tmpWorldViewProjectionMatrix.copy(viewProjectionMatrix).multiply(worldMatrix);
            const worldViewNormalMatrix = worldViewMatrix.topLeft3x3(tmpWorldViewNormalMatrix).invert() /* .transpose() */;
            const worldNormalMatrix = worldMatrix.topLeft3x3(tmpWorldNormalMatrix).invert() /* .transpose() */;

            gl_uniformMatrix4fv(uniforms.get("worldViewMat")!, false, worldViewMatrix);
            gl_uniformMatrix4fv(uniforms.get("worldViewProjMat")!, false, worldViewProjectionMatrix);
            gl_uniformMatrix3fv(uniforms.get("worldViewNormalMat")!, true, worldViewNormalMatrix);
            gl_uniformMatrix4fv(uniforms.get("worldMat")!, false, worldMatrix);
            gl_uniformMatrix3fv(uniforms.get("worldNormalMat")!, true, worldNormalMatrix);
            gl_uniform3fv(uniforms.get("lightPos")!,
                tmpVec3
                    .copyFrom(light.transform.position)
                    .add(viewMatrices.cameraPosition)
                    .applyMatrix4x4(light.transform.matrix(tmpTransformMatrix_mesh_ts).preMultiply(viewMatrix))
                    .normalize()
            );
            gl_uniform3fv(uniforms.get("lightPosWorld")!, tmpVec3.copyFrom(light.transform.position).normalize());

            this.prepareMaterial();

            gl_activeTexture(gl_TEXTURE0 + 3);
            gl_bindTexture(gl_TEXTURE_2D, light.depthTexture);

            gl_uniformMatrix4fv(uniforms.get("shadowMVP")!, false, light.depthMVP);

            gl_depthMask(!this.transparent);
        }
        else
        {
            gl_activeTexture(gl_TEXTURE0);
            gl_bindTexture(gl_TEXTURE_2D, null);
            gl_uniformMatrix4fv(light.worldMatLocation, false, worldMatrix);
            gl_depthMask(true);
        }

        gl_drawElements(gl_TRIANGLES, this.triangleCount, gl_UNSIGNED_INT, 0);

        gl_bindVertexArray(null);
        gl_depthMask(true); // re-enable depth write so it doesn't mess up other stuff
    }
}

const enum MeshTextureSlot
{
    Albedo = 0,
    Normal = 1,
    Roughness = 2
}











// scenegraph/camera-control.ts

const mouseToScreenPercent = (speed: number, mouseDelta: number) => mouseDelta * speed / window.innerHeight;

class CameraControl extends SceneNode
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










// texture-generator/texture-collection.ts

interface TextureCollection
{
    albedo: WebGLTexture;
    normalMap: WebGLTexture;
    roughness: WebGLTexture;
}









// texture-generator/normal-map.ts

function GenerateNormalMap(heightMap: Float32Array, width: number, height: number, intensity = 1, flipY = false, pixels?: Float32Array)
{
    pixels ??= new Float32Array(width * height * 4);
    const yDirection = flipY ? -1.0 : 1.0;

    function GetPixel(x: number, y: number)
    {
        return heightMap[(width * Clamp(y, 0, height - 1) + Clamp(x, 0, width - 1)) * 4];
    }

    for (let j = 0; j < height; ++j)
    {
        for (let i = 0; i < width; ++i)
        {
            const p0 = GetPixel(i - 1, j + 1);
            const p1 = GetPixel(i, j + 1);
            const p2 = GetPixel(i + 1, j + 1);
            const p3 = GetPixel(i - 1, j);
            const p5 = GetPixel(i + 1, j);
            const p6 = GetPixel(i - 1, j - 1);
            const p7 = GetPixel(i, j - 1);
            const p8 = GetPixel(i + 1, j - 1);

            let normalX = intensity * (p0 - p2 - 2 * (p5 - p3) - p8 + p6);
            let normalY = intensity * (p0 - p6 - 2 * (p7 - p1) - p8 + p2) * yDirection;
            let normalZ = 1;

            const len = hypot(normalX, normalY, normalZ);
            normalX /= len;
            normalY /= len;
            normalZ /= len;

            // map from [-1, 1] to [0, 255]
            const idx = width * j + i;
            pixels[idx * 4 + 0] = (normalX + 1) / 2;
            pixels[idx * 4 + 1] = (normalY + 1) / 2;
            pixels[idx * 4 + 2] = (normalZ + 1) / 2;
            pixels[idx * 4 + 3] = 1;
        }
    }

    return pixels;
}

function NormalMapShader(intensity: number, invert = false)
{
    intensity = invert ? -intensity : intensity;
    return `
const vec3 off = vec3(-1, 1, 0);

float top = texture(t0, vPixelCoord + pixelSize * off.zy).x;
float bottom = texture(t0, vPixelCoord + pixelSize * off.zx).x;
float left = texture(t0, vPixelCoord + pixelSize * off.xz).x;
float right = texture(t0, vPixelCoord + pixelSize * off.yz).x;

vec3 normal = vec3(float(${intensity}) * (left - right), float(${intensity}) * (bottom - top), pixelSize.y * 100.0);
outColor = vec4(normalize(normal) * 0.5 + 0.5, 1);
`;
}












// texture-generator/noise/fbm.ts


// https://iquilezles.org/www/articles/fbm/fbm.htm
// https://www.shadertoy.com/view/XdXGW8

const FBM = `
vec2 grad(ivec2 z)  // replace this anything that returns a random vector
{
    // 2D to 1D (feel free to replace by some other)
    int n = z.x + z.y * 11111;

    // Hugo Elias hash (feel free to replace by another one)
    n = (n << 13) ^ n;
    n = (n * (n * n * 15731 + 789221) + 1376312589) >> 16;

    // simple random vectors
    return vec2(cos(float(n)), sin(float(n)));
}

float noise(vec2 p)
{
    ivec2 i = ivec2(floor(p));
    vec2 f = fract(p);

    vec2 u = f * f * (3.0 - 2.0 * f); // feel free to replace by a quintic smoothstep instead
    ivec2 oi = ivec2(0, 1);
    vec2 of = vec2(oi);

    return mix(mix(dot(grad(i + oi.xx), f - of.xx),
                   dot(grad(i + oi.yx), f - of.yx), u.x),
               mix(dot(grad(i + oi.xy), f - of.xy),
                   dot(grad(i + oi.yy), f - of.yy), u.x), u.y)
        * 0.5 + 0.5;
}

float fbm(vec2 p, int numOctaves, float scale, float lacunarity)
{
    float t = 0.0;
    float z = 1.0;
    for (int i = 0; i < numOctaves; ++i)
    {
        z *= 0.5;
        t += z * noise(p * scale);
        p = p * lacunarity;
    }

    return t / (1.0 - z);
}
`;










// texture-generator/noise/voronoi.ts

// https://iquilezles.org/www/articles/smoothvoronoi/smoothvoronoi.htm

// yzw - cell color, x - distance to cell
const Voronoi = `
vec4 voronoi(vec2 x, float w)
{
    vec2 n = floor(x);
    vec2 f = fract(x);

    vec4 m = vec4(8.0, 0.0, 0.0, 0.0);
    for (int j = -2; j <= 2; ++j)
    for (int i = -2; i <= 2; ++i)
    {
        vec2 g = vec2(i, j);
        vec2 o = hash2(n + g);

        // distance to cell
        float d = length(g - f + o);

        // cell color
        vec3 col = 0.5 + 0.5 * sin(hash1(dot(n + g, vec2(7.0, 113.0))) * 2.5 + 3.5 + vec3(2.0, 3.0, 0.0));
        // in linear space
        col = col * col;

        // do the smooth min for colors and distances
        float h = smoothstep(0.0, 1.0, 0.5 + 0.5 * (m.x - d) / w);
        m.x = mix(m.x, d, h) - h * (1.0 - h) * w / (1.0 + 3.0 * w); // distance
        m.yzw = mix(m.yzw, col, h) - h * (1.0 - h) * w / (1.0 + 3.0 * w); // color
    }

    return m;
}
`;

// x - cell color, y - distance to cell
const VoronoiGrayscale = `
vec2 voronoi(vec2 x, float w)
{
    vec2 n = floor(x);
    vec2 f = fract(x);

    vec2 m = vec2(0.0, 8.0);
    for (int j = -2; j <= 2; ++j)
    for (int i = -2; i <= 2; ++i)
    {
        vec2 g = vec2(i, j);
        vec2 o = hash2(n + g);

        // distance to cell
        float d = length(g - f + o);

        // cell color
        float col = 0.5 + 0.5 * sin(hash1(dot(n + g, vec2(7.0, 113.0))) * 2.5 + 5.0);

        // do the smooth min for colors and distances
        float h = smoothstep(0.0, 1.0, 0.5 + 0.5 * (m.y - d) / w);
        m.y = mix(m.y, d, h) - h * (1.0 - h) * w / (1.0 + 3.0 * w); // distance
        m.x = mix(m.x, col, h) - h * (1.0 - h) * w / (1.0 + 3.0 * w); // color
    }

    return m;
}
`;

// https://www.iquilezles.org/www/articles/voronoilines/voronoilines.htm
const VoronoiDistance = `
float voronoiDistance(vec2 x)
{
    vec2 p = floor(x);
    vec2 f = fract(x);

    vec2 mb;
    vec2 mr;

    float res = 8.0;
    for (int j = -1; j <= 1; ++j)
    for (int i = -1; i <= 1; ++i)
    {
        vec2 b = vec2(i, j);
        vec2 r = b + hash2(p + b) - f;
        float d = dot(r, r);

        if (d < res)
        {
            res = d;
            mr = r;
            mb = b;
        }
    }

    res = 8.0;
    for (int j = -2; j <= 2; ++j)
    for (int i = -2; i <= 2; ++i)
    {
        vec2 b = mb + vec2(i, j);
        vec2 r = b + hash2(p + b) - f;
        float d = dot(0.5 * (mr + r), normalize(r - mr));

        res = min(res, d);
    }

    return res;
}
`;











// texture-generator/impl/brick.ts

function BrickTexture(w: number, h: number,
    rowCount = 4, // or voronoi scale for voronoi mode
    colCount = 2,
    mortarSize = 0.03,
    rowOffset = 0.5, // (colCount + 1) * rowCount should be an integer for nice repeating pattern
    noiseScale0 = 0.05,
    noiseScale1 = 0.2,
    noiseFrequency = 1,
    edgeThickness = 0.1,
    voronoiPattern = false,
    minRoughness = 0.5, maxRoughness = 1.0,
    baseColor: [number, number, number] = [0.3, 0.22, 0.07],
    mortarColor: [number, number, number] = [0.8, 0.75, 0.7],
    normalIntensity = 0.5): TextureCollection
{
    const rowHeight = 1 / rowCount;
    const colWidth = 1 / colCount;
    const invAspect = rowHeight / colWidth;

    const shader = (isAlbedo: boolean) => `

vec2 getNoise(vec2 coord)
{
    coord *= float(float(${noiseFrequency}));
    return vec2(fbm(coord, 5, 10.0, 2.0), fbm(coord + vec2(1.23, 4.56), 5, 10.0, 2.0));
}

float getVoronoi(vec2 coord)
{
    return voronoiDistance(coord * float(${rowCount}));
}

${edgeBlend("getNoise", 0.2, "vec2", "getSeamlessNoise")}
${edgeBlend("getVoronoi", 0.01, "float", "getSeamlessVoronoi")}

vec4 getColor(vec2 uv)
{
    vec2 coord = uv;
    vec2 noise = getSeamlessNoise(coord) - 0.5;
    coord += noise * float(${noiseScale0});

    ${voronoiPattern
            ? `float dist = smoothstep(float(${mortarSize}), float(${mortarSize + edgeThickness}), getSeamlessVoronoi(coord));`
            : `
        float rowHeight = float(${rowHeight});
        float colWidth = float(${colWidth});

        float y = coord.y / rowHeight;
        float x = coord.x / colWidth;
        float row = floor(y);

        float offsetX = row * float(${rowOffset});

        float minY = 0.5 - float(${mortarSize}) - noise.x * float(${noiseScale1});
        float maxY = minY - float(${edgeThickness});
        float minX = 0.5 - (float(${mortarSize}) - noise.y * float(${noiseScale1})) * float(${invAspect});
        float maxX = minX - float(${edgeThickness}) * float(${invAspect});

        float distanceFromEdgeY = smoothstep(minY, maxY, abs(0.5 - fract(y)));
        float distanceFromEdgeX = smoothstep(minX, maxX, abs(0.5 - fract(x + offsetX)));
        float dist = min(distanceFromEdgeX, distanceFromEdgeY);
        `
        }

    ${isAlbedo
            ? `
            dist += (noise.x + noise.y - 0.05) * 0.5;
            vec3 rgb = mix(vec3(${mortarColor.join(",")}), vec3(${baseColor.join(",")}), vec3(dist));
            return vec4(rgb, 1);`
            : `
            dist += noise.x + noise.y - 0.05;
            return vec4(vec3(remap(0.0, 1.0, float(${minRoughness}), float(${maxRoughness}), dist)), 1);`
        }
}`;

    const mainImage = `
    outColor = getColor(vPixelCoord);
    `;

    const albedo = ca.CreateTexture(w, h);
    ca.DrawWithShader([ShaderUtils, FBM, VoronoiDistance, shader(true)], mainImage, w, h, [], albedo);

    const heightMap = ca.CreateTexture(w, h);
    ca.DrawWithShader([ShaderUtils, FBM, VoronoiDistance, shader(false)], mainImage, w, h, [], heightMap);

    const normalMap = ca.CreateTexture(w, h);
    ca.DrawWithShader([], NormalMapShader(normalIntensity), w, h, [heightMap], normalMap);

    const roughness = ca.CreateTexture(w, h);
    ca.DrawWithShader([ShaderUtils], `
        // flip min and max values
        outColor = vec4(vec3(float(${minRoughness}) + float(${maxRoughness}) - texture(t0, vPixelCoord).x), 1);
        `,
        w, h, [heightMap], roughness);

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
}










// texture-generator/impl/dirt.ts

function DirtTexture(w: number, h: number,
    scale = 5,
    minRoughness = 0.5, maxRoughness = 1.0,
    baseColor: [number, number, number] = [0.3, 0.22, 0.07],
    normalIntensity = 1): TextureCollection
{
    const shader = (isAlbedo: boolean) => `
vec4 getColor(vec2 uv)
{
    vec2 coord = uv * float(${scale});
    vec2 noise = vec2(1) - vec2(fbm(coord, 5, 1.0, 2.0), fbm(coord + vec2(1.23, 4.56), 5, 1.0, 2.0));
    float voro = voronoiDistance(noise * 4.0) * 2.0;
    voro = saturate(1.0 - voro * 20.0);


    float noise2 = fbm(coord * 2.0, 3, 1.0, 2.0);
    noise2 = sharpstep(0.45, 0.52, noise2);
    float detail = saturate(1.0 - voro * noise2);


    float noise3 = remap(0.0, 1.0, 0.3, 1.0, fbm(coord * 1.5, 3, 1.0, 2.0));
    float height = detail * noise3;

    ${isAlbedo
            ? `
        vec4 albedo = colorRamp(vec4(0, 0, 0, 1), 0.08, vec4(${baseColor.join(",")}, 1), 0.67, noise3);
        albedo.rgb *= vec3(height);
        return albedo;
        `
            : `
        return vec4(vec3(remap(0.0, 1.0, float(${minRoughness}), float(${maxRoughness}), height)), 1);
        `
        }
}`;

    const mainImage = `
    outColor = edgeBlend(vPixelCoord);
    `;

    const albedo = ca.CreateTexture(w, h);
    ca.DrawWithShader([ShaderUtils, FBM, VoronoiDistance, shader(true), edgeBlend("getColor")], mainImage, w, h, [], albedo);

    const heightMap = ca.CreateTexture(w, h);
    ca.DrawWithShader([ShaderUtils, FBM, VoronoiDistance, shader(false), edgeBlend("getColor")], mainImage, w, h, [], heightMap);

    const normalMap = ca.CreateTexture(w, h);
    ca.DrawWithShader([], NormalMapShader(normalIntensity), w, h, [heightMap], normalMap);

    return {
        albedo,
        roughness: heightMap,
        normalMap
    };
}











// texture-generator/impl/metal.ts

function MetalTexture(w: number, h: number,
    scale = 5,
    minRoughness = 0.5, maxRoughness = 1.0,
    baseColor: [number, number, number] = [1, 1, 1],
    normalIntensity = 0.2): TextureCollection
{
    const shader = (isAlbedo: boolean) => `
vec4 getColor(vec2 uv)
{
    vec2 coord = uv * float(${scale});
    vec2 noise = vec2(fbm(coord, 5, 1.0, 2.0), fbm(coord + vec2(1.23, 4.56), 5, 1.0, 2.0)) * 5.0;
    float voro = sqrt(voronoi(coord * 5.0 + noise, 0.01).y) * 1.5 - noise.x;
    // voro = valueRamp(0.4, 0.3, 0.6, 0.7, voro);

    ${isAlbedo
            ? `
        vec4 albedo = colorRamp(vec4(0.0, 0.0, 0.0, 1), 0.2, vec4(1.0, 1.0, 1.0, 1), 0.8, voro) * vec4(${baseColor.join(",")}, 1);
        return vec4(${baseColor.join(",")}, 1);
        // return albedo;
        `
            : `
        return vec4(vec3(remap(0.0, 1.0, float(${minRoughness}), float(${maxRoughness}), remap(0.0, 1.0, 0.9, 1.0, voro))), 1);
        `
        }
}`;

    const mainImage = `
    outColor = edgeBlend(vPixelCoord);
    `;

    const albedo = ca.CreateTexture(w, h);
    ca.DrawWithShader([ShaderUtils, FBM, Voronoi, shader(true), edgeBlend("getColor")], mainImage, w, h, [], albedo);

    const heightMap = ca.CreateTexture(w, h);
    ca.DrawWithShader([ShaderUtils, FBM, Voronoi, shader(false), edgeBlend("getColor")], mainImage, w, h, [], heightMap);

    const normalMap = ca.CreateTexture(w, h);
    ca.DrawWithShader([], NormalMapShader(normalIntensity), w, h, [heightMap], normalMap);

    return {
        albedo,
        roughness: heightMap,
        normalMap
    };
}











// texture-generator/impl/plastic.ts

function PlasticTexture(w: number, h: number,
    scale = 5,
    minRoughness = 0.5, maxRoughness = 1.0,
    baseColor: [number, number, number] = [0.3, 0.22, 0.07],
    normalIntensity = 0.5): TextureCollection
{
    const shader = (isAlbedo: boolean) => `
vec4 getColor(vec2 uv)
{
    vec2 coord = uv * float(${scale});
    vec2 noise = vec2(fbm(coord, 5, 1.0, 2.0), fbm(coord + vec2(1.23, 4.56), 5, 1.0, 2.0));
    float voro = sqrt(voronoi(noise * 10.0, 1.0).y) * 1.5;

    ${isAlbedo
            ? `
        vec4 albedo = colorRamp(vec4(0.95, 0.95, 0.95, 1), 0.2, vec4(1.0, 1.0, 1.0, 1), 0.8, mix(voro, noise.x, 0.5)) * vec4(${baseColor.join(",")}, 1);
        return albedo;
        `
            : `
        return vec4(vec3(remap(0.0, 1.0, float(${minRoughness}), float(${maxRoughness}), saturate(valueRamp(0.4, 0.3, 0.6, 0.7, voro)) * 0.2 - noise.x * 1.0)), 1);
        `
        }
}`;

    const mainImage = `
    outColor = edgeBlend(vPixelCoord);
    `;

    const albedo = ca.CreateTexture(w, h);
    ca.DrawWithShader([ShaderUtils, FBM, VoronoiGrayscale, shader(true), edgeBlend("getColor")], mainImage, w, h, [], albedo);

    const heightMap = ca.CreateTexture(w, h);
    ca.DrawWithShader([ShaderUtils, FBM, VoronoiGrayscale, shader(false), edgeBlend("getColor")], mainImage, w, h, [], heightMap);

    const normalMap = ca.CreateTexture(w, h);
    ca.DrawWithShader([], NormalMapShader(normalIntensity), w, h, [heightMap], normalMap);

    return {
        albedo,
        roughness: heightMap,
        normalMap
    };
}











// texture-generator/impl/wood.ts

function WoodTexture(w: number, h: number,
    minRoughness = 0.5, maxRoughness = 1.0,
    color0: [number, number, number] = [0, 0, 0],
    color1: [number, number, number] = [0.55, 0.35, 0.2],
    color2: [number, number, number] = [0.75, 0.55, 0.45],
    color3: [number, number, number] = [0.75, 0.6, 0.5],
    scale = 5,
    normalIntensity = 0.5): TextureCollection
{
    const shader = (isAlbedo: boolean) => `

vec4 getColor(vec2 uv)
{
    vec2 coord = uv;
    coord.y *= 0.1;
    vec2 voronoise = voronoi(coord * float(${scale}), 1.5);
    voronoise *= vec2(10, 3);
    float noise = remap(0.1, 0.6, 0.0, 1.0, fbm(voronoise, 4, 10.0, 3.0));
    ${isAlbedo
            ? `
            vec3 color0 = vec3(${color0});
            vec3 color1 = vec3(${color1});
            vec3 color2 = vec3(${color2});
            vec3 color3 = vec3(${color3});

            vec3 rgb =
                noise < 0.65
                ? colorRamp3(color0, 0.35, color1, 0.65, noise)
                : noise < 0.85
                ? colorRamp3(color1, 0.65, color2, 0.85, noise)
                : colorRamp3(color2, 0.85, color3, 0.90, noise);

            return vec4(rgb, 1);`
            : `
            return vec4(vec3(mix(float(${minRoughness}), float(${maxRoughness}), smoothstep(0.4, 0.8, noise))), 1);`
        }
}`;

    const mainImage = `
    outColor = edgeBlend(vPixelCoord);
    `;

    const albedo = ca.CreateTexture(w, h);
    ca.DrawWithShader([ShaderUtils, FBM, VoronoiGrayscale, shader(true), edgeBlend("getColor")], mainImage, w, h, [], albedo);

    const heightMap = ca.CreateTexture(w, h);
    ca.DrawWithShader([ShaderUtils, FBM, VoronoiGrayscale, shader(false), edgeBlend("getColor")], mainImage, w, h, [], heightMap);

    const normalMap = ca.CreateTexture(w, h);
    ca.DrawWithShader([], NormalMapShader(normalIntensity), w, h, [heightMap], normalMap);

    return {
        albedo,
        roughness: heightMap,
        normalMap
    };
}










// game-2023/buildings.ts


function InitializeBuildingData()
{
    const defaultMaterial: Material = {
        r: 1,
        g: 1,
        b: 1,
        a: 1,
        metallic: 0,
        roughness: 1,
        textureScale: NewVector3(1)
    };

    const greyBrickTexture = BrickTexture(1024, 1024, 6, 3, 0.05, undefined, 0.05, 0.5, 1.1, undefined, false, undefined, undefined,
        [1, 1, 1],
        undefined,
        3);

    const woodTexture = WoodTexture(2048, 2048, undefined, undefined, undefined, undefined, undefined, undefined, 15);

    const houseRoofTexture = BrickTexture(1024, 1024, 1, 8, 0.01, 0, 0.05, 0.05, 1, 0.05, false, 0.5, 0.8, [1, 1, 1,], [1, 1, 1], 2);

    // house length = 8
    // house width = 5
    // roof max height = 5
    const houseRoofGeometry = CreateExtrudedGeometryConvex([
        0, 5,
        3, 3,
        2.5, 3,
        0, 4.66,
        -2.5, 3,
        -3, 3
    ], 8);

    const houseBaseGeometry = CreateExtrudedGeometryConvex([
        0, 4.8,
        2.4, 3.1,
        2.4, 0,
        -2.4, 0,
        -2.4, 3.1
    ], 7.5);

    const houseDoorGeometry = CreateBoxGeometry(1.2, 2.2, 0.1);
    const houseWindowGeometry = CreateBoxGeometry(0.1, 1, 0.8);

    const anvilIconGeometry = JoinGeometries(
        // need to separate into two parts for convex triangulation
        CreateExtrudedGeometryConvex([
            -1, 1,
            -1.5, 1.05,
            -2, 1.2,
            -2.5, 1.5,
            -3, 2,
            -1.2, 2,
            -1.2, 2.2,
            3, 2.2,
            3, 1.8,
            2, 1.5,
            1, 0.5,
            1, 0,
            -1, 0,
        ], 0.2),
        CreateExtrudedGeometryConvex([
            1, 0,
            1.5, -0.4,
            2, -0.8,
            2, -1,
            1, -1,
            0.5, -0.8,
            -0.5, -0.8,
            -1, -1,
            -2, -1,
            -2, -0.8,
            -1.5, -0.4,
            -1, 0,
            0, 0,
        ], 0.2),
    );

    function House(isBlacksmith: boolean)
    {
        const randAround0 = (size: number) => (random() - 0.5) * size;
        const r = 0.8 + randAround0(0.4);
        const g = 0.5 + randAround0(0.3);
        const b = 0.35 + randAround0(0.2);

        const base = new Mesh(houseBaseGeometry, defaultMaterial);
        const roof = new Mesh(houseRoofGeometry, {
            ...defaultMaterial,
            r, g, b, a: 1,
            textureScale: NewVector3(0.1, 0.3, 0.3 + randAround0(0.2)),
            textureOffset: NewVector3(0.5, 0.5, 0),
            textureBlendSharpness: 10
        });
        const door = new Mesh(houseDoorGeometry, { ...defaultMaterial, textureScale: NewVector3(0.5) });

        const windowMaterial: Material = { ...defaultMaterial, r: 0.2, g: 0.2, b: 0.2, a: 1, roughness: 0.2 };
        const window0 = new Mesh(houseWindowGeometry, windowMaterial);
        const window1 = new Mesh(houseWindowGeometry, windowMaterial);
        const window2 = new Mesh(houseWindowGeometry, windowMaterial);

        base.setTextures(greyBrickTexture);
        door.setTextures(woodTexture);
        roof.setTextures(houseRoofTexture);

        door.transform.position.setValues(0, 2.2 * 0.5, -7.5 * 0.5);
        window0.transform.position.setValues(2.4, 1.8, -2);
        window1.transform.position.setValues(2.4, 1.8, 2);
        window2.transform.position.setValues(-2.4, 1.8, 1);

        const group = new SceneNode();
        group.add(base, roof, door, window0, window1, window2);
        group.transform.rotation.setFromAxisAngle(0, 1, 0, PI / (random() < 0.5 ? -2 : 2));

        if (isBlacksmith)
        {
            base.material.r = 0.6;
            base.material.g = 0.6;
            base.material.b = 0.6;

            roof.material.r = 0.2;
            roof.material.g = 0.2;
            roof.material.b = 0.2;

            const icon = new Mesh(anvilIconGeometry, base.material);
            icon.transform.position.setValues(0, 1.5, 3.8);
            icon.transform.scale.setScalar(0.5);
            icon.material.metallic = 0.8;
            group.add(icon);
        }

        return group;
    }

    const windmillRoofTexture = PlasticTexture(1024, 1024, 10, 0.8, 1, [1, 1, 1], 5);

    const windmillHeight = 8;
    const windmillRoofHeight = 2.5;
    const windmillBaseGeometry = CreateCylinderGeometry(windmillHeight, 4, 3, 32);
    const windmillRoofGeometry = CreateCylinderGeometry(windmillRoofHeight, 3.2, 0, 32);
    const windmillBladeGeometry = (() =>
    {
        const cylinder = CreateCylinderGeometry(5, 0.2, 0.2);
        TransformGeometry(cylinder, NewMatrix4x4Compose(NewVector3(0, 0, 2), NewQuaternionFromAxisAngle(1, 0, 0, HalfPI), NewVector3(1)));

        return JoinGeometries(cylinder, CreateBoxGeometry(0.3, 12, 0.3), CreateBoxGeometry(12, 0.3, 0.3));
    })();

    const windmillFieldGeometry = (() =>
    {
        const rng = Mulberry32(1);
        const minX = -6;
        const maxX = 6;
        const minHeight = 0.8;
        const maxHeight = 1.2;
        const minZ = -20;
        const maxZ = 0;
        const minScale = 0.3;
        const maxScale = 0.6;

        const rotate = NewQuaternion();

        const count = 2000;
        const geometries: Geometry[] = [];
        for (let i = 0; i < count; ++i)
        {
            const x = Lerp(minX, maxX, rng());
            const height = Lerp(minHeight, maxHeight, rng());
            const z = Lerp(minZ, maxZ, rng());
            const scale = Lerp(minScale, maxScale, rng());
            const rotation = rng() * TwoPI;
            const tilt = rng() * 0.1;

            const box = CreateBoxGeometry(0.05, height, 0.05 * scale);
            TranslateGeometry(box, 0, height / 2, 0);
            RotateGeometry(box, rotate.setFromAxisAngle(1, 0, 0, tilt));
            RotateGeometry(box, rotate.setFromAxisAngle(0, 1, 0, rotation));
            TranslateGeometry(box, x, 0, z);
            geometries.push(box);
        }

        return JoinGeometries(...geometries);
    })();

    const windmillBladeClothGeometry = (() =>
    {
        const cloth0 = CreateBoxGeometry(1, 5, 0.01);
        const transform = NewMatrix4x4Compose(NewVector3(0.5, 3.4, 0), NewQuaternion(), NewVector3(1));
        const rotation = NewMatrix4x4Compose(NewVector3(), NewQuaternionFromAxisAngle(0, 0, 1, HalfPI), NewVector3(1));

        const cloth1 = CloneGeometry(cloth0);
        TransformGeometry(cloth0, transform);

        const cloth2 = CloneGeometry(cloth1);
        TransformGeometry(cloth1, transform.preMultiply(rotation));

        const cloth3 = CloneGeometry(cloth2);
        TransformGeometry(cloth2, transform.preMultiply(rotation));

        TransformGeometry(cloth3, transform.preMultiply(rotation));

        return JoinGeometries(cloth0, cloth1, cloth2, cloth3);
    })();

    function Windmill()
    {
        const base = new Mesh(windmillBaseGeometry, { ...defaultMaterial, textureScale: NewVector3(0.75), textureBlendSharpness: 100 });
        const roof = new Mesh(windmillRoofGeometry, { r: 0.4, g: 0.4, b: 0.4, a: 1, textureBlendSharpness: 100 });
        const blades = new Mesh(windmillBladeGeometry, defaultMaterial);
        const bladesCloth = new Mesh(windmillBladeClothGeometry, defaultMaterial);
        const door = new Mesh(houseDoorGeometry, { ...defaultMaterial, textureScale: NewVector3(0.5) });
        const field = new Mesh(windmillFieldGeometry, { r: 1, g: 0.9, b: 0, a: 1, metallic: 0, roughness: 0.9 });

        base.setTextures(greyBrickTexture);
        roof.setTextures(windmillRoofTexture);
        blades.setTextures(woodTexture);
        door.setTextures(woodTexture);

        base.transform.position.y = windmillHeight / 2;
        roof.transform.position.y = windmillHeight + windmillRoofHeight / 2;
        door.transform.position.setValues(3.85, 2.2 * 0.5, 0);
        door.transform.rotation.setFromAxisAngle(0, 1, 0, HalfPI).multiply(NewQuaternionFromAxisAngle(1, 0, 0, -0.13));
        field.transform.position.z = -5;

        const bladesContainer = new SceneNode();
        bladesContainer.transform.position.setValues(0, 8.5, -4);

        bladesContainer.add(blades);
        bladesContainer.add(bladesCloth);

        const group = new SceneNode();
        group.add(base, roof, bladesContainer, door, field);

        const timeOffset = random() * HalfPI;
        bladesContainer.onUpdate.push(({ transform }) => transform.rotation.setFromAxisAngle(0, 0, 1, Scene.now * 0.1 + timeOffset));

        const pivot = new SceneNode();
        pivot.add(group);
        group.transform.position.z = 10.5;
        pivot.transform.rotation.setFromAxisAngle(0, 1, 0, HalfPI);
        return pivot;
    }

    const towerBaseHeight = 8;
    const towerTopHeight = 1;
    const towerTopRadius = 2.4;

    function CreateTowerTopSide(angle: number)
    {
        const thickness = 0.4;
        const length = 1.4;
        const height = 0.8;
        const radius = towerTopRadius - thickness / 2 - 0.08;
        const box = CreateBoxGeometry(thickness, height, length);
        RotateGeometryWithAxisAngle(box, 0, 1, 0, -angle);
        return TranslateGeometry(box, cos(angle) * radius, towerBaseHeight + towerTopHeight + height / 2, sin(angle) * radius);
    }

    const towerGeometry = JoinGeometries(
        TranslateGeometry(CreateCylinderGeometry(towerBaseHeight, 2, 2), 0, towerBaseHeight / 2, 0), // base
        FlatShade(
            TranslateGeometry(
                CreateCylinderGeometry(towerTopHeight, towerTopRadius, towerTopRadius, 12),
                0, towerBaseHeight + towerTopHeight / 2, 0
            )
        ), // top

        // sides
        ...[1, 3, 5, 7, 9, 11].map(a => CreateTowerTopSide(PI / 12 + PI / 6 * a))
    );

    function Tower()
    {
        const tower = new Mesh(towerGeometry, { r: 0.8, g: 0.8, b: 0.8, a: 1, textureScale: NewVector3(0.75), textureBlendSharpness: 100 });
        tower.setTextures(greyBrickTexture);
        return tower;
    }

    const wallHeight = 8;
    const wallLength = 50;
    const wallHalfThickness = 1;
    const wallTopExtraThickness = 0.4;

    const wallTopSpacing = 2.7;
    const GenerateWallTop = (count: number) => [...Array(count).keys()]
        .map(idx => TranslateGeometry(
            CreateBoxGeometry(1.8, 0.8, 0.4), (idx - (count - 1) / 2) * wallTopSpacing, wallHeight + 0.8 / 2, 1.4 - 0.4 / 2
        ));

    function WallBaseGeometry(length: number)
    {
        return RotateGeometryWithAxisAngle(
            CreateExtrudedGeometryConvex([
                -wallHalfThickness, wallHeight,
                wallHalfThickness + wallTopExtraThickness, wallHeight,
                wallHalfThickness + wallTopExtraThickness, wallHeight - 1,
                wallHalfThickness, wallHeight - 2,
                wallHalfThickness, 0,
                -wallHalfThickness, 0
            ], length),
            0, 1, 0, NegHalfPI
        );
    }

    const wallGeometry = JoinGeometries(
        WallBaseGeometry(wallLength),
        ...GenerateWallTop(17)
    );

    function Wall()
    {
        const wall = new Mesh(wallGeometry, { r: 0.8, g: 0.8, b: 0.8, a: 1, textureScale: NewVector3(0.75), textureBlendSharpness: 100 });
        wall.setTextures(greyBrickTexture);
        return wall;
    }

    const castleWallLength = 14;
    const halfCastleWallLength = castleWallLength / 2;
    const castleWallGeometry = JoinGeometries(
        WallBaseGeometry(castleWallLength),
        ...GenerateWallTop(5)
    );

    const topCastleWallLength = 8;
    const halfTopCastleWallLength = topCastleWallLength / 2;
    const topCastleWallGeometry = JoinGeometries(
        WallBaseGeometry(topCastleWallLength + 2.8),
        ...GenerateWallTop(3)
    );

    const transformCastleWall = (geometry: Geometry, angle: number, x: number, y: number, z: number) =>
        TranslateGeometry(
            RotateGeometryWithAxisAngle(
                CloneGeometry(geometry),
                0, 1, 0, angle
            ),
            x, y, z
        );

    const secondFloorOffset = 5;
    const bigTowerOffset = 8;
    const allCastleWallsAndTowers = JoinGeometries(
        // ground walls
        transformCastleWall(castleWallGeometry, 0 * HalfPI, 0, 0, halfCastleWallLength),
        transformCastleWall(castleWallGeometry, 1 * HalfPI, halfCastleWallLength, 0, 0),
        transformCastleWall(castleWallGeometry, 2 * HalfPI, 0, 0, -halfCastleWallLength),
        transformCastleWall(castleWallGeometry, 3 * HalfPI, -halfCastleWallLength, 0, 0),

        // ground towers
        TranslateGeometry(CloneGeometry(towerGeometry), halfCastleWallLength, 0, halfCastleWallLength),
        TranslateGeometry(CloneGeometry(towerGeometry), -halfCastleWallLength, 0, halfCastleWallLength),
        TranslateGeometry(CloneGeometry(towerGeometry), halfCastleWallLength, 0, -halfCastleWallLength),
        TranslateGeometry(CloneGeometry(towerGeometry), -halfCastleWallLength, 0, -halfCastleWallLength),

        // second floor walls
        transformCastleWall(topCastleWallGeometry, 0 * HalfPI, 0, secondFloorOffset, halfTopCastleWallLength),
        transformCastleWall(topCastleWallGeometry, 1 * HalfPI, halfTopCastleWallLength, secondFloorOffset, 0),
        transformCastleWall(topCastleWallGeometry, 2 * HalfPI, 0, secondFloorOffset, -halfTopCastleWallLength),
        transformCastleWall(topCastleWallGeometry, 3 * HalfPI, -halfTopCastleWallLength, secondFloorOffset, 0),


        // second floor towers
        TranslateGeometry(CloneGeometry(towerGeometry), halfTopCastleWallLength, secondFloorOffset, halfTopCastleWallLength),
        TranslateGeometry(CloneGeometry(towerGeometry), -halfTopCastleWallLength, secondFloorOffset, halfTopCastleWallLength),
        TranslateGeometry(CloneGeometry(towerGeometry), halfTopCastleWallLength, secondFloorOffset, -halfTopCastleWallLength),
        TranslateGeometry(CloneGeometry(towerGeometry), -halfTopCastleWallLength, secondFloorOffset, -halfTopCastleWallLength),

        // big middle tower
        TransformGeometry(CloneGeometry(towerGeometry), NewMatrix4x4Compose(NewVector3(0, bigTowerOffset, 0), NewQuaternion(), NewVector3(1.5, 1, 1.5))),

        // center fill
        TranslateGeometry(CreateBoxGeometry(castleWallLength, 2, castleWallLength), 0, wallHeight - 1, 0),

        // second floor center fill
        TranslateGeometry(CreateBoxGeometry(topCastleWallLength, 2, topCastleWallLength), 0, wallHeight + secondFloorOffset - 1, 0),
    );

    const castleRoofHeight = 3;
    const castleTopRoofHeight = 6;
    const allCastleTowerRoofs = JoinGeometries(
        TranslateGeometry(CreateCylinderGeometry(castleRoofHeight, 2.2, 0, 32), halfCastleWallLength, towerBaseHeight + towerTopHeight + castleRoofHeight / 2, halfCastleWallLength),
        TranslateGeometry(CreateCylinderGeometry(castleRoofHeight, 2.2, 0, 32), -halfCastleWallLength, towerBaseHeight + towerTopHeight + castleRoofHeight / 2, halfCastleWallLength),
        TranslateGeometry(CreateCylinderGeometry(castleRoofHeight, 2.2, 0, 32), halfCastleWallLength, towerBaseHeight + towerTopHeight + castleRoofHeight / 2, -halfCastleWallLength),
        TranslateGeometry(CreateCylinderGeometry(castleRoofHeight, 2.2, 0, 32), -halfCastleWallLength, towerBaseHeight + towerTopHeight + castleRoofHeight / 2, -halfCastleWallLength),

        TranslateGeometry(CreateCylinderGeometry(castleTopRoofHeight, 3.5, 0, 32), 0, bigTowerOffset + towerBaseHeight + towerTopHeight + castleTopRoofHeight / 2, 0),
    );

    const castleDoorGeometry = CreateExtrudedGeometryConvex([
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

    function Castle()
    {
        const group = new SceneNode();
        const walls = new Mesh(allCastleWallsAndTowers, { r: 0.6, g: 0.6, b: 0.6, a: 1, textureScale: NewVector3(0.75), textureBlendSharpness: 100 });

        const roofs = new Mesh(allCastleTowerRoofs, {
            ...defaultMaterial,
            r: 0.8, g: 0.5, b: 0.35, a: 1,
            textureScale: NewVector3(0.1, 0.3, 0.3),
            textureOffset: NewVector3(0.5, 0.5, 0),
            textureBlendSharpness: 1
        });

        const door = new Mesh(castleDoorGeometry, { r: 0.7, g: 0.7, b: 0.7, a: 1, textureScale: NewVector3(0.5) });

        walls.setTextures(greyBrickTexture);
        roofs.setTextures(windmillRoofTexture);
        door.setTextures(woodTexture);

        door.transform.position.z = castleWallLength / 2 + wallHalfThickness;

        group.add(walls);
        group.add(roofs);
        group.add(door);

        return group;
    }

    const churchTowerBaseHeight = 12;
    const churchTowerWidth = 5;
    const churchTowerRoofHeight = 5;

    const churchScaleMatrix = NewMatrix4x4Compose(NewVector3(), NewQuaternion(), NewVector3(1.5, 1.7, 2));
    const churchRoofGeometry = TransformGeometry(CloneGeometry(houseRoofGeometry), churchScaleMatrix);

    const churchTowerRoofGeometry = TranslateGeometry(
        RotateGeometryWithAxisAngle(
            FlatShade(CreateCylinderGeometry(churchTowerRoofHeight, 3.6, 0, 4)),
            0, 1, 0, HalfPI / 2
        ),
        0, churchTowerBaseHeight + churchTowerRoofHeight / 2, -10
    );

    const churchBaseGeometry = JoinGeometries(
        // main building
        TransformGeometry(CloneGeometry(houseBaseGeometry), churchScaleMatrix),

        // tower
        TranslateGeometry(CreateBoxGeometry(churchTowerWidth, churchTowerBaseHeight, churchTowerWidth), 0, churchTowerBaseHeight / 2, -10),
    );

    const churchWindowGeometry = TransformGeometry(
        CloneGeometry(castleDoorGeometry),
        NewMatrix4x4Compose(NewVector3(), NewQuaternionFromAxisAngle(0, 1, 0, HalfPI), NewVector3(0.5))
    );

    const churchCombinedWindowGeometries = JoinGeometries(
        TranslateGeometry(CloneGeometry(churchWindowGeometry), 3.6, 1.7, -3),
        TranslateGeometry(CloneGeometry(churchWindowGeometry), 3.6, 1.7, 3),
        TranslateGeometry(CloneGeometry(churchWindowGeometry), -3.6, 1.7, -3),
        TranslateGeometry(CloneGeometry(churchWindowGeometry), -3.6, 1.7, 3),
        TranslateGeometry(CloneGeometry(churchWindowGeometry), 2.5, 8, -10),
        TranslateGeometry(CloneGeometry(churchWindowGeometry), -2.5, 8, -10),
    );

    function Church()
    {
        const base = new Mesh(churchBaseGeometry, defaultMaterial);
        const roofMaterial: Material = {
            r: 0.8, g: 0.4, b: 0.3, a: 1,
            textureScale: NewVector3(0.1, 0.3, 0.3),
            textureOffset: NewVector3(0.5, 0.5, 0),
            textureBlendSharpness: 10
        };

        const roof = new Mesh(churchRoofGeometry, roofMaterial);
        const towerRoof = new Mesh(churchTowerRoofGeometry, roofMaterial);

        const windowMaterial: Material = { ...defaultMaterial, r: 0.2, g: 0.2, b: 0.2, a: 1, roughness: 0.2 };
        const windows = new Mesh(churchCombinedWindowGeometries, windowMaterial);

        base.setTextures(greyBrickTexture);
        roof.setTextures(houseRoofTexture);
        towerRoof.setTextures(windmillRoofTexture);

        const group = new SceneNode();
        group.add(base, roof, towerRoof, windows);
        group.transform.position.z += 2.5;
        const pivot = new SceneNode();
        pivot.add(group)
        pivot.transform.rotation.setFromAxisAngle(0, 1, 0, PI / (random() < 0.5 ? -2 : 2) + HalfPI);
        return pivot;
    }

    return {
        House: () => House(false),
        Blacksmith: () => House(true),
        Windmill,
        Tower,
        Wall,
        Castle,
        Church,
    };
}

const enum BuildingType
{
    House,
    Blacksmith,
    Windmill,
    Tower,
    Castle,
    Church
}
















// game-2023/audio.ts


function SwordImpactSound(target: AudioNode)
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

function BowShotSound(target: AudioNode)
{
    const when = actx.currentTime + 0.05;
    Snare(when, 0.05, target);
    Drum(0.3, when + 0.01, CreateNoiseNode(), false, 0, 0, 0.05, 0.5, 0.001, undefined, target);
}

function StartMusic()
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
















// game-2023/models.ts


//// shield

const shieldGeometry = CreateExtrudedGeometryConvex([
    0, -0.4,
    -0.3, -0.2,
    -0.3, 0.3,
    0, 0.3,
    0.3, 0.3,
    0.3, -0.2
], 0.04);

function GetVertexIndicesOfExtrudedGeometry(numPointsInPolyline: number, indexInPolyline: number)
{
    const backIndex = indexInPolyline * 2;
    const frontIndex = indexInPolyline * 2 + 1;

    const aroundStartIndex = numPointsInPolyline * 2;

    const prevIndexAround = (indexInPolyline + 1) % numPointsInPolyline;

    const around0 = aroundStartIndex + prevIndexAround * 4;
    const around1 = around0 + 1;

    const around2 = aroundStartIndex + indexInPolyline * 4 + 2;
    const around3 = around2 + 1;

    return [backIndex, frontIndex, around0, around1, around2, around3];
}

// TODO: these are constants, make sure that these are calculated at compile time in the final version
const indicesToMove = [
    ...GetVertexIndicesOfExtrudedGeometry(6, 0),
    ...GetVertexIndicesOfExtrudedGeometry(6, 3)
];

indicesToMove.forEach(idx => shieldGeometry.vertices[idx * 3 + 2] += 0.1); // move z coordinate

FlatShade(shieldGeometry);

const ShieldObject = () => new Mesh(shieldGeometry, { r: 0.5, g: 1, b: 0.5, a: 1, metallic: 0.6, roughness: 0, textureScale: NewVector3(2) });


//// sword

const swordBladeGeometry = CreateExtrudedGeometryConvex([
    0, 0.8,
    0.02, 0.75,
    0.02, 0,
    -0.02, 0,
    -0.02, 0.75
], 0.005);

const swordHandleGeometry = JoinGeometries(
    CreateBoxGeometry(0.15, 0.03, 0.03),
    TranslateGeometry(CreateCylinderGeometry(0.14, 0.015, 0.015), 0, -0.07, 0)
);

function SwordObject()
{
    const group = new SceneNode();

    const blade = new Mesh(swordBladeGeometry, { r: 4, g: 4, b: 4, a: 1, metallic: 0.8, roughness: 0.4 });
    const handle = new Mesh(swordHandleGeometry, { ...HexToColor("4d3b0c"), metallic: 0, roughness: 0.8 });

    group.add(blade);
    group.add(handle);
    return group;
}


//// bow

const bowGeometry = JoinGeometries(
    CreateCylinderGeometry(0.3, 0.02, 0.02),
    TranslateGeometry(RotateGeometryWithAxisAngle(CreateCylinderGeometry(0.3, 0.02, 0.02), 1, 0, 0, 0.5), 0, 0.27, 0.07),
    TranslateGeometry(RotateGeometryWithAxisAngle(CreateCylinderGeometry(0.3, 0.02, 0.02), 1, 0, 0, -0.5), 0, -0.27, 0.07),
);

const bowStringGeometry = TranslateGeometry(CreateCylinderGeometry(0.75, 0.005, 0.005), 0, 0, 0.14);

function BowObject()
{
    const group = new SceneNode();

    const bow = new Mesh(bowGeometry, { ...HexToColor("4d3b0c") });
    const bowString = new Mesh(bowStringGeometry, { r: 1, g: 1, b: 1, a: 1 });

    group.add(bow);
    group.add(bowString);
    return group;
}


//// tree

const treeLeavesGeometry = JoinGeometries(
    TranslateGeometry(CreateCylinderGeometry(2.3, 2.3 * 0.8, 0.02), 0, 1.4, 0),
    TranslateGeometry(CreateCylinderGeometry(2.0, 2.0 * 0.8, 0.02), 0, 2.0, 0),
    TranslateGeometry(CreateCylinderGeometry(1.7, 1.7 * 0.8, 0.02), 0, 2.6, 0),
    TranslateGeometry(CreateCylinderGeometry(1.4, 1.4 * 0.8, 0.02), 0, 3.2, 0),
    TranslateGeometry(CreateCylinderGeometry(1.1, 1.1 * 0.8, 0.02), 0, 3.8, 0),
    TranslateGeometry(CreateCylinderGeometry(0.8, 0.8 * 0.8, 0.02), 0, 4.3, 0),
);

function TreeObject()
{
    const group = new SceneNode();

    // no trunk, just floating leaves, to save draw calls
    const leaves = new Mesh(treeLeavesGeometry, { r: 0, g: 0.4 + random() * 0.4, b: 0.2 * random(), a: 1 });

    const verticalScale = 0.8 + random();
    const horizontalScale = 0.9 + random() * 0.2;
    group.transform.scale.setValues(horizontalScale, verticalScale, horizontalScale);

    group.add(leaves);
    return group;
}















// game-2023/human.ts


const defaultMaterial: Material = { r: 1, g: 1, b: 1, a: 1, metallic: 0.6, roughness: 0.2, textureScale: NewVector3(5), textureBlendSharpness: 20 };
const metalTexture = MetalTexture(1024, 1024);

const headGeometry = CreateSphereGeometry(0.025);

const bodyGeometry = CreateCapsuleGeometry(0.3, 0.2);
const lowerBodyGeometry = CreateCylinderGeometry(0.5, 0.3, 0.25);

const upperLegGeometry = CreateCylinderGeometry(0.4, 0.08, 0.1);
const lowerLegGeometry = CreateCylinderGeometry(0.4, 0.07, 0.1);

TranslateGeometry(upperLegGeometry, 0, -0.2, 0);
TranslateGeometry(lowerLegGeometry, 0, -0.2, 0);

const footGeometry = CreateExtrudedGeometryConvex([
    0.08, 0,
    -0.22, 0,
    -0.22, 0.035,
    -0.20, 0.05,
    -0.03, 0.1,
    0.05, 0.1,
    0.08, 0.03
], 0.14);
RotateGeometryWithAxisAngle(footGeometry, 0, 1, 0, NegHalfPI);

const upperArmGeometry = CreateCylinderGeometry(0.3, 0.05, 0.08);
const lowerArmGeometry = CreateCylinderGeometry(0.4, 0.03, 0.05);

TranslateGeometry(upperArmGeometry, 0, -0.15, 0);
TranslateGeometry(lowerArmGeometry, 0, -0.2, 0);

function Pulse(t: number, base: number, radius: number)
{
    // get fractional part from t, and remap to [-1, 1]
    t = (t % 1) * 2 - 1;

    const sgn = sign(t);

    const x = PI - sgn * t * radius;
    return sgn * sin(x) * pow(base, x);
}

function CreateHuman(isEnemy: boolean, isArcher: boolean)
{
    const head = new Mesh(headGeometry, { ...defaultMaterial, textureScale: NewVector3(30) });
    const body = new Mesh(bodyGeometry, defaultMaterial);
    const lowerBody = new Mesh(lowerBodyGeometry, defaultMaterial);
    const leftUpperLeg = new Mesh(upperLegGeometry, defaultMaterial);
    const leftLowerLeg = new Mesh(lowerLegGeometry, defaultMaterial);
    const leftFoot = new Mesh(footGeometry, defaultMaterial);
    const rightUpperLeg = new Mesh(upperLegGeometry, defaultMaterial);
    const rightLowerLeg = new Mesh(lowerLegGeometry, defaultMaterial);
    const rightFoot = new Mesh(footGeometry, defaultMaterial);
    const leftUpperArm = new Mesh(upperArmGeometry, defaultMaterial);
    const leftLowerArm = new Mesh(lowerArmGeometry, defaultMaterial);
    const rightUpperArm = new Mesh(upperArmGeometry, defaultMaterial);
    const rightLowerArm = new Mesh(lowerArmGeometry, defaultMaterial);

    head.setTextures(metalTexture);
    body.setTextures(metalTexture);
    lowerBody.setTextures(metalTexture);
    leftUpperLeg.setTextures(metalTexture);
    leftLowerLeg.setTextures(metalTexture);
    leftFoot.setTextures(metalTexture);
    rightUpperLeg.setTextures(metalTexture);
    rightLowerLeg.setTextures(metalTexture);
    rightFoot.setTextures(metalTexture);
    leftUpperArm.setTextures(metalTexture);
    leftLowerArm.setTextures(metalTexture);
    rightUpperArm.setTextures(metalTexture);
    rightLowerArm.setTextures(metalTexture);

    let walkMultiplier = 0;
    let walkSpeed = 3;

    const animationTimeOffset = random();
    const now = () => Scene.now + animationTimeOffset;

    function UpperLegWalk(node: SceneNode, offset: number, multiplier: number)
    {
        const speed = 2;
        const magnitude = 1.0;
        const offset2 = 0.6;

        const t = (sin(now() * walkSpeed * speed + offset * TwoPI) + 1) / 2;
        node.transform.rotation.setFromAxisAngle(1, 0, 0, (offset2 - pow(t, 1.2)) * magnitude * multiplier);
    }

    function LowerLegWalk(node: SceneNode, offset: number, multiplier: number)
    {
        const speed = 5;
        const magnitude = 0.15;
        offset += 0.05;

        const t = now() * walkSpeed / PI + offset;
        node.transform.rotation.setFromAxisAngle(1, 0, 0, (Pulse(t, 2, speed) * magnitude - 4 * magnitude) * multiplier);
    }

    function BodyMovement(node: SceneNode, multiplier: number)
    {
        const { position } = node.transform;
        const t = now() * walkSpeed * 4;

        const zOffset = 2;
        const zMagnitude = 0.05 * multiplier;
        position.z = pow((sin(t + zOffset) + 1) / 2, 2) * zMagnitude;

        const yOffset = 1;
        const yMagnitude = 0.04;
        position.y = Lerp(0.02, pow((sin(t + yOffset) + 1) / 2, 2) * yMagnitude - 0.05, multiplier);
    }


    leftUpperLeg.onUpdate.push(node => UpperLegWalk(node, 0, walkMultiplier));
    rightUpperLeg.onUpdate.push(node => UpperLegWalk(node, 0.5, walkMultiplier));
    leftLowerLeg.onUpdate.push(node => LowerLegWalk(node, 0, walkMultiplier));
    rightLowerLeg.onUpdate.push(node => LowerLegWalk(node, 0.5, walkMultiplier));

    head.transform.position.y = 1.55;
    head.transform.scale.setValues(3.5, 4.5, 4);

    body.transform.position.y = 1.05;
    body.transform.scale.setValues(0.7, 1, 0.5);

    lowerBody.transform.position.y = 0.95;
    lowerBody.transform.scale.setValues(0.75, 1, 0.5);

    leftUpperLeg.transform.position.setValues(-0.11, 0.8, 0);
    rightUpperLeg.transform.position.setValues(0.11, 0.8, 0);

    leftLowerLeg.transform.position.setValues(0, -0.4, 0);
    leftLowerLeg.transform.scale.setValues(0.85, 1, 0.85);
    rightLowerLeg.transform.position.setValues(0, -0.4, 0);
    rightLowerLeg.transform.scale.setValues(0.85, 1, 0.85);

    leftUpperLeg.add(leftLowerLeg);
    rightUpperLeg.add(rightLowerLeg);

    leftFoot.transform.position.y = -0.4;
    rightFoot.transform.position.y = -0.4;
    leftLowerLeg.add(leftFoot);
    rightLowerLeg.add(rightFoot);

    leftUpperArm.transform.position.setValues(-0.15, 1.32, 0);
    leftUpperArm.add(leftLowerArm);

    leftLowerArm.transform.position.setValues(0, -0.3, 0);

    rightUpperArm.transform.position.setValues(0.15, 1.32, 0);
    rightUpperArm.add(rightLowerArm);

    const setRightUpperArmDefaultRotation = () => rightUpperArm.transform.rotation.setFromAxisAngle(0, 0, 1, 0.5).premultiplyAxisAngle(1, 0, 0, 0.5);

    rightLowerArm.transform.position.setValues(0, -0.3, 0);

    const node = new SceneNode();
    const bodyContainer = new SceneNode();
    node.add(bodyContainer);
    bodyContainer.add(head);
    bodyContainer.add(body);
    bodyContainer.add(lowerBody);
    bodyContainer.add(leftUpperLeg);
    bodyContainer.add(rightUpperLeg);
    bodyContainer.add(leftUpperArm);
    bodyContainer.add(rightUpperArm);

    bodyContainer.onUpdate.push(node => BodyMovement(node, walkMultiplier));

    let bow: SceneNode | null = null;
    if (isArcher)
    {
        leftUpperArm.transform.rotation.setFromAxisAngle(1, 0, 0, 1).premultiplyAxisAngle(0, 1, 0, 0.4);
        leftLowerArm.transform.rotation.setFromAxisAngle(0, 0, 1, 1).premultiplyAxisAngle(1, 0, 0, 1);
        rightUpperArm.transform.rotation.setFromAxisAngle(0, 1, 0, 0.5).premultiplyAxisAngle(1, 0, 0, 1.3)
        rightLowerArm.transform.rotation.setFromAxisAngle(1, 0, 0, 0.4);

        bow = BowObject();
        bow.transform.position.y = -0.4;
        bow.transform.rotation.setFromAxisAngle(0, 1, 0, -0.2).premultiplyAxisAngle(1, 0, 0, -HalfPI);
        rightLowerArm.add(bow);
    }
    else
    {
        leftUpperArm.transform.rotation.setFromAxisAngle(1, 0, 0, 1).premultiplyAxisAngle(0, 1, 0, 0.4);
        leftLowerArm.transform.rotation.setFromAxisAngle(0, 0, 1, 1.8);
        rightLowerArm.transform.rotation.setFromAxisAngle(1, 0, 0, 1.2);
        setRightUpperArmDefaultRotation();

        const shield = ShieldObject();
        shield.setTextures(metalTexture);
        if (isEnemy)
        {
            shield.material.r = 1;
            shield.material.g = 0.3;
        }

        leftLowerArm.add(shield);
        shield.transform.position.y = -0.15;
        shield.transform.rotation.setFromAxisAngle(0, 0, 1, HalfPI).premultiplyAxisAngle(0, 1, 0, -2.2);

        const sword = SwordObject();
        rightLowerArm.add(sword);
        sword.transform.position.setValues(0, -0.35, -0.06);
        sword.transform.rotation.setFromAxisAngle(1, 0, 0, NegHalfPI).premultiplyAxisAngle(0, 0, 1, HalfPI);
    }

    let walkChangeRequest = 0;
    const walkChangeSpeed = 2;
    return {
        node,
        isEnemy,
        health: 100,
        maxHealth: 100,
        isWalking: false,
        bow,
        startWalking()
        {
            const req = ++walkChangeRequest;
            node.onUpdate.push(_ =>
            {
                walkMultiplier = min(walkMultiplier + Scene.deltaTime * walkChangeSpeed, 1);
                return walkChangeRequest === req && walkMultiplier < 1;
            })
        },
        stopWalking()
        {
            const req = ++walkChangeRequest;
            node.onUpdate.push(_ =>
            {
                walkMultiplier = max(walkMultiplier - Scene.deltaTime * walkChangeSpeed, 0);
                return walkChangeRequest === req && walkMultiplier > 0;
            })
        },
        playAttackAnimation()
        {
            const startTime = Scene.now;
            const animationDuration = 1.5;
            node.onUpdate.push(_ =>
            {
                const t = min((Scene.now - startTime) / animationDuration, 1);
                const multiplier = sin(PI * (2 * t - 0.5)) / 2 + 0.5;
                setRightUpperArmDefaultRotation().premultiplyAxisAngle(1, 0, 0, (1 - t - Pulse(t, 2, 6) / 2) * multiplier);
                return t < 1;
            });
        }
    };
}












// game-2023/road.ts


const tmp0 = NewVector2();
const tmp1 = NewVector2();
const tmpResult = NewVector2();

function GetOffsetDirection(prevPoint: Vector2, currentPoint: Vector2, nextPoint: Vector2, offset: number, target: Vector2)
{
    const dir0 = tmp0.copyFrom(currentPoint).sub(prevPoint).normalize();
    const dir1 = tmp1.copyFrom(nextPoint).sub(currentPoint).normalize();
    const bisector = dir0.add(dir1).normalize();
    return target.setValues(bisector.y, -bisector.x).mulScalar(offset);
}

function CreateRoadGeometry(polyline: number[], widthRadius: number): Geometry
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














// game-2023/main.ts

document.body.appendChild(globalCanvas);
globalCanvas.style.position = "absolute";
globalCanvas.style.top = "0px";
globalCanvas.style.left = "0px";

const getElementById = document.getElementById.bind(document);

function RemoveItemFromArray<T>(arr: T[], item: T)
{
    const idx = arr.indexOf(item);
    if (idx !== -1)
    {
        arr.splice(idx, 1);
    }
}

const scene = new Scene();

const camera = new Camera();
const cameraControl = new CameraControl(camera);
cameraControl.minPitch = 0.3;
cameraControl.zoomSpeed = 0.07;
cameraControl.panSpeed = 1.5;
cameraControl.pitch = 0.8;
cameraControl.minTargetPosition.setValues(-120, 0, -120);
cameraControl.maxTargetPosition.setValues(120, 0, 120);
cameraControl.minZoom = 10;
cameraControl.maxZoom = 200;
cameraControl.distanceFromTarget = 50;
cameraControl.updateTransform();
scene.add(cameraControl);

AttachAudioListener(camera);

const panButton = 1;
const rotateButton = 2;
let cameraPanning = false;
let cameraRotating = false;

function Resize()
{
    const fov = 80;
    camera.setProjectionMatrixPerspecive(fov, (globalCanvas.width = window.innerWidth) / (globalCanvas.height = window.innerHeight), 0.4, 500);
}

requestAnimationFrame(Resize);
window.addEventListener("resize", Resize);

const buildingInfoContainer = getElementById("building-info")!;
let selectedBuildingData: BuildingData | null = null;

globalCanvas.addEventListener("mousedown", ev =>
{
    if (ev.button === panButton)
    {
        cameraPanning = true;
    }
    if (ev.button === rotateButton)
    {
        cameraRotating = true;
    }

    if (ev.button === 0)
    {
        // click on a building
        const closestHitBuilding = GetHoveredBuilding(ev);

        buildingInfoContainer.style.display = closestHitBuilding ? "flex" : "none";

        selectedBuildingData?.uiElement.hide();
        selectedBuildingData = closestHitBuilding;
        selectedBuildingData?.uiElement.show();

        // if (selectedBuildingData)
        // {
        //     const time = Scene.now;
        //     const duration = 0.2;
        //     selectedBuildingData.node.onUpdate.push(n =>
        //     {
        //         const t = min((Scene.now - time) / duration, 1);
        //         n.transform.scale.setScalar(1 + (1 - cos(TwoPI * t)) * 0.02);
        //         return t < 1;
        //     });
        // }
    }
});

function GetHoveredBuilding(ev: MouseEvent)
{
    if (buildingInProgress)
    {
        return null;
    }

    const ray = camera.getWorldRayFromMouseEvent(ev);
    let closestHitDistance: number | null = null;
    let closestHitBuilding: BuildingData | null = null;

    for (const data of buildingDatas)
    {
        const hitDistance = IntersectRayBoundingBox(ray, data.bboxMin, data.bboxMax);
        if (hitDistance !== null)
        {
            if (closestHitDistance === null || hitDistance < closestHitDistance)
            {
                closestHitDistance = hitDistance;
                closestHitBuilding = data;
            }
        }
    }

    return closestHitBuilding;
}

function UpdateHoveredBuilding(ev: MouseEvent)
{
    const hover = GetHoveredBuilding(ev) !== null;
    globalCanvas.style.cursor = hover ? "pointer" : "";
}

globalCanvas.addEventListener("mousemove", UpdateHoveredBuilding);

window.addEventListener("mouseup", ev =>
{
    if (ev.button === panButton)
    {
        cameraPanning = false;
    }
    if (ev.button === rotateButton)
    {
        cameraRotating = false;
    }
});

window.addEventListener("mousemove", ev =>
{
    if (cameraPanning)
    {
        cameraControl.pan(ev.movementX, ev.movementY);
    }
    if (cameraRotating)
    {
        cameraControl.rotate(ev.movementX, ev.movementY);
    }
});

globalCanvas.addEventListener("wheel", ev =>
{
    ev.preventDefault();
    cameraControl.zoom(ev.deltaY);
    UpdateHoveredBuilding(ev);
});

window.addEventListener("contextmenu", ev => ev.preventDefault());


window.addEventListener("keydown", ev =>
{
    if (ev.key === "Escape")
    {
        cancelBuilding();
    }
});

let running = false;
function Render(now: number)
{
    requestAnimationFrame(Render);

    if (!running)
    {
        return;
    }

    // ms -> seconds
    now /= 1000;

    scene.updateScene(now);
    scene.renderScene(camera);
}

requestAnimationFrame(Render);

scene.clearColor.setValues(0.4, 0.45, 0.5);
scene.light.transform.position.setValues(-1, 3, 2);

const roadTexture = BrickTexture(2048, 2048, 90, 90, 0.02, 0.5, 0.03, 0.4, 4, 0.2, true, 0.7, 1, [0.85, 0.85, 0.8], [0.5, 0.5, 0.5], 3);
const roadMaterial: Material = { ...HexToColor("ffffff"), textureScale: NewVector3(0.03) };

const groundTexture = DirtTexture(1024, 1024, 50, 0.7, 1, HexToColorArrayRGB("B5E068"), 1);
const groundMaterial: Material = { ...HexToColor("ffffff"), textureScale: NewVector3(0.2) };

const groundMesh = new Mesh(CreateBoxGeometry(500, 1, 500), groundMaterial);
groundMesh.setTextures(groundTexture);
groundMesh.transform.position.y = -0.5;
groundMesh.renderOrder = 100;
scene.add(groundMesh);


//// create road

const roadSplinePoints = [
    -500, 20,
    -400, 20,
    -120, 20,
    -80, 20,
    -40, 20,
    -10, 40,
    20, 30,
    30, 10,
    10, -10,
    10, -30,
    10, -40,
];

const roadColliderSampleRadius = 4;

const roadSplinePointsVec2: Vector2[] = [];
for (let i = 0; i < roadSplinePoints.length; i += 2)
{
    roadSplinePointsVec2.push(NewVector2(roadSplinePoints[i], roadSplinePoints[i + 1]));
}

const roadSpline = new CatmullRomSpline(roadSplinePointsVec2);
const roadGeometry = CreateRoadGeometry(roadSpline.samplePoints(0.2).flatMap(v => [...v]), 3);
const road = new Mesh(roadGeometry, roadMaterial);
road.transform.position.y = 0.02;
road.setTextures(roadTexture);
scene.add(road);

const roadColliderPoints = roadSpline.samplePoints(0.18);

const tmpScreenPos = NewVector3();
const tmpWorldForScreenPos = NewVector3();
function UpdateElementScreenPositionFromWorldPosition(target: SceneNode, yOffset: number, element: HTMLElement, display = "")
{
    tmpWorldForScreenPos.copyFrom(target.transform.position).y += yOffset;
    camera.getScreenPosition(tmpWorldForScreenPos, tmpScreenPos);
    element.style.display = tmpScreenPos.z > 1 ? "none" : display; // only show if not behind the camera
    element.style.left = round((tmpScreenPos.x + 1) / 2 * window.innerWidth) + "px";
    element.style.top = round((1 - tmpScreenPos.y) / 2 * window.innerHeight) + "px";
}

function CreateHealthBar(target: SceneNode, yOffset: number)
{
    const healthBarContainer = document.createElement("div");
    healthBarContainer.className = "worldspace-element health-bar";
    document.body.appendChild(healthBarContainer);

    const healthBar = document.createElement("div");
    healthBarContainer.appendChild(healthBar);

    target.onAfterRender.push(_ => UpdateElementScreenPositionFromWorldPosition(target, yOffset, healthBarContainer));

    return {
        healthBarContainer,
        healthBar,
        setHealthPercent(currentHealth: number, maxHealth: number)
        {
            healthBar.style.width = max(currentHealth / maxHealth * 100, 0) + "%";
        }
    };
}

const { House, Blacksmith, Windmill, Tower, Wall, Castle, Church } = InitializeBuildingData();
const castleMaxHealth = 2000;
let castleHealth = castleMaxHealth;

interface HumanData
{
    human: ReturnType<typeof CreateHuman>;
    cleanupFn: () => void;
}

const allHumans = new Set<HumanData>();

const enum HumanBehaviorState
{
    WalkingTowardsWaypoint,
    WalkingTowardsEnemy,
    AttackingEnemy,
    Stopped
}

const tmpCollisionCheckVec3 = NewVector3();
function HumanBehavior(human: ReturnType<typeof CreateHuman>)
{
    const { isEnemy, node, node: { transform }, startWalking, stopWalking } = human;

    if (isEnemy)
    {
        const maxHealth = 100 + 100 * currentLevel;
        human.maxHealth = maxHealth;
        human.health = maxHealth;
    }

    // health bar
    const { setHealthPercent, healthBar, healthBarContainer } = CreateHealthBar(node, 2);
    healthBar.style.backgroundColor = isEnemy ? "#ff0000" : "#00ff00";
    node.onAfterRender.push(_ => setHealthPercent(human.health, human.maxHealth));

    const secondsPerFood = 1;
    const foodTimerCancelFn = isEnemy ? () => { } : CreateFixedUpdateTimer(secondsPerFood, true, () =>
    {
        if (!TryUpdateFood(-1))
        {
            human.health -= 10;
        };
    });

    // audio
    const audioNode = AttachAudioSource(node);

    // waypoints
    const castleWaypointIndex = 42;

    const enemySpawnWaypointIndex = 3;

    let targetWaypointIndex = isEnemy ? enemySpawnWaypointIndex : castleWaypointIndex;
    const spawnPosition2d = roadColliderPoints[targetWaypointIndex];
    transform.position.setValues(spawnPosition2d.x, 0, spawnPosition2d.y);
    transform.rotation.setFromAxisAngle(0, 1, 0, isEnemy ? HalfPI : PI - 0.1);

    const offsetRadius = 2;
    const offset = Math.random() * offsetRadius * 2 - offsetRadius;

    const waypoint = NewVector3();
    const waypoint2D = NewVector2();

    const NextWaypoint = () =>
    {
        if (isEnemy)
        {
            if (targetWaypointIndex >= castleWaypointIndex)
            {
                return false;
            }
            ++targetWaypointIndex;
        }
        else
        {
            const finalWaypointIndex = currentLevel === 0 ? 15 : (currentLevel === 1 ? 13 : 9);
            if (targetWaypointIndex < finalWaypointIndex)
            {
                return false;
            }
            --targetWaypointIndex;
        }

        // these are flipped for enemies, but it doesn't matter, since the offset is random
        const prevWaypoint2D = roadColliderPoints[targetWaypointIndex + 1];
        const currentWaypoint2D = roadColliderPoints[targetWaypointIndex];
        const nextWaypoint2D = roadColliderPoints[targetWaypointIndex - 1];

        GetOffsetDirection(prevWaypoint2D, currentWaypoint2D, nextWaypoint2D, offset, waypoint2D).add(currentWaypoint2D);

        waypoint.setValues(waypoint2D.x, 0, waypoint2D.y);
        return true;
    };

    NextWaypoint();
    NextWaypoint();

    // walking state, directions
    let state = HumanBehaviorState.WalkingTowardsWaypoint;
    startWalking();

    let targetEnemy: ReturnType<typeof CreateHuman> | null = null;

    const rawWalkDir = isEnemy ? NewVector3(1, 0, 0) : NewVector3(0, 0, 1);
    const smoothedWalkDir = rawWalkDir.clone();

    const walkSpeed = 2.5;

    const distanceThreshold = 1;
    const distanceThresholdSqr = distanceThreshold * distanceThreshold;
    const turnFactor = 0.05;

    const damagePerAttack = 10 * 4;
    const attackTimer = 1.5;
    const attackDelay = 0.8; // delay the actual damage dealing, to match the animation
    let remainingAttackTimer = 0;
    let currentAttackDelay = attackDelay;

    let dead = false;
    node.onFixedUpdate.push(_ =>
    {
        if (dead)
        {
            // clean up
            stopWalking();
            cleanupFn(false);

            const animationStartTime = Scene.now;
            const animationDuration = 1;
            const rotationSnapshot = transform.rotation.clone();
            node.onUpdate.push(_ =>
            {
                // death animation
                let t = (Scene.now - animationStartTime) / animationDuration;

                if (t < 1)
                {
                    const t2 = t * t * t * t * t;
                    transform.rotation.copyFrom(rotationSnapshot).multiply(NewQuaternionFromAxisAngle(1, 0, 0, HalfPI * t2));
                }
                else if (t < 4)
                {
                    transform.position.y = -max(t - 3, 0) * 0.4;
                }
                else
                {
                    node.dispose();
                    return false;
                }

                return true;
            });

            return false;
        }

        if (nextLevelLoading)
        {
            stopWalking();
            return false;
        }

        if (!isEnemy || judgmentRemainingDuration <= 0)
        {
            const isWalkingTowardsEnemy = state === HumanBehaviorState.WalkingTowardsEnemy;
            let isWalking = state === HumanBehaviorState.WalkingTowardsWaypoint || isWalkingTowardsEnemy;

            const targetPosition = targetEnemy?.node.transform.position ?? waypoint;

            if (isWalking)
            {
                if (transform.position.distanceSqr(targetPosition) < distanceThresholdSqr)
                {
                    if (isWalkingTowardsEnemy)
                    {
                        state = HumanBehaviorState.AttackingEnemy;
                        isWalking = false;
                        stopWalking();
                    }
                    else if (!NextWaypoint())
                    {
                        state = HumanBehaviorState.Stopped;
                        isWalking = false;
                        stopWalking();
                    }
                }
            }

            smoothedWalkDir.normalize().lerp(rawWalkDir.normalize(), turnFactor).normalize();
            rawWalkDir.copyFrom(targetPosition).sub(transform.position).normalize();

            // always rotate towards the target, even when not walking
            transform.rotation.setFromAxisAngle(0, 1, 0, atan2(-smoothedWalkDir.x, -smoothedWalkDir.z));

            if (isWalking)
            {
                // update position
                transform.position.add(smoothedWalkDir.mulScalar(fixedDeltaTime * walkSpeed));
            }

            if (state === HumanBehaviorState.WalkingTowardsWaypoint || state === HumanBehaviorState.Stopped)
            {
                // look for enemies
                const searchRadius = 5;
                const searchRadiusSqr = searchRadius * searchRadius;

                let closestEnemyDistance = searchRadiusSqr;
                for (const { human: otherHuman } of allHumans)
                {
                    // skip friendly units
                    if (otherHuman.isEnemy !== isEnemy)
                    {
                        const dist = otherHuman.node.transform.position.distanceSqr(transform.position)
                        if (dist < closestEnemyDistance)
                        {
                            closestEnemyDistance = dist;
                            targetEnemy = otherHuman;
                            state = HumanBehaviorState.WalkingTowardsEnemy;
                            startWalking();
                        }
                    }
                }
            }
            else
            {
                // already has a target
                if (targetEnemy!.health <= 0)
                {
                    targetEnemy = null;
                    state = HumanBehaviorState.WalkingTowardsWaypoint;
                    startWalking();
                }
            }

            const tryAttack = () =>
            {
                if (remainingAttackTimer < 0)
                {
                    remainingAttackTimer += attackTimer;
                    currentAttackDelay = attackDelay;
                    human.playAttackAnimation();
                }

                currentAttackDelay -= fixedDeltaTime;
                if (currentAttackDelay < 0)
                {
                    currentAttackDelay = attackDelay;
                    return true;
                }

                return false;
            };

            remainingAttackTimer -= fixedDeltaTime;
            if (state === HumanBehaviorState.AttackingEnemy)
            {
                if (tryAttack())
                {
                    const enemyDamageMultiplier = 1 + currentLevel;
                    const damageMultiplier = isEnemy

                        // reduce damage dealt by enemies, by armor upgrade percent
                        // also increase damage for every level
                        ? pow(0.95, totalArmorUpgrade) * enemyDamageMultiplier

                        // increase damage dealt by friendly units, by damage upgrade percent
                        : pow(1.05, totalDamageUpgrade);

                    targetEnemy!.health -= damagePerAttack * damageMultiplier;
                    SwordImpactSound(audioNode);
                }
            }
            else if (isEnemy && state === HumanBehaviorState.Stopped)
            {
                // enemy has reached the last waypoint, attack the castle
                if (castleHealth > 0 && tryAttack())
                {
                    castleHealth -= damagePerAttack;
                    SwordImpactSound(audioNode);
                }
            }
            else
            {
                remainingAttackTimer = max(0, remainingAttackTimer);
            }

            human.isWalking = isWalking;
        }

        // make sure that the humans are not inside each other
        // push other humans out of the way
        const doubleCollisionRadius = 0.8;
        for (const { human: otherHuman } of allHumans)
        {
            const { position } = otherHuman.node.transform;
            const dir = tmpCollisionCheckVec3.copyFrom(transform.position).sub(position);
            const collisionResolveDistance = doubleCollisionRadius - dir.length;
            if (collisionResolveDistance > 0)
            {
                // note: the distance will be zero for self (and will do nothing because of safeNormalize),
                // so no need to check if the current human is equal to the other human
                dir.safeNormalize().mulScalar(collisionResolveDistance * (otherHuman.isWalking ? 1 : 0.3)); // move standing units with a lower force
                position.sub(dir);
            }
        }

        if (human.health <= 0)
        {
            // clean up next frame
            dead = true;

            if (isEnemy)
            {
                UpdateGold(10);
                if (--requiredNumberOfEnemiesToKill === 0)
                {
                    nextLevelLoading = true;
                    FadeOutMusic();
                    CreateFixedUpdateTimer(2, false, () => LoadLevel(currentLevel + 1, false));
                }
            }
        }

        return true;
    });

    const cleanupFn = (immediately: boolean) =>
    {
        foodTimerCancelFn();
        allHumans.delete(data);
        healthBarContainer.remove();
        if (immediately)
        {
            node.dispose();
        }
    };

    const data: HumanData = {
        human,
        cleanupFn: () => cleanupFn(true)
    };

    allHumans.add(data);

    return () => cleanupFn(true);
}

interface LevelData
{
    cityRadius: number;
    wallOffset: number;
    wallRotation: number;
    enemySpawnTimes: number[];
    startingGold: number;
    startingFood: number;
}

const levelDatas: LevelData[] = [{
    cityRadius: 60,
    wallOffset: 5,
    wallRotation: -0.1,
    enemySpawnTimes: [
        0, 0, 0, 0, 0, 0,
        30, 30, 30, 30, 30, 30, 30, 30, 30,
        60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60, 60,
    ],
    startingGold: 50,
    startingFood: 30,
}, {
    cityRadius: 75,
    wallOffset: 4,
    wallRotation: -0.1,
    enemySpawnTimes: [
        0, 0, 0, 0, 0,
        15, 15, 15, 15,
        30, 30, 30, 30, 30,
        45, 45, 45, 45, 45,
        60, 60, 60, 60, 60, 60, 60, 60,
        90, 90, 90, 90, 90, 90, 90, 90,
    ],
    startingGold: 100,
    startingFood: 50,
}, {
    cityRadius: 100,
    wallOffset: 3,
    wallRotation: -0.05,
    enemySpawnTimes: [
        0, 0, 0, 0, 0, 0,
        15, 15, 15, 15, 15, 15,
        30, 30, 30, 30, 30, 30,
        45, 45, 45, 45, 45, 45,
        60, 60, 60, 60, 60, 60, 60,
        90, 90, 90, 90, 90, 90, 90,
        120, 120, 120, 120, 120, 120, 120,
        125, 125, 125, 125, 125, 125, 125,
        130, 130, 130, 130, 130, 130, 130,
    ],
    startingGold: 150,
    startingFood: 100,
}];

const activeLevelObjects = new Set<SceneNode>();
function AddLevelObject(obj: SceneNode)
{
    scene.add(obj);
    activeLevelObjects.add(obj);
}

function BoundingBoxOverlap(min0: Vector2, max0: Vector2, min1: Vector2, max1: Vector2)
{
    return min1.x < max0.x && min1.y < max0.y && max1.x > min0.x && max1.y > min0.y;
}

interface BuildingUIElement
{
    show: () => void;
    hide: () => void;
    destroy: () => void;
    container: HTMLElement;
}

interface BuildingData
{
    type: BuildingType;
    node: SceneNode;
    bboxMin: Vector3;
    bboxMax: Vector3;
    uiElement: BuildingUIElement
}

function DefaultShowHideFnForHtmlElement(elem: HTMLElement, onDestroy: () => void): BuildingUIElement
{
    return {
        show: () => elem.style.display = "",
        hide: () => elem.style.display = "none",
        destroy: () =>
        {
            elem.remove();
            onDestroy();
        },
        container: elem
    };
}

function CreateAbilityContainer(buttonText: string, description: string, onClick: () => void, cooldown?: number, cost?: number,
    customReadyText?: string, customCooldownText?: (cooldown: string) => string)
{
    const container = document.createElement("div");
    const button = document.createElement("button");
    const descriptionDiv = document.createElement("div");

    container.className = "ability-container";
    button.textContent = buttonText;
    descriptionDiv.textContent = description;

    container.appendChild(button);
    container.appendChild(descriptionDiv);
    let onCooldown = false;

    const updateButtonDisabledState = () =>
    {
        button.disabled = onCooldown || totalGold < (cost ?? 0);
    };

    if (cooldown)
    {
        const cooldownTextElement = document.createElement("div");
        const setReadyText = () => cooldownTextElement.textContent = customReadyText ?? `Can be used every ${cooldown} seconds.`;
        setReadyText();

        container.appendChild(cooldownTextElement);
        button.onclick = _ =>
        {
            onCooldown = true;
            updateButtonDisabledState();

            let currentCooldown = cooldown;
            scene.onFixedUpdate.push(_ =>
            {
                currentCooldown -= fixedDeltaTime;
                if (currentCooldown < 0)
                {
                    setReadyText();
                    onCooldown = false;
                    updateButtonDisabledState();
                    return false;
                }

                const cooldownText = currentCooldown.toFixed(1);
                cooldownTextElement.textContent = customCooldownText?.(cooldownText) ?? `Ready in ${cooldownText} seconds.`;
                return true;
            });

            onClick();
        };
    }
    else
    {
        button.onclick = onClick;
    }

    if (cost)
    {
        onGoldChanged.push(updateButtonDisabledState);
    }

    return { container, descriptionDiv, button };
}

// abilities/upgrades

function CreateUIContainerBase(title: string, description: string)
{
    const container = document.createElement("div");
    container.style.display = "none";
    buildingInfoContainer.appendChild(container);

    const titleDiv = document.createElement("div");
    titleDiv.textContent = title;
    titleDiv.className = "title";
    container.appendChild(titleDiv);

    const descriptionDiv = document.createElement("div");
    descriptionDiv.textContent = description;
    container.appendChild(descriptionDiv);

    return container;
}

function CreateFixedUpdateTimer(time: number, repeat: boolean, tick: () => void)
{
    let accumulatedTime = time;

    let cancelled = false;
    let cancel = () => cancelled = true;

    scene.onFixedUpdate.push(() =>
    {
        if (cancelled)
        {
            return false;
        }

        accumulatedTime -= fixedDeltaTime;
        if (accumulatedTime < 0)
        {
            accumulatedTime += time;
            tick();
            return repeat;
        }

        return true;
    });

    return cancel;
}

let totalGold = 0;
let totalFood = 0;

const goldText = getElementById("gold-count")!;
const foodText = getElementById("food-count")!;

let onGoldChanged: (() => void)[] = [];
function UpdateGold(delta: number)
{
    goldText.textContent = (totalGold += delta).toString();
    onGoldChanged.forEach(callback => callback());
}

const secondsPerGold = 1;
let goldPerSecond = 1;
const goldIncreaseTimer = CreateFixedUpdateTimer(secondsPerGold, true, () => UpdateGold(goldPerSecond));

function TryUpdateFood(delta: number)
{
    if (totalFood + delta < 0)
    {
        return false;
    }

    foodText.textContent = (totalFood += delta).toString();

    if (totalFood === 0)
    {
        foodText.classList.add("danger");
    }
    else
    {
        foodText.classList.remove("danger");
    }

    return true;
}

const secondsPerFood = 1;
let windmillTotalLevelCount = 0;
const foodIncreaseTimer = CreateFixedUpdateTimer(secondsPerFood, true, () => TryUpdateFood(windmillTotalLevelCount));

function CreateHouseUI()
{
    const container = CreateUIContainerBase("House", "Houses increase the amount of gold you receive per second.");

    let upgradeLevel = 1;

    function UpdateValues()
    {
        upgrade.button.disabled = totalGold < 30;
        upgrade.descriptionDiv.textContent = `You receive ${upgradeLevel} additional gold per second. (${upgradeLevel}/3)`;
    }

    const upgrade = CreateAbilityContainer("Upgrade (30 gold)", "", () =>
    {
        if (++upgradeLevel === 3)
        {
            upgrade.button.remove();
        }

        ++goldPerSecond;
        UpdateGold(-30);
    });

    container.appendChild(upgrade.container);

    ++goldPerSecond;
    UpdateValues();

    onGoldChanged.push(UpdateValues);

    return DefaultShowHideFnForHtmlElement(container, () =>
    {
        goldPerSecond -= upgradeLevel;
        RemoveItemFromArray(onGoldChanged, UpdateValues);
    });
}

function CreateCastleUI()
{
    const container = CreateUIContainerBase("Castle", "The main building of the city. You must protect the castle from enemies.");

    const recruit = CreateAbilityContainer("Recruit soldier (5 gold)", "You can recruit soldiers to fight enemies.", () =>
    {
        const human = CreateHuman(false, false);
        scene.add(human.node);
        HumanBehavior(human);
        UpdateGold(-5);
    }, 3, 5, "You can recruit a soldier every 3 seconds.", c => `You can recruit a new soldier in ${c} seconds.`);

    container.appendChild(recruit.container);

    container.appendChild(CreateAbilityContainer("Repair castle", "Instantly repair 20% damage done to the castle.", () =>
    {
        castleHealth = min(castleMaxHealth, castleHealth + castleMaxHealth * 0.2);
    }, 60).container);

    return DefaultShowHideFnForHtmlElement(container, () => { });
}

let judgmentRemainingDuration = 0;
scene.onFixedUpdate.push(_ =>
{
    judgmentRemainingDuration = max(judgmentRemainingDuration - fixedDeltaTime, 0);
});

function CreateChurchUI()
{
    const container = CreateUIContainerBase("Church", "Provides abilities that can turn the combat in your favor.");

    let blessingHealthRestorePercent = 0;
    let judgmentStunDuration = 0;
    let upgradeLevel = 1;

    function UpdateValues()
    {
        blessingHealthRestorePercent = upgradeLevel * 0.2;
        blessing.descriptionDiv.textContent = `Restores ${upgradeLevel * 20}% health to all friendly soldiers.`;

        judgmentStunDuration = upgradeLevel * 2;
        judgment.descriptionDiv.textContent = `Stuns all enemies, making them unable to move or attack for ${judgmentStunDuration} seconds.`;

        upgrade.button.disabled = totalGold < 20;
        upgrade.descriptionDiv.textContent = `Increase the power of the church's abilities. (${upgradeLevel}/3)`;
    }

    const blessing = CreateAbilityContainer("Blessing", "", () =>
    {
        for (const { human } of allHumans)
        {
            if (!human.isEnemy)
            {
                human.health = min(human.maxHealth, human.health + human.maxHealth * blessingHealthRestorePercent);
            }
        }
    }, 15);

    const judgment = CreateAbilityContainer("Judgment", "", () =>
    {
        judgmentRemainingDuration += judgmentStunDuration;
    }, 30);

    const upgrade = CreateAbilityContainer("Upgrade (20 gold)", "", () =>
    {
        if (++upgradeLevel === 3)
        {
            upgrade.button.remove();
        }

        UpdateGold(-20);
    });

    container.appendChild(blessing.container);
    container.appendChild(judgment.container);
    container.appendChild(upgrade.container);

    UpdateValues();

    onGoldChanged.push(UpdateValues);

    return DefaultShowHideFnForHtmlElement(container, () =>
    {
        RemoveItemFromArray(onGoldChanged, UpdateValues);
    });
}

let totalArmorUpgrade = 0;
let totalDamageUpgrade = 0;

function CreateBlacksmithUI()
{
    const container = CreateUIContainerBase("Blacksmith", "Improves the equipment of your soldiers.");

    let armorUpgradeLevel = 1;
    let damageUpgradeLevel = 1;

    const getUpgradeValue = (level: number) => 1 - pow(0.95, level);

    function UpdateValues()
    {
        const armorPercent = round(getUpgradeValue(armorUpgradeLevel) * 100);
        const damagePercent = round(getUpgradeValue(damageUpgradeLevel) * 100);

        if (armorUpgradeLevel === 3)
        {
            armorUpgrade.descriptionDiv.textContent = `Friendly soldiers take ${armorPercent}% less damage. (3/3)`;
        }
        else
        {
            armorUpgrade.button.disabled = totalGold < 20;
            armorUpgrade.descriptionDiv.textContent = `Reduces damage taken by friendly soldiers, by ${armorPercent}%. (${armorUpgradeLevel}/3)`;
        }

        if (damageUpgradeLevel === 3)
        {
            damageUpgrade.descriptionDiv.textContent = `Friendly soldiers deal ${damagePercent}% more damage. (3/3)`;
        }
        else
        {
            damageUpgrade.button.disabled = totalGold < 20;
            damageUpgrade.descriptionDiv.textContent = `Increases damage dealt by friendly soldiers, by ${damagePercent}%. (${damageUpgradeLevel}/3)`;
        }
    }

    const armorUpgrade = CreateAbilityContainer("Armor reinforcement (20 gold)", "", () =>
    {
        if (++armorUpgradeLevel === 3)
        {
            armorUpgrade.button.remove();
        }

        ++totalArmorUpgrade;
        UpdateGold(-20);
    });

    const damageUpgrade = CreateAbilityContainer("Sharpened swords (20 gold)", "", () =>
    {
        if (++damageUpgradeLevel === 3)
        {
            damageUpgrade.button.remove();
        }

        ++totalDamageUpgrade;
        UpdateGold(-20);
    });

    container.appendChild(armorUpgrade.container);
    container.appendChild(damageUpgrade.container);
    UpdateValues();

    onGoldChanged.push(UpdateValues);

    return DefaultShowHideFnForHtmlElement(container, () =>
    {
        RemoveItemFromArray(onGoldChanged, UpdateValues);
        totalDamageUpgrade -= damageUpgradeLevel - 1;
        totalArmorUpgrade -= armorUpgradeLevel - 1;
    });
}

function CreateWindmillUI()
{
    const container = CreateUIContainerBase("Windmill", "Produces food. Soldiers need food to survive.");

    let upgradeLevel = 1;
    ++windmillTotalLevelCount;

    function UpdateValues()
    {
        upgrade.button.disabled = totalGold < 20;
        upgrade.descriptionDiv.textContent = `Produces ${upgradeLevel} food per second. (${upgradeLevel}/3)`;
    }

    const upgrade = CreateAbilityContainer("Upgrade food production (20 gold)", "", () =>
    {
        if (++upgradeLevel === 3)
        {
            upgrade.button.remove();
        }

        ++windmillTotalLevelCount;
        UpdateGold(-20);
    });

    container.appendChild(upgrade.container);
    UpdateValues();

    onGoldChanged.push(UpdateValues);

    return DefaultShowHideFnForHtmlElement(container, () =>
    {
        RemoveItemFromArray(onGoldChanged, UpdateValues);
        windmillTotalLevelCount -= upgradeLevel;
    });
}

const towerRangeIndicatorGeometry = CreateCylinderGeometry(0.5, 1, 1, 64);
const arrowProjectileGeometry = CreateCylinderGeometry(0.8, 0.05, 0.05);

function CreateTowerUI(node: SceneNode): BuildingUIElement
{
    const container = CreateUIContainerBase("Archer tower", "Periodically attacks the closest enemy.");

    const rangeIndicator = new Mesh(towerRangeIndicatorGeometry, { r: 0, g: 0.2, b: 0.8, a: 0.3 });
    rangeIndicator.transparent = true;
    rangeIndicator.castShadows = false;
    rangeIndicator.receiveShadows = false;
    rangeIndicator.visible = false;
    node.add(rangeIndicator);

    let rangeUpgradeLevel = 0;
    let damageUpgradeLevel = 0;

    let rangeRadius = 0;
    let damageMultiplier = 0;
    const baseDamage = 30;

    function UpdateValues()
    {
        rangeUpgrade.button.disabled = totalGold < 20;
        rangeRadius = 12 + rangeUpgradeLevel * 4;
        rangeUpgrade.descriptionDiv.textContent = `Attack enemies in a ${rangeRadius} meter radius. (${rangeUpgradeLevel + 1}/3)`;
        rangeIndicator.transform.scale.setValues(rangeRadius, 1, rangeRadius);

        damageUpgrade.button.disabled = totalGold < 10;
        damageMultiplier = pow(1.05, damageUpgradeLevel);
        const damageIncreasePercent = round((1 - pow(0.95, damageUpgradeLevel)) * 100);
        damageUpgrade.descriptionDiv.textContent = `Damage done increased by ${damageIncreasePercent}%. (${damageUpgradeLevel}/3)`;
    }

    const rangeUpgrade = CreateAbilityContainer("Increase range by 3 meters (20 gold)", "", () =>
    {
        if (++rangeUpgradeLevel === 2)
        {
            rangeUpgrade.button.remove();
        }

        UpdateGold(-20);
    });

    const damageUpgrade = CreateAbilityContainer("Increase damage done by 5% (10 gold)", "", () =>
    {
        if (++damageUpgradeLevel === 3)
        {
            damageUpgrade.button.remove();
        }

        UpdateGold(-10);
    });

    container.appendChild(rangeUpgrade.container);
    container.appendChild(damageUpgrade.container);
    UpdateValues();

    onGoldChanged.push(UpdateValues);

    const archer = CreateHuman(false, true);
    archer.node.transform.position.y = 9;
    node.add(archer.node);
    const audioNode = AttachAudioSource(archer.node);

    const attackInterval = 2;
    let attackTimer = attackInterval;

    const tmpDir = NewVector3(0, 0, -1);
    const smoothedDir = NewVector3(0, 0, -1);
    let projectilePositionUpdater = () => true;
    let running = true;
    node.onFixedUpdate.push(_ =>
    {
        if (castleHealth <= 0)
        {
            return false;
        }

        attackTimer -= fixedDeltaTime;

        let closestEnemy: ReturnType<typeof CreateHuman> | null = null;
        let closestDistanceSqr = Infinity;
        for (const { human } of allHumans)
        {
            if (human.isEnemy)
            {
                const distSqr = node.transform.position.distanceSqr(human.node.transform.position);
                if (distSqr < closestDistanceSqr)
                {
                    closestDistanceSqr = distSqr;
                    closestEnemy = human;
                }
            }
        }

        if (closestEnemy)
        {
            // always turn towards the closest enemy, even if out of range (but only attack if it's close enough)
            tmpDir.copyFrom(closestEnemy.node.transform.position).sub(node.transform.position).normalize();
            smoothedDir.lerp(tmpDir, 0.05).normalize();
            archer.node.transform.rotation.setFromAxisAngle(0, 1, 0, atan2(-smoothedDir.x, -smoothedDir.z));

            if (attackTimer <= 0 && closestDistanceSqr < rangeRadius * rangeRadius)
            {
                closestEnemy.health -= baseDamage * damageMultiplier;
                attackTimer = attackInterval;
                BowShotSound(audioNode);

                const srcPosition = archer.bow!.worldPosition;
                const targetPosition = closestEnemy.node.transform.position.clone();
                targetPosition.y += 1.5;
                const dir = targetPosition.clone().sub(srcPosition).normalize();

                const projectile = new Mesh(arrowProjectileGeometry, { ...HexToColor("4d3b0c") });
                projectile.transform.rotation.setFromUnitVectors(NewVector3(0, 1, 0), dir);
                scene.add(projectile);
                const duration = 0.1;
                let elapsed = 0;

                projectilePositionUpdater = () =>
                {
                    elapsed += fixedDeltaTime;
                    const t = elapsed / duration;

                    projectile.transform.position.lerpVectors(srcPosition, targetPosition, t);

                    if (elapsed > duration)
                    {
                        projectile.dispose();
                        return false;
                    }

                    return true;
                };
            }
        }

        if (!projectilePositionUpdater())
        {
            projectilePositionUpdater = () => true;
        }

        return running;
    });

    return {
        show()
        {
            container.style.display = "";
            rangeIndicator.visible = true;
        },
        hide()
        {
            container.style.display = "none";
            rangeIndicator.visible = false;
        },
        destroy()
        {
            RemoveItemFromArray(onGoldChanged, UpdateValues);
            container.remove();
            running = false;
        },
        container
    };
}

interface BuildingTemplate
{
    bboxSize: Vector3;
    cost: number;
    name: string;
}

const buildingTemplates: { [key in BuildingType]: BuildingTemplate } = {
    [BuildingType.House]: {
        bboxSize: NewVector3(10, 6, 7),
        cost: 25,
        name: "house"
    },
    [BuildingType.Blacksmith]: {
        bboxSize: NewVector3(10, 6, 7),
        cost: 25,
        name: "blacksmith"
    },
    [BuildingType.Windmill]: {
        bboxSize: NewVector3(31, 8, 14),
        cost: 15,
        name: "windmill",
    },
    [BuildingType.Tower]: {
        bboxSize: NewVector3(6, 9, 6),
        cost: 40,
        name: "archer tower",
    },
    [BuildingType.Castle]: {
        bboxSize: NewVector3(22, 23, 22),
        cost: 0, // not buildable
        name: "castle",
    },
    [BuildingType.Church]: {
        bboxSize: NewVector3(10, 10, 22),
        cost: 25,
        name: "church",
    }
};

let buildingDatas: BuildingData[] = [];

const buildingPlaceholder = new Mesh(TranslateGeometry(CreateBoxGeometry(), 0, 0.5, 0), { r: 1, g: 0, b: 0, a: 0.3 });
buildingPlaceholder.transparent = true;
buildingPlaceholder.castShadows = false;
buildingPlaceholder.receiveShadows = false;
buildingPlaceholder.cull = null;

let cancelBuilding = () => { };

let startLevelPromiseResolver = () => { };

let currentLevelData = levelDatas[0];
let currentLevel = 0;
let requiredNumberOfEnemiesToKill = 0;
let castleHealthBarContainer: HTMLElement | null = null;
let nextLevelLoading = false;
let enemySpawnTimerCancellerFns: (() => void)[] = [];
async function LoadLevel(level: number, isRestart: boolean)
{
    overlay.classList.remove("hidden");
    running = false;

    if (isRestart)
    {
        overlayTextDiv.textContent = "The enemy destroyed your castle...";
        startButton.textContent = "Try again";
    }
    else if (level === 0)
    {
        overlayTextDiv.textContent = "The enemy is attacking the city, you need to defend it!\nAre you ready?";
        startButton.textContent = "Let's go!";
    }
    else if (level === 1)
    {
        overlayTextDiv.textContent = "You won the battle, but the war is still far from over.\nThe enemy will be back very soon. You must prepare.";
        startButton.textContent = "I'm ready!";

        musicDurationSetterFn(5.5);
        setTimeout(() => musicDurationSetterFn(5), 10000);
    }
    else if (level === 2)
    {
        overlayTextDiv.textContent = "This is the final attack. The enemy is stronger than ever.\nCan you defend the city one last time?";
        startButton.textContent = "Let's do it!";

        musicDurationSetterFn(4.5);
        setTimeout(() => musicDurationSetterFn(4), 10000);
    }
    else
    {
        overlayTextDiv.textContent = "Congratulations!\n\nYou have successfully defended the city from all attacks.\nThe war is finally over.";
        startButton.style.display = "none";
        globalVolumeNode.gain.linearRampToValueAtTime(globalVolume, actx.currentTime + 0.1);
        globalVolumeNode.gain.linearRampToValueAtTime(0, actx.currentTime + 20);
        setTimeout(musicStopFn, 25000);
        return;
    }

    await new Promise<void>(resolve => startLevelPromiseResolver = resolve);
    startLevelPromiseResolver = () => { };

    const { cityRadius, wallRotation } = currentLevelData = levelDatas[currentLevel = level];
    nextLevelLoading = false;

    //// unload previous level

    cancelBuilding();
    buildingDatas.forEach(({ uiElement }) =>
    {
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

    const castleWallLength = 50;
    const cityCircumference = cityRadius * TwoPI;
    const cityCircumferenceReduction = 20;

    const steps = ceil((cityCircumference - cityCircumferenceReduction) / castleWallLength);
    for (let i = 0; i < steps; ++i)
    {
        const t = i * castleWallLength / cityCircumference;
        const x = cos(t * TwoPI + wallRotation) * cityRadius;
        const y = sin(t * TwoPI + wallRotation) * cityRadius;
        const tower = Tower();
        tower.transform.position.setValues(-x, 0, -y);
        AddLevelObject(tower);

        if (i !== steps - 1)
        {
            const wall = Wall();
            AddLevelObject(wall);
            const wallPlacementRadius = cityRadius - currentLevelData.wallOffset;
            const t = (i + 0.5) * castleWallLength / cityCircumference;
            const x2 = cos(t * TwoPI + wallRotation) * wallPlacementRadius;
            const y2 = sin(t * TwoPI + wallRotation) * wallPlacementRadius;
            wall.transform.position.setValues(-x2, 0, -y2);
            wall.transform.rotation.setFromAxisAngle(0, 1, 0, -atan2(y2, x2) - HalfPI);
        }
    }

    //// castle
    const castle = Castle();
    const castleX = 10;
    const castleY = -30;
    castle.transform.position.setValues(castleX, 0, castleY);
    castle.transform.rotation.setFromAxisAngle(0, 1, 0, -0.1);
    AddLevelObject(castle);
    const { setHealthPercent, healthBar, healthBarContainer } = CreateHealthBar(castle, 25);
    healthBar.style.backgroundColor = "#00ff00";
    healthBarContainer.style.width = "25vh";
    castle.onAfterRender.push(_ => setHealthPercent(castleHealth, castleMaxHealth));
    castleHealthBarContainer = healthBarContainer;
    castleHealth = castleMaxHealth;

    // prevent building inside the castle
    const { bboxSize } = buildingTemplates[BuildingType.Castle];
    const castleBuildingData: BuildingData = {
        node: castle,
        type: BuildingType.Castle,
        bboxMin: NewVector3(castleX - bboxSize.x / 2, 0, castleY - bboxSize.z / 2),
        bboxMax: NewVector3(castleX + bboxSize.x / 2, bboxSize.y, castleY + bboxSize.z / 2),
        uiElement: CreateCastleUI(),
    };
    buildingDatas.push(castleBuildingData);

    let isCastleDestroyed = false;
    let castleDestroyTime = 0;
    castle.onUpdate.push(_ =>
    {
        const animationDuration = 3;
        if (isCastleDestroyed)
        {
            const t = min((Scene.now - castleDestroyTime) / animationDuration, 1);
            castle.transform.position.y = -t * t * t * 25;
            return t < 1;
        }
        else if (castleHealth <= 0)
        {
            isCastleDestroyed = true;
            castleDestroyTime = Scene.now;
            healthBarContainer.remove();

            RemoveItemFromArray(buildingDatas, castleBuildingData);
            castleBuildingData.uiElement.destroy();
            buildingInfoContainer.style.display = "none";
            nextLevelLoading = true;
            FadeOutMusic();
            CreateFixedUpdateTimer(animationDuration, false, () => LoadLevel(currentLevel, true));
        };

        return true;
    });

    // timers for enemy spawning
    for (const time of currentLevelData.enemySpawnTimes)
    {
        enemySpawnTimerCancellerFns.push(CreateFixedUpdateTimer(time, false, () =>
        {
            const enemy = CreateHuman(true, false);
            scene.add(enemy.node);
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

    const rng = Mulberry32(0);
    for (let i = 0; i < 100; ++i)
    {
        const maxDistance = 250;
        const minDistance = cityRadius + 20;
        const radius = sqrt(rng()) * maxDistance;

        if (radius < minDistance)
        {
            continue;
        }

        const angle = rng() * TwoPI;

        const x = cos(angle) * radius;
        const y = sin(angle) * radius;
        if (x < 0 && abs(y - 20) < 10)
        {
            // no trees on the road
            continue;
        }

        const tree = TreeObject();
        tree.transform.position.setValues(x, 0, y);
        AddLevelObject(tree);
    }
}

let buildingInProgress = false;
async function BuildBuilding(buildingType: BuildingType)
{
    buildingInProgress = true;
    buildingInfoContainer.style.display = "none";

    const { bboxSize, cost } = buildingTemplates[buildingType];
    buildingPlaceholder.transform.scale.copyFrom(bboxSize);
    const buildingHalfSize2D = NewVector2(bboxSize.x, bboxSize.z).mulScalar(0.5);

    const groundPosition2D = NewVector2();
    const currentBBoxMin = NewVector2();
    const currentBBoxMax = NewVector2();
    const tmpDistanceFromOrigin = NewVector2();

    globalCanvas.addEventListener("click", Click);
    globalCanvas.addEventListener("mousemove", Move);

    cancelBuilding();
    cancelBuilding = () =>
    {
        buildingInProgress = false;
        scene.remove(buildingPlaceholder);
        globalCanvas.removeEventListener("click", Click);
        globalCanvas.removeEventListener("mousemove", Move);
    };

    let canBuild = false;

    function Click(ev: MouseEvent)
    {
        if (!canBuild)
        {
            return;
        }

        cancelBuilding();
        cancelBuilding = () => { };

        const ray = camera.getWorldRayFromMouseEvent(ev);
        const hitDistance = GroundPlaneLineIntersectionDistance(ray);

        // note: castle is not buildable, so in this switch, buildingType is never Castle
        // @ts-ignore
        const building = ((): SceneNode =>
        {
            switch (buildingType)
            {
                case BuildingType.House: return House();
                case BuildingType.Blacksmith: return Blacksmith();
                case BuildingType.Windmill: return Windmill();
                case BuildingType.Tower: return Tower();
                case BuildingType.Church: return Church();
            }
        })();

        ray.getPoint(hitDistance, building.transform.position);
        AddLevelObject(building);

        const buildStartTime = Scene.now;

        const bouncyAnimation = (elapsed: number, invert: boolean) =>
        {
            const duration = 0.7;
            const originalT = min(elapsed / duration, 1);
            const t = invert ? 1 - originalT : originalT;

            const p = 8;
            const q = 1.3;
            const x = max(1e-3, pow(p * t, q));
            building.transform.scale.y = 1 - sin(x) / x * Smoothstep(1, 0, t);
            return originalT < 1;
        };

        building.onUpdate.push(_ => bouncyAnimation(Scene.now - buildStartTime, false));

        // @ts-ignore
        const uiElement = ((): BuildingUIElement =>
        {
            switch (buildingType)
            {
                case BuildingType.House: return CreateHouseUI();
                case BuildingType.Blacksmith: return CreateBlacksmithUI();
                case BuildingType.Windmill: return CreateWindmillUI();
                case BuildingType.Tower: return CreateTowerUI(building);
                case BuildingType.Church: return CreateChurchUI();
            }
        })();

        const buildingData: BuildingData = {
            node: building,
            type: buildingType,
            bboxMin: NewVector3(currentBBoxMin.x, 0, currentBBoxMin.y),
            bboxMax: NewVector3(currentBBoxMax.x, bboxSize.y, currentBBoxMax.y),
            uiElement,
        };

        const destroy = CreateAbilityContainer("Destroy building", "Destroys this building, freeing up space for other buildings.", () =>
        {
            RemoveItemFromArray(buildingDatas, buildingData);
            uiElement.destroy();
            uiElement.container.remove();
            buildingInfoContainer.style.display = "none";

            const destroyStartTime = Scene.now;
            building.onUpdate.push(_ =>
            {
                const running = bouncyAnimation(Scene.now - destroyStartTime, true);

                if (!running)
                {
                    building.dispose();
                }

                return running;
            });
        });

        destroy.button.style.backgroundColor = "#bb3333";
        uiElement.container.appendChild(destroy.container);

        buildingDatas.push(buildingData);

        UpdateGold(-cost);
        UpdateHoveredBuilding(ev);
    }

    const tmpVec2_min = NewVector2();
    const tmpVec2_max = NewVector2();
    function Move(ev: MouseEvent)
    {
        const ray = camera.getWorldRayFromMouseEvent(ev);
        const hitDistance = GroundPlaneLineIntersectionDistance(ray);
        ray.getPoint(hitDistance, buildingPlaceholder.transform.position);

        const cityPadding = 8; // minimum build distance from the edge

        // ensure that the placeholder is inside the city
        if (buildingPlaceholder.transform.position.length > (currentLevelData.cityRadius - cityPadding))
        {
            buildingPlaceholder.transform.position.normalize().mulScalar(currentLevelData.cityRadius - cityPadding);
        }

        buildingPlaceholder.transform.position.y -= 0.01; // to prevent z-fight

        scene.add(buildingPlaceholder); // only add to scene on mouse move, so that the position is correct

        const { x, z } = buildingPlaceholder.transform.position;
        groundPosition2D.setValues(x, z);

        currentBBoxMin.copyFrom(groundPosition2D).sub(buildingHalfSize2D);
        currentBBoxMax.copyFrom(groundPosition2D).add(buildingHalfSize2D);

        // check overlap with other buildings
        canBuild = true;
        for (const { bboxMin, bboxMax } of buildingDatas)
        {
            if (BoundingBoxOverlap(currentBBoxMin, currentBBoxMax, tmpVec2_min.setValues(bboxMin.x, bboxMin.z), tmpVec2_max.setValues(bboxMax.x, bboxMax.z)))
            {
                canBuild = false;
                break;
            }
        }

        // check overlap with road
        const roadSampleRadiusSqr = roadColliderSampleRadius * roadColliderSampleRadius;
        if (canBuild)
        {
            const tmpVec2 = NewVector2();
            for (const point of roadColliderPoints)
            {
                const closestPoint = tmpVec2.copyFrom(point).clamp(currentBBoxMin, currentBBoxMax);
                if (point.distanceSqr(closestPoint) < roadSampleRadiusSqr)
                {
                    canBuild = false;
                    break;
                }
            }
        }

        // check if inside the city
        if (canBuild)
        {
            // check corners of the bounding box, if any are outside, then the building cannot be placed there
            for (const [x, y] of [
                [currentBBoxMin.x, currentBBoxMin.y],
                [currentBBoxMax.x, currentBBoxMin.y],
                [currentBBoxMin.x, currentBBoxMax.y],
                [currentBBoxMax.x, currentBBoxMax.y],
            ])
            {
                if (tmpDistanceFromOrigin.setValues(x, y).length > currentLevelData.cityRadius - cityPadding)
                {
                    canBuild = false;
                    break;
                }
            }
        }

        buildingPlaceholder.material.r = canBuild ? 0 : 1;
        buildingPlaceholder.material.g = canBuild ? 1 : 0;
    }
}

const buildingButtonsContainer = getElementById("building-buttons-container")!;
for (const buildingType of [BuildingType.House, BuildingType.Blacksmith, BuildingType.Windmill, BuildingType.Tower, BuildingType.Church])
{
    const { cost, name } = buildingTemplates[buildingType];
    const button = document.createElement("button");
    button.textContent = `Build ${name} (${cost} gold)`;
    button.onclick = () => BuildBuilding(buildingType);
    buildingButtonsContainer.appendChild(button);

    onGoldChanged.push(() =>
    {
        button.disabled = totalGold < cost;
    });
}

const startButton = getElementById("start-level") as HTMLButtonElement;
const overlay = getElementById("overlay")!;
const overlayTextDiv = getElementById("overlay-text")!;

let musicStopFn = () => { };
let musicDurationSetterFn = (_: number) => { };

let musicStarted = false;
startButton.onclick = () =>
{
    overlay.classList.add("hidden");
    running = true;
    startLevelPromiseResolver();

    if (!musicStarted)
    {
        globalFilterNode.frequency.value = 200;

        const { stop, setDuration } = StartMusic();
        musicStopFn = stop;
        musicDurationSetterFn = setDuration;

        musicStarted = true;
    }

    globalFilterNode.frequency.exponentialRampToValueAtTime(200, actx.currentTime + 0.1);
    globalFilterNode.frequency.exponentialRampToValueAtTime(6000, actx.currentTime + 3);
    globalFilterNode.frequency.exponentialRampToValueAtTime(20000, actx.currentTime + 4);
};

function FadeOutMusic()
{
    globalFilterNode.frequency.linearRampToValueAtTime(20000, actx.currentTime + 0.1);
    globalFilterNode.frequency.linearRampToValueAtTime(200, actx.currentTime + 4);
}

LoadLevel(0, false);
