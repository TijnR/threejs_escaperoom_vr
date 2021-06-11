import './style.css'
import * as THREE from 'three'
import { BoxLineGeometry } from 'three/examples/jsm/geometries/BoxLineGeometry.js'
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js'
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js'
import { seededRandom } from 'three/src/math/MathUtils'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

//Setting up variables
let camera, scene, renderer
let controller1, controller2
let controllerGrip1, controllerGrip2

let room

let count = 0
const radius = 0.03
let normal = new THREE.Vector3()
const relativeVelocity = new THREE.Vector3()

const clock = new THREE.Clock()





//active functions
init()

const controls = new OrbitControls( camera, renderer.domElement );

animate()

//initialize scene
function init() {
  /**
   * Scene
   */
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x505050)



  /**
   * Camera
   */
  camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    20
  )
  camera.position.set(0, 1.6, 3)

  /**
   * Light
   */
  // const hemiLight = new THREE.HemisphereLight( 0x202020, 0x444444 );
  // hemiLight.position.set( 0, 300, 0 );
  // scene.add( hemiLight );

  const light = new THREE.DirectionalLight(0xaaaaaa)
  light.position.set(0, 100, 0).normalize()
  scene.add(light)

  /**
   * Objects
   */

  // let grabable = new THREE.Mesh(
  //   new THREE.BoxBufferGeometry(1.0, 1.0, 1.0),
  //   new THREE.MeshBasicMaterial({
  //       color: 0xff0066,
  //       wireframe: true
  //   })
  // )
  // scene.add(grabable)
  // grabVR.grabableObjects().push(grabable);

  //room
  room = new THREE.LineSegments(
    new BoxLineGeometry(12, 12, 12, 10, 10, 10),
    new THREE.LineBasicMaterial({ color: 0x34cceb })
  )
  room.geometry.translate(0, 6, 0)
  scene.add(room)

  // const geometry = new THREE.IcosahedronGeometry(radius, 3)
  const geometry = new THREE.BoxGeometry(0.05, 0.05, 1)
  const lasersMaterial = new THREE.MeshBasicMaterial({color: 0x39ff14})

  for (let i = 0; i < 200; i++) {
    const object = new THREE.Mesh(
      geometry,
      lasersMaterial
    )

    object.transparent = true

    object.userData.velocity = new THREE.Vector3()

    room.add(object)
  }

  /**
   * Renderer
   */
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.outputEncoding = THREE.sRGBEncoding
  renderer.xr.enabled = true
  document.body.appendChild(renderer.domElement)
  document.body.appendChild(VRButton.createButton(renderer))

  /**
   * Controls
   */

  function onSelectStart() {
    this.userData.isSelecting = true
  }

  function onSelectEnd() {
    this.userData.isSelecting = false
  }

  //controller 1
  controller1 = renderer.xr.getController(0)
  controller1.cooldown = false
  controller1.addEventListener('selectstart', onSelectStart)
  controller1.addEventListener('selectend', onSelectEnd)
  controller1.addEventListener('connected', function (event) {
    this.add(buildController(event.data))
  })
  controller1.addEventListener('disconnected', function () {
    this.remove(this.children[0])
  })
  scene.add(controller1)

  //controller 2
  controller2 = renderer.xr.getController(1)
  controller2.cooldown = false
  controller2.addEventListener('selectstart', onSelectStart)
  controller2.addEventListener('selectend', onSelectEnd)
  controller2.addEventListener('connected', function (event) {
    this.add(buildController(event.data))
  })
  controller2.addEventListener('disconnected', function () {
    this.remove(this.children[0])
  })
  scene.add(controller2)


  // The XRControllerModelFactory will automatically fetch controller models
  // that match what the user is holding as closely as possible. The models
  // should be attached to the object returned from getControllerGrip in
  // order to match the orientation of the held device.

  //controller model
  const controllerModelFactory = new XRControllerModelFactory()

  //controller grip?
  controllerGrip1 = renderer.xr.getControllerGrip(0)
  controllerGrip1.addEventListener("connected", (e) => {
    // grabVR.add(0, controllerGrip1, e.data.gamepad)
    // this.release(e.data.gamepad)
  })
  //oculus controller model
  // controllerGrip1.add(
  //   controllerModelFactory.createControllerModel(controllerGrip1)
  // )

  scene.add(controllerGrip1)

  controllerGrip2 = renderer.xr.getControllerGrip(1)
  // controllerGrip2.add(
  //   controllerModelFactory.createControllerModel(controllerGrip2)
  // )
  scene.add(controllerGrip2)


  //Loading model
  const loader = new GLTFLoader()
  loader.load(
    '/models/lasergun/lasergun.glb',
    (gltf) => {
      // gltf.scene.position.y = 1
      // gltf.scene.position.z = -3
      gltf.scene.rotation.x = -Math.PI * 0.25
      gltf.scene.rotation.y = -Math.PI 
      gltf.scene.scale.set(0.002, 0.002, 0.002)

      console.log(gltf);

      const pistol1 = gltf.scene.clone()
      const pistol2 = gltf.scene.clone()
      
      // scene.add(gltf.scene)
      controllerGrip1.add(pistol1)
      pistol1.position.x += 0.003
      pistol1.position.y -= 0.08
      pistol1.position.z += 0.05

      controllerGrip2.add(pistol2)
      pistol2.position.x -= 0.015
      pistol2.position.y -= 0.08
      pistol2.position.z += 0.05

    },
    (xhr) => {
      console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
    },
    (error) => {
      console.log('An error happened')
    }
  )

  
  //resize event listener
  window.addEventListener('resize', onWindowResize)
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  renderer.setSize(window.innerWidth, window.innerHeight)
}

