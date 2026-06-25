window.BallachulishPost = (function() {
	'use strict';

	var objects = [];
	var lights = [];

	function addmesh(mesh) {
		objects.push(mesh);
		return mesh;
	}

	function addlight(light) {
		lights.push(light);
		return light;
	}

	function buildbridge(scene) {
		var bridgegeometry = new THREE.BoxGeometry(50, 2, 6);
		var bridgematerial = new THREE.MeshLambertMaterial({ color: 0x888888 });
		var bridge = new THREE.Mesh(bridgegeometry, bridgematerial);
		bridge.position.y = 5;
		bridge.position.z = 0;
		scene.add(bridge);
		addmesh(bridge);

		for (var i = 0; i < 5; i++) {
			var pillargeometry = new THREE.CylinderGeometry(1.5, 1.5, 10, 8);
			var pillarmaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
			var pillar = new THREE.Mesh(pillargeometry, pillarmaterial);
			pillar.position.x = -20 + i * 12;
			pillar.position.y = 0;
			pillar.position.z = 0;
			scene.add(pillar);
			addmesh(pillar);
		}
	}

	function buildtower(scene) {
		var towergeometry = new THREE.BoxGeometry(6, 10, 6);
		var towermaterial = new THREE.MeshLambertMaterial({ color: 0x778877 });
		var tower = new THREE.Mesh(towergeometry, towermaterial);
		tower.position.x = 15;
		tower.position.y = 5;
		tower.position.z = 0;
		scene.add(tower);
		addmesh(tower);

		var windowgeometry = new THREE.BoxGeometry(1.5, 1.5, 0.2);
		var windowmaterial = new THREE.MeshLambertMaterial({ color: 0x88AACC });

		var positions = [
			[-2, 2, -3],
			[2, 2, -3],
			[-2, -2, -3],
			[2, -2, -3],
			[-2, 2, 3],
			[2, 2, 3],
			[-2, -2, 3],
			[2, -2, 3]
		];

		for (var i = 0; i < positions.length; i++) {
			var window = new THREE.Mesh(windowgeometry, windowmaterial);
			window.position.set(
				tower.position.x + positions[i][0],
				tower.position.y + positions[i][1],
				tower.position.z + positions[i][2]
			);
			scene.add(window);
			addmesh(window);
		}
	}

	function buildcliff(scene) {
		var cliffgeometry = new THREE.BoxGeometry(40, 25, 3);
		var cliffmaterial = new THREE.MeshLambertMaterial({ color: 0x445566 });
		var cliff = new THREE.Mesh(cliffgeometry, cliffmaterial);
		cliff.position.x = -20;
		cliff.position.y = 12;
		cliff.position.z = -25;
		scene.add(cliff);
		addmesh(cliff);
	}

	function buildtollplaza(scene) {
		var positions = [
			[-25, 2, 8],
			[-20, 2, 8],
			[-15, 2, 8]
		];

		for (var i = 0; i < positions.length; i++) {
			var buildinggeometry = new THREE.BoxGeometry(8, 4, 6);
			var buildingmaterial = new THREE.MeshLambertMaterial({ color: 0x999988 });
			var building = new THREE.Mesh(buildinggeometry, buildingmaterial);
			building.position.set(positions[i][0], positions[i][1], positions[i][2]);
			scene.add(building);
			addmesh(building);
		}
	}

	function buildbay(scene) {
		var pillargeometry = new THREE.CylinderGeometry(0.8, 0.8, 6, 6);
		var pillarmaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });

		var pillarpositions = [
			[-8, 3, -8],
			[8, 3, -8],
			[-8, 3, 8],
			[8, 3, 8]
		];

		for (var i = 0; i < pillarpositions.length; i++) {
			var pillar = new THREE.Mesh(pillargeometry, pillarmaterial);
			pillar.position.set(pillarpositions[i][0], pillarpositions[i][1], pillarpositions[i][2]);
			scene.add(pillar);
			addmesh(pillar);
		}

		var roofgeometry = new THREE.BoxGeometry(18, 0.5, 18);
		var roofmaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });
		var roof = new THREE.Mesh(roofgeometry, roofmaterial);
		roof.position.set(0, 6.5, 0);
		scene.add(roof);
		addmesh(roof);
	}

	function buildditch(scene) {
		var ditchgeometry = new THREE.BoxGeometry(20, 3, 2);
		var ditchmaterial = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
		var ditch = new THREE.Mesh(ditchgeometry, ditchmaterial);
		ditch.position.set(0, -1.5, -15);
		scene.add(ditch);
		addmesh(ditch);
	}

	function buildemplacement(scene) {
		var radius = 4;
		var segments = 12;

		var barrelgeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
		var barrelmaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
		var barrel = new THREE.Mesh(barrelgeometry, barrelmaterial);
		barrel.position.set(-30, 2, 0);
		barrel.rotation.z = Math.PI / 6;
		scene.add(barrel);
		addmesh(barrel);

		for (var i = 0; i < segments; i++) {
			var angle = (i / segments) * Math.PI * 2;
			var x = Math.cos(angle) * radius - 30;
			var z = Math.sin(angle) * radius;

			var baggeometry = new THREE.BoxGeometry(1, 1.5, 1);
			var bagmaterial = new THREE.MeshLambertMaterial({ color: 0x556633 });
			var bag = new THREE.Mesh(baggeometry, bagmaterial);
			bag.position.set(x, 0.75, z);
			scene.add(bag);
			addmesh(bag);
		}
	}

	function buildcharges(scene) {
		var positions = [
			[-35, 4, 0],
			[-15, 4, 0],
			[5, 4, 0],
			[25, 4, 0]
		];

		for (var i = 0; i < positions.length; i++) {
			var chargegeometry = new THREE.BoxGeometry(1, 0.5, 1);
			var chargematerial = new THREE.MeshLambertMaterial({ color: 0xCC3333 });
			var charge = new THREE.Mesh(chargegeometry, chargematerial);
			charge.position.set(positions[i][0], positions[i][1], positions[i][2]);
			scene.add(charge);
			addmesh(charge);
		}
	}

	function buildsiren(scene) {
		var cylindergeometry = new THREE.CylinderGeometry(0.8, 0.8, 2, 8);
		var cylindermaterial = new THREE.MeshLambertMaterial({ color: 0x666655 });
		var cylinder = new THREE.Mesh(cylindergeometry, cylindermaterial);
		cylinder.position.set(30, 4, 0);
		scene.add(cylinder);
		addmesh(cylinder);

		var conegeometry = new THREE.ConeGeometry(0.8, 1.5, 8);
		var conematerial = new THREE.MeshLambertMaterial({ color: 0x666655 });
		var cone = new THREE.Mesh(conegeometry, conematerial);
		cone.position.set(30, 6.5, 0);
		scene.add(cone);
		addmesh(cone);
	}

	function buildlights(scene) {
		var light1 = new THREE.PointLight(0xFF8800, 1.0, 100);
		light1.position.set(-25, 6, 0);
		scene.add(light1);
		addlight(light1);

		var light2 = new THREE.PointLight(0xFF8800, 1.0, 100);
		light2.position.set(25, 6, 0);
		scene.add(light2);
		addlight(light2);
	}

	function create(scene) {
		buildbridge(scene);
		buildtower(scene);
		buildcliff(scene);
		buildtollplaza(scene);
		buildbay(scene);
		buildditch(scene);
		buildemplacement(scene);
		buildcharges(scene);
		buildsiren(scene);
		buildlights(scene);
	}

	function update(delta) {
		var time = Date.now() * 0.001;
		for (var i = 0; i < lights.length; i++) {
			var intensity = 0.5 + 0.5 * Math.sin(time * 4);
			lights[i].intensity = intensity;
		}
	}

	function reset(scene) {
		for (var i = 0; i < objects.length; i++) {
			scene.remove(objects[i]);
		}
		for (var i = 0; i < lights.length; i++) {
			scene.remove(lights[i]);
		}
		objects = [];
		lights = [];
	}

	return {
		create: create,
		update: update,
		reset: reset,
		objects: objects,
		lights: lights
	};
}());
