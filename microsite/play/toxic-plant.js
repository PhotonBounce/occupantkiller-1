window.ToxicPlant = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var objects = [];
	var lights = [];
	var animatedObjects = [];

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		lights = [];
		animatedObjects = [];

		buildMainReactionTowers();
		buildPipeNetwork();
		buildStorageSpheres();
		buildCoolingTowers();
		buildControlRoom();
		buildEmergencyValves();
		buildToxicPonds();
		buildLoadingDock();
		buildLighting();
	}

	function buildMainReactionTowers() {
		var towerPositions = [
			{x: -30, y: 0, z: -40},
			{x: 30, y: 0, z: -40},
			{x: -50, y: 0, z: 0},
			{x: 50, y: 0, z: 0}
		];

		for (var i = 0; i < towerPositions.length; i++) {
			var pos = towerPositions[i];
			var cylinderGeom = new THREE.CylinderGeometry(8, 8, 50, 12);
			var material = new THREE.MeshLambertMaterial({color: 0x4a4a4a});
			var tower = new THREE.Mesh(cylinderGeom, material);
			tower.position.set(pos.x, 25, pos.z);
			tower.castShadow = true;
			tower.receiveShadow = true;
			scene.add(tower);
			objects.push(tower);

			var topCapGeom = new THREE.CylinderGeometry(9, 7, 3, 12);
			var capMaterial = new THREE.MeshLambertMaterial({color: 0x1a1a1a});
			var topCap = new THREE.Mesh(topCapGeom, capMaterial);
			topCap.position.set(pos.x, 52, pos.z);
			topCap.castShadow = true;
			scene.add(topCap);
			objects.push(topCap);

			var rimGeom = new THREE.CylinderGeometry(10, 8, 1, 12);
			var rimMaterial = new THREE.MeshLambertMaterial({color: 0x333333});
			var rim = new THREE.Mesh(rimGeom, rimMaterial);
			rim.position.set(pos.x, 50.5, pos.z);
			rim.castShadow = true;
			scene.add(rim);
			objects.push(rim);

			var bandsGeom = new THREE.CylinderGeometry(8.3, 8.3, 1, 12);
			var bandMaterial = new THREE.MeshLambertMaterial({color: 0x2a2a2a});
			for (var j = 0; j < 5; j++) {
				var band = new THREE.Mesh(bandsGeom, bandMaterial);
				band.position.set(pos.x, 10 + j * 8, pos.z);
				band.castShadow = true;
				scene.add(band);
				objects.push(band);
			}
		}

		for (var k = 0; k < towerPositions.length; k++) {
			var vpos = towerPositions[k];
			var steamGeom = new THREE.CylinderGeometry(4, 5, 15, 8);
			var steamMat = new THREE.MeshLambertMaterial({color: 0x999999});
			var steam = new THREE.Mesh(steamGeom, steamMat);
			steam.position.set(vpos.x, 55 + k * 2, vpos.z);
			steam.castShadow = true;
			scene.add(steam);
			animatedObjects.push({mesh: steam, type: 'steam', offset: k * 0.3});
			objects.push(steam);
		}
	}

	function buildPipeNetwork() {
		var pipePoints = [
			{x: -30, y: 20, z: -40},
			{x: 0, y: 22, z: -35},
			{x: 30, y: 20, z: -40},
			{x: 50, y: 25, z: 0},
			{x: 0, y: 28, z: 0},
			{x: -50, y: 25, z: 0},
			{x: -30, y: 20, z: -40}
		];

		for (var i = 0; i < pipePoints.length - 1; i++) {
			var start = pipePoints[i];
			var end = pipePoints[i + 1];

			var dx = end.x - start.x;
			var dy = end.y - start.y;
			var dz = end.z - start.z;
			var length = Math.sqrt(dx * dx + dy * dy + dz * dz);

			var pipeGeom = new THREE.CylinderGeometry(1, 1, length, 8);
			var pipeMat = new THREE.MeshLambertMaterial({color: 0x3a3a3a});
			var pipe = new THREE.Mesh(pipeGeom, pipeMat);

			var midX = (start.x + end.x) / 2;
			var midY = (start.y + end.y) / 2;
			var midZ = (start.z + end.z) / 2;
			pipe.position.set(midX, midY, midZ);

			var angleXZ = Math.atan2(dz, dx);
			var projXZ = Math.sqrt(dx * dx + dz * dz);
			var angleY = Math.atan2(dy, projXZ);

			pipe.rotation.z = angleY;
			pipe.rotation.y = angleXZ;
			pipe.castShadow = true;
			scene.add(pipe);
			objects.push(pipe);

			for (var j = 0; j < 3; j++) {
				var boltGeom = new THREE.SphereGeometry(0.3, 4, 4);
				var boltMat = new THREE.MeshLambertMaterial({color: 0x555555});
				var bolt = new THREE.Mesh(boltGeom, boltMat);

				var t = 0.25 + j * 0.25;
				bolt.position.set(
					start.x + (end.x - start.x) * t,
					start.y + (end.y - start.y) * t,
					start.z + (end.z - start.z) * t
				);
				bolt.castShadow = true;
				scene.add(bolt);
				objects.push(bolt);
			}
		}

		for (var k = 0; k < 12; k++) {
			var junctionGeom = new THREE.SphereGeometry(1.5, 8, 8);
			var junctionMat = new THREE.MeshLambertMaterial({color: 0x2a2a2a});
			var junction = new THREE.Mesh(junctionGeom, junctionMat);
			junction.position.set(
				-50 + k * 20,
				18 + Math.sin(k * 0.5) * 3,
				-30 + Math.cos(k * 0.3) * 15
			);
			junction.castShadow = true;
			scene.add(junction);
			objects.push(junction);
		}
	}

	function buildStorageSpheres() {
		var storagePositions = [
			{x: -35, y: 8, z: 15},
			{x: 0, y: 8, z: 25},
			{x: 35, y: 8, z: 15},
			{x: -25, y: 8, z: 40},
			{x: 25, y: 8, z: 40}
		];

		for (var i = 0; i < storagePositions.length; i++) {
			var pos = storagePositions[i];
			var storageGeom = new THREE.SphereGeometry(6, 16, 16);
			var storageMat = new THREE.MeshLambertMaterial({color: 0x1a3a1a});
			var storage = new THREE.Mesh(storageGeom, storageMat);
			storage.position.set(pos.x, pos.y, pos.z);
			storage.castShadow = true;
			storage.receiveShadow = true;
			scene.add(storage);
			objects.push(storage);

			var supportGeom = new THREE.CylinderGeometry(1.5, 2, 8, 8);
			var supportMat = new THREE.MeshLambertMaterial({color: 0x3a3a3a});
			for (var j = 0; j < 4; j++) {
				var support = new THREE.Mesh(supportGeom, supportMat);
				var angle = j * Math.PI / 2;
				support.position.set(
					pos.x + Math.cos(angle) * 4.5,
					pos.y - 4,
					pos.z + Math.sin(angle) * 4.5
				);
				support.castShadow = true;
				scene.add(support);
				objects.push(support);
			}

			var valveGeom = new THREE.CylinderGeometry(0.8, 0.8, 2, 8);
			var valveMat = new THREE.MeshLambertMaterial({color: 0x555555});
			var valve = new THREE.Mesh(valveGeom, valveMat);
			valve.position.set(pos.x, pos.y - 6.5, pos.z);
			valve.castShadow = true;
			scene.add(valve);
			objects.push(valve);
		}
	}

	function buildCoolingTowers() {
		var coolingPositions = [
			{x: -60, y: 0, z: 30},
			{x: 60, y: 0, z: 30}
		];

		for (var i = 0; i < coolingPositions.length; i++) {
			var pos = coolingPositions[i];

			var outerGeom = new THREE.CylinderGeometry(7, 9, 35, 12);
			var outerMat = new THREE.MeshLambertMaterial({color: 0x4a4a4a});
			var outer = new THREE.Mesh(outerGeom, outerMat);
			outer.position.set(pos.x, 17.5, pos.z);
			outer.castShadow = true;
			scene.add(outer);
			objects.push(outer);

			var innerGeom = new THREE.CylinderGeometry(4, 5, 32, 12);
			var innerMat = new THREE.MeshLambertMaterial({color: 0x2a2a2a});
			var inner = new THREE.Mesh(innerGeom, innerMat);
			inner.position.set(pos.x, 18, pos.z);
			scene.add(inner);
			objects.push(inner);

			var rimGeom = new THREE.CylinderGeometry(8, 10, 1, 12);
			var rimMat = new THREE.MeshLambertMaterial({color: 0x555555});
			var rim = new THREE.Mesh(rimGeom, rimMat);
			rim.position.set(pos.x, 34, pos.z);
			rim.castShadow = true;
			scene.add(rim);
			objects.push(rim);

			for (var j = 0; j < 8; j++) {
				var steamGeom = new THREE.ConeGeometry(2.5, 20, 6);
				var steamMat = new THREE.MeshLambertMaterial({color: 0xaaaaaa});
				var steam = new THREE.Mesh(steamGeom, steamMat);
				var angle = j * Math.PI / 4;
				steam.position.set(
					pos.x + Math.cos(angle) * 5.5,
					38,
					pos.z + Math.sin(angle) * 5.5
				);
				animatedObjects.push({mesh: steam, type: 'steam', offset: j * 0.2});
				scene.add(steam);
				objects.push(steam);
			}
		}
	}

	function buildControlRoom() {
		var roomGeom = new THREE.BoxGeometry(20, 15, 20);
		var roomMat = new THREE.MeshLambertMaterial({color: 0x2a2a2a});
		var room = new THREE.Mesh(roomGeom, roomMat);
		room.position.set(0, 7.5, -70);
		room.castShadow = true;
		room.receiveShadow = true;
		scene.add(room);
		objects.push(room);

		var roofGeom = new THREE.BoxGeometry(22, 2, 22);
		var roofMat = new THREE.MeshLambertMaterial({color: 0x1a1a1a});
		var roof = new THREE.Mesh(roofGeom, roofMat);
		roof.position.set(0, 15, -70);
		roof.castShadow = true;
		scene.add(roof);
		objects.push(roof);

		for (var i = 0; i < 4; i++) {
			var windowGeom = new THREE.BoxGeometry(3, 3, 0.5);
			var windowMat = new THREE.MeshLambertMaterial({color: 0x001a00});
			var window = new THREE.Mesh(windowGeom, windowMat);
			if (i < 2) {
				window.position.set(-7 + i * 14, 10, -69.75);
			} else {
				window.position.set(-8, 10, -70 + (i - 2) * 16);
			}
			window.castShadow = true;
			scene.add(window);
			objects.push(window);
		}

		for (var j = 0; j < 6; j++) {
			var panelGeom = new THREE.BoxGeometry(2, 4, 0.3);
			var panelMat = new THREE.MeshLambertMaterial({color: 0x1a3a1a});
			var panel = new THREE.Mesh(panelGeom, panelMat);
			panel.position.set(-9 + j * 3, 6, -69.85);
			panel.castShadow = true;
			scene.add(panel);
			objects.push(panel);
		}

		for (var k = 0; k < 12; k++) {
			var lightGeom = new THREE.SphereGeometry(0.3, 4, 4);
			var lightMat = new THREE.MeshLambertMaterial({color: 0xff0000});
			var light = new THREE.Mesh(lightGeom, lightMat);
			light.position.set(
				-8 + (k % 6) * 3,
				7 + Math.floor(k / 6) * 2,
				-69.8
			);
			scene.add(light);
			objects.push(light);
		}
	}

	function buildEmergencyValves() {
		var valvePositions = [
			{x: -40, y: 0, z: 20},
			{x: 40, y: 0, z: 20},
			{x: -20, y: 0, z: -60},
			{x: 20, y: 0, z: -60}
		];

		for (var i = 0; i < valvePositions.length; i++) {
			var pos = valvePositions[i];

			var baseGeom = new THREE.CylinderGeometry(3, 3, 1, 8);
			var baseMat = new THREE.MeshLambertMaterial({color: 0x555555});
			var base = new THREE.Mesh(baseGeom, baseMat);
			base.position.set(pos.x, pos.y, pos.z);
			base.castShadow = true;
			scene.add(base);
			objects.push(base);

			var wheelGeom = new THREE.CylinderGeometry(5, 5, 0.8, 16);
			var wheelMat = new THREE.MeshLambertMaterial({color: 0x3a3a3a});
			var wheel = new THREE.Mesh(wheelGeom, wheelMat);
			wheel.position.set(pos.x, pos.y + 0.5, pos.z);
			wheel.rotation.y = 0;
			wheel.castShadow = true;
			scene.add(wheel);
			animatedObjects.push({mesh: wheel, type: 'valve', offset: i * 0.1});
			objects.push(wheel);

			var rimGeom = new THREE.CylinderGeometry(5.3, 5.3, 0.3, 16);
			var rimMat = new THREE.MeshLambertMaterial({color: 0x1a1a1a});
			var rim = new THREE.Mesh(rimGeom, rimMat);
			rim.position.set(pos.x, pos.y + 0.6, pos.z);
			rim.castShadow = true;
			scene.add(rim);
			objects.push(rim);

			for (var j = 0; j < 4; j++) {
				var spokeGeom = new THREE.BoxGeometry(0.4, 0.4, 4.5);
				var spokeMat = new THREE.MeshLambertMaterial({color: 0x2a2a2a});
				var spoke = new THREE.Mesh(spokeGeom, spokeMat);
				spoke.position.set(pos.x, pos.y + 0.5, pos.z);
				spoke.rotation.y = j * Math.PI / 2;
				spoke.castShadow = true;
				scene.add(spoke);
				objects.push(spoke);
			}

			var stemGeom = new THREE.CylinderGeometry(0.6, 0.6, 4, 6);
			var stemMat = new THREE.MeshLambertMaterial({color: 0x555555});
			var stem = new THREE.Mesh(stemGeom, stemMat);
			stem.position.set(pos.x, pos.y - 2, pos.z);
			stem.castShadow = true;
			scene.add(stem);
			objects.push(stem);
		}
	}

	function buildToxicPonds() {
		var pondPositions = [
			{x: -70, y: -2, z: 50},
			{x: 70, y: -2, z: 50},
			{x: 0, y: -2, z: 80}
		];

		for (var i = 0; i < pondPositions.length; i++) {
			var pos = pondPositions[i];

			var pondGeom = new THREE.CylinderGeometry(12, 13, 3, 16);
			var pondMat = new THREE.MeshLambertMaterial({color: 0x00ff00});
			var pond = new THREE.Mesh(pondGeom, pondMat);
			pond.position.set(pos.x, pos.y, pos.z);
			pond.castShadow = true;
			pond.receiveShadow = true;
			scene.add(pond);
			animatedObjects.push({mesh: pond, type: 'glow', offset: i * 0.4, baseColor: 0x00ff00});
			objects.push(pond);

			var rimGeom = new THREE.CylinderGeometry(13.5, 14, 0.5, 16);
			var rimMat = new THREE.MeshLambertMaterial({color: 0x4a7a4a});
			var rim = new THREE.Mesh(rimGeom, rimMat);
			rim.position.set(pos.x, pos.y + 1.8, pos.z);
			rim.castShadow = true;
			scene.add(rim);
			objects.push(rim);

			for (var j = 0; j < 5; j++) {
				var bubbleGeom = new THREE.SphereGeometry(1 + j * 0.5, 6, 6);
				var bubbleMat = new THREE.MeshLambertMaterial({color: 0x00aa00});
				var bubble = new THREE.Mesh(bubbleGeom, bubbleMat);
				bubble.position.set(
					pos.x - 8 + j * 4,
					pos.y + 1.5,
					pos.z - 8 + (j % 2) * 8
				);
				animatedObjects.push({mesh: bubble, type: 'bubble', offset: j * 0.15});
				scene.add(bubble);
				objects.push(bubble);
			}
		}
	}

	function buildLoadingDock() {
		var dockGeom = new THREE.BoxGeometry(30, 1, 40);
		var dockMat = new THREE.MeshLambertMaterial({color: 0x3a3a3a});
		var dock = new THREE.Mesh(dockGeom, dockMat);
		dock.position.set(0, 0, 15);
		dock.receiveShadow = true;
		scene.add(dock);
		objects.push(dock);

		for (var i = 0; i < 4; i++) {
			var supportGeom = new THREE.BoxGeometry(2, 8, 3);
			var supportMat = new THREE.MeshLambertMaterial({color: 0x2a2a2a});
			var support = new THREE.Mesh(supportGeom, supportMat);
			support.position.set(-12 + i * 8, -4, 0 + (i % 2) * 20);
			support.castShadow = true;
			scene.add(support);
			objects.push(support);
		}

		var gateGeom = new THREE.BoxGeometry(28, 5, 1);
		var gateMat = new THREE.MeshLambertMaterial({color: 0x1a1a1a});
		var gate = new THREE.Mesh(gateGeom, gateMat);
		gate.position.set(0, 2.5, -19);
		gate.castShadow = true;
		scene.add(gate);
		objects.push(gate);

		for (var j = 0; j < 6; j++) {
			var boltGeom = new THREE.SphereGeometry(0.5, 4, 4);
			var boltMat = new THREE.MeshLambertMaterial({color: 0x555555});
			var bolt = new THREE.Mesh(boltGeom, boltMat);
			bolt.position.set(-12 + j * 5, 2.5, -18.5);
			bolt.castShadow = true;
			scene.add(bolt);
			objects.push(bolt);
		}

		var containerGeom = new THREE.BoxGeometry(6, 6, 12);
		var containerMat = new THREE.MeshLambertMaterial({color: 0x4a4a1a});
		var container = new THREE.Mesh(containerGeom, containerMat);
		container.position.set(-8, 3, 30);
		container.castShadow = true;
		scene.add(container);
		objects.push(container);

		var container2Geom = new THREE.BoxGeometry(6, 6, 12);
		var container2Mat = new THREE.MeshLambertMaterial({color: 0x4a4a1a});
		var container2 = new THREE.Mesh(container2Geom, container2Mat);
		container2.position.set(8, 3, 30);
		container2.castShadow = true;
		scene.add(container2);
		objects.push(container2);

		var craneGeom = new THREE.BoxGeometry(1.5, 20, 1.5);
		var craneMat = new THREE.MeshLambertMaterial({color: 0x3a3a3a});
		var crane = new THREE.Mesh(craneGeom, craneMat);
		crane.position.set(-15, 10, 15);
		crane.castShadow = true;
		scene.add(crane);
		objects.push(crane);

		var armGeom = new THREE.BoxGeometry(15, 1, 1);
		var armMat = new THREE.MeshLambertMaterial({color: 0x2a2a2a});
		var arm = new THREE.Mesh(armGeom, armMat);
		arm.position.set(-7.5, 19, 15);
		arm.castShadow = true;
		scene.add(arm);
		objects.push(arm);

		var hookGeom = new THREE.CylinderGeometry(0.5, 0.5, 3, 6);
		var hookMat = new THREE.MeshLambertMaterial({color: 0x555555});
		var hook = new THREE.Mesh(hookGeom, hookMat);
		hook.position.set(0, 15.5, 15);
		hook.castShadow = true;
		scene.add(hook);
		objects.push(hook);
	}

	function buildLighting() {
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(50, 80, 50);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		directionalLight.shadow.camera.left = -150;
		directionalLight.shadow.camera.right = 150;
		directionalLight.shadow.camera.top = 150;
		directionalLight.shadow.camera.bottom = -150;
		directionalLight.shadow.camera.near = 0.1;
		directionalLight.shadow.camera.far = 500;
		scene.add(directionalLight);
		lights.push(directionalLight);

		var toxicLight = new THREE.PointLight(0x00ff00, 0.6, 100);
		toxicLight.position.set(-70, 5, 50);
		scene.add(toxicLight);
		lights.push(toxicLight);

		var toxicLight2 = new THREE.PointLight(0x00ff00, 0.6, 100);
		toxicLight2.position.set(70, 5, 50);
		scene.add(toxicLight2);
		lights.push(toxicLight2);

		var toxicLight3 = new THREE.PointLight(0x00ff00, 0.5, 80);
		toxicLight3.position.set(0, 5, 80);
		scene.add(toxicLight3);
		lights.push(toxicLight3);

		var warningLight = new THREE.PointLight(0xff4400, 0.4, 50);
		warningLight.position.set(0, 20, -70);
		scene.add(warningLight);
		lights.push(warningLight);
	}

	function update(delta) {
		for (var i = 0; i < animatedObjects.length; i++) {
			var obj = animatedObjects[i];

			if (obj.type === 'steam') {
				var steamScale = 1 + Math.sin((Date.now() * 0.001) + obj.offset) * 0.15;
				obj.mesh.scale.y = steamScale;
				obj.mesh.position.y += delta * (1 + Math.sin((Date.now() * 0.0008) + obj.offset) * 0.5);
				obj.mesh.material.opacity = 0.8 + Math.sin((Date.now() * 0.0012) + obj.offset) * 0.2;
			}

			if (obj.type === 'valve') {
				obj.mesh.rotation.y += delta * (0.3 + Math.sin((Date.now() * 0.0006) + obj.offset) * 0.2);
			}

			if (obj.type === 'glow') {
				var glowIntensity = 0.7 + Math.sin((Date.now() * 0.0015) + obj.offset) * 0.3;
				var r = ((obj.baseColor >> 16) & 255) / 255;
				var g = ((obj.baseColor >> 8) & 255) / 255;
				var b = (obj.baseColor & 255) / 255;
				obj.mesh.material.color.setRGB(
					r * glowIntensity,
					g * glowIntensity * 1.2,
					b * glowIntensity
				);
			}

			if (obj.type === 'bubble') {
				obj.mesh.position.y += delta * (1.5 + Math.sin((Date.now() * 0.001) + obj.offset) * 0.8);
				var bobbing = Math.sin((Date.now() * 0.002) + obj.offset) * 2;
				obj.mesh.position.x += Math.cos((Date.now() * 0.0015) + obj.offset) * 0.05;
				obj.mesh.position.z += Math.sin((Date.now() * 0.0018) + obj.offset) * 0.05;
				obj.mesh.scale.x = 0.8 + Math.sin((Date.now() * 0.002) + obj.offset) * 0.2;
				obj.mesh.scale.z = 0.8 + Math.sin((Date.now() * 0.002) + obj.offset) * 0.2;
			}
		}
	}

	function reset() {
		for (var i = 0; i < objects.length; i++) {
			scene.remove(objects[i]);
		}
		objects = [];

		for (var j = 0; j < lights.length; j++) {
			scene.remove(lights[j]);
		}
		lights = [];

		animatedObjects = [];
		scene = null;
		camera = null;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
