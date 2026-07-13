window.ThunderRidge = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var objects = [];
	var lights = [];
	var animatedElements = [];
	var time = 0;

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		lights = [];
		animatedElements = [];
		time = 0;

		buildTerrain();
		buildRockSpires();
		buildArtilleryEmplacements();
		buildLightningRods();
		buildWeatherStation();
		buildConvoyWreckage();
		buildRockslideDebris();
		buildBunkers();
		buildSignalBeacons();
		setupLighting();
	}

	function buildTerrain() {
		var groundMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3f35 });

		var basePlatform = new THREE.Mesh(new THREE.BoxGeometry(200, 8, 200), groundMaterial);
		basePlatform.position.set(0, -5, 0);
		basePlatform.castShadow = true;
		basePlatform.receiveShadow = true;
		scene.add(basePlatform);
		objects.push(basePlatform);

		var ridgeLeft = new THREE.Mesh(new THREE.BoxGeometry(30, 12, 200), groundMaterial);
		ridgeLeft.position.set(-70, 5, 0);
		ridgeLeft.castShadow = true;
		ridgeLeft.receiveShadow = true;
		scene.add(ridgeLeft);
		objects.push(ridgeLeft);

		var ridgeRight = new THREE.Mesh(new THREE.BoxGeometry(30, 12, 200), groundMaterial);
		ridgeRight.position.set(70, 5, 0);
		ridgeRight.castShadow = true;
		ridgeRight.receiveShadow = true;
		scene.add(ridgeRight);
		objects.push(ridgeRight);

		var centerPeak = new THREE.Mesh(new THREE.ConeGeometry(25, 35, 16), groundMaterial);
		centerPeak.position.set(0, 15, 0);
		centerPeak.castShadow = true;
		centerPeak.receiveShadow = true;
		scene.add(centerPeak);
		objects.push(centerPeak);

		var cliffFace1 = new THREE.Mesh(new THREE.BoxGeometry(40, 30, 8), groundMaterial);
		cliffFace1.position.set(-60, 10, -80);
		cliffFace1.castShadow = true;
		cliffFace1.receiveShadow = true;
		scene.add(cliffFace1);
		objects.push(cliffFace1);

		var cliffFace2 = new THREE.Mesh(new THREE.BoxGeometry(40, 30, 8), groundMaterial);
		cliffFace2.position.set(60, 10, 80);
		cliffFace2.castShadow = true;
		cliffFace2.receiveShadow = true;
		scene.add(cliffFace2);
		objects.push(cliffFace2);

		var escarpment = new THREE.Mesh(new THREE.BoxGeometry(100, 20, 15), groundMaterial);
		escarpment.position.set(0, 0, 60);
		escarpment.castShadow = true;
		escarpment.receiveShadow = true;
		scene.add(escarpment);
		objects.push(escarpment);
	}

	function buildRockSpires() {
		var spireColor = 0x6b5d52;
		var spireMaterial = new THREE.MeshLambertMaterial({ color: spireColor });

		var positions = [
			[-85, 30, -60],
			[-50, 25, -40],
			[50, 28, -70],
			[85, 32, -50],
			[-70, 22, 50],
			[70, 26, 60],
			[0, 35, -30],
			[-35, 20, 30],
			[35, 23, 35]
		];

		for (var i = 0; i < positions.length; i++) {
			var pos = positions[i];
			var height = 20 + Math.random() * 30;
			var radius = 3 + Math.random() * 2;

			var spire = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 8), spireMaterial);
			spire.position.set(pos[0], pos[1], pos[2]);
			spire.rotation.z = (Math.random() - 0.5) * 0.3;
			spire.castShadow = true;
			spire.receiveShadow = true;
			scene.add(spire);
			objects.push(spire);
		}
	}

	function buildArtilleryEmplacements() {
		var emplacementMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
		var metalMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });

		var positions = [
			[-45, 5, -50],
			[45, 5, 50],
			[0, 5, -70]
		];

		for (var i = 0; i < positions.length; i++) {
			var pos = positions[i];

			var platform = new THREE.Mesh(new THREE.BoxGeometry(20, 2, 20), emplacementMaterial);
			platform.position.set(pos[0], pos[1], pos[2]);
			platform.castShadow = true;
			platform.receiveShadow = true;
			scene.add(platform);
			objects.push(platform);

			var barrel = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 15, 12), metalMaterial);
			barrel.position.set(pos[0], pos[1] + 3, pos[2]);
			barrel.rotation.z = 0.4;
			barrel.castShadow = true;
			barrel.receiveShadow = true;
			scene.add(barrel);
			objects.push(barrel);

			var support = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 2), metalMaterial);
			support.position.set(pos[0] - 5, pos[1] + 2, pos[2] - 5);
			support.castShadow = true;
			support.receiveShadow = true;
			scene.add(support);
			objects.push(support);

			var support2 = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 2), metalMaterial);
			support2.position.set(pos[0] + 5, pos[1] + 2, pos[2] + 5);
			support2.castShadow = true;
			support2.receiveShadow = true;
			scene.add(support2);
			objects.push(support2);
		}
	}

	function buildLightningRods() {
		var rodMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });

		var rodPositions = [
			[-80, 45, -80],
			[80, 48, 80],
			[0, 50, -60],
			[-40, 40, 60],
			[60, 42, 0]
		];

		for (var i = 0; i < rodPositions.length; i++) {
			var pos = rodPositions[i];

			var rod = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 20, 8), rodMaterial);
			rod.position.set(pos[0], pos[1], pos[2]);
			rod.castShadow = true;
			rod.receiveShadow = true;
			scene.add(rod);
			objects.push(rod);

			var cap = new THREE.Mesh(new THREE.SphereGeometry(2, 8, 8), rodMaterial);
			cap.position.set(pos[0], pos[1] + 10, pos[2]);
			cap.castShadow = true;
			cap.receiveShadow = true;
			scene.add(cap);
			objects.push(cap);

			var groundConnector = new THREE.Mesh(new THREE.BoxGeometry(15, 0.5, 15), rodMaterial);
			groundConnector.position.set(pos[0], pos[1] - 10, pos[2]);
			groundConnector.castShadow = true;
			groundConnector.receiveShadow = true;
			scene.add(groundConnector);
			objects.push(groundConnector);

			var lightningBolt = createLightningBolt(pos[0], pos[1], pos[2]);
			animatedElements.push({
				object: lightningBolt,
				type: 'lightning',
				phase: Math.random() * Math.PI * 2
			});
			scene.add(lightningBolt);
			objects.push(lightningBolt);
		}
	}

	function createLightningBolt(x, y, z) {
		var boltGeometry = new THREE.BufferGeometry();
		var boltPoints = [
			new THREE.Vector3(0, 0, 0),
			new THREE.Vector3(0.5, -3, 0.5),
			new THREE.Vector3(-0.3, -6, -0.4),
			new THREE.Vector3(0.8, -9, 0.3),
			new THREE.Vector3(-0.4, -12, 0.6),
			new THREE.Vector3(0.2, -15, -0.5)
		];
		boltGeometry.setFromPoints(boltPoints);
		var boltMaterial = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 3 });
		var bolt = new THREE.LineSegments(boltGeometry, boltMaterial);
		bolt.position.set(x, y, z);
		bolt.visible = false;
		return bolt;
	}

	function buildWeatherStation() {
		var stationMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
		var instrumentMaterial = new THREE.MeshLambertMaterial({ color: 0x999999 });

		var mainStructure = new THREE.Mesh(new THREE.BoxGeometry(12, 15, 12), stationMaterial);
		mainStructure.position.set(-60, 10, 0);
		mainStructure.castShadow = true;
		mainStructure.receiveShadow = true;
		scene.add(mainStructure);
		objects.push(mainStructure);

		var radarDome = new THREE.Mesh(new THREE.SphereGeometry(5, 12, 12), instrumentMaterial);
		radarDome.position.set(-60, 23, 0);
		radarDome.castShadow = true;
		radarDome.receiveShadow = true;
		scene.add(radarDome);
		objects.push(radarDome);

		var anemometer = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 8, 8), instrumentMaterial);
		anemometer.position.set(-60, 30, 0);
		anemometer.castShadow = true;
		anemometer.receiveShadow = true;
		scene.add(anemometer);
		objects.push(anemometer);

		var mast = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 25, 6), instrumentMaterial);
		mast.position.set(-60, 35, 0);
		mast.castShadow = true;
		mast.receiveShadow = true;
		scene.add(mast);
		objects.push(mast);

		var sensorArm1 = new THREE.Mesh(new THREE.BoxGeometry(12, 1, 1), instrumentMaterial);
		sensorArm1.position.set(-60, 15, 8);
		sensorArm1.castShadow = true;
		sensorArm1.receiveShadow = true;
		scene.add(sensorArm1);
		objects.push(sensorArm1);

		var sensorArm2 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 12), instrumentMaterial);
		sensorArm2.position.set(-60, 15, 0);
		sensorArm2.castShadow = true;
		sensorArm2.receiveShadow = true;
		scene.add(sensorArm2);
		objects.push(sensorArm2);
	}

	function buildConvoyWreckage() {
		var vehicleMaterial = new THREE.MeshLambertMaterial({ color: 0x2d2d2d });
		var corrosionMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });

		var truck1Body = new THREE.Mesh(new THREE.BoxGeometry(8, 5, 18), vehicleMaterial);
		truck1Body.position.set(30, 3, 40);
		truck1Body.rotation.z = 0.3;
		truck1Body.castShadow = true;
		truck1Body.receiveShadow = true;
		scene.add(truck1Body);
		objects.push(truck1Body);

		var truck1Cabin = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 6), vehicleMaterial);
		truck1Cabin.position.set(30, 6, 25);
		truck1Cabin.castShadow = true;
		truck1Cabin.receiveShadow = true;
		scene.add(truck1Cabin);
		objects.push(truck1Cabin);

		var wheel1a = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 1.5, 12), corrosionMaterial);
		wheel1a.position.set(25, 2, 35);
		wheel1a.rotation.z = Math.PI / 2;
		wheel1a.castShadow = true;
		wheel1a.receiveShadow = true;
		scene.add(wheel1a);
		objects.push(wheel1a);

		var wheel1b = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 1.5, 12), corrosionMaterial);
		wheel1b.position.set(35, 2, 35);
		wheel1b.rotation.z = Math.PI / 2;
		wheel1b.castShadow = true;
		wheel1b.receiveShadow = true;
		scene.add(wheel1b);
		objects.push(wheel1b);

		var truck2Body = new THREE.Mesh(new THREE.BoxGeometry(7, 4, 16), vehicleMaterial);
		truck2Body.position.set(-20, 2, 50);
		truck2Body.rotation.z = -0.2;
		truck2Body.castShadow = true;
		truck2Body.receiveShadow = true;
		scene.add(truck2Body);
		objects.push(truck2Body);

		var truck2Cabin = new THREE.Mesh(new THREE.BoxGeometry(7, 3, 5), vehicleMaterial);
		truck2Cabin.position.set(-20, 5, 40);
		truck2Cabin.castShadow = true;
		truck2Cabin.receiveShadow = true;
		scene.add(truck2Cabin);
		objects.push(truck2Cabin);

		var wheel2a = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 1.4, 12), corrosionMaterial);
		wheel2a.position.set(-25, 1, 45);
		wheel2a.rotation.z = Math.PI / 2;
		wheel2a.castShadow = true;
		wheel2a.receiveShadow = true;
		scene.add(wheel2a);
		objects.push(wheel2a);

		var wheel2b = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 1.4, 12), corrosionMaterial);
		wheel2b.position.set(-15, 1, 45);
		wheel2b.rotation.z = Math.PI / 2;
		wheel2b.castShadow = true;
		wheel2b.receiveShadow = true;
		scene.add(wheel2b);
		objects.push(wheel2b);

		var supplyCrate1 = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 5), corrosionMaterial);
		supplyCrate1.position.set(25, 3, 50);
		supplyCrate1.rotation.z = 0.4;
		supplyCrate1.castShadow = true;
		supplyCrate1.receiveShadow = true;
		scene.add(supplyCrate1);
		objects.push(supplyCrate1);

		var supplyCrate2 = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 5), corrosionMaterial);
		supplyCrate2.position.set(-30, 2.5, 55);
		supplyCrate2.rotation.z = -0.3;
		supplyCrate2.castShadow = true;
		supplyCrate2.receiveShadow = true;
		scene.add(supplyCrate2);
		objects.push(supplyCrate2);
	}

	function buildRockslideDebris() {
		var debrisMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });

		var debrisPositions = [
			[20, 8, -30],
			[10, 6, -25],
			[-15, 5, -35],
			[25, 7, -28],
			[-5, 4, -40],
			[15, 6.5, -32],
			[-20, 5.5, -38]
		];

		for (var i = 0; i < debrisPositions.length; i++) {
			var pos = debrisPositions[i];
			var sizeVariation = 3 + Math.random() * 4;

			var debrisBlock = new THREE.Mesh(new THREE.BoxGeometry(sizeVariation, sizeVariation * 0.7, sizeVariation * 0.9), debrisMaterial);
			debrisBlock.position.set(pos[0], pos[1], pos[2]);
			debrisBlock.rotation.set(Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5);
			debrisBlock.castShadow = true;
			debrisBlock.receiveShadow = true;
			scene.add(debrisBlock);
			objects.push(debrisBlock);

			animatedElements.push({
				object: debrisBlock,
				type: 'debris',
				originalY: pos[1],
				phase: Math.random() * Math.PI * 2,
				index: i
			});
		}
	}

	function buildBunkers() {
		var bunkerMaterial = new THREE.MeshLambertMaterial({ color: 0x3d3d3d });
		var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

		var bunkerPositions = [
			[-75, 5, -40],
			[75, 5, 40],
			[-40, 5, 70],
			[40, 5, -70]
		];

		for (var i = 0; i < bunkerPositions.length; i++) {
			var pos = bunkerPositions[i];

			var bunkerWall1 = new THREE.Mesh(new THREE.BoxGeometry(15, 8, 4), bunkerMaterial);
			bunkerWall1.position.set(pos[0], pos[1] + 3, pos[2]);
			bunkerWall1.castShadow = true;
			bunkerWall1.receiveShadow = true;
			scene.add(bunkerWall1);
			objects.push(bunkerWall1);

			var bunkerWall2 = new THREE.Mesh(new THREE.BoxGeometry(4, 8, 12), bunkerMaterial);
			bunkerWall2.position.set(pos[0] - 8, pos[1] + 3, pos[2] + 4);
			bunkerWall2.castShadow = true;
			bunkerWall2.receiveShadow = true;
			scene.add(bunkerWall2);
			objects.push(bunkerWall2);

			var door = new THREE.Mesh(new THREE.BoxGeometry(3, 5, 0.5), doorMaterial);
			door.position.set(pos[0], pos[1] + 1.5, pos[2] - 2);
			door.castShadow = true;
			door.receiveShadow = true;
			scene.add(door);
			objects.push(door);

			var roof = new THREE.Mesh(new THREE.ConeGeometry(10, 4, 8), bunkerMaterial);
			roof.position.set(pos[0], pos[1] + 8, pos[2]);
			roof.castShadow = true;
			roof.receiveShadow = true;
			scene.add(roof);
			objects.push(roof);
		}
	}

	function buildSignalBeacons() {
		var beaconBaseMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

		var beaconPositions = [
			[-90, 35, -90],
			[90, 38, 90],
			[0, 40, -80],
			[-70, 32, 70]
		];

		for (var i = 0; i < beaconPositions.length; i++) {
			var pos = beaconPositions[i];

			var base = new THREE.Mesh(new THREE.CylinderGeometry(3, 4, 2, 12), beaconBaseMaterial);
			base.position.set(pos[0], pos[1] - 10, pos[2]);
			base.castShadow = true;
			base.receiveShadow = true;
			scene.add(base);
			objects.push(base);

			var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 20, 8), beaconBaseMaterial);
			pole.position.set(pos[0], pos[1], pos[2]);
			pole.castShadow = true;
			pole.receiveShadow = true;
			scene.add(pole);
			objects.push(pole);

			var beacon = new THREE.Mesh(new THREE.SphereGeometry(2.5, 8, 8), new THREE.MeshLambertMaterial({ color: 0xff6600 }));
			beacon.position.set(pos[0], pos[1] + 12, pos[2]);
			beacon.castShadow = true;
			beacon.receiveShadow = true;
			scene.add(beacon);
			objects.push(beacon);

			animatedElements.push({
				object: beacon,
				type: 'beacon',
				baseColor: 0xff6600,
				originalIntensity: 1,
				phase: Math.random() * Math.PI * 2
			});
		}
	}

	function setupLighting() {
		var ambientLight = new THREE.AmbientLight(0x666666);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
		directionalLight.position.set(50, 60, 40);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		directionalLight.shadow.camera.far = 500;
		directionalLight.shadow.camera.left = -100;
		directionalLight.shadow.camera.right = 100;
		directionalLight.shadow.camera.top = 100;
		directionalLight.shadow.camera.bottom = -100;
		scene.add(directionalLight);
		lights.push(directionalLight);

		var stormLight = new THREE.DirectionalLight(0x5588ff, 0.3);
		stormLight.position.set(-50, 40, -50);
		scene.add(stormLight);
		lights.push(stormLight);
	}

	function update(delta) {
		time += delta;

		for (var i = 0; i < animatedElements.length; i++) {
			var element = animatedElements[i];

			if (element.type === 'lightning') {
				var lightningPhase = (time * 4 + element.phase) % (Math.PI * 2);
				var lightningFlash = Math.sin(lightningPhase * 8) > 0.5 ? 1 : 0;
				element.object.visible = lightningFlash > 0.5;

				if (element.object.visible) {
					element.object.material.color.setHex(0xffff00);
				}
			} else if (element.type === 'debris') {
				var debrisWave = Math.sin(time * 0.5 + element.phase) * 0.5;
				element.object.position.y = element.originalY + debrisWave;
				element.object.rotation.x += delta * 0.1;
				element.object.rotation.z += delta * 0.08;
			} else if (element.type === 'beacon') {
				var beaconBrightness = Math.sin(time * 2 + element.phase) * 0.5 + 0.5;
				element.object.material.emissive.setHex(element.baseColor);
				element.object.material.emissiveIntensity = beaconBrightness;
				element.object.scale.set(1 + beaconBrightness * 0.3, 1 + beaconBrightness * 0.3, 1 + beaconBrightness * 0.3);
			}
		}
	}

	function reset() {
		for (var i = 0; i < objects.length; i++) {
			scene.remove(objects[i]);
		}
		for (var i = 0; i < lights.length; i++) {
			scene.remove(lights[i]);
		}
		objects = [];
		lights = [];
		animatedElements = [];
		scene = null;
		camera = null;
		time = 0;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
