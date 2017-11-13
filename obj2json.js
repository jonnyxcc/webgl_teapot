// Parse the object file into an array

//------------------------------------------------------
// Puts the vertices and indices into an out buffer
function obj2data(input) {
	var lines = input.split(/\r\n|\r|\n/g);
	var out = {};
	out.vertexPositions = [];
	out.vertexNormals = [];
	out.indices = [];
	out.vertexTextureCoords = [];
	lines.forEach(function(line) {
		var linePieces = line.split(" ");
		if(linePieces[0] == "v") {
			//this is a vertex entry. we'll ignore the w coord
			for(var i = 1; i < 4; i++) {
				var num = parseFloat(linePieces[i]);
				num /= 5;
				out.vertexPositions.push(num);
			}
		}
		else if(linePieces[0] == "f") {
			//this is a face entry. indices in the file start at 1, but we want them to start at 0 in js
			for(var i = 2; i < 5; i++) {
				out.indices.push(parseInt(parseInt(linePieces[i]) - 1));
			}
		}
	});
	return out;
}