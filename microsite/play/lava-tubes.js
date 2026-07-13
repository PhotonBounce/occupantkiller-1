window.LavaTubes = (function() {
	'use strict';

	var scene;
	var camera;
	var objects = [];
	var lavaFlowMaterial;
	var lavaBioMaterial;
	var coolingSystemMaterial;
	var barricadeMaterial;
	var stoneMaterial;
	var metalMaterial;
	var glowTime = 0;
	var lavaParticles = [];
	var MAX_PARTICLES = 50;

	function createMaterials() {
		lavaFlowMaterial = new THREE.MeshStandardMaterial({
			color: 0xff4500,
			emissive: 0xff6b00,
			emissiveIntensity: 0.6,
			metalness: 0.3,
			roughness: 0.4
		});

		lavaBioMaterial = new THREE.MeshStandardMaterial({
			color: 0x00ff88,
			emissive: 0x00ff88,
			emissiveIntensity: 0.5,
			metalness: 0.0,
			roughness: 0.8
		});

		coolingSystemMaterial = new THREE.MeshStandardMaterial({
			color: 0x4da6ff,
			emissive: 0x2d5aa6,
			emissiveIntensity: 0.3,
			metalness: 0.7,
			roughness: 0.2
		});

		barricadeMaterial = new THREE.MeshStandardMaterial({
			color: 0x333333,
			emissive: 0x1a1a1a,
			metalness: 0.8,
			roughness: 0.5
		});

		stoneMaterial = new THREE.MeshStandardMaterial({
			color: 0x8b7355,
			emissive: 0x3d3428,
			metalness: 0.1,
			roughness: 0.9
		});

		metalMaterial = new THREE.MeshStandardMaterial({
			color: 0xc0c0c0,
			emissive: 0x808080,
			metalness: 0.9,
			roughness: 0.3
		});
	}

	function addObject(mesh) {
		scene.add(mesh);
		objects.push(mesh);
	}

	function createTunnelWall(x, z, width, height, depth) {
		var geometry = new THREE.BoxGeometry(width, height, depth);
		var mesh = new THREE.Mesh(geometry, stoneMaterial);
		mesh.position.set(x, height / 2, z);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		addObject(mesh);
		return mesh;
	}

	function createLavaRiver() {
		var geometry = new THREE.BoxGeometry(12, 2, 60);
		var mesh = new THREE.Mesh(geometry, lavaFlowMaterial);
		mesh.position.set(0, 0.8, 0);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		addObject(mesh);
	}

	function createBarricade(x, z) {
		var geometry = new THREE.BoxGeometry(8, 3.5, 0.5);
		var mesh = new THREE.Mesh(geometry, barricadeMaterial);
		mesh.position.set(x, 1.75, z);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		addObject(mesh);

		var supportGeom = new THREE.CylinderGeometry(0.3, 0.4, 3.5, 8);
		var supportMesh = new THREE.Mesh(supportGeom, metalMaterial);
		supportMesh.position.set(x - 3.5, 1.75, z);
		supportMesh.castShadow = true;
		supportMesh.receiveShadow = true;
		addObject(supportMesh);

		var supportMesh2 = new THREE.Mesh(supportGeom, metalMaterial);
		supportMesh2.position.set(x + 3.5, 1.75, z);
		supportMesh2.castShadow = true;
		supportMesh2.receiveShadow = true;
		addObject(supportMesh2);
	}

	function createCoolingPipe(startX, startZ, endX, endZ, height) {
		var dx = endX - startX;
		var dz = endZ - startZ;
		var length = Math.sqrt(dx * dx + dz * dz);

		var geometry = new THREE.CylinderGeometry(0.35, 0.35, length, 12);
		var mesh = new THREE.Mesh(geometry, coolingSystemMaterial);
		mesh.position.set((startX + endX) / 2, height, (startZ + endZ) / 2);
		var angle = Math.atan2(dx, dz);
		mesh.rotation.x = Math.PI / 2;
		mesh.rotation.y = angle;
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		addObject(mesh);
	}

	function createCoolingUnits() {
		var positions = [
			[-35, 20],
			[-25, -25],
			[25, -30],
			[30, 25],
			[-15, 10],
			[15, -15]
		];

		for (var i = 0; i < positions.length; i++) {
			var x = positions[i][0];
			var z = positions[i][1];

			var baseGeom = new THREE.CylinderGeometry(1.2, 1.5, 0.8, 12);
			var baseMesh = new THREE.Mesh(baseGeom, coolingSystemMaterial);
			baseMesh.position.set(x, 0.4, z);
			baseMesh.castShadow = true;
			baseMesh.receiveShadow = true;
			addObject(baseMesh);

			var coreGeom = new THREE.CylinderGeometry(0.8, 0.8, 3.5, 8);
			var coreMesh = new THREE.Mesh(coreGeom, coolingSystemMaterial);
			coreMesh.position.set(x, 2.5, z);
			coreMesh.castShadow = true;
			coreMesh.receiveShadow = true;
			addObject(coreMesh);

			var capGeom = new THREE.SphereGeometry(1.0, 12, 12);
			var capMesh = new THREE.Mesh(capGeom, metalMaterial);
			capMesh.scale.set(1.0, 0.5, 1.0);
			capMesh.position.set(x, 4.2, z);
			capMesh.castShadow = true;
			capMesh.receiveShadow = true;
			addObject(capMesh);
		}
	}

	function createBioLuminescentPatches() {
		var patchPositions = [
			[-30, 5.5, -20],
			[-20, 5.5, 10],
			[0, 5.5, -25],
			[20, 5.5, 15],
			[35, 5.5, -10],
			[-35, 5.5, 30],
			[25, 5.5, 30],
			[-10, 5.5, -35],
			[10, 5.5, 35]
		];

		for (var i = 0; i < patchPositions.length; i++) {
			var pos = patchPositions[i];
			var patchGeom = new THREE.SphereGeometry(2.5, 16, 16);
			var patchMesh = new THREE.Mesh(patchGeom, lavaBioMaterial);
			patchMesh.position.set(pos[0], pos[1], pos[2]);
			patchMesh.scale.set(1.0, 0.6, 1.0);
			patchMesh.castShadow = true;
			patchMesh.receiveShadow = true;
			addObject(patchMesh);
		}
	}

	function createRubblePiles() {
		var rubbleAreas = [
			[-35, -30],
			[35, 35],
			[-25, 35],
			[30, -35]
		];

		for (var i = 0; i < rubbleAreas.length; i++) {
			var x = rubbleAreas[i][0];
			var z = rubbleAreas[i][1];

			for (var j = 0; j < 4; j++) {
				var offsetX = (Math.random() - 0.5) * 6;
				var offsetZ = (Math.random() - 0.5) * 6;
				var randomScale = 0.6 + Math.random() * 0.8;

				var rubbleGeom = new THREE.BoxGeometry(
					2 * randomScale,
					1.5 * randomScale,
					2.5 * randomScale
				);
				var rubbleMesh = new THREE.Mesh(rubbleGeom, stoneMaterial);
				rubbleMesh.position.set(x + offsetX, 1.2, z + offsetZ);
				rubbleMesh.rotation.set(
					Math.random() * Math.PI,
					Math.random() * Math.PI,
					Math.random() * Math.PI
				);
				rubbleMesh.castShadow = true;
				rubbleMesh.receiveShadow = true;
				addObject(rubbleMesh);
			}
		}
	}

	function createCacheRooms() {
		var roomPositions = [
			[-35, 8],
			[35, -8],
			[-20, 28],
			[20, -28]
		];

		for (var i = 0; i < roomPositions.length; i++) {
			var x = roomPositions[i][0];
			var z = roomPositions[i][1];

			var wallGeom = new THREE.BoxGeometry(6, 4, 8);
			var wallMesh = new THREE.Mesh(wallGeom, stoneMaterial);
			wallMesh.position.set(x, 2, z);
			wallMesh.castShadow = true;
			wallMesh.receiveShadow = true;
			addObject(wallMesh);

			var cabinetGeom = new THREE.BoxGeometry(1.5, 3.5, 0.8);
			var cabinetMesh = new THREE.Mesh(cabinetGeom, metalMaterial);
			cabinetMesh.position.set(x - 2, 1.75, z - 3.5);
			cabinetMesh.castShadow = true;
			cabinetMesh.receiveShadow = true;
			addObject(cabinetMesh);

			var cabinet2Mesh = new THREE.Mesh(cabinetGeom, metalMaterial);
			cabinet2Mesh.position.set(x + 2, 1.75, z - 3.5);
			cabinet2Mesh.castShadow = true;
			cabinet2Mesh.receiveShadow = true;
			addObject(cabinet2Mesh);
		}
	}

	function createEmergencyLighting() {
		var lightPositions = [
			[-30, 5, 0],
			[-10, 5, -25],
			[10, 5, 25],
			[30, 5, 0],
			[0, 5, 30],
			[0, 5, -30]
		];

		for (var i = 0; i < lightPositions.length; i++) {
			var pos = lightPositions[i];
			var fixtureGeom = new THREE.CylinderGeometry(0.4, 0.5, 0.6, 8);
			var fixtureMesh = new THREE.Mesh(fixtureGeom, metalMaterial);
			fixtureMesh.position.set(pos[0], pos[1], pos[2]);
			fixtureMesh.castShadow = true;
			fixtureMesh.receiveShadow = true;
			addObject(fixtureMesh);

			var lensGeom = new THREE.SphereGeometry(0.35, 8, 8);
			var lensMesh = new THREE.Mesh(lensGeom, lavaBioMaterial);
			lensMesh.position.set(pos[0], pos[1] + 0.35, pos[2]);
			lensMesh.castShadow = true;
			lensMesh.receiveShadow = true;
			addObject(lensMesh);
		}
	}

	function createTunnelStructure() {
		createTunnelWall(-40, 0, 2, 6, 80);
		createTunnelWall(40, 0, 2, 6, 80);
		createTunnelWall(0, -40, 80, 6, 2);
		createTunnelWall(0, 40, 80, 6, 2);

		var floorGeom = new THREE.BoxGeometry(80, 0.5, 80);
		var floorMesh = new THREE.Mesh(floorGeom, stoneMaterial);
		floorMesh.position.set(0, 0, 0);
		floorMesh.receiveShadow = true;
		addObject(floorMesh);

		var ceilingGeom = new THREE.BoxGeometry(80, 0.8, 80);
		var ceilingMesh = new THREE.Mesh(ceilingGeom, stoneMaterial);
		ceilingMesh.position.set(0, 6, 0);
		ceilingMesh.castShadow = true;
		ceilingMesh.receiveShadow = true;
		addObject(ceilingMesh);
	}

	function createDrippingLavaSetup() {
		var dripPositions = [
			[-25, 5.8, 15],
			[15, 5.8, -20],
			[-10, 5.8, -10],
			[20, 5.8, 20]
		];

		for (var i = 0; i < dripPositions.length; i++) {
			var pos = dripPositions[i];
			var stalactiteGeom = new THREE.ConeGeometry(0.3, 1.5, 8);
			var stalactiteMesh = new THREE.Mesh(stalactiteGeom, lavaFlowMaterial);
			stalactiteMesh.position.set(pos[0], pos[1] - 0.75, pos[2]);
			stalactiteMesh.castShadow = true;
			stalactiteMesh.receiveShadow = true;
			addObject(stalactiteMesh);
		}
	}

	function createParticleEmitter() {
		if (lavaParticles.length >= MAX_PARTICLES) return;

		var x = -30 + Math.random() * 60;
		var z = -30 + Math.random() * 60;
		var y = 1.5 + Math.random() * 2;

		var geom = new THREE.SphereGeometry(0.15, 4, 4);
		var mat = lavaFlowMaterial;
		var particle = new THREE.Mesh(geom, mat);

		particle.position.set(x, y, z);
		particle.velocity = new THREE.Vector3(
			(Math.random() - 0.5) * 3,
			(Math.random() - 0.5) * 2 + 1,
			(Math.random() - 0.5) * 3
		);
		particle.life = 2.0;
		particle.maxLife = 2.0;

		scene.add(particle);
		lavaParticles.push(particle);
	}

	function updateParticles(delta) {
		for (var i = lavaParticles.length - 1; i >= 0; i--) {
			var p = lavaParticles[i];
			p.life -= delta;

			if (p.life <= 0) {
				scene.remove(p);
				lavaParticles.splice(i, 1);
				continue;
			}

			p.position.add(p.velocity.clone().multiplyScalar(delta));
			p.velocity.y -= 9.8 * delta;

			var alphaFactor = p.life / p.maxLife;
			p.material.transparent = true;
			p.material.opacity = alphaFactor;
		}
	}

	function updateLavaGlow() {
		var glowIntensity = 0.4 + Math.sin(glowTime * 2.0) * 0.3;

		lavaFlowMaterial.emissiveIntensity = 0.6 + glowIntensity * 0.4;

		lavaBioMaterial.emissiveIntensity = 0.5 + Math.sin(glowTime * 1.5) * 0.2;

		coolingSystemMaterial.emissiveIntensity = 0.3 + Math.sin(glowTime * 0.8) * 0.15;
	}

	function updateCoolingAnimation() {
		for (var i = 0; i < objects.length; i++) {
			var obj = objects[i];
			if (obj.material === coolingSystemMaterial) {
				obj.rotation.z += 0.02;
			}
		}
	}

	function init(sceneMat, cameraMat) {
		scene = sceneMat;
		camera = cameraMat;

		createMaterials();
		createTunnelStructure();
		createLavaRiver();
		createBarricade(-15, 15);
		createBarricade(15, -15);
		createBarricade(0, 0);
		createCoolingUnits();
		createBioLuminescentPatches();
		createRubblePiles();
		createCacheRooms();
		createEmergencyLighting();
		createDrippingLavaSetup();
		createCoolingPipe(-35, 0, 35, 0, 4.5);
		createCoolingPipe(0, -35, 0, 35, 4.5);

		var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
		scene.add(ambientLight);

		var lavaLight = new THREE.PointLight(0xff6b00, 1.5, 50);
		lavaLight.position.set(0, 1.5, 0);
		lavaLight.castShadow = true;
		scene.add(lavaLight);

		var bioLight = new THREE.PointLight(0x00ff88, 0.8, 40);
		bioLight.position.set(-30, 5.5, -20);
		scene.add(bioLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
		directionalLight.position.set(20, 10, 20);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		scene.add(directionalLight);
	}

	function update(delta) {
		glowTime += delta;

		updateLavaGlow();
		updateCoolingAnimation();

		if (Math.random() < 0.3 * delta) {
			createParticleEmitter();
		}

		updateParticles(delta);

		for (var i = 0; i < objects.length; i++) {
			if (objects[i].material === lavaBioMaterial) {
				objects[i].position.y += Math.sin(glowTime * 2.0 + i) * 0.01;
			}
		}
	}

	function reset() {
		while (objects.length > 0) {
			var obj = objects.pop();
			scene.remove(obj);
		}

		for (var i = lavaParticles.length - 1; i >= 0; i--) {
			scene.remove(lavaParticles[i]);
		}
		lavaParticles = [];

		glowTime = 0;

		init(scene, camera);
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
