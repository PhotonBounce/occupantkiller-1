window.CliffVillage = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var objects = [];
	var firePits = [];
	var bridgeSegments = [];
	var dustParticles = [];
	var elapsedTime = 0;
	var particleCount = 0;

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		firePits = [];
		bridgeSegments = [];
		dustParticles = [];
		elapsedTime = 0;
		particleCount = 0;

		// Canyon wall - massive terracotta rock face
		var canyonWall = new THREE.Mesh(
			new THREE.BoxGeometry(120, 150, 40),
			new THREE.MeshPhongMaterial({ color: 0xc1440e, flatShading: true })
		);
		canyonWall.position.set(0, 40, -10);
		canyonWall.castShadow = true;
		scene.add(canyonWall);
		objects.push(canyonWall);

		// Canyon floor - dry riverbed
		var canyonFloor = new THREE.Mesh(
			new THREE.BoxGeometry(120, 8, 80),
			new THREE.MeshPhongMaterial({ color: 0x8b7355 })
		);
		canyonFloor.position.set(0, -60, 0);
		canyonFloor.castShadow = true;
		scene.add(canyonFloor);
		objects.push(canyonFloor);

		// Natural rock ledges - protruding platforms
		var ledgePositions = [
			{ x: -20, y: 20, z: 0, width: 30, depth: 20 },
			{ x: 15, y: -5, z: 0, width: 35, depth: 22 },
			{ x: -25, y: -20, z: 0, width: 28, depth: 18 },
			{ x: 20, y: 35, z: 0, width: 32, depth: 20 }
		];

		for (var i = 0; i < ledgePositions.length; i++) {
			var ledge = new THREE.Mesh(
				new THREE.BoxGeometry(ledgePositions[i].width, 6, ledgePositions[i].depth),
				new THREE.MeshPhongMaterial({ color: 0xa0522d })
			);
			ledge.position.set(ledgePositions[i].x, ledgePositions[i].y, ledgePositions[i].z);
			ledge.castShadow = true;
			scene.add(ledge);
			objects.push(ledge);
		}

		// Cliff dwellings - pueblo-style buildings
		var dwellingConfigs = [
			{ x: -15, y: 25, z: 2, w: 16, h: 14, d: 12 },
			{ x: 10, y: 0, z: 2, w: 18, h: 12, d: 14 },
			{ x: -20, y: -15, z: 2, w: 14, h: 10, d: 10 },
			{ x: 18, y: 40, z: 2, w: 16, h: 13, d: 12 }
		];

		for (var i = 0; i < dwellingConfigs.length; i++) {
			var cfg = dwellingConfigs[i];
			var dwelling = new THREE.Mesh(
				new THREE.BoxGeometry(cfg.w, cfg.h, cfg.d),
				new THREE.MeshPhongMaterial({ color: 0xd4956e })
			);
			dwelling.position.set(cfg.x, cfg.y, cfg.z);
			dwelling.castShadow = true;
			scene.add(dwelling);
			objects.push(dwelling);

			// Add defensive arrow loops to dwelling
			addArrowLoops(dwelling, cfg.w, cfg.h);
		}

		// Grain storage towers - cylindrical structures
		var towerPositions = [
			{ x: -30, y: 15, z: 0 },
			{ x: 25, y: -10, z: 0 },
			{ x: 0, y: 30, z: 0 }
		];

		for (var i = 0; i < towerPositions.length; i++) {
			var tower = new THREE.Mesh(
				new THREE.CylinderGeometry(5, 6, 18, 8),
				new THREE.MeshPhongMaterial({ color: 0xb8860b })
			);
			tower.position.set(towerPositions[i].x, towerPositions[i].y, towerPositions[i].z);
			tower.castShadow = true;
			scene.add(tower);
			objects.push(tower);
		}

		// Ceremonial kiva - underground circular room
		var kiva = new THREE.Mesh(
			new THREE.CylinderGeometry(12, 13, 8, 16),
			new THREE.MeshPhongMaterial({ color: 0x654321 })
		);
		kiva.position.set(-5, -50, 5);
		kiva.castShadow = true;
		scene.add(kiva);
		objects.push(kiva);

		// Ladders between levels
		addLadderSystem(-15, 25, 2, 10);
		addLadderSystem(10, 0, 2, 12);
		addLadderSystem(-20, -15, 2, 8);

		// Rope suspension bridges
		addBridge(-15, 10, 0, 10, 15, 2);
		addBridge(15, 30, 0, 5, 10, 1);

		// Fire pits on ledges
		addFirePit(-15, 21, 4);
		addFirePit(10, -4, 4);
		addFirePit(-20, -19, 4);
		addFirePit(18, 36, 4);

		// Wind erosion arch formations
		addArch(-35, 50, -5, 20, 25, 8);
		addArch(30, 60, -8, 18, 22, 7);

		return true;
	}

	function addArrowLoops(dwelling, width, height) {
		var loopSize = 1.5;
		var loopDepth = 2;
		var halfW = width / 2;
		var halfH = height / 2;

		// Front face arrow loops
		var loop1 = new THREE.Mesh(
			new THREE.BoxGeometry(loopSize, loopSize, loopDepth),
			new THREE.MeshPhongMaterial({ color: 0x444444 })
		);
		loop1.position.set(dwelling.position.x - halfW + 2, dwelling.position.y + halfH - 4, dwelling.position.z + (dwelling.geometry.parameters.depth / 2));
		scene.add(loop1);
		objects.push(loop1);

		var loop2 = new THREE.Mesh(
			new THREE.BoxGeometry(loopSize, loopSize, loopDepth),
			new THREE.MeshPhongMaterial({ color: 0x444444 })
		);
		loop2.position.set(dwelling.position.x + halfW - 2, dwelling.position.y + halfH - 4, dwelling.position.z + (dwelling.geometry.parameters.depth / 2));
		scene.add(loop2);
		objects.push(loop2);
	}

	function addLadderSystem(x, y, z, height) {
		var rungCount = Math.floor(height / 1.5);
		var poleRadius = 0.4;
		var poleSpacing = 2;

		// Left pole
		var leftPole = new THREE.Mesh(
			new THREE.CylinderGeometry(poleRadius, poleRadius, height, 6),
			new THREE.MeshPhongMaterial({ color: 0x8b6914 })
		);
		leftPole.position.set(x - poleSpacing / 2, y - height / 2, z);
		leftPole.castShadow = true;
		scene.add(leftPole);
		objects.push(leftPole);

		// Right pole
		var rightPole = new THREE.Mesh(
			new THREE.CylinderGeometry(poleRadius, poleRadius, height, 6),
			new THREE.MeshPhongMaterial({ color: 0x8b6914 })
		);
		rightPole.position.set(x + poleSpacing / 2, y - height / 2, z);
		rightPole.castShadow = true;
		scene.add(rightPole);
		objects.push(rightPole);

		// Rungs as line segments
		var rungVertices = [];
		for (var i = 0; i < rungCount; i++) {
			var rungY = y + height / 2 - i * 1.5;
			rungVertices.push(new THREE.Vector3(x - poleSpacing / 2, rungY, z));
			rungVertices.push(new THREE.Vector3(x + poleSpacing / 2, rungY, z));
		}

		if (rungVertices.length > 0) {
			var rungGeometry = new THREE.BufferGeometry().setFromPoints(rungVertices);
			var rungLines = new THREE.LineSegments(
				rungGeometry,
				new THREE.LineBasicMaterial({ color: 0x8b6914, linewidth: 2 })
			);
			scene.add(rungLines);
			objects.push(rungLines);
		}
	}

	function addBridge(x1, y1, z1, x2, y2, z2) {
		var cableStart = new THREE.Vector3(x1, y1, z1);
		var cableEnd = new THREE.Vector3(x2, y2, z2);

		// Cable lines
		var cableVertices = [
			new THREE.Vector3(x1, y1 - 2, z1),
			new THREE.Vector3(x2, y2 - 2, z2),
			new THREE.Vector3(x1, y1 - 2, z1),
			new THREE.Vector3(x2, y2 - 2, z2)
		];

		var cableGeometry = new THREE.BufferGeometry().setFromPoints(cableVertices);
		var cables = new THREE.LineSegments(
			cableGeometry,
			new THREE.LineBasicMaterial({ color: 0x8b4513, linewidth: 3 })
		);
		scene.add(cables);
		objects.push(cables);

		// Bridge planks
		var bridgeMidX = (x1 + x2) / 2;
		var bridgeMidY = (y1 + y2) / 2;
		var bridgeLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
		var bridgeAngle = Math.atan2(y2 - y1, x2 - x1);

		var plank = new THREE.Mesh(
			new THREE.BoxGeometry(bridgeLength, 1, 1.5),
			new THREE.MeshPhongMaterial({ color: 0x8b6914 })
		);
		plank.position.set(bridgeMidX, bridgeMidY, z1);
		plank.rotation.z = bridgeAngle;
		plank.castShadow = true;
		scene.add(plank);
		objects.push(plank);

		bridgeSegments.push({
			mesh: plank,
			baseRotation: bridgeAngle
		});
	}

	function addFirePit(x, y, z) {
		// Pit container
		var pit = new THREE.Mesh(
			new THREE.BoxGeometry(4, 1, 4),
			new THREE.MeshPhongMaterial({ color: 0x2a2a2a })
		);
		pit.position.set(x, y, z);
		scene.add(pit);
		objects.push(pit);

		// Embers
		var embers = new THREE.Mesh(
			new THREE.SphereGeometry(1.5, 8, 8),
			new THREE.MeshBasicMaterial({ color: 0xff6600 })
		);
		embers.position.set(x, y + 1, z);
		scene.add(embers);
		objects.push(embers);

		firePits.push({
			embers: embers,
			pit: pit,
			baseIntensity: 1,
			phase: Math.random() * Math.PI * 2
		});
	}

	function addArch(x, y, z, width, height, depth) {
		// Arch formation - combination of boxes to create arch-like shape
		var archCount = 4;
		for (var i = 0; i < archCount; i++) {
			var archX = x - width / 2 + (i * width / archCount) + width / (archCount * 2);
			var archY = y + (Math.sin((i / archCount) * Math.PI) * height * 0.6);

			var archSegment = new THREE.Mesh(
				new THREE.BoxGeometry(width / archCount - 1, 8, depth),
				new THREE.MeshPhongMaterial({ color: 0xb8860b })
			);
			archSegment.position.set(archX, archY, z);
			archSegment.castShadow = true;
			scene.add(archSegment);
			objects.push(archSegment);
		}
	}

	function update(delta) {
		elapsedTime += delta;

		// Animate fire pit glow
		for (var i = 0; i < firePits.length; i++) {
			var fp = firePits[i];
			var glowIntensity = fp.baseIntensity + Math.sin(elapsedTime * 3 + fp.phase) * 0.5;
			fp.embers.material.color.setHex(Math.floor(0xff6600 * (glowIntensity / 1.5)));
			fp.embers.scale.x = 1 + Math.sin(elapsedTime * 2 + fp.phase) * 0.2;
			fp.embers.scale.y = fp.embers.scale.x;
			fp.embers.scale.z = fp.embers.scale.x;
		}

		// Animate rope bridge sway
		for (var i = 0; i < bridgeSegments.length; i++) {
			var bridge = bridgeSegments[i];
			var sway = Math.sin(elapsedTime * 0.8 + i) * 0.15;
			bridge.mesh.rotation.z = bridge.baseRotation + sway;
		}

		// Generate wind-blown dust particles
		if (Math.random() < 0.02) {
			var dustX = (Math.random() - 0.5) * 100;
			var dustY = Math.random() * 80 - 20;
			var dustZ = (Math.random() - 0.5) * 60 - 10;

			var dustParticle = new THREE.Mesh(
				new THREE.SphereGeometry(0.1, 4, 4),
				new THREE.MeshBasicMaterial({ color: 0xd2b48c, transparent: true, opacity: 0.3 })
			);
			dustParticle.position.set(dustX, dustY, dustZ);
			scene.add(dustParticle);

			dustParticles.push({
				mesh: dustParticle,
				velocity: new THREE.Vector3(
					(Math.random() - 0.5) * 2,
					-1,
					(Math.random() - 0.5) * 1
				),
				life: 5
			});
		}

		// Update dust particles
		for (var i = dustParticles.length - 1; i >= 0; i--) {
			var dp = dustParticles[i];
			dp.mesh.position.add(dp.velocity.clone().multiplyScalar(delta));
			dp.life -= delta;
			dp.mesh.material.opacity = (dp.life / 5) * 0.3;

			if (dp.life <= 0) {
				scene.remove(dp.mesh);
				dustParticles.splice(i, 1);
			}
		}
	}

	function reset() {
		while (objects.length > 0) {
			var obj = objects.pop();
			scene.remove(obj);
		}

		while (dustParticles.length > 0) {
			var dp = dustParticles.pop();
			scene.remove(dp.mesh);
		}

		firePits = [];
		bridgeSegments = [];
		elapsedTime = 0;
		particleCount = 0;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
