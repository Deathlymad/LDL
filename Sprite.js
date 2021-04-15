import {mat4, vec3, vec2, quat} from "./gl-matrix-min.js"
//needed to get current shader
import {Shader} from "./Shader.js"

//engine state
import {gl} from "./state.js"


//static pipeline variables
const VERTEX_DIM = 3;
const UV_DIM = 2;

let wireframe = false; //for debugging. should maybe be optimized out for release

let texList = {}; //data cache

export let Texture2D = function(path, frames, callback) {
	this.name = path;

    //handles case for texture map (frames form a line over the actual image data)
	if (!frames)
		this.frames = 1;
	else
		this.frames = frames
	this.currFrame = 0 //reset to frame 0

	if (this.name in texList) { //if texture was already lkoaded and created use cache
		this.image = texList[this.name].image;
		this.tex = texList[this.name].tex;
        if (callback) callback();
	} else {
		this.tex = gl.createTexture(); //create new texture
        
        //debug code
		//gl.bindTexture(gl.TEXTURE_2D, this.tex);
		//gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));
        
        //load image
		this.image = new Image();
        this.image.onerror = function() {
            console.log("Could not load " + path);
        }
		this.image.onload = function () {
			gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

			gl.bindTexture(gl.TEXTURE_2D, this.tex);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
			gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

            //mipmapping might be error prone
			//gl.generateMipmap(gl.TEXTURE_2D); //should be done after setting clamping/filtering so that it can't encounter power of 2 issues
            if (callback) callback();
		}.bind(this);
		this.image.src = path;

		texList[this.name] = this; //cache data
	}

}
//handle the updates in the texture atlasses
Texture2D.prototype.nextFrame = function() {
	this.currFrame += 1;
	this.currFrame = this.currFrame % this.frames;
}
Texture2D.prototype.setFrame = function(frame) {
	this.currFrame = frame;
	this.currFrame = this.currFrame % this.frames;
}
//bind texture
Texture2D.prototype.bindTo = function(shader, position) {
	gl.activeTexture(position);
	gl.bindTexture(gl.TEXTURE_2D, this.tex);

	gl.uniform2fv(shader.getUniform('frame_data'), vec2.fromValues(this.currFrame, this.frames));
	gl.uniform2fv(shader.getUniform('texRes'), vec2.fromValues(this.image.width, this.image.height));
}

//generate color gradient as a texture
//TODO allow more than two color points.
export let GradientTexture2D = function(minCol, maxCol, steps) {
	let coefs = {}
	for(let key in cmin)
		coefs[key]=(maxCol[key]-minCol[key])/steps

	valFunc = function(coefs, minCol, v) {
		let col = {}
		for(let key in cmin)
			col[key]=coefs[key]*v + minCol[key]

		return col
	}.bind(null, coefs, minCol)

	data = []
    this.steps = steps
	for (i = 0; i < steps; i++)
	{
		data.push(valFunc(i))
	}

	this.texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, steps, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(data));
}
GradientTexture2D.prototype.bindTo = function(shader, position) {
	gl.activeTexture(position);
	gl.bindTexture(gl.TEXTURE_2D, this.tex);
	gl.uniform2fv(shader.getUniform('frame_data'), vec2.fromValues(0,1));
	gl.uniform2fv(shader.getUniform('texRes'), vec2.fromValues(this.steps, 1));
}

//Texture from Render Target useful for postprocessing.
export let DynamicTexture2D = function() {
    //has its own target framebuffer
	this.framebuffer = gl.createFramebuffer();

	this.tex = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, this.tex);

	//based on canvas this is optimal resolution but a nonstatic value forces reconstruction on resize :/
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.canvas.width, gl.canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.tex, 0);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}
//render to this texture
DynamicTexture2D.prototype.bindFramebuffer = function() {
	gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
	gl.clear(gl.COLOR_BUFFER_BIT);
}
//render to default target again
DynamicTexture2D.prototype.unbindFramebuffer = function() {
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}
//TODO test waht happens if texture is used to render to framebuffer
DynamicTexture2D.prototype.bindTo = function(shader, position) {
	gl.activeTexture(position);
	gl.bindTexture(gl.TEXTURE_2D, this.tex);
	gl.uniform2fv(shader.getUniform('frame_data'), vec2.fromValues(0,1));
	gl.uniform2fv(shader.getUniform('texRes'), vec2.fromValues(gl.canvas.width, gl.canvas.height));
}

