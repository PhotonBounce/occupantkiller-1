window.FloodPlains = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var objects = [];
	var lights = [];
	var floatingCrates = [];
	var rescueBoat = null;
	var waterRipples = [];

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		lights = [];
		floatingCrates = [];
		rescueBoat = null;
		waterRipples = [];

		buildLighting();
		buildWaterBase();
		buildStranded();
		buildPontoon();
		buildSigns();
		buildCrates();
		buildBoats();
		buildHospital();
		buildGear();
	}

	function buildLighting() {
		var ambientLight = new THREE.AmbientLight(0x888888, 1.2);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xcccccc, 0.8);
		directionalLight.position.set(50, 40, 30);
		directionalLight.castShadow = true;
		scene.add(directionalLight);
		lights.push(directionalLight);

		var hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x8b7355, 0.6);
		scene.add(hemisphereLight);
		lights.push(hemisphereLight);
	}

	function buildWaterBase() {
		var waterMaterial = new THREE.MeshLambertMaterial({ color: 0x4a5f5f });
		var waterGeometry = new THREE.BoxGeometry(200, 0.5, 200);
		var waterPlane = new THREE.Mesh(waterGeometry, waterMaterial);
		waterPlane.position.set(0, -0.25, 0);
		waterPlane.receiveShadow = true;
		scene.add(waterPlane);
		objects.push(waterPlane);

		for (var i = 0; i < 12; i++) {
			var rippleGeom = new THREE.BoxGeometry(30 + i * 2, 0.1, 30 + i * 2);
			var rippleMat = new THREE.MeshLambertMaterial({ color: 0x5a6f6f, transparent: true, opacity: 0.4 });
			var ripple = new THREE.Mesh(rippleGeom, rippleMat);
			ripple.position.set(Math.random() * 100 - 50, 0, Math.random() * 100 - 50);
			ripple.baseScale = ripple.scale.y;
			scene.add(ripple);
			objects.push(ripple);
			waterRipples.push(ripple);
		}
	}

	function buildStranded() {
		var islandOffsets = [
			{ x: -60, z: -40 },
			{ x: 30, z: 50 },
			{ x: 70, z: -20 }
		];

		for (var i = 0; i < islandOffsets.length; i++) {
			var offset = islandOffsets[i];
			var islandGeom = new THREE.BoxGeometry(25, 1, 25);
			var islandMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
			var island = new THREE.Mesh(islandGeom, islandMat);
			island.position.set(offset.x, 0.5, offset.z);
			island.receiveShadow = true;
			island.castShadow = true;
			scene.add(island);
			objects.push(island);
		}

		var tankGeom = new THREE.BoxGeometry(8, 4, 12);
		var tankMat = new THREE.MeshLambertMaterial({ color: 0x3d5a3d });
		var tank = new THREE.Mesh(tankGeom, tankMat);
		tank.position.set(-60, 3, -40);
		tank.rotation.y = 0.5;
		tank.castShadow = true;
		scene.add(tank);
		objects.push(tank);

		var turretGeom = new THREE.CylinderGeometry(2, 2, 3, 16);
		var turretMat = new THREE.MeshLambertMaterial({ color: 0x3d5a3d });
		var turret = new THREE.Mesh(turretGeom, turretMat);
		turret.position.set(-60, 6, -40);
		turret.castShadow = true;
		scene.add(turret);
		objects.push(turret);

		var hmmwvGeom = new THREE.BoxGeometry(6, 3, 10);
		var hmmwvMat = new THREE.MeshLambertMaterial({ color: 0x4a5a4a });
		var hmmwv = new THREE.Mesh(hmmwvGeom, hmmwvMat);
		hmmwv.position.set(30, 2, 50);
		hmmwv.rotation.y = -0.3;
		hmmwv.castShadow = true;
		scene.add(hmmwv);
		objects.push(hmmwv);

		var truckGeom = new THREE.BoxGeometry(7, 4, 14);
		var truckMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
		var truck = new THREE.Mesh(truckGeom, truckMat);
		truck.position.set(70, 3, -20);
		truck.rotation.y = 1.2;
		truck.castShadow = true;
		scene.add(truck);
		objects.push(truck);

		for (var j = 0; j < 6; j++) {
			var wheelGeom = new THREE.CylinderGeometry(1.5, 1.5, 0.8, 12);
			var wheelMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
			var wheel = new THREE.Mesh(wheelGeom, wheelMat);
			wheel.rotation.z = Math.PI / 2;
			wheel.position.set(30 + (j - 2.5) * 3, 1, 50 + Math.random() * 2);
			wheel.castShadow = true;
			scene.add(wheel);
			objects.push(wheel);
		}
	}

	function buildPontoon() {
		var pontoonBoxMat = new THREE.MeshLambertMaterial({ color: 0x8b7e50 });

		for (var i = 0; i < 8; i++) {
			var pontoonGeom = new THREE.BoxGeometry(10, 1.5, 5);
			var pontoon = new THREE.Mesh(pontoonGeom, pontoonBoxMat);
			pontoon.position.set(-40 + i * 12, 0.75, 30);
			pontoon.receiveShadow = true;
			pontoon.castShadow = true;
			scene.add(pontoon);
			objects.push(pontoon);

			var floatGeom = new THREE.CylinderGeometry(1.2, 1.2, 8, 12);
			var floatMat = new THREE.MeshLambertMaterial({ color: 0xaa9966 });
			var floatLeft = new THREE.Mesh(floatGeom, floatMat);
			floatLeft.rotation.z = Math.PI / 2;
			floatLeft.position.set(-40 + i * 12 - 4, -1, 30 - 2);
			floatLeft.castShadow = true;
			scene.add(floatLeft);
			objects.push(floatLeft);

			var floatRight = new THREE.Mesh(floatGeom, floatMat);
			floatRight.rotation.z = Math.PI / 2;
			floatRight.position.set(-40 + i * 12 + 4, -1, 30 + 2);
			floatRight.castShadow = true;
			scene.add(floatRight);
			objects.push(floatRight);
		}

		for (var j = 0; j < 14; j++) {
			var ropeLineGeom = new THREE.BoxGeometry(0.2, 0.1, 2);
			var ropeMat = new THREE.MeshLambertMaterial({ color: 0x6b6b4a });
			var rope = new THREE.Mesh(ropeLineGeom, ropeMat);
			rope.position.set(-40 + j * 8, -3, 30);
			rope.castShadow = true;
			scene.add(rope);
			objects.push(rope);
		}
	}

	function buildSigns() {
		var signPoles = [
			{ x: -30, z: -60 },
			{ x: 50, z: -50 },
			{ x: 20, z: 70 },
			{ x: -80, z: 10 }
		];

		for (var i = 0; i < signPoles.length; i++) {
			var pole = signPoles[i];
			var poleGeom = new THREE.CylinderGeometry(0.4, 0.4, 8, 8);
			var poleMat = new THREE.MeshLambertMaterial({ color: 0x2a2a1a });
			var poleObj = new THREE.Mesh(poleGeom, poleMat);
			poleObj.position.set(pole.x, 4, pole.z);
			poleObj.castShadow = true;
			scene.add(poleObj);
			objects.push(poleObj);

			var signGeom = new THREE.BoxGeometry(6, 3, 0.3);
			var signMat = new THREE.MeshLambertMaterial({ color: 0xb8a87a });
			var sign = new THREE.Mesh(signGeom, signMat);
			sign.position.set(pole.x, 7, pole.z - 3.5);
			sign.rotation.z = 0.1;
			sign.castShadow = true;
			scene.add(sign);
			objects.push(sign);
		}

		for (var j = 0; j < 8; j++) {
			var partialSignGeom = new THREE.BoxGeometry(4, 2, 0.2);
			var partialMat = new THREE.MeshLambertMaterial({ color: 0x9a8a5a });
			var partialSign = new THREE.Mesh(partialSignGeom, partialMat);
			partialSign.position.set(Math.random() * 160 - 80, 2, Math.random() * 160 - 80);
			partialSign.rotation.x = Math.random() * 0.5 - 0.25;
			partialSign.rotation.z = Math.random() * Math.PI;
			partialSign.castShadow = true;
			scene.add(partialSign);
			objects.push(partialSign);
		}
	}

	function buildCrates() {
		floatingCrates = [];

		for (var i = 0; i < 20; i++) {
			var crateGeom = new THREE.BoxGeometry(3, 2.5, 2.5);
			var crateMat = new THREE.MeshLambertMaterial({ color: 0x6b5a3a });
			var crate = new THREE.Mesh(crateGeom, crateMat);
			crate.position.set(Math.random() * 140 - 70, 0.5, Math.random() * 140 - 70);
			crate.rotation.x = Math.random() * 0.3;
			crate.rotation.z = Math.random() * 0.3;
			crate.baseY = crate.position.y;
			crate.bobPhase = Math.random() * Math.PI * 2;
			crate.castShadow = true;
			crate.receiveShadow = true;
			scene.add(crate);
			objects.push(crate);
			floatingCrates.push(crate);
		}

		for (var j = 0; j < 12; j++) {
			var metalCrateGeom = new THREE.BoxGeometry(2.8, 2.3, 2.3);
			var metalMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
			var metalCrate = new THREE.Mesh(metalCrateGeom, metalMat);
			metalCrate.position.set(Math.random() * 120 - 60, 0.3, Math.random() * 120 - 60);
			metalCrate.baseY = metalCrate.position.y;
			metalCrate.bobPhase = Math.random() * Math.PI * 2 + Math.PI;
			metalCrate.castShadow = true;
			scene.add(metalCrate);
			objects.push(metalCrate);
			floatingCrates.push(metalCrate);
		}
	}

	function buildBoats() {
		var boatGeom = new THREE.BoxGeometry(12, 3, 6);
		var boatMat = new THREE.MeshLambertMaterial({ color: 0x7a6a4a });
		rescueBoat = new THREE.Mesh(boatGeom, boatMat);
		rescueBoat.position.set(40, 1.5, -70);
		rescueBoat.basePosition = { x: rescueBoat.position.x, y: rescueBoat.position.y, z: rescueBoat.position.z };
		rescueBoat.rockPhase = 0;
		rescueBoat.castShadow = true;
		rescueBoat.receiveShadow = true;
		scene.add(rescueBoat);
		objects.push(rescueBoat);

		var canopeGeom = new THREE.BoxGeometry(8, 2, 4);
		var canopeMat = new THREE.MeshLambertMaterial({ color: 0x5a5a4a });
		var canope = new THREE.Mesh(canopeGeom, canopeMat);
		canope.position.set(40, 3.5, -70);
		canope.castShadow = true;
		scene.add(canope);
		objects.push(canope);

		for (var i = 0; i < 4; i++) {
			var boatWheelGeom = new THREE.CylinderGeometry(1, 1, 0.6, 10);
			var wheelMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
			var boatWheel = new THREE.Mesh(boatWheelGeom, wheelMat);
			boatWheel.rotation.z = Math.PI / 2;
			boatWheel.position.set(40 + (i - 1.5) * 4, 0.5, -70 + (i % 2) * 4 - 2);
			boatWheel.castShadow = true;
			scene.add(boatWheel);
			objects.push(boatWheel);
		}

		for (var j = 0; j < 3; j++) {
			var smallBoatGeom = new THREE.BoxGeometry(6, 1.5, 3.5);
			var smallMat = new THREE.MeshLambertMaterial({ color: 0x8b7a5a });
			var smallBoat = new THREE.Mesh(smallBoatGeom, smallMat);
			smallBoat.position.set(-50 + j * 30, 0.75, 70 + j * 20);
			smallBoat.rotation.y = Math.random() * Math.PI;
			smallBoat.castShadow = true;
			scene.add(smallBoat);
			objects.push(smallBoat);
		}
	}

	function buildHospital() {
		var embankmentGeom = new THREE.BoxGeometry(35, 2, 25);
		var embankMat = new THREE.MeshLambertMaterial({ color: 0x7a6a5a });
		var embankment = new THREE.Mesh(embankmentGeom, embankMat);
		embankment.position.set(-75, 1, -30);
		embankment.receiveShadow = true;
		embankment.castShadow = true;
		scene.add(embankment);
		objects.push(embankment);

		var tentBaseGeom = new THREE.BoxGeometry(20, 0.2, 15);
		var tentBaseMat = new THREE.MeshLambertMaterial({ color: 0x6a5a4a });
		var tentBase = new THREE.Mesh(tentBaseGeom, tentBaseMat);
		tentBase.position.set(-75, 2, -30);
		tentBase.receiveShadow = true;
		scene.add(tentBase);
		objects.push(tentBase);

		var tentWallGeom = new THREE.BoxGeometry(20, 4, 0.3);
		var tentMat = new THREE.MeshLambertMaterial({ color: 0x9a8a6a });
		var tentWall = new THREE.Mesh(tentWallGeom, tentMat);
		tentWall.position.set(-75, 4, -22.5);
		tentWall.castShadow = true;
		scene.add(tentWall);
		objects.push(tentWall);

		for (var i = 0; i < 4; i++) {
			var poleGeom = new THREE.CylinderGeometry(0.5, 0.5, 5, 8);
			var poleMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
			var pole = new THREE.Mesh(poleGeom, poleMat);
			pole.position.set(-75 + (i - 1.5) * 8, 2.5, -30);
			pole.castShadow = true;
			scene.add(pole);
			objects.push(pole);
		}

		var medicalBoxGeom = new THREE.BoxGeometry(2.5, 1.5, 2);
		var medicalMat = new THREE.MeshLambertMaterial({ color: 0xaa4a3a });
		for (var j = 0; j < 6; j++) {
			var medBox = new THREE.Mesh(medicalBoxGeom, medicalMat);
			medBox.position.set(-75 + (j - 2.5) * 4, 2.2, -30 - 5);
			medBox.castShadow = true;
			scene.add(medBox);
			objects.push(medBox);
		}
	}

	function buildGear() {
		var gearPositions = [
			{ x: -20, z: -50 },
			{ x: 15, z: 20 },
			{ x: 60, z: 40 },
			{ x: -70, z: 60 },
			{ x: 50, z: -80 }
		];

		for (var i = 0; i < gearPositions.length; i++) {
			var pos = gearPositions[i];

			var rifleGeom = new THREE.BoxGeometry(0.5, 0.3, 3.5);
			var weaponMat = new THREE.MeshLambertMaterial({ color: 0x3a3a2a });
			var rifle = new THREE.Mesh(rifleGeom, weaponMat);
			rifle.position.set(pos.x, 0.2, pos.z);
			rifle.rotation.z = Math.random() * Math.PI;
			rifle.castShadow = true;
			scene.add(rifle);
			objects.push(rifle);

			var helmetGeom = new THREE.SphereGeometry(0.8, 8, 6);
			var helmetMat = new THREE.MeshLambertMaterial({ color: 0x5a5a4a });
			var helmet = new THREE.Mesh(helmetGeom, helmetMat);
			helmet.position.set(pos.x + 2, 0.8, pos.z);
			helmet.scale.y = 0.6;
			helmet.castShadow = true;
			scene.add(helmet);
			objects.push(helmet);

			var backpackGeom = new THREE.BoxGeometry(1.5, 2, 1);
			var backpackMat = new THREE.MeshLambertMaterial({ color: 0x4a4a3a });
			var backpack = new THREE.Mesh(backpackGeom, backpackMat);
			backpack.position.set(pos.x - 1.5, 1, pos.z + 1.5);
			backpack.castShadow = true;
			scene.add(backpack);
			objects.push(backpack);

			var ammoBoxGeom = new THREE.BoxGeometry(1.2, 0.6, 1.8);
			var ammoBmat = new THREE.MeshLambertMaterial({ color: 0x5a4a2a });
			for (var j = 0; j < 2; j++) {
				var ammoBox = new THREE.Mesh(ammoBoxGeom, ammoBmat);
				ammoBox.position.set(pos.x + 1.5 + j * 2, 0.3, pos.z - 1.5);
				ammoBox.castShadow = true;
				scene.add(ammoBox);
				objects.push(ammoBox);
			}

			var medkitGeom = new THREE.BoxGeometry(1, 0.8, 1.2);
			var medkitMat = new THREE.MeshLambertMaterial({ color: 0x8a3a2a });
			var medkit = new THREE.Mesh(medkitGeom, medkitMat);
			medkit.position.set(pos.x - 2, 0.4, pos.z - 2);
			medkit.castShadow = true;
			scene.add(medkit);
			objects.push(medkit);
		}

		for (var k = 0; k < 15; j++) {
			var rubbleGeom = new THREE.BoxGeometry(Math.random() * 2 + 1, Math.random() + 0.5, Math.random() * 1.5 + 0.8);
			var rubbleMat = new THREE.MeshLambertMaterial({ color: 0x6a5a4a });
			var rubble = new THREE.Mesh(rubbleGeom, rubbleMat);
			rubble.position.set(Math.random() * 160 - 80, 0.3, Math.random() * 160 - 80);
			rubble.rotation.x = Math.random() * 0.3;
			rubble.rotation.z = Math.random() * 0.3;
			rubble.castShadow = true;
			scene.add(rubble);
			objects.push(rubble);
		}
	}

	function update(delta) {
		var time = Date.now() * 0.001;

		for (var i = 0; i < floatingCrates.length; i++) {
			var crate = floatingCrates[i];
			var bobHeight = Math.sin(time * 1.5 + crate.bobPhase) * 0.4;
			crate.position.y = crate.baseY + bobHeight;
		}

		if (rescueBoat) {
			var rockAmount = Math.sin(time * 0.8) * 0.2 + Math.sin(time * 0.3) * 0.15;
			rescueBoat.rotation.z = rockAmount * 0.1;
			var rocking = Math.cos(time * 0.8) * 0.3;
			rescueBoat.position.y = rescueBoat.basePosition.y + rocking;
		}

		for (var j = 0; j < waterRipples.length; j++) {
			var ripple = waterRipples[j];
			var pulseScale = 0.8 + Math.sin(time + j) * 0.2;
			ripple.scale.x = pulseScale;
			ripple.scale.z = pulseScale;
			ripple.material.opacity = 0.4 + Math.sin(time * 2 + j) * 0.2;
		}
	}

	function reset() {
		for (var i = 0; i < objects.length; i++) {
			scene.remove(objects[i]);
		}

		for (var j = 0; j < lights.length; j++) {
			scene.remove(lights[j]);
		}

		objects = [];
		lights = [];
		floatingCrates = [];
		rescueBoat = null;
		waterRipples = [];
		scene = null;
		camera = null;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
