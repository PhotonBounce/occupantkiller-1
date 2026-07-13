window.PlagueCity = (function() {
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

		buildQuarantineZone();
		buildTents();
		buildBarricades();
		buildMedicalTrucks();
		buildStorefronts();
		buildWalls();
		buildDecontaminationTowers();
		buildGraveTrenches();
		buildLighting();
	}

	function buildQuarantineZone() {
		var geometry = new THREE.BoxGeometry(200, 0.5, 200);
		var material = new THREE.MeshLambertMaterial({ color: 0x444444 });
		var ground = new THREE.Mesh(geometry, material);
		ground.position.y = -0.25;
		scene.add(ground);
		objects.push(ground);

		var dirtySpots = [
			{ x: -30, z: -40, size: 15 },
			{ x: 45, z: 20, size: 18 },
			{ x: -50, z: 50, size: 12 },
			{ x: 60, z: -60, size: 14 },
			{ x: 0, z: 0, size: 10 }
		];

		for (var i = 0; i < dirtySpots.length; i++) {
			var spot = dirtySpots[i];
			var spotGeo = new THREE.BoxGeometry(spot.size, 0.1, spot.size);
			var spotMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
			var spotMesh = new THREE.Mesh(spotGeo, spotMat);
			spotMesh.position.set(spot.x, 0, spot.z);
			scene.add(spotMesh);
			objects.push(spotMesh);
		}
	}

	function buildTents() {
		var tentsData = [
			{ x: -40, z: -30, rotation: 0 },
			{ x: -35, z: -45, rotation: 0.3 },
			{ x: -50, z: -20, rotation: -0.2 },
			{ x: 30, z: -40, rotation: 0 },
			{ x: 40, z: -35, rotation: 0.4 },
			{ x: 35, z: -50, rotation: -0.1 },
			{ x: 50, z: 30, rotation: 0 },
			{ x: 60, z: 35, rotation: 0.2 },
			{ x: 45, z: 45, rotation: -0.3 }
		];

		for (var i = 0; i < tentsData.length; i++) {
			var data = tentsData[i];
			buildSingleTent(data.x, data.z, data.rotation);
		}
	}

	function buildSingleTent(x, z, rotation) {
		var coneGeo = new THREE.ConeGeometry(8, 12, 8);
		var tentMat = new THREE.MeshLambertMaterial({ color: 0xcc3333 });
		var tent = new THREE.Mesh(coneGeo, tentMat);
		tent.position.set(x, 6, z);
		tent.rotation.z = rotation;
		scene.add(tent);
		objects.push(tent);

		var crossGeo = new THREE.BoxGeometry(3, 0.3, 6);
		var crossMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
		var crossH = new THREE.Mesh(crossGeo, crossMat);
		crossH.position.set(x, 8.5, z);
		scene.add(crossH);
		objects.push(crossH);

		var crossV = new THREE.Mesh(new THREE.BoxGeometry(0.3, 6, 3), crossMat);
		crossV.position.set(x, 5, z);
		scene.add(crossV);
		objects.push(crossV);

		var tentPoleGeo = new THREE.CylinderGeometry(0.4, 0.4, 12, 8);
		var poleMat = new THREE.MeshLambertMaterial({ color: 0xaa6633 });
		var pole = new THREE.Mesh(tentPoleGeo, poleMat);
		pole.position.set(x, 6, z);
		scene.add(pole);
		objects.push(pole);

		animatedElements.push({
			type: 'tentFlap',
			mesh: tent,
			baseX: tent.position.x,
			baseY: tent.position.y,
			baseZ: tent.position.z,
			baseRot: rotation,
			time: Math.random() * 6.28
		});
	}

	function buildBarricades() {
		var barricadePositions = [
			{ x: 0, z: -80, w: 40, h: 8, d: 3 },
			{ x: 80, z: 0, w: 3, h: 8, d: 40 },
			{ x: -80, z: 0, w: 3, h: 8, d: 40 },
			{ x: 0, z: 80, w: 40, h: 8, d: 3 },
			{ x: -60, z: -60, w: 15, h: 6, d: 2 },
			{ x: 60, z: 60, w: 15, h: 6, d: 2 },
			{ x: -40, z: 40, w: 20, h: 6, d: 2 },
			{ x: 40, z: -40, w: 20, h: 6, d: 2 }
		];

		for (var i = 0; i < barricadePositions.length; i++) {
			var pos = barricadePositions[i];
			var barGeo = new THREE.BoxGeometry(pos.w, pos.h, pos.d);
			var barMat = new THREE.MeshLambertMaterial({ color: 0xffff00 });
			var bar = new THREE.Mesh(barGeo, barMat);
			bar.position.set(pos.x, pos.h / 2, pos.z);
			scene.add(bar);
			objects.push(bar);

			var stripes = Math.ceil(pos.w / 3);
			for (var s = 0; s < stripes; s++) {
				var stripGeo = new THREE.BoxGeometry(1.5, pos.h + 2, pos.d + 1);
				var stripMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
				var strip = new THREE.Mesh(stripGeo, stripMat);
				strip.position.set(pos.x - pos.w / 2 + s * 3, pos.h / 2 + 1, pos.z);
				scene.add(strip);
				objects.push(strip);
			}
		}
	}

	function buildMedicalTrucks() {
		var truckPositions = [
			{ x: -70, z: -30 },
			{ x: 70, z: 50 },
			{ x: 30, z: 70 },
			{ x: -50, z: 50 }
		];

		for (var i = 0; i < truckPositions.length; i++) {
			buildTruck(truckPositions[i].x, truckPositions[i].z);
		}
	}

	function buildTruck(x, z) {
		var bodyGeo = new THREE.BoxGeometry(12, 8, 6);
		var bodyMat = new THREE.MeshLambertMaterial({ color: 0x336633 });
		var body = new THREE.Mesh(bodyGeo, bodyMat);
		body.position.set(x, 4, z);
		scene.add(body);
		objects.push(body);

		var cabGeo = new THREE.BoxGeometry(4, 6, 5);
		var cabMat = new THREE.MeshLambertMaterial({ color: 0x225522 });
		var cab = new THREE.Mesh(cabGeo, cabMat);
		cab.position.set(x + 8, 3, z);
		scene.add(cab);
		objects.push(cab);

		var wheelGeo = new THREE.CylinderGeometry(2, 2, 1, 16);
		var wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
		var wheels = [
			{ ox: -4, oz: -3.5 },
			{ ox: -4, oz: 3.5 },
			{ ox: 4, oz: -3.5 },
			{ ox: 4, oz: 3.5 }
		];

		for (var w = 0; w < wheels.length; w++) {
			var wheel = new THREE.Mesh(wheelGeo, wheelMat);
			wheel.rotation.z = Math.PI / 2;
			wheel.position.set(x + wheels[w].ox, 2, z + wheels[w].oz);
			scene.add(wheel);
			objects.push(wheel);
		}

		var redCrossGeo = new THREE.BoxGeometry(2.5, 0.2, 4);
		var redMat = new THREE.MeshLambertMaterial({ color: 0xff3333 });
		var crossH = new THREE.Mesh(redCrossGeo, redMat);
		crossH.position.set(x, 5.5, z);
		scene.add(crossH);
		objects.push(crossH);

		var crossV = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 2.5), redMat);
		crossV.position.set(x, 5, z);
		scene.add(crossV);
		objects.push(crossV);
	}

	function buildStorefronts() {
		var shopPositions = [
			{ x: -65, z: 35, label: 'PHARMACY' },
			{ x: -65, z: 55, label: 'MARKET' },
			{ x: 65, z: -45, label: 'HOSPITAL' },
			{ x: 65, z: 25, label: 'CLINIC' }
		];

		for (var i = 0; i < shopPositions.length; i++) {
			buildStorefront(shopPositions[i].x, shopPositions[i].z, shopPositions[i].label);
		}
	}

	function buildStorefront(x, z, label) {
		var wallGeo = new THREE.BoxGeometry(15, 10, 8);
		var wallMat = new THREE.MeshLambertMaterial({ color: 0xcc9966 });
		var wall = new THREE.Mesh(wallGeo, wallMat);
		wall.position.set(x, 5, z);
		scene.add(wall);
		objects.push(wall);

		var roofGeo = new THREE.ConeGeometry(10, 4, 4);
		var roofMat = new THREE.MeshLambertMaterial({ color: 0x884422 });
		var roof = new THREE.Mesh(roofGeo, roofMat);
		roof.position.set(x, 12, z);
		scene.add(roof);
		objects.push(roof);

		var windowCount = 3;
		for (var w = 0; w < windowCount; w++) {
			var windowGeo = new THREE.BoxGeometry(3, 3, 0.5);
			var windowMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
			var window = new THREE.Mesh(windowGeo, windowMat);
			window.position.set(x - 5 + w * 5, 7, z + 4.5);
			scene.add(window);
			objects.push(window);

			var frameMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
			var frame = new THREE.Mesh(new THREE.BoxGeometry(3.3, 3.3, 0.3), frameMat);
			frame.position.set(x - 5 + w * 5, 7, z + 4.2);
			scene.add(frame);
			objects.push(frame);
		}

		var doorGeo = new THREE.BoxGeometry(4, 6, 0.5);
		var doorMat = new THREE.MeshLambertMaterial({ color: 0x663333 });
		var door = new THREE.Mesh(doorGeo, doorMat);
		door.position.set(x + 5, 3, z + 4.5);
		scene.add(door);
		objects.push(door);
	}

	function buildWalls() {
		var wallSegments = [
			{ x: -90, z: -30, w: 15, h: 15, d: 3 },
			{ x: -90, z: 0, w: 15, h: 15, d: 3 },
			{ x: -90, z: 30, w: 15, h: 15, d: 3 },
			{ x: 90, z: -30, w: 15, h: 15, d: 3 },
			{ x: 90, z: 0, w: 15, h: 15, d: 3 },
			{ x: 90, z: 30, w: 15, h: 15, d: 3 },
			{ x: -30, z: -90, w: 15, h: 15, d: 3 },
			{ x: 0, z: -90, w: 15, h: 15, d: 3 },
			{ x: 30, z: -90, w: 15, h: 15, d: 3 },
			{ x: -30, z: 90, w: 15, h: 15, d: 3 },
			{ x: 0, z: 90, w: 15, h: 15, d: 3 },
			{ x: 30, z: 90, w: 15, h: 15, d: 3 }
		];

		for (var i = 0; i < wallSegments.length; i++) {
			var seg = wallSegments[i];
			var wallGeo = new THREE.BoxGeometry(seg.w, seg.h, seg.d);
			var wallMat = new THREE.MeshLambertMaterial({ color: 0x555577 });
			var wall = new THREE.Mesh(wallGeo, wallMat);
			wall.position.set(seg.x, seg.h / 2, seg.z);
			scene.add(wall);
			objects.push(wall);
		}
	}

	function buildDecontaminationTowers() {
		var towerPositions = [
			{ x: -50, z: -70 },
			{ x: 50, z: 70 },
			{ x: -70, z: 60 },
			{ x: 70, z: -60 }
		];

		for (var i = 0; i < towerPositions.length; i++) {
			buildDecontaminationTower(towerPositions[i].x, towerPositions[i].z);
		}
	}

	function buildDecontaminationTower(x, z) {
		var baseGeo = new THREE.BoxGeometry(4, 1, 4);
		var baseMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
		var base = new THREE.Mesh(baseGeo, baseMat);
		base.position.set(x, 0.5, z);
		scene.add(base);
		objects.push(base);

		var pipeGeo = new THREE.CylinderGeometry(0.8, 0.8, 18, 16);
		var pipeMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
		var pipe = new THREE.Mesh(pipeGeo, pipeMat);
		pipe.position.set(x, 9, z);
		scene.add(pipe);
		objects.push(pipe);

		var nozzleGeo = new THREE.BoxGeometry(6, 2, 2);
		var nozzleMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
		var nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
		nozzle.position.set(x, 16, z);
		scene.add(nozzle);
		objects.push(nozzle);

		var sprayGeo = new THREE.SphereGeometry(0.4, 8, 8);
		var sprayMat = new THREE.MeshLambertMaterial({ color: 0xccccff });
		var sprayCount = 8;
		for (var s = 0; s < sprayCount; s++) {
			var spray = new THREE.Mesh(sprayGeo, sprayMat);
			spray.position.set(x + (Math.random() - 0.5) * 10, 15 + Math.random() * 8, z + (Math.random() - 0.5) * 10);
			scene.add(spray);
			objects.push(spray);

			animatedElements.push({
				type: 'spray',
				mesh: spray,
				baseX: spray.position.x,
				baseY: spray.position.y,
				baseZ: spray.position.z,
				time: Math.random() * 6.28
			});
		}
	}

	function buildGraveTrenches() {
		var trenchPositions = [
			{ x: -25, z: 75, w: 30, d: 8 },
			{ x: 25, z: 75, w: 30, d: 8 },
			{ x: -75, z: -25, w: 30, d: 8 },
			{ x: -75, z: 25, w: 30, d: 8 }
		];

		for (var i = 0; i < trenchPositions.length; i++) {
			var trench = trenchPositions[i];
			var trenchGeo = new THREE.BoxGeometry(trench.w, 4, trench.d);
			var trenchMat = new THREE.MeshLambertMaterial({ color: 0x2d2d2d });
			var trenchMesh = new THREE.Mesh(trenchGeo, trenchMat);
			trenchMesh.position.set(trench.x, -2, trench.z);
			scene.add(trenchMesh);
			objects.push(trenchMesh);

			var bodyCount = Math.floor(trench.w / 4);
			for (var b = 0; b < bodyCount; b++) {
				var bodyGeo = new THREE.SphereGeometry(1.5, 8, 8);
				var bodyMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
				var body = new THREE.Mesh(bodyGeo, bodyMat);
				body.position.set(trench.x - trench.w / 2 + b * 4 + 2, -1.5, trench.z + (Math.random() - 0.5) * 3);
				body.scale.set(0.8, 0.6, 1.2);
				scene.add(body);
				objects.push(body);
			}

			var rimGeo = new THREE.BoxGeometry(trench.w + 2, 0.5, trench.d + 2);
			var rimMat = new THREE.MeshLambertMaterial({ color: 0x4d4d4d });
			var rim = new THREE.Mesh(rimGeo, rimMat);
			rim.position.set(trench.x, 0.25, trench.z);
			scene.add(rim);
			objects.push(rim);
		}
	}

	function buildLighting() {
		var ambientLight = new THREE.AmbientLight(0x666666, 0.8);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
		directionalLight.position.set(50, 60, 50);
		scene.add(directionalLight);
		lights.push(directionalLight);

		var warningLights = [
			{ x: -80, z: -80 },
			{ x: 80, z: -80 },
			{ x: -80, z: 80 },
			{ x: 80, z: 80 }
		];

		for (var i = 0; i < warningLights.length; i++) {
			var wLight = warningLights[i];
			var light = new THREE.PointLight(0xff6666, 0.8, 60);
			light.position.set(wLight.x, 10, wLight.z);
			scene.add(light);
			lights.push(light);

			var beaconGeo = new THREE.SphereGeometry(1, 16, 16);
			var beaconMat = new THREE.MeshLambertMaterial({ color: 0xff3333 });
			var beacon = new THREE.Mesh(beaconGeo, beaconMat);
			beacon.position.set(wLight.x, 12, wLight.z);
			scene.add(beacon);
			objects.push(beacon);

			animatedElements.push({
				type: 'beacon',
				mesh: beacon,
				light: light,
				time: 0
			});
		}
	}

	function update(delta) {
		for (var i = 0; i < animatedElements.length; i++) {
			var elem = animatedElements[i];

			if (elem.type === 'spray') {
				elem.time += delta * 2;
				var fallSpeed = delta * 8;
				elem.mesh.position.y -= fallSpeed;
				elem.mesh.position.x += Math.sin(elem.time * 1.5) * delta * 3;
				elem.mesh.position.z += Math.cos(elem.time * 1.3) * delta * 3;

				if (elem.mesh.position.y < 0) {
					elem.mesh.position.y = elem.baseY;
					elem.mesh.position.x = elem.baseX;
					elem.mesh.position.z = elem.baseZ;
				}
			}

			if (elem.type === 'beacon') {
				elem.time += delta;
				var intensity = 0.4 + Math.sin(elem.time * 4) * 0.4;
				elem.light.intensity = intensity;
				elem.mesh.scale.x = 1 + Math.sin(elem.time * 3) * 0.3;
				elem.mesh.scale.y = 1 + Math.sin(elem.time * 3) * 0.3;
				elem.mesh.scale.z = 1 + Math.sin(elem.time * 3) * 0.3;
			}

			if (elem.type === 'tentFlap') {
				elem.time += delta * 1.2;
				var flapAmount = Math.sin(elem.time) * 0.15;
				elem.mesh.rotation.z = elem.baseRot + flapAmount;
				elem.mesh.position.x = elem.baseX + Math.sin(elem.time * 0.5) * 0.5;
			}
		}
	}

	function reset() {
		for (var i = 0; i < objects.length; i++) {
			scene.remove(objects[i]);
		}

		for (var l = 0; l < lights.length; l++) {
			scene.remove(lights[l]);
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
