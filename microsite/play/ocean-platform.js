window.OceanPlatform = (function() {
	'use strict';

	// Module state
	var scene = null;
	var camera = null;
	var platform = {};
	var pumpJack = {};
	var flameGeometry = null;
	var oceanWaves = [];
	var craneArm = {};
	var time = 0;

	// Initialize the ocean platform scene
	var init = function(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		time = 0;

		// Ocean surface - large water blocks with wave motion
		createOcean();

		// Main platform deck structure
		createPlatformDeck();

		// Derrick tower - tall lattice over drill hole
		createDerrickTower();

		// Pump jack - nodding donkey mechanism
		createPumpJack();

		// Flare stack - tall burning gas tower
		createFlareStack();

		// Helipad with H marking and wind sock
		createHelipad();

		// Lifeboats in davit frames
		createLifeboats();

		// Crane boom structure
		createCraneBoom();

		// Crew quarters accommodation block
		createCrewQuarters();

		// Safety net perimeter
		createSafetyNet();

		// Oil spill patches on water
		createOilSpill();
	};

	// Ocean surface with wave animation
	var createOcean = function() {
		var waterColor = 0x001a4d;
		var oceanMaterial = new THREE.MeshStandardMaterial({
			color: waterColor,
			metalness: 0.6,
			roughness: 0.3
		});

		// Create water blocks that will animate
		var blockSize = 40;
		var gridSize = 5; // 5x5 grid of water blocks
		oceanWaves = [];

		for (var i = -gridSize; i <= gridSize; i++) {
			for (var j = -gridSize; j <= gridSize; j++) {
				var waterGeometry = new THREE.BoxGeometry(blockSize, 8, blockSize);
				var waterMesh = new THREE.Mesh(waterGeometry, oceanMaterial);
				waterMesh.position.set(i * blockSize, -40, j * blockSize);
				waterMesh.castShadow = true;
				waterMesh.receiveShadow = true;
				scene.add(waterMesh);
				oceanWaves.push({
					mesh: waterMesh,
					baseY: waterMesh.position.y,
					offsetX: i,
					offsetZ: j
				});
			}
		}
	};

	// Main platform deck
	var createPlatformDeck = function() {
		var deckMaterial = new THREE.MeshStandardMaterial({
			color: 0x444444,
			metalness: 0.8,
			roughness: 0.2
		});

		// Main deck platform
		var deckGeometry = new THREE.BoxGeometry(80, 6, 80);
		var deckMesh = new THREE.Mesh(deckGeometry, deckMaterial);
		deckMesh.position.y = 20;
		deckMesh.castShadow = true;
		deckMesh.receiveShadow = true;
		scene.add(deckMesh);
		platform.deck = deckMesh;

		// Support columns - massive cylindrical legs
		var columnMaterial = new THREE.MeshStandardMaterial({
			color: 0x333333,
			metalness: 0.9,
			roughness: 0.1
		});

		var columnRadius = 4;
		var columnHeight = 60;
		var columnGeometry = new THREE.CylinderGeometry(columnRadius, columnRadius, columnHeight, 16);

		var columnPositions = [
			[-30, 0, -30],
			[30, 0, -30],
			[-30, 0, 30],
			[30, 0, 30]
		];

		for (var i = 0; i < columnPositions.length; i++) {
			var column = new THREE.Mesh(columnGeometry, columnMaterial);
			column.position.set(columnPositions[i][0], columnPositions[i][1], columnPositions[i][2]);
			column.castShadow = true;
			column.receiveShadow = true;
			scene.add(column);
		}

		// Bracing beams - horizontal BoxGeometry connecting columns
		var beamMaterial = new THREE.MeshStandardMaterial({
			color: 0x555555,
			metalness: 0.8,
			roughness: 0.2
		});

		var beamPositions = [
			[-30, 8, -30, 30, 8, -30],
			[-30, 8, 30, 30, 8, 30],
			[-30, 8, -30, -30, 8, 30],
			[30, 8, -30, 30, 8, 30]
		];

		for (var i = 0; i < beamPositions.length; i++) {
			var bStart = [beamPositions[i][0], beamPositions[i][1], beamPositions[i][2]];
			var bEnd = [beamPositions[i][3], beamPositions[i][4], beamPositions[i][5]];
			var dx = bEnd[0] - bStart[0];
			var dz = bEnd[2] - bStart[2];
			var dist = Math.sqrt(dx * dx + dz * dz);
			var beamGeometry = new THREE.BoxGeometry(dist, 1.5, 1.5);
			var beam = new THREE.Mesh(beamGeometry, beamMaterial);
			beam.position.set((bStart[0] + bEnd[0]) / 2, bStart[1], (bStart[2] + bEnd[2]) / 2);
			beam.rotation.y = Math.atan2(dz, dx);
			beam.castShadow = true;
			beam.receiveShadow = true;
			scene.add(beam);
		}
	};

	// Derrick tower - tall lattice structure over drill hole
	var createDerrickTower = function() {
		var derrickMaterial = new THREE.MeshStandardMaterial({
			color: 0x666666,
			metalness: 0.9,
			roughness: 0.15
		});

		// Main vertical derrick mast
		var mastGeometry = new THREE.BoxGeometry(3, 120, 3);
		var mastMesh = new THREE.Mesh(mastGeometry, derrickMaterial);
		mastMesh.position.set(0, 80, 0);
		mastMesh.castShadow = true;
		mastMesh.receiveShadow = true;
		scene.add(mastMesh);

		// Cross braces at intervals
		for (var h = 30; h < 120; h += 20) {
			var braceGeometry = new THREE.BoxGeometry(20, 2, 2);
			var brace = new THREE.Mesh(braceGeometry, derrickMaterial);
			brace.position.set(0, h, 0);
			brace.castShadow = true;
			brace.receiveShadow = true;
			scene.add(brace);

			var braceDiag = new THREE.BoxGeometry(2, 2, 20);
			var diagBrace = new THREE.Mesh(braceDiag, derrickMaterial);
			diagBrace.position.set(0, h, 0);
			diagBrace.castShadow = true;
			diagBrace.receiveShadow = true;
			scene.add(diagBrace);
		}

		// Hook and block at top
		var hookBlockGeometry = new THREE.BoxGeometry(8, 12, 8);
		var hookBlockMaterial = new THREE.MeshStandardMaterial({
			color: 0xffaa00,
			metalness: 0.95,
			roughness: 0.05
		});
		var hookBlock = new THREE.Mesh(hookBlockGeometry, hookBlockMaterial);
		hookBlock.position.set(0, 140, 0);
		hookBlock.castShadow = true;
		hookBlock.receiveShadow = true;
		scene.add(hookBlock);

		// Drill pipe hint (subtle inner cylinder)
		var drillPipeGeometry = new THREE.CylinderGeometry(0.8, 0.8, 30, 8);
		var drillPipeMaterial = new THREE.MeshStandardMaterial({
			color: 0x222222,
			metalness: 0.9,
			roughness: 0.2
		});
		var drillPipe = new THREE.Mesh(drillPipeGeometry, drillPipeMaterial);
		drillPipe.position.set(0, 15, 0);
		drillPipe.castShadow = true;
		drillPipe.receiveShadow = true;
		scene.add(drillPipe);
	};

	// Pump jack - nodding donkey with animated arm
	var createPumpJack = function() {
		var pumpMaterial = new THREE.MeshStandardMaterial({
			color: 0xcc0000,
			metalness: 0.8,
			roughness: 0.25
		});

		// Base frame
		var baseGeometry = new THREE.BoxGeometry(12, 4, 12);
		var baseMesh = new THREE.Mesh(baseGeometry, pumpMaterial);
		baseMesh.position.set(-35, 23, -35);
		baseMesh.castShadow = true;
		baseMesh.receiveShadow = true;
		scene.add(baseMesh);

		// Gear box
		var gearGeometry = new THREE.BoxGeometry(10, 8, 10);
		var gearMesh = new THREE.Mesh(gearGeometry, pumpMaterial);
		gearMesh.position.set(-35, 29, -35);
		gearMesh.castShadow = true;
		gearMesh.receiveShadow = true;
		scene.add(gearMesh);

		// Beam arm (nodding donkey arm that oscillates)
		var armGeometry = new THREE.BoxGeometry(30, 3, 4);
		var armMesh = new THREE.Mesh(armGeometry, pumpMaterial);
		armMesh.position.set(-20, 35, -35);
		armMesh.castShadow = true;
		armMesh.receiveShadow = true;
		scene.add(armMesh);
		pumpJack.arm = armMesh;
		pumpJack.armPivot = new THREE.Vector3(-35, 35, -35);

		// Pump rod (vertical oscillating element)
		var rodGeometry = new THREE.CylinderGeometry(1, 1, 15, 8);
		var rodMaterial = new THREE.MeshStandardMaterial({
			color: 0xaa0000,
			metalness: 0.85,
			roughness: 0.2
		});
		var rodMesh = new THREE.Mesh(rodGeometry, rodMaterial);
		rodMesh.position.set(-5, 23, -35);
		rodMesh.castShadow = true;
		rodMesh.receiveShadow = true;
		scene.add(rodMesh);
		pumpJack.rod = rodMesh;
		pumpJack.rodBaseY = rodMesh.position.y;

		// Polished rod guide
		var guideGeometry = new THREE.BoxGeometry(8, 20, 6);
		var guideMaterial = new THREE.MeshStandardMaterial({
			color: 0xdddddd,
			metalness: 0.9,
			roughness: 0.1
		});
		var guide = new THREE.Mesh(guideGeometry, guideMaterial);
		guide.position.set(-5, 30, -35);
		guide.castShadow = true;
		guide.receiveShadow = true;
		scene.add(guide);
	};

	// Flare stack - tall burning gas tower
	var createFlareStack = function() {
		var stackMaterial = new THREE.MeshStandardMaterial({
			color: 0x444444,
			metalness: 0.8,
			roughness: 0.3
		});

		// Main stack pipe
		var stackGeometry = new THREE.CylinderGeometry(2.5, 2.5, 80, 12);
		var stackMesh = new THREE.Mesh(stackGeometry, stackMaterial);
		stackMesh.position.set(35, 60, 0);
		stackMesh.castShadow = true;
		stackMesh.receiveShadow = true;
		scene.add(stackMesh);

		// Ignitor boom at top (angled pipe)
		var boomGeometry = new THREE.CylinderGeometry(1, 1, 15, 8);
		var boomMesh = new THREE.Mesh(boomGeometry, stackMaterial);
		boomMesh.position.set(42, 105, 0);
		boomMesh.rotation.z = Math.PI / 6;
		boomMesh.castShadow = true;
		boomMesh.receiveShadow = true;
		scene.add(boomMesh);

		// Burning flame - SphereGeometry
		var flameGeomLocal = new THREE.SphereGeometry(3, 8, 8);
		var flameMaterial = new THREE.MeshStandardMaterial({
			color: 0xff6600,
			emissive: 0xff4400,
			metalness: 0,
			roughness: 0.8
		});
		var flameMesh = new THREE.Mesh(flameGeomLocal, flameMaterial);
		flameMesh.position.set(50, 115, 0);
		flameMesh.castShadow = true;
		flameMesh.receiveShadow = true;
		scene.add(flameMesh);
		flameGeometry = {
			mesh: flameMesh,
			baseScale: 1,
			baseMaterial: flameMaterial
		};

		// Flame support structure
		var supportGeometry = new THREE.BoxGeometry(6, 12, 6);
		var supportMaterial = new THREE.MeshStandardMaterial({
			color: 0x333333,
			metalness: 0.9,
			roughness: 0.2
		});
		var support = new THREE.Mesh(supportGeometry, supportMaterial);
		support.position.set(35, 95, 0);
		support.castShadow = true;
		support.receiveShadow = true;
		scene.add(support);
	};

	// Helipad with H marking and wind sock
	var createHelipad = function() {
		var helipadMaterial = new THREE.MeshStandardMaterial({
			color: 0xffaa00,
			metalness: 0.7,
			roughness: 0.4
		});

		// Helipad platform
		var padGeometry = new THREE.BoxGeometry(20, 1, 20);
		var padMesh = new THREE.Mesh(padGeometry, helipadMaterial);
		padMesh.position.set(0, 27, -35);
		padMesh.castShadow = true;
		padMesh.receiveShadow = true;
		scene.add(padMesh);

		// H marking in white LineSegments
		var hGeometry = new THREE.BufferGeometry();
		var hVertices = new Float32Array([
			// Left vertical
			-6, 0.1, 0,
			-6, 0.1, 4,
			// Right vertical
			-2, 0.1, 0,
			-2, 0.1, 4,
			// Horizontal connector
			-6, 0.1, 2,
			-2, 0.1, 2
		]);
		hGeometry.setAttribute('position', new THREE.BufferAttribute(hVertices, 3));
		var hLineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3 });
		var hLines = new THREE.LineSegments(hGeometry, hLineMaterial);
		hLines.position.set(0, 27.2, -35);
		scene.add(hLines);

		// Wind sock support post
		var postGeometry = new THREE.CylinderGeometry(0.4, 0.4, 10, 8);
		var postMaterial = new THREE.MeshStandardMaterial({
			color: 0xcccccc,
			metalness: 0.8,
			roughness: 0.2
		});
		var post = new THREE.Mesh(postGeometry, postMaterial);
		post.position.set(8, 32, -35);
		post.castShadow = true;
		post.receiveShadow = true;
		scene.add(post);

		// Wind sock (tapered cone-like shape)
		var sockGeometry = new THREE.ConeGeometry(1.5, 6, 8);
		var sockMaterial = new THREE.MeshStandardMaterial({
			color: 0xff6600,
			metalness: 0.2,
			roughness: 0.7
		});
		var sock = new THREE.Mesh(sockGeometry, sockMaterial);
		sock.position.set(8, 37, -35);
		sock.rotation.z = Math.PI / 4;
		sock.castShadow = true;
		sock.receiveShadow = true;
		scene.add(sock);
		craneArm.windSock = sock;
	};

	// Lifeboats in davit frames
	var createLifeboats = function() {
		var lifebootMaterial = new THREE.MeshStandardMaterial({
			color: 0xff6600,
			metalness: 0.6,
			roughness: 0.4
		});

		var davitMaterial = new THREE.MeshStandardMaterial({
			color: 0x555555,
			metalness: 0.8,
			roughness: 0.3
		});

		// Port side lifeboat
		var boatGeometry = new THREE.BoxGeometry(6, 4, 10);
		var boatLeft = new THREE.Mesh(boatGeometry, lifebootMaterial);
		boatLeft.position.set(-38, 30, -25);
		boatLeft.castShadow = true;
		boatLeft.receiveShadow = true;
		scene.add(boatLeft);

		// Left davit arm
		var davitLeftGeometry = new THREE.CylinderGeometry(0.5, 0.5, 20, 8);
		var davitLeft = new THREE.Mesh(davitLeftGeometry, davitMaterial);
		davitLeft.position.set(-38, 40, -25);
		davitLeft.rotation.z = Math.PI / 6;
		davitLeft.castShadow = true;
		davitLeft.receiveShadow = true;
		scene.add(davitLeft);

		// Starboard side lifeboat
		var boatRight = new THREE.Mesh(boatGeometry, lifebootMaterial);
		boatRight.position.set(38, 30, -25);
		boatRight.castShadow = true;
		boatRight.receiveShadow = true;
		scene.add(boatRight);

		// Right davit arm
		var davitRight = new THREE.Mesh(davitLeftGeometry, davitMaterial);
		davitRight.position.set(38, 40, -25);
		davitRight.rotation.z = -Math.PI / 6;
		davitRight.castShadow = true;
		davitRight.receiveShadow = true;
		scene.add(davitRight);

		// Additional lifeboat capsules on aft deck
		var capsuleGeometry = new THREE.CylinderGeometry(2, 2.5, 5, 8);
		for (var i = 0; i < 2; i++) {
			var capsule = new THREE.Mesh(capsuleGeometry, lifebootMaterial);
			capsule.position.set(-20 + i * 40, 27, 30);
			capsule.castShadow = true;
			capsule.receiveShadow = true;
			scene.add(capsule);
		}
	};

	// Crane boom structure
	var createCraneBoom = function() {
		var craneMaterial = new THREE.MeshStandardMaterial({
			color: 0xffcc00,
			metalness: 0.85,
			roughness: 0.2
		});

		// Crane pedestal
		var pedestalGeometry = new THREE.CylinderGeometry(4, 5, 8, 12);
		var pedestal = new THREE.Mesh(pedestalGeometry, craneMaterial);
		pedestal.position.set(30, 25, 30);
		pedestal.castShadow = true;
		pedestal.receiveShadow = true;
		scene.add(pedestal);

		// Main boom arm
		var boomGeometry = new THREE.BoxGeometry(50, 3, 3);
		var boom = new THREE.Mesh(boomGeometry, craneMaterial);
		boom.position.set(55, 40, 30);
		boom.castShadow = true;
		boom.receiveShadow = true;
		scene.add(boom);
		craneArm.boom = boom;

		// Counterweight at base
		var counterGeometry = new THREE.BoxGeometry(8, 10, 8);
		var counterMaterial = new THREE.MeshStandardMaterial({
			color: 0x444444,
			metalness: 0.9,
			roughness: 0.2
		});
		var counter = new THREE.Mesh(counterGeometry, counterMaterial);
		counter.position.set(10, 35, 30);
		counter.castShadow = true;
		counter.receiveShadow = true;
		scene.add(counter);

		// Crane hook and cable with LineSegments
		var cableGeometry = new THREE.BufferGeometry();
		var cableVertices = new Float32Array([
			85, 39, 30,  // top pulley
			85, 32, 30   // hook point
		]);
		cableGeometry.setAttribute('position', new THREE.BufferAttribute(cableVertices, 3));
		var cableLineMaterial = new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 2 });
		var cableLines = new THREE.LineSegments(cableGeometry, cableLineMaterial);
		scene.add(cableLines);
		craneArm.cableLines = cableLines;

		// Hook at end of cable
		var hookGeometry = new THREE.SphereGeometry(1.5, 8, 8);
		var hookMaterial = new THREE.MeshStandardMaterial({
			color: 0xffaa00,
			metalness: 0.95,
			roughness: 0.05
		});
		var hook = new THREE.Mesh(hookGeometry, hookMaterial);
		hook.position.set(85, 32, 30);
		hook.castShadow = true;
		hook.receiveShadow = true;
		scene.add(hook);
		craneArm.hook = hook;
	};

	// Crew quarters accommodation block
	var createCrewQuarters = function() {
		var quartersMaterial = new THREE.MeshStandardMaterial({
			color: 0x666677,
			metalness: 0.5,
			roughness: 0.6
		});

		// Main accommodation module
		var moduleGeometry = new THREE.BoxGeometry(18, 20, 14);
		var module = new THREE.Mesh(moduleGeometry, quartersMaterial);
		module.position.set(-45, 35, 10);
		module.castShadow = true;
		module.receiveShadow = true;
		scene.add(module);

		// Window line (using boxes as window hints)
		var windowMaterial = new THREE.MeshStandardMaterial({
			color: 0x0099ff,
			metalness: 0.9,
			roughness: 0.1,
			emissive: 0x003366
		});

		for (var w = 0; w < 3; w++) {
			var windowGeometry = new THREE.BoxGeometry(2, 2, 0.5);
			var window1 = new THREE.Mesh(windowGeometry, windowMaterial);
			window1.position.set(-48 + w * 5, 40, 11.5);
			window1.castShadow = true;
			window1.receiveShadow = true;
			scene.add(window1);

			var window2 = new THREE.Mesh(windowGeometry, windowMaterial);
			window2.position.set(-48 + w * 5, 40, -8.5);
			window2.castShadow = true;
			window2.receiveShadow = true;
			scene.add(window2);
		}

		// Antenna mast on roof
		var antennaGeometry = new THREE.CylinderGeometry(0.3, 0.3, 8, 6);
		var antennaMaterial = new THREE.MeshStandardMaterial({
			color: 0x333333,
			metalness: 0.95,
			roughness: 0.1
		});
		var antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
		antenna.position.set(-40, 50, 10);
		antenna.castShadow = true;
		antenna.receiveShadow = true;
		scene.add(antenna);
	};

	// Safety net perimeter using LineSegments
	var createSafetyNet = function() {
		var netGeometry = new THREE.BufferGeometry();
		var netVertices = [];

		// Create grid of safety net lines around deck perimeter
		var radius = 42;
		var height = 25;
		var segments = 12;

		for (var i = 0; i < segments; i++) {
			var angle1 = (i / segments) * Math.PI * 2;
			var angle2 = ((i + 1) / segments) * Math.PI * 2;

			var x1 = Math.cos(angle1) * radius;
			var z1 = Math.sin(angle1) * radius;
			var x2 = Math.cos(angle2) * radius;
			var z2 = Math.sin(angle2) * radius;

			// Vertical lines
			netVertices.push(x1, height, z1, x1, 20, z1);
			netVertices.push(x2, height, z2, x2, 20, z2);

			// Horizontal lines
			netVertices.push(x1, height, z1, x2, height, z2);
			netVertices.push(x1, 22, z1, x2, 22, z2);
		}

		netGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(netVertices), 3));
		var netMaterial = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 1 });
		var netLines = new THREE.LineSegments(netGeometry, netMaterial);
		netLines.position.y = 20;
		scene.add(netLines);
	};

	// Oil spill patches on water surface
	var createOilSpill = function() {
		var spillMaterial = new THREE.MeshStandardMaterial({
			color: 0x1a1a00,
			metalness: 0.3,
			roughness: 0.7
		});

		var spillPositions = [
			[-50, -32, -40],
			[40, -32, -50],
			[30, -32, 50],
			[-60, -32, 20]
		];

		for (var i = 0; i < spillPositions.length; i++) {
			var spillGeometry = new THREE.BoxGeometry(20, 0.5, 20);
			var spill = new THREE.Mesh(spillGeometry, spillMaterial);
			spill.position.set(spillPositions[i][0], spillPositions[i][1], spillPositions[i][2]);
			spill.castShadow = true;
			spill.receiveShadow = true;
			scene.add(spill);
		}
	};

	// Update function - animates pump jack, flame, ocean waves, crane
	var update = function(delta) {
		time += delta;

		// Pump jack nod animation - oscillating arm rotation
		if (pumpJack.arm) {
			var armNodAmount = Math.sin(time * 1.5) * 0.3;
			pumpJack.arm.rotation.z = armNodAmount;
		}

		// Pump rod vertical oscillation
		if (pumpJack.rod) {
			var rodBounce = Math.sin(time * 1.5) * 2;
			pumpJack.rod.position.y = pumpJack.rodBaseY + rodBounce;
		}

		// Flame flickering and pulsing
		if (flameGeometry && flameGeometry.mesh) {
			var flameFlicker = 0.9 + Math.sin(time * 8) * 0.15;
			flameGeometry.mesh.scale.set(flameFlicker, flameFlicker, flameFlicker);

			var flameIntensity = 0.7 + Math.sin(time * 6) * 0.25;
			flameGeometry.mesh.material.emissiveIntensity = flameIntensity;
		}

		// Ocean wave motion
		for (var i = 0; i < oceanWaves.length; i++) {
			var wave = oceanWaves[i];
			var waveOffset = Math.sin(time * 0.8 + wave.offsetX * 0.5 + wave.offsetZ * 0.5) * 1.2;
			wave.mesh.position.y = wave.baseY + waveOffset;
		}

		// Crane cable sway
		if (craneArm.cableLines) {
			var sway = Math.sin(time * 1.2) * 2;
			craneArm.cableLines.position.x = sway;
		}

		// Hook gentle sway
		if (craneArm.hook) {
			var hookSway = Math.cos(time * 1.2) * 1.5;
			craneArm.hook.position.x = 85 + hookSway;
		}

		// Wind sock rotation
		if (craneArm.windSock) {
			var sockWave = Math.sin(time * 2) * 0.2;
			craneArm.windSock.rotation.z = Math.PI / 4 + sockWave;
		}

		// Boom gentle rotation
		if (craneArm.boom) {
			var boomRotation = Math.sin(time * 0.6) * 0.15;
			craneArm.boom.rotation.y = boomRotation;
		}
	};

	// Reset function
	var reset = function() {
		time = 0;
		if (pumpJack.arm) {
			pumpJack.arm.rotation.z = 0;
		}
		if (pumpJack.rod) {
			pumpJack.rod.position.y = pumpJack.rodBaseY;
		}
		if (flameGeometry && flameGeometry.mesh) {
			flameGeometry.mesh.scale.set(1, 1, 1);
		}
	};

	// Public API
	return {
		init: init,
		update: update,
		reset: reset
	};
}());
