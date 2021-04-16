import {level, player, menu} from "./state.js"
import {ITEM_SOUNDS} from "./item.js"
import {pickUp, inventory} from "./inventory.js"
import {vec2, mat4, vec3} from "./gl-matrix-min.js"
import {Sprite} from "./Sprite.js"
import {loadLevel} from "./level.js"
import {GameObject, Orientation} from "./GameObject.js"
import {pickingUp} from "./input.js"

const GRAVITATION = 38; // 10

export function testIntersection(a, b) {
    let aMin = vec2.sub(vec2.create(), a.position, a.halfSize);
    let aMax = vec2.add(vec2.create(), a.position, a.halfSize);
    let bMin = vec2.sub(vec2.create(), b.position, b.halfSize);
    let bMax = vec2.add(vec2.create(), b.position, b.halfSize);

    if (b.orientation == Orientation.ROTATED_45) {
        // vec2.rotate(aMin, aMin, a.position, Math.PI/4);
        // vec2.rotate(aMax, aMax, a.position, Math.PI/4);
        vec2.sub(aMin, a.position, vec2.fromValues(0, a.halfSize[1]));
        vec2.add(aMax, a.position, vec2.fromValues(0, a.halfSize[1]));
        vec2.rotate(bMin, bMin, b.position, Math.PI/4);
        vec2.rotate(bMax, bMax, b.position, Math.PI/4);

        vec2.rotate(aMin, aMin, vec2.create(), -Math.PI/4);
        vec2.rotate(aMax, aMax, vec2.create(), -Math.PI/4);
        vec2.rotate(bMin, bMin, vec2.create(), -Math.PI/4);
        vec2.rotate(bMax, bMax, vec2.create(), -Math.PI/4);
    }

    let dir1 = vec2.sub(vec2.create(), aMax, bMin);
    let dir2 = vec2.sub(vec2.create(), bMax, aMin);

    let distMin = vec2.min(vec2.create(), dir1, dir2);

    let weirdSize = (b.halfSize[0] + b.halfSize[1]) * Math.sqrt(2) / 2;
    let distX1 = a.position[0] + a.halfSize[0] - (b.position[0] - weirdSize);
    let distX2 = b.position[0] + weirdSize - (a.position[0] - a.halfSize[0]);
    let distX = Math.min(distX1, distX2);

    if (distMin[0] <= 0 || distMin[1] <= 0 || (b.orientation == Orientation.ROTATED_45 && distX <= 0)) return null;

    let res = null;

    if (b.orientation == Orientation.ROTATED_45 && distX < distMin[0] && distX < distMin[1]) {
        return vec2.fromValues(distX1 < distX2 ? distX1 : -distX2, 0);
    }

    if (distMin[0] < distMin[1]) {
        res = vec2.fromValues(dir1[0] < dir2[0] ? dir1[0] : -dir2[0], 0);
    } else {
        res = vec2.fromValues(0, dir1[1] < dir2[1] ? dir1[1] : -dir2[1]);
    }

    if (b.orientation == Orientation.ROTATED_45) {
        vec2.rotate(res, res, vec2.create(), Math.PI/4);
    }

    return res;
}

export function update(delta) {
    //handle falling
    if (player.velocity[1] >= 0) player.maxY = player.position[1] - player.halfSize[1];
    player.velocity[1] -= GRAVITATION * delta;


    //apply change
    let positionDelta = vec2.scale(vec2.create(), player.velocity, delta);
    player.setPosition(vec2.add(player.position, player.position, positionDelta));
    player.onGround = false;
	let canInteract = false

	let stageTeleportation = false
    
    for (let obj of level.objects) {
        if (!(obj instanceof GameObject)) continue;
        let intersection = testIntersection(player, obj);
        if (intersection) { //TODO abstract this part somehow. add game object subtypes maybe
            
            obj.onCollide(intersection, player)
            canInteract = canInteract || obj.canInteract(player)
            if (pickingUp()) {
                obj.onInteract(player)
            }
        }
    }

    player.handlePhysicsChange()
    player.setInteraction(canInteract);
    

    //handle level exit. TODO maybe abstract as well
    let exitDir = vec2.sub(vec2.create(), level.exit, player.position);
    if (Math.abs(exitDir[0]) < player.halfSize[0] && Math.abs(exitDir[1]) < player.halfSize[1]) {
        if (inventory.objects.length >= level.id) {
            inventory.opened = true;
            inventory.level_end = true;
        } else {
            if (level.id == 7) {
                inventory.opened = true;
                inventory.end_end = true;
            }
            // TODO: Tell player they have to collect at least 1 item
            player.position[0] -= 3;
        }
    }
}
