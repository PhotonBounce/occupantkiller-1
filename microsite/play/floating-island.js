window.FloatingIsland = (function() {
	'use strict';

	var objects = {
		islands: [],
		bridges: [],
		antiGravBeams: [],
		crystalFormations: [],
		waterfalls: [],
		nexusStructure: null,
		energyCore: null,
		shieldPylons: [],
		antiAirGuns: [],
		guardPosts: [],
		cloudWisps: [],
		lines: []
	};

	var animationState = {
		bobOffsets: [],
		beamPulse: 0,
		coreRotation: 0,
		bridgeSway: [],
		waterfallScroll: 0,
		pylonRotation: 0,
		cloudDrift: 0,
		antiAirAngle: 0
	};

	var spawnPoints = [];

	function createStoneColor() {
		var baseGray = 0x8A8A7A;
		var variance = Math.floor(Math.random() * 0x1F) - 0x0F;
		return baseGray + variance;
	}

	function createFloatingIsland(x, y, z, width, height, depth) {
		var geometry = new THREE.BoxGeometry(width, height, depth);

		var materials = [];
		for (var i = 0; i < 6; i++) {
			var color = createStoneColor();
			materials.push(new THREE.MeshStandardMaterial({
				color: color,
				metalness: 0.3,
				roughness: 0.8
			}));
		}

		var island = new THREE.Mesh(geometry, materials);
		island.position.set(x, y, z);
		island.castShadow = true;
		island.receiveShadow = true;
		island.userData = {
			type: 'island',
			baseY: y,
			bobAmount: Math.random() * 0.3 + 0.2
		};

		animationState.bobOffsets.push(Math.random() * Math.PI * 2);
		return island;
	}

	function createAntiGravBeam(x, y, z, height) {
		var geometry = new THREE.CylinderGeometry(0.6, 0.6, height, 16);
		var material = new THREE.MeshStandardMaterial({
			color: 0x4466FF,
			emissive: 0x2244DD,
			metalness: 0.8,
			roughness: 0.2
		});

		var beam = new THREE.Mesh(geometry, material);
		beam.position.set(x, y, z);
		beam.castShadow = true;
		beam.userData = {
			type: 'antiGravBeam',
			baseIntensity: 1.0
		};

		return beam;
	}

	function createRopeBridge(x1, y1, z1, x2, y2, z2) {
		var bridgeGroup = {
			cables: [],
			planks: []
		};

		var dx = x2 - x1;
		var dz = z2 - z1;
		var length = Math.sqrt(dx * dx + dz * dz);
		var segments = Math.ceil(length / 1.5);

		var cableLeft = new THREE.BufferGeometry();
		var cableRight = new THREE.BufferGeometry();
		var positionsLeft = [];
		var positionsRight = [];

		for (var i = 0; i <= segments; i++) {
			var t = i / segments;
			var xPos = x1 + dx * t;
			var yPos = y1 + (y2 - y1) * t + Math.sin(t * Math.PI) * 0.5;
			var zPos = z1 + dz * t;

			positionsLeft.push(xPos - 0.4, yPos, zPos);
			positionsRight.push(xPos + 0.4, yPos, zPos);
		}

		cableLeft.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positionsLeft), 3));
		cableRight.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positionsRight), 3));

		var lineMaterial = new THREE.LineBasicMaterial({
			color: 0xBB8844,
			linewidth: 2
		});

		var lineLeft = new THREE.LineSegments(cableLeft, lineMaterial);
		var lineRight = new THREE.LineSegments(cableRight, lineMaterial);

		bridgeGroup.cables.push(lineLeft);
		bridgeGroup.cables.push(lineRight);

		for (var p = 0; p < segments; p++) {
			var t = p / segments;
			var xp = x1 + dx * t;
			var yp = y1 + (y2 - y1) * t + Math.sin(t * Math.PI) * 0.5;
			var zp = z1 + dz * t;

			var plankGeo = new THREE.BoxGeometry(0.8, 0.15, 1.5);
			var plankMat = new THREE.MeshStandardMaterial({
				color: 0x6B4423,
				metalness: 0.2,
				roughness: 0.9
			});

			var plank = new THREE.Mesh(plankGeo, plankMat);
			plank.position.set(xp, yp, zp);
			plank.rotation.y = Math.atan2(dz, dx);
			plank.castShadow = true;
			plank.receiveShadow = true;
			plank.userData = { type: 'bridgePlank' };

			bridgeGroup.planks.push(plank);
		}

		bridgeGroup.userData = {
			type: 'bridge',
			swayAmount: 0.15
		};

		return bridgeGroup;
	}

	function createCrystalFormation(x, y, z, size) {
		var formationGroup = [];

		for (var i = 0; i < 4; i++) {
			var offsetX = (Math.random() - 0.5) * size;
			var offsetY = Math.random() * size;
			var offsetZ = (Math.random() - 0.5) * size;

			var height = Math.random() * (size * 0.8) + size * 0.4;
			var geometry = new THREE.ConeGeometry(size * 0.2, height, 8);
			var material = new THREE.MeshStandardMaterial({
				color: 0xAA44FF,
				emissive: 0x7722AA,
				metalness: 0.9,
				roughness: 0.1
			});

			var crystal = new THREE.Mesh(geometry, material);
			crystal.position.set(x + offsetX, y + offsetY, z + offsetZ);
			crystal.rotation.z = Math.random() * Math.PI;
			crystal.castShadow = true;
			crystal.receiveShadow = true;
			crystal.userData = { type: 'crystal' };

			formationGroup.push(crystal);
		}

		return formationGroup;
	}

	function createControlNexus(x, y, z) {
		var nexusGroup = {
			base: null,
			core: null,
			pylons: []
		};

		var baseGeo = new THREE.BoxGeometry(3, 2, 3);
		var baseMat = new THREE.MeshStandardMaterial({
			color: 0x1a1a1a,
			metalness: 0.9,
			roughness: 0.3
		});

		var base = new THREE.Mesh(baseGeo, baseMat);
		base.position.set(x, y, z);
		base.castShadow = true;
		base.receiveShadow = true;
		base.userData = { type: 'nexusBase' };

		nexusGroup.base = base;

		var coreGeo = new THREE.SphereGeometry(0.8, 32, 32);
		var coreMat = new THREE.MeshStandardMaterial({
			color: 0x00FFCC,
			emissive: 0x00FFCC,
			metalness: 1.0,
			roughness: 0.0
		});

		var core = new THREE.Mesh(coreGeo, coreMat);
		core.position.set(x, y + 2, z);
		core.castShadow = true;
		core.receiveShadow = true;
		core.userData = { type: 'energyCore' };

		nexusGroup.core = core;

		for (var i = 0; i < 4; i++) {
			var angle = (i / 4) * Math.PI * 2;
			var px = x + Math.cos(angle) * 2.5;
			var pz = z + Math.sin(angle) * 2.5;

			var pylonGeo = new THREE.CylinderGeometry(0.3, 0.4, 2.5, 12);
			var pylonMat = new THREE.MeshStandardMaterial({
				color: 0x00FFCC,
				emissive: 0x0088AA,
				metalness: 0.8,
				roughness: 0.2
			});

			var pylon = new THREE.Mesh(pylonGeo, pylonMat);
			pylon.position.set(px, y + 1.25, pz);
			pylon.castShadow = true;
			pylon.receiveShadow = true;
			pylon.userData = { type: 'nexusPylon' };

			nexusGroup.pylons.push(pylon);
		}

		return nexusGroup;
	}

	function createAntiAirGun(x, y, z) {
		var gunGroup = {
			base: null,
			barrel: null
		};

		var baseGeo = new THREE.CylinderGeometry(0.8, 1.0, 0.5, 16);
		var baseMat = new THREE.MeshStandardMaterial({
			color: 0x333333,
			metalness: 0.7,
			roughness: 0.4
		});

		var base = new THREE.Mesh(baseGeo, baseMat);
		base.position.set(x, y, z);
		base.castShadow = true;
		base.receiveShadow = true;
		base.userData = { type: 'gunBase' };

		gunGroup.base = base;

		var barrelGeo = new THREE.CylinderGeometry(0.2, 0.2, 2.0, 12);
		var barrelMat = new THREE.MeshStandardMaterial({
			color: 0x222222,
			metalness: 0.9,
			roughness: 0.2
		});

		var barrel = new THREE.Mesh(barrelGeo, barrelMat);
		barrel.position.set(x, y + 1.2, z);
		barrel.rotation.z = Math.PI / 6;
		barrel.castShadow = true;
		barrel.userData = { type: 'gunBarrel' };

		gunGroup.barrel = barrel;

		return gunGroup;
	}

	function createShieldPylon(x, y, z) {
		var geometry = new THREE.CylinderGeometry(0.5, 0.6, 3, 16);
		var material = new THREE.MeshStandardMaterial({
			color: 0x4466FF,
			emissive: 0x2244DD,
			metalness: 0.85,
			roughness: 0.25,
			transparent: true,
			opacity: 0.8
		});

		var pylon = new THREE.Mesh(geometry, material);
		pylon.position.set(x, y, z);
		pylon.castShadow = true;
		pylon.userData = {
			type: 'shieldPylon',
			baseRotation: Math.random() * Math.PI * 2
		};

		return pylon;
	}

	function createWaterfall(x, y, z, height) {
		var fallGroup = [];

		for (var i = 0; i < 3; i++) {
			var offsetX = (Math.random() - 0.5) * 1.5;
			var offsetZ = (Math.random() - 0.5) * 1.5;

			var waterGeo = new THREE.CylinderGeometry(0.4, 0.3, height, 12);
			var waterMat = new THREE.MeshStandardMaterial({
				color: 0x88AAFF,
				transparent: true,
				opacity: 0.6,
				metalness: 0.3,
				roughness: 0.7
			});

			var water = new THREE.Mesh(waterGeo, waterMat);
			water.position.set(x + offsetX, y - height / 2, z + offsetZ);
			water.userData = {
				type: 'waterfall',
				baseY: y,
				height: height
			};

			fallGroup.push(water);
		}

		return fallGroup;
	}

	function createCloudWisp(x, y, z) {
		var geometry = new THREE.SphereGeometry(2, 8, 8);
		var material = new THREE.MeshStandardMaterial({
			color: 0xCCDDFF,
			transparent: true,
			opacity: 0.4,
			metalness: 0.0,
			roughness: 1.0
		});

		var cloud = new THREE.Mesh(geometry, material);
		cloud.position.set(x, y, z);
		cloud.scale.set(1.5, 0.8, 1.5);
		cloud.userData = {
			type: 'cloud',
			baseX: x,
			driftAmount: Math.random() * 2 + 1
		};

		return cloud;
	}

	function init(scene, camera) {
		objects.islands = [];
		objects.bridges = [];
		objects.antiGravBeams = [];
		objects.crystalFormations = [];
		objects.waterfalls = [];
		objects.shieldPylons = [];
		objects.antiAirGuns = [];
		objects.guardPosts = [];
		objects.cloudWisps = [];
		objects.lines = [];
		spawnPoints = [];
		animationState.bobOffsets = [];

		var islandConfigs = [
			{ x: 0, y: 10, z: 0, w: 8, h: 2, d: 8, label: 'Central' },
			{ x: -15, y: 15, z: -10, w: 6, h: 1.5, d: 6, label: 'Northeast' },
			{ x: 15, y: 14, z: -12, w: 6, h: 1.5, d: 6, label: 'Northwest' },
			{ x: -18, y: 12, z: 10, w: 5, h: 1.5, d: 5, label: 'Southeast' },
			{ x: 20, y: 13, z: 12, w: 5, h: 1.5, d: 5, label: 'Southwest' },
			{ x: 0, y: 18, z: -25, w: 7, h: 2, d: 7, label: 'Nexus Island' }
		];

		for (var i = 0; i < islandConfigs.length; i++) {
			var config = islandConfigs[i];
			var island = createFloatingIsland(config.x, config.y, config.z, config.w, config.h, config.d);
			objects.islands.push(island);
			scene.add(island);

			spawnPoints.push({
				x: config.x,
				y: config.y + 2,
				z: config.z,
				label: config.label
			});

			var beamHeight = config.y - 5;
			var beam = createAntiGravBeam(config.x, config.y - beamHeight / 2 - 1, config.z, beamHeight);
			objects.antiGravBeams.push(beam);
			scene.add(beam);

			var crystals = createCrystalFormation(config.x + config.w / 2, config.y + config.h / 2, config.z, 1.2);
			for (var c = 0; c < crystals.length; c++) {
				objects.crystalFormations.push(crystals[c]);
				scene.add(crystals[c]);
			}

			if (i < 5) {
				var waterfallX = config.x + (Math.random() - 0.5) * config.w;
				var waterfallZ = config.z + (Math.random() - 0.5) * config.d;
				var waterfall = createWaterfall(waterfallX, config.y - config.h / 2, waterfallZ, 8);
				for (var w = 0; w < waterfall.length; w++) {
					objects.waterfalls.push(waterfall[w]);
					scene.add(waterfall[w]);
				}
			}
		}

		var nexusX = 0;
		var nexusY = 20;
		var nexusZ = -25;
		var nexus = createControlNexus(nexusX, nexusY, nexusZ);
		objects.nexusStructure = nexus;
		scene.add(nexus.base);
		scene.add(nexus.core);
		for (var np = 0; np < nexus.pylons.length; np++) {
			scene.add(nexus.pylons[np]);
		}
		objects.energyCore = nexus.core;

		spawnPoints.push({
			x: nexusX,
			y: nexusY + 4,
			z: nexusZ - 5,
			label: 'Nexus Approach'
		});

		var bridgePairs = [
			{ from: 0, to: 1 },
			{ from: 0, to: 2 },
			{ from: 0, to: 3 },
			{ from: 0, to: 4 },
			{ from: 0, to: 5 }
		];

		for (var b = 0; b < bridgePairs.length; b++) {
			var fromIdx = bridgePairs[b].from;
			var toIdx = bridgePairs[b].to;
			var from = islandConfigs[fromIdx];
			var to = islandConfigs[toIdx];

			var bridge = createRopeBridge(from.x, from.y + 1, from.z, to.x, to.y + 1, to.z);
			objects.bridges.push(bridge);

			for (var cl = 0; cl < bridge.cables.length; cl++) {
				objects.lines.push(bridge.cables[cl]);
				scene.add(bridge.cables[cl]);
			}
			for (var pl = 0; pl < bridge.planks.length; pl++) {
				scene.add(bridge.planks[pl]);

				var midIdx = Math.floor(bridge.planks.length / 2);
				if (pl === midIdx) {
					spawnPoints.push({
						x: bridge.planks[pl].position.x,
						y: bridge.planks[pl].position.y + 1,
						z: bridge.planks[pl].position.z,
						label: 'Bridge ' + b
					});
				}
			}
		}

		for (var g = 0; g < 3; g++) {
			var gunAngle = (g / 3) * Math.PI * 2;
			var gunX = 25 * Math.cos(gunAngle);
			var gunZ = 25 * Math.sin(gunAngle);
			var gunY = 20;

			var gun = createAntiAirGun(gunX, gunY, gunZ);
			objects.antiAirGuns.push(gun);
			scene.add(gun.base);
			scene.add(gun.barrel);

			spawnPoints.push({
				x: gunX,
				y: gunY + 2,
				z: gunZ,
				label: 'AA Gun ' + g
			});
		}

		for (var s = 0; s < 6; s++) {
			var shieldAngle = (s / 6) * Math.PI * 2;
			var shieldX = 30 * Math.cos(shieldAngle);
			var shieldZ = 30 * Math.sin(shieldAngle);
			var shieldY = 15;

			var shield = createShieldPylon(shieldX, shieldY, shieldZ);
			objects.shieldPylons.push(shield);
			scene.add(shield);
		}

		for (var cl2 = 0; cl2 < 8; cl2++) {
			var cloudX = (Math.random() - 0.5) * 60;
			var cloudY = 25 + Math.random() * 20;
			var cloudZ = (Math.random() - 0.5) * 60;

			var cloud = createCloudWisp(cloudX, cloudY, cloudZ);
			objects.cloudWisps.push(cloud);
			scene.add(cloud);
		}

		for (var ag = 0; ag < 4; ag++) {
			var gpostAngle = (ag / 4) * Math.PI * 2;
			var gpostX = islandConfigs[0].x + 12 * Math.cos(gpostAngle);
			var gpostZ = islandConfigs[0].z + 12 * Math.sin(gpostAngle);
			var gpostY = 12;

			var postGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
			var postMat = new THREE.MeshStandardMaterial({
				color: 0x555555,
				metalness: 0.6,
				roughness: 0.5
			});

			var post = new THREE.Mesh(postGeo, postMat);
			post.position.set(gpostX, gpostY, gpostZ);
			post.castShadow = true;
			post.receiveShadow = true;
			post.userData = { type: 'guardPost' };

			objects.guardPosts.push(post);
			scene.add(post);
		}
	}

	function update(delta) {
		if (!delta) delta = 0.016;

		for (var i = 0; i < objects.islands.length; i++) {
			var island = objects.islands[i];
			var offset = animationState.bobOffsets[i];
			var bobAmount = island.userData.bobAmount;
			var bobY = Math.sin(offset + animationState.coreRotation * 0.5) * bobAmount;
			island.position.y = island.userData.baseY + bobY;
		}

		animationState.beamPulse += delta * 2;
		for (var ab = 0; ab < objects.antiGravBeams.length; ab++) {
			var beam = objects.antiGravBeams[ab];
			var pulseIntensity = 0.5 + Math.sin(animationState.beamPulse + ab) * 0.5;
			beam.material.emissiveIntensity = pulseIntensity;
		}

		animationState.coreRotation += delta * 0.8;
		if (objects.energyCore) {
			objects.energyCore.rotation.x += delta * 0.5;
			objects.energyCore.rotation.y += delta * 0.8;
			objects.energyCore.rotation.z += delta * 0.3;

			var coreScale = 0.9 + Math.sin(animationState.coreRotation * 2) * 0.15;
			objects.energyCore.scale.set(coreScale, coreScale, coreScale);
		}

		for (var np2 = 0; np2 < objects.nexusStructure.pylons.length; np2++) {
			var pylon = objects.nexusStructure.pylons[np2];
			pylon.rotation.y = pylon.userData.baseRotation + animationState.coreRotation * 0.6;
		}

		animationState.waterfallScroll += delta * 3;

		animationState.pylonRotation += delta * 1.2;
		for (var sp = 0; sp < objects.shieldPylons.length; sp++) {
			var shieldPylon = objects.shieldPylons[sp];
			shieldPylon.rotation.y = animationState.pylonRotation;
		}

		animationState.cloudDrift += delta * 0.3;
		for (var cw = 0; cw < objects.cloudWisps.length; cw++) {
			var cloud = objects.cloudWisps[cw];
			cloud.position.x = cloud.userData.baseX + Math.sin(animationState.cloudDrift + cw) * cloud.userData.driftAmount;
		}

		animationState.antiAirAngle += delta * 0.5;
		for (var aag = 0; aag < objects.antiAirGuns.length; aag++) {
			var gun = objects.antiAirGuns[aag];
			gun.barrel.rotation.z = Math.PI / 6 + Math.sin(animationState.antiAirAngle + aag * 2) * 0.4;
		}

		for (var gp = 0; gp < objects.guardPosts.length; gp++) {
			var post = objects.guardPosts[gp];
			post.rotation.y += delta * 0.3;
		}
	}

	function reset() {
		for (var i = 0; i < objects.islands.length; i++) {
			objects.islands[i].position.y = objects.islands[i].userData.baseY;
		}

		animationState.beamPulse = 0;
		animationState.coreRotation = 0;
		animationState.waterfallScroll = 0;
		animationState.pylonRotation = 0;
		animationState.cloudDrift = 0;
		animationState.antiAirAngle = 0;

		if (objects.energyCore) {
			objects.energyCore.rotation.set(0, 0, 0);
			objects.energyCore.scale.set(1, 1, 1);
		}
	}

	return {
		init: init,
		update: update,
		reset: reset,
		getSpawnPoints: function() {
			return spawnPoints;
		},
		getObjects: function() {
			return objects;
		}
	};
}());
