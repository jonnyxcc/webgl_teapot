
var gl;
var canvas;
var shaderProgram;

// Teapot buffers
var vertexPositionBuffer;
var vertexNormalBuffer;
var vertexIndexBuffer;

// Skybox buffers
var cubeVertexBuffer;
var cubeTriIndexBuffer;
var cubeTCoordBuffer;

// Texture buffers
var cubeImage;
var cubeTexture;
var vertexTextureCoordBuffer; 

var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var nMatrix = mat3.create();

var rotAngle = 0;
var lastTime = 0;

var x = 0;

var eyePt = vec3.fromValues(0.0,0.0,0.0);
var viewPt = vec3.fromValues(0.0,0.0,0.0);
var viewDir = vec3.fromValues(0.0,0.0,0.0);
var up = vec3.fromValues(0.0,0.0,0.0);
var angle = 0;
/*
  Set matrix uniforms for the shader
*/
//-------------------------------------------------------------------------
function uploadModelViewMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

//-------------------------------------------------------------------------
function uploadProjectionMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, 
                      false, pMatrix);
}
//-------------------------------------------------------------------------
function uploadNormalMatrixToShader() {
  mat3.fromMat4(nMatrix,mvMatrix);
  mat3.transpose(nMatrix,nMatrix);
  mat3.invert(nMatrix,nMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}
//----------------------------------------------------------------------------------
function setMatrixUniforms() {
    uploadModelViewMatrixToShader();
    uploadNormalMatrixToShader();
    uploadProjectionMatrixToShader();
}

//----------------------------------------------------------------------------------
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

/*
    function create GL context:
    input: canvas
    output: context

    Creates a GL context out of the provided canvas
*/
function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

/*
    function Load shaders
    input: id
    output: shader

    Create a shader for use in WebGL
*/
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
  
  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}

/*
    function setupShaders:
    input: none
    output: none

    Setup the shaders with the proper colors for use in WebGL
*/
function setupShaders() {
  var vertexShader = loadShaderFromDOM("shader-vs");
  var fragmentShader = loadShaderFromDOM("shader-fs");
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

  shaderProgram.texCoordAttribute = gl.getAttribLocation(shaderProgram, "aTexCoord"); //texture coordinates
  gl.enableVertexAttribArray(shaderProgram.texCoordAttribute);

  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");

}

/*
    function setupBuffers:
    input: none
    output: none

    Setup the badge with the proper colors for use in WebGL
*/
var cubeVertexBuffer;
var cubeTriIndexBuffer;

function setupBuffers() {
    readTextFile('teapot_0.obj', function (file) { //get the teapot object file
      teapot(computeNorms(obj2data(file)));
  });


  // Create a buffer for the cube's vertices.

  cubeVertexBuffer = gl.createBuffer();

  // Select the cubeVerticesBuffer as the one to apply vertex
  // operations to from here out.

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);

  // Now create an array of vertices for the cube.

  var vertices = [
    -0.5, -0.5,  0.5,
     0.5, -0.5,  0.5,
     0.5,  0.5,  0.5,
    -0.5,  0.5,  0.5,

    // Back face
    -0.5, -0.5, -0.5,
    -0.5,  0.5, -0.5,
     0.5,  0.5, -0.5,
     0.5, -0.5, -0.5,

    // Top face
    -0.5,  0.5, -0.5,
    -0.5,  0.5,  0.5,
     0.5,  0.5,  0.5,
     0.5,  0.5, -0.5,

    // Bottom face
    -0.5, -0.5, -0.5,
     0.5, -0.5, -0.5,
     0.5, -0.5,  0.5,
    -0.5, -0.5,  0.5,

    // Right face
     0.5, -0.5, -0.5,
     0.5,  0.5, -0.5,
     0.5,  0.5,  0.5,
     0.5, -0.5,  0.5,

    // Left face
    -0.5, -0.5, -0.5,
    -0.5, -0.5,  0.5,
    -0.5,  0.5,  0.5,
    -0.5,  0.5, -0.5
/* If you enable this comment, the environment will load to see the Teapot fully, but can't be seen without pMatrix
    //front face
    -10.0, -10.0,  10.0,
     10.0, -10.0,  10.0,
     10.0,  10.0,  10.0,
    -10.0,  10.0,  10.0,

    // Back face
    -10.0, -10.0, -10.0,
    -10.0,  10.0, -10.0,
     10.0,  10.0, -10.0,
     10.0, -10.0, -10.0,

    // Top face
    -10.0,  10.0, -10.0,
    -10.0,  10.0,  10.0,
     10.0,  10.0,  10.0,
     10.0,  10.0, -10.0,

    // Bottom face
    -10.0, -10.0, -10.0,
     10.0, -10.0, -10.0,
     10.0, -10.0,  10.0,
    -10.0, -10.0,  10.0,

    // Right face
     10.0, -10.0, -10.0,
     10.0,  10.0, -10.0,
     10.0,  10.0,  10.0,
     10.0, -10.0,  10.0,

    // Left face
    -10.0, -10.0, -10.0,
    -10.0, -10.0,  10.0,
    -10.0,  10.0,  10.0,
    -10.0,  10.0, -10.0
*/
  ];

  // Now pass the list of vertices into WebGL to build the shape. We
  // do this by creating a Float32Array from the JavaScript array,
  // then use it to fill the current vertex buffer.

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  // Map the texture onto the cube's faces.

  cubeTCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeTCoordBuffer);

  var textureCoordinates = [
    // Front
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Back
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Top
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Bottom
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Right
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Left
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
                gl.STATIC_DRAW);

  // Build the element array buffer; this specifies the indices
  // into the vertex array for each face's vertices.

  cubeTCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeTCoordBuffer);

  var textureCoordinates = [
    // Front
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Back
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Top
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Bottom
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Right
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Left
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
                gl.STATIC_DRAW);

  cubeTriIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeTriIndexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.

  var cubeVertexIndices = [
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23    // left
  ]

  // Now send the element array to GL

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
}

