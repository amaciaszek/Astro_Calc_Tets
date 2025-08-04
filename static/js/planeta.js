   var t2000 = 2451545.0;
   var a1000 = 365250.0;


// Coordenades equatorials
function getCoordinates(dj, astre) {

     // Coord Heliocentriques Terra
     var terra_ = Terra();
     var R0 = getDistanciaSol(dj, terra_);
     var lbTerra = getLB(dj, terra_);
     var L0 = lbTerra.lEcl;
     var B0 = lbTerra.bEcl;
 
     // Coord Heliocentriques Astre
     var tau=0;
     var tau0 = 9999;
     var x;
     var y;
     var z;
     var xHelio;
     var yHelio;
     var zHelio;
     var D;  // Distancia Planeta - Terra
      
	 var L = 0; // coordenades heliocentriques
     var B = 0;
	  
     while (Math.abs(tau-tau0)>0.00000001) {
	
       var R = getDistanciaSol(dj-tau, astre);
       var lbAstre = getLB(dj-tau, astre);
       L = lbAstre.lEcl;
       B = lbAstre.bEcl;

       xHelio = R*Math.cos(B)*Math.cos(L);
       yHelio = R*Math.cos(B)*Math.sin(L);
       zHelio = R*Math.sin(B);

       x = xHelio - R0*Math.cos(B0)*Math.cos(L0);
       y = yHelio - R0*Math.cos(B0)*Math.sin(L0);
       z = zHelio - R0*Math.sin(B0);

       D = Math.sqrt(x*x + y*y + z*z);
       tau0 = tau;
       tau = 0.0057755183*D;
     }

     // Correcio d'aberracio i temps-llum
     R0 = getDistanciaSol(dj-tau, terra_);
     lbTerra = getLB(dj-tau, terra_);
     L0 = lbTerra.lEcl;
     B0 = lbTerra.bEcl;
     x = R*Math.cos(B)*Math.cos(L) - R0*Math.cos(B0)*Math.cos(L0);
     y = R*Math.cos(B)*Math.sin(L) - R0*Math.cos(B0)*Math.sin(L0);
     z = R*Math.sin(B) - R0*Math.sin(B0);

    // Fase
    var r =  Math.sqrt(xHelio*xHelio + yHelio*yHelio + zHelio*zHelio);
    var fase = ((r+D)*(r+D)-R0*R0)/(4.*r*D);

    var ll = Math.atan2(y,x);  // Coordenades geocentriques
    var bb = Math.atan(z/Math.sqrt(x*x + y*y));

    // Passem a FK5
    var ARCSEC2RAD = Math.PI / (180.0 * 60.0 * 60.0);
    var t = (dj - t2000)/a1000;
    var TT = 10.*t;

    var Lp = ll -Math.radians(1.397*TT + 0.00031*TT*TT);
	
    var dL = -0.09033 + 0.03916*(Math.cos(Lp) + Math.sin(Lp))*Math.tan(bb);

    dL = dL*ARCSEC2RAD;
					
    var dB = 0.03916*(Math.cos(Lp) - Math.sin(Lp));
    dB = dB*ARCSEC2RAD;
		 																		
    ll = ll+dL;
    bb = bb+dB;

    var nut = nutacio(dj);

    var e = obliquitatEcliptica(dj)+nut.dOblq;
    ll = ll + nut.dPhi;

    var alfa = Math.atan2( Math.sin(ll)*Math.cos(e) - Math.tan(bb)*Math.sin(e), Math.cos(ll));
    if (alfa<0) alfa = alfa + 2*Math.PI;
    var delta = Math.asin(Math.sin(bb)*Math.cos(e) + Math.cos(bb)*Math.sin(e)*Math.sin(ll));

    var mag = getMagnitude(dj, r, D, R0, L, B, ll, bb, astre);

    return {alfa: alfa, delta: delta, dist: D, fase: fase, mag: mag};

}

