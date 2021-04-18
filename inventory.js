import { mat4, vec3, quat } from "./gl-matrix-min.js"
import { Sprite, Texture2D } from "./Sprite.js"
import { Menu } from "./menu.js"
import {gl, level, updateRegistry} from "./state.js"
import {menuRight, menuDown, menuLeft, menuUp, pickingUp} from "./input.js"
import {getItemSprite} from "./item.js"

const INVENTORY_SIZE = 6;
export const INVENTORY_HEIGHT = 2;
export const INVENTORY_WIDTH = 4;
const INVENTORY_SCALE = INVENTORY_SIZE / INVENTORY_HEIGHT;

export let Inventory = function() {
    Menu.call(this, "assets/Inventar_Board.png", mat4.fromScaling(mat4.create(), vec3.fromValues(8, 8, 8)));
    this.level_end = false
    this.cursorPosition = 0
	this.objects = []
    this.postits = []
    
    this.glowingPostit = new Texture2D("assets/Glowing_sticky_Bitch.png");
    this.postit = new Texture2D("assets/dull_sticky_bitch.png");

}
Inventory.prototype = Object.create(Menu.prototype);
Object.defineProperty(Inventory.prototype, 'constructor', {
    value: Inventory,
    enumerable: false, // so that it does not appear in 'for in' loop
    writable: true });

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
Inventory.prototype.pickUp = function (item) {
	let index = level.objects.indexOf(item);
	if (index > -1) {
        level.objects.splice(index, 1);
        let transform = inventoryItemTransform(this.objects.length);
		let m = mat4.create();
        mat4.fromScaling(m, vec3.fromValues(0.25, 0.25, 1));
        mat4.mul(m, transform, m);
		let sprite = getItemSprite(item.pickup, m, null, false);
        this.objects.push(sprite);
		m = mat4.create();
        mat4.fromScaling(m, vec3.fromValues(0.5, 0.5, 1));
        mat4.mul(m, transform, m);
        this.postits.push(new Sprite("assets/dull_sticky_bitch.png", m));
	}
}

//handlesthe inventory updates.
Inventory.prototype.updateInventory = function() {
    if (menuRight()) {
        this.cursorPosition += 1;
    }
    if (menuLeft()) {
        this.cursorPosition -= 1;
    }
    if (menuDown()) {
        this.cursorPosition += INVENTORY_WIDTH;
    }
    if (menuUp()) {
        this.cursorPosition -= INVENTORY_WIDTH;
    }
    this.cursorPosition = (this.cursorPosition + this.objects.length) % this.objects.length;
    if (this.level_end) this.cursorPosition = Math.max(this.cursorPosition, level.id - 1);
    if (pickingUp()) {
        if (this.level_end) {

            let item = this.objects[this.cursorPosition];
            this.objects.splice(level.id - 1, this.objects.length - (level.id - 1));
            this.postits.splice(level.id, this.postits.length - level.id);
            let m = mat4.create();
            mat4.fromScaling(m, vec3.fromValues(0.25, 0.25, 1));
            item.setTransformation(mat4.mul(m, inventoryItemTransform(this.objects.length), m));
            this.objects.push(item);

            this.level_end = false;
            this.opened = false;

            if (level.id < 7) {
                if (level.id == 6) {
                    music.pause();
                }
                loadLevel(level.id + 1);
            }
        } else {
			if (typeof this.objects[this.cursorPosition] !== "undefined")
			{
				menu.setSprite(getItemSprite(this.objects[this.cursorPosition].item_id, mat4.fromScaling(mat4.create(), vec3.fromValues(5, 5, 5))));
				menu.cooldown = -1;
			}
        }
    }
}
