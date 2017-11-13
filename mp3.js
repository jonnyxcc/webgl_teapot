
var gl;
var canvas;

var shaderProgram;

// Create a place to store the texture coords for the mesh
var cubeTCoordBuffer;

// Create a place to store terrain geometry
var cubeVertexBuffer;

// Create a place to store the triangles
var cubeTriIndexBuffer;

// Create ModelView matrix
var mvMatrix = mat4.create();

//Create Projection matrix
var pMatrix = mat4.create();

var mvMatrixStack = [];

// Create a place to store the texture

var cubeImage;
var cubeTexture;

// Teapot buffers
var vertexPositionBuffer;
var vertexNormalBuffer;
var vertexIndexBuffer;
var vertexTextureCoordBuffer; 

// For animation 
var then =0;
var modelXRotationRadians = degToRad(5);
var modelYRotationRadians = degToRad(.5);

//-------------------------------------------------------------------------
// Upload MV matrix
function uploadModelViewMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

//-------------------------------------------------------------------------
//Push projection matrix to stack
function uploadProjectionMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, 
                      false, pMatrix);
}

//----------------------------------------------------------------------------------
//Push mvMatrix to stack
function mvPushMatrix() {
    var copy = mat4.clone(mvMatrix);
    mvMatrixStack.push(copy);
}


//----------------------------------------------------------------------------------
function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

//----------------------------------------------------------------------------------
function setMatrixUniforms() {
    uploadModelViewMatrixToShader();
    uploadProjectionMatrixToShader();
}

//----------------------------------------------------------------------------------
// Convert radians to degrees
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

//----------------------------------------------------------------------------------
// Setup the WebGL context
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

//----------------------------------------------------------------------------------
// Get shaders from the HTML file
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

//----------------------------------------------------------------------------------
// Setup shaders
function setupShaders() {
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);

  //Texture coordinate locations
  shaderProgram.texCoordAttribute = gl.getAttribLocation(shaderProgram, "aTexCoord");
  console.log("Tex coord attrib: ", shaderProgram.texCoordAttribute);
  gl.enableVertexAttribArray(shaderProgram.texCoordAttribute);
    
  //Vertex positions  
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  console.log("Vertex attrib: ", shaderProgram.vertexPositionAttribute);
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  //Vertex normals
  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
    
  // MV and P matrices  
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
}

//-----------------------------------------------------------------------------------
function drawCube(){
  //First draw the teapot
    gl.useProgram(shaderProgram);
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
  gl.uniform1i(gl.getUniformLocation(shaderProgram,"teapot"), 1);    //shader knows it's 
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0); //enable vertex positions
                          
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                         vertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);  //enable normals

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexTextureCoordBuffer);
  gl.vertexAttribPointer(shaderProgram.texCoordAttribute, 2, gl.FLOAT, false, 0, 0); //texture coordinate attrib

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
  gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler"), 0);  //enable all of the textures for WebGL

  gl.useProgram(shaderProgram);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);   


  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, vertexIndexBuffer.numberOfItems, gl.UNSIGNED_SHORT, 0); //draw the teapot

  // Draw the cube by binding the array buffer to the cube's vertices
  // array, setting attributes, and pushing it to GL.

    gl.uniform1i(gl.getUniformLocation(shaderProgram,"teapot"), 0);    

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

  // Set the texture coordinates attribute for the vertices.

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeTCoordBuffer);
  gl.vertexAttribPointer(shaderProgram.texCoordAttribute, 2, gl.FLOAT, false, 0, 0);

  // Specify the texture to map onto the faces.

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
  gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler"), 0);

  // Draw the cube.

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeTriIndexBuffer);
  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
}
var eyePos = vec3.fromValues(2,0.5,0);
//----------------------------------------------------------------------------------
function draw() { 
    var transformVec = vec3.create();
  
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // We'll use perspective 
    mat4.perspective(pMatrix,degToRad(45), gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);
 
    //Draw 
    mvPushMatrix();
    vec3.set(transformVec,0.0,0.0,-10.0);
    mat4.translate(mvMatrix, mvMatrix,transformVec);
    mat4.lookAt(mvMatrix, eyePos, [0,0,0], [0,1,0]);
    //mat4.rotateY(mvMatrix,mvMatrix,modelYRotationRadians);

    //lighting for teapot
  gl.useProgram(shaderProgram);

  var ambientUL = gl.getUniformLocation(shaderProgram, 'ambientLightIntensity'); //sunlight values
  var sunlightDUL = gl.getUniformLocation(shaderProgram, 'sunlightDirection');
  var sunlightIUL = gl.getUniformLocation(shaderProgram, 'sunlightIntensity');

  gl.uniform3f(ambientUL, 0.6, 0.6, 0.6);
  gl.uniform3f(sunlightDUL, 3.0, 4.0, -2.0);
  gl.uniform3f(sunlightIUL, 0.9, 0.9, 0.9);

    setMatrixUniforms();    
    drawCube(); //call to draw
    mvPopMatrix();
  
}

