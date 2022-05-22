/**
 * Created by gleicher on 10/9/15.
 */
/*
 a second example object for graphics town
 check out "simplest" first

 the cube is more complicated since it is designed to allow making many cubes

 we make a constructor function that will make instances of cubes - each one gets
 added to the grobjects list

 we need to be a little bit careful to distinguish between different kinds of initialization
 1) there are the things that can be initialized when the function is first defined
    (load time)
 2) there are things that are defined to be shared by all cubes - these need to be defined
    by the first init (assuming that we require opengl to be ready)
 3) there are things that are to be defined for each cube instance
 */
var grobjects = grobjects || [];

// allow the two constructors to be "leaked" out
var House = undefined;

// this is a function that runs at loading time (note the parenthesis at the end)
(function() {
    "use strict";

    // i will use this function's scope for things that will be shared
    // across all cubes - they can all have the same buffers and shaders
    // note - twgl keeps track of the locations for uniforms and attributes for us!
    var shaderProgram = undefined;
    var buffers = undefined;

    // constructor for Cubes
    House = function House(name, position, size, color) {
        this.name = name;
        this.position = position || [0,0,0];
        this.size = size || 1.0;
        this.color = color || [.7,.8,.9];
    }
    House.prototype.init = function(drawingState) {
        var gl=drawingState.gl;
        // create the shaders once - for all cubes
        if (!shaderProgram) {
            shaderProgram = twgl.createProgramInfo(gl, ["cube-vs", "cube-fs"]);
        }
        if (!buffers) {
            var arrays = {
                vpos : { numComponents: 3, data: [
                    0,0,0,     0,12,0,      0,0,15,
					0,12,0,    0,0,15,      0,12,15,
					-1,12,0,   -1,12,15,    0,12,15,
					-1,12,0,   0,12,0,      0,12,15,
					-1,12,0,   3.5,20,0,    -1,12,15,
					3.5,20,0,  3.5,20,15,   -1,12,15,
					3.5,20,0,  3.5,20,15,   8,12,15,
					3.5,20,0,  8,12,0,      8,12,15,
					-1,12,0,   7,12,0,      3.5,20,0,
					0,0,0,     0,12,0,      7,12,0,
					0,0,0,     7,12,0,      7,0,0,
					7,12,0,    7,12,15,     8,12,15,
					8,12,0,    7,12,0,      7,12,15,
					7,0,0,     7,12,0,      7,0,15,
					7,12,0,    7,12,15,     7,0,15,
					0,0,0,     7,0,0,       0,0,15,
					7,0,0,     0,0,15,      7,0,15,
					0,0,15,    7,12,15,     7,0,15,
					0,12,15,   0,0,15,      7,12,15,
					-1,12,15,  3.5,20,15,   8,12,15
                ] },
                vnormal : {numComponents:3, data: [
					-1,0,0, -1,0,0, -1,0,0,
					-1,0,0, -1,0,0, -1,0,0,
					0,-1,0, 0,-1,0, 0,-1,0,
					0,-1,0, 0,-1,0, 0,-1,0,
					8,3.5,0,  8,3.5,0,  8,3.5,0,
					8,3.5,0,  8,3.5,0,  8,3.5,0,
					3.5,8,0,  3.5,8,0,  3.5,8,0,
					3.5,8,0,  3.5,8,0,  3.5,8,0,
					0,0,-1, 0,0,-1, 0,0,-1,
					0,0,-1, 0,0,-1, 0,0,-1,
					0,0,-1, 0,0,-1, 0,0,-1,
					0,-1,0, 0,-1,0, 0,-1,0,
					0,-1,0, 0,-1,0, 0,-1,0,
					1,0,0, 1,0,0, 1,0,0,
					1,0,0, 1,0,0, 1,0,0, //--
					0,-1,0, 0,-1,0, 0,-1,0,
					0,-1,0, 0,-1,0, 0,-1,0,
					0,0,1, 0,0,1, 0,0,1,
					0,0,1, 0,0,1, 0,0,1,
					0,0,1, 0,0,1, 0,0,1,
                ]}
            };
            buffers = twgl.createBufferInfoFromArrays(drawingState.gl,arrays);
        }

    };
    House.prototype.draw = function(drawingState) {
        // we make a model matrix to place the cube in the world
        var modelM = twgl.m4.scaling([this.size,this.size,this.size]);
        twgl.m4.setTranslation(modelM,this.position,modelM);
        // the drawing coce is straightforward - since twgl deals with the GL stuff for us
        var gl = drawingState.gl;
        gl.useProgram(shaderProgram.program);
        twgl.setBuffersAndAttributes(gl,shaderProgram,buffers);
        twgl.setUniforms(shaderProgram,{
            view:drawingState.view, proj:drawingState.proj, lightdir:drawingState.sunDirection,
            cubecolor:this.color, model: modelM });
        twgl.drawBufferInfo(gl, gl.TRIANGLES, buffers);
    };
    House.prototype.center = function(drawingState) {
        return this.position;
    }



})();

