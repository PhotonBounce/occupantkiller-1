window.DeepBunker = (function() {
	'use strict';

	var sceneRef = null;
	var cameraRef = null;
	var bunkerMeshes = [];
	var generatorPistons = [];
	var emergencyLights = [];
	var globalTime = 0;

	function addMesh(mesh) {
		bunkerMeshes.push(mesh);
		if (sceneRef) sceneRef.add(mesh);
	}

	function buildWalls() {
		var concreteMat = new THREE.MeshStandardMaterial({
			color: 0x404040,
			metalness: 0.1,
			roughness: 0.8
		});

		var wallGeom = new THREE.BoxGeometry(40, 15, 80);
		var leftWall = new THREE.Mesh(wallGeom, concreteMat);
		leftWall.position.set(-20, 0, 0);
		addMesh(leftWall);

		var rightWall = new THREE.Mesh(wallGeom, concreteMat);
		rightWall.position.set(20, 0, 0);
		addMesh(rightWall);

		var ceilingGeom = new THREE.BoxGeometry(40, 2, 80);
		var ceiling = new THREE.Mesh(ceilingGeom, concreteMat);
		ceiling.position.set(0, 15, 0);
		addMesh(ceiling);

		var floorGeom = new THREE.BoxGeometry(40, 1, 80);
		var floor = new THREE.Mesh(floorGeom, concreteMat);
		floor.position.set(0, -8, 0);
		addMesh(floor);
	}

	function buildPillars() {
		var pillarMat = new THREE.MeshStandardMaterial({
			color: 0x555555,
			metalness: 0.05,
			roughness: 0.85
		});

		var positions = [
			[-10, 0, -20], [-10, 0, 0], [-10, 0, 20],
			[10, 0, -20], [10, 0, 0], [10, 0, 20]
		];

		var i = 0;
		while (i < positions.length) {
			var pillarGeom = new THREE.CylinderGeometry(1.5, 1.5, 20, 8);
			var pillar = new THREE.Mesh(pillarGeom, pillarMat);
			pillar.position.set(positions[i][0], positions[i][1], positions[i][2]);
			addMesh(pillar);
			i = i + 1;
		}
	}

	function buildBlastDoors() {
		var steelMat = new THREE.MeshStandardMaterial({
			color: 0x2a2a2a,
			metalness: 0.9,
			roughness: 0.2
		});

		var doorGeom = new THREE.BoxGeometry(8, 12, 0.8);
		var frontDoor = new THREE.Mesh(doorGeom, steelMat);
		frontDoor.position.set(0, 0, -35);
		addMesh(frontDoor);

		var rearDoor = new THREE.Mesh(doorGeom, steelMat);
		rearDoor.position.set(0, 0, 35);
		addMesh(rearDoor);

		var lockGeom = new THREE.SphereGeometry(0.4, 16, 16);
		var lockMat = new THREE.MeshStandardMaterial({
			color: 0xffaa00,
			metalness: 0.95,
			roughness: 0.1
		});

		var frontLock = new THREE.Mesh(lockGeom, lockMat);
		frontLock.position.set(-2, 0, -35.5);
		addMesh(frontLock);

		var rearLock = new THREE.Mesh(lockGeom, lockMat);
		rearLock.position.set(2, 0, 35.5);
		addMesh(rearLock);
	}

	function buildGenerator() {
		var engineMat = new THREE.MeshStandardMaterial({
			color: 0x1a1a1a,
			metalness: 0.6,
			roughness: 0.3
		});

		var bodyGeom = new THREE.CylinderGeometry(2.5, 2.5, 6, 16);
		var body = new THREE.Mesh(bodyGeom, engineMat);
		body.position.set(-15, -2, 30);
		addMesh(body);

		var pistonPositions = [
			[-2, -2, 30], [0, -2, 30], [2, -2, 30]
		];

		var j = 0;
		while (j < pistonPositions.length) {
			var pistonGeom = new THREE.CylinderGeometry(0.6, 0.6, 4, 8);
			var pistonMat = new THREE.MeshStandardMaterial({
				color: 0x888888,
				metalness: 0.7,
				roughness: 0.2
			});
			var piston = new THREE.Mesh(pistonGeom, pistonMat);
			piston.position.set(pistonPositions[j][0], pistonPositions[j][1], pistonPositions[j][2]);
			piston.userData = {
				baseY: pistonPositions[j][1],
				offset: pistonPositions[j][0] * 0.5
			};
			generatorPistons.push(piston);
			addMesh(piston);
			j = j + 1;
		}
	}

	function buildOperationsRoom() {
		var tableMat = new THREE.MeshStandardMaterial({
			color: 0x3a3a3a,
			metalness: 0.3,
			roughness: 0.6
		});

		var tableGeom = new THREE.BoxGeometry(12, 1, 8);
		var mapTable = new THREE.Mesh(tableGeom, tableMat);
		mapTable.position.set(0, 2, 0);
		addMesh(mapTable);

		var chairGeom = new THREE.BoxGeometry(1, 2, 1);
		var chairMat = new THREE.MeshStandardMaterial({
			color: 0x4a4a4a,
			metalness: 0.2,
			roughness: 0.7
		});

		var chairPositions = [
			[-4, 1, 5], [0, 1, 5], [4, 1, 5], [-6, 1, 0], [6, 1, 0]
		];

		var k = 0;
		while (k < chairPositions.length) {
			var chair = new THREE.Mesh(chairGeom, chairMat);
			chair.position.set(chairPositions[k][0], chairPositions[k][1], chairPositions[k][2]);
			addMesh(chair);
			k = k + 1;
		}
	}

	function buildSleepingQuarters() {
		var frameMat = new THREE.MeshStandardMaterial({
			color: 0x8b7355,
			metalness: 0.4,
			roughness: 0.6
		});

		var bunkPositions = [
			[-12, 0, -15], [-12, 5, -15],
			[-12, 0, -8], [-12, 5, -8],
			[12, 0, -15], [12, 5, -15],
			[12, 0, -8], [12, 5, -8]
		];

		var m = 0;
		while (m < bunkPositions.length) {
			var bunkGeom = new THREE.BoxGeometry(3, 2, 2);
			var bunk = new THREE.Mesh(bunkGeom, frameMat);
			bunk.position.set(bunkPositions[m][0], bunkPositions[m][1], bunkPositions[m][2]);
			addMesh(bunk);
			m = m + 1;
		}
	}

	function buildEmergencyLights() {
		var lightMat = new THREE.MeshStandardMaterial({
			color: 0x333333,
			emissive: 0xff4400,
			emissiveIntensity: 0.5,
			metalness: 0.8,
			roughness: 0.1
		});

		var lightPositions = [
			[-15, 13, -25], [15, 13, -25],
			[-15, 13, 0], [15, 13, 0],
			[-15, 13, 25], [15, 13, 25]
		];

		var n = 0;
		while (n < lightPositions.length) {
			var bulbGeom = new THREE.SphereGeometry(0.5, 8, 8);
			var bulb = new THREE.Mesh(bulbGeom, lightMat);
			bulb.position.set(lightPositions[n][0], lightPositions[n][1], lightPositions[n][2]);
			emergencyLights.push(bulb);
			addMesh(bulb);

			var pointLight = new THREE.PointLight(0xff4400, 1, 20);
			pointLight.position.set(lightPositions[n][0], lightPositions[n][1], lightPositions[n][2]);
			emergencyLights.push(pointLight);
			if (sceneRef) sceneRef.add(pointLight);
			n = n + 1;
		}
	}

	function buildElevatorShaft() {
		var shaftMat = new THREE.MeshStandardMaterial({
			color: 0x2a2a2a,
			metalness: 0.5,
			roughness: 0.4
		});

		var shaftGeom = new THREE.CylinderGeometry(3, 3, 100, 12);
		var shaft = new THREE.Mesh(shaftGeom, shaftMat);
		shaft.position.set(0, -20, 0);
		addMesh(shaft);

		var cabinetGeom = new THREE.BoxGeometry(2, 6, 2);
		var cabinet = new THREE.Mesh(cabinetGeom, shaftMat);
		cabinet.position.set(0, 5, 0);
		addMesh(cabinet);
	}

	function init(scene, camera) {
		sceneRef = scene;
		cameraRef = camera;
		bunkerMeshes = [];
		generatorPistons = [];
		emergencyLights = [];
		globalTime = 0;

		buildWalls();
		buildPillars();
		buildBlastDoors();
		buildOperationsRoom();
		buildSleepingQuarters();
		buildGenerator();
		buildEmergencyLights();
		buildElevatorShaft();
	}

	function update(delta) {
		globalTime = globalTime + delta;

		var pIdx = 0;
		while (pIdx < generatorPistons.length) {
			var wobble = Math.sin(globalTime * 8 + generatorPistons[pIdx].userData.offset) * 0.8;
			generatorPistons[pIdx].position.y = generatorPistons[pIdx].userData.baseY + wobble;
			pIdx = pIdx + 1;
		}

		var lIdx = 0;
		while (lIdx < emergencyLights.length) {
			var item = emergencyLights[lIdx];
			if (item.isLight) {
				var flicker = 0.3 + Math.sin(globalTime * 3 + lIdx * 0.5) * 0.2 + Math.random() * 0.3;
				item.intensity = Math.max(0.1, flicker);
			}
			lIdx = lIdx + 1;
		}
	}

	function reset() {
		var i = 0;
		while (i < bunkerMeshes.length) {
			if (sceneRef) sceneRef.remove(bunkerMeshes[i]);
			i = i + 1;
		}

		var j = 0;
		while (j < emergencyLights.length) {
			var item = emergencyLights[j];
			if (item.isLight && sceneRef) sceneRef.remove(item);
			j = j + 1;
		}

		bunkerMeshes = [];
		generatorPistons = [];
		emergencyLights = [];
		globalTime = 0;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
