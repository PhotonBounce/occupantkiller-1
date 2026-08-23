window.ShoppingDistrict = (function() { 'use strict';
  var requestAnimationFrame = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.requestAnimationFrame.bind(window) : function () { return 0; };
  var setTimeout = (typeof window !== 'undefined' && window.__ALLOW_EMBEDDED_MINIGAMES) ? window.setTimeout.bind(window) : function () { return 0; };

var scene, camera, renderer, canvas, stats;
var sceneObjects = [];
var civilians = [];
var policeOfficers = [];
var shooter = null;
var policeVehicle = null;
var tacticalVehicle = null;
var ambulance = null;
var busStop = null;
var streetLights = [];
var clock = new THREE.Clock();
var hudCanvas, hudContext;
var keyState = {};
var lastSKeyTime = 0;
var showHUD = true;
var civiliansSafe = 0;
var threatNeutralized = false;
var policeUnits = 3;

var colors = {
	asphalt: 0x333333,
	concrete: 0xcccccc,
	storefront: 0x8b4513,
	glass: 0x88ccff,
	car: 0xcc0000,
	police: 0x001aff,
	ambulance: 0xffffff,
	police_light_red: 0xff0000,
	police_light_blue: 0x0000ff,
	skin: 0xffdbac,
	street_light: 0xffff99
};

function init(width, height) {
    if (typeof window !== 'undefined' && !window.__ALLOW_EMBEDDED_MINIGAMES) return; /* standalone mini-game disabled: own renderer, was crashing/launching over the main game */

	scene = new THREE.Scene();
	scene.background = new THREE.Color(0x87ceeb);
	scene.fog = new THREE.Fog(0x87ceeb, 500, 1000);

	camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 10000);
	camera.position.set(0, 40, 80);
	camera.lookAt(0, 0, 0);

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(width, height);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFShadowShadowMap;
	renderer.outputColorSpace = THREE.SRGBColorSpace;

	canvas = renderer.domElement;
	document.body.appendChild(canvas);

	var light = new THREE.DirectionalLight(0xffffff, 1);
	light.position.set(50, 100, 50);
	light.castShadow = true;
	light.shadow.mapSize.width = 2048;
	light.shadow.mapSize.height = 2048;
	light.shadow.camera.far = 500;
	light.shadow.camera.left = -300;
	light.shadow.camera.right = 300;
	light.shadow.camera.top = 300;
	light.shadow.camera.bottom = -300;
	scene.add(light);

	var ambientLight = new THREE.AmbientLight(0x666666);
	scene.add(ambientLight);

	createStreet();
	createStorefrontA();
	createStorefrontB();
	createParkedCars();
	createBusStop();
	createStreetLights();
	createShooter();
	createCivilians();
	createPoliceVehicle();
	createPoliceOfficers();
	createOverturnedStall();
	createBollards();
	createBarrierTape();
	createTacticalVehicle();
	createWindowDebris();
	createCCTVPole();
	createAmbulance();

	setupHUD();
	setupEventListeners();

	return { canvas: canvas, update: update };
}

function createStreet() {
	var geometry = new THREE.BoxGeometry(200, 1, 150);
	var material = new THREE.MeshStandardMaterial({ color: colors.asphalt });
	var street = new THREE.Mesh(geometry, material);
	street.receiveShadow = true;
	street.castShadow = true;
	scene.add(street);
	sceneObjects.push(street);
}

function createStorefrontA() {
	var geometry = new THREE.BoxGeometry(60, 40, 15);
	var material = new THREE.MeshStandardMaterial({ color: colors.storefront });
	var building = new THREE.Mesh(geometry, material);
	building.position.set(-80, 20, -60);
	building.castShadow = true;
	building.receiveShadow = true;
	scene.add(building);
	sceneObjects.push(building);

	var windowMaterial = new THREE.LineBasicMaterial({ color: colors.glass });
	for (var y = 0; y < 4; y++) {
		for (var x = 0; x < 6; x++) {
			var wx = -25 + x * 10;
			var wy = 5 + y * 8;
			var points = [
				new THREE.Vector3(wx - 3, wy + 3, -7.5),
				new THREE.Vector3(wx + 3, wy + 3, -7.5),
				new THREE.Vector3(wx + 3, wy - 3, -7.5),
				new THREE.Vector3(wx - 3, wy - 3, -7.5),
				new THREE.Vector3(wx - 3, wy + 3, -7.5)
			];
			var geometry = new THREE.BufferGeometry().setFromPoints(points);
			var line = new THREE.LineSegments(geometry, windowMaterial);
			line.position.copy(building.position);
			scene.add(line);
			sceneObjects.push(line);
		}
	}
}

function createStorefrontB() {
	var geometry = new THREE.BoxGeometry(60, 40, 15);
	var material = new THREE.MeshStandardMaterial({ color: colors.storefront });
	var building = new THREE.Mesh(geometry, material);
	building.position.set(80, 20, -60);
	building.castShadow = true;
	building.receiveShadow = true;
	scene.add(building);
	sceneObjects.push(building);

	var windowMaterial = new THREE.LineBasicMaterial({ color: colors.glass });
	for (var y = 0; y < 4; y++) {
		for (var x = 0; x < 6; x++) {
			var wx = -25 + x * 10;
			var wy = 5 + y * 8;
			var points = [
				new THREE.Vector3(wx - 3, wy + 3, 7.5),
				new THREE.Vector3(wx + 3, wy + 3, 7.5),
				new THREE.Vector3(wx + 3, wy - 3, 7.5),
				new THREE.Vector3(wx - 3, wy - 3, 7.5),
				new THREE.Vector3(wx - 3, wy + 3, 7.5)
			];
			var geometry = new THREE.BufferGeometry().setFromPoints(points);
			var line = new THREE.LineSegments(geometry, windowMaterial);
			line.position.copy(building.position);
			scene.add(line);
			sceneObjects.push(line);
		}
	}
}

function createParkedCars() {
	var positions = [
		{ x: -60, z: 30 },
		{ x: -20, z: 30 },
		{ x: 20, z: 30 },
		{ x: 60, z: 30 }
	];

	for (var i = 0; i < positions.length; i++) {
		var geometry = new THREE.BoxGeometry(12, 10, 20);
		var material = new THREE.MeshStandardMaterial({ color: colors.car });
		var car = new THREE.Mesh(geometry, material);
		car.position.set(positions[i].x, 5, positions[i].z);
		car.castShadow = true;
		car.receiveShadow = true;
		scene.add(car);
		sceneObjects.push(car);
	}
}

function createBusStop() {
	var group = new THREE.Group();
	group.position.set(-100, 0, 50);

	var benchGeometry = new THREE.BoxGeometry(30, 8, 5);
	var benchMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
	var bench = new THREE.Mesh(benchGeometry, benchMaterial);
	bench.position.y = 4;
	bench.castShadow = true;
	bench.receiveShadow = true;
	group.add(bench);

	for (var i = 0; i < 2; i++) {
		var poleGeometry = new THREE.CylinderGeometry(1, 1, 20, 16);
		var poleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
		var pole = new THREE.Mesh(poleGeometry, poleMaterial);
		pole.position.set(-12 + i * 24, 10, 0);
		pole.castShadow = true;
		pole.receiveShadow = true;
		group.add(pole);
	}

	var roofGeometry = new THREE.BoxGeometry(35, 2, 8);
	var roofMaterial = new THREE.MeshStandardMaterial({ color: 0x999999 });
	var roof = new THREE.Mesh(roofGeometry, roofMaterial);
	roof.position.set(0, 22, 0);
	roof.castShadow = true;
	roof.receiveShadow = true;
	group.add(roof);

	scene.add(group);
	busStop = group;
	sceneObjects.push(group);
}

function createStreetLights() {
	var positions = [-60, -30, 0, 30, 60];

	for (var i = 0; i < positions.length; i++) {
		var poleGeometry = new THREE.CylinderGeometry(1, 1, 30, 16);
		var poleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
		var pole = new THREE.Mesh(poleGeometry, poleMaterial);
		pole.position.set(positions[i], 15, 70);
		pole.castShadow = true;
		pole.receiveShadow = true;
		scene.add(pole);
		sceneObjects.push(pole);

		var lightGeometry = new THREE.SphereGeometry(3, 8, 8);
		var lightMaterial = new THREE.MeshStandardMaterial({
			color: colors.street_light,
			emissive: colors.street_light,
			emissiveIntensity: 0.5
		});
		var light = new THREE.Mesh(lightGeometry, lightMaterial);
		light.position.set(positions[i], 30, 70);
		scene.add(light);
		sceneObjects.push(light);
		streetLights.push({ mesh: light, material: lightMaterial, intensity: 0.5 });
	}
}

function createShooter() {
	var group = new THREE.Group();
	group.position.set(0, 0, 10);

	var bodyGeometry = new THREE.BoxGeometry(4, 12, 5);
	var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
	var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
	body.position.y = 6;
	body.castShadow = true;
	body.receiveShadow = true;
	group.add(body);

	var headGeometry = new THREE.SphereGeometry(2.5, 16, 16);
	var headMaterial = new THREE.MeshStandardMaterial({ color: colors.skin });
	var head = new THREE.Mesh(headGeometry, headMaterial);
	head.position.set(0, 16, 0);
	head.castShadow = true;
	head.receiveShadow = true;
	group.add(head);

	scene.add(group);
	shooter = group;
	sceneObjects.push(group);
}

function createCivilians() {
	var positions = [
		{ x: 30, z: -40 },
		{ x: -30, z: -40 },
		{ x: 50, z: 0 },
		{ x: -50, z: 0 },
		{ x: 40, z: 40 },
		{ x: -40, z: 40 }
	];

	for (var i = 0; i < positions.length; i++) {
		var group = new THREE.Group();
		group.position.set(positions[i].x, 0, positions[i].z);

		var bodyGeometry = new THREE.BoxGeometry(3, 10, 3);
		var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x0066cc });
		var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
		body.position.y = 5;
		body.castShadow = true;
		body.receiveShadow = true;
		group.add(body);

		var headGeometry = new THREE.SphereGeometry(2, 16, 16);
		var headMaterial = new THREE.MeshStandardMaterial({ color: colors.skin });
		var head = new THREE.Mesh(headGeometry, headMaterial);
		head.position.set(0, 14, 0);
		head.castShadow = true;
		head.receiveShadow = true;
		group.add(head);

		scene.add(group);
		civilians.push({
			group: group,
			startPos: { x: positions[i].x, y: 0, z: positions[i].z },
			safe: false,
			time: 0
		});
		sceneObjects.push(group);
	}
}

