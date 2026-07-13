window.FloodDam = (function() {
	'use strict';

	var sceneRef;
	var cameraRef;
	var damObjects = [];
	var lights = [];
	var waterFlowStrips = [];
	var turbines = [];
	var floodWaterLevel = 0;
	var floodWaterMesh;
	var waterAnimationTime = 0;

	function init(sceneRefArg, cameraRefArg) {
		sceneRef = sceneRefArg;
		cameraRef = cameraRefArg;
		damObjects = [];
		lights = [];
		waterFlowStrips = [];
		turbines = [];
		floodWaterLevel = 0;
		waterAnimationTime = 0;

		buildMainDamWall();
		buildDamTop();
		buildControlBuilding();
		buildBreachPoints();
		buildSpillways();
		buildTurbineStation();
		buildDefensePositions();
		buildFloodedValley();
		buildLighting();
	}

	function buildMainDamWall() {
		var geometry = new THREE.BoxGeometry(80, 120, 12);
		var material = new THREE.MeshLambertMaterial({ color: 0x888888 });
		var damWall = new THREE.Mesh(geometry, material);
		damWall.position.set(0, 60, 0);
		damWall.castShadow = true;
		damWall.receiveShadow = true;
		sceneRef.add(damWall);
		damObjects.push(damWall);

		var concreteRibs = [];
		for (var i = -3; i <= 3; i++) {
			var ribGeometry = new THREE.BoxGeometry(2, 120, 1);
			var ribMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
			var rib = new THREE.Mesh(ribGeometry, ribMaterial);
			rib.position.set(i * 12, 60, 5);
			rib.castShadow = true;
			sceneRef.add(rib);
			damObjects.push(rib);
			concreteRibs.push(rib);
		}

		var reinforcementBars = [];
		for (var j = 0; j < 8; j++) {
			var barGeometry = new THREE.CylinderGeometry(0.3, 0.3, 80, 8);
			var barMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
			var bar = new THREE.Mesh(barGeometry, barMaterial);
			bar.rotation.z = Math.PI / 2;
			bar.position.set(-30 + j * 10, 20 + (j % 3) * 20, 2);
			bar.castShadow = true;
			sceneRef.add(bar);
			damObjects.push(bar);
		}
	}

	function buildDamTop() {
		var geometry = new THREE.BoxGeometry(80, 3, 12);
		var material = new THREE.MeshLambertMaterial({ color: 0x555555 });
		var damTop = new THREE.Mesh(geometry, material);
		damTop.position.set(0, 125, 0);
		damTop.castShadow = true;
		damTop.receiveShadow = true;
		sceneRef.add(damTop);
		damObjects.push(damTop);

		var roadMarkings = [];
		for (var i = -35; i <= 35; i += 7) {
			var lineGeometry = new THREE.BoxGeometry(3, 0.5, 1);
			var lineMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
			var line = new THREE.Mesh(lineGeometry, lineMaterial);
			line.position.set(i, 126.5, 0);
			sceneRef.add(line);
			damObjects.push(line);
		}
	}

	function buildControlBuilding() {
		var baseGeometry = new THREE.BoxGeometry(16, 10, 14);
		var baseMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
		var base = new THREE.Mesh(baseGeometry, baseMaterial);
		base.position.set(0, 130, 0);
		base.castShadow = true;
		base.receiveShadow = true;
		sceneRef.add(base);
		damObjects.push(base);

		var roofGeometry = new THREE.ConeGeometry(10, 5, 4);
		var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8b0000 });
		var roof = new THREE.Mesh(roofGeometry, roofMaterial);
		roof.position.set(0, 142.5, 0);
		roof.castShadow = true;
		sceneRef.add(roof);
		damObjects.push(roof);

		var windows = [];
		var windowPositions = [
			{ x: -6, y: 135 },
			{ x: 6, y: 135 },
			{ x: -6, y: 132 },
			{ x: 6, y: 132 }
		];
		for (var i = 0; i < windowPositions.length; i++) {
			var windowGeometry = new THREE.BoxGeometry(2.5, 2.5, 0.5);
			var windowMaterial = new THREE.MeshLambertMaterial({ color: 0x3366ff });
			var window = new THREE.Mesh(windowGeometry, windowMaterial);
			window.position.set(windowPositions[i].x, windowPositions[i].y, 7.5);
			window.castShadow = true;
			sceneRef.add(window);
			damObjects.push(window);
		}

		var antennaGeometry = new THREE.CylinderGeometry(0.4, 0.4, 8, 6);
		var antennaMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
		antenna.position.set(8, 148, 0);
		antenna.castShadow = true;
		sceneRef.add(antenna);
		damObjects.push(antenna);
	}

	function buildBreachPoints() {
		var breachPositions = [
			{ x: -25, y: 50 },
			{ x: 25, y: 40 },
			{ x: -10, y: 70 }
		];

		for (var b = 0; b < breachPositions.length; b++) {
			var bx = breachPositions[b].x;
			var by = breachPositions[b].y;

			for (var i = 0; i < 6; i++) {
				var crumbleGeometry = new THREE.BoxGeometry(
					Math.random() * 3 + 1,
					Math.random() * 4 + 1,
					Math.random() * 2 + 0.5
				);
				var crumbleMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });
				var crumble = new THREE.Mesh(crumbleGeometry, crumbleMaterial);
				crumble.position.set(
					bx + (Math.random() - 0.5) * 8,
					by + (Math.random() - 0.5) * 6,
					(Math.random() - 0.5) * 4
				);
				crumble.rotation.x = Math.random() * Math.PI;
				crumble.rotation.y = Math.random() * Math.PI;
				crumble.castShadow = true;
				sceneRef.add(crumble);
				damObjects.push(crumble);
			}

			var holeGeometry = new THREE.SphereGeometry(4, 8, 8);
			var holeMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
			var hole = new THREE.Mesh(holeGeometry, holeMaterial);
			hole.position.set(bx, by, 0);
			hole.scale.z = 0.3;
			hole.castShadow = true;
			sceneRef.add(hole);
			damObjects.push(hole);
		}
	}

	function buildSpillways() {
		var spillwayPositions = [
			{ x: -30, z: -5 },
			{ x: 30, z: -5 }
		];

		for (var s = 0; s < spillwayPositions.length; s++) {
			var sx = spillwayPositions[s].x;
			var sz = spillwayPositions[s].z;

			var channelGeometry = new THREE.BoxGeometry(8, 60, 6);
			var channelMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
			var channel = new THREE.Mesh(channelGeometry, channelMaterial);
			channel.position.set(sx, 60, sz);
			channel.rotation.z = 0.2;
			channel.castShadow = true;
			sceneRef.add(channel);
			damObjects.push(channel);

			for (var i = 0; i < 5; i++) {
				var stripGeometry = new THREE.BoxGeometry(8, 4, 3);
				var stripMaterial = new THREE.MeshLambertMaterial({ color: 0x1a90ff });
				var strip = new THREE.Mesh(stripGeometry, stripMaterial);
				strip.position.set(sx, 100 - i * 15, sz);
				strip.userData.baseY = 100 - i * 15;
				strip.userData.index = i;
				strip.userData.spillwayX = sx;
				strip.castShadow = true;
				sceneRef.add(strip);
				damObjects.push(strip);
				waterFlowStrips.push(strip);
			}
		}
	}

	function buildTurbineStation() {
		var stationGeometry = new THREE.BoxGeometry(20, 15, 18);
		var stationMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
		var station = new THREE.Mesh(stationGeometry, stationMaterial);
		station.position.set(0, 10, -30);
		station.castShadow = true;
		station.receiveShadow = true;
		sceneRef.add(station);
		damObjects.push(station);

		var turbinePositions = [
			{ x: -8, y: 12, z: -30 },
			{ x: 8, y: 12, z: -30 }
		];

		for (var t = 0; t < turbinePositions.length; t++) {
			var tp = turbinePositions[t];

			var rotorGeometry = new THREE.CylinderGeometry(4, 4, 1, 32);
			var rotorMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
			var rotor = new THREE.Mesh(rotorGeometry, rotorMaterial);
			rotor.position.set(tp.x, tp.y, tp.z);
			rotor.castShadow = true;
			sceneRef.add(rotor);
			damObjects.push(rotor);
			turbines.push(rotor);

			for (var b = 0; b < 4; b++) {
				var bladeGeometry = new THREE.BoxGeometry(0.8, 3.5, 0.2);
				var bladeMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
				var blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
				blade.position.set(tp.x, tp.y, tp.z);
				var angle = (Math.PI / 2) * b;
				blade.userData.baseRotation = angle;
				blade.castShadow = true;
				sceneRef.add(blade);
				damObjects.push(blade);

				rotor.userData = rotor.userData || {};
				rotor.userData.blades = rotor.userData.blades || [];
				rotor.userData.blades.push(blade);
			}
		}

		var intakeGeometry = new THREE.CylinderGeometry(5, 5, 12, 16);
		var intakeMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
		var intake = new THREE.Mesh(intakeGeometry, intakeMaterial);
		intake.position.set(0, 5, -30);
		intake.rotation.z = Math.PI / 2;
		intake.castShadow = true;
		sceneRef.add(intake);
		damObjects.push(intake);
	}

	function buildDefensePositions() {
		var positionCoords = [
			{ x: -35, z: 5 },
			{ x: 35, z: 5 },
			{ x: -20, z: 8 },
			{ x: 20, z: 8 }
		];

		for (var p = 0; p < positionCoords.length; p++) {
			var pc = positionCoords[p];

			var bunkerGeometry = new THREE.BoxGeometry(6, 4, 8);
			var bunkerMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
			var bunker = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
			bunker.position.set(pc.x, 128, pc.z);
			bunker.castShadow = true;
			sceneRef.add(bunker);
			damObjects.push(bunker);

			var gunGeometry = new THREE.CylinderGeometry(0.5, 0.5, 4, 8);
			var gunMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
			var gun = new THREE.Mesh(gunGeometry, gunMaterial);
			gun.position.set(pc.x, 131, pc.z);
			gun.rotation.x = -0.2;
			gun.castShadow = true;
			sceneRef.add(gun);
			damObjects.push(gun);

			var sandbagsGeometry = new THREE.BoxGeometry(8, 1.5, 10);
			var sandbagsRMaterial = new THREE.MeshLambertMaterial({ color: 0x8b6914 });
			var sandbags = new THREE.Mesh(sandbagsGeometry, sandbagsRMaterial);
			sandbags.position.set(pc.x, 126.5, pc.z);
			sandbags.castShadow = true;
			sceneRef.add(sandbags);
			damObjects.push(sandbags);
		}
	}

	function buildFloodedValley() {
		var valleyPositions = [
			{ x: -40, z: 40, size: 12 },
			{ x: 30, z: 50, size: 10 },
			{ x: -20, z: 60, size: 14 },
			{ x: 40, z: 55, size: 11 },
			{ x: 0, z: 70, size: 9 }
		];

		for (var v = 0; v < valleyPositions.length; v++) {
			var vp = valleyPositions[v];

			var buildingGeometry = new THREE.BoxGeometry(vp.size, vp.size * 0.6, vp.size);
			var buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
			var building = new THREE.Mesh(buildingGeometry, buildingMaterial);
			building.position.set(vp.x, vp.size * 0.3 - 35, vp.z);
			building.userData.baseY = vp.size * 0.3 - 35;
			building.castShadow = true;
			sceneRef.add(building);
			damObjects.push(building);

			for (var f = 0; f < 4; f++) {
				var floorGeometry = new THREE.BoxGeometry(vp.size * 0.9, 0.3, vp.size * 0.9);
				var floorMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
				var floor = new THREE.Mesh(floorGeometry, floorMaterial);
				floor.position.set(vp.x, vp.size * 0.3 - 35 + f * 1.2, vp.z);
				floor.castShadow = true;
				sceneRef.add(floor);
				damObjects.push(floor);
			}
		}

		floodWaterMesh = createFloodWater();
		sceneRef.add(floodWaterMesh);
		damObjects.push(floodWaterMesh);
	}

	function createFloodWater() {
		var waterGeometry = new THREE.BoxGeometry(100, 2, 100);
		var waterMaterial = new THREE.MeshLambertMaterial({
			color: 0x1a5f7a,
			transparent: true,
			opacity: 0.6
		});
		var water = new THREE.Mesh(waterGeometry, waterMaterial);
		water.position.set(0, -20, 30);
		water.userData.baseY = -20;
		water.castShadow = true;
		water.receiveShadow = true;
		return water;
	}

	function buildLighting() {
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		sceneRef.add(ambientLight);
		lights.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(60, 80, 40);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		directionalLight.shadow.camera.left = -100;
		directionalLight.shadow.camera.right = 100;
		directionalLight.shadow.camera.top = 100;
		directionalLight.shadow.camera.bottom = -100;
		directionalLight.shadow.camera.far = 300;
		sceneRef.add(directionalLight);
		lights.push(directionalLight);

		var spillwayLight1 = new THREE.PointLight(0x3366ff, 0.6, 50);
		spillwayLight1.position.set(-30, 70, -5);
		sceneRef.add(spillwayLight1);
		lights.push(spillwayLight1);

		var spillwayLight2 = new THREE.PointLight(0x3366ff, 0.6, 50);
		spillwayLight2.position.set(30, 70, -5);
		sceneRef.add(spillwayLight2);
		lights.push(spillwayLight2);

		var breachLight1 = new THREE.PointLight(0xff6600, 0.8, 40);
		breachLight1.position.set(-25, 50, 0);
		sceneRef.add(breachLight1);
		lights.push(breachLight1);

		var breachLight2 = new THREE.PointLight(0xff6600, 0.8, 40);
		breachLight2.position.set(25, 40, 0);
		sceneRef.add(breachLight2);
		lights.push(breachLight2);
	}

	function update(delta) {
		waterAnimationTime += delta;

		for (var w = 0; w < waterFlowStrips.length; w++) {
			var strip = waterFlowStrips[w];
			var offsetY = Math.sin(waterAnimationTime * 2 + strip.userData.index * 0.5) * 2;
			strip.position.y = strip.userData.baseY + offsetY;
			strip.rotation.z = Math.sin(waterAnimationTime * 1.5) * 0.05;
		}

		for (var t = 0; t < turbines.length; t++) {
			var turbine = turbines[t];
			turbine.rotation.z += delta * 4;

			if (turbine.userData.blades) {
				for (var b = 0; b < turbine.userData.blades.length; b++) {
					var blade = turbine.userData.blades[b];
					blade.rotation.z = turbine.rotation.z;
				}
			}
		}

		if (floodWaterLevel < 8) {
			floodWaterLevel += delta * 0.8;
		}

		if (floodWaterMesh) {
			var newWaterY = floodWaterMesh.userData.baseY + floodWaterLevel;
			floodWaterMesh.position.y = newWaterY;
			floodWaterMesh.scale.y = 1 + (floodWaterLevel / 30);
		}

		for (var v = 0; v < damObjects.length; v++) {
			var obj = damObjects[v];
			if (obj.userData.baseY !== undefined) {
				if (obj.position.y - obj.geometry.parameters.height / 2 < floodWaterMesh.position.y) {
					obj.material.opacity = 0.7;
					obj.material.transparent = true;
				}
			}
		}
	}

	function reset() {
		for (var i = 0; i < damObjects.length; i++) {
			sceneRef.remove(damObjects[i]);
		}
		damObjects = [];

		for (var l = 0; l < lights.length; l++) {
			sceneRef.remove(lights[l]);
		}
		lights = [];

		waterFlowStrips = [];
		turbines = [];
		floodWaterMesh = null;
		floodWaterLevel = 0;
		waterAnimationTime = 0;
		sceneRef = null;
		cameraRef = null;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
