window.FireBase = (function() {
	'use strict';

	var scene;
	var camera;
	var objects = [];
	var lights = [];
	var animators = [];

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		lights = [];
		animators = [];

		buildlights();
		buildterrain();
		buildberm();
		buildtowers();
		buildammo();
		buildtoc();
		buildhelipad();
		buildmedevac();
		buildwireandstakes();
	}

	function update(delta) {
		var i;
		for (i = 0; i < animators.length; i++) {
			animators[i](delta);
		}
	}

	function reset() {
		var i;
		for (i = 0; i < objects.length; i++) {
			scene.remove(objects[i]);
		}
		for (i = 0; i < lights.length; i++) {
			scene.remove(lights[i]);
		}
		objects = [];
		lights = [];
		animators = [];
		scene = null;
		camera = null;
	}

	function buildlights() {
		var ambient;
		var directional;

		ambient = new THREE.AmbientLight(0x888888);
		scene.add(ambient);
		lights.push(ambient);

		directional = new THREE.DirectionalLight(0xffcc99, 1.2);
		directional.position.set(150, 200, 100);
		directional.castShadow = true;
		scene.add(directional);
		lights.push(directional);
	}

	function buildterrain() {
		var base;
		var grass;
		var i, j;
		var rx, rz;
		var grassGeom;
		var grassMat;

		base = new THREE.Mesh(
			new THREE.BoxGeometry(500, 2, 500),
			new THREE.MeshLambertMaterial({ color: 0x5a4a2a })
		);
		base.position.y = -1;
		scene.add(base);
		objects.push(base);

		grassMat = new THREE.MeshLambertMaterial({ color: 0x3d6b2f });

		for (i = 0; i < 60; i++) {
			grassGeom = new THREE.BoxGeometry(8, 0.5, 8);
			grass = new THREE.Mesh(grassGeom, grassMat);
			rx = Math.random() * 400 - 200;
			rz = Math.random() * 400 - 200;

			if (Math.sqrt(rx*rx + rz*rz) < 25) continue;

			grass.position.set(rx, 0.3, rz);
			grass.rotation.z = Math.random() * 6.28;
			scene.add(grass);
			objects.push(grass);
		}
	}

	function buildberm() {
		var segment;
		var angle;
		var i;
		var x, z;
		var berm;
		var bermMat;
		var innerRad = 70;
		var outerRad = 100;
		var segments = 16;
		var height = 4;

		bermMat = new THREE.MeshLambertMaterial({ color: 0x6b5d47 });

		for (i = 0; i < segments; i++) {
			angle = (i / segments) * 6.28;
			x = Math.cos(angle) * (innerRad + outerRad) / 2;
			z = Math.sin(angle) * (innerRad + outerRad) / 2;

			berm = new THREE.Mesh(
				new THREE.BoxGeometry(30, height, 25),
				bermMat
			);
			berm.position.set(x, height / 2, z);
			berm.rotation.y = angle;
			scene.add(berm);
			objects.push(berm);
		}
	}

	function buildsandbags() {
		var bag;
		var bagMat;
		var i, j;
		var angle;
		var x, z;
		var radius = 85;
		var segments = 12;

		bagMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });

		for (i = 0; i < segments; i++) {
			angle = (i / segments) * 6.28;

			for (j = 0; j < 4; j++) {
				bag = new THREE.Mesh(
					new THREE.BoxGeometry(6, 5, 8),
					bagMat
				);
				x = Math.cos(angle) * radius + (j - 1.5) * 2;
				z = Math.sin(angle) * radius;
				bag.position.set(x, 2.5 + j * 4, z);
				scene.add(bag);
				objects.push(bag);
			}
		}
	}

	function buildtowers() {
		var tower;
		var pole;
		var platform;
		var i;
		var angle;
		var x, z;
		var radius = 110;
		var towerCount = 4;
		var poleMat;
		var platformMat;

		poleMat = new THREE.MeshLambertMaterial({ color: 0x4a3d2a });
		platformMat = new THREE.MeshLambertMaterial({ color: 0x7a6d5a });

		for (i = 0; i < towerCount; i++) {
			angle = (i / towerCount) * 6.28;
			x = Math.cos(angle) * radius;
			z = Math.sin(angle) * radius;

			pole = new THREE.Mesh(
				new THREE.CylinderGeometry(1.5, 1.5, 20, 8),
				poleMat
			);
			pole.position.set(x, 10, z);
			scene.add(pole);
			objects.push(pole);

			platform = new THREE.Mesh(
				new THREE.BoxGeometry(12, 1.5, 12),
				platformMat
			);
			platform.position.set(x, 20, z);
			scene.add(platform);
			objects.push(platform);

			buildtowerrailing(x, z);
		}
	}

	function buildtowerrailing(cx, cz) {
		var rail;
		var railMat;
		var i;
		var sides = 4;
		var halfSize = 6;
		var positions = [
			{ x: halfSize, z: halfSize },
			{ x: -halfSize, z: halfSize },
			{ x: -halfSize, z: -halfSize },
			{ x: halfSize, z: -halfSize }
		];

		railMat = new THREE.MeshLambertMaterial({ color: 0x5a4d3a });

		for (i = 0; i < 4; i++) {
			rail = new THREE.Mesh(
				new THREE.BoxGeometry(12.5, 2, 0.8),
				railMat
			);
			rail.position.set(
				cx + positions[i].x,
				20.5,
				cz + positions[i].z
			);
			scene.add(rail);
			objects.push(rail);
		}
	}

	function buildammo() {
		var pit;
		var howitzer;
		var barrel;
		var breech;
		var shield;
		var shell;
		var shellMat;
		var i;
		var cratesMat;
		var crate;
		var pitMat;

		pitMat = new THREE.MeshLambertMaterial({ color: 0x5a4d3a });
		pit = new THREE.Mesh(
			new THREE.CylinderGeometry(25, 25, 8, 16),
			pitMat
		);
		pit.position.y = -2;
		scene.add(pit);
		objects.push(pit);

		breech = new THREE.Mesh(
			new THREE.CylinderGeometry(4, 4, 8, 12),
			new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
		);
		breech.position.set(0, 4, 0);
		scene.add(breech);
		objects.push(breech);

		barrel = new THREE.Mesh(
			new THREE.CylinderGeometry(2.5, 2, 30, 10),
			new THREE.MeshLambertMaterial({ color: 0x3a3a3a })
		);
		barrel.position.set(0, 4, 0);
		barrel.rotation.z = -0.4;
		scene.add(barrel);
		objects.push(barrel);

		animators.push(function(delta) {
			barrel.rotation.z = -0.4 + Math.sin(Date.now() * 0.0008) * 0.25;
		});

		shield = new THREE.Mesh(
			new THREE.SphereGeometry(6, 8, 6),
			new THREE.MeshLambertMaterial({ color: 0x4a4a3a })
		);
		shield.position.set(0, 4, 0);
		shield.scale.z = 0.3;
		scene.add(shield);
		objects.push(shield);

		cratesMat = new THREE.MeshLambertMaterial({ color: 0x6b5d4f });

		for (i = 0; i < 8; i++) {
			crate = new THREE.Mesh(
				new THREE.BoxGeometry(4, 5, 4),
				cratesMat
			);
			crate.position.set(
				Math.cos(i * 0.785) * 22,
				2.5,
				Math.sin(i * 0.785) * 22
			);
			scene.add(crate);
			objects.push(crate);
		}

		shellMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });

		for (i = 0; i < 12; i++) {
			shell = new THREE.Mesh(
				new THREE.CylinderGeometry(1, 1.2, 3, 8),
				shellMat
			);
			shell.position.set(
				Math.random() * 30 - 15,
				2,
				Math.random() * 30 - 15
			);
			shell.rotation.x = Math.random() * 6.28;
			scene.add(shell);
			objects.push(shell);
		}
	}

	function buildmortarpit() {
		var pit;
		var mortar;
		var tube;
		var i;
		var pitMat;
		var mortarMat;
		var smokeMat;
		var smokePlume;

		pitMat = new THREE.MeshLambertMaterial({ color: 0x5a4d3a });
		pit = new THREE.Mesh(
			new THREE.CylinderGeometry(15, 15, 6, 12),
			pitMat
		);
		pit.position.set(40, -1, 40);
		scene.add(pit);
		objects.push(pit);

		mortarMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });

		for (i = 0; i < 4; i++) {
			mortar = new THREE.Mesh(
				new THREE.CylinderGeometry(3, 3, 6, 10),
				mortarMat
			);
			mortar.position.set(
				40 + Math.cos(i * 1.57) * 8,
				3,
				40 + Math.sin(i * 1.57) * 8
			);
			scene.add(mortar);
			objects.push(mortar);

			tube = new THREE.Mesh(
				new THREE.CylinderGeometry(1.5, 1.2, 15, 8),
				new THREE.MeshLambertMaterial({ color: 0x3a3a2a })
			);
			tube.position.set(
				40 + Math.cos(i * 1.57) * 8,
				8,
				40 + Math.sin(i * 1.57) * 8
			);
			tube.rotation.x = 1.0;
			scene.add(tube);
			objects.push(tube);
		}

		smokeMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });

		for (i = 0; i < 4; i++) {
			smokePlume = new THREE.Mesh(
				new THREE.SphereGeometry(4, 6, 6),
				smokeMat
			);
			smokePlume.position.set(
				40 + Math.cos(i * 1.57) * 8,
				20 + i * 3,
				40 + Math.sin(i * 1.57) * 8
			);
			smokePlume.scale.set(0.5, 0.5, 0.5);
			scene.add(smokePlume);
			objects.push(smokePlume);

			(function(smoke, idx) {
				animators.push(function(delta) {
					smoke.position.y += delta * 15;
					smoke.scale.x += delta * 0.5;
					smoke.scale.y += delta * 0.5;
					smoke.scale.z += delta * 0.5;
					smoke.material.opacity = Math.max(0, 0.8 - smoke.position.y / 60);
				});
			})(smokePlume, i);
		}
	}

	function buildtoc() {
		var bunker;
		var wall;
		var roof;
		var entrance;
		var i;
		var bunkerMat;
		var roofMat;

		bunkerMat = new THREE.MeshLambertMaterial({ color: 0x5a5a4a });
		roofMat = new THREE.MeshLambertMaterial({ color: 0x4a4a3a });

		bunker = new THREE.Mesh(
			new THREE.BoxGeometry(20, 4, 25),
			bunkerMat
		);
		bunker.position.set(-50, 2, 0);
		scene.add(bunker);
		objects.push(bunker);

		roof = new THREE.Mesh(
			new THREE.BoxGeometry(22, 2, 27),
			roofMat
		);
		roof.position.set(-50, 5, 0);
		scene.add(roof);
		objects.push(roof);

		entrance = new THREE.Mesh(
			new THREE.BoxGeometry(4, 3, 8),
			new THREE.MeshLambertMaterial({ color: 0x3a3a2a })
		);
		entrance.position.set(-50, 1.5, 16);
		scene.add(entrance);
		objects.push(entrance);

		for (i = 0; i < 4; i++) {
			wall = new THREE.Mesh(
				new THREE.BoxGeometry(2, 5, 4),
				bunkerMat
			);
			wall.position.set(-50, 2.5, -10 + i * 7);
			scene.add(wall);
			objects.push(wall);
		}
	}

	function buildhelipad() {
		var pad;
		var circle;
		var rotor;
		var mast;
		var rotorMat;
		var padMat;
		var i;
		var blade;
		var bladeMat;

		padMat = new THREE.MeshLambertMaterial({ color: 0x3a5a3a });
		pad = new THREE.Mesh(
			new THREE.CylinderGeometry(30, 30, 0.5, 16),
			padMat
		);
		pad.position.set(0, 0.3, -80);
		scene.add(pad);
		objects.push(pad);

		for (i = 0; i < 4; i++) {
			circle = new THREE.Mesh(
				new THREE.CylinderGeometry(30 - i * 6, 30 - i * 6, 0.3, 16),
				new THREE.MeshLambertMaterial({ color: 0x4a6a4a })
			);
			circle.position.set(0, 0.2 - i * 0.1, -80);
			scene.add(circle);
			objects.push(circle);
		}

		mast = new THREE.Mesh(
			new THREE.CylinderGeometry(1, 1, 20, 8),
			new THREE.MeshLambertMaterial({ color: 0x4a4a3a })
		);
		mast.position.set(0, 10, -80);
		scene.add(mast);
		objects.push(mast);

		rotorMat = new THREE.MeshLambertMaterial({ color: 0x5a7a5a });
		bladeMat = new THREE.MeshLambertMaterial({ color: 0x6a7a6a });

		var rotorGroup = new THREE.Group();
		rotorGroup.position.set(0, 20, -80);
		scene.add(rotorGroup);
		objects.push(rotorGroup);

		for (i = 0; i < 4; i++) {
			blade = new THREE.Mesh(
				new THREE.BoxGeometry(2, 25, 1),
				bladeMat
			);
			blade.position.set(0, 0, 0);
			blade.rotation.z = (i / 4) * 6.28;
			rotorGroup.add(blade);
		}

		rotor = new THREE.Mesh(
			new THREE.CylinderGeometry(1.5, 1.5, 1, 8),
			rotorMat
		);
		rotorGroup.add(rotor);

		animators.push(function(delta) {
			rotorGroup.rotation.y += delta * 12;
		});
	}

	function buildmedevac() {
		var stretcher;
		var frame;
		var canvas;
		var i;
		var stretcberMat;
		var frameMat;
		var areaMarker;
		var markerMat;

		markerMat = new THREE.MeshLambertMaterial({ color: 0x6a3a2a });
		areaMarker = new THREE.Mesh(
			new THREE.CylinderGeometry(20, 20, 0.2, 12),
			markerMat
		);
		areaMarker.position.set(50, 0.1, -80);
		scene.add(areaMarker);
		objects.push(areaMarker);

		stretcberMat = new THREE.MeshLambertMaterial({ color: 0x8a7a6a });
		frameMat = new THREE.MeshLambertMaterial({ color: 0x5a5a4a });

		for (i = 0; i < 3; i++) {
			frame = new THREE.Mesh(
				new THREE.BoxGeometry(2, 0.5, 6),
				frameMat
			);
			frame.position.set(50 - 10 + i * 10, 1, -80);
			scene.add(frame);
			objects.push(frame);

			canvas = new THREE.Mesh(
				new THREE.BoxGeometry(1.8, 0.3, 5.8),
				stretcberMat
			);
			canvas.position.set(50 - 10 + i * 10, 1.5, -80);
			scene.add(canvas);
			objects.push(canvas);
		}
	}

	function buildwireandstakes() {
		var stake;
		var stakeMat;
		var i;
		var angle;
		var x, z;
		var radius = 105;
		var stakeCount = 20;
		var mine;
		var mineMat;

		stakeMat = new THREE.MeshLambertMaterial({ color: 0x3a3a2a });
		mineMat = new THREE.MeshLambertMaterial({ color: 0x4a4a3a });

		for (i = 0; i < stakeCount; i++) {
			angle = (i / stakeCount) * 6.28;
			x = Math.cos(angle) * radius;
			z = Math.sin(angle) * radius;

			stake = new THREE.Mesh(
				new THREE.CylinderGeometry(0.8, 0.8, 6, 6),
				stakeMat
			);
			stake.position.set(x, 3, z);
			scene.add(stake);
			objects.push(stake);

			mine = new THREE.Mesh(
				new THREE.SphereGeometry(1.2, 6, 6),
				mineMat
			);
			mine.position.set(x, 1.5, z);
			scene.add(mine);
			objects.push(mine);

			buildwire(x, z, angle);
		}
	}

	function buildwire(x1, z1, angle) {
		var wire;
		var x2, z2;
		var wireGeom;
		var wireMat;
		var wirePositions;

		x2 = Math.cos(angle + 0.314) * 110;
		z2 = Math.sin(angle + 0.314) * 110;

		wireGeom = new THREE.BufferGeometry();
		wirePositions = new Float32Array([
			x1, 2, z1,
			x2, 2, z2
		]);

		wireGeom.setAttribute('position', new THREE.BufferAttribute(wirePositions, 3));
		wireMat = new THREE.LineBasicMaterial({ color: 0x5a5a4a, linewidth: 2 });
		wire = new THREE.LineSegments(wireGeom, wireMat);

		scene.add(wire);
		objects.push(wire);
	}

	function buildsupply() {
		var container;
		var box;
		var containerMat;
		var i;

		containerMat = new THREE.MeshLambertMaterial({ color: 0x6b7a6b });

		for (i = 0; i < 3; i++) {
			container = new THREE.Mesh(
				new THREE.BoxGeometry(8, 6, 6),
				containerMat
			);
			container.position.set(-30 + i * 12, 3, 60);
			scene.add(container);
			objects.push(container);

			box = new THREE.Mesh(
				new THREE.BoxGeometry(3, 3, 3),
				new THREE.MeshLambertMaterial({ color: 0x8b8b7b })
			);
			box.position.set(-30 + i * 12, 6.5, 60 + 3);
			scene.add(box);
			objects.push(box);
		}
	}

	function builddefense() {
		var gun;
		var tripod;
		var gunMat;
		var tripodMat;
		var i;
		var angle;
		var x, z;
		var positions = [
			{ angle: 0, rad: 85 },
			{ angle: 3.14, rad: 85 },
			{ angle: 1.57, rad: 85 },
			{ angle: 4.71, rad: 85 }
		];

		gunMat = new THREE.MeshLambertMaterial({ color: 0x3a3a2a });
		tripodMat = new THREE.MeshLambertMaterial({ color: 0x5a5a4a });

		for (i = 0; i < positions.length; i++) {
			angle = positions[i].angle;
			var rad = positions[i].rad;
			x = Math.cos(angle) * rad;
			z = Math.sin(angle) * rad;

			tripod = new THREE.Mesh(
				new THREE.BoxGeometry(4, 3, 4),
				tripodMat
			);
			tripod.position.set(x, 1.5, z);
			scene.add(tripod);
			objects.push(tripod);

			gun = new THREE.Mesh(
				new THREE.CylinderGeometry(1, 1.2, 8, 8),
				gunMat
			);
			gun.position.set(x, 3.5, z);
			gun.rotation.z = Math.random() * 0.5;
			scene.add(gun);
			objects.push(gun);
		}
	}

	(function() {
		buildsandbags();
		buildmortarpit();
		buildsupply();
		builddefense();
	})();

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
