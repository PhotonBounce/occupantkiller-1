window.IceTower = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var envGroup = null;
	var particleSystem = null;
	var auroraLights = [];
	var crystalGlints = [];
	var time = 0;
	var stairIndex = 0;

	var COLOR_ICE_BLUE = 0x4A90E2;
	var COLOR_SNOW_WHITE = 0xF0F0F0;
	var COLOR_MILITARY_ORANGE = 0xFF8C42;
	var COLOR_DARK_ICE = 0x1E3A5F;
	var COLOR_AURORA_GREEN = 0x00FF7F;
	var COLOR_AURORA_PURPLE = 0x9D00FF;

	var TOWER_RADIUS = 8;
	var TOWER_HEIGHT = 55;
	var PLATFORM_HEIGHT = 10;
	var BASE_CAMP_SIZE = 80;

	function createTowerBase() {
		var baseGroup = new THREE.Group();

		var baseGeom = new THREE.CylinderGeometry(TOWER_RADIUS + 1.5, TOWER_RADIUS + 2, 3, 32);
		var baseMat = new THREE.MeshStandardMaterial({ color: COLOR_DARK_ICE, metalness: 0.6, roughness: 0.2 });
		var baseMesh = new THREE.Mesh(baseGeom, baseMat);
		baseMesh.position.y = 1.5;
		baseMesh.castShadow = true;
		baseMesh.receiveShadow = true;
		baseGroup.add(baseMesh);

		var crevasseGeom = new THREE.BoxGeometry(3, 2, 0.5);
		var crevasseMat = new THREE.MeshStandardMaterial({ color: 0x1A2A4A, metalness: 0.4, roughness: 0.3 });
		for (var i = 0; i < 4; i++) {
			var angle = (i / 4) * Math.PI * 2;
			var crevasseMesh = new THREE.Mesh(crevasseGeom, crevasseMat);
			crevasseMesh.position.set(Math.cos(angle) * (TOWER_RADIUS + 3), 0.3, Math.sin(angle) * (TOWER_RADIUS + 3));
			crevasseMesh.rotation.z = 0.2;
			crevasseMesh.castShadow = true;
			crevasseMesh.receiveShadow = true;
			baseGroup.add(crevasseMesh);
		}

		return baseGroup;
	}

	function createMainTowerShaft() {
		var shaftGroup = new THREE.Group();

		var shaftGeom = new THREE.CylinderGeometry(TOWER_RADIUS, TOWER_RADIUS, TOWER_HEIGHT, 32);
		var shaftMat = new THREE.MeshStandardMaterial({
			color: COLOR_ICE_BLUE,
			metalness: 0.7,
			roughness: 0.1,
			emissive: 0x1A3A5F,
			emissiveIntensity: 0.1
		});
		var shaftMesh = new THREE.Mesh(shaftGeom, shaftMat);
		shaftMesh.position.y = TOWER_HEIGHT / 2 + 2;
		shaftMesh.castShadow = true;
		shaftMesh.receiveShadow = true;
		shaftGroup.add(shaftMesh);

		return shaftGroup;
	}

	function createLookoutWindows() {
		var windowGroup = new THREE.Group();

		var windowHeights = [5, 15, 25, 35, 45];
		for (var h = 0; h < windowHeights.length; h++) {
			var height = windowHeights[h];
			for (var w = 0; w < 4; w++) {
				var angle = (w / 4) * Math.PI * 2;
				var windowGeom = new THREE.BoxGeometry(2.5, 2, 0.1);
				var windowMat = new THREE.MeshStandardMaterial({
					color: 0x1A3A5F,
					metalness: 0.8,
					roughness: 0.05,
					emissive: COLOR_AURORA_GREEN,
					emissiveIntensity: 0.2
				});
				var windowMesh = new THREE.Mesh(windowGeom, windowMat);
				windowMesh.position.x = Math.cos(angle) * TOWER_RADIUS;
				windowMesh.position.y = height + 1;
				windowMesh.position.z = Math.sin(angle) * TOWER_RADIUS;
				windowMesh.receiveShadow = true;
				windowGroup.add(windowMesh);
			}
		}

		return windowGroup;
	}

	function createSpiralStaircase() {
		var stairGroup = new THREE.Group();

		var stepCount = 110;
		var radiusIncrease = 0.3;

		for (var s = 0; s < stepCount; s++) {
			var angle = (s / stepCount) * Math.PI * 6;
			var radius = radiusIncrease + (s / stepCount) * (TOWER_RADIUS - radiusIncrease - 0.5);
			var height = (s / stepCount) * TOWER_HEIGHT;

			var stepX = Math.cos(angle) * radius;
			var stepZ = Math.sin(angle) * radius;

			var stepGeom = new THREE.BoxGeometry(0.6, 0.25, 0.6);
			var stepMat = new THREE.MeshStandardMaterial({
				color: COLOR_SNOW_WHITE,
				metalness: 0.5,
				roughness: 0.4
			});
			var stepMesh = new THREE.Mesh(stepGeom, stepMat);
			stepMesh.position.set(stepX, height + 2, stepZ);
			stepMesh.castShadow = true;
			stepMesh.receiveShadow = true;
			stairGroup.add(stepMesh);
		}

		return stairGroup;
	}

	function createPlatforms() {
		var platformGroup = new THREE.Group();

		var platformHeights = [10, 20, 30, 40, 50];
		for (var p = 0; p < platformHeights.length; p++) {
			var platformHeight = platformHeights[p];
			var platformGeom = new THREE.CylinderGeometry(TOWER_RADIUS + 0.3, TOWER_RADIUS + 0.3, 0.5, 32);
			var platformMat = new THREE.MeshStandardMaterial({
				color: COLOR_SNOW_WHITE,
				metalness: 0.6,
				roughness: 0.2
			});
			var platformMesh = new THREE.Mesh(platformGeom, platformMat);
			platformMesh.position.y = platformHeight + 2;
			platformMesh.castShadow = true;
			platformMesh.receiveShadow = true;
			platformGroup.add(platformMesh);

			var railGeom = new THREE.CylinderGeometry(TOWER_RADIUS + 0.6, TOWER_RADIUS + 0.6, 0.3, 32);
			var railMat = new THREE.MeshStandardMaterial({ color: COLOR_MILITARY_ORANGE, metalness: 0.8, roughness: 0.1 });
			var railMesh = new THREE.Mesh(railGeom, railMat);
			railMesh.position.y = platformHeight + 2.5;
			railMesh.scale.set(1, 0.1, 1);
			railMesh.castShadow = true;
			railMesh.receiveShadow = true;
			platformGroup.add(railMesh);
		}

		return platformGroup;
	}

	function createRooftop() {
		var rooftopGroup = new THREE.Group();

		var conicalRoofGeom = new THREE.ConeGeometry(TOWER_RADIUS + 0.2, 4, 32);
		var roofMat = new THREE.MeshStandardMaterial({
			color: COLOR_ICE_BLUE,
			metalness: 0.7,
			roughness: 0.15
		});
		var roofMesh = new THREE.Mesh(conicalRoofGeom, roofMat);
		roofMesh.position.y = TOWER_HEIGHT + 2;
		roofMesh.castShadow = true;
		roofMesh.receiveShadow = true;
		rooftopGroup.add(roofMesh);

		var firingPlatformGeom = new THREE.CylinderGeometry(TOWER_RADIUS - 0.5, TOWER_RADIUS - 0.5, 0.4, 32);
		var firingMat = new THREE.MeshStandardMaterial({
			color: COLOR_SNOW_WHITE,
			metalness: 0.5,
			roughness: 0.3
		});
		var firingPlatform = new THREE.Mesh(firingPlatformGeom, firingMat);
		firingPlatform.position.y = TOWER_HEIGHT + 0.5;
		firingPlatform.castShadow = true;
		firingPlatform.receiveShadow = true;
		rooftopGroup.add(firingPlatform);

		var antennaGeom = new THREE.CylinderGeometry(0.15, 0.15, 3, 16);
		var antennaMat = new THREE.MeshStandardMaterial({ color: COLOR_MILITARY_ORANGE, metalness: 0.9, roughness: 0.05 });
		var antennaMesh = new THREE.Mesh(antennaGeom, antennaMat);
		antennaMesh.position.y = TOWER_HEIGHT + 4.5;
		antennaMesh.castShadow = true;
		rooftopGroup.add(antennaMesh);

		return rooftopGroup;
	}

	function createBaseCamp() {
		var campGroup = new THREE.Group();

		var barracksGeom = new THREE.BoxGeometry(12, 4, 8);
		var barracksMat = new THREE.MeshStandardMaterial({
			color: COLOR_MILITARY_ORANGE,
			metalness: 0.5,
			roughness: 0.4
		});
		var barracksMesh = new THREE.Mesh(barracksGeom, barracksMat);
		barracksMesh.position.set(-20, 2, 15);
		barracksMesh.castShadow = true;
		barracksMesh.receiveShadow = true;
		campGroup.add(barracksMesh);

		var roofGeom = new THREE.ConeGeometry(7, 3, 4);
		var roofMat = new THREE.MeshStandardMaterial({ color: COLOR_ICE_BLUE, metalness: 0.6, roughness: 0.3 });
		var roofMesh = new THREE.Mesh(roofGeom, roofMat);
		roofMesh.position.set(-20, 5, 15);
		roofMesh.castShadow = true;
		campGroup.add(roofMesh);

		var depotGeom = new THREE.BoxGeometry(10, 3, 6);
		var depotMat = new THREE.MeshStandardMaterial({
			color: 0x6B4423,
			metalness: 0.3,
			roughness: 0.5
		});
		var depotMesh = new THREE.Mesh(depotGeom, depotMat);
		depotMesh.position.set(25, 1.5, -20);
		depotMesh.castShadow = true;
		depotMesh.receiveShadow = true;
		campGroup.add(depotMesh);

		var canalGeom = new THREE.CylinderGeometry(0.3, 0.3, 20, 16);
		var canalMat = new THREE.MeshStandardMaterial({ color: COLOR_MILITARY_ORANGE, metalness: 0.7, roughness: 0.2 });
		var canalMesh = new THREE.Mesh(canalGeom, canalMat);
		canalMesh.position.set(-15, 6, 0);
		canalMesh.rotation.z = Math.PI / 2;
		canalMesh.castShadow = true;
		campGroup.add(canalMesh);

		return campGroup;
	}

	function createRadarDish() {
		var radarGroup = new THREE.Group();

		var dishGeom = new THREE.CylinderGeometry(2.5, 2.5, 0.3, 32);
		var dishMat = new THREE.MeshStandardMaterial({
			color: COLOR_MILITARY_ORANGE,
			metalness: 0.85,
			roughness: 0.1
		});
		var dishMesh = new THREE.Mesh(dishGeom, dishMat);
		dishMesh.position.set(0, TOWER_HEIGHT + 5, 0);
		dishMesh.castShadow = true;
		radarGroup.add(dishMesh);

		var poleGeom = new THREE.CylinderGeometry(0.2, 0.2, 3, 16);
		var poleMat = new THREE.MeshStandardMaterial({ color: COLOR_MILITARY_ORANGE, metalness: 0.8, roughness: 0.15 });
		var poleMesh = new THREE.Mesh(poleGeom, poleMat);
		poleMesh.position.set(0, TOWER_HEIGHT + 3.5, 0);
		poleMesh.castShadow = true;
		radarGroup.add(poleMesh);

		return radarGroup;
	}

	function createFrozenTundra() {
		var tundraGroup = new THREE.Group();

		var tundraGeom = new THREE.CylinderGeometry(BASE_CAMP_SIZE / 2, BASE_CAMP_SIZE / 2, 2, 64);
		var tundraMat = new THREE.MeshStandardMaterial({
			color: COLOR_SNOW_WHITE,
			metalness: 0.3,
			roughness: 0.7,
			emissive: 0xE0F0FF,
			emissiveIntensity: 0.15
		});
		var tundraMesh = new THREE.Mesh(tundraGeom, tundraMat);
		tundraMesh.position.y = -0.5;
		tundraMesh.receiveShadow = true;
		tundraGroup.add(tundraMesh);

		return tundraGroup;
	}

	function createCrystalGlints() {
		var glintGroup = new THREE.Group();

		for (var g = 0; g < 30; g++) {
			var posX = (Math.random() - 0.5) * BASE_CAMP_SIZE;
			var posY = 1 + Math.random() * 3;
			var posZ = (Math.random() - 0.5) * BASE_CAMP_SIZE;

			var crystalGeom = new THREE.SphereGeometry(0.15, 8, 8);
			var crystalMat = new THREE.MeshStandardMaterial({
				color: COLOR_SNOW_WHITE,
				metalness: 0.9,
				roughness: 0.05,
				emissive: COLOR_AURORA_GREEN,
				emissiveIntensity: 0.3
			});
			var crystalMesh = new THREE.Mesh(crystalGeom, crystalMat);
			crystalMesh.position.set(posX, posY, posZ);
			crystalMesh.receiveShadow = true;
			glintGroup.add(crystalMesh);

			crystalGlints.push({
				mesh: crystalMesh,
				baseIntensity: 0.3,
				phaseOffset: Math.random() * Math.PI * 2
			});
		}

		return glintGroup;
	}

	function createParticleSnow() {
		var particleCount = 2000;
		var geometry = new THREE.BufferGeometry();

		var positions = new Float32Array(particleCount * 3);
		var velocities = new Float32Array(particleCount * 3);

		for (var p = 0; p < particleCount; p++) {
			positions[p * 3] = (Math.random() - 0.5) * BASE_CAMP_SIZE;
			positions[p * 3 + 1] = Math.random() * 60;
			positions[p * 3 + 2] = (Math.random() - 0.5) * BASE_CAMP_SIZE;

			velocities[p * 3] = (Math.random() - 0.5) * 0.5;
			velocities[p * 3 + 1] = -0.5 - Math.random() * 0.5;
			velocities[p * 3 + 2] = (Math.random() - 0.5) * 0.5;
		}

		geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

		var material = new THREE.PointsMaterial({
			color: COLOR_SNOW_WHITE,
			size: 0.2,
			sizeAttenuation: true,
			transparent: true,
			opacity: 0.7
		});

		var points = new THREE.Points(geometry, material);
		points.userData.velocities = velocities;
		points.userData.particleCount = particleCount;

		return points;
	}

	function createAuroraLights() {
		var auroraGroup = new THREE.Group();

		var light1 = new THREE.PointLight(COLOR_AURORA_GREEN, 0.8, 100);
		light1.position.set(-30, 30, 20);
		light1.castShadow = true;
		auroraGroup.add(light1);
		auroraLights.push({
			light: light1,
			baseColor: COLOR_AURORA_GREEN,
			altColor: COLOR_AURORA_PURPLE,
			phase: 0
		});

		var light2 = new THREE.PointLight(COLOR_AURORA_PURPLE, 0.6, 80);
		light2.position.set(35, 25, -25);
		light2.castShadow = true;
		auroraGroup.add(light2);
		auroraLights.push({
			light: light2,
			baseColor: COLOR_AURORA_PURPLE,
			altColor: COLOR_AURORA_GREEN,
			phase: Math.PI
		});

		var light3 = new THREE.PointLight(COLOR_AURORA_GREEN, 0.7, 90);
		light3.position.set(10, 35, -30);
		light3.castShadow = true;
		auroraGroup.add(light3);
		auroraLights.push({
			light: light3,
			baseColor: COLOR_AURORA_GREEN,
			altColor: COLOR_AURORA_PURPLE,
			phase: Math.PI / 2
		});

		return auroraGroup;
	}

	function createRenderGroup() {
		var fullGroup = new THREE.Group();

		fullGroup.add(createFrozenTundra());
		fullGroup.add(createTowerBase());
		fullGroup.add(createMainTowerShaft());
		fullGroup.add(createSpiralStaircase());
		fullGroup.add(createPlatforms());
		fullGroup.add(createLookoutWindows());
		fullGroup.add(createRooftop());
		fullGroup.add(createRadarDish());
		fullGroup.add(createBaseCamp());
		fullGroup.add(createCrystalGlints());
		fullGroup.add(createParticleSnow());
		fullGroup.add(createAuroraLights());

		return fullGroup;
	}

	function updateParticles(delta) {
		if (!particleSystem) return;

		var positions = particleSystem.geometry.attributes.position.array;
		var velocities = particleSystem.userData.velocities;
		var particleCount = particleSystem.userData.particleCount;

		for (var i = 0; i < particleCount; i++) {
			positions[i * 3] += velocities[i * 3] * delta;
			positions[i * 3 + 1] += velocities[i * 3 + 1] * delta;
			positions[i * 3 + 2] += velocities[i * 3 + 2] * delta;

			if (positions[i * 3 + 1] < -5) {
				positions[i * 3 + 1] = 60;
				positions[i * 3] = (Math.random() - 0.5) * BASE_CAMP_SIZE;
				positions[i * 3 + 2] = (Math.random() - 0.5) * BASE_CAMP_SIZE;
			}

			if (Math.abs(positions[i * 3]) > BASE_CAMP_SIZE / 2) {
				positions[i * 3] = -positions[i * 3];
			}
			if (Math.abs(positions[i * 3 + 2]) > BASE_CAMP_SIZE / 2) {
				positions[i * 3 + 2] = -positions[i * 3 + 2];
			}
		}

		particleSystem.geometry.attributes.position.needsUpdate = true;
	}

	function updateAurora(delta) {
		time += delta;

		for (var a = 0; a < auroraLights.length; a++) {
			var auroraData = auroraLights[a];
			var colorValue = Math.sin(time * 0.5 + auroraData.phase) * 0.5 + 0.5;

			if (colorValue < 0.33) {
				auroraData.light.color.setHex(auroraData.baseColor);
				auroraData.light.intensity = 0.3 + colorValue * 1.5;
			} else if (colorValue < 0.66) {
				var lerpColor = new THREE.Color();
				lerpColor.setHex(auroraData.baseColor);
				lerpColor.lerp(new THREE.Color(auroraData.altColor), (colorValue - 0.33) * 3);
				auroraData.light.color.copy(lerpColor);
				auroraData.light.intensity = 0.5 + (colorValue - 0.33) * 1.5;
			} else {
				auroraData.light.color.setHex(auroraData.altColor);
				auroraData.light.intensity = 0.8 - (colorValue - 0.66) * 1.5;
			}
		}
	}

	function updateCrystals(delta) {
		for (var c = 0; c < crystalGlints.length; c++) {
			var glintData = crystalGlints[c];
			var pulseValue = Math.sin(time * 2 + glintData.phaseOffset) * 0.5 + 0.5;
			glintData.mesh.material.emissiveIntensity = glintData.baseIntensity + pulseValue * 0.5;
		}
	}

	var exported = {
		init: function(initScene, initCamera) {
			scene = initScene;
			camera = initCamera;
			envGroup = createRenderGroup();
			scene.add(envGroup);

			particleSystem = null;
			for (var i = 0; i < envGroup.children.length; i++) {
				if (envGroup.children[i].type === 'Points') {
					particleSystem = envGroup.children[i];
					break;
				}
			}

			auroraLights = [];
			crystalGlints = [];
			time = 0;
			stairIndex = 0;
		},

		update: function(delta) {
			if (!envGroup) return;

			updateParticles(delta);
			updateAurora(delta);
			updateCrystals(delta);

			time += delta;
		},

		reset: function() {
			if (envGroup && scene) {
				scene.remove(envGroup);
			}
			envGroup = null;
			particleSystem = null;
			auroraLights = [];
			crystalGlints = [];
			time = 0;
			stairIndex = 0;
		}
	};

	return exported;
}());
