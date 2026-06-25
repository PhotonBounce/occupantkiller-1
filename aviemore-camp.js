window.AviemoreCamp = (function() {
	'use strict';

	var scene = null;
	var objects = [];

	function initialize(threeScene) {
		scene = threeScene;
		objects = [];

		var baseX = 640;
		var baseZ = 730;
		var groundY = 0;

		buildMainLodge(baseX, groundY, baseZ);
		buildFunicularBase(baseX + 80, groundY, baseZ + 50);
		buildSkiLiftPylons(baseX - 100, groundY, baseZ + 200);
		buildMountainGunPlatform(baseX - 150, groundY + 40, baseZ + 300);
		buildLochDefense(baseX + 150, groundY, baseZ - 200);
		buildForestBase(baseX - 200, groundY, baseZ);
		buildSnowCatGarage(baseX + 100, groundY, baseZ - 100);
		buildHelicopterPad(baseX, groundY, baseZ + 150);

		return objects;
	}

	function buildMainLodge(x, y, z) {
		var geometry = new THREE.BoxGeometry(10, 6, 5);
		var material = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
		var lodge = new THREE.Mesh(geometry, material);

		lodge.position.set(x, y + 3, z);
		lodge.castShadow = true;
		lodge.receiveShadow = true;

		scene.add(lodge);
		objects.push(lodge);
	}

	function buildFunicularBase(x, y, z) {
		var stationGeom = new THREE.BoxGeometry(12, 4, 8);
		var stationMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
		var station = new THREE.Mesh(stationGeom, stationMat);

		station.position.set(x, y + 2, z);
		station.castShadow = true;
		station.receiveShadow = true;

		scene.add(station);
		objects.push(station);

		var towerGeom = new THREE.CylinderGeometry(0.8, 0.8, 25, 16);
		var towerMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var tower = new THREE.Mesh(towerGeom, towerMat);

		tower.position.set(x, y + 12.5, z);
		tower.castShadow = true;
		tower.receiveShadow = true;

		scene.add(tower);
		objects.push(tower);
	}

	function buildSkiLiftPylons(x, y, z) {
		var positions = [
			{ x: x, z: z },
			{ x: x, z: z + 60 },
			{ x: x, z: z + 120 },
			{ x: x, z: z + 180 }
		];

		for (var i = 0; i < positions.length; i++) {
			var pos = positions[i];
			var height = 15 + (i * 8);

			var geom = new THREE.CylinderGeometry(0.6, 0.6, height, 8);
			var mat = new THREE.MeshLambertMaterial({ color: 0x999999 });
			var pylon = new THREE.Mesh(geom, mat);

			pylon.position.set(pos.x, y + (height / 2), pos.z);
			pylon.castShadow = true;
			pylon.receiveShadow = true;

			scene.add(pylon);
			objects.push(pylon);
		}
	}

	function buildMountainGunPlatform(x, y, z) {
		var platformGeom = new THREE.BoxGeometry(8, 1.5, 6);
		var platformMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
		var platform = new THREE.Mesh(platformGeom, platformMat);

		platform.position.set(x, y, z);
		platform.castShadow = true;
		platform.receiveShadow = true;

		scene.add(platform);
		objects.push(platform);

		var gunGeom = new THREE.CylinderGeometry(0.5, 0.5, 12, 16);
		var gunMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
		var gun = new THREE.Mesh(gunGeom, gunMat);

		gun.position.set(x, y + 7, z);
		gun.rotation.z = Math.PI / 6;
		gun.castShadow = true;
		gun.receiveShadow = true;

		scene.add(gun);
		objects.push(gun);
	}

	function buildLochDefense(x, y, z) {
		var bunkerGeom = new THREE.BoxGeometry(7, 2, 5);
		var bunkerMat = new THREE.MeshLambertMaterial({ color: 0x665544 });
		var bunker = new THREE.Mesh(bunkerGeom, bunkerMat);

		bunker.position.set(x, y + 1, z);
		bunker.castShadow = true;
		bunker.receiveShadow = true;

		scene.add(bunker);
		objects.push(bunker);

		var gunportGeom = new THREE.BoxGeometry(0.8, 0.8, 0.5);
		var gunportMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
		var gunport = new THREE.Mesh(gunportGeom, gunportMat);

		gunport.position.set(x + 3, y + 1.5, z);
		gunport.castShadow = true;
		gunport.receiveShadow = true;

		scene.add(gunport);
		objects.push(gunport);
	}

	function buildForestBase(x, y, z) {
		var fortGeom = new THREE.BoxGeometry(9, 3, 9);
		var fortMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
		var fort = new THREE.Mesh(fortGeom, fortMat);

		fort.position.set(x, y + 1.5, z);
		fort.castShadow = true;
		fort.receiveShadow = true;

		scene.add(fort);
		objects.push(fort);

		var treePositions = [
			{ x: x - 15, z: z - 15 },
			{ x: x + 15, z: z - 15 },
			{ x: x - 15, z: z + 15 },
			{ x: x + 15, z: z + 15 },
			{ x: x - 25, z: z },
			{ x: x + 25, z: z }
		];

		for (var i = 0; i < treePositions.length; i++) {
			var treePos = treePositions[i];
			var treeGeom = new THREE.CylinderGeometry(1.2, 1.2, 20, 12);
			var treeMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
			var tree = new THREE.Mesh(treeGeom, treeMat);

			tree.position.set(treePos.x, y + 10, treePos.z);
			tree.castShadow = true;
			tree.receiveShadow = true;

			scene.add(tree);
			objects.push(tree);
		}
	}

	function buildSnowCatGarage(x, y, z) {
		var hangarGeom = new THREE.BoxGeometry(14, 5, 8);
		var hangarMat = new THREE.MeshLambertMaterial({ color: 0xAA8844 });
		var hangar = new THREE.Mesh(hangarGeom, hangarMat);

		hangar.position.set(x, y + 2.5, z);
		hangar.castShadow = true;
		hangar.receiveShadow = true;

		scene.add(hangar);
		objects.push(hangar);

		var vehiclePositions = [
			{ x: x - 3, z: z },
			{ x: x + 3, z: z }
		];

		for (var i = 0; i < vehiclePositions.length; i++) {
			var vPos = vehiclePositions[i];
			var vehicleGeom = new THREE.BoxGeometry(2.5, 2, 4);
			var vehicleMat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
			var vehicle = new THREE.Mesh(vehicleGeom, vehicleMat);

			vehicle.position.set(vPos.x, y + 1, vPos.z);
			vehicle.castShadow = true;
			vehicle.receiveShadow = true;

			scene.add(vehicle);
			objects.push(vehicle);
		}
	}

	function buildHelicopterPad(x, y, z) {
		var padGeom = new THREE.BoxGeometry(16, 0.8, 16);
		var padMat = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
		var pad = new THREE.Mesh(padGeom, padMat);

		pad.position.set(x, y + 0.4, z);
		pad.castShadow = true;
		pad.receiveShadow = true;

		scene.add(pad);
		objects.push(pad);

		var winchGeom = new THREE.CylinderGeometry(0.7, 0.7, 18, 16);
		var winchMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var winch = new THREE.Mesh(winchGeom, winchMat);

		winch.position.set(x, y + 9, z);
		winch.castShadow = true;
		winch.receiveShadow = true;

		scene.add(winch);
		objects.push(winch);
	}

	function getObjects() {
		return objects;
	}

	return {
		initialize: initialize,
		getObjects: getObjects
	};
}());