//------------------------------------------
// function teapot, receives the buffer containing the texture coordinates, normals, indices and vertex positions
// initializes all buffers for use in webgl
function teapot(teapot) {

  // Initialize the Teapot buffers
  vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapot.vertexPositions), gl.STATIC_DRAW);
  vertexPositionBuffer.itemSize = 3;
  vertexPositionBuffer.numberOfItems = teapot.vertexPositions.length/3;

  vertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapot.vertexNormals), gl.STATIC_DRAW);
  vertexNormalBuffer.itemSize = 3;
  vertexNormalBuffer.numberOfItems = teapot.vertexNormals.length/3;

  vertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexTextureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapot.vertexTextureCoords), gl.STATIC_DRAW);
  vertexTextureCoordBuffer.itemSize = 2;
  vertexTextureCoordBuffer.numItems = teapot.vertexTextureCoords.length / 2;
  console.log("found " + vertexTextureCoordBuffer.numItems + " texture coords");

  vertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(teapot.indices), gl.STATIC_DRAW);
  vertexIndexBuffer.itemSize = 1;
  vertexIndexBuffer.numberOfItems = teapot.indices.length;
}
//-----------------------------------------------
// Compute the normals and texture coordinates for the teapot
function computeNorms(teapot)
{
  var number_of_triangles = teapot.indices.length / 3; //get data count
  var numVertices = teapot.vertexPositions.length / 3;

  teapot.vertexNormals = new Array();

  var triangles = new Array(number_of_triangles);
  var vertexIndices = new Array(numVertices);
  for(var i = 0; i < vertexIndices.length; i++)
    vertexIndices[i] = new Array(); //initialize index array

  var u = vec3.create();
  var v = vec3.create();

  for(var i = 0; i < number_of_triangles; i++) {
    var vi1 = teapot.indices[3*i] * 3;
    var vi2 = teapot.indices[3*i+1] * 3;
    var vi3 = teapot.indices[3*i+2] * 3;
    var v1 = [teapot.vertexPositions[vi1], teapot.vertexPositions[vi1 + 1], teapot.vertexPositions[vi1 + 2]];
    var v2 = [teapot.vertexPositions[vi2], teapot.vertexPositions[vi2 + 1], teapot.vertexPositions[vi2 + 2]];
    var v3 = [teapot.vertexPositions[vi3], teapot.vertexPositions[vi3 + 1], teapot.vertexPositions[vi3 + 2]];

    
    var normal = vec3.create();
    var normalized = vec3.create();
    vec3.subtract(u, v2, v1);
    vec3.subtract(v, v3, v1);
    vec3.cross(normal, u, v);
    vec3.normalize(normalized, normal);

    triangles[i] = normalized;
    vertexIndices[vi1 / 3].push(i);
    vertexIndices[vi2 / 3].push(i);
    vertexIndices[vi3 / 3].push(i); 
  }

  for(var i = 0; i < numVertices; i++) { //add teapot normals to data buffer
    var totalNormal = vec3.create();
    var temp = vec3.create();
    while(vertexIndices[i].length !== 0) {
      var currentTriangle = vertexIndices[i].pop();
      vec3.add(temp, totalNormal, triangles[currentTriangle]);
      vec3.copy(totalNormal, temp);
    }
    var normalized = vec3.create();
    vec3.normalize(normalized, totalNormal);
    teapot.vertexNormals[i * 3] = normalized[0];
    teapot.vertexNormals[i * 3 + 1] = normalized[1];
    teapot.vertexNormals[i * 3 + 2] = normalized[2];
  }

    for(var i = 0; i < numVertices; i++) {
    // angle should be atan(x/z)
    var angle = Math.atan(teapot.vertexPositions[3 * i] / teapot.vertexPositions[3 * i + 2]);
    teapot.vertexTextureCoords[2 * i] = Math.sin((angle + Math.PI / 4) / 2);
    teapot.vertexTextureCoords[2 * i + 1] = teapot.vertexPositions[3 * i + 1] * 7;
  }

  return teapot;

}


