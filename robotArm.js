"use strict";

var canvas, gl, program;

var NumVertices = 36; //(6 faces)(2 triangles/face)(3 vertices/triangle)

var points = [];
var colors = [];

var vertices = [
    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4(  0.5,  0.5,  0.5, 1.0 ),
    vec4(  0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4(  0.5,  0.5, -0.5, 1.0 ),
    vec4(  0.5, -0.5, -0.5, 1.0 )
];

// RGBA colors
var vertexColors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 1.0, 1.0, 1.0, 1.0 ),  // white
    vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
];


// Parameters controlling the size of the Robot's arm

var BASE_HEIGHT      = 2.0;
var BASE_WIDTH       = 5.0;
var LOWER_ARM_HEIGHT = 5.0;
var LOWER_ARM_WIDTH  = 0.5;
var UPPER_ARM_HEIGHT = 5.0;
var UPPER_ARM_WIDTH  = 0.5;
var CLAW_HEIGHT = 2.0;
var CLAW_WIDTH  = 0.5;

// Shader transformation matrices

var modelViewMatrix, projectionMatrix;

// Array of rotation angles (in degrees) for each rotation axis

var Base = 0;
var LowerArm = 1;
var UpperArm = 2;
var Claw = 3;

var theta= [ 30, -80, 130, 30];

var angle = 0;

var modelViewMatrixLoc;

var vBuffer, cBuffer;

//----------------------------------------------------------------------------

function quad(  a,  b,  c,  d ) {
    colors.push(vertexColors[a]);
    points.push(vertices[a]);
    colors.push(vertexColors[a]);
    points.push(vertices[b]);
    colors.push(vertexColors[a]);
    points.push(vertices[c]);
    colors.push(vertexColors[a]);
    points.push(vertices[a]);
    colors.push(vertexColors[a]);
    points.push(vertices[c]);
    colors.push(vertexColors[a]);
    points.push(vertices[d]);
}


function colorCube() {
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}


//--------------------------------------------------


window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );

    gl = canvas.getContext('webgl2');
    if (!gl) { alert( "WebGL 2.0 isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );

    gl.clearColor( 0.0, 1.0, 1.0, 1.0 );
    gl.enable( gl.DEPTH_TEST );
    gl.depthFunc(gl.LESS); // Ensure that fragments closer to the camera are displayed

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );

    gl.useProgram( program );

    colorCube();

    // Load shaders and use the resulting shader program

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Create and initialize  buffer objects

    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var positionLoc = gl.getAttribLocation( program, "aPosition" );
    gl.vertexAttribPointer( positionLoc, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( positionLoc );

    cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var colorLoc = gl.getAttribLocation( program, "aColor" );
    gl.vertexAttribPointer( colorLoc, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( colorLoc );

    document.getElementById("slider1").oninput = function(event) {
        theta[0] = event.target.value;
    };
    document.getElementById("slider2").oninput = function(event) {
        theta[1] = event.target.value;
    };
    document.getElementById("slider3").oninput = function(event) {
        theta[2] =  event.target.value;
    };
    document.getElementById("slider4").oninput = function(event) {
        theta[3] =  event.target.value;
    };

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");

    var aspectRatio = canvas.width / canvas.height;
    var viewHeight = 20;  // adjusted based on how much of the scene you want to view vertically

    projectionMatrix = ortho(-viewHeight * aspectRatio / 2, viewHeight * aspectRatio / 2,
        -viewHeight/2, viewHeight / 2,
        -10, 10); // Adjust near and far planes if needed
    gl.uniformMatrix4fv( gl.getUniformLocation(program, "projectionMatrix"),  false, flatten(projectionMatrix) );

    render();
}

//----------------------------------------------------------------------------


function base() {
    var s = scale(BASE_WIDTH, BASE_HEIGHT, BASE_WIDTH);
    //console.log("s", s);
    var instanceMatrix = mult( translate( 0.0, 0.5 * BASE_HEIGHT, 0.0 ), s);
    //var instanceMatrix = mult(s,  translate( 0.0, 0.5 * BASE_HEIGHT, 0.0 ));

    //console.log("instanceMatrix", instanceMatrix);

    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc,  false, flatten(t)  );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

    //console.log("base", t);
}

//----------------------------------------------------------------------------


function upperArm() {
    var s = scale(UPPER_ARM_WIDTH, UPPER_ARM_HEIGHT, UPPER_ARM_WIDTH);
    //console.log("s", s);

    var instanceMatrix = mult(translate( 0.0, 0.5 * UPPER_ARM_HEIGHT, 0.0 ),s);
    //var instanceMatrix = mult(s, translate(  0.0, 0.5 * UPPER_ARM_HEIGHT, 0.0 ));

    //console.log("instanceMatrix", instanceMatrix);

    var t = mult(modelViewMatrix, instanceMatrix);

    //console.log("upper arm mv", modelViewMatrix);

    gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(t)  );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

    //console.log("upper arm t", t);

}

