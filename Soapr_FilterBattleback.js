var Imported = Imported || {};
Imported.Soapr_FilterBattleback = true;

var Soapr = Soapr || {};
Soapr.FilterBattleback = Soapr.FilterBattleback || {};

//=============================================================================
/*:
* @plugindesc Adds filter battleback to RPG Maker MV (like in RPG Maker VX)
* @author Soaprman
*
* @help
* Help? What do you think this is, a professional script?
*
* Uses LinearBlurFilter by Petri Leskinen (modified by me to work in RPG Maker)
* http://pixelero.wordpress.com/
* http://www.petrileskinen.fi/html5/linearBlur/demo.html
* MIT License
*
* 
*/
//=============================================================================

//=============================================================================
// Image manipulation
//=============================================================================

Soapr.FilterBattleback.LinearBlurFilter = function () {
	/**
	 #   LinearBlurFilter
	 #	Espoo, Finland, December 2014
	 #	Petri Leskinen, 
	 #		petri.leskinen@icloud.com
	 #		http://pixelero.wordpress.com/
	 #  MIT license
	 */

	this.CIRCULAR = 'circular';
	this.LINEAR = 'linear';

	this.mode = this.LINEAR;


	//	blur amounts in two directions perpendicular to one another:
	this.blur = 6.0;
	this.blur2 = 6.0;

	//	base points, p0 a point with no change:
	this.p0 = { x: 100, y: 500 };
	this.p1 = { x: 350, y: 100 };


	/**	renders the output,
		canvas = a html5 canvas element,
		img = image to be used
	 */
	this.convertImage = function (canvas, img) {
		var context = canvas.getContext('2d'),
			w = canvas.width,
			h = canvas.height;
		context.clearRect(0, 0, w, h);
		context.drawImage(img, 0, 0, w, h);

		var canvas2 = document.createElement('canvas'),
			context2 = canvas2.getContext('2d');
		canvas2.width = w;
		canvas2.height = h;

		//	p0 is always the point where the local blur = 0
		//	location p1 controls the amount of blur,
		//	p2 is a point as far from p0 as p1 but in a perpendicular
		//	direction.
		var p0 = this.p0,
			p1 = this.p1,
			d2 = { x: p1.x - p0.x, y: p1.y - p0.y },
			d1 = { x: -d2.y, y: d2.x },
			p2 = { x: p0.x + d1.x, y: p0.y + d1.y },
			r = Math.sqrt(d2.x * d2.x + d2.y * d2.y);
		this.normalize(d1);
		this.normalize(d2);

		//	two blurs:
		bl = this.blur;
		bl2 = this.blur2;
		//	controls attenuation of the blur radial
		f = 0.55;

		//	control points as row matrices 3x3:
		var A = [[p0.x, p0.y, 1.0], [p1.x, p1.y, 1.0], [p2.x, p2.y, 1.0]],
			B = [[p0.x, p0.y, 1.0], [p1.x, p1.y, 1.0], [0.0, 0.0, 1.0]];

		if (this.mode == this.LINEAR) {
			while (bl > 0.5 || bl2 > 0.5) {

				if (bl > 0.4) {
					context2.drawImage(canvas, 0, 0, w, h);

					//	blur perpendicular to line p0-p1:
					B[2][0] = p2.x + bl * d1.x
					B[2][1] = p2.y + bl * d1.y;
					var M = this.solveLinear(A, B);

					//	draw a copy two times,
					//	first with alpha=1.0, second mixed with alpha=0.5:
					context.restore();
					context.globalAlpha = 1.0;
					context.setTransform(M[0][0], M[0][1], M[1][0], M[1][1],
						M[2][0], M[2][1]);
					context.drawImage(canvas2, 0, 0);

					B[2][0] = p2.x - bl * d1.x
					B[2][1] = p2.y - bl * d1.y;
					M = this.solveLinear(A, B);

					context.globalAlpha = 0.5;
					context.setTransform(M[0][0], M[0][1], M[1][0], M[1][1],
						M[2][0], M[2][1]);
					context.drawImage(canvas2, 0, 0);

					//	decrease the blur amount:
					bl *= f;
				}

				if (bl2 > 0.4) {
					context2.drawImage(canvas, 0, 0, w, h);

					//	blur in direction of line p0-p1:
					B[2][0] = p2.x + bl2 * d2.x;
					B[2][1] = p2.y + bl2 * d2.y;
					var M = this.solveLinear(A, B);

					context.restore();
					context.globalAlpha = 1.0;
					context.setTransform(M[0][0], M[0][1], M[1][0], M[1][1],
						M[2][0], M[2][1]);
					context.drawImage(canvas2, 0, 0);

					B[2][0] = p2.x - bl2 * d2.x;
					B[2][1] = p2.y - bl2 * d2.y;
					M = this.solveLinear(A, B);

					context.globalAlpha = 0.5;
					context.setTransform(M[0][0], M[0][1], M[1][0], M[1][1],
						M[2][0], M[2][1]);
					context.drawImage(canvas2, 0, 0);
					bl2 *= f;
				}
			}
		} else { // CIRCULAR BLUR:
			while (bl > 0.5 || bl2 > 0.5) {

				if (bl > 0.4) {
					context2.drawImage(canvas, 0, 0, w, h);

					//	apply the desired CCW rotation around p0
					var theta = bl / r,
						cs = Math.cos(theta),
						sn = Math.sin(theta);

					B[1][0] = p0.x + cs * (p1.x - p0.x) - sn * (p1.y - p0.y);
					B[1][1] = p0.y + sn * (p1.x - p0.x) + cs * (p1.y - p0.y);

					B[2][0] = p0.x + cs * (p2.x - p0.x) - sn * (p2.y - p0.y);
					B[2][1] = p0.y + sn * (p2.x - p0.x) + cs * (p2.y - p0.y);
					var M = this.solveLinear(A, B);

					context.restore();
					context.globalAlpha = 1.0;
					context.setTransform(M[0][0], M[0][1], M[1][0], M[1][1],
						M[2][0], M[2][1]);
					context.drawImage(canvas2, 0, 0);

					//	apply same rotation to reverse CW direction:
					//	-theta: sn = -sn, cs = cs, only sine terms change sign:
					B[1][0] = p0.x + cs * (p1.x - p0.x) + sn * (p1.y - p0.y);
					B[1][1] = p0.y - sn * (p1.x - p0.x) + cs * (p1.y - p0.y);

					B[2][0] = p0.x + cs * (p2.x - p0.x) + sn * (p2.y - p0.y);
					B[2][1] = p0.y - sn * (p2.x - p0.x) + cs * (p2.y - p0.y);
					M = this.solveLinear(A, B);

					context.globalAlpha = 0.5;
					context.setTransform(M[0][0], M[0][1], M[1][0], M[1][1],
						M[2][0], M[2][1]);
					context.drawImage(canvas2, 0, 0);

					bl *= f;
				}

				if (bl2 > 0.4) {
					context2.drawImage(canvas, 0, 0, w, h);

					//	apply the radial blur with p0 as center:
					var d = (r + bl2) / r;

					//	blur outwards:
					B[1][0] = p0.x + d * (p1.x - p0.x);
					B[1][1] = p0.y + d * (p1.y - p0.y);

					B[2][0] = p0.x + d * (p2.x - p0.x);
					B[2][1] = p0.y + d * (p2.y - p0.y);
					var M = this.solveLinear(A, B);

					context.restore();
					context.globalAlpha = 1.0;
					context.setTransform(M[0][0], M[0][1], M[1][0], M[1][1],
						M[2][0], M[2][1]);
					context.drawImage(canvas2, 0, 0);

					//	blur inwards:
					d = (r - bl2) / r;
					B[1][0] = p0.x + d * (p1.x - p0.x);
					B[1][1] = p0.y + d * (p1.y - p0.y);

					B[2][0] = p0.x + d * (p2.x - p0.x);
					B[2][1] = p0.y + d * (p2.y - p0.y);
					M = this.solveLinear(A, B);

					context.globalAlpha = 0.5;
					context.setTransform(M[0][0], M[0][1], M[1][0], M[1][1],
						M[2][0], M[2][1]);
					context.drawImage(canvas2, 0, 0);

					bl2 *= f
				}

			}
		}

	}


	/**	Solves matrix equation inv(A)*B
		with 3x3 matrices
	 
	 used here to map the source point and destination points:
		 | p0 |		| p0 |
	 A = | p1 | , B=| q1 |
		 | p2 |		| q2 |
	 
	 */
	this.solveLinear = function (A, B) {
		var C = [];
		for (var i = 0; i < A.length; i++) {
			C.push(A[i].concat(B[i]));
		}

		// Keeps numbers from underflowing due to differences in Javascript engines, or something
		for (var i = 0; i < C.length; i++) {
			for (var j = 0; j < C[i].length; j++) {
				C[i][j] = Math.floor(C[i][j]);
			}
		}

		var flin = function (x, a, y, b) {
			//	calculates the linear sum: a = xa+yb
			for (var i = 0; i < a.length; i++) {
				a[i] = x * a[i] + y * b[i];
			}
		};
		var fmul = function (a, f) {
			//	multiplies each element of a with f:
			for (var i = 0; i < a.length; i++) {
				a[i] *= f;
			}
		}

		var f = C[0][0],
			g = -f * C[1][1] + C[0][1] * C[1][0];
		flin(-f / g, C[1], C[1][0] / g, C[0]);
		flin(-f, C[2], C[2][0], C[0]);


		f = C[1][1];
		g = -f * C[2][2] + C[1][2] * C[2][1];
		flin(-f / g, C[2], C[2][1] / g, C[1]);

		f = C[2][2];
		flin(f, C[1], -C[1][2], C[2]);
		flin(f, C[0], -C[0][2], C[2]);

		f = C[1][1];
		flin(f, C[0], -C[0][1], C[1]);

		fmul(C[0], 1 / C[0][0]);

		for (var i = 0; i < C.length; i++) {
			C[i] = C[i].slice(3);
		}

		return C;
	}

	this.normalize = function (v) {
		var d = v.x * v.x + v.y * v.y;
		d = 1.0 / Math.sqrt(d);
		v.x *= d;
		v.y *= d;
	}
};

