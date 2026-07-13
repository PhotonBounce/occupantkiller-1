window.OrbitalDrop = (function() {
	'use strict';

	var scene;
	var camera;
	var materials = {};
	var dynamicObjects = [];
	var impactCraters = [];
	var countdownLights = [];
	var debrisObjects = [];

	function createMaterials() {
		materials.craterGlow = new THREE.MeshStandardMaterial({
			color: 0xff6600,
			emissive: 0xff6600,
			emissiveIntensity: 0.4,
			metalness: 0.6,
			roughness: 0.3
		});

		materials.concrete = new THREE.MeshStandardMaterial({
			color: 0x808080,
			metalness: 0.2,
			roughness: 0.8
		});

		materials.militaryTan = new THREE.MeshStandardMaterial({
			color: 0xd4a574,
			metalness: 0.1,
			roughness: 0.7
		});

		materials.darkMetal = new THREE.MeshStandardMaterial({
			color: 0x2a2a2a,
			metalness: 0.8,
			roughness: 0.2
		});

		materials.radiationGlow = new THREE.MeshStandardMaterial({
			color: 0x00dd00,
			emissive: 0x00dd00,
			emissiveIntensity: 0.3,
			metalness: 0.5,
			roughness: 0.4
		});

		materials.warningRed = new THREE.MeshStandardMaterial({
			color: 0xcc0000,
			emissive: 0x990000,
			emissiveIntensity: 0.2,
			metalness: 0.3,
			roughness: 0.6
		});
	}

	function createMainCrater() {
		var craterGroup = new THREE.Group();

		var outerPitGeometry = new THREE.BoxGeometry(40, 18, 40);
		var outerPitMaterial = new THREE.MeshStandardMaterial({
			color: 0x1a1a1a,
			metalness: 0.3,
			roughness: 0.9
		});
		var outerPit = new THREE.Mesh(outerPitGeometry, outerPitMaterial);
		outerPit.position.y = -9;
		outerPit.position.z = 0;
		craterGroup.add(outerPit);

		var glowingCoreGeometry = new THREE.CylinderGeometry(12, 15, 6, 16);
		var glowingCore = new THREE.Mesh(glowingCoreGeometry, materials.craterGlow);
		glowingCore.position.y = -15;
		glowingCore.position.z = 0;
		craterGroup.add(glowingCore);
		impactCraters.push({
			mesh: glowingCore,
			baseIntensity: 0.4,
			pulseSpeed: 1.2
		});

		var rimGeometry = new THREE.BoxGeometry(50, 2, 50);
		var rimMaterial = new THREE.MeshStandardMaterial({
			color: 0x4a4a4a,
			metalness: 0.2,
			roughness: 0.8
		});
		var rim = new THREE.Mesh(rimGeometry, rimMaterial);
		rim.position.y = 0;
		rim.position.z = 0;
		scene.add(rim);

		return craterGroup;
	}

	function createSecondaryImpact() {
		var impactGroup = new THREE.Group();
		impactGroup.position.set(35, 0, 35);

		var pitGeometry = new THREE.BoxGeometry(20, 10, 20);
		var pitMaterial = new THREE.MeshStandardMaterial({
			color: 0x0a0a0a,
			metalness: 0.2,
			roughness: 0.9
		});
		var pit = new THREE.Mesh(pitGeometry, pitMaterial);
		pit.position.y = -5;
		impactGroup.add(pit);

		var coreGeometry = new THREE.CylinderGeometry(7, 10, 4, 12);
		var core = new THREE.Mesh(coreGeometry, materials.radiationGlow);
		core.position.y = -10;
		impactGroup.add(core);
		impactCraters.push({
			mesh: core,
			baseIntensity: 0.3,
			pulseSpeed: 1.5
		});

		return impactGroup;
	}

	function createTertiaryImpact() {
		var impactGroup = new THREE.Group();
		impactGroup.position.set(-40, 0, 25);

		var pitGeometry = new THREE.BoxGeometry(18, 9, 18);
		var pitMaterial = new THREE.MeshStandardMaterial({
			color: 0x0a0a0a,
			metalness: 0.2,
			roughness: 0.9
		});
		var pit = new THREE.Mesh(pitGeometry, pitMaterial);
		pit.position.y = -4.5;
		impactGroup.add(pit);

		var coreGeometry = new THREE.SphereGeometry(6, 12, 12);
		var core = new THREE.Mesh(coreGeometry, materials.craterGlow);
		core.position.y = -9;
		impactGroup.add(core);
		impactCraters.push({
			mesh: core,
			baseIntensity: 0.35,
			pulseSpeed: 0.9
		});

		return impactGroup;
	}

	function createCommandTrailer() {
		var trailerGroup = new THREE.Group();
		trailerGroup.position.set(-30, 0, -30);

		var bodyGeometry = new THREE.BoxGeometry(12, 6, 5);
		var body = new THREE.Mesh(bodyGeometry, materials.militaryTan);
		body.position.y = 3;
		trailerGroup.add(body);

		var roofGeometry = new THREE.BoxGeometry(12, 1, 5);
		var roof = new THREE.Mesh(roofGeometry, materials.darkMetal);
		roof.position.y = 6.5;
		trailerGroup.add(roof);

		var doorGeometry = new THREE.BoxGeometry(2, 4, 0.5);
		var door = new THREE.Mesh(doorGeometry, materials.darkMetal);
		door.position.set(4.5, 3, 2.7);
		trailerGroup.add(door);

		var radarGeometry = new THREE.CylinderGeometry(1.5, 1.5, 8, 12);
		var radar = new THREE.Mesh(radarGeometry, materials.darkMetal);
		radar.position.set(0, 10, 0);
		trailerGroup.add(radar);

		var antennaMesh = createAntenna();
		antennaMesh.position.set(0, 12, 0);
		trailerGroup.add(antennaMesh);

		return trailerGroup;
	}

	function createAntenna() {
		var antennaGroup = new THREE.Group();

		var rodGeometry = new THREE.CylinderGeometry(0.3, 0.3, 6, 8);
		var rod1 = new THREE.Mesh(rodGeometry, materials.darkMetal);
		rod1.position.set(-1, 3, 0);
		antennaGroup.add(rod1);

		var rod2 = new THREE.Mesh(rodGeometry, materials.darkMetal);
		rod2.position.set(1, 3, 0);
		antennaGroup.add(rod2);

		return antennaGroup;
	}

	function createCountdownDisplay() {
		var displayGroup = new THREE.Group();
		displayGroup.position.set(20, 0, -35);

		var baseGeometry = new THREE.BoxGeometry(6, 8, 2);
		var base = new THREE.Mesh(baseGeometry, materials.concrete);
		base.position.y = 4;
		displayGroup.add(base);

		var screenGeometry = new THREE.BoxGeometry(5, 6, 0.3);
		var screenMaterial = new THREE.MeshStandardMaterial({
			color: 0x1a1a1a,
			emissive: 0x333333,
			metalness: 0.8,
			roughness: 0.1
		});
		var screen = new THREE.Mesh(screenGeometry, screenMaterial);
		screen.position.set(0, 5, 1.2);
		displayGroup.add(screen);

		for (var i = 0; i < 4; i++) {
			var lightGeometry = new THREE.SphereGeometry(0.5, 8, 8);
			var light = new THREE.Mesh(lightGeometry, materials.warningRed);
			light.position.set(-1.5 + i * 1.2, 7.5, 1.3);
			displayGroup.add(light);
			countdownLights.push({
				mesh: light,
				baseIntensity: 0.2,
				index: i
			});
		}

		return displayGroup;
	}

	function createBlastShelter() {
		var shelterGroup = new THREE.Group();
		shelterGroup.position.set(35, 0, -40);

		var wallFrontGeometry = new THREE.BoxGeometry(14, 5, 1);
		var wall1 = new THREE.Mesh(wallFrontGeometry, materials.concrete);
		wall1.position.set(0, 2.5, -7);
		shelterGroup.add(wall1);

		var wallBackGeometry = new THREE.BoxGeometry(14, 5, 1);
		var wall2 = new THREE.Mesh(wallBackGeometry, materials.concrete);
		wall2.position.set(0, 2.5, 7);
		shelterGroup.add(wall2);

		var wallLeftGeometry = new THREE.BoxGeometry(1, 5, 14);
		var wall3 = new THREE.Mesh(wallLeftGeometry, materials.concrete);
		wall3.position.set(-7, 2.5, 0);
		shelterGroup.add(wall3);

		var wallRightGeometry = new THREE.BoxGeometry(1, 5, 14);
		var wall4 = new THREE.Mesh(wallRightGeometry, materials.concrete);
		wall4.position.set(7, 2.5, 0);
		shelterGroup.add(wall4);

		var roofGeometry = new THREE.BoxGeometry(14, 1, 14);
		var roof = new THREE.Mesh(roofGeometry, materials.concrete);
		roof.position.set(0, 5.5, 0);
		shelterGroup.add(roof);

		var entranceGeometry = new THREE.BoxGeometry(3, 4, 1);
		var entrance = new THREE.Mesh(entranceGeometry, materials.darkMetal);
		entrance.position.set(0, 2, -7.5);
		shelterGroup.add(entrance);

		return shelterGroup;
	}

	function createShatteredBuilding() {
		var buildingGroup = new THREE.Group();
		buildingGroup.position.set(-35, 0, -35);

		var wallGeometry = new THREE.BoxGeometry(10, 12, 8);
		var wallMaterial = new THREE.MeshStandardMaterial({
			color: 0x888888,
			metalness: 0.1,
			roughness: 0.8
		});

		var wall1 = new THREE.Mesh(wallGeometry, wallMaterial);
		wall1.position.set(-3, 6, 3);
		wall1.rotation.z = 0.2;
		buildingGroup.add(wall1);

		var wall2 = new THREE.Mesh(wallGeometry, wallMaterial);
		wall2.position.set(3, 6, -3);
		wall2.rotation.z = -0.15;
		buildingGroup.add(wall2);

		var cornerDebrisGeometry = new THREE.BoxGeometry(4, 8, 4);
		var corner1 = new THREE.Mesh(cornerDebrisGeometry, wallMaterial);
		corner1.position.set(-5, 4, -4);
		corner1.rotation.z = 0.3;
		buildingGroup.add(corner1);
		debrisObjects.push({
			mesh: corner1,
			vibrationAmount: 0.1
		});

		var corner2 = new THREE.Mesh(cornerDebrisGeometry, wallMaterial);
		corner2.position.set(5, 4, 4);
		corner2.rotation.z = -0.25;
		buildingGroup.add(corner2);
		debrisObjects.push({
			mesh: corner2,
			vibrationAmount: 0.1
		});

		return buildingGroup;
	}

	function createDebrisField() {
		var fieldGroup = new THREE.Group();
		fieldGroup.position.set(-15, 0, 35);

		var debrisPositions = [
			[-8, 0, -8],
			[-4, 0, 2],
			[6, 0, -3],
			[2, 0, 6],
			[-6, 0, 4],
			[8, 0, 1]
		];

		for (var i = 0; i < debrisPositions.length; i++) {
			var debrisGeometry = new THREE.BoxGeometry(3 + i % 2 * 1, 2, 3 + i % 2 * 1);
			var debrisMaterial = new THREE.MeshStandardMaterial({
				color: 0x555555,
				metalness: 0.3,
				roughness: 0.7
			});
			var debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
			debris.position.set(debrisPositions[i][0], debrisPositions[i][1], debrisPositions[i][2]);
			debris.rotation.y = Math.random() * Math.PI;
			fieldGroup.add(debris);
			debrisObjects.push({
				mesh: debris,
				vibrationAmount: 0.08,
				baseY: debris.position.y
			});
		}

		return fieldGroup;
	}

	function createEMPVehicle() {
		var vehicleGroup = new THREE.Group();
		vehicleGroup.position.set(25, 0, 20);

		var bodyGeometry = new THREE.BoxGeometry(6, 3, 10);
		var body = new THREE.Mesh(bodyGeometry, materials.darkMetal);
		body.position.y = 1.5;
		vehicleGroup.add(body);

		var turretGeometry = new THREE.CylinderGeometry(1.5, 1.5, 2, 8);
		var turret = new THREE.Mesh(turretGeometry, materials.darkMetal);
		turret.position.y = 3.5;
		vehicleGroup.add(turret);

		var gunGeometry = new THREE.CylinderGeometry(0.4, 0.4, 6, 6);
		var gun = new THREE.Mesh(gunGeometry, materials.darkMetal);
		gun.position.set(0, 4, 3);
		gun.rotation.x = 0.3;
		vehicleGroup.add(gun);

		var wheelRadius = 0.8;
		var wheelPositions = [
			[-2.5, wheelRadius, -3],
			[2.5, wheelRadius, -3],
			[-2.5, wheelRadius, 3],
			[2.5, wheelRadius, 3]
		];

		for (var i = 0; i < wheelPositions.length; i++) {
			var wheelGeometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 1, 12);
			var wheel = new THREE.Mesh(wheelGeometry, materials.darkMetal);
			wheel.position.set(wheelPositions[i][0], wheelPositions[i][1], wheelPositions[i][2]);
			wheel.rotation.z = Math.PI / 2;
			vehicleGroup.add(wheel);
		}

		return vehicleGroup;
	}

	function createSeismicStation() {
		var stationGroup = new THREE.Group();
		stationGroup.position.set(-25, 0, 10);

		var baseGeometry = new THREE.CylinderGeometry(2, 2.5, 0.5, 12);
		var base = new THREE.Mesh(baseGeometry, materials.concrete);
		base.position.y = 0.25;
		stationGroup.add(base);

		var mast1Geometry = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);
		var mast1 = new THREE.Mesh(mast1Geometry, materials.darkMetal);
		mast1.position.set(-1, 4, 0);
		stationGroup.add(mast1);

		var mast2Geometry = new THREE.CylinderGeometry(0.3, 0.3, 7, 8);
		var mast2 = new THREE.Mesh(mast2Geometry, materials.darkMetal);
		mast2.position.set(1, 3.5, 0);
		stationGroup.add(mast2);

		var sensorGeometry = new THREE.SphereGeometry(0.5, 8, 8);
		var sensor1 = new THREE.Mesh(sensorGeometry, materials.radiationGlow);
		sensor1.position.set(-1, 8.5, 0);
		stationGroup.add(sensor1);

		var sensor2 = new THREE.Mesh(sensorGeometry, materials.radiationGlow);
		sensor2.position.set(1, 7.5, 0);
		stationGroup.add(sensor2);

		return stationGroup;
	}

	function createAmmoDepot() {
		var depotGroup = new THREE.Group();
		depotGroup.position.set(10, 0, -20);

		var containerGeometry = new THREE.BoxGeometry(8, 6, 6);
		var container1 = new THREE.Mesh(containerGeometry, materials.militaryTan);
		container1.position.set(0, 3, 0);
		depotGroup.add(container1);

		var roofGeometry = new THREE.BoxGeometry(8, 1, 6);
		var roof = new THREE.Mesh(roofGeometry, materials.darkMetal);
		roof.position.set(0, 6.5, 0);
		depotGroup.add(roof);

		var compartmentGeometry = new THREE.BoxGeometry(3, 4, 2);
		for (var i = 0; i < 2; i++) {
			var compartment = new THREE.Mesh(compartmentGeometry, materials.concrete);
			compartment.position.set(-2.5 + i * 5, 3, 0);
			depotGroup.add(compartment);
		}

		var markingGeometry = new THREE.BoxGeometry(1.5, 2, 0.3);
		var marking = new THREE.Mesh(markingGeometry, materials.warningRed);
		marking.position.set(0, 5, 3.2);
		depotGroup.add(marking);

		return depotGroup;
	}

	function createCrackPattern() {
		var crackGroup = new THREE.Group();
		crackGroup.position.set(0, 0.05, 0);

		var crackPositions = [
			[0, 0, 0],
			[15, 0, 10],
			[-10, 0, -15],
			[20, 0, -8],
			[-18, 0, 12]
		];

		for (var i = 0; i < crackPositions.length; i++) {
			var crackGeometry = new THREE.LineSegments(
				new THREE.BufferGeometry().setFromPoints([
					new THREE.Vector3(0, 0, 0),
					new THREE.Vector3(8, 0, 0)
				]),
				new THREE.LineBasicMaterial({color: 0x444444, linewidth: 2})
			);
			crackGeometry.rotateZ(Math.random() * Math.PI);
			crackGeometry.position.set(crackPositions[i][0], crackPositions[i][1], crackPositions[i][2]);
			crackGroup.add(crackGeometry);
		}

		return crackGroup;
	}

	function createFalloutZones() {
		var zoneGroup = new THREE.Group();

		var zone1Geometry = new THREE.CylinderGeometry(12, 12, 0.3, 16);
		var zoneMaterial = new THREE.MeshStandardMaterial({
			color: 0xccaa00,
			emissive: 0x664400,
			emissiveIntensity: 0.15,
			transparent: true,
			opacity: 0.3,
			metalness: 0,
			roughness: 0.9
		});
		var zone1 = new THREE.Mesh(zone1Geometry, zoneMaterial);
		zone1.position.set(35, 0.15, 35);
		zoneGroup.add(zone1);

		var zone2 = new THREE.Mesh(zone1Geometry, zoneMaterial);
		zone2.position.set(-40, 0.15, 25);
		zoneGroup.add(zone2);

		return zoneGroup;
	}

	function init(initScene, initCamera) {
		scene = initScene;
		camera = initCamera;

		createMaterials();

		var mainCrater = createMainCrater();
		scene.add(mainCrater);

		var secondaryImpact = createSecondaryImpact();
		scene.add(secondaryImpact);

		var tertiaryImpact = createTertiaryImpact();
		scene.add(tertiaryImpact);

		var commandTrailer = createCommandTrailer();
		scene.add(commandTrailer);

		var countdownDisplay = createCountdownDisplay();
		scene.add(countdownDisplay);

		var blastShelter = createBlastShelter();
		scene.add(blastShelter);

		var shatteredBuilding = createShatteredBuilding();
		scene.add(shatteredBuilding);

		var debrisField = createDebrisField();
		scene.add(debrisField);

		var empVehicle = createEMPVehicle();
		scene.add(empVehicle);

		var seismicStation = createSeismicStation();
		scene.add(seismicStation);

		var ammoDepot = createAmmoDepot();
		scene.add(ammoDepot);

		var crackPattern = createCrackPattern();
		scene.add(crackPattern);

		var falloutZones = createFalloutZones();
		scene.add(falloutZones);

		var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		scene.add(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
		directionalLight.position.set(30, 50, 30);
		directionalLight.castShadow = true;
		scene.add(directionalLight);

		var craterLight = new THREE.PointLight(0xff6600, 1.5, 60);
		craterLight.position.set(0, -10, 0);
		scene.add(craterLight);

		var secondaryLight = new THREE.PointLight(0x00dd00, 0.8, 40);
		secondaryLight.position.set(35, -8, 35);
		scene.add(secondaryLight);

		var tertiaryLight = new THREE.PointLight(0xff6600, 0.7, 35);
		tertiaryLight.position.set(-40, -8, 25);
		scene.add(tertiaryLight);

		dynamicObjects.push({
			time: 0
		});
	}

	function updateCraterGlows(delta) {
		for (var i = 0; i < impactCraters.length; i++) {
			var crater = impactCraters[i];
			var pulseValue = Math.sin(dynamicObjects[0].time * crater.pulseSpeed) * 0.3 + crater.baseIntensity;
			crater.mesh.material.emissiveIntensity = pulseValue;
		}
	}

	function updateCountdownLights(delta) {
		for (var i = 0; i < countdownLights.length; i++) {
			var light = countdownLights[i];
			var timeOffset = (dynamicObjects[0].time + light.index * 0.25) * 3;
			var pulse = Math.sin(timeOffset) > 0 ? 0.8 : 0.2;
			light.mesh.material.emissiveIntensity = pulse;
		}
	}

	function updateDebrisVibration(delta) {
		for (var i = 0; i < debrisObjects.length; i++) {
			var debris = debrisObjects[i];
			var vibration = Math.sin(dynamicObjects[0].time * 2.5 + i) * debris.vibrationAmount;
			if (debris.baseY !== undefined) {
				debris.mesh.position.y = debris.baseY + vibration;
			} else {
				debris.mesh.position.y += vibration;
			}
			debris.mesh.rotation.x += 0.001 * Math.sin(dynamicObjects[0].time + i);
		}
	}

	function update(delta) {
		if (dynamicObjects.length === 0) {
			return;
		}

		dynamicObjects[0].time += delta;

		updateCraterGlows(delta);
		updateCountdownLights(delta);
		updateDebrisVibration(delta);
	}

	function reset() {
		dynamicObjects[0].time = 0;
		impactCraters.length = 0;
		countdownLights.length = 0;
		debrisObjects.length = 0;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
