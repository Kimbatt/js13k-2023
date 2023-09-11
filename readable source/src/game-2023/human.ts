import { CreateCapsuleGeometry, CreateCylinderGeometry, CreateExtrudedGeometryConvex, CreateSphereGeometry, RotateGeometry, RotateGeometryWithAxisAngle, TranslateGeometry } from "../scenegraph/geometry.js";
import { Material } from "../scenegraph/material.js";
import { Mesh } from "../scenegraph/mesh.js";
import { Scene, SceneNode } from "../scenegraph/scene.js";
import { MetalTexture } from "../texture-generator/impl/metal.js";
import { NewQuaternion, NewQuaternionFromAxisAngle, NewVector3, Quaternion, Vector3 } from "../util/linear.js";
import { HalfPI, Lerp, max, min, NegHalfPI, PI, pow, random, sign, sin, TwoPI } from "../util/math.js";
import { BowObject, ShieldObject, SwordObject } from "./models.js";

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

export function CreateHuman(isEnemy: boolean, isArcher: boolean)
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
