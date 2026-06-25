window.UnderseaDome = (function() {
	'use strict';

	var scene = null;
	var materials = {};
	var elements = [];
	var lightRippleTime = 0;
	var reactorPulseTime = 0;
	var bioLightFlickerTime = 0;
	var waterBreachActive = false;
	var waterBreachIntensity = 0;

	var init = function(sceneRef) {
		scene = sceneRef;
		scene.background = new THREE.Color(0x001a2e);
		scene.fog = new THREE.Fog(0x001a2e, 150, 200);

		createMaterials();
		buildDomeShell();
		buildReactorCore();
		buildMainFloor();
		buildObservationLevel();
		buildDockingTube();
		buildBulkheads();
		buildDecompressionChambers();
		buildCorpseRemnants();
		buildLighting();

		return true;
	};

	var createMaterials = function() {
		materials.domeWhite = new THREE.MeshStandardMaterial({
			color: 0xf5f5f5,
			metalness: 0.3,
			roughness: 0.6
		});

		materials.reactorCyan = new THREE.MeshStandardMaterial({
			color: 0x00ffff,
			emissive: 0x00ccff,
			metalness: 0.8,
			roughness: 0.2
		});

		materials.oceanDark = new THREE.MeshStandardMaterial({
			color: 0x0a1f2e,
			metalness: 0.1,
			roughness: 0.8
		});

		materials.corralOrange = new THREE.MeshStandardMaterial({
			color: 0xff8844,
			metalness: 0.2,
			roughness: 0.7
		});

		materials.steelGray = new THREE.MeshStandardMaterial({
			color: 0x444444,
			metalness: 0.6,
			roughness: 0.4
		});

		materials.warningRed = new THREE.MeshStandardMaterial({
			color: 0xff3333,
			emissive: 0xaa0000,
			metalness: 0.3,
			roughness: 0.5
		});

		materials.bioLight = new THREE.MeshStandardMaterial({
			color: 0x00dd88,
			emissive: 0x00aa66,
			metalness: 0.1,
			roughness: 0.6
		});

		materials.waterEmissive = new THREE.MeshStandardMaterial({
			color: 0x003366,
			emissive: 0x0066aa,
			metalness: 0.5,
			roughness: 0.3
		});
	};

	var buildDomeShell = function() {
		var domeRadius = 30;
		var domeHeight = 25;
		var segmentCount = 12;
		var heightSegments = 8;

		for (var h = 0; h < heightSegments; h++) {
			var currentRadius = domeRadius * Math.sin((h / heightSegments) * Math.PI / 2);
			var nextRadius = domeRadius * Math.sin(((h + 1) / heightSegments) * Math.PI / 2);
			var currentHeight = (h / heightSegments) * domeHeight;
			var nextHeight = ((h + 1) / heightSegments) * domeHeight;

			for (var s = 0; s < segmentCount; s++) {
				var angle = (s / segmentCount) * Math.PI * 2;
				var nextAngle = ((s + 1) / segmentCount) * Math.PI * 2;

				var x1 = Math.cos(angle) * currentRadius;
				var z1 = Math.sin(angle) * currentRadius;
				var x2 = Math.cos(nextAngle) * currentRadius;
				var z2 = Math.sin(nextAngle) * currentRadius;
				var x3 = Math.cos(angle) * nextRadius;
				var z3 = Math.sin(angle) * nextRadius;
				var x4 = Math.cos(nextAngle) * nextRadius;
				var z4 = Math.sin(nextAngle) * nextRadius;

				var boxGeo = new THREE.BoxGeometry(2, 1.5, 2);
				var segment = new THREE.Mesh(boxGeo, materials.domeWhite);
				segment.position.set((x1 + x2 + x3 + x4) / 4, currentHeight + 1, (z1 + z2 + z3 + z4) / 4);
				segment.scale.set(1.2, 1, 1.2);
				scene.add(segment);
				elements.push(segment);
			}
		}
	};

	var buildReactorCore = function() {
		var coreGeo = new THREE.SphereGeometry(3, 16, 16);
		var core = new THREE.Mesh(coreGeo, materials.reactorCyan);
		core.position.set(0, 2, 0);
		core.userData.isReactor = true;
		scene.add(core);
		elements.push(core);

		var shieldGeo = new THREE.CylinderGeometry(5, 5, 8, 8);
		var shield = new THREE.Mesh(shieldGeo, materials.steelGray);
		shield.position.set(0, 2, 0);
		scene.add(shield);
		elements.push(shield);

		var coreAccessGeo = new THREE.BoxGeometry(2, 4, 2);
		var coreAccess = new THREE.Mesh(coreAccessGeo, materials.warningRed);
		coreAccess.position.set(0, 6, 0);
		scene.add(coreAccess);
		elements.push(coreAccess);
	};

	var buildMainFloor = function() {
		var floorGeo = new THREE.BoxGeometry(60, 1, 60);
		var floor = new THREE.Mesh(floorGeo, materials.steelGray);
		floor.position.set(0, 0, 0);
		scene.add(floor);
		elements.push(floor);

		for (var i = 0; i < 6; i++) {
			var angle = (i / 6) * Math.PI * 2;
			var x = Math.cos(angle) * 20;
			var z = Math.sin(angle) * 20;

			var pillarGeo = new THREE.CylinderGeometry(1.5, 1.5, 12, 8);
			var pillar = new THREE.Mesh(pillarGeo, materials.steelGray);
			pillar.position.set(x, 6, z);
			scene.add(pillar);
			elements.push(pillar);
		}
	};

	var buildObservationLevel = function() {
		var platformGeo = new THREE.BoxGeometry(45, 1, 45);
		var platform = new THREE.Mesh(platformGeo, materials.domeWhite);
		platform.position.set(0, 15, 0);
		scene.add(platform);
		elements.push(platform);

		for (var i = 0; i < 8; i++) {
			var angle = (i / 8) * Math.PI * 2;
			var x = Math.cos(angle) * 22;
			var z = Math.sin(angle) * 22;

			var windowGeo = new THREE.BoxGeometry(3, 4, 0.3);
			var window = new THREE.Mesh(windowGeo, materials.waterEmissive);
			window.position.set(x, 16, z);
			window.rotation.y = angle;
			scene.add(window);
			elements.push(window);
		}
	};

	var buildDockingTube = function() {
		var tubeGeo = new THREE.CylinderGeometry(2.5, 2.5, 20, 8);
		var tube = new THREE.Mesh(tubeGeo, materials.steelGray);
		tube.position.set(35, 18, 0);
		tube.rotation.z = Math.PI / 2;
		scene.add(tube);
		elements.push(tube);

		var dockingPadGeo = new THREE.BoxGeometry(4, 1, 4);
		var dockingPad = new THREE.Mesh(dockingPadGeo, materials.warningRed);
		dockingPad.position.set(45, 18, 0);
		scene.add(dockingPad);
		elements.push(dockingPad);

		var airLockGeo = new THREE.CylinderGeometry(2.5, 2.5, 3, 8);
		var airLock = new THREE.Mesh(airLockGeo, materials.domeWhite);
		airLock.position.set(50, 18, 0);
		airLock.rotation.z = Math.PI / 2;
		scene.add(airLock);
		elements.push(airLock);
	};

	var buildBulkheads = function() {
		var bulkheadPositions = [
			[-25, 8, 0],
			[25, 8, 0],
			[0, 8, -25],
			[0, 8, 25],
			[-15, 12, 15],
			[15, 12, -15]
		];

		for (var i = 0; i < bulkheadPositions.length; i++) {
			var pos = bulkheadPositions[i];
			var bulkheadGeo = new THREE.BoxGeometry(4, 6, 0.5);
			var bulkhead = new THREE.Mesh(bulkheadGeo, materials.warningRed);
			bulkhead.position.set(pos[0], pos[1], pos[2]);
			scene.add(bulkhead);
			elements.push(bulkhead);
		}
	};

	var buildDecompressionChambers = function() {
		var chamberPositions = [
			[-20, 10, -20],
			[20, 10, -20],
			[20, 10, 20],
			[-20, 10, 20]
		];

		for (var i = 0; i < chamberPositions.length; i++) {
			var pos = chamberPositions[i];
			var chamberGeo = new THREE.CylinderGeometry(3, 3, 5, 6);
			var chamber = new THREE.Mesh(chamberGeo, materials.domeWhite);
			chamber.position.set(pos[0], pos[1], pos[2]);
			scene.add(chamber);
			elements.push(chamber);

			var doorGeo = new THREE.BoxGeometry(2.5, 3.5, 0.2);
			var door = new THREE.Mesh(doorGeo, materials.steelGray);
			door.position.set(pos[0], pos[1], pos[2] + 3.2);
			scene.add(door);
			elements.push(door);
		}
	};

	var buildCorpseRemnants = function() {
		var debrisPositions = [
			[-30, 0.5, -30],
			[28, 0.5, 28],
			[-35, 1, 10],
			[32, 0.8, -15],
			[0, 5, 35]
		];

		for (var i = 0; i < debrisPositions.length; i++) {
			var pos = debrisPositions[i];
			var debrisGeo = new THREE.BoxGeometry(1.5, 0.8, 1.5);
			var debris = new THREE.Mesh(debrisGeo, materials.warningRed);
			debris.position.set(pos[0], pos[1], pos[2]);
			debris.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
			scene.add(debris);
			elements.push(debris);
		}

		var crackGeo = new THREE.BoxGeometry(8, 0.1, 8);
		var crack = new THREE.Mesh(crackGeo, materials.waterEmissive);
		crack.position.set(-28, 0.05, -28);
		scene.add(crack);
		elements.push(crack);
	};

	var buildLighting = function() {
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
		scene.add(ambientLight);

		var reactorLight = new THREE.PointLight(0x00ffff, 1, 80);
		reactorLight.position.set(0, 2, 0);
		scene.add(reactorLight);

		var floodLight = new THREE.DirectionalLight(0xffffff, 0.3);
		floodLight.position.set(40, 30, 40);
		scene.add(floodLight);

		for (var i = 0; i < 4; i++) {
			var angle = (i / 4) * Math.PI * 2;
			var x = Math.cos(angle) * 25;
			var z = Math.sin(angle) * 25;
			var bioLight = new THREE.PointLight(0x00dd88, 0.5, 40);
			bioLight.position.set(x, 20, z);
			bioLight.userData.isBioLight = true;
			scene.add(bioLight);
		}
	};

	var update = function(deltaTime) {
		lightRippleTime += deltaTime;
		reactorPulseTime += deltaTime;
		bioLightFlickerTime += deltaTime;

		if (reactorPulseTime > 2) {
			reactorPulseTime = 0;
		}

		var reactorIntensity = 0.8 + 0.4 * Math.sin(reactorPulseTime * Math.PI / 2);

		for (var i = 0; i < scene.children.length; i++) {
			var child = scene.children[i];
			if (child.userData.isReactor) {
				child.scale.set(
					1 + 0.1 * Math.sin(reactorPulseTime * Math.PI / 2),
					1 + 0.1 * Math.sin(reactorPulseTime * Math.PI / 2),
					1 + 0.1 * Math.sin(reactorPulseTime * Math.PI / 2)
				);
				child.material.emissiveIntensity = reactorIntensity;
			}

			if (child.userData.isBioLight) {
				var flicker = 0.5 + 0.3 * Math.sin(bioLightFlickerTime * 3) + 0.2 * Math.random();
				child.intensity = Math.max(0.3, Math.min(0.8, flicker));
			}
		}

		if (waterBreachActive) {
			waterBreachIntensity = Math.min(1, waterBreachIntensity + deltaTime * 0.5);
		} else {
			waterBreachIntensity = Math.max(0, waterBreachIntensity - deltaTime * 0.3);
		}

		var rippleAmplitude = 0.3 * waterBreachIntensity * Math.sin(lightRippleTime * 4);
		for (var i = 0; i < elements.length; i++) {
			var elem = elements[i];
			if (elem.userData && elem.userData.isWaterBreachElement) {
				elem.position.y += rippleAmplitude * 0.1;
			}
		}
	};

	var triggerWaterBreach = function() {
		waterBreachActive = true;

		var breachGeo = new THREE.BoxGeometry(12, 8, 1);
		var breachMat = new THREE.MeshStandardMaterial({
			color: 0x0066aa,
			emissive: 0x0044ff,
			metalness: 0.4,
			roughness: 0.3
		});
		var breach = new THREE.Mesh(breachGeo, breachMat);
		breach.position.set(-28, 4, -28.5);
		breach.userData.isWaterBreachElement = true;
		scene.add(breach);
		elements.push(breach);

		for (var i = 0; i < 5; i++) {
			var waterStreamGeo = new THREE.CylinderGeometry(0.8, 0.5, 4, 6);
			var waterStreamMat = new THREE.MeshStandardMaterial({
				color: 0x003366,
				emissive: 0x0066ff,
				metalness: 0.6,
				roughness: 0.2
			});
			var waterStream = new THREE.Mesh(waterStreamGeo, waterStreamMat);
			var xOffset = -30 + Math.random() * 4;
			waterStream.position.set(xOffset, 2 - i * 0.8, -28);
			waterStream.userData.isWaterBreachElement = true;
			scene.add(waterStream);
			elements.push(waterStream);
		}
	};

	var stopWaterBreach = function() {
		waterBreachActive = false;
	};

	var reset = function() {
		for (var i = elements.length - 1; i >= 0; i--) {
			scene.remove(elements[i]);
		}
		elements = [];
		lightRippleTime = 0;
		reactorPulseTime = 0;
		bioLightFlickerTime = 0;
		waterBreachActive = false;
		waterBreachIntensity = 0;
		init(scene);
	};

	return {
		init: init,
		update: update,
		reset: reset,
		triggerWaterBreach: triggerWaterBreach,
		stopWaterBreach: stopWaterBreach
	};
}());
