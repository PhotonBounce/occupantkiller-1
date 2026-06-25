window.PenicuikBase = (function() {
	'use strict';

	var scene;
	var objects = [];
	var lights = [];

	var init = function(sceneRef) {
		scene = sceneRef;
		objects = [];
		lights = [];

		buildMillComplex();
		buildWaterLade();
		buildRadarStation();
		buildBarracks();
		buildParadeGround();
		buildWellingtonStatue();
		buildAntiTankBerm();
		buildArtilleryBattery();
		setupLighting();
	};

	var buildMillComplex = function() {
		var millGeometry = new THREE.BoxGeometry(24, 8, 16);
		var millMaterial = new THREE.MeshLambertMaterial({color: 0x998877});
		var mill = new THREE.Mesh(millGeometry, millMaterial);
		mill.position.set(-15, 4, -10);
		scene.add(mill);
		objects.push(mill);

		var chimney1Geometry = new THREE.CylinderGeometry(0.8, 0.8, 12, 16);
		var chimney1Material = new THREE.MeshLambertMaterial({color: 0x665544});
		var chimney1 = new THREE.Mesh(chimney1Geometry, chimney1Material);
		chimney1.position.set(-20, 8, -5);
		scene.add(chimney1);
		objects.push(chimney1);

		var chimney2Geometry = new THREE.CylinderGeometry(0.8, 0.8, 12, 16);
		var chimney2Material = new THREE.MeshLambertMaterial({color: 0x665544});
		var chimney2 = new THREE.Mesh(chimney2Geometry, chimney2Material);
		chimney2.position.set(-10, 8, -5);
		scene.add(chimney2);
		objects.push(chimney2);

		var chimney3Geometry = new THREE.CylinderGeometry(0.8, 0.8, 12, 16);
		var chimney3Material = new THREE.MeshLambertMaterial({color: 0x665544});
		var chimney3 = new THREE.Mesh(chimney3Geometry, chimney3Material);
		chimney3.position.set(-15, 8, -15);
		scene.add(chimney3);
		objects.push(chimney3);
	};

	var buildWaterLade = function() {
		var ladeGeometry = new THREE.BoxGeometry(20, 1, 3);
		var ladeMaterial = new THREE.MeshLambertMaterial({color: 0x666655});
		var lade = new THREE.Mesh(ladeGeometry, ladeMaterial);
		lade.position.set(-5, 0.5, -2);
		scene.add(lade);
		objects.push(lade);

		var stoneLineGeometry = new THREE.BoxGeometry(20.5, 0.3, 3.5);
		var stoneLineMaterial = new THREE.MeshLambertMaterial({color: 0x777766});
		var stoneLine = new THREE.Mesh(stoneLineGeometry, stoneLineMaterial);
		stoneLine.position.set(-5, 1.2, -2);
		scene.add(stoneLine);
		objects.push(stoneLine);
	};

	var buildRadarStation = function() {
		var plinthGeometry = new THREE.BoxGeometry(12, 3, 12);
		var plinthMaterial = new THREE.MeshLambertMaterial({color: 0x888877});
		var plinth = new THREE.Mesh(plinthGeometry, plinthMaterial);
		plinth.position.set(20, 1.5, 15);
		scene.add(plinth);
		objects.push(plinth);

		var radarGeometry = new THREE.SphereGeometry(4, 32, 32);
		var radarMaterial = new THREE.MeshLambertMaterial({color: 0xFFFFFF});
		var radar = new THREE.Mesh(radarGeometry, radarMaterial);
		radar.position.set(20, 6.5, 15);
		radar.name = 'radarSphere';
		scene.add(radar);
		objects.push(radar);
	};

	var buildBarracks = function() {
		var barracksGeometry = new THREE.BoxGeometry(30, 5, 20);
		var barracksMaterial = new THREE.MeshLambertMaterial({color: 0x888877});
		var barracks = new THREE.Mesh(barracksGeometry, barracksMaterial);
		barracks.position.set(10, 2.5, 5);
		scene.add(barracks);
		objects.push(barracks);
	};

	var buildParadeGround = function() {
		var groundGeometry = new THREE.BoxGeometry(30, 0.3, 20);
		var groundMaterial = new THREE.MeshLambertMaterial({color: 0x888888});
		var ground = new THREE.Mesh(groundGeometry, groundMaterial);
		ground.position.set(10, 5.2, 5);
		scene.add(ground);
		objects.push(ground);
	};

	var buildWellingtonStatue = function() {
		var plinthGeometry = new THREE.BoxGeometry(2, 5, 2);
		var plinthMaterial = new THREE.MeshLambertMaterial({color: 0x444433});
		var plinth = new THREE.Mesh(plinthGeometry, plinthMaterial);
		plinth.position.set(8, 2.5, 8);
		scene.add(plinth);
		objects.push(plinth);

		var statueGeometry = new THREE.BoxGeometry(1, 4, 1);
		var statueMaterial = new THREE.MeshLambertMaterial({color: 0x333322});
		var statue = new THREE.Mesh(statueGeometry, statueMaterial);
		statue.position.set(8, 7, 8);
		scene.add(statue);
		objects.push(statue);
	};

	var buildAntiTankBerm = function() {
		var bermGeometry = new THREE.BoxGeometry(30, 2, 3);
		var bermMaterial = new THREE.MeshLambertMaterial({color: 0x5C4030});
		var berm = new THREE.Mesh(bermGeometry, bermMaterial);
		berm.position.set(10, 1, -8);
		scene.add(berm);
		objects.push(berm);
	};

	var buildArtilleryBattery = function() {
		var cannonPositions = [
			{x: -5, z: 10},
			{x: 0, z: 10},
			{x: 5, z: 10},
			{x: 10, z: 10}
		];

		for (var i = 0; i < cannonPositions.length; i++) {
			var pos = cannonPositions[i];

			var cannonBodyGeometry = new THREE.BoxGeometry(0.4, 0.4, 2);
			var cannonMaterial = new THREE.MeshLambertMaterial({color: 0x556633});
			var cannonBody = new THREE.Mesh(cannonBodyGeometry, cannonMaterial);
			cannonBody.position.set(pos.x, 1, pos.z);
			cannonBody.rotation.z = 0.3;
			scene.add(cannonBody);
			objects.push(cannonBody);

			var cannonWheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16);
			var cannonWheelMaterial = new THREE.MeshLambertMaterial({color: 0x444433});
			var cannonWheel1 = new THREE.Mesh(cannonWheelGeometry, cannonWheelMaterial);
			cannonWheel1.rotation.z = Math.PI / 2;
			cannonWheel1.position.set(pos.x - 0.6, 0.5, pos.z);
			scene.add(cannonWheel1);
			objects.push(cannonWheel1);

			var cannonWheel2 = new THREE.Mesh(cannonWheelGeometry, cannonWheelMaterial);
			cannonWheel2.rotation.z = Math.PI / 2;
			cannonWheel2.position.set(pos.x + 0.6, 0.5, pos.z);
			scene.add(cannonWheel2);
			objects.push(cannonWheel2);
		}
	};

	var setupLighting = function() {
		var ambientGeometry = new THREE.BoxGeometry(1, 1, 1);
		var ambientMaterial = new THREE.MeshLambertMaterial({color: 0xCC9955});
		var ambientLight = new THREE.AmbientLight(0xCC9955, 0.6);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var floodlight1 = new THREE.PointLight(0xFFFFFF, 0.9, 100);
		floodlight1.position.set(-10, 15, 5);
		scene.add(floodlight1);
		lights.push(floodlight1);

		var floodlight2 = new THREE.PointLight(0xFFFFFF, 0.9, 100);
		floodlight2.position.set(15, 15, 15);
		scene.add(floodlight2);
		lights.push(floodlight2);

		var floodlight3 = new THREE.PointLight(0xFFFFFF, 0.9, 100);
		floodlight3.position.set(25, 15, -5);
		scene.add(floodlight3);
		lights.push(floodlight3);
	};

	var update = function(delta) {
		for (var i = 0; i < objects.length; i++) {
			if (objects[i].name === 'radarSphere') {
				objects[i].rotation.y += delta * 0.5;
			}
		}
	};

	var reset = function() {
		for (var i = 0; i < objects.length; i++) {
			scene.remove(objects[i]);
		}
		for (var i = 0; i < lights.length; i++) {
			scene.remove(lights[i]);
		}
		objects = [];
		lights = [];
	};

	return {
		init: init,
		update: update,
		reset: reset,
		objects: objects,
		lights: lights
	};
}());
