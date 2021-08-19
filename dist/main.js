import * as THREE from 'https://cdn.skypack.dev/three';
import * as TWEEN from 'https://cdn.skypack.dev/tween';

const container = document.querySelector('#container');
const pages = document.getElementsByClassName('page');

var loading = true;

const mazePosition = { x: 0, y: 0 }
const maze2D =
  [['.', '.', '.', '.', '.', '.', '.', '.', '.'],
  ['.', '_', '0', '.', '.', ' ', '2', ' ', '.'],
  ['.', ' ', ' ', ' ', ' ', ' ', '.', ' ', '.'],
  ['.', ' ', '.', '.', ' ', '.', '0', ' ', '.'],
  ['.', ' ', '.', '.', ' ', '.', '.', ' ', '.'],
  ['.', '1', ' ', '.', ' ', ' ', ' ', '3', '.'],
  ['.', '.', ' ', ' ', ' ', '.', '.', ' ', '.'],
  ['.', '0', ' ', '.', ' ', ' ', ' ', ' ', '.'],
  ['.', '.', '.', '.', '.', '.', '.', '.', '.']]
const movementDictionary =
{
  'w': { x: 0, y: 1 },
  'a': { x: -1, y: 0 },
  's': { x: 0, y: -1 },
  'd': { x: 1, y: 0 },
}

document.querySelector('body').addEventListener('keypress', onKeyDown)

for (var x = 0; x < pages.length; x++) {
  pages[x].setAttribute('hidden', '');
}

function onKeyDown(event) {
  if (!tweening && !loading) {
    move(event.key);
  }
}

const scene = new THREE.Scene();

var canvasSize = (window.innerHeight - 20) / 4;

//const camera = new THREE.PerspectiveCamera(75, window.innerHeight / window.innerHeight, 0.1, 1000);
const camera = new THREE.OrthographicCamera(-canvasSize / 2, canvasSize / 2, canvasSize / 2, -canvasSize / 2)
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(canvasSize, canvasSize);
document.querySelector('#webgl').appendChild(renderer.domElement);
document.getElementById("webgl").style.width = "auto";
document.getElementById("webgl").style.height = "auto";
camera.position.setZ(100);

renderer.render(scene, camera);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 0, 100);
scene.add(directionalLight);

var padding = 5;
var numOfItems = 9;
var itemWidth = (canvasSize - ((1 + numOfItems) * padding)) / numOfItems;

const bg = new THREE.Mesh(new THREE.BoxGeometry(canvasSize, canvasSize, 0.1, 1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x84cdca }));
scene.add(bg)

var center;
for (var x = 0; x < numOfItems; x++) {
  for (var y = 0; y < numOfItems; y++) {
    var w = itemWidth;
    if (maze2D[(numOfItems - 1) - y][x] == '.') { w += padding; }
    const dice = new THREE.Mesh(new THREE.BoxGeometry(w, w, w, 1, 1, 1), new THREE.MeshStandardMaterial({ color: 0xE8A87C }));
    //odd numbers then middle is floor(numOfItems/2)
    dice.position.x = (x - Math.floor(numOfItems / 2)) * (itemWidth + padding);
    dice.position.y = (y - Math.floor(numOfItems / 2)) * (itemWidth + padding);
    dice.position.z = itemWidth;

    if (maze2D[(numOfItems - 1) - y][x] == '_') {
      mazePosition.x = x - Math.floor(numOfItems / 2);
      mazePosition.y = y - Math.floor(numOfItems / 2);
      dice.material.color.setHex(0x40B3A2);
      center = dice;
      scene.add(dice);
    }

    if (maze2D[(numOfItems - 1) - y][x] == '.') {
      scene.add(dice);
    }
    if (maze2D[(numOfItems - 1) - y][x] >= '0' && maze2D[(numOfItems - 1) - y][x] <= '9') {
      // it is a number
      if (maze2D[(numOfItems - 1) - y][x] == 0) {
        dice.material.color.setHex(0x3a3a3a);
      } else {
        const texture = new THREE.TextureLoader().load('images/' + maze2D[(numOfItems - 1) - y][x] + '.png');
        dice.material.map = texture;
        dice.material.color.setHex(0xC38D9D);
      }
      dice.position.z = 0;
      scene.add(dice);
    } else {
      // it isn't
    }
  }
}