function createPoliceVehicle() {
	var group = new THREE.Group();
	group.position.set(100, 0, 0);

	var bodyGeometry = new THREE.BoxGeometry(12, 10, 20);
	var bodyMaterial = new THREE.MeshStandardMaterial({ color: colors.police });
	var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
	body.castShadow = true;
	body.receiveShadow = true;
	group.add(body);

	var lightBarGeometry = new THREE.BoxGeometry(12, 1, 20);
	var lightBarMaterial = new THREE.MeshStandardMaterial({
		color: 0x444444,
		emissive: 0xff0000,
		emissiveIntensity: 0
	});
	var lightBar = new THREE.Mesh(lightBarGeometry, lightBarMaterial);
	lightBar.position.y = 6;
	group.add(lightBar);

	scene.add(group);
	policeVehicle = { group: group, lightBar: lightBar, material: lightBarMaterial, strobePhase: 0 };
	sceneObjects.push(group);
}

function createPoliceOfficers() {
	var positions = [
		{ x: 80, z: -10 },
		{ x: 80, z: 10 },
		{ x: 60, z: 0 }
	];

	for (var i = 0; i < positions.length; i++) {
		var group = new THREE.Group();
		group.position.set(positions[i].x, 0, positions[i].z);

		var bodyGeometry = new THREE.BoxGeometry(3, 10, 3);
		var bodyMaterial = new THREE.MeshStandardMaterial({ color: colors.police });
		var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
		body.position.y = 5;
		body.castShadow = true;
		body.receiveShadow = true;
		group.add(body);

		var headGeometry = new THREE.SphereGeometry(2, 16, 16);
		var headMaterial = new THREE.MeshStandardMaterial({ color: colors.skin });
		var head = new THREE.Mesh(headGeometry, headMaterial);
		head.position.set(0, 14, 0);
		head.castShadow = true;
		head.receiveShadow = true;
		group.add(head);

		scene.add(group);
		policeOfficers.push({ group: group, time: 0 });
		sceneObjects.push(group);
	}
}

