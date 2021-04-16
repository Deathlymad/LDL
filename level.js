import {Sprite, GameObject, Texture2D} from "./Sprite.js"
import {level, menu, setPlayer, player} from "./state.js"
import {mat4, vec2, vec3, quat} from "./gl-matrix-min.js"
import {readJSON} from "./util.js"

//global level scale
const X_SCALE = 1//0.25
const Y_SCALE = 1

//minimize
const TYPE_ID_MAP = {
	background : 0,
	collision_mask : 1,
	door : 2,
	deco : 3,
	collidable : 4,
	xcollidable : 5,
	interactable : 6,
	teleporter : 7,
	foreground : 8,
	fire : 9
}

//move to util
export function loadLevel(id) {
	readJSON("levels/level" + id + ".json", initLevel.bind(null, id))
}

function initLevel(id, rawData) {
	//freeze game state

	let levelData = JSON.parse(rawData)

	//verify ID
	if (levelData["id"] !== id)
		console.warn("Failed to verify level ID with internal ID. Some level designer must have fallen asleep.")

    // intro
    if (levelData["intro"]) {
        menu.setSprite(new Sprite("assets/" + levelData["intro"]["spriteName"] + ".png", mat4.fromScaling(mat4.create(), vec3.fromValues(5, 5, 5))));
        menu.cooldown = levelData["intro"]["duration"];
    }

    level.id = id;
    level.upsideDown = levelData["upsideDown"] ? levelData["upsideDown"] : false;

	//pedantic
	let objects = levelData["objects"].sort((a, b) => TYPE_ID_MAP[a["type"]] < TYPE_ID_MAP[b["type"]] ? -1 : 1)
	level["objects"] = []

	for (let entry of levelData["hiddenRooms"])
	{
		let transformation = mat4.create()
		let pos = vec3.fromValues(entry["pos"]["x"] * X_SCALE, entry["pos"]["y"] * Y_SCALE, 0)
		let scale = vec3.fromValues(entry["size"]["width"] * X_SCALE * 0.5, entry["size"]["height"] * Y_SCALE * 0.5, 0)
		mat4.fromRotationTranslationScale(transformation, quat.create(), pos, scale)
		level.objects.push(new Sprite("assets/" + entry["spriteName"] + ".png", transformation))
	}

	for (let entry of objects)
	{
		let pos1 = vec2.fromValues(entry["pos"]["x"] * X_SCALE, entry["pos"]["y"] * Y_SCALE)
		let size = vec2.fromValues(entry["size"]["width"] * X_SCALE, entry["size"]["height"] * Y_SCALE)
        let offset = vec2.fromValues(0, 0);
        let scale = vec2.fromValues(1, 1);
        if (entry["scale"]) {
            scale = vec2.fromValues(entry["scale"]["x"], entry["scale"]["y"]);
        }
        if (entry["offset"]) {
            offset = vec2.fromValues(entry["offset"]["x"], entry["offset"]["y"]);
        }
        let orientation = entry["orientation"];

		let obj = null;
        let spriteName = entry["spriteName"] ? "assets/" + entry["spriteName"] + ".png" : null;

		switch(entry["type"])
		{
		case "background":
		case "collision_mask":
		case "foreground":
		case "deco":
            let transformation = mat4.create()
			let pos = vec3.fromValues(entry["pos"]["x"] * X_SCALE, entry["pos"]["y"] * Y_SCALE, 0)
			scale = vec3.fromValues(entry["size"]["width"] * X_SCALE * 0.5, entry["size"]["height"] * Y_SCALE * 0.5, 0)
			mat4.fromRotationTranslationScale(transformation, quat.create(), pos, scale)
			level.objects.push(new Sprite(spriteName, transformation, entry["type"]))
			break;
		case "collidable":
		case "xcollidable":
			level.objects.push(new GameObject(spriteName, pos1, size, entry["type"], scale, offset, orientation))
			break;
		case "door":
            obj = new GameObject(spriteName, pos1, size, "door", scale, offset, orientation);
            obj.door = new Sprite("assets/Door.png", mat4.create());
			level.objects.push(obj)
			break;
		case "interactable":
            obj = new GameObject(spriteName, pos1, size, "interactable", scale, offset, orientation);
            obj.pickup = entry["pickup"];
			level.objects.push(obj)
			break;
		case "fire":
            obj = new GameObject(spriteName, pos1, size, entry["type"], scale, offset, orientation);
			obj.sprite.texture.frames = 6
            obj.to = entry["to"];
			level.objects.push(obj)
			break;
		case "teleporter":
            obj = new GameObject(spriteName, pos1, size, entry["type"], scale, offset, orientation);
            obj.to = entry["to"];
			level.objects.push(obj)
			break;
		}
	}
	level.exit = vec2.fromValues(levelData["exit"]["x"], levelData["exit"]["y"]);

	let cntr = 0
	if (typeof levelData["lights"] !== "undefined")
		for (let entry of levelData["lights"])
		{
			let color = [0, 0, 0]
			let pos = [0, 0]
			let dir = [0, 0]
			let cutoff = 0
			let intensity = 0

			color[0] = entry["color"]["r"]
			color[1] = entry["color"]["g"]
			color[2] = entry["color"]["b"]

			pos[0] = entry["pos"]["x"]
			pos[1] = entry["pos"]["y"]

			//currently expected to be normalized
			dir[0] = entry["dir"]["x"]
			dir[1] = entry["dir"]["y"]

			cutoff = entry["cutoff"]
			intensity = entry["intensity"]

			level.updateLight(cntr, color, pos, dir, cutoff, intensity)
			cntr += 1;
		}

	for (let i = cntr; i < 20; i++)
	{
		level.updateLight(i, [0, 0, 0], [0, 0], [0, 0], 0, 0)
	}
    
	level.lightCnt = cntr;
    
	level.bgFilter = vec3.fromValues(levelData["bgFilter"]["r"], levelData["bgFilter"]["g"], levelData["bgFilter"]["b"])
    
	level.isInitialized = false
    
    level.start = vec2.fromValues(levelData["start"]["x"], levelData["start"]["y"]);
    player.forceTeleport(level.start)
}
