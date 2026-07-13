var CargoTrain = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var delta = 0;
	var elapsedTime = 0;

	// Game state
	var carsCleaned = 0;
	var totalCars = 6;
	var bombDefused = false;
	var currentSpeed = 120;
	var isActive = false;

	// Keybind tracking for C+T
	var keysPressed = {};
	var lastCtimeout = null;

	// Objects tracking
	var gameObjects = [];
	var trainCars = [];
	var telegramPoles = [];
	var smokePuffs = [];
	var mercenaries = [];
	var locomotiveGroup = null;

	// Vibration tracking
	var vibrationTime = 0;

	var init = function(initScene, initCamera) {
		scene = initScene;
		camera = initCamera;
		isActive = true;
		carsCleaned = 0;
		bombDefused = false;
		currentSpeed = 120;
		elapsedTime = 0;

		createTrain();
		createEnvironment();
		createEnemies();
		setupKeybinds();
		updateHUD();
	};

	var createTrain = function() {
		// Locomotive (large box with smokestack)
		var locGeom = new THREE.BoxGeometry(3, 2.5, 5);
		var locMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
		var locomotive = new THREE.Mesh(locGeom, locMat);
		locomotive.position.z = -15;
		locomotive.castShadow = true;
		scene.add(locomotive);
		gameObjects.push(locomotive);
		locomotiveGroup = locomotive;

		// Smokestack (cylinder)
		var smokeGeom = new THREE.CylinderGeometry(0.4, 0.5, 3, 8);
		var smokeMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
		var stack = new THREE.Mesh(smokeGeom, smokeMat);
		stack.position.set(0, 2.5, -12);
		stack.castShadow = true;
		scene.add(stack);
		gameObjects.push(stack);

		// 6 cargo/flatcars behind locomotive
		for (var i = 0; i < totalCars; i++) {
			var carGeom = new THREE.BoxGeometry(2.5, 1.8, 4);
			var carMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
			var car = new THREE.Mesh(carGeom, carMat);
			car.position.z = -10 - (i * 5);
			car.castShadow = true;
			scene.add(car);
			gameObjects.push(car);
			trainCars.push({
				mesh: car,
				originalPos: new THREE.Vector3(car.position.x, car.position.y, car.position.z),
				index: i
			});

			// Cargo containers on flatcar (stacked boxes)
			var containerCount = i % 2 === 0 ? 4 : 3;
			for (var j = 0; j < containerCount; j++) {
				var contGeom = new THREE.BoxGeometry(1.2, 1.2, 1.5);
				var contMat = new THREE.MeshStandardMaterial({ color: 0xff6b35 + (i * 0x100000) });
				var container = new THREE.Mesh(contGeom, contMat);
				var offsetX = (j % 2) * 1.2;
				var offsetY = 1.2 + (Math.floor(j / 2) * 1.2);
				container.position.set(offsetX - 0.6, offsetY, car.position.z);
				container.castShadow = true;
				scene.add(container);
				gameObjects.push(container);
			}

			// Wheel bogies (cylinder pairs under each car)
			for (var w = 0; w < 2; w++) {
				var wheelGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.4, 16);
				var wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
				var wheel1 = new THREE.Mesh(wheelGeom, wheelMat);
				wheel1.rotation.z = Math.PI / 2;
				wheel1.position.set(-1.2, -1.2, car.position.z + (w === 0 ? -1 : 1));
				wheel1.castShadow = true;
				scene.add(wheel1);
				gameObjects.push(wheel1);

				var wheel2 = new THREE.Mesh(wheelGeom, wheelMat);
				wheel2.rotation.z = Math.PI / 2;
				wheel2.position.set(1.2, -1.2, car.position.z + (w === 0 ? -1 : 1));
				wheel2.castShadow = true;
				scene.add(wheel2);
				gameObjects.push(wheel2);
			}
		}

		// Locomotive wheels
		for (var lw = 0; lw < 3; lw++) {
			var locWheelGeom = new THREE.CylinderGeometry(0.4, 0.4, 0.5, 16);
			var locWheelMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a });
			var lwheel = new THREE.Mesh(locWheelGeom, locWheelMat);
			lwheel.rotation.z = Math.PI / 2;
			lwheel.position.set(0, -1.4, -15 + (lw - 1) * 2.5);
			lwheel.castShadow = true;
			scene.add(lwheel);
			gameObjects.push(lwheel);
		}
	};

	var createEnvironment = function() {
		// Overhead gantry frame (box frame structure)
		var gantryGeom = new THREE.BoxGeometry(12, 0.3, 0.5);
		var gantryMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
		var gantry = new THREE.Mesh(gantryGeom, gantryMat);
		gantry.position.set(0, 5, -20);
		gantry.castShadow = true;
		scene.add(gantry);
		gameObjects.push(gantry);

		var gantryVertL = new THREE.BoxGeometry(0.3, 5, 0.3);
		var vertL = new THREE.Mesh(gantryVertL, gantryMat);
		vertL.position.set(-6, 1.5, -20);
		vertL.castShadow = true;
		scene.add(vertL);
		gameObjects.push(vertL);

		var vertR = new THREE.Mesh(gantryVertL, gantryMat);
		vertR.position.set(6, 1.5, -20);
		vertR.castShadow = true;
		scene.add(vertR);
		gameObjects.push(vertR);

		// Telegraph poles scrolling past (motion illusion)
		for (var p = 0; p < 15; p++) {
			var poleGeom = new THREE.CylinderGeometry(0.15, 0.15, 6, 8);
			var poleMat = new THREE.MeshStandardMaterial({ color: 0x8b7355 });
			var pole = new THREE.Mesh(poleGeom, poleMat);
			pole.position.set(-8 + (p % 2) * 16, 2, -10 + (p * 8));
			pole.castShadow = true;
			scene.add(pole);
			gameObjects.push(pole);
			telegramPoles.push({
				mesh: pole,
				speed: 0.03
			});
		}

		// Motion blur atmosphere (fog)
		var fog = new THREE.Fog(0xcccccc, 50, 200);
		scene.fog = fog;
		scene.background = new THREE.Color(0xcccccc);
	};

	var createEnemies = function() {
		// Mercenaries (box figures on cargo cars)
		var positions = [
			{ car: 0, x: 0, z: -10 },
			{ car: 1, x: -0.8, z: -15 },
			{ car: 2, x: 0.8, z: -20 },
			{ car: 3, x: 0, z: -25 },
			{ car: 4, x: -0.6, z: -30 },
			{ car: 5, x: 0.6, z: -35 }
		];

		for (var i = 0; i < positions.length; i++) {
			var pos = positions[i];

			// Head
			var headGeom = new THREE.SphereGeometry(0.3, 8, 8);
			var headMat = new THREE.MeshStandardMaterial({ color: 0xc2955d });
			var head = new THREE.Mesh(headGeom, headMat);
			head.position.set(pos.x, 2.5, pos.z);
			head.castShadow = true;
			scene.add(head);
			gameObjects.push(head);

			// Body
			var bodyGeom = new THREE.BoxGeometry(0.5, 1.2, 0.4);
			var bodyMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50 });
			var body = new THREE.Mesh(bodyGeom, bodyMat);
			body.position.set(pos.x, 1.5, pos.z);
			body.castShadow = true;
			scene.add(body);
			gameObjects.push(body);

			mercenaries.push({
				head: head,
				body: body,
				carIndex: pos.car,
				bobOffset: i * 0.5
			});
		}
	};

	var setupKeybinds = function() {
		window.addEventListener('keydown', function(e) {
			if (!isActive) return;

			var key = e.key.toUpperCase();
			keysPressed[key] = true;

			if (key === 'C') {
				if (lastCtimeout) {
					clearTimeout(lastCtimeout);
				}
				lastCtimeout = setTimeout(function() {
					lastCtimeout = null;
					keysPressed = {};
				}, 400);
			}

			if (keysPressed['C'] && key === 'T' && lastCtimeout) {
				clearTimeout(lastCtimeout);
				lastCtimeout = null;
				keysPressed = {};
				isActive = !isActive;
				showHUDNotification(isActive ? 'CARGO TRAIN ENGAGED' : 'CARGO TRAIN DISENGAGED');
			}
		});

		window.addEventListener('keyup', function(e) {
			var key = e.key.toUpperCase();
			keysPressed[key] = false;
		});
	};

	var showHUDNotification = function(text) {
		var existing = document.getElementById('cargo-train-notif');
		if (existing) {
			existing.remove();
		}

		var notif = document.createElement('div');
		notif.id = 'cargo-train-notif';
		notif.style.cssText = 'position:fixed;top:20px;right:20px;background:#222;color:#0f0;padding:12px 20px;border:2px solid #0f0;font-family:monospace;font-size:14px;z-index:10001;text-shadow:0 0 10px #0f0;';
		notif.textContent = text;
		document.body.appendChild(notif);

		setTimeout(function() {
			if (notif.parentNode) {
				notif.remove();
			}
		}, 2000);
	};

	var updateHUD = function() {
		var existing = document.getElementById('cargo-train-hud');
		if (existing) {
			existing.remove();
		}

		var hud = document.createElement('div');
		hud.id = 'cargo-train-hud';
		hud.style.cssText = 'position:fixed;top:10px;left:10px;background:rgba(0,0,0,0.7);color:#0f0;padding:15px;border:2px solid #0f0;font-family:monospace;font-size:14px;z-index:10000;line-height:1.6;text-shadow:0 0 10px #0f0;';
		hud.innerHTML = 'CARGO TRAIN HIJACK<br>' +
			'CARS CLEARED: ' + carsCleaned + '/' + totalCars + '<br>' +
			'BOMB DEFUSED: ' + (bombDefused ? 'YES' : 'NO') + '<br>' +
			'SPEED: ' + currentSpeed + ' km/h';
		document.body.appendChild(hud);
	};

	var updateSmokeEffects = function(dt) {
		// Create smoke puffs from locomotive
		if (elapsedTime % 0.3 < dt + 0.001) {
			var smokeGeom = new THREE.SphereGeometry(0.3, 8, 8);
			var smokeMat = new THREE.MeshStandardMaterial({
				color: 0xaaaaaa,
				transparent: true,
				opacity: 0.6
			});
			var puff = new THREE.Mesh(smokeGeom, smokeMat);
			puff.position.set(0.2, 5.2, -13 + Math.random() * 2);
			scene.add(puff);
			gameObjects.push(puff);
			smokePuffs.push({
				mesh: puff,
				life: 0,
				maxLife: 2.0
			});
		}

		// Update smoke puffs
		for (var i = smokePuffs.length - 1; i >= 0; i--) {
			var puff = smokePuffs[i];
			puff.life += dt;

			puff.mesh.position.y += dt * 1.5;
			puff.mesh.position.z -= dt * 0.5;
			puff.mesh.material.opacity = 0.6 * (1 - (puff.life / puff.maxLife));

			if (puff.life >= puff.maxLife) {
				scene.remove(puff.mesh);
				var idx = gameObjects.indexOf(puff.mesh);
				if (idx > -1) {
					gameObjects.splice(idx, 1);
				}
				smokePuffs.splice(i, 1);
			}
		}
	};

	var updateTrainPlatformVibration = function(dt) {
		vibrationTime += dt;
		var vibration = Math.sin(vibrationTime * 8) * 0.02;

		for (var i = 0; i < trainCars.length; i++) {
			var car = trainCars[i];
			car.mesh.position.y = car.originalPos.y + vibration;
		}

		if (locomotiveGroup) {
			locomotiveGroup.position.y = vibration;
		}
	};

	var updateTelegraphPoles = function(dt) {
		// Scroll poles in opposite direction for motion illusion
		for (var i = 0; i < telegramPoles.length; i++) {
			var pole = telegramPoles[i];
			pole.mesh.position.z -= pole.speed * currentSpeed * dt;

			// Wrap around when out of view
			if (pole.mesh.position.z < -50) {
				pole.mesh.position.z = 50;
			}
		}
	};

	var updateEnemies = function(dt) {
		// Bob up and down, simulate patrol
		for (var i = 0; i < mercenaries.length; i++) {
			var enemy = mercenaries[i];
			var bobAmount = Math.sin(elapsedTime * 2 + enemy.bobOffset) * 0.1;
			var baseY = 2.5;
			enemy.head.position.y = baseY + 0.3 + bobAmount;
			enemy.body.position.y = 1.5 + bobAmount;
		}
	};

	var update = function(dt) {
		if (!isActive || !scene) return;

		delta = dt;
		elapsedTime += dt;
		currentSpeed = 120 + Math.sin(elapsedTime * 0.5) * 5;

		updateTrainPlatformVibration(dt);
		updateTelegraphPoles(dt);
		updateSmokeEffects(dt);
		updateEnemies(dt);

		// Simulate game progression with keyboard
		if (keysPressed['E']) {
			if (carsCleaned < totalCars) {
				carsCleaned++;
				updateHUD();
				showHUDNotification('CAR ' + carsCleaned + ' CLEARED');
			}
		}

		if (keysPressed['D']) {
			if (!bombDefused) {
				bombDefused = true;
				updateHUD();
				showHUDNotification('BOMB DEFUSED - LOCOMOTIVE SECURE');
			}
		}

		if (keysPressed['R']) {
			reset();
		}
	};

	var reset = function() {
		// Remove all game objects from scene
		for (var i = gameObjects.length - 1; i >= 0; i--) {
			scene.remove(gameObjects[i]);
		}
		gameObjects = [];
		trainCars = [];
		telegramPoles = [];
		smokePuffs = [];
		mercenaries = [];
		locomotiveGroup = null;

		// Reset state
		carsCleaned = 0;
		bombDefused = false;
		currentSpeed = 120;
		elapsedTime = 0;
		vibrationTime = 0;

		// Remove HUD
		var hud = document.getElementById('cargo-train-hud');
		if (hud) {
			hud.remove();
		}

		isActive = false;
	};

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
