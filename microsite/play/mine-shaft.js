window.MineShaft = (function() {
	'use strict';

	// Scene management
	var scene = null;
	var camera = null;
	var allObjects = [];

	// Game state
	var depth = -120;
	var chargesPlaced = 0;
	var extractionHalted = false;

	// Animation state
	var minecartPosition = 0;
	var minecartDirection = 1;
	var ventilationAngle = 0;
	var crusherAngle = 0;
	var waterPumpHeight = 0;
	var waterPumpDirection = 1;
	var lampFlickerTime = 0;

	// Input tracking for M+S keybind
	var lastKeyTime = 0;
	var mPressed = false;
	var showHud = true;

	// References to animated objects
	var minecart = null;
	var ventilationFan = null;
	var crusherDrum = null;
	var waterPump = null;
	var headlamps = [];

	// ==================== INITIALIZATION ====================

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;

		// Configure scene atmosphere
		scene.background = new THREE.Color(0x0a0a0a);
		scene.fog = new THREE.Fog(0x1a1a1a, 50, 200);

		// Create mine environment
		createMineShaft();
		createMineCart();
		createOreCrusher();
		createSupportBeams();
		createOreDeposits();
		createVentilationFan();
		createOreHopper();
		createBlastDoor();
		createDynamiteMarkers();
		createWaterPump();
		createHeadlampPosts();
		createEmergencyLadder();
		createDebrisPile();
		createUndergroundLake();
		createTrackRails();
		createEnemies();

		// Add lighting
		addLighting();

		// Setup input
		setupInput();
	}

	// ==================== MINE STRUCTURE ====================

	function createMineShaft() {
		// Vertical elevator shaft frame (tall box frame)
		var shaftGeometry = new THREE.BoxGeometry(4, 150, 4);
		var shaftMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });
		var shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
		shaft.position.set(0, -75, 0);
		shaft.castShadow = true;
		shaft.receiveShadow = true;
		scene.add(shaft);
		allObjects.push(shaft);

		// Shaft frame outline with cylinders
		var frameRadius = 2.5;
		var frameMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });

		for (var i = 0; i < 4; i++) {
			var angle = (i * Math.PI / 2);
			var x = Math.cos(angle) * frameRadius;
			var z = Math.sin(angle) * frameRadius;

			var frameGeometry = new THREE.CylinderGeometry(0.15, 0.15, 150, 8);
			var frame = new THREE.Mesh(frameGeometry, frameMaterial);
			frame.position.set(x, -75, z);
			frame.castShadow = true;
			frame.receiveShadow = true;
			scene.add(frame);
			allObjects.push(frame);
		}
	}

	function createSupportBeams() {
		// Support timber beams every 6 units
		var beamMaterial = new THREE.MeshStandardMaterial({ color: 0x5c4a2e });

		for (var y = -10; y > -150; y -= 6) {
			// Horizontal crossbeams
			var beamGeometry = new THREE.BoxGeometry(6, 0.3, 0.3);
			var beam1 = new THREE.Mesh(beamGeometry, beamMaterial);
			beam1.position.set(0, y, 0);
			beam1.castShadow = true;
			beam1.receiveShadow = true;
			scene.add(beam1);
			allObjects.push(beam1);

			var beam2 = new THREE.Mesh(beamGeometry, beamMaterial);
			beam2.rotation.z = Math.PI / 2;
			beam2.position.set(0, y, 0);
			beam2.castShadow = true;
			beam2.receiveShadow = true;
			scene.add(beam2);
			allObjects.push(beam2);
		}
	}

	function createOreDeposits() {
		// Ore deposit walls with colored mineral veins
		var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3a2a });

		// Left wall
		var wallGeometry = new THREE.BoxGeometry(0.2, 150, 8);
		var leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
		leftWall.position.set(-8, -75, 0);
		leftWall.castShadow = true;
		leftWall.receiveShadow = true;
		scene.add(leftWall);
		allObjects.push(leftWall);

		// Right wall
		var rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
		rightWall.position.set(8, -75, 0);
		rightWall.castShadow = true;
		rightWall.receiveShadow = true;
		scene.add(rightWall);
		allObjects.push(rightWall);

		// Mineral vein panels (colored boxes on walls)
		var veinColors = [0xff9900, 0xffaa00, 0xff8800];
		var veinMaterial0 = new THREE.MeshStandardMaterial({ color: veinColors[0], metalness: 0.3 });
		var veinMaterial1 = new THREE.MeshStandardMaterial({ color: veinColors[1], metalness: 0.3 });
		var veinMaterial2 = new THREE.MeshStandardMaterial({ color: veinColors[2], metalness: 0.3 });
		var veinMaterials = [veinMaterial0, veinMaterial1, veinMaterial2];

		for (var i = 0; i < 12; i++) {
			var veinGeometry = new THREE.BoxGeometry(0.3, 8, 2);
			var vein = new THREE.Mesh(veinGeometry, veinMaterials[i % 3]);
			vein.position.set(
				Math.random() > 0.5 ? -7 : 7,
				-20 - (i * 10),
				(Math.random() - 0.5) * 6
			);
			vein.castShadow = true;
			vein.receiveShadow = true;
			scene.add(vein);
			allObjects.push(vein);
		}
	}

	// ==================== EQUIPMENT ====================

	function createMineCart() {
		var cartGroup = new THREE.Group();

		// Cart body
		var cartGeometry = new THREE.BoxGeometry(2, 1.5, 3);
		var cartMaterial = new THREE.MeshStandardMaterial({ color: 0xaa3333 });
		var cartBody = new THREE.Mesh(cartGeometry, cartMaterial);
		cartBody.position.y = 0.75;
		cartBody.castShadow = true;
		cartBody.receiveShadow = true;
		cartGroup.add(cartBody);

		// Wheels (cylinders)
		var wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 16);
		var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });

		var wheelPositions = [
			[-0.8, 0.5, -1],
			[0.8, 0.5, -1],
			[-0.8, 0.5, 1],
			[0.8, 0.5, 1]
		];

		for (var i = 0; i < wheelPositions.length; i++) {
			var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
			wheel.rotation.z = Math.PI / 2;
			wheel.position.set(wheelPositions[i][0], wheelPositions[i][1], wheelPositions[i][2]);
			wheel.castShadow = true;
			wheel.receiveShadow = true;
			cartGroup.add(wheel);
		}

		// Position cart at start
		cartGroup.position.set(-6, 1, -40);
		scene.add(cartGroup);
		allObjects.push(cartGroup);
		minecart = cartGroup;
	}

	function createOreCrusher() {
		var crusherGroup = new THREE.Group();

		// Main frame (large box)
		var frameGeometry = new THREE.BoxGeometry(5, 4, 5);
		var frameMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });
		var frame = new THREE.Mesh(frameGeometry, frameMaterial);
		frame.position.y = 2;
		frame.castShadow = true;
		frame.receiveShadow = true;
		crusherGroup.add(frame);

		// Rotating drum (cylinder)
		var drumGeometry = new THREE.CylinderGeometry(1.5, 1.5, 4, 16);
		var drumMaterial = new THREE.MeshStandardMaterial({ color: 0x5a5a5a });
		var drum = new THREE.Mesh(drumGeometry, drumMaterial);
		drum.rotation.z = Math.PI / 2;
		drum.position.set(0, 2, 0);
		drum.castShadow = true;
		drum.receiveShadow = true;
		crusherGroup.add(drum);
		crusherDrum = drum;

		crusherGroup.position.set(6, -40, 0);
		scene.add(crusherGroup);
		allObjects.push(crusherGroup);
	}

	function createVentilationFan() {
		var fanGroup = new THREE.Group();

		// Fan frame (box)
		var frameGeometry = new THREE.BoxGeometry(3, 3, 0.5);
		var frameMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
		var frame = new THREE.Mesh(frameGeometry, frameMaterial);
		frame.castShadow = true;
		frame.receiveShadow = true;
		fanGroup.add(frame);

		// Fan blades (cylinder spinning)
		var bladeGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 32);
		var bladeMaterial = new THREE.MeshStandardMaterial({ color: 0x6a6a6a });
		var blades = new THREE.Mesh(bladeGeometry, bladeMaterial);
		blades.position.z = 0.3;
		blades.castShadow = true;
		blades.receiveShadow = true;
		fanGroup.add(blades);
		ventilationFan = blades;

		fanGroup.position.set(-6, -80, 12);
		scene.add(fanGroup);
		allObjects.push(fanGroup);
	}

	function createOreHopper() {
		// Inverted cone for ore hopper
		var hopperGeometry = new THREE.ConeGeometry(2, 3, 16);
		var hopperMaterial = new THREE.MeshStandardMaterial({ color: 0x5a5a5a });
		var hopper = new THREE.Mesh(hopperGeometry, hopperMaterial);
		hopper.scale.y = -1; // Invert
		hopper.position.set(6, -60, -8);
		hopper.castShadow = true;
		hopper.receiveShadow = true;
		scene.add(hopper);
		allObjects.push(hopper);
	}

	function createBlastDoor() {
		// Thick blast door (box)
		var doorGeometry = new THREE.BoxGeometry(4, 5, 0.8);
		var doorMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.8 });
		var door = new THREE.Mesh(doorGeometry, doorMaterial);
		door.position.set(0, -130, 0);
		door.castShadow = true;
		door.receiveShadow = true;
		scene.add(door);
		allObjects.push(door);
	}

	function createDynamiteMarkers() {
		// Small red cylinders marking dynamite charges
		var chargeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8);
		var chargeMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x660000 });

		var chargePositions = [
			[-4, -50, -6],
			[4, -50, 6],
			[-4, -100, 6],
			[4, -100, -6]
		];

		for (var i = 0; i < chargePositions.length; i++) {
			var charge = new THREE.Mesh(chargeGeometry, chargeMaterial);
			charge.position.set(chargePositions[i][0], chargePositions[i][1], chargePositions[i][2]);
			charge.castShadow = true;
			charge.receiveShadow = true;
			scene.add(charge);
			allObjects.push(charge);
		}
	}

	function createWaterPump() {
		var pumpGroup = new THREE.Group();

		// Pump base (box)
		var baseGeometry = new THREE.BoxGeometry(2, 1, 2);
		var baseMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
		var base = new THREE.Mesh(baseGeometry, baseMaterial);
		base.position.y = 0.5;
		base.castShadow = true;
		base.receiveShadow = true;
		pumpGroup.add(base);

		// Pump piston (vertical cylinder)
		var pistonGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
		var pistonMaterial = new THREE.MeshStandardMaterial({ color: 0x5a5a5a });
		var piston = new THREE.Mesh(pistonGeometry, pistonMaterial);
		piston.position.set(0, 1.5, 0);
		piston.castShadow = true;
		piston.receiveShadow = true;
		pumpGroup.add(piston);
		waterPump = piston;

		pumpGroup.position.set(-6, -110, 8);
		scene.add(pumpGroup);
		allObjects.push(pumpGroup);
	}

	function createHeadlampPosts() {
		// Headlamp post lights with cone beams
		var postGeometry = new THREE.CylinderGeometry(0.2, 0.2, 3, 8);
		var postMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });

		var lampPositions = [
			[-7, -30, -10],
			[7, -30, -10],
			[-7, -70, 10],
			[7, -70, 10]
		];

		for (var i = 0; i < lampPositions.length; i++) {
			// Post
			var post = new THREE.Mesh(postGeometry, postMaterial);
			post.position.set(lampPositions[i][0], lampPositions[i][1], lampPositions[i][2]);
			post.castShadow = true;
			post.receiveShadow = true;
			scene.add(post);
			allObjects.push(post);

			// Lamp head (cone)
			var lampGeometry = new THREE.ConeGeometry(0.4, 0.8, 8);
			var lampMaterial = new THREE.MeshStandardMaterial({ color: 0xff8800, emissive: 0xaa4400 });
			var lamp = new THREE.Mesh(lampGeometry, lampMaterial);
			lamp.position.set(lampPositions[i][0], lampPositions[i][1] + 1.6, lampPositions[i][2]);
			lamp.castShadow = true;
			lamp.receiveShadow = true;
			scene.add(lamp);
			allObjects.push(lamp);
			headlamps.push(lamp);

			// Light source
			var light = new THREE.PointLight(0xff8800, 1.5, 20);
			light.position.copy(lamp.position);
			light.castShadow = true;
			scene.add(light);
			allObjects.push(light);
		}
	}

	function createEmergencyLadder() {
		// Emergency exit ladder (box rungs)
		var rungGeometry = new THREE.BoxGeometry(1, 0.2, 0.3);
		var rungMaterial = new THREE.MeshStandardMaterial({ color: 0xffaa00 });

		for (var y = 0; y > -140; y -= 3) {
			var rung = new THREE.Mesh(rungGeometry, rungMaterial);
			rung.position.set(8, y, -10);
			rung.castShadow = true;
			rung.receiveShadow = true;
			scene.add(rung);
			allObjects.push(rung);
		}
	}

	function createDebrisPile() {
		// Cave-in debris pile (stacked boxes at angles)
		var debrisGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
		var debrisMaterial = new THREE.MeshStandardMaterial({ color: 0x6a5a4a });

		for (var i = 0; i < 8; i++) {
			var debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
			debris.position.set(
				-6 + (i % 4) * 1.2,
				-120 + Math.floor(i / 4) * 1.8,
				8 + (Math.random() - 0.5) * 3
			);
			debris.rotation.set(
				Math.random() * 0.5,
				Math.random() * 0.5,
				Math.random() * 0.5
			);
			debris.castShadow = true;
			debris.receiveShadow = true;
			scene.add(debris);
			allObjects.push(debris);
		}
	}

	function createUndergroundLake() {
		// Underground lake (flat cyan box)
		var lakeGeometry = new THREE.BoxGeometry(12, 0.5, 10);
		var lakeMaterial = new THREE.MeshStandardMaterial({
			color: 0x0088aa,
			metalness: 0.6,
			roughness: 0.3
		});
		var lake = new THREE.Mesh(lakeGeometry, lakeMaterial);
		lake.position.set(0, -145, 0);
		lake.receiveShadow = true;
		scene.add(lake);
		allObjects.push(lake);
	}

	function createTrackRails() {
		// Track rails (thin box strips)
		var railGeometry = new THREE.BoxGeometry(0.1, 0.1, 20);
		var railMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });

		var rail1 = new THREE.Mesh(railGeometry, railMaterial);
		rail1.position.set(-1.5, 0.5, -40);
		rail1.castShadow = true;
		rail1.receiveShadow = true;
		scene.add(rail1);
		allObjects.push(rail1);

		var rail2 = new THREE.Mesh(railGeometry, railMaterial);
		rail2.position.set(1.5, 0.5, -40);
		rail2.castShadow = true;
		rail2.receiveShadow = true;
		scene.add(rail2);
		allObjects.push(rail2);
	}

	function createEnemies() {
		// Armed mine security with hard hats
		var securityPositions = [
			[-5, -50, 5],
			[5, -80, -6],
			[0, -110, 8]
		];

		for (var i = 0; i < securityPositions.length; i++) {
			createSecurityGuard(securityPositions[i]);
		}
	}

	function createSecurityGuard(position) {
		var guardGroup = new THREE.Group();

		// Body (box)
		var bodyGeometry = new THREE.BoxGeometry(0.8, 1.5, 0.6);
		var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffaa00 }); // Hi-viz
		var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
		body.position.y = 0.75;
		body.castShadow = true;
		body.receiveShadow = true;
		guardGroup.add(body);

		// Head (small box)
		var headGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
		var headMaterial = new THREE.MeshStandardMaterial({ color: 0xccaa88 });
		var head = new THREE.Mesh(headGeometry, headMaterial);
		head.position.y = 1.6;
		head.castShadow = true;
		head.receiveShadow = true;
		guardGroup.add(head);

		// Hard hat (cylinder)
		var hatGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 16);
		var hatMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
		var hat = new THREE.Mesh(hatGeometry, hatMaterial);
		hat.position.y = 2.0;
		hat.castShadow = true;
		hat.receiveShadow = true;
		guardGroup.add(hat);

		guardGroup.position.set(position[0], position[1], position[2]);
		scene.add(guardGroup);
		allObjects.push(guardGroup);
	}

	// ==================== LIGHTING ====================

	function addLighting() {
		// Ambient light for overall illumination
		var ambientLight = new THREE.AmbientLight(0x4a4a4a, 0.8);
		scene.add(ambientLight);
		allObjects.push(ambientLight);

		// Directional light for shadows
		var sunLight = new THREE.DirectionalLight(0xffffff, 0.6);
		sunLight.position.set(10, 50, 10);
		sunLight.castShadow = true;
		sunLight.shadow.mapSize.width = 2048;
		sunLight.shadow.mapSize.height = 2048;
		sunLight.shadow.camera.far = 200;
		sunLight.shadow.camera.left = -50;
		sunLight.shadow.camera.right = 50;
		sunLight.shadow.camera.top = 50;
		sunLight.shadow.camera.bottom = -50;
		scene.add(sunLight);
		allObjects.push(sunLight);
	}

	// ==================== ANIMATION ====================

	function update(delta) {
		// Minecart animation
		if (minecart) {
			minecartPosition += minecartDirection * delta * 5;
			if (minecartPosition > 30) minecartDirection = -1;
			if (minecartPosition < -30) minecartDirection = 1;
			minecart.position.z = -40 + minecartPosition;
		}

		// Ventilation fan spin
		if (ventilationFan) {
			ventilationAngle += delta * 8;
			ventilationFan.rotation.x = ventilationAngle;
		}

		// Ore crusher drum rotation
		if (crusherDrum) {
			crusherAngle += delta * 10;
			crusherDrum.rotation.x = crusherAngle;
		}

		// Water pump piston cycle
		if (waterPump) {
			waterPumpHeight += waterPumpDirection * delta * 3;
			if (waterPumpHeight > 0.8) waterPumpDirection = -1;
			if (waterPumpHeight < -0.8) waterPumpDirection = 1;
			waterPump.position.y = 1.5 + waterPumpHeight;
		}

		// Headlamp flicker
		lampFlickerTime += delta;
		for (var i = 0; i < headlamps.length; i++) {
			if (Math.sin(lampFlickerTime * 3 + i) > 0.7) {
				headlamps[i].material.emissive.setHex(0x220000);
			} else {
				headlamps[i].material.emissive.setHex(0xaa4400);
			}
		}
	}

	// ==================== INPUT & HUD ====================

	function setupInput() {
		document.addEventListener('keydown', function(event) {
			var now = Date.now();

			if (event.key.toUpperCase() === 'M') {
				if (!mPressed) {
					mPressed = true;
					lastKeyTime = now;
				} else if (now - lastKeyTime < 400) {
					// M was already pressed within 400ms, S will trigger toggle
				}
			}

			if (event.key.toUpperCase() === 'S') {
				if (mPressed && (now - lastKeyTime) < 400) {
					// M+S detected within 400ms
					showHud = !showHud;
					updateHudDisplay();
					mPressed = false;
				}
			}

			// Reset M state if time exceeded
			if (mPressed && (now - lastKeyTime) > 400) {
				mPressed = false;
			}
		});

		// Initialize HUD
		updateHudDisplay();
	}

	function updateHudDisplay() {
		var hudElement = document.getElementById('mineshaft-hud');
		if (!hudElement) {
			hudElement = document.createElement('div');
			hudElement.id = 'mineshaft-hud';
			hudElement.style.position = 'fixed';
			hudElement.style.top = '20px';
			hudElement.style.left = '20px';
			hudElement.style.color = '#ffffff';
			hudElement.style.fontFamily = 'monospace';
			hudElement.style.fontSize = '16px';
			hudElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
			hudElement.style.padding = '10px';
			hudElement.style.border = '2px solid #ffaa00';
			hudElement.style.zIndex = '1000';
			document.body.appendChild(hudElement);
		}

		if (showHud) {
			hudElement.style.display = 'block';
			hudElement.innerHTML = 'DEPTH: ' + depth + 'm<br>' +
				'CHARGES PLACED: ' + chargesPlaced + '/4<br>' +
				'EXTRACTION HALTED: ' + (extractionHalted ? 'YES' : 'NO');
		} else {
			hudElement.style.display = 'none';
		}
	}

	// ==================== RESET ====================

	function reset() {
		// Remove all tracked objects
		for (var i = 0; i < allObjects.length; i++) {
			if (allObjects[i].geometry) {
				allObjects[i].geometry.dispose();
			}
			if (allObjects[i].material) {
				if (Array.isArray(allObjects[i].material)) {
					for (var j = 0; j < allObjects[i].material.length; j++) {
						allObjects[i].material[j].dispose();
					}
				} else {
					allObjects[i].material.dispose();
				}
			}
			if (allObjects[i].parent) {
				allObjects[i].parent.remove(allObjects[i]);
			}
		}
		allObjects = [];

		// Reset state
		depth = -120;
		chargesPlaced = 0;
		extractionHalted = false;
		minecartPosition = 0;
		minecartDirection = 1;
		ventilationAngle = 0;
		crusherAngle = 0;
		waterPumpHeight = 0;
		waterPumpDirection = 1;
		lampFlickerTime = 0;
		mPressed = false;
		showHud = true;

		headlamps = [];
		minecart = null;
		ventilationFan = null;
		crusherDrum = null;
		waterPump = null;
	}

	// ==================== PUBLIC API ====================

	return {
		init: init,
		update: update,
		reset: reset
	};

}());
