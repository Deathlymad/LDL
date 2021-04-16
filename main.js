import { init as initGraphics, update as updateGraphics, projection, updateView } from "./render.js"
import {mat4, vec3, vec2} from "./gl-matrix-min.js"
import {update as updatePhysics} from "./physics.js"
import { init as initInput, update as updateInput, toggleInventory, menuUp, menuDown, menuLeft, menuRight, pickingUp} from "./input.js"
import {gl, setPlayer, player, level, menu, setPlayer, updateRegistry} from "./state.js"
import {GameObject, Sprite} from "./obj/Sprite.js";
import {loadLevel} from "./level.js"
import {updateInventory} from "./inventory.js"
import {init as initResource} from "./resource.js"
import {getItemSprite} from "./item.js"
import {updateAudio, initAudio, music, walk_wood} from "./audio.js"
import {Player} from "./player.js"

//timekeeper
var lastTick = null;
var unprocessed = 0;
const FRAME_TIME = 1000/60;
let frameCntr = 0
let framePos = 0
let eyeFrameCntr = 0
let eyeFramePos = 0

let MIN_FIRE_SCALE = 1.0
let MAX_FIRE_SCALE = 3.0
let fireCntr = 0
let firePos = 0
let dir = true

function main() {
    initGraphics(document.getElementById('glCanvas'));
    initInput();
    initAudio();

    initResource(function() {
        
        setPlayer(new Player());
        
        loadLevel(1) //TODO maybe remove. maybe replace with menu

        window.running = true;
        requestAnimationFrame(update);
    });
}

//TODO move to player
function playerFrameStepCnt(ticks) {
	const SPEED_DIFFERENCE = 0.25
	const PERIOD_INTERVAL = 15

	return SPEED_DIFFERENCE * Math.cos(Math.PI / PERIOD_INTERVAL * ticks) + 1 - SPEED_DIFFERENCE
}

//TODO move to player
function updatePlayerAnimation() {
	if (player.onGround) {
		frameCntr += 1;
        if ((frameCntr % 15) === 0) {
            frameCntr = 0;
            if (vec2.length(player.velocity) > 0)
            {
                framePos += 1;
                if ((framePos % 4) === 0)
                    framePos = 0;
                player.sprite.texture.setFrame(framePos);
            }
            else
                player.sprite.texture.setFrame(4)
        }
    }

	if (player.canInteract) {
		eyeFrameCntr += 1;
		if ((eyeFrameCntr % 8) === 0 && eyeFramePos < 4) {
			eyeFrameCntr = 0;
			eyeFramePos += 1;
			player.eyeSprite.texture.setFrame(eyeFramePos);
		}
	}
	else {
		eyeFramePos = 0;
		eyeFrameCntr = 0;
	}
}

//TODO move to Fire. this also has the advantage to give them random offsets. so that they aren't uniform.
function updateFires() {
	fireCntr += 1;
	if ((fireCntr % 60) === 0) {
		fireCntr = 0;
		firePos += 1
		if (firePos > 5)
			firePos = 0
	}
	for (let sprite of level.objects) {
		if (sprite.type !== "fire")
			continue

		sprite.setSize(vec2.fromValues(1, (firePos + 1) / 2))
		sprite.sprite.texture.setFrame(firePos)
	}
}

function update(now) {
    if (!lastTick) {
        lastTick = now;
    }

    unprocessed += now - lastTick;
    lastTick = now;

    if (unprocessed >= 1000) {
        // this means game has probably stopped running (e.g. computer was turned off)
		// TODO force game state into pause
        unprocessed = 0;
    }

    let shouldRender = false;
    while (unprocessed >= FRAME_TIME) { //time for a new frame
        unprocessed -= FRAME_TIME;
        shouldRender = true;
        updateInput(); //pull keypresses
		updateRegistry.update(); //update all that needs to be updated
        if (!inventory.level_end && toggleInventory()) { //TODO inventory code
            inventory.opened = !inventory.opened;
            inventory.cursorPosition = 0;
        }
        if (menu.sprite !== null) { //TODO create menu object
            walk_wood.pause();
            if (menu.cooldown == -1) {
                if (pickingUp()) {
                    if (music.paused) {
                        music.play();
                    }
                    menu.setSprite(null);
                }
            } else {
                menu.cooldown -= FRAME_TIME / 1000;
                if (menu.cooldown < 0) {
                    menu.setSprite(null);
                }
            }
        } else if (inventory.opened) {
            walk_wood.pause();
            updateInventory();
        } else if (inventory.end_end) {
        } else {
            //THIS IS THE MAIN UPDATE
            updatePhysics(FRAME_TIME / 1000); //update physics
			updateView(); //update camera
			updatePlayerAnimation(); //operate on player

			updateFires();
        }
        updateAudio(player.position);
    }

    // don't render if there was no update
    if (shouldRender) {
        updateGraphics();
    }

    if (window.running) {
        requestAnimationFrame(update);
    }
}

main();
