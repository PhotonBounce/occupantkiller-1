window.VoidBase = (function() {
	'use strict';

	var scene;
	var camera;
	var objects = [];
	var lights = [];
	var animationTargets = [];

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		lights = [];
		animationTargets = [];

		buildlighting();
		buildmainstructure();
		buildrift();
		buildplatforms();
		buildequipment();
		builddistortion();
		buildstatues();
		buildsingularity();
	}

	function buildlighting() {
		var ambientlight = new THREE.AmbientLight(0x404080, 0.6);
		scene.add(ambientlight);
		lights.push(ambientlight);

		var mainlight = new THREE.DirectionalLight(0xffffff, 0.8);
		mainlight.position.set(40, 60, 40);
		mainlight.castShadow = true;
		mainlight.shadow.mapSize.width = 2048;
		mainlight.shadow.mapSize.height = 2048;
		scene.add(mainlight);
		lights.push(mainlight);

		var purplelight = new THREE.PointLight(0x8040ff, 0.5, 100);
		purplelight.position.set(-30, 20, -30);
		scene.add(purplelight);
		lights.push(purplelight);

		var greenlight = new THREE.PointLight(0x00ff80, 0.4, 80);
		greenlight.position.set(30, 15, 30);
		scene.add(greenlight);
		lights.push(greenlight);
	}

	function buildmainstructure() {
		var mat1 = new THREE.MeshLambertMaterial({ color: 0x404040, emissive: 0x0a0a0a });
		var mat2 = new THREE.MeshLambertMaterial({ color: 0x303050, emissive: 0x0a0a20 });

		var geom = new THREE.BoxGeometry(80, 40, 80);
		var mesh = new THREE.Mesh(geom, mat1);
		mesh.position.y = 20;
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		scene.add(mesh);
		objects.push(mesh);

		var innergeom = new THREE.BoxGeometry(60, 35, 60);
		var innermesh = new THREE.Mesh(innergeom, mat2);
		innermesh.position.set(0, 22, 0);
		innermesh.castShadow = true;
		innermesh.receiveShadow = true;
		scene.add(innermesh);
		objects.push(innermesh);

		var wallmat = new THREE.MeshLambertMaterial({ color: 0x505080, emissive: 0x1a1a30 });
		var wallgeom = new THREE.BoxGeometry(4, 35, 60);
		var wallmesh = new THREE.Mesh(wallgeom, wallmat);
		wallmesh.position.set(28, 22, 0);
		wallmesh.castShadow = true;
		scene.add(wallmesh);
		objects.push(wallmesh);

		var wallmesh2 = new THREE.Mesh(wallgeom, wallmat);
		wallmesh2.position.set(-28, 22, 0);
		wallmesh2.castShadow = true;
		scene.add(wallmesh2);
		objects.push(wallmesh2);

		var wallgeom2 = new THREE.BoxGeometry(60, 35, 4);
		var wallmesh3 = new THREE.Mesh(wallgeom2, wallmat);
		wallmesh3.position.set(0, 22, 28);
		wallmesh3.castShadow = true;
		scene.add(wallmesh3);
		objects.push(wallmesh3);

		var wallmesh4 = new THREE.Mesh(wallgeom2, wallmat);
		wallmesh4.position.set(0, 22, -28);
		wallmesh4.castShadow = true;
		scene.add(wallmesh4);
		objects.push(wallmesh4);

		var ceilinggeom = new THREE.BoxGeometry(60, 2, 60);
		var ceilingmesh = new THREE.Mesh(ceilinggeom, mat1);
		ceilingmesh.position.set(0, 42, 0);
		ceilingmesh.receiveShadow = true;
		scene.add(ceilingmesh);
		objects.push(ceilingmesh);
	}

	function buildrift() {
		var voidmat = new THREE.MeshLambertMaterial({ color: 0x1a0033, emissive: 0x4400ff, wireframe: false });
		var phasemat = new THREE.MeshLambertMaterial({ color: 0x003366, emissive: 0x0088ff, transparent: true, opacity: 0.6 });

		var i;
		for (i = 0; i < 15; i++) {
			var riftgeom = new THREE.BoxGeometry(6 + Math.random() * 4, 8 + Math.random() * 6, 6 + Math.random() * 4);
			var riftmesh = new THREE.Mesh(riftgeom, voidmat);
			riftmesh.position.set(-35 + Math.random() * 70, 15 + Math.random() * 20, -35 + Math.random() * 70);
			riftmesh.rotation.set(Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5);
			riftmesh.castShadow = true;
			scene.add(riftmesh);
			objects.push(riftmesh);
			animationTargets.push({ mesh: riftmesh, type: 'portal', basepos: riftmesh.position.clone() });
		}

		for (i = 0; i < 8; i++) {
			var phasegeom = new THREE.BoxGeometry(10, 15, 10);
			var phasemesh = new THREE.Mesh(phasegeom, phasemat);
			phasemesh.position.set(-40 + Math.random() * 80, 25 + Math.random() * 15, -40 + Math.random() * 80);
			phasemesh.rotation.set(Math.random() * 0.3, Math.random() * 0.3, Math.random() * 0.3);
			phasemesh.castShadow = true;
			scene.add(phasemesh);
			objects.push(phasemesh);
		}
	}

	function buildplatforms() {
		var platformmat = new THREE.MeshLambertMaterial({ color: 0x1a3a4a, emissive: 0x0066aa });

		var i;
		for (i = 0; i < 6; i++) {
			var platgeom = new THREE.BoxGeometry(12, 1.5, 12);
			var platmesh = new THREE.Mesh(platgeom, platformmat);
			var basex = -30 + (i % 3) * 30;
			var basez = -30 + Math.floor(i / 3) * 30;
			var basey = 25 + Math.random() * 10;
			platmesh.position.set(basex, basey, basez);
			platmesh.castShadow = true;
			platmesh.receiveShadow = true;
			scene.add(platmesh);
			objects.push(platmesh);
			animationTargets.push({ mesh: platmesh, type: 'platform', basepos: new THREE.Vector3(basex, basey, basez), phase: Math.random() * Math.PI * 2 });

			var supportgeom = new THREE.CylinderGeometry(0.8, 0.8, basey, 8);
			var supportmat = new THREE.MeshLambertMaterial({ color: 0x202040, emissive: 0x0a0a1a });
			var supportmesh = new THREE.Mesh(supportgeom, supportmat);
			supportmesh.position.set(basex, basey / 2, basez);
			supportmesh.castShadow = true;
			scene.add(supportmesh);
			objects.push(supportmesh);
		}
	}

	function buildequipment() {
		var metalmat = new THREE.MeshLambertMaterial({ color: 0x505050, emissive: 0x1a1a1a });
		var glassmat = new THREE.MeshLambertMaterial({ color: 0x4488dd, emissive: 0x2244aa, transparent: true, opacity: 0.8 });

		var i;
		for (i = 0; i < 10; i++) {
			var cylindergeom = new THREE.CylinderGeometry(1.5, 1.5, 6, 12);
			var cylindermesh = new THREE.Mesh(cylindergeom, metalmat);
			cylindermesh.position.set(-35 + Math.random() * 70, 7, -35 + Math.random() * 70);
			cylindermesh.castShadow = true;
			scene.add(cylindermesh);
			objects.push(cylindermesh);

			var topgeom = new THREE.SphereGeometry(1.8, 8, 8);
			var topmesh = new THREE.Mesh(topgeom, glassmat);
			topmesh.position.set(-35 + Math.random() * 70, 9, -35 + Math.random() * 70);
			topmesh.castShadow = true;
			scene.add(topmesh);
			objects.push(topmesh);
		}

		for (i = 0; i < 8; i++) {
			var conegeom = new THREE.ConeGeometry(2, 8, 8);
			var conemesh = new THREE.Mesh(conegeom, metalmat);
			conemesh.position.set(-40 + Math.random() * 80, 6, -40 + Math.random() * 80);
			conemesh.rotation.x = Math.random() * 0.3;
			conemesh.castShadow = true;
			scene.add(conemesh);
			objects.push(conemesh);
		}

		for (i = 0; i < 6; i++) {
			var spheregeom = new THREE.SphereGeometry(2, 12, 12);
			var spheremesh = new THREE.Mesh(spheregeom, metalmat);
			spheremesh.position.set(-30 + Math.random() * 60, 8 + Math.random() * 10, -30 + Math.random() * 60);
			spheremesh.castShadow = true;
			scene.add(spheremesh);
			objects.push(spheremesh);
		}
	}

	function builddistortion() {
		var distortmat = new THREE.MeshLambertMaterial({ color: 0x2a1a3a, emissive: 0x6600ff, wireframe: true });

		var i;
		for (i = 0; i < 12; i++) {
			var distgeom = new THREE.BoxGeometry(5 + Math.random() * 8, 5 + Math.random() * 8, 5 + Math.random() * 8);
			var distmesh = new THREE.Mesh(distgeom, distortmat);
			distmesh.position.set(-40 + Math.random() * 80, 10 + Math.random() * 25, -40 + Math.random() * 80);
			distmesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
			distmesh.scale.set(1 + Math.random() * 0.3, 1 + Math.random() * 0.3, 1 + Math.random() * 0.3);
			scene.add(distmesh);
			objects.push(distmesh);
		}

		for (i = 0; i < 20; i++) {
			var linegeom = new THREE.BufferGeometry();
			var positions = new Float32Array([
				-5, -5, -5,
				5, 5, 5,
				-5, 5, -5,
				5, -5, 5,
				-5, -5, 5,
				5, 5, -5
			]);
			linegeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
			var linemat = new THREE.LineBasicMaterial({ color: 0xff0080, linewidth: 2 });
			var lines = new THREE.LineSegments(linegeom, linemat);
			lines.position.set(-35 + Math.random() * 70, 12 + Math.random() * 20, -35 + Math.random() * 70);
			scene.add(lines);
			objects.push(lines);
		}
	}

	function buildstatues() {
		var stonemat = new THREE.MeshLambertMaterial({ color: 0x606060, emissive: 0x0a0a0a });
		var frostmat = new THREE.MeshLambertMaterial({ color: 0x888899, emissive: 0x1a1a2a, transparent: true, opacity: 0.9 });

		var i;
		for (i = 0; i < 6; i++) {
			var bodygeom = new THREE.BoxGeometry(2, 6, 1.5);
			var bodymesh = new THREE.Mesh(bodygeom, stonemat);
			bodymesh.position.set(-35 + i * 14, 7, -20);
			bodymesh.castShadow = true;
			scene.add(bodymesh);
			objects.push(bodymesh);

			var headgeom = new THREE.SphereGeometry(1.2, 8, 8);
			var headmesh = new THREE.Mesh(headgeom, frostmat);
			headmesh.position.set(-35 + i * 14, 10, -20);
			headmesh.castShadow = true;
			scene.add(headmesh);
			objects.push(headmesh);

			var armgeom = new THREE.CylinderGeometry(0.5, 0.5, 2.5, 6);
			var armmesh1 = new THREE.Mesh(armgeom, stonemat);
			armmesh1.position.set(-35 + i * 14 - 1.5, 8, -20);
			armmesh1.rotation.z = 0.3;
			armmesh1.castShadow = true;
			scene.add(armmesh1);
			objects.push(armmesh1);

			var armmesh2 = new THREE.Mesh(armgeom, stonemat);
			armmesh2.position.set(-35 + i * 14 + 1.5, 8, -20);
			armmesh2.rotation.z = -0.3;
			armmesh2.castShadow = true;
			scene.add(armmesh2);
			objects.push(armmesh2);
		}
	}

	function buildsingularity() {
		var singmat = new THREE.MeshLambertMaterial({ color: 0x0a0a0a, emissive: 0x440055 });
		var singgeom = new THREE.SphereGeometry(3, 16, 16);
		var singmesh = new THREE.Mesh(singgeom, singmat);
		singmesh.position.set(0, 25, 0);
		singmesh.castShadow = true;
		scene.add(singmesh);
		objects.push(singmesh);
		animationTargets.push({ mesh: singmesh, type: 'singularity', basepos: singmesh.position.clone() });

		var orbmat = new THREE.MeshLambertMaterial({ color: 0x220044, emissive: 0xff0088 });
		var i;
		for (i = 0; i < 5; i++) {
			var orbgeom = new THREE.SphereGeometry(0.6, 8, 8);
			var orbmesh = new THREE.Mesh(orbgeom, orbmat);
			orbmesh.position.set(5 * Math.cos(i * 2 * Math.PI / 5), 25 + 2 * Math.sin(i * 2 * Math.PI / 5), 5 * Math.sin(i * 2 * Math.PI / 5));
			orbmesh.castShadow = true;
			scene.add(orbmesh);
			objects.push(orbmesh);
			animationTargets.push({ mesh: orbmesh, type: 'orbit', index: i, basepos: orbmesh.position.clone() });
		}

		var halogeom = new THREE.CylinderGeometry(6, 6, 0.3, 32);
		var halomat = new THREE.MeshLambertMaterial({ color: 0x550088, emissive: 0xff00ff, transparent: true, opacity: 0.5 });
		var halomesh = new THREE.Mesh(halogeom, halomat);
		halomesh.position.set(0, 25, 0);
		scene.add(halomesh);
		objects.push(halomesh);
		animationTargets.push({ mesh: halomesh, type: 'halo', basepos: halomesh.position.clone() });
	}

	function update(delta) {
		var i;
		for (i = 0; i < animationTargets.length; i++) {
			var target = animationTargets[i];

			if (target.type === 'portal') {
				var pulse = Math.sin(target.basepos.length() + performance.now() * 0.003) * 0.3;
				target.mesh.scale.set(1 + pulse, 1 + pulse, 1 + pulse);
				target.mesh.rotation.x += 0.005;
				target.mesh.rotation.y += 0.008;
			}

			if (target.type === 'platform') {
				var floatamount = Math.sin(target.phase + performance.now() * 0.002) * 2;
				target.mesh.position.y = target.basepos.y + floatamount;
			}

			if (target.type === 'singularity') {
				target.mesh.rotation.x += 0.002;
				target.mesh.rotation.y += 0.003;
				target.mesh.rotation.z += 0.0015;
				var scalepulse = 1 + Math.sin(performance.now() * 0.004) * 0.15;
				target.mesh.scale.set(scalepulse, scalepulse, scalepulse);
			}

			if (target.type === 'orbit') {
				var time = performance.now() * 0.0006;
				var radius = 5;
				var angle = time + target.index * 2 * Math.PI / 5;
				target.mesh.position.x = Math.cos(angle) * radius;
				target.mesh.position.z = Math.sin(angle) * radius;
				target.mesh.position.y = 25 + Math.sin(time * 2) * 1.5;
			}

			if (target.type === 'halo') {
				target.mesh.rotation.z += 0.0008;
				var haloalpha = 0.3 + Math.sin(performance.now() * 0.004) * 0.2;
				target.mesh.material.opacity = haloalpha;
			}
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
		animationTargets = [];
		scene = null;
		camera = null;
	}

	return { init: init, update: update, reset: reset };
})();
