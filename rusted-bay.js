window.RustedBay = (function() {
	'use strict';

	var scene;
	var camera;
	var objects = [];
	var materials = {};
	var animatedObjects = [];
	var time = 0;

	function initMaterials() {
		var rustOrange = new THREE.MeshStandardMaterial({
			color: 0xC85A3A,
			metalness: 0.8,
			roughness: 0.7,
			emissive: 0x1A0A00
		});

		var darkGray = new THREE.MeshStandardMaterial({
			color: 0x3A3A3A,
			metalness: 0.6,
			roughness: 0.5,
			emissive: 0x0A0A0A
		});

		var corrodedBrown = new THREE.MeshStandardMaterial({
			color: 0x6B4423,
			metalness: 0.5,
			roughness: 0.8,
			emissive: 0x1F1410
		});

		var steamGray = new THREE.MeshBasicMaterial({
			color: 0xAAAAAA,
			transparent: true,
			opacity: 0.4
		});

		var darkMetal = new THREE.MeshStandardMaterial({
			color: 0x1A1A1A,
			metalness: 0.9,
			roughness: 0.4,
			emissive: 0x000000
		});

		var chainMaterial = new THREE.LineBasicMaterial({
			color: 0x4A4A4A,
			linewidth: 2
		});

		materials.rustOrange = rustOrange;
		materials.darkGray = darkGray;
		materials.corrodedBrown = corrodedBrown;
		materials.steamGray = steamGray;
		materials.darkMetal = darkMetal;
		materials.chainMaterial = chainMaterial;
	}

	function createWarship() {
		var group = new THREE.Group();

		var hullGeometry = new THREE.BoxGeometry(30, 12, 8);
		var hull = new THREE.Mesh(hullGeometry, materials.darkGray);
		hull.position.set(0, 6, 0);
		group.add(hull);

		var superstructureGeometry = new THREE.BoxGeometry(8, 8, 6);
		var superstructure = new THREE.Mesh(superstructureGeometry, materials.corrodedBrown);
		superstructure.position.set(-8, 14, -1);
		group.add(superstructure);

		var turretGeometry = new THREE.CylinderGeometry(2.5, 2.5, 3, 8);
		var turret1 = new THREE.Mesh(turretGeometry, materials.rustOrange);
		turret1.position.set(-5, 18, -2);
		group.add(turret1);

		var turret2 = new THREE.Mesh(turretGeometry, materials.rustOrange);
		turret2.position.set(5, 18, -2);
		group.add(turret2);

		var smokeStackGeometry = new THREE.CylinderGeometry(1.5, 1.5, 6, 8);
		var smokeStack = new THREE.Mesh(smokeStackGeometry, materials.darkMetal);
		smokeStack.position.set(-6, 16, 0);
		group.add(smokeStack);

		group.position.set(35, 0, 20);
		scene.add(group);
		objects.push(group);
	}

	function createOversideCrane() {
		var group = new THREE.Group();

		var baseGeometry = new THREE.BoxGeometry(4, 2, 4);
		var base = new THREE.Mesh(baseGeometry, materials.darkGray);
		base.position.set(0, 0, 0);
		group.add(base);

		var verticalBeamGeometry = new THREE.BoxGeometry(2, 22, 2);
		var verticalBeam = new THREE.Mesh(verticalBeamGeometry, materials.rustOrange);
		verticalBeam.position.set(0, 11, 0);
		group.add(verticalBeam);

		var horizontalBoomGeometry = new THREE.BoxGeometry(40, 1.5, 1.5);
		var horizontalBoom = new THREE.Mesh(horizontalBoomGeometry, materials.corrodedBrown);
		horizontalBoom.position.set(15, 22, 0);
		group.add(horizontalBoom);

		var pulleyGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.8, 12);
		var pulley1 = new THREE.Mesh(pulleyGeometry, materials.darkMetal);
		pulley1.rotation.z = Math.PI / 2;
		pulley1.position.set(30, 22, 0);
		group.add(pulley1);

		var cableSupportGeometry = new THREE.BoxGeometry(1, 15, 1);
		var cableSupport = new THREE.Mesh(cableSupportGeometry, materials.rustOrange);
		cableSupport.position.set(30, 15, 0);
		group.add(cableSupport);

		group.position.set(-20, 0, -35);
		scene.add(group);
		objects.push(group);
		animatedObjects.push({
			object: horizontalBoom,
			type: 'swing'
		});
	}

	function createGearCluster() {
		var group = new THREE.Group();

		var baseGeometry = new THREE.BoxGeometry(6, 1, 6);
		var base = new THREE.Mesh(baseGeometry, materials.darkGray);
		base.position.set(0, 0.5, 0);
		group.add(base);

		var gear1Geometry = new THREE.CylinderGeometry(3, 3, 0.8, 16);
		var gear1 = new THREE.Mesh(gear1Geometry, materials.rustOrange);
		gear1.position.set(-2, 2, 0);
		gear1.rotation.x = Math.PI / 2;
		group.add(gear1);

		var gear2Geometry = new THREE.CylinderGeometry(2.5, 2.5, 0.8, 16);
		var gear2 = new THREE.Mesh(gear2Geometry, materials.corrodedBrown);
		gear2.position.set(2, 2.5, 0);
		gear2.rotation.x = Math.PI / 2;
		group.add(gear2);

		var gear3Geometry = new THREE.CylinderGeometry(2, 2, 0.8, 16);
		var gear3 = new THREE.Mesh(gear3Geometry, materials.rustOrange);
		gear3.position.set(0, 1.5, 2.5);
		gear3.rotation.z = Math.PI / 2;
		group.add(gear3);

		var axleGeometry = new THREE.CylinderGeometry(0.4, 0.4, 8, 8);
		var axle = new THREE.Mesh(axleGeometry, materials.darkMetal);
		axle.position.set(0, 2, 0);
		axle.rotation.x = Math.PI / 2;
		group.add(axle);

		group.position.set(20, 0, 25);
		scene.add(group);
		objects.push(group);
		animatedObjects.push({
			object: gear1,
			type: 'rotate',
			axis: 'x',
			speed: 0.8
		});
		animatedObjects.push({
			object: gear2,
			type: 'rotate',
			axis: 'x',
			speed: -0.95
		});
		animatedObjects.push({
			object: gear3,
			type: 'rotate',
			axis: 'z',
			speed: 0.6
		});
	}

	function createControlTower() {
		var group = new THREE.Group();

		var baseGeometry = new THREE.BoxGeometry(5, 2, 5);
		var base = new THREE.Mesh(baseGeometry, materials.darkGray);
		base.position.set(0, 1, 0);
		group.add(base);

		var pillarGeometry = new THREE.BoxGeometry(1.5, 16, 1.5);
		var pillar = new THREE.Mesh(pillarGeometry, materials.corrodedBrown);
		pillar.position.set(0, 9, 0);
		group.add(pillar);

		var cabinGeometry = new THREE.BoxGeometry(4, 4, 4);
		var cabin = new THREE.Mesh(cabinGeometry, materials.rustOrange);
		cabin.position.set(0, 18, 0);
		group.add(cabin);

		var roofGeometry = new THREE.ConeGeometry(3, 2, 4);
		var roof = new THREE.Mesh(roofGeometry, materials.darkMetal);
		roof.position.set(0, 20.5, 0);
		group.add(roof);

		var windowGeometry = new THREE.BoxGeometry(1, 1, 0.5);
		var window1 = new THREE.Mesh(windowGeometry, materials.steamGray);
		window1.position.set(1.8, 18.5, 2.2);
		group.add(window1);

		var window2 = new THREE.Mesh(windowGeometry, materials.steamGray);
		window2.position.set(-1.8, 18.5, 2.2);
		group.add(window2);

		group.position.set(-35, 0, 30);
		scene.add(group);
		objects.push(group);
	}

	function createPipeCluster() {
		var group = new THREE.Group();

		var pipe1Geometry = new THREE.CylinderGeometry(0.6, 0.6, 15, 8);
		var pipe1 = new THREE.Mesh(pipe1Geometry, materials.corrodedBrown);
		pipe1.rotation.z = Math.PI / 2.2;
		pipe1.position.set(0, 8, 0);
		group.add(pipe1);

		var pipe2Geometry = new THREE.CylinderGeometry(0.5, 0.5, 12, 8);
		var pipe2 = new THREE.Mesh(pipe2Geometry, materials.rustOrange);
		pipe2.rotation.z = Math.PI / 1.8;
		pipe2.position.set(2, 6, 0);
		group.add(pipe2);

		var pipe3Geometry = new THREE.CylinderGeometry(0.7, 0.7, 10, 8);
		var pipe3 = new THREE.Mesh(pipe3Geometry, materials.darkGray);
		pipe3.rotation.z = Math.PI / 2.5;
		pipe3.position.set(-2, 5, 0);
		group.add(pipe3);

		var elbowGeometry = new THREE.SphereGeometry(1, 6, 6);
		var elbow1 = new THREE.Mesh(elbowGeometry, materials.rustOrange);
		elbow1.position.set(5, 10, 0);
		group.add(elbow1);

		var valveGeometry = new THREE.CylinderGeometry(0.8, 0.8, 1.2, 6);
		var valve = new THREE.Mesh(valveGeometry, materials.darkMetal);
		valve.position.set(-5, 5, 0);
		group.add(valve);

		group.position.set(10, 0, -30);
		scene.add(group);
		objects.push(group);
		animatedObjects.push({
			object: group,
			type: 'steam'
		});
	}

	function createCorrodedContainers() {
		var positions = [
			[-25, 0, 10],
			[-20, 0, 0],
			[25, 0, -20],
			[15, 0, 15]
		];

		for (var i = 0; i < positions.length; i++) {
			var containerGeometry = new THREE.BoxGeometry(6, 8, 6);
			var containerMaterial = i % 2 === 0 ? materials.rustOrange : materials.corrodedBrown;
			var container = new THREE.Mesh(containerGeometry, containerMaterial);
			container.position.set(positions[i][0], positions[i][1] + 4, positions[i][2]);
			scene.add(container);
			objects.push(container);
		}
	}

	function createChainLinkFencing() {
		var points = [
			new THREE.Vector3(-40, 0, -40),
			new THREE.Vector3(40, 0, -40),
			new THREE.Vector3(40, 0, 40),
			new THREE.Vector3(-40, 0, 40),
			new THREE.Vector3(-40, 0, -40)
		];

		var geometry = new THREE.BufferGeometry().setFromPoints(points);
		var fence = new THREE.LineSegments(geometry, materials.chainMaterial);
		scene.add(fence);

		for (var i = 0; i < 8; i++) {
			var vertPoints = [
				new THREE.Vector3(-40 + i * 20, 0, -40),
				new THREE.Vector3(-40 + i * 20, 6, -40)
			];
			var vertGeometry = new THREE.BufferGeometry().setFromPoints(vertPoints);
			var vertLine = new THREE.LineSegments(vertGeometry, materials.chainMaterial);
			scene.add(vertLine);
		}
	}

	function createSteamLeaks() {
		var positions = [
			[8, 12, -30],
			[12, 14, -28],
			[6, 10, -32]
		];

		for (var i = 0; i < positions.length; i++) {
			var steamGeometry = new THREE.SphereGeometry(0.8, 4, 4);
			var steam = new THREE.Mesh(steamGeometry, materials.steamGray);
			steam.position.set(positions[i][0], positions[i][1], positions[i][2]);
			scene.add(steam);
			animatedObjects.push({
				object: steam,
				type: 'pulse',
				baseScale: 0.8
			});
		}
	}

	function createOilSlicks() {
		var positions = [
			[-15, 0.1, 15],
			[20, 0.1, -10],
			[-25, 0.1, -20]
		];

		for (var i = 0; i < positions.length; i++) {
			var slickGeometry = new THREE.SphereGeometry(4, 6, 6);
			var slickMaterial = new THREE.MeshStandardMaterial({
				color: 0x0A0A0A,
				metalness: 0.9,
				roughness: 0.3,
				emissive: 0x1A1A00
			});
			var slick = new THREE.Mesh(slickGeometry, slickMaterial);
			slick.scale.set(1, 0.05, 1);
			slick.position.set(positions[i][0], positions[i][1], positions[i][2]);
			scene.add(slick);
			objects.push(slick);
		}
	}

	function createExplosiveOrdnance() {
		var positions = [
			[5, 1, 5],
			[-10, 1, -15],
			[18, 1, 8],
			[-28, 1, 25]
		];

		for (var i = 0; i < positions.length; i++) {
			var ordnanceGeometry = new THREE.CylinderGeometry(0.6, 0.8, 2.5, 8);
			var ordnanceMaterial = i % 2 === 0 ? materials.darkMetal : materials.rustOrange;
			var ordnance = new THREE.Mesh(ordnanceGeometry, ordnanceMaterial);
			ordnance.rotation.z = Math.random() * Math.PI;
			ordnance.position.set(positions[i][0], positions[i][1], positions[i][2]);
			scene.add(ordnance);
			objects.push(ordnance);
		}
	}

	function createCollapsedRoof() {
		var beamPositions = [
			[-15, 8, 0],
			[-5, 10, 5],
			[5, 7, -3],
			[15, 9, 2]
		];

		for (var i = 0; i < beamPositions.length; i++) {
			var beamGeometry = new THREE.BoxGeometry(20, 1.5, 1.5);
			var beam = new THREE.Mesh(beamGeometry, materials.corrodedBrown);
			beam.rotation.z = (Math.random() - 0.5) * 0.4;
			beam.rotation.y = Math.random() * Math.PI * 0.3;
			beam.position.set(beamPositions[i][0], beamPositions[i][1], beamPositions[i][2]);
			scene.add(beam);
			objects.push(beam);
		}

		var debrisGeometry = new THREE.BoxGeometry(3, 1, 3);
		var debrisMaterial = materials.darkGray;
		for (var j = 0; j < 6; j++) {
			var debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
			debris.position.set(
				-20 + Math.random() * 40,
				6 + Math.random() * 4,
				-25 + Math.random() * 15
			);
			debris.rotation.set(
				Math.random() * Math.PI,
				Math.random() * Math.PI,
				Math.random() * Math.PI
			);
			scene.add(debris);
			objects.push(debris);
		}
	}

	function createMaintenancePits() {
		var pitPositions = [
			[30, -6, -15],
			[-30, -6, 20]
		];

		for (var i = 0; i < pitPositions.length; i++) {
			var pitWallGeometry = new THREE.BoxGeometry(12, 8, 12);
			var pitWall = new THREE.Mesh(pitWallGeometry, materials.darkGray);
			pitWall.position.set(pitPositions[i][0], pitPositions[i][1], pitPositions[i][2]);
			scene.add(pitWall);
			objects.push(pitWall);

			var pitFloorGeometry = new THREE.BoxGeometry(10, 1, 10);
			var pitFloor = new THREE.Mesh(pitFloorGeometry, materials.corrodedBrown);
			pitFloor.position.set(pitPositions[i][0], pitPositions[i][1] - 4, pitPositions[i][2]);
			scene.add(pitFloor);
			objects.push(pitFloor);
		}
	}

	function createDockStructure() {
		var dockGeometry = new THREE.BoxGeometry(80, 2, 60);
		var dockMaterial = new THREE.MeshStandardMaterial({
			color: 0x4A4A4A,
			metalness: 0.7,
			roughness: 0.6
		});
		var dock = new THREE.Mesh(dockGeometry, dockMaterial);
		dock.position.set(0, 0, 0);
		scene.add(dock);
		objects.push(dock);

		var edgeGeometry = new THREE.BoxGeometry(80, 1, 1);
		var edgeMaterial = materials.rustOrange;
		var edge1 = new THREE.Mesh(edgeGeometry, edgeMaterial);
		edge1.position.set(0, 1.5, 30);
		scene.add(edge1);

		var edge2 = new THREE.Mesh(edgeGeometry, edgeMaterial);
		edge2.position.set(0, 1.5, -30);
		scene.add(edge2);

		var sideGeometry = new THREE.BoxGeometry(1, 1, 60);
		var side1 = new THREE.Mesh(sideGeometry, edgeMaterial);
		side1.position.set(40, 1.5, 0);
		scene.add(side1);

		var side2 = new THREE.Mesh(sideGeometry, edgeMaterial);
		side2.position.set(-40, 1.5, 0);
		scene.add(side2);
	}

	function updateAnimations(delta) {
		time += delta;

		for (var i = 0; i < animatedObjects.length; i++) {
			var anim = animatedObjects[i];

			if (anim.type === 'rotate') {
				if (anim.axis === 'x') {
					anim.object.rotation.x += anim.speed * delta;
				} else if (anim.axis === 'z') {
					anim.object.rotation.z += anim.speed * delta;
				}
			} else if (anim.type === 'swing') {
				anim.object.rotation.z = Math.sin(time * 0.5) * 0.15;
			} else if (anim.type === 'pulse') {
				var scale = anim.baseScale + Math.sin(time * 2) * 0.3;
				anim.object.scale.set(scale, scale, scale);
				anim.object.material.opacity = 0.3 + Math.sin(time * 2.5) * 0.2;
			} else if (anim.type === 'steam') {
				anim.object.position.y += Math.sin(time * 1.5 + i) * 0.02;
			}
		}
	}

	function init(_scene, _camera) {
		scene = _scene;
		camera = _camera;

		initMaterials();

		var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
		scene.add(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
		directionalLight.position.set(30, 40, 20);
		directionalLight.castShadow = true;
		scene.add(directionalLight);

		var fogColor = 0x4A4A4A;
		scene.fog = new THREE.Fog(fogColor, 120, 200);
		scene.background = new THREE.Color(0x2A2A2A);

		createDockStructure();
		createWarship();
		createOversideCrane();
		createGearCluster();
		createControlTower();
		createPipeCluster();
		createCorrodedContainers();
		createChainLinkFencing();
		createSteamLeaks();
		createOilSlicks();
		createExplosiveOrdnance();
		createCollapsedRoof();
		createMaintenancePits();
	}

	function update(delta) {
		updateAnimations(delta);
	}

	function reset() {
		time = 0;
		animatedObjects = [];
		objects = [];

		while (scene.children.length > 0) {
			scene.remove(scene.children[0]);
		}

		init(scene, camera);
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
