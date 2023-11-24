import * as THREE from 'three';
// import dataString from './data_for_three.txt?raw';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { SUBTRACTION, Brush, Evaluator } from 'three-bvh-csg';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GUI } from 'lil-gui';


// let dataString = await fetch("./data_for_three.txt").then((response) => response.text())
// let dataJson = await fetch("./data_for_three.json").then((response) => response.json());
let dataJson = await fetch("./data_for_three_short.json").then((response) => response.json());
// console.log(dataString)
// console.log(dataJson);
let data = dataJson["data"]
console.log(data);

const gui = new GUI();
function makeAxisGrid(node, label, units) {
    const helper = new AxisGridHelper(node, units);
    gui.add(helper, 'visible').name(label);
}

class AmbientLightOptions {
  constructor(ambientLight) {
    this.ambientLight = ambientLight;
    this.intensity = 0.01;
  }
  get intensity() {
    return this._intensity;
  }
  set intensity(v) {
    this._intensity = v;
    this.ambientLight.intensity = this.intensity;
  }
}

class LightHelperOptions {
  constructor() {
    this.lightHelpers = new Array();
    this.visible = false; 
  }

  addLight(lightHelper) {
    this.lightHelpers.push(lightHelper);
  }

  get visible() {
    return this._visible;
  }

  set visible(v) {
    this._visible = v;
    console.log(this.lightHelpers);
    for (let i = 0; i < this.lightHelpers.length; i++) {
      this.lightHelpers[i].visible = v;
    }
  }
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
// const img_w = 4032;
// const img_h = 3024; 
const img_w = 3024;
const img_h = 4032;
const occ_w = img_w / img_h * scale; 
const occ_h = 1.0 * scale;

const grid_len = 50;

// initialize scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / (window.innerHeight-500), 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.setSize( window.innerWidth, window.innerHeight - 500 );
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls( camera, renderer.domElement );

// make occluder
const material = new THREE.MeshStandardMaterial({color: 0xFFFFFF});
material.shadowSide = THREE.DoubleSide;
material.side = THREE.DoubleSide;
let ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.01);
let alo = new AmbientLightOptions(ambientLight);
scene.add(ambientLight);
let lho = new LightHelperOptions();
console.log(lho);

