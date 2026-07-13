window.BloodSwamp = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var renderer = null;
	var environmentGroup = null;
	var mistGroup = null;
	var fireGroup = null;
	var boneGroup = null;
	var time = 0;
	var mistParticles = [];
	var fireFlames = [];
	var bonePiles = [];

	var colors = {
		crimson: 0x8B0000,
		darkCrimson: 0x660000,
		deepRed: 0x4d0000,
		boneWhite: 0xE8D7C3,
		darkWood: 0x3d2817,
		charcoal: 0x2a2a2a,
		brightRed: 0xFF4444,
		rust: 0xA0522D
	};

	function init(sceneRef, cameraRef, rendererRef) {
		scene = sceneRef;
		camera = cameraRef;
		renderer = rendererRef;

		environmentGroup = new THREE.Group();
		mistGroup = new THREE.Group();
		fireGroup = new THREE.Group();
		boneGroup = new THREE.Group();

		scene.add(environmentGroup);
		scene.add(mistGroup);
		scene.add(fireGroup);
		scene.add(boneGroup);

		buildterrain();
		builddeadtrees();
		buildmilitaryequipment();
		buildstonecircles();
		buildwoodenplatforms();
		buildbridges();
		buildshamantowers();
		buildbonepiles();
		createmist();
		createfires();
	}

	function buildterrain() {
		var terrainGeometry = new THREE.BoxGeometry(80, 2, 80);
		var terrainMaterial = new THREE.MeshLambertMaterial({ color: colors.deepRed });
		var terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
		terrain.position.y = -1;
		terrain.receiveShadow = true;
		environmentGroup.add(terrain);

		var waterGeometry = new THREE.BoxGeometry(80, 0.3, 80);
		var waterMaterial = new THREE.MeshPhongMaterial({
			color: colors.darkCrimson,
			shininess: 100
		});
		var water = new THREE.Mesh(waterGeometry, waterMaterial);
		water.position.y = 0.1;
		water.receiveShadow = true;
		environmentGroup.add(water);
	}

	function builddeadtrees() {
		var treePositions = [
			[-30, 0, -25],
			[-20, 0, -15],
			[-10, 0, 10],
			[15, 0, -30],
			[25, 0, -10],
			[35, 0, 20],
			[-35, 0, 20],
			[0, 0, 30],
			[20, 0, 25]
		];

		treePositions.forEach(function(pos) {
			var trunkGeometry = new THREE.CylinderGeometry(1.5, 2, 12, 8);
			var trunkMaterial = new THREE.MeshLambertMaterial({ color: colors.darkWood });
			var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
			trunk.position.set(pos[0], pos[1] + 6, pos[2]);
			trunk.castShadow = true;
			trunk.receiveShadow = true;
			trunk.rotation.z = (Math.random() - 0.5) * 0.4;
			environmentGroup.add(trunk);

			var branchCount = 3;
			for (var i = 0; i < branchCount; i++) {
				var branchGeometry = new THREE.CylinderGeometry(0.8, 1.2, 8, 6);
				var branchMaterial = new THREE.MeshLambertMaterial({ color: colors.darkWood });
				var branch = new THREE.Mesh(branchGeometry, branchMaterial);
				var angle = (i / branchCount) * Math.PI * 2;
				branch.position.set(
					pos[0] + Math.cos(angle) * 3,
					pos[1] + 8 + Math.random() * 2,
					pos[2] + Math.sin(angle) * 3
				);
				branch.rotation.z = Math.PI * 0.3 + Math.random() * 0.2;
				branch.castShadow = true;
				branch.receiveShadow = true;
				environmentGroup.add(branch);
			}
		});
	}

	function buildmilitaryequipment() {
		var metalMaterial = new THREE.MeshPhongMaterial({
			color: colors.rust,
			shininess: 50
		});

		var deployedMines = [
			[-25, 0.5, -20],
			[20, 0.5, -25],
			[30, 0.5, 15]
		];

		deployedMines.forEach(function(pos) {
			var mineGeometry = new THREE.BoxGeometry(2, 1.5, 2);
			var mine = new THREE.Mesh(mineGeometry, metalMaterial);
			mine.position.set(pos[0], pos[1], pos[2]);
			mine.castShadow = true;
			mine.rotation.y = Math.random() * Math.PI;
			environmentGroup.add(mine);
		});

		var gunPlacements = [
			[35, 0.8, -30],
			[-35, 0.8, 30]
		];

		gunPlacements.forEach(function(pos) {
			var gunGeometry = new THREE.CylinderGeometry(0.5, 0.6, 3, 8);
			var gun = new THREE.Mesh(gunGeometry, metalMaterial);
			gun.position.set(pos[0], pos[1] + 1.5, pos[2]);
			gun.rotation.z = Math.random() * Math.PI;
			gun.castShadow = true;
			environmentGroup.add(gun);
		});

		var barrels = [
			[-30, 0.5, 25],
			[25, 0.5, 30]
		];

		barrels.forEach(function(pos) {
			var barrelGeometry = new THREE.CylinderGeometry(1.2, 1.2, 3, 12);
			var barrel = new THREE.Mesh(barrelGeometry, metalMaterial);
			barrel.position.set(pos[0], pos[1] + 1.5, pos[2]);
			barrel.castShadow = true;
			barrel.rotation.x = Math.random() * 0.3;
			environmentGroup.add(barrel);
		});
	}

	function buildstonecircles() {
		var circlePositions = [
			[0, 0, -35],
			[38, 0, 0],
			[-38, 0, -15]
		];

		circlePositions.forEach(function(centerPos) {
			var stones = 12;
			var radius = 8;

			for (var i = 0; i < stones; i++) {
				var angle = (i / stones) * Math.PI * 2;
				var stoneX = centerPos[0] + Math.cos(angle) * radius;
				var stoneZ = centerPos[2] + Math.sin(angle) * radius;

				var stoneGeometry = new THREE.BoxGeometry(1.5, 2, 1.5);
				var stoneMaterial = new THREE.MeshLambertMaterial({ color: colors.charcoal });
				var stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
				stone.position.set(stoneX, 1, stoneZ);
				stone.rotation.y = Math.random() * Math.PI;
				stone.castShadow = true;
				stone.receiveShadow = true;
				environmentGroup.add(stone);
			}

			var altarGeometry = new THREE.CylinderGeometry(2, 2.5, 1, 8);
			var altarMaterial = new THREE.MeshLambertMaterial({ color: colors.rust });
			var altar = new THREE.Mesh(altarGeometry, altarMaterial);
			altar.position.set(centerPos[0], 0.5, centerPos[2]);
			altar.castShadow = true;
			altar.receiveShadow = true;
			environmentGroup.add(altar);
		});
	}

	function buildwoodenplatforms() {
		var platformPositions = [
			[-15, 3, 5],
			[10, 3.5, -20],
			[0, 2.5, 20],
			[-25, 3, 30]
		];

		platformPositions.forEach(function(pos) {
			var supportGeometry = new THREE.CylinderGeometry(0.8, 1, 6, 8);
			var supportMaterial = new THREE.MeshLambertMaterial({ color: colors.darkWood });
			var support = new THREE.Mesh(supportGeometry, supportMaterial);
			support.position.set(pos[0], pos[1] - 2, pos[2]);
			support.castShadow = true;
			support.receiveShadow = true;
			environmentGroup.add(support);

			var platformGeometry = new THREE.BoxGeometry(8, 0.8, 8);
			var platformMaterial = new THREE.MeshLambertMaterial({ color: colors.darkWood });
			var platform = new THREE.Mesh(platformGeometry, platformMaterial);
			platform.position.set(pos[0], pos[1], pos[2]);
			platform.castShadow = true;
			platform.receiveShadow = true;
			environmentGroup.add(platform);

			var railGeometry = new THREE.BoxGeometry(8, 0.5, 0.3);
			var railMaterial = new THREE.MeshLambertMaterial({ color: colors.charcoal });
			var rail1 = new THREE.Mesh(railGeometry, railMaterial);
			rail1.position.set(pos[0], pos[1] + 0.8, pos[2] + 4);
			environmentGroup.add(rail1);

			var rail2 = new THREE.Mesh(railGeometry, railMaterial);
			rail2.position.set(pos[0], pos[1] + 0.8, pos[2] - 4);
			environmentGroup.add(rail2);
		});
	}

	function buildbridges() {
		var bridgePaths = [
			{ from: [-20, 0.5, -10], to: [20, 0.5, 10] },
			{ from: [25, 0.5, -20], to: [0, 0.5, 20] }
		];

		bridgePaths.forEach(function(path) {
			var dx = path.to[0] - path.from[0];
			var dz = path.to[2] - path.from[2];
			var length = Math.sqrt(dx * dx + dz * dz);
			var angle = Math.atan2(dz, dx);

			var bridgeGeometry = new THREE.BoxGeometry(length, 0.6, 2);
			var bridgeMaterial = new THREE.MeshLambertMaterial({ color: colors.darkWood });
			var bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);

			bridge.position.set(
				(path.from[0] + path.to[0]) / 2,
				0.5,
				(path.from[2] + path.to[2]) / 2
			);
			bridge.rotation.y = angle;
			bridge.castShadow = true;
			bridge.receiveShadow = true;
			environmentGroup.add(bridge);

			var plankCount = Math.floor(length / 1.5);
			for (var i = 0; i < plankCount; i++) {
				var plankGeometry = new THREE.BoxGeometry(1.2, 0.2, 2);
				var plankMaterial = new THREE.MeshLambertMaterial({ color: colors.rust });
				var plank = new THREE.Mesh(plankGeometry, plankMaterial);
				var t = i / plankCount;
				plank.position.set(
					path.from[0] + dx * t,
					1.2,
					path.from[2] + dz * t
				);
				plank.rotation.y = angle;
				environmentGroup.add(plank);
			}
		});
	}

	function buildshamantowers() {
		var towerPositions = [
			[-35, 0, -35],
			[35, 0, 35]
		];

		towerPositions.forEach(function(pos) {
			var baseGeometry = new THREE.CylinderGeometry(3, 4, 2, 12);
			var baseMaterial = new THREE.MeshLambertMaterial({ color: colors.charcoal });
			var base = new THREE.Mesh(baseGeometry, baseMaterial);
			base.position.set(pos[0], 1, pos[2]);
			base.castShadow = true;
			base.receiveShadow = true;
			environmentGroup.add(base);

			var towerGeometry = new THREE.CylinderGeometry(2, 2.5, 14, 12);
			var towerMaterial = new THREE.MeshLambertMaterial({ color: colors.darkWood });
			var tower = new THREE.Mesh(towerGeometry, towerMaterial);
			tower.position.set(pos[0], 8, pos[2]);
			tower.castShadow = true;
			tower.receiveShadow = true;
			environmentGroup.add(tower);

			var roofGeometry = new THREE.ConeGeometry(3, 4, 12);
			var roofMaterial = new THREE.MeshLambertMaterial({ color: colors.crimson });
			var roof = new THREE.Mesh(roofGeometry, roofMaterial);
			roof.position.set(pos[0], 16, pos[2]);
			roof.castShadow = true;
			roof.receiveShadow = true;
			environmentGroup.add(roof);

			for (var i = 0; i < 4; i++) {
				var windowGeometry = new THREE.BoxGeometry(1, 1.5, 0.2);
				var windowMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
				var window = new THREE.Mesh(windowGeometry, windowMaterial);
				var angle = (i / 4) * Math.PI * 2;
				window.position.set(
					pos[0] + Math.cos(angle) * 2.2,
					8,
					pos[2] + Math.sin(angle) * 2.2
				);
				environmentGroup.add(window);
			}
		});
	}

	function buildbonepiles() {
		var pilePositions = [
			[-20, 0, 15],
			[15, 0, -20],
			[0, 0, -35],
			[30, 0, 10],
			[-30, 0, -5]
		];

		pilePositions.forEach(function(pos) {
			var boneCount = 8 + Math.floor(Math.random() * 4);
			var pile = new THREE.Group();

			for (var i = 0; i < boneCount; i++) {
				var boneGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 6);
				var boneMaterial = new THREE.MeshLambertMaterial({ color: colors.boneWhite });
				var bone = new THREE.Mesh(boneGeometry, boneMaterial);

				bone.position.set(
					(Math.random() - 0.5) * 4,
					0.5 + i * 0.4 + (Math.random() - 0.5) * 0.5,
					(Math.random() - 0.5) * 4
				);
				bone.rotation.x = Math.random() * Math.PI;
				bone.rotation.y = Math.random() * Math.PI;
				bone.rotation.z = Math.random() * Math.PI;
				bone.castShadow = true;
				bone.receiveShadow = true;
				pile.add(bone);
			}

			pile.position.set(pos[0], pos[1], pos[2]);
			boneGroup.add(pile);
			bonePiles.push({
				group: pile,
				basePos: pos,
				originalPositions: [],
				shake: 0
			});
		});
	}

	function createmist() {
		var mistCount = 40;

		for (var i = 0; i < mistCount; i++) {
			var mistGeometry = new THREE.SphereGeometry(3 + Math.random() * 2, 8, 8);
			var mistMaterial = new THREE.MeshBasicMaterial({
				color: colors.crimson,
				transparent: true,
				opacity: 0.08 + Math.random() * 0.05
			});
			var mistCloud = new THREE.Mesh(mistGeometry, mistMaterial);

			mistCloud.position.set(
				(Math.random() - 0.5) * 90,
				Math.random() * 8 + 2,
				(Math.random() - 0.5) * 90
			);

			mistParticles.push({
				mesh: mistCloud,
				velocity: {
					x: (Math.random() - 0.5) * 0.02,
					y: (Math.random() - 0.5) * 0.01,
					z: (Math.random() - 0.5) * 0.02
				},
				originalPos: mistCloud.position.clone()
			});

			mistGroup.add(mistCloud);
		}
	}

	function createfires() {
		var firePositions = [
			[-15, 3.5, 5],
			[10, 4, -20],
			[0, 3, 20],
			[-25, 3.5, 30]
		];

		firePositions.forEach(function(pos) {
			for (var i = 0; i < 3; i++) {
				var flameGeometry = new THREE.ConeGeometry(0.5 + i * 0.3, 2 + i * 0.5, 8);
				var flameMaterial = new THREE.MeshBasicMaterial({
					color: i === 0 ? colors.brightRed : colors.crimson,
					transparent: true,
					opacity: 0.7 - i * 0.2
				});
				var flame = new THREE.Mesh(flameGeometry, flameMaterial);

				flame.position.set(
					pos[0] + (Math.random() - 0.5) * 0.3,
					pos[1] + i * 0.5,
					pos[2] + (Math.random() - 0.5) * 0.3
				);

				fireFlames.push({
					mesh: flame,
					basePos: pos,
					layer: i,
					offset: Math.random() * Math.PI * 2
				});

				fireGroup.add(flame);
			}
		});
	}

	function update(deltaTime) {
		time += deltaTime;

		mistParticles.forEach(function(particle) {
			particle.mesh.position.x += particle.velocity.x;
			particle.mesh.position.y += particle.velocity.y;
			particle.mesh.position.z += particle.velocity.z;

			if (particle.mesh.position.x > 45) particle.mesh.position.x = -45;
			if (particle.mesh.position.x < -45) particle.mesh.position.x = 45;
			if (particle.mesh.position.z > 45) particle.mesh.position.z = -45;
			if (particle.mesh.position.z < -45) particle.mesh.position.z = 45;

			var noiseX = Math.sin(time * 0.5 + particle.mesh.position.x) * 0.3;
			var noiseY = Math.cos(time * 0.3 + particle.mesh.position.y) * 0.15;
			var noiseZ = Math.sin(time * 0.4 + particle.mesh.position.z) * 0.3;

			particle.mesh.position.x += noiseX * deltaTime;
			particle.mesh.position.y += noiseY * deltaTime;
			particle.mesh.position.z += noiseZ * deltaTime;

			var opacity = 0.08 + Math.sin(time * 0.3 + particle.originalPos.x) * 0.03;
			particle.mesh.material.opacity = Math.max(0.03, opacity);
		});

		fireFlames.forEach(function(flame) {
			var flicker = Math.sin(time * 3 + flame.offset) * 0.3 + 0.7;
			var scale = flicker + flame.layer * 0.2;

			flame.mesh.scale.set(scale, flicker, scale);
			flame.mesh.position.x = flame.basePos[0] + Math.sin(time * 2 + flame.offset) * 0.2;
			flame.mesh.position.z = flame.basePos[2] + Math.cos(time * 2 + flame.offset) * 0.2;

			var opacity = (0.7 - flame.layer * 0.2) * flicker;
			flame.mesh.material.opacity = opacity;
		});

		bonePiles.forEach(function(pile) {
			pile.shake *= 0.95;

			if (Math.random() < 0.01) {
				pile.shake = 0.15;
			}

			pile.group.position.y = pile.basePos[1] + Math.sin(time * 2) * pile.shake;
			pile.group.rotation.z = Math.sin(time * 1.5) * pile.shake * 0.2;
		});
	}

	function reset() {
		if (scene && environmentGroup) {
			scene.remove(environmentGroup);
			scene.remove(mistGroup);
			scene.remove(fireGroup);
			scene.remove(boneGroup);
		}

		mistParticles = [];
		fireFlames = [];
		bonePiles = [];
		time = 0;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
