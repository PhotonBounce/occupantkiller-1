window.SandStorm = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var environmentObjects = [];
	var sandParticles = [];
	var dustDevils = [];

	// Color palette for desert environment
	var COLORS = {
		SAND_LIGHT: 0xD2B48C,
		SAND_MEDIUM: 0xC19A6B,
		SAND_DARK: 0xA0826D,
		TAN: 0xBDB76B,
		KHAKI: 0xF0E68C,
		DUSTY_YELLOW: 0xEDCC81,
		RUST: 0xB7410E,
		CONCRETE: 0x8B8B7A,
		METAL: 0x696969,
		DARK_SAND: 0x8B7355
	};

	function createMaterial(color) {
		return new THREE.MeshStandardMaterial({
			color: color,
			roughness: 0.8,
			metalness: 0.1
		});
	}

	function createMetalMaterial(color) {
		return new THREE.MeshStandardMaterial({
			color: color,
			roughness: 0.3,
			metalness: 0.8
		});
	}

	function addToScene(mesh) {
		scene.add(mesh);
		environmentObjects.push(mesh);
		return mesh;
	}

	function createSandDunes() {
		var dunePositions = [
			{ x: -30, z: -25, scale: { w: 25, h: 8, d: 20 } },
			{ x: 20, z: -30, scale: { w: 22, h: 10, d: 18 } },
			{ x: -15, z: 15, scale: { w: 20, h: 6, d: 25 } },
			{ x: 35, z: 10, scale: { w: 18, h: 9, d: 22 } },
			{ x: 5, z: -15, scale: { w: 15, h: 7, d: 16 } },
			{ x: -35, z: 5, scale: { w: 24, h: 11, d: 20 } },
			{ x: 25, z: 25, scale: { w: 19, h: 8, d: 24 } },
			{ x: -20, z: 35, scale: { w: 21, h: 9, d: 19 } }
		];

		dunePositions.forEach(function(pos) {
			var geometry = new THREE.BoxGeometry(pos.scale.w, pos.scale.h, pos.scale.d);
			var material = createMaterial(COLORS.SAND_MEDIUM);
			var dune = new THREE.Mesh(geometry, material);
			dune.position.set(pos.x, pos.scale.h / 2, pos.z);
			dune.rotation.z = (Math.random() - 0.5) * 0.3;
			dune.castShadow = true;
			dune.receiveShadow = true;
			addToScene(dune);
		});
	}

	function createAbandonedVehicles() {
		// Tank 1
		var tankBody1 = new THREE.BoxGeometry(8, 4, 12);
		var tankMat = createMetalMaterial(COLORS.RUST);
		var tank1 = new THREE.Mesh(tankBody1, tankMat);
		tank1.position.set(-25, 2, 10);
		tank1.rotation.y = Math.PI * 0.3;
		tank1.castShadow = true;
		addToScene(tank1);

		var tankTurret1 = new THREE.BoxGeometry(6, 3, 6);
		var turret1 = new THREE.Mesh(tankTurret1, tankMat);
		turret1.position.set(-25, 5.5, 12);
		turret1.castShadow = true;
		addToScene(turret1);

		var tankBarrel1 = new THREE.CylinderGeometry(0.8, 0.8, 10, 8);
		var barrel1 = new THREE.Mesh(tankBarrel1, createMetalMaterial(COLORS.METAL));
		barrel1.position.set(-25, 5.5, 18);
		barrel1.rotation.z = Math.PI * 0.15;
		barrel1.castShadow = true;
		addToScene(barrel1);

		// Tank 2
		var tank2 = new THREE.Mesh(tankBody1, tankMat);
		tank2.position.set(30, 1.5, -20);
		tank2.rotation.y = Math.PI * 1.2;
		tank2.castShadow = true;
		addToScene(tank2);

		var turret2 = new THREE.Mesh(tankTurret1, tankMat);
		turret2.position.set(30, 5, -20);
		turret2.rotation.y = Math.PI * 0.5;
		turret2.castShadow = true;
		addToScene(turret2);

		var barrel2 = new THREE.Mesh(tankBarrel1, createMetalMaterial(COLORS.METAL));
		barrel2.position.set(35, 5, -20);
		barrel2.rotation.z = Math.PI * 0.2;
		barrel2.castShadow = true;
		addToScene(barrel2);

		// Truck 1
		var truckBody = new THREE.BoxGeometry(6, 5, 14);
		var truckMat = createMaterial(COLORS.DARK_SAND);
		var truck1 = new THREE.Mesh(truckBody, truckMat);
		truck1.position.set(10, 2.5, 20);
		truck1.rotation.y = Math.PI * 0.4;
		truck1.castShadow = true;
		addToScene(truck1);

		var truckCab = new THREE.BoxGeometry(5, 4, 5);
		var cab1 = new THREE.Mesh(truckCab, truckMat);
		cab1.position.set(10, 5, 24);
		cab1.castShadow = true;
		addToScene(cab1);

		// Truck 2 (overturned)
		var truck2 = new THREE.Mesh(truckBody, createMaterial(COLORS.TAN));
		truck2.position.set(-10, 3, -25);
		truck2.rotation.z = Math.PI * 0.6;
		truck2.rotation.y = Math.PI * 1.3;
		truck2.castShadow = true;
		addToScene(truck2);
	}

	function createRuinedBuildings() {
		// Building 1
		var buildingWall1 = new THREE.BoxGeometry(16, 14, 4);
		var brickMat = createMaterial(COLORS.CONCRETE);
		var wall1 = new THREE.Mesh(buildingWall1, brickMat);
		wall1.position.set(-28, 7, -10);
		wall1.castShadow = true;
		wall1.receiveShadow = true;
		addToScene(wall1);

		var wall1b = new THREE.Mesh(buildingWall1, brickMat);
		wall1b.position.set(-20, 7, -20);
		wall1b.rotation.y = Math.PI * 0.5;
		wall1b.castShadow = true;
		addToScene(wall1b);

		var roofCol1 = new THREE.BoxGeometry(14, 2, 8);
		var roof1 = new THREE.Mesh(roofCol1, createMaterial(COLORS.DARK_SAND));
		roof1.position.set(-24, 15, -15);
		roof1.castShadow = true;
		addToScene(roof1);

		// Building 2
		var buildingWall2 = new THREE.BoxGeometry(18, 12, 4);
		var wall2 = new THREE.Mesh(buildingWall2, brickMat);
		wall2.position.set(25, 6, 5);
		wall2.castShadow = true;
		addToScene(wall2);

		var wall2b = new THREE.Mesh(buildingWall2, brickMat);
		wall2b.position.set(34, 6, 14);
		wall2b.rotation.y = Math.PI * 0.5;
		wall2b.castShadow = true;
		addToScene(wall2b);

		var roof2 = new THREE.Mesh(roofCol1, createMaterial(COLORS.KHAKI));
		roof2.position.set(29, 13, 9);
		roof2.castShadow = true;
		addToScene(roof2);

		// Building 3 (small structure)
		var smallWall = new THREE.BoxGeometry(12, 10, 4);
		var wall3 = new THREE.Mesh(smallWall, brickMat);
		wall3.position.set(-5, 5, 28);
		wall3.castShadow = true;
		addToScene(wall3);

		var wall3b = new THREE.Mesh(smallWall, brickMat);
		wall3b.position.set(1, 5, 22);
		wall3b.rotation.y = Math.PI * 0.5;
		wall3b.castShadow = true;
		addToScene(wall3b);
	}

	function createDesertOutpost() {
		// Central platform
		var platform = new THREE.BoxGeometry(20, 1, 20);
		var platformMat = createMaterial(COLORS.CONCRETE);
		var centerPlatform = new THREE.Mesh(platform, platformMat);
		centerPlatform.position.set(0, 0.5, 0);
		centerPlatform.receiveShadow = true;
		addToScene(centerPlatform);

		// Sandbag walls
		var sandbagDim = { w: 3, h: 2, d: 1.5 };
		var sandbagMat = createMaterial(COLORS.TAN);

		var sandbagPositions = [
			{ x: -9, z: -9 },
			{ x: -9, z: 0 },
			{ x: -9, z: 9 },
			{ x: 0, z: -9 },
			{ x: 0, z: 9 },
			{ x: 9, z: -9 },
			{ x: 9, z: 0 },
			{ x: 9, z: 9 }
		];

		sandbagPositions.forEach(function(pos) {
			var bag = new THREE.Mesh(new THREE.BoxGeometry(sandbagDim.w, sandbagDim.h, sandbagDim.d), sandbagMat);
			bag.position.set(pos.x, sandbagDim.h / 2, pos.z);
			bag.castShadow = true;
			addToScene(bag);
		});

		// Watchtower
		var tower = new THREE.BoxGeometry(3, 8, 3);
		var towerMat = createMaterial(COLORS.CONCRETE);
		var watchtower = new THREE.Mesh(tower, towerMat);
		watchtower.position.set(0, 4, 0);
		watchtower.castShadow = true;
		addToScene(watchtower);

		var towerTop = new THREE.BoxGeometry(4, 1.5, 4);
		var top = new THREE.Mesh(towerTop, createMaterial(COLORS.METAL));
		top.position.set(0, 9, 0);
		top.castShadow = true;
		addToScene(top);
	}

	function createSandstormParticles() {
		var particleCount = 1500;
		var particleMat = new THREE.MeshStandardMaterial({
			color: COLORS.DUSTY_YELLOW,
			roughness: 0.9,
			metalness: 0,
			transparent: true,
			opacity: 0.6
		});

		for (var i = 0; i < particleCount; i++) {
			var size = Math.random() * 0.15 + 0.05;
			var geometry = new THREE.SphereGeometry(size, 4, 4);
			var particle = new THREE.Mesh(geometry, particleMat);

			particle.position.set(
				(Math.random() - 0.5) * 100,
				Math.random() * 40 - 5,
				(Math.random() - 0.5) * 100
			);

			particle.velocity = {
				x: (Math.random() - 0.5) * 2,
				y: (Math.random() - 0.5) * 0.5,
				z: (Math.random() - 0.5) * 2
			};

			particle.castShadow = false;
			addToScene(particle);
			sandParticles.push(particle);
		}
	}

	function createBuriedRuins() {
		// Ancient columns
		var columnMat = createMaterial(COLORS.SAND_DARK);

		var columnPositions = [
			{ x: -35, z: 20 },
			{ x: -30, z: 25 },
			{ x: -32, z: 18 },
			{ x: 38, z: -28 },
			{ x: 35, z: -30 },
			{ x: 40, z: -25 }
		];

		columnPositions.forEach(function(pos) {
			var column = new THREE.Mesh(
				new THREE.CylinderGeometry(1.2, 1.4, 8, 8),
				columnMat
			);
			column.position.set(pos.x, 4, pos.z);
			column.castShadow = true;
			addToScene(column);
		});
	}

	function createWeaponCaches() {
		var crateGeo = new THREE.BoxGeometry(3, 3, 3);
		var crateMat = createMaterial(COLORS.DARK_SAND);

		var crateCluster1Positions = [
			{ x: -40, z: 28 },
			{ x: -37, z: 30 },
			{ x: -38, z: 25 }
		];

		crateCluster1Positions.forEach(function(pos) {
			var crate = new THREE.Mesh(crateGeo, crateMat);
			crate.position.set(pos.x, 1.5, pos.z);
			crate.castShadow = true;
			addToScene(crate);
		});

		var crateCluster2Positions = [
			{ x: 38, z: 35 },
			{ x: 41, z: 32 },
			{ x: 40, z: 38 }
		];

		crateCluster2Positions.forEach(function(pos) {
			var crate = new THREE.Mesh(crateGeo, createMaterial(COLORS.TAN));
			crate.position.set(pos.x, 1.5, pos.z);
			crate.castShadow = true;
			addToScene(crate);
		});
	}

	function createDustDevils() {
		var devilPositions = [
			{ x: -15, z: -35 },
			{ x: 25, z: 15 },
			{ x: -35, z: 0 },
			{ x: 10, z: -30 }
		];

		devilPositions.forEach(function(pos) {
			var devilGeo = new THREE.CylinderGeometry(2.5, 2.5, 12, 8);
			var devilMat = new THREE.MeshStandardMaterial({
				color: COLORS.DUSTY_YELLOW,
				roughness: 0.8,
				metalness: 0,
				transparent: true,
				opacity: 0.3
			});
			var devil = new THREE.Mesh(devilGeo, devilMat);
			devil.position.set(pos.x, 6, pos.z);

			dustDevils.push({
				mesh: devil,
				rotation: 0
			});

			addToScene(devil);
		});
	}

	function createCommunicationTower() {
		// Main mast
		var mast = new THREE.BoxGeometry(1, 18, 1);
		var mastMat = createMetalMaterial(COLORS.METAL);
		var mainMast = new THREE.Mesh(mast, mastMat);
		mainMast.position.set(-38, 9, -38);
		mainMast.castShadow = true;
		addToScene(mainMast);

		// Cross arms
		var crossarm = new THREE.BoxGeometry(12, 0.5, 0.5);
		var arm1 = new THREE.Mesh(crossarm, mastMat);
		arm1.position.set(-38, 14, -38);
		arm1.castShadow = true;
		addToScene(arm1);

		var arm2 = new THREE.Mesh(crossarm, mastMat);
		arm2.position.set(-38, 11, -38);
		arm2.rotation.z = Math.PI * 0.5;
		arm2.castShadow = true;
		addToScene(arm2);

		// Antenna grid with LineSegments
		var antennaPts = [];
		for (var i = 0; i < 5; i++) {
			for (var j = 0; j < 5; j++) {
				antennaPts.push(new THREE.Vector3(
					-38 + (i - 2) * 2,
					15 + j * 0.8,
					-38 + (j - 2) * 2
				));
			}
		}

		var antennaGeo = new THREE.BufferGeometry().setFromPoints(antennaPts);
		var antennaLine = new THREE.LineSegments(antennaGeo, new THREE.LineBasicMaterial({ color: 0xCCCCCC }));
		addToScene(antennaLine);
	}

	function createDriedOasis() {
		// Crater
		var craterGeo = new THREE.BoxGeometry(16, 3, 16);
		var craterMat = createMaterial(COLORS.DARK_SAND);
		var crater = new THREE.Mesh(craterGeo, craterMat);
		crater.position.set(35, -1.5, -5);
		crater.receiveShadow = true;
		addToScene(crater);

		// Dead palm stumps
		var stumpMat = createMaterial(COLORS.SAND_DARK);

		var stumpPositions = [
			{ x: 30, z: -5 },
			{ x: 35, z: 0 },
			{ x: 40, z: -3 },
			{ x: 32, z: -8 },
			{ x: 38, z: -10 }
		];

		stumpPositions.forEach(function(pos) {
			var stump = new THREE.Mesh(
				new THREE.CylinderGeometry(0.8, 1, 4, 8),
				stumpMat
			);
			stump.position.set(pos.x, 2, pos.z);
			stump.castShadow = true;
			addToScene(stump);
		});
	}

	function createObservationPost() {
		// Elevated platform
		var platformGeo = new THREE.BoxGeometry(14, 1, 14);
		var platformMat = createMaterial(COLORS.CONCRETE);
		var platform = new THREE.Mesh(platformGeo, platformMat);
		platform.position.set(-15, 5, -15);
		platform.receiveShadow = true;
		addToScene(platform);

		// Support columns
		var colGeo = new THREE.BoxGeometry(1.5, 5, 1.5);
		var colMat = createMaterial(COLORS.CONCRETE);
		var colPositions = [
			{ x: -22, z: -22 },
			{ x: -22, z: -8 },
			{ x: -8, z: -22 },
			{ x: -8, z: -8 }
		];

		colPositions.forEach(function(pos) {
			var col = new THREE.Mesh(colGeo, colMat);
			col.position.set(pos.x, 2.5, pos.z);
			col.castShadow = true;
			addToScene(col);
		});

		// Sandbag perimeter
		var perimeter = [
			{ x: -24, z: -15 },
			{ x: -6, z: -15 },
			{ x: -15, z: -24 },
			{ x: -15, z: -6 }
		];

		var bagGeo = new THREE.BoxGeometry(2, 1.5, 1);
		var bagMat = createMaterial(COLORS.TAN);

		perimeter.forEach(function(pos) {
			var bag = new THREE.Mesh(bagGeo, bagMat);
			bag.position.set(pos.x, 5.75, pos.z);
			bag.castShadow = true;
			addToScene(bag);
		});
	}

	function createFuelDepot() {
		// Cylindrical tanks
		var tankGeo = new THREE.CylinderGeometry(2.5, 2.5, 6, 12);
		var tankMat = createMetalMaterial(COLORS.RUST);

		var tankPositions = [
			{ x: 15, z: 32 },
			{ x: 22, z: 32 },
			{ x: 15, z: 38 },
			{ x: 22, z: 38 }
		];

		tankPositions.forEach(function(pos) {
			var tank = new THREE.Mesh(tankGeo, tankMat);
			tank.position.set(pos.x, 3, pos.z);
			tank.castShadow = true;
			addToScene(tank);
		});

		// Pump stations
		var pumpBaseGeo = new THREE.BoxGeometry(4, 1, 4);
		var pumpMat = createMaterial(COLORS.CONCRETE);

		var pumpPositions = [
			{ x: 12, z: 30 },
			{ x: 25, z: 30 },
			{ x: 12, z: 40 },
			{ x: 25, z: 40 }
		];

		pumpPositions.forEach(function(pos) {
			var base = new THREE.Mesh(pumpBaseGeo, pumpMat);
			base.position.set(pos.x, 0.5, pos.z);
			base.receiveShadow = true;
			addToScene(base);

			var pump = new THREE.Mesh(
				new THREE.BoxGeometry(1.5, 3, 1.5),
				createMetalMaterial(COLORS.METAL)
			);
			pump.position.set(pos.x, 2, pos.z);
			pump.castShadow = true;
			addToScene(pump);
		});
	}

	function createTerrain() {
		// Ground plane
		var groundGeo = new THREE.BoxGeometry(160, 0.5, 160);
		var groundMat = createMaterial(COLORS.SAND_LIGHT);
		var ground = new THREE.Mesh(groundGeo, groundMat);
		ground.position.y = -0.25;
		ground.receiveShadow = true;
		addToScene(ground);
	}

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		environmentObjects = [];
		sandParticles = [];
		dustDevils = [];

		// Add lighting
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		scene.add(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(30, 40, 30);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		directionalLight.shadow.camera.left = -80;
		directionalLight.shadow.camera.right = 80;
		directionalLight.shadow.camera.top = 80;
		directionalLight.shadow.camera.bottom = -80;
		scene.add(directionalLight);

		// Fog for sandstorm effect
		scene.fog = new THREE.Fog(0xE8D4A2, 100, 200);

		// Build environment
		createTerrain();
		createSandDunes();
		createAbandonedVehicles();
		createRuinedBuildings();
		createDesertOutpost();
		createSandstormParticles();
		createBuriedRuins();
		createWeaponCaches();
		createDustDevils();
		createCommunicationTower();
		createDriedOasis();
		createObservationPost();
		createFuelDepot();
	}

	function update(delta) {
		// Animate sand particles drifting (wind effect)
		var windSpeed = 3;
		var windDirection = new THREE.Vector3(1, 0.2, 0.3).normalize();

		for (var i = 0; i < sandParticles.length; i++) {
			var particle = sandParticles[i];
			particle.position.addScaledVector(windDirection, windSpeed * delta);
			particle.position.y += particle.velocity.y * delta;

			// Wrap particles around
			if (particle.position.x > 50) particle.position.x = -50;
			if (particle.position.x < -50) particle.position.x = 50;
			if (particle.position.z > 50) particle.position.z = -50;
			if (particle.position.z < -50) particle.position.z = 50;
			if (particle.position.y > 40) particle.position.y = -5;
			if (particle.position.y < -5) particle.position.y = 40;
		}

		// Rotate dust devils
		for (var j = 0; j < dustDevils.length; j++) {
			dustDevils[j].rotation += delta * 3;
			dustDevils[j].mesh.rotation.y = dustDevils[j].rotation;
		}
	}

	function reset() {
		// Remove all environment objects
		for (var i = environmentObjects.length - 1; i >= 0; i--) {
			scene.remove(environmentObjects[i]);
			if (environmentObjects[i].geometry) {
				environmentObjects[i].geometry.dispose();
			}
			if (environmentObjects[i].material) {
				if (Array.isArray(environmentObjects[i].material)) {
					environmentObjects[i].material.forEach(function(mat) {
						mat.dispose();
					});
				} else {
					environmentObjects[i].material.dispose();
				}
			}
		}

		environmentObjects = [];
		sandParticles = [];
		dustDevils = [];

		// Remove fog
		if (scene.fog) {
			scene.fog = null;
		}
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
