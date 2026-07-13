window.IceDock = (function() {
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

		buildlighting();
		buildfloor();
		buildwalls();
		buildceiling();
		buildsubmarines();
		buildtorpedoracks();
		buildcranes();
		buildoperationscenter();
		buildstalactites();
		buildsupplycaches();
	}

	function buildlighting() {
		var ambientLight = new THREE.AmbientLight(0xb3d9ff, 0.4);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var hemisphereLight = new THREE.HemisphereLight(0xb3d9ff, 0x1a4d6d, 0.6);
		scene.add(hemisphereLight);
		lights.push(hemisphereLight);

		var pointLight1 = new THREE.PointLight(0x66ccff, 1.0, 100);
		pointLight1.position.set(0, 20, 0);
		scene.add(pointLight1);
		lights.push(pointLight1);

		var pointLight2 = new THREE.PointLight(0x66ccff, 0.8, 80);
		pointLight2.position.set(30, 15, 30);
		scene.add(pointLight2);
		lights.push(pointLight2);

		var pointLight3 = new THREE.PointLight(0x66ccff, 0.8, 80);
		pointLight3.position.set(-30, 15, -30);
		scene.add(pointLight3);
		lights.push(pointLight3);
	}

	function buildfloor() {
		var floorGeo = new THREE.BoxGeometry(200, 2, 200);
		var floorMat = new THREE.MeshLambertMaterial({ color: 0x4da6ff });
		var floor = new THREE.Mesh(floorGeo, floorMat);
		floor.position.y = -1;
		scene.add(floor);
		objects.push(floor);

		var iceBlockSize = 10;
		for (var i = -10; i < 10; i++) {
			for (var j = -10; j < 10; j++) {
				if ((i + j) % 3 === 0) {
					var blockGeo = new THREE.BoxGeometry(iceBlockSize, 1, iceBlockSize);
					var blockMat = new THREE.MeshLambertMaterial({ color: 0x99ddff });
					var block = new THREE.Mesh(blockGeo, blockMat);
					block.position.set(i * iceBlockSize, -0.5, j * iceBlockSize);
					scene.add(block);
					objects.push(block);
				}
			}
		}
	}

	function buildwalls() {
		var wallHeight = 30;
		var wallThickness = 3;
		var wallLength = 200;

		var wallMatLeft = new THREE.MeshLambertMaterial({ color: 0x6699cc });
		var wallGeoLeft = new THREE.BoxGeometry(wallThickness, wallHeight, wallLength);
		var wallLeft = new THREE.Mesh(wallGeoLeft, wallMatLeft);
		wallLeft.position.set(-100, wallHeight / 2, 0);
		scene.add(wallLeft);
		objects.push(wallLeft);

		var wallRight = new THREE.Mesh(wallGeoLeft, wallMatLeft);
		wallRight.position.set(100, wallHeight / 2, 0);
		scene.add(wallRight);
		objects.push(wallRight);

		var wallMatFront = new THREE.MeshLambertMaterial({ color: 0x5588bb });
		var wallGeoFront = new THREE.BoxGeometry(wallLength, wallHeight, wallThickness);
		var wallFront = new THREE.Mesh(wallGeoFront, wallMatFront);
		wallFront.position.set(0, wallHeight / 2, -100);
		scene.add(wallFront);
		objects.push(wallFront);

		var wallBack = new THREE.Mesh(wallGeoFront, wallMatFront);
		wallBack.position.set(0, wallHeight / 2, 100);
		scene.add(wallBack);
		objects.push(wallBack);

		var wallSectionGeo = new THREE.BoxGeometry(8, 15, 2);
		var wallSectionMat = new THREE.MeshLambertMaterial({ color: 0x7799dd });
		for (var i = -50; i < 50; i += 20) {
			var section1 = new THREE.Mesh(wallSectionGeo, wallSectionMat);
			section1.position.set(i, 10, -98);
			scene.add(section1);
			objects.push(section1);

			var section2 = new THREE.Mesh(wallSectionGeo, wallSectionMat);
			section2.position.set(i, 10, 98);
			scene.add(section2);
			objects.push(section2);
		}
	}

	function buildceiling() {
		var ceilingGeo = new THREE.BoxGeometry(200, 2, 200);
		var ceilingMat = new THREE.MeshLambertMaterial({ color: 0x4da6ff });
		var ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
		ceiling.position.y = 31;
		scene.add(ceiling);
		objects.push(ceiling);

		var beamGeo = new THREE.BoxGeometry(2, 2, 200);
		var beamMat = new THREE.MeshLambertMaterial({ color: 0x6699cc });
		for (var i = -50; i < 50; i += 25) {
			var beam = new THREE.Mesh(beamGeo, beamMat);
			beam.position.set(i, 30, 0);
			scene.add(beam);
			objects.push(beam);
		}
	}

	function buildsubmarines() {
		var submarinePositions = [
			{ x: -40, z: -30 },
			{ x: -40, z: 0 },
			{ x: -40, z: 30 },
			{ x: 40, z: -30 },
			{ x: 40, z: 0 },
			{ x: 40, z: 30 }
		];

		for (var i = 0; i < submarinePositions.length; i++) {
			buildsubmarine(submarinePositions[i].x, submarinePositions[i].z);
		}
	}

	function buildsubmarine(x, z) {
		var hullGeo = new THREE.BoxGeometry(6, 4, 18);
		var hullMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
		var hull = new THREE.Mesh(hullGeo, hullMat);
		hull.position.set(x, 2, z);
		scene.add(hull);
		objects.push(hull);

		var towerGeo = new THREE.BoxGeometry(2, 6, 4);
		var towerMat = new THREE.MeshLambertMaterial({ color: 0x445566 });
		var tower = new THREE.Mesh(towerGeo, towerMat);
		tower.position.set(x, 5, z - 2);
		scene.add(tower);
		objects.push(tower);

		var coneGeo = new THREE.ConeGeometry(1, 3, 8);
		var coneMat = new THREE.MeshLambertMaterial({ color: 0x556677 });
		var cone = new THREE.Mesh(coneGeo, coneMat);
		cone.position.set(x, 9, z - 2);
		scene.add(cone);
		objects.push(cone);

		var propellerGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 12);
		var propellerMat = new THREE.MeshLambertMaterial({ color: 0x223344 });
		var propeller = new THREE.Mesh(propellerGeo, propellerMat);
		propeller.position.set(x, 2, z + 9);
		propeller.rotation.x = Math.PI / 2;
		scene.add(propeller);
		objects.push(propeller);
		animatedElements.push({ obj: propeller, type: 'propeller' });
	}

	function buildtorpedoracks() {
		var rackPositions = [
			{ x: -95, z: -60 },
			{ x: -95, z: -20 },
			{ x: -95, z: 20 },
			{ x: -95, z: 60 },
			{ x: 95, z: -60 },
			{ x: 95, z: -20 },
			{ x: 95, z: 20 },
			{ x: 95, z: 60 }
		];

		for (var i = 0; i < rackPositions.length; i++) {
			buildtorpedorack(rackPositions[i].x, rackPositions[i].z);
		}
	}

	function buildtorpedorack(x, z) {
		var frameGeo = new THREE.BoxGeometry(2, 12, 2);
		var frameMat = new THREE.MeshLambertMaterial({ color: 0x7799dd });
		var frame = new THREE.Mesh(frameGeo, frameMat);
		frame.position.set(x, 6, z);
		scene.add(frame);
		objects.push(frame);

		for (var row = 0; row < 4; row++) {
			var torpedoGeo = new THREE.CylinderGeometry(0.8, 0.8, 4, 8);
			var torpedoMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
			var torpedo = new THREE.Mesh(torpedoGeo, torpedoMat);
			torpedo.position.set(x + 3, 3 + row * 3, z);
			torpedo.rotation.z = Math.PI / 2;
			scene.add(torpedo);
			objects.push(torpedo);
			if (row === 0) {
				animatedElements.push({ obj: torpedo, type: 'torpedo', row: row });
			}
		}
	}

	function buildcranes() {
		buildcrane(-50, 80);
		buildcrane(50, 80);
	}

	function buildcrane(x, z) {
		var baseGeo = new THREE.BoxGeometry(4, 2, 4);
		var baseMat = new THREE.MeshLambertMaterial({ color: 0x554433 });
		var base = new THREE.Mesh(baseGeo, baseMat);
		base.position.set(x, 1, z);
		scene.add(base);
		objects.push(base);

		var columnGeo = new THREE.CylinderGeometry(1, 1, 20, 12);
		var columnMat = new THREE.MeshLambertMaterial({ color: 0x665544 });
		var column = new THREE.Mesh(columnGeo, columnMat);
		column.position.set(x, 12, z);
		scene.add(column);
		objects.push(column);

		var boomGeo = new THREE.BoxGeometry(30, 1, 1);
		var boomMat = new THREE.MeshLambertMaterial({ color: 0x776655 });
		var boom = new THREE.Mesh(boomGeo, boomMat);
		boom.position.set(x + 10, 22, z);
		scene.add(boom);
		objects.push(boom);

		var hookGeo = new THREE.SphereGeometry(0.8, 8, 8);
		var hookMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
		var hook = new THREE.Mesh(hookGeo, hookMat);
		hook.position.set(x + 20, 15, z);
		scene.add(hook);
		objects.push(hook);

		animatedElements.push({ obj: boom, type: 'crane', baseX: x, baseZ: z });
	}

	function buildoperationscenter() {
		var buildingGeo = new THREE.BoxGeometry(20, 12, 25);
		var buildingMat = new THREE.MeshLambertMaterial({ color: 0x5588aa });
		var building = new THREE.Mesh(buildingGeo, buildingMat);
		building.position.set(0, 6, -70);
		scene.add(building);
		objects.push(building);

		var roofGeo = new THREE.BoxGeometry(22, 2, 27);
		var roofMat = new THREE.MeshLambertMaterial({ color: 0x4477aa });
		var roof = new THREE.Mesh(roofGeo, roofMat);
		roof.position.set(0, 13, -70);
		scene.add(roof);
		objects.push(roof);

		var windowGeo = new THREE.BoxGeometry(3, 3, 0.5);
		var windowMat = new THREE.MeshLambertMaterial({ color: 0x99ccff });
		for (var i = -3; i <= 3; i += 3) {
			var window1 = new THREE.Mesh(windowGeo, windowMat);
			window1.position.set(i, 8, -57.5);
			scene.add(window1);
			objects.push(window1);

			var window2 = new THREE.Mesh(windowGeo, windowMat);
			window2.position.set(i, 8, -82.5);
			scene.add(window2);
			objects.push(window2);
		}

		var periscope = buildperiscope(0, 14, -70);
		animatedElements.push({ obj: periscope, type: 'periscope' });
	}

	function buildperiscope(x, y, z) {
		var tubeGeo = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
		var tubeMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
		var tube = new THREE.Mesh(tubeGeo, tubeMat);
		tube.position.set(x, y, z);
		scene.add(tube);
		objects.push(tube);

		var headGeo = new THREE.SphereGeometry(1, 8, 8);
		var headMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
		var head = new THREE.Mesh(headGeo, headMat);
		head.position.set(x, y + 5, z);
		scene.add(head);
		objects.push(head);

		return head;
	}

	function buildstalactites() {
		var stalactitePositions = [];
		for (var i = -80; i < 80; i += 20) {
			for (var j = -80; j < 80; j += 20) {
				if (Math.random() > 0.5) {
					stalactitePositions.push({ x: i, z: j });
				}
			}
		}

		for (var k = 0; k < stalactitePositions.length; k++) {
			buildstalactite(stalactitePositions[k].x, stalactitePositions[k].z);
		}
	}

	function buildstalactite(x, z) {
		var coneGeo = new THREE.ConeGeometry(1.5, 8, 12);
		var coneMat = new THREE.MeshLambertMaterial({ color: 0x99ccff });
		var cone = new THREE.Mesh(coneGeo, coneMat);
		cone.position.set(x, 25, z);
		scene.add(cone);
		objects.push(cone);

		var pointGeo = new THREE.ConeGeometry(0.5, 3, 8);
		var pointMat = new THREE.MeshLambertMaterial({ color: 0x7799dd });
		var point = new THREE.Mesh(pointGeo, pointMat);
		point.position.set(x, 21, z);
		scene.add(point);
		objects.push(point);
	}

	function buildsupplycaches() {
		var cachePositions = [
			{ x: -60, z: -80 },
			{ x: -60, z: 80 },
			{ x: 60, z: -80 },
			{ x: 60, z: 80 },
			{ x: -80, z: -50 },
			{ x: -80, z: 50 },
			{ x: 80, z: -50 },
			{ x: 80, z: 50 }
		];

		for (var i = 0; i < cachePositions.length; i++) {
			buildsupplycache(cachePositions[i].x, cachePositions[i].z);
		}
	}

	function buildsupplycache(x, z) {
		var cacheGeo = new THREE.BoxGeometry(8, 8, 8);
		var cacheMat = new THREE.MeshLambertMaterial({ color: 0x8899ff });
		var cache = new THREE.Mesh(cacheGeo, cacheMat);
		cache.position.set(x, 4, z);
		scene.add(cache);
		objects.push(cache);

		var crateGeo = new THREE.BoxGeometry(2, 2, 2);
		var crateMat = new THREE.MeshLambertMaterial({ color: 0xaabbff });
		for (var row = 0; row < 2; row++) {
			for (var col = 0; col < 2; col++) {
				var crate = new THREE.Mesh(crateGeo, crateMat);
				crate.position.set(x - 3 + col * 4, 2 + row * 2.5, z);
				scene.add(crate);
				objects.push(crate);
			}
		}
	}

	function update(delta) {
		for (var i = 0; i < animatedElements.length; i++) {
			var element = animatedElements[i];

			if (element.type === 'propeller') {
				element.obj.rotation.x += delta * 15;
			}

			if (element.type === 'periscope') {
				element.obj.parent.rotation.y = Math.sin(Date.now() * 0.0005) * 0.3;
			}

			if (element.type === 'crane') {
				var time = Date.now() * 0.0005;
				element.obj.position.x = element.baseX + 10 + Math.sin(time) * 8;
				var hook = objects[objects.length - 10];
				if (hook && hook.position) {
					hook.position.y = 15 + Math.sin(time * 1.5) * 3;
				}
			}

			if (element.type === 'torpedo') {
				var torpTime = Date.now() * 0.0008;
				if (Math.abs(Math.sin(torpTime)) > 0.9) {
					element.obj.position.x += Math.cos(torpTime) * 0.1;
				}
			}
		}
	}

	function reset() {
		for (var i = objects.length - 1; i >= 0; i--) {
			scene.remove(objects[i]);
		}
		for (var j = lights.length - 1; j >= 0; j--) {
			scene.remove(lights[j]);
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
}());
