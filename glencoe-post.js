window.GlencoePost = (function() {
	'use strict';

	var objects = [];
	var lights = [];

	var OX = 1780;
	var OZ = 2200;

	function addmesh(scene, mesh) {
		scene.add(mesh);
		objects.push(mesh);
		return mesh;
	}

	function addlight(scene, light) {
		scene.add(light);
		lights.push(light);
		return light;
	}

	function buildridgeline(scene) {
		// Three Sisters ridgeline: 3 massive dark-rock cliff-face boxes
		var mat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });

		var sisterdata = [
			[OX - 30, 10, OZ - 60],
			[OX,      10, OZ - 55],
			[OX + 30, 10, OZ - 62]
		];

		for (var i = 0; i < sisterdata.length; i++) {
			var geom = new THREE.BoxGeometry(30, 20, 8);
			var cliff = new THREE.Mesh(geom, mat);
			cliff.position.set(sisterdata[i][0], sisterdata[i][1], sisterdata[i][2]);
			addmesh(scene, cliff);
		}
	}

	function buildvillage(scene) {
		// Glencoe village: 5 whitewashed cottages with heather gardens
		var cottagemat = new THREE.MeshLambertMaterial({ color: 0xF0F0F0 });
		var heathermat = new THREE.MeshLambertMaterial({ color: 0x7A3A7A });

		var cottagedata = [
			[OX - 20, 2, OZ + 10],
			[OX - 8,  2, OZ + 14],
			[OX + 5,  2, OZ + 10],
			[OX + 18, 2, OZ + 8],
			[OX + 30, 2, OZ + 12]
		];

		for (var i = 0; i < cottagedata.length; i++) {
			var cgeom = new THREE.BoxGeometry(6, 4, 5);
			var cottage = new THREE.Mesh(cgeom, cottagemat);
			cottage.position.set(cottagedata[i][0], cottagedata[i][1], cottagedata[i][2]);
			addmesh(scene, cottage);

			// Heather garden box in front of each cottage
			var hgeom = new THREE.BoxGeometry(5, 0.5, 3);
			var garden = new THREE.Mesh(hgeom, heathermat);
			garden.position.set(cottagedata[i][0], 0.25, cottagedata[i][2] + 4);
			addmesh(scene, garden);
		}
	}

	function buildsignalrock(scene) {
		// Signal Rock: large boulder on valley floor — massacre signal site
		var mat = new THREE.MeshLambertMaterial({ color: 0x6A6A6A });
		var geom = new THREE.BoxGeometry(8, 5, 6);
		var rock = new THREE.Mesh(geom, mat);
		rock.position.set(OX + 10, 2.5, OZ - 5);
		addmesh(scene, rock);
	}

	function buildvisitorcentre(scene) {
		// NTS visitor centre: modern flat-roofed building
		var mat = new THREE.MeshLambertMaterial({ color: 0x808080 });
		var geom = new THREE.BoxGeometry(12, 4, 8);
		var building = new THREE.Mesh(geom, mat);
		building.position.set(OX - 40, 2, OZ + 5);
		addmesh(scene, building);

		// Flat roof slab, slightly wider
		var roofmat = new THREE.MeshLambertMaterial({ color: 0x707070 });
		var roofgeom = new THREE.BoxGeometry(13, 0.4, 9);
		var roof = new THREE.Mesh(roofgeom, roofmat);
		roof.position.set(OX - 40, 4.2, OZ + 5);
		addmesh(scene, roof);
	}

	function buildbridge(scene) {
		// River Coe bridge: stone arch bridge over the river
		var stonemat = new THREE.MeshLambertMaterial({ color: 0x9A8A78 });

		// Bridge deck
		var deckgeom = new THREE.BoxGeometry(12, 3, 4);
		var deck = new THREE.Mesh(deckgeom, stonemat);
		deck.position.set(OX - 10, 3, OZ + 30);
		addmesh(scene, deck);

		// Arch support left
		var archlgeom = new THREE.BoxGeometry(2, 4, 3);
		var archl = new THREE.Mesh(archlgeom, stonemat);
		archl.position.set(OX - 15, 1, OZ + 30);
		addmesh(scene, archl);

		// Arch support right
		var archrgeom = new THREE.BoxGeometry(2, 4, 3);
		var archr = new THREE.Mesh(archrgeom, stonemat);
		archr.position.set(OX - 5, 1, OZ + 30);
		addmesh(scene, archr);

		// Arch keystone centre
		var keystonegeom = new THREE.BoxGeometry(3, 2, 3);
		var keystone = new THREE.Mesh(keystonegeom, stonemat);
		keystone.position.set(OX - 10, 0.5, OZ + 30);
		addmesh(scene, keystone);
	}

	function buildambushpositions(scene) {
		// Jacobite ambush: rocky boulder cover on valley walls either side
		var rockmat = new THREE.MeshLambertMaterial({ color: 0x555555 });

		// Left valley wall boulders
		var leftboulderdata = [
			[OX - 45, 3,   OZ - 20],
			[OX - 48, 1.5, OZ - 10],
			[OX - 44, 2,   OZ + 0]
		];

		for (var i = 0; i < leftboulderdata.length; i++) {
			var lgeom = new THREE.BoxGeometry(4, 3, 3);
			var lrock = new THREE.Mesh(lgeom, rockmat);
			lrock.position.set(leftboulderdata[i][0], leftboulderdata[i][1], leftboulderdata[i][2]);
			addmesh(scene, lrock);
		}

		// Right valley wall boulders
		var rightboulderdata = [
			[OX + 45, 3,   OZ - 20],
			[OX + 48, 1.5, OZ - 8],
			[OX + 43, 2.5, OZ + 2]
		];

		for (var j = 0; j < rightboulderdata.length; j++) {
			var rgeom = new THREE.BoxGeometry(4, 3, 3);
			var rrock = new THREE.Mesh(rgeom, rockmat);
			rrock.position.set(rightboulderdata[j][0], rightboulderdata[j][1], rightboulderdata[j][2]);
			addmesh(scene, rrock);
		}
	}

	function buildlostvalley(scene) {
		// Lost Valley (Coire Gabhail) entrance: narrow gap between two tall box cliffs
		var cliffmat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });

		// Left cliff wall of the hidden valley entrance
		var leftgeom = new THREE.BoxGeometry(6, 28, 12);
		var leftcliff = new THREE.Mesh(leftgeom, cliffmat);
		leftcliff.position.set(OX - 10, 14, OZ - 80);
		addmesh(scene, leftcliff);

		// Right cliff wall of the hidden valley entrance
		var rightgeom = new THREE.BoxGeometry(6, 28, 12);
		var rightcliff = new THREE.Mesh(rightgeom, cliffmat);
		rightcliff.position.set(OX + 10, 14, OZ - 80);
		addmesh(scene, rightcliff);

		// Back wall of hidden valley — visible through the gap
		var backmat = new THREE.MeshLambertMaterial({ color: 0x3A3A3A });
		var backgeom = new THREE.BoxGeometry(18, 22, 5);
		var backwall = new THREE.Mesh(backgeom, backmat);
		backwall.position.set(OX, 11, OZ - 95);
		addmesh(scene, backwall);
	}

	function buildvalleyfloor(scene) {
		// Valley floor — grassy ground level box running through the pass
		var floormat = new THREE.MeshLambertMaterial({ color: 0x3B5A2A });
		var floorgeom = new THREE.BoxGeometry(80, 1, 160);
		var floor = new THREE.Mesh(floorgeom, floormat);
		floor.position.set(OX, -0.5, OZ);
		addmesh(scene, floor);
	}

	function buildwireframe(scene) {
		// LineSegments tripwire marking the historic ambush killing ground
		var wiregeom = new THREE.BufferGeometry();
		var wirepos = new Float32Array([
			OX - 40, 0.5, OZ - 15,
			OX + 40, 0.5, OZ - 15
		]);
		wiregeom.setAttribute('position', new THREE.BufferAttribute(wirepos, 3));
		var wiremat = new THREE.LineBasicMaterial({ color: 0xFF4400 });
		var wire = new THREE.LineSegments(wiregeom, wiremat);
		scene.add(wire);
		objects.push(wire);
	}

	function buildlights(scene) {
		// Overcast Highland sky — dim ambient with cool directional light
		var ambient = new THREE.AmbientLight(0xAABBCC, 0.5);
		addlight(scene, ambient);

		var sun = new THREE.DirectionalLight(0xCCDDEE, 0.7);
		sun.position.set(OX - 50, 80, OZ - 30);
		addlight(scene, sun);
	}

	function create(scene) {
		buildvalleyfloor(scene);
		buildridgeline(scene);
		buildvillage(scene);
		buildsignalrock(scene);
		buildvisitorcentre(scene);
		buildbridge(scene);
		buildambushpositions(scene);
		buildlostvalley(scene);
		buildwireframe(scene);
		buildlights(scene);
	}

	function update(delta) {
		// No dynamic animation needed for this historic Highland site
	}

	function reset(scene) {
		for (var i = 0; i < objects.length; i++) {
			scene.remove(objects[i]);
		}
		for (var j = 0; j < lights.length; j++) {
			scene.remove(lights[j]);
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
