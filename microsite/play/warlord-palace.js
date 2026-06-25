window.WarlordPalace = (function() {
	'use strict';

	var scene;
	var objects = [];
	var rotatingObjects = [];

	function buildPalace() {
		var geo = new THREE.BoxGeometry(40, 30, 50);
		var mat = new THREE.MeshStandardMaterial({ color: 0xCC8844, roughness: 0.6 });
		var palace = new THREE.Mesh(geo, mat);
		palace.position.y = 15;
		palace.position.z = 0;
		scene.add(palace);
		objects.push(palace);

		var colGeo = new THREE.BoxGeometry(3, 25, 3);
		var colMat = new THREE.MeshStandardMaterial({ color: 0xAA6622, roughness: 0.7 });
		var cols = [
			{ x: -15, z: -20 },
			{ x: 15, z: -20 },
			{ x: -15, z: 20 },
			{ x: 15, z: 20 }
		];
		var i;
		for (i = 0; i < cols.length; i++) {
			var col = new THREE.Mesh(colGeo, colMat);
			col.position.set(cols[i].x, 12.5, cols[i].z);
			scene.add(col);
			objects.push(col);
		}

		var roofGeo = new THREE.ConeGeometry(25, 12, 8);
		var roofMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.8, roughness: 0.2 });
		var roof = new THREE.Mesh(roofGeo, roofMat);
		roof.position.set(0, 42, 0);
		scene.add(roof);
		objects.push(roof);
	}

	function buildPerimeterWall() {
		var wallGeo = new THREE.BoxGeometry(120, 8, 3);
		var wallMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });

		var northWall = new THREE.Mesh(wallGeo, wallMat);
		northWall.position.set(0, 4, -55);
		scene.add(northWall);
		objects.push(northWall);

		var southWall = new THREE.Mesh(wallGeo, wallMat);
		southWall.position.set(0, 4, 55);
		scene.add(southWall);
		objects.push(southWall);

		var eastWallGeo = new THREE.BoxGeometry(3, 8, 110);
		var eastWall = new THREE.Mesh(eastWallGeo, wallMat);
		eastWall.position.set(55, 4, 0);
		scene.add(eastWall);
		objects.push(eastWall);

		var westWall = new THREE.Mesh(eastWallGeo, wallMat);
		westWall.position.set(-55, 4, 0);
		scene.add(westWall);
		objects.push(westWall);

		var j;
		for (j = -45; j <= 45; j += 20) {
			var towerGeo = new THREE.CylinderGeometry(4, 5, 12, 8);
			var towerMat = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.7 });

			var nTower = new THREE.Mesh(towerGeo, towerMat);
			nTower.position.set(j, 6, -55);
			scene.add(nTower);
			objects.push(nTower);

			var sTower = new THREE.Mesh(towerGeo, towerMat);
			sTower.position.set(j, 6, 55);
			scene.add(sTower);
			objects.push(sTower);
		}

		for (j = -45; j <= 45; j += 20) {
			var eTower = new THREE.Mesh(towerGeo, towerMat);
			eTower.position.set(55, 6, j);
			scene.add(eTower);
			objects.push(eTower);

			var wTower = new THREE.Mesh(towerGeo, towerMat);
			wTower.position.set(-55, 6, j);
			scene.add(wTower);
			objects.push(wTower);
		}
	}

	function buildSwimmingPool() {
		var poolGeo = new THREE.BoxGeometry(30, 2, 40);
		var waterMat = new THREE.MeshStandardMaterial({
			color: 0x0099FF,
			emissive: 0x0055AA,
			metalness: 0.3,
			roughness: 0.4
		});
		var pool = new THREE.Mesh(poolGeo, waterMat);
		pool.position.set(-40, 0.5, 0);
		scene.add(pool);
		objects.push(pool);
	}

	function buildGoldVault() {
		var vaultGeo = new THREE.BoxGeometry(25, 20, 25);
		var vaultMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });
		var vault = new THREE.Mesh(vaultGeo, vaultMat);
		vault.position.set(35, 10, -35);
		scene.add(vault);
		objects.push(vault);

		var k;
		for (k = 0; k < 6; k++) {
			var treasureGeo = new THREE.SphereGeometry(3, 8, 8);
			var treasureMat = new THREE.MeshStandardMaterial({
				color: 0xFFD700,
				emissive: 0xFFAA00,
				metalness: 0.9,
				roughness: 0.1
			});
			var treasure = new THREE.Mesh(treasureGeo, treasureMat);
			var offsetX = (k % 3) * 6 - 6;
			var offsetZ = Math.floor(k / 3) * 8 - 4;
			treasure.position.set(35 + offsetX, 8 + Math.random() * 3, -35 + offsetZ);
			scene.add(treasure);
			objects.push(treasure);
			rotatingObjects.push(treasure);
		}
	}

	function buildThroneDome() {
		var drumGeo = new THREE.CylinderGeometry(10, 10, 8, 12);
		var drumMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.7 });
		var drum = new THREE.Mesh(drumGeo, drumMat);
		drum.position.set(0, 4, 30);
		scene.add(drum);
		objects.push(drum);

		var domeGeo = new THREE.SphereGeometry(12, 16, 12);
		var domeMat = new THREE.MeshStandardMaterial({
			color: 0xFFD700,
			emissive: 0xFFAA00,
			metalness: 0.85,
			roughness: 0.15
		});
		var dome = new THREE.Mesh(domeGeo, domeMat);
		dome.position.set(0, 13, 30);
		scene.add(dome);
		objects.push(dome);
		rotatingObjects.push(dome);
	}

	function buildTrophyGarden() {
		var m;
		for (m = 0; m < 5; m++) {
			var pedGeo = new THREE.CylinderGeometry(3, 3.5, 8, 8);
			var pedMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.6 });
			var pedestal = new THREE.Mesh(pedGeo, pedMat);
			var angle = (m / 5) * Math.PI * 2;
			var radius = 30;
			pedestal.position.set(Math.cos(angle) * radius, 4, Math.sin(angle) * radius - 50);
			scene.add(pedestal);
			objects.push(pedestal);

			var orbGeo = new THREE.SphereGeometry(2, 8, 8);
			var orbMat = new THREE.MeshStandardMaterial({
				color: 0xFF6B6B,
				emissive: 0xFF3333,
				metalness: 0.7,
				roughness: 0.3
			});
			var orb = new THREE.Mesh(orbGeo, orbMat);
			orb.position.set(Math.cos(angle) * radius, 10, Math.sin(angle) * radius - 50);
			scene.add(orb);
			objects.push(orb);
			rotatingObjects.push(orb);
		}
	}

	function buildVehicleCollection() {
		var carGeo = new THREE.BoxGeometry(8, 4, 16);
		var carMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.2 });

		var positions = [
			{ x: 30, z: -40 },
			{ x: 30, z: -20 },
			{ x: 30, z: 0 },
			{ x: 30, z: 20 }
		];

		var n;
		for (n = 0; n < positions.length; n++) {
			var car = new THREE.Mesh(carGeo, carMat);
			car.position.set(positions[n].x, 2, positions[n].z);
			scene.add(car);
			objects.push(car);
		}
	}

	function buildHelicopterPad() {
		var padGeo = new THREE.BoxGeometry(35, 1, 35);
		var padMat = new THREE.MeshStandardMaterial({ color: 0xEEEEEE, roughness: 0.8 });
		var pad = new THREE.Mesh(padGeo, padMat);
		pad.position.set(-40, 0.1, -40);
		scene.add(pad);
		objects.push(pad);

		var markGeo = new THREE.CylinderGeometry(15, 15, 0.1, 32);
		var markMat = new THREE.MeshStandardMaterial({ color: 0xFF0000, emissive: 0x880000 });
		var mark = new THREE.Mesh(markGeo, markMat);
		mark.position.set(-40, 0.15, -40);
		scene.add(mark);
		objects.push(mark);
	}

	function buildGuardPositions() {
		var guardGeo = new THREE.BoxGeometry(4, 6, 4);
		var guardMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7 });

		var guardPoses = [
			{ x: -50, z: 30 },
			{ x: 50, z: -30 },
			{ x: 0, z: -50 },
			{ x: 20, z: 40 }
		];

		var p;
		for (p = 0; p < guardPoses.length; p++) {
			var guard = new THREE.Mesh(guardGeo, guardMat);
			guard.position.set(guardPoses[p].x, 3, guardPoses[p].z);
			scene.add(guard);
			objects.push(guard);
		}
	}

	function init(sceneParam, camera) {
		scene = sceneParam;
		objects = [];
		rotatingObjects = [];

		buildPalace();
		buildPerimeterWall();
		buildSwimmingPool();
		buildGoldVault();
		buildThroneDome();
		buildTrophyGarden();
		buildVehicleCollection();
		buildHelicopterPad();
		buildGuardPositions();

		var skyGeo = new THREE.SphereGeometry(500, 32, 32);
		var skyMat = new THREE.MeshStandardMaterial({
			color: 0x87CEEB,
			emissive: 0x4A90E2,
			side: THREE.BackSide,
			roughness: 0.9
		});
		var sky = new THREE.Mesh(skyGeo, skyMat);
		scene.add(sky);

		var lightMain = new THREE.DirectionalLight(0xFFFFFF, 1.2);
		lightMain.position.set(50, 50, 50);
		scene.add(lightMain);

		var lightAmb = new THREE.AmbientLight(0xFFFFFF, 0.6);
		scene.add(lightAmb);
	}

	function update(delta) {
		var i;
		for (i = 0; i < rotatingObjects.length; i++) {
			rotatingObjects[i].rotation.y += delta * 0.5;
		}
	}

	function reset() {
		objects = [];
		rotatingObjects = [];
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
