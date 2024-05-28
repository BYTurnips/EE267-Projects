#include "PoseMath.h"

/**
 * TODO: see header file for documentation
 */
void convertTicksTo2DPositions(uint32_t clockTicks[8], double pos2D[8])
{
  //use variable CLOCKS_PER_SECOND defined in PoseMath.h
  //for number of clock ticks a second

  for (int i = 0; i < 8; i += 2) {
    double deltaTh = double(clockTicks[i]) / CLOCKS_PER_SECOND;
    double angleh = - deltaTh * 60. * 360. + 90.;
    pos2D[i] = tan(angleh * M_PI / 180.);

    double deltaTv = double(clockTicks[i + 1]) / CLOCKS_PER_SECOND;
    double anglev = deltaTv * 60. * 360. - 90.;
    pos2D[i + 1] = tan(anglev * M_PI / 180.);
  }
}

/**
 * TODO: see header file for documentation
 */
void formA(double pos2D[8], double posRef[8], double Aout[8][8]) {
  for (int i = 0; i < 8; i += 2) {
    // First row for x^n
    Aout[i][0] = posRef[i]; // x1, 0, x2, 0, ...
    Aout[i][1] = posRef[i + 1]; // y1, 0, y2, 0, ... 
    Aout[i][2] = 1.; // 1, 0, 1, 0, ...
    Aout[i][3] = 0.; // 0, x1, 0, x2, ...
    Aout[i][4] = 0.; // 0, y1, 0, y2, ...
    Aout[i][5] = 0.; // 0, 1, 0, 1, ...
    Aout[i][6] = -posRef[i] * pos2D[i]; //-x1x1n, -x1y1n, -x2x2n, ...
    Aout[i][7] = -posRef[i + 1] * pos2D[i]; //-y1x1n, -y1y1n, -y2x2n, ...
    
    // Second row for y^n
    Aout[i + 1][0] = 0.; // x1, 0, x2, 0, ...
    Aout[i + 1][1] = 0.; // y1, 0, y2, 0, ... 
    Aout[i + 1][2] = 0.; // 1, 0, 1, 0, ...
    Aout[i + 1][3] = posRef[i]; // 0, x1, 0, x2, ...
    Aout[i + 1][4] = posRef[i + 1]; // 0, y1, 0, y2, ...
    Aout[i + 1][5] = 1.; // 0, 1, 0, 1, ...
    Aout[i + 1][6] = -posRef[i] * pos2D[i + 1]; //-x1x1n, -x1y1n, -x2x2n, ...
    Aout[i + 1][7] = -posRef[i + 1] * pos2D[i + 1]; //-y1x1n, -y1y1n, -y2x2n, ...
  }
}


/**
 * TODO: see header file for documentation
 */
bool solveForH(double A[8][8], double b[8], double hOut[8]) {
  //use Matrix Math library for matrix operations
  //example:
  //int inv = Matrix.Invert((double*)A, 8);
  //if inverse fails (Invert returns 0), return false

  if (Matrix.Invert((double*) A, 8) == 0) return false;
  Matrix.Multiply((double*) A, b, 8, 8, 1, hOut);
  return true;
}


/**
 * TODO: see header file for documentation
 */
void getRtFromH(double h[8], double ROut[3][3], double pos3DOut[3]) {
  double normC1 = pow(pow(h[0], 2) + pow(h[3], 2) + pow(h[6], 2), 0.5);

  // --- Translation ---
  double normC2 = pow(pow(h[1], 2) + pow(h[4], 2) + pow(h[7], 2), 0.5);
  double s = 2. / (normC1 + normC2);
  pos3DOut[0] = s * h[2];
  pos3DOut[1] = s * h[5];
  pos3DOut[2] = -s;

  // --- Rotation ---
  // r1 = h1 / ||h1|| r1
  ROut[0][0] = h[0] / normC1;
  ROut[1][0] = h[3] / normC1; 
  ROut[2][0] = - h[6] / normC1;

  // ur2 = un-normalized r2 = h2 - (r1 \cdot r2) r1 % dot product
  double uR2[3];
  double R1dotR2 = ROut[0][0] * h[1] + ROut[1][0] * h[4] - ROut[2][0] * h[7];
  uR2[0] = h[1] - ROut[0][0] * R1dotR2;
  uR2[1] = h[4] - ROut[1][0] * R1dotR2;
  uR2[2] = - h[7] - ROut[2][0] * R1dotR2;
  
  // r2 = normalize (ur2)
  double normUR2 = pow(pow(uR2[0], 2) + pow(uR2[1], 2) + pow(uR2[2], 2), 0.5);
  ROut[0][1] = uR2[0] / normUR2;
  ROut[1][1] = uR2[1] / normUR2;
  ROut[2][1] = uR2[2] / normUR2;

  // r3 = r1 \times r2  % cross product
  ROut[0][2] = ROut[1][0] * ROut[2][1] - ROut[2][0] * ROut[1][1];
  ROut[1][2] = ROut[2][0] * ROut[0][1] - ROut[0][0] * ROut[2][1];
  ROut[2][2] = ROut[0][0] * ROut[1][1] - ROut[1][0] * ROut[0][1];
}



/**
 * TODO: see header file for documentation
 */
Quaternion getQuaternionFromRotationMatrix(double R[3][3]) {
  double w = 0.5 * pow(1 + R[0][0] + R[1][1] + R[2][2], 0.5);
  double x = (R[2][1] - R[1][2]) / (4. * w);
  double y = (R[0][2] - R[2][0]) / (4. * w);
  double z = (R[1][0] - R[0][1]) / (4. * w);
  return Quaternion(w, x, y, z);
}
