window.SkullFortress = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var meshes = [];
	var cannonRotations = [];
	var bridgeSwing = 0;
	var tidePulse = 0;

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		meshes = [];
		cannonRotations = [];
		buildFortress();
		buildCaverns();
		buildCannons();
		buildGatehouse();
		buildTreasurevault();
		buildMast();
		buildBridges();
		buildTidepool();
	}

	function buildFortress() {
		var skullGeo = new THREE.SphereGeometry(40, 16, 16);
		var skullMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.8 });
		var skull = new THREE.Mesh(skullGeo, skullMat);
		skull.scale.set(1.2, 1.3, 1);
		skull.position.y = 35;
		scene.add(skull);
		meshes.push(skull);

		var jawGeo = new THREE.BoxGeometry(35, 15, 20);
		var jawMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
		var jaw = new THREE.Mesh(jawGeo, jawMat);
		jaw.position.set(0, 15, 0);
		scene.add(jaw);
		meshes.push(jaw);

		var baseRockGeo = new THREE.ConeGeometry(50, 60, 12);
		var baseRockMat = new THREE.MeshStandardMaterial({ color: 0x3a3a2a, roughness: 0.85 });
		var baseRock = new THREE.Mesh(baseRockGeo, baseRockMat);
		baseRock.position.y = -10;
		scene.add(baseRock);
		meshes.push(baseRock);
	}

	function buildCaverns() {
		var eyeRadiusOuter = 12;
		var eyeRadiusInner = 9;
		var ringHeight = 1.5;
		var ringCount = 6;

		var createEyeSocket = function(offsetX) {
			for (var i = 0; i < ringCount; i++) {
				var ringGeo = new THREE.CylinderGeometry(eyeRadiusOuter, eyeRadiusOuter, ringHeight, 16);
				var ringMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.95, metalness: 0.1 });
				var ring = new THREE.Mesh(ringGeo, ringMat);
				ring.position.set(offsetX, 42 - i * ringHeight, 0);
				ring.rotation.z = Math.PI * 0.1 * Math.random();
				scene.add(ring);
				meshes.push(ring);
			}
			var holeGeo = new THREE.CylinderGeometry(eyeRadiusInner, eyeRadiusInner, ringHeight * ringCount, 8);
			var holeMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x0a0a0a });
			var hole = new THREE.Mesh(holeGeo, holeMat);
			hole.position.set(offsetX, 39, 1);
			scene.add(hole);
			meshes.push(hole);
		};

		createEyeSocket(-15);
		createEyeSocket(15);
	}

	function buildCannons() {
		var createCannon = function(socketX, socketY) {
			var barrelGeo = new THREE.CylinderGeometry(1.5, 1.5, 8, 12);
			var cannonMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.9, roughness: 0.3 });
			var barrel = new THREE.Mesh(barrelGeo, cannonMat);
			barrel.rotation.z = Math.PI * 0.25;
			barrel.position.set(socketX, socketY, -8);
			scene.add(barrel);
			meshes.push(barrel);
			cannonRotations.push(barrel);

			var wheelGeo = new THREE.CylinderGeometry(3, 3, 0.5, 12);
			var wheel = new THREE.Mesh(wheelGeo, cannonMat);
			wheel.rotation.x = Math.PI * 0.5;
			wheel.position.set(socketX, socketY - 4, -8);
			scene.add(wheel);
			meshes.push(wheel);
		};

		createCannon(-15, 38);
		createCannon(15, 38);
		createCannon(-15, 30);
		createCannon(15, 30);
	}

	function buildGatehouse() {
		var gateWidth = 12;
		var gateHeight = 16;
		var gateDepth = 8;

		var gateGeo = new THREE.BoxGeometry(gateWidth, gateHeight, gateDepth);
		var gateMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.8 });
		var gate = new THREE.Mesh(gateGeo, gateMat);
		gate.position.set(0, 10, 25);
		scene.add(gate);
		meshes.push(gate);

		var doorGeo = new THREE.BoxGeometry(gateWidth * 0.8, gateHeight * 0.9, 0.3);
		var doorMat = new THREE.MeshStandardMaterial({ color: 0x1a0a00, metalness: 0.7 });
		var door = new THREE.Mesh(doorGeo, doorMat);
		door.position.set(0, 10, 25.5);
		scene.add(door);
		meshes.push(door);

		var archGeo = new THREE.ConeGeometry(gateWidth * 0.45, gateHeight * 0.4, 8);
		var arch = new THREE.Mesh(archGeo, gateMat);
		arch.position.set(0, 16, 25);
		scene.add(arch);
		meshes.push(arch);
	}

	function buildTreasurevault() {
		var vaultGeo = new THREE.BoxGeometry(8, 8, 8);
		var vaultMat = new THREE.MeshStandardMaterial({ color: 0x3a3a1a, metalness: 0.8, roughness: 0.4 });
		var vault = new THREE.Mesh(vaultGeo, vaultMat);
		vault.position.set(-20, 5, 0);
		scene.add(vault);
		meshes.push(vault);

		var coinGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.2, 8);
		var coinMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1, roughness: 0.2 });
		for (var i = 0; i < 8; i++) {
			var coin = new THREE.Mesh(coinGeo, coinMat);
			coin.position.set(-20 + Math.random() * 4 - 2, 6 + Math.random() * 3, Math.random() * 3 - 1.5);
			coin.rotation.x = Math.random() * Math.PI;
			scene.add(coin);
			meshes.push(coin);
		}
	}

	function buildMast() {
		var mastGeo = new THREE.CylinderGeometry(1, 1, 35, 8);
		var mastMat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.7 });
		var mast = new THREE.Mesh(mastGeo, mastMat);
		mast.position.set(25, 15, 0);
		scene.add(mast);
		meshes.push(mast);

		var flagGeo = new THREE.BoxGeometry(6, 4, 0.2);
		var flagMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, emissive: 0x2a2a2a });
		var flag = new THREE.Mesh(flagGeo, flagMat);
		flag.position.set(25, 28, 0);
		scene.add(flag);
		meshes.push(flag);

		var skullGeo = new THREE.SphereGeometry(1.5, 8, 8);
		var skullMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, emissive: 0x444444 });
		var skulltop = new THREE.Mesh(skullGeo, skullMat);
		skulltop.position.set(25, 32, 0);
		scene.add(skulltop);
		meshes.push(skulltop);
	}

	function buildBridges() {
		var createRopeBridge = function(x1, x2, y, z) {
			var points = [
				new THREE.Vector3(x1, y, z),
				new THREE.Vector3((x1 + x2) * 0.5, y - 2, z),
				new THREE.Vector3(x2, y, z)
			];
			var curve = new THREE.CatmullRomCurve3(points);
			var tubePoints = curve.getPoints(20);

			for (var i = 0; i < tubePoints.length - 1; i++) {
				var lineGeo = new THREE.BufferGeometry().setFromPoints([tubePoints[i], tubePoints[i + 1]]);
				var lineMat = new THREE.LineBasicMaterial({ color: 0x8b6914, linewidth: 3 });
				var line = new THREE.LineSegments(lineGeo, lineMat);
				scene.add(line);
				meshes.push(line);
			}
		};

		createRopeBridge(-20, 20, 15, 5);
		createRopeBridge(-20, 20, 20, -8);
	}

	function buildTidepool() {
		var poolGeo = new THREE.CylinderGeometry(45, 45, 2, 16);
		var poolMat = new THREE.MeshStandardMaterial({ color: 0x1a3a4a, metalness: 0.3, roughness: 0.6 });
		var pool = new THREE.Mesh(poolGeo, poolMat);
		pool.position.y = -30;
		scene.add(pool);
		meshes.push(pool);

		for (var i = 0; i < 12; i++) {
			var debrisGeo = new THREE.SphereGeometry(2 + Math.random() * 2, 6, 6);
			var debrisMat = new THREE.MeshStandardMaterial({ color: 0x0a1a1a, roughness: 0.9 });
			var debris = new THREE.Mesh(debrisGeo, debrisMat);
			var angle = (i / 12) * Math.PI * 2;
			debris.position.set(Math.cos(angle) * 30, -30 + Math.random() * 1, Math.sin(angle) * 30);
			scene.add(debris);
			meshes.push(debris);
		}
	}

	function update(delta) {
		bridgeSwing += delta * 0.5;
		tidePulse += delta * 1.2;

		for (var i = 0; i < cannonRotations.length; i++) {
			cannonRotations[i].rotation.z += delta * 0.3 * Math.sin(bridgeSwing * 0.5 + i);
		}

		if (meshes.length > 0) {
			meshes[0].rotation.y += delta * 0.05;
		}

		var poolMesh = meshes[meshes.length - 13];
		if (poolMesh) {
			poolMesh.position.y = -30 + Math.sin(tidePulse) * 0.3;
		}
	}

	function reset() {
		for (var i = meshes.length - 1; i >= 0; i--) {
			scene.remove(meshes[i]);
		}
		meshes = [];
		cannonRotations = [];
		bridgeSwing = 0;
		tidePulse = 0;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
