window.VolcanicCity = (function() {
	'use strict';

	var scene;
	var camera;
	var objects = [];
	var lavaObjects = [];
	var ashParticles = [];
	var fireGlowObjects = [];
	var animationTime = 0;

	var LAVA_COLOR_HOT = 0xFF4500;
	var LAVA_COLOR_MID = 0xFF6600;
	var LAVA_COLOR_COOL = 0xCC3300;
	var BUILDING_COLOR = 0xAAAAAA;
	var ASH_COLOR = 0x333333;
	var STREET_COLOR = 0x444444;
	var EMERGENCY_RED = 0xFF0000;
	var EMERGENCY_BLUE = 0x0066FF;

	function createBuilding(x, y, z, width, height, depth, isPartiallyMelted) {
		var geometry = new THREE.BoxGeometry(width, height, depth);
		var color = isPartiallyMelted ? 0x995533 : BUILDING_COLOR;
		var material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.7, metalness: 0.1 });
		var building = new THREE.Mesh(geometry, material);
		building.position.set(x, y, z);
		building.castShadow = true;
		building.receiveShadow = true;
		scene.add(building);
		objects.push(building);
		return building;
	}

	function createLavaChannel(x, y, z, width, height, depth) {
		var geometry = new THREE.BoxGeometry(width, height, depth);
		var material = new THREE.MeshStandardMaterial({
			color: LAVA_COLOR_HOT,
			emissive: LAVA_COLOR_HOT,
			emissiveIntensity: 0.7,
			roughness: 0.3,
			metalness: 0.2
		});
		var lava = new THREE.Mesh(geometry, material);
		lava.position.set(x, y, z);
		lava.castShadow = true;
		lava.receiveShadow = true;
		scene.add(lava);
		objects.push(lava);
		lavaObjects.push(lava);
		return lava;
	}

	function createRubblePile(x, y, z, count) {
		for (var i = 0; i < count; i++) {
			var rx = x + (Math.random() - 0.5) * 8;
			var ry = y + i * 1.5;
			var rz = z + (Math.random() - 0.5) * 8;
			var rw = 1 + Math.random() * 2;
			var rh = 1 + Math.random() * 1.5;
			var rd = 1 + Math.random() * 2;
			var geometry = new THREE.BoxGeometry(rw, rh, rd);
			var color = Math.random() > 0.5 ? 0x666666 : 0x555555;
			var material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.8 });
			var rubble = new THREE.Mesh(geometry, material);
			rubble.position.set(rx, ry, rz);
			rubble.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
			rubble.castShadow = true;
			rubble.receiveShadow = true;
			scene.add(rubble);
			objects.push(rubble);
		}
	}

	function createTiltedBuildingSection(x, y, z, width, height, depth) {
		var geometry = new THREE.BoxGeometry(width, height, depth);
		var material = new THREE.MeshStandardMaterial({ color: BUILDING_COLOR, roughness: 0.7 });
		var section = new THREE.Mesh(geometry, material);
		section.position.set(x, y, z);
		section.rotation.z = 0.3 + Math.random() * 0.2;
		section.castShadow = true;
		section.receiveShadow = true;
		scene.add(section);
		objects.push(section);
		return section;
	}

	function createLavaLake(centerX, centerZ, radius) {
		var lakeSegments = 12;
		for (var i = 0; i < lakeSegments; i++) {
			for (var j = 0; j < lakeSegments; j++) {
				var angle1 = (i / lakeSegments) * Math.PI * 2;
				var angle2 = ((i + 1) / lakeSegments) * Math.PI * 2;
				var r1 = (j / lakeSegments) * radius;
				var r2 = ((j + 1) / lakeSegments) * radius;

				var x1 = centerX + Math.cos(angle1) * r1;
				var z1 = centerZ + Math.sin(angle1) * r1;
				var x2 = centerX + Math.cos(angle2) * r1;
				var z2 = centerZ + Math.sin(angle2) * r1;
				var x3 = centerX + Math.cos(angle1) * r2;
				var z3 = centerZ + Math.sin(angle1) * r2;

				if (Math.random() > 0.3) {
					var w = 3 + Math.random() * 2;
					var d = 3 + Math.random() * 2;
					var geometry = new THREE.BoxGeometry(w, 2, d);
					var material = new THREE.MeshStandardMaterial({
						color: LAVA_COLOR_HOT,
						emissive: LAVA_COLOR_HOT,
						emissiveIntensity: 0.6,
						roughness: 0.4
					});
					var segment = new THREE.Mesh(geometry, material);
					segment.position.set(x1 + x2 + x3 / 3, 1, z1 + z2 + z3 / 3);
					segment.castShadow = true;
					segment.receiveShadow = true;
					scene.add(segment);
					objects.push(segment);
					lavaObjects.push(segment);
				}
			}
		}
	}

	function createCoolingLavaEdge(x, z, width, depth) {
		var geometry = new THREE.BoxGeometry(width, 1.5, depth);
		var material = new THREE.MeshStandardMaterial({
			color: LAVA_COLOR_COOL,
			emissive: 0x661100,
			emissiveIntensity: 0.3,
			roughness: 0.9
		});
		var coolingLava = new THREE.Mesh(geometry, material);
		coolingLava.position.set(x, 0.75, z);
		coolingLava.castShadow = true;
		coolingLava.receiveShadow = true;
		scene.add(coolingLava);
		objects.push(coolingLava);
		return coolingLava;
	}

	function createAbandonedVehicle(x, y, z, isInLava) {
		var bodyW = 2;
		var bodyH = 1.5;
		var bodyD = 4;
		var geometry = new THREE.BoxGeometry(bodyW, bodyH, bodyD);
		var color = isInLava ? 0x333333 : EMERGENCY_RED;
		var material = new THREE.MeshStandardMaterial({
			color: color,
			emissive: isInLava ? 0 : 0xFF0000,
			emissiveIntensity: isInLava ? 0 : 0.3,
			roughness: 0.6
		});
		var body = new THREE.Mesh(geometry, material);
		body.position.set(x, y, z);
		if (isInLava) {
			body.rotation.z = 0.2 + Math.random() * 0.3;
		}
		body.castShadow = true;
		body.receiveShadow = true;
		scene.add(body);
		objects.push(body);

		// Wheels
		var wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16);
		var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
		for (var i = 0; i < 2; i++) {
			var wheelZ = bodyD / 2 - 0.8 + (i * 1.5);
			for (var j = 0; j < 2; j++) {
				var wheelX = bodyW / 2 + 0.1 + (j * bodyW);
				var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
				wheel.rotation.z = Math.PI / 2;
				wheel.position.set(x + wheelX, y - bodyH / 2, z + wheelZ);
				scene.add(wheel);
				objects.push(wheel);
			}
		}
	}

	function createEmergencyVehicle(x, y, z, isFireTruck) {
		var length = 6;
		var width = 2.2;
		var height = 2;
		var geometry = new THREE.BoxGeometry(width, height, length);
		var color = isFireTruck ? EMERGENCY_RED : EMERGENCY_BLUE;
		var material = new THREE.MeshStandardMaterial({
			color: color,
			emissive: color,
			emissiveIntensity: 0.2,
			roughness: 0.5
		});
		var body = new THREE.Mesh(geometry, material);
		body.position.set(x, y, z);
		body.castShadow = true;
		body.receiveShadow = true;
		scene.add(body);
		objects.push(body);
		fireGlowObjects.push(body);

		// Cabin
		var cabinGeometry = new THREE.BoxGeometry(width * 0.7, height, width * 0.8);
		var cabin = new THREE.Mesh(cabinGeometry, material);
		cabin.position.set(x, y, z - length / 3);
		cabin.castShadow = true;
		cabin.receiveShadow = true;
		scene.add(cabin);
		objects.push(cabin);

		// Wheels
		var wheelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16);
		var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
		for (var i = 0; i < 2; i++) {
			var wz = -length / 3 + (i * length / 2);
			for (var j = 0; j < 2; j++) {
				var wx = (j === 0) ? -width / 2 - 0.2 : width / 2 + 0.2;
				var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
				wheel.rotation.z = Math.PI / 2;
				wheel.position.set(x + wx, y - height / 2, z + wz);
				scene.add(wheel);
				objects.push(wheel);
			}
		}
	}

	function createBrokenRoadSection(x, z, width, depth, gapSize) {
		var sectionCount = 4;
		for (var i = 0; i < sectionCount; i++) {
			var sx = x + (i % 2) * (width / 2 + gapSize / 2);
			var sz = z + Math.floor(i / 2) * (depth / 2 + gapSize / 2);
			var geometry = new THREE.BoxGeometry(width / 2, 0.5, depth / 2);
			var material = new THREE.MeshStandardMaterial({ color: STREET_COLOR, roughness: 0.8 });
			var section = new THREE.Mesh(geometry, material);
			section.position.set(sx, 0.25, sz);
			if (Math.random() > 0.5) {
				section.rotation.z = 0.1 + Math.random() * 0.15;
			}
			section.castShadow = true;
			section.receiveShadow = true;
			scene.add(section);
			objects.push(section);
		}
	}

	function createFireHydrant(x, y, z) {
		// Hydrant body
		var bodyGeometry = new THREE.CylinderGeometry(0.15, 0.2, 1, 8);
		var metalMaterial = new THREE.MeshStandardMaterial({ color: 0xFF3300, roughness: 0.4, metalness: 0.6 });
		var body = new THREE.Mesh(bodyGeometry, metalMaterial);
		body.position.set(x, y + 0.5, z);
		body.castShadow = true;
		body.receiveShadow = true;
		scene.add(body);
		objects.push(body);

		// Water spray - sphere particles at top
		var sprayCount = 8;
		for (var i = 0; i < sprayCount; i++) {
			var sprayGeometry = new THREE.SphereGeometry(0.2, 8, 8);
			var waterMaterial = new THREE.MeshStandardMaterial({
				color: 0x4488FF,
				emissive: 0x2255FF,
				emissiveIntensity: 0.4,
				transparent: true,
				opacity: 0.6,
				roughness: 0.3
			});
			var spray = new THREE.Mesh(sprayGeometry, waterMaterial);
			var angle = (i / sprayCount) * Math.PI * 2;
			spray.position.set(
				x + Math.cos(angle) * 0.8,
				y + 1.5,
				z + Math.sin(angle) * 0.8
			);
			scene.add(spray);
			objects.push(spray);
			ashParticles.push({ mesh: spray, vx: Math.cos(angle) * 0.5, vy: 0.2, vz: Math.sin(angle) * 0.5 });
		}
	}

	function createAshParticles(count) {
		for (var i = 0; i < count; i++) {
			var geometry = new THREE.SphereGeometry(0.08 + Math.random() * 0.12, 4, 4);
			var material = new THREE.MeshStandardMaterial({
				color: ASH_COLOR,
				roughness: 0.9,
				emissive: 0x222222,
				emissiveIntensity: 0.2
			});
			var particle = new THREE.Mesh(geometry, material);
			particle.position.set(
				Math.random() * 80 - 40,
				30 + Math.random() * 30,
				Math.random() * 80 - 40
			);
			scene.add(particle);
			objects.push(particle);
			ashParticles.push({
				mesh: particle,
				vx: (Math.random() - 0.5) * 0.3,
				vy: -0.3 - Math.random() * 0.2,
				vz: (Math.random() - 0.5) * 0.3,
				resetY: particle.position.y
			});
		}
	}

	function createHelicopterWreck(x, y, z) {
		// Main fuselage
		var fuselageGeometry = new THREE.BoxGeometry(1.5, 1, 5);
		var fuselageMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 });
		var fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
		fuselage.position.set(x, y, z);
		fuselage.rotation.z = 0.4;
		fuselage.castShadow = true;
		fuselage.receiveShadow = true;
		scene.add(fuselage);
		objects.push(fuselage);

		// Cockpit
		var cockpitGeometry = new THREE.BoxGeometry(1.2, 1.2, 1.5);
		var cockpit = new THREE.Mesh(cockpitGeometry, fuselageMaterial);
		cockpit.position.set(x, y + 0.5, z + 1.5);
		cockpit.castShadow = true;
		cockpit.receiveShadow = true;
		scene.add(cockpit);
		objects.push(cockpit);

		// Broken rotor blades
		for (var i = 0; i < 3; i++) {
			var bladeGeometry = new THREE.BoxGeometry(0.4, 0.1, 4);
			var blade = new THREE.Mesh(bladeGeometry, fuselageMaterial);
			blade.position.set(x + (Math.random() - 0.5) * 2, y + 2, z + (Math.random() - 0.5) * 3);
			blade.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.3);
			scene.add(blade);
			objects.push(blade);
		}

		// Landing skids
		for (var j = 0; j < 2; j++) {
			var skidGeometry = new THREE.BoxGeometry(0.2, 0.2, 3);
			var skid = new THREE.Mesh(skidGeometry, fuselageMaterial);
			skid.position.set(x + (j === 0 ? -1 : 1), y - 0.8, z);
			skid.rotation.z = 0.3;
			scene.add(skid);
			objects.push(skid);
		}
	}

	function createCrater(x, z, radius, depth) {
		var segments = 8;
		for (var i = 0; i < segments; i++) {
			for (var j = 0; j < segments; j++) {
				var angle = (i / segments) * Math.PI * 2;
				var nextAngle = ((i + 1) / segments) * Math.PI * 2;
				var radialPos = (j / segments) * radius;

				var cx = x + Math.cos(angle) * radialPos;
				var cz = z + Math.sin(angle) * radialPos;
				var cy = -(j / segments) * depth;

				if (Math.random() > 0.4) {
					var craterGeometry = new THREE.BoxGeometry(2, 0.5, 2);
					var material = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.85 });
					var craterSegment = new THREE.Mesh(craterGeometry, material);
					craterSegment.position.set(cx, cy, cz);
					craterSegment.castShadow = true;
					craterSegment.receiveShadow = true;
					scene.add(craterSegment);
					objects.push(craterSegment);
				}
			}
		}
	}

	function createAshCoveredBuilding(x, y, z, width, height, depth) {
		// Main building
		var geometry = new THREE.BoxGeometry(width, height, depth);
		var material = new THREE.MeshStandardMaterial({ color: BUILDING_COLOR, roughness: 0.7 });
		var building = new THREE.Mesh(geometry, material);
		building.position.set(x, y, z);
		building.castShadow = true;
		building.receiveShadow = true;
		scene.add(building);
		objects.push(building);

		// Ash coating on top
		var ashGeometry = new THREE.BoxGeometry(width + 0.5, 0.3, depth + 0.5);
		var ashMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.95 });
		var ashLayer = new THREE.Mesh(ashGeometry, ashMaterial);
		ashLayer.position.set(x, y + height / 2 + 0.15, z);
		ashLayer.castShadow = true;
		scene.add(ashLayer);
		objects.push(ashLayer);

		// Ash on sides
		for (var i = 0; i < 4; i++) {
			var sideGeometry = new THREE.BoxGeometry(1, height * 0.3, 0.3);
			var ashSide = new THREE.Mesh(sideGeometry, ashMaterial);
			var angle = (i / 4) * Math.PI * 2;
			var dist = Math.max(width, depth) / 2 + 0.2;
			ashSide.position.set(
				x + Math.cos(angle) * dist,
				y + height * 0.3,
				z + Math.sin(angle) * dist
			);
			scene.add(ashSide);
			objects.push(ashSide);
		}
	}

	function createCityGrid() {
		// Main city blocks in grid layout
		var blockSize = 12;
		var blockSeparation = 2;
		var gridSize = 80;
		var gridCount = Math.floor(gridSize / (blockSize + blockSeparation));

		for (var i = 0; i < gridCount; i++) {
			for (var j = 0; j < gridCount; j++) {
				var bx = (i - gridCount / 2) * (blockSize + blockSeparation);
				var bz = (j - gridCount / 2) * (blockSize + blockSeparation);

				// Random building or ash-covered building
				var buildingHeight = 8 + Math.random() * 12;
				var isPartiallyMelted = Math.random() > 0.7;
				var isCovered = Math.random() > 0.6;

				if (isCovered && !isPartiallyMelted) {
					createAshCoveredBuilding(bx, buildingHeight / 2, bz, blockSize * 0.8, buildingHeight, blockSize * 0.8);
				} else {
					createBuilding(bx, buildingHeight / 2, bz, blockSize * 0.8, buildingHeight, blockSize * 0.8, isPartiallyMelted);
				}

				// Random lava channels between buildings
				if (Math.random() > 0.6) {
					if (i < gridCount - 1) {
						var lavaX = bx + blockSize / 2 + blockSeparation / 2;
						var lavaZ = bz;
						createLavaChannel(lavaX, 0.5, lavaZ, blockSeparation - 0.5, 1, blockSize * 0.6);
					}
					if (j < gridCount - 1) {
						var lavaX2 = bx;
						var lavaZ2 = bz + blockSize / 2 + blockSeparation / 2;
						createLavaChannel(lavaX2, 0.5, lavaZ2, blockSize * 0.6, 1, blockSeparation - 0.5);
					}
				}
			}
		}
	}

	function init(sceneParam, cameraParam) {
		scene = sceneParam;
		camera = cameraParam;

		// Create main city grid
		createCityGrid();

		// Add lava lake district
		createLavaLake(25, 25, 15);

		// Add cooling lava edges
		for (var i = 0; i < 8; i++) {
			var angle = (i / 8) * Math.PI * 2;
			var edgeX = 25 + Math.cos(angle) * 16;
			var edgeZ = 25 + Math.sin(angle) * 16;
			createCoolingLavaEdge(edgeX, edgeZ, 4, 4);
		}

		// Add collapsed buildings and rubble
		for (var i = 0; i < 5; i++) {
			var rubbleX = Math.random() * 60 - 30;
			var rubbleZ = Math.random() * 60 - 30;
			createRubblePile(rubbleX, 0, rubbleZ, 6 + Math.floor(Math.random() * 4));
		}

		// Add tilted building sections
		for (var i = 0; i < 4; i++) {
			var tiltX = Math.random() * 70 - 35;
			var tiltZ = Math.random() * 70 - 35;
			createTiltedBuildingSection(tiltX, 5 + Math.random() * 3, tiltZ, 6, 8, 6);
		}

		// Add abandoned vehicles in lava
		for (var i = 0; i < 6; i++) {
			var lavaCarX = 20 + Math.random() * 10 - 5;
			var lavaCarZ = 20 + Math.random() * 10 - 5;
			createAbandonedVehicle(lavaCarX, 1.2, lavaCarZ, true);
		}

		// Add abandoned vehicles on streets
		for (var i = 0; i < 4; i++) {
			var carX = Math.random() * 60 - 30;
			var carZ = Math.random() * 60 - 30;
			createAbandonedVehicle(carX, 1, carZ, false);
		}

		// Add emergency vehicles
		createEmergencyVehicle(-20, 0.5, -20, true);
		createEmergencyVehicle(20, 0.5, 20, false);
		createEmergencyVehicle(-10, 0.5, 10, true);

		// Add broken road sections
		for (var i = 0; i < 6; i++) {
			var roadX = Math.random() * 60 - 30;
			var roadZ = Math.random() * 60 - 30;
			createBrokenRoadSection(roadX, roadZ, 10, 6, 2);
		}

		// Add fire hydrants with water spray
		for (var i = 0; i < 5; i++) {
			var hydrantX = Math.random() * 70 - 35;
			var hydrantZ = Math.random() * 70 - 35;
			createFireHydrant(hydrantX, 0, hydrantZ);
		}

		// Add ash particles
		createAshParticles(120);

		// Add helicopter wreck on rooftop
		createHelicopterWreck(0, 15, 0);

		// Add craters
		for (var i = 0; i < 4; i++) {
			var craterX = Math.random() * 60 - 30;
			var craterZ = Math.random() * 60 - 30;
			createCrater(craterX, craterZ, 6, 3);
		}

		// Add some lava bomb craters on streets
		for (var i = 0; i < 6; i++) {
			var bombX = Math.random() * 70 - 35;
			var bombZ = Math.random() * 70 - 35;
			createCrater(bombX, bombZ, 4, 2);
		}

		// Add more lava channels flowing down streets
		for (var i = 0; i < 8; i++) {
			var flowX = Math.random() * 60 - 30;
			var flowZ = Math.random() * 60 - 30;
			var flowLength = 15 + Math.random() * 10;
			var isVertical = Math.random() > 0.5;
			if (isVertical) {
				createLavaChannel(flowX, 0.4, flowZ, 3, 0.8, flowLength);
			} else {
				createLavaChannel(flowX, 0.4, flowZ, flowLength, 0.8, 3);
			}
		}
	}

	function update(delta) {
		animationTime += delta;

		// Animate lava color pulsing
		var lavaColorCycle = Math.sin(animationTime * 1.5) * 0.5 + 0.5;
		for (var i = 0; i < lavaObjects.length; i++) {
			var lavaObj = lavaObjects[i];
			var hue = lavaColorCycle;
			if (hue < 0.5) {
				lavaObj.material.emissive.setHex(LAVA_COLOR_HOT);
				lavaObj.material.color.setHex(LAVA_COLOR_HOT);
			} else {
				lavaObj.material.emissive.setHex(LAVA_COLOR_COOL);
				lavaObj.material.color.setHex(LAVA_COLOR_COOL);
			}
		}

		// Animate ash particles drifting downward
		for (var i = 0; i < ashParticles.length; i++) {
			var particle = ashParticles[i];
			particle.mesh.position.x += particle.vx * delta;
			particle.mesh.position.y += particle.vy * delta;
			particle.mesh.position.z += particle.vz * delta;

			// Reset when too low
			if (particle.mesh.position.y < -10) {
				particle.mesh.position.y = particle.resetY || (30 + Math.random() * 30);
				particle.mesh.position.x = Math.random() * 80 - 40;
				particle.mesh.position.z = Math.random() * 80 - 40;
			}

			// Slight rotation
			particle.mesh.rotation.x += 0.5 * delta;
			particle.mesh.rotation.y += 0.3 * delta;
		}

		// Animate fire glow flickering
		var fireGlowIntensity = 0.2 + Math.sin(animationTime * 3.5) * 0.15 + Math.random() * 0.1;
		for (var i = 0; i < fireGlowObjects.length; i++) {
			var fireObj = fireGlowObjects[i];
			fireObj.material.emissiveIntensity = fireGlowIntensity;
		}
	}

	function reset() {
		for (var i = 0; i < objects.length; i++) {
			scene.remove(objects[i]);
			if (objects[i].geometry) {
				objects[i].geometry.dispose();
			}
			if (objects[i].material) {
				if (Array.isArray(objects[i].material)) {
					for (var j = 0; j < objects[i].material.length; j++) {
						objects[i].material[j].dispose();
					}
				} else {
					objects[i].material.dispose();
				}
			}
		}
		objects = [];
		lavaObjects = [];
		ashParticles = [];
		fireGlowObjects = [];
		animationTime = 0;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
