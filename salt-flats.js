window.SaltFlats = (function() {
'use strict';

var scene = null;
var camera = null;
var objects = [];
var lights = [];
var shimmering = [];
var radarObjects = [];
var time = 0;

function init(sceneRef, cameraRef) {
	scene = sceneRef;
	camera = cameraRef;
	objects = [];
	lights = [];
	shimmering = [];
	radarObjects = [];
	time = 0;

	buildlighting();
	buildsaltformations();
	buildabandonedvehicles();
	buildresearchbase();
	builddriednlakes();
	builddeadtrees();
	buildbarrels();
	buildobservationposts();
	buildscatterdebris();
	buildheatshimmers();
	buildradararray();
}

function buildsaltformations() {
	var materials = [
		new THREE.MeshLambertMaterial({color: 0xF5F5F5}),
		new THREE.MeshLambertMaterial({color: 0xEBEBEB}),
		new THREE.MeshLambertMaterial({color: 0xFAFAFA}),
		new THREE.MeshLambertMaterial({color: 0xE8E8E8})
	];

	for (var i = 0; i < 35; i++) {
		var x = (Math.random() - 0.5) * 200;
		var z = (Math.random() - 0.5) * 200;
		var scale = 0.5 + Math.random() * 3;
		var height = 1 + Math.random() * 4;

		var geom = new THREE.BoxGeometry(scale * 2, height * 2, scale * 1.5);
		var mat = materials[Math.floor(Math.random() * materials.length)];
		var mesh = new THREE.Mesh(geom, mat);

		mesh.position.set(x, height, z);
		mesh.rotation.y = Math.random() * Math.PI;
		mesh.castShadow = true;
		mesh.receiveShadow = true;

		scene.add(mesh);
		objects.push(mesh);
	}
}

function buildabandonedvehicles() {
	var positions = [
		[-80, 0, -100],
		[60, 0, 80],
		[-40, 0, 40],
		[100, 0, -60],
		[-120, 0, 20]
	];

	for (var i = 0; i < positions.length; i++) {
		var pos = positions[i];
		var hull = new THREE.Mesh(
			new THREE.BoxGeometry(8, 4, 15),
			new THREE.MeshLambertMaterial({color: 0xD3D3D3})
		);
		hull.position.set(pos[0], pos[1] + 2, pos[2]);
		hull.rotation.y = Math.random() * Math.PI;
		hull.castShadow = true;
		hull.receiveShadow = true;
		scene.add(hull);
		objects.push(hull);

		var turret = new THREE.Mesh(
			new THREE.CylinderGeometry(1.5, 2, 3, 8),
			new THREE.MeshLambertMaterial({color: 0xBBBBBB})
		);
		turret.position.set(pos[0], pos[1] + 4, pos[2]);
		turret.castShadow = true;
		turret.receiveShadow = true;
		scene.add(turret);
		objects.push(turret);

		var gun = new THREE.Mesh(
			new THREE.CylinderGeometry(0.4, 0.4, 6, 6),
			new THREE.MeshLambertMaterial({color: 0xAAAAAA})
		);
		gun.position.set(pos[0] + 3, pos[1] + 5, pos[2]);
		gun.rotation.z = Math.PI / 6;
		gun.castShadow = true;
		scene.add(gun);
		objects.push(gun);
	}
}

function buildresearchbase() {
	var entrance = new THREE.Mesh(
		new THREE.BoxGeometry(12, 8, 3),
		new THREE.MeshLambertMaterial({color: 0xC0C0C0})
	);
	entrance.position.set(-70, 4, -60);
	entrance.castShadow = true;
	entrance.receiveShadow = true;
	scene.add(entrance);
	objects.push(entrance);

	var doorway = new THREE.Mesh(
		new THREE.BoxGeometry(4, 5, 0.5),
		new THREE.MeshLambertMaterial({color: 0x555555})
	);
	doorway.position.set(-70, 2.5, -61.5);
	doorway.castShadow = true;
	scene.add(doorway);
	objects.push(doorway);

	var antenna = new THREE.Mesh(
		new THREE.CylinderGeometry(0.3, 0.3, 12, 6),
		new THREE.MeshLambertMaterial({color: 0xA0A0A0})
	);
	antenna.position.set(-70, 10, -60);
	antenna.castShadow = true;
	scene.add(antenna);
	objects.push(antenna);

	var grate = new THREE.Mesh(
		new THREE.BoxGeometry(10, 6, 2),
		new THREE.MeshLambertMaterial({color: 0x808080})
	);
	grate.position.set(-70, 3, -55);
	grate.castShadow = true;
	grate.receiveShadow = true;
	scene.add(grate);
	objects.push(grate);
}

function builddriednlakes() {
	var lakeBeds = [
		{x: 40, z: 40, w: 60, d: 40},
		{x: -100, z: 80, w: 50, d: 35},
		{x: 80, z: -70, w: 70, d: 50}
	];

	for (var i = 0; i < lakeBeds.length; i++) {
		var bed = lakeBeds[i];
		var ground = new THREE.Mesh(
			new THREE.BoxGeometry(bed.w, 0.5, bed.d),
			new THREE.MeshLambertMaterial({color: 0xD4A574})
		);
		ground.position.set(bed.x, 0.1, bed.z);
		ground.receiveShadow = true;
		scene.add(ground);
		objects.push(ground);

		for (var j = 0; j < 8; j++) {
			var crack = new THREE.Mesh(
				new THREE.BoxGeometry(2, 0.3, 15 + Math.random() * 20),
				new THREE.MeshLambertMaterial({color: 0xA0826D})
			);
			crack.position.set(bed.x - bed.w / 2 + j * 8, 0.2, bed.z);
			crack.rotation.z = Math.random() * 0.3;
			scene.add(crack);
			objects.push(crack);
		}
	}
}

function builddeadtrees() {
	var treePositions = [
		[-50, -80],
		[30, 100],
		[-120, 60],
		[90, 20],
		[-80, 100],
		[70, -90],
		[-30, -120]
	];

	for (var i = 0; i < treePositions.length; i++) {
		var pos = treePositions[i];
		var trunk = new THREE.Mesh(
			new THREE.CylinderGeometry(0.8, 1.2, 10, 6),
			new THREE.MeshLambertMaterial({color: 0x8B7355})
		);
		trunk.position.set(pos[0], 5, pos[1]);
		trunk.rotation.z = 0.3 + Math.random() * 0.4;
		trunk.castShadow = true;
		trunk.receiveShadow = true;
		scene.add(trunk);
		objects.push(trunk);

		var branch1 = new THREE.Mesh(
			new THREE.CylinderGeometry(0.3, 0.2, 5, 4),
			new THREE.MeshLambertMaterial({color: 0x7A6D5C})
		);
		branch1.position.set(pos[0] + 2, 8, pos[1]);
		branch1.rotation.z = Math.PI / 3;
		branch1.castShadow = true;
		scene.add(branch1);
		objects.push(branch1);
	}
}

function buildbarrels() {
	var barrelPositions = [
		[-60, 50],
		[50, -40],
		[-30, 20],
		[85, 70],
		[-110, -90],
		[40, 110],
		[-90, 30]
	];

	for (var i = 0; i < barrelPositions.length; i++) {
		var pos = barrelPositions[i];
		var barrel = new THREE.Mesh(
			new THREE.CylinderGeometry(1.2, 1.2, 3, 8),
			new THREE.MeshLambertMaterial({color: 0xCC7722})
		);
		barrel.position.set(pos[0], 1.5, pos[1]);
		barrel.castShadow = true;
		barrel.receiveShadow = true;
		scene.add(barrel);
		objects.push(barrel);

		var lid = new THREE.Mesh(
			new THREE.CylinderGeometry(1.3, 1.3, 0.3, 8),
			new THREE.MeshLambertMaterial({color: 0xAA5500})
		);
		lid.position.set(pos[0], 3.2, pos[1]);
		lid.castShadow = true;
		scene.add(lid);
		objects.push(lid);
	}
}

function buildobservationposts() {
	var postPositions = [
		[120, -100],
		[-140, -120],
		[130, 80]
	];

	for (var i = 0; i < postPositions.length; i++) {
		var pos = postPositions[i];

		var leg1 = new THREE.Mesh(
			new THREE.CylinderGeometry(0.5, 0.5, 16, 6),
			new THREE.MeshLambertMaterial({color: 0x909090})
		);
		leg1.position.set(pos[0] - 3, 8, pos[1] - 3);
		leg1.castShadow = true;
		scene.add(leg1);
		objects.push(leg1);

		var leg2 = new THREE.Mesh(
			new THREE.CylinderGeometry(0.5, 0.5, 16, 6),
			new THREE.MeshLambertMaterial({color: 0x909090})
		);
		leg2.position.set(pos[0] + 3, 8, pos[1] + 3);
		leg2.castShadow = true;
		scene.add(leg2);
		objects.push(leg2);

		var platform = new THREE.Mesh(
			new THREE.BoxGeometry(10, 1, 10),
			new THREE.MeshLambertMaterial({color: 0x808080})
		);
		platform.position.set(pos[0], 16, pos[1]);
		platform.castShadow = true;
		platform.receiveShadow = true;
		scene.add(platform);
		objects.push(platform);

		var hut = new THREE.Mesh(
			new THREE.BoxGeometry(6, 5, 6),
			new THREE.MeshLambertMaterial({color: 0xB0B0B0})
		);
		hut.position.set(pos[0], 18.5, pos[1]);
		hut.castShadow = true;
		hut.receiveShadow = true;
		scene.add(hut);
		objects.push(hut);

		var roof = new THREE.Mesh(
			new THREE.ConeGeometry(4.5, 3, 6),
			new THREE.MeshLambertMaterial({color: 0x808080})
		);
		roof.position.set(pos[0], 21.5, pos[1]);
		roof.castShadow = true;
		scene.add(roof);
		objects.push(roof);
	}
}

function buildscatterdebris() {
	var debrisCount = 25;

	for (var i = 0; i < debrisCount; i++) {
		var type = Math.floor(Math.random() * 3);
		var x = (Math.random() - 0.5) * 250;
		var z = (Math.random() - 0.5) * 250;
		var geom;
		var mat = new THREE.MeshLambertMaterial({color: 0xD0D0D0});

		if (type === 0) {
			geom = new THREE.BoxGeometry(1 + Math.random() * 2, 0.5, 1 + Math.random() * 2);
		} else if (type === 1) {
			geom = new THREE.CylinderGeometry(0.4 + Math.random() * 0.6, 0.3 + Math.random() * 0.5, 0.8, 6);
		} else {
			geom = new THREE.SphereGeometry(0.5 + Math.random() * 0.8, 4, 4);
		}

		var mesh = new THREE.Mesh(geom, mat);
		mesh.position.set(x, 0.3, z);
		mesh.rotation.x = Math.random() * Math.PI;
		mesh.rotation.y = Math.random() * Math.PI;
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		scene.add(mesh);
		objects.push(mesh);
	}
}

function buildheatshimmers() {
	var shimmerPositions = [
		[-30, -50],
		[70, 60],
		[-100, 20],
		[40, -80],
		[0, 90]
	];

	for (var i = 0; i < shimmerPositions.length; i++) {
		var pos = shimmerPositions[i];
		var shim = new THREE.Mesh(
			new THREE.SphereGeometry(2, 8, 8),
			new THREE.MeshLambertMaterial({color: 0xFFFFFF, transparent: true, opacity: 0.3})
		);
		shim.position.set(pos[0], 3, pos[1]);
		shim.userData.baseY = 3;
		scene.add(shim);
		shimmering.push(shim);
	}
}

function buildradararray() {
	var radarBase = new THREE.Mesh(
		new THREE.CylinderGeometry(3, 4, 1, 8),
		new THREE.MeshLambertMaterial({color: 0x606060})
	);
	radarBase.position.set(110, 1, 110);
	radarBase.castShadow = true;
	radarBase.receiveShadow = true;
	scene.add(radarBase);
	objects.push(radarBase);

	var column = new THREE.Mesh(
		new THREE.CylinderGeometry(0.6, 0.6, 10, 6),
		new THREE.MeshLambertMaterial({color: 0x505050})
	);
	column.position.set(110, 6, 110);
	column.castShadow = true;
	scene.add(column);
	objects.push(column);

	var radarDish = new THREE.Mesh(
		new THREE.ConeGeometry(4, 2, 32),
		new THREE.MeshLambertMaterial({color: 0xE5E5E5})
	);
	radarDish.position.set(110, 13, 110);
	radarDish.castShadow = true;
	scene.add(radarDish);
	radarObjects.push(radarDish);

	var support1 = new THREE.Mesh(
		new THREE.BoxGeometry(0.5, 2, 0.5),
		new THREE.MeshLambertMaterial({color: 0x707070})
	);
	support1.position.set(105, 12, 110);
	scene.add(support1);
	objects.push(support1);

	var support2 = new THREE.Mesh(
		new THREE.BoxGeometry(0.5, 2, 0.5),
		new THREE.MeshLambertMaterial({color: 0x707070})
	);
	support2.position.set(115, 12, 110);
	scene.add(support2);
	objects.push(support2);
}

function buildlighting() {
	var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.7);
	scene.add(ambientLight);
	lights.push(ambientLight);

	var sunLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
	sunLight.position.set(80, 100, 60);
	sunLight.castShadow = true;
	sunLight.shadow.mapSize.width = 2048;
	sunLight.shadow.mapSize.height = 2048;
	sunLight.shadow.camera.left = -200;
	sunLight.shadow.camera.right = 200;
	sunLight.shadow.camera.top = 200;
	sunLight.shadow.camera.bottom = -200;
	sunLight.shadow.camera.near = 0.1;
	sunLight.shadow.camera.far = 500;
	scene.add(sunLight);
	lights.push(sunLight);

	var hemLight = new THREE.HemisphereLight(0xFFFACD, 0xF0F0F0, 0.6);
	scene.add(hemLight);
	lights.push(hemLight);
}

function update(delta) {
	time += delta;

	for (var i = 0; i < shimmering.length; i++) {
		var shim = shimmering[i];
		shim.position.y = shim.userData.baseY + Math.sin(time * 2 + i) * 1.5;
		shim.rotation.y += delta * 0.5;
	}

	for (var i = 0; i < radarObjects.length; i++) {
		radarObjects[i].rotation.y += delta * 1.2;
	}

	for (var i = 0; i < objects.length; i++) {
		if (objects[i].userData && objects[i].userData.isVehicle) {
			objects[i].position.y += Math.sin(time * 1.5 + i * 0.5) * 0.1;
		}
	}
}

function reset() {
	for (var i = 0; i < objects.length; i++) {
		scene.remove(objects[i]);
	}

	for (var i = 0; i < shimmering.length; i++) {
		scene.remove(shimmering[i]);
	}

	for (var i = 0; i < radarObjects.length; i++) {
		scene.remove(radarObjects[i]);
	}

	for (var i = 0; i < lights.length; i++) {
		scene.remove(lights[i]);
	}

	objects = [];
	shimmering = [];
	radarObjects = [];
	lights = [];
	scene = null;
	camera = null;
	time = 0;
}

return {
	init: init,
	update: update,
	reset: reset
};

})();
