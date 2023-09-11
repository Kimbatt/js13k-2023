import { CreateBoxGeometry, CreateCylinderGeometry, CreateExtrudedGeometryConvex, FlatShade, JoinGeometries, RotateGeometryWithAxisAngle, TranslateGeometry } from "../scenegraph/geometry.js";
import { Mesh } from "../scenegraph/mesh.js";
import { Camera, SceneNode } from "../scenegraph/scene.js";
import { NewMatrix3x3, NewMatrix4x4, NewVector3, Vector3 } from "../util/linear.js";
import { atan2, HalfPI, NegHalfPI, random } from "../util/math.js";
import { HexToColor } from "../util/util.js";

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

export const ShieldObject = () => new Mesh(shieldGeometry, { r: 0.5, g: 1, b: 0.5, a: 1, metallic: 0.6, roughness: 0, textureScale: NewVector3(2) });


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

export function SwordObject()
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

export function BowObject()
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

export function TreeObject()
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
