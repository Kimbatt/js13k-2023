import { Camera, fixedDeltaTime, Scene, SceneNode } from "../scenegraph/scene.js";
import { NewQuaternion, NewQuaternionFromAxisAngle, NewVector2, NewVector3, Vector2, Vector3 } from "../util/linear.js";
import { Mesh } from "../scenegraph/mesh.js";
import { CreateBoxGeometry, CreateCylinderGeometry, RotateGeometry, RotateGeometryWithAxisAngle, TranslateGeometry } from "../scenegraph/geometry.js";
import { Material } from "../scenegraph/material.js";
import { CameraControl } from "../scenegraph/camera-control.js";
import { BuildingType, InitializeBuildingData } from "./buildings.js";
import { HexToColor, HexToColorArrayRGB, Mulberry32 } from "../util/util.js";
import { BrickTexture } from "../texture-generator/impl/brick.js";
import { CreateHuman } from "./human.js";
import { globalCanvas } from "../scenegraph/global-canvas.js";
import { DirtTexture } from "../texture-generator/impl/dirt.js";
import { CreateRoadGeometry, GetOffsetDirection } from "./road.js";
import { CatmullRomSpline } from "../util/spline.js";
import { GroundPlaneLineIntersectionDistance, IntersectRayBoundingBox, Ray } from "../util/math-geometry.js";
import { Smoothstep, atan2, ceil, cos, HalfPI, pow, sin, TwoPI, max, min, PI, round, random, sqrt, abs } from "../util/math.js";
import { TreeObject } from "./models.js";
import { AttachAudioListener, AttachAudioSource } from "../scenegraph/audio.js";
import { BowShotSound, StartMusic, SwordImpactSound } from "./audio.js";
import { actx, globalFilterNode, globalVolume, globalVolumeNode } from "../audio/audio.js";

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
