window.TankYard = (function() {
	'use strict';

	var sceneRef = null;
	var cameraRef = null;
	var objects = [];
	var lights = [];
	var animationTargets = [];

	var turrets = [];
	var liftPlatforms = [];
	var popupTargets = [];

	function init(sceneRefParam, cameraRefParam) {
		sceneRef = sceneRefParam;
		cameraRef = cameraRefParam;
		objects = [];
		lights = [];
		animationTargets = [];
		turrets = [];
		liftPlatforms = [];
		popupTargets = [];

		buildTerrain();
		buildTankRows();
		buildRepairBay();
		buildObstacleCourse();
		buildTargetRange();
		buildFuelDepot();
		buildMechanicsWorkshop();
		buildTrophyDisplay();
		buildLighting();
	}

	function buildTerrain() {
		var groundMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
		var groundGeometry = new THREE.BoxGeometry(300, 1, 300);
		var ground = new THREE.Mesh(groundGeometry, groundMaterial);
		ground.position.y = -1;
		sceneRef.add(ground);
		objects.push(ground);

		var concreteMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
		for (var i = 0; i < 5; i++) {
			var roadGeometry = new THREE.BoxGeometry(30, 0.5, 150);
			var road = new THREE.Mesh(roadGeometry, concreteMaterial);
			road.position.x = -60 + i * 30;
			road.position.y = 0;
			sceneRef.add(road);
			objects.push(road);
		}
	}

	function buildTankRows() {
		var tankPositions = [
			{ x: -80, z: -60 },
			{ x: -80, z: -20 },
			{ x: -80, z: 20 },
			{ x: -80, z: 60 },
			{ x: -40, z: -60 },
			{ x: -40, z: -20 },
			{ x: -40, z: 20 },
			{ x: -40, z: 60 },
			{ x: 0, z: -60 },
			{ x: 0, z: -20 },
			{ x: 0, z: 20 },
			{ x: 0, z: 60 }
		];

		for (var i = 0; i < tankPositions.length; i++) {
			var pos = tankPositions[i];
			buildTank(pos.x, pos.z);
		}
	}

	function buildTank(x, z) {
		var bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x2D5016 });
		var wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

		var bodyGeometry = new THREE.BoxGeometry(8, 4, 16);
		var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
		body.position.set(x, 2.5, z);
		sceneRef.add(body);
		objects.push(body);

		var turretGeometry = new THREE.CylinderGeometry(3, 3, 2, 16);
		var turretMesh = new THREE.Mesh(turretGeometry, bodyMaterial);
		turretMesh.position.set(x, 5, z);
		sceneRef.add(turretMesh);
		objects.push(turretMesh);
		turrets.push(turretMesh);

		var gunGeometry = new THREE.CylinderGeometry(0.6, 0.6, 8, 8);
		var gun = new THREE.Mesh(gunGeometry, bodyMaterial);
		gun.rotation.z = Math.PI / 6;
		gun.position.set(x + 4, 5.5, z);
		sceneRef.add(gun);
		objects.push(gun);

		for (var i = 0; i < 4; i++) {
			var wheelGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.8, 16);
			var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
			var offsetX = i < 2 ? -3 : 3;
			var offsetZ = i % 2 === 0 ? -6 : 6;
			wheel.rotation.z = Math.PI / 2;
			wheel.position.set(x + offsetX, 1.5, z + offsetZ);
			sceneRef.add(wheel);
			objects.push(wheel);
		}

		for (var j = 0; j < 6; j++) {
			var trackGeometry = new THREE.BoxGeometry(0.3, 0.3, 2);
			var track = new THREE.Mesh(trackGeometry, bodyMaterial);
			track.position.set(x + (j < 3 ? -4 : 4), 2, z + (j % 3) * 4 - 4);
			sceneRef.add(track);
			objects.push(track);
		}
	}

	function buildRepairBay() {
		var metalMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
		var concreteLight = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });

		var bayGeometry = new THREE.BoxGeometry(40, 12, 20);
		var bay = new THREE.Mesh(bayGeometry, concreteLight);
		bay.position.set(60, 5, 0);
		sceneRef.add(bay);
		objects.push(bay);

		var roofGeometry = new THREE.BoxGeometry(42, 1, 22);
		var roof = new THREE.Mesh(roofGeometry, metalMaterial);
		roof.position.set(60, 11, 0);
		sceneRef.add(roof);
		objects.push(roof);

		for (var i = 0; i < 4; i++) {
			var columnGeometry = new THREE.CylinderGeometry(1.5, 1.5, 10, 8);
			var column = new THREE.Mesh(columnGeometry, metalMaterial);
			column.position.set(40 + i * 7, 5, -8 + i * 5);
			sceneRef.add(column);
			objects.push(column);
		}

		var platformGeometry = new THREE.BoxGeometry(20, 0.5, 10);
		var platform = new THREE.Mesh(platformGeometry, metalMaterial);
		platform.position.set(60, 3, 0);
		sceneRef.add(platform);
		objects.push(platform);
		liftPlatforms.push({ mesh: platform, baseY: 3, maxY: 6 });

		var armLeftGeometry = new THREE.BoxGeometry(1, 6, 0.5);
		var armLeft = new THREE.Mesh(armLeftGeometry, metalMaterial);
		armLeft.position.set(50, 3, 0);
		sceneRef.add(armLeft);
		objects.push(armLeft);

		var armRightGeometry = new THREE.BoxGeometry(1, 6, 0.5);
		var armRight = new THREE.Mesh(armRightGeometry, metalMaterial);
		armRight.position.set(70, 3, 0);
		sceneRef.add(armRight);
		objects.push(armRight);

		var pistonLeftGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
		var pistonLeft = new THREE.Mesh(pistonLeftGeometry, metalMaterial);
		pistonLeft.position.set(50, 4, -3);
		sceneRef.add(pistonLeft);
		objects.push(pistonLeft);

		var pistonRightGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
		var pistonRight = new THREE.Mesh(pistonRightGeometry, metalMaterial);
		pistonRight.position.set(70, 4, -3);
		sceneRef.add(pistonRight);
		objects.push(pistonRight);

		buildTank(60, 0);
	}

	function buildObstacleCourse() {
		var barrierMaterial = new THREE.MeshLambertMaterial({ color: 0x4D4D4D });
		var tireMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

		var barrierPositions = [
			{ x: 20, z: -80 },
			{ x: 20, z: -60 },
			{ x: 20, z: -40 },
			{ x: 20, z: -20 },
			{ x: 20, z: 0 },
			{ x: 20, z: 20 },
			{ x: 20, z: 40 },
			{ x: 20, z: 60 }
		];

		for (var i = 0; i < barrierPositions.length; i++) {
			var pos = barrierPositions[i];
			var barrierGeometry = new THREE.BoxGeometry(15, 2, 0.8);
			var barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
			barrier.position.set(pos.x, 1, pos.z);
			sceneRef.add(barrier);
			objects.push(barrier);
		}

		var tireStackPositions = [
			{ x: 50, z: -70 },
			{ x: 50, z: -30 },
			{ x: 50, z: 30 },
			{ x: 50, z: 70 }
		];

		for (var j = 0; j < tireStackPositions.length; j++) {
			var stackPos = tireStackPositions[j];
			for (var k = 0; k < 3; k++) {
				var tireGeometry = new THREE.CylinderGeometry(2, 2, 1.2, 16);
				var tire = new THREE.Mesh(tireGeometry, tireMaterial);
				tire.rotation.z = Math.PI / 4;
				tire.position.set(stackPos.x, 1.5 + k * 2, stackPos.z);
				sceneRef.add(tire);
				objects.push(tire);
			}
		}
	}

	function buildTargetRange() {
		var postMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
		var targetMaterial = new THREE.MeshLambertMaterial({ color: 0xFF4444 });

		for (var i = 0; i < 6; i++) {
			var postGeometry = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
			var post = new THREE.Mesh(postGeometry, postMaterial);
			post.position.set(100 + i * 20, 4, -80);
			sceneRef.add(post);
			objects.push(post);

			var targetGeometry = new THREE.BoxGeometry(6, 8, 0.5);
			var target = new THREE.Mesh(targetGeometry, targetMaterial);
			target.position.set(100 + i * 20, 5, -80);
			sceneRef.add(target);
			objects.push(target);
			popupTargets.push({ mesh: target, baseZ: -80, popZ: -75, state: 'down' });

			var crossGeometry = new THREE.BoxGeometry(5.5, 0.3, 0.3);
			var crossH = new THREE.Mesh(crossGeometry, new THREE.MeshLambertMaterial({ color: 0xFFFFFF }));
			crossH.position.set(100 + i * 20, 5, -79.7);
			sceneRef.add(crossH);
			objects.push(crossH);

			var crossVGeometry = new THREE.BoxGeometry(0.3, 5.5, 0.3);
			var crossV = new THREE.Mesh(crossVGeometry, new THREE.MeshLambertMaterial({ color: 0xFFFFFF }));
			crossV.position.set(100 + i * 20, 5, -79.7);
			sceneRef.add(crossV);
			objects.push(crossV);
		}
	}

	function buildFuelDepot() {
		var tankMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
		var pumpMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

		var fuelTankGeometry = new THREE.CylinderGeometry(4, 4, 12, 16);
		var fuelTank = new THREE.Mesh(fuelTankGeometry, tankMaterial);
		fuelTank.position.set(-40, 6, 100);
		sceneRef.add(fuelTank);
		objects.push(fuelTank);

		var bandGeometry = new THREE.CylinderGeometry(4.3, 4.3, 0.3, 16);
		for (var i = 0; i < 4; i++) {
			var band = new THREE.Mesh(bandGeometry, pumpMaterial);
			band.position.set(-40, 1 + i * 3, 100);
			sceneRef.add(band);
			objects.push(band);
		}

		var pumpGeometry = new THREE.CylinderGeometry(1.5, 1.5, 4, 8);
		var pump = new THREE.Mesh(pumpGeometry, pumpMaterial);
		pump.position.set(-40, 8, 88);
		sceneRef.add(pump);
		objects.push(pump);

		var nozzleGeometry = new THREE.CylinderGeometry(0.4, 0.4, 2, 8);
		var nozzle = new THREE.Mesh(nozzleGeometry, pumpMaterial);
		nozzle.position.set(-40, 10, 88);
		sceneRef.add(nozzle);
		objects.push(nozzle);

		for (var j = 0; j < 3; j++) {
			var storageGeometry = new THREE.BoxGeometry(8, 5, 8);
			var storage = new THREE.Mesh(storageGeometry, new THREE.MeshLambertMaterial({ color: 0x8B0000 }));
			storage.position.set(-20 + j * 15, 2.5, 100);
			sceneRef.add(storage);
			objects.push(storage);
		}
	}

	function buildMechanicsWorkshop() {
		var workshopMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
		var windowMaterial = new THREE.MeshLambertMaterial({ color: 0x87CEEB });

		var buildingGeometry = new THREE.BoxGeometry(35, 10, 25);
		var building = new THREE.Mesh(buildingGeometry, workshopMaterial);
		building.position.set(-80, 5, 100);
		sceneRef.add(building);
		objects.push(building);

		for (var i = 0; i < 4; i++) {
			var windowGeometry = new THREE.BoxGeometry(3, 3, 0.2);
			var window = new THREE.Mesh(windowGeometry, windowMaterial);
			window.position.set(-95 + i * 8, 7, 100.5);
			sceneRef.add(window);
			objects.push(window);
		}

		var doorGeometry = new THREE.BoxGeometry(4, 7, 0.2);
		var door = new THREE.Mesh(doorGeometry, new THREE.MeshLambertMaterial({ color: 0x8B4513 }));
		door.position.set(-68, 3.5, 100.5);
		sceneRef.add(door);
		objects.push(door);

		for (var j = 0; j < 3; j++) {
			var workbenchGeometry = new THREE.BoxGeometry(6, 1, 4);
			var workbench = new THREE.Mesh(workbenchGeometry, new THREE.MeshLambertMaterial({ color: 0x654321 }));
			workbench.position.set(-90 + j * 15, 1, 90);
			sceneRef.add(workbench);
			objects.push(workbench);

			var toolRackGeometry = new THREE.BoxGeometry(5, 5, 0.5);
			var toolRack = new THREE.Mesh(toolRackGeometry, workshopMaterial);
			toolRack.position.set(-90 + j * 15, 4, 79);
			sceneRef.add(toolRack);
			objects.push(toolRack);
		}
	}

	function buildTrophyDisplay() {
		var displayMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
		var goldMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 });

		var platformGeometry = new THREE.BoxGeometry(50, 1, 30);
		var platform = new THREE.Mesh(platformGeometry, displayMaterial);
		platform.position.set(80, 0.5, 100);
		sceneRef.add(platform);
		objects.push(platform);

		var capturedTanks = [
			{ x: 60, z: 85 },
			{ x: 60, z: 115 },
			{ x: 80, z: 85 },
			{ x: 80, z: 115 },
			{ x: 100, z: 85 },
			{ x: 100, z: 115 }
		];

		for (var i = 0; i < capturedTanks.length; i++) {
			var tankPos = capturedTanks[i];
			buildDestroyedTank(tankPos.x, tankPos.z);
		}

		var signGeometry = new THREE.BoxGeometry(15, 2, 0.5);
		var sign = new THREE.Mesh(signGeometry, goldMaterial);
		sign.position.set(80, 3, 75);
		sceneRef.add(sign);
		objects.push(sign);

		for (var j = 0; j < 4; j++) {
			var skulGeometry = new THREE.SphereGeometry(1, 8, 8);
			var skull = new THREE.Mesh(skulGeometry, new THREE.MeshLambertMaterial({ color: 0xFFFFFF }));
			skull.position.set(60 + j * 7, 4.5, 75);
			sceneRef.add(skull);
			objects.push(skull);
		}
	}

	function buildDestroyedTank(x, z) {
		var bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4D0000 });
		var wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

		var bodyGeometry = new THREE.BoxGeometry(8, 2.5, 16);
		var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
		body.position.set(x, 1.5, z);
		body.rotation.z = Math.random() * 0.3;
		sceneRef.add(body);
		objects.push(body);

		var turretGeometry = new THREE.CylinderGeometry(2.5, 2.5, 1.5, 16);
		var turret = new THREE.Mesh(turretGeometry, bodyMaterial);
		turret.position.set(x, 3, z);
		turret.rotation.z = Math.random() * 0.5;
		sceneRef.add(turret);
		objects.push(turret);

		var gunGeometry = new THREE.CylinderGeometry(0.5, 0.5, 6, 8);
		var gun = new THREE.Mesh(gunGeometry, bodyMaterial);
		gun.rotation.z = Math.PI / 2 + Math.random() * 0.5;
		gun.position.set(x + 3, 3.5, z);
		sceneRef.add(gun);
		objects.push(gun);

		var killMarkGeometry = new THREE.BoxGeometry(1, 0.5, 0.3);
		for (var i = 0; i < 5 + Math.floor(Math.random() * 5); i++) {
			var mark = new THREE.Mesh(killMarkGeometry, new THREE.MeshLambertMaterial({ color: 0xFFFFFF }));
			mark.position.set(x - 3 + i * 1.2, 2.5, z + 0.5);
			sceneRef.add(mark);
			objects.push(mark);
		}
	}

	function buildLighting() {
		var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
		sceneRef.add(ambientLight);
		lights.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
		directionalLight.position.set(100, 80, 100);
		directionalLight.castShadow = true;
		sceneRef.add(directionalLight);
		lights.push(directionalLight);

		var spotLight1 = new THREE.SpotLight(0xFFFFFF, 0.5);
		spotLight1.position.set(60, 15, 0);
		spotLight1.target.position.set(60, 0, 0);
		sceneRef.add(spotLight1);
		sceneRef.add(spotLight1.target);
		lights.push(spotLight1);

		var spotLight2 = new THREE.SpotLight(0xFFFFFF, 0.5);
		spotLight2.position.set(-40, 15, 100);
		spotLight2.target.position.set(-40, 0, 100);
		sceneRef.add(spotLight2);
		sceneRef.add(spotLight2.target);
		lights.push(spotLight2);

		var spotLight3 = new THREE.SpotLight(0xFFFF99, 0.4);
		spotLight3.position.set(100, 12, -80);
		spotLight3.target.position.set(100, 0, -80);
		sceneRef.add(spotLight3);
		sceneRef.add(spotLight3.target);
		lights.push(spotLight3);

		var hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x8B4513, 0.5);
		sceneRef.add(hemisphereLight);
		lights.push(hemisphereLight);
	}

	function update(delta) {
		updateTurrets(delta);
		updateLifts(delta);
		updateTargets(delta);
	}

	function updateTurrets(delta) {
		for (var i = 0; i < turrets.length; i++) {
			turrets[i].rotation.y += delta * 0.5;
		}
	}

	function updateLifts(delta) {
		for (var i = 0; i < liftPlatforms.length; i++) {
			var lift = liftPlatforms[i];
			var liftCycle = (Math.sin(Date.now() * 0.001) + 1) * 0.5;
			var targetY = lift.baseY + (lift.maxY - lift.baseY) * liftCycle;
			lift.mesh.position.y += (targetY - lift.mesh.position.y) * 0.05;
		}
	}

	function updateTargets(delta) {
		for (var i = 0; i < popupTargets.length; i++) {
			var target = popupTargets[i];
			var time = Date.now() * 0.001;
			var cyclePosition = (Math.sin(time * 0.8 + i) + 1) * 0.5;

			if (cyclePosition > 0.7) {
				target.state = 'up';
				var targetZ = target.baseZ + (target.popZ - target.baseZ) * ((cyclePosition - 0.7) / 0.3);
				target.mesh.position.z = targetZ;
			} else {
				target.state = 'down';
				target.mesh.position.z = target.baseZ;
			}
		}
	}

	function reset() {
		for (var i = 0; i < objects.length; i++) {
			sceneRef.remove(objects[i]);
		}
		objects = [];

		for (var j = 0; j < lights.length; j++) {
			sceneRef.remove(lights[j]);
		}
		lights = [];

		turrets = [];
		liftPlatforms = [];
		popupTargets = [];

		sceneRef = null;
		cameraRef = null;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