function createOverturnedStall() {
	var geometry = new THREE.BoxGeometry(8, 2, 8);
	var material = new THREE.MeshStandardMaterial({ color: 0xcc9900 });
	var stall = new THREE.Mesh(geometry, material);
	stall.position.set(-20, 1, 0);
	stall.rotation.z = Math.PI / 4;
	stall.castShadow = true;
	stall.receiveShadow = true;
	scene.add(stall);
	sceneObjects.push(stall);
}

function createBollards() {
	var positions = [
		{ x: -80, z: 0 },
		{ x: -40, z: -50 },
		{ x: 0, z: -70 },
		{ x: 40, z: -50 },
		{ x: 80, z: 0 },
		{ x: 0, z: 70 }
	];

	for (var i = 0; i < positions.length; i++) {
		var geometry = new THREE.CylinderGeometry(2, 2, 8, 16);
		var material = new THREE.MeshStandardMaterial({ color: 0xffcc00 });
		var bollard = new THREE.Mesh(geometry, material);
		bollard.position.set(positions[i].x, 4, positions[i].z);
		bollard.castShadow = true;
		bollard.receiveShadow = true;
		scene.add(bollard);
		sceneObjects.push(bollard);
	}
}

function createBarrierTape() {
	var material = new THREE.LineBasicMaterial({ color: 0xff0000 });
	var points = [
		new THREE.Vector3(-80, 0.5, 0),
		new THREE.Vector3(-40, 0.5, -50),
		new THREE.Vector3(0, 0.5, -70),
		new THREE.Vector3(40, 0.5, -50),
		new THREE.Vector3(80, 0.5, 0),
		new THREE.Vector3(0, 0.5, 70),
		new THREE.Vector3(-80, 0.5, 0)
	];
	var geometry = new THREE.BufferGeometry().setFromPoints(points);
	var tape = new THREE.LineSegments(geometry, material);
	scene.add(tape);
	sceneObjects.push(tape);
}