/*
    function draw
    input: none
    output: none

    Draw the mesh and colors on the canvas in WebGL
*/
function draw() { 
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight); //viewing angle static
  gl.clear(gl.COLOR_BUFFER_BIT);

  // We'll use perspective 
  mat4.perspective(pMatrix, degToRad(45), gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);

  // We want to look down -z, so create a lookat point in that direction    
 // vec3.add(viewPt, eyePt, viewDir);
  // Then generate the lookat matrix and initialize the MV matrix to that view
 // mat4.lookAt(mvMatrix,eyePt,viewPt,up);   

 //move camera
  var cameraLocation = [0, 0.15, 0];
  
  //new camera location
  cameraLocation[0] = 0.3 * Math.sin(degToRad(angle));
  cameraLocation[2] = 0.3 * Math.cos(degToRad(angle));
  //mat4.identity(mvMatrix);
  mat4.identity(mvMatrix);
  mat4.lookAt(mvMatrix, cameraLocation, [0, 0.15, 0], [0, 1, 0]); //set program to look at the teapot
  mat4.rotateY(mvMatrix, mvMatrix, degToRad(rotAngle)); //rotate along the Y axis
  drawTeapot(); //call function to draw teapot



  //
  // lighting
  //

  gl.useProgram(shaderProgram);

  var ambientUL = gl.getUniformLocation(shaderProgram, 'ambientLightIntensity');
  var sunlightDUL = gl.getUniformLocation(shaderProgram, 'sunlightDirection');
  var sunlightIUL = gl.getUniformLocation(shaderProgram, 'sunlightIntensity');

  gl.uniform3f(ambientUL, 0.6, 0.6, 0.6);
  gl.uniform3f(sunlightDUL, 3.0, 4.0, -2.0);
  gl.uniform3f(sunlightIUL, 0.9, 0.9, 0.9);

      //attempt to reflect background
      if(document.getElementById("reflect_attempt").checked){
        gl.uniform1i(gl.getUniformLocation(shaderProgram, "reflect"), 1);
      }
      else
        gl.uniform1i(gl.getUniformLocation(shaderProgram, "reflect"), 0);
}
//--------------------------------------
// draws the cube and teapot
function drawTeapot()
{
  //
  // draw teapot
  //
  gl.useProgram(shaderProgram);
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
  gl.uniform1i(gl.getUniformLocation(shaderProgram,"teapot"), 1);    
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0); //enable vertex positions
                          
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                         vertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);  //enable normals

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexTextureCoordBuffer);
  gl.vertexAttribPointer(shaderProgram.texCoordAttribute, 2, gl.FLOAT, false, 0, 0);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
  gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler"), 0);  //enable all of the textures for WebGL

  gl.useProgram(shaderProgram);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);   


  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, vertexIndexBuffer.numberOfItems, gl.UNSIGNED_SHORT, 0); //draw the teapot
//
// draw cube
//

  gl.useProgram(shaderProgram);
  gl.uniform1i(gl.getUniformLocation(shaderProgram,"teapot"), 0);    
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         3, gl.FLOAT, false, 0, 0); //vertices
    // Set the texture coordinates attribute for the vertices.
  gl.enableVertexAttribArray(shaderProgram.texCoordAttribute);
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeTCoordBuffer);
  gl.vertexAttribPointer(shaderProgram.texCoordAttribute, 2, gl.FLOAT, false, 0, 0); //texture coords

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
  gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler"), 0);  

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeTriIndexBuffer);
  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0); //draw the cube
}

