var container = document.createElement('div');
var canvas = document.createElement('canvas');
document.body.appendChild(container);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
container.appendChild(canvas);

// -----

function mapFromPairList(pairs) {
    return pairs.reduce(function(state, pair) {
	state[pair[0]] = pair[1];
	return state;
    }, {});
}

var engine = new Cube.core.Engine({canvas: canvas});
var renderer = engine.getRenderer();
var shaderManager = new Cube.core.ShaderManager({engine: engine,
						 loader: new Cube.core.ResourceLoader({}),
						 shaders: {colorspace: {src: ["3d-vertex-shader", "3d-fragment-shader"],
									// preload: true, SUPPRIMER cette feature 
									mappings: {uniforms: mapFromPairList([[renderer.shaderParameters.uniforms.matrixProjection, "u_projection"],
													      [renderer.shaderParameters.uniforms.matrixView,       "u_view"],
													      [renderer.shaderParameters.uniforms.matrixModel,      "u_matrix"],
													      [renderer.shaderParameters.uniforms.matrixNormal,     "u_normalMatrix"]]),
										   attributes: mapFromPairList([[renderer.shaderParameters.attributes.vertex,       "aPosition"],
														[renderer.shaderParameters.attributes.normal,       "aNormal"],
														[renderer.shaderParameters.attributes.color,        "aColor"]])}}/*,
							   other: {src: [...],
							   preload: true|false}*/}});

var visitor = new Cube.core.RenderVisitor({renderer: renderer});
var scene = new Cube.core.ArrayNode({});
var shaderColorCube = shaderManager.getShader("colorspace");
var viewport = new Cube.core.ViewportNode({x: 0, y: 0, width: canvas.width, height: canvas.height});
var optic = new Cube.core.OpticNode({fov: Math.PI*0.5, ratio: canvas.width/canvas.height, near: 1, far: 1000});
var camera = new Cube.core.ViewNode({parent: new Cube.core.TranslationNode({vector: new Cube.core.math.Vector3(0, 0, 4)})});
camera.update();


var aY = new Cube.core.math.Vector3(0, 0, 0);
var modelTransfoCommonNode = 
    (new Cube.core.TransformStackNode({}))
//    .push(new Cube.core.ScalingNode({vector: new Cube.core.math.Vector3( 1, 0.5, 1)}))
    .push(new Cube.core.TranslationNode({vector: new Cube.core.math.Vector3(2, 0, 0)}))
    .push(new Cube.core.RotationXYZNode({vector: aY}));

var modelTransfoCommonNode2 = 
    (new Cube.core.TransformStackNode({}))
//    .push(new Cube.core.ScalingNode({vector: new Cube.core.math.Vector3( 1, 0.5, 1)}))
    .push(new Cube.core.TranslationNode({vector: new Cube.core.math.Vector3(-2, 0, 0)}))
    .push(new Cube.core.RotationXYZNode({vector: aY}));

var geoBufferSet =
    Cube.core.GeometryHelpers.buildSphere(
	0.5,
	new Cube.core.OutputToBufferSet({
	    hasVertex: true,
	    hasNormal: true,
	    hasColor: true,
	    hasIndex: true,
	    factory: renderer.getBufferFactory()}));

var cubeGeoBufferSet =
    Cube.core.GeometryHelpers.buildCube(
	0.5,
	new Cube.core.OutputToBufferSet({
	    hasVertex: true,
	    hasNormal: true,
	    hasColor: true,
	    hasIndex: true,
	    factory: renderer.getBufferFactory()}));

scene.push(shaderColorCube); // Pour l'instant ici, car les mappings doivent etre charges avant de visiter les noeuds de transformation. Prochaine etape : revoir ca.
scene.push(viewport);
scene.push(optic);
scene.push(camera);
scene.push(modelTransfoCommonNode);
scene.push(geoBufferSet);
scene.push(modelTransfoCommonNode2);
scene.push(cubeGeoBufferSet);

var a = 0;
animate();

function render() {
    a += Math.PI / 200;
    a %= Math.PI * 2;
    aY.setY(a);
    aY.setX(a);
    modelTransfoCommonNode.update();
    modelTransfoCommonNode2.update();

    renderer.clear();
    scene.accept(visitor);
}

function animate() {
    requestAnimationFrame(animate);
    render();
}
