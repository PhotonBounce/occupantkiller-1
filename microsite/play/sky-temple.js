window.SkyTemple = (function() {
	'use strict';

	var scene, camera;
	var floatingPlatforms = [];
	var cloudMasses = [];
	var windSpirits = [];
	var levitatingRings = [];
	var trapTiles = [];
	var artifactPedestal;
	var artifactGlow;
	var dragonStatue;
	var timeElapsed = 0;

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		timeElapsed = 0;
		floatingPlatforms = [];
		cloudMasses = [];
		windSpirits = [];
		levitatingRings = [];
		trapTiles = [];

		createStarField();
		createFloatingIsland();
		createMainTemple();
		createCloudLayer();
		createSkyBridges();
		createSmallFloatingRocks();
		createLevitatingRings();
		createArtifactPedestal();
		createAncientTrapTiles();
		createDragonStatue();
		createWindSpirits();
	}

	function createStarField() {
		var starGeom = new THREE.SphereGeometry(0.08, 8, 8);
		var starMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });

		for (var i = 0; i < 300; i++) {
			var phi = Math.acos(-1 + (2 * i) / 300);
			var theta = Math.sqrt(300 * Math.PI) * phi;

			var x = 500 * Math.cos(theta) * Math.sin(phi);
			var y = 500 * Math.sin(theta) * Math.sin(phi);
			var z = 500 * Math.cos(phi);

			var star = new THREE.Mesh(starGeom, starMat);
			star.position.set(x, y, z);
			scene.add(star);
		}
	}

	function createFloatingIsland() {
		var islandGeom = new THREE.BoxGeometry(100, 20, 100);
		var islandMat = new THREE.MeshStandardMaterial({
			color: 0x8B7355,
			roughness: 0.8,
			metalness: 0.2
		});
		var island = new THREE.Mesh(islandGeom, islandMat);
		island.position.y = 0;
		island.castShadow = true;
		island.receiveShadow = true;
		scene.add(island);

		var edgeGeom = new THREE.BoxGeometry(105, 5, 105);
		var edgeMat = new THREE.MeshStandardMaterial({
			color: 0x654321,
			roughness: 0.9
		});
		var edge = new THREE.Mesh(edgeGeom, edgeMat);
		edge.position.y = -12.5;
		edge.castShadow = true;
		scene.add(edge);
	}

	function createMainTemple() {
		var baseGeom = new THREE.BoxGeometry(40, 15, 40);
		var baseMat = new THREE.MeshStandardMaterial({
			color: 0xA0A0A0,
			roughness: 0.7
		});
		var base = new THREE.Mesh(baseGeom, baseMat);
		base.position.set(0, 15, 0);
		base.castShadow = true;
		base.receiveShadow = true;
		scene.add(base);

		var middleGeom = new THREE.BoxGeometry(30, 12, 30);
		var middle = new THREE.Mesh(middleGeom, baseMat);
		middle.position.set(0, 32, 0);
		middle.castShadow = true;
		middle.receiveShadow = true;
		scene.add(middle);

		var topGeom = new THREE.BoxGeometry(20, 10, 20);
		var top = new THREE.Mesh(topGeom, baseMat);
		top.position.set(0, 47, 0);
		top.castShadow = true;
		top.receiveShadow = true;
		scene.add(top);

		for (var i = 0; i < 4; i++) {
			var angle = (i / 4) * Math.PI * 2;
			var roofX = 25 * Math.cos(angle);
			var roofZ = 25 * Math.sin(angle);

			var eaveGeom = new THREE.ConeGeometry(6, 8, 8);
			var eaveMat = new THREE.MeshStandardMaterial({
				color: 0xFF6B35,
				roughness: 0.6
			});
			var eave = new THREE.Mesh(eaveGeom, eaveMat);
			eave.position.set(roofX, 57, roofZ);
			eave.castShadow = true;
			scene.add(eave);
		}
	}

	function createCloudLayer() {
		for (var i = 0; i < 8; i++) {
			var cloudGeom = new THREE.SphereGeometry(8 + Math.random() * 8, 8, 8);
			var cloudMat = new THREE.MeshStandardMaterial({
				color: 0xE8E8E8,
				emissive: 0x666666,
				roughness: 0.9,
				transparent: true,
				opacity: 0.7
			});
			var cloud = new THREE.Mesh(cloudGeom, cloudMat);

			var angle = (i / 8) * Math.PI * 2;
			var distance = 60 + Math.random() * 40;
			cloud.position.set(
				Math.cos(angle) * distance,
				-40 - Math.random() * 30,
				Math.sin(angle) * distance
			);
			cloud.driftSpeed = 0.3 + Math.random() * 0.3;
			cloud.driftAngle = angle;
			cloudMasses.push(cloud);
			scene.add(cloud);
		}
	}

	function createSkyBridges() {
		var bridgePositions = [
			{ x: 60, z: 0 },
			{ x: -60, z: 0 },
			{ x: 0, z: 60 },
			{ x: 0, z: -60 }
		];

		bridgePositions.forEach(function(pos) {
			var bridgeGeom = new THREE.BoxGeometry(8, 3, 40);
			var bridgeMat = new THREE.MeshStandardMaterial({
				color: 0x808080,
				roughness: 0.8
			});
			var bridge = new THREE.Mesh(bridgeGeom, bridgeMat);
			bridge.position.set(pos.x * 0.5, 5, pos.z * 0.5);
			bridge.castShadow = true;
			bridge.receiveShadow = true;
			scene.add(bridge);
		});
	}

	function createSmallFloatingRocks() {
		var positions = [
			{ x: 80, z: 20, y: 10 },
			{ x: -70, z: 50, y: 15 },
			{ x: 30, z: -75, y: 8 },
			{ x: -45, z: -60, y: 12 }
		];

		positions.forEach(function(pos) {
			var rockGeom = new THREE.BoxGeometry(15, 8, 15);
			var rockMat = new THREE.MeshStandardMaterial({
				color: 0x6B5344,
				roughness: 0.8
			});
			var rock = new THREE.Mesh(rockGeom, rockMat);
			rock.position.set(pos.x, pos.y, pos.z);
			rock.castShadow = true;
			rock.receiveShadow = true;
			rock.baseY = pos.y;
			rock.bobSpeed = 0.8 + Math.random() * 0.4;
			rock.bobAmount = 3 + Math.random() * 2;
			floatingPlatforms.push(rock);
			scene.add(rock);
		});
	}

	function createLevitatingRings() {
		for (var i = 0; i < 3; i++) {
			var ringGeom = new THREE.CylinderGeometry(12 + i * 3, 12 + i * 3, 2, 32);
			var ringMat = new THREE.MeshStandardMaterial({
				color: new THREE.Color(0.5 + i * 0.1, 0.5 + i * 0.1, 0.8 + i * 0.1),
				metalness: 0.8,
				roughness: 0.2,
				emissive: new THREE.Color(0.2, 0.2, 0.6)
			});
			var ring = new THREE.Mesh(ringGeom, ringMat);
			ring.position.set(0, 55 + i * 8, 0);
			ring.castShadow = true;
			ring.rotation.x = Math.PI / (4 + i);
			ring.rotationSpeed = 0.3 + i * 0.1;
			ring.rotationAxis = i % 2 === 0 ? 'x' : 'z';
			levitatingRings.push(ring);
			scene.add(ring);
		}
	}

	function createArtifactPedestal() {
		var pedestalGeom = new THREE.BoxGeometry(8, 6, 8);
		var pedestalMat = new THREE.MeshStandardMaterial({
			color: 0x4A4A4A,
			metalness: 0.6,
			roughness: 0.4
		});
		var pedestal = new THREE.Mesh(pedestalGeom, pedestalMat);
		pedestal.position.set(0, 24, 0);
		pedestal.castShadow = true;
		pedestal.receiveShadow = true;
		scene.add(pedestal);

		var artifactGeom = new THREE.SphereGeometry(4, 32, 32);
		var artifactMat = new THREE.MeshStandardMaterial({
			color: 0xFFD700,
			emissive: 0xFFAA00,
			metalness: 0.9,
			roughness: 0.1
		});
		artifactGlow = new THREE.Mesh(artifactGeom, artifactMat);
		artifactGlow.position.set(0, 33, 0);
		artifactGlow.castShadow = true;
		scene.add(artifactGlow);

		var glowGeom = new THREE.SphereGeometry(5, 32, 32);
		var glowMat = new THREE.MeshBasicMaterial({
			color: 0xFFD700,
			transparent: true,
			opacity: 0.2
		});
		var glowSphere = new THREE.Mesh(glowGeom, glowMat);
		glowSphere.position.copy(artifactGlow.position);
		scene.add(glowSphere);
	}

	function createAncientTrapTiles() {
		var tilePositions = [
			{ x: -15, z: -15 },
			{ x: 15, z: -15 },
			{ x: 15, z: 15 },
			{ x: -15, z: 15 }
		];

		tilePositions.forEach(function(pos) {
			var tileGeom = new THREE.BoxGeometry(8, 1, 8);
			var tileMat = new THREE.MeshStandardMaterial({
				color: 0x8B4513,
				roughness: 0.9
			});
			var tile = new THREE.Mesh(tileGeom, tileMat);
			tile.position.set(pos.x, 16.5, pos.z);
			tile.castShadow = true;
			tile.receiveShadow = true;
			tile.activated = false;
			tile.activationTime = 0;
			trapTiles.push(tile);
			scene.add(tile);

			for (var i = 0; i < 4; i++) {
				var angle = (i / 4) * Math.PI * 2;
				var spikeX = pos.x + 2.5 * Math.cos(angle);
				var spikeZ = pos.z + 2.5 * Math.sin(angle);

				var spikeGeom = new THREE.ConeGeometry(1, 4, 8);
				var spikeMat = new THREE.MeshStandardMaterial({
					color: 0x404040,
					metalness: 0.7,
					roughness: 0.3
				});
				var spike = new THREE.Mesh(spikeGeom, spikeMat);
				spike.position.set(spikeX, 18, spikeZ);
				spike.castShadow = true;
				scene.add(spike);
			}
		});
	}

	function createDragonStatue() {
		var bodyGeom = new THREE.BoxGeometry(20, 15, 35);
		var bodyMat = new THREE.MeshStandardMaterial({
			color: 0x2F4F4F,
			metalness: 0.3,
			roughness: 0.7
		});
		var body = new THREE.Mesh(bodyGeom, bodyMat);
		body.position.set(-50, 25, 0);
		body.castShadow = true;
		body.receiveShadow = true;
		scene.add(body);

		var headGeom = new THREE.BoxGeometry(10, 10, 15);
		var head = new THREE.Mesh(headGeom, bodyMat);
		head.position.set(-50, 37, 18);
		head.castShadow = true;
		scene.add(head);

		for (var i = 0; i < 3; i++) {
			var hornGeom = new THREE.ConeGeometry(1.5, 8, 8);
			var hornMat = new THREE.MeshStandardMaterial({
				color: 0xB8860B,
				metalness: 0.8,
				roughness: 0.2
			});
			var horn = new THREE.Mesh(hornGeom, hornMat);
			horn.position.set(-50 - 4 + i * 4, 46, 20);
			horn.rotation.z = Math.PI / 6;
			horn.castShadow = true;
			scene.add(horn);
		}

		for (var j = 0; j < 8; j++) {
			var spineGeom = new THREE.ConeGeometry(1.2, 6, 8);
			var spineMat = new THREE.MeshStandardMaterial({
				color: 0xA9A9A9,
				metalness: 0.6
			});
			var spine = new THREE.Mesh(spineGeom, spineMat);
			spine.position.set(-50, 34 - j, -10 + j * 2.5);
			spine.rotation.z = Math.PI / 4;
			spine.castShadow = true;
			scene.add(spine);
		}
	}

	function createWindSpirits() {
		for (var i = 0; i < 12; i++) {
			var spiritGeom = new THREE.SphereGeometry(0.8, 8, 8);
			var spiritMat = new THREE.MeshBasicMaterial({
				color: 0xFFFFFF,
				transparent: true,
				opacity: 0.6
			});
			var spirit = new THREE.Mesh(spiritGeom, spiritMat);

			var angle = (i / 12) * Math.PI * 2;
			var radius = 35 + Math.random() * 15;
			spirit.position.set(
				Math.cos(angle) * radius,
				40 + Math.random() * 30,
				Math.sin(angle) * radius
			);

			spirit.orbitRadius = radius;
			spirit.orbitAngle = angle;
			spirit.orbitSpeed = 0.2 + Math.random() * 0.2;
			spirit.verticalSpeed = 0.3 + Math.random() * 0.2;
			spirit.verticalOffset = Math.random() * Math.PI * 2;
			windSpirits.push(spirit);
			scene.add(spirit);
		}
	}

	function update(delta) {
		timeElapsed += delta;

		cloudMasses.forEach(function(cloud) {
			cloud.driftAngle += cloud.driftSpeed * delta * 0.1;
			var distance = 60 + Math.sin(cloud.driftAngle) * 20;
			cloud.position.x = Math.cos(cloud.driftAngle) * distance;
			cloud.position.z = Math.sin(cloud.driftAngle) * distance;
		});

		floatingPlatforms.forEach(function(platform) {
			platform.position.y = platform.baseY + Math.sin(timeElapsed * platform.bobSpeed) * platform.bobAmount;
		});

		levitatingRings.forEach(function(ring) {
			if (ring.rotationAxis === 'x') {
				ring.rotation.x += ring.rotationSpeed * delta;
			} else {
				ring.rotation.z += ring.rotationSpeed * delta;
			}
		});

		if (artifactGlow) {
			var pulseScale = 0.9 + Math.sin(timeElapsed * 2) * 0.15;
			artifactGlow.scale.set(pulseScale, pulseScale, pulseScale);
			artifactGlow.rotation.y += delta * 0.5;
		}

		windSpirits.forEach(function(spirit) {
			spirit.orbitAngle += spirit.orbitSpeed * delta * 0.2;
			spirit.position.x = Math.cos(spirit.orbitAngle) * spirit.orbitRadius;
			spirit.position.y = 40 + Math.sin(timeElapsed * spirit.verticalSpeed + spirit.verticalOffset) * 15;
			spirit.position.z = Math.sin(spirit.orbitAngle) * spirit.orbitRadius;
		});

		trapTiles.forEach(function(tile) {
			if (tile.activated) {
				tile.activationTime += delta;
				if (tile.activationTime > 2) {
					tile.activated = false;
					tile.activationTime = 0;
				}
			}
		});
	}

	function reset() {
		timeElapsed = 0;
		trapTiles.forEach(function(tile) {
			tile.activated = false;
			tile.activationTime = 0;
		});
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