for (let i = 0; i < data.length; i++) {
  // if (i != 2) {
  //   continue;
  // }
  console.log(data[i]);
  // let projected_circle_points = data[i]["projected_circle_points"];
  // let projected_grid_points = data[i]["projected_grid_points"];
  let angle = data[i]["light_angle"];
  let offset = data[i]["light_offset"];
  let path = data[i]["scene_path"];

  let color;
  if (i == 0){
    color = 0xFF0000;
  } else if (i == 1){
    color = 0x00FF00;
  } else if (i == 2) {
    color = 0x0000FF;
  } 
    
  const intensity = 1000;
  const light = new THREE.SpotLight(color, intensity, 0, Math.PI/12);
  light.position.set(offset[0], offset[1], offset[2]);
  light.castShadow = true;
  light.shadow.mapSize.setScalar( 4096 );
  light.shadow.bias = 1e-5;
  light.shadow.normalBias = 1e-2;
  scene.add(light);
  const lightHelper = new THREE.SpotLightHelper(light);
  lightHelper.visible = false;
  scene.add( lightHelper );

  lho.addLight(lightHelper);

  const loader = new GLTFLoader();
  loader.load(
    // resource URL
    path,
    // called when the resource is loaded
    function ( gltf ) {
      console.log(gltf);
      let children = gltf.scene.children;
      let display_mesh = children[0].children[0]; // hacky

      const tileMaterial = new THREE.MeshPhongMaterial({color: 0xFFFFFF});
      tileMaterial.shadowSide = THREE.DoubleSide;
      tileMaterial.side = THREE.DoubleSide;

      display_mesh.material = tileMaterial;
      display_mesh.castShadow = true;
      display_mesh.side = THREE.DoubleSide;
      display_mesh.shadowSide = THREE.DoubleSide;
      display_mesh.receiveShadow = true; 
      display_mesh.position.z = 1;
      display_mesh.position.applyAxisAngle(new THREE.Vector3(0.0, 1.0, 0.0), angle);
      display_mesh.position.x += offset[0];
      display_mesh.position.y += offset[1];
      display_mesh.position.z += offset[2];
      display_mesh.rotation.y = angle;   
      // console.log(children);
      console.log(display_mesh)
      scene.add( display_mesh );
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

  // for (let j = 0; j < projected_grid_points.length; j++) {
  //   console.log(j);
  //   // create geometry
  //   let curr_grid_pts = projected_grid_points[j];
  //   let curr_circle_pts = projected_circle_points[j];
  //   let grid_shape_pts = [] 
  //   let circle_shape_pts = []
  //   for (let k = 0; k < curr_grid_pts.length; k++) {
  //     grid_shape_pts.push(new THREE.Vector2(curr_grid_pts[k][0], curr_grid_pts[k][1]));
  //   }
  //   for (let k = 0; k < curr_circle_pts.length; k++) {
  //     circle_shape_pts.push(new THREE.Vector2(curr_circle_pts[k][0], curr_circle_pts[k][1]))
  //   }
  //   let curr_grid_shape = new THREE.Shape(grid_shape_pts);
  //   let curr_circle_shape = new THREE.Shape(circle_shape_pts);
  //   const grid_geometry = new THREE.ShapeGeometry(curr_grid_shape);
  //   const circle_geometry = new THREE.ShapeGeometry(curr_circle_shape);
  //   const circleBrush = new Brush(circle_geometry)
  //   const gridBrush = new Brush(grid_geometry)
  //   const evaluator = new Evaluator();
  //   const currTile = evaluator.evaluate(gridBrush, circleBrush, SUBTRACTION);
  //   currTile.material = material 
  //   currTile.receiveShadow = false;
  //   currTile.castShadow = true; 

  //   // do transformation
  //   currTile.position.z = 1;
  //   currTile.position.applyAxisAngle(new THREE.Vector3(0.0, 1.0, 0.0), angle);
  //   currTile.position.x += offset[0];
  //   currTile.position.y += offset[1];
  //   currTile.position.z += offset[2];
  //   currTile.rotation.y = angle;   
  //   scene.add(currTile);

    // old debug code 

    // const grid_mesh = new THREE.Mesh(grid_geometry, material);
    // const circle_mesh = new THREE.Mesh(circle_geometry, material);
    // circle_mesh.castShadow = true;
    // grid_mesh.castShadow = true;
    // circle_mesh.position.z = 1.0;
    // grid_mesh.position.z = 1.0;
    // console.log(angle)
    // circle_mesh.position.applyAxisAngle(new THREE.Vector3(0.0, 1.0, 0.0), angle);
    // circle_mesh.position.x += offset[0];
    // circle_mesh.position.y += offset[1];
    // circle_mesh.position.z += offset[2];
    // circle_mesh.rotation.y = angle;
    // grid_mesh.position.applyAxisAngle(new THREE.Vector3(0.0, 1.0, 0.0), angle);
    // grid_mesh.position.x += offset[0];
    // grid_mesh.position.y += offset[1];
    // grid_mesh.position.z += offset[2];
    // grid_mesh.rotation.y = angle;
    // scene.add(grid_mesh);
    // scene.add(circle_mesh)
    // console.log(curr_grid_shape);
    // break
  // }

  // break
}

// const loader = new GLTFLoader();
// loader.load(
// 	// resource URL
// 	"scene_25_merged.glb",
// 	// called when the resource is loaded
// 	function ( gltf ) {
//     let children = gltf.scene.children;
//     let display_mesh = children[0].children[0]; // hacky
//     display_mesh.material = material;
//     display_mesh.castShadow = true;
//     // console.log(children);
//     console.log(display_mesh)
// 		scene.add( gltf.scene );
  

// 		// gltf.animations; // Array<THREE.AnimationClip>
// 		// gltf.scene; // THREE.Group
// 		// gltf.scenes; // Array<THREE.Group>
// 		// gltf.cameras; // Array<THREE.Camera>
// 		// gltf.asset; // Object

// 	},
// 	// called while loading is progressing
// 	function ( xhr ) {

// 		console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

// 	},
// 	// called when loading has errors
// 	function ( error ) {

// 		console.log( 'An error happened' );

// 	}
// );
gui.add(lho, 'visible').name("light visualizations");
gui.add(alo, 'intensity').name("ambient light level");

// make screen 
const geometry = new THREE.PlaneGeometry(5.0, 5.0);
const material1 = new THREE.MeshStandardMaterial({color: 0xFFFFFF, side: THREE.DoubleSide,});
// material1.shadowSide = THREE.DoubleSide;
material1.shadowSide = THREE.BackSide;
material1.side = THREE.BackSide;
const backPlane = new THREE.Mesh( geometry, material1 );
backPlane.castShadow = true;
backPlane.receiveShadow = true;
// backPlane.position.z -= 4
scene.add( backPlane );

// update camera
camera.position.z = -5;
controls.update();

// debug visualizations
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
