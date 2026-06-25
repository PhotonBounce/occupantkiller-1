window.ToxicHarbor = (function() {
	'use strict';

	var scene;
	var camera;
	var objects = [];
	var floatingBarrels = [];
	var rotatingCranes = [];
	var buoys = [];

	function buildShipHull() {
		var geometry = new THREE.BoxGeometry(80, 15, 25);
		var material = new THREE.MeshStandardMaterial({
			color: 0x664422,
			metalness: 0.6,
			roughness: 0.8
		});
		var hull = new THREE.Mesh(geometry, material);
		hull.position.set(0, 5, -40);
		hull.rotation.z = 0.15;
		objects.push(hull);
		return hull;
	}

	function buildCranes() {
		var positions = [-30, 30];
		positions.forEach(function(x) {
			var mast = new THREE.CylinderGeometry(1.5, 1.5, 50, 8);
			var mastMaterial = new THREE.MeshStandardMaterial({
				color: 0x333333,
				metalness: 0.7,
				roughness: 0.9
			});
			var mastMesh = new THREE.Mesh(mast, mastMaterial);
			mastMesh.position.set(x, 25, 0);
			objects.push(mastMesh);

			var boom = new THREE.BoxGeometry(35, 2, 2);
			var boomMesh = new THREE.Mesh(boom, mastMaterial);
			boomMesh.position.set(x + 17, 45, 0);
			objects.push(boomMesh);

			var cable1Points = [
				new THREE.Vector3(x, 45, 0),
				new THREE.Vector3(x + 15, 30, 8)
			];
			var cableGeo1 = new THREE.BufferGeometry().setFromPoints(cable1Points);
			var lineMaterial = new THREE.LineBasicMaterial({ color: 0x999999, linewidth: 2 });
			var cable1 = new THREE.LineSegments(cableGeo1, lineMaterial);
			objects.push(cable1);

			var cable2Points = [
				new THREE.Vector3(x, 45, 0),
				new THREE.Vector3(x - 12, 28, -10)
			];
			var cableGeo2 = new THREE.BufferGeometry().setFromPoints(cable2Points);
			var cable2 = new THREE.LineSegments(cableGeo2, lineMaterial);
			objects.push(cable2);

			rotatingCranes.push(boomMesh);
		});
	}

	function buildContainers() {
		var colors = [0xFF4444, 0x44FF44, 0x4444FF, 0xFFFF44, 0xFF44FF];
		var posX = -40;
		for (var i = 0; i < 5; i++) {
			var posZ = -20 + (i * 8);
			for (var j = 0; j < 3; j++) {
				var posY = 5 + (j * 8);
				var containerGeo = new THREE.BoxGeometry(6, 6, 8);
				var containerMat = new THREE.MeshStandardMaterial({
					color: colors[i % colors.length],
					metalness: 0.5,
					roughness: 0.7
				});
				var container = new THREE.Mesh(containerGeo, containerMat);
				container.position.set(posX + (i * 8), posY, posZ);
				objects.push(container);
			}
		}
	}

	function buildPierSupports() {
		for (var i = 0; i < 6; i++) {
			var pillingGeo = new THREE.CylinderGeometry(2, 2.5, 30, 12);
			var pillingMat = new THREE.MeshStandardMaterial({
				color: 0x444444,
				metalness: 0.4,
				roughness: 0.8
			});
			var pilling = new THREE.Mesh(pillingGeo, pillingMat);
			pilling.position.set(-50 + (i * 20), -10, 20);
			objects.push(pilling);
		}
	}

	function buildWaterSurface() {
		var waterGeo = new THREE.BoxGeometry(200, 2, 150);
		var waterMat = new THREE.MeshStandardMaterial({
			color: 0x1a1a2e,
			metalness: 0.3,
			roughness: 0.4,
			emissive: 0x0d0d1a
		});
		var water = new THREE.Mesh(waterGeo, waterMat);
		water.position.set(0, -2, 20);
		objects.push(water);
	}

	function buildChemicalBarrels() {
		for (var i = 0; i < 8; i++) {
			var barrelGeo = new THREE.CylinderGeometry(1.2, 1.2, 3, 16);
			var barrelMat = new THREE.MeshStandardMaterial({
				color: 0xFFAA00,
				metalness: 0.6,
				roughness: 0.6,
				emissive: 0x441100
			});
			var barrel = new THREE.Mesh(barrelGeo, barrelMat);
			barrel.position.set(
				-20 + Math.random() * 40,
				0.5,
				-50 + Math.random() * 60
			);
			barrel.rotation.z = Math.random() * Math.PI;
			objects.push(barrel);
			floatingBarrels.push(barrel);
		}
	}

	function buildBuoys() {
		for (var i = 0; i < 5; i++) {
			var buoyX = -50 + (i * 25);
			var buoyZ = 40 + Math.random() * 20;

			var sphere = new THREE.SphereGeometry(1.5, 16, 16);
			var sphereMat = new THREE.MeshStandardMaterial({
				color: 0xFF0000,
				metalness: 0.7,
				roughness: 0.5
			});
			var buoyMesh = new THREE.Mesh(sphere, sphereMat);
			buoyMesh.position.set(buoyX, 2, buoyZ);
			objects.push(buoyMesh);

			var antenna = new THREE.ConeGeometry(0.3, 3, 8);
			var antennaMat = new THREE.MeshStandardMaterial({
				color: 0xFFFFFF,
				metalness: 0.8,
				roughness: 0.3
			});
			var antennaMesh = new THREE.Mesh(antenna, antennaMat);
			antennaMesh.position.set(buoyX, 4.5, buoyZ);
			objects.push(antennaMesh);

			buoys.push({ mesh: buoyMesh, antenna: antennaMesh, baseX: buoyX, baseZ: buoyZ });
		}
	}

	function buildHazmatVehicles() {
		for (var v = 0; v < 2; v++) {
			var vehicleX = 30 + (v * 12);
			var vehicleZ = 15;

			var cabinGeo = new THREE.BoxGeometry(3, 3, 5);
			var cabinMat = new THREE.MeshStandardMaterial({
				color: 0xFFFF00,
				metalness: 0.5,
				roughness: 0.6
			});
			var cabin = new THREE.Mesh(cabinGeo, cabinMat);
			cabin.position.set(vehicleX, 2, vehicleZ);
			objects.push(cabin);

			var bedGeo = new THREE.BoxGeometry(3, 1.5, 8);
			var bedMat = new THREE.MeshStandardMaterial({
				color: 0xCC0000,
				metalness: 0.4,
				roughness: 0.7
			});
			var bed = new THREE.Mesh(bedGeo, bedMat);
			bed.position.set(vehicleX, 1, vehicleZ + 5);
			objects.push(bed);

			for (var w = 0; w < 4; w++) {
				var wheelX = vehicleX - 1 + (w > 1 ? 2 : 0);
				var wheelZ = vehicleZ - 3 + (w % 2 === 0 ? -2 : 4);
				var wheelGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.6, 16);
				var wheelMat = new THREE.MeshStandardMaterial({
					color: 0x111111,
					metalness: 0.6,
					roughness: 0.8
				});
				var wheel = new THREE.Mesh(wheelGeo, wheelMat);
				wheel.rotation.z = Math.PI / 2;
				wheel.position.set(wheelX, 0.8, wheelZ);
				objects.push(wheel);
			}
		}
	}

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		floatingBarrels = [];
		rotatingCranes = [];
		buoys = [];

		buildWaterSurface();
		buildShipHull();
		buildCranes();
		buildContainers();
		buildPierSupports();
		buildChemicalBarrels();
		buildBuoys();
		buildHazmatVehicles();

		objects.forEach(function(obj) {
			scene.add(obj);
		});
	}

	function update(delta) {
		floatingBarrels.forEach(function(barrel) {
			barrel.position.y = 0.5 + Math.sin(Date.now() * 0.0005 + barrel.position.x) * 0.3;
			barrel.rotation.x += delta * 0.3;
			barrel.rotation.z += delta * 0.2;
		});

		rotatingCranes.forEach(function(crane) {
			crane.rotation.z += delta * 0.2;
		});

		buoys.forEach(function(buoy, idx) {
			var wave = Math.sin(Date.now() * 0.0008 + idx) * 0.4;
			buoy.mesh.position.y = 2 + wave;
			buoy.antenna.position.y = 4.5 + wave;
			buoy.mesh.rotation.z += delta * 0.1;
		});
	}

	function reset() {
		objects.forEach(function(obj) {
			scene.remove(obj);
		});
		floatingBarrels = [];
		rotatingCranes = [];
		buoys = [];
		objects = [];
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
