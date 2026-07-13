window.WreckYard = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var objects = [];
	var lights = [];
	var animatedParts = {};

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		lights = [];
		animatedParts = {};

		buildGround();
		buildPerimeterWalls();
		buildTankPiles();
		buildArmoredVehicles();
		buildCrusherMachine();
		buildSalvageCranes();
		buildKennel();
		buildBlackMarketCorner();
		buildDebrisField();
		buildLights();
	}

	function buildGround() {
		var groundGeo = new THREE.BoxGeometry(200, 1, 200);
		var groundMat = new THREE.MeshLambertMaterial({ color: 0x4a4a3a });
		var ground = new THREE.Mesh(groundGeo, groundMat);
		ground.position.y = -1;
		scene.add(ground);
		objects.push(ground);

		var oilStain1 = new THREE.BoxGeometry(40, 0.05, 35);
		var oilMat = new THREE.MeshLambertMaterial({ color: 0x1a1a0f });
		var stain1 = new THREE.Mesh(oilStain1, oilMat);
		stain1.position.set(-30, 0.1, -40);
		scene.add(stain1);
		objects.push(stain1);

		var oilStain2 = new THREE.BoxGeometry(50, 0.05, 30);
		var stain2 = new THREE.Mesh(oilStain2, oilMat);
		stain2.position.set(50, 0.1, 20);
		scene.add(stain2);
		objects.push(stain2);

		var oilStain3 = new THREE.BoxGeometry(35, 0.05, 40);
		var stain3 = new THREE.Mesh(oilStain3, oilMat);
		stain3.position.set(20, 0.1, -60);
		scene.add(stain3);
		objects.push(stain3);
	}

	function buildPerimeterWalls() {
		var wallMat = new THREE.MeshLambertMaterial({ color: 0x6b5d4f });

		var wallNorth = new THREE.BoxGeometry(200, 8, 2);
		var wall1 = new THREE.Mesh(wallNorth, wallMat);
		wall1.position.set(0, 4, -95);
		scene.add(wall1);
		objects.push(wall1);

		var wallSouth = new THREE.BoxGeometry(200, 8, 2);
		var wall2 = new THREE.Mesh(wallSouth, wallMat);
		wall2.position.set(0, 4, 95);
		scene.add(wall2);
		objects.push(wall2);

		var wallEast = new THREE.BoxGeometry(2, 8, 200);
		var wall3 = new THREE.Mesh(wallEast, wallMat);
		wall3.position.set(95, 4, 0);
		scene.add(wall3);
		objects.push(wall3);

		var wallWest = new THREE.BoxGeometry(2, 8, 200);
		var wall4 = new THREE.Mesh(wallWest, wallMat);
		wall4.position.set(-95, 4, 0);
		scene.add(wall4);
		objects.push(wall4);

		var wallCorner1 = new THREE.BoxGeometry(12, 10, 2);
		var corner1 = new THREE.Mesh(wallCorner1, wallMat);
		corner1.position.set(85, 5, -85);
		scene.add(corner1);
		objects.push(corner1);

		var wallCorner2 = new THREE.BoxGeometry(12, 10, 2);
		var corner2 = new THREE.Mesh(wallCorner2, wallMat);
		corner2.position.set(-85, 5, -85);
		scene.add(corner2);
		objects.push(corner2);

		var wallCorner3 = new THREE.BoxGeometry(12, 10, 2);
		var corner3 = new THREE.Mesh(wallCorner3, wallMat);
		corner3.position.set(85, 5, 85);
		scene.add(corner3);
		objects.push(corner3);

		var wallCorner4 = new THREE.BoxGeometry(12, 10, 2);
		var corner4 = new THREE.Mesh(wallCorner4, wallMat);
		corner4.position.set(-85, 5, 85);
		scene.add(corner4);
		objects.push(corner4);
	}

	function buildTankPiles() {
		var tankMat = new THREE.MeshLambertMaterial({ color: 0x3a3a2a });

		var pile1X = -50;
		var pile1Z = -30;

		var tank1 = new THREE.BoxGeometry(8, 4, 12);
		var tankMesh1 = new THREE.Mesh(tank1, tankMat);
		tankMesh1.position.set(pile1X, 2, pile1Z);
		tankMesh1.rotation.z = 0.2;
		scene.add(tankMesh1);
		objects.push(tankMesh1);

		var tank2 = new THREE.BoxGeometry(8, 4, 12);
		var tankMesh2 = new THREE.Mesh(tank2, tankMat);
		tankMesh2.position.set(pile1X + 3, 6, pile1Z - 2);
		tankMesh2.rotation.z = -0.15;
		scene.add(tankMesh2);
		objects.push(tankMesh2);

		var tank3 = new THREE.BoxGeometry(8, 4, 12);
		var tankMesh3 = new THREE.Mesh(tank3, tankMat);
		tankMesh3.position.set(pile1X - 2, 10, pile1Z + 3);
		tankMesh3.rotation.z = 0.1;
		scene.add(tankMesh3);
		objects.push(tankMesh3);

		var turretGeo = new THREE.CylinderGeometry(2.5, 2.5, 3, 8);
		var turretMat = new THREE.MeshLambertMaterial({ color: 0x2a2a1a });
		var turret1 = new THREE.Mesh(turretGeo, turretMat);
		turret1.position.set(pile1X, 6.5, pile1Z);
		scene.add(turret1);
		objects.push(turret1);

		var pile2X = 40;
		var pile2Z = -40;

		var tank4 = new THREE.BoxGeometry(8, 4, 12);
		var tankMesh4 = new THREE.Mesh(tank4, tankMat);
		tankMesh4.position.set(pile2X, 2, pile2Z);
		tankMesh4.rotation.z = 0.3;
		scene.add(tankMesh4);
		objects.push(tankMesh4);

		var tank5 = new THREE.BoxGeometry(8, 4, 12);
		var tankMesh5 = new THREE.Mesh(tank5, tankMat);
		tankMesh5.position.set(pile2X + 2, 6, pile2Z + 1);
		tankMesh5.rotation.z = -0.2;
		scene.add(tankMesh5);
		objects.push(tankMesh5);

		var tank6 = new THREE.BoxGeometry(8, 4, 12);
		var tankMesh6 = new THREE.Mesh(tank6, tankMat);
		tankMesh6.position.set(pile2X - 3, 10, pile2Z - 2);
		tankMesh6.rotation.z = 0.25;
		scene.add(tankMesh6);
		objects.push(tankMesh6);

		var turret2 = new THREE.Mesh(turretGeo, turretMat);
		turret2.position.set(pile2X, 6.5, pile2Z);
		scene.add(turret2);
		objects.push(turret2);

		var pile3X = -30;
		var pile3Z = 50;

		var tank7 = new THREE.BoxGeometry(8, 4, 12);
		var tankMesh7 = new THREE.Mesh(tank7, tankMat);
		tankMesh7.position.set(pile3X, 2, pile3Z);
		tankMesh7.rotation.z = -0.25;
		scene.add(tankMesh7);
		objects.push(tankMesh7);

		var tank8 = new THREE.BoxGeometry(8, 4, 12);
		var tankMesh8 = new THREE.Mesh(tank8, tankMat);
		tankMesh8.position.set(pile3X - 1, 6, pile3Z + 2);
		tankMesh8.rotation.z = 0.2;
		scene.add(tankMesh8);
		objects.push(tankMesh8);

		var turret3 = new THREE.Mesh(turretGeo, turretMat);
		turret3.position.set(pile3X, 6.5, pile3Z);
		scene.add(turret3);
		objects.push(turret3);
	}

	function buildArmoredVehicles() {
		var apcMat = new THREE.MeshLambertMaterial({ color: 0x5a5a4a });

		var apc1 = new THREE.BoxGeometry(6, 5, 14);
		var apcMesh1 = new THREE.Mesh(apc1, apcMat);
		apcMesh1.position.set(60, 2.5, -60);
		apcMesh1.rotation.y = 0.5;
		scene.add(apcMesh1);
		objects.push(apcMesh1);

		var apc2 = new THREE.BoxGeometry(6, 5, 14);
		var apcMesh2 = new THREE.Mesh(apc2, apcMat);
		apcMesh2.position.set(55, 2.5, -50);
		apcMesh2.rotation.y = -0.3;
		scene.add(apcMesh2);
		objects.push(apcMesh2);

		var apc3 = new THREE.BoxGeometry(6, 5, 14);
		var apcMesh3 = new THREE.Mesh(apc3, apcMat);
		apcMesh3.position.set(70, 2.5, -55);
		apcMesh3.rotation.y = 1.0;
		scene.add(apcMesh3);
		objects.push(apcMesh3);

		var wheelGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.8, 12);
		var wheelMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
		var wheel1 = new THREE.Mesh(wheelGeo, wheelMat);
		wheel1.position.set(60, 1.5, -65);
		wheel1.rotation.z = Math.PI / 2;
		scene.add(wheel1);
		objects.push(wheel1);

		var wheel2 = new THREE.Mesh(wheelGeo, wheelMat);
		wheel2.position.set(60, 1.5, -55);
		wheel2.rotation.z = Math.PI / 2;
		scene.add(wheel2);
		objects.push(wheel2);

		var apc4 = new THREE.BoxGeometry(6, 5, 14);
		var apcMesh4 = new THREE.Mesh(apc4, apcMat);
		apcMesh4.position.set(-60, 2.5, 30);
		apcMesh4.rotation.y = -0.7;
		scene.add(apcMesh4);
		objects.push(apcMesh4);

		var apc5 = new THREE.BoxGeometry(6, 5, 14);
		var apcMesh5 = new THREE.Mesh(apc5, apcMat);
		apcMesh5.position.set(-55, 2.5, 40);
		apcMesh5.rotation.y = 0.4;
		scene.add(apcMesh5);
		objects.push(apcMesh5);
	}

	function buildCrusherMachine() {
		var frameColor = 0x4a4a3a;
		var frameMat = new THREE.MeshLambertMaterial({ color: frameColor });

		var baseX = 0;
		var baseZ = -70;

		var base = new THREE.BoxGeometry(20, 2, 20);
		var baseMesh = new THREE.Mesh(base, frameMat);
		baseMesh.position.set(baseX, 1, baseZ);
		scene.add(baseMesh);
		objects.push(baseMesh);

		var leftColumn = new THREE.BoxGeometry(2, 20, 2);
		var leftCol = new THREE.Mesh(leftColumn, frameMat);
		leftCol.position.set(baseX - 8, 11, baseZ);
		scene.add(leftCol);
		objects.push(leftCol);

		var rightColumn = new THREE.BoxGeometry(2, 20, 2);
		var rightCol = new THREE.Mesh(rightColumn, frameMat);
		rightCol.position.set(baseX + 8, 11, baseZ);
		scene.add(rightCol);
		objects.push(rightCol);

		var topBeam = new THREE.BoxGeometry(18, 2, 2);
		var topBm = new THREE.Mesh(topBeam, frameMat);
		topBm.position.set(baseX, 21, baseZ);
		scene.add(topBm);
		objects.push(topBm);

		var pressPlate = new THREE.BoxGeometry(16, 3, 16);
		var pressMat = new THREE.MeshLambertMaterial({ color: 0x2a2a1a });
		var press = new THREE.Mesh(pressPlate, pressMat);
		press.position.set(baseX, 15, baseZ);
		scene.add(press);
		objects.push(press);
		animatedParts.crusher = press;

		var hydraulic1 = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
		var hydMat = new THREE.MeshLambertMaterial({ color: 0x8a7a6a });
		var hyd1 = new THREE.Mesh(hydraulic1, hydMat);
		hyd1.position.set(baseX - 5, 15, baseZ - 3);
		scene.add(hyd1);
		objects.push(hyd1);

		var hydraulic2 = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
		var hyd2 = new THREE.Mesh(hydraulic2, hydMat);
		hyd2.position.set(baseX + 5, 15, baseZ - 3);
		scene.add(hyd2);
		objects.push(hyd2);
	}

	function buildSalvageCranes() {
		var crane1X = -70;
		var crane1Z = 20;

		var base1 = new THREE.BoxGeometry(4, 2, 4);
		var baseMat = new THREE.MeshLambertMaterial({ color: 0x6a5a4a });
		var craneBase1 = new THREE.Mesh(base1, baseMat);
		craneBase1.position.set(crane1X, 1, crane1Z);
		scene.add(craneBase1);
		objects.push(craneBase1);

		var column1 = new THREE.CylinderGeometry(1, 1, 25, 8);
		var colMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
		var craneCol1 = new THREE.Mesh(column1, colMat);
		craneCol1.position.set(crane1X, 13, crane1Z);
		scene.add(craneCol1);
		objects.push(craneCol1);

		var arm1 = new THREE.BoxGeometry(30, 2, 2);
		var armMat = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
		var craneArm1 = new THREE.Mesh(arm1, armMat);
		craneArm1.position.set(crane1X + 10, 26, crane1Z);
		scene.add(craneArm1);
		objects.push(craneArm1);
		animatedParts.crane1Arm = craneArm1;

		var hook1 = new THREE.SphereGeometry(1, 8, 8);
		var hookMat = new THREE.MeshLambertMaterial({ color: 0x7a6a5a });
		var craneHook1 = new THREE.Mesh(hook1, hookMat);
		craneHook1.position.set(crane1X + 15, 20, crane1Z + 2);
		scene.add(craneHook1);
		objects.push(craneHook1);
		animatedParts.crane1Hook = craneHook1;

		var cable1 = new THREE.LineSegments();
		var cableGeo1 = new THREE.BufferGeometry();
		var cableVerts1 = new Float32Array([
			crane1X + 15, 26, crane1Z,
			crane1X + 15, 20, crane1Z + 2
		]);
		cableGeo1.setAttribute('position', new THREE.BufferAttribute(cableVerts1, 3));
		var cableMat1 = new THREE.LineBasicMaterial({ color: 0x8a7a6a });
		var line1 = new THREE.LineSegments(cableGeo1, cableMat1);
		scene.add(line1);
		objects.push(line1);

		var crane2X = 70;
		var crane2Z = -20;

		var craneBase2 = new THREE.Mesh(base1, baseMat);
		craneBase2.position.set(crane2X, 1, crane2Z);
		scene.add(craneBase2);
		objects.push(craneBase2);

		var craneCol2 = new THREE.Mesh(column1, colMat);
		craneCol2.position.set(crane2X, 13, crane2Z);
		scene.add(craneCol2);
		objects.push(craneCol2);

		var craneArm2 = new THREE.Mesh(arm1, armMat);
		craneArm2.position.set(crane2X - 10, 26, crane2Z);
		scene.add(craneArm2);
		objects.push(craneArm2);
		animatedParts.crane2Arm = craneArm2;

		var craneHook2 = new THREE.Mesh(hook1, hookMat);
		craneHook2.position.set(crane2X - 15, 20, crane2Z - 2);
		scene.add(craneHook2);
		objects.push(craneHook2);
		animatedParts.crane2Hook = craneHook2;
	}

	function buildKennel() {
		var kennelX = -70;
		var kennelZ = -60;

		var kennelFloor = new THREE.BoxGeometry(15, 1, 15);
		var floorMat = new THREE.MeshLambertMaterial({ color: 0x6a6a5a });
		var floor = new THREE.Mesh(kennelFloor, floorMat);
		floor.position.set(kennelX, 0.5, kennelZ);
		scene.add(floor);
		objects.push(floor);

		var fenceGeo = new THREE.BoxGeometry(2, 5, 0.3);
		var fenceMat = new THREE.MeshLambertMaterial({ color: 0x7a6a5a });

		var fence1 = new THREE.Mesh(fenceGeo, fenceMat);
		fence1.position.set(kennelX - 7, 2.5, kennelZ - 7);
		scene.add(fence1);
		objects.push(fence1);

		var fence2 = new THREE.Mesh(fenceGeo, fenceMat);
		fence2.position.set(kennelX + 7, 2.5, kennelZ - 7);
		scene.add(fence2);
		objects.push(fence2);

		var fence3 = new THREE.Mesh(new THREE.BoxGeometry(15, 5, 0.3), fenceMat);
		fence3.position.set(kennelX, 2.5, kennelZ - 7);
		scene.add(fence3);
		objects.push(fence3);

		var fence4 = new THREE.Mesh(new THREE.BoxGeometry(15, 5, 0.3), fenceMat);
		fence4.position.set(kennelX, 2.5, kennelZ + 7);
		scene.add(fence4);
		objects.push(fence4);

		var dogHouse = new THREE.BoxGeometry(6, 4, 6);
		var houseMat = new THREE.MeshLambertMaterial({ color: 0x8a7a6a });
		var house = new THREE.Mesh(dogHouse, houseMat);
		house.position.set(kennelX, 2, kennelZ);
		scene.add(house);
		objects.push(house);

		var roofGeo = new THREE.ConeGeometry(4, 3, 4);
		var roofMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
		var roof = new THREE.Mesh(roofGeo, roofMat);
		roof.position.set(kennelX, 5.5, kennelZ);
		scene.add(roof);
		objects.push(roof);
	}

	function buildBlackMarketCorner() {
		var cornerX = 70;
		var cornerZ = 60;

		var tableGeo = new THREE.BoxGeometry(12, 1, 8);
		var tableMat = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
		var table = new THREE.Mesh(tableGeo, tableMat);
		table.position.set(cornerX, 0.5, cornerZ);
		scene.add(table);
		objects.push(table);

		var legGeo = new THREE.CylinderGeometry(0.4, 0.4, 2, 8);
		var legMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
		var leg1 = new THREE.Mesh(legGeo, legMat);
		leg1.position.set(cornerX - 5, 1, cornerZ - 3);
		scene.add(leg1);
		objects.push(leg1);

		var leg2 = new THREE.Mesh(legGeo, legMat);
		leg2.position.set(cornerX + 5, 1, cornerZ - 3);
		scene.add(leg2);
		objects.push(leg2);

		var leg3 = new THREE.Mesh(legGeo, legMat);
		leg3.position.set(cornerX - 5, 1, cornerZ + 3);
		scene.add(leg3);
		objects.push(leg3);

		var leg4 = new THREE.Mesh(legGeo, legMat);
		leg4.position.set(cornerX + 5, 1, cornerZ + 3);
		scene.add(leg4);
		objects.push(leg4);

		var crateGeo = new THREE.BoxGeometry(4, 4, 4);
		var crateMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
		var crate1 = new THREE.Mesh(crateGeo, crateMat);
		crate1.position.set(cornerX - 8, 2, cornerZ - 6);
		scene.add(crate1);
		objects.push(crate1);

		var crate2 = new THREE.Mesh(crateGeo, crateMat);
		crate2.position.set(cornerX + 8, 2, cornerZ - 6);
		scene.add(crate2);
		objects.push(crate2);

		var crate3 = new THREE.Mesh(crateGeo, crateMat);
		crate3.position.set(cornerX, 2, cornerZ + 8);
		scene.add(crate3);
		objects.push(crate3);

		var weaponBox = new THREE.BoxGeometry(3, 2, 3);
		var weaponMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
		var weapon1 = new THREE.Mesh(weaponBox, weaponMat);
		weapon1.position.set(cornerX - 3, 3, cornerZ + 1);
		scene.add(weapon1);
		objects.push(weapon1);

		var weapon2 = new THREE.Mesh(weaponBox, weaponMat);
		weapon2.position.set(cornerX + 3, 3, cornerZ + 1);
		scene.add(weapon2);
		objects.push(weapon2);

		var searchLightBase = new THREE.CylinderGeometry(1.5, 1.5, 1, 8);
		var searchMat = new THREE.MeshLambertMaterial({ color: 0x7a6a5a });
		var searchBase = new THREE.Mesh(searchLightBase, searchMat);
		searchBase.position.set(cornerX - 10, 0.5, cornerZ - 10);
		scene.add(searchBase);
		objects.push(searchBase);

		var searchLightHead = new THREE.SphereGeometry(1.2, 8, 8);
		var lightHeadMat = new THREE.MeshLambertMaterial({ color: 0x9a8a7a });
		var searchHead = new THREE.Mesh(searchLightHead, lightHeadMat);
		searchHead.position.set(cornerX - 10, 2.5, cornerZ - 10);
		scene.add(searchHead);
		objects.push(searchHead);
		animatedParts.searchLight = searchHead;
	}

	function buildDebrisField() {
		var debrisMat = new THREE.MeshLambertMaterial({ color: 0x6a5a4a });

		var positions = [
			[-40, 1, 20],
			[-20, 1, 60],
			[30, 1, 40],
			[10, 1, -30],
			[50, 1, -20],
			[-60, 1, 10],
			[-10, 1, 70],
			[60, 1, 50],
			[20, 1, 10],
			[-50, 1, -50]
		];

		for (var i = 0; i < positions.length; i++) {
			var debrisGeo = new THREE.BoxGeometry(
				3 + Math.random() * 4,
				1 + Math.random() * 2,
				4 + Math.random() * 5
			);
			var debris = new THREE.Mesh(debrisGeo, debrisMat);
			debris.position.set(positions[i][0], positions[i][1], positions[i][2]);
			debris.rotation.y = Math.random() * Math.PI;
			scene.add(debris);
			objects.push(debris);
		}

		var metalSheetPositions = [
			[0, 0.5, 0],
			[-35, 0.5, -15],
			[45, 0.5, 35],
			[15, 0.5, -70],
			[-70, 0.5, 50]
		];

		var sheetMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });

		for (var j = 0; j < metalSheetPositions.length; j++) {
			var sheetGeo = new THREE.BoxGeometry(8, 0.3, 6);
			var sheet = new THREE.Mesh(sheetGeo, sheetMat);
			sheet.position.set(
				metalSheetPositions[j][0],
				metalSheetPositions[j][1],
				metalSheetPositions[j][2]
			);
			sheet.rotation.z = (Math.random() - 0.5) * 0.3;
			scene.add(sheet);
			objects.push(sheet);
		}
	}

	function buildLights() {
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(50, 60, 50);
		directionalLight.castShadow = true;
		scene.add(directionalLight);
		lights.push(directionalLight);

		var spotLight1 = new THREE.SpotLight(0xffff99, 1.2);
		spotLight1.position.set(70, 25, -10);
		spotLight1.target.position.set(70, 0, -60);
		scene.add(spotLight1);
		scene.add(spotLight1.target);
		lights.push(spotLight1);

		var spotLight2 = new THREE.SpotLight(0xff9999, 1.0);
		spotLight2.position.set(-70, 25, 60);
		spotLight2.target.position.set(-70, 0, 30);
		scene.add(spotLight2);
		scene.add(spotLight2.target);
		lights.push(spotLight2);

		var pointLight1 = new THREE.PointLight(0xffaa44, 0.8);
		pointLight1.position.set(0, 15, -70);
		scene.add(pointLight1);
		lights.push(pointLight1);

		var pointLight2 = new THREE.PointLight(0x44aaff, 0.6);
		pointLight2.position.set(70, 10, 60);
		scene.add(pointLight2);
		lights.push(pointLight2);
	}

	function update(delta) {
		if (animatedParts.crusher) {
			var crusherAmplitude = 2;
			var crusherSpeed = 3;
			animatedParts.crusher.position.y = 15 + Math.sin(Date.now() * 0.001 * crusherSpeed) * crusherAmplitude;
		}

		if (animatedParts.crane1Arm) {
			var armRotation = Math.sin(Date.now() * 0.0005) * 0.3;
			animatedParts.crane1Arm.rotation.z = armRotation;
		}

		if (animatedParts.crane1Hook) {
			var hookOffset = Math.abs(Math.sin(Date.now() * 0.0008)) * 5;
			animatedParts.crane1Hook.position.y = 20 - hookOffset;
		}

		if (animatedParts.crane2Arm) {
			var armRotation2 = Math.sin(Date.now() * 0.0006 + Math.PI) * 0.35;
			animatedParts.crane2Arm.rotation.z = armRotation2;
		}

		if (animatedParts.crane2Hook) {
			var hookOffset2 = Math.abs(Math.cos(Date.now() * 0.0007)) * 6;
			animatedParts.crane2Hook.position.y = 20 - hookOffset2;
		}

		if (animatedParts.searchLight) {
			animatedParts.searchLight.rotation.y = Date.now() * 0.001;
			animatedParts.searchLight.rotation.x = Math.sin(Date.now() * 0.0008) * 0.2;
		}
	}

	function reset() {
		for (var i = 0; i < objects.length; i++) {
			scene.remove(objects[i]);
		}
		objects = [];

		for (var j = 0; j < lights.length; j++) {
			scene.remove(lights[j]);
		}
		lights = [];

		animatedParts = {};
		scene = null;
		camera = null;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