/*
    function animate:
    input: none
    output: none

    Change the rotation angle along each time interval, done in draw()
*/
function animate() {
  var timeNow = new Date().getTime(); 
  if (lastTime != 0) {
    var elapsed = timeNow - lastTime;
    if(document.getElementById("orbit").checked){
      rotAngle = (rotAngle + 1.0) % 360
    }
  }
  lastTime = timeNow;

    cubeVertexBuffer = gl.createBuffer();

  // If you want to see just the teapot
    if(document.getElementById("teapot_only").checked){
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);

  // Now create an array of vertices for the cube.

  var vertices = [
    -10.0, -10.0,  10.0,
     10.0, -10.0,  10.0,
     10.0,  10.0,  10.0,
    -10.0,  10.0,  10.0,

    // Back face
    -10.0, -10.0, -10.0,
    -10.0,  10.0, -10.0,
     10.0,  10.0, -10.0,
     10.0, -10.0, -10.0,

    // Top face
    -10.0,  10.0, -10.0,
    -10.0,  10.0,  10.0,
     10.0,  10.0,  10.0,
     10.0,  10.0, -10.0,

    // Bottom face
    -10.0, -10.0, -10.0,
     10.0, -10.0, -10.0,
     10.0, -10.0,  10.0,
    -10.0, -10.0,  10.0,

    // Right face
     10.0, -10.0, -10.0,
     10.0,  10.0, -10.0,
     10.0,  10.0,  10.0,
     10.0, -10.0,  10.0,

    // Left face
    -10.0, -10.0, -10.0,
    -10.0, -10.0,  10.0,
    -10.0,  10.0,  10.0,
    -10.0,  10.0, -10.0
  ];

  // Now pass the list of vertices into WebGL to build the shape. We
  // do this by creating a Float32Array from the JavaScript array,
  // then use it to fill the current vertex buffer.

  // attempt at Skybox, couldn't get pMatrix to work so it's pretty buggy
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  }
  else if(document.getElementById("skybox_attempt").checked){
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);

  // Now create an array of vertices for the cube.

  var vertices = [
    -0.5, -0.5,  0.5,
     0.5, -0.5,  0.5,
     0.5,  0.5,  0.5,
    -0.5,  0.5,  0.5,

    // Back face
    -0.5, -0.5, -0.5,
    -0.5,  0.5, -0.5,
     0.5,  0.5, -0.5,
     0.5, -0.5, -0.5,

    // Top face
    -0.5,  0.5, -0.5,
    -0.5,  0.5,  0.5,
     0.5,  0.5,  0.5,
     0.5,  0.5, -0.5,

    // Bottom face
    -0.5, -0.5, -0.5,
     0.5, -0.5, -0.5,
     0.5, -0.5,  0.5,
    -0.5, -0.5,  0.5,

    // Right face
     0.5, -0.5, -0.5,
     0.5,  0.5, -0.5,
     0.5,  0.5,  0.5,
     0.5, -0.5,  0.5,

    // Left face
    -0.5, -0.5, -0.5,
    -0.5, -0.5,  0.5,
    -0.5,  0.5,  0.5,
    -0.5,  0.5, -0.5
  ];

  // Now pass the list of vertices into WebGL to build the shape. We
  // do this by creating a Float32Array from the JavaScript array,
  // then use it to fill the current vertex buffer.

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  }

}
/*
    function startup:
    input: none
    output: none

    Entry point of HTML file, create the canvas, setup the shaders and buffers, change to white background
    and start the animation
*/
function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  gl.enable(gl.DEPTH_TEST);
  setupShaders(); 
  setupBuffers();
  setupTextures();
  gl.clearColor(0.3, 0.5, 0.8, 1.0);
  tick();
}
/*
    function tick:
    input: none
    output: none

    Redraw the mesh and colors after each animation frame
*/
function tick() {
  requestAnimFrame(tick);
  draw();
  animate();
}

//---------------------------------------------------------------------------------
// Code for skybox, not fully implemented
function setupTextures() {
  cubeTexture = gl.createTexture();
 gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
// Fill the texture with a 1x1 blue pixel.
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
              new Uint8Array([0, 0, 255, 255]));


  cubeImage = new Image();
  cubeImage.onload = function() { handleTextureLoaded(cubeImage, cubeTexture); }
  cubeImage.src = "pos-x.png";
   // https://goo.gl/photos/SUo7Zz9US1AKhZq49
}

//---------------------------------------------------------------------------------

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

//---------------------------------------------------------------------------------

function handleTextureLoaded(image, texture) {
  console.log("handleTextureLoaded, image = " + image);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
  // Check if the image is a power of 2 in both dimensions.
  if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
     // Yes, it's a power of 2. Generate mips.
     gl.generateMipmap(gl.TEXTURE_2D);
     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
     console.log("Loaded power of 2 texture");
  } else {
     // No, it's not a power of 2. Turn of mips and set wrapping to clamp to edge
     gl.texParameteri(gl.TETXURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
     gl.texParameteri(gl.TETXURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
     gl.texParameteri(gl.TETXURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
     console.log("Loaded non-power of 2 texture");
  }
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}