import { Matrix4x4, NewMatrix4x4Compose, NewQuaternion, NewQuaternionFromAxisAngle, NewVector3, Quaternion, Vector2, Vector3 } from "../util/linear.js";
import { CloneGeometry, CreateBoxGeometry, CreateCylinderGeometry, CreateExtrudedGeometryConvex, FlatShade, Geometry, JoinGeometries, RotateGeometry, RotateGeometryWithAxisAngle, TransformGeometry, TranslateGeometry } from "../scenegraph/geometry.js";
import { Material } from "../scenegraph/material.js";
import { Mesh } from "../scenegraph/mesh.js";
import { Scene, SceneNode } from "../scenegraph/scene.js";
import { BrickTexture } from "../texture-generator/impl/brick.js";
import { HexToColor, Mulberry32 } from "../util/util.js";
import { WoodTexture } from "../texture-generator/impl/wood.js";
import { PlasticTexture } from "../texture-generator/impl/plastic.js";
import { Lerp, cos, HalfPI, NegHalfPI, PI, random, sin, TwoPI } from "../util/math.js";

export function InitializeBuildingData()
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

export const enum BuildingType
{
    House,
    Blacksmith,
    Windmill,
    Tower,
    Castle,
    Church
}
