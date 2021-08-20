import * as THREE from 'https://cdn.skypack.dev/three';
import * as TWEEN from 'https://cdn.skypack.dev/tween';


//#region Constant Variables
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

const container = document.getElementById('container');
const pages = document.getElementsByClassName('page');

const canvasSize = (Math.min(window.innerWidth, window.innerHeight) - 20) / 4;
const padding = 5;
const numOfItems = 9;
const itemWidth = (canvasSize - ((1 + numOfItems) * padding)) / numOfItems;
//#endregion

//#region Global Variables
let playerMoving = false;
let loading = true;
let fullscreen = true;

let playerMovementTween;
let player;
//#endregion

//#region THREE.js Variables
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-canvasSize / 2, canvasSize / 2, canvasSize / 2, -canvasSize / 2)
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
//#endregion

//initialises THREE.js
function initTHREE() {
    //initialise renderer
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvasSize, canvasSize);
    //add renderer to webgl DOM
    document.querySelector('#webgl').appendChild(renderer.domElement);
    //set the DOMs width and height
    document.getElementById("webgl").style.width = "auto";
    document.getElementById("webgl").style.height = "auto";
    //move the camera so it can view the scene
    camera.translateZ(100);

    //zoom canvas
    renderer.setSize(canvasSize * 4, canvasSize * 4);
    var right = ((window.innerWidth - canvasSize * 4) / 2);
    document.getElementById("webgl").style.right = right.toString() + "px";

    //add directionalLight
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 0, 100);
    scene.add(directionalLight);
}

//#region initialise SWIPES
document.addEventListener('touchstart', handleTouchStart, false);        
document.addEventListener('touchmove', handleTouchMove, false);

var xDown = null;                                                        
var yDown = null;

function getTouches(evt) {
  return evt.touches ||             // browser API
         evt.originalEvent.touches; // jQuery
}                                                     
                                                                         
function handleTouchStart(evt) {
    const firstTouch = getTouches(evt)[0];                                      
    xDown = firstTouch.clientX;                                      
    yDown = firstTouch.clientY;                                      
};                                                
                                                                         
function handleTouchMove(evt) {
    if ( ! xDown || ! yDown || loading) {
        return;
    }

    var xUp = evt.touches[0].clientX;                                    
    var yUp = evt.touches[0].clientY;

    var xDiff = xDown - xUp;
    var yDiff = yDown - yUp;
                                                                         
    if ( Math.abs( xDiff ) > Math.abs( yDiff ) ) {/*most significant*/
        if ( xDiff > 0 ) {
            /* right swipe */ 
            move('a');
        } else {
            /* left swipe */
            move('d');
        }                       
    } else {
        if ( yDiff > 0 ) {
            /* down swipe */ 
            move('w');
        } else { 
            /* up swipe */
            move('s');
        }                                                                 
    }
    /* reset values */
    xDown = null;
    yDown = null;                                             
};
//#endregion

//initialises the game
let canvasTween = resizeCanvas(false);
function initGame() {
    const bg = new THREE.Mesh(new THREE.BoxGeometry(canvasSize, canvasSize, 0.1, 1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x84cdca }));
    scene.add(bg)

    let player;
    for (var x = 0; x < numOfItems; x++) {
        for (var y = 0; y < numOfItems; y++) {
            var w = itemWidth;
            if (maze2D[(numOfItems - 1) - y][x] == '.') { w += padding; }
            const cube = new THREE.Mesh(new THREE.BoxGeometry(w, w, w, 1, 1, 1), new THREE.MeshStandardMaterial({ color: 0xE8A87C }));
            //odd numbers then middle is floor(numOfItems/2)
            cube.translateX((x - Math.floor(numOfItems / 2)) * (itemWidth + padding));
            cube.translateY((y - Math.floor(numOfItems / 2)) * (itemWidth + padding));
            cube.translateZ(itemWidth);

            if (maze2D[(numOfItems - 1) - y][x] == '_') {
                mazePosition.x = x - Math.floor(numOfItems / 2);
                mazePosition.y = y - Math.floor(numOfItems / 2);
                cube.material.color.setHex(0x40B3A2);
                player = cube;
                scene.add(cube);
            }

            if (maze2D[(numOfItems - 1) - y][x] == '.') {
                scene.add(cube);
            }
            if (maze2D[(numOfItems - 1) - y][x] >= '0' && maze2D[(numOfItems - 1) - y][x] <= '9') {
                // it is a number
                if (maze2D[(numOfItems - 1) - y][x] == '0'  ) {
                    cube.material.color.setHex(0x3a3a3a);
                } else {
                    const texture = new THREE.TextureLoader().load('images/' + maze2D[(numOfItems - 1) - y][x] + '.png');
                    cube.material.map = texture;
                    cube.material.color.setHex(0xC38D9D);
                }
                cube.translateZ(-itemWidth);
                scene.add(cube);
            } else {
                // it isn't
            }
        }
    }
    return player;
}

