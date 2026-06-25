window.WarCamp = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var objects = [];
	var lights = [];
	var animationData = {
		flagRotation: 0,
		vehicleBob: [],
		pulleyRotation: 0
	};

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		lights = [];
		animationData = {
			flagRotation: 0,
			vehicleBob: [],
			pulleyRotation: 0
		};

		buildlights();
		buildground();
		buildbarracks();
		buildmesshall();
		buildarmory();
		buildparade();
		buildmotorpool();
		buildhospital();
		buildcommunications();
		buildobstaclecourse();
		buildmemorial();
		buildfences();
		buildstorage();
	}

	function buildlights() {
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(50, 100, 50);
		directionalLight.castShadow = true;
		scene.add(directionalLight);
		lights.push(directionalLight);

		var pointLight1 = new THREE.PointLight(0xffffff, 0.4, 150);
		pointLight1.position.set(-100, 30, 0);
		scene.add(pointLight1);
		lights.push(pointLight1);

		var pointLight2 = new THREE.PointLight(0xffffff, 0.4, 150);
		pointLight2.position.set(100, 30, 0);
		scene.add(pointLight2);
		lights.push(pointLight2);

		var pointLight3 = new THREE.PointLight(0xffff99, 0.5, 100);
		pointLight3.position.set(0, 20, -80);
		scene.add(pointLight3);
		lights.push(pointLight3);
	}

	function buildground() {
		var groundMaterial = new THREE.MeshLambertMaterial({ color: 0x4a7c3d });
		var groundGeometry = new THREE.BoxGeometry(400, 1, 400);
		var ground = new THREE.Mesh(groundGeometry, groundMaterial);
		ground.position.y = -1;
		scene.add(ground);
		objects.push(ground);

		var dirtPath1 = new THREE.BoxGeometry(30, 0.5, 200);
		var dirtMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
		var path1 = new THREE.Mesh(dirtPath1, dirtMaterial);
		path1.position.set(-50, -0.3, 0);
		scene.add(path1);
		objects.push(path1);

		var dirtPath2 = new THREE.BoxGeometry(200, 0.5, 30);
		var path2 = new THREE.Mesh(dirtPath2, dirtMaterial);
		path2.position.set(0, -0.3, 50);
		scene.add(path2);
		objects.push(path2);
	}

	function buildbarracks() {
		var barracksMaterial = new THREE.MeshLambertMaterial({ color: 0xd4a574 });
		var tentPole = new THREE.CylinderGeometry(1, 1, 12, 8);
		var roofGeometry = new THREE.ConeGeometry(8, 6, 4);

		var barracksData = [
			{ x: -80, z: -60 },
			{ x: -80, z: -40 },
			{ x: -80, z: -20 },
			{ x: -80, z: 0 },
			{ x: -80, z: 20 },
			{ x: -60, z: -60 },
			{ x: -60, z: -40 },
			{ x: -60, z: -20 },
			{ x: -60, z: 0 },
			{ x: -60, z: 20 }
		];

		for (var i = 0; i < barracksData.length; i++) {
			var data = barracksData[i];
			var baseGeometry = new THREE.BoxGeometry(15, 8, 20);
			var baseMaterial = new THREE.MeshLambertMaterial({ color: 0xc9a961 });
			var base = new THREE.Mesh(baseGeometry, baseMaterial);
			base.position.set(data.x, 4, data.z);
			scene.add(base);
			objects.push(base);

			var roof = new THREE.Mesh(roofGeometry, barracksMaterial);
			roof.position.set(data.x, 9.5, data.z);
			roof.scale.set(1.2, 0.8, 1.2);
			scene.add(roof);
			objects.push(roof);

			var door = new THREE.BoxGeometry(4, 6, 0.5);
			var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
			var doorMesh = new THREE.Mesh(door, doorMaterial);
			doorMesh.position.set(data.x - 7, 3, data.z + 9.8);
			scene.add(doorMesh);
			objects.push(doorMesh);

			var flagpole = new THREE.CylinderGeometry(0.3, 0.3, 8, 6);
			var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
			var pole = new THREE.Mesh(flagpole, poleMaterial);
			pole.position.set(data.x + 6, 7, data.z - 8);
			scene.add(pole);
			objects.push(pole);

			var flag = new THREE.BoxGeometry(4, 2.5, 0.1);
			var flagMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
			var flagMesh = new THREE.Mesh(flag, flagMaterial);
			flagMesh.position.set(data.x + 8, 7.5, data.z - 8);
			flagMesh.userData.isFlag = true;
			scene.add(flagMesh);
			objects.push(flagMesh);
		}
	}

	function buildmesshall() {
		var mainWall = new THREE.BoxGeometry(40, 10, 50);
		var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x8b6914 });
		var wall = new THREE.Mesh(mainWall, wallMaterial);
		wall.position.set(0, 5, -80);
		scene.add(wall);
		objects.push(wall);

		var roof = new THREE.ConeGeometry(30, 8, 4);
		var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
		var roofMesh = new THREE.Mesh(roof, roofMaterial);
		roofMesh.position.set(0, 12, -80);
		scene.add(roofMesh);
		objects.push(roofMesh);

		var door = new THREE.BoxGeometry(8, 10, 0.5);
		var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x3e2723 });
		var doorMesh = new THREE.Mesh(door, doorMaterial);
		doorMesh.position.set(0, 5, -105);
		scene.add(doorMesh);
		objects.push(doorMesh);

		var window1 = new THREE.BoxGeometry(4, 4, 0.3);
		var windowMaterial = new THREE.MeshLambertMaterial({ color: 0x87ceeb });
		var win1 = new THREE.Mesh(window1, windowMaterial);
		win1.position.set(-15, 7, -104.8);
		scene.add(win1);
		objects.push(win1);

		var win2 = new THREE.Mesh(window1, windowMaterial);
		win2.position.set(15, 7, -104.8);
		scene.add(win2);
		objects.push(win2);

		var chimney = new THREE.CylinderGeometry(2, 2, 15, 8);
		var chimneyMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
		var chimney1 = new THREE.Mesh(chimney, chimneyMaterial);
		chimney1.position.set(-10, 12, -80);
		scene.add(chimney1);
		objects.push(chimney1);

		var chimney2 = new THREE.Mesh(chimney, chimneyMaterial);
		chimney2.position.set(10, 12, -80);
		scene.add(chimney2);
		objects.push(chimney2);
	}

	function buildarmory() {
		var armorySide = new THREE.BoxGeometry(35, 12, 25);
		var armoryMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
		var armory = new THREE.Mesh(armorySide, armoryMaterial);
		armory.position.set(80, 6, -70);
		scene.add(armory);
		objects.push(armory);

		var roofArm = new THREE.BoxGeometry(35, 2, 25);
		var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
		var roofArm1 = new THREE.Mesh(roofArm, roofMaterial);
		roofArm1.position.set(80, 14, -70);
		scene.add(roofArm1);
		objects.push(roofArm1);

		var doorArm = new THREE.BoxGeometry(6, 12, 0.5);
		var doorMaterialArm = new THREE.MeshLambertMaterial({ color: 0x2f4f4f });
		var doorArm1 = new THREE.Mesh(doorArm, doorMaterialArm);
		doorArm1.position.set(80, 6, -82.5);
		scene.add(doorArm1);
		objects.push(doorArm1);

		for (var i = 0; i < 3; i++) {
			var windowArm = new THREE.BoxGeometry(3, 3, 0.3);
			var windowMaterial = new THREE.MeshLambertMaterial({ color: 0x4a90e2 });
			var win = new THREE.Mesh(windowArm, windowMaterial);
			win.position.set(60 + i * 15, 9, -82.3);
			scene.add(win);
			objects.push(win);
		}

		var flagPoleArm = new THREE.CylinderGeometry(0.4, 0.4, 10, 6);
		var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var poleArm = new THREE.Mesh(flagPoleArm, poleMaterial);
		poleArm.position.set(92, 12, -70);
		scene.add(poleArm);
		objects.push(poleArm);
	}

	function buildparade() {
		var flagpole = new THREE.CylinderGeometry(1.5, 1.5, 25, 8);
		var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
		var centerPole = new THREE.Mesh(flagpole, poleMaterial);
		centerPole.position.set(0, 12.5, 80);
		scene.add(centerPole);
		objects.push(centerPole);

		var mainFlag = new THREE.BoxGeometry(8, 5, 0.2);
		var flagMaterial = new THREE.MeshLambertMaterial({ color: 0x0066cc });
		var mainFlagMesh = new THREE.Mesh(mainFlag, flagMaterial);
		mainFlagMesh.position.set(3, 15, 80);
		mainFlagMesh.userData.isMainFlag = true;
		scene.add(mainFlagMesh);
		objects.push(mainFlagMesh);

		var paradeGround = new THREE.BoxGeometry(200, 0.5, 150);
		var groundMat = new THREE.MeshLambertMaterial({ color: 0x6b8e23 });
		var parade = new THREE.Mesh(paradeGround, groundMat);
		parade.position.set(0, 0.25, 80);
		scene.add(parade);
		objects.push(parade);

		for (var i = 0; i < 5; i++) {
			var light = new THREE.CylinderGeometry(0.4, 0.4, 8, 6);
			var lightMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
			var pole = new THREE.Mesh(light, lightMat);
			pole.position.set(-80 + i * 40, 4, 80);
			scene.add(pole);
			objects.push(pole);

			var lamp = new THREE.SphereGeometry(1, 8, 6);
			var lampMat = new THREE.MeshLambertMaterial({ color: 0xffff99 });
			var lampMesh = new THREE.Mesh(lamp, lampMat);
			lampMesh.position.set(-80 + i * 40, 9, 80);
			scene.add(lampMesh);
			objects.push(lampMesh);
		}
	}

	function buildmotorpool() {
		var vehiclePositions = [
			{ x: 40, z: 20, type: 0 },
			{ x: 60, z: 20, type: 1 },
			{ x: 80, z: 20, type: 0 },
			{ x: 40, z: 40, type: 1 },
			{ x: 60, z: 40, type: 0 },
			{ x: 80, z: 40, type: 1 }
		];

		for (var i = 0; i < vehiclePositions.length; i++) {
			var vdata = vehiclePositions[i];
			buildvehicle(vdata.x, 3, vdata.z, vdata.type);
			animationData.vehicleBob.push({
				index: objects.length - 3,
				baseY: 3,
				phase: i * 0.3
			});
		}

		var shed = new THREE.BoxGeometry(50, 8, 40);
		var shedMat = new THREE.MeshLambertMaterial({ color: 0xa0522d });
		var shedMesh = new THREE.Mesh(shed, shedMat);
		shedMesh.position.set(60, 4, -20);
		scene.add(shedMesh);
		objects.push(shedMesh);

		var roofShed = new THREE.BoxGeometry(50, 2, 40);
		var roofMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
		var roofShed1 = new THREE.Mesh(roofShed, roofMat);
		roofShed1.position.set(60, 10, -20);
		scene.add(roofShed1);
		objects.push(roofShed1);
	}

	function buildvehicle(px, py, pz, type) {
		if (type === 0) {
			var body = new THREE.BoxGeometry(8, 4, 12);
			var bodyMat = new THREE.MeshLambertMaterial({ color: 0x2f4f2f });
			var bodyMesh = new THREE.Mesh(body, bodyMat);
			bodyMesh.position.set(px, py + 2, pz);
			scene.add(bodyMesh);
			objects.push(bodyMesh);

			var cabin = new THREE.BoxGeometry(6, 3, 4);
			var cabinMat = new THREE.MeshLambertMaterial({ color: 0x1a3a1a });
			var cabinMesh = new THREE.Mesh(cabin, cabinMat);
			cabinMesh.position.set(px, py + 4.5, pz - 3);
			scene.add(cabinMesh);
			objects.push(cabinMesh);

			var wheel1 = new THREE.CylinderGeometry(1.5, 1.5, 2, 16);
			var wheelMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
			var wheel1a = new THREE.Mesh(wheel1, wheelMat);
			wheel1a.rotation.z = Math.PI / 2;
			wheel1a.position.set(px - 3, py + 1.5, pz - 4);
			scene.add(wheel1a);
			objects.push(wheel1a);

			var wheel2 = new THREE.Mesh(wheel1, wheelMat);
			wheel2.rotation.z = Math.PI / 2;
			wheel2.position.set(px + 3, py + 1.5, pz - 4);
			scene.add(wheel2);
			objects.push(wheel2);

			var wheel3 = new THREE.Mesh(wheel1, wheelMat);
			wheel3.rotation.z = Math.PI / 2;
			wheel3.position.set(px - 3, py + 1.5, pz + 4);
			scene.add(wheel3);
			objects.push(wheel3);

			var wheel4 = new THREE.Mesh(wheel1, wheelMat);
			wheel4.rotation.z = Math.PI / 2;
			wheel4.position.set(px + 3, py + 1.5, pz + 4);
			scene.add(wheel4);
			objects.push(wheel4);
		} else {
			var tankBody = new THREE.BoxGeometry(7, 3, 10);
			var tankMat = new THREE.MeshLambertMaterial({ color: 0x1a4d1a });
			var tankMesh = new THREE.Mesh(tankBody, tankMat);
			tankMesh.position.set(px, py + 2, pz);
			scene.add(tankMesh);
			objects.push(tankMesh);

			var turret = new THREE.CylinderGeometry(2.5, 2.5, 2, 12);
			var turretMat = new THREE.MeshLambertMaterial({ color: 0x0d2d0d });
			var turretMesh = new THREE.Mesh(turret, turretMat);
			turretMesh.position.set(px, py + 3.5, pz);
			scene.add(turretMesh);
			objects.push(turretMesh);

			var gun = new THREE.CylinderGeometry(0.4, 0.4, 6, 8);
			var gunMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
			var gunMesh = new THREE.Mesh(gun, gunMat);
			gunMesh.rotation.z = Math.PI / 2.5;
			gunMesh.position.set(px + 2, py + 4, pz - 1);
			scene.add(gunMesh);
			objects.push(gunMesh);
		}
	}

	function buildhospital() {
		var hospBuilding = new THREE.BoxGeometry(30, 10, 35);
		var hospMat = new THREE.MeshLambertMaterial({ color: 0xf0f0f0 });
		var hosp = new THREE.Mesh(hospBuilding, hospMat);
		hosp.position.set(-80, 5, 30);
		scene.add(hosp);
		objects.push(hosp);

		var roofHosp = new THREE.ConeGeometry(22, 8, 4);
		var roofHospMat = new THREE.MeshLambertMaterial({ color: 0xcc0000 });
		var roofHosp1 = new THREE.Mesh(roofHosp, roofHospMat);
		roofHosp1.position.set(-80, 12, 30);
		scene.add(roofHosp1);
		objects.push(roofHosp1);

		var redcross = new THREE.BoxGeometry(3, 8, 0.3);
		var crossMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
		var crossH = new THREE.Mesh(redcross, crossMat);
		crossH.position.set(-80, 9, 18);
		scene.add(crossH);
		objects.push(crossH);

		var crossV = new THREE.BoxGeometry(8, 3, 0.3);
		var crossV1 = new THREE.Mesh(crossV, crossMat);
		crossV1.position.set(-80, 9, 18);
		scene.add(crossV1);
		objects.push(crossV1);

		var door = new THREE.BoxGeometry(6, 10, 0.5);
		var doorMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
		var doorHosp = new THREE.Mesh(door, doorMat);
		doorHosp.position.set(-80, 5, 52.5);
		scene.add(doorHosp);
		objects.push(doorHosp);

		for (var i = 0; i < 4; i++) {
			var winHosp = new THREE.BoxGeometry(3, 3, 0.3);
			var winMat = new THREE.MeshLambertMaterial({ color: 0x87ceeb });
			var win = new THREE.Mesh(winHosp, winMat);
			win.position.set(-95 + i * 20, 7, 52.3);
			scene.add(win);
			objects.push(win);
		}
	}

	function buildcommunications() {
		var commTower = new THREE.CylinderGeometry(1, 1, 40, 8);
		var commMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
		var tower = new THREE.Mesh(commTower, commMat);
		tower.position.set(-120, 20, -50);
		scene.add(tower);
		objects.push(tower);

		var dish = new THREE.ConeGeometry(8, 2, 12);
		var dishMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
		var dishMesh = new THREE.Mesh(dish, dishMat);
		dishMesh.position.set(-120, 42, -50);
		scene.add(dishMesh);
		objects.push(dishMesh);

		var commShack = new THREE.BoxGeometry(20, 8, 20);
		var shackMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
		var shack = new THREE.Mesh(commShack, shackMat);
		shack.position.set(-120, 4, -30);
		scene.add(shack);
		objects.push(shack);

		var roofShack = new THREE.BoxGeometry(20, 2, 20);
		var roofShackMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
		var roofShack1 = new THREE.Mesh(roofShack, roofShackMat);
		roofShack1.position.set(-120, 10, -30);
		scene.add(roofShack1);
		objects.push(roofShack1);
	}

	function buildobstaclecourse() {
		var startPos = 100;
		var zStart = -80;

		var wallObs = new THREE.BoxGeometry(30, 8, 2);
		var obsMat = new THREE.MeshLambertMaterial({ color: 0x8b6914 });
		var wall1 = new THREE.Mesh(wallObs, obsMat);
		wall1.position.set(startPos, 4, zStart);
		scene.add(wall1);
		objects.push(wall1);

		var wall2 = new THREE.Mesh(wallObs, obsMat);
		wall2.position.set(startPos, 4, zStart + 30);
		scene.add(wall2);
		objects.push(wall2);

		var pyram1 = new THREE.ConeGeometry(3, 4, 4);
		var pyramMat = new THREE.MeshLambertMaterial({ color: 0x556b2f });
		var pyr1 = new THREE.Mesh(pyram1, pyramMat);
		pyr1.position.set(startPos - 15, 2, zStart + 15);
		scene.add(pyr1);
		objects.push(pyr1);

		var pyr2 = new THREE.Mesh(pyram1, pyramMat);
		pyr2.position.set(startPos + 15, 2, zStart + 15);
		scene.add(pyr2);
		objects.push(pyr2);

		var ziplineStart = new THREE.CylinderGeometry(1.5, 1.5, 3, 8);
		var poleMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
		var zip1 = new THREE.Mesh(ziplineStart, poleMat);
		zip1.position.set(startPos - 40, 8, zStart + 60);
		scene.add(zip1);
		objects.push(zip1);

		var zip2 = new THREE.Mesh(ziplineStart, poleMat);
		zip2.position.set(startPos + 40, 8, zStart + 60);
		scene.add(zip2);
		objects.push(zip2);

		var ziplineCable = new THREE.CylinderGeometry(0.2, 0.2, 80, 8);
		var cableMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var cable = new THREE.Mesh(ziplineCable, cableMat);
		cable.rotation.z = Math.PI / 5;
		cable.position.set(startPos, 8.5, zStart + 60);
		scene.add(cable);
		objects.push(cable);

		var pulley = new THREE.SphereGeometry(1.2, 12, 12);
		var pulleyMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
		var pulleyMesh = new THREE.Mesh(pulley, pulleyMat);
		pulleyMesh.position.set(startPos, 8.5, zStart + 60);
		pulleyMesh.userData.isPulley = true;
		scene.add(pulleyMesh);
		objects.push(pulleyMesh);

		var barricade1 = new THREE.BoxGeometry(2, 4, 15);
		var barrMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
		var barr1 = new THREE.Mesh(barricade1, barrMat);
		barr1.position.set(startPos - 25, 2, zStart + 80);
		scene.add(barr1);
		objects.push(barr1);

		var barr2 = new THREE.Mesh(barricade1, barrMat);
		barr2.position.set(startPos + 25, 2, zStart + 80);
		scene.add(barr2);
		objects.push(barr2);
	}

	function buildmemorial() {
		var baseMemorial = new THREE.BoxGeometry(20, 1, 20);
		var baseMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
		var base = new THREE.Mesh(baseMemorial, baseMat);
		base.position.set(-50, 0.5, 60);
		scene.add(base);
		objects.push(base);

		var pedestal = new THREE.BoxGeometry(10, 12, 10);
		var pedestalMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
		var ped = new THREE.Mesh(pedestal, pedestalMat);
		ped.position.set(-50, 6, 60);
		scene.add(ped);
		objects.push(ped);

		var statue = new THREE.ConeGeometry(3, 10, 12);
		var statueMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
		var stat = new THREE.Mesh(statue, statueMat);
		stat.position.set(-50, 15, 60);
		scene.add(stat);
		objects.push(stat);

		var sword = new THREE.BoxGeometry(0.5, 8, 0.2);
		var swordMat = new THREE.MeshLambertMaterial({ color: 0xc0c0c0 });
		var swordMesh = new THREE.Mesh(sword, swordMat);
		swordMesh.position.set(-50, 17, 60);
		scene.add(swordMesh);
		objects.push(swordMesh);

		var plaque = new THREE.BoxGeometry(15, 4, 0.5);
		var plaqueMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
		var plaqueM = new THREE.Mesh(plaque, plaqueMat);
		plaqueM.position.set(-50, 3, 69.8);
		scene.add(plaqueM);
		objects.push(plaqueM);
	}

	function buildfences() {
		var fencePost = new THREE.CylinderGeometry(0.5, 0.5, 4, 8);
		var fenceMat = new THREE.MeshLambertMaterial({ color: 0x654321 });

		var positions = [
			{ start: { x: -150, z: -150 }, end: { x: 150, z: -150 }, count: 12 },
			{ start: { x: 150, z: -150 }, end: { x: 150, z: 150 }, count: 12 },
			{ start: { x: 150, z: 150 }, end: { x: -150, z: 150 }, count: 12 },
			{ start: { x: -150, z: 150 }, end: { x: -150, z: -150 }, count: 12 }
		];

		for (var p = 0; p < positions.length; p++) {
			var pos = positions[p];
			for (var f = 0; f < pos.count; f++) {
				var t = f / (pos.count - 1);
				var x = pos.start.x + (pos.end.x - pos.start.x) * t;
				var z = pos.start.z + (pos.end.z - pos.start.z) * t;

				var post = new THREE.Mesh(fencePost, fenceMat);
				post.position.set(x, 2, z);
				scene.add(post);
				objects.push(post);

				if (f < pos.count - 1) {
					var rail = new THREE.BoxGeometry(
						Math.abs(pos.end.x - pos.start.x) / (pos.count - 1) + 1,
						0.5,
						Math.abs(pos.end.z - pos.start.z) / (pos.count - 1) + 1
					);
					var railMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
					var railMesh = new THREE.Mesh(rail, railMat);
					railMesh.position.set(x + (pos.end.x - pos.start.x) / (pos.count - 1) * 0.5, 2.5, z + (pos.end.z - pos.start.z) / (pos.count - 1) * 0.5);
					scene.add(railMesh);
					objects.push(railMesh);
				}
			}
		}
	}

	function buildstorage() {
		var storageContainers = [
			{ x: 120, z: -30 },
			{ x: 140, z: -30 },
			{ x: 160, z: -30 }
		];

		for (var i = 0; i < storageContainers.length; i++) {
			var containerData = storageContainers[i];
			var container = new THREE.BoxGeometry(15, 12, 10);
			var containerMat = new THREE.MeshLambertMaterial({ color: 0xdc143c });
			var containerMesh = new THREE.Mesh(container, containerMat);
			containerMesh.position.set(containerData.x, 6, containerData.z);
			scene.add(containerMesh);
			objects.push(containerMesh);

			var door = new THREE.BoxGeometry(7, 12, 0.5);
			var doorMat = new THREE.MeshLambertMaterial({ color: 0x8b0000 });
			var doorMesh = new THREE.Mesh(door, doorMat);
			doorMesh.position.set(containerData.x - 7.2, 6, containerData.z + 5);
			scene.add(doorMesh);
			objects.push(doorMesh);

			var handle = new THREE.SphereGeometry(0.3, 6, 6);
			var handleMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
			var handleMesh = new THREE.Mesh(handle, handleMat);
			handleMesh.position.set(containerData.x - 7.2, 6, containerData.z + 5.2);
			scene.add(handleMesh);
			objects.push(handleMesh);
		}
	}

	function update(delta) {
		animationData.flagRotation += delta * 0.5;
		animationData.pulleyRotation += delta * 1.2;

		for (var i = 0; i < objects.length; i++) {
			var obj = objects[i];

			if (obj.userData.isFlag) {
				obj.rotation.z = Math.sin(animationData.flagRotation) * 0.3;
				obj.rotation.y = animationData.flagRotation * 0.2;
			}

			if (obj.userData.isMainFlag) {
				obj.rotation.z = Math.sin(animationData.flagRotation * 1.5) * 0.4;
				obj.rotation.y = animationData.flagRotation * 0.3;
			}

			if (obj.userData.isPulley) {
				obj.rotation.y = animationData.pulleyRotation;
				obj.rotation.z = animationData.pulleyRotation * 0.5;
			}
		}

		for (var v = 0; v < animationData.vehicleBob.length; v++) {
			var bobData = animationData.vehicleBob[v];
			var bobAmount = Math.sin((animationData.flagRotation + bobData.phase) * 0.8) * 0.15;
			objects[bobData.index].position.y = bobData.baseY + bobAmount;
		}
	}

	function reset() {
		for (var i = 0; i < objects.length; i++) {
			scene.remove(objects[i]);
		}
		objects = [];

		for (var l = 0; l < lights.length; l++) {
			scene.remove(lights[l]);
		}
		lights = [];

		scene = null;
		camera = null;
		animationData = {
			flagRotation: 0,
			vehicleBob: [],
			pulleyRotation: 0
		};
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
