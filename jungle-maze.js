window.JungleMaze = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var objects = [];
	var lights = [];
	var torches = [];
	var bridges = [];
	var vines = [];
	var animationTimers = {};

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		lights = [];
		torches = [];
		bridges = [];
		vines = [];
		animationTimers = {};

		buildlights();
		buildtreetrunkwalls();
		buildropes();
		buildplatforms();
		buildtorches();
		buildvines();
		buildruins();
		buildpittraps();
		buildcreepervines();
		buildambushcover();
	}

	function buildlights() {
		var ambientLight = new THREE.AmbientLight(0x3a5a2a, 0.6);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffddaa, 0.8);
		directionalLight.position.set(150, 120, 100);
		directionalLight.castShadow = true;
		scene.add(directionalLight);
		lights.push(directionalLight);

		var spotLight1 = new THREE.SpotLight(0xff9900, 0.7, 200, Math.PI / 4, 0.5, 2);
		spotLight1.position.set(80, 60, 80);
		spotLight1.castShadow = true;
		scene.add(spotLight1);
		lights.push(spotLight1);

		var spotLight2 = new THREE.SpotLight(0xff9900, 0.6, 200, Math.PI / 5, 0.5, 2);
		spotLight2.position.set(-80, 50, -80);
		spotLight2.castShadow = true;
		scene.add(spotLight2);
		lights.push(spotLight2);

		var pointLight = new THREE.PointLight(0x88ff88, 0.4, 150);
		pointLight.position.set(0, 30, 0);
		scene.add(pointLight);
		lights.push(pointLight);
	}

	function buildtreetrunkwalls() {
		var positions = [
			{ x: 0, z: 0 },
			{ x: 40, z: 0 },
			{ x: -40, z: 0 },
			{ x: 0, z: 40 },
			{ x: 0, z: -40 },
			{ x: 40, z: 40 },
			{ x: -40, z: -40 },
			{ x: 40, z: -40 },
			{ x: -40, z: 40 },
			{ x: 80, z: 0 },
			{ x: -80, z: 0 },
			{ x: 0, z: 80 },
			{ x: 0, z: -80 },
			{ x: 80, z: 80 },
			{ x: -80, z: -80 },
			{ x: 80, z: -80 },
			{ x: -80, z: 80 }
		];

		var colors = [0x1a3a0a, 0x2a4a1a, 0x1f3f0f, 0x2a5a1a, 0x1a4a0a];

		for (var i = 0; i < positions.length; i++) {
			var pos = positions[i];
			var colorIdx = i % colors.length;
			var trunk = buildtrunkunit(pos.x, pos.z, colors[colorIdx]);
			objects.push(trunk);
			scene.add(trunk);
		}

		var horizontalWalls = [
			{ x1: 0, z1: 20, x2: 60, z2: 20 },
			{ x1: -60, z1: -20, x2: 0, z2: -20 },
			{ x1: -30, z1: 50, x2: 30, z2: 50 },
			{ x1: -50, z1: -50, x2: 20, z2: -50 },
			{ x1: 40, z1: 60, x2: 90, z2: 60 },
			{ x1: -90, z1: 30, x2: -40, z2: 30 }
		];

		for (var j = 0; j < horizontalWalls.length; j++) {
			var wall = horizontalWalls[j];
			var wallObj = buildwallsegment(wall.x1, wall.z1, wall.x2, wall.z2);
			objects.push(wallObj);
			scene.add(wallObj);
		}
	}

	function buildtrunkunit(centerX, centerZ, color) {
		var group = new THREE.Group();
		var geometry = new THREE.CylinderGeometry(4, 4.5, 45, 8);
		var material = new THREE.MeshLambertMaterial({ color: color });
		var mainTrunk = new THREE.Mesh(geometry, material);
		mainTrunk.position.set(centerX, 22.5, centerZ);
		mainTrunk.castShadow = true;
		mainTrunk.receiveShadow = true;
		group.add(mainTrunk);

		var branch1Geo = new THREE.CylinderGeometry(1.5, 1.2, 18, 6);
		var branch1 = new THREE.Mesh(branch1Geo, material);
		branch1.position.set(centerX + 6, 35, centerZ);
		branch1.rotation.z = Math.PI / 4;
		branch1.castShadow = true;
		branch1.receiveShadow = true;
		group.add(branch1);

		var branch2 = new THREE.Mesh(branch1Geo, material);
		branch2.position.set(centerX - 6, 35, centerZ);
		branch2.rotation.z = -Math.PI / 4;
		branch2.castShadow = true;
		branch2.receiveShadow = true;
		group.add(branch2);

		var foliageGeo = new THREE.SphereGeometry(12, 8, 6);
		var foliageMaterial = new THREE.MeshLambertMaterial({ color: 0x0a2a00 });
		var foliage = new THREE.Mesh(foliageGeo, foliageMaterial);
		foliage.position.set(centerX, 50, centerZ);
		foliage.scale.set(1.2, 1.3, 1.1);
		foliage.castShadow = true;
		foliage.receiveShadow = true;
		group.add(foliage);

		return group;
	}

	function buildwallsegment(x1, z1, x2, z2) {
		var group = new THREE.Group();
		var dx = x2 - x1;
		var dz = z2 - z1;
		var dist = Math.sqrt(dx * dx + dz * dz);
		var midX = (x1 + x2) / 2;
		var midZ = (z1 + z2) / 2;

		var geometry = new THREE.BoxGeometry(2.5, 40, dist + 5);
		var material = new THREE.MeshLambertMaterial({ color: 0x2a3a1a });
		var wall = new THREE.Mesh(geometry, material);
		wall.position.set(midX, 20, midZ);
		var angle = Math.atan2(dz, dx);
		wall.rotation.y = angle;
		wall.castShadow = true;
		wall.receiveShadow = true;
		group.add(wall);

		return group;
	}

	function buildropes() {
		var ropeBridges = [
			{ x1: 50, z1: 50, x2: 100, z2: 50 },
			{ x1: -80, z1: 70, x2: -30, z2: 70 },
			{ x1: 60, z1: -60, x2: 60, z2: -20 }
		];

		for (var i = 0; i < ropeBridges.length; i++) {
			var bridge = ropeBridges[i];
			var ropeObj = buildropebridge(bridge.x1, bridge.z1, bridge.x2, bridge.z2);
			objects.push(ropeObj);
			scene.add(ropeObj);
			bridges.push({
				mesh: ropeObj,
				baseY: 45,
				amplitude: 1.5,
				time: Math.random() * Math.PI * 2
			});
		}
	}

	function buildropebridge(x1, z1, x2, z2) {
		var group = new THREE.Group();
		var dx = x2 - x1;
		var dz = z2 - z1;
		var dist = Math.sqrt(dx * dx + dz * dz);
		var midX = (x1 + x2) / 2;
		var midZ = (z1 + z2) / 2;

		var bridgeBoardGeo = new THREE.BoxGeometry(8, 1.5, dist + 2);
		var bridgeMaterial = new THREE.MeshLambertMaterial({ color: 0x8b6914 });
		var bridgeBoard = new THREE.Mesh(bridgeBoardGeo, bridgeMaterial);
		bridgeBoard.position.set(midX, 45, midZ);
		var angle = Math.atan2(dz, dx);
		bridgeBoard.rotation.y = angle;
		bridgeBoard.castShadow = true;
		bridgeBoard.receiveShadow = true;
		group.add(bridgeBoard);

		var ropeLeftGeo = new THREE.CylinderGeometry(0.3, 0.3, dist + 5, 4);
		var ropeMaterial = new THREE.MeshLambertMaterial({ color: 0x5a4a2a });
		var ropeLeft = new THREE.Mesh(ropeLeftGeo, ropeMaterial);
		ropeLeft.position.set(midX - 3, 48, midZ);
		ropeLeft.rotation.z = angle;
		ropeLeft.castShadow = true;
		group.add(ropeLeft);

		var ropeRight = new THREE.Mesh(ropeLeftGeo, ropeMaterial);
		ropeRight.position.set(midX + 3, 48, midZ);
		ropeRight.rotation.z = angle;
		ropeRight.castShadow = true;
		group.add(ropeRight);

		return group;
	}

	function buildplatforms() {
		var platformPositions = [
			{ x: 80, y: 50, z: 80 },
			{ x: -80, y: 55, z: 80 },
			{ x: 80, y: 50, z: -80 },
			{ x: -80, y: 55, z: -80 },
			{ x: 100, y: 48, z: 0 },
			{ x: -100, y: 50, z: 0 }
		];

		for (var i = 0; i < platformPositions.length; i++) {
			var pos = platformPositions[i];
			var platform = buildsnipeplatform(pos.x, pos.y, pos.z);
			objects.push(platform);
			scene.add(platform);
		}
	}

	function buildsnipeplatform(x, y, z) {
		var group = new THREE.Group();

		var supportGeo = new THREE.CylinderGeometry(2.5, 3, y - 3, 6);
		var supportMaterial = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
		var support = new THREE.Mesh(supportGeo, supportMaterial);
		support.position.set(x, y / 2, z);
		support.castShadow = true;
		support.receiveShadow = true;
		group.add(support);

		var platformGeo = new THREE.BoxGeometry(15, 1.5, 12);
		var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
		var platform = new THREE.Mesh(platformGeo, platformMaterial);
		platform.position.set(x, y, z);
		platform.castShadow = true;
		platform.receiveShadow = true;
		group.add(platform);

		var railingGeo = new THREE.BoxGeometry(0.8, 3, 13);
		var railingMaterial = new THREE.MeshLambertMaterial({ color: 0x2a1a0a });
		var railing1 = new THREE.Mesh(railingGeo, railingMaterial);
		railing1.position.set(x + 6.5, y + 2, z);
		railing1.castShadow = true;
		group.add(railing1);

		var railing2 = new THREE.Mesh(railingGeo, railingMaterial);
		railing2.position.set(x - 6.5, y + 2, z);
		railing2.castShadow = true;
		group.add(railing2);

		return group;
	}

	function buildtorches() {
		var torchPositions = [
			{ x: 30, y: 20, z: 30 },
			{ x: -30, y: 20, z: -30 },
			{ x: 60, y: 20, z: -60 },
			{ x: -60, y: 20, z: 60 },
			{ x: 0, y: 20, z: 70 },
			{ x: 90, y: 20, z: 30 }
		];

		for (var i = 0; i < torchPositions.length; i++) {
			var pos = torchPositions[i];
			var torch = buildtorchunit(pos.x, pos.y, pos.z);
			objects.push(torch);
			scene.add(torch);
			torches.push({
				mesh: torch,
				time: Math.random() * Math.PI * 2
			});
		}
	}

	function buildtorchunit(x, y, z) {
		var group = new THREE.Group();

		var poleGeo = new THREE.CylinderGeometry(0.4, 0.5, y + 5, 5);
		var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x1a0a00 });
		var pole = new THREE.Mesh(poleGeo, poleMaterial);
		pole.position.set(x, y / 2 + 2.5, z);
		pole.castShadow = true;
		group.add(pole);

		var flameGeo = new THREE.ConeGeometry(1.2, 4, 6);
		var flameMaterial = new THREE.MeshLambertMaterial({ color: 0xff8800 });
		var flame = new THREE.Mesh(flameGeo, flameMaterial);
		flame.position.set(x, y + 3, z);
		flame.castShadow = true;
		group.add(flame);

		var glowLight = new THREE.PointLight(0xff6600, 0.8, 40);
		glowLight.position.set(x, y + 3, z);
		group.add(glowLight);

		return group;
	}

	function buildvines() {
		var vinePositions = [
			{ x: 20, z: 0, length: 35 },
			{ x: -20, z: 0, length: 35 },
			{ x: 0, z: 20, length: 40 },
			{ x: 0, z: -20, length: 40 },
			{ x: 40, z: 40, length: 32 },
			{ x: -40, z: -40, length: 32 }
		];

		for (var i = 0; i < vinePositions.length; i++) {
			var pos = vinePositions[i];
			var vine = buildvinestring(pos.x, pos.z, pos.length);
			objects.push(vine);
			scene.add(vine);
			vines.push({
				mesh: vine,
				baseX: pos.x,
				baseZ: pos.z,
				amplitude: 0.8,
				frequency: 1.2,
				time: Math.random() * Math.PI * 2
			});
		}
	}

	function buildvinestring(x, z, length) {
		var group = new THREE.Group();

		var vineGeo = new THREE.CylinderGeometry(0.3, 0.25, length, 6);
		var vineMaterial = new THREE.MeshLambertMaterial({ color: 0x1a4a0a });
		var vine = new THREE.Mesh(vineGeo, vineMaterial);
		vine.position.set(x, length / 2 + 10, z);
		vine.castShadow = true;
		group.add(vine);

		var leafGeo = new THREE.SphereGeometry(2, 4, 4);
		var leafMaterial = new THREE.MeshLambertMaterial({ color: 0x0a3a00 });
		for (var i = 0; i < 8; i++) {
			var leaf = new THREE.Mesh(leafGeo, leafMaterial);
			var leafY = 10 + (i * length / 8);
			leaf.position.set(x + Math.sin(i * 0.7) * 3, leafY, z + Math.cos(i * 0.9) * 3);
			leaf.scale.set(0.8, 0.6, 0.5);
			group.add(leaf);
		}

		return group;
	}

	function buildruins() {
		var ruinPositions = [
			{ x: 70, z: 70 },
			{ x: -70, z: -70 },
			{ x: 70, z: -70 }
		];

		for (var i = 0; i < ruinPositions.length; i++) {
			var pos = ruinPositions[i];
			var ruin = buildruin(pos.x, pos.z);
			objects.push(ruin);
			scene.add(ruin);
		}
	}

	function buildruin(x, z) {
		var group = new THREE.Group();

		var stoneColor = 0x5a5a4a;
		var stoneMaterial = new THREE.MeshLambertMaterial({ color: stoneColor });

		var pillar1Geo = new THREE.CylinderGeometry(2.5, 3, 25, 6);
		var pillar1 = new THREE.Mesh(pillar1Geo, stoneMaterial);
		pillar1.position.set(x - 10, 12.5, z - 10);
		pillar1.castShadow = true;
		group.add(pillar1);

		var pillar2 = new THREE.Mesh(pillar1Geo, stoneMaterial);
		pillar2.position.set(x + 10, 12.5, z - 10);
		pillar2.castShadow = true;
		group.add(pillar2);

		var pillar3 = new THREE.Mesh(pillar1Geo, stoneMaterial);
		pillar3.position.set(x - 10, 12.5, z + 10);
		pillar3.castShadow = true;
		group.add(pillar3);

		var pillar4 = new THREE.Mesh(pillar1Geo, stoneMaterial);
		pillar4.position.set(x + 10, 12.5, z + 10);
		pillar4.castShadow = true;
		group.add(pillar4);

		var capstoneGeo = new THREE.BoxGeometry(26, 3, 26);
		var capstone = new THREE.Mesh(capstoneGeo, stoneMaterial);
		capstone.position.set(x, 26, z);
		capstone.castShadow = true;
		group.add(capstone);

		var debriseGeo = new THREE.BoxGeometry(4, 2, 5);
		var debriseMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a3a });
		for (var i = 0; i < 5; i++) {
			var debris = new THREE.Mesh(debriseGeo, debriseMaterial);
			debris.position.set(x + (Math.random() - 0.5) * 25, 2, z + (Math.random() - 0.5) * 25);
			debris.rotation.y = Math.random() * Math.PI;
			debris.castShadow = true;
			group.add(debris);
		}

		return group;
	}

	function buildpittraps() {
		var pitPositions = [
			{ x: 40, z: -40 },
			{ x: -40, z: 40 },
			{ x: 30, z: 50 },
			{ x: -50, z: -30 }
		];

		for (var i = 0; i < pitPositions.length; i++) {
			var pos = pitPositions[i];
			var pit = buildpittrap(pos.x, pos.z);
			objects.push(pit);
			scene.add(pit);
		}
	}

	function buildpittrap(x, z) {
		var group = new THREE.Group();

		var rimGeo = new THREE.CylinderGeometry(8, 8.5, 1.5, 8);
		var rimMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a2a });
		var rim = new THREE.Mesh(rimGeo, rimMaterial);
		rim.position.set(x, 0.75, z);
		rim.castShadow = true;
		group.add(rim);

		var pitWallGeo = new THREE.CylinderGeometry(7.5, 8, 15, 8);
		var pitMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a0a });
		var pitWall = new THREE.Mesh(pitWallGeo, pitMaterial);
		pitWall.position.set(x, -7.5, z);
		pitWall.castShadow = true;
		group.add(pitWall);

		var spikeGeo = new THREE.ConeGeometry(0.6, 3, 4);
		var spikeMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a1a });
		for (var i = 0; i < 6; i++) {
			var spike = new THREE.Mesh(spikeGeo, spikeMaterial);
			var angle = (i / 6) * Math.PI * 2;
			spike.position.set(x + Math.cos(angle) * 3, -12, z + Math.sin(angle) * 3);
			spike.castShadow = true;
			group.add(spike);
		}

		return group;
	}

	function buildcreepervines() {
		var creeperPositions = [
			{ x: 40, z: 0 },
			{ x: -40, z: 0 },
			{ x: 0, z: 40 },
			{ x: 0, z: -40 },
			{ x: 40, z: 40 }
		];

		for (var i = 0; i < creeperPositions.length; i++) {
			var pos = creeperPositions[i];
			var creeper = buildcreeper(pos.x, pos.z);
			objects.push(creeper);
			scene.add(creeper);
			vines.push({
				mesh: creeper,
				baseX: pos.x,
				baseZ: pos.z,
				amplitude: 0.5,
				frequency: 0.8,
				time: Math.random() * Math.PI * 2
			});
		}
	}

	function buildcreeper(x, z) {
		var group = new THREE.Group();

		var creeperGeo = new THREE.BoxGeometry(12, 30, 0.5);
		var creeperMaterial = new THREE.MeshLambertMaterial({ color: 0x0a4a0a });
		var creeper = new THREE.Mesh(creeperGeo, creeperMaterial);
		creeper.position.set(x, 15, z);
		creeper.castShadow = true;
		group.add(creeper);

		var tendrilGeo = new THREE.CylinderGeometry(0.2, 0.15, 6, 4);
		var tendrilMaterial = new THREE.MeshLambertMaterial({ color: 0x0a3a00 });
		for (var i = 0; i < 12; i++) {
			var tendril = new THREE.Mesh(tendrilGeo, tendrilMaterial);
			var offsetX = (Math.random() - 0.5) * 10;
			var offsetY = (Math.random() - 0.5) * 25;
			tendril.position.set(x + offsetX, 15 + offsetY, z - 2);
			tendril.rotation.z = Math.random() * Math.PI;
			group.add(tendril);
		}

		return group;
	}

	function buildambushcover() {
		var coverPositions = [
			{ x: 25, y: 15, z: 25 },
			{ x: -25, y: 15, z: -25 },
			{ x: 50, y: 12, z: 50 },
			{ x: -50, y: 12, z: -50 },
			{ x: 35, y: 14, z: -35 },
			{ x: -35, y: 14, z: 35 }
		];

		for (var i = 0; i < coverPositions.length; i++) {
			var pos = coverPositions[i];
			var cover = buildcover(pos.x, pos.y, pos.z);
			objects.push(cover);
			scene.add(cover);
		}
	}

	function buildcover(x, y, z) {
		var group = new THREE.Group();

		var coverGeo = new THREE.BoxGeometry(8, y, 6);
		var coverMaterial = new THREE.MeshLambertMaterial({ color: 0x1a5a0a });
		var cover = new THREE.Mesh(coverGeo, coverMaterial);
		cover.position.set(x, y / 2, z);
		cover.castShadow = true;
		cover.receiveShadow = true;
		group.add(cover);

		var leafClumpGeo = new THREE.SphereGeometry(3.5, 6, 5);
		var leafMaterial = new THREE.MeshLambertMaterial({ color: 0x0a3a00 });
		var leaves1 = new THREE.Mesh(leafClumpGeo, leafMaterial);
		leaves1.position.set(x - 2, y + 2, z - 1);
		leaves1.scale.set(1.1, 1.3, 0.9);
		leaves1.castShadow = true;
		group.add(leaves1);

		var leaves2 = new THREE.Mesh(leafClumpGeo, leafMaterial);
		leaves2.position.set(x + 3, y + 1.5, z + 1.5);
		leaves2.scale.set(1.2, 1.2, 0.8);
		leaves2.castShadow = true;
		group.add(leaves2);

		return group;
	}

	function update(delta) {
		var currentTime = Date.now() * 0.001;

		for (var i = 0; i < torches.length; i++) {
			var torch = torches[i];
			torch.time += delta * 5;
			var flameScale = 1 + Math.sin(torch.time) * 0.15;
			var flameMesh = torch.mesh.children[1];
			if (flameMesh) {
				flameMesh.scale.y = flameScale;
				flameMesh.position.y = torch.mesh.position.y + 3 + Math.sin(torch.time * 1.5) * 0.3;
			}
		}

		for (var j = 0; j < bridges.length; j++) {
			var bridge = bridges[j];
			bridge.time += delta * 0.8;
			var swayX = Math.sin(bridge.time) * bridge.amplitude;
			bridge.mesh.position.x = bridge.mesh.userData.baseX !== undefined ? bridge.mesh.userData.baseX : bridge.mesh.position.x;
			if (bridge.mesh.userData.baseY === undefined) {
				bridge.mesh.userData.baseY = bridge.mesh.position.y;
				bridge.mesh.userData.baseX = bridge.mesh.position.x;
			}
			bridge.mesh.position.y = bridge.baseY + swayX * 0.7;
			bridge.mesh.rotation.z = swayX * 0.02;
		}

		for (var k = 0; k < vines.length; k++) {
			var vine = vines[k];
			vine.time += delta * vine.frequency;
			var vineSwayX = Math.sin(vine.time) * vine.amplitude;
			vine.mesh.position.x = vine.baseX + vineSwayX;
			vine.mesh.position.z = vine.baseZ + Math.cos(vine.time * 0.7) * vine.amplitude * 0.6;
		}
	}

	function reset() {
		for (var i = 0; i < objects.length; i++) {
			scene.remove(objects[i]);
		}
		objects = [];

		for (var j = 0; j < lights.length; j++) {
			scene.remove(lights[j]);
		}
		lights = [];

		torches = [];
		bridges = [];
		vines = [];
		animationTimers = {};

		scene = null;
		camera = null;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
