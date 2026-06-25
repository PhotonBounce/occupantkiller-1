window.WetlandsPatrol = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var meshes = [];
	var patrolBoat = null;
	var alligator = null;
	var fog = null;
	var fireflies = [];
	var spanishMoss = [];
	var shack = null;
	var waterSurface = null;
	var lilyPads = [];
	var trapNet = null;
	var spawnPoints = [];

	var boatDirection = 1;
	var boatAngle = 0;
	var alligatorDirection = 1;
	var alligatorAngle = 0;
	var fireflyClock = 0;
	var waterWaveTime = 0;
	var mossSway = 0;
	var shackSway = 0;
	var trapNetBob = 0;
	var lilyPadBob = 0;

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		meshes = [];
		fireflies = [];
		spanishMoss = [];
		lilyPads = [];

		scene.background = new THREE.Color(0x1a2a1a);

		// Water surface - dark murky swamp water
		var waterGeom = new THREE.BoxGeometry(300, 1, 300);
		var waterMat = new THREE.MeshStandardMaterial({
			color: 0x1a2a1a,
			roughness: 0.7,
			metalness: 0.1
		});
		waterSurface = new THREE.Mesh(waterGeom, waterMat);
		waterSurface.position.y = -2;
		scene.add(waterSurface);
		meshes.push(waterSurface);

		// Fog mist - atmospheric
		var fogGeom = new THREE.SphereGeometry(80, 16, 16);
		var fogMat = new THREE.MeshBasicMaterial({
			color: 0x7a8a7a,
			transparent: true,
			opacity: 0.2
		});
		fog = new THREE.Mesh(fogGeom, fogMat);
		fog.position.set(0, 10, 0);
		scene.add(fog);
		meshes.push(fog);

		// Cypress trees - dominant feature
		buildCypressTrees();

		// Spanish moss - drooping chains
		buildSpanishMoss();

		// Fishing shack on stilts
		buildFishingShack();

		// Enemy patrol boat
		buildPatrolBoat();

		// Alligator on water
		buildAlligator();

		// Dock structure
		buildDock();

		// Duck blind
		buildDuckBlind();

		// Abandoned pirogue canoe
		buildPirogue();

		// Trap net with floats
		buildTrapNet();

		// Water lily pads
		buildLilyPads();

		// Cypress root tangles
		buildRootTangles();

		// Fireflies with glow
		buildFireflies();

		// Define spawn points
		spawnPoints = [
			new THREE.Vector3(40, 1, -30),    // Water edge
			new THREE.Vector3(-20, 0, 60),    // Dock area
			new THREE.Vector3(-60, 2, 20),    // Fishing shack
			new THREE.Vector3(50, 0, 40),     // Patrol route
			new THREE.Vector3(-80, 0, -70)    // Bayou exit
		];
	}

	function buildCypressTrees() {
		var positions = [
			{ x: -40, z: 30 },
			{ x: 35, z: 50 },
			{ x: -70, z: -40 },
			{ x: 60, z: -30 },
			{ x: 0, z: 70 },
			{ x: -55, z: 10 }
		];

		positions.forEach(function(pos) {
			// Trunk
			var trunkGeom = new THREE.CylinderGeometry(3, 4, 25, 8);
			var trunkMat = new THREE.MeshStandardMaterial({
				color: 0x2a1a0a,
				roughness: 0.8
			});
			var trunk = new THREE.Mesh(trunkGeom, trunkMat);
			trunk.position.set(pos.x, 12, pos.z);
			scene.add(trunk);
			meshes.push(trunk);

			// Canopy - cone shape
			var canopyGeom = new THREE.ConeGeometry(8, 20, 16);
			var canopyMat = new THREE.MeshStandardMaterial({
				color: 0x3a5a2a,
				roughness: 0.7
			});
			var canopy = new THREE.Mesh(canopyGeom, canopyMat);
			canopy.position.set(pos.x, 28, pos.z);
			scene.add(canopy);
			meshes.push(canopy);

			// Root knees - cypress characteristics
			for (var i = 0; i < 3; i++) {
				var kneeGeom = new THREE.CylinderGeometry(0.8, 1.2, 4, 6);
				var kneeMat = new THREE.MeshStandardMaterial({
					color: 0x2a1a0a,
					roughness: 0.8
				});
				var knee = new THREE.Mesh(kneeGeom, kneeMat);
				var angle = (i / 3) * Math.PI * 2;
				knee.position.set(
					pos.x + Math.cos(angle) * 2.5,
					1.5,
					pos.z + Math.sin(angle) * 2.5
				);
				scene.add(knee);
				meshes.push(knee);
			}
		});
	}

	function buildSpanishMoss() {
		// Spanish moss hanging from cypress trees
		var positions = [
			{ x: -40, z: 30 },
			{ x: 35, z: 50 },
			{ x: -70, z: -40 }
		];

		positions.forEach(function(pos) {
			// Create drooping moss chains with sphere elements
			var mossParts = [];
			for (var j = 0; j < 4; j++) {
				var chainX = pos.x + (j - 1.5) * 2;
				var points = [];
				for (var i = 0; i < 8; i++) {
					points.push(new THREE.Vector3(0, 25 - i * 2.5, 0));
				}
				var lineGeom = new THREE.BufferGeometry().setFromPoints(points);
				var lineMat = new THREE.LineBasicMaterial({ color: 0x4a5a4a });
				var line = new THREE.LineSegments(lineGeom, lineMat);
				line.position.set(chainX, 0, pos.z);
				scene.add(line);
				meshes.push(line);
				mossParts.push(line);
			}
			spanishMoss.push({ parts: mossParts, baseX: pos.x, baseZ: pos.z });
		});
	}

	function buildFishingShack() {
		// Shack structure on stilts
		var shackGeom = new THREE.BoxGeometry(8, 6, 10);
		var shackMat = new THREE.MeshStandardMaterial({
			color: 0x5a4a2a,
			roughness: 0.8
		});
		shack = new THREE.Mesh(shackGeom, shackMat);
		shack.position.set(-60, 8, 25);
		scene.add(shack);
		meshes.push(shack);

		// Stilts - cylinders
		for (var i = 0; i < 4; i++) {
			var stiltGeom = new THREE.CylinderGeometry(0.4, 0.5, 8, 6);
			var stiltMat = new THREE.MeshStandardMaterial({
				color: 0x3a2a1a,
				roughness: 0.8
			});
			var stilt = new THREE.Mesh(stiltGeom, stiltMat);
			var offsetX = (i < 2 ? -2.5 : 2.5);
			var offsetZ = (i % 2 === 0 ? -3 : 3);
			stilt.position.set(-60 + offsetX, 4, 25 + offsetZ);
			scene.add(stilt);
			meshes.push(stilt);
		}

		// Roof
		var roofGeom = new THREE.ConeGeometry(6, 3, 8);
		var roofMat = new THREE.MeshStandardMaterial({
			color: 0x4a3a1a,
			roughness: 0.8
		});
		var roof = new THREE.Mesh(roofGeom, roofMat);
		roof.position.set(-60, 12, 25);
		scene.add(roof);
		meshes.push(roof);
	}

	function buildPatrolBoat() {
		// Hull - long narrow box
		var hullGeom = new THREE.BoxGeometry(3, 1.5, 8);
		var hullMat = new THREE.MeshStandardMaterial({
			color: 0x3a4a2a,
			roughness: 0.7
		});
		var hull = new THREE.Mesh(hullGeom, hullMat);
		hull.position.set(50, 0.5, -50);
		scene.add(hull);
		meshes.push(hull);

		// Cabin
		var cabinGeom = new THREE.BoxGeometry(2.5, 2, 3);
		var cabinMat = new THREE.MeshStandardMaterial({
			color: 0x2a3a1a,
			roughness: 0.7
		});
		var cabin = new THREE.Mesh(cabinGeom, cabinMat);
		cabin.position.set(50, 2, -48);
		scene.add(cabin);
		meshes.push(cabin);

		// Outboard motor
		var motorGeom = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
		var motorMat = new THREE.MeshStandardMaterial({
			color: 0x1a1a1a,
			roughness: 0.8
		});
		var motor = new THREE.Mesh(motorGeom, motorMat);
		motor.position.set(50, 0, -53);
		scene.add(motor);
		meshes.push(motor);

		patrolBoat = { hull: hull, cabin: cabin, motor: motor, baseX: 50, baseZ: -50 };
	}

	function buildAlligator() {
		// Body - long box
		var bodyGeom = new THREE.BoxGeometry(2, 0.6, 6);
		var bodyMat = new THREE.MeshStandardMaterial({
			color: 0x2a4a1a,
			roughness: 0.8
		});
		var body = new THREE.Mesh(bodyGeom, bodyMat);
		body.position.set(20, -0.2, 15);
		scene.add(body);
		meshes.push(body);

		// Head - smaller box
		var headGeom = new THREE.BoxGeometry(1.2, 0.5, 1.5);
		var headMat = new THREE.MeshStandardMaterial({
			color: 0x1a3a0a,
			roughness: 0.8
		});
		var head = new THREE.Mesh(headGeom, headMat);
		head.position.set(20, -0.1, 18);
		scene.add(head);
		meshes.push(head);

		// Eyes - small spheres
		for (var i = 0; i < 2; i++) {
			var eyeGeom = new THREE.SphereGeometry(0.2, 8, 8);
			var eyeMat = new THREE.MeshStandardMaterial({ color: 0xffff00 });
			var eye = new THREE.Mesh(eyeGeom, eyeMat);
			eye.position.set(20 + (i === 0 ? -0.4 : 0.4), 0.2, 18.5);
			scene.add(eye);
			meshes.push(eye);
		}

		alligator = { body: body, head: head, baseX: 20, baseZ: 15 };
	}

	function buildDock() {
		// Wooden planks - series of boxes
		for (var i = 0; i < 5; i++) {
			var plankGeom = new THREE.BoxGeometry(2, 0.4, 15);
			var plankMat = new THREE.MeshStandardMaterial({
				color: 0x5a4a3a,
				roughness: 0.8
			});
			var plank = new THREE.Mesh(plankGeom, plankMat);
			plank.position.set(-20 + i * 2.5, 0.8, 60);
			scene.add(plank);
			meshes.push(plank);
		}

		// Pilings - cylinders under dock
		for (var j = 0; j < 6; j++) {
			var pilingGeom = new THREE.CylinderGeometry(0.3, 0.4, 6, 6);
			var pilingMat = new THREE.MeshStandardMaterial({
				color: 0x3a2a1a,
				roughness: 0.8
			});
			var piling = new THREE.Mesh(pilingGeom, pilingMat);
			piling.position.set(-25 + j * 10, -1.5, 60);
			scene.add(piling);
			meshes.push(piling);
		}
	}

	function buildDuckBlind() {
		// Reeds - tall thin boxes
		for (var i = 0; i < 8; i++) {
			var reedGeom = new THREE.BoxGeometry(0.3, 5, 0.3);
			var reedMat = new THREE.MeshStandardMaterial({
				color: 0x3a5a2a,
				roughness: 0.8
			});
			var reed = new THREE.Mesh(reedGeom, reedMat);
			var angle = (i / 8) * Math.PI * 2;
			reed.position.set(
				75 + Math.cos(angle) * 3,
				2.5,
				-20 + Math.sin(angle) * 3
			);
			scene.add(reed);
			meshes.push(reed);
		}

		// Blind structure - box
		var blindGeom = new THREE.BoxGeometry(4, 3, 4);
		var blindMat = new THREE.MeshStandardMaterial({
			color: 0x4a5a3a,
			transparent: true,
			opacity: 0.6,
			roughness: 0.8
		});
		var blind = new THREE.Mesh(blindGeom, blindMat);
		blind.position.set(75, 1.5, -20);
		scene.add(blind);
		meshes.push(blind);
	}

	function buildPirogue() {
		// Narrow canoe shape - elongated box
		var pirogueGeom = new THREE.BoxGeometry(1.5, 0.8, 5);
		var pirougeMat = new THREE.MeshStandardMaterial({
			color: 0x4a3a2a,
			roughness: 0.8
		});
		var pirogue = new THREE.Mesh(pirogueGeom, pirougeMat);
		pirogue.position.set(-35, -0.5, 10);
		scene.add(pirogue);
		meshes.push(pirogue);
	}

	function buildTrapNet() {
		// Float buoys - spheres
		var floats = [];
		for (var i = 0; i < 4; i++) {
			var floatGeom = new THREE.SphereGeometry(0.5, 8, 8);
			var floatMat = new THREE.MeshStandardMaterial({
				color: 0xff6600,
				roughness: 0.6
			});
			var floatMesh = new THREE.Mesh(floatGeom, floatMat);
			var angle = (i / 4) * Math.PI * 2;
			floatMesh.position.set(
				30 + Math.cos(angle) * 4,
				0.2,
				30 + Math.sin(angle) * 4
			);
			scene.add(floatMesh);
			meshes.push(floatMesh);
			floats.push(floatMesh);
		}

		// Net lines connecting floats
		var netPoints = [
			new THREE.Vector3(34, 0.2, 30),
			new THREE.Vector3(30, -2, 34),
			new THREE.Vector3(26, 0.2, 30),
			new THREE.Vector3(30, -2, 26)
		];
		var netGeom = new THREE.BufferGeometry().setFromPoints(netPoints);
		var netMat = new THREE.LineBasicMaterial({ color: 0xaa8844 });
		trapNet = new THREE.LineSegments(netGeom, netMat);
		scene.add(trapNet);
		meshes.push(trapNet);
	}

	function buildLilyPads() {
		for (var i = 0; i < 6; i++) {
			var padGeom = new THREE.BoxGeometry(2, 0.1, 2);
			var padMat = new THREE.MeshStandardMaterial({
				color: 0x2a5a1a,
				roughness: 0.7
			});
			var pad = new THREE.Mesh(padGeom, padMat);
			var angle = (i / 6) * Math.PI * 2;
			pad.position.set(
				-15 + Math.cos(angle) * 12,
				-1.2,
				40 + Math.sin(angle) * 12
			);
			scene.add(pad);
			meshes.push(pad);
			lilyPads.push({ mesh: pad, baseY: -1.2, phase: i * 0.3 });
		}
	}

	function buildRootTangles() {
		// Cypress root clusters - scattered boxes
		for (var i = 0; i < 5; i++) {
			var rootGeom = new THREE.BoxGeometry(1.5, 2, 1.5);
			var rootMat = new THREE.MeshStandardMaterial({
				color: 0x1a1a0a,
				roughness: 0.8
			});
			var root = new THREE.Mesh(rootGeom, rootMat);
			root.position.set(
				-70 + Math.random() * 10,
				0,
				-40 + Math.random() * 10
			);
			scene.add(root);
			meshes.push(root);
		}
	}

	function buildFireflies() {
		for (var i = 0; i < 8; i++) {
			var ffGeom = new THREE.SphereGeometry(0.15, 8, 8);
			var ffMat = new THREE.MeshBasicMaterial({
				color: 0xffff00,
				transparent: true,
				opacity: 0.8
			});
			var ff = new THREE.Mesh(ffGeom, ffMat);
			ff.position.set(
				(Math.random() - 0.5) * 150,
				5 + Math.random() * 20,
				(Math.random() - 0.5) * 150
			);
			scene.add(ff);
			meshes.push(ff);
			fireflies.push({
				mesh: ff,
				baseX: ff.position.x,
				baseY: ff.position.y,
				baseZ: ff.position.z,
				phase: Math.random() * Math.PI * 2
			});
		}
	}

	function update(delta) {
		if (!scene || !patrolBoat) return;

		// Update patrol boat movement
		if (patrolBoat && patrolBoat.hull) {
			boatAngle += delta * 0.5;
			var boatX = Math.sin(boatAngle * 0.3) * 40 + 50;
			var boatZ = Math.cos(boatAngle * 0.2) * 40 - 50;
			patrolBoat.hull.position.set(boatX, 0.5, boatZ);
			patrolBoat.cabin.position.set(boatX, 2, boatZ - 2);
			patrolBoat.motor.position.set(boatX, 0, boatZ - 3.5);
			patrolBoat.hull.rotation.y = boatAngle * 0.3;
		}

		// Update alligator movement
		if (alligator && alligator.body) {
			alligatorAngle += delta * 0.3;
			var allegX = Math.sin(alligatorAngle * 0.4) * 30 + 20;
			var allegZ = Math.cos(alligatorAngle * 0.35) * 25 + 15;
			alligator.body.position.set(allegX, -0.2, allegZ);
			alligator.head.position.set(allegX, -0.1, allegZ + 3);
			alligator.body.rotation.y = alligatorAngle * 0.4;
		}

		// Update fog drifting
		if (fog) {
			fog.position.x = Math.sin(waterWaveTime * 0.3) * 20;
			fog.position.z = Math.cos(waterWaveTime * 0.25) * 15;
		}

		// Update firefly glow and position
		fireflies.forEach(function(ff) {
			fireflyClock += delta;
			var glow = Math.sin(fireflyClock * 3 + ff.phase) * 0.3 + 0.5;
			ff.mesh.material.opacity = glow;
			ff.mesh.position.y = ff.baseY + Math.sin(fireflyClock * 2 + ff.phase) * 2;
			ff.mesh.position.x = ff.baseX + Math.sin(fireflyClock * 0.8 + ff.phase) * 3;
		});

		// Update Spanish moss swaying
		mossSway += delta * 0.8;
		spanishMoss.forEach(function(moss) {
			moss.parts.forEach(function(part, idx) {
				part.rotation.z = Math.sin(mossSway + idx * 0.5) * 0.1;
			});
		});

		// Update shack subtle oscillation
		if (shack) {
			shackSway += delta * 0.5;
			shack.rotation.z = Math.sin(shackSway) * 0.02;
			shack.rotation.x = Math.cos(shackSway * 0.7) * 0.015;
		}

		// Update water surface wave ripples
		if (waterSurface) {
			waterWaveTime += delta;
			waterSurface.position.y = -2 + Math.sin(waterWaveTime * 2) * 0.15;
		}

		// Update lily pads bobbing
		lilyPads.forEach(function(lp) {
			lilyPadBob += delta * 0.6;
			lp.mesh.position.y = lp.baseY + Math.sin(lilyPadBob + lp.phase) * 0.3;
		});

		// Update trap net sinking and rising
		if (trapNet) {
			trapNetBob += delta * 0.4;
			trapNet.position.y = Math.sin(trapNetBob) * 1.5;
		}
	}

	function reset() {
		// Remove all meshes from scene
		meshes.forEach(function(mesh) {
			scene.remove(mesh);
			if (mesh.geometry) {
				mesh.geometry.dispose();
			}
			if (mesh.material) {
				if (Array.isArray(mesh.material)) {
					mesh.material.forEach(function(m) { m.dispose(); });
				} else {
					mesh.material.dispose();
				}
			}
		});

		meshes = [];
		fireflies = [];
		spanishMoss = [];
		lilyPads = [];

		// Reset animation state
		boatDirection = 1;
		boatAngle = 0;
		alligatorDirection = 1;
		alligatorAngle = 0;
		fireflyClock = 0;
		waterWaveTime = 0;
		mossSway = 0;
		shackSway = 0;
		trapNetBob = 0;
		lilyPadBob = 0;

		patrolBoat = null;
		alligator = null;
		fog = null;
		shack = null;
		waterSurface = null;
		trapNet = null;
	}

	function getSpawnPoints() {
		return spawnPoints;
	}

	return {
		init: init,
		update: update,
		reset: reset,
		getSpawnPoints: getSpawnPoints
	};
}());
