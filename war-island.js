window.WarIsland = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var objects = [];
	var lights = [];
	var animatedObjects = [];
	var radarObject = null;
	var propellerObjects = [];
	var palmTrunks = [];

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		lights = [];
		animatedObjects = [];
		propellerObjects = [];
		palmTrunks = [];

		buildTerrain();
		buildBeach();
		buildBeachDefenses();
		buildCentralFortress();
		buildCliffBunkers();
		buildNavalDock();
		buildCrashedPlane();
		buildAirstrip();
		buildVillageBarracks();
		buildLighting();
		buildAtmosphere();
	}

	function buildTerrain() {
		var groundMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
		var groundGeo = new THREE.BoxGeometry(500, 1, 500);
		var groundMesh = new THREE.Mesh(groundGeo, groundMaterial);
		groundMesh.position.y = -5;
		groundMesh.receiveShadow = true;
		scene.add(groundMesh);
		objects.push(groundMesh);

		var hillMaterial = new THREE.MeshLambertMaterial({ color: 0x3d6b1f });
		var hillGeo = new THREE.ConeGeometry(60, 40, 32);
		var hillMesh = new THREE.Mesh(hillGeo, hillMaterial);
		hillMesh.position.set(150, 15, -100);
		hillMesh.castShadow = true;
		hillMesh.receiveShadow = true;
		scene.add(hillMesh);
		objects.push(hillMesh);
	}

	function buildBeach() {
		var sandMaterial = new THREE.MeshLambertMaterial({ color: 0xd4b896 });
		var beachGeo = new THREE.BoxGeometry(200, 1, 150);
		var beachMesh = new THREE.Mesh(beachGeo, sandMaterial);
		beachMesh.position.set(-150, -4, 100);
		beachMesh.receiveShadow = true;
		scene.add(beachMesh);
		objects.push(beachMesh);

		var sandDuneMaterial = new THREE.MeshLambertMaterial({ color: 0xc9a876 });
		var duneGeo = new THREE.ConeGeometry(40, 15, 16);
		var duneMesh = new THREE.Mesh(duneGeo, sandDuneMaterial);
		duneMesh.position.set(-120, 2, 80);
		duneMesh.castShadow = true;
		duneMesh.receiveShadow = true;
		scene.add(duneMesh);
		objects.push(duneMesh);

		var dune2Geo = new THREE.ConeGeometry(35, 12, 16);
		var dune2Mesh = new THREE.Mesh(dune2Geo, sandDuneMaterial);
		dune2Mesh.position.set(-180, 1, 120);
		dune2Mesh.castShadow = true;
		dune2Mesh.receiveShadow = true;
		scene.add(dune2Mesh);
		objects.push(dune2Mesh);
	}

	function buildBeachDefenses() {
		var gunEmplacementMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
		var gunGeo = new THREE.BoxGeometry(30, 15, 40);
		var gunMesh = new THREE.Mesh(gunGeo, gunEmplacementMaterial);
		gunMesh.position.set(-150, -2, 60);
		gunMesh.castShadow = true;
		gunMesh.receiveShadow = true;
		scene.add(gunMesh);
		objects.push(gunMesh);

		var gunTurret = new THREE.CylinderGeometry(12, 12, 8, 16);
		var turretMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
		var turretMesh = new THREE.Mesh(gunTurret, turretMat);
		turretMesh.position.set(-150, 10, 60);
		turretMesh.castShadow = true;
		turretMesh.receiveShadow = true;
		scene.add(turretMesh);
		objects.push(turretMesh);

		var gunBarrel = new THREE.CylinderGeometry(3, 3, 25, 8);
		var barrelMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
		var barrelMesh = new THREE.Mesh(gunBarrel, barrelMat);
		barrelMesh.rotation.z = 0.3;
		barrelMesh.position.set(-140, 18, 70);
		barrelMesh.castShadow = true;
		barrelMesh.receiveShadow = true;
		scene.add(barrelMesh);
		objects.push(barrelMesh);

		var gun2Emplacement = new THREE.BoxGeometry(30, 15, 40);
		var gun2Mesh = new THREE.Mesh(gun2Emplacement, gunEmplacementMaterial);
		gun2Mesh.position.set(-180, -2, 140);
		gun2Mesh.castShadow = true;
		gun2Mesh.receiveShadow = true;
		scene.add(gun2Mesh);
		objects.push(gun2Mesh);

		var gun2Turret = new THREE.CylinderGeometry(12, 12, 8, 16);
		var turret2Mesh = new THREE.Mesh(gun2Turret, turretMat);
		turret2Mesh.position.set(-180, 10, 140);
		turret2Mesh.castShadow = true;
		turret2Mesh.receiveShadow = true;
		scene.add(turret2Mesh);
		objects.push(turret2Mesh);

		var barbed = buildBarbedWire(-140, 5, 100);
		objects.push(barbed);
	}

	function buildBarbedWire(x, y, z) {
		var wirePoints = [
			new THREE.Vector3(x - 20, y, z),
			new THREE.Vector3(x + 20, y, z)
		];
		var wireGeo = new THREE.BufferGeometry().setFromPoints(wirePoints);
		var wireMat = new THREE.LineBasicMaterial({ color: 0xaaaaaa, linewidth: 2 });
		var wireMesh = new THREE.LineSegments(wireGeo, wireMat);
		scene.add(wireMesh);
		return wireMesh;
	}

	function buildCentralFortress() {
		var fortressMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
		var fortressGeo = new THREE.BoxGeometry(80, 30, 80);
		var fortressMesh = new THREE.Mesh(fortressGeo, fortressMaterial);
		fortressMesh.position.set(150, 5, -80);
		fortressMesh.castShadow = true;
		fortressMesh.receiveShadow = true;
		scene.add(fortressMesh);
		objects.push(fortressMesh);

		var radioTowerGeo = new THREE.CylinderGeometry(4, 4, 60, 8);
		var radioMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
		var radioTower = new THREE.Mesh(radioTowerGeo, radioMaterial);
		radioTower.position.set(150, 35, -80);
		radioTower.castShadow = true;
		radioTower.receiveShadow = true;
		scene.add(radioTower);
		objects.push(radioTower);

		var radarDishGeo = new THREE.ConeGeometry(15, 5, 16);
		var radarMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
		var radarDish = new THREE.Mesh(radarDishGeo, radarMaterial);
		radarDish.position.set(150, 65, -80);
		radarDish.castShadow = true;
		radarDish.receiveShadow = true;
		scene.add(radarDish);
		objects.push(radarDish);
		radarObject = radarDish;
		animatedObjects.push(radarDish);

		var flagpoleGeo = new THREE.CylinderGeometry(2, 2, 25, 6);
		var flagpoleMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
		var flagpole = new THREE.Mesh(flagpoleGeo, flagpoleMat);
		flagpole.position.set(180, 25, -80);
		flagpole.castShadow = true;
		flagpole.receiveShadow = true;
		scene.add(flagpole);
		objects.push(flagpole);

		var flagGeo = new THREE.BoxGeometry(15, 10, 1);
		var flagMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
		var flag = new THREE.Mesh(flagGeo, flagMat);
		flag.position.set(195, 30, -80);
		flag.castShadow = true;
		flag.receiveShadow = true;
		scene.add(flag);
		objects.push(flag);
	}

	function buildCliffBunkers() {
		var bunkerMaterial = new THREE.MeshLambertMaterial({ color: 0x6b6b6b });
		var bunkerGeo = new THREE.BoxGeometry(40, 20, 50);

		var bunker1 = new THREE.Mesh(bunkerGeo, bunkerMaterial);
		bunker1.position.set(80, 5, 80);
		bunker1.castShadow = true;
		bunker1.receiveShadow = true;
		scene.add(bunker1);
		objects.push(bunker1);

		var bunker2 = new THREE.Mesh(bunkerGeo, bunkerMaterial);
		bunker2.position.set(120, 8, 100);
		bunker2.castShadow = true;
		bunker2.receiveShadow = true;
		scene.add(bunker2);
		objects.push(bunker2);

		var bunker3 = new THREE.Mesh(bunkerGeo, bunkerMaterial);
		bunker3.position.set(160, 10, 120);
		bunker3.castShadow = true;
		bunker3.receiveShadow = true;
		scene.add(bunker3);
		objects.push(bunker3);

		var bunkerDoor1 = new THREE.BoxGeometry(12, 15, 2);
		var doorMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
		var door1 = new THREE.Mesh(bunkerDoor1, doorMat);
		door1.position.set(80, 5, 108);
		door1.castShadow = true;
		door1.receiveShadow = true;
		scene.add(door1);
		objects.push(door1);

		var door2 = new THREE.Mesh(bunkerDoor1, doorMat);
		door2.position.set(120, 8, 128);
		door2.castShadow = true;
		door2.receiveShadow = true;
		scene.add(door2);
		objects.push(door2);
	}

	function buildNavalDock() {
		var dockMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
		var dockGeo = new THREE.BoxGeometry(120, 3, 60);
		var dockMesh = new THREE.Mesh(dockGeo, dockMaterial);
		dockMesh.position.set(-200, -2, -100);
		dockMesh.receiveShadow = true;
		scene.add(dockMesh);
		objects.push(dockMesh);

		var dockPillar = new THREE.CylinderGeometry(5, 5, 15, 8);
		var pillarMat = new THREE.MeshLambertMaterial({ color: 0x7a6a4a });
		var pillar1 = new THREE.Mesh(dockPillar, pillarMat);
		pillar1.position.set(-160, 0, -80);
		pillar1.castShadow = true;
		pillar1.receiveShadow = true;
		scene.add(pillar1);
		objects.push(pillar1);

		var pillar2 = new THREE.Mesh(dockPillar, pillarMat);
		pillar2.position.set(-240, 0, -80);
		pillar2.castShadow = true;
		pillar2.receiveShadow = true;
		scene.add(pillar2);
		objects.push(pillar2);

		var destroyerHull = new THREE.BoxGeometry(60, 20, 15);
		var hullMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
		var destroyer = new THREE.Mesh(destroyerHull, hullMat);
		destroyer.position.set(-200, 5, -140);
		destroyer.castShadow = true;
		destroyer.receiveShadow = true;
		scene.add(destroyer);
		objects.push(destroyer);

		var gunTowerGeo = new THREE.CylinderGeometry(8, 8, 12, 12);
		var towerMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
		var gunTower = new THREE.Mesh(gunTowerGeo, towerMat);
		gunTower.position.set(-200, 18, -140);
		gunTower.castShadow = true;
		gunTower.receiveShadow = true;
		scene.add(gunTower);
		objects.push(gunTower);

		var smokeStackGeo = new THREE.CylinderGeometry(6, 6, 25, 8);
		var stackMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
		var smokeStack = new THREE.Mesh(smokeStackGeo, stackMat);
		smokeStack.position.set(-180, 20, -140);
		smokeStack.castShadow = true;
		smokeStack.receiveShadow = true;
		scene.add(smokeStack);
		objects.push(smokeStack);
	}

	function buildCrashedPlane() {
		var fuselageGeo = new THREE.CylinderGeometry(5, 5, 40, 8);
		var planeMat = new THREE.MeshLambertMaterial({ color: 0x7a7a7a });
		var fuselage = new THREE.Mesh(fuselageGeo, planeMat);
		fuselage.rotation.z = 0.5;
		fuselage.position.set(80, 3, 200);
		fuselage.castShadow = true;
		fuselage.receiveShadow = true;
		scene.add(fuselage);
		objects.push(fuselage);

		var wingGeo = new THREE.BoxGeometry(50, 2, 15);
		var wing1 = new THREE.Mesh(wingGeo, planeMat);
		wing1.position.set(80, 5, 200);
		wing1.castShadow = true;
		wing1.receiveShadow = true;
		scene.add(wing1);
		objects.push(wing1);

		var wingTipGeo = new THREE.BoxGeometry(10, 2, 8);
		var wingtip = new THREE.Mesh(wingTipGeo, planeMat);
		wingtip.position.set(120, 5, 200);
		wingtip.castShadow = true;
		wingtip.receiveShadow = true;
		scene.add(wingtip);
		objects.push(wingtip);

		var tailGeo = new THREE.ConeGeometry(4, 15, 8);
		var tail = new THREE.Mesh(tailGeo, planeMat);
		tail.position.set(110, 8, 200);
		tail.rotation.x = 1.5;
		tail.castShadow = true;
		tail.receiveShadow = true;
		scene.add(tail);
		objects.push(tail);

		var cockpitGeo = new THREE.SphereGeometry(3, 6, 6);
		var cockpitMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
		var cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
		cockpit.position.set(60, 6, 200);
		cockpit.castShadow = true;
		cockpit.receiveShadow = true;
		scene.add(cockpit);
		objects.push(cockpit);
	}

	function buildAirstrip() {
		var runwayGeo = new THREE.BoxGeometry(300, 1, 60);
		var runwayMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
		var runway = new THREE.Mesh(runwayGeo, runwayMat);
		runway.position.set(0, -3, -200);
		runway.receiveShadow = true;
		scene.add(runway);
		objects.push(runway);

		var markerGeo = new THREE.BoxGeometry(5, 0.5, 40);
		var markerMat = new THREE.MeshLambertMaterial({ color: 0xffff00 });
		var marker1 = new THREE.Mesh(markerGeo, markerMat);
		marker1.position.set(-60, -2.5, -200);
		marker1.receiveShadow = true;
		scene.add(marker1);
		objects.push(marker1);

		var marker2 = new THREE.Mesh(markerGeo, markerMat);
		marker2.position.set(0, -2.5, -200);
		marker2.receiveShadow = true;
		scene.add(marker2);
		objects.push(marker2);

		var marker3 = new THREE.Mesh(markerGeo, markerMat);
		marker3.position.set(60, -2.5, -200);
		marker3.receiveShadow = true;
		scene.add(marker3);
		objects.push(marker3);

		var hangarGeo = new THREE.BoxGeometry(80, 25, 60);
		var hangarMat = new THREE.MeshLambertMaterial({ color: 0x9a7a5a });
		var hangar = new THREE.Mesh(hangarGeo, hangarMat);
		hangar.position.set(150, 10, -200);
		hangar.castShadow = true;
		hangar.receiveShadow = true;
		scene.add(hangar);
		objects.push(hangar);

		var fighterPlane1 = buildFighterPlane(-80, 2, -180);
		objects.push(fighterPlane1);

		var fighterPlane2 = buildFighterPlane(0, 2, -180);
		objects.push(fighterPlane2);

		var fighterPlane3 = buildFighterPlane(80, 2, -180);
		objects.push(fighterPlane3);
	}

	function buildFighterPlane(x, y, z) {
		var fuseGeo = new THREE.CylinderGeometry(3, 3, 20, 6);
		var planeMat = new THREE.MeshLambertMaterial({ color: 0x2a6a2a });
		var fuse = new THREE.Mesh(fuseGeo, planeMat);
		fuse.position.set(x, y + 3, z);
		fuse.castShadow = true;
		fuse.receiveShadow = true;
		scene.add(fuse);

		var wingGeo = new THREE.BoxGeometry(25, 1.5, 10);
		var wing = new THREE.Mesh(wingGeo, planeMat);
		wing.position.set(x, y + 4, z);
		wing.castShadow = true;
		wing.receiveShadow = true;
		scene.add(wing);

		var propGeo = new THREE.BoxGeometry(20, 1, 3);
		var propMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
		var propeller = new THREE.Mesh(propGeo, propMat);
		propeller.position.set(x, y + 5, z + 10);
		propeller.castShadow = true;
		propeller.receiveShadow = true;
		scene.add(propeller);
		propellerObjects.push(propeller);

		return fuse;
	}

	function buildVillageBarracks() {
		var barracksGeo = new THREE.BoxGeometry(35, 12, 40);
		var barracksMatGreen = new THREE.MeshLambertMaterial({ color: 0x5a7a3a });
		var barracksMatBrown = new THREE.MeshLambertMaterial({ color: 0x7a6a5a });

		var barrack1 = new THREE.Mesh(barracksGeo, barracksMatGreen);
		barrack1.position.set(-100, 3, -50);
		barrack1.castShadow = true;
		barrack1.receiveShadow = true;
		scene.add(barrack1);
		objects.push(barrack1);

		var barrack2 = new THREE.Mesh(barracksGeo, barracksMatBrown);
		barrack2.position.set(-50, 3, -40);
		barrack2.castShadow = true;
		barrack2.receiveShadow = true;
		scene.add(barrack2);
		objects.push(barrack2);

		var barrack3 = new THREE.Mesh(barracksGeo, barracksMatGreen);
		barrack3.position.set(0, 3, -50);
		barrack3.castShadow = true;
		barrack3.receiveShadow = true;
		scene.add(barrack3);
		objects.push(barrack3);

		buildPalmTrees(-80, 5, -30);
		buildPalmTrees(-40, 5, 0);
		buildPalmTrees(20, 5, -30);
		buildPalmTrees(70, 5, 10);
		buildPalmTrees(-150, 5, 150);
		buildPalmTrees(-200, 5, 180);
		buildPalmTrees(100, 5, 150);
		buildPalmTrees(140, 5, 180);

		var wellGeo = new THREE.CylinderGeometry(8, 10, 8, 16);
		var wellMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
		var well = new THREE.Mesh(wellGeo, wellMat);
		well.position.set(-60, 2, -60);
		well.castShadow = true;
		well.receiveShadow = true;
		scene.add(well);
		objects.push(well);

		var flagstaffGeo = new THREE.CylinderGeometry(1.5, 1.5, 20, 6);
		var flagstaffMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
		var flagstaff = new THREE.Mesh(flagstaffGeo, flagstaffMat);
		flagstaff.position.set(-50, 12, -40);
		flagstaff.castShadow = true;
		flagstaff.receiveShadow = true;
		scene.add(flagstaff);
		objects.push(flagstaff);
	}

	function buildPalmTrees(x, y, z) {
		var trunkGeo = new THREE.CylinderGeometry(3, 4, 18, 8);
		var trunkMat = new THREE.MeshLambertMaterial({ color: 0x8b6f47 });
		var trunk = new THREE.Mesh(trunkGeo, trunkMat);
		trunk.position.set(x, y + 9, z);
		trunk.castShadow = true;
		trunk.receiveShadow = true;
		scene.add(trunk);
		objects.push(trunk);
		palmTrunks.push(trunk);

		var frondGeo = new THREE.ConeGeometry(12, 20, 8);
		var frondMat = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
		var fronds = new THREE.Mesh(frondGeo, frondMat);
		fronds.position.set(x, y + 28, z);
		fronds.castShadow = true;
		fronds.receiveShadow = true;
		scene.add(fronds);
		objects.push(fronds);
		animatedObjects.push(fronds);
	}

	function buildLighting() {
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
		sunLight.position.set(200, 100, 100);
		sunLight.castShadow = true;
		sunLight.shadow.mapSize.width = 2048;
		sunLight.shadow.mapSize.height = 2048;
		sunLight.shadow.camera.left = -300;
		sunLight.shadow.camera.right = 300;
		sunLight.shadow.camera.top = 300;
		sunLight.shadow.camera.bottom = -300;
		sunLight.shadow.camera.near = 1;
		sunLight.shadow.camera.far = 1000;
		scene.add(sunLight);
		lights.push(sunLight);

		var spotLight1 = new THREE.SpotLight(0xffff99, 0.6);
		spotLight1.position.set(-200, 40, -100);
		spotLight1.castShadow = true;
		spotLight1.target.position.set(-200, 0, -100);
		scene.add(spotLight1);
		scene.add(spotLight1.target);
		lights.push(spotLight1);

		var spotLight2 = new THREE.SpotLight(0x99ffff, 0.4);
		spotLight2.position.set(150, 50, -80);
		spotLight2.castShadow = true;
		spotLight2.target.position.set(150, 0, -80);
		scene.add(spotLight2);
		scene.add(spotLight2.target);
		lights.push(spotLight2);
	}

	function buildAtmosphere() {
		var fogColor = 0x8fa9c2;
		scene.background = new THREE.Color(fogColor);
		scene.fog = new THREE.Fog(fogColor, 400, 800);
	}

	function update(delta) {
		var i = 0;
		for (i = 0; i < palmTrunks.length; i = i + 1) {
			var trunk = palmTrunks[i];
			trunk.rotation.z = Math.sin(Date.now() * 0.0008 + i) * 0.05;
		}

		if (radarObject !== null) {
			radarObject.rotation.y = radarObject.rotation.y + delta * 2;
		}

		for (i = 0; i < propellerObjects.length; i = i + 1) {
			var prop = propellerObjects[i];
			prop.rotation.z = prop.rotation.z + delta * 15;
		}

		var j = 0;
		for (j = 0; j < animatedObjects.length; j = j + 1) {
			var obj = animatedObjects[j];
			if (obj !== radarObject) {
				obj.rotation.x = Math.sin(Date.now() * 0.0006 + j) * 0.1;
			}
		}
	}

	function reset() {
		var i = 0;
		for (i = 0; i < objects.length; i = i + 1) {
			scene.remove(objects[i]);
			objects[i] = null;
		}

		for (i = 0; i < lights.length; i = i + 1) {
			scene.remove(lights[i]);
			lights[i] = null;
		}

		objects = [];
		lights = [];
		animatedObjects = [];
		propellerObjects = [];
		palmTrunks = [];
		radarObject = null;
		scene = null;
		camera = null;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
