/**
 * Created by gleicher on 10/9/2015.
 */

/*
this is the "main" file - it gets loaded last - after all the objects are loaded
make sure that twgl is loaded first

it sets up the main function to be called on window.onload

 */

 var isValidGraphicsObject = function (object) {
    if(object.name === undefined) {
        console.log("warning: GraphicsObject missing name field");
        return false;
    }

    if(typeof object.draw !== "function" && typeof object.drawAfter !== "function") {
        console.log("warning: GraphicsObject of type " + object.name + " does not contain either a draw or drawAfter method");
        return false;
    }

    if(typeof object.center !== "function") {
        console.log("warning: GraphicsObject of type " + object.name + " does not contain a center method. ");
        return false;
    }

    if(typeof object.init !== "function") {
        console.log("warning: GraphicsObject of type " + object.name + " does not contain an init method. ");
        return false;
    }

    return true;
 }
window.onload = function() {
    "use strict";

    // Remove default key functions
    window.addEventListener('keydown', (e) => {
        if (e.target.localName != 'input') {   // if you need to filter <input> elements
            switch (e.keyCode) {
                case 32: // space
                case 37: // left
                case 39: // right
                case 38: // up
                case 40: // down
                    e.preventDefault();
                    break;
                default:
                    break;
            }
        }
    }, {
        capture: true,   // this disables arrow key scrolling in modern Chrome
        passive: false   // this is optional, my code works without it
    });

    // Remove Loading Message
    document.getElementById("canvasLoadingMessage").innerHTML = "";
    document.getElementById("loadingGif").remove();

    // set up the canvas and context
    // var canvas = document.createElement("canvas");
    var canvas = document.getElementById("drawingCanvas");
    canvas.setAttribute("width",600);
    canvas.setAttribute("height",600);
    document.body.appendChild(canvas);

    // make a place to put the drawing controls - a div
    var flightControls = document.createElement("DIV");
    flightControls.id = "flightControls";
    document.body.appendChild(flightControls);

    document.body.appendChild(document.createElement("BR"));
    document.body.appendChild(document.createElement("BR"));

    // make a place to put the drawing controls - a div
    var controls = document.createElement("DIV");
    controls.id = "controls";
    document.body.appendChild(controls);
    

    document.body.appendChild(document.createElement("BR"));
    document.body.appendChild(document.createElement("BR"));
    document.body.appendChild(document.createElement("BR"));
    document.body.appendChild(document.createElement("BR"));

    // Add a back button
    var backBtn = document.getElementById("backButton");
    // backBtn.innerHTML += "<a id=\"bw\" class=\"borderedLink\" href=\"../../default.htm\">Return To Landing Page</a>";
    document.body.appendChild(backBtn);
    document.body.appendChild(document.createElement("BR"));


    // var backBtnLink = document.createElement("A");
    // backBtnLink.id = "bw";
    // backBtnLink.href = "../../default.htm";
    // backBtnLink.classList.add("borderedLink");
    // backBtnLink.innerHTML = "Return To Landing Page";
    // backBtn.appendChild(backBtnLink);

    var controlsHeader = document.createElement("P");
    controlsHeader.innerHTML = "Advanced Controls";
    controls.appendChild( controlsHeader );

    // a switch between camera modes
    var uiMode = document.createElement("select");
    uiMode.innerHTML += "<option>Fly</option>";
    uiMode.innerHTML += "<option>ArcBall</option>";
    uiMode.innerHTML += "<option>Drive</option>";
    uiMode.innerHTML += "</select>";
    controls.appendChild(uiMode);

    var fireTimerId;
    function fireForward() {
        var dz = Math.cos(fireTheta);
        var dx = Math.sin(fireTheta);
        var dy = Math.sin(fireXTheta);

        firePos[0] -= .91*dx;
        firePos[2] -= .91*dz;
        firePos[1] += .91*dy;

        grThrowObjects.forEach(function (obj) {
            obj.position = firePos;
            if(obj.draw) obj.draw(drawingState);
        });
    }

    var resetButton = document.createElement("button");
    resetButton.innerHTML = "Reset View";
    resetButton.onclick = function() {
        // note - this knows about arcball (defined later) since arcball is lifted
        arcball.reset();

        // drivePos = [0,.2,5];
        // driveTheta = 0;
        // driveXTheta = 0;
        drivePos = [-20,14,-21];
        driveTheta = -2.28; // Left Right
        driveXTheta = -0.42; // Up Down        
    }
    controls.appendChild(resetButton);

    // make some checkboxes - using my cheesy panels code
    var checkboxes = makeCheckBoxes([ ["Run",1], ["Examine",0] ]); //

    // a selector for which object should be examined
    var toExamine = document.createElement("select");
    grobjects.forEach(function(obj) {
           toExamine.innerHTML +=  "<option>" + obj.name + "</option>";
        });
    controls.appendChild(toExamine);

    // make some sliders - using my cheesy panels code
    var sliders = makeSliders([["TimeOfDay",0,24,12]]);

    // this could be gl = canvas.getContext("webgl");
    // but twgl is more robust
    var gl = twgl.getWebGLContext(canvas);

    // make a fake drawing state for the object initialization
    var drawingState = {
        gl : gl,
        proj : twgl.m4.identity(),
        view : twgl.m4.identity(),
        camera : twgl.m4.identity(),
        sunDirection : [0,1,0]
    }
    

    // information for the cameras
    var lookAt = [0,0,0];
    var lookFrom = [0,5,-10];
    var fov = 1.1;

    var arcball = new ArcBall(canvas);

    // for timing
    var realtime = 0
    var lastTime = Date.now();

    // parameters for driving
    var drivePos = [-20,14,-21];
    var driveTheta = -2.28; // Left Right
    var driveXTheta = -0.42; // Up Down

    // parameters for driving
    var firePos = [-20,14,-21];
    var fireTheta = -2.28; // Left Right
    var fireXTheta = -0.42; // Up Down

    // cheesy keyboard handling
    var keysdown = {};

    document.body.onkeydown = function(e) {
        var event = window.event ? window.event : e;
        keysdown[event.keyCode] = true;
        e.stopPropagation();
    };
    document.body.onkeyup = function(e) {
        var event = window.event ? window.event : e;
        delete keysdown[event.keyCode];
        e.stopPropagation();
    };



    
    // In Browser Flight Controls
    var upTimerId;
    var downTimerId;
    var leftTimerId;
    var rightTimerId;
    var forwardTimerId;
    var backwardTimerId;

    function curveUp() {
        driveXTheta += 0.009;
    }
    function curveDown() {
        driveXTheta -= 0.009;
    }
    function curveLeft() {
        driveTheta += 0.009;
    }
    function curveRight() {
        driveTheta -= 0.009;
    }
    function goForward() {
        var dz = Math.cos(driveTheta);
        var dx = Math.sin(driveTheta);
        var dy = Math.sin(driveXTheta);

        drivePos[0] -= .11*dx;
        drivePos[2] -= .11*dz;
        drivePos[1] += .11*dy;
    }
    function goBackward() {
        var dz = Math.cos(driveTheta);
        var dx = Math.sin(driveTheta);
        var dy = Math.sin(driveXTheta);

        drivePos[0] += .11*dx;
        drivePos[2] += .11*dz;
        drivePos[1] -= .11*dy;
    }

    function turnOffTimers() {
        if (upTimerId) {
            clearInterval(upTimerId);
        }
        if (downTimerId) {
            clearInterval(downTimerId);
        }
        if (leftTimerId) {
            clearInterval(leftTimerId);
        }
        if (rightTimerId) {
            clearInterval(rightTimerId);
        }
        if (forwardTimerId) {
            clearInterval(forwardTimerId);
        }
        if (backwardTimerId) {
            clearInterval(backwardTimerId);
        }
    }


    var label = document.createElement("P");
    label.innerHTML = "In Browser Controls";
    flightControls.appendChild(label);
    
    var controlTbl = document.createElement("TABLE");
    controlTbl.style = "margin:auto; width:600px";
    controlTbl.classList.add("inBrowControlTbl");
    flightControls.appendChild(controlTbl);

    var controlTblRow = document.createElement("TR");
    controlTbl.appendChild(controlTblRow);

    // Up Down Left Right Col
    var controlTblUDLRCol = document.createElement("TD");
    controlTblUDLRCol.classList.add("UDLRCol");
    controlTblRow.appendChild(controlTblUDLRCol);

    // Up Row
    var controlTblUpRow= document.createElement("P");
    controlTblUDLRCol.appendChild(controlTblUpRow);

    var curveUpBtn = document.createElement("button");
    curveUpBtn.innerHTML = "Up";
    curveUpBtn.classList.add("UpDownBtn");
    curveUpBtn.onmousedown = function() {turnOffTimers(); upTimerId = setInterval( curveUp, 10);}
    curveUpBtn.ontouchstart = function() {turnOffTimers(); upTimerId = setInterval( curveUp, 10);}
    curveUpBtn.onmouseup = turnOffTimers;
    curveUpBtn.ontouchend =turnOffTimers;
    controlTblUpRow.appendChild(curveUpBtn);

    // Left Right Row
    var controlTblLRRow= document.createElement("P");
    controlTblUDLRCol.appendChild(controlTblLRRow);

    var curveLeftBtn = document.createElement("button");
    curveLeftBtn.innerHTML = "Left";
    curveLeftBtn.classList.add("LeftRightBtn");
    curveLeftBtn.onmousedown = function() {turnOffTimers(); leftTimerId = setInterval( curveLeft, 10);}
    curveLeftBtn.ontouchstart = function() {turnOffTimers(); leftTimerId = setInterval( curveLeft, 10);}
    curveLeftBtn.onmouseup = turnOffTimers;
    curveLeftBtn.ontouchend =turnOffTimers;
    controlTblLRRow.appendChild(curveLeftBtn);

    var leftRightBtnSpace = document.createElement("SPAN");
    leftRightBtnSpace.innerHTML = "&nbsp;&nbsp;&nbsp;";
    leftRightBtnSpace.classList.add("btnSplitter");
    controlTblLRRow.appendChild(leftRightBtnSpace);


    var curveRightBtn = document.createElement("button");
    curveRightBtn.innerHTML = "Right";
    curveRightBtn.classList.add("LeftRightBtn");
    curveRightBtn.onmousedown = function() {turnOffTimers(); rightTimerId = setInterval( curveRight, 10);}
    curveRightBtn.ontouchstart = function() {turnOffTimers(); rightTimerId = setInterval( curveRight, 10);}
    curveRightBtn.onmouseup = turnOffTimers;
    curveRightBtn.ontouchend =turnOffTimers;
    controlTblLRRow.appendChild(curveRightBtn);

    // Down Row
    var controlTblDwnRow= document.createElement("P");
    controlTblUDLRCol.appendChild(controlTblDwnRow);

    var curveDownBtn = document.createElement("button");
    curveDownBtn.innerHTML = "Down";
    curveDownBtn.classList.add("UpDownBtn");
    curveDownBtn.onmousedown = function() {turnOffTimers(); downTimerId = setInterval( curveDown, 10);}
    curveDownBtn.ontouchstart = function() {turnOffTimers(); downTimerId = setInterval( curveDown, 10);}
    curveDownBtn.onmouseup = turnOffTimers;
    curveDownBtn.ontouchend =turnOffTimers;
    controlTblDwnRow.appendChild(curveDownBtn);

    var controlTblBlankCol = document.createElement("TD");
    // controlTblBlankCol.style.width = "30px";
    controlTblBlankCol.classList.add("btnSplitter");
    controlTblRow.appendChild(controlTblBlankCol);
    
    // Fwd Bkwrd Col
    var controlTblFBCol = document.createElement("TD");
    controlTblFBCol.classList.add("FwdBackCol");
    controlTblRow.appendChild(controlTblFBCol);



    var moveForwardBtn = document.createElement("button");
    moveForwardBtn.innerHTML = "Forward";
    moveForwardBtn.classList.add("FwBkwrdBtn");
    moveForwardBtn.onmousedown = function() {turnOffTimers(); forwardTimerId = setInterval( goForward, 10);}
    moveForwardBtn.ontouchstart = function() {turnOffTimers(); forwardTimerId = setInterval( goForward, 10);}
    moveForwardBtn.onmouseup = turnOffTimers;
    moveForwardBtn.ontouchend =turnOffTimers;
    controlTblFBCol.appendChild(moveForwardBtn);

    var fwdBkwdBtnSpace = document.createElement("P");
    controlTblFBCol.appendChild(fwdBkwdBtnSpace);

    var moveBackwardBtn = document.createElement("button");
    moveBackwardBtn.innerHTML = "Backward";
    moveBackwardBtn.classList.add("FwBkwrdBtn");
    moveBackwardBtn.onmousedown = function() {turnOffTimers(); backwardTimerId = setInterval( goBackward, 10);}
    moveBackwardBtn.ontouchstart = function() {turnOffTimers(); backwardTimerId = setInterval( goBackward, 10);}
    moveBackwardBtn.onmouseup = turnOffTimers;
    moveBackwardBtn.ontouchend =turnOffTimers;
    controlTblFBCol.appendChild(moveBackwardBtn);

    var fireButton = document.createElement("button");
    fireButton.innerHTML = "Launch House";
    fireButton.onclick = function() {
        firePos[0] = drivePos[0];
        firePos[1] = drivePos[1];
        firePos[2] = drivePos[2];
        fireTheta = driveTheta; // Left Right
        fireXTheta = driveXTheta; // Up Down

        // grThrowObjects.forEach(function (obj) {
        //     obj.position = firePos;
        //     if(obj.draw) obj.draw(drawingState);
        // });

        if (fireTimerId) {
            clearInterval(fireTimerId);
        }   
        fireTimerId = setInterval( fireForward, 8);
    }
    flightControls.appendChild(fireButton);

    

    

    // the actual draw function - which is the main "loop"
    function draw() {
        // advance the clock appropriately (unless its stopped)
        var curTime = Date.now();
        if (checkboxes.Run.checked) {
            realtime += (curTime - lastTime);
        }
        lastTime = curTime;

        // first, let's clear the screen
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // figure out the transforms
        var projM = twgl.m4.perspective(fov, 1, 0.1, 1000);
        var cameraM = twgl.m4.lookAt(lookFrom,lookAt,[0,1,0]);
        var viewM = twgl.m4.inverse(cameraM);

        // implement the camera UI
        if (uiMode.value == "ArcBall") {
            viewM = arcball.getMatrix();
            twgl.m4.setTranslation(viewM, [0, 0, -10], viewM);
        } else if (uiMode.value == "Drive") {
            if (keysdown[65]) { driveTheta += .02; }
            if (keysdown[68]) { driveTheta -= .02; }
            if (keysdown[87]) {
                var dz = Math.cos(driveTheta);
                var dx = Math.sin(driveTheta);
                drivePos[0] -= .05*dx;
                drivePos[2] -= .05*dz;
            }
            if (keysdown[83]) {
                var dz = Math.cos(driveTheta);
                var dx = Math.sin(driveTheta);
                drivePos[0] += .05*dx;
                drivePos[2] += .05*dz;
            }

            cameraM = twgl.m4.rotationY(driveTheta);
            twgl.m4.setTranslation(cameraM, drivePos, cameraM);
            viewM = twgl.m4.inverse(cameraM);
        }else if (uiMode.value == "Fly") {

            if (keysdown[65] || keysdown[37]) { 
                driveTheta += .02; 
            }else if (keysdown[68] || keysdown[39]) { 
                driveTheta -= .02; 
            }

            if (keysdown[38]) { driveXTheta += .02; }
            if (keysdown[40]) { driveXTheta -= .02; }

            var dz = Math.cos(driveTheta);
            var dx = Math.sin(driveTheta);
            var dy = Math.sin(driveXTheta);

            if (keysdown[87]) {
                drivePos[0] -= .25*dx;
                drivePos[2] -= .25*dz;
                drivePos[1] += .25 * dy;
            }

            if (keysdown[83]) {
                drivePos[0] += .25*dx;
                drivePos[2] += .25*dz;
                drivePos[1] -= .25 * dy;
            }
            
            if (keysdown[83]) {
                drivePos[0] += .25*dx;
                drivePos[2] += .25*dz;
                drivePos[1] -= .25 * dy;
            }

            if (keysdown[32]) {
                fireButton.click();
            }

            cameraM = twgl.m4.rotationX(driveXTheta);
            twgl.m4.multiply(cameraM, twgl.m4.rotationY(driveTheta), cameraM);
            twgl.m4.setTranslation(cameraM, drivePos, cameraM);
            viewM = twgl.m4.inverse(cameraM);
        }

        // console.log(driveTheta + " " + driveXTheta + " " + drivePos + " " + lookFrom);

        // get lighting information
        var tod = Number(sliders.TimeOfDay.value);
        var sunAngle = Math.PI * (tod-6)/12;
        var sunDirection = [Math.cos(sunAngle),Math.sin(sunAngle),0];

        // make a real drawing state for drawing
        var drawingState = {
            gl : gl,
            proj : projM,   // twgl.m4.identity(),
            view : viewM,   // twgl.m4.identity(),
            camera : cameraM,
            timeOfDay : tod,
            sunDirection : sunDirection,
            realtime : realtime
        }

        // initialize all of the objects that haven't yet been initialized (that way objects can be added at any point)
        grobjects.forEach(function(obj) { 
            if(!obj.__initialized) {
                if(isValidGraphicsObject(obj)){
                    obj.init(drawingState);
                    obj.__initialized = true;
                }
            }
        });

        // initialize all of the objects that haven't yet been initialized (that way objects can be added at any point)
        grThrowObjects.forEach(function(obj) { 
            if(!obj.__initialized) {
                if(isValidGraphicsObject(obj)){
                    obj.init(drawingState);
                    obj.__initialized = true;
                }
            }
        });

        // now draw all of the objects - unless we're in examine mode
        if (checkboxes.Examine.checked) {
            // get the examined object - too bad this is an array not an object
            var examined = undefined;
            grobjects.forEach(function(obj) { if (obj.name == toExamine.value) {examined=obj;}});
            grThrowObjects.forEach(function(obj) { if (obj.name == toExamine.value) {examined=obj;}});
            var ctr = examined.center(drawingState);
            var shift = twgl.m4.translation([-ctr[0],-ctr[1],-ctr[2]]);
            twgl.m4.multiply(shift,drawingState.view,drawingState.view);

            if(examined.draw) examined.draw(drawingState);
            if(examined.drawAfter) examined.drawAfter(drawingState);
        } else {

            grobjects.forEach(function (obj) {
                if(obj.draw) obj.draw(drawingState);
            });

            grThrowObjects.forEach(function (obj) {
                if(obj.draw) obj.draw(drawingState);
            });

            grobjects.forEach(function (obj) {
                if(obj.drawAfter) obj.drawAfter();
            });
        }
        window.requestAnimationFrame(draw);
    };
    draw();
};