var tweening = false;
var tween = new TWEEN.Tween();


function move(key) {
  var direction = movementDictionary[key];
  var newX = mazePosition.x + direction.x;
  var newY = mazePosition.y + direction.y;

  console.log((-newY) + Math.floor(numOfItems / 2), newX + Math.floor(numOfItems / 2), maze2D[(-newY) + Math.floor(numOfItems / 2)][newX + Math.floor(numOfItems / 2)])
  if (maze2D[(-newY) + Math.floor(numOfItems / 2)][newX + Math.floor(numOfItems / 2)] == '.') { return; }

  mazePosition.x = newX;
  mazePosition.y = newY;

  var rotation = { x: center.rotation.x, y: center.rotation.y, posX: center.position.x, posY: center.position.y };
  var target = { x: center.rotation.x + (-direction.y * Math.PI / 2), y: center.rotation.y + (direction.x * Math.PI / 2), posX: center.position.x + (direction.x * (itemWidth + padding)), posY: center.position.y + (direction.y * (itemWidth + padding)) };
  tween = new TWEEN.Tween(rotation).to(target, 120);
  tween.onUpdate(function () {
    center.rotation.x = rotation.x;
    center.rotation.y = rotation.y;
    center.position.x = rotation.posX;
    center.position.y = rotation.posY;
  });

  tween.onComplete(function () {
    center.rotation.x = 0;
    center.rotation.y = 0;
    tweening = false;
    loadPage(maze2D[(-newY) + Math.floor(numOfItems / 2)][newX + Math.floor(numOfItems / 2)]);
  });
  tween.start();
  tweening = true;
}

function loadPage(page) {
  if (page >= '0' && page <= '9') {
    // it is a number
    for (var x = 0; x < pages.length; x++) {
      pages[x].setAttribute('hidden', '');
    }

    if (page == '0' && !fullscreen) {
      console.log('GROWWWW!!!')
      canvasTween = resizeCanvas(true);
      canvasTween.start();
      fullscreen = true;

      return;
    }


    if (fullscreen && page !== '0') {
      canvasTween = resizeCanvas(!fullscreen);
      canvasTween.start();
      fullscreen = false;
    }

    if (page !== '0') {
      pages[page - 1].removeAttribute('hidden');
    }
  } else {
    // it isn't
  }
}

renderer.setSize(canvasSize * 4, canvasSize * 4);
var right = 10 + ((window.innerWidth - canvasSize * 4) / 2);
document.getElementById("webgl").style.right = right.toString() + "px";

var fullscreen = true;
var canvasTween = resizeCanvas(!fullscreen);

function resizeCanvas(grow) {
  var size;
  var finalSize;

  if (grow) {
    finalSize = { size: canvasSize * 4, t: 1 };
    size = { size: canvasSize, t: 0 };
  } else {
    size = { size: canvasSize * 4, t: 1 };
    finalSize = { size: canvasSize, t: 0 };
  }

  var canvasTween = new TWEEN.Tween(size).to(finalSize, 750);
  canvasTween.easing(TWEEN.Easing.Cubic.InOut);

  canvasTween.onUpdate(function () {
    renderer.setSize(size.size, size.size);
    var right = 10 + (size.t * (window.innerWidth - size.size) / 2);
    document.getElementById("webgl").style.right = right.toString() + "px";
  });

  return canvasTween;
}

var playerRotation = { x: 0, y: 0 }
var targetRotation = { x: Math.PI, y: Math.PI }
var loadingTween = new TWEEN.Tween(playerRotation).to(targetRotation, 1500);
loadingTween.onUpdate(function () {
  center.rotation.x = playerRotation.x;
  center.rotation.y = playerRotation.y;
});

loadingTween.onComplete(function () {
  center.rotation.x = 0;
  center.rotation.y = 0;
  loading = false;
});

loadingTween.start();

function animate() {
  requestAnimationFrame(animate);

  //center.rotation.y += 0.01;
  //center.rotation.z += 0.01;
  TWEEN.update();
  renderer.render(scene, camera);
}

animate();