//----------------------------------------------------------------------------


function lowerArm()
{
    var s = scale(LOWER_ARM_WIDTH, LOWER_ARM_HEIGHT, LOWER_ARM_WIDTH);
    var instanceMatrix = mult( translate( 0.0, 0.5 * LOWER_ARM_HEIGHT, 0.0 ), s);


    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(t)   );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

}

//----------------------------------------------------------------------------

function claw1Lower() {
    var s = scale(CLAW_WIDTH*3, CLAW_HEIGHT / 4, CLAW_WIDTH);

    var rotationMatrix = rotate(-30, vec3(0, 0, 1)); // Rotate around the Z-axis
    // Translate outward (fixed to the arm, no opening/closing action)
    var instanceMatrix = mult(rotationMatrix, translate(0.8, -0.13 * CLAW_HEIGHT, 0.0));
    instanceMatrix = mult(instanceMatrix, s);

    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
    gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

//----------------------------------------------------------------------------

function claw2Lower() {
    var s = scale(CLAW_WIDTH, CLAW_HEIGHT, CLAW_WIDTH);

    var rotationMatrix = rotate(-55, vec3(0, 0, 1)); // Rotate around the Z-axis
    // Translate outward based on theta[Claw] (this one opens/closes to grab)
    var instanceMatrix = mult(rotationMatrix, translate(-0.3, CLAW_HEIGHT/2.1, 0.0));
    instanceMatrix = mult(instanceMatrix, s);

    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
    gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

//----------------------------------------------------------------------------


function claw1Upper() {
    var s = scale(CLAW_WIDTH, CLAW_HEIGHT, CLAW_WIDTH);

    // Translate outward based on theta[Claw] (this one opens/closes to grab)
    var instanceMatrix = mult(translate(0.0 , 0.7 * CLAW_HEIGHT, 0.0), s);

    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
    gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

//----------------------------------------------------------------------------

function claw2Upper() {
    var s = scale(CLAW_WIDTH, CLAW_HEIGHT, CLAW_WIDTH);

    // Translate outward based on theta[Claw] (this one opens/closes to grab)
    var instanceMatrix = mult(translate(0.0 , 0.7 * CLAW_HEIGHT, 0.0), s);

    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
    gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

//----------------------------------------------------------------------------



function joint(size) {
    var s = scale(size, size, size);
    var instanceMatrix = mult(modelViewMatrix, s);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));

    // Render a single point as the joint
    gl.drawArrays(gl.POINTS, 20, 1);
}

function rotateClawsAroundJoints() {
    var savedMatrix = modelViewMatrix;

    // For claw 1
    // Move to the joint's position
    modelViewMatrix = mult(modelViewMatrix, translate(1.5, CLAW_HEIGHT * 0.3, 0.0));

    // Disable depth test to ensure the joint is visible
    gl.disable(gl.DEPTH_TEST);
    joint(0.0); // Draw the joint
    gl.enable(gl.DEPTH_TEST);

    // Save the matrix after translating to the joint position
    /*var jointMatrix = modelViewMatrix;

    // Calculate the position of the upper claw based on the formula
    var clawRadius = CLAW_HEIGHT/2;
    var clawAngle = (theta[Claw] * (Math.PI / 180)); // Convert to radians if needed
    var x = -1.0+clawRadius * (Math.cos(clawAngle));
    var y = clawRadius * (Math.sin(clawAngle));

    // Apply the rotation around the joint (which is at the origin now)
    modelViewMatrix = mult(jointMatrix, rotate(-theta[Claw], vec3(0, 0, 1)));


    // Translate to the claw's position relative to the joint
    modelViewMatrix = mult(modelViewMatrix, translate(x, y, 0.0));
*/
    //Vi har flyttet claw til joint så det burde være unødvendig med all den koden over, som bare skaper
    //forvirring og problemer med posisjon.
    modelViewMatrix = mult(modelViewMatrix, rotate(-theta[Claw], vec3(0, 0, 1)));
    // Draw the upper claw
    claw1Upper();

    // Restore the modelViewMatrix for further transformations
    modelViewMatrix = savedMatrix;

    // Repeat similar steps for claw 2 if needed
    // For claw 2
    // Move to the joint's position
    modelViewMatrix = mult(savedMatrix, translate(-1.5, CLAW_HEIGHT * 0.3, 0.0));

    // Disable depth test to ensure the joint is visible
    gl.disable(gl.DEPTH_TEST);
    joint(0.0); // Draw the joint
    gl.enable(gl.DEPTH_TEST);

    // Save the matrix after translating to the joint position
    //jointMatrix = modelViewMatrix;

    // Apply the rotation around the joint (which is at the origin now)
    //modelViewMatrix = mult(jointMatrix, rotate(theta[Claw], vec3(0, 0, 1)));

    //Samme som claw1. Apply the rotation around the joint
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[Claw], vec3(0, 0, 1)));

    // Translate to the claw's position relative to the joint
    //modelViewMatrix = mult(modelViewMatrix, translate(-x, y, 0.0));

    // Draw the upper claw
    claw2Upper();

    // Restore the modelViewMatrix for further transformations
    modelViewMatrix = savedMatrix;
}



