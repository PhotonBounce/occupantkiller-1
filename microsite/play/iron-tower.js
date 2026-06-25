window.IronTower = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var towerGroup = null;
	var rotatingDish = null;
	var radarDishes = [];

	function createLatticeBeam(x, y, z, size) {
		var geometry = new THREE.BoxGeometry(size, size, size);
		var material = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.3 });
		var beam = new THREE.Mesh(geometry, material);
		beam.position.set(x, y, z);
		return beam;
	}

	function createDiagonalBrace(x1, y1, z1, x2, y2, z2) {
		var points = [
			new THREE.Vector3(x1, y1, z1),
			new THREE.Vector3(x2, y2, z2)
		];
		var geometry = new THREE.BufferGeometry().setFromPoints(points);
		var material = new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 2 });
		var line = new THREE.LineSegments(geometry, material);
		return line;
	}

	function buildMainTower() {
		var mainGroup = new THREE.Group();
		var beamSize = 0.8;
		var spacing = 8;
		var levels = 6;

		for (var i = 0; i < levels; i++) {
			var height = i * spacing;

			var beam1 = createLatticeBeam(-2, height, -2, beamSize);
			var beam2 = createLatticeBeam(2, height, -2, beamSize);
			var beam3 = createLatticeBeam(-2, height, 2, beamSize);
			var beam4 = createLatticeBeam(2, height, 2, beamSize);

			mainGroup.add(beam1);
			mainGroup.add(beam2);
			mainGroup.add(beam3);
			mainGroup.add(beam4);

			var brace1 = createDiagonalBrace(-2, height, -2, 2, height, 2);
			var brace2 = createDiagonalBrace(-2, height, 2, 2, height, -2);
			var brace3 = createDiagonalBrace(-2.5, height + spacing * 0.5, -2.5, 2.5, height + spacing * 0.5, 2.5);

			mainGroup.add(brace1);
			mainGroup.add(brace2);
			mainGroup.add(brace3);
		}

		return mainGroup;
	}

	function buildRadarDish(x, z, height) {
		var dishGroup = new THREE.Group();

		var stemGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
		var stemMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9 });
		var stem = new THREE.Mesh(stemGeometry, stemMaterial);
		stem.position.y = height + 1;
		dishGroup.add(stem);

		var dishGeometry = new THREE.CylinderGeometry(3.5, 3.5, 0.4, 16);
		var dishMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.85, roughness: 0.2 });
		var dish = new THREE.Mesh(dishGeometry, dishMaterial);
		dish.position.y = height + 2.2;
		dishGroup.add(dish);

		dishGroup.position.set(x, 0, z);
		radarDishes.push(dish);
		return dishGroup;
	}

	function buildControlPod() {
		var podGroup = new THREE.Group();
		var height = 24;

		var podGeometry = new THREE.BoxGeometry(4, 3.5, 4);
		var podMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7, roughness: 0.4 });
		var pod = new THREE.Mesh(podGeometry, podMaterial);
		pod.position.y = height;
		podGroup.add(pod);

		var antennaStem1 = new THREE.CylinderGeometry(0.15, 0.15, 4, 6);
		var antennaMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.9 });
		var antenna1 = new THREE.Mesh(antennaStem1, antennaMat);
		antenna1.position.set(-1.5, height + 3, -1.5);
		podGroup.add(antenna1);

		var antenna2 = new THREE.Mesh(antennaStem1, antennaMat);
		antenna2.position.set(1.5, height + 3, 1.5);
		podGroup.add(antenna2);

		return podGroup;
	}

	function buildFloodlights() {
		var lightGroup = new THREE.Group();
		var height = 36;
		var positions = [
			[-3, height, -3],
			[3, height, -3],
			[-3, height, 3],
			[3, height, 3]
		];

		for (var i = 0; i < positions.length; i++) {
			var pos = positions[i];
			var coneGeom = new THREE.ConeGeometry(1.2, 2.5, 8);
			var coneMat = new THREE.MeshStandardMaterial({ color: 0xffdd77, metalness: 0.6, emissive: 0x332200 });
			var cone = new THREE.Mesh(coneGeom, coneMat);
			cone.position.set(pos[0], pos[1], pos[2]);
			cone.rotation.x = Math.PI * 0.3;
			lightGroup.add(cone);

			var light = new THREE.PointLight(0xffdd77, 0.8, 40);
			light.position.set(pos[0], pos[1] - 2, pos[2]);
			lightGroup.add(light);
		}

		return lightGroup;
	}

	function buildMaintenanceWalkways() {
		var walkwayGroup = new THREE.Group();
		var heights = [12, 24, 36];

		for (var i = 0; i < heights.length; i++) {
			var h = heights[i];
			var floorGeom = new THREE.BoxGeometry(6, 0.4, 6);
			var floorMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.5, roughness: 0.6 });
			var floor = new THREE.Mesh(floorGeom, floorMat);
			floor.position.y = h;
			walkwayGroup.add(floor);

			var railing1 = createDiagonalBrace(-3, h + 1, -3, -3, h + 1, 3);
			var railing2 = createDiagonalBrace(3, h + 1, -3, 3, h + 1, 3);
			var railing3 = createDiagonalBrace(-3, h + 1, -3, 3, h + 1, -3);
			var railing4 = createDiagonalBrace(-3, h + 1, 3, 3, h + 1, 3);

			walkwayGroup.add(railing1);
			walkwayGroup.add(railing2);
			walkwayGroup.add(railing3);
			walkwayGroup.add(railing4);
		}

		return walkwayGroup;
	}

	function buildRotatingSatelliteDish() {
		var dishGroup = new THREE.Group();

		var stemGeom = new THREE.CylinderGeometry(0.4, 0.5, 3, 8);
		var stemMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.9 });
		var stem = new THREE.Mesh(stemGeom, stemMat);
		stem.position.y = 1.5;
		dishGroup.add(stem);

		var mainDishGeom = new THREE.CylinderGeometry(5.5, 5.5, 0.6, 32);
		var dishMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.95, roughness: 0.1 });
		var mainDish = new THREE.Mesh(mainDishGeom, dishMat);
		mainDish.position.y = 3.2;
		dishGroup.add(mainDish);

		var supportRing = new THREE.CylinderGeometry(6.2, 6.2, 0.3, 16);
		var supportMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
		var support = new THREE.Mesh(supportRing, supportMat);
		support.position.y = 3.8;
		dishGroup.add(support);

		return dishGroup;
	}

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		towerGroup = new THREE.Group();

		var mainTower = buildMainTower();
		towerGroup.add(mainTower);

		var radarLeft = buildRadarDish(-5, -5, 8);
		var radarRight = buildRadarDish(5, 5, 16);
		var radarFront = buildRadarDish(-5, 5, 24);
		towerGroup.add(radarLeft);
		towerGroup.add(radarRight);
		towerGroup.add(radarFront);

		var controlPod = buildControlPod();
		towerGroup.add(controlPod);

		var floodlights = buildFloodlights();
		towerGroup.add(floodlights);

		var walkways = buildMaintenanceWalkways();
		towerGroup.add(walkways);

		rotatingDish = buildRotatingSatelliteDish();
		rotatingDish.position.y = 46;
		towerGroup.add(rotatingDish);

		var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		towerGroup.add(ambientLight);

		var skyLight = new THREE.DirectionalLight(0xffffff, 0.8);
		skyLight.position.set(20, 40, 20);
		towerGroup.add(skyLight);

		scene.add(towerGroup);
	}

	function update(delta) {
		if (rotatingDish) {
			rotatingDish.rotation.y += delta * 0.3;
		}

		if (radarDishes && radarDishes.length > 0) {
			for (var i = 0; i < radarDishes.length; i++) {
				radarDishes[i].parent.rotation.z += delta * 0.15;
			}
		}
	}

	function reset() {
		if (towerGroup && scene) {
			scene.remove(towerGroup);
		}
		towerGroup = null;
		rotatingDish = null;
		radarDishes = [];
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