// Holds the image after blur so animations can be applied to it
Soapr.FilterBattleback.BlurredImage = null;

// The current frame of wave animation
Soapr.FilterBattleback.WaveFrame = 0;

Soapr.FilterBattleback.PerformRadialBlur = function (canvas, angularStrength, radialStrength) {
	var filter = new Soapr.FilterBattleback.LinearBlurFilter();

	filter.mode = filter.CIRCULAR;
	filter.blur = angularStrength || filter.blur; // perpendicular to center
	filter.blur2 = radialStrength || filter.blur2; // outward from center
	filter.p0 = { x: canvas.width / 2, y: canvas.height / 2 }; // canvas center
	filter.p1 = { x: canvas.width * 0.35, y: canvas.height * 0.35 }; // between canvas center and edge

	var img = new Image();
	img.src = canvas.toDataURL();

	filter.convertImage(canvas, img);

	// Save a snapshot of the blurred image for animation
	Soapr.FilterBattleback.BlurredImage = new Image();
	Soapr.FilterBattleback.BlurredImage.src = canvas.toDataURL();
};

Soapr.FilterBattleback.UpdateWaviness = function (canvas) {
	var amplitude = 8,
		frequency = 0.05,
		speed = 0.1,
		ctx = canvas.getContext('2d');

	var img = Soapr.FilterBattleback.BlurredImage;

	if (img) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Row by row
		for (var y = 0; y < img.height; y++) {
			var xOffset = amplitude * Math.sin(Soapr.FilterBattleback.WaveFrame * speed + (y * frequency));
			ctx.drawImage(img,
				0, y, img.width, 1,
				xOffset - amplitude, y, img.width + (amplitude * 2), 1);
		}
	}
};

