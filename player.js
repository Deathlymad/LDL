import {MobileGameObject} from "./GameObject.js"


let Player = function() {
    MobileGameObject.call(this, "./assets/walk_circle_halved.png", vec2.fromValues( 0, 0), vec2.fromValues(1, 3), "player", vec2.fromValues(3.5, 3.5 / 3), vec2.fromValues(0, -0.1));
    
    this.sprite.texture.frames = 5;
	let transMat = mat4.create()
	mat4.fromRotationTranslationScale(transMat, quat.create(), vec3.fromValues(0, 1, 0), vec3.fromValues(3/4, 3/4, 1))
	this.eyeSprite = new Sprite("./assets/eye_halved.png", transMat, "animation", this.sprite)
	this.eyeSprite.texture.frames = 5;
}
Player.prototype = Object.create(MobileGameObject.prototype);
Object.defineProperty(Player.prototype, 'constructor', {
    value: Player,
    enumerable: false, // so that it does not appear in 'for in' loop
    writable: true });

Player.prototype.isPlayer = function(){return true;}