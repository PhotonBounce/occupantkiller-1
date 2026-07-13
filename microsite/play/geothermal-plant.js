window.GeothermalPlant = (function() {
	'use strict';

	var scene;
	var camera;
	var plantObjects = [];
	var spawnPoints = [];
	var steamVents = [];
	var turbines = [];
	var pressureGauges = [];
	var geothermalPool;
	var coolingTowerSpindle;
	var powerTransformers = [];
	var lavaGlow;
	var reliefValveHead;

	function init(initScene, initCamera) {
		scene = initScene;
		camera = initCamera;
		plantObjects = [];
		spawnPoints = [];
		steamVents = [];
		turbines = [];
		pressureGauges = [];
		powerTransformers = [];

		buildDrillingRigTower();
		buildSteamVentPipes();
		buildTurbineHall();
		buildHeatExchangerArray();
		buildPressureGaugePanels();
		buildLavaObservationPlatform();
		buildCoolingTower();
		buildPowerTransformerStation();
		buildEmergencyReliefValve();
		buildPipeNetworks();
		buildControlRoom();
		buildGeothermalPool();
		buildSulfurDepositCrystals();
		buildWarningBarriers();
		setupSpawnPoints();
	}

	function buildDrillingRigTower() {
		var tower = new THREE.BoxGeometry(8, 50, 8);
		var towerMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.3 });
		var towerMesh = new THREE.Mesh(tower, towerMaterial);
		towerMesh.position.set(-40, 25, -50);
		towerMesh.castShadow = true;
		towerMesh.receiveShadow = true;
		scene.add(towerMesh);
		plantObjects.push(towerMesh);

		var drillPipe = new THREE.CylinderGeometry(1.5, 1.5, 40, 16);
		var drillMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9, roughness: 0.2 });
		var drillMesh = new THREE.Mesh(drillPipe, drillMaterial);
		drillMesh.position.set(-40, 30, -50);
		drillMesh.castShadow = true;
		drillMesh.receiveShadow = true;
		scene.add(drillMesh);
		plantObjects.push(drillMesh);

		var rotorBase = new THREE.CylinderGeometry(3, 3, 3, 16);
		var rotorMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.7, roughness: 0.4 });
		var rotorMesh = new THREE.Mesh(rotorBase, rotorMaterial);
		rotorMesh.position.set(-40, 5, -50);
		rotorMesh.castShadow = true;
		rotorMesh.receiveShadow = true;
		scene.add(rotorMesh);
		plantObjects.push(rotorMesh);

		var towerBrace1 = new THREE.BoxGeometry(2, 45, 2);
		var braceMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.7, roughness: 0.3 });
		var brace1 = new THREE.Mesh(towerBrace1, braceMaterial);
		brace1.position.set(-35, 25, -45);
		brace1.rotation.z = 0.3;
		brace1.castShadow = true;
		scene.add(brace1);
		plantObjects.push(brace1);

		var brace2 = new THREE.Mesh(towerBrace1, braceMaterial);
		brace2.position.set(-45, 25, -55);
		brace2.rotation.z = -0.3;
		brace2.castShadow = true;
		scene.add(brace2);
		plantObjects.push(brace2);
	}

	function buildSteamVentPipes() {
		for (var i = 0; i < 4; i++) {
			var xPos = -60 + (i * 20);
			var pipe = new THREE.CylinderGeometry(2, 2, 25, 12);
			var pipeMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, roughness: 0.4 });
			var pipeMesh = new THREE.Mesh(pipe, pipeMaterial);
			pipeMesh.position.set(xPos, 12.5, 10);
			pipeMesh.castShadow = true;
			pipeMesh.receiveShadow = true;
			scene.add(pipeMesh);
			plantObjects.push(pipeMesh);

			var ventCap = new THREE.CylinderGeometry(2.5, 2.5, 3, 12);
			var ventMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: 0xCCCCCC });
			var ventMesh = new THREE.Mesh(ventCap, ventMaterial);
			ventMesh.position.set(xPos, 28.5, 10);
			ventMesh.castShadow = true;
			scene.add(ventMesh);
			plantObjects.push(ventMesh);

			steamVents.push({
				cap: ventMesh,
				baseHeight: 28.5,
				oscillation: 0,
				speed: 2 + (i * 0.3)
			});
		}
	}

	function buildTurbineHall() {
		var hallFrame = new THREE.BoxGeometry(35, 30, 40);
		var hallMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.5, roughness: 0.5 });
		var hallMesh = new THREE.Mesh(hallFrame, hallMaterial);
		hallMesh.position.set(20, 15, 0);
		hallMesh.castShadow = true;
		hallMesh.receiveShadow = true;
		scene.add(hallMesh);
		plantObjects.push(hallMesh);

		for (var i = 0; i < 3; i++) {
			var turbineSpindle = new THREE.CylinderGeometry(4, 4, 35, 16);
			var turbineMaterial = new THREE.MeshStandardMaterial({ color: 0xFF5500, metalness: 0.7, roughness: 0.3 });
			var turbineMesh = new THREE.Mesh(turbineSpindle, turbineMaterial);
			turbineMesh.position.set(5 + (i * 15), 15, 0);
			turbineMesh.rotation.z = Math.PI / 2;
			turbineMesh.castShadow = true;
			turbineMesh.receiveShadow = true;
			scene.add(turbineMesh);
			plantObjects.push(turbineMesh);
			turbines.push(turbineMesh);
		}

		var hallRoof = new THREE.BoxGeometry(37, 2, 42);
		var roofMaterial = new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 0.6, roughness: 0.4 });
		var roofMesh = new THREE.Mesh(hallRoof, roofMaterial);
		roofMesh.position.set(20, 31, 0);
		roofMesh.castShadow = true;
		roofMesh.receiveShadow = true;
		scene.add(roofMesh);
		plantObjects.push(roofMesh);
	}

	function buildHeatExchangerArray() {
		for (var i = 0; i < 6; i++) {
			var coilUnit = new THREE.BoxGeometry(5, 12, 5);
			var coilMaterial = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.8, roughness: 0.2 });
			var coilMesh = new THREE.Mesh(coilUnit, coilMaterial);
			coilMesh.position.set(-50 + (i * 8), 6, 40);
			coilMesh.castShadow = true;
			coilMesh.receiveShadow = true;
			scene.add(coilMesh);
			plantObjects.push(coilMesh);

			var coilTubes = new THREE.CylinderGeometry(0.8, 0.8, 10, 8);
			var tubeMaterial = new THREE.MeshStandardMaterial({ color: 0xCC6600, metalness: 0.7, roughness: 0.3 });
			for (var j = 0; j < 3; j++) {
				var tubeMesh = new THREE.Mesh(coilTubes, tubeMaterial);
				tubeMesh.position.set(-50 + (i * 8), 6 + (j * 3), 40);
				tubeMesh.rotation.x = Math.PI / 3;
				tubeMesh.castShadow = true;
				scene.add(tubeMesh);
				plantObjects.push(tubeMesh);
			}
		}
	}

	function buildPressureGaugePanels() {
		for (var i = 0; i < 4; i++) {
			var panel = new THREE.BoxGeometry(12, 20, 1);
			var panelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.5, roughness: 0.6 });
			var panelMesh = new THREE.Mesh(panel, panelMaterial);
			var xPos = -30 + (i * 20);
			panelMesh.position.set(xPos, 20, -35);
			panelMesh.castShadow = true;
			panelMesh.receiveShadow = true;
			scene.add(panelMesh);
			plantObjects.push(panelMesh);

			var gaugeDisplay = new THREE.BoxGeometry(4, 4, 0.5);
			var gaugeMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000, emissive: 0xFF0000 });
			var gaugeMesh = new THREE.Mesh(gaugeDisplay, gaugeMaterial);
			gaugeMesh.position.set(xPos - 3, 20, -34.5);
			gaugeMesh.castShadow = true;
			scene.add(gaugeMesh);
			plantObjects.push(gaugeMesh);
			pressureGauges.push(gaugeMesh);

			var readout = new THREE.BoxGeometry(4, 4, 0.5);
			var readoutMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFF00, emissive: 0xFFFF00 });
			var readoutMesh = new THREE.Mesh(readout, readoutMaterial);
			readoutMesh.position.set(xPos + 3, 20, -34.5);
			readoutMesh.castShadow = true;
			scene.add(readoutMesh);
			plantObjects.push(readoutMesh);
		}
	}

	function buildLavaObservationPlatform() {
		var platformBase = new THREE.BoxGeometry(25, 3, 25);
		var platformMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6, roughness: 0.4 });
		var platformMesh = new THREE.Mesh(platformBase, platformMaterial);
		platformMesh.position.set(0, 40, -60);
		platformMesh.castShadow = true;
		platformMesh.receiveShadow = true;
		scene.add(platformMesh);
		plantObjects.push(platformMesh);

		var railing = new THREE.BoxGeometry(27, 2, 2);
		var railMaterial = new THREE.MeshStandardMaterial({ color: 0xFF5500, metalness: 0.7, roughness: 0.3 });
		var rail1 = new THREE.Mesh(railing, railMaterial);
		rail1.position.set(0, 42.5, -73);
		rail1.castShadow = true;
		scene.add(rail1);
		plantObjects.push(rail1);

		var rail2 = new THREE.Mesh(railing, railMaterial);
		rail2.position.set(0, 42.5, -47);
		rail2.castShadow = true;
		scene.add(rail2);
		plantObjects.push(rail2);

		var supportPillar1 = new THREE.CylinderGeometry(2, 2, 35, 12);
		var pillarMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.7, roughness: 0.3 });
		var pillar1 = new THREE.Mesh(supportPillar1, pillarMaterial);
		pillar1.position.set(-10, 22.5, -60);
		pillar1.castShadow = true;
		scene.add(pillar1);
		plantObjects.push(pillar1);

		var pillar2 = new THREE.Mesh(supportPillar1, pillarMaterial);
		pillar2.position.set(10, 22.5, -60);
		pillar2.castShadow = true;
		scene.add(pillar2);
		plantObjects.push(pillar2);

		lavaGlow = new THREE.Mesh(
			new THREE.BoxGeometry(30, 0.1, 30),
			new THREE.MeshStandardMaterial({ color: 0xFF4500, emissive: 0xFF2200 })
		);
		lavaGlow.position.set(0, 5, -60);
		scene.add(lavaGlow);
		plantObjects.push(lavaGlow);
	}

	function buildCoolingTower() {
		var tower = new THREE.CylinderGeometry(10, 14, 45, 16);
		var towerMaterial = new THREE.MeshStandardMaterial({ color: 0xAAAAAA, metalness: 0.5, roughness: 0.5 });
		var towerMesh = new THREE.Mesh(tower, towerMaterial);
		towerMesh.position.set(50, 22.5, 30);
		towerMesh.castShadow = true;
		towerMesh.receiveShadow = true;
		scene.add(towerMesh);
		plantObjects.push(towerMesh);

		var spindle = new THREE.CylinderGeometry(2, 2, 30, 8);
		var spindleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.2 });
		coolingTowerSpindle = new THREE.Mesh(spindle, spindleMaterial);
		coolingTowerSpindle.position.set(50, 22.5, 30);
		coolingTowerSpindle.castShadow = true;
		scene.add(coolingTowerSpindle);
		plantObjects.push(coolingTowerSpindle);

		var steamPlume = new THREE.SphereGeometry(8, 8, 8);
		var plumeMaterial = new THREE.MeshStandardMaterial({ color: 0xDDDDDD, transparent: true, opacity: 0.6 });
		var plumeMesh = new THREE.Mesh(steamPlume, plumeMaterial);
		plumeMesh.position.set(50, 50, 30);
		plumeMesh.scale.set(1, 1.5, 1);
		scene.add(plumeMesh);
		plantObjects.push(plumeMesh);
	}

	function buildPowerTransformerStation() {
		for (var i = 0; i < 3; i++) {
			var transBox = new THREE.BoxGeometry(8, 15, 8);
			var transMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.3 });
			var transMesh = new THREE.Mesh(transBox, transMaterial);
			transMesh.position.set(50 + (i * 12), 7.5, -30);
			transMesh.castShadow = true;
			transMesh.receiveShadow = true;
			scene.add(transMesh);
			plantObjects.push(transMesh);
			powerTransformers.push(transMesh);

			var insulator = new THREE.CylinderGeometry(1.5, 1.5, 6, 8);
			var insulatorMaterial = new THREE.MeshStandardMaterial({ color: 0xEEDEAD, metalness: 0.3, roughness: 0.6 });
			var insulatorMesh = new THREE.Mesh(insulator, insulatorMaterial);
			insulatorMesh.position.set(50 + (i * 12), 16, -30);
			insulatorMesh.castShadow = true;
			scene.add(insulatorMesh);
			plantObjects.push(insulatorMesh);
		}
	}

	function buildEmergencyReliefValve() {
		var valveBody = new THREE.CylinderGeometry(3, 3, 12, 12);
		var valveMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000, metalness: 0.8, roughness: 0.2 });
		var valveMesh = new THREE.Mesh(valveBody, valveMaterial);
		valveMesh.position.set(0, 6, 25);
		valveMesh.castShadow = true;
		valveMesh.receiveShadow = true;
		scene.add(valveMesh);
		plantObjects.push(valveMesh);

		reliefValveHead = new THREE.BoxGeometry(5, 5, 5);
		var headMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFF00, emissive: 0xFF6600 });
		var headMesh = new THREE.Mesh(reliefValveHead, headMaterial);
		headMesh.position.set(0, 14, 25);
		headMesh.castShadow = true;
		scene.add(headMesh);
		plantObjects.push(headMesh);

		var pressurePipe = new THREE.CylinderGeometry(2, 2, 15, 10);
		var pipeMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7, roughness: 0.3 });
		var pipeMesh = new THREE.Mesh(pressurePipe, pipeMaterial);
		pipeMesh.position.set(0, 22.5, 25);
		pipeMesh.rotation.z = Math.PI / 4;
		pipeMesh.castShadow = true;
		scene.add(pipeMesh);
		plantObjects.push(pipeMesh);
	}

	function buildPipeNetworks() {
		var hPipe1 = new THREE.CylinderGeometry(1, 1, 50, 10);
		var pipeMatMain = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.7, roughness: 0.3 });
		var hMesh1 = new THREE.Mesh(hPipe1, pipeMatMain);
		hMesh1.position.set(-10, 35, 10);
		hMesh1.rotation.z = Math.PI / 2;
		hMesh1.castShadow = true;
		scene.add(hMesh1);
		plantObjects.push(hMesh1);

		var hPipe2 = new THREE.CylinderGeometry(1, 1, 60, 10);
		var hMesh2 = new THREE.Mesh(hPipe2, pipeMatMain);
		hMesh2.position.set(20, 40, -20);
		hMesh2.rotation.z = Math.PI / 2;
		hMesh2.castShadow = true;
		scene.add(hMesh2);
		plantObjects.push(hMesh2);

		var vPipe1 = new THREE.CylinderGeometry(1.2, 1.2, 25, 10);
		var vMesh1 = new THREE.Mesh(vPipe1, pipeMatMain);
		vMesh1.position.set(-20, 12.5, 0);
		vMesh1.castShadow = true;
		scene.add(vMesh1);
		plantObjects.push(vMesh1);

		var vPipe2 = new THREE.CylinderGeometry(1.2, 1.2, 30, 10);
		var vMesh2 = new THREE.Mesh(vPipe2, pipeMatMain);
		vMesh2.position.set(40, 15, -10);
		vMesh2.castShadow = true;
		scene.add(vMesh2);
		plantObjects.push(vMesh2);
	}

	function buildControlRoom() {
		var roomBox = new THREE.BoxGeometry(20, 18, 15);
		var roomMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.5, roughness: 0.5 });
		var roomMesh = new THREE.Mesh(roomBox, roomMaterial);
		roomMesh.position.set(-50, 9, -20);
		roomMesh.castShadow = true;
		roomMesh.receiveShadow = true;
		scene.add(roomMesh);
		plantObjects.push(roomMesh);

		var monitorWall = new THREE.BoxGeometry(18, 10, 0.5);
		var monitorMaterial = new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 0.6, roughness: 0.2 });
		var monitorMesh = new THREE.Mesh(monitorWall, monitorMaterial);
		monitorMesh.position.set(-50, 12, -27.5);
		monitorMesh.castShadow = true;
		scene.add(monitorMesh);
		plantObjects.push(monitorMesh);

		for (var i = 0; i < 4; i++) {
			var screen = new THREE.BoxGeometry(3, 3, 0.3);
			var screenMaterial = new THREE.MeshStandardMaterial({ color: 0x00FF00, emissive: 0x00AA00 });
			var screenMesh = new THREE.Mesh(screen, screenMaterial);
			screenMesh.position.set(-60 + (i * 6), 12, -27);
			screenMesh.castShadow = true;
			scene.add(screenMesh);
			plantObjects.push(screenMesh);
		}

		var roof = new THREE.BoxGeometry(22, 1, 17);
		var roofMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6, roughness: 0.4 });
		var roofMesh = new THREE.Mesh(roof, roofMaterial);
		roofMesh.position.set(-50, 28, -20);
		roofMesh.castShadow = true;
		scene.add(roofMesh);
		plantObjects.push(roofMesh);
	}

	function buildGeothermalPool() {
		geothermalPool = new THREE.Mesh(
			new THREE.BoxGeometry(30, 2, 30),
			new THREE.MeshStandardMaterial({ color: 0x1E90FF, emissive: 0x0080FF, transparent: true, opacity: 0.8 })
		);
		geothermalPool.position.set(-20, 0.5, 60);
		geothermalPool.receiveShadow = true;
		scene.add(geothermalPool);
		plantObjects.push(geothermalPool);

		var poolEdge = new THREE.BoxGeometry(32, 1, 32);
		var edgeMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.6, roughness: 0.4 });
		var edgeMesh = new THREE.Mesh(poolEdge, edgeMaterial);
		edgeMesh.position.set(-20, 0, 60);
		edgeMesh.castShadow = true;
		scene.add(edgeMesh);
		plantObjects.push(edgeMesh);
	}

	function buildSulfurDepositCrystals() {
		for (var i = 0; i < 8; i++) {
			var crystal = new THREE.BoxGeometry(2, 6, 2);
			var crystalMaterial = new THREE.MeshStandardMaterial({ color: 0xFFDD00, emissive: 0xFFDD00, metalness: 0.4, roughness: 0.6 });
			var crystalMesh = new THREE.Mesh(crystal, crystalMaterial);
			var xPos = -60 + (i * 8);
			crystalMesh.position.set(xPos, 3, 50);
			crystalMesh.rotation.z = (Math.random() - 0.5) * 0.4;
			crystalMesh.castShadow = true;
			scene.add(crystalMesh);
			plantObjects.push(crystalMesh);
		}
	}

	function buildWarningBarriers() {
		for (var i = 0; i < 5; i++) {
			var barrier = new THREE.BoxGeometry(3, 2, 8);
			var barrierMaterial = new THREE.MeshStandardMaterial({ color: 0xFF5500, emissive: 0xFF3300 });
			var barrierMesh = new THREE.Mesh(barrier, barrierMaterial);
			barrierMesh.position.set(-80 + (i * 10), 1, -60 + (i * 6));
			barrierMesh.castShadow = true;
			scene.add(barrierMesh);
			plantObjects.push(barrierMesh);

			var stripeGeo = new THREE.BoxGeometry(3, 2, 8);
			var stripeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
			var stripeMesh = new THREE.Mesh(stripeGeo, stripeMaterial);
			stripeMesh.position.set(-80 + (i * 10), 2.1, -60 + (i * 6));
			stripeMesh.scale.set(0.9, 0.3, 0.9);
			scene.add(stripeMesh);
			plantObjects.push(stripeMesh);
		}
	}

	function setupSpawnPoints() {
		spawnPoints = [
			{ x: -80, y: 2, z: 0 },
			{ x: 20, y: 2, z: 20 },
			{ x: -40, y: 2, z: -50 },
			{ x: 0, y: 42, z: -60 },
			{ x: -50, y: 2, z: -20 }
		];
	}

	function update(delta) {
		for (var i = 0; i < steamVents.length; i++) {
			var vent = steamVents[i];
			vent.oscillation += delta * vent.speed;
			var pulseMagnitude = Math.sin(vent.oscillation) * 0.5;
			vent.cap.position.y = vent.baseHeight + pulseMagnitude;
			vent.cap.scale.set(1 + pulseMagnitude * 0.3, 1, 1 + pulseMagnitude * 0.3);
		}

		for (var j = 0; j < turbines.length; j++) {
			turbines[j].rotation.y += delta * 3;
		}

		if (coolingTowerSpindle) {
			coolingTowerSpindle.rotation.x += delta * 2;
		}

		for (var k = 0; k < pressureGauges.length; k++) {
			var gauge = pressureGauges[k];
			var redValue = Math.floor(200 + Math.sin(Date.now() * 0.005) * 50);
			gauge.material.color.setHex(0xFF0000);
			gauge.material.emissive.setHex(0xFF0000);
		}

		if (lavaGlow) {
			var glowIntensity = 0.5 + Math.sin(Date.now() * 0.003) * 0.3;
			lavaGlow.material.emissive.setHex(0xFF2200);
		}

		for (var l = 0; l < powerTransformers.length; l++) {
			var transformer = powerTransformers[l];
			var vibration = Math.sin(Date.now() * 0.01) * 0.02;
			transformer.scale.set(1 + vibration, 1, 1 + vibration);
		}

		if (geothermalPool) {
			var poolBubble = Math.sin(Date.now() * 0.008) * 0.08;
			geothermalPool.scale.z = 1 + poolBubble;
		}
	}

	function reset() {
		for (var i = 0; i < plantObjects.length; i++) {
			scene.remove(plantObjects[i]);
		}
		plantObjects = [];
		steamVents = [];
		turbines = [];
		pressureGauges = [];
		powerTransformers = [];
		spawnPoints = [];
		geothermalPool = null;
		coolingTowerSpindle = null;
		lavaGlow = null;
		reliefValveHead = null;
	}

	return {
		init: init,
		update: update,
		reset: reset,
		getSpawnPoints: function() { return spawnPoints; }
	};
}());
