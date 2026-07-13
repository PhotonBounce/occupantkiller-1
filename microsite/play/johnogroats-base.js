window.JohnOGroatsBase = (function() {
	'use strict';

	var baseX = 1000;
	var baseZ = 1270;
	var group = new THREE.Group();

	function signpostTower() {
		var container = new THREE.Group();

		var postGeometry = new THREE.CylinderGeometry(0.4, 0.5, 12, 8);
		var postMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
		var post = new THREE.Mesh(postGeometry, postMaterial);
		post.position.y = 6;
		container.add(post);

		var armColors = [0xFF4444, 0x4444FF, 0x44FF44, 0xFFFF44];
		var directions = [
			{ x: 1, z: 0, name: 'LAND\'S END' },
			{ x: -1, z: 0, name: 'ORKNEY' },
			{ x: 0, z: 1, name: 'NORTH' },
			{ x: 0, z: -1, name: 'SOUTH' }
		];

		var i;
		for (i = 0; i < directions.length; i = i + 1) {
			var dir = directions[i];
			var armGeometry = new THREE.BoxGeometry(3, 0.3, 0.3);
			var armMaterial = new THREE.MeshLambertMaterial({ color: armColors[i] });
			var arm = new THREE.Mesh(armGeometry, armMaterial);
			arm.position.x = dir.x * 2;
			arm.position.z = dir.z * 2;
			arm.position.y = 11;
			if (dir.x === 0) {
				arm.rotation.z = Math.PI / 2;
			}
			container.add(arm);
		}

		container.position.set(baseX, 0, baseZ);
		return container;
	}

	function johnOGroatsHotel() {
		var container = new THREE.Group();

		var mainGeometry = new THREE.BoxGeometry(10, 4, 5);
		var mainMaterial = new THREE.MeshLambertMaterial({ color: 0xF0F0E8 });
		var main = new THREE.Mesh(mainGeometry, mainMaterial);
		main.position.y = 2;
		main.position.x = 20;
		container.add(main);

		var windowGeometry = new THREE.BoxGeometry(1.2, 1.2, 0.3);
		var windowMaterial = new THREE.MeshLambertMaterial({ color: 0x4488FF });
		var windowPositions = [
			{ x: -4, y: 2.5, z: 2.5 },
			{ x: -2, y: 2.5, z: 2.5 },
			{ x: 2, y: 2.5, z: 2.5 },
			{ x: 4, y: 2.5, z: 2.5 }
		];

		var j;
		for (j = 0; j < windowPositions.length; j = j + 1) {
			var wpos = windowPositions[j];
			var window1 = new THREE.Mesh(windowGeometry, windowMaterial);
			window1.position.set(20 + wpos.x, wpos.y, baseZ + wpos.z);
			container.add(window1);
		}

		var bayGeometry = new THREE.BoxGeometry(1.5, 2, 1);
		var bayMaterial = new THREE.MeshLambertMaterial({ color: 0xE8E8D8 });
		var bay1 = new THREE.Mesh(bayGeometry, bayMaterial);
		bay1.position.set(baseX + 25, 2, baseZ - 2.5);
		container.add(bay1);

		var bay2 = new THREE.Mesh(bayGeometry, bayMaterial);
		bay2.position.set(baseX + 25, 2, baseZ + 2.5);
		container.add(bay2);

		container.position.set(baseX, 0, baseZ);
		return container;
	}

	function orkenyFerryPier() {
		var container = new THREE.Group();

		var pierGeometry = new THREE.BoxGeometry(25, 1, 3);
		var pierMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var pier = new THREE.Mesh(pierGeometry, pierMaterial);
		pier.position.set(12, 0, -15);
		pier.position.y = 0.5;
		container.add(pier);

		var postPositions = [
			-12, -8, -4, 0, 4, 8, 12
		];

		var k;
		for (k = 0; k < postPositions.length; k = k + 1) {
			var postGeometry = new THREE.CylinderGeometry(0.3, 0.4, 3, 6);
			var postMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
			var mooring = new THREE.Mesh(postGeometry, postMaterial);
			mooring.position.set(baseX + 12 + postPositions[k], 1.5, baseZ - 15);
			container.add(mooring);
		}

		container.position.set(baseX, 0, baseZ);
		return container;
	}

	function duncansbyStacks() {
		var container = new THREE.Group();

		var stackHeights = [18, 16, 14];
		var stackX = [30, 40, 50];
		var stackZ = [-20, -25, -18];

		var m;
		for (m = 0; m < stackHeights.length; m = m + 1) {
			var stackGeometry = new THREE.CylinderGeometry(1.5, 2, stackHeights[m], 12);
			var stackMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
			var stack = new THREE.Mesh(stackGeometry, stackMaterial);
			stack.position.set(baseX + stackX[m], stackHeights[m] / 2, baseZ + stackZ[m]);
			container.add(stack);
		}

		container.position.set(baseX, 0, baseZ);
		return container;
	}

	function militaryCheckpoint() {
		var container = new THREE.Group();

		var barrierGeometry = new THREE.BoxGeometry(8, 2, 0.5);
		var barrierMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });
		var barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
		barrier.position.set(-20, 1, 5);
		barrier.position.y = 1;
		container.add(barrier);

		var guardGeometry = new THREE.BoxGeometry(3, 3, 3);
		var guardMaterial = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
		var guardPost = new THREE.Mesh(guardGeometry, guardMaterial);
		guardPost.position.set(-20, 1.5, 10);
		container.add(guardPost);

		var roofGeometry = new THREE.ConeGeometry(2.5, 1.5, 4);
		var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x882222 });
		var roof = new THREE.Mesh(roofGeometry, roofMaterial);
		roof.position.set(-20, 4.5, 10);
		container.add(roof);

		container.position.set(baseX, 0, baseZ);
		return container;
	}

	function souvenirShop() {
		var container = new THREE.Group();

		var shopGeometry = new THREE.BoxGeometry(6, 3, 3);
		var shopMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
		var shop = new THREE.Mesh(shopGeometry, shopMaterial);
		shop.position.set(-30, 1.5, 0);
		container.add(shop);

		var doorGeometry = new THREE.BoxGeometry(1.5, 2.5, 0.2);
		var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x442211 });
		var door = new THREE.Mesh(doorGeometry, doorMaterial);
		door.position.set(-30, 1.25, 1.5);
		container.add(door);

		var markingGeometry = new THREE.BoxGeometry(2, 0.3, 0.1);
		var markingMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
		var marking = new THREE.Mesh(markingGeometry, markingMaterial);
		marking.position.set(-30, 2.5, 1.5);
		container.add(marking);

		container.position.set(baseX, 0, baseZ);
		return container;
	}

	function radarPost() {
		var container = new THREE.Group();

		var domeGeometry = new THREE.SphereGeometry(2, 16, 16);
		var domeMaterial = new THREE.MeshLambertMaterial({ color: 0xDDDD00 });
		var dome = new THREE.Mesh(domeGeometry, domeMaterial);
		dome.position.set(-15, 5, -25);
		container.add(dome);

		var mastGeometry = new THREE.CylinderGeometry(0.2, 0.3, 8, 6);
		var mastMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
		var mast = new THREE.Mesh(mastGeometry, mastMaterial);
		mast.position.set(-15, 4, -25);
		container.add(mast);

		var antennaBracketGeometry = new THREE.BoxGeometry(0.1, 3, 0.1);
		var antennaMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
		var bracket = new THREE.Mesh(antennaBracketGeometry, antennaMaterial);
		bracket.position.set(-15, 8, -25);
		container.add(bracket);

		container.position.set(baseX, 0, baseZ);
		return container;
	}

	function vehicleDepot() {
		var container = new THREE.Group();

		var vehiclePositions = [
			{ x: -50, z: -40 },
			{ x: -40, z: -40 },
			{ x: -50, z: -30 },
			{ x: -40, z: -30 }
		];

		var n;
		for (n = 0; n < vehiclePositions.length; n = n + 1) {
			var vpos = vehiclePositions[n];
			var vehicleGeometry = new THREE.BoxGeometry(3, 2, 1.5);
			var vehicleMaterial = new THREE.MeshLambertMaterial({ color: 0x224422 });
			var vehicle = new THREE.Mesh(vehicleGeometry, vehicleMaterial);
			vehicle.position.set(baseX + vpos.x, 1, baseZ + vpos.z);
			container.add(vehicle);

			var windshieldGeometry = new THREE.BoxGeometry(2.5, 0.8, 0.2);
			var windshieldMaterial = new THREE.MeshLambertMaterial({ color: 0x4488FF });
			var windshield = new THREE.Mesh(windshieldGeometry, windshieldMaterial);
			windshield.position.set(baseX + vpos.x, 1.5, baseZ + vpos.z - 0.8);
			container.add(windshield);
		}

		container.position.set(baseX, 0, baseZ);
		return container;
	}

	function build() {
		var signpost = signpostTower();
		group.add(signpost);

		var hotel = johnOGroatsHotel();
		group.add(hotel);

		var pier = orkenyFerryPier();
		group.add(pier);

		var stacks = duncansbyStacks();
		group.add(stacks);

		var checkpoint = militaryCheckpoint();
		group.add(checkpoint);

		var shop = souvenirShop();
		group.add(shop);

		var radar = radarPost();
		group.add(radar);

		var depot = vehicleDepot();
		group.add(depot);

		return group;
	}

	var publicAPI = {
		create: function() {
			return build();
		},
		getGroup: function() {
			return group;
		}
	};

	return publicAPI;
}());
