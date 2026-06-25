window.IceBreaker = (function() {
	'use strict';

	var scene;
	var camera;
	var time = 0;
	var objects = [];
	var lights = [];
	var auroras = [];
	var iceFloes = [];
	var shipParts = [];

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		time = 0;
		objects = [];
		lights = [];
		auroras = [];
		iceFloes = [];
		shipParts = [];

		buildhull();
		buildbridge();
		buildweapons();
		builddeckstructures();
		buildicefloes();
		buildfortress();
		buildlifeboats();
		buildcrewquarters();
		buildaurorapillars();
		buildlights();
		buildpolarlair();
	}

	function buildhull() {
		var material = new THREE.MeshLambertMaterial({ color: 0xcccccc });
		var geometry = new THREE.BoxGeometry(40, 20, 120);
		var hull = new THREE.Mesh(geometry, material);
		hull.position.set(0, -5, 0);
		hull.castShadow = true;
		hull.receiveShadow = true;
		scene.add(hull);
		objects.push(hull);
		shipParts.push(hull);

		var reinforcement = new THREE.BoxGeometry(42, 5, 122);
		var reinforcementmat = new THREE.MeshLambertMaterial({ color: 0x999999 });
		var reinforce1 = new THREE.Mesh(reinforcement, reinforcementmat);
		reinforce1.position.set(0, 3, 0);
		scene.add(reinforce1);
		objects.push(reinforce1);
		shipParts.push(reinforce1);

		var keel = new THREE.BoxGeometry(38, 3, 118);
		var keelmat = new THREE.MeshLambertMaterial({ color: 0x888888 });
		var keelMesh = new THREE.Mesh(keel, keelmat);
		keelMesh.position.set(0, -13, 0);
		scene.add(keelMesh);
		objects.push(keelMesh);
		shipParts.push(keelMesh);

		var bow = new THREE.ConeGeometry(15, 35, 8);
		var bowmat = new THREE.MeshLambertMaterial({ color: 0xbbbbbb });
		var bowMesh = new THREE.Mesh(bow, bowmat);
		bowMesh.position.set(0, 0, 65);
		bowMesh.castShadow = true;
		scene.add(bowMesh);
		objects.push(bowMesh);
		shipParts.push(bowMesh);
	}

	function buildbridge() {
		var bridgemat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
		var towergeometry = new THREE.BoxGeometry(12, 25, 15);
		var tower = new THREE.Mesh(towergeometry, bridgemat);
		tower.position.set(0, 18, -15);
		tower.castShadow = true;
		scene.add(tower);
		objects.push(tower);
		shipParts.push(tower);

		var crowngeometry = new THREE.BoxGeometry(14, 8, 17);
		var crown = new THREE.Mesh(crowngeometry, bridgemat);
		crown.position.set(0, 34, -15);
		crown.castShadow = true;
		scene.add(crown);
		objects.push(crown);
		shipParts.push(crown);

		var radargeometry = new THREE.SphereGeometry(3, 8, 8);
		var radarmat = new THREE.MeshLambertMaterial({ color: 0x444444 });
		var radar1 = new THREE.Mesh(radargeometry, radarmat);
		radar1.position.set(5, 43, -15);
		scene.add(radar1);
		objects.push(radar1);

		var radar2 = new THREE.Mesh(radargeometry, radarmat);
		radar2.position.set(-5, 43, -15);
		scene.add(radar2);
		objects.push(radar2);

		var antennamat = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var antenna1geometry = new THREE.CylinderGeometry(0.5, 0.5, 12, 6);
		var antenna1 = new THREE.Mesh(antenna1geometry, antennamat);
		antenna1.position.set(0, 48, -15);
		scene.add(antenna1);
		objects.push(antenna1);

		var antenna2 = new THREE.Mesh(antenna1geometry, antennamat);
		antenna2.position.set(3, 46, -17);
		antenna2.rotation.z = 0.4;
		scene.add(antenna2);
		objects.push(antenna2);
	}

	function buildweapons() {
		var cannonmat = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var barrelgeometry = new THREE.CylinderGeometry(1.5, 1.5, 20, 8);
		var barrel1 = new THREE.Mesh(barrelgeometry, cannonmat);
		barrel1.position.set(10, 8, 25);
		barrel1.rotation.z = 0.2;
		scene.add(barrel1);
		objects.push(barrel1);

		var cannon1base = new THREE.CylinderGeometry(4, 4, 3, 12);
		var cannon1 = new THREE.Mesh(cannon1base, cannonmat);
		cannon1.position.set(10, 5, 25);
		scene.add(cannon1);
		objects.push(cannon1);

		var barrel2 = new THREE.Mesh(barrelgeometry, cannonmat);
		barrel2.position.set(-10, 8, 25);
		barrel2.rotation.z = -0.2;
		scene.add(barrel2);
		objects.push(barrel2);

		var cannon2 = new THREE.Mesh(cannon1base, cannonmat);
		cannon2.position.set(-10, 5, 25);
		scene.add(cannon2);
		objects.push(cannon2);

		var missilemat = new THREE.MeshLambertMaterial({ color: 0x555555 });
		var missileboxgeometry = new THREE.BoxGeometry(8, 5, 8);
		var missilepod1 = new THREE.Mesh(missileboxgeometry, missilemat);
		missilepod1.position.set(15, 12, -8);
		scene.add(missilepod1);
		objects.push(missilepod1);

		var missilepod2 = new THREE.Mesh(missileboxgeometry, missilemat);
		missilepod2.position.set(-15, 12, -8);
		scene.add(missilepod2);
		objects.push(missilepod2);

		var missilecone1 = new THREE.ConeGeometry(2, 8, 6);
		var missilecmat = new THREE.MeshLambertMaterial({ color: 0xcccc00 });
		var missile1 = new THREE.Mesh(missilecone1, missilecmat);
		missile1.position.set(15, 17, -8);
		scene.add(missile1);
		objects.push(missile1);

		var missile2 = new THREE.Mesh(missilecone1, missilecmat);
		missile2.position.set(-15, 17, -8);
		scene.add(missile2);
		objects.push(missile2);

		var gunmat = new THREE.MeshLambertMaterial({ color: 0x444444 });
		var gunturret = new THREE.CylinderGeometry(3, 3, 4, 12);
		var gun1 = new THREE.Mesh(gunturret, gunmat);
		gun1.position.set(8, 10, -30);
		scene.add(gun1);
		objects.push(gun1);

		var gun2 = new THREE.Mesh(gunturret, gunmat);
		gun2.position.set(-8, 10, -30);
		scene.add(gun2);
		objects.push(gun2);
	}

	function builddeckstructures() {
		var deckmat = new THREE.MeshLambertMaterial({ color: 0xdddddd });
		var containergeometry = new THREE.BoxGeometry(8, 6, 12);
		var container1 = new THREE.Mesh(containergeometry, deckmat);
		container1.position.set(18, 8, 35);
		scene.add(container1);
		objects.push(container1);

		var container2 = new THREE.Mesh(containergeometry, deckmat);
		container2.position.set(-18, 8, 35);
		scene.add(container2);
		objects.push(container2);

		var container3 = new THREE.Mesh(containergeometry, deckmat);
		container3.position.set(18, 8, 50);
		scene.add(container3);
		objects.push(container3);

		var container4 = new THREE.Mesh(containergeometry, deckmat);
		container4.position.set(-18, 8, 50);
		scene.add(container4);
		objects.push(container4);

		var ventmat = new THREE.MeshLambertMaterial({ color: 0x888888 });
		var ventgeometry = new THREE.CylinderGeometry(2, 2, 6, 8);
		var vent1 = new THREE.Mesh(ventgeometry, ventmat);
		vent1.position.set(12, 10, -5);
		scene.add(vent1);
		objects.push(vent1);

		var vent2 = new THREE.Mesh(ventgeometry, ventmat);
		vent2.position.set(-12, 10, -5);
		scene.add(vent2);
		objects.push(vent2);

		var vent3 = new THREE.Mesh(ventgeometry, ventmat);
		vent3.position.set(12, 10, 10);
		scene.add(vent3);
		objects.push(vent3);

		var railmat = new THREE.MeshLambertMaterial({ color: 0x666666 });
		var railgeometry = new THREE.CylinderGeometry(0.3, 0.3, 80, 6);
		var railLeft = new THREE.Mesh(railgeometry, railmat);
		railLeft.position.set(22, 12, 0);
		railLeft.rotation.z = Math.PI / 2;
		scene.add(railLeft);
		objects.push(railLeft);

		var railRight = new THREE.Mesh(railgeometry, railmat);
		railRight.position.set(-22, 12, 0);
		railRight.rotation.z = Math.PI / 2;
		scene.add(railRight);
		objects.push(railRight);
	}

	function buildicefloes() {
		var icemat1 = new THREE.MeshLambertMaterial({ color: 0xccddee });
		var icemat2 = new THREE.MeshLambertMaterial({ color: 0xbbccdd });
		var icemat3 = new THREE.MeshLambertMaterial({ color: 0xaabbcc });

		var floe1geom = new THREE.BoxGeometry(35, 4, 40);
		var floe1 = new THREE.Mesh(floe1geom, icemat1);
		floe1.position.set(50, -8, 20);
		floe1.rotation.z = 0.3;
		scene.add(floe1);
		objects.push(floe1);
		iceFloes.push(floe1);

		var floe2geom = new THREE.BoxGeometry(30, 4, 35);
		var floe2 = new THREE.Mesh(floe2geom, icemat2);
		floe2.position.set(-55, -8, -30);
		floe2.rotation.z = -0.2;
		scene.add(floe2);
		objects.push(floe2);
		iceFloes.push(floe2);

		var floe3geom = new THREE.BoxGeometry(28, 4, 32);
		var floe3 = new THREE.Mesh(floe3geom, icemat3);
		floe3.position.set(-35, -8, 60);
		floe3.rotation.z = 0.15;
		scene.add(floe3);
		objects.push(floe3);
		iceFloes.push(floe3);

		var floe4geom = new THREE.BoxGeometry(32, 4, 38);
		var floe4 = new THREE.Mesh(floe4geom, icemat1);
		floe4.position.set(45, -8, -50);
		floe4.rotation.z = -0.25;
		scene.add(floe4);
		objects.push(floe4);
		iceFloes.push(floe4);

		var crackmat = new THREE.MeshLambertMaterial({ color: 0x5588bb });
		var crackgeom = new THREE.BoxGeometry(25, 2, 3);
		var crack1 = new THREE.Mesh(crackgeom, crackmat);
		crack1.position.set(45, -6, 15);
		scene.add(crack1);
		objects.push(crack1);

		var crack2 = new THREE.Mesh(crackgeom, crackmat);
		crack2.position.set(-50, -6, -25);
		crack2.rotation.z = 0.4;
		scene.add(crack2);
		objects.push(crack2);

		var crack3geom = new THREE.BoxGeometry(20, 2, 3);
		var crack3 = new THREE.Mesh(crack3geom, crackmat);
		crack3.position.set(-30, -6, 55);
		crack3.rotation.z = -0.3;
		scene.add(crack3);
		objects.push(crack3);
	}

	function buildfortress() {
		var fortmat = new THREE.MeshLambertMaterial({ color: 0xbbccdd });
		var wallgeom = new THREE.BoxGeometry(25, 12, 3);
		var wall1 = new THREE.Mesh(wallgeom, fortmat);
		wall1.position.set(-80, 0, -60);
		scene.add(wall1);
		objects.push(wall1);

		var wall2 = new THREE.Mesh(wallgeom, fortmat);
		wall2.position.set(-80, 0, -35);
		scene.add(wall2);
		objects.push(wall2);

		var wall3geom = new THREE.BoxGeometry(3, 12, 30);
		var wall3 = new THREE.Mesh(wall3geom, fortmat);
		wall3.position.set(-92, 0, -47);
		scene.add(wall3);
		objects.push(wall3);

		var wall4 = new THREE.Mesh(wall3geom, fortmat);
		wall4.position.set(-68, 0, -47);
		scene.add(wall4);
		objects.push(wall4);

		var towermat = new THREE.MeshLambertMaterial({ color: 0xaabbcc });
		var towergeom = new THREE.CylinderGeometry(5, 5, 20, 12);
		var tower1 = new THREE.Mesh(towergeom, towermat);
		tower1.position.set(-92, 8, -60);
		scene.add(tower1);
		objects.push(tower1);

		var tower2 = new THREE.Mesh(towergeom, towermat);
		tower2.position.set(-68, 8, -60);
		scene.add(tower2);
		objects.push(tower2);

		var tower3 = new THREE.Mesh(towergeom, towermat);
		tower3.position.set(-92, 8, -35);
		scene.add(tower3);
		objects.push(tower3);

		var tower4 = new THREE.Mesh(towergeom, towermat);
		tower4.position.set(-68, 8, -35);
		scene.add(tower4);
		objects.push(tower4);

		var flagmat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
		var flaggeom = new THREE.BoxGeometry(1, 8, 6);
		var flag = new THREE.Mesh(flaggeom, flagmat);
		flag.position.set(-80, 28, -47);
		scene.add(flag);
		objects.push(flag);
	}

	function buildlifeboats() {
		var boatmat = new THREE.MeshLambertMaterial({ color: 0xffcc00 });
		var boatgeom = new THREE.BoxGeometry(6, 3, 12);
		var boat1 = new THREE.Mesh(boatgeom, boatmat);
		boat1.position.set(28, 18, 40);
		scene.add(boat1);
		objects.push(boat1);

		var boat2 = new THREE.Mesh(boatgeom, boatmat);
		boat2.position.set(-28, 18, 40);
		scene.add(boat2);
		objects.push(boat2);

		var boatroof1 = new THREE.ConeGeometry(3, 4, 8);
		var boatroof1mat = new THREE.MeshLambertMaterial({ color: 0xffaa00 });
		var roof1 = new THREE.Mesh(boatroof1mat, boatroof1);
		roof1.position.set(28, 21, 40);
		scene.add(roof1);
		objects.push(roof1);

		var roof2 = new THREE.Mesh(boatroof1, boatroof1mat);
		roof2.position.set(-28, 21, 40);
		scene.add(roof2);
		objects.push(roof2);

		var davitmat = new THREE.MeshLambertMaterial({ color: 0x666666 });
		var davitgeom = new THREE.CylinderGeometry(0.8, 0.8, 15, 8);
		var davit1 = new THREE.Mesh(davitgeom, davitmat);
		davit1.position.set(30, 15, 40);
		davit1.rotation.z = -0.5;
		scene.add(davit1);
		objects.push(davit1);

		var davit2 = new THREE.Mesh(davitgeom, davitmat);
		davit2.position.set(-30, 15, 40);
		davit2.rotation.z = 0.5;
		scene.add(davit2);
		objects.push(davit2);
	}

	function buildcrewquarters() {
		var quartermat = new THREE.MeshLambertMaterial({ color: 0xdddddd });
		var barracks1geom = new THREE.BoxGeometry(12, 8, 18);
		var barracks1 = new THREE.Mesh(barracks1geom, quartermat);
		barracks1.position.set(-18, 8, -40);
		scene.add(barracks1);
		objects.push(barracks1);

		var barracks2 = new THREE.Mesh(barracks1geom, quartermat);
		barracks2.position.set(18, 8, -40);
		scene.add(barracks2);
		objects.push(barracks2);

		var windowmat = new THREE.MeshLambertMaterial({ color: 0x4488cc });
		var windowgeom = new THREE.BoxGeometry(2, 2, 0.5);
		var window1 = new THREE.Mesh(windowgeom, windowmat);
		window1.position.set(-18, 10, -31);
		scene.add(window1);
		objects.push(window1);

		var window2 = new THREE.Mesh(windowgeom, windowmat);
		window2.position.set(-18, 10, -40);
		scene.add(window2);
		objects.push(window2);

		var window3 = new THREE.Mesh(windowgeom, windowmat);
		window3.position.set(-18, 10, -49);
		scene.add(window3);
		objects.push(window3);

		var window4 = new THREE.Mesh(windowgeom, windowmat);
		window4.position.set(18, 10, -31);
		scene.add(window4);
		objects.push(window4);

		var window5 = new THREE.Mesh(windowgeom, windowmat);
		window5.position.set(18, 10, -40);
		scene.add(window5);
		objects.push(window5);

		var window6 = new THREE.Mesh(windowgeom, windowmat);
		window6.position.set(18, 10, -49);
		scene.add(window6);
		objects.push(window6);

		var doormat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
		var doorgeom = new THREE.BoxGeometry(3, 5, 0.5);
		var door1 = new THREE.Mesh(doorgeom, doormat);
		door1.position.set(-18, 6, -31);
		scene.add(door1);
		objects.push(door1);

		var door2 = new THREE.Mesh(doorgeom, doormat);
		door2.position.set(18, 6, -49);
		scene.add(door2);
		objects.push(door2);
	}

	function buildaurorapillars() {
		var auroramat1 = new THREE.MeshLambertMaterial({ color: 0x00ff88 });
		var auroramat2 = new THREE.MeshLambertMaterial({ color: 0x00ffcc });
		var auroramat3 = new THREE.MeshLambertMaterial({ color: 0x0099ff });

		var aurora1geom = new THREE.CylinderGeometry(8, 10, 60, 16);
		var aurora1 = new THREE.Mesh(aurora1geom, auroramat1);
		aurora1.position.set(60, 20, 30);
		aurora1.material.transparent = true;
		aurora1.material.opacity = 0.3;
		scene.add(aurora1);
		objects.push(aurora1);
		auroras.push(aurora1);

		var aurora2 = new THREE.Mesh(aurora1geom, auroramat2);
		aurora2.position.set(-70, 25, -40);
		aurora2.material.transparent = true;
		aurora2.material.opacity = 0.3;
		scene.add(aurora2);
		objects.push(aurora2);
		auroras.push(aurora2);

		var aurora3 = new THREE.Mesh(aurora1geom, auroramat3);
		aurora3.position.set(40, 30, -60);
		aurora3.material.transparent = true;
		aurora3.material.opacity = 0.3;
		scene.add(aurora3);
		objects.push(aurora3);
		auroras.push(aurora3);

		var aurora4 = new THREE.Mesh(aurora1geom, auroramat1);
		aurora4.position.set(-50, 22, 50);
		aurora4.material.transparent = true;
		aurora4.material.opacity = 0.3;
		scene.add(aurora4);
		objects.push(aurora4);
		auroras.push(aurora4);
	}

	function buildpolarlair() {
		var lairmat = new THREE.MeshLambertMaterial({ color: 0xeeeedd });
		var cavegeom = new THREE.BoxGeometry(20, 10, 25);
		var cave = new THREE.Mesh(cavegeom, lairmat);
		cave.position.set(70, -3, -70);
		scene.add(cave);
		objects.push(cave);

		var rockmat = new THREE.MeshLambertMaterial({ color: 0xccbbaa });
		var rock1geom = new THREE.SphereGeometry(4, 8, 8);
		var rock1 = new THREE.Mesh(rock1geom, rockmat);
		rock1.position.set(65, 0, -75);
		scene.add(rock1);
		objects.push(rock1);

		var rock2 = new THREE.Mesh(rock1geom, rockmat);
		rock2.position.set(75, 2, -65);
		scene.add(rock2);
		objects.push(rock2);

		var bearmat = new THREE.MeshLambertMaterial({ color: 0xffeecc });
		var beargeom = new THREE.SphereGeometry(3, 8, 8);
		var bear = new THREE.Mesh(beargeom, bearmat);
		bear.position.set(70, 2, -70);
		scene.add(bear);
		objects.push(bear);

		var headgeom = new THREE.SphereGeometry(2, 8, 8);
		var head = new THREE.Mesh(headgeom, bearmat);
		head.position.set(70, 5, -67);
		scene.add(head);
		objects.push(head);
	}

	function buildlights() {
		var amblight = new THREE.AmbientLight(0xffffff, 0.5);
		scene.add(amblight);
		lights.push(amblight);

		var dirlight = new THREE.DirectionalLight(0xffffff, 0.6);
		dirlight.position.set(50, 80, 50);
		dirlight.castShadow = true;
		dirlight.shadow.mapSize.width = 2048;
		dirlight.shadow.mapSize.height = 2048;
		scene.add(dirlight);
		lights.push(dirlight);

		var pointlight1 = new THREE.PointLight(0x00ff88, 0.4, 150);
		pointlight1.position.set(60, 50, 30);
		scene.add(pointlight1);
		lights.push(pointlight1);

		var pointlight2 = new THREE.PointLight(0x0099ff, 0.4, 150);
		pointlight2.position.set(-70, 55, -40);
		scene.add(pointlight2);
		lights.push(pointlight2);

		var shiplight = new THREE.PointLight(0xffff99, 0.3, 100);
		shiplight.position.set(0, 40, 0);
		scene.add(shiplight);
		lights.push(shiplight);
	}

	function update(delta) {
		time += delta;

		var i;
		for (i = 0; i < auroras.length; i++) {
			auroras[i].rotation.y += 0.01;
			auroras[i].material.opacity = 0.2 + 0.15 * Math.sin(time * 0.8 + i);
		}

		for (i = 0; i < shipParts.length; i++) {
			shipParts[i].position.y += 0.003 * Math.sin(time * 0.5 + i * 0.2);
		}

		for (i = 0; i < iceFloes.length; i++) {
			iceFloes[i].rotation.z += 0.0005 * (Math.sin(time * 0.3 + i) + 0.5);
			iceFloes[i].position.y += 0.002 * Math.sin(time * 0.4 + i * 0.3);
		}
	}

	function reset() {
		var i;
		for (i = objects.length - 1; i >= 0; i--) {
			scene.remove(objects[i]);
		}
		for (i = lights.length - 1; i >= 0; i--) {
			scene.remove(lights[i]);
		}
		objects = [];
		lights = [];
		auroras = [];
		iceFloes = [];
		shipParts = [];
		scene = null;
		camera = null;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