// put some objects into the scene
// normally, this would happen in a "scene description" file
// but I am putting it here, so that if you want to get
// rid of cubes, just don't load this file.
grobjects.push(new House("house1",[-8, 0,-7],0.1, [0,0.5,0.5]));
grobjects.push(new House("house2",[-6,0, -7],0.1, [1,0,1]));
grobjects.push(new House("house3",[-4, 0,-7],0.1 , [0,1,0]));
grobjects.push(new House("hosue4",[-2,0, -7],0.1, [1,0.5,0]));
grobjects.push(new House("hosue5",[ 0,0, -7],0.1, [1,0.5,0.64]));
grobjects.push(new House("hosue17",[ 2,0, -7],0.1, [1,0.3,0]));
grobjects.push(new House("hosue18",[ 4,0, -7],0.1, [1,0.5,0.7]));
grobjects.push(new House("hosue19",[ 8,0, -7],0.1, [.3,0.5,0.1]));

grobjects.push(new House("house20",[-8, 0,-4],0.1, [.24,0.22,0.5]));
grobjects.push(new House("house21",[-6,0, -4],0.1, [.42,0,1]));
grobjects.push(new House("house22",[-4, 0,-4],0.1 , [.4,1,0]));
grobjects.push(new House("hosue23",[-2,0, -4],0.1, [.79,0.4,.53]));
grobjects.push(new House("hosue24",[ 0,0, -4],0.1, [.3,0.5,.25]));
grobjects.push(new House("hosue6",[ 2,0, -4],0.1, [.67,0.5,.74]));
grobjects.push(new House("hosue7",[ 4,0, -4],0.1, [.25,0.5,.36]));
grobjects.push(new House("hosue8",[ 8,0, -4],0.1, [0.24,0.4,.68]));
grobjects.push(new House("hosue9",[ 8,0, -1],0.1, [0.57,0.5,0.36]));
grobjects.push(new House("hosue10",[ 8,0, 2],0.1, [0.46,0.5,0.46]));
grobjects.push(new House("hosue11",[ 8,0, 5],0.1, [0.36,0.5,0.47]));
grobjects.push(new House("hosue12",[ 8,0, 8],0.1, [.8,0.5,0.97]));

grobjects.push(new House("hosue13",[ 4,0, -1],0.1, [.25,0.55,0.57]));
grobjects.push(new House("hosue14",[ 4,0, 2],0.1, [0.467,0.54,0.13]));
grobjects.push(new House("hosue15",[ 4,0, 5],0.1, [0.42,0.97,0]));
grobjects.push(new House("hosue16",[ 4,0, 8],0.1, [0.64,0.24,0.85]));



//grobjects.push(new SpinningCube("scube 1",[-2,0.5, -2],0.1) );
//grobjects.push(new SpinningCube("scube 2",[-2,0.5,  2],0.1,  [1,0,0], 'Y'));
//grobjects.push(new SpinningCube("scube 3",[ 2,0.5, -2],0.1 , [0,0,1], 'Z'));
//grobjects.push(new SpinningCube("scube 4",[ 2,0.5,  2],0.1));
