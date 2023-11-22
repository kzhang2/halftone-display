import * as THREE from 'three';
//import dataString from './data_for_three.txt?raw';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { SUBTRACTION, Brush, Evaluator } from 'three-bvh-csg';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GUI } from 'lil-gui';

const gui = new GUI();
function makeAxisGrid(node, label, units) {
    const helper = new AxisGridHelper(node, units);
    gui.add(helper, 'visible').name(label);
}

class AxisGridHelper {
    constructor(node, units = 10) {
      const axes = new THREE.AxesHelper();
      axes.material.depthTest = false;
      axes.renderOrder = 2;  // after the grid
      node.add(axes);
   
      const grid = new THREE.GridHelper(units, units);
      grid.material.depthTest = false;
      grid.renderOrder = 1;
      node.add(grid);
   
      this.grid = grid;
      this.axes = axes;
      this.visible = false;
    }
    get visible() {
      return this._visible;
    }
    set visible(v) {
      this._visible = v;
      this.grid.visible = v;
      this.axes.visible = v;
    }
}

// hardcoded params 
const scale = 1; 
const img_w = 4032;
const img_h = 3024; 
const occ_w = img_w / img_h * scale; 
const occ_h = 1.0 * scale;

const grid_len = 25;


// initialize scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / (window.innerHeight-500), 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.setSize( window.innerWidth, window.innerHeight - 500 );
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls( camera, renderer.domElement );

// make occluder

const material = new THREE.MeshPhongMaterial({color: 0xFF0000});
scene.add(new THREE.AmbientLight(0x404040));


const loader = new GLTFLoader();
loader.load(
	// resource URL
	"scene_25_merged.glb",
	// called when the resource is loaded
	function ( gltf ) {
    let children = gltf.scene.children;
    let display_mesh = children[0].children[0]; // hacky
    display_mesh.material = material;
    display_mesh.castShadow = true;
    // console.log(children);
    console.log(display_mesh)
		scene.add( gltf.scene );
  

		// gltf.animations; // Array<THREE.AnimationClip>
		// gltf.scene; // THREE.Group
		// gltf.scenes; // Array<THREE.Group>
		// gltf.cameras; // Array<THREE.Camera>
		// gltf.asset; // Object

	},
	// called while loading is progressing
	function ( xhr ) {

		console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

	},
	// called when loading has errors
	function ( error ) {

		console.log( 'An error happened' );

	}
);

// const start = Date.now();
// const dots = dataString.split("\n");
// for (let i = 0; i < dots.length; i++) {
//     if (i < 10001) {
//       continue
//     }
//     const curr_data = dots[i].split(" ");
//     console.log(i);
//     const center_x = parseFloat(curr_data[0]) / img_h - (occ_w / 2);
//     const center_y = -(parseFloat(curr_data[1]) / img_h - (occ_h / 2));
//     const radius = parseFloat(curr_data[2]) * grid_len / img_h;
//     const dotGeometry = new THREE.SphereGeometry(radius);
//     const dotBrush = new Brush(dotGeometry);
//     dotBrush.position.x = center_x;
//     dotBrush.position.y = center_y;
//     dotBrush.updateMatrixWorld();

//     const currTile = new THREE.BoxGeometry(grid_len/img_h, grid_len/img_h, 0.0001);
//     const tileBrush = new Brush(currTile);
//     tileBrush.position.x = center_x;
//     tileBrush.position.y = center_y;
//     tileBrush.updateMatrixWorld();
//     const evaluator = new Evaluator();
//     const result = evaluator.evaluate( tileBrush, dotBrush, SUBTRACTION );
//     result.material = material 
//     result.receiveShadow = false;
//     result.castShadow = true; 
//     scene.add(result);
//     // if (i > 10000){
//     //     break;
//     // }
// }
// const end = Date.now();
// console.log("time taken", end-start);

// make screen 
const geometry = new THREE.PlaneGeometry(5.0, 5.0);
// const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
// const material = new THREE.MeshPhongMaterial({color: 0x44aa88});
const material1 = new THREE.MeshPhongMaterial({color: 0xFFFFFF, side: THREE.DoubleSide,});
// material1.shadowSide = THREE.DoubleSide;
const backPlane = new THREE.Mesh( geometry, material1 );
backPlane.castShadow = true;
backPlane.receiveShadow = true;
backPlane.position.z -= 4
scene.add( backPlane );

// update camera
camera.position.z = 5;
controls.update();


// make light
// const color = 0xFFFFFF;
const color = 0xFF0000
const intensity = 100;
// const light = new THREE.DirectionalLight(color, intensity);
const light = new THREE.SpotLight(color, intensity, 0, Math.PI/15);
// const light = new THREE.PointLight(color, intensity);
light.position.set(0, 0, 4);
light.castShadow = true;
light.shadow.mapSize.setScalar( 4096 );
light.shadow.bias = 1e-5;
light.shadow.normalBias = 1e-2;
scene.add(light);

// const cameraHelper = new THREE.CameraHelper(light.shadow.camera);
// scene.add(cameraHelper);

// const lightHelper = new THREE.DirectionalLightHelper( light, 5 );
const lightHelper = new THREE.SpotLightHelper(light);
// const lightHelper = new THREE.PointLightHelper(light, 5);

scene.add( lightHelper );

// debug visualizations
// const axesHelper = new THREE.AxesHelper( 5 );
// scene.add( axesHelper );

// const size = 10;
// const divisions = 10;
// const gridHelper = new THREE.GridHelper( size, divisions );
// scene.add( gridHelper );
makeAxisGrid(backPlane, "backPlane");

// const exporter = new OBJExporter();
const exporter = new GLTFExporter();
// const sceneObj = exporter.parse(scene);

exporter.parse(
	scene,
	// called when the gltf has been generated
	function ( gltf ) {

		console.log( gltf );
    let blob = new Blob([gltf], { type: 'application/octet-stream' });
    let dl = document.getElementById("dl");
    dl.href = window.URL.createObjectURL(blob);
    dl.download = "scene.glb";
	},
	// called when there is an error in the generation
	function ( error ) {

		console.log( 'An error happened' );

	},
  { binary: true }
);
// let blob = new Blob([sceneObj], { type: 'text/plain' });
// let dl = document.getElementById("dl");
// dl.href = window.URL.createObjectURL(blob);
// dl.download = "scene.obj";

// render
function animate() {
	requestAnimationFrame( animate );
    // cube.rotation.x += 0.01;
    // cube.rotation.y += 0.01;
	renderer.render( scene, camera );
}
animate();
