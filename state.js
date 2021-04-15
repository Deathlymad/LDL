import { vec3 } from "./gl-matrix-min.js"
import { Sprite } from "./Sprite.js"

//Core Data
export let gl = null;
export function setGl(context) {
    gl = context;
}
export let player = null;
export function setPlayer(obj) {
    player = obj;
}
export let updateRegistry = {
	updateList : {},
	registerUpdate : function(name, callback) {
		this.updateList[name] = callback;
	},
	unregisterUpdate : function(name) {
		delete this.updateList[name];
	},
	update : function(delta) {
		for (let updateName in this.updateList)
			this.updateList[updateName](delta);
	},
}



//TODO review
export let level = {
    objects: [],
	lights: new Array(180), //TODO move
	updateLight: function(lightID, color, pos, dir, cutoff, intensity) {
		let startPos = lightID * 9;

		this.lights[startPos] = color[0]
		this.lights[startPos + 1] = color[1]
		this.lights[startPos + 2] = color[2]

		this.lights[startPos + 3] = pos[0]
		this.lights[startPos + 4] = pos[1]

		this.lights[startPos + 5] = dir[0]
		this.lights[startPos + 6] = dir[1]

		this.lights[startPos + 7] = cutoff

		this.lights[startPos + 8] = intensity
	}

};
export let menu = {
    sprite: null,
	setSprite: function(sprite, disableAnimation = false) {
		if (sprite !== null)
		{
			let updateInFunc = itemFadeInAnim.bind(new Object(), sprite, "fade_in_anim_"+sprite.texture.name, vec3.fromValues(10, -10, 0), vec3.fromValues(0, 0, 0), 40)
			updateInFunc()
			if(!disableAnimation) {
				updateRegistry.registerUpdate("fade_in_anim_"+sprite.texture.name, updateInFunc);
			}
		}

		if (this.sprite !== null)
		{
			let updateOutFunc = itemFadeOutAnim.bind(new Object(), this.sprite, sprite, "fade_out_anim_"+this.sprite.texture.name, vec3.fromValues(10, -10, 0), vec3.fromValues(0, 0, 0), 40)
			updateOutFunc()
			if (typeof this.sprite.onClose !== "undefined")
				this.sprite.onClose()
			if(!disableAnimation) {
				updateRegistry.registerUpdate("fade_out_anim_"+this.sprite.texture.name, updateOutFunc);
			}
		}
		else{
			this.sprite = sprite
		}

	},
	backgroundContainer: null,
    cooldown: 0
};

