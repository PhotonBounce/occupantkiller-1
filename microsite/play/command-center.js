window.CommandCenter = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var objects = [];
	var lights = [];
	var animatedElements = [];

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		lights = [];
		animatedElements = [];

		buildgroundterrain();
		buildperimeterfence();
		buildmaincommandbuilding();
		buildsatellitedishes();
		buildcommunicationantennas();
		buildwarroombunker();
		buildundergroundentrance();
		buildguardtowers();
		buildcctvmonitoring();
		buildvehiclegarage();
		buildhelicopterpad();
		buildpowergenerators();
		buildlighting();
	}

	function buildgroundterrain() {
		var groundMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a3a });
		var groundGeom = new THREE.BoxGeometry(200, 1, 200);
		var ground = new THREE.Mesh(groundGeom, groundMaterial);
		ground.position.y = -2;
		ground.receiveShadow = true;
		scene.add(ground);
		objects.push(ground);

		var concreteBaseMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
		var baseGeom = new THREE.BoxGeometry(150, 0.5, 150);
		var base = new THREE.Mesh(baseGeom, concreteBaseMaterial);
		base.position.y = -1.5;
		base.receiveShadow = true;
		scene.add(base);
		objects.push(base);
	}

	function buildperimeterfence() {
		var fenceMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
		var fenceHeight = 6;
		var fenceThickness = 0.3;

		var corners = [
			[-70, -70],
			[70, -70],
			[70, 70],
			[-70, 70]
		];

		for (var i = 0; i < corners.length; i++) {
			var c1 = corners[i];
			var c2 = corners[(i + 1) % corners.length];
			var dx = c2[0] - c1[0];
			var dz = c2[1] - c1[1];
			var dist = Math.sqrt(dx * dx + dz * dz);
			var midX = (c1[0] + c2[0]) / 2;
			var midZ = (c1[1] + c2[1]) / 2;

			var fenceGeom = new THREE.BoxGeometry(dist, fenceHeight, fenceThickness);
			var fence = new THREE.Mesh(fenceGeom, fenceMaterial);
			fence.position.set(midX, fenceHeight / 2, midZ);
			fence.rotation.y = Math.atan2(dz, dx);
			fence.castShadow = true;
			fence.receiveShadow = true;
			scene.add(fence);
			objects.push(fence);
		}
	}

	function buildmaincommandbuilding() {
		var buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
		var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });

		var mainGeom = new THREE.BoxGeometry(40, 18, 35);
		var mainBuilding = new THREE.Mesh(mainGeom, buildingMaterial);
		mainBuilding.position.set(0, 9, -5);
		mainBuilding.castShadow = true;
		mainBuilding.receiveShadow = true;
		scene.add(mainBuilding);
		objects.push(mainBuilding);

		var roofGeom = new THREE.BoxGeometry(42, 1, 37);
		var roof = new THREE.Mesh(roofGeom, roofMaterial);
		roof.position.set(0, 18.5, -5);
		roof.castShadow = true;
		roof.receiveShadow = true;
		scene.add(roof);
		objects.push(roof);

		var windowMaterial = new THREE.MeshLambertMaterial({ color: 0x0a1a2a });
		for (var row = 0; row < 3; row++) {
			for (var col = 0; col < 4; col++) {
				var windowGeom = new THREE.BoxGeometry(2.5, 2, 0.2);
				var window = new THREE.Mesh(windowGeom, windowMaterial);
				window.position.set(-14 + col * 11, 5 + row * 5.5, -22.5);
				window.castShadow = true;
				scene.add(window);
				objects.push(window);
			}
		}

		var entranceGeom = new THREE.BoxGeometry(4, 6, 0.2);
		var entrance = new THREE.Mesh(entranceGeom, new THREE.MeshLambertMaterial({ color: 0x1a1a1a }));
		entrance.position.set(0, 3, -22.5);
		scene.add(entrance);
		objects.push(entrance);
	}

	function buildsatellitedishes() {
		var poleGeom = new THREE.CylinderGeometry(0.4, 0.5, 8, 8);
		var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });

		var dishPositions = [
			[-20, 20],
			[20, 20],
			[0, 30]
		];

		for (var i = 0; i < dishPositions.length; i++) {
			var pos = dishPositions[i];
			var pole = new THREE.Mesh(poleGeom, poleMaterial);
			pole.position.set(pos[0], 4, pos[1]);
			pole.castShadow = true;
			pole.receiveShadow = true;
			scene.add(pole);
			objects.push(pole);

			var dishGeom = new THREE.SphereGeometry(2.5, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
			var dishMaterial = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
			var dish = new THREE.Mesh(dishGeom, dishMaterial);
			dish.position.set(pos[0], 8.5, pos[1]);
			dish.scale.set(1, 0.5, 1);
			dish.castShadow = true;
			dish.receiveShadow = true;
			scene.add(dish);
			objects.push(dish);

			animatedElements.push({
				object: dish,
				type: 'rotate',
				axis: 'y',
				speed: 0.3 + i * 0.1
			});
		}
	}

	function buildcommunicationantennas() {
		var baseGeom = new THREE.CylinderGeometry(0.3, 0.4, 2, 8);
		var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });

		var antennaPositions = [
			[-25, -15],
			[25, -15],
			[-15, -25],
			[15, -25]
		];

		for (var i = 0; i < antennaPositions.length; i++) {
			var pos = antennaPositions[i];

			var base = new THREE.Mesh(baseGeom, baseMaterial);
			base.position.set(pos[0], 1, pos[1]);
			base.castShadow = true;
			base.receiveShadow = true;
			scene.add(base);
			objects.push(base);

			var rodGeom = new THREE.CylinderGeometry(0.08, 0.08, 12, 4);
			var rodMaterial = new THREE.MeshLambertMaterial({ color: 0x999999 });
			var rod = new THREE.Mesh(rodGeom, rodMaterial);
			rod.position.set(pos[0], 8, pos[1]);
			rod.castShadow = true;
			scene.add(rod);
			objects.push(rod);
		}
	}

	function buildwarroombunker() {
		var domeGeom = new THREE.SphereGeometry(8, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6);
		var domeMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
		var dome = new THREE.Mesh(domeGeom, domeMaterial);
		dome.position.set(-35, 4, 15);
		dome.castShadow = true;
		dome.receiveShadow = true;
		scene.add(dome);
		objects.push(dome);

		var baseGeom = new THREE.CylinderGeometry(8.5, 9, 2, 16);
		var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
		var base = new THREE.Mesh(baseGeom, baseMaterial);
		base.position.set(-35, 1, 15);
		base.castShadow = true;
		base.receiveShadow = true;
		scene.add(base);
		objects.push(base);

		var doorGeom = new THREE.BoxGeometry(3, 5, 0.3);
		var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
		var door = new THREE.Mesh(doorGeom, doorMaterial);
		door.position.set(-35, 2.5, 17.3);
		scene.add(door);
		objects.push(door);
	}

	function buildundergroundentrance() {
		var stepsGeom = new THREE.BoxGeometry(5, 0.3, 1.5);
		var stepMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });

		for (var step = 0; step < 6; step++) {
			var stepMesh = new THREE.Mesh(stepsGeom, stepMaterial);
			stepMesh.position.set(35, 0 - step * 0.4, 0 + step * 0.8);
			stepMesh.castShadow = true;
			stepMesh.receiveShadow = true;
			scene.add(stepMesh);
			objects.push(stepMesh);
		}

		var entryGeom = new THREE.BoxGeometry(6, 6, 2);
		var entryMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
		var entry = new THREE.Mesh(entryGeom, entryMaterial);
		entry.position.set(35, -3, -4);
		entry.castShadow = true;
		entry.receiveShadow = true;
		scene.add(entry);
		objects.push(entry);
	}

	function buildguardtowers() {
		var towerPositions = [
			[-65, -65],
			[65, -65],
			[65, 65],
			[-65, 65]
		];

		for (var i = 0; i < towerPositions.length; i++) {
			var pos = towerPositions[i];

			var towerGeom = new THREE.CylinderGeometry(2.5, 3, 12, 8);
			var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
			var tower = new THREE.Mesh(towerGeom, towerMaterial);
			tower.position.set(pos[0], 6, pos[1]);
			tower.castShadow = true;
			tower.receiveShadow = true;
			scene.add(tower);
			objects.push(tower);

			var roofGeom = new THREE.ConeGeometry(3, 3, 8);
			var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
			var roof = new THREE.Mesh(roofGeom, roofMaterial);
			roof.position.set(pos[0], 13.5, pos[1]);
			roof.castShadow = true;
			roof.receiveShadow = true;
			scene.add(roof);
			objects.push(roof);

			var platformGeom = new THREE.CylinderGeometry(3, 3, 0.5, 8);
			var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
			var platform = new THREE.Mesh(platformGeom, platformMaterial);
			platform.position.set(pos[0], 12, pos[1]);
			platform.castShadow = true;
			platform.receiveShadow = true;
			scene.add(platform);
			objects.push(platform);
		}
	}

	function buildccctvmonitoring() {
		var cameraPositions = [
			[30, 25],
			[-30, 25],
			[40, -20],
			[-40, -20],
			[0, 40]
		];

		for (var i = 0; i < cameraPositions.length; i++) {
			var pos = cameraPositions[i];

			var poleGeom = new THREE.CylinderGeometry(0.2, 0.3, 5, 6);
			var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
			var pole = new THREE.Mesh(poleGeom, poleMaterial);
			pole.position.set(pos[0], 2.5, pos[1]);
			pole.castShadow = true;
			pole.receiveShadow = true;
			scene.add(pole);
			objects.push(pole);

			var cameraBodyGeom = new THREE.BoxGeometry(0.6, 0.4, 0.8);
			var cameraMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
			var cameraBody = new THREE.Mesh(cameraBodyGeom, cameraMaterial);
			cameraBody.position.set(pos[0], 5, pos[1]);
			cameraBody.castShadow = true;
			scene.add(cameraBody);
			objects.push(cameraBody);

			var lensGeom = new THREE.SphereGeometry(0.25, 8, 8);
			var lensMaterial = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
			var lens = new THREE.Mesh(lensGeom, lensMaterial);
			lens.position.set(pos[0], 5, pos[1] + 0.5);
			lens.castShadow = true;
			scene.add(lens);
			objects.push(lens);

			var lightGeom = new THREE.SphereGeometry(0.15, 8, 8);
			var lightMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000, emissive: 0xff0000 });
			var light = new THREE.Mesh(lightGeom, lightMaterial);
			light.position.set(pos[0] + 0.3, 5.2, pos[1] - 0.3);
			scene.add(light);
			objects.push(light);

			animatedElements.push({
				object: cameraBody,
				type: 'swivel',
				minY: pos[1] - 10,
				maxY: pos[1] + 10,
				speed: 0.4 + i * 0.1
			});

			animatedElements.push({
				object: light,
				type: 'blink',
				speed: 0.8 + i * 0.15
			});
		}
	}

	function buildvehiclegarage() {
		var garageGeom = new THREE.BoxGeometry(25, 8, 20);
		var garageMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
		var garage = new THREE.Mesh(garageGeom, garageMaterial);
		garage.position.set(-45, 4, -25);
		garage.castShadow = true;
		garage.receiveShadow = true;
		scene.add(garage);
		objects.push(garage);

		var roofGeom = new THREE.BoxGeometry(26, 0.8, 21);
		var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
		var roof = new THREE.Mesh(roofGeom, roofMaterial);
		roof.position.set(-45, 8.8, -25);
		roof.castShadow = true;
		roof.receiveShadow = true;
		scene.add(roof);
		objects.push(roof);

		var doorGeom = new THREE.BoxGeometry(8, 6, 0.3);
		var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
		for (var d = 0; d < 2; d++) {
			var door = new THREE.Mesh(doorGeom, doorMaterial);
			door.position.set(-50 + d * 10, 3, -34.8);
			scene.add(door);
			objects.push(door);
		}
	}

	function buildhelicopterpad() {
		var padGeom = new THREE.BoxGeometry(20, 0.3, 20);
		var padMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });
		var pad = new THREE.Mesh(padGeom, padMaterial);
		pad.position.set(55, 0, 10);
		pad.receiveShadow = true;
		scene.add(pad);
		objects.push(pad);

		var borderGeom = new THREE.CylinderGeometry(10.5, 10.5, 0.2, 16);
		var borderMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
		var border = new THREE.Mesh(borderGeom, borderMaterial);
		border.position.set(55, 0.3, 10);
		scene.add(border);
		objects.push(border);

		var landingLightGeom = new THREE.SphereGeometry(0.3, 8, 8);
		var lightMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00, emissive: 0x00ff00 });
		var corners = [
			[45, 0],
			[65, 0],
			[45, 20],
			[65, 20]
		];

		for (var i = 0; i < corners.length; i++) {
			var light = new THREE.Mesh(landingLightGeom, lightMaterial);
			light.position.set(corners[i][0], 0.5, corners[i][1]);
			scene.add(light);
			objects.push(light);

			animatedElements.push({
				object: light,
				type: 'blink',
				speed: 1.2 + i * 0.2
			});
		}
	}

	function buildpowergenerators() {
		var genPositions = [
			[50, -30],
			[50, -40],
			[60, -35]
		];

		for (var i = 0; i < genPositions.length; i++) {
			var pos = genPositions[i];

			var bodyGeom = new THREE.BoxGeometry(3, 4, 3);
			var bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
			var body = new THREE.Mesh(bodyGeom, bodyMaterial);
			body.position.set(pos[0], 2, pos[1]);
			body.castShadow = true;
			body.receiveShadow = true;
			scene.add(body);
			objects.push(body);

			var exhaustGeom = new THREE.CylinderGeometry(0.4, 0.5, 4, 8);
			var exhaustMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
			var exhaust = new THREE.Mesh(exhaustGeom, exhaustMaterial);
			exhaust.position.set(pos[0], 4.5, pos[1]);
			exhaust.castShadow = true;
			scene.add(exhaust);
			objects.push(exhaust);

			var statusLightGeom = new THREE.SphereGeometry(0.2, 8, 8);
			var statusMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00, emissive: 0x00ff00 });
			var statusLight = new THREE.Mesh(statusLightGeom, statusMaterial);
			statusLight.position.set(pos[0] + 1.3, 3, pos[1]);
			scene.add(statusLight);
			objects.push(statusLight);

			animatedElements.push({
				object: statusLight,
				type: 'blink',
				speed: 1.5 + i * 0.3
			});
		}
	}

	function buildlighting() {
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
		directionalLight.position.set(50, 40, 30);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		directionalLight.shadow.camera.far = 200;
		directionalLight.shadow.camera.left = -100;
		directionalLight.shadow.camera.right = 100;
		directionalLight.shadow.camera.top = 100;
		directionalLight.shadow.camera.bottom = -100;
		scene.add(directionalLight);
		lights.push(directionalLight);

		var spotPositions = [
			[0, 15, 0],
			[-30, 15, -20],
			[30, 15, 20]
		];

		for (var i = 0; i < spotPositions.length; i++) {
			var pos = spotPositions[i];
			var spotLight = new THREE.SpotLight(0xffffff, 1, 100, Math.PI / 4, 0.5, 2);
			spotLight.position.set(pos[0], pos[1], pos[2]);
			spotLight.target.position.set(pos[0], 0, pos[2]);
			scene.add(spotLight);
			scene.add(spotLight.target);
			lights.push(spotLight);
		}
	}

	function update(delta) {
		for (var i = 0; i < animatedElements.length; i++) {
			var elem = animatedElements[i];

			if (elem.type === 'rotate') {
				if (elem.axis === 'y') {
					elem.object.rotation.y += elem.speed * delta;
				}
			} else if (elem.type === 'blink') {
				var cycle = Math.sin(elem.speed * (Date.now() * 0.001)) * 0.5 + 0.5;
				elem.object.material.emissiveIntensity = cycle;
			} else if (elem.type === 'swivel') {
				var swingRange = (elem.maxY - elem.minY) / 2;
				var centerY = (elem.minY + elem.maxY) / 2;
				var newZ = centerY + Math.sin(elem.speed * (Date.now() * 0.001)) * swingRange;
				elem.object.position.z = newZ;
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
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