//starts the game (calls initGame)
function startGame() {
    player = initGame();
    animate();

    var playerRotation = { x: 0, y: 0 }
    var targetRotation = { x: Math.PI, y: Math.PI }
    var loadingTween = new TWEEN.Tween(playerRotation).to(targetRotation, 1500);
    loadingTween.onUpdate(function () {
        let euler = new THREE.Euler(playerRotation.x, playerRotation.y, 0)
        player.setRotationFromEuler(euler);
    });

    loadingTween.onComplete(function () {
        let euler = new THREE.Euler(0, 0, 0)
        player.setRotationFromEuler(euler);
        loading = false;
    });

    loadingTween.start();
}

//initialise key listener
document.querySelector('body').addEventListener('keypress', onKeyDown)
function onKeyDown(event) {
    if (!playerMoving && !loading) {
        move(event.key);
    }
}

function move(key) {
    var direction = movementDictionary[key];
    var newX = mazePosition.x + direction.x;
    var newY = mazePosition.y + direction.y;

    console.log((-newY) + Math.floor(numOfItems / 2), newX + Math.floor(numOfItems / 2), maze2D[(-newY) + Math.floor(numOfItems / 2)][newX + Math.floor(numOfItems / 2)])
    if (maze2D[(-newY) + Math.floor(numOfItems / 2)][newX + Math.floor(numOfItems / 2)] == '.') { return; }

    mazePosition.x = newX;
    mazePosition.y = newY;

    var playerData = { x: player.rotation.x, y: player.rotation.y, posX: player.position.x, posY: player.position.y };
    var target = { x: player.rotation.x + (-direction.y * Math.PI / 2), y: player.rotation.y + (direction.x * Math.PI / 2), posX: player.position.x + (direction.x * (itemWidth + padding)), posY: player.position.y + (direction.y * (itemWidth + padding)) };
    playerMovementTween = new TWEEN.Tween(playerData).to(target, 120);
    playerMovementTween.onUpdate(function () {
        player.rotation.x = playerData.x;
        player.rotation.y = playerData.y;
        player.position.x = playerData.posX;
        player.position.y = playerData.posY;
    });

    playerMovementTween.onComplete(function () {
        let euler = new THREE.Euler(0, 0, 0)
        player.setRotationFromEuler(euler);
        playerMoving = false;

        loadPage(maze2D[(-newY) + Math.floor(numOfItems / 2)][newX + Math.floor(numOfItems / 2)]);
    });

    playerMovementTween.start();
    playerMoving = true;
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
        var right = ((1 - size.t) * 10) + (size.t * (window.innerWidth - size.size) / 2);
        document.getElementById("webgl").style.right = right.toString() + "px";
    });

    return canvasTween;
}

function animate() {
    requestAnimationFrame(animate);

    //center.rotation.y += 0.01;
    //center.rotation.z += 0.01;
    TWEEN.update();
    renderer.render(scene, camera);
}

//Run the game
initTHREE();
startGame();