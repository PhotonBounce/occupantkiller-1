window.SewerNetwork = (function() {
	'use strict';

	var scene, camera;
	var waterBlocks = [];
	var driplets = [];
	var flickeringLights = [];
	var time = 0;
	var waterFlowSpeed = 0.5;
	var dripSpeed = 2.0;

	function createMaterial(color, emissive, emissiveIntensity) {
		var mat = new THREE.MeshStandardMaterial({
			color: color,
			emissive: emissive || 0x000000,
			emissiveIntensity: emissiveIntensity || 0,
			roughness: 0.7,
			metalness: 0.1
		});
		return mat;
	}

	function createMainTunnels() {
		var tunnelLength = 100;
		var tunnelRadius = 8;

		// Create arched tunnel effect using BoxGeometry walls
		var concreteGrey = createMaterial(0x4a4a4a);

		// Left wall
		var leftWallGeom = new THREE.BoxGeometry(2, tunnelRadius * 2, tunnelLength);
		var leftWall = new THREE.Mesh(leftWallGeom, concreteGrey);
		leftWall.position.set(-tunnelRadius, 0, 0);
		leftWall.castShadow = true;
		leftWall.receiveShadow = true;
		scene.add(leftWall);

		// Right wall
		var rightWallGeom = new THREE.BoxGeometry(2, tunnelRadius * 2, tunnelLength);
		var rightWall = new THREE.Mesh(rightWallGeom, concreteGrey);
		rightWall.position.set(tunnelRadius, 0, 0);
		rightWall.castShadow = true;
		rightWall.receiveShadow = true;
		scene.add(rightWall);

		// Floor
		var floorGeom = new THREE.BoxGeometry(tunnelRadius * 2 + 4, 1, tunnelLength);
		var floorMat = createMaterial(0x2a2a2a);
		var floor = new THREE.Mesh(floorGeom, floorMat);
		floor.position.set(0, -tunnelRadius - 0.5, 0);
		floor.castShadow = true;
		floor.receiveShadow = true;
		scene.add(floor);

		// Ceiling
		var ceilingGeom = new THREE.BoxGeometry(tunnelRadius * 2 + 4, 1, tunnelLength);
		var ceiling = new THREE.Mesh(ceilingGeom, concreteGrey);
		ceiling.position.set(0, tunnelRadius + 0.5, 0);
		ceiling.castShadow = true;
		ceiling.receiveShadow = true;
		scene.add(ceiling);

		// Curved ceiling with CylinderGeometry
		var curvedCeilingGeom = new THREE.CylinderGeometry(tunnelRadius, tunnelRadius, tunnelLength, 16, 1, true);
		var curvedCeiling = new THREE.Mesh(curvedCeilingGeom, concreteGrey);
		curvedCeiling.rotation.z = Math.PI / 2;
		curvedCeiling.position.set(0, tunnelRadius * 0.5, 0);
		curvedCeiling.castShadow = true;
		curvedCeiling.receiveShadow = true;
		scene.add(curvedCeiling);
	}

	function createToxicWaterChannel() {
		var waterLength = 100;
		var waterWidth = 4;
		var waterHeight = 2;

		var waterMat = createMaterial(0x1a3a2a);

		for (var i = 0; i < 5; i++) {
			var blockGeom = new THREE.BoxGeometry(waterWidth, waterHeight, waterLength / 5);
			var waterBlock = new THREE.Mesh(blockGeom, waterMat);
			waterBlock.position.set(0, -6, (i - 2) * (waterLength / 5));
			waterBlock.receiveShadow = true;
			scene.add(waterBlock);
			waterBlocks.push({
				mesh: waterBlock,
				baseZ: waterBlock.position.z,
				index: i
			});
		}
	}

	function createMaintenanceCatwalks() {
		var catkalkMat = createMaterial(0x6b6b6b);
		var catkalkLength = 100;

		// Left catwalk
		var leftCatkalkGeom = new THREE.BoxGeometry(2, 0.5, catkalkLength);
		var leftCatwalk = new THREE.Mesh(leftCatkalkGeom, catkalkMat);
		leftCatwalk.position.set(-5, -2, 0);
		leftCatwalk.castShadow = true;
		leftCatwalk.receiveShadow = true;
		scene.add(leftCatwalk);

		// Right catwalk
		var rightCatkalkGeom = new THREE.BoxGeometry(2, 0.5, catkalkLength);
		var rightCatwalk = new THREE.Mesh(rightCatkalkGeom, catkalkMat);
		rightCatwalk.position.set(5, -2, 0);
		rightCatwalk.castShadow = true;
		rightCatwalk.receiveShadow = true;
		scene.add(rightCatwalk);

		// Handrails using LineSegments
		var railMat = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 2 });

		// Left handrail
		var leftRailGeom = new THREE.BufferGeometry();
		var leftRailPoints = [];
		for (var i = 0; i < catkalkLength; i += 5) {
			leftRailPoints.push(-6, -1.5, -50 + i);
			leftRailPoints.push(-6, -0.5, -50 + i);
		}
		leftRailGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(leftRailPoints), 3));
		var leftRail = new THREE.LineSegments(leftRailGeom, railMat);
		scene.add(leftRail);

		// Right handrail
		var rightRailGeom = new THREE.BufferGeometry();
		var rightRailPoints = [];
		for (var i = 0; i < catkalkLength; i += 5) {
			rightRailPoints.push(6, -1.5, -50 + i);
			rightRailPoints.push(6, -0.5, -50 + i);
		}
		rightRailGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(rightRailPoints), 3));
		var rightRail = new THREE.LineSegments(rightRailGeom, railMat);
		scene.add(rightRail);
	}

	function createLadderShafts() {
		var ladderMat = createMaterial(0x8a8a8a);
		var shaftRadius = 1.5;
		var shaftHeight = 20;

		// Ladder shaft 1
		var shaft1Geom = new THREE.CylinderGeometry(shaftRadius, shaftRadius, shaftHeight, 8);
		var shaft1 = new THREE.Mesh(shaft1Geom, ladderMat);
		shaft1.position.set(-15, 5, 30);
		shaft1.castShadow = true;
		shaft1.receiveShadow = true;
		scene.add(shaft1);

		createLadderRungs(-15, -5, 30, shaftHeight);

		// Ladder shaft 2
		var shaft2Geom = new THREE.CylinderGeometry(shaftRadius, shaftRadius, shaftHeight, 8);
		var shaft2 = new THREE.Mesh(shaft2Geom, ladderMat);
		shaft2.position.set(15, 5, -30);
		shaft2.castShadow = true;
		shaft2.receiveShadow = true;
		scene.add(shaft2);

		createLadderRungs(15, -5, -30, shaftHeight);
	}

	function createLadderRungs(x, startY, z, height) {
		var railMat = new THREE.LineBasicMaterial({ color: 0xaaaaaa, linewidth: 1 });
		var rungGeom = new THREE.BufferGeometry();
		var rungPoints = [];

		for (var i = 0; i < height; i += 2) {
			rungPoints.push(x - 1, startY + i, z);
			rungPoints.push(x + 1, startY + i, z);
		}

		rungGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(rungPoints), 3));
		var rungs = new THREE.LineSegments(rungGeom, railMat);
		scene.add(rungs);
	}

	function createJunctionChamber() {
		var chamberMat = createMaterial(0x3a3a3a);
		var chamberSize = 20;
		var chamberHeight = 15;

		var chamberGeom = new THREE.BoxGeometry(chamberSize, chamberHeight, chamberSize);
		var chamber = new THREE.Mesh(chamberGeom, chamberMat);
		chamber.position.set(0, 0, -50);
		chamber.castShadow = true;
		chamber.receiveShadow = true;
		scene.add(chamber);

		// Grating floor using LineSegments
		var gratingMat = new THREE.LineBasicMaterial({ color: 0x555555, linewidth: 1 });
		var gratingGeom = new THREE.BufferGeometry();
		var gratingPoints = [];

		for (var i = -10; i <= 10; i += 2) {
			gratingPoints.push(-10, -7.5, -50 + i);
			gratingPoints.push(10, -7.5, -50 + i);
		}
		for (var i = -10; i <= 10; i += 2) {
			gratingPoints.push(-10 + i, -7.5, -50 - 10);
			gratingPoints.push(-10 + i, -7.5, -50 + 10);
		}

		gratingGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(gratingPoints), 3));
		var grating = new THREE.LineSegments(gratingGeom, gratingMat);
		scene.add(grating);
	}

	function createMossAndSlime() {
		var mossMatA = createMaterial(0x2d5a3d);
		var mossMatB = createMaterial(0x1f3d2f);

		// Slime patches on walls at water line
		var slimePositions = [
			{ x: -7.5, y: -5, z: 10 },
			{ x: 7.5, y: -5, z: -20 },
			{ x: -7.5, y: -5, z: -40 },
			{ x: 7.5, y: -5, z: 30 }
		];

		var counter = 0;
		for (var i = 0; i < slimePositions.length; i++) {
			var pos = slimePositions[i];
			var mossGeom = new THREE.BoxGeometry(3, 3, 0.5);
			var mossMat = counter % 2 === 0 ? mossMatA : mossMatB;
			var moss = new THREE.Mesh(mossGeom, mossMat);
			moss.position.set(pos.x, pos.y, pos.z);
			moss.receiveShadow = true;
			scene.add(moss);
			counter++;
		}
	}

	function createEmergencyLighting() {
		var lightPositions = [
			{ x: -6, y: 7, z: -40 },
			{ x: 6, y: 7, z: -20 },
			{ x: 0, y: 7, z: 0 },
			{ x: -6, y: 7, z: 20 },
			{ x: 6, y: 7, z: 40 }
		];

		for (var i = 0; i < lightPositions.length; i++) {
			var pos = lightPositions[i];
			var lightGeom = new THREE.SphereGeometry(0.8, 8, 8);
			var lightMat = createMaterial(0xffff00, 0xffff00, 0.6);
			var lightBulb = new THREE.Mesh(lightGeom, lightMat);
			lightBulb.position.set(pos.x, pos.y, pos.z);
			lightBulb.castShadow = true;
			scene.add(lightBulb);

			flickeringLights.push({
				mesh: lightBulb,
				baseIntensity: 0.6,
				phase: Math.random() * Math.PI * 2
			});
		}
	}

	function createAmbushCorners() {
		var alcoveMat = createMaterial(0x1a1a1a);

		var alcovePositions = [
			{ x: -8, y: -3, z: 15 },
			{ x: 8, y: -3, z: -15 },
			{ x: -8, y: -3, z: -35 },
			{ x: 8, y: -3, z: 35 }
		];

		for (var i = 0; i < alcovePositions.length; i++) {
			var pos = alcovePositions[i];
			var alcoveGeom = new THREE.BoxGeometry(3, 4, 2);
			var alcove = new THREE.Mesh(alcoveGeom, alcoveMat);
			alcove.position.set(pos.x, pos.y, pos.z);
			alcove.receiveShadow = true;
			scene.add(alcove);
		}
	}

	function createPipeClusters() {
		var pipeMat = createMaterial(0x555555);

		var pipeZ = 0;
		for (var row = 0; row < 4; row++) {
			for (var col = 0; col < 3; col++) {
				var pipeGeom = new THREE.CylinderGeometry(0.6, 0.6, 100, 8);
				var pipe = new THREE.Mesh(pipeGeom, pipeMat);
				pipe.rotation.z = Math.PI / 2;
				pipe.position.set(-4 + col * 4, 6 + row * 1.5, 0);
				pipe.castShadow = true;
				pipe.receiveShadow = true;
				scene.add(pipe);
			}
		}
	}

	function createWaterDrips() {
		var dripMat = createMaterial(0x00aa00, 0x00aa00, 0.3);
		var dripPositions = [
			{ x: -5, z: 10 },
			{ x: 0, z: -20 },
			{ x: 5, z: 30 },
			{ x: -3, z: -40 },
			{ x: 3, z: 0 }
		];

		for (var i = 0; i < dripPositions.length; i++) {
			var pos = dripPositions[i];
			var dripGeom = new THREE.SphereGeometry(0.3, 6, 6);
			var drip = new THREE.Mesh(dripGeom, dripMat);
			drip.position.set(pos.x, 8, pos.z);
			drip.castShadow = true;
			scene.add(drip);

			driplets.push({
				mesh: drip,
				baseY: 8,
				startX: pos.x,
				startZ: pos.z,
				phase: Math.random() * Math.PI * 2
			});
		}
	}

	function init(sceneParam, cameraParam) {
		scene = sceneParam;
		camera = cameraParam;
		time = 0;

		// Create sewer environment
		createMainTunnels();
		createToxicWaterChannel();
		createMaintenanceCatwalks();
		createLadderShafts();
		createJunctionChamber();
		createMossAndSlime();
		createEmergencyLighting();
		createAmbushCorners();
		createPipeClusters();
		createWaterDrips();

		// Add ambient light
		var ambientLight = new THREE.AmbientLight(0x404040);
		scene.add(ambientLight);

		// Add directional light for shadows
		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
		directionalLight.position.set(10, 20, 10);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		directionalLight.shadow.camera.far = 100;
		scene.add(directionalLight);
	}

	function update(delta) {
		time += delta;

		// Animate water flow
		for (var i = 0; i < waterBlocks.length; i++) {
			var waterBlock = waterBlocks[i];
			var flowOffset = Math.sin(time * waterFlowSpeed + waterBlock.index) * 0.5;
			waterBlock.mesh.position.z = waterBlock.baseZ + flowOffset;
		}

		// Animate water drips falling
		for (var i = 0; i < driplets.length; i++) {
			var drip = driplets[i];
			var dripCycle = (time * dripSpeed + drip.phase) % (Math.PI * 2);
			var dripOffset = Math.sin(dripCycle) * 8;
			drip.mesh.position.y = drip.baseY - Math.abs(dripOffset);
		}

		// Flicker emergency lights
		for (var i = 0; i < flickeringLights.length; i++) {
			var light = flickeringLights[i];
			var flicker = Math.sin(time * 3 + light.phase) * 0.3 + 0.4;
			var intensity = Math.max(0.1, light.baseIntensity * flicker);
			light.mesh.material.emissiveIntensity = intensity;
		}
	}

	function reset() {
		time = 0;
		for (var i = 0; i < waterBlocks.length; i++) {
			waterBlocks[i].mesh.position.z = waterBlocks[i].baseZ;
		}
		for (var i = 0; i < driplets.length; i++) {
			driplets[i].mesh.position.y = driplets[i].baseY;
		}
	}

	return {
		init: init,
		update: update,
		reset: reset
	};

}());
