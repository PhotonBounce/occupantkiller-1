var window = window || {};

window.DataVault = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var vaultObjects = [];
	var animatedLights = [];
	var rotatingFans = [];
	var blinkingState = 0;
	var blinkingSpeed = 4;
	var Colors = {
		charcoal: 0x1a1a1a,
		darkGrey: 0x2a2a2a,
		lightGrey: 0x3a3a3a,
		electricBlue: 0x00ccff,
		brightBlue: 0x0099ff,
		emeraldGreen: 0x00ff88,
		emergencyRed: 0xff0033,
		darkRed: 0x660011,
		metalSilver: 0xcccccc,
		dullGreen: 0x00aa44
	};

	function createServerRack(x, z, width, height, depth) {
		var group = new THREE.Group();
		var rackWidth = width || 2;
		var rackHeight = height || 8;
		var rackDepth = depth || 1.5;

		var mainBody = new THREE.Mesh(
			new THREE.BoxGeometry(rackWidth, rackHeight, rackDepth),
			new THREE.MeshPhongMaterial({ color: Colors.charcoal, emissive: 0x000000 })
		);
		mainBody.position.y = rackHeight / 2;
		group.add(mainBody);

		var lightCount = 8;
		for (var i = 0; i < lightCount; i++) {
			var yPos = (i / lightCount) * rackHeight + 0.5;
			var indicator = new THREE.Mesh(
				new THREE.CylinderGeometry(0.15, 0.15, 0.05, 16),
				new THREE.MeshPhongMaterial({ color: Colors.electricBlue, emissive: Colors.electricBlue })
			);
			indicator.position.set(rackWidth / 2 + 0.1, yPos, 0);
			indicator.rotation.z = Math.PI / 2;
			group.add(indicator);
			animatedLights.push({
				object: indicator,
				originalColor: Colors.electricBlue,
				alternateColor: Colors.emeraldGreen,
				blinkRate: 2 + Math.random() * 3
			});
		}

		group.position.set(x, 0, z);
		scene.add(group);
		vaultObjects.push(group);
		return group;
	}

	function createVaultDoor(x, z, width, height, isMainDoor) {
		var group = new THREE.Group();
		var doorWidth = width || 3;
		var doorHeight = height || 4;

		var doorFrame = new THREE.Mesh(
			new THREE.BoxGeometry(doorWidth + 0.3, doorHeight + 0.3, 0.2),
			new THREE.MeshPhongMaterial({ color: Colors.metalSilver, shininess: 100 })
		);
		doorFrame.position.y = doorHeight / 2;
		group.add(doorFrame);

		var doorPanel = new THREE.Mesh(
			new THREE.BoxGeometry(doorWidth, doorHeight, 0.15),
			new THREE.MeshPhongMaterial({ color: Colors.darkGrey, emissive: 0x111111 })
		);
		doorPanel.position.y = doorHeight / 2;
		doorPanel.position.z = 0.05;
		group.add(doorPanel);

		var wheelCount = 6;
		for (var i = 0; i < wheelCount; i++) {
			var angle = (i / wheelCount) * Math.PI * 2;
			var wx = Math.cos(angle) * (doorWidth / 2 - 0.3);
			var wy = doorHeight / 2 + (i % 2 === 0 ? 1 : -1);

			var wheel = new THREE.Mesh(
				new THREE.CylinderGeometry(0.25, 0.25, 0.1, 16),
				new THREE.MeshPhongMaterial({ color: Colors.metalSilver, shininess: 80 })
			);
			wheel.rotation.z = Math.PI / 2;
			wheel.position.set(wx, wy, 0.1);
			group.add(wheel);
		}

		var glowPanel = new THREE.Mesh(
			new THREE.BoxGeometry(doorWidth - 0.5, 0.3, 0.08),
			new THREE.MeshPhongMaterial({ color: Colors.electricBlue, emissive: Colors.electricBlue })
		);
		glowPanel.position.set(0, doorHeight / 2 + 0.5, 0.1);
		group.add(glowPanel);
		animatedLights.push({
			object: glowPanel,
			originalColor: Colors.electricBlue,
			alternateColor: Colors.brightBlue,
			blinkRate: 1.5
		});

		group.position.set(x, 0, z);
		scene.add(group);
		vaultObjects.push(group);
		return group;
	}

	function createCoolingPipe(startX, startZ, endX, endZ, height) {
		var group = new THREE.Group();
		var pipeHeight = height || 6;
		var startPos = new THREE.Vector3(startX, pipeHeight, startZ);
		var endPos = new THREE.Vector3(endX, pipeHeight, endZ);

		var distance = startPos.distanceTo(endPos);
		var midPoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);

		var pipe = new THREE.Mesh(
			new THREE.CylinderGeometry(0.25, 0.25, distance, 16),
			new THREE.MeshPhongMaterial({ color: Colors.darkGrey, shininess: 50 })
		);
		pipe.position.copy(midPoint);
		pipe.lookAt(endPos);
		pipe.rotation.z = Math.atan2(endZ - startZ, endX - startX);
		var rotation = new THREE.Quaternion();
		rotation.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.atan2(endZ - startZ, endX - startX));
		var axis = new THREE.Vector3(0, 1, 0);
		var angle = Math.atan2(endZ - startZ, endX - startX);
		pipe.position.copy(midPoint);
		pipe.rotateOnWorldAxis(axis, angle);

		group.add(pipe);

		var connectorSpacing = 4;
		var connectorCount = Math.floor(distance / connectorSpacing);
		for (var i = 0; i < connectorCount; i++) {
			var t = i / connectorCount;
			var cx = startX + (endX - startX) * t;
			var cz = startZ + (endZ - startZ) * t;

			var connector = new THREE.Mesh(
				new THREE.BoxGeometry(0.6, 0.3, 0.6),
				new THREE.MeshPhongMaterial({ color: Colors.metalSilver, shininess: 80 })
			);
			connector.position.set(cx, pipeHeight, cz);
			group.add(connector);
		}

		var fan = new THREE.Mesh(
			new THREE.CylinderGeometry(0.8, 0.8, 0.1, 16),
			new THREE.MeshPhongMaterial({ color: Colors.lightGrey, shininess: 60 })
		);
		fan.position.set(endX, pipeHeight, endZ);
		group.add(fan);
		rotatingFans.push(fan);

		group.position.y = 0;
		scene.add(group);
		vaultObjects.push(group);
		return group;
	}

	function createSecurityLaserGrid(centerX, centerZ, gridWidth, gridHeight, gridDepth) {
		var group = new THREE.Group();
		var lineSpacing = 1.5;
		var color = Colors.emergencyRed;

		var xLines = Math.floor(gridDepth / lineSpacing);
		for (var i = 0; i < xLines; i++) {
			var z = centerZ - gridDepth / 2 + (i * lineSpacing);
			var points = [
				new THREE.Vector3(centerX - gridWidth / 2, centerZ, z),
				new THREE.Vector3(centerX + gridWidth / 2, centerZ, z)
			];
			var geometry = new THREE.BufferGeometry().setFromPoints(points);
			var line = new THREE.LineSegments(
				geometry,
				new THREE.LineBasicMaterial({ color: color, linewidth: 2 })
			);
			group.add(line);
		}

		var zLines = Math.floor(gridWidth / lineSpacing);
		for (var j = 0; j < zLines; j++) {
			var x = centerX - gridWidth / 2 + (j * lineSpacing);
			var points = [
				new THREE.Vector3(x, centerZ, centerZ - gridDepth / 2),
				new THREE.Vector3(x, centerZ, centerZ + gridDepth / 2)
			];
			var geometry = new THREE.BufferGeometry().setFromPoints(points);
			var line = new THREE.LineSegments(
				geometry,
				new THREE.LineBasicMaterial({ color: color, linewidth: 2 })
			);
			group.add(line);
		}

		var verticalLines = Math.floor(gridWidth / (lineSpacing * 2));
		for (var k = 0; k < verticalLines; k++) {
			var xPos = centerX - gridWidth / 2 + (k * lineSpacing * 2);
			var points = [
				new THREE.Vector3(xPos, centerZ - gridHeight / 2, centerZ),
				new THREE.Vector3(xPos, centerZ + gridHeight / 2, centerZ)
			];
			var geometry = new THREE.BufferGeometry().setFromPoints(points);
			var line = new THREE.LineSegments(
				geometry,
				new THREE.LineBasicMaterial({ color: color, linewidth: 2 })
			);
			group.add(line);
		}

		group.position.set(0, 0, 0);
		scene.add(group);
		vaultObjects.push(group);
		return group;
	}

	function createControlTerminal(x, y, z) {
		var group = new THREE.Group();

		var baseConsole = new THREE.Mesh(
			new THREE.BoxGeometry(2, 1.2, 1.5),
			new THREE.MeshPhongMaterial({ color: Colors.darkGrey, emissive: 0x0a0a0a })
		);
		baseConsole.position.y = 0.6;
		group.add(baseConsole);

		var monitorCount = 3;
		for (var i = 0; i < monitorCount; i++) {
			var monitor = new THREE.Mesh(
				new THREE.SphereGeometry(0.35, 16, 16),
				new THREE.MeshPhongMaterial({ color: Colors.electricBlue, emissive: Colors.electricBlue })
			);
			var xOffset = (i - 1) * 0.7;
			monitor.position.set(xOffset, 1.2, 0.3);
			group.add(monitor);
			animatedLights.push({
				object: monitor,
				originalColor: Colors.electricBlue,
				alternateColor: Colors.brightBlue,
				blinkRate: 3
			});
		}

		var keypad = new THREE.Mesh(
			new THREE.BoxGeometry(1, 0.5, 0.3),
			new THREE.MeshPhongMaterial({ color: Colors.lightGrey, shininess: 40 })
		);
		keypad.position.set(0, 0.3, 0.8);
		group.add(keypad);

		var screenPanel = new THREE.Mesh(
			new THREE.BoxGeometry(1.8, 0.8, 0.1),
			new THREE.MeshPhongMaterial({ color: Colors.brightBlue, emissive: Colors.brightBlue })
		);
		screenPanel.position.set(0, 1.3, -0.8);
		group.add(screenPanel);
		animatedLights.push({
			object: screenPanel,
			originalColor: Colors.brightBlue,
			alternateColor: Colors.electricBlue,
			blinkRate: 2
		});

		group.position.set(x, y, z);
		scene.add(group);
		vaultObjects.push(group);
		return group;
	}

	function createEmergencyLight(x, y, z) {
		var light = new THREE.Mesh(
			new THREE.SphereGeometry(0.3, 16, 16),
			new THREE.MeshPhongMaterial({ color: Colors.emergencyRed, emissive: Colors.emergencyRed })
		);
		light.position.set(x, y, z);
		scene.add(light);
		animatedLights.push({
			object: light,
			originalColor: Colors.emergencyRed,
			alternateColor: Colors.darkRed,
			blinkRate: 1.2
		});
		vaultObjects.push(light);
		return light;
	}

	function createFloorTiles(startX, endX, startZ, endZ, tileSize) {
		var group = new THREE.Group();
		var size = tileSize || 2;

		for (var x = startX; x < endX; x += size) {
			for (var z = startZ; z < endZ; z += size) {
				var isCheckerboard = ((Math.floor(x / size) + Math.floor(z / size)) % 2 === 0);
				var color = isCheckerboard ? Colors.charcoal : Colors.darkGrey;

				var tile = new THREE.Mesh(
					new THREE.BoxGeometry(size - 0.05, 0.2, size - 0.05),
					new THREE.MeshPhongMaterial({ color: color, emissive: 0x000000 })
				);
				tile.position.set(x + size / 2, 0.1, z + size / 2);
				group.add(tile);
			}
		}

		scene.add(group);
		vaultObjects.push(group);
		return group;
	}

	function createCableTray(x, z, length, width) {
		var group = new THREE.Group();
		var trayLength = length || 8;
		var trayWidth = width || 1;

		var trayBase = new THREE.Mesh(
			new THREE.BoxGeometry(trayLength, 0.3, trayWidth),
			new THREE.MeshPhongMaterial({ color: Colors.darkGrey, shininess: 40 })
		);
		trayBase.position.y = 7;
		group.add(trayBase);

		var sideCount = 2;
		for (var i = 0; i < sideCount; i++) {
			var xOff = (i === 0 ? -trayWidth / 2 : trayWidth / 2);
			var side = new THREE.Mesh(
				new THREE.BoxGeometry(trayLength, 0.5, 0.15),
				new THREE.MeshPhongMaterial({ color: Colors.lightGrey, shininess: 30 })
			);
			side.position.set(xOff, 6.85, 0);
			group.add(side);
		}

		var supportCount = Math.floor(trayLength / 2);
		for (var j = 0; j < supportCount; j++) {
			var xPos = -trayLength / 2 + (j * 2);
			var support = new THREE.Mesh(
				new THREE.BoxGeometry(0.2, 6.8, 0.2),
				new THREE.MeshPhongMaterial({ color: Colors.metalSilver, shininess: 60 })
			);
			support.position.set(xPos, 3.4, 0);
			group.add(support);
		}

		group.position.set(x, 0, z);
		scene.add(group);
		vaultObjects.push(group);
		return group;
	}

	function createWatchtower(x, z) {
		var group = new THREE.Group();

		var baseColumn = new THREE.Mesh(
			new THREE.CylinderGeometry(0.6, 0.8, 6, 8),
			new THREE.MeshPhongMaterial({ color: Colors.darkGrey, shininess: 40 })
		);
		baseColumn.position.y = 3;
		group.add(baseColumn);

		var platform = new THREE.Mesh(
			new THREE.BoxGeometry(2, 0.3, 2),
			new THREE.MeshPhongMaterial({ color: Colors.metalSilver, shininess: 80 })
		);
		platform.position.y = 6.2;
		group.add(platform);

		var guardCabin = new THREE.Mesh(
			new THREE.BoxGeometry(1.6, 1.4, 1.6),
			new THREE.MeshPhongMaterial({ color: Colors.charcoal, emissive: 0x0a0a0a })
		);
		guardCabin.position.y = 7.2;
		group.add(guardCabin);

		var roofCone = new THREE.Mesh(
			new THREE.ConeGeometry(1.2, 1, 8),
			new THREE.MeshPhongMaterial({ color: Colors.metalSilver, shininess: 70 })
		);
		roofCone.position.y = 8.2;
		group.add(roofCone);

		var searchlight = new THREE.Mesh(
			new THREE.SphereGeometry(0.25, 12, 12),
			new THREE.MeshPhongMaterial({ color: Colors.electricBlue, emissive: Colors.electricBlue })
		);
		searchlight.position.set(0, 8.5, 0.8);
		group.add(searchlight);
		animatedLights.push({
			object: searchlight,
			originalColor: Colors.electricBlue,
			alternateColor: Colors.brightBlue,
			blinkRate: 2
		});

		group.position.set(x, 0, z);
		scene.add(group);
		vaultObjects.push(group);
		return group;
	}

	function createHolographicDisplay(x, y, z) {
		var group = new THREE.Group();

		var frameCorners = [
			[-0.8, -0.6],
			[0.8, -0.6],
			[-0.8, 0.6],
			[0.8, 0.6]
		];

		for (var i = 0; i < frameCorners.length; i++) {
			var corner = new THREE.Mesh(
				new THREE.BoxGeometry(0.15, 0.15, 0.15),
				new THREE.MeshPhongMaterial({ color: Colors.metalSilver, shininess: 80 })
			);
			corner.position.set(frameCorners[i][0], frameCorners[i][1], 0);
			group.add(corner);
		}

		var displayPanel = new THREE.Mesh(
			new THREE.BoxGeometry(1.6, 1.2, 0.08),
			new THREE.MeshPhongMaterial({ color: Colors.electricBlue, emissive: Colors.electricBlue })
		);
		displayPanel.position.z = 0.05;
		group.add(displayPanel);
		animatedLights.push({
			object: displayPanel,
			originalColor: Colors.electricBlue,
			alternateColor: Colors.brightBlue,
			blinkRate: 2.5
		});

		var holoBit1 = new THREE.Mesh(
			new THREE.SphereGeometry(0.15, 8, 8),
			new THREE.MeshPhongMaterial({ color: Colors.emeraldGreen, emissive: Colors.emeraldGreen })
		);
		holoBit1.position.set(-0.3, 0.1, 0.3);
		group.add(holoBit1);

		var holoBit2 = new THREE.Mesh(
			new THREE.SphereGeometry(0.15, 8, 8),
			new THREE.MeshPhongMaterial({ color: Colors.emeraldGreen, emissive: Colors.emeraldGreen })
		);
		holoBit2.position.set(0.3, -0.1, 0.35);
		group.add(holoBit2);

		group.position.set(x, y, z);
		scene.add(group);
		vaultObjects.push(group);
		return group;
	}

	function createPowerGenerator(x, z) {
		var group = new THREE.Group();

		var mainCylinder = new THREE.Mesh(
			new THREE.CylinderGeometry(1.2, 1.2, 3, 12),
			new THREE.MeshPhongMaterial({ color: Colors.darkGrey, shininess: 50 })
		);
		mainCylinder.position.y = 1.5;
		group.add(mainCylinder);

		var topCap = new THREE.Mesh(
			new THREE.SphereGeometry(1.2, 12, 12),
			new THREE.MeshPhongMaterial({ color: Colors.lightGrey, shininess: 60 })
		);
		topCap.position.y = 3.2;
		group.add(topCap);

		var housing = new THREE.Mesh(
			new THREE.BoxGeometry(2.8, 2.5, 2.8),
			new THREE.MeshPhongMaterial({ color: Colors.charcoal, emissive: 0x0a0a0a })
		);
		housing.position.y = 1.5;
		group.add(housing);

		var coolingFin1 = new THREE.Mesh(
			new THREE.BoxGeometry(0.3, 2.5, 2.8),
			new THREE.MeshPhongMaterial({ color: Colors.darkGrey, shininess: 45 })
		);
		coolingFin1.position.set(1.55, 1.5, 0);
		group.add(coolingFin1);

		var coolingFin2 = new THREE.Mesh(
			new THREE.BoxGeometry(0.3, 2.5, 2.8),
			new THREE.MeshPhongMaterial({ color: Colors.darkGrey, shininess: 45 })
		);
		coolingFin2.position.set(-1.55, 1.5, 0);
		group.add(coolingFin2);

		var powerLight = new THREE.Mesh(
			new THREE.SphereGeometry(0.25, 12, 12),
			new THREE.MeshPhongMaterial({ color: Colors.dullGreen, emissive: Colors.dullGreen })
		);
		powerLight.position.set(0, 2.8, 1.5);
		group.add(powerLight);
		animatedLights.push({
			object: powerLight,
			originalColor: Colors.dullGreen,
			alternateColor: Colors.emeraldGreen,
			blinkRate: 1.5
		});

		group.position.set(x, 0, z);
		scene.add(group);
		vaultObjects.push(group);
		return group;
	}

	function createVaultRoom(centerX, centerZ, width, depth) {
		var group = new THREE.Group();

		createFloorTiles(centerX - width / 2, centerX + width / 2, centerZ - depth / 2, centerZ + depth / 2, 2);

		var northWall = new THREE.Mesh(
			new THREE.BoxGeometry(width, 7, 0.3),
			new THREE.MeshPhongMaterial({ color: Colors.charcoal, emissive: 0x0a0a0a })
		);
		northWall.position.set(centerX, 3.5, centerZ - depth / 2);
		scene.add(northWall);
		vaultObjects.push(northWall);

		var southWall = new THREE.Mesh(
			new THREE.BoxGeometry(width, 7, 0.3),
			new THREE.MeshPhongMaterial({ color: Colors.charcoal, emissive: 0x0a0a0a })
		);
		southWall.position.set(centerX, 3.5, centerZ + depth / 2);
		scene.add(southWall);
		vaultObjects.push(southWall);

		var eastWall = new THREE.Mesh(
			new THREE.BoxGeometry(0.3, 7, depth),
			new THREE.MeshPhongMaterial({ color: Colors.charcoal, emissive: 0x0a0a0a })
		);
		eastWall.position.set(centerX + width / 2, 3.5, centerZ);
		scene.add(eastWall);
		vaultObjects.push(eastWall);

		var westWall = new THREE.Mesh(
			new THREE.BoxGeometry(0.3, 7, depth),
			new THREE.MeshPhongMaterial({ color: Colors.charcoal, emissive: 0x0a0a0a })
		);
		westWall.position.set(centerX - width / 2, 3.5, centerZ);
		scene.add(westWall);
		vaultObjects.push(westWall);

		var ceiling = new THREE.Mesh(
			new THREE.BoxGeometry(width, 0.3, depth),
			new THREE.MeshPhongMaterial({ color: Colors.darkGrey, emissive: 0x050505 })
		);
		ceiling.position.set(centerX, 7, centerZ);
		scene.add(ceiling);
		vaultObjects.push(ceiling);

		return group;
	}

	function init(sceneParam, cameraParam) {
		scene = sceneParam;
		camera = cameraParam;
		vaultObjects = [];
		animatedLights = [];
		rotatingFans = [];

		createVaultRoom(0, 0, 40, 40);
		createVaultRoom(35, 0, 30, 35);
		createVaultRoom(-35, 0, 30, 35);

		var rackRows = [
			{ x: -15, z: -10, count: 3 },
			{ x: -15, z: 0, count: 3 },
			{ x: -15, z: 10, count: 3 },
			{ x: 5, z: -10, count: 3 },
			{ x: 5, z: 0, count: 3 },
			{ x: 5, z: 10, count: 3 }
		];

		for (var r = 0; r < rackRows.length; r++) {
			var row = rackRows[r];
			for (var i = 0; i < row.count; i++) {
				createServerRack(row.x + (i * 3), row.z);
			}
		}

		createVaultDoor(-20, -19, 3, 4, true);
		createVaultDoor(20, -19, 3, 4, true);
		createVaultDoor(32, 0, 2.5, 3.5, false);
		createVaultDoor(-32, 0, 2.5, 3.5, false);
		createVaultDoor(0, 18, 3, 4, true);

		createCoolingPipe(-18, -5, -18, 5, 6.5);
		createCoolingPipe(-5, -8, 15, -8, 6.5);
		createCoolingPipe(10, 12, 10, -12, 6.5);

		createSecurityLaserGrid(0, 0, 30, 5, 30);

		createControlTerminal(-25, 0.5, -15);
		createControlTerminal(25, 0.5, 15);
		createControlTerminal(0, 0.5, 18);

		createEmergencyLight(-19, 6.5, -15);
		createEmergencyLight(-19, 6.5, 10);
		createEmergencyLight(19, 6.5, -15);
		createEmergencyLight(19, 6.5, 10);
		createEmergencyLight(0, 6.5, -19);
		createEmergencyLight(0, 6.5, 19);
		createEmergencyLight(-18, 6.5, 18);
		createEmergencyLight(18, 6.5, 18);

		createCableTray(-12, -8, 10, 1.2);
		createCableTray(8, 6, 12, 1.2);
		createCableTray(-18, 0, 8, 1);

		createWatchtower(-25, -20);
		createWatchtower(25, -20);
		createWatchtower(-25, 20);
		createWatchtower(25, 20);

		createHolographicDisplay(-28, 4, -15);
		createHolographicDisplay(28, 4, 15);
		createHolographicDisplay(0, 4, -28);

		createPowerGenerator(-30, 10);
		createPowerGenerator(30, -10);

		console.log('DataVault initialized with ' + vaultObjects.length + ' objects and ' + animatedLights.length + ' animated lights');
	}

	function update(delta) {
		blinkingState += delta * blinkingSpeed;

		for (var i = 0; i < animatedLights.length; i++) {
			var light = animatedLights[i];
			var shouldBlink = Math.sin(blinkingState * light.blinkRate) > 0;
			var targetColor = shouldBlink ? light.originalColor : light.alternateColor;
			light.object.material.color.setHex(targetColor);
			light.object.material.emissive.setHex(targetColor);
		}

		for (var j = 0; j < rotatingFans.length; j++) {
			rotatingFans[j].rotation.y += delta * 3;
		}
	}

	function reset() {
		for (var i = vaultObjects.length - 1; i >= 0; i--) {
			var obj = vaultObjects[i];
			if (obj.geometry) {
				obj.geometry.dispose();
			}
			if (obj.material) {
				if (Array.isArray(obj.material)) {
					for (var m = 0; m < obj.material.length; m++) {
						obj.material[m].dispose();
					}
				} else {
					obj.material.dispose();
				}
			}
			if (obj.parent) {
				obj.parent.remove(obj);
			}
			scene.remove(obj);
		}

		vaultObjects = [];
		animatedLights = [];
		rotatingFans = [];
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