//Canvas that carries texture
let Mesh = function(vertices, uv) {
	this.vertexCnt = Math.floor(vertices.length / VERTEX_DIM);
	this.uvCnt = Math.floor(uv.length / UV_DIM);

	//checking integrity of dataset
	if (vertices.length % VERTEX_DIM !== 0 || uv.length % UV_DIM !== 0)
		alert("Invalid mesh dataset. not able to divide array into vectors.");
	if (this.vertexCnt - this.uvCnt !== 0)
		alert("Count of UV and Vertex Coordinates don't match.");

	this.squareBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.squareBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW); //static because mesh data doesn't change. not because it doesn't move

	this.squareTexCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.squareTexCoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.STATIC_DRAW);
}
//binds the buffers to the data input
Mesh.prototype.bindVAO = function(shader) {
	gl.bindBuffer(gl.ARRAY_BUFFER, this.squareBuffer);
	gl.vertexAttribPointer(Shader.getAttrib("position"), VERTEX_DIM, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, this.squareTexCoordBuffer);
	gl.vertexAttribPointer(Shader.getAttrib("texCoord"), UV_DIM, gl.FLOAT, false, 0, 0);
}
//renders Mesh
Mesh.prototype.draw = function() {
	if (wireframe)
        gl.drawArrays(gl.LINE_STRIP, 0, this.vertexCnt);
	else
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vertexCnt);
}

//creates a flat 2D square with a texture and a transformation. Allows the usage of only a single mesh
export let Sprite = function(spritePath, transformation, parent) {
	if (typeof(Sprite.MESH) === "undefined")
		Sprite.MESH = new Mesh([1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0] , [ 1, 0, 0, 0, 1, 1, 0, 1]); //screen square
    
    //defaults to dummy sprite if no texture is provided
	if (spritePath === null) {
		this.texture = null
	}
	else {
		this.texture = new Texture2D(spritePath);
	}
	this.transform = typeof(transformation) === "undefined" ? mat4.create() : mat4.clone(transformation);
	this.m = mat4.create();
	this.parent = typeof(parent) === "undefined" ? null : parent;
}
Sprite.prototype.getTransformation = function() {
	if (this.parent !== null)
		mat4.mul(this.m, this.parent.getTransformation(), this.transform);
	else
		mat4.copy(this.m, this.transform);
	return this.m;
}
Sprite.prototype.setTransformation = function(transformation) {
	mat4.copy(this.transform, transformation);
}
Sprite.prototype.draw = function(shader) {
	if (this.texture === null) //should this also be inheriting?
		return;
    
    //render the own texture
	this.texture.bindTo(shader, gl.TEXTURE0);

	gl.uniformMatrix4fv(shader.getUniform('M'), false, this.getTransformation()); // write model transformation
	gl.uniform1i(shader.getUniform('texture'), 0);
	Sprite.MESH.bindToVAO(shader);
	Sprite.MESH.draw();
}


//Preset Rotations of the object.
export let Orientation = {
    DEFAULT: 0,
    MIRRORED: 1,
    ROTATED_45: 2
}

//Abstraction from Sprite to abstract from Transformation to the position and size of the object
export let GameObject = function(spritePath, position, size, type, scale = vec2.fromValues(1, 1), offset = vec2.fromValues(0, 0), orientation = Orientation.DEFAULT) {
    this.position = position;
    this.halfSize = vec2.create();
    this.type = type;
	this.scale = scale;
	this.baseScale = vec2.clone(scale);
	this.offset = offset;
	this.orientation = orientation;
    vec2.scale(this.halfSize, size, 0.5); //use center as reference point for position

	if (spritePath === null) {
		this.sprite = null;
	} else {
		this.sprite = new Sprite(spritePath, this.calculateTransform(), null);
	}
}
//compute new transformation for the sprite
GameObject.prototype.calculateTransform = function() {
    let transform = mat4.create();
    mat4.fromRotationTranslationScale(
        transform,
        this.orientation == Orientation.ROTATED_45 ? quat.fromEuler(quat.create(), 0, 0, 45) : quat.create(),
        vec3.fromValues(this.position[0] + this.offset[0], this.position[1] + this.offset[1], 0),
        vec3.fromValues(this.halfSize[0] * (this.orientation == Orientation.MIRRORED ? -1 : 1) * this.scale[0], this.halfSize[1] * this.scale[1], 1));
    return transform;
}
//update scale
GameObject.prototype.setSize = function(size) {
	let lastHalfY = this.halfSize[1]
    vec2.scale(this.halfSize, size, 0.5);
	
	//vec2.div(this.scale, this.baseScale, size)
	
    this.position[1] -= (lastHalfY - this.halfSize[1]) * this.baseScale[1]
	//this.offset[1] += (lastHalfY - this.halfSize[1]) * this.baseScale[1]
	
	if (this.sprite !== null)
		this.sprite.setTransformation(this.calculateTransform());
}
GameObject.prototype.setPosition = function(position) {
    this.position = position;
	if (this.sprite !== null)
		this.sprite.setTransformation(this.calculateTransform());
}
GameObject.prototype.draw = function(shader) {
    if (this.sprite !== null)
		this.sprite.draw(shader);
}