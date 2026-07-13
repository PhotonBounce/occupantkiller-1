window.BeaulyPost = (function() {
	'use strict';

	var world = {
		position: { x: 740, z: 880 },
		structures: []
	};

	function createPrioryRuins() {
		var walls = [];
		var sandstone = 0xD2B48C;

		var wall1 = new THREE.Mesh(
			new THREE.BoxGeometry(20, 12, 2),
			new THREE.MeshLambertMaterial({ color: sandstone })
		);
		wall1.position.set(0, 6, 0);
		walls.push(wall1);

		var wall2 = new THREE.Mesh(
			new THREE.BoxGeometry(2, 12, 16),
			new THREE.MeshLambertMaterial({ color: sandstone })
		);
		wall2.position.set(10, 6, 8);
		walls.push(wall2);

		var wall3 = new THREE.Mesh(
			new THREE.BoxGeometry(18, 10, 2),
			new THREE.MeshLambertMaterial({ color: sandstone })
		);
		wall3.position.set(-2, 5, 16);
		walls.push(wall3);

		return walls;
	}

	function createPrioryArchGateway() {
		var archParts = [];
		var sandstone = 0xD2B48C;

		var pillarLeft = new THREE.Mesh(
			new THREE.BoxGeometry(3, 10, 3),
			new THREE.MeshLambertMaterial({ color: sandstone })
		);
		pillarLeft.position.set(-4, 5, 0);
		archParts.push(pillarLeft);

		var pillarRight = new THREE.Mesh(
			new THREE.BoxGeometry(3, 10, 3),
			new THREE.MeshLambertMaterial({ color: sandstone })
		);
		pillarRight.position.set(4, 5, 0);
		archParts.push(pillarRight);

		var archLintel = new THREE.Mesh(
			new THREE.BoxGeometry(12, 1.5, 3),
			new THREE.MeshLambertMaterial({ color: sandstone })
		);
		archLintel.position.set(0, 10.5, 0);
		archParts.push(archLintel);

		return archParts;
	}

	function createFirthSeaWall() {
		var seaWall = new THREE.Mesh(
			new THREE.BoxGeometry(60, 8, 3),
			new THREE.MeshLambertMaterial({ color: 0x696969 })
		);
		seaWall.position.set(30, 4, -20);
		return [seaWall];
	}

	function createFraserKeep() {
		var keepParts = [];

		var tower = new THREE.Mesh(
			new THREE.CylinderGeometry(4, 4, 12, 16),
			new THREE.MeshLambertMaterial({ color: 0x808080 })
		);
		tower.position.set(-15, 6, 0);
		keepParts.push(tower);

		var roof = new THREE.Mesh(
			new THREE.ConeGeometry(4.5, 6, 16),
			new THREE.MeshLambertMaterial({ color: 0x8B4513 })
		);
		roof.position.set(-15, 15, 0);
		keepParts.push(roof);

		return keepParts;
	}

	function createEstuaryGunBattery() {
		var battery = [];

		for (var i = 0; i < 3; i++) {
			var emplacement = new THREE.Mesh(
				new THREE.BoxGeometry(4, 2, 4),
				new THREE.MeshLambertMaterial({ color: 0x8B7355 })
			);
			emplacement.position.set(i * 8 - 8, 1, 25);
			battery.push(emplacement);

			var gun = new THREE.Mesh(
				new THREE.CylinderGeometry(0.8, 0.8, 5, 12),
				new THREE.MeshLambertMaterial({ color: 0x2F4F4F })
			);
			gun.rotation.z = Math.PI / 6;
			gun.position.set(i * 8 - 8, 2.5, 25);
			battery.push(gun);
		}

		return battery;
	}

	function createMilitaryPontoonBridge() {
		var bridge = [];

		for (var i = 0; i < 8; i++) {
			var pontoon = new THREE.Mesh(
				new THREE.BoxGeometry(5, 1.5, 4),
				new THREE.MeshLambertMaterial({ color: 0x654321 })
			);
			pontoon.position.set(i * 5.5 - 20, -0.5, -40);
			bridge.push(pontoon);
		}

		return bridge;
	}

	function createSupplyDepot() {
		var warehouse = new THREE.Mesh(
			new THREE.BoxGeometry(16, 10, 12),
			new THREE.MeshLambertMaterial({ color: 0x8B7355 })
		);
		warehouse.position.set(0, 5, 8);
		return [warehouse];
	}

	function createWatchFires() {
		var beacons = [];

		for (var i = 0; i < 3; i++) {
			var drum = new THREE.Mesh(
				new THREE.CylinderGeometry(2, 2, 3, 12),
				new THREE.MeshLambertMaterial({ color: 0x444444 })
			);
			drum.position.set(i * 20 - 20, 8, 30);
			beacons.push(drum);

			var flame = new THREE.Mesh(
				new THREE.SphereGeometry(1.5, 8, 8),
				new THREE.MeshLambertMaterial({ color: 0xFF6347 })
			);
			flame.position.set(i * 20 - 20, 10, 30);
			beacons.push(flame);
		}

		return beacons;
	}

	function build() {
		var allStructures = [];

		var prioryRuins = createPrioryRuins();
		allStructures = allStructures.concat(prioryRuins);

		var archGateway = createPrioryArchGateway();
		allStructures = allStructures.concat(archGateway);

		var seaWall = createFirthSeaWall();
		allStructures = allStructures.concat(seaWall);

		var fraserKeep = createFraserKeep();
		allStructures = allStructures.concat(fraserKeep);

		var gunBattery = createEstuaryGunBattery();
		allStructures = allStructures.concat(gunBattery);

		var pontoonBridge = createMilitaryPontoonBridge();
		allStructures = allStructures.concat(pontoonBridge);

		var supplyDepot = createSupplyDepot();
		allStructures = allStructures.concat(supplyDepot);

		var watchFires = createWatchFires();
		allStructures = allStructures.concat(watchFires);

		for (var i = 0; i < allStructures.length; i++) {
			allStructures[i].position.x += world.position.x;
			allStructures[i].position.z += world.position.z;
		}

		world.structures = allStructures;
		return allStructures;
	}

	function getMeshes() {
		return world.structures;
	}

	function getWorldPosition() {
		return world.position;
	}

	return {
		build: build,
		getMeshes: getMeshes,
		getWorldPosition: getWorldPosition
	};

}());