//function to build the controller and when activated, it will add to the scene.
function buildController(data) {
  let geometry, material

  switch (data.targetRayMode) {
    case 'tracked-pointer':
      geometry = new THREE.BufferGeometry()
      geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, -1], 3)
      )
      geometry.setAttribute(
        'color',
        new THREE.Float32BufferAttribute([0.5, 0.5, 0.5, 0, 0, 0], 3)
      )

      material = new THREE.LineBasicMaterial({
        vertexColors: true,
        blending: THREE.AdditiveBlending,
      })

      return new THREE.Line(geometry, material)

    case 'gaze':
      geometry = new THREE.RingGeometry(0.02, 0.04, 32).translate(0, 0, -1)
      material = new THREE.MeshBasicMaterial({
        opacity: 0.5,
        transparent: true,
      })
      return new THREE.Mesh(geometry, material)
  }
}

//function that activates each frame. Parameter is the controller itself.
function handleController(controller) {
  //check if controller(trigger) is pulled
  if (controller.userData.isSelecting && !controller.cooldown) {
    const object = room.children[count++]

    object.transparent = false

    object.position.copy(controller.position)
    object.rotation.copy(controller.rotation)
    object.userData.velocity.x = 0
    object.userData.velocity.y = 0
    object.userData.velocity.z = Math.random() - 15
    object.userData.velocity.applyQuaternion(controller.quaternion)

    if (count === room.children.length) count = 0
    controller.cooldown = true
    setTimeout(() => {
      controller.cooldown = false
    }, 100)
  }
}

//Function that will make sure the scene runs smooth on every frame
function animate() {
  renderer.setAnimationLoop(render)
}

//This render function is invoked on each render, so on every frame on the computer. Here i update data thats needs to be updated on every frame
function render() {
  // grabVR.update(clock.getDelta());

  handleController(controller1)
  handleController(controller2)
  // release(controllerGrip1)

  controls.update();

  const delta = clock.getDelta() * 0.8 // slow down simulation

  const range = 6 - radius

  //loop to check the position of every item and to bounce of the room
  for (let i = 0; i < room.children.length; i++) {
    const object = room.children[i]

    //update position with velocity and uses delta to slow down.
    object.position.x += object.userData.velocity.x * delta
    object.position.y += object.userData.velocity.y * delta
    object.position.z += object.userData.velocity.z * delta

    // keep objects inside room
    //for x coordinate
    if (object.position.x < -range || object.position.x > range) {
      object.position.x = THREE.MathUtils.clamp(
        object.position.x,
        -range,
        range
      )
      object.userData.velocity.x = -object.userData.velocity.x
    }
    //for y coordinate
    if (object.position.y < radius || object.position.y > 6) {
      object.position.y = Math.max(object.position.y, radius)

      object.userData.velocity.x *= 0.98
      object.userData.velocity.y = -object.userData.velocity.y * 0.8
      object.userData.velocity.z *= 0.98
    }
    //for z coordinate
    if (object.position.z < -range || object.position.z > range) {
      object.position.z = THREE.MathUtils.clamp(
        object.position.z,
        -range,
        range
      )
      object.userData.velocity.z = -object.userData.velocity.z
    }
    

    //gravity
    object.userData.velocity.y -= 9.8 * delta
  }

  renderer.render(scene, camera)
}
