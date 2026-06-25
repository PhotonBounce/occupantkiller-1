var ScourieFort = (function() {
	'use strict';

	var structures = [];
	var worldX = 1080;
	var worldZ = 1390;

	function gneisswall() {
		var geometry = new THREE.BoxGeometry(16, 5, 1);
		var material = new THREE.MeshLambertMaterial({ color: 0x9988AA });
		var mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(worldX, 2.5, worldZ);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		structures.push(mesh);
		return mesh;
	}

	function tower() {
		var geometry = new THREE.CylinderGeometry(1.2, 1.4, 14, 16);
		var material = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
		var mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(worldX + 20, 7, worldZ + 15);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		structures.push(mesh);
		return mesh;
	}

	function blind() {
		var geometry = new THREE.BoxGeometry(4, 3, 4);
		var material = new THREE.MeshLambertMaterial({ color: 0x7A8F6B });
		var mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(worldX - 25, 1.5, worldZ + 20);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		structures.push(mesh);
		return mesh;
	}

	function harbour() {
		var pier = new THREE.BoxGeometry(8, 0.5, 3);
		var pierMat = new THREE.MeshLambertMaterial({ color: 0x6B5344 });
		var pierMesh = new THREE.Mesh(pier, pierMat);
		pierMesh.position.set(worldX - 35, 0.25, worldZ - 25);
		pierMesh.castShadow = true;
		pierMesh.receiveShadow = true;
		structures.push(pierMesh);

		var boat1 = new THREE.BoxGeometry(3, 1.5, 1.5);
		var boatMat = new THREE.MeshLambertMaterial({ color: 0xC0522D });
		var boatMesh1 = new THREE.Mesh(boat1, boatMat);
		boatMesh1.position.set(worldX - 35, 1, worldZ - 27);
		boatMesh1.castShadow = true;
		boatMesh1.receiveShadow = true;
		structures.push(boatMesh1);

		var boat2 = new THREE.BoxGeometry(3, 1.5, 1.5);
		var boatMesh2 = new THREE.Mesh(boat2, boatMat);
		boatMesh2.position.set(worldX - 35, 1, worldZ - 23);
		boatMesh2.castShadow = true;
		boatMesh2.receiveShadow = true;
		structures.push(boatMesh2);

		return [pierMesh, boatMesh1, boatMesh2];
	}

	function fort() {
		var mound = new THREE.BoxGeometry(12, 2, 12);
		var moundMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
		var moundMesh = new THREE.Mesh(mound, moundMat);
		moundMesh.position.set(worldX + 40, 1, worldZ - 30);
		moundMesh.castShadow = true;
		moundMesh.receiveShadow = true;
		structures.push(moundMesh);

		var innerWall = new THREE.BoxGeometry(8, 2, 0.8);
		var wallMat = new THREE.MeshLambertMaterial({ color: 0x9988AA });
		var wallMesh = new THREE.Mesh(innerWall, wallMat);
		wallMesh.position.set(worldX + 40, 1.5, worldZ - 30);
		wallMesh.castShadow = true;
		wallMesh.receiveShadow = true;
		structures.push(wallMesh);

		return [moundMesh, wallMesh];
	}

	function riflerange() {
		var targets = [];
		var i;
		for (i = 0; i < 4; i = i + 1) {
			var frame = new THREE.BoxGeometry(2, 2, 0.3);
			var frameMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
			var frameMesh = new THREE.Mesh(frame, frameMat);
			frameMesh.position.set(worldX - 50, 3, worldZ - 50 + (i * 15));
			frameMesh.castShadow = true;
			frameMesh.receiveShadow = true;
			structures.push(frameMesh);
			targets.push(frameMesh);
		}
		return targets;
	}

	function helipad() {
		var pad = new THREE.BoxGeometry(10, 0.3, 10);
		var padMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
		var padMesh = new THREE.Mesh(pad, padMat);
		padMesh.position.set(worldX + 50, 15, worldZ + 40);
		padMesh.castShadow = true;
		padMesh.receiveShadow = true;
		structures.push(padMesh);

		var marker1 = new THREE.ConeGeometry(0.5, 2, 8);
		var markerMat = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
		var markerMesh1 = new THREE.Mesh(marker1, markerMat);
		markerMesh1.position.set(worldX + 45, 16.5, worldZ + 35);
		markerMesh1.castShadow = true;
		markerMesh1.receiveShadow = true;
		structures.push(markerMesh1);

		var marker2 = new THREE.ConeGeometry(0.5, 2, 8);
		var markerMesh2 = new THREE.Mesh(marker2, markerMat);
		markerMesh2.position.set(worldX + 55, 16.5, worldZ + 45);
		markerMesh2.castShadow = true;
		markerMesh2.receiveShadow = true;
		structures.push(markerMesh2);

		return [padMesh, markerMesh1, markerMesh2];
	}

	function foghorn() {
		var horn = new THREE.CylinderGeometry(1.8, 1.2, 3, 12);
		var hornMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
		var hornMesh = new THREE.Mesh(horn, hornMat);
		hornMesh.position.set(worldX + 60, 8, worldZ - 45);
		hornMesh.castShadow = true;
		hornMesh.receiveShadow = true;
		structures.push(hornMesh);

		var building = new THREE.BoxGeometry(5, 4, 5);
		var buildMat = new THREE.MeshLambertMaterial({ color: 0xEEEEEE });
		var buildMesh = new THREE.Mesh(building, buildMat);
		buildMesh.position.set(worldX + 60, 2, worldZ - 45);
		buildMesh.castShadow = true;
		buildMesh.receiveShadow = true;
		structures.push(buildMesh);

		return [hornMesh, buildMesh];
	}

	function build() {
		gneisswall();
		tower();
		blind();
		harbour();
		fort();
		riflerange();
		helipad();
		foghorn();
		return structures;
	}

	function get() {
		return structures;
	}

	function clear() {
		structures.length = 0;
	}

	return {
		build: build,
		get: get,
		clear: clear
	};
}());