function getCoordinatesLluna(dj, lluna) {
   var T = (dj - 2451545.0)/36525.0;
   var Lp = Math.radians(218.3164477 + 481267.88123421*T - 0.0015786*T*T + T*T*T/538841.0 - T*T*T*T/65194000.0);
   var D = Math.radians(297.8501921 + 445267.1114034*T - 0.0018819*T*T + T*T*T/545868.0 - T*T*T*T/113065000.0);
   var M = Math.radians(357.5291092 + 35999.0502909*T - 0.0001536*T*T + T*T*T/24490000.0);
   var Mp = Math.radians(134.9633964 + 477198.8675055*T + 0.0087414*T*T + T*T*T/69699.0 - T*T*T*T/14712000.0);
   var F = Math.radians(93.2720950 + 483202.0175233*T - 0.0036539*T*T - T*T*T/3526000.0 + T*T*T*T/863310000.0);
   var A1 = Math.radians(119.75 + 131.849*T);
   var A2 = Math.radians(53.09 + 479264.290*T);
   var A3 = Math.radians(313.45 + 481266.484*T);
   var E = 1.0 - 0.002516*T - 0.0000074*T*T;
		
   var sigmaL = 0;
   var sigmaR = 0;
   var sigmaB = 0;
   var argument1 = 0;
   var argument2 = 0;
		
		for (i=0; i<60; i++) {
			argument1 = D*lluna.D_COEF1[i] + M*lluna.M_COEF1[i] + Mp*lluna.MP_COEF1[i] + F*lluna.F_COEF1[i];
			argument2 = D*lluna.D_COEF2[i] + M*lluna.M_COEF2[i] + Mp*lluna.MP_COEF2[i] + F*lluna.F_COEF2[i];
			sigmaL = sigmaL + lluna.S_L_COEF[i]*Math.pow(E,Math.abs(lluna.M_COEF1[i]))*Math.sin(argument1);
			sigmaR = sigmaR + lluna.S_R_COEF[i]*Math.pow(E,Math.abs(lluna.M_COEF1[i]))*Math.cos(argument1);
			sigmaB = sigmaB + lluna.S_B_COEF[i]*Math.pow(E,Math.abs(lluna.M_COEF2[i]))*Math.sin(argument2);
		}
		
		sigmaL = sigmaL + 3958.0*Math.sin(A1) + 1962.0*Math.sin(Lp - F) + 318.0*Math.sin(A2);
		sigmaL = sigmaL*0.000001;
		
		sigmaB = sigmaB -2235.0*Math.sin(Lp) + 382.0*Math.sin(A3) + 175.0*Math.sin(A1 - F)
		       + 175.0*Math.sin(A1 + F) + 127.0*Math.sin(Lp - Mp) - 115.0*Math.sin(Lp + Mp);
		sigmaB = sigmaB*0.000001;
		

		var bb = Math.radians(sigmaB);
		var nut = nutacio(dj);
		var ll = Lp + Math.radians(sigmaL) ;
		ll = ll % (2.0*Math.PI); 
		
    var nut = nutacio(dj);

    var e = obliquitatEcliptica(dj)+nut.dOblq;
    ll = ll + nut.dPhi;

    var alfa = Math.atan2( Math.sin(ll)*Math.cos(e) - Math.tan(bb)*Math.sin(e), Math.cos(ll));
    if (alfa<0) alfa = alfa + 2*Math.PI;
    var delta = Math.asin(Math.sin(bb)*Math.cos(e) + Math.cos(bb)*Math.sin(e)*Math.sin(ll));

    var dist = 385000.56 + sigmaR/1000.0;
    var parHor = Math.asin(6378.17/dist);

    var coordSol = solCoord(dj);

    var cosPhi = Math.sin(delta)*Math.sin(coordSol.delta) + Math.cos(delta)*Math.cos(coordSol.delta)*Math.cos(alfa-coordSol.alfa);
    var phi = Math.acos(cosPhi);

    var i = Math.atan2(coordSol.dist*Math.sin(phi),dist/AU - coordSol.dist*Math.cos(phi)); 

    i = Math.abs(i);

    var fase = (1 + Math.cos(i))/2.;

    return {alfa: alfa, delta: delta, dist: dist, fase: fase, mag: 0, parHor: parHor, phaseAngle: i};
//		var beta = Math.radians(sigmaB);
		
		
}

