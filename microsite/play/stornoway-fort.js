var StornowayFort = (function() {
	'use strict';

	var castleGroup = new THREE.Group();
	var groundsWallGroup = new THREE.Group();
	var harbourPierGroup = new THREE.Group();
	var ferryTerminalGroup = new THREE.Group();
	var airportTowerGroup = new THREE.Group();
	var hangarGroup = new THREE.Group();
	var harbourChainGroup = new THREE.Group();
	var gunBatteryGroup = new THREE.Group();
	var worldX = 1460;
	var worldZ = 1960;

	function buildCastle() {
		var sandstone = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
		var darkStone = new THREE.MeshLambertMaterial({ color: 0x8B8680 });

		var mainKeep = new THREE.BoxGeometry(12, 8, 8);
		var keepMesh = new THREE.Mesh(mainKeep, sandstone);
		keepMesh.position.set(0, 4, 0);
		keepMesh.castShadow = true;
		keepMesh.receiveShadow = true;
		castleGroup.add(keepMesh);

		var cornerPositions = [
			[-5.5, 0, -3.5],
			[5.5, 0, -3.5],
			[-5.5, 0, 3.5],
			[5.5, 0, 3.5]
		];

		var i = 0;
		while (i < cornerPositions.length) {
			var pos = cornerPositions[i];
			var towerGeom = new THREE.CylinderGeometry(1.2, 1.2, 10, 12);
			var towerMesh = new THREE.Mesh(towerGeom, darkStone);
			towerMesh.position.set(pos[0], pos[1] + 5, pos[2]);
			towerMesh.castShadow = true;
			towerMesh.receiveShadow = true;
			castleGroup.add(towerMesh);
			i = i + 1;
		}

		castleGroup.position.set(worldX, 0, worldZ);
		return castleGroup;
	}

	function buildGroundsWall() {
		var stoneGray = new THREE.MeshLambertMaterial({ color: 0x808080 });

		var north = new THREE.BoxGeometry(20, 3, 1);
		var northWall = new THREE.Mesh(north, stoneGray);
		northWall.position.set(0, 1.5, -12);
		northWall.castShadow = true;
		northWall.receiveShadow = true;
		groundsWallGroup.add(northWall);

		var south = new THREE.BoxGeometry(20, 3, 1);
		var southWall = new THREE.Mesh(south, stoneGray);
		southWall.position.set(0, 1.5, 12);
		southWall.castShadow = true;
		southWall.receiveShadow = true;
		groundsWallGroup.add(southWall);

		var east = new THREE.BoxGeometry(1, 3, 24);
		var eastWall = new THREE.Mesh(east, stoneGray);
		eastWall.position.set(10, 1.5, 0);
		eastWall.castShadow = true;
		eastWall.receiveShadow = true;
		groundsWallGroup.add(eastWall);

		groundsWallGroup.position.set(worldX, 0, worldZ);
		return groundsWallGroup;
	}

	function buildHarbourPier() {
		var brickRed = new THREE.MeshLambertMaterial({ color: 0xB22222 });
		var metalGray = new THREE.MeshLambertMaterial({ color: 0x696969 });

		var pierDeck = new THREE.BoxGeometry(25, 2, 6);
		var pierMesh = new THREE.Mesh(pierDeck, brickRed);
		pierMesh.position.set(0, 1, 0);
		pierMesh.castShadow = true;
		pierMesh.receiveShadow = true;
		harbourPierGroup.add(pierMesh);

		var j = 0;
		while (j < 8) {
			var postGeom = new THREE.CylinderGeometry(0.5, 0.5, 3, 12);
			var postMesh = new THREE.Mesh(postGeom, metalGray);
			postMesh.position.set(-10 + (j * 3.5), 0, -2);
			postMesh.castShadow = true;
			postMesh.receiveShadow = true;
			harbourPierGroup.add(postMesh);
			j = j + 1;
		}

		var k = 0;
		while (k < 8) {
			var postGeom2 = new THREE.CylinderGeometry(0.5, 0.5, 3, 12);
			var postMesh2 = new THREE.Mesh(postGeom2, metalGray);
			postMesh2.position.set(-10 + (k * 3.5), 0, 2);
			postMesh2.castShadow = true;
			postMesh2.receiveShadow = true;
			harbourPierGroup.add(postMesh2);
			k = k + 1;
		}

		harbourPierGroup.position.set(worldX - 40, 0, worldZ + 30);
		return harbourPierGroup;
	}

	function buildFerryTerminal() {
		var concrete = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
		var hullBlue = new THREE.MeshLambertMaterial({ color: 0x0047AB });

		var terminal = new THREE.BoxGeometry(18, 6, 12);
		var terminalMesh = new THREE.Mesh(terminal, concrete);
		terminalMesh.position.set(0, 3, 0);
		terminalMesh.castShadow = true;
		terminalMesh.receiveShadow = true;
		ferryTerminalGroup.add(terminalMesh);

		var ferryHull = new THREE.BoxGeometry(20, 5, 8);
		var ferryMesh = new THREE.Mesh(ferryHull, hullBlue);
		ferryMesh.position.set(30, 2.5, 0);
		ferryMesh.castShadow = true;
		ferryMesh.receiveShadow = true;
		ferryTerminalGroup.add(ferryMesh);

		var smokestackGeom = new THREE.CylinderGeometry(1, 1, 6, 12);
		var smokestack = new THREE.Mesh(smokestackGeom, concrete);
		smokestack.position.set(32, 8, 0);
		smokestack.castShadow = true;
		smokestack.receiveShadow = true;
		ferryTerminalGroup.add(smokestack);

		ferryTerminalGroup.position.set(worldX - 80, 0, worldZ + 50);
		return ferryTerminalGroup;
	}

	function buildAirportTower() {
		var towerMetal = new THREE.MeshLambertMaterial({ color: 0x666666 });
		var cabGlass = new THREE.MeshLambertMaterial({ color: 0x87CEEB });

		var towerShaft = new THREE.BoxGeometry(3, 10, 3);
		var shaftMesh = new THREE.Mesh(towerShaft, towerMetal);
		shaftMesh.position.set(0, 5, 0);
		shaftMesh.castShadow = true;
		shaftMesh.receiveShadow = true;
		airportTowerGroup.add(shaftMesh);

		var cabBox = new THREE.BoxGeometry(5, 3, 5);
		var cabMesh = new THREE.Mesh(cabBox, cabGlass);
		cabMesh.position.set(0, 12, 0);
		cabMesh.castShadow = true;
		cabMesh.receiveShadow = true;
		airportTowerGroup.add(cabMesh);

		airportTowerGroup.position.set(worldX + 100, 0, worldZ - 60);
		return airportTowerGroup;
	}

	function buildHangar() {
		var corrugated = new THREE.MeshLambertMaterial({ color: 0x8B8C8C });
		var trimSteel = new THREE.MeshLambertMaterial({ color: 0x505050 });

		var hangarBody = new THREE.BoxGeometry(14, 6, 5);
		var bodyMesh = new THREE.Mesh(hangarBody, corrugated);
		bodyMesh.position.set(0, 3, 0);
		bodyMesh.castShadow = true;
		bodyMesh.receiveShadow = true;
		hangarGroup.add(bodyMesh);

		var endArchGeom = new THREE.CylinderGeometry(3.5, 3.5, 5, 16);
		var endArchMesh = new THREE.Mesh(endArchGeom, corrugated);
		endArchMesh.rotation.z = Math.PI / 2;
		endArchMesh.position.set(-7.5, 3.5, 0);
		endArchMesh.castShadow = true;
		endArchMesh.receiveShadow = true;
		hangarGroup.add(endArchMesh);

		var doorFrame = new THREE.BoxGeometry(6, 4, 0.5);
		var doorMesh = new THREE.Mesh(doorFrame, trimSteel);
		doorMesh.position.set(-6.5, 2, 0);
		hangarGroup.add(doorMesh);

		hangarGroup.position.set(worldX + 80, 0, worldZ - 40);
		return hangarGroup;
	}

	function buildHarbourChain() {
		var metalBright = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });

		var chainMaterial = new THREE.LineBasicMaterial({ color: 0x696969, linewidth: 2 });

		var points = [
			new THREE.Vector3(-40, 2, 0),
			new THREE.Vector3(-20, 1, 0),
			new THREE.Vector3(0, 0.5, 0),
			new THREE.Vector3(20, 1, 0),
			new THREE.Vector3(40, 2, 0)
		];

		var chainGeom = new THREE.BufferGeometry().setFromPoints(points);
		var chainLine = new THREE.LineSegments(chainGeom, chainMaterial);
		harbourChainGroup.add(chainLine);

		var l = 0;
		while (l < 5) {
			var floatGeom = new THREE.CylinderGeometry(1.5, 1.5, 2, 12);
			var floatMesh = new THREE.Mesh(floatGeom, metalBright);
			floatMesh.position.set(-40 + (l * 20), 1, 0);
			floatMesh.castShadow = true;
			floatMesh.receiveShadow = true;
			harbourChainGroup.add(floatMesh);
			l = l + 1;
		}

		harbourChainGroup.position.set(worldX - 50, 0, worldZ + 80);
		return harbourChainGroup;
	}

	function buildGunBattery() {
		var concrete = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
		var gunMetal = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });

		var wall = new THREE.BoxGeometry(16, 2, 2);
		var wallMesh = new THREE.Mesh(wall, concrete);
		wallMesh.position.set(0, 1, 0);
		wallMesh.castShadow = true;
		wallMesh.receiveShadow = true;
		gunBatteryGroup.add(wallMesh);

		var gunPositions = [
			-6,
			0,
			6
		];

		var m = 0;
		while (m < 3) {
			var gunBarrelGeom = new THREE.CylinderGeometry(0.5, 0.5, 8, 12);
			var gunBarrel = new THREE.Mesh(gunBarrelGeom, gunMetal);
			gunBarrel.rotation.z = Math.PI / 6;
			gunBarrel.position.set(gunPositions[m], 2.5, -3);
			gunBarrel.castShadow = true;
			gunBarrel.receiveShadow = true;
			gunBatteryGroup.add(gunBarrel);

			var baseGeom = new THREE.CylinderGeometry(1.5, 1.5, 1, 12);
			var baseMesh = new THREE.Mesh(baseGeom, gunMetal);
			baseMesh.position.set(gunPositions[m], 1.5, 0);
			baseMesh.castShadow = true;
			baseMesh.receiveShadow = true;
			gunBatteryGroup.add(baseMesh);

			m = m + 1;
		}

		gunBatteryGroup.position.set(worldX + 120, 0, worldZ + 100);
		gunBatteryGroup.rotation.y = Math.PI / 4;
		return gunBatteryGroup;
	}

	function initialize() {
		buildCastle();
		buildGroundsWall();
		buildHarbourPier();
		buildFerryTerminal();
		buildAirportTower();
		buildHangar();
		buildHarbourChain();
		buildGunBattery();
	}

	function getScene() {
		var sceneGroup = new THREE.Group();
		sceneGroup.add(castleGroup);
		sceneGroup.add(groundsWallGroup);
		sceneGroup.add(harbourPierGroup);
		sceneGroup.add(ferryTerminalGroup);
		sceneGroup.add(airportTowerGroup);
		sceneGroup.add(hangarGroup);
		sceneGroup.add(harbourChainGroup);
		sceneGroup.add(gunBatteryGroup);
		return sceneGroup;
	}

	initialize();

	return {
		getScene: getScene,
		castleGroup: castleGroup,
		groundsWallGroup: groundsWallGroup,
		harbourPierGroup: harbourPierGroup,
		ferryTerminalGroup: ferryTerminalGroup,
		airportTowerGroup: airportTowerGroup,
		hangarGroup: hangarGroup,
		harbourChainGroup: harbourChainGroup,
		gunBatteryGroup: gunBatteryGroup,
		worldX: worldX,
		worldZ: worldZ
	};
}());
