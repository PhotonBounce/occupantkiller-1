window.DroneFactory = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var meshes = [];
	var state = {
		conveyorOffset: 0,
		weldingRotation: 0,
		cranePosition: 0,
		doorRotation: 0,
		sprinklerRotation: 0,
		screenPhase: 0,
		rackGlow: 0,
		testPadLift: 0,
		fireSystemActive: false
	};

	var COLORS = {
		industrial_gray: 0x4a4a4a,
		assembly_orange: 0xFF6600,
		electronic_blue: 0x0044CC,
		drone_black: 0x1a1a1a,
		warning_yellow: 0xFFCC00,
		dark_floor: 0x2a2a2a,
		steel: 0x888888,
		concrete: 0x5a5a5a,
		white: 0xFFFFFF
	};

	var SPAWN_POINTS = [
		{ x: -30, y: 1, z: -40 }, // factory entrance
		{ x: 0, y: 1, z: 0 },     // assembly line
		{ x: 20, y: 1, z: -20 },  // storage racks
		{ x: -10, y: 1, z: 30 },  // test pad
		{ x: 35, y: 1, z: 10 }    // loading bay
	];

	function createBox(width, height, depth, color, x, y, z, rx, ry, rz) {
		var geometry = new THREE.BoxGeometry(width, height, depth);
		var material = new THREE.MeshPhongMaterial({ color: color });
		var mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(x, y, z);
		if (rx) mesh.rotation.x = rx;
		if (ry) mesh.rotation.y = ry;
		if (rz) mesh.rotation.z = rz;
		if (scene) scene.add(mesh);
		meshes.push(mesh);
		return mesh;
	}

	function createCylinder(radiusTop, radiusBottom, height, color, x, y, z, rx, ry, rz) {
		var geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 16);
		var material = new THREE.MeshPhongMaterial({ color: color });
		var mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(x, y, z);
		if (rx) mesh.rotation.x = rx;
		if (ry) mesh.rotation.y = ry;
		if (rz) mesh.rotation.z = rz;
		if (scene) scene.add(mesh);
		meshes.push(mesh);
		return mesh;
	}

	function createSphere(radius, color, x, y, z) {
		var geometry = new THREE.SphereGeometry(radius, 16, 16);
		var material = new THREE.MeshPhongMaterial({ color: color });
		var mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(x, y, z);
		if (scene) scene.add(mesh);
		meshes.push(mesh);
		return mesh;
	}

	function createCone(radius, height, color, x, y, z, rx, ry, rz) {
		var geometry = new THREE.ConeGeometry(radius, height, 16);
		var material = new THREE.MeshPhongMaterial({ color: color });
		var mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(x, y, z);
		if (rx) mesh.rotation.x = rx;
		if (ry) mesh.rotation.y = ry;
		if (rz) mesh.rotation.z = rz;
		if (scene) scene.add(mesh);
		meshes.push(mesh);
		return mesh;
	}

	function init(initScene, initCamera) {
		scene = initScene;
		camera = initCamera;
		meshes = [];
		state = {
			conveyorOffset: 0,
			weldingRotation: 0,
			cranePosition: 0,
			doorRotation: 0,
			sprinklerRotation: 0,
			screenPhase: 0,
			rackGlow: 0,
			testPadLift: 0,
			fireSystemActive: false
		};

		// Main factory floor
		createBox(100, 0.5, 80, COLORS.dark_floor, 0, 0, 0);

		// Factory walls
		createBox(100, 15, 1, COLORS.concrete, 0, 7.5, -40);
		createBox(100, 15, 1, COLORS.concrete, 0, 7.5, 40);
		createBox(1, 15, 80, COLORS.concrete, -50, 7.5, 0);
		createBox(1, 15, 80, COLORS.concrete, 50, 7.5, 0);

		// Drone assembly line - conveyor belt sections
		for (var i = 0; i < 6; i++) {
			var xPos = -20 + i * 8;
			createBox(6, 0.3, 4, COLORS.assembly_orange, xPos, 0.5, 0);
			createBox(0.5, 1, 4, COLORS.industrial_gray, xPos - 3.5, 0.75, 0);
			createBox(0.5, 1, 4, COLORS.industrial_gray, xPos + 3.5, 0.75, 0);
		}

		// Assembled drones on conveyor
		for (var i = 0; i < 5; i++) {
			var xPos = -15 + i * 8;
			createSphere(0.8, COLORS.drone_black, xPos, 1.3, 0);
			createCone(0.4, 1.2, COLORS.drone_black, xPos, 2.1, 0);
		}

		// Component storage bins - rows of parts
		for (var row = 0; row < 3; row++) {
			for (var col = 0; col < 4; col++) {
				var xPos = -35 + col * 8;
				var zPos = -15 + row * 10;
				createBox(3, 2.5, 3, COLORS.industrial_gray, xPos, 1.25, zPos);
				createBox(2.8, 0.2, 2.8, COLORS.warning_yellow, xPos, 2.6, zPos);
			}
		}

		// Drone chassis welding station
		var weldBench = createBox(8, 0.5, 4, COLORS.steel, -40, 0.5, 15);
		var weldingArm = createCylinder(0.4, 0.3, 5, COLORS.industrial_gray, -40, 3, 15);
		weldingArm.name = 'weldingArm';

		// Welding work area
		createBox(2, 0.2, 2, COLORS.electronic_blue, -40, 1, 15);

		// Electronics programming bay - 4 workstations
		for (var i = 0; i < 4; i++) {
			var xPos = 10 + i * 8;
			var zPos = -20;
			createBox(3, 0.5, 2, COLORS.steel, xPos, 0.5, zPos);
			createBox(3, 3, 0.3, COLORS.electronic_blue, xPos, 2.2, zPos - 1);
			createBox(1, 0.5, 0.5, COLORS.white, xPos - 0.7, 2.5, zPos - 1);
			createBox(1, 0.5, 0.5, COLORS.white, xPos + 0.7, 2.5, zPos - 1);
		}

		// Drone storage racks - shelving with armed drones
		for (var shelf = 0; shelf < 3; shelf++) {
			var yPos = 1 + shelf * 2.5;
			for (var slot = 0; slot < 4; slot++) {
				var xPos = 10 + slot * 5;
				var zPos = 20;
				createBox(4, 0.3, 3, COLORS.industrial_gray, xPos, yPos, zPos);
				createSphere(0.7, COLORS.drone_black, xPos, yPos + 1, zPos);
			}
		}

		// Launch test pad - circular platform
		createCylinder(6, 6, 0.5, COLORS.assembly_orange, -10, 0.5, 30);
		var testStand = createCylinder(0.8, 0.8, 4, COLORS.steel, -10, 2.5, 30);
		testStand.name = 'testStand';

		// Test pad drone
		var testDrone = createSphere(0.9, COLORS.drone_black, -10, 3.2, 30);
		testDrone.name = 'testDrone';

		// Overhead crane rail
		createBox(80, 0.4, 0.5, COLORS.steel, 0, 12, 0);
		var craneHoist = createCylinder(0.6, 0.6, 2, COLORS.industrial_gray, 0, 11, 0);
		craneHoist.name = 'craneHoist';

		// Crane trolley
		createBox(2, 0.5, 2, COLORS.industrial_gray, 0, 10.5, 0);

		// Quality control inspection station
		createBox(5, 0.5, 4, COLORS.steel, 25, 0.5, 0);
		createBox(3, 0.2, 2, COLORS.electronic_blue, 25, 1, 0);

		// Camera arm for inspection
		var inspectionArm = createCylinder(0.3, 0.2, 3, COLORS.industrial_gray, 25, 2.5, 0);
		inspectionArm.name = 'inspectionArm';

		// Armed drone magazine assembly
		createBox(6, 0.5, 4, COLORS.steel, -25, 0.5, 35);
		createBox(2.5, 2, 2.5, COLORS.warning_yellow, -25, 1.5, 35);

		// Warhead shapes on assembly
		for (var i = 0; i < 3; i++) {
			createCone(0.5, 0.8, COLORS.warning_yellow, -25 + (i - 1) * 1.5, 2.5, 35);
		}

		// Factory loading bay - rolling doors and crates
		createBox(1, 6, 8, COLORS.industrial_gray, 48, 3, 20);
		createBox(1, 6, 8, COLORS.industrial_gray, 48, 3, -5);

		// Loading crates
		for (var i = 0; i < 3; i++) {
			var yPos = 0.5 + i * 1.5;
			createBox(2, 1.3, 2, COLORS.concrete, 45, yPos, 0);
		}

		// Security guard station - booth
		createBox(4, 4, 3, COLORS.industrial_gray, -45, 2, -35);
		createBox(3, 3, 0.2, COLORS.electronic_blue, -45, 3, -34.4);

		// Factory skylight - ceiling panels
		for (var i = 0; i < 3; i++) {
			createBox(15, 0.3, 12, COLORS.white, -20 + i * 20, 14.5, 0);
		}

		// Fire suppression system - pipes and spray heads
		var fireMainPipe = createCylinder(0.4, 0.4, 100, COLORS.steel, 0, 13.5, 0);
		fireMainPipe.rotation.z = Math.PI / 2;

		// Sprinkler heads along the pipe
		for (var i = 0; i < 8; i++) {
			var xPos = -40 + i * 12;
			var sprinklerHead = createCylinder(0.2, 0.2, 1, COLORS.warning_yellow, xPos, 13.8, 0);
			sprinklerHead.name = 'sprinklerHead_' + i;
		}

		// Additional industrial details
		createBox(0.5, 4, 0.5, COLORS.steel, -45, 2, 0);
		createBox(0.5, 4, 0.5, COLORS.steel, 45, 2, 0);
		createBox(0.5, 4, 0.5, COLORS.steel, -45, 2, 20);
		createBox(0.5, 4, 0.5, COLORS.steel, 45, 2, -20);

		// Emergency lighting
		createCylinder(0.3, 0.3, 0.2, COLORS.warning_yellow, -40, 14, 35);
		createCylinder(0.3, 0.3, 0.2, COLORS.warning_yellow, 40, 14, -35);

		// Lighting setup
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		scene.add(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(0, 20, 0);
		directionalLight.castShadow = true;
		scene.add(directionalLight);

		var pointLight1 = new THREE.PointLight(0xffffff, 0.6);
		pointLight1.position.set(-30, 8, 0);
		scene.add(pointLight1);

		var pointLight2 = new THREE.PointLight(0xffffff, 0.6);
		pointLight2.position.set(30, 8, 0);
		scene.add(pointLight2);

		var spotLight = new THREE.SpotLight(0xFF6600, 1);
		spotLight.position.set(0, 10, 20);
		spotLight.target.position.set(0, 1, 20);
		scene.add(spotLight);
		scene.add(spotLight.target);
	}

	function update(delta) {
		if (!scene) return;

		state.conveyorOffset += delta * 3;
		state.weldingRotation += delta * 2;
		state.cranePosition += delta * 0.5;
		state.doorRotation += delta * 0.3;
		state.sprinklerRotation += delta * 1.5;
		state.screenPhase += delta * 2;
		state.rackGlow += delta * 0.5;
		state.testPadLift += delta * 0.8;
		state.fireSystemActive = Math.sin(state.sprinklerRotation) > 0;

		// Update conveyor belt - moving texture effect
		for (var i = 0; i < meshes.length; i++) {
			var mesh = meshes[i];
			if (mesh.geometry && mesh.geometry instanceof THREE.BoxGeometry) {
				if (mesh.material && mesh.material.color.getHex() === COLORS.assembly_orange) {
					if (Math.abs(mesh.position.z) < 1) {
						mesh.position.x += delta * 2;
						if (mesh.position.x > 20) {
							mesh.position.x = -20;
						}
					}
				}
			}
		}

		// Welding arm rotation
		for (var i = 0; i < meshes.length; i++) {
			if (meshes[i].name === 'weldingArm') {
				meshes[i].rotation.z = Math.sin(state.weldingRotation) * 0.3;
			}
		}

		// Spark effect - create temporary sparks
		if (state.weldingRotation % 0.5 < delta * 2) {
			var sparkX = -40 + (Math.random() - 0.5) * 1;
			var sparkY = 2.5 + Math.random() * 0.5;
			var sparkZ = 15 + (Math.random() - 0.5) * 1;
			var spark = createSphere(0.1, COLORS.warning_yellow, sparkX, sparkY, sparkZ);
			spark.name = 'spark';
		}

		// Remove old sparks
		for (var i = meshes.length - 1; i >= 0; i--) {
			if (meshes[i].name === 'spark') {
				scene.remove(meshes[i]);
				meshes.splice(i, 1);
			}
		}

		// Test pad drone lifting animation
		for (var i = 0; i < meshes.length; i++) {
			if (meshes[i].name === 'testDrone') {
				var liftHeight = 0.5 + Math.sin(state.testPadLift) * 0.4;
				meshes[i].position.y = 3.2 + liftHeight;
			}
		}

		// Crane hoist moving along track
		for (var i = 0; i < meshes.length; i++) {
			if (meshes[i].name === 'craneHoist') {
				meshes[i].position.x = Math.sin(state.cranePosition * 0.3) * 35;
			}
		}

		// Programming station screens cycling
		var screenColor = Math.sin(state.screenPhase) > 0 ? 0x00FF00 : 0x0044CC;
		for (var i = 0; i < meshes.length; i++) {
			var mesh = meshes[i];
			if (mesh.geometry && mesh.geometry instanceof THREE.BoxGeometry) {
				if (mesh.material && mesh.material.color.getHex() === COLORS.electronic_blue) {
					if (Math.abs(mesh.position.y - 2.2) < 0.1) {
						mesh.material.color.setHex(screenColor);
					}
				}
			}
		}

		// Loading bay doors cycling open/closed
		for (var i = 0; i < meshes.length; i++) {
			if (meshes[i].geometry && meshes[i].geometry instanceof THREE.BoxGeometry) {
				if (meshes[i].position.x > 47 && meshes[i].position.x < 49) {
					if (Math.abs(meshes[i].position.y - 3) < 0.1) {
						meshes[i].position.x = 48 + Math.sin(state.doorRotation) * 2;
					}
				}
			}
		}

		// Sprinkler heads rotating
		for (var i = 0; i < meshes.length; i++) {
			if (meshes[i].name && meshes[i].name.indexOf('sprinklerHead_') === 0) {
				meshes[i].rotation.x = Math.sin(state.sprinklerRotation) * 0.5;
				meshes[i].rotation.z = Math.cos(state.sprinklerRotation) * 0.3;
			}
		}

		// Inspection arm panning
		for (var i = 0; i < meshes.length; i++) {
			if (meshes[i].name === 'inspectionArm') {
				meshes[i].rotation.y = Math.sin(state.screenPhase * 0.5) * 0.4;
				meshes[i].rotation.z = Math.cos(state.screenPhase * 0.3) * 0.3;
			}
		}

		// Storage rack drones gaining emissive glow when fire system active
		if (state.fireSystemActive) {
			for (var i = 0; i < meshes.length; i++) {
				var mesh = meshes[i];
				if (mesh.geometry && mesh.geometry instanceof THREE.SphereGeometry) {
					if (Math.abs(mesh.position.y - 2) < 3) {
						mesh.material.emissive.setHex(0x220000);
						mesh.material.emissiveIntensity = Math.sin(state.rackGlow) * 0.3 + 0.2;
					}
				}
			}
		}

		// Pulsing factory ambient lighting
		var ambientIntensity = 0.5 + Math.sin(state.screenPhase * 0.3) * 0.1;
		for (var i = 0; i < scene.children.length; i++) {
			if (scene.children[i] instanceof THREE.AmbientLight) {
				scene.children[i].intensity = ambientIntensity;
			}
		}

		// Test stand base pulsing
		for (var i = 0; i < meshes.length; i++) {
			if (meshes[i].name === 'testStand') {
				meshes[i].material.emissive.setHex(0x330000);
				meshes[i].material.emissiveIntensity = Math.sin(state.rackGlow * 0.5) * 0.2 + 0.1;
			}
		}
	}

	function reset() {
		if (scene) {
			for (var i = meshes.length - 1; i >= 0; i--) {
				scene.remove(meshes[i]);
			}
		}
		meshes = [];
		state = {
			conveyorOffset: 0,
			weldingRotation: 0,
			cranePosition: 0,
			doorRotation: 0,
			sprinklerRotation: 0,
			screenPhase: 0,
			rackGlow: 0,
			testPadLift: 0,
			fireSystemActive: false
		};
		scene = null;
		camera = null;
	}

	function getSpawnPoints() {
		return SPAWN_POINTS;
	}

	return {
		init: init,
		update: update,
		reset: reset,
		getSpawnPoints: getSpawnPoints
	};
}());