//=============================================================================
// Bitmap
//=============================================================================

Bitmap.prototype.radialBlur = function (angularStrength, radialStrength) {
	var w = this.width;
	var h = this.height;
	var canvas = this._canvas;
	var context = this._context;

	context.save();

	// Blur the background
	var tempCanvas = document.createElement('canvas');
	var tempContext = tempCanvas.getContext('2d');
	tempCanvas.width = w;
	tempCanvas.height = h;
	tempContext.drawImage(canvas, 0, 0, w, h, 0, 0, w, h);
	Soapr.FilterBattleback.PerformRadialBlur(tempCanvas, angularStrength, radialStrength);
	context.clearRect(0, 0, w, h);
	context.globalCompositeOperation = 'source-over';
	context.globalAlpha = 1;
	context.drawImage(tempCanvas, 0, 0, w, h, 0, 0, w, h);

	// Darken BG + draw floor
	context.globalAlpha = 0.25;
	context.fillStyle = 'black';
	context.fillRect(0, 0, w, h);
	context.beginPath();
	context.ellipse(w / 2, 360, w * 0.45, 50, 0, 0, 2 * Math.PI);
	context.fill();

	context.restore();
	this._setDirty();
};

//=============================================================================
// SceneManager
//=============================================================================

// Overwrites the one in rpg_managers.js
// Uncomment this for easier debugging (can be done from title screen > load game)
//SceneManager.snapForBackground = function () {
//	this._backgroundBitmap = this.snap();
//	this._backgroundBitmap.blur();
//};