var render = function() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Base rotation and drawing
    modelViewMatrix = rotate(theta[Base], vec3(0, 1, 0));
    modelViewMatrix = mult(modelViewMatrix, translate(0.0, -5.0, 0.0));
    base();

    // Move to the joint position between the base and lower arm
    modelViewMatrix = mult(modelViewMatrix, translate(0.0, BASE_HEIGHT, 0.0));

    // Render the joint between base and lower arm
    joint(0.0);

    // Lower arm transformation (rotate around the joint)
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[LowerArm], vec3(0, 0, 1)));
    lowerArm();

    // Move to the joint position between the lower arm and upper arm
    modelViewMatrix = mult(modelViewMatrix, translate(0.0, LOWER_ARM_HEIGHT, 0.0));

    // Render the joint between lower arm and upper arm
    gl.disable( gl.DEPTH_TEST );
    joint(0.0);
    gl.enable( gl.DEPTH_TEST );

    // Upper arm transformation (rotate around the joint)
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[UpperArm], vec3(0, 0, 1)));
    upperArm();

    // Move to the position where the claws are connected to the upper arm
    modelViewMatrix = mult(modelViewMatrix, translate(0.0, UPPER_ARM_HEIGHT, 0.0));

    // Render the joint for the claws
    gl.disable( gl.DEPTH_TEST );
    joint(0.0);
    gl.enable( gl.DEPTH_TEST );

    // Move a little more up for the claws
    modelViewMatrix = mult(modelViewMatrix, translate(0.0, UPPER_ARM_HEIGHT*0.07, 0.0));

    // Render the lower parts of both claws
    claw1Lower();
    claw2Lower();

    // Rotate the upper claws around the joints
    rotateClawsAroundJoints();

    // Request the next frame
    requestAnimationFrame(render);
}



