window.CyberSwamp = (function() {
	'use strict';

	var scene;
	var camera;
	var meshes = [];
	var lights = [];
	var materials = [];
	var lineSegments = [];
	var fiberOpticPulses = [];
	var algaeGeometry;
	var serverFans = [];
	var fanRotations = [];
	var cableGlows = [];

	var TECH_CYAN = 0x00FFFF;
	var SWAMP_GREEN = 0x1A4D2E;
	var DARK_WATER = 0x0A1D1A;
	var CABLE_GLOW = 0x00FF88;
	var ALGAE_GLOW = 0x2DFF00;
	var RUST_BROWN = 0x8B4513;

	function init(_scene, _camera) {
		scene = _scene;
		camera = _camera;
		meshes = [];
		lights = [];
		materials = [];
		lineSegments = [];
		fiberOpticPulses = [];
		serverFans = [];
		fanRotations = [];
		cableGlows = [];

		scene.fog = new THREE.Fog(DARK_WATER, 40, 100);

		createWaterBase();
		createServerPlatforms();
		createCypressTrees();
		createDatacenterBuilding();
		createFiberOpticLines();
		createCoolingPipes();
		createDroneNests();
		createBunkerEntrance();
		createServerStacks();
		createAlgaeBloom();
		createEnvironmentLights();
		createCables();
	}

	function createWaterBase() {
		var waterMat = new THREE.MeshStandardMaterial({
			color: DARK_WATER,
			metalness: 0.6,
			roughness: 0.3,
			emissive: 0x051010
		});
		materials.push(waterMat);

		var waterGeom = new THREE.BoxGeometry(80, 3, 80);
		var waterMesh = new THREE.Mesh(waterGeom, waterMat);
		waterMesh.position.y = -2;
		waterMesh.receiveShadow = true;
		scene.add(waterMesh);
		meshes.push(waterMesh);

		var mudBankGeom = new THREE.BoxGeometry(85, 1, 85);
		var mudMat = new THREE.MeshStandardMaterial({
			color: RUST_BROWN,
			roughness: 0.9
		});
		materials.push(mudMat);
		var mudMesh = new THREE.Mesh(mudBankGeom, mudMat);
		mudMesh.position.y = -2.8;
		mudMesh.receiveShadow = true;
		scene.add(mudMesh);
		meshes.push(mudMesh);
	}

	function createServerPlatforms() {
		var platformHeights = [
			{ x: -20, z: -15, h: 6, w: 14, d: 12 },
			{ x: 15, z: 10, h: 5, w: 12, d: 14 },
			{ x: -10, z: 25, h: 7, w: 16, d: 13 },
			{ x: 25, z: -10, h: 4, w: 11, d: 15 }
		];

		var platformMat = new THREE.MeshStandardMaterial({
			color: 0x333333,
			metalness: 0.8,
			roughness: 0.2
		});
		materials.push(platformMat);

		platformHeights.forEach(function(p) {
			var supportGeom = new THREE.CylinderGeometry(0.8, 1.2, p.h, 6);
			var supportMat = new THREE.MeshStandardMaterial({
				color: RUST_BROWN,
				metalness: 0.4,
				roughness: 0.7
			});
			materials.push(supportMat);

			var supportMesh = new THREE.Mesh(supportGeom, supportMat);
			supportMesh.position.set(p.x, p.h / 2, p.z);
			supportMesh.castShadow = true;
			supportMesh.receiveShadow = true;
			scene.add(supportMesh);
			meshes.push(supportMesh);

			var platformGeom = new THREE.BoxGeometry(p.w, 0.6, p.d);
			var platformMesh = new THREE.Mesh(platformGeom, platformMat);
			platformMesh.position.set(p.x, p.h + 0.3, p.z);
			platformMesh.castShadow = true;
			platformMesh.receiveShadow = true;
			scene.add(platformMesh);
			meshes.push(platformMesh);

			var railGeom = new THREE.BoxGeometry(p.w, 0.4, 0.3);
			var railMat = new THREE.MeshStandardMaterial({
				color: 0x555555,
				metalness: 0.9
			});
			materials.push(railMat);
			var railMesh = new THREE.Mesh(railGeom, railMat);
			railMesh.position.set(p.x, p.h + 0.9, p.z - p.d / 2 - 0.3);
			scene.add(railMesh);
			meshes.push(railMesh);
		});
	}

	function createCypressTrees() {
		var treeSpecs = [
			{ x: -30, z: -25, h: 14 },
			{ x: 35, z: -30, h: 13 },
			{ x: -35, z: 30, h: 15 },
			{ x: 30, z: 25, h: 12 }
		];

		var trunkMat = new THREE.MeshStandardMaterial({
			color: RUST_BROWN,
			roughness: 0.8
		});
		materials.push(trunkMat);

		treeSpecs.forEach(function(t) {
			var trunkGeom = new THREE.CylinderGeometry(1.0, 1.8, t.h, 8);
			var trunkMesh = new THREE.Mesh(trunkGeom, trunkMat);
			trunkMesh.position.set(t.x, t.h / 2, t.z);
			trunkMesh.castShadow = true;
			trunkMesh.receiveShadow = true;
			scene.add(trunkMesh);
			meshes.push(trunkMesh);

			var foliageGeom = new THREE.ConeGeometry(2.8, 5, 8);
			var foliageMat = new THREE.MeshStandardMaterial({
				color: SWAMP_GREEN,
				roughness: 0.7
			});
			materials.push(foliageMat);
			var foliageMesh = new THREE.Mesh(foliageGeom, foliageMat);
			foliageMesh.position.set(t.x, t.h + 2.5, t.z);
			foliageMesh.castShadow = true;
			foliageMesh.receiveShadow = true;
			scene.add(foliageMesh);
			meshes.push(foliageMesh);

			var foliage2Geom = new THREE.ConeGeometry(2.0, 4, 8);
			var foliage2Mat = new THREE.MeshStandardMaterial({
				color: 0x0D3B1F,
				roughness: 0.7
			});
			materials.push(foliage2Mat);
			var foliage2Mesh = new THREE.Mesh(foliage2Geom, foliage2Mat);
			foliage2Mesh.position.set(t.x, t.h + 5.5, t.z);
			foliage2Mesh.castShadow = true;
			foliage2Mesh.receiveShadow = true;
			scene.add(foliage2Mesh);
			meshes.push(foliage2Mesh);
		});
	}

	function createDatacenterBuilding() {
		var buildingMat = new THREE.MeshStandardMaterial({
			color: 0x222222,
			metalness: 0.5,
			roughness: 0.6
		});
		materials.push(buildingMat);

		var mainGeom = new THREE.BoxGeometry(18, 9, 14);
		var mainMesh = new THREE.Mesh(mainGeom, buildingMat);
		mainMesh.position.set(5, 2, -5);
		mainMesh.castShadow = true;
		mainMesh.receiveShadow = true;
		scene.add(mainMesh);
		meshes.push(mainMesh);

		var roofMat = new THREE.MeshStandardMaterial({
			color: 0x111111,
			metalness: 0.6
		});
		materials.push(roofMat);
		var roofGeom = new THREE.BoxGeometry(18.5, 0.8, 14.5);
		var roofMesh = new THREE.Mesh(roofGeom, roofMat);
		roofMesh.position.set(5, 9.8, -5);
		roofMesh.castShadow = true;
		scene.add(roofMesh);
		meshes.push(roofMesh);

		var ventGeom = new THREE.CylinderGeometry(1.2, 1.2, 2, 8);
		var ventMat = new THREE.MeshStandardMaterial({
			color: TECH_CYAN,
			metalness: 0.7,
			emissive: TECH_CYAN,
			emissiveIntensity: 0.3
		});
		materials.push(ventMat);
		var vent1 = new THREE.Mesh(ventGeom, ventMat);
		vent1.position.set(-2, 10.8, -8);
		vent1.castShadow = true;
		scene.add(vent1);
		meshes.push(vent1);

		var vent2 = new THREE.Mesh(ventGeom, ventMat);
		vent2.position.set(8, 10.8, -2);
		vent2.castShadow = true;
		scene.add(vent2);
		meshes.push(vent2);

		var vent3 = new THREE.Mesh(ventGeom, ventMat);
		vent3.position.set(12, 10.8, 3);
		vent3.castShadow = true;
		scene.add(vent3);
		meshes.push(vent3);
	}

	function createServerStacks() {
		var stackPositions = [
			{ x: -20, z: -15, y: 6.5 },
			{ x: 15, z: 10, y: 5.5 },
			{ x: -10, z: 25, y: 7.5 },
			{ x: 25, z: -10, y: 4.5 }
		];

		var rackMat = new THREE.MeshStandardMaterial({
			color: 0x1a1a1a,
			metalness: 0.7,
			roughness: 0.3
		});
		materials.push(rackMat);

		var indicatorMat = new THREE.MeshStandardMaterial({
			color: TECH_CYAN,
			metalness: 0.8,
			emissive: TECH_CYAN,
			emissiveIntensity: 0.5
		});
		materials.push(indicatorMat);

		stackPositions.forEach(function(pos) {
			var rackGeom = new THREE.BoxGeometry(3, 5, 3);
			var rackMesh = new THREE.Mesh(rackGeom, rackMat);
			rackMesh.position.set(pos.x, pos.y, pos.z);
			rackMesh.castShadow = true;
			rackMesh.receiveShadow = true;
			scene.add(rackMesh);
			meshes.push(rackMesh);

			var fanGeom = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 8);
			var fanMesh = new THREE.Mesh(fanGeom, indicatorMat);
			fanMesh.position.set(pos.x, pos.y + 2.5, pos.z);
			fanMesh.castShadow = true;
			scene.add(fanMesh);
			meshes.push(fanMesh);
			serverFans.push(fanMesh);
			fanRotations.push(0);

			for (var i = 0; i < 3; i++) {
				var ledGeom = new THREE.SphereGeometry(0.15, 4, 4);
				var ledMesh = new THREE.Mesh(ledGeom, indicatorMat);
				ledMesh.position.set(pos.x - 1.3, pos.y - 1.5 + i * 1.2, pos.z);
				ledMesh.castShadow = true;
				scene.add(ledMesh);
				meshes.push(ledMesh);
			}
		});
	}

	function createFiberOpticLines() {
		var endpoints = [
			[
				{ x: -20, y: 8, z: -15 },
				{ x: -20, y: 8, z: 25 }
			],
			[
				{ x: 15, y: 7, z: 10 },
				{ x: 5, y: 10, z: -5 }
			],
			[
				{ x: -10, y: 9, z: 25 },
				{ x: -30, y: 12, z: -25 }
			],
			[
				{ x: 25, y: 6, z: -10 },
				{ x: 35, y: 11, z: -30 }
			],
			[
				{ x: 5, y: 10, z: -5 },
				{ x: 25, y: 6, z: -10 }
			]
		];

		var cableMat = new THREE.LineBasicMaterial({
			color: CABLE_GLOW,
			linewidth: 2
		});
		materials.push(cableMat);

		endpoints.forEach(function(ep, idx) {
			var geom = new THREE.BufferGeometry();
			var positions = new Float32Array([
				ep[0].x, ep[0].y, ep[0].z,
				ep[1].x, ep[1].y, ep[1].z
			]);
			geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
			var line = new THREE.LineSegments(geom, cableMat);
			scene.add(line);
			lineSegments.push(line);
			cableGlows.push({
				line: line,
				intensity: 0,
				speed: 0.5 + Math.random() * 0.5,
				offset: Math.random() * Math.PI * 2
			});
		});
	}

	function createCoolingPipes() {
		var pipeRoutes = [
			[
				{ x: -20, y: 3, z: -15 },
				{ x: -20, y: 0.5, z: -15 }
			],
			[
				{ x: 15, y: 2, z: 10 },
				{ x: 15, y: -0.5, z: 10 }
			],
			[
				{ x: -10, y: 4, z: 25 },
				{ x: -10, y: 1, z: 25 }
			],
			[
				{ x: 25, y: 1.5, z: -10 },
				{ x: 25, y: -0.5, z: -10 }
			]
		];

		var pipeMat = new THREE.MeshStandardMaterial({
			color: 0xFF6B35,
			metalness: 0.6,
			roughness: 0.4,
			emissive: 0xFF6B35,
			emissiveIntensity: 0.2
		});
		materials.push(pipeMat);

		pipeRoutes.forEach(function(route) {
			var pipeGeom = new THREE.CylinderGeometry(0.3, 0.3, 3.5, 8);
			var pipeMesh = new THREE.Mesh(pipeGeom, pipeMat);
			var midY = (route[0].y + route[1].y) / 2;
			pipeMesh.position.set(route[0].x, midY, route[0].z);
			pipeMesh.castShadow = true;
			pipeMesh.receiveShadow = true;
			scene.add(pipeMesh);
			meshes.push(pipeMesh);

			var hoseGeom = new THREE.CylinderGeometry(0.25, 0.25, 1.5, 6);
			var hoseMat = new THREE.MeshStandardMaterial({
				color: 0xFF8C42,
				roughness: 0.5
			});
			materials.push(hoseMat);
			var hoseMesh = new THREE.Mesh(hoseGeom, hoseMat);
			hoseMesh.position.set(route[1].x, route[1].y - 0.75, route[1].z);
			hoseMesh.castShadow = true;
			scene.add(hoseMesh);
			meshes.push(hoseMesh);
		});
	}

	function createDroneNests() {
		var nestHeights = [
			{ x: -30, z: -25, h: 12 },
			{ x: 35, z: -30, h: 11 }
		];

		var nestFrameMat = new THREE.MeshStandardMaterial({
			color: 0x333333,
			metalness: 0.6
		});
		materials.push(nestFrameMat);

		var nestLightMat = new THREE.MeshStandardMaterial({
			color: TECH_CYAN,
			metalness: 0.8,
			emissive: TECH_CYAN,
			emissiveIntensity: 0.4
		});
		materials.push(nestLightMat);

		nestHeights.forEach(function(n) {
			var platformGeom = new THREE.BoxGeometry(2.5, 0.4, 2.5);
			var platformMesh = new THREE.Mesh(platformGeom, nestFrameMat);
			platformMesh.position.set(n.x, n.h, n.z);
			platformMesh.castShadow = true;
			scene.add(platformMesh);
			meshes.push(platformMesh);

			for (var i = 0; i < 3; i++) {
				var angle = (i / 3) * Math.PI * 2;
				var dx = Math.cos(angle) * 1.2;
				var dz = Math.sin(angle) * 1.2;

				var emitterGeom = new THREE.SphereGeometry(0.3, 5, 5);
				var emitterMesh = new THREE.Mesh(emitterGeom, nestLightMat);
				emitterMesh.position.set(n.x + dx, n.h + 0.5, n.z + dz);
				emitterMesh.castShadow = true;
				scene.add(emitterMesh);
				meshes.push(emitterMesh);
			}
		});
	}

	function createBunkerEntrance() {
		var bunkerMat = new THREE.MeshStandardMaterial({
			color: 0x1a1a1a,
			metalness: 0.5,
			roughness: 0.7
		});
		materials.push(bunkerMat);

		var doorGeom = new THREE.BoxGeometry(2.5, 3.5, 0.4);
		var doorMesh = new THREE.Mesh(doorGeom, bunkerMat);
		doorMesh.position.set(0, -0.5, -35);
		doorMesh.castShadow = true;
		doorMesh.receiveShadow = true;
		scene.add(doorMesh);
		meshes.push(doorMesh);

		var frameMat = new THREE.MeshStandardMaterial({
			color: TECH_CYAN,
			metalness: 0.8,
			emissive: TECH_CYAN,
			emissiveIntensity: 0.3
		});
		materials.push(frameMat);

		var frameGeom = new THREE.BoxGeometry(3.0, 4.0, 0.2);
		var frameMesh = new THREE.Mesh(frameGeom, frameMat);
		frameMesh.position.set(0, -0.5, -35.2);
		scene.add(frameMesh);
		meshes.push(frameMesh);

		var sealGeom = new THREE.CylinderGeometry(0.15, 0.15, 3.0, 6);
		var sealMat = new THREE.MeshStandardMaterial({
			color: 0xFF00FF,
			metalness: 0.6,
			emissive: 0xFF00FF,
			emissiveIntensity: 0.4
		});
		materials.push(sealMat);
		var sealMesh = new THREE.Mesh(sealGeom, sealMat);
		sealMesh.rotation.z = Math.PI / 2;
		sealMesh.position.set(0, 2.5, -35);
		scene.add(sealMesh);
		meshes.push(sealMesh);
	}

	function createAlgaeBloom() {
		var bloomGeom = new THREE.SphereGeometry(3.5, 8, 8);
		var bloomMat = new THREE.MeshStandardMaterial({
			color: ALGAE_GLOW,
			metalness: 0.2,
			roughness: 0.8,
			emissive: ALGAE_GLOW,
			emissiveIntensity: 0.4,
			transparent: true,
			opacity: 0.7
		});
		materials.push(bloomMat);

		var bloomPositions = [
			{ x: -25, y: -0.5, z: 20 },
			{ x: 20, y: -0.8, z: -20 },
			{ x: 10, y: -0.6, z: 15 }
		];

		bloomPositions.forEach(function(pos) {
			var bloomMesh = new THREE.Mesh(bloomGeom, bloomMat);
			bloomMesh.position.set(pos.x, pos.y, pos.z);
			bloomMesh.scale.set(0.8 + Math.random() * 0.5, 0.6 + Math.random() * 0.4, 0.8 + Math.random() * 0.5);
			bloomMesh.receiveShadow = true;
			scene.add(bloomMesh);
			meshes.push(bloomMesh);
			algaeGeometry = bloomGeom;
		});
	}

	function createEnvironmentLights() {
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
		directionalLight.position.set(40, 30, 40);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		directionalLight.shadow.camera.far = 100;
		directionalLight.shadow.camera.left = -50;
		directionalLight.shadow.camera.right = 50;
		directionalLight.shadow.camera.top = 50;
		directionalLight.shadow.camera.bottom = -50;
		scene.add(directionalLight);
		lights.push(directionalLight);

		var pointLight1 = new THREE.PointLight(TECH_CYAN, 0.8, 25);
		pointLight1.position.set(-20, 12, -15);
		pointLight1.castShadow = true;
		scene.add(pointLight1);
		lights.push(pointLight1);

		var pointLight2 = new THREE.PointLight(CABLE_GLOW, 0.6, 30);
		pointLight2.position.set(15, 10, 10);
		pointLight2.castShadow = true;
		scene.add(pointLight2);
		lights.push(pointLight2);

		var pointLight3 = new THREE.PointLight(ALGAE_GLOW, 0.5, 20);
		pointLight3.position.set(-25, 1, 20);
		scene.add(pointLight3);
		lights.push(pointLight3);

		var hemispherLight = new THREE.HemisphereLight(TECH_CYAN, SWAMP_GREEN, 0.3);
		scene.add(hemispherLight);
		lights.push(hemispherLight);
	}

	function createCables() {
		var cablePositions = [
			[
				{ x: 0, y: 5, z: 0 },
				{ x: 20, y: 8, z: 15 }
			],
			[
				{ x: -15, y: 4, z: -10 },
				{ x: 10, y: 10, z: -5 }
			]
		];

		var cableMat = new THREE.LineBasicMaterial({
			color: 0x00AA88,
			linewidth: 1
		});
		materials.push(cableMat);

		cablePositions.forEach(function(cp) {
			var geom = new THREE.BufferGeometry();
			var positions = new Float32Array([
				cp[0].x, cp[0].y, cp[0].z,
				cp[1].x, cp[1].y, cp[1].z
			]);
			geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
			var cable = new THREE.LineSegments(geom, cableMat);
			scene.add(cable);
			lineSegments.push(cable);
		});
	}

	function updateFiberOptics(delta) {
		cableGlows.forEach(function(glow) {
			glow.offset += glow.speed * delta;
			var pulseValue = Math.sin(glow.offset) * 0.5 + 0.5;
			glow.line.material.opacity = pulseValue;
		});
	}

	function updateServerFans(delta) {
		for (var i = 0; i < serverFans.length; i++) {
			fanRotations[i] += delta * 8;
			serverFans[i].rotation.x = fanRotations[i];
		}
	}

	function updateAlgaePulse(delta) {
		var time = Date.now() * 0.001;
		var pulseScale = 0.8 + Math.sin(time * 1.5) * 0.3;

		meshes.forEach(function(mesh) {
			if (mesh.geometry && mesh.geometry.type === 'SphereGeometry') {
				var dist = Math.abs(mesh.position.z - 20) + Math.abs(mesh.position.x + 25);
				if (dist < 2) {
					mesh.scale.set(pulseScale, pulseScale, pulseScale);
				}
			}
		});
	}

	function update(delta) {
		updateFiberOptics(delta);
		updateServerFans(delta);
		updateAlgaePulse(delta);
	}

	function reset() {
		meshes.forEach(function(mesh) {
			scene.remove(mesh);
		});
		lights.forEach(function(light) {
			scene.remove(light);
		});
		lineSegments.forEach(function(line) {
			scene.remove(line);
		});
		materials.forEach(function(mat) {
			if (mat.dispose) {
				mat.dispose();
			}
		});
		meshes = [];
		lights = [];
		lineSegments = [];
		materials = [];
		serverFans = [];
		fanRotations = [];
		cableGlows = [];
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
