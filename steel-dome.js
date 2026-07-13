window.SteelDome = (function() {
	'use strict';

	var scene;
	var camera;
	var objects = [];
	var dynamicObjects = [];
	var time = 0;

	function createDomeShell() {
		var domeGroup = new THREE.Group();
		var domeRadius = 35;
		var segmentHeight = 4;
		var segmentWidth = 5;
		var layers = 8;

		// Create hemispherical dome using stacked box segments
		var domeSegments = [];
		for (var layer = 0; layer < layers; layer++) {
			var angle = (layer / layers) * Math.PI;
			var height = Math.cos(angle) * domeRadius;
			var radius = Math.sin(angle) * domeRadius;
			var numSegments = Math.max(8, Math.floor((layer + 1) * 2));

			for (var seg = 0; seg < numSegments; seg++) {
				var segAngle = (seg / numSegments) * Math.PI * 2;
				var x = Math.cos(segAngle) * radius;
				var z = Math.sin(segAngle) * radius;
				var y = domeRadius - height;

				var boxGeom = new THREE.BoxGeometry(segmentWidth, segmentHeight, 3);
				var material = new THREE.MeshStandardMaterial({
					color: 0x404040,
					metalness: 0.7,
					roughness: 0.3
				});
				var box = new THREE.Mesh(boxGeom, material);
				box.position.set(x, y, z);
				box.lookAt(0, domeRadius * 0.5, 0);
				box.castShadow = true;
				box.receiveShadow = true;
				domeGroup.add(box);
				domeSegments.push(box);
			}
		}

		objects.push(domeGroup);
		return domeGroup;
	}

	function createCentralCommandPillar() {
		var pillarGroup = new THREE.Group();

		// Main central column
		var cylinderGeom = new THREE.CylinderGeometry(3, 3, 40, 12);
		var metalMaterial = new THREE.MeshStandardMaterial({
			color: 0x2a2a2a,
			metalness: 0.8,
			roughness: 0.2
		});
		var mainColumn = new THREE.Mesh(cylinderGeom, metalMaterial);
		mainColumn.position.y = 20;
		mainColumn.castShadow = true;
		mainColumn.receiveShadow = true;
		pillarGroup.add(mainColumn);

		// Control station rings
		var ringMaterial = new THREE.MeshStandardMaterial({
			color: 0xff6600,
			metalness: 0.5,
			roughness: 0.4
		});
		for (var i = 0; i < 5; i++) {
			var ringGeom = new THREE.CylinderGeometry(4 + i, 4 + i, 2, 12);
			var ring = new THREE.Mesh(ringGeom, ringMaterial);
			ring.position.y = 15 + i * 4;
			ring.castShadow = true;
			ring.receiveShadow = true;
			pillarGroup.add(ring);
		}

		// Top antenna
		var antennaGeom = new THREE.ConeGeometry(1.5, 8, 8);
		var antennaMaterial = new THREE.MeshStandardMaterial({
			color: 0xffaa00,
			metalness: 0.9,
			roughness: 0.1
		});
		var antenna = new THREE.Mesh(antennaGeom, antennaMaterial);
		antenna.position.y = 45;
		antenna.castShadow = true;
		antenna.receiveShadow = true;
		pillarGroup.add(antenna);

		dynamicObjects.push({
			mesh: antenna,
			type: 'rotate',
			axis: 'y',
			speed: 1.5
		});

		objects.push(pillarGroup);
		return pillarGroup;
	}

	function createRadarArray() {
		var radarGroup = new THREE.Group();
		radarGroup.position.set(25, 25, 20);

		// Radar dish base
		var diskGeom = new THREE.CylinderGeometry(6, 6, 1, 16);
		var radarMaterial = new THREE.MeshStandardMaterial({
			color: 0xcccccc,
			metalness: 0.6,
			roughness: 0.3
		});
		var dish = new THREE.Mesh(diskGeom, radarMaterial);
		dish.castShadow = true;
		dish.receiveShadow = true;
		radarGroup.add(dish);

		// Radar dish stand
		var standGeom = new THREE.CylinderGeometry(0.8, 2, 8, 8);
		var stand = new THREE.Mesh(standGeom, new THREE.MeshStandardMaterial({
			color: 0x333333,
			metalness: 0.5,
			roughness: 0.4
		}));
		stand.position.y = 4;
		stand.castShadow = true;
		stand.receiveShadow = true;
		radarGroup.add(stand);

		// Secondary antenna array
		for (var i = 0; i < 4; i++) {
			var antennaGeom = new THREE.ConeGeometry(0.5, 6, 6);
			var antenna = new THREE.Mesh(antennaGeom, new THREE.MeshStandardMaterial({
				color: 0xffff00,
				metalness: 0.7,
				roughness: 0.2
			}));
			var angle = (i / 4) * Math.PI * 2;
			antenna.position.set(
				Math.cos(angle) * 5,
				8,
				Math.sin(angle) * 5
			);
			antenna.castShadow = true;
			antenna.receiveShadow = true;
			radarGroup.add(antenna);

			dynamicObjects.push({
				mesh: antenna,
				type: 'pulse',
				originalY: antenna.position.y,
				speed: 2 + i * 0.3
			});
		}

		dynamicObjects.push({
			mesh: dish,
			type: 'rotate',
			axis: 'y',
			speed: 0.8
		});

		objects.push(radarGroup);
		return radarGroup;
	}

	function createCatwalks() {
		var catwalkGroup = new THREE.Group();

		// Mid-level catwalks at different heights
		var catwalkMaterial = new THREE.MeshStandardMaterial({
			color: 0x555555,
			metalness: 0.4,
			roughness: 0.6
		});

		var heights = [12, 24];
		var radii = [20, 15];

		for (var h = 0; h < heights.length; h++) {
			var height = heights[h];
			var radius = radii[h];

			// Create circular catwalks using stacked boxes
			var segments = 16;
			for (var seg = 0; seg < segments; seg++) {
				var angle = (seg / segments) * Math.PI * 2;
				var nextAngle = ((seg + 1) / segments) * Math.PI * 2;

				var x = Math.cos(angle) * radius;
				var z = Math.sin(angle) * radius;

				var platformGeom = new THREE.BoxGeometry(3, 1.5, 2);
				var platform = new THREE.Mesh(platformGeom, catwalkMaterial);
				platform.position.set(x, height, z);
				platform.rotation.y = angle;
				platform.castShadow = true;
				platform.receiveShadow = true;
				catwalkGroup.add(platform);
			}
		}

		// Radial connecting platforms
		for (var r = 0; r < 4; r++) {
			var angle = (r / 4) * Math.PI * 2;
			var startX = Math.cos(angle) * 8;
			var startZ = Math.sin(angle) * 8;
			var endX = Math.cos(angle) * 30;
			var endZ = Math.sin(angle) * 30;

			var segments = 6;
			for (var s = 0; s < segments; s++) {
				var progress = s / segments;
				var x = startX + (endX - startX) * progress;
				var z = startZ + (endZ - startZ) * progress;

				var platformGeom = new THREE.BoxGeometry(2.5, 1, 2.5);
				var platform = new THREE.Mesh(platformGeom, catwalkMaterial);
				platform.position.set(x, 18 + r * 3, z);
				platform.castShadow = true;
				platform.receiveShadow = true;
				catwalkGroup.add(platform);
			}
		}

		objects.push(catwalkGroup);
		return catwalkGroup;
	}

	function createArmoredVehicleBay() {
		var bayGroup = new THREE.Group();
		bayGroup.position.set(-20, 0, -15);

		// Bay floor
		var floorGeom = new THREE.BoxGeometry(18, 1, 20);
		var floorMaterial = new THREE.MeshStandardMaterial({
			color: 0x1a1a1a,
			metalness: 0.3,
			roughness: 0.7
		});
		var floor = new THREE.Mesh(floorGeom, floorMaterial);
		floor.position.y = 0.5;
		floor.receiveShadow = true;
		bayGroup.add(floor);

		// Vehicle hulks - stacked boxes to simulate armored vehicles
		var vehicleMaterial = new THREE.MeshStandardMaterial({
			color: 0x2d5016,
			metalness: 0.5,
			roughness: 0.5
		});

		for (var v = 0; v < 3; v++) {
			// Hull
			var hullGeom = new THREE.BoxGeometry(5, 3, 8);
			var hull = new THREE.Mesh(hullGeom, vehicleMaterial);
			hull.position.set(-6 + v * 6, 2, 5);
			hull.castShadow = true;
			hull.receiveShadow = true;
			bayGroup.add(hull);

			// Turret
			var turretGeom = new THREE.CylinderGeometry(1.5, 1.8, 2, 8);
			var turret = new THREE.Mesh(turretGeom, vehicleMaterial);
			turret.position.set(-6 + v * 6, 4.5, 5);
			turret.castShadow = true;
			turret.receiveShadow = true;
			bayGroup.add(turret);

			// Gun
			var gunGeom = new THREE.CylinderGeometry(0.4, 0.4, 5, 6);
			var gun = new THREE.Mesh(gunGeom, new THREE.MeshStandardMaterial({
				color: 0x1a1a1a,
				metalness: 0.8,
				roughness: 0.2
			}));
			gun.position.set(-6 + v * 6, 5, 8);
			gun.rotation.z = Math.PI * 0.3;
			gun.castShadow = true;
			gun.receiveShadow = true;
			bayGroup.add(gun);
		}

		// Charging station
		var chargerGeom = new THREE.BoxGeometry(4, 6, 3);
		var charger = new THREE.Mesh(chargerGeom, new THREE.MeshStandardMaterial({
			color: 0x1a3a1a,
			metalness: 0.4,
			roughness: 0.5
		}));
		charger.position.set(5, 3, 0);
		charger.castShadow = true;
		charger.receiveShadow = true;
		bayGroup.add(charger);

		objects.push(bayGroup);
		return bayGroup;
	}

	function createBlastDoors() {
		var doorGroup = new THREE.Group();

		var doorPositions = [
			{ x: 35, y: 0, z: 0 },
			{ x: -35, y: 0, z: 0 },
			{ x: 0, y: 0, z: 35 },
			{ x: 0, y: 0, z: -35 }
		];

		var doorMaterial = new THREE.MeshStandardMaterial({
			color: 0x1a1a1a,
			metalness: 0.9,
			roughness: 0.1
		});

		doorPositions.forEach(function(pos) {
			var doorGeom = new THREE.BoxGeometry(8, 10, 1);
			var door = new THREE.Mesh(doorGeom, doorMaterial);
			door.position.set(pos.x, pos.y + 5, pos.z);
			door.castShadow = true;
			door.receiveShadow = true;
			doorGroup.add(door);

			// Door frame
			var frameGeom = new THREE.BoxGeometry(9, 11, 0.5);
			var frameMaterial = new THREE.MeshStandardMaterial({
				color: 0x404040,
				metalness: 0.6,
				roughness: 0.4
			});
			var frame = new THREE.Mesh(frameGeom, frameMaterial);
			frame.position.set(pos.x, pos.y + 5, pos.z - 0.5);
			frame.castShadow = true;
			frame.receiveShadow = true;
			doorGroup.add(frame);

			// Lock indicator light
			var lightGeom = new THREE.SphereGeometry(0.3, 6, 6);
			var light = new THREE.Mesh(lightGeom, new THREE.MeshStandardMaterial({
				color: 0xff0000,
				emissive: 0xff0000,
				metalness: 0.3,
				roughness: 0.7
			}));
			light.position.set(pos.x, pos.y + 8, pos.z + 0.7);
			doorGroup.add(light);

			dynamicObjects.push({
				mesh: light,
				type: 'flicker',
				originalColor: 0xff0000,
				speed: 5 + Math.random() * 3
			});
		});

		objects.push(doorGroup);
		return doorGroup;
	}

	function createPowerGeneratorRoom() {
		var genGroup = new THREE.Group();
		genGroup.position.set(20, 2, -20);

		// Main generator cylinder
		var genGeom = new THREE.CylinderGeometry(4, 4, 12, 12);
		var genMaterial = new THREE.MeshStandardMaterial({
			color: 0x333333,
			metalness: 0.5,
			roughness: 0.5
		});
		var generator = new THREE.Mesh(genGeom, genMaterial);
		generator.position.y = 6;
		generator.castShadow = true;
		generator.receiveShadow = true;
		genGroup.add(generator);

		dynamicObjects.push({
			mesh: generator,
			type: 'rotate',
			axis: 'y',
			speed: 1.2
		});

		// Power conduits - boxes arranged vertically
		var conduitMaterial = new THREE.MeshStandardMaterial({
			color: 0xffcc00,
			emissive: 0xffcc00,
			metalness: 0.4,
			roughness: 0.6
		});

		for (var c = 0; c < 8; c++) {
			var conduitGeom = new THREE.BoxGeometry(1, 3, 1);
			var conduit = new THREE.Mesh(conduitGeom, conduitMaterial);
			var angle = (c / 8) * Math.PI * 2;
			conduit.position.set(
				Math.cos(angle) * 5.5,
				8 + c * 1.5,
				Math.sin(angle) * 5.5
			);
			conduit.castShadow = true;
			conduit.receiveShadow = true;
			genGroup.add(conduit);

			dynamicObjects.push({
				mesh: conduit,
				type: 'pulse',
				originalIntensity: 1,
				speed: 3 + c * 0.2
			});
		}

		// Cooling unit
		var coolerGeom = new THREE.CylinderGeometry(2, 2.5, 4, 8);
		var coolerMaterial = new THREE.MeshStandardMaterial({
			color: 0x0088ff,
			metalness: 0.6,
			roughness: 0.3
		});
		var cooler = new THREE.Mesh(coolerGeom, coolerMaterial);
		cooler.position.set(0, 2, -8);
		cooler.castShadow = true;
		cooler.receiveShadow = true;
		genGroup.add(cooler);

		objects.push(genGroup);
		return genGroup;
	}

	function createEquipmentPods() {
		var podGroup = new THREE.Group();

		var podPositions = [
			{ x: -15, z: 15 },
			{ x: 15, z: 15 },
			{ x: -15, z: -15 },
			{ x: 15, z: -15 },
			{ x: 0, z: 25 }
		];

		var podMaterial = new THREE.MeshStandardMaterial({
			color: 0x1a3a1a,
			metalness: 0.4,
			roughness: 0.5
		});

		podPositions.forEach(function(pos) {
			// Pod body
			var podGeom = new THREE.BoxGeometry(6, 8, 4);
			var pod = new THREE.Mesh(podGeom, podMaterial);
			pod.position.set(pos.x, 4, pos.z);
			pod.castShadow = true;
			pod.receiveShadow = true;
			podGroup.add(pod);

			// Pod door
			var doorGeom = new THREE.BoxGeometry(5, 7, 0.5);
			var doorMaterial = new THREE.MeshStandardMaterial({
				color: 0x2a4a2a,
				metalness: 0.6,
				roughness: 0.3
			});
			var door = new THREE.Mesh(doorGeom, doorMaterial);
			door.position.set(pos.x, 4, pos.z + 2.2);
			door.castShadow = true;
			door.receiveShadow = true;
			podGroup.add(door);

			// Status light
			var lightGeom = new THREE.SphereGeometry(0.3, 6, 6);
			var light = new THREE.Mesh(lightGeom, new THREE.MeshStandardMaterial({
				color: 0x00ff00,
				emissive: 0x00ff00,
				metalness: 0.3,
				roughness: 0.5
			}));
			light.position.set(pos.x, 7, pos.z + 2.3);
			podGroup.add(light);

			dynamicObjects.push({
				mesh: light,
				type: 'blink',
				originalColor: 0x00ff00,
				speed: 2
			});
		});

		objects.push(podGroup);
		return podGroup;
	}

	function createDefensiveTurrets() {
		var turretGroup = new THREE.Group();

		var turretPositions = [
			{ angle: 0, height: 28 },
			{ angle: Math.PI / 2, height: 28 },
			{ angle: Math.PI, height: 28 },
			{ angle: 3 * Math.PI / 2, height: 28 }
		];

		turretPositions.forEach(function(pos) {
			var radius = 32;
			var x = Math.cos(pos.angle) * radius;
			var z = Math.sin(pos.angle) * radius;

			// Turret base
			var baseGeom = new THREE.CylinderGeometry(1.5, 2, 2, 8);
			var baseMaterial = new THREE.MeshStandardMaterial({
				color: 0x404040,
				metalness: 0.6,
				roughness: 0.4
			});
			var base = new THREE.Mesh(baseGeom, baseMaterial);
			base.position.set(x, pos.height, z);
			base.castShadow = true;
			base.receiveShadow = true;
			turretGroup.add(base);

			// Gun barrel
			var barrelGeom = new THREE.CylinderGeometry(0.3, 0.3, 6, 6);
			var barrelMaterial = new THREE.MeshStandardMaterial({
				color: 0x1a1a1a,
				metalness: 0.9,
				roughness: 0.1
			});
			var barrel = new THREE.Mesh(barrelGeom, barrelMaterial);
			barrel.position.set(x, pos.height + 2, z);
			barrel.rotation.z = Math.PI * 0.2;
			barrel.castShadow = true;
			barrel.receiveShadow = true;
			turretGroup.add(barrel);

			// Targeting sensor
			var sensorGeom = new THREE.SphereGeometry(0.5, 6, 6);
			var sensor = new THREE.Mesh(sensorGeom, new THREE.MeshStandardMaterial({
				color: 0xff00ff,
				emissive: 0xff00ff,
				metalness: 0.7,
				roughness: 0.2
			}));
			sensor.position.set(x, pos.height + 1.5, z);
			turretGroup.add(sensor);

			dynamicObjects.push({
				mesh: sensor,
				type: 'pulse',
				originalColor: 0xff00ff,
				speed: 2.5
			});
		});

		objects.push(turretGroup);
		return turretGroup;
	}

	function createCommunicationAntenna() {
		var antennaGroup = new THREE.Group();
		antennaGroup.position.set(0, 50, 0);

		// Central mast
		var mastGeom = new THREE.CylinderGeometry(0.5, 0.5, 10, 8);
		var mastMaterial = new THREE.MeshStandardMaterial({
			color: 0x333333,
			metalness: 0.7,
			roughness: 0.3
		});
		var mast = new THREE.Mesh(mastGeom, mastMaterial);
		mast.castShadow = true;
		mast.receiveShadow = true;
		antennaGroup.add(mast);

		// Radiator array - cone antennas
		var radiators = [];
		for (var i = 0; i < 6; i++) {
			var radiatorGeom = new THREE.ConeGeometry(0.4, 4, 6);
			var radiatorMaterial = new THREE.MeshStandardMaterial({
				color: 0xffff00,
				emissive: 0xffff00,
				metalness: 0.6,
				roughness: 0.3
			});
			var radiator = new THREE.Mesh(radiatorGeom, radiatorMaterial);
			var angle = (i / 6) * Math.PI * 2;
			var radius = 3;
			radiator.position.set(
				Math.cos(angle) * radius,
				3,
				Math.sin(angle) * radius
			);
			radiator.rotation.x = Math.PI * 0.3;
			radiator.castShadow = true;
			radiator.receiveShadow = true;
			antennaGroup.add(radiator);
			radiators.push(radiator);

			dynamicObjects.push({
				mesh: radiator,
				type: 'rotate',
				axis: 'y',
				speed: 2 + i * 0.3
			});
		}

		objects.push(antennaGroup);
		return antennaGroup;
	}

	function createFloorAndWalls() {
		// Main arena floor
		var floorGeom = new THREE.BoxGeometry(80, 1, 80);
		var floorMaterial = new THREE.MeshStandardMaterial({
			color: 0x1a1a1a,
			metalness: 0.2,
			roughness: 0.8
		});
		var floor = new THREE.Mesh(floorGeom, floorMaterial);
		floor.position.y = -0.5;
		floor.receiveShadow = true;
		objects.push(floor);

		// Outer wall structure - made from boxes
		var wallMaterial = new THREE.MeshStandardMaterial({
			color: 0x2a2a2a,
			metalness: 0.5,
			roughness: 0.4
		});

		var wallHeight = 45;
		var wallThickness = 2;

		// Four outer walls
		var wallPositions = [
			{ x: 40, z: 0, rotY: 0 },
			{ x: -40, z: 0, rotY: 0 },
			{ x: 0, z: 40, rotY: 0 },
			{ x: 0, z: -40, rotY: 0 }
		];

		wallPositions.forEach(function(pos) {
			var wallGeom = new THREE.BoxGeometry(80, wallHeight, wallThickness);
			var wall = new THREE.Mesh(wallGeom, wallMaterial);
			wall.position.set(pos.x, wallHeight / 2, pos.z);
			wall.castShadow = true;
			wall.receiveShadow = true;
			objects.push(wall);
		});
	}

	function init(_scene, _camera) {
		scene = _scene;
		camera = _camera;
		time = 0;

		// Setup lighting
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
		scene.add(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(30, 40, 30);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		directionalLight.shadow.camera.far = 100;
		directionalLight.shadow.camera.left = -50;
		directionalLight.shadow.camera.right = 50;
		directionalLight.shadow.camera.top = 50;
		directionalLight.shadow.camera.bottom = -50;
		scene.add(directionalLight);

		var pointLight1 = new THREE.PointLight(0xff6600, 0.6, 50);
		pointLight1.position.set(20, 20, 20);
		pointLight1.castShadow = true;
		scene.add(pointLight1);

		var pointLight2 = new THREE.PointLight(0x0088ff, 0.4, 40);
		pointLight2.position.set(-20, 15, -20);
		pointLight2.castShadow = true;
		scene.add(pointLight2);

		// Build environment
		createFloorAndWalls();
		createDomeShell();
		createCentralCommandPillar();
		createRadarArray();
		createCatwalks();
		createArmoredVehicleBay();
		createBlastDoors();
		createPowerGeneratorRoom();
		createEquipmentPods();
		createDefensiveTurrets();
		createCommunicationAntenna();

		// Add all objects to scene
		objects.forEach(function(obj) {
			scene.add(obj);
		});
	}

	function update(delta) {
		time += delta;

		dynamicObjects.forEach(function(item) {
			if (item.type === 'rotate') {
				if (item.axis === 'y') {
					item.mesh.rotation.y += item.speed * delta;
				} else if (item.axis === 'x') {
					item.mesh.rotation.x += item.speed * delta;
				}
			} else if (item.type === 'pulse') {
				var scale = 0.9 + Math.sin(time * item.speed) * 0.1;
				item.mesh.scale.set(scale, scale, scale);
			} else if (item.type === 'blink') {
				var visible = Math.sin(time * item.speed) > 0;
				item.mesh.visible = visible;
			} else if (item.type === 'flicker') {
				var on = Math.sin(time * item.speed * 5) > 0;
				if (item.mesh.material) {
					item.mesh.material.emissive.setHex(on ? item.originalColor : 0x000000);
					item.mesh.material.color.setHex(on ? item.originalColor : 0x330000);
				}
			}
		});
	}

	function reset() {
		time = 0;
		objects = [];
		dynamicObjects = [];
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
