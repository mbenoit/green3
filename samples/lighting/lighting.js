var container = document.createElement('div');
var canvas = document.createElement('canvas');
document.body.appendChild(container);
canvas.width =  window.innerWidth;
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
var mappings = {uniforms: mapFromPairList([[renderer.shaderParameters.uniforms.matrixProjection, "u_projection"],
					                       [renderer.shaderParameters.uniforms.matrixView,       "u_view"],
					                       [renderer.shaderParameters.uniforms.matrixModel,      "u_matrix"],
					                       [renderer.shaderParameters.uniforms.matrixNormal,     "u_normalMatrix"]]),
		        attributes: mapFromPairList([[renderer.shaderParameters.attributes.vertex,       "aPosition"],
					                         [renderer.shaderParameters.attributes.normal,       "aNormal"],
					                         [renderer.shaderParameters.attributes.color,        "aColor"],
					                         [renderer.shaderParameters.attributes.uv,           "aUV"]])};
var shaderManager = new Cube.core.ShaderManager({engine: engine,
						                         loader: new Cube.core.ResourceLoader({}),
						                         shaders: {
                                                     lighting: {src: ["vertex-shader", "fragment-shader"],
								                                params: {
								                                    uniforms: {
                                                                    }},
								                                mappings: mappings,
								                                preload: true}}});

var visitor = new Cube.core.RenderVisitor({renderer: renderer});
var scene = new Cube.core.Scene({});

// Viewport

var viewport = new Cube.core.ViewportNode({x: 0, y: 0, width: canvas.width, height: canvas.height});

scene.setViewport(viewport);

// Camera 

var cameraRotation = new Cube.core.RotationXYZNode({vector: new Cube.core.math.Vector3(0, 0, 0)});
var cameraTransform =
    new Cube.core.TransformStackNode({})
    .push(cameraRotation)
    .push(new Cube.core.TranslationNode({vector: new Cube.core.math.Vector3(0, 0, 2.5)}));
cameraRotation.update();
cameraTransform.update();

var camera = new Cube.core.CameraNode({optic: new Cube.core.OpticNode({fov: Math.PI*0.5, ratio: canvas.width/canvas.height, near: 1, far: 1000}),
                                       parent: cameraTransform});

scene.setCamera(camera);

// Ambiant Light

//var ambiantLight = new Cube.core.LightAmbiantNode({color: [0.5, 0.0, 0.0, 0.0]});
//var directionalLight = new Cube.core.LightDirectionalNode({color: [0.5, 0.0, 0.0, 0.0],
//                                                           direction: [1.0, 0.0, 0.0]});
var positionalLight = new Cube.core.LightPositionalNode({color: [1.0, 0.0, 0.0, 0.0],
                                                         position: [3.0, 3.0, 0.0]});
scene.addLight(positionalLight);

// Earth

var shaderedTransformationRotationNode = new Cube.core.RotationXYZNode({vector: new Cube.core.math.Vector3(0, 0, 0)});

var modelTransfoCommonBaseNode3 =
    (new Cube.core.TransformStackNode({}))
    .push(shaderedTransformationRotationNode);

var materialNodeEarth3 = new Cube.core.MaterialNode({shader: shaderManager.getShader("lighting"),
						                             bindings: {}});

var geoBufferSet =
    Cube.core.GeometryHelpers.buildSphere(
	1.0,
	new Cube.core.OutputToBufferSet({
	    hasVertex: true,
	    hasNormal: true,
	    hasColor: true,
	    hasUV: true,
	    hasIndex: true,
	    factory: renderer.getBufferFactory()}));

scene.addObject(new Cube.core.Object({material: materialNodeEarth3, transformation: modelTransfoCommonBaseNode3, geometry: geoBufferSet}));

// Animate

var earthRot = 0;
var a = 0;
animate();

function render() {
    a += Math.PI / 200;
    a %= Math.PI * 2;
    earthRot += Math.PI / 300;
    earthRot %= Math.PI * 2;

    cameraRotation.set(null, a, null);
    cameraRotation.update();
    cameraTransform.update();
    camera.update();
    shaderedTransformationRotationNode.set(null, earthRot, null);
    shaderedTransformationRotationNode.update();
    modelTransfoCommonBaseNode3.update();

    renderer.clear();
    scene.visit(visitor);
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

