window.FrozenRiver = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var objects = [];
	var rotatingObjects = [];

	function buildIceSurface() {
		var geometry = new THREE.BoxGeometry(200, 1, 160);
		var material = new THREE.MeshStandardMaterial({
			color: 0x88CCFF,
			emissive: 0x4488FF,
			emissiveIntensity: 0.3,
			metalness: 0.8,
			roughness: 0.2
		});
		var surface = new THREE.Mesh(geometry, material);
		surface.position.y = -0.5;
		surface.receiveShadow = true;
		scene.add(surface);
		objects.push(surface);
	}

	function buildPressureRidges() {
		var ridgeCount = 8;
		for (var i = 0; i < ridgeCount; i++) {
			var geometry = new THREE.BoxGeometry(30 + Math.random() * 20, 4, 8);
			var material = new THREE.MeshStandardMaterial({
				color: 0xAADDFF,
				emissive: 0x2266CC,
				emissiveIntensity: 0.2,
				metalness: 0.7,
				roughness: 0.3
			});
			var ridge = new THREE.Mesh(geometry, material);
			ridge.position.set(
				-80 + Math.random() * 160,
				1.5,
				-70 + i * 20 + Math.random() * 10
			);
			ridge.rotation.z = Math.random() * 0.4 - 0.2;
			ridge.castShadow = true;
			ridge.receiveShadow = true;
			scene.add(ridge);
			objects.push(ridge);
		}
	}

	function buildBridge() {
		var bridgeX = -85;
		var bridgeY = 8;
		var bridgeZ = 0;

		var section1Geo = new THREE.BoxGeometry(15, 2, 40);
		var bridgeMat = new THREE.MeshStandardMaterial({
			color: 0x666666,
			metalness: 0.6,
			roughness: 0.5
		});
		var section1 = new THREE.Mesh(section1Geo, bridgeMat);
		section1.position.set(bridgeX, bridgeY, bridgeZ - 20);
		section1.rotation.z = 0.3;
		section1.castShadow = true;
		scene.add(section1);
		objects.push(section1);

		var section2Geo = new THREE.BoxGeometry(15, 2, 40);
		var section2 = new THREE.Mesh(section2Geo, bridgeMat);
		section2.position.set(bridgeX, bridgeY - 3, bridgeZ + 20);
		section2.rotation.z = -0.35;
		section2.castShadow = true;
		scene.add(section2);
		objects.push(section2);

		var cablePoints = [
			new THREE.Vector3(bridgeX - 8, bridgeY + 5, bridgeZ - 20),
			new THREE.Vector3(bridgeX - 8, bridgeY - 5, bridgeZ)
		];
		var cableGeom = new THREE.BufferGeometry().setFromPoints(cablePoints);
		var cableMat = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
		var cable1 = new THREE.LineSegments(cableGeom, cableMat);
		scene.add(cable1);
		objects.push(cable1);

		var cablePoints2 = [
			new THREE.Vector3(bridgeX + 8, bridgeY + 5, bridgeZ - 20),
			new THREE.Vector3(bridgeX + 8, bridgeY - 3, bridgeZ + 20)
		];
		var cableGeom2 = new THREE.BufferGeometry().setFromPoints(cablePoints2);
		var cable2 = new THREE.LineSegments(cableGeom2, cableMat);
		scene.add(cable2);
		objects.push(cable2);
	}

	function buildMilitaryVehicles() {
		var positions = [
			{ x: -40, z: -50 },
			{ x: 20, z: -40 },
			{ x: 60, z: 30 }
		];

		positions.forEach(function(pos) {
			var vehicleGeo = new THREE.BoxGeometry(8, 3, 16);
			var vehicleMat = new THREE.MeshStandardMaterial({
				color: 0x4A4A4A,
				metalness: 0.5,
				roughness: 0.7
			});
			var vehicle = new THREE.Mesh(vehicleGeo, vehicleMat);
			vehicle.position.set(pos.x, 1.5, pos.z);
			vehicle.rotation.y = Math.random() * Math.PI * 2;
			vehicle.castShadow = true;
			vehicle.receiveShadow = true;
			scene.add(vehicle);
			objects.push(vehicle);

			var turretGeo = new THREE.CylinderGeometry(1.5, 1.5, 2, 8);
			var turret = new THREE.Mesh(turretGeo, vehicleMat);
			turret.position.set(pos.x, 3, pos.z);
			turret.castShadow = true;
			scene.add(turret);
			objects.push(turret);
		});
	}

	function buildFishingHuts() {
		var huts = [
			{ x: -90, z: -60 },
			{ x: 85, z: 50 },
			{ x: -70, z: 70 }
		];

		huts.forEach(function(hut) {
			var hutGeo = new THREE.BoxGeometry(6, 5, 6);
			var hutMat = new THREE.MeshStandardMaterial({
				color: 0x8B4513,
				metalness: 0.3,
				roughness: 0.8
			});
			var box = new THREE.Mesh(hutGeo, hutMat);
			box.position.set(hut.x, 2.5, hut.z);
			box.castShadow = true;
			box.receiveShadow = true;
			scene.add(box);
			objects.push(box);

			var roofGeo = new THREE.ConeGeometry(4.5, 3, 4);
			var roofMat = new THREE.MeshStandardMaterial({
				color: 0x333333,
				metalness: 0.4,
				roughness: 0.6
			});
			var roof = new THREE.Mesh(roofGeo, roofMat);
			roof.position.set(hut.x, 6.5, hut.z);
			roof.castShadow = true;
			scene.add(roof);
			objects.push(roof);
		});
	}

	function buildFallenTrees() {
		var trees = [
			{ x: -50, z: -80, angle: 0.4 },
			{ x: 45, z: 75, angle: -0.35 },
			{ x: -30, z: 40, angle: 0.3 },
			{ x: 70, z: -30, angle: -0.4 }
		];

		trees.forEach(function(tree) {
			var trunkGeo = new THREE.CylinderGeometry(0.8, 0.8, 25, 6);
			var trunkMat = new THREE.MeshStandardMaterial({
				color: 0x654321,
				metalness: 0.1,
				roughness: 0.9
			});
			var trunk = new THREE.Mesh(trunkGeo, trunkMat);
			trunk.position.set(tree.x, 0, tree.z);
			trunk.rotation.z = tree.angle;
			trunk.castShadow = true;
			trunk.receiveShadow = true;
			scene.add(trunk);
			objects.push(trunk);

			var foliageGeo = new THREE.ConeGeometry(5, 12, 6);
			var foliageMat = new THREE.MeshStandardMaterial({
				color: 0x1B3D1B,
				metalness: 0.0,
				roughness: 1.0
			});
			var foliage = new THREE.Mesh(foliageGeo, foliageMat);
			foliage.position.set(tree.x + Math.cos(tree.angle) * 10, 5, tree.z);
			foliage.castShadow = true;
			scene.add(foliage);
			objects.push(foliage);
		});
	}

	function buildBunkers() {
		var bunkerGeo = new THREE.BoxGeometry(20, 4, 12);
		var bunkerMat = new THREE.MeshStandardMaterial({
			color: 0x556B2F,
			metalness: 0.2,
			roughness: 0.9
		});

		var leftBunker = new THREE.Mesh(bunkerGeo, bunkerMat);
		leftBunker.position.set(-95, 2, 0);
		leftBunker.castShadow = true;
		leftBunker.receiveShadow = true;
		scene.add(leftBunker);
		objects.push(leftBunker);

		var rightBunker = new THREE.Mesh(bunkerGeo, bunkerMat);
		rightBunker.position.set(95, 2, 0);
		rightBunker.castShadow = true;
		rightBunker.receiveShadow = true;
		scene.add(rightBunker);
		objects.push(rightBunker);
	}

	function init(sceneParam, cameraParam) {
		scene = sceneParam;
		camera = cameraParam;
		objects = [];
		rotatingObjects = [];

		buildIceSurface();
		buildPressureRidges();
		buildBridge();
		buildMilitaryVehicles();
		buildFishingHuts();
		buildFallenTrees();
		buildBunkers();

		var light = new THREE.DirectionalLight(0xFFFFFF, 1.2);
		light.position.set(50, 60, 40);
		light.castShadow = true;
		light.shadow.camera.left = -150;
		light.shadow.camera.right = 150;
		light.shadow.camera.top = 150;
		light.shadow.camera.bottom = -150;
		light.shadow.mapSize.width = 2048;
		light.shadow.mapSize.height = 2048;
		scene.add(light);

		var ambient = new THREE.AmbientLight(0x88CCFF, 0.5);
		scene.add(ambient);
	}

	function update(delta) {
		rotatingObjects.forEach(function(obj) {
			obj.rotation.y += delta * 0.5;
		});
	}

	function reset() {
		objects.forEach(function(obj) {
			scene.remove(obj);
			if (obj.geometry) obj.geometry.dispose();
			if (obj.material) obj.material.dispose();
		});
		objects = [];
		rotatingObjects = [];
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