function getMagnitude(dj, r, D, R0, l, b, lambda, beta, astre) {

var a0 = 0.0;
var a1 = 0.0;
var a2 = 0.0;
var a3 = 0.0;
var corr = 0.0;

switch (astre.id) {

// MERCURY
case 1:

a0 = -0.36;
a1 =  0.038;
a2 = -0.000273;
a3 =  0.000002;

break;

// VENUS
case 2:
a0 = -4.29;
a1 =  0.0009;
a2 =  0.000239;
a3 = -0.00000065;

break;

// MARS
case 4:       
a0 = -1.52;
a1 =  0.016;

break;

//JUPITER      
case 5:

a0 = -9.40;
a1 =  0.005;

break;

// SATURN       
 case 6:

a0 = -8.88;

// Rings

var t = (dj - t2000)/a1000;
var ir = Math.radians(28.075216 - 0.012998*t + 0.000004*t*t);
var omega = Math.radians(169.508470 + 1.394681*t + 0.000412*t*t);
var N = Math.radians(113.6655 + 0.8771*t);

var U1 = Math.atan2(Math.sin(ir)*Math.sin(b)+Math.cos(ir)*Math.cos(b)*Math.sin(l-omega) , Math.cos(b)*Math.cos(l-omega));
var U2 = Math.atan2(Math.sin(ir)*Math.sin(beta)+Math.cos(ir)*Math.cos(beta)*Math.sin(lambda-omega), Math.cos(beta)*Math.cos(lambda-omega));

var dU = Math.degrees(Math.abs(U1-U2));

var Baux = Math.asin(Math.sin(ir)*Math.cos(beta)*Math.sin(lambda-omega)-Math.cos(ir)*Math.sin(beta));
var sinB = Math.sin(Math.abs(Baux));
corr = 0.044*dU - 2.60*sinB+1.25*sinB*sinB;

break;

// URANUS       
case 7:

a0 = -7.19;

break;

// NEPTUNE      
case 8:
a0 = -6.87;

break;

default:
break;
}

var cosi = (r*r + D*D - R0*R0)/(2.0*r*D);
var i = Math.degrees(Math.acos(cosi));

var mag = a0 + 5.0*Math.log10(r*D) + a1*i + a2*i*i + a3*i*i*i + corr;

return mag;
}

// Distancia Sol-planeta
function getDistanciaSol(dj, astre) {
  var t = (dj - 2451545.0)/365250.0;

 var R0=0.0;
 for ( i=0; i<astre.R0A.length; i++) {
     R0 = R0 + astre.R0A[i]*Math.cos(1.*astre.R0B[i] + t*astre.R0C[i]);
 }

 var R1=0.0;
 for ( i=0; i<astre.R1A.length; i++) {
     R1 = R1 + astre.R1A[i]*Math.cos(1.*astre.R1B[i] + t*astre.R1C[i]);
 }

 var R2=0.0;
 for ( i=0; i<astre.R2A.length; i++) {
     R2 = R2 + astre.R2A[i]*Math.cos(1.*astre.R2B[i] + t*astre.R2C[i]);
 }

 var R3=0.0;
 for ( i=0; i<astre.R3A.length; i++) {
     R3 = R3 + astre.R3A[i]*Math.cos(1.*astre.R3B[i] + t*astre.R3C[i]);
 }

 var R4=0.0;
 for ( i=0; i<astre.R4A.length; i++) {
     R4 = R4 + astre.R4A[i]*Math.cos(1.*astre.R4B[i] + t*astre.R4C[i]);
 }

 var R5=0.0;
 for ( i=0; i<astre.R5A.length; i++) {
     R5 = R5 + astre.R5A[i]*Math.cos(1.*astre.R5B[i] + t*astre.R5C[i]);
 }

 var R = R0 + t*(R1 + t*(R2 + t*(R3 + t*(R4 +R5*t))));
 
 return R;

}

