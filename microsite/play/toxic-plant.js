window.ToxicPlant = (function() {
	'use strict';

	var scene;
	var camera;
	var toxicGasClouds = [];
	var rotatingFans = [];
	var leakingBarrels = [];
	var drainageBlocks = [];
	var explosionHazards = [];
	var time = 0;

	var colors = {
		metal: 0x555555,
		concrete: 0x888888,
		yellow: 0xFFFF00,
		black: 0x000000,
		green: 0x00FF00,
		darkGreen: 0x00AA00,
		rust: 0xAA4400,
		warning: 0xFF6600,
		hazard: 0xFF0000
	};

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		time = 0;
		toxicGasClouds = [];
		rotatingFans = [];
		leakingBarrels = [];
		drainageBlocks = [];
		explosionHazards = [];

		// Ground plane (large dark concrete)
		var groundGeom = new THREE.BoxGeometry(200, 1, 200);
		var groundMat = new THREE.MeshStandardMaterial({ color: colors.concrete, roughness: 0.8 });
		var ground = new THREE.Mesh(groundGeom, groundMat);
		ground.position.y = -0.5;
		scene.add(ground);

		// Industrial building complex
		buildIndustrialComplex();

		// Cooling towers
		buildCoolingTowers();

		// Toxic barrels
		buildToxicBarrels();

		// Toxic gas clouds
		buildToxicGasClouds();

		// Hazmat warning signs
		buildHazmatSigns();

		// Storage tanks
		buildStorageTanks();

		// Drainage channels
		buildDrainageChannels();

		// Explosion hazard zones
		buildExplosionHazards();

		// Chain-link fence perimeter
		buildFencePerimeter();

		// Pipework
		buildPipework();

		// Add ambient lighting
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		scene.add(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(50, 50, 50);
		scene.add(directionalLight);
	}

	function buildIndustrialComplex() {
		// Main processing building - tall structure
		var mainBuildGeom = new THREE.BoxGeometry(40, 35, 50);
		var buildMat = new THREE.MeshStandardMaterial({ color: colors.metal, roughness: 0.6 });
		var mainBuilding = new THREE.Mesh(mainBuildGeom, buildMat);
		mainBuilding.position.set(0, 17.5, 0);
		mainBuilding.castShadow = true;
		scene.add(mainBuilding);

		// Secondary building - connected structure
		var secondBuildGeom = new THREE.BoxGeometry(30, 25, 35);
		var secondBuilding = new THREE.Mesh(secondBuildGeom, buildMat);
		secondBuilding.position.set(45, 12.5, -20);
		secondBuilding.castShadow = true;
		scene.add(secondBuilding);

		// Reactor containment structure (cylindrical)
		var reactorGeom = new THREE.CylinderGeometry(15, 15, 28, 16);
		var reactorMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7 });
		var reactor = new THREE.Mesh(reactorGeom, reactorMat);
		reactor.position.set(-35, 14, 25);
		reactor.castShadow = true;
		scene.add(reactor);

		// Small control building
		var controlGeom = new THREE.BoxGeometry(15, 10, 15);
		var controlBuilding = new THREE.Mesh(controlGeom, buildMat);
		controlBuilding.position.set(-20, 5, -40);
		controlBuilding.castShadow = true;
		scene.add(controlBuilding);

		// Generator shed
		var genGeom = new THREE.BoxGeometry(20, 8, 20);
		var genBuilding = new THREE.Mesh(genGeom, buildMat);
		genBuilding.position.set(50, 4, 40);
		genBuilding.castShadow = true;
		scene.add(genBuilding);
	}

	function buildCoolingTowers() {
		var positions = [
			[-50, 0, -30],
			[-50, 0, 0],
			[-50, 0, 30],
			[60, 0, -40]
		];

		positions.forEach(function(pos) {
			// Outer shell
			var outerGeom = new THREE.CylinderGeometry(12, 13, 40, 20);
			var towerMat = new THREE.MeshStandardMaterial({ color: colors.concrete, roughness: 0.8 });
			var outerTower = new THREE.Mesh(outerGeom, towerMat);
			outerTower.position.set(pos[0], pos[1] + 20, pos[2]);
			outerTower.castShadow = true;
			scene.add(outerTower);

			// Inner shell (hollow effect)
			var innerGeom = new THREE.CylinderGeometry(9, 10, 38, 20);
			var innerMat = new THREE.MeshStandardMaterial({
				color: 0x222222,
				roughness: 0.9,
				side: THREE.BackSide
			});
			var innerTower = new THREE.Mesh(innerGeom, innerMat);
			innerTower.position.set(pos[0], pos[1] + 20, pos[2]);
			scene.add(innerTower);

			// Rotating fan blades
			var fanGeom = new THREE.CylinderGeometry(8, 8, 1, 8);
			var fanMat = new THREE.MeshStandardMaterial({ color: colors.metal, metalness: 0.8 });
			var fan = new THREE.Mesh(fanGeom, fanMat);
			fan.position.set(pos[0], pos[1] + 38, pos[2]);
			scene.add(fan);
			rotatingFans.push({ mesh: fan, speed: 0.02 + Math.random() * 0.02 });
		});
	}

	function buildToxicBarrels() {
		var clusterPositions = [
			[25, 0, -50],
			[-30, 0, -10],
			[70, 0, 20],
			[-60, 0, 40]
		];

		clusterPositions.forEach(function(clusterPos) {
			for (var i = 0; i < 6; i++) {
				var barrelGeom = new THREE.CylinderGeometry(2, 2, 4, 8);
				var barrelMat = new THREE.MeshStandardMaterial({
					color: colors.rust,
					roughness: 0.5,
					metalness: 0.6
				});
				var barrel = new THREE.Mesh(barrelGeom, barrelMat);

				var offsetX = (i % 2) * 4 - 2;
				var offsetZ = (i % 3) * 4 - 4;
				var stackLevel = Math.floor(i / 3) * 4.5;

				barrel.position.set(
					clusterPos[0] + offsetX,
					clusterPos[1] + 2 + stackLevel,
					clusterPos[2] + offsetZ
				);
				barrel.castShadow = true;
				scene.add(barrel);
				leakingBarrels.push({ mesh: barrel, leakPhase: Math.random() * Math.PI * 2 });
			}
		});
	}

	function buildToxicGasClouds() {
		var cloudPositions = [
			{ pos: [30, 8, -45], scale: 1.2 },
			{ pos: [-25, 6, 5], scale: 0.9 },
			{ pos: [65, 5, 30], scale: 1.1 },
			{ pos: [-55, 7, 35], scale: 1.0 }
		];

		cloudPositions.forEach(function(cloudData) {
			for (var i = 0; i < 5; i++) {
				var sphereGeom = new THREE.SphereGeometry(3 + Math.random() * 2, 8, 8);
				var sphereMat = new THREE.MeshBasicMaterial({
					color: colors.darkGreen,
					transparent: true,
					opacity: 0.4
				});
				var sphere = new THREE.Mesh(sphereGeom, sphereMat);

				var offsetX = (Math.random() - 0.5) * 8;
				var offsetY = (Math.random() - 0.5) * 6;
				var offsetZ = (Math.random() - 0.5) * 8;

				sphere.position.set(
					cloudData.pos[0] + offsetX,
					cloudData.pos[1] + offsetY,
					cloudData.pos[2] + offsetZ
				);
				sphere.scale.set(cloudData.scale, cloudData.scale, cloudData.scale);
				scene.add(sphere);

				toxicGasClouds.push({
					mesh: sphere,
					basePos: new THREE.Vector3(sphere.position.x, sphere.position.y, sphere.position.z),
					driftSpeed: 0.005 + Math.random() * 0.01,
					expandSpeed: 0.002,
					maxScale: cloudData.scale * 1.5
				});
			}
		});
	}

	function buildHazmatSigns() {
		var signPositions = [
			[-45, 22, -25],
			[30, 20, -55],
			[55, 15, 35],
			[-65, 12, 45]
		];

		signPositions.forEach(function(pos) {
			var signGeom = new THREE.BoxGeometry(8, 8, 0.5);
			var signMat = new THREE.MeshStandardMaterial({ color: colors.yellow, roughness: 0.3 });
			var signMesh = new THREE.Mesh(signGeom, signMat);
			signMesh.position.set(pos[0], pos[1], pos[2]);
			signMesh.rotation.y = Math.random() * Math.PI * 2;
			scene.add(signMesh);

			// Black warning stripe
			var stripeGeom = new THREE.BoxGeometry(2, 8, 0.6);
			var stripeMat = new THREE.MeshStandardMaterial({ color: colors.black });
			var stripe = new THREE.Mesh(stripeGeom, stripeMat);
			stripe.position.set(pos[0], pos[1], pos[2] + 0.3);
			scene.add(stripe);
		});
	}

	function buildStorageTanks() {
		var tankPositions = [
			[-80, 0, 0],
			[80, 0, -50]
		];

		tankPositions.forEach(function(pos) {
			// Large spherical tank
			var tankGeom = new THREE.SphereGeometry(18, 12, 12);
			var tankMat = new THREE.MeshStandardMaterial({
				color: 0x666666,
				roughness: 0.6,
				metalness: 0.5
			});
			var tank = new THREE.Mesh(tankGeom, tankMat);
			tank.position.set(pos[0], 18, pos[1]);
			tank.castShadow = true;
			scene.add(tank);

			// Catwalk railing (LineSegments)
			var railGeom = new THREE.BufferGeometry();
			var railVertices = new Float32Array([
				-16, 22, -16,  16, 22, -16,
				16, 22, -16,   16, 22,  16,
				16, 22,  16,  -16, 22,  16,
				-16, 22,  16, -16, 22, -16
			]);
			railGeom.setAttribute('position', new THREE.BufferAttribute(railVertices, 3));
			var railMat = new THREE.LineBasicMaterial({ color: 0xCCCCCC, linewidth: 2 });
			var rail = new THREE.LineSegments(railGeom, railMat);
			rail.position.set(pos[0], 0, pos[1]);
			scene.add(rail);

			// Internal support pillars
			for (var i = 0; i < 4; i++) {
				var angle = (i / 4) * Math.PI * 2;
				var pillarGeom = new THREE.CylinderGeometry(1.5, 1.5, 20, 6);
				var pillarMat = new THREE.MeshStandardMaterial({ color: colors.metal });
				var pillar = new THREE.Mesh(pillarGeom, pillarMat);
				pillar.position.set(
					pos[0] + Math.cos(angle) * 14,
					10,
					pos[1] + Math.sin(angle) * 14
				);
				scene.add(pillar);
			}
		});
	}

	function buildDrainageChannels() {
		var channelPaths = [
			{ start: [-70, 0.5, -20], end: [70, 0.5, -20], width: 3 },
			{ start: [-30, 0.5, -70], end: [-30, 0.5, 70], width: 2.5 }
		];

		channelPaths.forEach(function(path) {
			var dx = path.end[0] - path.start[0];
			var dz = path.end[2] - path.start[2];
			var length = Math.sqrt(dx*dx + dz*dz);
			var midX = (path.start[0] + path.end[0]) / 2;
			var midZ = (path.start[2] + path.end[2]) / 2;
			var angle = Math.atan2(dz, dx);

			// Channel base
			var baseGeom = new THREE.BoxGeometry(length, 1, path.width);
			var baseMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });
			var base = new THREE.Mesh(baseGeom, baseMat);
			base.position.set(midX, 0.5, midZ);
			base.rotation.y = angle;
			scene.add(base);

			// Animated liquid blocks
			var blockCount = Math.floor(length / 5);
			for (var i = 0; i < blockCount; i++) {
				var blockGeom = new THREE.BoxGeometry(4, 0.3, path.width - 0.5);
				var blockMat = new THREE.MeshBasicMaterial({
					color: colors.darkGreen,
					transparent: true,
					opacity: 0.6
				});
				var block = new THREE.Mesh(blockGeom, blockMat);
				var t = i / blockCount;
				block.position.set(
					path.start[0] + (path.end[0] - path.start[0]) * t,
					1,
					path.start[2] + (path.end[2] - path.start[2]) * t
				);
				scene.add(block);
				drainageBlocks.push({
					mesh: block,
					baseY: 1,
					phase: Math.random() * Math.PI * 2,
					speed: 0.05 + Math.random() * 0.03
				});
			}
		});
	}

	function buildExplosionHazards() {
		var hazardPositions = [
			[40, 5, 10],
			[-40, 6, -30],
			[10, 4, 50]
		];

		hazardPositions.forEach(function(pos) {
			// Hazard zone marker
			var hazardGeom = new THREE.CylinderGeometry(8, 8, 0.2, 16);
			var hazardMat = new THREE.MeshStandardMaterial({
				color: colors.hazard,
				emissive: colors.warning,
				emissiveIntensity: 0.3
			});
			var hazardZone = new THREE.Mesh(hazardGeom, hazardMat);
			hazardZone.position.set(pos[0], pos[1], pos[2]);
			scene.add(hazardZone);

			// Flickering light
			var light = new THREE.PointLight(colors.hazard, 0.5, 30);
			light.position.set(pos[0], pos[1] + 8, pos[2]);
			scene.add(light);
			explosionHazards.push({
				light: light,
				baseIntensity: 0.5,
				flickerSpeed: 0.15 + Math.random() * 0.1,
				phase: Math.random() * Math.PI * 2
			});
		});
	}

	function buildFencePerimeter() {
		var fenceRadius = 95;
		var segmentCount = 32;
		var fenceHeight = 4;

		var vertices = [];
		for (var i = 0; i < segmentCount; i++) {
			var angle = (i / segmentCount) * Math.PI * 2;
			var nextAngle = ((i + 1) / segmentCount) * Math.PI * 2;

			var x1 = Math.cos(angle) * fenceRadius;
			var z1 = Math.sin(angle) * fenceRadius;
			var x2 = Math.cos(nextAngle) * fenceRadius;
			var z2 = Math.sin(nextAngle) * fenceRadius;

			// Horizontal segments
			vertices.push(x1, 0, z1, x2, 0, z2);
			vertices.push(x1, fenceHeight, z1, x2, fenceHeight, z2);

			// Vertical segments
			vertices.push(x1, 0, z1, x1, fenceHeight, z1);
		}

		var fenceGeom = new THREE.BufferGeometry();
		fenceGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
		var fenceMat = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 1 });
		var fence = new THREE.LineSegments(fenceGeom, fenceMat);
		scene.add(fence);
	}

	function buildPipework() {
		var pipes = [
			// Horizontal connectors
			{ start: [-10, 25, 0], end: [10, 25, 0], radius: 1.5 },
			{ start: [0, 25, -15], end: [0, 25, 15], radius: 1.2 },
			{ start: [-30, 20, 0], end: [30, 20, 0], radius: 1.8 },
			// Vertical risers
			{ start: [-20, 5, 10], end: [-20, 30, 10], radius: 1.2 },
			{ start: [20, 5, -10], end: [20, 30, -10], radius: 1.4 }
		];

		pipes.forEach(function(pipe) {
			var dx = pipe.end[0] - pipe.start[0];
			var dy = pipe.end[1] - pipe.start[1];
			var dz = pipe.end[2] - pipe.start[2];
			var length = Math.sqrt(dx*dx + dy*dy + dz*dz);

			var pipeGeom = new THREE.CylinderGeometry(pipe.radius, pipe.radius, length, 8);
			var pipeMat = new THREE.MeshStandardMaterial({
				color: 0x444444,
				roughness: 0.4,
				metalness: 0.8
			});
			var pipeMesh = new THREE.Mesh(pipeGeom, pipeMat);

			pipeMesh.position.set(
				(pipe.start[0] + pipe.end[0]) / 2,
				(pipe.start[1] + pipe.end[1]) / 2,
				(pipe.start[2] + pipe.end[2]) / 2
			);

			var axis = new THREE.Vector3(dz, 0, -dx).normalize();
			var upVector = new THREE.Vector3(0, 1, 0);
			var quaternion = new THREE.Quaternion();
			quaternion.setFromUnitVectors(upVector, new THREE.Vector3(dx, dy, dz).normalize());
			pipeMesh.quaternion.copy(quaternion);

			pipeMesh.castShadow = true;
			scene.add(pipeMesh);
		});
	}

	function update(delta) {
		time += delta;

		// Animate rotating fans
		rotatingFans.forEach(function(fanData) {
			fanData.mesh.rotation.y += fanData.speed;
		});

		// Animate toxic gas clouds
		toxicGasClouds.forEach(function(cloudData) {
			var t = time * cloudData.driftSpeed;
			cloudData.mesh.position.x = cloudData.basePos.x + Math.sin(t) * 5;
			cloudData.mesh.position.y = cloudData.basePos.y + Math.cos(t * 0.7) * 3;
			cloudData.mesh.position.z = cloudData.basePos.z + Math.cos(t * 0.5) * 5;

			var currentScale = cloudData.mesh.scale.x + cloudData.expandSpeed;
			if (currentScale > cloudData.maxScale) {
				currentScale = cloudData.scale;
			}
			cloudData.mesh.scale.set(currentScale, currentScale, currentScale);
		});

		// Animate leaking barrel drips
		leakingBarrels.forEach(function(barrelData) {
			barrelData.leakPhase += 0.03;
		});

		// Animate drainage channel liquid
		drainageBlocks.forEach(function(drainData) {
			drainData.phase += drainData.speed;
			var yOffset = Math.sin(drainData.phase) * 0.2;
			drainData.mesh.position.y = drainData.baseY + yOffset;
		});

		// Animate explosion hazard lights
		explosionHazards.forEach(function(hazardData) {
			hazardData.phase += hazardData.flickerSpeed;
			var flicker = Math.abs(Math.sin(hazardData.phase)) * 0.8;
			hazardData.light.intensity = hazardData.baseIntensity * (0.3 + flicker);
		});
	}

	function reset() {
		time = 0;
		toxicGasClouds.forEach(function(cloudData) {
			cloudData.mesh.scale.set(cloudData.scale, cloudData.scale, cloudData.scale);
		});
		rotatingFans.forEach(function(fanData) {
			fanData.mesh.rotation.y = 0;
		});
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
