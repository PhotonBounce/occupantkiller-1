window.MagmaBridge = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var environmentGroup = null;
	var glowingMagmaLight = null;
	var ambientLight = null;
	var steamVents = [];
	var coolingPipes = [];
	var glowAnimationTime = 0;

	var materials = {
		bridgeSteel: new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.8, roughness: 0.2 }),
		armoredPlate: new THREE.MeshStandardMaterial({ color: 0x2c2c2c, metalness: 0.9, roughness: 0.1 }),
		bunkerConcrete: new THREE.MeshStandardMaterial({ color: 0x707070, metalness: 0.1, roughness: 0.8 }),
		coolingPipe: new THREE.MeshStandardMaterial({ color: 0x1a5c7a, metalness: 0.7, roughness: 0.3 }),
		magneticWreck: new THREE.MeshStandardMaterial({ color: 0x8b4513, metalness: 0.6, roughness: 0.4 }),
		pillarStone: new THREE.MeshStandardMaterial({ color: 0x5a4a3a, metalness: 0.2, roughness: 0.7 }),
		antiAirGun: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.95, roughness: 0.05 }),
		spawnFortification: new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.5, roughness: 0.5 })
	};

	function init(_scene, _camera) {
		scene = _scene;
		camera = _camera;
		environmentGroup = new THREE.Group();
		scene.add(environmentGroup);

		setupLighting();
		createBridgeStructure();
		createMagmaPillars();
		createDefensiveBunkers();
		createCoolingSystem();
		createAntiAirPositions();
		createEnemySpawnFortification();
		createVehicleWrecks();
		createBridgeTowers();
		createGapSections();
		createDetailElements();

		return true;
	}

	function setupLighting() {
		ambientLight = new THREE.AmbientLight(0xff8844, 0.4);
		scene.add(ambientLight);

		glowingMagmaLight = new THREE.PointLight(0xff6600, 2.0, 100);
		glowingMagmaLight.position.set(40, -15, 40);
		scene.add(glowingMagmaLight);

		var directionalLight = new THREE.DirectionalLight(0xffaa66, 0.6);
		directionalLight.position.set(30, 25, 30);
		scene.add(directionalLight);
	}

	function createBridgeStructure() {
		var bridgeGroup = new THREE.Group();

		// Main bridge deck - long central platform
		var deckGeometry = new THREE.BoxGeometry(80, 3, 12);
		var deck = new THREE.Mesh(deckGeometry, materials.bridgeSteel);
		deck.position.set(0, 0, 0);
		deck.castShadow = true;
		deck.receiveShadow = true;
		bridgeGroup.add(deck);

		// Left armored side section
		var leftArmorGeometry = new THREE.BoxGeometry(30, 4, 3);
		var leftArmor = new THREE.Mesh(leftArmorGeometry, materials.armoredPlate);
		leftArmor.position.set(-25, 2.5, 5.5);
		leftArmor.castShadow = true;
		bridgeGroup.add(leftArmor);

		// Right armored side section
		var rightArmorGeometry = new THREE.BoxGeometry(30, 4, 3);
		var rightArmor = new THREE.Mesh(rightArmorGeometry, materials.armoredPlate);
		rightArmor.position.set(-25, 2.5, -5.5);
		rightArmor.castShadow = true;
		bridgeGroup.add(rightArmor);

		// Center reinforced section
		var centerReinforceGeometry = new THREE.BoxGeometry(20, 5, 10);
		var centerReinforce = new THREE.Mesh(centerReinforceGeometry, materials.bridgeSteel);
		centerReinforce.position.set(0, 3, 0);
		centerReinforce.castShadow = true;
		bridgeGroup.add(centerReinforce);

		// Bridge cross-bracing cylinders (structural support)
		var bracingGeometry = new THREE.CylinderGeometry(0.8, 0.8, 25, 16);
		var bracing1 = new THREE.Mesh(bracingGeometry, materials.bridgeSteel);
		bracing1.rotation.z = Math.PI / 2;
		bracing1.position.set(-20, 3, 8);
		bracing1.castShadow = true;
		bridgeGroup.add(bracing1);

		var bracing2 = new THREE.Mesh(bracingGeometry, materials.bridgeSteel);
		bracing2.rotation.z = Math.PI / 2;
		bracing2.position.set(20, 3, -8);
		bracing2.castShadow = true;
		bridgeGroup.add(bracing2);

		environmentGroup.add(bridgeGroup);
	}

	function createMagmaPillars() {
		var pillarGroup = new THREE.Group();

		// Four massive magma-cooled pillars descending into chasm
		var pillarPositions = [
			{ x: -30, z: -30 },
			{ x: -30, z: 30 },
			{ x: 30, z: -30 },
			{ x: 30, z: 30 }
		];

		pillarPositions.forEach(function(pos) {
			var pillarGeometry = new THREE.CylinderGeometry(3.5, 4.5, 40, 20);
			var pillar = new THREE.Mesh(pillarGeometry, materials.pillarStone);
			pillar.position.set(pos.x, -20, pos.z);
			pillar.castShadow = true;
			pillar.receiveShadow = true;
			pillarGroup.add(pillar);

			// Glowing base at bottom of pillar (magma interaction)
			var glowBaseGeometry = new THREE.CylinderGeometry(5, 5, 2, 20);
			var glowBaseMaterial = new THREE.MeshStandardMaterial({
				color: 0xff4400,
				emissive: 0xff2200,
				metalness: 0.3,
				roughness: 0.4
			});
			var glowBase = new THREE.Mesh(glowBaseGeometry, glowBaseMaterial);
			glowBase.position.set(pos.x, -38, pos.z);
			pillarGroup.add(glowBase);
		});

		environmentGroup.add(pillarGroup);
	}

	function createDefensiveBunkers() {
		var bunkerGroup = new THREE.Group();

		// Left side bunker - near camera start
		var leftBunkerGeometry = new THREE.BoxGeometry(15, 6, 20);
		var leftBunker = new THREE.Mesh(leftBunkerGeometry, materials.bunkerConcrete);
		leftBunker.position.set(-35, 3, 0);
		leftBunker.castShadow = true;
		bunkerGroup.add(leftBunker);

		// Left bunker gun emplacement
		var leftGunGeometry = new THREE.CylinderGeometry(1.2, 1.5, 8, 12);
		var leftGun = new THREE.Mesh(leftGunGeometry, materials.antiAirGun);
		leftGun.rotation.z = Math.PI / 6;
		leftGun.position.set(-42, 8, 0);
		leftGun.castShadow = true;
		bunkerGroup.add(leftGun);

		// Right side bunker
		var rightBunkerGeometry = new THREE.BoxGeometry(15, 6, 20);
		var rightBunker = new THREE.Mesh(rightBunkerGeometry, materials.bunkerConcrete);
		rightBunker.position.set(-35, 3, 0);
		rightBunker.castShadow = true;
		bunkerGroup.add(rightBunker);

		// Bunker wall dividers
		var dividerGeometry = new THREE.BoxGeometry(2, 6, 15);
		var divider1 = new THREE.Mesh(dividerGeometry, materials.bunkerConcrete);
		divider1.position.set(-30, 3, -8);
		bunkerGroup.add(divider1);

		var divider2 = new THREE.Mesh(dividerGeometry, materials.bunkerConcrete);
		divider2.position.set(-30, 3, 8);
		bunkerGroup.add(divider2);

		environmentGroup.add(bunkerGroup);
	}

	function createCoolingSystem() {
		var coolingGroup = new THREE.Group();

		// Left side cooling pipes running along bridge
		var pipePositions = [
			{ x: -35, z: 8, length: 70 },
			{ x: -35, z: -8, length: 70 },
			{ x: -40, z: 0, length: 70 }
		];

		pipePositions.forEach(function(pipePos) {
			var pipeGeometry = new THREE.CylinderGeometry(0.6, 0.6, pipePos.length, 12);
			var pipe = new THREE.Mesh(pipeGeometry, materials.coolingPipe);
			pipe.rotation.z = Math.PI / 2;
			pipe.position.set(pipePos.x, 5, pipePos.z);
			pipe.castShadow = true;
			coolingGroup.add(pipe);
			coolingPipes.push({
				mesh: pipe,
				baseY: 5,
				amplitude: 0.3,
				frequency: 2.5
			});
		});

		// Cooling pipe connection nodes (spheres)
		for (var i = -30; i <= 30; i += 20) {
			var nodeGeometry = new THREE.SphereGeometry(0.9, 10, 10);
			var nodeMaterial = new THREE.MeshStandardMaterial({
				color: 0x0a8aaf,
				metalness: 0.6,
				roughness: 0.3,
				emissive: 0x0a5a8f
			});
			var node = new THREE.Mesh(nodeGeometry, nodeMaterial);
			node.position.set(-35, 5, i);
			coolingGroup.add(node);
			steamVents.push({
				position: node.position.clone(),
				time: 0
			});
		}

		environmentGroup.add(coolingGroup);
	}

	function createAntiAirPositions() {
		var aaGroup = new THREE.Group();

		// Two bridge towers with AA guns on top
		var towerPositions = [
			{ x: -40, z: 0 },
			{ x: 40, z: 0 }
		];

		towerPositions.forEach(function(pos) {
			// Tower base cylinder
			var towerGeometry = new THREE.CylinderGeometry(3, 3.5, 18, 16);
			var tower = new THREE.Mesh(towerGeometry, materials.bridgeSteel);
			tower.position.set(pos.x, 9, pos.z);
			tower.castShadow = true;
			aaGroup.add(tower);

			// Gun platform
			var platformGeometry = new THREE.BoxGeometry(8, 1.5, 8);
			var platform = new THREE.Mesh(platformGeometry, materials.armoredPlate);
			platform.position.set(pos.x, 18, pos.z);
			platform.castShadow = true;
			aaGroup.add(platform);

			// AA gun barrel
			var barrelGeometry = new THREE.CylinderGeometry(0.7, 0.7, 10, 12);
			var barrel = new THREE.Mesh(barrelGeometry, materials.antiAirGun);
			barrel.rotation.z = Math.PI / 4;
			barrel.position.set(pos.x, 22, pos.z);
			barrel.castShadow = true;
			aaGroup.add(barrel);

			// Gun turret base
			var turretGeometry = new THREE.CylinderGeometry(2, 2.2, 3, 16);
			var turret = new THREE.Mesh(turretGeometry, materials.antiAirGun);
			turret.position.set(pos.x, 19.5, pos.z);
			aaGroup.add(turret);
		});

		environmentGroup.add(aaGroup);
	}

	function createEnemySpawnFortification() {
		var spawnGroup = new THREE.Group();

		// Large enemy spawn fortification at far end of bridge
		var mainFortGeometry = new THREE.BoxGeometry(25, 8, 25);
		var mainFort = new THREE.Mesh(mainFortGeometry, materials.spawnFortification);
		mainFort.position.set(50, 4, 0);
		mainFort.castShadow = true;
		spawnGroup.add(mainFort);

		// Fortification tower left
		var fortTowerLeftGeometry = new THREE.CylinderGeometry(2.5, 3, 12, 16);
		var fortTowerLeft = new THREE.Mesh(fortTowerLeftGeometry, materials.spawnFortification);
		fortTowerLeft.position.set(38, 8, -15);
		fortTowerLeft.castShadow = true;
		spawnGroup.add(fortTowerLeft);

		// Fortification tower right
		var fortTowerRightGeometry = new THREE.CylinderGeometry(2.5, 3, 12, 16);
		var fortTowerRight = new THREE.Mesh(fortTowerRightGeometry, materials.spawnFortification);
		fortTowerRight.position.set(38, 8, 15);
		fortTowerRight.castShadow = true;
		spawnGroup.add(fortTowerRight);

		// Spawn gateway cone structures (enemy visual marker)
		var gatewayGeometry = new THREE.ConeGeometry(3, 8, 12);
		var gatewayMaterial = new THREE.MeshStandardMaterial({
			color: 0xff3300,
			emissive: 0xcc2200,
			metalness: 0.4,
			roughness: 0.6
		});
		var gateway1 = new THREE.Mesh(gatewayGeometry, gatewayMaterial);
		gateway1.position.set(50, 10, -8);
		spawnGroup.add(gateway1);

		var gateway2 = new THREE.Mesh(gatewayGeometry, gatewayMaterial);
		gateway2.position.set(50, 10, 8);
		spawnGroup.add(gateway2);

		environmentGroup.add(spawnGroup);
	}

	function createVehicleWrecks() {
		var wreckGroup = new THREE.Group();

		// Destroyed armored vehicle 1 - near center of bridge
		var wreck1BodyGeometry = new THREE.BoxGeometry(8, 3, 5);
		var wreck1Body = new THREE.Mesh(wreck1BodyGeometry, materials.magneticWreck);
		wreck1Body.position.set(-10, 2, -8);
		wreck1Body.rotation.y = 0.3;
		wreck1Body.castShadow = true;
		wreckGroup.add(wreck1Body);

		// Wreck turret (cylinder)
		var wreck1TurretGeometry = new THREE.CylinderGeometry(1.8, 2, 4, 14);
		var wreck1Turret = new THREE.Mesh(wreck1TurretGeometry, materials.magneticWreck);
		wreck1Turret.position.set(-10, 5, -8);
		wreck1Turret.rotation.z = -0.2;
		wreckGroup.add(wreck1Turret);

		// Destroyed armored vehicle 2 - opposite side
		var wreck2BodyGeometry = new THREE.BoxGeometry(7, 3, 5);
		var wreck2Body = new THREE.Mesh(wreck2BodyGeometry, materials.magneticWreck);
		wreck2Body.position.set(15, 2, 8);
		wreck2Body.rotation.y = -0.5;
		wreck2Body.castShadow = true;
		wreckGroup.add(wreck2Body);

		// Wreck turret 2
		var wreck2TurretGeometry = new THREE.CylinderGeometry(1.6, 1.8, 3, 14);
		var wreck2Turret = new THREE.Mesh(wreck2TurretGeometry, materials.magneticWreck);
		wreck2Turret.position.set(15, 5, 8);
		wreck2Turret.rotation.z = 0.4;
		wreckGroup.add(wreck2Turret);

		// Cargo container wreck
		var containerGeometry = new THREE.BoxGeometry(6, 5, 4);
		var containerMaterial = new THREE.MeshStandardMaterial({
			color: 0x5a3a1a,
			metalness: 0.5,
			roughness: 0.6
		});
		var container = new THREE.Mesh(containerGeometry, containerMaterial);
		container.position.set(25, 2.5, -10);
		container.rotation.z = 0.2;
		container.castShadow = true;
		wreckGroup.add(container);

		environmentGroup.add(wreckGroup);
	}

	function createBridgeTowers() {
		var towerGroup = new THREE.Group();

		// Support towers at bridge intervals
		var supportPositions = [
			{ x: -50, z: 0 },
			{ x: 0, z: 0 },
			{ x: 50, z: 0 }
		];

		supportPositions.forEach(function(pos) {
			var supportGeometry = new THREE.CylinderGeometry(2, 2.5, 12, 14);
			var support = new THREE.Mesh(supportGeometry, materials.bridgeSteel);
			support.position.set(pos.x, 6, pos.z);
			support.castShadow = true;
			towerGroup.add(support);

			// Cross-bracing on support
			var bracingGeometry = new THREE.BoxGeometry(0.5, 12, 0.5);
			var bracing = new THREE.Mesh(bracingGeometry, materials.bridgeSteel);
			bracing.position.set(pos.x, 6, pos.z);
			bracing.rotation.z = Math.PI / 4;
			towerGroup.add(bracing);
		});

		environmentGroup.add(towerGroup);
	}

	function createGapSections() {
		var gapGroup = new THREE.Group();

		// Blown-out gap 1 in bridge (creates danger zone)
		var gapEdge1Geometry = new THREE.BoxGeometry(4, 3, 12);
		var gapEdge1 = new THREE.Mesh(gapEdge1Geometry, materials.armoredPlate);
		gapEdge1.position.set(-15, 0, 0);
		gapEdge1.castShadow = true;
		gapGroup.add(gapEdge1);

		var gapEdge2Geometry = new THREE.BoxGeometry(4, 3, 12);
		var gapEdge2 = new THREE.Mesh(gapEdge2Geometry, materials.armoredPlate);
		gapEdge2.position.set(-7, 0, 0);
		gapEdge2.castShadow = true;
		gapGroup.add(gapEdge2);

		// Gap visual marker - ascending/descending ramps with barriers
		var ramp1Geometry = new THREE.BoxGeometry(3, 0.5, 12);
		var ramp1Material = new THREE.MeshStandardMaterial({
			color: 0x8b7355,
			metalness: 0.3,
			roughness: 0.7
		});
		var ramp1 = new THREE.Mesh(ramp1Geometry, ramp1Material);
		ramp1.position.set(-15, 1.5, 0);
		ramp1.rotation.z = 0.15;
		gapGroup.add(ramp1);

		// Temporary bridge planks across gap (weak cover)
		var plankGeometry = new THREE.BoxGeometry(1.5, 0.5, 10);
		var plankMaterial = new THREE.MeshStandardMaterial({
			color: 0x654321,
			metalness: 0.2,
			roughness: 0.8
		});
		for (var i = 0; i < 3; i++) {
			var plank = new THREE.Mesh(plankGeometry, plankMaterial);
			plank.position.set(-11, 0.5 + i * 0.3, 0);
			gapGroup.add(plank);
		}

		environmentGroup.add(gapGroup);
	}

	function createDetailElements() {
		var detailGroup = new THREE.Group();

		// Ammunition crates (boxes for cover and visual detail)
		var cratePositions = [
			{ x: -25, z: 12 },
			{ x: 10, z: -10 },
			{ x: 35, z: 6 }
		];

		cratePositions.forEach(function(pos) {
			var crateGeometry = new THREE.BoxGeometry(3, 3, 3);
			var crateMaterial = new THREE.MeshStandardMaterial({
				color: 0x4a3a2a,
				metalness: 0.4,
				roughness: 0.6
			});
			var crate = new THREE.Mesh(crateGeometry, crateMaterial);
			crate.position.set(pos.x, 2.5, pos.z);
			crate.rotation.y = Math.random() * 0.5;
			crate.castShadow = true;
			detailGroup.add(crate);
		});

		// Defensive sandbags (cylinder stacked elements)
		var sandbagPositions = [
			{ x: -30, z: 15 },
			{ x: 20, z: -15 },
			{ x: 40, z: 0 }
		];

		sandbagPositions.forEach(function(pos) {
			for (var row = 0; row < 2; row++) {
				var sandGeometry = new THREE.CylinderGeometry(1.5, 1.5, 1, 8);
				var sandMaterial = new THREE.MeshStandardMaterial({
					color: 0x8b7355,
					metalness: 0.1,
					roughness: 0.9
				});
				var sandbag = new THREE.Mesh(sandGeometry, sandMaterial);
				sandbag.position.set(pos.x, 1.2 + row * 1.2, pos.z);
				detailGroup.add(sandbag);
			}
		});

		// Warning beacon spheres (tactical markers)
		var beaconPositions = [
			{ x: 0, z: 8 },
			{ x: 0, z: -8 }
		];

		beaconPositions.forEach(function(pos) {
			var beaconGeometry = new THREE.SphereGeometry(0.7, 10, 10);
			var beaconMaterial = new THREE.MeshStandardMaterial({
				color: 0xffaa00,
				emissive: 0xff8800,
				metalness: 0.8,
				roughness: 0.2
			});
			var beacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
			beacon.position.set(pos.x, 8, pos.z);
			detailGroup.add(beacon);
		});

		// Structural bracing lines using LineSegments
		var lineGeometry = new THREE.BufferGeometry();
		var linePositions = new Float32Array([
			-40, 6, -6,  -40, 14, 6,
			40, 6, -6,   40, 14, 6,
			-35, 3, 8,   -35, 3, -8,
			35, 3, 8,    35, 3, -8
		]);
		lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
		var lineMaterial = new THREE.LineBasicMaterial({ color: 0x4488ff, linewidth: 2 });
		var lines = new THREE.LineSegments(lineGeometry, lineMaterial);
		detailGroup.add(lines);

		environmentGroup.add(detailGroup);
	}

	function update(delta) {
		glowAnimationTime += delta;

		// Magma glow pulse effect
		var glowPulse = Math.sin(glowAnimationTime * 2.5) * 0.5 + 1.5;
		if (glowingMagmaLight) {
			glowingMagmaLight.intensity = glowPulse;
			var hueShift = Math.sin(glowAnimationTime * 1.2) * 30;
			glowingMagmaLight.color.setHSL(0.05 + hueShift / 360, 0.9, 0.5);
		}

		// Ambient light flicker for atmosphere
		if (ambientLight) {
			var flicker = 0.4 + Math.sin(glowAnimationTime * 3.7) * 0.1;
			ambientLight.intensity = flicker;
		}

		// Cooling pipe animations (subtle oscillation)
		coolingPipes.forEach(function(pipeData) {
			var oscillation = Math.sin(glowAnimationTime * pipeData.frequency + pipeData.mesh.position.x * 0.05) * pipeData.amplitude;
			pipeData.mesh.position.y = pipeData.baseY + oscillation;
		});

		// Steam vent particle effects (position updates for spawning in game loop)
		steamVents.forEach(function(vent, index) {
			vent.time += delta;
			if (vent.time > 2.0) {
				vent.time = 0;
			}
		});

		return true;
	}

	function reset() {
		glowAnimationTime = 0;
		steamVents.forEach(function(vent) {
			vent.time = 0;
		});
		return true;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
