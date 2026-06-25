window.LavaBase = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var objects = [];
	var lights = [];
	var lavaBoxes = [];
	var steamVents = [];
	var animTime = 0;

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		lights = [];
		lavaBoxes = [];
		steamVents = [];
		animTime = 0;

		buildterrain();
		buildlavariver();
		buildplatforms();
		buildstructures();
		buildbunkers();
		buildshields();
		buildgeothermal();
		buildvents();
		buildlighting();
	}

	function buildterrain() {
		var rockMat = new THREE.MeshLambertMaterial({ color: 0x4a3f35 });
		var ashMat = new THREE.MeshLambertMaterial({ color: 0x5a5450 });

		var rockGeo = new THREE.BoxGeometry(200, 80, 200);
		var baseMesh = new THREE.Mesh(rockGeo, rockMat);
		baseMesh.position.y = -50;
		baseMesh.receiveShadow = true;
		scene.add(baseMesh);
		objects.push(baseMesh);

		var wallL = new THREE.BoxGeometry(20, 120, 200);
		var wallMat = new THREE.MeshLambertMaterial({ color: 0x3a2f25 });
		var wallLeft = new THREE.Mesh(wallL, wallMat);
		wallLeft.position.set(-90, 0, 0);
		wallLeft.castShadow = true;
		scene.add(wallLeft);
		objects.push(wallLeft);

		var wallR = new THREE.BoxGeometry(20, 120, 200);
		var wallRight = new THREE.Mesh(wallR, wallMat);
		wallRight.position.set(90, 0, 0);
		wallRight.castShadow = true;
		scene.add(wallRight);
		objects.push(wallRight);

		var wallB = new THREE.BoxGeometry(200, 120, 20);
		var wallBack = new THREE.Mesh(wallB, wallMat);
		wallBack.position.set(0, 0, -90);
		wallBack.castShadow = true;
		scene.add(wallBack);
		objects.push(wallBack);

		var wallF = new THREE.BoxGeometry(200, 120, 20);
		var wallFront = new THREE.Mesh(wallF, wallMat);
		wallFront.position.set(0, 0, 90);
		wallFront.castShadow = true;
		scene.add(wallFront);
		objects.push(wallFront);

		for (var i = 0; i < 15; i++) {
			var rockPile = new THREE.BoxGeometry(
				12 + Math.random() * 20,
				8 + Math.random() * 15,
				12 + Math.random() * 20
			);
			var rockPileMesh = new THREE.Mesh(rockPile, ashMat);
			rockPileMesh.position.set(
				-60 + Math.random() * 120,
				-30 + Math.random() * 20,
				-60 + Math.random() * 120
			);
			rockPileMesh.rotation.set(
				Math.random() * 0.5,
				Math.random() * Math.PI,
				Math.random() * 0.5
			);
			rockPileMesh.castShadow = true;
			scene.add(rockPileMesh);
			objects.push(rockPileMesh);
		}
	}

	function buildlavariver() {
		var lavamat = new THREE.MeshLambertMaterial({
			color: 0xff6600,
			emissive: 0xff3300
		});

		var river1 = new THREE.BoxGeometry(15, 3, 80);
		var lavaflow1 = new THREE.Mesh(river1, lavamat);
		lavaflow1.position.set(-50, -40, 0);
		lavaflow1.castShadow = true;
		scene.add(lavaflow1);
		objects.push(lavaflow1);
		lavaBoxes.push(lavaflow1);

		var river2 = new THREE.BoxGeometry(80, 4, 12);
		var lavaflow2 = new THREE.Mesh(river2, lavamat);
		lavaflow2.position.set(0, -38, 50);
		lavaflow2.castShadow = true;
		scene.add(lavaflow2);
		objects.push(lavaflow2);
		lavaBoxes.push(lavaflow2);

		var lavaPool = new THREE.BoxGeometry(40, 8, 40);
		var poolMat = new THREE.MeshLambertMaterial({
			color: 0xdd4400,
			emissive: 0xdd2200
		});
		var lavaPoolMesh = new THREE.Mesh(lavaPool, poolMat);
		lavaPoolMesh.position.set(60, -42, 50);
		lavaPoolMesh.castShadow = true;
		scene.add(lavaPoolMesh);
		objects.push(lavaPoolMesh);
		lavaBoxes.push(lavaPoolMesh);

		var coolingRock = new THREE.BoxGeometry(35, 2, 35);
		var coolingMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
		var coolingMesh = new THREE.Mesh(coolingRock, coolingMat);
		coolingMesh.position.set(60, -34, 50);
		scene.add(coolingMesh);
		objects.push(coolingMesh);
	}

	function buildplatforms() {
		var platformmat = new THREE.MeshLambertMaterial({ color: 0x654321 });

		var plat1 = new THREE.BoxGeometry(40, 4, 40);
		var platform1 = new THREE.Mesh(plat1, platformmat);
		platform1.position.set(-60, 10, -50);
		platform1.castShadow = true;
		scene.add(platform1);
		objects.push(platform1);

		var plat2 = new THREE.BoxGeometry(40, 4, 40);
		var platform2 = new THREE.Mesh(plat2, platformmat);
		platform2.position.set(0, 15, -50);
		platform2.castShadow = true;
		scene.add(platform2);
		objects.push(platform2);

		var plat3 = new THREE.BoxGeometry(40, 4, 40);
		var platform3 = new THREE.Mesh(plat3, platformmat);
		platform3.position.set(60, 12, -50);
		platform3.castShadow = true;
		scene.add(platform3);
		objects.push(platform3);

		var ramp = new THREE.BoxGeometry(35, 15, 8);
		var rampMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
		var rampMesh = new THREE.Mesh(ramp, rampMat);
		rampMesh.position.set(-60, 5, -20);
		rampMesh.rotation.z = 0.3;
		rampMesh.castShadow = true;
		scene.add(rampMesh);
		objects.push(rampMesh);

		for (var i = 0; i < 10; i++) {
			var smallPlat = new THREE.BoxGeometry(15, 2, 15);
			var smallPlatMesh = new THREE.Mesh(smallPlat, platformmat);
			smallPlatMesh.position.set(
				-70 + i * 15,
				20 + Math.random() * 10,
				30
			);
			smallPlatMesh.castShadow = true;
			scene.add(smallPlatMesh);
			objects.push(smallPlatMesh);
		}
	}

	function buildstructures() {
		var steelmat = new THREE.MeshLambertMaterial({ color: 0x404040 });
		var concretemat = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });

		var commandtower = new THREE.BoxGeometry(30, 50, 30);
		var towerMesh = new THREE.Mesh(commandtower, steelmat);
		towerMesh.position.set(-70, 25, -60);
		towerMesh.castShadow = true;
		scene.add(towerMesh);
		objects.push(towerMesh);

		var towerTop = new THREE.ConeGeometry(20, 25, 8);
		var topMesh = new THREE.Mesh(towerTop, concretemat);
		topMesh.position.set(-70, 65, -60);
		topMesh.castShadow = true;
		scene.add(topMesh);
		objects.push(topMesh);

		var hangarl = new THREE.BoxGeometry(50, 35, 60);
		var hangarMatl = new THREE.MeshLambertMaterial({ color: 0x505050 });
		var hangarMeshl = new THREE.Mesh(hangarl, hangarMatl);
		hangarMeshl.position.set(-50, 10, 40);
		hangarMeshl.castShadow = true;
		scene.add(hangarMeshl);
		objects.push(hangarMeshl);

		var hangarr = new THREE.BoxGeometry(50, 35, 60);
		var hangarMatr = new THREE.MeshLambertMaterial({ color: 0x505050 });
		var hangarMeshr = new THREE.Mesh(hangarr, hangarMatr);
		hangarMeshr.position.set(50, 10, 40);
		hangarMeshr.castShadow = true;
		scene.add(hangarMeshr);
		objects.push(hangarMeshr);

		var radarGeo = new THREE.CylinderGeometry(15, 18, 8, 32);
		var radarMat = new THREE.MeshLambertMaterial({ color: 0x707070 });
		var radarDish = new THREE.Mesh(radarGeo, radarMat);
		radarDish.position.set(-70, 95, -60);
		radarDish.castShadow = true;
		scene.add(radarDish);
		objects.push(radarDish);

		var barrel1 = new THREE.CylinderGeometry(4, 4, 25, 16);
		var barrelMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
		var gun1 = new THREE.Mesh(barrel1, barrelMat);
		gun1.position.set(-70, 78, -45);
		gun1.rotation.z = 0.2;
		gun1.castShadow = true;
		scene.add(gun1);
		objects.push(gun1);

		var barrel2 = new THREE.CylinderGeometry(4, 4, 25, 16);
		var gun2 = new THREE.Mesh(barrel2, barrelMat);
		gun2.position.set(-70, 78, -75);
		gun2.rotation.z = -0.2;
		gun2.castShadow = true;
		scene.add(gun2);
		objects.push(gun2);
	}

	function buildbunkers() {
		var bunkermat = new THREE.MeshLambertMaterial({ color: 0x7a6a5a });

		for (var i = 0; i < 6; i++) {
			var bunkerGeo = new THREE.BoxGeometry(25, 20, 30);
			var bunkerMesh = new THREE.Mesh(bunkerGeo, bunkermat);
			bunkerMesh.position.set(
				-50 + i * 20,
				5,
				-70
			);
			bunkerMesh.castShadow = true;
			scene.add(bunkerMesh);
			objects.push(bunkerMesh);

			var bunkerDoor = new THREE.BoxGeometry(8, 15, 2);
			var doorMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
			var doorMesh = new THREE.Mesh(bunkerDoor, doorMat);
			doorMesh.position.set(
				-50 + i * 20,
				8,
				-85
			);
			doorMesh.castShadow = true;
			scene.add(doorMesh);
			objects.push(doorMesh);
		}

		var ashCover = new THREE.BoxGeometry(25, 1, 30);
		var ashMat = new THREE.MeshLambertMaterial({ color: 0x5a5450 });
		for (var j = 0; j < 6; j++) {
			var ashLayer = new THREE.Mesh(ashCover, ashMat);
			ashLayer.position.set(
				-50 + j * 20,
				15,
				-70
			);
			scene.add(ashLayer);
			objects.push(ashLayer);
		}
	}

	function buildshields() {
		var shieldmat = new THREE.MeshLambertMaterial({
			color: 0xffaa00,
			emissive: 0xff6600
		});

		var shieldL = new THREE.BoxGeometry(8, 40, 80);
		var shieldLeft = new THREE.Mesh(shieldL, shieldmat);
		shieldLeft.position.set(-85, 20, 0);
		shieldLeft.castShadow = true;
		scene.add(shieldLeft);
		objects.push(shieldLeft);

		var shieldR = new THREE.BoxGeometry(8, 40, 80);
		var shieldRight = new THREE.Mesh(shieldR, shieldmat);
		shieldRight.position.set(85, 20, 0);
		shieldRight.castShadow = true;
		scene.add(shieldRight);
		objects.push(shieldRight);

		var shieldCeiling = new THREE.BoxGeometry(170, 4, 80);
		var shieldCeilingMesh = new THREE.Mesh(shieldCeiling, shieldmat);
		shieldCeilingMesh.position.set(0, 60, 0);
		scene.add(shieldCeilingMesh);
		objects.push(shieldCeilingMesh);

		var centerPiller = new THREE.CylinderGeometry(8, 8, 100, 16);
		var pillarMat = new THREE.MeshLambertMaterial({ color: 0xdd8800 });
		var centerPillar = new THREE.Mesh(centerPiller, pillarMat);
		centerPillar.position.set(0, 10, 0);
		centerPillar.castShadow = true;
		scene.add(centerPillar);
		objects.push(centerPillar);
	}

	function buildgeothermal() {
		var plantmat = new THREE.MeshLambertMaterial({ color: 0x404040 });
		var tubemat = new THREE.MeshLambertMaterial({ color: 0x505050 });

		var plantBase = new THREE.BoxGeometry(40, 30, 40);
		var plant1 = new THREE.Mesh(plantBase, plantmat);
		plant1.position.set(-60, 10, 20);
		plant1.castShadow = true;
		scene.add(plant1);
		objects.push(plant1);

		var plant2 = new THREE.Mesh(plantBase, plantmat);
		plant2.position.set(60, 10, 20);
		plant2.castShadow = true;
		scene.add(plant2);
		objects.push(plant2);

		var turbine1 = new THREE.CylinderGeometry(12, 12, 8, 32);
		var turbineMat = new THREE.MeshLambertMaterial({ color: 0x606060 });
		var turb1 = new THREE.Mesh(turbine1, turbineMat);
		turb1.position.set(-60, 35, 20);
		turb1.castShadow = true;
		scene.add(turb1);
		objects.push(turb1);

		var turbine2 = new THREE.CylinderGeometry(12, 12, 8, 32);
		var turb2 = new THREE.Mesh(turbine2, turbineMat);
		turb2.position.set(60, 35, 20);
		turb2.castShadow = true;
		scene.add(turb2);
		objects.push(turb2);

		var tubeV1 = new THREE.CylinderGeometry(6, 6, 40, 16);
		var tube1 = new THREE.Mesh(tubeV1, tubemat);
		tube1.position.set(-60, 0, 0);
		tube1.castShadow = true;
		scene.add(tube1);
		objects.push(tube1);

		var tubeV2 = new THREE.CylinderGeometry(6, 6, 40, 16);
		var tube2 = new THREE.Mesh(tubeV2, tubemat);
		tube2.position.set(60, 0, 0);
		tube2.castShadow = true;
		scene.add(tube2);
		objects.push(tube2);
	}

	function buildvents() {
		var ventmat = new THREE.MeshLambertMaterial({
			color: 0xff8844,
			emissive: 0xff4400
		});

		for (var i = 0; i < 12; i++) {
			var ventBase = new THREE.CylinderGeometry(8, 8, 4, 16);
			var ventMesh = new THREE.Mesh(ventBase, ventmat);
			ventMesh.position.set(
				-70 + Math.random() * 140,
				-35,
				-70 + Math.random() * 140
			);
			ventMesh.castShadow = true;
			scene.add(ventMesh);
			objects.push(ventMesh);
			steamVents.push({ mesh: ventMesh, time: Math.random() * Math.PI * 2 });
		}

		var obsidianGeo = new THREE.SphereGeometry(8, 16, 16);
		var obsidianmat = new THREE.MeshLambertMaterial({ color: 0x1a1a2e });
		for (var j = 0; j < 8; j++) {
			var obsidian = new THREE.Mesh(obsidianGeo, obsidianmat);
			obsidian.position.set(
				-60 + Math.random() * 120,
				5 + Math.random() * 20,
				-60 + Math.random() * 120
			);
			obsidian.castShadow = true;
			scene.add(obsidian);
			objects.push(obsidian);
		}
	}

	function buildlighting() {
		var ambientLight = new THREE.AmbientLight(0xff6600, 0.4);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var lavaPrimary = new THREE.PointLight(0xff4400, 1.5, 150);
		lavaPrimary.position.set(0, -35, 50);
		lavaPrimary.castShadow = true;
		scene.add(lavaPrimary);
		lights.push(lavaPrimary);

		var lavaSecondary = new THREE.PointLight(0xff6600, 1.2, 120);
		lavaSecondary.position.set(-50, -35, 0);
		lavaSecondary.castShadow = true;
		scene.add(lavaSecondary);
		lights.push(lavaSecondary);

		var ventGlow1 = new THREE.PointLight(0xff8844, 0.8, 80);
		ventGlow1.position.set(-50, -25, -50);
		scene.add(ventGlow1);
		lights.push(ventGlow1);

		var ventGlow2 = new THREE.PointLight(0xff8844, 0.8, 80);
		ventGlow2.position.set(50, -25, 50);
		scene.add(ventGlow2);
		lights.push(ventGlow2);

		var dirLight = new THREE.DirectionalLight(0xffffff, 0.3);
		dirLight.position.set(100, 100, 100);
		dirLight.castShadow = true;
		dirLight.shadow.mapSize.width = 2048;
		dirLight.shadow.mapSize.height = 2048;
		scene.add(dirLight);
		lights.push(dirLight);
	}

	function update(delta) {
		animTime += delta;

		var lavaGlowBase = 0.8;
		var lavaGlowAmount = Math.sin(animTime * 1.5) * 0.4 + lavaGlowBase;

		for (var i = 0; i < lavaBoxes.length; i++) {
			var lavaBox = lavaBoxes[i];
			var originalColor = i === 0 ? 0xff6600 : (i === 1 ? 0xff6600 : 0xdd4400);
			var originalEmissive = i === 0 ? 0xff3300 : (i === 1 ? 0xff3300 : 0xdd2200);

			lavaBox.material.emissive.setHSL(0.05, 1, lavaGlowAmount * 0.3);
		}

		for (var j = 0; j < steamVents.length; j++) {
			var vent = steamVents[j];
			vent.time += delta * 0.8;
			var steamHeight = Math.sin(vent.time) * 2 + 3;
			vent.mesh.scale.y = 0.5 + steamHeight * 0.15;
			vent.mesh.position.y = -35 + steamHeight * 0.5;
		}

		if (objects.length > 0 && objects[0].rotation) {
			objects[0].rotation.y += delta * 0.02;
		}
	}

	function reset() {
		if (scene === null) return;

		for (var i = objects.length - 1; i >= 0; i--) {
			scene.remove(objects[i]);
		}

		for (var j = lights.length - 1; j >= 0; j--) {
			scene.remove(lights[j]);
		}

		objects = [];
		lights = [];
		lavaBoxes = [];
		steamVents = [];

		scene = null;
		camera = null;
		animTime = 0;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