//----------------------------------------------------------------------------------
function animate() {
    if (then==0)
    {
        then = Date.now();
    }
    else
    {
        now=Date.now();
        // Convert to seconds
        now *= 0.001;
        // Subtract the previous time from the current time
        var deltaTime = now - then;
        // Remember the current time for the next frame.
        then = now;

        //Orbit the teapot, if selected by the user
        if(document.getElementById("orbit").checked){
          //eyePos[0]=Math.cos(modelYRotationRadians)*eyePos[0]-Math.sin(modelYRotationRadians)*eyePos[2];
          //eyePos[2]=Math.sin(modelYRotationRadians)*eyePos[0]+Math.cos(modelYRotationRadians)*eyePos[2];
          eyePos[0] = 2*Math.cos(rot);
          eyePos[2] = 2*Math.sin(rot);
          rot += degToRad(1);
      }
  
    }
}

var rot = 0; //rotation variable
//---------------------------------------------------------------------------------
// Setup the textures for use
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
// Check if it's a power of two file
function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

//---------------------------------------------------------------------------------
// Onload texture function
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

//----------------------------------------------------------------------------------
// Setup the buffers
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
    // Front face
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

//----------------------------------------------------------------------------------
// Onstart function
function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
    
  setupShaders();
  setupBuffers();
  setupTextures();
  tick();
}

//----------------------------------------------------------------------------------
// Animation tick
function tick() {
    requestAnimFrame(tick);
    draw();
    animate();
}

//------------------------------------------
// function teapot, receives the buffer containing the texture coordinates, normals, indices and vertex positions
// initializes all buffers for use in webgl
function teapot(teapot) {

  // Initialize the Teapot buffers
  vertexPositionBuffer = gl.createBuffer(); //vertex positions
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapot.vertexPositions), gl.STATIC_DRAW);
  vertexPositionBuffer.itemSize = 3;
  vertexPositionBuffer.numberOfItems = teapot.vertexPositions.length/3;

  vertexNormalBuffer = gl.createBuffer(); //normal buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapot.vertexNormals), gl.STATIC_DRAW);
  vertexNormalBuffer.itemSize = 3;
  vertexNormalBuffer.numberOfItems = teapot.vertexNormals.length/3;

  vertexTextureCoordBuffer = gl.createBuffer(); //texture coordinates
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexTextureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(teapot.vertexTextureCoords), gl.STATIC_DRAW);
  vertexTextureCoordBuffer.itemSize = 2;
  vertexTextureCoordBuffer.numItems = teapot.vertexTextureCoords.length / 2;
  console.log("found " + vertexTextureCoordBuffer.numItems + " texture coords");

  vertexIndexBuffer = gl.createBuffer(); //index buffer
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

  for(var i = 0; i < number_of_triangles; i++) { //calculate modified indices
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

    for(var i = 0; i < numVertices; i++) { //add texture coordinates
    // angle should be atan(x/z)
    var angle = Math.atan(teapot.vertexPositions[3 * i] / teapot.vertexPositions[3 * i + 2]);
    teapot.vertexTextureCoords[2 * i] = Math.sin((angle + Math.PI / 4) / 2);
    teapot.vertexTextureCoords[2 * i + 1] = teapot.vertexPositions[3 * i + 1] * 7;
  }

  return teapot;

}