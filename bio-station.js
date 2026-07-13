window.BioStation = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var time = 0;

	// Material library
	var materials = {};

	var initMaterials = function() {
		materials.wall = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.2, roughness: 0.8 });
		materials.floor = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.1, roughness: 0.9 });
		materials.metal = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.3 });
		materials.glass = new THREE.MeshStandardMaterial({ color: 0xaaffff, metalness: 0.1, roughness: 0.2, transparent: true, opacity: 0.6 });
		materials.hazard = new THREE.MeshStandardMaterial({ color: 0xffff00, metalness: 0.3, roughness: 0.6 });
		materials.hazardDark = new THREE.MeshStandardMaterial({ color: 0xff6600, metalness: 0.2, roughness: 0.7 });
		materials.specimen = new THREE.MeshStandardMaterial({ color: 0xff4444, metalness: 0.0, roughness: 0.8, transparent: true, opacity: 0.7 });
		materials.uvLight = new THREE.MeshBasicMaterial({ color: 0x0099ff });
		materials.snow = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.0, roughness: 0.95 });
		materials.barrier = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.4 });
	};

	// Geometry library
	var geometries = {};

	var initGeometries = function() {
		geometries.box = new THREE.BoxGeometry(1, 1, 1);
		geometries.cylinder = new THREE.CylinderGeometry(1, 1, 1, 8);
		geometries.sphere = new THREE.SphereGeometry(1, 8, 8);
		geometries.cone = new THREE.ConeGeometry(1, 1, 6);
	};

	// Station models object
	var stationModels = {
		mainBuilding: null,
		containmentChamber: null,
		decontAirlock: null,
		labSection: null,
		specimenTanks: [],
		hazardBarrels: [],
		barriers: [],
		uvLights: [],
		blizzardParticles: [],
		evacPad: null,
		airScrubbers: []
	};

	var createMainBuilding = function() {
		var building = new THREE.Group();

		// Outer wall structure
		var wallGeometry = geometries.box;
		var wall1 = new THREE.Mesh(wallGeometry, materials.wall);
		wall1.scale.set(20, 8, 15);
		wall1.position.set(0, 4, 0);
		building.add(wall1);

		// Interior floor
		var floorGeometry = geometries.box;
		var floor = new THREE.Mesh(floorGeometry, materials.floor);
		floor.scale.set(19, 0.5, 14);
		floor.position.set(0, 0.25, 0);
		building.add(floor);

		return building;
	};

	var createContainmentChamber = function() {
		var chamber = new THREE.Group();

		// Sealed room with glass panels
		var wallGeometry = geometries.box;
		var wall = new THREE.Mesh(wallGeometry, materials.wall);
		wall.scale.set(8, 6, 8);
		wall.position.set(10, 3, 5);
		chamber.add(wall);

		// Glass observation panels
		var panelGeometry = geometries.box;
		var panel1 = new THREE.Mesh(panelGeometry, materials.glass);
		panel1.scale.set(6, 4, 0.3);
		panel1.position.set(10, 3, 9);
		chamber.add(panel1);

		var panel2 = new THREE.Mesh(panelGeometry, materials.glass);
		panel2.scale.set(6, 4, 0.3);
		panel2.position.set(10, 3, 1);
		chamber.add(panel2);

		// Infected specimen inside chamber
		var specimenGeometry = geometries.cylinder;
		var specimen = new THREE.Mesh(specimenGeometry, materials.specimen);
		specimen.scale.set(3, 3, 3);
		specimen.position.set(10, 2, 5);
		chamber.add(specimen);
		stationModels.specimenTanks.push(specimen);

		return chamber;
	};

	var createDecontAirlock = function() {
		var airlock = new THREE.Group();

		// Airlock chamber
		var chambGeometry = geometries.box;
		var chamb = new THREE.Mesh(chambGeometry, materials.wall);
		chamb.scale.set(6, 7, 4);
		chamb.position.set(-10, 3.5, 0);
		airlock.add(chamb);

		// Pressure door 1
		var door1Geometry = geometries.box;
		var door1 = new THREE.Mesh(door1Geometry, materials.barrier);
		door1.scale.set(4, 5, 0.4);
		door1.position.set(-10, 3.5, -2.5);
		door1.name = 'door1';
		airlock.add(door1);

		// Pressure door 2
		var door2Geometry = geometries.box;
		var door2 = new THREE.Mesh(door2Geometry, materials.barrier);
		door2.scale.set(4, 5, 0.4);
		door2.position.set(-10, 3.5, 2.5);
		door2.name = 'door2';
		airlock.add(door2);

		// UV light panels (animated glow)
		var uvGeometry = geometries.sphere;
		var uv1 = new THREE.Mesh(uvGeometry, materials.uvLight);
		uv1.scale.set(1.5, 0.3, 3);
		uv1.position.set(-10, 6.5, 0);
		airlock.add(uv1);
		stationModels.uvLights.push(uv1);

		var uv2 = new THREE.Mesh(uvGeometry, materials.uvLight);
		uv2.scale.set(1.5, 0.3, 3);
		uv2.position.set(-10, 0.5, 0);
		airlock.add(uv2);
		stationModels.uvLights.push(uv2);

		return airlock;
	};

	var createLabSection = function() {
		var lab = new THREE.Group();

		// Lab main room
		var labGeometry = geometries.box;
		var labRoom = new THREE.Mesh(labGeometry, materials.wall);
		labRoom.scale.set(12, 6, 8);
		labRoom.position.set(0, 3, -12);
		lab.add(labRoom);

		// Lab benches (work stations)
		var benchGeometry = geometries.box;
		var bench1 = new THREE.Mesh(benchGeometry, materials.metal);
		bench1.scale.set(3, 1.5, 2);
		bench1.position.set(-3, 1, -12);
		lab.add(bench1);

		var bench2 = new THREE.Mesh(benchGeometry, materials.metal);
		bench2.scale.set(3, 1.5, 2);
		bench2.position.set(3, 1, -12);
		lab.add(bench2);

		// Flask equipment on benches
		var flaskGeometry = geometries.cylinder;
		var flask1 = new THREE.Mesh(flaskGeometry, materials.hazard);
		flask1.scale.set(0.4, 1.2, 0.4);
		flask1.position.set(-3, 2.5, -12);
		lab.add(flask1);

		var flask2 = new THREE.Mesh(flaskGeometry, materials.hazard);
		flask2.scale.set(0.4, 1.2, 0.4);
		flask2.position.set(3, 2.5, -12);
		lab.add(flask2);

		return lab;
	};

	var createSpecimenTanks = function() {
		var tanks = new THREE.Group();

		// Large cylindrical specimen tanks
		var tankGeometry = geometries.cylinder;
		var tank1 = new THREE.Mesh(tankGeometry, materials.metal);
		tank1.scale.set(2, 4, 2);
		tank1.position.set(5, 2, 0);
		tanks.add(tank1);
		stationModels.specimenTanks.push(tank1);

		// Specimen contents inside tank 1
		var contentsGeometry = geometries.sphere;
		var contents1 = new THREE.Mesh(contentsGeometry, materials.specimen);
		contents1.scale.set(1.8, 1.8, 1.8);
		contents1.position.set(5, 2, 0);
		contents1.name = 'tankContent';
		tanks.add(contents1);
		stationModels.specimenTanks.push(contents1);

		var tank2 = new THREE.Mesh(tankGeometry, materials.metal);
		tank2.scale.set(2, 4, 2);
		tank2.position.set(-5, 2, 0);
		tanks.add(tank2);
		stationModels.specimenTanks.push(tank2);

		var contents2 = new THREE.Mesh(contentsGeometry, materials.specimen);
		contents2.scale.set(1.8, 1.8, 1.8);
		contents2.position.set(-5, 2, 0);
		contents2.name = 'tankContent';
		tanks.add(contents2);
		stationModels.specimenTanks.push(contents2);

		return tanks;
	};

	var createHazardBarrels = function() {
		var barrels = new THREE.Group();

		// Bio-hazard sealed containers
		var barrelGeometry = geometries.cylinder;
		var barrel1 = new THREE.Mesh(barrelGeometry, materials.hazardDark);
		barrel1.scale.set(0.8, 1.5, 0.8);
		barrel1.position.set(-8, 0.75, -10);
		barrels.add(barrel1);
		stationModels.hazardBarrels.push(barrel1);

		var barrel2 = new THREE.Mesh(barrelGeometry, materials.hazardDark);
		barrel2.scale.set(0.8, 1.5, 0.8);
		barrel2.position.set(-6, 0.75, -10);
		barrels.add(barrel2);
		stationModels.hazardBarrels.push(barrel2);

		var barrel3 = new THREE.Mesh(barrelGeometry, materials.hazardDark);
		barrel3.scale.set(0.8, 1.5, 0.8);
		barrel3.position.set(-4, 0.75, -10);
		barrels.add(barrel3);
		stationModels.hazardBarrels.push(barrel3);

		// Yellow hazard stripe on barrels
		var stripeGeometry = geometries.box;
		var stripe1 = new THREE.Mesh(stripeGeometry, materials.hazard);
		stripe1.scale.set(0.7, 0.2, 0.9);
		stripe1.position.set(-8, 1.5, -10);
		barrels.add(stripe1);

		return barrels;
	};

	var createLockdownBarriers = function() {
		var barriers = new THREE.Group();

		// Sliding emergency walls
		var barrierGeometry = geometries.box;
		var barrier1 = new THREE.Mesh(barrierGeometry, materials.barrier);
		barrier1.scale.set(8, 6, 0.6);
		barrier1.position.set(0, 3, -8);
		barrier1.name = 'barrier1';
		barriers.add(barrier1);
		stationModels.barriers.push(barrier1);

		var barrier2 = new THREE.Mesh(barrierGeometry, materials.barrier);
		barrier2.scale.set(8, 6, 0.6);
		barrier2.position.set(0, 3, 8);
		barrier2.name = 'barrier2';
		barriers.add(barrier2);
		stationModels.barriers.push(barrier2);

		return barriers;
	};

	var createBlizzard = function() {
		var blizzard = new THREE.Group();

		// Blizzard snow particles
		var particleGeometry = geometries.sphere;
		var particleCount = 40;

		for (var i = 0; i < particleCount; i++) {
			var particle = new THREE.Mesh(particleGeometry, materials.snow);
			particle.scale.set(0.2, 0.2, 0.2);
			particle.position.set(
				(Math.random() - 0.5) * 30,
				Math.random() * 15,
				(Math.random() - 0.5) * 30
			);
			particle.name = 'snowParticle';
			particle.userData.baseY = particle.position.y;
			particle.userData.speed = Math.random() * 2 + 1;
			blizzard.add(particle);
			stationModels.blizzardParticles.push(particle);
		}

		return blizzard;
	};

	var createEvacPad = function() {
		var pad = new THREE.Group();

		// Helipad landing platform
		var padGeometry = geometries.box;
		var padSurface = new THREE.Mesh(padGeometry, materials.metal);
		padSurface.scale.set(8, 0.3, 8);
		padSurface.position.set(20, 0.15, -20);
		pad.add(padSurface);

		// Helipad markings (white cross)
		var crossGeometry = geometries.box;
		var crossH = new THREE.Mesh(crossGeometry, materials.snow);
		crossH.scale.set(6, 0.05, 1);
		crossH.position.set(20, 0.3, -20);
		pad.add(crossH);

		var crossV = new THREE.Mesh(crossGeometry, materials.snow);
		crossV.scale.set(1, 0.05, 6);
		crossV.position.set(20, 0.3, -20);
		pad.add(crossV);

		// Helicopter body
		var heliBodyGeometry = geometries.box;
		var heliBody = new THREE.Mesh(heliBodyGeometry, materials.metal);
		heliBody.scale.set(3, 2, 6);
		heliBody.position.set(20, 2, -20);
		pad.add(heliBody);

		// Helicopter cockpit
		var cockpitGeometry = geometries.cone;
		var cockpit = new THREE.Mesh(cockpitGeometry, materials.glass);
		cockpit.scale.set(1.5, 1.5, 2);
		cockpit.position.set(20, 3.5, -18);
		pad.add(cockpit);

		stationModels.evacPad = pad;
		return pad;
	};

	var createAirScrubbers = function() {
		var scrubbers = new THREE.Group();

		// Air filter units mounted on walls
		var filterGeometry = geometries.cylinder;
		var filter1 = new THREE.Mesh(filterGeometry, materials.metal);
		filter1.scale.set(0.6, 2, 0.6);
		filter1.position.set(-9, 5, -14);
		filter1.rotation.z = Math.PI / 2;
		scrubbers.add(filter1);
		stationModels.airScrubbers.push(filter1);

		var filter2 = new THREE.Mesh(filterGeometry, materials.metal);
		filter2.scale.set(0.6, 2, 0.6);
		filter2.position.set(9, 5, -14);
		filter2.rotation.z = Math.PI / 2;
		scrubbers.add(filter2);
		stationModels.airScrubbers.push(filter2);

		var filter3 = new THREE.Mesh(filterGeometry, materials.metal);
		filter3.scale.set(0.6, 2, 0.6);
		filter3.position.set(-9, 5, 14);
		filter3.rotation.z = Math.PI / 2;
		scrubbers.add(filter3);
		stationModels.airScrubbers.push(filter3);

		return scrubbers;
	};

	var createBiohazardWaste = function() {
		var waste = new THREE.Group();

		// Sealed disposal room
		var roomGeometry = geometries.box;
		var wasteRoom = new THREE.Mesh(roomGeometry, materials.wall);
		wasteRoom.scale.set(6, 5, 6);
		wasteRoom.position.set(15, 2.5, -12);
		waste.add(wasteRoom);

		// Glowing containers inside
		var containerGeometry = geometries.box;
		var container1 = new THREE.Mesh(containerGeometry, materials.hazardDark);
		container1.scale.set(2, 2, 2);
		container1.position.set(13, 1.5, -12);
		waste.add(container1);

		var container2 = new THREE.Mesh(containerGeometry, materials.hazardDark);
		container2.scale.set(2, 2, 2);
		container2.position.set(17, 1.5, -12);
		waste.add(container2);

		// Light glow effect
		var glowGeometry = geometries.sphere;
		var glow1 = new THREE.Mesh(glowGeometry, materials.uvLight);
		glow1.scale.set(2.2, 2.2, 2.2);
		glow1.position.set(13, 1.5, -12);
		glow1.userData.glowContainer = true;
		waste.add(glow1);

		var glow2 = new THREE.Mesh(glowGeometry, materials.uvLight);
		glow2.scale.set(2.2, 2.2, 2.2);
		glow2.position.set(17, 1.5, -12);
		glow2.userData.glowContainer = true;
		waste.add(glow2);

		return waste;
	};

	var createArctic = function() {
		var arctic = new THREE.Group();

		// Snow terrain ground
		var groundGeometry = geometries.box;
		var ground = new THREE.Mesh(groundGeometry, materials.snow);
		ground.scale.set(50, 1, 50);
		ground.position.set(0, -0.5, 0);
		arctic.add(ground);

		return arctic;
	};

	var init = function(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		time = 0;

		initMaterials();
		initGeometries();

		// Add all station components
		var building = createMainBuilding();
		scene.add(building);

		var containment = createContainmentChamber();
		scene.add(containment);

		var airlock = createDecontAirlock();
		scene.add(airlock);

		var lab = createLabSection();
		scene.add(lab);

		var tanks = createSpecimenTanks();
		scene.add(tanks);

		var barrels = createHazardBarrels();
		scene.add(barrels);

		var barriers = createLockdownBarriers();
		scene.add(barriers);

		var blizzard = createBlizzard();
		scene.add(blizzard);

		var evacPad = createEvacPad();
		scene.add(evacPad);

		var scrubbers = createAirScrubbers();
		scene.add(scrubbers);

		var waste = createBiohazardWaste();
		scene.add(waste);

		var arctic = createArctic();
		scene.add(arctic);

		// Add lighting
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		scene.add(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(20, 20, 10);
		directionalLight.castShadow = true;
		scene.add(directionalLight);

		// Hazard point lights
		var hazardLight1 = new THREE.PointLight(0xff6600, 1, 15);
		hazardLight1.position.set(-8, 1.5, -10);
		scene.add(hazardLight1);

		var hazardLight2 = new THREE.PointLight(0xff4444, 1.2, 20);
		hazardLight2.position.set(10, 2, 5);
		scene.add(hazardLight2);
	};

	var update = function(delta) {
		time += delta;

		// Animate UV lights with pulse effect
		for (var i = 0; i < stationModels.uvLights.length; i++) {
			var uvLight = stationModels.uvLights[i];
			var pulseFactor = Math.sin(time * 3) * 0.5 + 0.5;
			uvLight.material.opacity = 0.4 + pulseFactor * 0.3;
		}

		// Animate specimen tank contents swirling
		for (var j = 0; j < stationModels.specimenTanks.length; j++) {
			var tank = stationModels.specimenTanks[j];
			if (tank.name === 'tankContent') {
				tank.rotation.x += delta * 0.5;
				tank.rotation.y += delta * 0.3;
				var swirl = Math.sin(time * 2) * 0.15;
				tank.position.y = tank.userData.baseY !== undefined ? tank.userData.baseY + swirl : 2 + swirl;
			}
		}

		// Animate blizzard particles falling
		for (var k = 0; k < stationModels.blizzardParticles.length; k++) {
			var particle = stationModels.blizzardParticles[k];
			particle.position.y -= particle.userData.speed * delta;
			if (particle.position.y < 0) {
				particle.position.y = 15;
			}
			particle.position.x += Math.sin(time + k) * delta * 0.5;
		}

		// Animate lockdown barriers sliding
		for (var m = 0; m < stationModels.barriers.length; m++) {
			var barrier = stationModels.barriers[m];
			var slideAmount = Math.sin(time * 0.5) * 0.3;
			if (barrier.name === 'barrier1') {
				barrier.position.z = -8 + slideAmount;
			} else if (barrier.name === 'barrier2') {
				barrier.position.z = 8 - slideAmount;
			}
		}

		// Animate airlock door rotation
		if (scene) {
			scene.traverse(function(child) {
				if (child.name === 'door1') {
					var doorRotation = Math.sin(time * 1.5) * 0.3;
					child.rotation.y = doorRotation;
				} else if (child.name === 'door2') {
					var doorRotation2 = -Math.sin(time * 1.5) * 0.3;
					child.rotation.y = doorRotation2;
				}
			});
		}
	};

	var reset = function() {
		time = 0;
		stationModels.specimenTanks = [];
		stationModels.hazardBarrels = [];
		stationModels.barriers = [];
		stationModels.uvLights = [];
		stationModels.blizzardParticles = [];
		stationModels.airScrubbers = [];
	};

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