// Coordenades ecliptiques heliocentriques al equinocci i ecliptica definits

function getLB(dj, astre) {

   var t = (dj - t2000)/a1000;

   var L0=0.0;
   for (i=0; i<astre.L0A.length; i++) {
       L0 = L0 + astre.L0A[i]*Math.cos(1.*astre.L0B[i] + t*astre.L0C[i]);
   }

   var L1=0.0;
   for (i=0; i<astre.L1A.length; i++) {
       L1 = L1 + astre.L1A[i]*Math.cos(1.*astre.L1B[i] + t*astre.L1C[i]);
   }

   var L2=0.0;
   for (i=0; i<astre.L2A.length; i++) {
       L2 = L2 + astre.L2A[i]*Math.cos(1.*astre.L2B[i] + t*astre.L2C[i]);
   }

  var L3=0.0;
  for (i=0; i<astre.L3A.length; i++) {
      L3 = L3 + astre.L3A[i]*Math.cos(1.*astre.L3B[i] + t*astre.L3C[i]);
  }

  var L4=0.0;
  for (i=0; i<astre.L4A.length; i++) {
      L4 = L4 + astre.L4A[i]*Math.cos(1.*astre.L4B[i] + t*astre.L4C[i]);		
  }

  var L5=0.0;
  for (i=0; i<astre.L5A.length; i++) {
      L5 = L5 + astre.L5A[i]*Math.cos(1.*astre.L5B[i] + t*astre.L5C[i]);
  }

  var L = L0 + t*(L1 + t*(L2 + t*(L3 + t*(L4 + L5*t))));

  var B0=0.0;
  for (i=0; i<astre.B0A.length; i++) {
      B0 = B0 + astre.B0A[i]*Math.cos(1.*astre.B0B[i] + t*astre.B0C[i]);
  }

  var B1=0.0;
  for (i=0; i<astre.B1A.length; i++) {
       B1 = B1 + astre.B1A[i]*Math.cos(1.*astre.B1B[i] + t*astre.B1C[i]);
  }

  var B2=0.0;
  for (i=0; i<astre.B2A.length; i++) {
      B2 = B2 + astre.B2A[i]*Math.cos(1.*astre.B2B[i] + t*astre.B2C[i]);
  }

  var B3=0.0;
  for (i=0; i<astre.B3A.length; i++) {
      B3 = B3 + astre.B3A[i]*Math.cos(1.*astre.B3B[i] + t*astre.B3C[i]);
  }

  var B4=0.0;
  for (i=0; i<astre.B4A.length; i++) {
      B4 = B4 + astre.B4A[i]*Math.cos(1.*astre.B4B[i] + t*astre.B4C[i]);
  }

  var B5=0.0;
  for (i=0; i<astre.B5A.length; i++) {
      B5 = B5 + astre.B5A[i]*Math.cos(1.*astre.B5B[i] + t*astre.B5C[i]);
  }

  var B = B0 + t*(B1 + t*(B2 + t*(B3 + t*(1.*B4 + B5*t))));

																							
	L = L % (2.0*Math.PI);
	if (L<0) L = L + 2.0*Math.PI;
	
	//AstroCoordinate lb = new AstroCoordinate(L, B);
	//Vector3d astroVec = lb.toVector3d();
	//astroVec = AstroUtils.transformEquinocci(astroVec, dj, EQUINOX.MEAN_DATE, this.equinocci);
	//astroVec.scale(this.getDistanceSol(dj));
																											
       return {lEcl: L, bEcl: B};

}