function createTacticalVehicle() {
	var group = new THREE.Group();
	group.position.set(150, 0, 0);

	var bodyGeometry = new THREE.BoxGeometry(16, 12, 25);
	var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
	var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
	body.castShadow = true;
	body.receiveShadow = true;
	group.add(body);

	scene.add(group);
	tacticalVehicle = group;
	sceneObjects.push(group);
}

function createWindowDebris() {
	var positions = [
		{ x: -90, z: -60 },
		{ x: -85, z: -60 },
		{ x: -80, z: -60 },
		{ x: 80, z: -60 },
		{ x: 85, z: -60 },
		{ x: 90, z: -60 }
	];

	for (var i = 0; i < positions.length; i++) {
		var geometry = new THREE.BoxGeometry(2, 0.5, 3);
		var material = new THREE.MeshStandardMaterial({ color: 0x88ccff });
		var debris = new THREE.Mesh(geometry, material);
		debris.position.set(positions[i].x, 0.5, positions[i].z);
		debris.castShadow = true;
		debris.receiveShadow = true;
		scene.add(debris);
		sceneObjects.push(debris);
	}
}

function createCCTVPole() {
	var group = new THREE.Group();
	group.position.set(-120, 0, -50);

	var poleGeometry = new THREE.CylinderGeometry(1.5, 1.5, 25, 16);
	var poleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
	var pole = new THREE.Mesh(poleGeometry, poleMaterial);
	pole.position.y = 12.5;
	pole.castShadow = true;
	pole.receiveShadow = true;
	group.add(pole);

	var cameraGeometry = new THREE.BoxGeometry(3, 2, 2);
	var cameraMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
	var camera = new THREE.Mesh(cameraGeometry, cameraMaterial);
	camera.position.y = 26;
	camera.castShadow = true;
	camera.receiveShadow = true;
	group.add(camera);

	scene.add(group);
	sceneObjects.push(group);
}

