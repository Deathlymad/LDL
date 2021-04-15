import { mat4, vec3, quat } from "./gl-matrix-min.js"
import { Sprite } from "./Sprite.js"
import {gl, level} from "./state.js"


export let inventory = {
    opened: false,
    level_end: false,
    cursorPosition: 0,
	objects: [],
    postits: []
};


const INVENTORY_SIZE = 6;
export const INVENTORY_HEIGHT = 2;
export const INVENTORY_WIDTH = 4;
const INVENTORY_SCALE = INVENTORY_SIZE / INVENTORY_HEIGHT;

//compute matrix to put item sprite in the right slot
function inventoryItemTransform(index) {
    let x = index % INVENTORY_WIDTH;
    let y = Math.floor(index / INVENTORY_WIDTH);
    let pos = vec3.fromValues((x + 0.5) * INVENTORY_SCALE - INVENTORY_SCALE * INVENTORY_WIDTH / 2, INVENTORY_SIZE / 2 - (y + 0.5) * INVENTORY_SCALE, 0);
    let scale = vec3.fromValues(INVENTORY_SCALE, INVENTORY_SCALE, INVENTORY_SCALE);

    let transform = mat4.create();
    mat4.fromRotationTranslationScale(transform, quat.create(), pos, scale);
    return transform;
}
//adds item to inventory
export function pickUp(item) {
	let index = level.objects.indexOf(item);
	if (index > -1) {
        level.objects.splice(index, 1);
        let transform = inventoryItemTransform(inventory.objects.length);
		let m = mat4.create();
        mat4.fromScaling(m, vec3.fromValues(0.25, 0.25, 1));
        mat4.mul(m, transform, m);
		let sprite = getItemSprite(item.pickup, m, null, false);
        inventory.objects.push(sprite);
		m = mat4.create();
        mat4.fromScaling(m, vec3.fromValues(0.5, 0.5, 1));
        mat4.mul(m, transform, m);
        inventory.postits.push(new Sprite("assets/dull_sticky_bitch.png", m));
	}
}

//handlesthe inventory updates.
function updateInventory() {
    if (menuRight()) {
        inventory.cursorPosition += 1;
    }
    if (menuLeft()) {
        inventory.cursorPosition -= 1;
    }
    if (menuDown()) {
        inventory.cursorPosition += INVENTORY_WIDTH;
    }
    if (menuUp()) {
        inventory.cursorPosition -= INVENTORY_WIDTH;
    }
    inventory.cursorPosition = (inventory.cursorPosition + inventory.objects.length) % inventory.objects.length;
    if (inventory.level_end) inventory.cursorPosition = Math.max(inventory.cursorPosition, level.id - 1);
    if (pickingUp()) {
        if (inventory.level_end) {

            let item = inventory.objects[inventory.cursorPosition];
            inventory.objects.splice(level.id - 1, inventory.objects.length - (level.id - 1));
            inventory.postits.splice(level.id, inventory.postits.length - level.id);
            let m = mat4.create();
            mat4.fromScaling(m, vec3.fromValues(0.25, 0.25, 1));
            item.setTransformation(mat4.mul(m, inventoryItemTransform(inventory.objects.length), m));
            inventory.objects.push(item);

            inventory.level_end = false;
            inventory.opened = false;

            if (level.id < 7) {
                if (level.id == 6) {
                    music.pause();
                }
                loadLevel(level.id + 1);
            }
        } else {
			if (typeof inventory.objects[inventory.cursorPosition] !== "undefined")
			{
				menu.setSprite(getItemSprite(inventory.objects[inventory.cursorPosition].item_id, mat4.fromScaling(mat4.create(), vec3.fromValues(5, 5, 5))));
				menu.cooldown = -1;
			}
        }
    }
}

//animate the item when picked up
function itemFadeInAnim(sprite, name, strtPos, strtScale, frames) {
	if (typeof this.cnt === "undefined")
		this.cnt = 0;
	else
		this.cnt += 1;

	if (typeof this.tgtPos === "undefined")
	{
		this.tgtPos = vec3.create();
		mat4.getTranslation(this.tgtPos, sprite.transform);
	}
	if (typeof this.tgtScale === "undefined")
	{
		this.tgtScale = vec3.create();
		mat4.getScaling(this.tgtScale, sprite.transform);
	}

	let pos = vec3.create()
	vec3.lerp(pos, strtPos, this.tgtPos, this.cnt/frames)
	let scale = vec3.create()
	vec3.lerp(scale, strtScale, this.tgtScale, this.cnt/frames)

	mat4.fromRotationTranslationScale(sprite.transform, quat.create(), pos, scale);

	if (this.cnt >= frames) {
		updateRegistry.unregisterUpdate(name);
		mat4.fromRotationTranslationScale(sprite.transform, quat.create(), this.tgtPos, this.tgtScale);
		if (typeof sprite.onOpen !== "undefined")
			sprite.onOpen()
	}
}

//animate the item when picked up
function itemFadeOutAnim(sprite, newSprite, name, tgtPos, tgtScale, frames) {
	if (typeof this.cnt === "undefined")
		this.cnt = 0;
	else
		this.cnt += 1;

	if (typeof this.strtPos === "undefined")
	{
		this.strtPos = vec3.create();
		mat4.getTranslation(this.strtPos, sprite.transform);
	}
	if (typeof this.strtScale === "undefined")
	{
		this.strtScale = vec3.create();
		mat4.getScaling(this.strtScale, sprite.transform);
	}

	let pos = vec3.create()
	vec3.lerp(pos, this.strtPos, tgtPos, this.cnt/frames)
	let scale = vec3.create()
	vec3.lerp(scale, this.strtScale, tgtScale, this.cnt/frames)

	mat4.fromRotationTranslationScale(sprite.transform, quat.create(), pos, scale);

	if (this.cnt >= frames) {
		updateRegistry.unregisterUpdate(name);
		mat4.fromRotationTranslationScale(sprite.transform, quat.create(), tgtPos, tgtScale);
		menu.sprite = newSprite;
	}
}
