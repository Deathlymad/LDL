import {Sprite} from "./Sprite.js"
import {Menu} from "./menu.js"

let ITEM_SPRITES = {
	10 : "assets/lvl1/kids-drawing.png",
	11 : "assets/lvl1/love-letter.png",
	12 : "assets/lvl1/love-you.png",
	13 : "assets/lvl1/Pocket_Watch.png",
	14 : "assets/lvl1/home-sweet-home.png",

	20 : "assets/lvl2/Ring_poliert_Blickdicht.png",
	21 : "assets/lvl2/Diary_entry.png",
	22 : "assets/lvl2/mailbox.png",
	23 : "assets/lvl2/Photos_von_freunden.png",
	24 : "assets/lvl2/sticky_note.png",

	30 : "assets/lvl3/Medical_Record.png",
    31 : "assets/lvl3/hospital-letter.png",
    32 : "assets/lvl3/nebenwirkungen.png",
    33 : "assets/lvl3/newspaper-accident.png",
    34 : "assets/lvl3/photo-stack.png",

    40: "assets/lvl4/Amber_Alert.png",
    41: "assets/lvl4/Burned_ring.png",
    42: "assets/lvl4/divorce_papers.png",
    43: "assets/lvl4/Flask.png",
    44: "assets/lvl4/Meds.png",

    50: "assets/lvl5/empty-bottles.png",
    51: "assets/lvl5/torn-family-photo.png",
    52: "assets/lvl5/zippo.png",
	53 : "assets/lvl2/mailbox.png",
	
	60 : "assets/lvl6/Newspaper_burnt_house.png",
	61 : "assets/lvl6/Burnt_Pics.png",
	62 : "assets/lvl6/wallet.png"
};

export let ITEM_SOUNDS = {
    10 : "assets/sounds/paper/paper-10.wav",
    11 : "assets/sounds/paper/paper-07.wav",
    12 : "assets/sounds/paper/paper-45.wav",
    13 : "assets/sounds/clock/smallclock.wav",
	14 : "assets/sounds/paper/paper-24.wav",

	20 : "assets/sounds/ring/silent_ring.wav",
	21 : "assets/sounds/paper/paper-34.wav",
    22 : "assets/lvl2/voicemail.ogg",				// Voice
	23 : "assets/sounds/paper/paper-43.wav",
	24 : "assets/sounds/paper/paper-01.wav",

	30 : "assets/sounds/paper/paper-22.wav",
    31 : "assets/sounds/paper/paper-41.wav",
    32 : "assets/sounds/paper/paper-42.wav",
    33 : "assets/sounds/paper/paper-30.wav",
    34 : "assets/sounds/paper/paper-37.wav",

    40 : "assets/lvl4/amber_alert.ogg",				// Voice
    41 : "assets/sounds/ring/dark_ring.wav",
    42 : "assets/sounds/paper/paper-38.wav",
    43 : "assets/sounds/bottle/zisch-further-embiggened.wav",
    44 : "assets/sounds/pills/pills.wav",

    50 : "assets/sounds/bottle/empty_bottles.wav",
    51 : "assets/sounds/paper/paper-33.wav",
    52 : "assets/sounds/lighter/lighter.wav",
    53 : "assets/lvl5/voicemail.ogg",				// Voice
	
	60 : "assets/sounds/paper/paper-30.wav",
	61 : "assets/sounds/paper/paper-37.wav",
	62 : "assets/sounds/paper/paper-1.wav"
};

let ITEM_TRIGGER = {
};

let ITEM_SPRITE_FRAMES = {
	22 : 2,
    53 : 2
}

//builds item objects from static data tables
export function getItemSprite(id, transformation, parent, animate) {
	let sprite = new Sprite(ITEM_SPRITES[id], transformation, parent)
	sprite.item_id = id
	if (typeof ITEM_SPRITE_FRAMES[id] !== "undefined")
		sprite.texture.frames = ITEM_SPRITE_FRAMES[id]

	if (typeof ITEM_SOUNDS[id] !== "undefined")
		sprite.sound = new Audio(ITEM_SOUNDS[id])

	if (typeof ITEM_TRIGGER[id] !== "undefined") {
		sprite.onOpen = ITEM_TRIGGER[id].open.bind(sprite)
		sprite.onClose = ITEM_TRIGGER[id].close.bind(sprite)
	}
	else {
		sprite.onOpen = function() { if (typeof sprite.sound !== "undefined") sprite.sound.play()}
		sprite.onClose = function() { if (typeof sprite.sound !== "undefined") sprite.sound.pause()}
	}

	return sprite
}
export function getItemMenuSprite(id, transformation, parent, animate) {
	let sprite = new Menu(ITEM_SPRITES[id], transformation, parent)
	sprite.item_id = id
	if (typeof ITEM_SPRITE_FRAMES[id] !== "undefined")
		sprite.texture.frames = ITEM_SPRITE_FRAMES[id]

	if (typeof ITEM_SOUNDS[id] !== "undefined")
		sprite.sound = new Audio(ITEM_SOUNDS[id])

	if (typeof ITEM_TRIGGER[id] !== "undefined") {
		sprite.onOpen = ITEM_TRIGGER[id].open.bind(sprite)
		sprite.onClose = ITEM_TRIGGER[id].close.bind(sprite)
	}
	else {
		sprite.onOpen = function() { if (typeof sprite.sound !== "undefined") sprite.sound.play()}
		sprite.onClose = function() { if (typeof sprite.sound !== "undefined") sprite.sound.pause()}
	}

	return sprite
}

