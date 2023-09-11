import { abs, Clamp, cos, Lerp, sin, sqrt } from "./math.js";
import { FixedLengthArray } from "./util.js";

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

export class Vector4 extends Vector4Base<Vector4>
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

export class Vector3 extends VectorBase<3, Vector3>
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
        return tmpVec3;
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

export class Vector2 extends VectorBase<2, Vector2>
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
export class Quaternion extends Vector4Base<Quaternion>
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
export class Matrix3x3 extends Float32Array
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
export class Matrix4x4 extends Float32Array
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

export const NewVector2 = (x?: number, y?: number) => new Vector2(x, y);
export const NewVector3 = (x?: number, y?: number, z?: number) => new Vector3(x, y, z);
export const NewVector4 = (x?: number, y?: number, z?: number, w?: number) => new Vector4(x, y, z, w);
export const NewQuaternion = (x?: number, y?: number, z?: number, w?: number) => new Quaternion(x, y, z, w);
export const NewMatrix3x3 = () => new Matrix3x3();
export const NewMatrix4x4 = () => new Matrix4x4();

export const NewQuaternionFromAxisAngle = (x: number, y: number, z: number, angle: number) => NewQuaternion().setFromAxisAngle(x, y, z, angle);
export const NewMatrix4x4Compose = (position: Vector3, rotation: Quaternion, scale: Vector3) => NewMatrix4x4().compose(position, rotation, scale);

const tmpVec2 = NewVector2();
const tmpVec3 = NewVector3();
const tmpVec4 = NewVector4();
const tmpQuaternion = NewQuaternion();


