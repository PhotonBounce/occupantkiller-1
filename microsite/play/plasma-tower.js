window.PlasmaTower = (function() {
	'use strict';

	var scene;
	var camera;
	var objects = [];
	var dynamicElements = [];
	var pulsePhase = 0;
	var coilRotations = [];
	var energyFieldIntensities = [];

	function init(_scene, _camera) {
		scene = _scene;
		camera = _camera;
		objects = [];
		dynamicElements = [];
		pulsePhase = 0;
		coilRotations = [];
		energyFieldIntensities = [];

		// Ground plane setup (using BoxGeometry for terrain base)
		var terrainGeometry = new THREE.BoxGeometry(80, 1, 80);
		var terrainMaterial = new THREE.MeshStandardMaterial({
			color: 0x1a1a1a,
			roughness: 0.8,
			metalness: 0.2
		});
		var terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
		terrain.position.y = -0.5;
		terrain.receiveShadow = true;
		scene.add(terrain);
		objects.push(terrain);

		// Central Plasma Tower (40 units tall)
		buildPlasmaTower();

		// Discharge Pylons (4 around the tower)
		buildDischargePylons();

		// Security Perimeter with Gun Emplacements
		buildSecurityPerimeter();

		// Blast Shields (cover objects)
		buildBlastShields();

		// Cooling Stations
		buildCoolingStations();

		// Energy Conduits on Ground
		buildEnergyConduits();

		// Maintenance Gantries
		buildMaintenanceGantries();

		// Equipment Pods
		buildEquipmentPods();

		// Emergency Barriers
		buildEmergencyBarriers();

		// Power Distribution Boxes
		buildPowerDistributionBoxes();

		// Sandbag Fortifications
		buildSandbagPositions();

		// Ammunition Storage Structures
		buildAmmoStorage();

		// Observation Towers
		buildObservationTowers();

		// Radar Array on Top Structure
		buildRadarArray();

		// Lighting setup
		setupLighting();

		return {
			objects: objects,
			dynamicElements: dynamicElements
		};
	}

	function buildPlasmaTower() {
		// Main tower base (cylinder for stability)
		var baseGeometry = new THREE.CylinderGeometry(6, 8, 3, 32);
		var baseMaterial = new THREE.MeshStandardMaterial({
			color: 0x333333,
			roughness: 0.6,
			metalness: 0.8
		});
		var base = new THREE.Mesh(baseGeometry, baseMaterial);
		base.position.y = 1.5;
		base.castShadow = true;
		base.receiveShadow = true;
		scene.add(base);
		objects.push(base);

		// Central tower shaft
		var shaftGeometry = new THREE.CylinderGeometry(2.5, 2.5, 38, 16);
		var shaftMaterial = new THREE.MeshStandardMaterial({
			color: 0x0a0a0a,
			roughness: 0.7,
			metalness: 0.9
		});
		var shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
		shaft.position.y = 20;
		shaft.castShadow = true;
		shaft.receiveShadow = true;
		scene.add(shaft);
		objects.push(shaft);

		// Plasma coils - stacked cylinders with energy effect
		var coilCount = 8;
		var coilSpacing = 4.5;
		for (var i = 0; i < coilCount; i++) {
			var coilGeometry = new THREE.CylinderGeometry(4, 4, 0.8, 32);
			var coilMaterial = new THREE.MeshStandardMaterial({
				color: 0x00ff88,
				emissive: 0x00ff88,
				emissiveIntensity: 0.3,
				roughness: 0.3,
				metalness: 0.7
			});
			var coil = new THREE.Mesh(coilGeometry, coilMaterial);
			coil.position.y = 5 + (i * coilSpacing);
			coil.castShadow = true;
			coil.receiveShadow = true;
			scene.add(coil);
			objects.push(coil);
			dynamicElements.push({
				mesh: coil,
				type: 'coil',
				baseY: coil.position.y,
				index: i,
				rotationSpeed: 0.05 + (i * 0.01)
			});
			coilRotations.push(0);
		}

		// Tower top chamber (sphere for dramatic effect)
		var chamberGeometry = new THREE.SphereGeometry(3.5, 32, 32);
		var chamberMaterial = new THREE.MeshStandardMaterial({
			color: 0xff6600,
			emissive: 0xff6600,
			emissiveIntensity: 0.5,
			roughness: 0.2,
			metalness: 0.9
		});
		var chamber = new THREE.Mesh(chamberGeometry, chamberMaterial);
		chamber.position.y = 40;
		chamber.castShadow = true;
		scene.add(chamber);
		objects.push(chamber);
		dynamicElements.push({
			mesh: chamber,
			type: 'chamber',
			baseEmissive: 0xff6600
		});

		// Discharge cone at apex
		var coneGeometry = new THREE.ConeGeometry(2.5, 5, 16);
		var coneMaterial = new THREE.MeshStandardMaterial({
			color: 0xffff00,
			emissive: 0xffff00,
			emissiveIntensity: 0.4,
			roughness: 0.3,
			metalness: 0.8
		});
		var cone = new THREE.Mesh(coneGeometry, coneMaterial);
		cone.position.y = 44;
		cone.castShadow = true;
		scene.add(cone);
		objects.push(cone);
		dynamicElements.push({
			mesh: cone,
			type: 'cone',
			baseEmissive: 0xffff00
		});
	}

	function buildDischargePylons() {
		var positions = [
			{ x: 15, z: 15 },
			{ x: -15, z: 15 },
			{ x: 15, z: -15 },
			{ x: -15, z: -15 }
		];

		positions.forEach(function(pos) {
			// Pylon structure
			var pylonGeometry = new THREE.CylinderGeometry(1.2, 1.5, 20, 16);
			var pylonMaterial = new THREE.MeshStandardMaterial({
				color: 0x444444,
				roughness: 0.7,
				metalness: 0.8
			});
			var pylon = new THREE.Mesh(pylonGeometry, pylonMaterial);
			pylon.position.set(pos.x, 10, pos.z);
			pylon.castShadow = true;
			pylon.receiveShadow = true;
			scene.add(pylon);
			objects.push(pylon);

			// Discharge sphere at top
			var sphereGeometry = new THREE.SphereGeometry(1.5, 16, 16);
			var sphereMaterial = new THREE.MeshStandardMaterial({
				color: 0x0099ff,
				emissive: 0x0099ff,
				emissiveIntensity: 0.3,
				roughness: 0.2,
				metalness: 0.9
			});
			var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
			sphere.position.set(pos.x, 21, pos.z);
			sphere.castShadow = true;
			scene.add(sphere);
			objects.push(sphere);
			dynamicElements.push({
				mesh: sphere,
				type: 'pylonSphere',
				baseEmissive: 0x0099ff
			});

			// Energy lines connecting to tower
			var lineGeometry = new THREE.BufferGeometry();
			var linePositions = new Float32Array([
				pos.x, 20, pos.z,
				0, 15, 0
			]);
			lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
			var lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 2 });
			var line = new THREE.LineSegments(lineGeometry, lineMaterial);
			scene.add(line);
			objects.push(line);
			dynamicElements.push({
				mesh: line,
				type: 'energyLine'
			});
		});
	}

	function buildSecurityPerimeter() {
		// Corner watchtowers
		var corners = [
			{ x: 35, z: 35 },
			{ x: -35, z: 35 },
			{ x: 35, z: -35 },
			{ x: -35, z: -35 }
		];

		corners.forEach(function(corner) {
			// Tower base
			var towerGeometry = new THREE.BoxGeometry(4, 12, 4);
			var towerMaterial = new THREE.MeshStandardMaterial({
				color: 0x666666,
				roughness: 0.8,
				metalness: 0.4
			});
			var tower = new THREE.Mesh(towerGeometry, towerMaterial);
			tower.position.set(corner.x, 6, corner.z);
			tower.castShadow = true;
			tower.receiveShadow = true;
			scene.add(tower);
			objects.push(tower);

			// Gun emplacement platform
			var platformGeometry = new THREE.BoxGeometry(5, 1, 5);
			var platformMaterial = new THREE.MeshStandardMaterial({
				color: 0x555555,
				roughness: 0.7,
				metalness: 0.5
			});
			var platform = new THREE.Mesh(platformGeometry, platformMaterial);
			platform.position.set(corner.x, 13, corner.z);
			platform.castShadow = true;
			platform.receiveShadow = true;
			scene.add(platform);
			objects.push(platform);

			// Gun barrel (cylinder)
			var gunGeometry = new THREE.CylinderGeometry(0.3, 0.4, 8, 12);
			var gunMaterial = new THREE.MeshStandardMaterial({
				color: 0x333333,
				roughness: 0.6,
				metalness: 0.9
			});
			var gun = new THREE.Mesh(gunGeometry, gunMaterial);
			gun.position.set(corner.x, 17, corner.z);
			gun.rotation.z = Math.PI / 6;
			gun.castShadow = true;
			scene.add(gun);
			objects.push(gun);
		});

		// Perimeter fence markers (cylinder posts)
		var fencePositions = [
			{ x: 0, z: 38 },
			{ x: 20, z: 38 },
			{ x: -20, z: 38 },
			{ x: 38, z: 0 },
			{ x: 38, z: 20 },
			{ x: 38, z: -20 },
			{ x: 0, z: -38 },
			{ x: -20, z: -38 },
			{ x: -38, z: 0 },
			{ x: -38, z: 20 },
			{ x: -38, z: -20 }
		];

		fencePositions.forEach(function(fencePos) {
			var postGeometry = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
			var postMaterial = new THREE.MeshStandardMaterial({
				color: 0x777777,
				roughness: 0.7,
				metalness: 0.6
			});
			var post = new THREE.Mesh(postGeometry, postMaterial);
			post.position.set(fencePos.x, 4, fencePos.z);
			post.castShadow = true;
			post.receiveShadow = true;
			scene.add(post);
			objects.push(post);
		});
	}

	function buildBlastShields() {
		// Large protective barriers around the tower base
		var shields = [
			{ x: -10, z: 0, rotation: 0 },
			{ x: 10, z: 0, rotation: 0 },
			{ x: 0, z: -10, rotation: Math.PI / 2 },
			{ x: 0, z: 10, rotation: Math.PI / 2 }
		];

		shields.forEach(function(shield) {
			var shieldGeometry = new THREE.BoxGeometry(3, 6, 10);
			var shieldMaterial = new THREE.MeshStandardMaterial({
				color: 0x1a5c1a,
				roughness: 0.8,
				metalness: 0.3
			});
			var shieldMesh = new THREE.Mesh(shieldGeometry, shieldMaterial);
			shieldMesh.position.set(shield.x, 3, shield.z);
			shieldMesh.rotation.y = shield.rotation;
			shieldMesh.castShadow = true;
			shieldMesh.receiveShadow = true;
			scene.add(shieldMesh);
			objects.push(shieldMesh);
		});
	}

	function buildCoolingStations() {
		var positions = [
			{ x: 20, z: 20 },
			{ x: -20, z: 20 },
			{ x: 20, z: -20 },
			{ x: -20, z: -20 }
		];

		positions.forEach(function(pos) {
			// Cooling unit base
			var baseGeometry = new THREE.BoxGeometry(5, 2, 5);
			var baseMaterial = new THREE.MeshStandardMaterial({
				color: 0x2a4a6a,
				roughness: 0.7,
				metalness: 0.6
			});
			var base = new THREE.Mesh(baseGeometry, baseMaterial);
			base.position.set(pos.x, 1, pos.z);
			base.castShadow = true;
			base.receiveShadow = true;
			scene.add(base);
			objects.push(base);

			// Cooling pipes (cylinders)
			for (var i = 0; i < 4; i++) {
				var pipeGeometry = new THREE.CylinderGeometry(0.4, 0.4, 5, 8);
				var pipeMaterial = new THREE.MeshStandardMaterial({
					color: 0x4a6a8a,
					roughness: 0.6,
					metalness: 0.7
				});
				var pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
				var offsetX = (i % 2 === 0) ? -1.5 : 1.5;
				var offsetZ = (i < 2) ? -1.5 : 1.5;
				pipe.position.set(pos.x + offsetX, 4.5, pos.z + offsetZ);
				pipe.castShadow = true;
				pipe.receiveShadow = true;
				scene.add(pipe);
				objects.push(pipe);
			}

			// Cooling fan (sphere on top)
			var fanGeometry = new THREE.SphereGeometry(1.2, 12, 12);
			var fanMaterial = new THREE.MeshStandardMaterial({
				color: 0x1a8a8a,
				emissive: 0x1a8a8a,
				emissiveIntensity: 0.1,
				roughness: 0.5,
				metalness: 0.8
			});
			var fan = new THREE.Mesh(fanGeometry, fanMaterial);
			fan.position.set(pos.x, 6, pos.z);
			fan.castShadow = true;
			scene.add(fan);
			objects.push(fan);
			dynamicElements.push({
				mesh: fan,
				type: 'coolingFan',
				rotationSpeed: 0.02
			});
		});
	}

	function buildEnergyConduits() {
		// Ground-level energy lines radiating from tower
		var angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];

		angles.forEach(function(angle) {
			var conduitLength = 20;
			var endX = Math.cos(angle) * conduitLength;
			var endZ = Math.sin(angle) * conduitLength;

			// Main conduit line
			var lineGeometry = new THREE.BufferGeometry();
			var linePositions = new Float32Array([
				0, 0.5, 0,
				endX, 0.5, endZ
			]);
			lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
			var lineMaterial = new THREE.LineBasicMaterial({ color: 0xff00ff, linewidth: 3 });
			var line = new THREE.LineSegments(lineGeometry, lineMaterial);
			scene.add(line);
			objects.push(line);
			dynamicElements.push({
				mesh: line,
				type: 'conduit'
			});

			// Conduit support cylinders
			for (var i = 1; i <= 3; i++) {
				var supportGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.5, 8);
				var supportMaterial = new THREE.MeshStandardMaterial({
					color: 0xcc00cc,
					emissive: 0xcc00cc,
					emissiveIntensity: 0.2,
					roughness: 0.4,
					metalness: 0.8
				});
				var support = new THREE.Mesh(supportGeometry, supportMaterial);
				var supportX = Math.cos(angle) * (conduitLength / 4) * i;
				var supportZ = Math.sin(angle) * (conduitLength / 4) * i;
				support.position.set(supportX, 0.25, supportZ);
				support.castShadow = true;
				scene.add(support);
				objects.push(support);
			}
		});
	}

	function buildMaintenanceGantries() {
		// Gantry wrapping around tower mid-section
		var gantryHeight = 15;
		var gantryRadius = 8;

		// Horizontal ring structure
		var ringGeometry = new THREE.CylinderGeometry(gantryRadius, gantryRadius, 1, 32);
		var ringMaterial = new THREE.MeshStandardMaterial({
			color: 0x553333,
			roughness: 0.8,
			metalness: 0.5
		});
		var ring = new THREE.Mesh(ringGeometry, ringMaterial);
		ring.position.y = gantryHeight;
		ring.castShadow = true;
		ring.receiveShadow = true;
		scene.add(ring);
		objects.push(ring);

		// Vertical support beams
		for (var i = 0; i < 8; i++) {
			var angle = (i / 8) * Math.PI * 2;
			var beamX = Math.cos(angle) * gantryRadius;
			var beamZ = Math.sin(angle) * gantryRadius;

			var beamGeometry = new THREE.CylinderGeometry(0.4, 0.4, gantryHeight, 8);
			var beamMaterial = new THREE.MeshStandardMaterial({
				color: 0x774444,
				roughness: 0.7,
				metalness: 0.6
			});
			var beam = new THREE.Mesh(beamGeometry, beamMaterial);
			beam.position.set(beamX, gantryHeight / 2, beamZ);
			beam.castShadow = true;
			beam.receiveShadow = true;
			scene.add(beam);
			objects.push(beam);
		}

		// Gantry walkway segments
		for (var j = 0; j < 4; j++) {
			var angle2 = (j / 4) * Math.PI * 2;
			var walkX = Math.cos(angle2) * gantryRadius;
			var walkZ = Math.sin(angle2) * gantryRadius;
			var nextAngle = ((j + 1) / 4) * Math.PI * 2;
			var nextX = Math.cos(nextAngle) * gantryRadius;
			var nextZ = Math.sin(nextAngle) * gantryRadius;

			var platformGeometry = new THREE.BoxGeometry(
				Math.sqrt(Math.pow(nextX - walkX, 2) + Math.pow(nextZ - walkZ, 2)) + 0.5,
				0.5,
				1.5
			);
			var platformMaterial = new THREE.MeshStandardMaterial({
				color: 0x996666,
				roughness: 0.8,
				metalness: 0.4
			});
			var platform = new THREE.Mesh(platformGeometry, platformMaterial);
			platform.position.set((walkX + nextX) / 2, gantryHeight, (walkZ + nextZ) / 2);
			var atan2 = Math.atan2(nextZ - walkZ, nextX - walkX);
			platform.rotation.y = atan2;
			platform.castShadow = true;
			platform.receiveShadow = true;
			scene.add(platform);
			objects.push(platform);
		}
	}

	function buildEquipmentPods() {
		// Heavy equipment storage pods scattered around
		var podPositions = [
			{ x: -25, z: 0 },
			{ x: 25, z: 0 },
			{ x: 0, z: -25 },
			{ x: 0, z: 25 }
		];

		podPositions.forEach(function(pos) {
			var podGeometry = new THREE.BoxGeometry(4, 4, 6);
			var podMaterial = new THREE.MeshStandardMaterial({
				color: 0x3a3a3a,
				roughness: 0.9,
				metalness: 0.3
			});
			var pod = new THREE.Mesh(podGeometry, podMaterial);
			pod.position.set(pos.x, 2, pos.z);
			pod.castShadow = true;
			pod.receiveShadow = true;
			scene.add(pod);
			objects.push(pod);

			// Pod antenna
			var antennaGeometry = new THREE.CylinderGeometry(0.2, 0.2, 3, 8);
			var antennaMaterial = new THREE.MeshStandardMaterial({
				color: 0x888888,
				roughness: 0.6,
				metalness: 0.8
			});
			var antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
			antenna.position.set(pos.x, 5.5, pos.z);
			antenna.castShadow = true;
			scene.add(antenna);
			objects.push(antenna);
		});
	}

	function buildEmergencyBarriers() {
		// Deployable emergency blast barriers (good cover)
		var barrierPositions = [
			{ x: -30, z: 10 },
			{ x: 30, z: 10 },
			{ x: -30, z: -10 },
			{ x: 30, z: -10 },
			{ x: 10, z: 30 },
			{ x: -10, z: 30 }
		];

		barrierPositions.forEach(function(pos) {
			var barrierGeometry = new THREE.BoxGeometry(8, 4, 1.5);
			var barrierMaterial = new THREE.MeshStandardMaterial({
				color: 0x2a4a2a,
				roughness: 0.9,
				metalness: 0.2
			});
			var barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
			barrier.position.set(pos.x, 2, pos.z);
			barrier.castShadow = true;
			barrier.receiveShadow = true;
			scene.add(barrier);
			objects.push(barrier);
		});
	}

	function buildPowerDistributionBoxes() {
		// Electrical distribution boxes (small cover)
		var boxPositions = [
			{ x: -15, z: -15 },
			{ x: 15, z: -15 },
			{ x: -15, z: 15 },
			{ x: 15, z: 15 },
			{ x: 0, z: 0, offset: 12 }
		];

		boxPositions.forEach(function(pos) {
			var boxGeometry = new THREE.BoxGeometry(2.5, 3, 2.5);
			var boxMaterial = new THREE.MeshStandardMaterial({
				color: 0x1a4a1a,
				roughness: 0.7,
				metalness: 0.5
			});
			var box = new THREE.Mesh(boxGeometry, boxMaterial);
			var x = pos.offset ? pos.x + pos.offset : pos.x;
			var z = pos.offset ? pos.z : pos.z;
			box.position.set(x, 1.5, z);
			box.castShadow = true;
			box.receiveShadow = true;
			scene.add(box);
			objects.push(box);
		});
	}

	function buildSandbagPositions() {
		// Sandbag fortification (using box geometry for stack effect)
		var fortPositions = [
			{ x: -25, z: 25 },
			{ x: 25, z: 25 },
			{ x: -25, z: -25 },
			{ x: 25, z: -25 }
		];

		fortPositions.forEach(function(pos) {
			// Base sandbags
			for (var layer = 0; layer < 3; layer++) {
				for (var i = 0; i < 3; i++) {
					var bagGeometry = new THREE.BoxGeometry(1.5, 0.8, 1.5);
					var bagMaterial = new THREE.MeshStandardMaterial({
						color: 0x6a5a3a,
						roughness: 0.95,
						metalness: 0.1
					});
					var bag = new THREE.Mesh(bagGeometry, bagMaterial);
					bag.position.set(pos.x + (i * 1.8 - 1.8), 0.4 + (layer * 0.9), pos.z);
					bag.castShadow = true;
					bag.receiveShadow = true;
					scene.add(bag);
					objects.push(bag);
				}
			}
		});
	}

	function buildAmmoStorage() {
		// Ammunition and supply storage structures
		var storagePositions = [
			{ x: 32, z: 10 },
			{ x: -32, z: 10 }
		];

		storagePositions.forEach(function(pos) {
			// Storage container
			var containerGeometry = new THREE.BoxGeometry(6, 5, 4);
			var containerMaterial = new THREE.MeshStandardMaterial({
				color: 0x4a4a2a,
				roughness: 0.85,
				metalness: 0.4
			});
			var container = new THREE.Mesh(containerGeometry, containerMaterial);
			container.position.set(pos.x, 2.5, pos.z);
			container.castShadow = true;
			container.receiveShadow = true;
			scene.add(container);
			objects.push(container);

			// Roofing structure
			var roofGeometry = new THREE.CylinderGeometry(3.5, 3.5, 0.8, 32);
			var roofMaterial = new THREE.MeshStandardMaterial({
				color: 0x3a3a1a,
				roughness: 0.8,
				metalness: 0.3
			});
			var roof = new THREE.Mesh(roofGeometry, roofMaterial);
			roof.position.set(pos.x, 5.5, pos.z);
			roof.castShadow = true;
			roof.receiveShadow = true;
			scene.add(roof);
			objects.push(roof);
		});
	}

	function buildObservationTowers() {
		// Mid-height observation structures
		var obsPositions = [
			{ x: 10, z: 30 },
			{ x: -10, z: 30 }
		];

		obsPositions.forEach(function(pos) {
			// Tower structure
			var towerGeometry = new THREE.CylinderGeometry(1.5, 2, 16, 16);
			var towerMaterial = new THREE.MeshStandardMaterial({
				color: 0x555533,
				roughness: 0.75,
				metalness: 0.5
			});
			var tower = new THREE.Mesh(towerGeometry, towerMaterial);
			tower.position.set(pos.x, 8, pos.z);
			tower.castShadow = true;
			tower.receiveShadow = true;
			scene.add(tower);
			objects.push(tower);

			// Observation platform
			var platformGeometry = new THREE.CylinderGeometry(2.5, 2.5, 0.5, 16);
			var platformMaterial = new THREE.MeshStandardMaterial({
				color: 0x666644,
				roughness: 0.7,
				metalness: 0.6
			});
			var platform = new THREE.Mesh(platformGeometry, platformMaterial);
			platform.position.set(pos.x, 16.5, pos.z);
			platform.castShadow = true;
			platform.receiveShadow = true;
			scene.add(platform);
			objects.push(platform);

			// Searchlight
			var lightGeometry = new THREE.CylinderGeometry(0.4, 0.5, 2, 12);
			var lightMaterial = new THREE.MeshStandardMaterial({
				color: 0xffff99,
				emissive: 0xffff99,
				emissiveIntensity: 0.2,
				roughness: 0.4,
				metalness: 0.8
			});
			var light = new THREE.Mesh(lightGeometry, lightMaterial);
			light.position.set(pos.x, 17.5, pos.z);
			light.castShadow = true;
			scene.add(light);
			objects.push(light);
			dynamicElements.push({
				mesh: light,
				type: 'searchlight',
				rotationSpeed: 0.01
			});
		});
	}

	function buildRadarArray() {
		// Radar array on top structure near tower top
		var radarGeometry = new THREE.CylinderGeometry(2, 2, 0.3, 32);
		var radarMaterial = new THREE.MeshStandardMaterial({
			color: 0x006699,
			emissive: 0x006699,
			emissiveIntensity: 0.2,
			roughness: 0.5,
			metalness: 0.8
		});
		var radar = new THREE.Mesh(radarGeometry, radarMaterial);
		radar.position.y = 36;
		radar.castShadow = true;
		scene.add(radar);
		objects.push(radar);
		dynamicElements.push({
			mesh: radar,
			type: 'radar',
			rotationSpeed: 0.03
		});

		// Radar dish mounting
		var mountGeometry = new THREE.CylinderGeometry(0.5, 0.8, 3, 12);
		var mountMaterial = new THREE.MeshStandardMaterial({
			color: 0x333366,
			roughness: 0.7,
			metalness: 0.7
		});
		var mount = new THREE.Mesh(mountGeometry, mountMaterial);
		mount.position.y = 33;
		mount.castShadow = true;
		scene.add(mount);
		objects.push(mount);
	}

	function setupLighting() {
		// Ambient light
		var ambientLight = new THREE.AmbientLight(0x666666, 0.6);
		scene.add(ambientLight);

		// Main directional light
		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(30, 40, 30);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		directionalLight.shadow.camera.left = -60;
		directionalLight.shadow.camera.right = 60;
		directionalLight.shadow.camera.top = 60;
		directionalLight.shadow.camera.bottom = -60;
		directionalLight.shadow.camera.near = 0.5;
		directionalLight.shadow.camera.far = 150;
		scene.add(directionalLight);

		// Plasma energy glow light
		var plasmaLight = new THREE.PointLight(0x00ff88, 0.5, 50);
		plasmaLight.position.set(0, 30, 0);
		scene.add(plasmaLight);

		// Corner accent lights
		var cornerLight1 = new THREE.PointLight(0xff6600, 0.3, 40);
		cornerLight1.position.set(25, 20, 25);
		scene.add(cornerLight1);

		var cornerLight2 = new THREE.PointLight(0x0099ff, 0.3, 40);
		cornerLight2.position.set(-25, 20, -25);
		scene.add(cornerLight2);
	}

	function update(delta) {
		pulsePhase += delta;

		// Update dynamic elements
		for (var i = 0; i < dynamicElements.length; i++) {
			var element = dynamicElements[i];

			if (element.type === 'coil') {
				// Rotating plasma coils
				element.mesh.rotation.z += element.rotationSpeed;
				// Subtle vertical pulse
				var pulse = Math.sin(pulsePhase * 2 + element.index) * 0.2;
				element.mesh.position.y = element.baseY + pulse;
				// Intensity pulse
				element.mesh.material.emissiveIntensity = 0.3 + Math.sin(pulsePhase * 1.5 + element.index) * 0.2;
			}

			if (element.type === 'chamber') {
				// Top chamber pulse and glow
				var chamberIntensity = 0.5 + Math.sin(pulsePhase * 2) * 0.3;
				element.mesh.material.emissiveIntensity = chamberIntensity;
				// Scale pulse
				var scaleAmount = 1 + Math.sin(pulsePhase * 1.5) * 0.1;
				element.mesh.scale.copy(new THREE.Vector3(scaleAmount, scaleAmount, scaleAmount));
			}

			if (element.type === 'cone') {
				// Discharge cone intensity
				var coneIntensity = 0.4 + Math.sin(pulsePhase * 2.5) * 0.3;
				element.mesh.material.emissiveIntensity = coneIntensity;
			}

			if (element.type === 'pylonSphere') {
				// Pylon discharge spheres
				var pylonIntensity = 0.3 + Math.sin(pulsePhase * 1.8) * 0.25;
				element.mesh.material.emissiveIntensity = pylonIntensity;
			}

			if (element.type === 'energyLine') {
				// Energy line opacity pulse
				element.mesh.material.opacity = 0.5 + Math.sin(pulsePhase * 2) * 0.3;
			}

			if (element.type === 'coolingFan') {
				// Cooling fan rotation
				element.mesh.rotation.x += element.rotationSpeed;
			}

			if (element.type === 'conduit') {
				// Ground conduit glow
				element.mesh.material.opacity = 0.4 + Math.sin(pulsePhase * 2) * 0.2;
			}

			if (element.type === 'radar') {
				// Radar rotation
				element.mesh.rotation.z += element.rotationSpeed;
			}

			if (element.type === 'searchlight') {
				// Searchlight rotation
				element.mesh.rotation.y += element.rotationSpeed;
			}
		}
	}

	function reset() {
		// Clear all objects from scene
		for (var i = 0; i < objects.length; i++) {
			scene.remove(objects[i]);
		}
		for (var j = 0; j < dynamicElements.length; j++) {
			var el = dynamicElements[j];
			if (el.mesh && el.mesh.parent) {
				scene.remove(el.mesh);
			}
		}
		objects = [];
		dynamicElements = [];
		coilRotations = [];
		energyFieldIntensities = [];
		pulsePhase = 0;

		// Reinitialize
		init(scene, camera);
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
