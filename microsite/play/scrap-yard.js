window.ScrapYard = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var meshes = [];
	var craneAngle = 0;
	var magnet = null;

	function buildCrushedVehicleStacks() {
		var colors = [0x444444, 0x555555, 0x333333, 0x666666];
		var positions = [
			[-40, 0, -30], [40, 0, -30], [-50, 0, 20], [50, 0, 20],
			[-30, 0, 50], [30, 0, 50]
		];

		positions.forEach(function(pos, idx) {
			var height = 3 + Math.floor(Math.random() * 4);
			var color = colors[idx % colors.length];

			for (var i = 0; i < height; i++) {
				var geom = new THREE.BoxGeometry(12, 8, 12);
				var mat = new THREE.MeshStandardMaterial({color: color});
				var cube = new THREE.Mesh(geom, mat);
				cube.position.set(pos[0], pos[1] + i * 8, pos[2]);
				cube.castShadow = true;
				cube.receiveShadow = true;
				scene.add(cube);
				meshes.push(cube);
			}
		});
	}

	function buildMagneticCrane() {
		var beamGeom = new THREE.BoxGeometry(60, 2, 2);
		var beamMat = new THREE.MeshStandardMaterial({color: 0xddaa00});
		var beam = new THREE.Mesh(beamGeom, beamMat);
		beam.position.set(0, 35, 0);
		beam.castShadow = true;
		scene.add(beam);
		meshes.push(beam);

		var sphereGeom = new THREE.SphereGeometry(3, 16, 16);
		var magnetMat = new THREE.MeshStandardMaterial({color: 0xff6600});
		magnet = new THREE.Mesh(sphereGeom, magnetMat);
		magnet.position.set(0, 28, 0);
		magnet.castShadow = true;
		scene.add(magnet);
		meshes.push(magnet);

		var cableGeom = new THREE.BufferGeometry();
		var positions = new Float32Array([0, 35, 0, 0, 28, 0]);
		cableGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		var lineMat = new THREE.LineBasicMaterial({color: 0xcccccc, linewidth: 2});
		var cable = new THREE.LineSegments(cableGeom, lineMat);
		scene.add(cable);
		meshes.push(cable);
	}

	function buildCarCrusher() {
		var jawGeom = new THREE.BoxGeometry(25, 20, 8);
		var jawMat = new THREE.MeshStandardMaterial({color: 0x333333, metalness: 0.8});

		var jawTop = new THREE.Mesh(jawGeom, jawMat);
		jawTop.position.set(25, 20, -40);
		jawTop.castShadow = true;
		scene.add(jawTop);
		meshes.push(jawTop);

		var jawBottom = new THREE.Mesh(jawGeom, jawMat);
		jawBottom.position.set(25, 4, -40);
		jawBottom.castShadow = true;
		scene.add(jawBottom);
		meshes.push(jawBottom);
	}

	function buildTankHulls() {
		var positions = [[-45, 0, 0], [45, 0, 0], [0, 0, -60]];

		positions.forEach(function(pos) {
			var bodyGeom = new THREE.BoxGeometry(18, 10, 35);
			var bodyMat = new THREE.MeshStandardMaterial({color: 0x2a2a2a});
			var body = new THREE.Mesh(bodyGeom, bodyMat);
			body.position.set(pos[0], pos[1], pos[2]);
			body.castShadow = true;
			scene.add(body);
			meshes.push(body);

			var turretGeom = new THREE.CylinderGeometry(5, 5, 8, 16);
			var turretMat = new THREE.MeshStandardMaterial({color: 0x1a1a1a});
			var turret = new THREE.Mesh(turretGeom, turretMat);
			turret.position.set(pos[0], pos[1] + 8, pos[2]);
			turret.castShadow = true;
			scene.add(turret);
			meshes.push(turret);
		});
	}

	function buildOilDrumStacks() {
		var stackPositions = [[-60, 0, 40], [60, 0, 40], [-60, 0, -50], [60, 0, -50]];

		stackPositions.forEach(function(pos) {
			var drumCount = 4;
			for (var i = 0; i < drumCount; i++) {
				var drumGeom = new THREE.CylinderGeometry(3, 3, 6, 12);
				var drumMat = new THREE.MeshStandardMaterial({color: 0xff9900});
				var drum = new THREE.Mesh(drumGeom, drumMat);
				drum.position.set(pos[0], pos[1] + i * 6, pos[2]);
				drum.castShadow = true;
				scene.add(drum);
				meshes.push(drum);
			}
		});
	}

	function buildShippingContainers() {
		var containerPositions = [
			[-70, 0, 20], [70, 0, 20], [-70, 0, -40], [70, 0, -40],
			[0, 0, 70]
		];

		containerPositions.forEach(function(pos) {
			var containerGeom = new THREE.BoxGeometry(20, 18, 40);
			var containerMat = new THREE.MeshStandardMaterial({color: 0x662222});
			var container = new THREE.Mesh(containerGeom, containerMat);
			container.position.set(pos[0], pos[1] + 9, pos[2]);
			container.castShadow = true;
			container.receiveShadow = true;
			scene.add(container);
			meshes.push(container);
		});
	}

	function buildCompressedGasCylinders() {
		var positions = [[35, 0, 70], [-35, 0, 70], [0, 0, -75]];

		positions.forEach(function(pos) {
			for (var i = 0; i < 3; i++) {
				var cylGeom = new THREE.CylinderGeometry(2, 2, 18, 12);
				var cylMat = new THREE.MeshStandardMaterial({color: 0xeeee00});
				var cyl = new THREE.Mesh(cylGeom, cylMat);
				cyl.position.set(pos[0] + i * 5, pos[1] + 9, pos[2]);
				cyl.castShadow = true;
				scene.add(cyl);
				meshes.push(cyl);
			}
		});
	}

	function buildGuardShack() {
		var wallGeom = new THREE.BoxGeometry(15, 12, 15);
		var wallMat = new THREE.MeshStandardMaterial({color: 0x444400});
		var wall = new THREE.Mesh(wallGeom, wallMat);
		wall.position.set(75, 6, -75);
		wall.castShadow = true;
		scene.add(wall);
		meshes.push(wall);

		var roofGeom = new THREE.ConeGeometry(12, 6, 4);
		var roofMat = new THREE.MeshStandardMaterial({color: 0x880000});
		var roof = new THREE.Mesh(roofGeom, roofMat);
		roof.position.set(75, 18, -75);
		roof.castShadow = true;
		scene.add(roof);
		meshes.push(roof);
	}

	function buildFirePits() {
		var positions = [[-80, 0, 0], [80, 0, 0], [0, 0, 80]];

		positions.forEach(function(pos) {
			var pitGeom = new THREE.CylinderGeometry(4, 4, 1, 16);
			var pitMat = new THREE.MeshStandardMaterial({
				color: 0xff4400,
				emissive: 0xff2200,
				emissiveIntensity: 0.6
			});
			var pit = new THREE.Mesh(pitGeom, pitMat);
			pit.position.set(pos[0], pos[1] + 0.5, pos[2]);
			pit.receiveShadow = true;
			scene.add(pit);
			meshes.push(pit);

			var pointLight = new THREE.PointLight(0xff6600, 150, 40);
			pointLight.position.set(pos[0], pos[1] + 3, pos[2]);
			pointLight.castShadow = true;
			scene.add(pointLight);
		});
	}

	function buildBoundary() {
		var fenceGeom = new THREE.BoxGeometry(2, 8, 200);
		var fenceMat = new THREE.MeshStandardMaterial({color: 0x555555});

		var fence1 = new THREE.Mesh(fenceGeom, fenceMat);
		fence1.position.set(-90, 4, 0);
		fence1.castShadow = true;
		scene.add(fence1);
		meshes.push(fence1);

		var fence2 = new THREE.Mesh(fenceGeom, fenceMat);
		fence2.position.set(90, 4, 0);
		fence2.castShadow = true;
		scene.add(fence2);
		meshes.push(fence2);

		var fence3Geom = new THREE.BoxGeometry(180, 8, 2);
		var fence3 = new THREE.Mesh(fence3Geom, fenceMat);
		fence3.position.set(0, 4, -90);
		fence3.castShadow = true;
		scene.add(fence3);
		meshes.push(fence3);

		var fence4 = new THREE.Mesh(fence3Geom, fenceMat);
		fence4.position.set(0, 4, 90);
		fence4.castShadow = true;
		scene.add(fence4);
		meshes.push(fence4);
	}

	function init(inScene, inCamera) {
		scene = inScene;
		camera = inCamera;
		meshes = [];

		buildCrushedVehicleStacks();
		buildMagneticCrane();
		buildCarCrusher();
		buildTankHulls();
		buildOilDrumStacks();
		buildShippingContainers();
		buildCompressedGasCylinders();
		buildGuardShack();
		buildFirePits();
		buildBoundary();
	}

	function update(delta) {
		if (magnet) {
			craneAngle += delta * 0.3;
			magnet.position.x = Math.sin(craneAngle) * 25;
			magnet.position.z = Math.cos(craneAngle) * 25;
		}

		meshes.forEach(function(mesh) {
			if (mesh.material && mesh.material.emissive) {
				mesh.material.emissiveIntensity = 0.6 + Math.sin(Date.now() * 0.002) * 0.2;
			}
		});
	}

	function reset() {
		meshes.forEach(function(mesh) {
			scene.remove(mesh);
		});
		meshes = [];
		craneAngle = 0;
		magnet = null;
		init(scene, camera);
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
