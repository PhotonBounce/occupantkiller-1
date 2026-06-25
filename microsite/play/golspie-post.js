var GolspiePost = (function() {
	'use strict';

	var config = {
		worldX: 880,
		worldZ: 1090,
		stoneColor: 0xE8DCC8,
		darkStoneColor: 0xB8956B,
		gunColor: 0x3D3D3D,
		grassColor: 0x2D5016
	};

	function buildDunrobinMain() {
		var geometry = new THREE.BoxGeometry(10, 8, 8);
		var material = new THREE.MeshLambertMaterial({ color: config.stoneColor });
		var mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(config.worldX, 4, config.worldZ);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		return mesh;
	}

	function buildTurretSpire(x, z) {
		var group = new THREE.Group();
		var cylinderGeo = new THREE.CylinderGeometry(0.8, 0.8, 6, 8);
		var coneMat = new THREE.MeshLambertMaterial({ color: config.stoneColor });
		var cylinder = new THREE.Mesh(cylinderGeo, coneMat);
		cylinder.position.set(0, 3, 0);
		cylinder.castShadow = true;
		cylinder.receiveShadow = true;
		group.add(cylinder);
		var coneGeo = new THREE.ConeGeometry(0.8, 2, 8);
		var cone = new THREE.Mesh(coneGeo, coneMat);
		cone.position.set(0, 7, 0);
		cone.castShadow = true;
		cone.receiveShadow = true;
		group.add(cone);
		group.position.set(x, 0, z);
		return group;
	}

	function buildRoundTurrets() {
		var group = new THREE.Group();
		var positions = [
			[config.worldX - 6, config.worldZ - 5],
			[config.worldX + 6, config.worldZ - 5],
			[config.worldX - 6, config.worldZ + 5],
			[config.worldX + 6, config.worldZ + 5]
		];
		for (var i = 0; i < positions.length; i++) {
			var turret = buildTurretSpire(positions[i][0], positions[i][1]);
			group.add(turret);
		}
		return group;
	}

	function buildGardenWalls() {
		var group = new THREE.Group();
		var wallMaterial = new THREE.MeshLambertMaterial({ color: config.darkStoneColor });
		var wallGeometry = new THREE.BoxGeometry(12, 1.2, 0.4);
		var northWall = new THREE.Mesh(wallGeometry, wallMaterial);
		northWall.position.set(config.worldX, 0.6, config.worldZ - 6.5);
		northWall.castShadow = true;
		northWall.receiveShadow = true;
		group.add(northWall);
		var southWall = new THREE.Mesh(wallGeometry, wallMaterial);
		southWall.position.set(config.worldX, 0.6, config.worldZ + 6.5);
		southWall.castShadow = true;
		southWall.receiveShadow = true;
		group.add(southWall);
		var eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, 13), wallMaterial);
		eastWall.position.set(config.worldX + 6.5, 0.6, config.worldZ);
		eastWall.castShadow = true;
		eastWall.receiveShadow = true;
		group.add(eastWall);
		return group;
	}

	function buildBenBhraggieStatue() {
		var group = new THREE.Group();
		var plinthGeo = new THREE.BoxGeometry(2, 8, 2);
		var plinthMat = new THREE.MeshLambertMaterial({ color: config.darkStoneColor });
		var plinth = new THREE.Mesh(plinthGeo, plinthMat);
		plinth.position.set(config.worldX - 15, 4, config.worldZ + 12);
		plinth.castShadow = true;
		plinth.receiveShadow = true;
		group.add(plinth);
		var figureGeo = new THREE.SphereGeometry(0.5, 8, 8);
		var figureMat = new THREE.MeshLambertMaterial({ color: 0x8B8680 });
		var figure = new THREE.Mesh(figureGeo, figureMat);
		figure.position.set(config.worldX - 15, 8.5, config.worldZ + 12);
		figure.castShadow = true;
		figure.receiveShadow = true;
		group.add(figure);
		return group;
	}

	function buildRailwayDefence() {
		var group = new THREE.Group();
		var bridgeGeo = new THREE.BoxGeometry(2, 0.8, 3);
		var bridgeMat = new THREE.MeshLambertMaterial({ color: 0x6B4423 });
		var baseZ = config.worldZ - 20;
		for (var i = 0; i < 6; i++) {
			var bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
			bridge.position.set(config.worldX + (i - 2.5) * 2.5, 1, baseZ + i * 3);
			bridge.castShadow = true;
			bridge.receiveShadow = true;
			group.add(bridge);
		}
		return group;
	}

	function buildGatehouse() {
		var group = new THREE.Group();
		var gateGeo = new THREE.BoxGeometry(4, 4, 3);
		var gateMat = new THREE.MeshLambertMaterial({ color: config.stoneColor });
		var gate = new THREE.Mesh(gateGeo, gateMat);
		gate.position.set(config.worldX + 12, 2, config.worldZ - 10);
		gate.castShadow = true;
		gate.receiveShadow = true;
		group.add(gate);
		var towerGeo = new THREE.CylinderGeometry(1.2, 1.2, 5, 8);
		var tower = new THREE.Mesh(towerGeo, gateMat);
		tower.position.set(config.worldX + 14, 2.5, config.worldZ - 10);
		tower.castShadow = true;
		tower.receiveShadow = true;
		group.add(tower);
		return group;
	}

	function buildCroftRuins() {
		var group = new THREE.Group();
		var croftMat = new THREE.MeshLambertMaterial({ color: config.darkStoneColor });
		var baseX = config.worldX - 20;
		var baseZ = config.worldZ + 15;
		for (var i = 0; i < 6; i++) {
			var croftGeo = new THREE.BoxGeometry(2, 1.5, 2.5);
			var croft = new THREE.Mesh(croftGeo, croftMat);
			croft.position.set(baseX + (i % 3) * 4, 0.75, baseZ + Math.floor(i / 3) * 4);
			croft.castShadow = true;
			croft.receiveShadow = true;
			group.add(croft);
		}
		return group;
	}

	function buildSeaBattery() {
		var group = new THREE.Group();
		var platformGeo = new THREE.BoxGeometry(3, 0.6, 3);
		var platformMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
		var gunMat = new THREE.MeshLambertMaterial({ color: config.gunColor });
		var gunGeo = new THREE.CylinderGeometry(0.25, 0.25, 2, 6);
		var baseX = config.worldX + 8;
		var baseZ = config.worldZ - 30;
		for (var i = 0; i < 3; i++) {
			var platform = new THREE.Mesh(platformGeo, platformMat);
			platform.position.set(baseX + (i - 1) * 3, 0.3, baseZ);
			platform.castShadow = true;
			platform.receiveShadow = true;
			group.add(platform);
			var gun = new THREE.Mesh(gunGeo, gunMat);
			gun.rotation.z = Math.PI * 0.3;
			gun.position.set(baseX + (i - 1) * 3, 1.2, baseZ);
			gun.castShadow = true;
			gun.receiveShadow = true;
			group.add(gun);
		}
		return group;
	}

	function create() {
		var scene = new THREE.Group();
		scene.add(buildDunrobinMain());
		scene.add(buildRoundTurrets());
		scene.add(buildGardenWalls());
		scene.add(buildBenBhraggieStatue());
		scene.add(buildRailwayDefence());
		scene.add(buildGatehouse());
		scene.add(buildCroftRuins());
		scene.add(buildSeaBattery());
		return scene;
	}

	return {
		create: create,
		config: config
	};
}());