function createAmbulance() {
	var group = new THREE.Group();
	group.position.set(120, 0, 50);

	var bodyGeometry = new THREE.BoxGeometry(12, 10, 20);
	var bodyMaterial = new THREE.MeshStandardMaterial({ color: colors.ambulance });
	var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
	body.castShadow = true;
	body.receiveShadow = true;
	group.add(body);

	var crossGeometry = new THREE.BoxGeometry(4, 4, 0.5);
	var crossMaterial = new THREE.MeshStandardMaterial({
		color: 0xff0000,
		emissive: 0xff0000,
		emissiveIntensity: 0.7
	});
	var cross = new THREE.Mesh(crossGeometry, crossMaterial);
	cross.position.z = 5;
	group.add(cross);

	scene.add(group);
	ambulance = group;
	sceneObjects.push(group);
}

function setupHUD() {
	hudCanvas = document.createElement('canvas');
	hudCanvas.width = 512;
	hudCanvas.height = 128;
	hudCanvas.style.position = 'absolute';
	hudCanvas.style.top = '10px';
	hudCanvas.style.left = '10px';
	hudCanvas.style.fontFamily = 'monospace';
	hudCanvas.style.color = '#00ff00';
	hudCanvas.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
	hudCanvas.style.padding = '10px';
	hudCanvas.style.display = showHUD ? 'block' : 'none';
	document.body.appendChild(hudCanvas);

	hudContext = hudCanvas.getContext('2d');
	hudContext.fillStyle = '#00ff00';
	hudContext.font = '16px monospace';
}

function updateHUD() {
	if (!showHUD || !hudContext) return;

	hudContext.fillStyle = 'rgba(0, 0, 0, 0.7)';
	hudContext.fillRect(0, 0, hudCanvas.width, hudCanvas.height);

	hudContext.fillStyle = '#00ff00';
	hudContext.font = '16px monospace';
	hudContext.fillText('CIVILIANS SAFE: ' + civiliansSafe + '/6', 10, 30);
	hudContext.fillText('THREAT NEUTRALIZED: ' + (threatNeutralized ? 'YES' : 'NO'), 10, 60);
	hudContext.fillText('POLICE UNITS: ' + policeUnits, 10, 90);
}

function setupEventListeners() {
	document.addEventListener('keydown', function(e) {
		keyState[e.key] = true;

		if (e.key === 's' || e.key === 'S') {
			var now = Date.now();
			if (now - lastSKeyTime < 400) {
				showHUD = !showHUD;
				if (hudCanvas) {
					hudCanvas.style.display = showHUD ? 'block' : 'none';
				}
				lastSKeyTime = 0;
			} else {
				lastSKeyTime = now;
			}
		}
	});

	document.addEventListener('keyup', function(e) {
		keyState[e.key] = false;
	});

	window.addEventListener('resize', function() {
		var w = window.innerWidth;
		var h = window.innerHeight;
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
		renderer.setSize(w, h);
	});
}

function updateShooter(delta) {
	if (!shooter) return;
	shooter.position.x += Math.sin(clock.getElapsedTime() * 0.5) * delta * 10;
	shooter.position.z += Math.cos(clock.getElapsedTime() * 0.3) * delta * 5;
	shooter.rotation.y = Math.atan2(
		camera.position.x - shooter.position.x,
		camera.position.z - shooter.position.z
	);
}

function updateCivilians(delta) {
	for (var i = 0; i < civilians.length; i++) {
		var civilian = civilians[i];
		civilian.time += delta;

		var dirX = civilian.group.position.x - shooter.position.x;
		var dirZ = civilian.group.position.z - shooter.position.z;
		var dist = Math.sqrt(dirX * dirX + dirZ * dirZ);
		var fleeDist = 100;

		if (dist < fleeDist && !civilian.safe) {
			var speed = 40;
			var normalizedX = dirX / dist;
			var normalizedZ = dirZ / dist;
			civilian.group.position.x += normalizedX * speed * delta;
			civilian.group.position.z += normalizedZ * speed * delta;
		} else if (!civilian.safe && dist > 80) {
			civilian.safe = true;
			civiliansSafe++;
		}

		var bodyChild = civilian.group.children[0];
		if (bodyChild && civilian.safe) {
			bodyChild.rotation.x = Math.sin(civilian.time * 8) * 0.1;
		}
	}
}

