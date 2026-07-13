window.SkyPrison = (function() {
	'use strict';

	var scene;
	var camera;
	var objects = [];
	var lights = [];
	var dynamicElements = [];

	// Configuration
	var config = {
		platformWidth: 80,
		platformDepth: 80,
		platformHeight: 4,
		voidColor: 0x1a0033,
		materialColors: {
			concrete: 0x808080,
			metal: 0xa0a0a0,
			warning: 0xff6600,
			electric: 0x00ff00,
			rust: 0x8b4513,
			darkSteel: 0x444444
		}
	};

	// Initialize the scene
	function init(_scene, _camera) {
		scene = _scene;
		camera = _camera;

		// Set scene background to void
		scene.background = new THREE.Color(config.voidColor);
		scene.fog = new THREE.Fog(config.voidColor, 150, 250);

		// Build environment
		buildPlatform();
		buildThrusterColumns();
		buildControlTower();
		buildCellBlocks();
		buildGuardTowers();
		buildHelicopterPads();
		buildPerimeterFencing();
		buildExerciseYard();
		buildGeneratorRoom();
		buildEscapePods();
		buildSupplyDropZones();
		buildUnderbelly();
		buildLighting();

		return true;
	}

	// Platform - main floating structure
	function buildPlatform() {
		var platformGeom = new THREE.BoxGeometry(config.platformWidth, config.platformHeight, config.platformDepth);
		var platformMat = new THREE.MeshPhongMaterial({ color: config.materialColors.concrete });
		var platform = new THREE.Mesh(platformGeom, platformMat);
		platform.position.y = config.platformHeight / 2;
		scene.add(platform);
		objects.push(platform);

		// Platform edges/railings
		var edgeGeom = new THREE.BoxGeometry(config.platformWidth, 1.5, 1);
		var edgeMat = new THREE.MeshPhongMaterial({ color: config.materialColors.darkSteel });

		var north = new THREE.Mesh(edgeGeom, edgeMat);
		north.position.set(0, config.platformHeight + 0.75, -config.platformDepth / 2 + 0.5);
		scene.add(north);
		objects.push(north);

		var south = new THREE.Mesh(edgeGeom, edgeMat);
		south.position.set(0, config.platformHeight + 0.75, config.platformDepth / 2 - 0.5);
		scene.add(south);
		objects.push(south);

		var edgeGeomEW = new THREE.BoxGeometry(1, 1.5, config.platformDepth);
		var east = new THREE.Mesh(edgeGeomEW, edgeMat);
		east.position.set(config.platformWidth / 2 - 0.5, config.platformHeight + 0.75, 0);
		scene.add(east);
		objects.push(east);

		var west = new THREE.Mesh(edgeGeomEW, edgeMat);
		west.position.set(-config.platformWidth / 2 + 0.5, config.platformHeight + 0.75, 0);
		scene.add(west);
		objects.push(west);
	}

	// Thruster columns - vertical support structures
	function buildThrusterColumns() {
		var positions = [
			[-20, 0, -20],
			[20, 0, -20],
			[-20, 0, 20],
			[20, 0, 20]
		];

		positions.forEach(function(pos) {
			// Column cylinder
			var cylinderGeom = new THREE.CylinderGeometry(3, 3.5, config.platformHeight + 10, 16);
			var cylinderMat = new THREE.MeshPhongMaterial({ color: config.materialColors.metal });
			var cylinder = new THREE.Mesh(cylinderGeom, cylinderMat);
			cylinder.position.set(pos[0], (config.platformHeight + 10) / 2, pos[2]);
			scene.add(cylinder);
			objects.push(cylinder);

			// Thruster nozzle
			var nozzleGeom = new THREE.ConeGeometry(2.5, 4, 16);
			var nozzleMat = new THREE.MeshPhongMaterial({ color: config.materialColors.rust });
			var nozzle = new THREE.Mesh(nozzleGeom, nozzleMat);
			nozzle.position.set(pos[0], 1, pos[2]);
			scene.add(nozzle);
			objects.push(nozzle);

			// Add exhaust glow sphere for dynamic effect
			var glowGeom = new THREE.SphereGeometry(2, 8, 8);
			var glowMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.3 });
			var glowSphere = new THREE.Mesh(glowGeom, glowMat);
			glowSphere.position.set(pos[0], 1.5, pos[2]);
			scene.add(glowSphere);
			dynamicElements.push({ type: 'exhaust', object: glowSphere, baseOpacity: 0.3, time: Math.random() * Math.PI * 2 });
		});
	}

	// Central control tower
	function buildControlTower() {
		var baseGeom = new THREE.BoxGeometry(12, 6, 12);
		var baseMat = new THREE.MeshPhongMaterial({ color: config.materialColors.concrete });
		var base = new THREE.Mesh(baseGeom, baseMat);
		base.position.y = config.platformHeight + 3;
		scene.add(base);
		objects.push(base);

		// Tower mid-section
		var midGeom = new THREE.BoxGeometry(10, 8, 10);
		var midMat = new THREE.MeshPhongMaterial({ color: config.materialColors.metal });
		var mid = new THREE.Mesh(midGeom, midMat);
		mid.position.y = config.platformHeight + 11;
		scene.add(mid);
		objects.push(mid);

		// Tower top - observation dome
		var topGeom = new THREE.SphereGeometry(5, 12, 8);
		var topMat = new THREE.MeshPhongMaterial({ color: 0x4da6ff });
		var top = new THREE.Mesh(topGeom, topMat);
		top.position.y = config.platformHeight + 23;
		scene.add(top);
		objects.push(top);

		// Search light emitter on top
		var lightGeom = new THREE.CylinderGeometry(1.5, 1, 2, 8);
		var lightMat = new THREE.MeshPhongMaterial({ color: config.materialColors.warning });
		var lightEmitter = new THREE.Mesh(lightGeom, lightMat);
		lightEmitter.position.set(0, config.platformHeight + 26, 0);
		scene.add(lightEmitter);
		objects.push(lightEmitter);

		dynamicElements.push({ type: 'searchlight', object: lightEmitter, axis: 'y' });
	}

	// Cell blocks - panopticon arrangement
	function buildCellBlocks() {
		var angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
		var distance = 22;

		angles.forEach(function(angle) {
			var x = Math.cos(angle) * distance;
			var z = Math.sin(angle) * distance;

			// Main cell block structure
			var blockGeom = new THREE.BoxGeometry(14, 8, 8);
			var blockMat = new THREE.MeshPhongMaterial({ color: config.materialColors.concrete });
			var block = new THREE.Mesh(blockGeom, blockMat);
			block.position.set(x, config.platformHeight + 4, z);
			scene.add(block);
			objects.push(block);

			// Cell windows as small boxes
			for (var i = 0; i < 4; i++) {
				var windowGeom = new THREE.BoxGeometry(2, 1.5, 0.5);
				var windowMat = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
				var window = new THREE.Mesh(windowGeom, windowMat);
				window.position.set(x - 5 + i * 3.5, config.platformHeight + 6, z + 4.5);
				scene.add(window);
				objects.push(window);
			}

			// Rooftop level
			var roofGeom = new THREE.BoxGeometry(14, 1, 8);
			var roofMat = new THREE.MeshPhongMaterial({ color: config.materialColors.rust });
			var roof = new THREE.Mesh(roofGeom, roofMat);
			roof.position.set(x, config.platformHeight + 9.5, z);
			scene.add(roof);
			objects.push(roof);

			// Antenna tower on roof
			var antennaGeom = new THREE.CylinderGeometry(0.3, 0.4, 6, 6);
			var antennaMat = new THREE.MeshPhongMaterial({ color: config.materialColors.metal });
			var antenna = new THREE.Mesh(antennaGeom, antennaMat);
			antenna.position.set(x, config.platformHeight + 13, z);
			scene.add(antenna);
			objects.push(antenna);
		});
	}

	// Guard towers at corners
	function buildGuardTowers() {
		var corners = [
			[-30, 0, -30],
			[30, 0, -30],
			[-30, 0, 30],
			[30, 0, 30]
		];

		corners.forEach(function(corner) {
			// Tower base
			var baseGeom = new THREE.BoxGeometry(6, 2, 6);
			var baseMat = new THREE.MeshPhongMaterial({ color: config.materialColors.darkSteel });
			var base = new THREE.Mesh(baseGeom, baseMat);
			base.position.set(corner[0], config.platformHeight + 1, corner[2]);
			scene.add(base);
			objects.push(base);

			// Tower column
			var colGeom = new THREE.CylinderGeometry(2, 2.5, 8, 8);
			var colMat = new THREE.MeshPhongMaterial({ color: config.materialColors.metal });
			var col = new THREE.Mesh(colGeom, colMat);
			col.position.set(corner[0], config.platformHeight + 6, corner[2]);
			scene.add(col);
			objects.push(col);

			// Tower top observation platform
			var topGeom = new THREE.BoxGeometry(5, 1, 5);
			var topMat = new THREE.MeshPhongMaterial({ color: config.materialColors.concrete });
			var top = new THREE.Mesh(topGeom, topMat);
			top.position.set(corner[0], config.platformHeight + 11, corner[2]);
			scene.add(top);
			objects.push(top);

			// Rotating guard light
			var lightGeom = new THREE.SphereGeometry(0.8, 8, 8);
			var lightMat = new THREE.MeshPhongMaterial({ color: config.materialColors.warning });
			var guardLight = new THREE.Mesh(lightGeom, lightMat);
			guardLight.position.set(corner[0], config.platformHeight + 12, corner[2]);
			scene.add(guardLight);
			objects.push(guardLight);

			dynamicElements.push({
				type: 'guardlight',
				object: guardLight,
				centerX: corner[0],
				centerZ: corner[2],
				radius: 15,
				speed: 2,
				time: Math.random() * Math.PI * 2
			});
		});
	}

	// Helicopter landing pads
	function buildHelicopterPads() {
		var padPositions = [
			[-25, 0, 5],
			[25, 0, 5]
		];

		padPositions.forEach(function(pos) {
			// Pad surface
			var padGeom = new THREE.CylinderGeometry(8, 8, 0.5, 32);
			var padMat = new THREE.MeshPhongMaterial({ color: 0xffff00 });
			var pad = new THREE.Mesh(padGeom, padMat);
			pad.position.set(pos[0], config.platformHeight + 0.25, pos[2]);
			scene.add(pad);
			objects.push(pad);

			// Control column
			var colGeom = new THREE.CylinderGeometry(0.8, 1, 3, 6);
			var colMat = new THREE.MeshPhongMaterial({ color: config.materialColors.metal });
			var col = new THREE.Mesh(colGeom, colMat);
			col.position.set(pos[0], config.platformHeight + 2, pos[2]);
			scene.add(col);
			objects.push(col);
		});
	}

	// Electrified perimeter fencing - wireframe line segments
	function buildPerimeterFencing() {
		var fenceHeight = 8;
		var fenceColor = config.materialColors.electric;

		// North fence
		var northGeom = new THREE.BoxGeometry(config.platformWidth - 2, fenceHeight, 0.3);
		var northMat = new THREE.MeshPhongMaterial({ color: fenceColor, wireframe: false });
		var northFence = new THREE.Mesh(northGeom, northMat);
		northFence.position.set(0, config.platformHeight + fenceHeight / 2, -config.platformDepth / 2 + 2);
		scene.add(northFence);
		objects.push(northFence);

		// South fence
		var southFence = new THREE.Mesh(northGeom, northMat);
		southFence.position.set(0, config.platformHeight + fenceHeight / 2, config.platformDepth / 2 - 2);
		scene.add(southFence);
		objects.push(southFence);

		// East fence
		var ewGeom = new THREE.BoxGeometry(0.3, fenceHeight, config.platformDepth - 4);
		var eastFence = new THREE.Mesh(ewGeom, northMat);
		eastFence.position.set(config.platformWidth / 2 - 2, config.platformHeight + fenceHeight / 2, 0);
		scene.add(eastFence);
		objects.push(eastFence);

		// West fence
		var westFence = new THREE.Mesh(ewGeom, northMat);
		westFence.position.set(-config.platformWidth / 2 + 2, config.platformHeight + fenceHeight / 2, 0);
		scene.add(westFence);
		objects.push(westFence);

		// Electric spark line segments
		var linePoints = [];
		for (var i = 0; i < 50; i++) {
			linePoints.push(new THREE.Vector3(
				(Math.random() - 0.5) * config.platformWidth,
				config.platformHeight + fenceHeight + Math.random() * 2,
				(Math.random() - 0.5) * config.platformDepth
			));
		}

		var lineGeom = new THREE.BufferGeometry().setFromPoints(linePoints);
		var lineMat = new THREE.LineBasicMaterial({ color: fenceColor, linewidth: 2 });
		var sparkLine = new THREE.LineSegments(lineGeom, lineMat);
		scene.add(sparkLine);
		dynamicElements.push({ type: 'fenceSpark', object: sparkLine, originalPoints: linePoints });
	}

	// Exercise yard combat arena
	function buildExerciseYard() {
		var yardX = -15;
		var yardZ = -15;

		// Yard floor
		var floorGeom = new THREE.BoxGeometry(20, 0.5, 20);
		var floorMat = new THREE.MeshPhongMaterial({ color: 0x666666 });
		var floor = new THREE.Mesh(floorGeom, floorMat);
		floor.position.set(yardX, config.platformHeight + 0.25, yardZ);
		scene.add(floor);
		objects.push(floor);

		// Training barriers
		for (var i = 0; i < 3; i++) {
			var barrierGeom = new THREE.BoxGeometry(4, 2, 1);
			var barrierMat = new THREE.MeshPhongMaterial({ color: config.materialColors.warning });
			var barrier = new THREE.Mesh(barrierGeom, barrierMat);
			barrier.position.set(yardX - 6 + i * 6, config.platformHeight + 1, yardZ);
			scene.add(barrier);
			objects.push(barrier);
		}

		// Combat ring poles
		for (var j = 0; j < 4; j++) {
			var angle = (j / 4) * Math.PI * 2;
			var poleX = yardX + Math.cos(angle) * 8;
			var poleZ = yardZ + Math.sin(angle) * 8;

			var poleGeom = new THREE.CylinderGeometry(0.6, 0.8, 6, 8);
			var poleMat = new THREE.MeshPhongMaterial({ color: config.materialColors.metal });
			var pole = new THREE.Mesh(poleGeom, poleMat);
			pole.position.set(poleX, config.platformHeight + 3, poleZ);
			scene.add(pole);
			objects.push(pole);
		}
	}

	// Generator room structure
	function buildGeneratorRoom() {
		var genX = 15;
		var genZ = -20;

		// Main generator housing
		var housingGeom = new THREE.BoxGeometry(10, 6, 10);
		var housingMat = new THREE.MeshPhongMaterial({ color: config.materialColors.darkSteel });
		var housing = new THREE.Mesh(housingGeom, housingMat);
		housing.position.set(genX, config.platformHeight + 3, genZ);
		scene.add(housing);
		objects.push(housing);

		// Generator cylinders
		for (var i = 0; i < 3; i++) {
			var cylGeom = new THREE.CylinderGeometry(1.5, 1.5, 4, 8);
			var cylMat = new THREE.MeshPhongMaterial({ color: config.materialColors.metal });
			var cyl = new THREE.Mesh(cylGeom, cylMat);
			cyl.position.set(genX - 3 + i * 3, config.platformHeight + 5, genZ);
			scene.add(cyl);
			objects.push(cyl);
		}

		// Power outlet sphere
		var outletGeom = new THREE.SphereGeometry(2, 8, 8);
		var outletMat = new THREE.MeshPhongMaterial({ color: 0xffcc00 });
		var outlet = new THREE.Mesh(outletGeom, outletMat);
		outlet.position.set(genX, config.platformHeight + 5, genZ + 6);
		scene.add(outlet);
		dynamicElements.push({ type: 'poweroutlet', object: outlet, baseColor: 0xffcc00, time: 0 });
	}

	// Emergency escape pods
	function buildEscapePods() {
		var podPositions = [
			[5, 0, 20],
			[-5, 0, 20],
			[5, 0, -25],
			[-5, 0, -25]
		];

		podPositions.forEach(function(pos) {
			// Pod capsule
			var podGeom = new THREE.SphereGeometry(1.5, 8, 8);
			var podMat = new THREE.MeshPhongMaterial({ color: 0xcccccc });
			var pod = new THREE.Mesh(podGeom, podMat);
			pod.position.set(pos[0], config.platformHeight + 2, pos[2]);
			scene.add(pod);
			objects.push(pod);

			// Pod mounting base
			var baseGeom = new THREE.CylinderGeometry(1, 2, 1.5, 8);
			var baseMat = new THREE.MeshPhongMaterial({ color: config.materialColors.metal });
			var base = new THREE.Mesh(baseGeom, baseMat);
			base.position.set(pos[0], config.platformHeight + 0.75, pos[2]);
			scene.add(base);
			objects.push(base);
		});
	}

	// Supply drop zones
	function buildSupplyDropZones() {
		var dropPositions = [
			[-18, 0, 22],
			[18, 0, 22],
			[20, 0, -18]
		];

		dropPositions.forEach(function(pos) {
			// Drop zone marker
			var markerGeom = new THREE.CylinderGeometry(4, 4, 0.3, 16);
			var markerMat = new THREE.MeshPhongMaterial({ color: 0x00ff00, emissive: 0x00aa00 });
			var marker = new THREE.Mesh(markerGeom, markerMat);
			marker.position.set(pos[0], config.platformHeight + 0.15, pos[2]);
			scene.add(marker);
			objects.push(marker);

			// Cargo container stacked
			var containerGeom = new THREE.BoxGeometry(3, 2, 3);
			var containerMat = new THREE.MeshPhongMaterial({ color: config.materialColors.rust });
			for (var i = 0; i < 2; i++) {
				var container = new THREE.Mesh(containerGeom, containerMat);
				container.position.set(pos[0], config.platformHeight + 1 + i * 2.2, pos[2]);
				scene.add(container);
				objects.push(container);
			}
		});
	}

	// Platform underbelly - visible from below
	function buildUnderbelly() {
		// Massive support girders
		var girderPositions = [
			[-15, 0, -15],
			[15, 0, -15],
			[-15, 0, 15],
			[15, 0, 15]
		];

		girderPositions.forEach(function(pos) {
			var girderGeom = new THREE.BoxGeometry(8, 3, 8);
			var girderMat = new THREE.MeshPhongMaterial({ color: config.materialColors.metal });
			var girder = new THREE.Mesh(girderGeom, girderMat);
			girder.position.set(pos[0], 1.5, pos[2]);
			scene.add(girder);
			objects.push(girder);
		});

		// Exhaust vent structures below
		for (var i = 0; i < 6; i++) {
			var ventX = (Math.random() - 0.5) * 60;
			var ventZ = (Math.random() - 0.5) * 60;

			var ventGeom = new THREE.CylinderGeometry(2, 2.5, 3, 12);
			var ventMat = new THREE.MeshPhongMaterial({ color: 0x555555 });
			var vent = new THREE.Mesh(ventGeom, ventMat);
			vent.position.set(ventX, 1.5, ventZ);
			scene.add(vent);
			objects.push(vent);
		}
	}

	// Lighting setup
	function buildLighting() {
		// Ambient light
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		scene.add(ambientLight);
		lights.push(ambientLight);

		// Directional light (sun)
		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(50, 80, 50);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		directionalLight.shadow.camera.left = -100;
		directionalLight.shadow.camera.right = 100;
		directionalLight.shadow.camera.top = 100;
		directionalLight.shadow.camera.bottom = -100;
		scene.add(directionalLight);
		lights.push(directionalLight);

		// Point lights on control tower
		var pointLight1 = new THREE.PointLight(config.materialColors.electric, 0.6, 60);
		pointLight1.position.set(0, config.platformHeight + 25, 0);
		scene.add(pointLight1);
		lights.push(pointLight1);

		// Perimeter warning lights
		var perimeterPositions = [
			[-35, config.platformHeight + 4, 0],
			[35, config.platformHeight + 4, 0],
			[0, config.platformHeight + 4, -35],
			[0, config.platformHeight + 4, 35]
		];

		perimeterPositions.forEach(function(pos) {
			var perLight = new THREE.PointLight(config.materialColors.warning, 0.4, 40);
			perLight.position.set(pos[0], pos[1], pos[2]);
			scene.add(perLight);
			lights.push(perLight);
		});
	}

	// Update function with dynamic animations
	function update(delta) {
		dynamicElements.forEach(function(element) {
			if (element.type === 'exhaust') {
				// Pulsing exhaust glow
				element.time += delta * 3;
				element.object.material.opacity = element.baseOpacity + Math.sin(element.time) * 0.2;
			} else if (element.type === 'searchlight') {
				// Rotating search light
				var angle = (Date.now() * 0.0005) % (Math.PI * 2);
				if (element.axis === 'y') {
					element.object.rotation.z = angle;
				}
			} else if (element.type === 'guardlight') {
				// Guard light orbits around tower
				element.time += delta * element.speed;
				element.object.position.x = element.centerX + Math.cos(element.time) * element.radius;
				element.object.position.z = element.centerZ + Math.sin(element.time) * element.radius;
			} else if (element.type === 'fenceSpark') {
				// Flickering electric fence effect
				var positions = element.object.geometry.attributes.position.array;
				for (var i = 0; i < positions.length; i += 3) {
					if (Math.random() > 0.95) {
						positions[i] = element.originalPoints[Math.floor(i / 3)].x + (Math.random() - 0.5) * 2;
						positions[i + 1] = element.originalPoints[Math.floor(i / 3)].y + (Math.random() - 0.5) * 1;
						positions[i + 2] = element.originalPoints[Math.floor(i / 3)].z + (Math.random() - 0.5) * 2;
					}
				}
				element.object.geometry.attributes.position.needsUpdate = true;
			} else if (element.type === 'poweroutlet') {
				// Power outlet glowing pulse
				element.time += delta * 2;
				var intensity = 0.7 + Math.sin(element.time) * 0.3;
				element.object.material.emissive.setHex(Math.floor(element.baseColor * intensity));
			}
		});
	}

	// Reset function
	function reset() {
		// Reset all dynamic elements to initial state
		dynamicElements.forEach(function(element) {
			element.time = 0;
			if (element.type === 'exhaust') {
				element.object.material.opacity = element.baseOpacity;
			}
		});
	}

	// Public API
	return {
		init: init,
		update: update,
		reset: reset
	};
}());
