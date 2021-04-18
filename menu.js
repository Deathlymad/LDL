import {Sprite} from "./sprite.js"
import {mat4, vec3, vec2, quat} from "./gl-matrix-min.js"
import {Orientation} from "./GameObject.js"
import {updateRegistry } from "./state.js"

export let Menu = function(spritePath, position, size, type, scale = vec2.fromValues(1, 1), offset = vec2.fromValues(0, 0)) {
    Sprite.call(this, spritePath, position, size, type, scale, offset, Orientation.DEFAULT);
}
Menu.prototype = Object.create(Sprite.prototype);
Object.defineProperty(Menu.prototype, 'constructor', {
    value: Menu,
    enumerable: false, // so that it does not appear in 'for in' loop
    writable: true });
Menu.current=null
Menu.prototype.open = function(disableAnimation = false) {
    let updateInFunc = Menu.prototype.itemFadeInAnim.bind(this, "fade_in_anim_"+this.texture.name, vec3.fromValues(10, -10, 0), vec3.fromValues(0, 0, 0), 40)
    updateInFunc()
    if(!disableAnimation) {
        updateRegistry.registerUpdate("fade_in_anim_"+this.texture.name, updateInFunc);
    }

    if (Menu.current !== null)
    {
        this.close(disableAnimation)
    }
    else{
        Menu.current = this
    }
}
Menu.prototype.close = function(disableAnimation=true) {
        
        if (!Menu.current)
            return
        
        let newSprite = this
        if (Menu.current === this)
            newSprite = null
        
        let updateOutFunc = Menu.prototype.itemFadeOutAnim.bind(Menu.current, newSprite, "fade_out_anim_"+Menu.current.texture.name, vec3.fromValues(10, -10, 0), vec3.fromValues(0, 0, 0), 40)
        updateOutFunc()
        if (!Menu.current) //second time for "instant" animation
            return
        if (typeof Menu.current.onClose !== "undefined")
            Menu.current.onClose()
        if(!disableAnimation) {
            updateRegistry.registerUpdate("fade_out_anim_"+Menu.current.texture.name, updateOutFunc);
        }
}

//animate the item when picked up
Menu.prototype.itemFadeInAnim = function(name, strtPos, strtScale, frames) {
	if (typeof this.cnt === "undefined")
		this.cnt = 0;
	else
		this.cnt += 1;

	if (typeof this.tgtPos === "undefined")
	{
		this.tgtPos = vec3.create();
		mat4.getTranslation(this.tgtPos, this.transform);
	}
	if (typeof this.tgtScale === "undefined")
	{
		this.tgtScale = vec3.create();
		mat4.getScaling(this.tgtScale, this.transform);
	}

	let pos = vec3.create()
	vec3.lerp(pos, strtPos, this.tgtPos, this.cnt/frames)
	let scale = vec3.create()
	vec3.lerp(scale, strtScale, this.tgtScale, this.cnt/frames)

	mat4.fromRotationTranslationScale(this.transform, quat.create(), pos, scale);

	if (this.cnt >= frames) {
		updateRegistry.unregisterUpdate(name);
		mat4.fromRotationTranslationScale(this.transform, quat.create(), this.tgtPos, this.tgtScale);
		if (typeof this.onOpen !== "undefined")
			this.onOpen()
	}
}

//animate the item when picked up
Menu.prototype.itemFadeOutAnim = function(newSprite, name, tgtPos, tgtScale, frames) {
	if (typeof this.cnt === "undefined")
		this.cnt = 0;
	else
		this.cnt += 1;

	if (typeof this.strtPos === "undefined")
	{
		this.strtPos = vec3.create();
		mat4.getTranslation(this.strtPos, this.transform);
	}
	if (typeof this.strtScale === "undefined")
	{
		this.strtScale = vec3.create();
		mat4.getScaling(this.strtScale, this.transform);
	}

	let pos = vec3.create()
	vec3.lerp(pos, this.strtPos, tgtPos, this.cnt/frames)
	let scale = vec3.create()
	vec3.lerp(scale, this.strtScale, tgtScale, this.cnt/frames)

	mat4.fromRotationTranslationScale(this.transform, quat.create(), pos, scale);

	if (this.cnt >= frames) {
		updateRegistry.unregisterUpdate(name);
		mat4.fromRotationTranslationScale(this.transform, quat.create(), tgtPos, tgtScale);
		Menu.current = newSprite;
	}
}