function updatePoliceOfficers(delta) {
	for (var i = 0; i < policeOfficers.length; i++) {
		var officer = policeOfficers[i];
		officer.time += delta;

		var carX = -20 + i * 20;
		var targetX = carX + Math.sin(officer.time * 2) * 2;
		var targetZ = 30 + Math.cos(officer.time * 1.5) * 3;

		officer.group.position.x += (targetX - officer.group.position.x) * delta * 2;
		officer.group.position.z += (targetZ - officer.group.position.z) * delta * 2;

		officer.group.rotation.y = Math.atan2(
			shooter.position.x - officer.group.position.x,
			shooter.position.z - officer.group.position.z
		);

		var bodyChild = officer.group.children[0];
		if (bodyChild) {
			bodyChild.rotation.z = Math.sin(officer.time * 3) * 0.2;
		}
	}
}

function updatePoliceVehicle(delta) {
	if (!policeVehicle) return;

	policeVehicle.strobePhase += delta;
	var strobeIntensity = (Math.sin(policeVehicle.strobePhase * 10) > 0.5) ? 1 : 0;

	if (policeVehicle.strobePhase < 5) {
		policeVehicle.group.position.x -= delta * 20;
	}

	var emission = strobeIntensity > 0.5 ? 0xff0000 : 0x0000ff;
	policeVehicle.material.emissive.setHex(emission);
	policeVehicle.material.emissiveIntensity = strobeIntensity;
}

function updateTacticalVehicle(delta) {
	if (!tacticalVehicle) return;
	if (tacticalVehicle.position.x > 0) {
		tacticalVehicle.position.x -= delta * 25;
	}
}

function updateStreetLights(delta) {
	for (var i = 0; i < streetLights.length; i++) {
		var light = streetLights[i];
		var flicker = Math.sin(clock.getElapsedTime() * 3 + i) * 0.3 + 0.7;
		light.material.emissiveIntensity = flicker;
	}
}

function updateThreatStatus() {
	if (shooter && Math.abs(shooter.position.x) > 150) {
		threatNeutralized = true;
	}
}

function update(delta) {
	updateShooter(delta);
	updateCivilians(delta);
	updatePoliceOfficers(delta);
	updatePoliceVehicle(delta);
	updateTacticalVehicle(delta);
	updateStreetLights(delta);
	updateThreatStatus();
	updateHUD();

	if (renderer) renderer.render(scene, camera);
}

function reset() {
	for (var i = 0; i < sceneObjects.length; i++) {
		if (sceneObjects[i].geometry) {
			sceneObjects[i].geometry.dispose();
		}
		if (sceneObjects[i].material) {
			if (Array.isArray(sceneObjects[i].material)) {
				for (var j = 0; j < sceneObjects[i].material.length; j++) {
					sceneObjects[i].material[j].dispose();
				}
			} else {
				sceneObjects[i].material.dispose();
			}
		}
	}

	while (scene.children.length > 0) {
		scene.remove(scene.children[0]);
	}

	sceneObjects = [];
	civilians = [];
	policeOfficers = [];
	shooter = null;
	policeVehicle = null;
	tacticalVehicle = null;
	ambulance = null;
	busStop = null;
	streetLights = [];
	civiliansSafe = 0;
	threatNeutralized = false;

	if (renderer) {
		renderer.dispose();
	}

	if (canvas && canvas.parentNode) {
		canvas.parentNode.removeChild(canvas);
	}

	if (hudCanvas && hudCanvas.parentNode) {
		hudCanvas.parentNode.removeChild(hudCanvas);
	}
}

return { init: init, update: update, reset: reset };
}());
