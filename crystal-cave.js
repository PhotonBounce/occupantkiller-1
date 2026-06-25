window.CrystalCave = (function() {
	'use strict';

	var scene, camera;
	var energyCore, coreLight;
	var crystalSpires = [];
	var resonanceLines = [];
	var bioLuminescent = [];
	var animationTime = 0;
	var lakeMaterial;

	var init = function(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		animationTime = 0;

		// Position camera in cave
		camera.position.set(0, 5, 20);
		camera.lookAt(0, 0, 0);

		// Create cave structure
		createCaveWalls();
		createGiantCrystals();
		createCeilingSpires();
		createUndergroundLake();
		createEnergyCore();
		createMiningEquipment();
		createCrystalFragments();
		createBioLuminescentPatches();
		createMiningCamp();
		createCrystalResonance();
		createGeodeChamber();

		// Add ambient light
		var ambientLight = new THREE.AmbientLight(0x4488ff, 0.4);
		scene.add(ambientLight);

		// Add directional light for depth
		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
		directionalLight.position.set(10, 15, 10);
		scene.add(directionalLight);
	};

	var createCaveWalls = function() {
		var wallPositions = [
			{ x: -25, y: 0, z: 0, w: 5, h: 20, d: 40 },
			{ x: 25, y: 0, z: 0, w: 5, h: 20, d: 40 },
			{ x: 0, y: -10, z: 0, w: 50, h: 5, d: 40 },
			{ x: 0, y: 15, z: -20, w: 50, h: 5, d: 20 },
			{ x: 0, y: 0, z: -30, w: 50, h: 20, d: 5 },
			{ x: 0, y: 0, z: 30, w: 50, h: 20, d: 5 }
		];

		for (var i = 0; i < wallPositions.length; i++) {
			var pos = wallPositions[i];
			var geometry = new THREE.BoxGeometry(pos.w, pos.h, pos.d);
			var material = new THREE.MeshPhongMaterial({
				color: 0x4a3a6a,
				emissive: 0x2a1a4a,
				shininess: 30
			});
			var wall = new THREE.Mesh(geometry, material);
			wall.position.set(pos.x, pos.y, pos.z);
			wall.castShadow = true;
			wall.receiveShadow = true;
			scene.add(wall);
		}
	};

	var createGiantCrystals = function() {
		var crystalPositions = [
			{ x: -15, y: -8, z: -10, height: 22, radius: 4, color: 0x6633ff },
			{ x: 12, y: -7, z: 8, height: 25, radius: 3.5, color: 0x3366ff },
			{ x: -8, y: -8, z: 15, height: 20, radius: 3, color: 0x00ccff },
			{ x: 18, y: -6, z: -15, height: 24, radius: 4.2, color: 0x9933ff },
			{ x: -20, y: -8, z: 5, height: 21, radius: 3.8, color: 0x4488ff }
		];

		for (var i = 0; i < crystalPositions.length; i++) {
			var pos = crystalPositions[i];
			var geometry = new THREE.ConeGeometry(pos.radius, pos.height, 8);
			var material = new THREE.MeshPhongMaterial({
				color: pos.color,
				emissive: pos.color,
				emissiveIntensity: 0.3,
				shininess: 100
			});
			var crystal = new THREE.Mesh(geometry, material);
			crystal.position.set(pos.x, pos.y, pos.z);
			crystal.castShadow = true;
			crystal.receiveShadow = true;
			scene.add(crystal);
		}
	};

	var createCeilingSpires = function() {
		var spirePositions = [
			{ x: -12, z: -8, radius: 1.5, height: 12 },
			{ x: 8, z: 10, radius: 1.8, height: 14 },
			{ x: -20, z: 0, radius: 1.3, height: 10 },
			{ x: 15, z: -12, radius: 1.6, height: 13 },
			{ x: -5, z: 20, radius: 1.4, height: 11 }
		];

		for (var i = 0; i < spirePositions.length; i++) {
			var pos = spirePositions[i];
			var geometry = new THREE.ConeGeometry(pos.radius, pos.height, 6);
			var material = new THREE.MeshPhongMaterial({
				color: 0x5544aa,
				emissive: 0x7766cc,
				emissiveIntensity: 0.2
			});
			var spire = new THREE.Mesh(geometry, material);
			spire.position.set(pos.x, 15 - pos.height / 2, pos.z);
			spire.rotation.z = Math.PI;
			spire.castShadow = true;
			scene.add(spire);
			crystalSpires.push(spire);
		}
	};

	var createUndergroundLake = function() {
		var geometry = new THREE.BoxGeometry(30, 0.5, 25);
		lakeMaterial = new THREE.MeshPhongMaterial({
			color: 0x001166,
			emissive: 0x0055ff,
			emissiveIntensity: 0.4,
			shininess: 80
		});
		var lake = new THREE.Mesh(geometry, lakeMaterial);
		lake.position.set(0, -9.5, 0);
		lake.receiveShadow = true;
		scene.add(lake);
	};

	var createEnergyCore = function() {
		// Main energy sphere
		var geometry = new THREE.SphereGeometry(3, 32, 32);
		var material = new THREE.MeshPhongMaterial({
			color: 0xffaa00,
			emissive: 0xff6600,
			emissiveIntensity: 0.6,
			shininess: 100
		});
		energyCore = new THREE.Mesh(geometry, material);
		energyCore.position.set(0, 2, 0);
		energyCore.castShadow = true;
		scene.add(energyCore);

		// Core light
		coreLight = new THREE.PointLight(0xff8800, 1.5, 30);
		coreLight.position.copy(energyCore.position);
		scene.add(coreLight);

		// Support pillars
		for (var i = 0; i < 4; i++) {
			var angle = (i / 4) * Math.PI * 2;
			var x = Math.cos(angle) * 6;
			var z = Math.sin(angle) * 6;
			var geometry = new THREE.CylinderGeometry(1, 1.2, 8, 8);
			var material = new THREE.MeshPhongMaterial({
				color: 0x6633ff,
				emissive: 0x4411cc
			});
			var pillar = new THREE.Mesh(geometry, material);
			pillar.position.set(x, -3, z);
			pillar.castShadow = true;
			scene.add(pillar);
		}
	};

	var createMiningEquipment = function() {
		// Drill rig 1
		var rig1 = createDrillRig(-12, -7, -15);
		scene.add(rig1);

		// Drill rig 2
		var rig2 = createDrillRig(15, -7, 12);
		scene.add(rig2);

		// Coring tool rails
		for (var i = 0; i < 3; i++) {
			var z = -10 + i * 10;
			var geometry = new THREE.CylinderGeometry(0.4, 0.4, 20, 6);
			var material = new THREE.MeshPhongMaterial({
				color: 0x666666,
				emissive: 0x444444
			});
			var rail = new THREE.Mesh(geometry, material);
			rail.position.set(0, -6, z);
			rail.rotation.z = Math.PI / 2;
			rail.castShadow = true;
			scene.add(rail);
		}
	};

	var createDrillRig = function(x, y, z) {
		var group = new THREE.Group();

		// Base platform
		var baseGeo = new THREE.BoxGeometry(4, 1, 4);
		var baseMat = new THREE.MeshPhongMaterial({
			color: 0x555555,
			emissive: 0x333333
		});
		var base = new THREE.Mesh(baseGeo, baseMat);
		base.position.y = y;
		base.castShadow = true;
		group.add(base);

		// Drill tower
		var towerGeo = new THREE.BoxGeometry(1.5, 6, 1.5);
		var towerMat = new THREE.MeshPhongMaterial({
			color: 0x555555,
			emissive: 0x222222
		});
		var tower = new THREE.Mesh(towerGeo, towerMat);
		tower.position.y = y + 4;
		tower.castShadow = true;
		group.add(tower);

		// Drill bit
		var bitGeo = new THREE.ConeGeometry(0.8, 2, 6);
		var bitMat = new THREE.MeshPhongMaterial({
			color: 0x666666,
			emissive: 0x444444
		});
		var bit = new THREE.Mesh(bitGeo, bitMat);
		bit.position.y = y + 1;
		bit.castShadow = true;
		group.add(bit);

		group.position.set(x, 0, z);
		return group;
	};

	var createCrystalFragments = function() {
		var fragmentCount = 25;
		for (var i = 0; i < fragmentCount; i++) {
			var x = (Math.random() - 0.5) * 40;
			var z = (Math.random() - 0.5) * 35;
			var size = 0.4 + Math.random() * 0.6;

			var geometry = new THREE.ConeGeometry(size * 0.3, size, 5);
			var colors = [0x6633ff, 0x3366ff, 0x00ccff, 0x9933ff];
			var color = colors[Math.floor(Math.random() * colors.length)];
			var material = new THREE.MeshPhongMaterial({
				color: color,
				emissive: color,
				emissiveIntensity: 0.2
			});
			var fragment = new THREE.Mesh(geometry, material);
			fragment.position.set(x, -9, z);
			fragment.rotation.x = Math.random() * Math.PI;
			fragment.rotation.y = Math.random() * Math.PI;
			fragment.rotation.z = Math.random() * Math.PI;
			fragment.castShadow = true;
			scene.add(fragment);
		}
	};

	var createBioLuminescentPatches = function() {
		var patchPositions = [
			{ x: -22, y: 5, z: -15 },
			{ x: 20, y: 8, z: 10 },
			{ x: -8, y: 12, z: 20 },
			{ x: 15, y: 6, z: -18 },
			{ x: -18, y: 10, z: 5 },
			{ x: 22, y: 7, z: 15 }
		];

		for (var i = 0; i < patchPositions.length; i++) {
			var pos = patchPositions[i];
			var clusterGroup = new THREE.Group();

			// Create cluster of small spheres
			for (var j = 0; j < 5; j++) {
				var offsetX = (Math.random() - 0.5) * 3;
				var offsetY = (Math.random() - 0.5) * 3;
				var offsetZ = (Math.random() - 0.5) * 2;

				var geometry = new THREE.SphereGeometry(0.4, 16, 16);
				var material = new THREE.MeshPhongMaterial({
					color: 0x00ff88,
					emissive: 0x00ff88,
					emissiveIntensity: 0.5
				});
				var sphere = new THREE.Mesh(geometry, material);
				sphere.position.set(offsetX, offsetY, offsetZ);
				clusterGroup.add(sphere);
			}

			clusterGroup.position.set(pos.x, pos.y, pos.z);
			scene.add(clusterGroup);
			bioLuminescent.push(clusterGroup);
		}
	};

	var createMiningCamp = function() {
		var campGroup = new THREE.Group();

		// Supply tents
		for (var i = 0; i < 2; i++) {
			var x = -10 + i * 8;
			var geometry = new THREE.BoxGeometry(3, 3, 2.5);
			var material = new THREE.MeshPhongMaterial({
				color: 0x444455,
				emissive: 0x222233
			});
			var tent = new THREE.Mesh(geometry, material);
			tent.position.set(x, -8, 20);
			tent.castShadow = true;
			campGroup.add(tent);
		}

		// Equipment cases
		for (var i = 0; i < 3; i++) {
			var z = 18 + i * 2;
			var geometry = new THREE.BoxGeometry(2, 1.5, 2);
			var material = new THREE.MeshPhongMaterial({
				color: 0x666644,
				emissive: 0x444422
			});
			var crate = new THREE.Mesh(geometry, material);
			crate.position.set(8, -8.2, z);
			crate.castShadow = true;
			campGroup.add(crate);
		}

		scene.add(campGroup);
	};

	var createCrystalResonance = function() {
		// Energy connections between spires
		var spirePositions = [
			new THREE.Vector3(-12, 15 - 12 / 2, -8),
			new THREE.Vector3(8, 15 - 14 / 2, 10),
			new THREE.Vector3(-20, 15 - 10 / 2, 0),
			new THREE.Vector3(15, 15 - 13 / 2, -12),
			new THREE.Vector3(-5, 15 - 11 / 2, 20)
		];

		for (var i = 0; i < spirePositions.length; i++) {
			var nextIndex = (i + 1) % spirePositions.length;
			var start = spirePositions[i];
			var end = spirePositions[nextIndex];

			var points = [start, end];
			var geometry = new THREE.BufferGeometry().setFromPoints(points);
			var material = new THREE.LineBasicMaterial({
				color: 0x00ffff,
				linewidth: 2,
				emissive: 0x00ffff
			});
			var line = new THREE.LineSegments(geometry, material);
			scene.add(line);
			resonanceLines.push(line);
		}
	};

	var createGeodeChamber = function() {
		// Side chamber entrance
		var entranceGeo = new THREE.BoxGeometry(8, 8, 3);
		var entranceMat = new THREE.MeshPhongMaterial({
			color: 0x4a3a6a,
			emissive: 0x2a1a4a
		});
		var entrance = new THREE.Mesh(entranceGeo, entranceMat);
		entrance.position.set(0, 5, -28);
		scene.add(entrance);

		// Dense crystal array inside chamber
		for (var i = 0; i < 30; i++) {
			var x = (Math.random() - 0.5) * 6;
			var y = -5 + Math.random() * 8;
			var z = -30 + Math.random() * 4;
			var size = 0.5 + Math.random() * 0.8;

			var geometry = new THREE.ConeGeometry(size * 0.2, size, 5);
			var colors = [0x6633ff, 0x3366ff, 0x00ccff];
			var color = colors[Math.floor(Math.random() * colors.length)];
			var material = new THREE.MeshPhongMaterial({
				color: color,
				emissive: color,
				emissiveIntensity: 0.25
			});
			var crystal = new THREE.Mesh(geometry, material);
			crystal.position.set(x, y, z);
			crystal.rotation.x = Math.random() * Math.PI;
			crystal.rotation.y = Math.random() * Math.PI;
			crystal.rotation.z = Math.random() * Math.PI;
			crystal.castShadow = true;
			scene.add(crystal);
		}
	};

	var update = function(delta) {
		animationTime += delta;

		// Pulse energy core
		var pulseScale = 1 + Math.sin(animationTime * 2) * 0.15;
		energyCore.scale.set(pulseScale, pulseScale, pulseScale);

		// Animate core light
		var pulseIntensity = 1.2 + Math.sin(animationTime * 2) * 0.4;
		coreLight.intensity = pulseIntensity;

		// Rotate energy core
		energyCore.rotation.y += delta * 0.3;
		energyCore.rotation.x += delta * 0.15;

		// Animate lake shimmer
		var lakeEmissive = 0.3 + Math.sin(animationTime * 1.5) * 0.2;
		lakeMaterial.emissiveIntensity = lakeEmissive;

		// Animate bioluminescent flicker
		for (var i = 0; i < bioLuminescent.length; i++) {
			var patch = bioLuminescent[i];
			var flicker = 0.4 + Math.sin(animationTime * 2.5 + i) * 0.3;
			patch.children[0].material.emissiveIntensity = flicker;
		}

		// Animate crystal resonance glow
		for (var i = 0; i < resonanceLines.length; i++) {
			var line = resonanceLines[i];
			var glow = 0.3 + Math.sin(animationTime * 1.8 + i * 0.5) * 0.5;
			line.material.linewidth = 1 + glow * 2;
		}

		// Rotate ceiling spires slowly
		for (var i = 0; i < crystalSpires.length; i++) {
			crystalSpires[i].rotation.y += delta * 0.1;
		}
	};

	var reset = function() {
		animationTime = 0;
		if (energyCore) {
			energyCore.scale.set(1, 1, 1);
			energyCore.rotation.set(0, 0, 0);
		}
		if (coreLight) {
			coreLight.intensity = 1.5;
		}
	};

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