SceneManager.snapForBattleBackground = function () {
	this._backgroundBitmap = this.snap();
	this._backgroundBitmap.radialBlur(15, 2);
};

// Overwrites the one in rpg_scenes.js
Scene_Map.prototype.snapForBattleBackground = function () {
	// TODO: Wait a bit for background to fade in (in case we just left a battle)
	this._waitCount = 2;
	this._windowLayer.visible = false;
	SceneManager.snapForBattleBackground();
	this._windowLayer.visible = true;
};

// Replaces the one in rpg_sprites.js
Spriteset_Battle.prototype.createBackground = function () {
	this._backgroundSprite = new Sprite();
	this._backgroundSprite.bitmap = SceneManager.backgroundBitmap();
	this._baseSprite.addChild(this._backgroundSprite);
};

Soapr.FilterBattleback.Spriteset_Battle_update = Spriteset_Battle.prototype.update;
Spriteset_Battle.prototype.update = function () {
	Soapr.FilterBattleback.WaveFrame += 1;
	if (Soapr.FilterBattleback.WaveFrame > 59) Soapr.FilterBattleback.WaveFrame = 0;

	this._backgroundSprite.bitmap.clear();
	var context = this._backgroundSprite.bitmap._canvas.getContext('2d');
	context.save();

	// Draw BG
	context.drawImage(Soapr.FilterBattleback.BlurredImage, 0, 0);
	Soapr.FilterBattleback.UpdateWaviness(this._backgroundSprite.bitmap._canvas);

	// Draw floor
	var w = this._backgroundSprite.bitmap._canvas.width;
	var h = this._backgroundSprite.bitmap._canvas.height;
	context.globalAlpha = 0.25;
	context.fillStyle = 'black';
	//context.fillRect(0, 0, w, h);
	context.beginPath();
	context.ellipse(w / 2, 360, w * 0.45, 50, 0, 0, 2 * Math.PI);
	context.fill();
	context.restore();

	Soapr.FilterBattleback.Spriteset_Battle_update.call(this);
};
