#include "PoseMath.h"

/**
 * TODO: see header file for documentation
 */
void convertTicksTo2DPositions(uint32_t clockTicks[8], double pos2D[8])
{
  //use variable CLOCKS_PER_SECOND defined in PoseMath.h
  //for number of clock ticks a second

  double deltaTs[8];
  double angles[8];
  for (int i = 0; i < 8; i++) {
    int sign = i % 2;
    double deltaT = clockTicks[i] / CLOCKS_PER_SECOND;
    double offset = 360. / 4. * sign;
    double angle = deltaT * 60. * 360. + offset;
    pos2D[i] = tan(angle * 180. / M_PI);
  }

}

/**
 * TODO: see header file for documentation
 */
void formA(double pos2D[8], double posRef[8], double Aout[8][8]) {

  for (int i = 0; i < 8; i++) {
    if ((i % 2) == 0) {
      Aout[i][0] = posRef[i]; // x1, 0, x2, 0, ...
      Aout[i][1] = posRef[i + 1]; // y1, 0, y2, 0, ... 
      Aout[i][2] = 1.; // 1, 0, 1, 0, ...
      Aout[i][3] = 0.; // 0, x1, 0, x2, ...
      Aout[i][4] = 0.; // 0, y1, 0, y2, ...
      Aout[i][5] = 0.; // 0, 1, 0, 1, ...
      Aout[i][6] = -posRef[i] * pos2d[i]; //-x1x1n, -x1y1n, -x2x2n, -x2y2n, ...
      Aout[i][7] = -posRef[i + 1] * pos2d[i]; //-y1x1n, -y1y1n, -y2x2n, -y2y2n, ...
    }
    else {
      Aout[i][0] = 0.; // x1, 0, x2, 0, ...
      Aout[i][1] = 0.; // y1, 0, y2, 0, ... 
      Aout[i][2] = 0.; // 1, 0, 1, 0, ...
      Aout[i][3] = posRef[i - 1]; // 0, x1, 0, x2, ...
      Aout[i][4] = posRef[i]; // 0, y1, 0, y2, ...
      Aout[i][5] = 1.; // 0, 1, 0, 1, ...
      Aout[i][6] = -posRef[i - 1] * pos2d[i]; //-x1x1n, -x1y1n, -x2x2n, -x2y2n, ...
      Aout[i][7] = -posRef[i] * pos2d[i]; //-y1x1n, -y1y1n, -y2x2n, -y2y2n, ...
    }
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

  int inv = Matrix.Invert(A, 8);
  if (inv == 0) return false;
  Matrix.Multiply(A, b, hOut, 8, 8, 8, 1);
  return true;

}


/**
 * TODO: see header file for documentation
 */
void getRtFromH(double h[8], double ROut[3][3], double pos3DOut[3]) {
  // --- Rotation --- : Gram-Schmidt
  // r1 = h1 / ||h1||
  double l1 = pow(pow(h[0], 2) + pow(h[3], 2) + pow(h[6], 2), 0.5);
  ROut[0][0] = h[0] / l1;
  ROut[1][0] = h[3] / l1; 
  ROut[2][0] = -h[6] / l1;

  // r2  = h2 - (r1  r2)r1 and then normalize
  double dot = ROut[0][0] * h[1] + ROut[1][0] * h[4] - ROut[2][0] * h[7];
  ROut[0][1] = h[1] - ROut[0][0] * dot;
  ROut[1][1] = h[4] - ROut[1][0] * dot;
  ROut[2][1] = h[7] - ROut[2][0] * dot;
  
  // normalize r2
  double l2 = pow(pow(ROut[0][1], 2) + pow(ROut[1][1], 2) + pow(ROut[2][1], 2), 0.5);
  ROut[0][1] /= l2;
  ROut[1][1] /= l2;
  ROut[2][1] /= l2;

  // r3 = r1 cross r2
  ROut[0][2] = ROut[1][0] * ROut[2][1] - ROut[2][0] * ROut[1][1];
  ROut[1][2] = ROut[2][0] * ROut[0][1] - ROut[0][0] * ROut[2][1];
  ROut[2][2] = ROut[0][0] * ROut[1][1] - ROut[1][0] * ROut[0][1];

  // --- Translation ---
  double l2 = pow(pow(h[1], 2) + pow(h[4], 2) + pow(h[7], 2), 0.5);
  double s = 2. / (l1 + l2);
  pos3DOut[0] = s * h[2];
  pos3DOut[1] = s * h[5];
  pos3DOut = -s;
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
