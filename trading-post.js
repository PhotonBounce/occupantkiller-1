window.TradingPost = (function() {
	'use strict';

	var scene, camera;
	var gameState = { factionACount: 4, factionBCount: 4, peaceHolding: true };
	var objects = {};
	var hudElement = null;
	var hudVisible = true;
	var keyStates = {};
	var lastHKeyTime = 0;
	var lastTKeyTime = 0;

	// Color palette for post-apocalyptic theme
	var COLORS = {
		ground: 0x8b6040,
		metal: 0x6b5b47,
		red: 0xcc2222,
		blue: 0x2244cc,
		white: 0xffffe8,
		black: 0x1a1a1a,
		rust: 0xaa6633,
		green: 0x2d5016
	};

	// Create main wasteland ground
	function createGround() {
		var geom = new THREE.BoxGeometry(400, 0.3, 400);
		var mat = new THREE.MeshLambertMaterial({ color: COLORS.ground });
		var ground = new THREE.Mesh(geom, mat);
		ground.receiveShadow = true;
		ground.castShadow = true;
		scene.add(ground);
		objects.ground = ground;
	}

	// Create main trading hall
	function createTradingHall() {
		var geom = new THREE.BoxGeometry(30, 8, 20);
		var mat = new THREE.MeshLambertMaterial({ color: COLORS.metal });
		var hall = new THREE.Mesh(geom, mat);
		hall.position.set(0, 4, 0);
		hall.receiveShadow = true;
		hall.castShadow = true;
		scene.add(hall);
		objects.tradingHall = hall;

		// Add corrugated metal roof effect with thin boxes
		for (var i = 0; i < 5; i++) {
			var roofGeom = new THREE.BoxGeometry(30, 0.3, 4);
			var roofMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
			var roofPiece = new THREE.Mesh(roofGeom, roofMat);
			roofPiece.position.set(0, 8.2, -8 + i * 4);
			roofPiece.castShadow = true;
			scene.add(roofPiece);
		}
	}

	// Create fortified walls around perimeter
	function createFortifiedWalls() {
		var wallPositions = [
			{ x: 200, z: 0, width: 400, height: 5 },
			{ x: -200, z: 0, width: 400, height: 5 },
			{ x: 0, z: 200, width: 400, height: 4 },
			{ x: 0, z: -200, width: 400, height: 6 }
		];

		wallPositions.forEach(function(pos, idx) {
			var geom = new THREE.BoxGeometry(pos.width, pos.height, 1);
			var mat = new THREE.MeshLambertMaterial({ color: COLORS.metal });
			var wall = new THREE.Mesh(geom, mat);
			wall.position.set(pos.x, pos.height / 2, pos.z);
			wall.castShadow = true;
			wall.receiveShadow = true;
			scene.add(wall);
			objects['wall' + idx] = wall;
		});
	}

	// Create market stall canopies
	function createCanopies() {
		var canopyPositions = [
			{ x: -60, z: 30 },
			{ x: -60, z: -30 },
			{ x: 60, z: 0 }
		];

		canopyPositions.forEach(function(pos, idx) {
			// Canopy frame
			var frameGeom = new THREE.BoxGeometry(25, 0.5, 0.5);
			var frameMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
			var frame = new THREE.Mesh(frameGeom, frameMat);
			frame.position.set(pos.x, 4, pos.z);
			scene.add(frame);

			// Canopy fabric (thin box)
			var fabricGeom = new THREE.BoxGeometry(25, 0.1, 15);
			var fabricMat = new THREE.MeshLambertMaterial({ color: 0xccaa77 });
			var fabric = new THREE.Mesh(fabricGeom, fabricMat);
			fabric.position.set(pos.x, 4, pos.z);
			fabric.castShadow = true;
			scene.add(fabric);
			objects['canopy' + idx] = fabric;

			// Support posts
			for (var i = 0; i < 2; i++) {
				var postGeom = new THREE.BoxGeometry(1, 4, 1);
				var postMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
				var post = new THREE.Mesh(postGeom, postMat);
				post.position.set(pos.x + (i === 0 ? -12 : 12), 2, pos.z);
				post.castShadow = true;
				scene.add(post);
			}
		});
	}

	// Create 6 market vendor stations
	function createVendorStalls() {
		var vendorPositions = [
			{ x: -70, z: 40 },
			{ x: -70, z: 20 },
			{ x: -70, z: 0 },
			{ x: 70, z: 40 },
			{ x: 70, z: 20 },
			{ x: 70, z: 0 }
		];

		vendorPositions.forEach(function(pos, idx) {
			// Table box
			var tableGeom = new THREE.BoxGeometry(8, 0.5, 6);
			var tableMat = new THREE.MeshLambertMaterial({ color: 0x664433 });
			var table = new THREE.Mesh(tableGeom, tableMat);
			table.position.set(pos.x, 1, pos.z);
			scene.add(table);
			objects['table' + idx] = table;

			// Goods stacked on table
			for (var i = 0; i < 3; i++) {
				var goodGeom = new THREE.BoxGeometry(2, 1, 2);
				var goodMat = new THREE.MeshLambertMaterial({ color: [0xcc6633, 0x446633, 0x336688][i] });
				var good = new THREE.Mesh(goodGeom, goodMat);
				good.position.set(pos.x + (i - 1) * 3, 1.8, pos.z);
				scene.add(good);
			}

			// Vendor figure (box)
			var vendorGeom = new THREE.BoxGeometry(2, 3, 1.5);
			var vendorMat = new THREE.MeshLambertMaterial({ color: 0xaa9966 });
			var vendor = new THREE.Mesh(vendorGeom, vendorMat);
			vendor.position.set(pos.x + 6, 1.5, pos.z);
			vendor.castShadow = true;
			scene.add(vendor);
			objects['vendor' + idx] = vendor;
		});
	}

	// Create faction A fighters (red)
	function createFactionA() {
		var positions = [
			{ x: -120, z: -80 },
			{ x: -100, z: -80 },
			{ x: -120, z: -60 },
			{ x: -100, z: -60 }
		];

		positions.forEach(function(pos, idx) {
			// Body
			var bodyGeom = new THREE.BoxGeometry(2, 3, 1.5);
			var bodyMat = new THREE.MeshLambertMaterial({ color: 0x884433 });
			var body = new THREE.Mesh(bodyGeom, bodyMat);
			body.position.set(pos.x, 1.5, pos.z);
			body.castShadow = true;
			scene.add(body);

			// Red armband
			var armbandGeom = new THREE.BoxGeometry(2.5, 0.4, 1.8);
			var armbandMat = new THREE.MeshLambertMaterial({ color: COLORS.red });
			var armband = new THREE.Mesh(armbandGeom, armbandMat);
			armband.position.set(pos.x, 2.2, pos.z);
			scene.add(armband);

			objects['factionA' + idx] = body;
		});
	}

	// Create faction B fighters (blue)
	function createFactionB() {
		var positions = [
			{ x: 120, z: -80 },
			{ x: 100, z: -80 },
			{ x: 120, z: -60 },
			{ x: 100, z: -60 }
		];

		positions.forEach(function(pos, idx) {
			// Body
			var bodyGeom = new THREE.BoxGeometry(2, 3, 1.5);
			var bodyMat = new THREE.MeshLambertMaterial({ color: 0x444488 });
			var body = new THREE.Mesh(bodyGeom, bodyMat);
			body.position.set(pos.x, 1.5, pos.z);
			body.castShadow = true;
			scene.add(body);

			// Blue armband
			var armbandGeom = new THREE.BoxGeometry(2.5, 0.4, 1.8);
			var armbandMat = new THREE.MeshLambertMaterial({ color: COLORS.blue });
			var armband = new THREE.Mesh(armbandGeom, armbandMat);
			armband.position.set(pos.x, 2.2, pos.z);
			scene.add(armband);

			objects['factionB' + idx] = body;
		});
	}

	// Create bounty hunters (neutral duster coats)
	function createBountyHunters() {
		var positions = [
			{ x: -40, z: 100 },
			{ x: 40, z: 100 }
		];

		positions.forEach(function(pos, idx) {
			// Body with duster coat
			var bodyGeom = new THREE.BoxGeometry(2, 3.5, 1.5);
			var bodyMat = new THREE.MeshLambertMaterial({ color: 0x6b5b47 });
			var body = new THREE.Mesh(bodyGeom, bodyMat);
			body.position.set(pos.x, 1.75, pos.z);
			body.castShadow = true;
			scene.add(body);

			// Hat
			var hatGeom = new THREE.BoxGeometry(2.5, 0.8, 2);
			var hatMat = new THREE.MeshLambertMaterial({ color: 0x4a4a3a });
			var hat = new THREE.Mesh(hatGeom, hatMat);
			hat.position.set(pos.x, 3.3, pos.z);
			scene.add(hat);

			objects['bountyHunter' + idx] = body;
		});
	}

	// Create arms deal table
	function createArmsDealTable() {
		// Main table
		var tableGeom = new THREE.BoxGeometry(15, 1, 8);
		var tableMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
		var table = new THREE.Mesh(tableGeom, tableMat);
		table.position.set(0, 1, -50);
		scene.add(table);
		objects.armsTable = table;

		// Weapon crates
		var cratePositions = [
			{ x: -5, z: -50 },
			{ x: 0, z: -50 },
			{ x: 5, z: -50 }
		];

		cratePositions.forEach(function(pos, idx) {
			var crateGeom = new THREE.BoxGeometry(3, 2, 3);
			var crateMat = new THREE.MeshLambertMaterial({ color: 0x6b5933 });
			var crate = new THREE.Mesh(crateGeom, crateMat);
			crate.position.set(pos.x, 2.5, pos.z);
			crate.castShadow = true;
			scene.add(crate);

			// Yellow stripes on crates
			var stripeGeom = new THREE.BoxGeometry(3.1, 0.3, 3.1);
			var stripeMat = new THREE.MeshLambertMaterial({ color: 0xffdd00 });
			var stripe = new THREE.Mesh(stripeGeom, stripeMat);
			stripe.position.set(pos.x, 3.1, pos.z);
			scene.add(stripe);
		});
	}

	// Create drinking bar
	function createBar() {
		// Long counter
		var counterGeom = new THREE.BoxGeometry(20, 1.5, 3);
		var counterMat = new THREE.MeshLambertMaterial({ color: 0x5a3a2a });
		var counter = new THREE.Mesh(counterGeom, counterMat);
		counter.position.set(0, 1, 60);
		scene.add(counter);
		objects.bar = counter;

		// Barrel boxes behind counter
		for (var i = 0; i < 3; i++) {
			var barrelGeom = new THREE.BoxGeometry(1.5, 2, 1.5);
			var barrelMat = new THREE.MeshLambertMaterial({ color: 0x8b6633 });
			var barrel = new THREE.Mesh(barrelGeom, barrelMat);
			barrel.position.set(-8 + i * 8, 1.5, 62);
			scene.add(barrel);
		}

		// Patron figures
		var patronPositions = [
			{ x: -6, z: 55 },
			{ x: 0, z: 55 },
			{ x: 6, z: 55 }
		];

		patronPositions.forEach(function(pos, idx) {
			var patronGeom = new THREE.BoxGeometry(2, 2.5, 1);
			var patronMat = new THREE.MeshLambertMaterial({ color: [0xaa8844, 0x886633, 0x775544][idx] });
			var patron = new THREE.Mesh(patronGeom, patronMat);
			patron.position.set(pos.x, 1.25, pos.z);
			patron.castShadow = true;
			scene.add(patron);
			objects['patron' + idx] = patron;
		});
	}

	// Create burned vehicle hulk
	function createBurnedVehicle() {
		// Vehicle frame
		var frameGeom = new THREE.BoxGeometry(8, 3, 4);
		var frameMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
		var frame = new THREE.Mesh(frameGeom, frameMat);
		frame.position.set(-150, 1.5, 80);
		frame.castShadow = true;
		scene.add(frame);
		objects.buriedVehicle = frame;

		// Rusted door
		var doorGeom = new THREE.BoxGeometry(3, 3, 0.3);
		var doorMat = new THREE.MeshLambertMaterial({ color: COLORS.rust });
		var door = new THREE.Mesh(doorGeom, doorMat);
		door.position.set(-153, 1.5, 80.5);
		scene.add(door);
	}

	// Create water tower
	function createWaterTower() {
		// Tank (large box)
		var tankGeom = new THREE.BoxGeometry(10, 12, 10);
		var tankMat = new THREE.MeshLambertMaterial({ color: 0x6b5b4a });
		var tank = new THREE.Mesh(tankGeom, tankMat);
		tank.position.set(150, 8, 80);
		tank.castShadow = true;
		scene.add(tank);
		objects.waterTank = tank;

		// Stilts (legs)
		var stiltPositions = [
			{ x: 145, z: 75 },
			{ x: 155, z: 75 },
			{ x: 145, z: 85 },
			{ x: 155, z: 85 }
		];

		stiltPositions.forEach(function(pos) {
			var stiltGeom = new THREE.BoxGeometry(1, 8, 1);
			var stiltMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
			var stilt = new THREE.Mesh(stiltGeom, stiltMat);
			stilt.position.set(pos.x, 4, pos.z);
			stilt.castShadow = true;
			scene.add(stilt);
		});
	}

	// Create notice board
	function createNoticeBoard() {
		// Main board
		var boardGeom = new THREE.BoxGeometry(6, 8, 0.5);
		var boardMat = new THREE.MeshLambertMaterial({ color: 0x6b5944 });
		var board = new THREE.Mesh(boardGeom, boardMat);
		board.position.set(-150, 4, -100);
		scene.add(board);
		objects.noticeBoard = board;

		// Wanted posters
		for (var i = 0; i < 4; i++) {
			var posterGeom = new THREE.BoxGeometry(2, 3, 0.1);
			var posterMat = new THREE.MeshLambertMaterial({ color: 0xffffe8 });
			var poster = new THREE.Mesh(posterGeom, posterMat);
			var xOffset = -4 + (i % 2) * 4;
			var yOffset = 5 - Math.floor(i / 2) * 3.5;
			poster.position.set(-150 + xOffset, yOffset, -99.5);
			scene.add(poster);
		}
	}

	// Create radio shack
	function createRadioShack() {
		// Shack building
		var shackGeom = new THREE.BoxGeometry(6, 5, 6);
		var shackMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
		var shack = new THREE.Mesh(shackGeom, shackMat);
		shack.position.set(150, 2.5, -150);
		shack.castShadow = true;
		scene.add(shack);
		objects.radioShack = shack;

		// Antenna
		var antennaGeom = new THREE.BoxGeometry(0.3, 12, 0.3);
		var antennaMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
		var antenna = new THREE.Mesh(antennaGeom, antennaMat);
		antenna.position.set(150, 10, -150);
		antenna.castShadow = true;
		scene.add(antenna);
		objects.antenna = antenna;

		// Emissive dial screen
		var screenGeom = new THREE.BoxGeometry(3, 2, 0.2);
		var screenMat = new THREE.MeshLambertMaterial({
			color: 0x00ff00,
			emissive: 0x00aa00
		});
		var screen = new THREE.Mesh(screenGeom, screenMat);
		screen.position.set(150, 3.5, -147);
		scene.add(screen);
		objects.radioScreen = screen;
	}

	// Create medical tent
	function createMedicalTent() {
		// White tent structure
		var tentGeom = new THREE.BoxGeometry(8, 5, 10);
		var tentMat = new THREE.MeshLambertMaterial({ color: COLORS.white });
		var tent = new THREE.Mesh(tentGeom, tentMat);
		tent.position.set(-150, 2.5, 0);
		tent.castShadow = true;
		scene.add(tent);
		objects.medicalTent = tent;

		// Red cross on tent
		var crossHGeom = new THREE.BoxGeometry(3, 2, 0.2);
		var crossMat = new THREE.MeshLambertMaterial({ color: COLORS.red });
		var crossH = new THREE.Mesh(crossHGeom, crossMat);
		crossH.position.set(-150, 4, -4.9);
		scene.add(crossH);

		var crossVGeom = new THREE.BoxGeometry(2, 3, 0.2);
		var crossV = new THREE.Mesh(crossVGeom, crossMat);
		crossV.position.set(-150, 4, -4.9);
		scene.add(crossV);

		// Medical supplies boxes scattered
		for (var i = 0; i < 4; i++) {
			var supplyGeom = new THREE.BoxGeometry(2, 1.5, 2);
			var supplyMat = new THREE.MeshLambertMaterial({ color: [0xff9999, 0x99ff99, 0x9999ff, 0xffff99][i] });
			var supply = new THREE.Mesh(supplyGeom, supplyMat);
			supply.position.set(-154 + i * 3, 0.8, 3);
			scene.add(supply);
		}
	}

	// Create motorcycle gang
	function createMotorcycleGang() {
		var positions = [
			{ x: -80, z: -150 },
			{ x: -60, z: -150 },
			{ x: -40, z: -150 }
		];

		positions.forEach(function(pos, idx) {
			// Bike frame (low box)
			var bikeGeom = new THREE.BoxGeometry(3, 1.5, 6);
			var bikeMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
			var bike = new THREE.Mesh(bikeGeom, bikeMat);
			bike.position.set(pos.x, 0.75, pos.z);
			scene.add(bike);
			objects['bike' + idx] = bike;

			// Rider figure
			var riderGeom = new THREE.BoxGeometry(2, 2.5, 1.5);
			var riderMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
			var rider = new THREE.Mesh(riderGeom, riderMat);
			rider.position.set(pos.x, 2, pos.z);
			rider.castShadow = true;
			scene.add(rider);
			objects['rider' + idx] = rider;

			// Helmet
			var helmetGeom = new THREE.BoxGeometry(2.2, 1, 1.8);
			var helmetMat = new THREE.MeshLambertMaterial({ color: 0x662222 });
			var helmet = new THREE.Mesh(helmetGeom, helmetMat);
			helmet.position.set(pos.x, 3.1, pos.z);
			scene.add(helmet);
		});
	}

	// Initialize HUD
	function initHUD() {
		hudElement = document.createElement('div');
		hudElement.id = 'trading-post-hud';
		hudElement.style.position = 'fixed';
		hudElement.style.top = '20px';
		hudElement.style.left = '20px';
		hudElement.style.color = '#00ff00';
		hudElement.style.fontFamily = 'monospace';
		hudElement.style.fontSize = '14px';
		hudElement.style.zIndex = '1000';
		hudElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
		hudElement.style.padding = '10px';
		hudElement.style.border = '1px solid #00ff00';
		updateHUD();
		document.body.appendChild(hudElement);
	}

	// Update HUD text
	function updateHUD() {
		if (hudElement) {
			var peaceText = gameState.peaceHolding ? 'YES' : 'NO';
			var color = gameState.peaceHolding ? '#00ff00' : '#ff0000';
			hudElement.innerHTML = 'FACTION A: ' + gameState.factionACount + '<br/>' +
				'FACTION B: ' + gameState.factionBCount + '<br/>' +
				'<span style="color: ' + color + '">PEACE HOLDING: ' + peaceText + '</span>';
		}
	}

	// Setup keyboard input
	function setupKeyboard() {
		document.addEventListener('keydown', function(e) {
			keyStates[e.key.toLowerCase()] = true;

			if (e.key.toLowerCase() === 'h') {
				if (Date.now() - lastHKeyTime < 400) {
					// H pressed again within 400ms
					if (keyStates['t']) {
						// T is also pressed
						hudVisible = !hudVisible;
						if (hudElement) {
							hudElement.style.display = hudVisible ? 'block' : 'none';
						}
					}
				}
				lastHKeyTime = Date.now();
			}

			if (e.key.toLowerCase() === 't') {
				if (Date.now() - lastTKeyTime < 400) {
					if (keyStates['h']) {
						hudVisible = !hudVisible;
						if (hudElement) {
							hudElement.style.display = hudVisible ? 'block' : 'none';
						}
					}
				}
				lastTKeyTime = Date.now();
			}
		});

		document.addEventListener('keyup', function(e) {
			keyStates[e.key.toLowerCase()] = false;
		});
	}

	// Animation parameters
	var animState = {
		vendorBobTime: 0,
		factionLookTime: 0,
		bountyPatrolTime: 0,
		bikeCircleTime: 0,
		antennaRotation: 0,
		tensionLevel: 0
	};

	// Update animations
	function updateAnimations(delta) {
		animState.vendorBobTime += delta;
		animState.factionLookTime += delta;
		animState.bountyPatrolTime += delta;
		animState.bikeCircleTime += delta;
		animState.antennaRotation += delta * 1.5;

		// Vendor swaying
		for (var i = 0; i < 6; i++) {
			if (objects['vendor' + i]) {
				objects['vendor' + i].rotation.z = Math.sin(animState.vendorBobTime + i) * 0.1;
				objects['vendor' + i].position.y = 1.5 + Math.sin(animState.vendorBobTime * 0.8 + i * 0.5) * 0.3;
			}
		}

		// Faction fighters eyeing each other (slow sway toward center)
		for (var i = 0; i < 4; i++) {
			if (objects['factionA' + i]) {
				var swayAmount = Math.sin(animState.factionLookTime * 0.5 + i) * 0.5;
				objects['factionA' + i].position.x -= swayAmount * delta;
			}
			if (objects['factionB' + i]) {
				var swayAmount = Math.sin(animState.factionLookTime * 0.5 + i) * 0.5;
				objects['factionB' + i].position.x += swayAmount * delta;
			}
		}

		// Bounty hunters patrolling neutral zone
		for (var i = 0; i < 2; i++) {
			if (objects['bountyHunter' + i]) {
				var patrolOffset = Math.sin(animState.bountyPatrolTime * 0.6) * 15;
				objects['bountyHunter' + i].position.z = 100 + patrolOffset;
			}
		}

		// Motorcycle gang circling perimeter
		for (var i = 0; i < 3; i++) {
			if (objects['bike' + i]) {
				var angle = animState.bikeCircleTime * 0.3 + (i * Math.PI * 2 / 3);
				var radius = 180;
				objects['bike' + i].position.x = Math.cos(angle) * radius;
				objects['bike' + i].position.z = Math.sin(angle) * radius;
				objects['bike' + i].rotation.y = angle + Math.PI / 2;
			}
			if (objects['rider' + i]) {
				var angle = animState.bikeCircleTime * 0.3 + (i * Math.PI * 2 / 3);
				var radius = 180;
				objects['rider' + i].position.x = Math.cos(angle) * radius;
				objects['rider' + i].position.z = Math.sin(angle) * radius;
				objects['rider' + i].rotation.y = angle + Math.PI / 2;
			}
		}

		// Antenna rotating
		if (objects.antenna) {
			objects.antenna.rotation.z = animState.antennaRotation * 0.5;
		}

		// Tension building - radio screen pulsing
		animState.tensionLevel = (Math.sin(animState.factionLookTime * 0.3) * 0.5 + 0.5);
		if (objects.radioScreen) {
			objects.radioScreen.material.emissive.setHSL(0.33, 1, 0.2 + animState.tensionLevel * 0.3);
		}

		// Canopy fluttering
		for (var i = 0; i < 3; i++) {
			if (objects['canopy' + i]) {
				objects['canopy' + i].rotation.z = Math.sin(animState.vendorBobTime * 1.2 + i) * 0.05;
			}
		}
	}

	// Public API
	var init = function(_scene, _camera) {
		scene = _scene;
		camera = _camera;

		// Add lighting
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		scene.add(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(100, 150, 100);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		directionalLight.shadow.camera.left = -300;
		directionalLight.shadow.camera.right = 300;
		directionalLight.shadow.camera.top = 300;
		directionalLight.shadow.camera.bottom = -300;
		scene.add(directionalLight);

		// Create all scene elements
		createGround();
		createTradingHall();
		createFortifiedWalls();
		createCanopies();
		createVendorStalls();
		createFactionA();
		createFactionB();
		createBountyHunters();
		createArmsDealTable();
		createBar();
		createBurnedVehicle();
		createWaterTower();
		createNoticeBoard();
		createRadioShack();
		createMedicalTent();
		createMotorcycleGang();

		// Setup HUD and keyboard
		initHUD();
		setupKeyboard();
	};

	var update = function(delta) {
		updateAnimations(delta);
		updateHUD();
	};

	var reset = function() {
		gameState.factionACount = 4;
		gameState.factionBCount = 4;
		gameState.peaceHolding = true;
		animState = {
			vendorBobTime: 0,
			factionLookTime: 0,
			bountyPatrolTime: 0,
			bikeCircleTime: 0,
			antennaRotation: 0,
			tensionLevel: 0
		};
		updateHUD();
	};

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
