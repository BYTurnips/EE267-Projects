#include "OrientationMath.h"

/** TODO: see documentation in header file */
double computeAccPitch(double acc[3]) {
  return atan2(-acc[2], acc[1]) * 180. / M_PI;
}

/** TODO: see documentation in header file */
double computeAccRoll(double acc[3]) {
  return atan2(acc[0], acc[1]) * 180. / M_PI;
}

/** TODO: see documentation in header file */
double computeFlatlandRollGyr(double flatlandRollGyrPrev, double gyr[3], double deltaT) {
  return flatlandRollGyrPrev + deltaT * gyr[2];
}

/** TODO: see documentation in header file */
double computeFlatlandRollAcc(double acc[3]) {
  return atan2(acc[0], acc[1]) * 180. / M_PI;
}

/** TODO: see documentation in header file */
double computeFlatlandRollComp(double flatlandRollCompPrev, double gyr[3], double flatlandRollAcc, double deltaT, double alpha) {
  double gyrovalue = computeFlatlandRollGyr(flatlandRollCompPrev, gyr, deltaT);
  double accvalue = flatlandRollAcc;
  return (alpha) * gyrovalue + (1. - alpha) * accvalue;
}


/** TODO: see documentation in header file */
void updateQuaternionGyr(Quaternion& q, double gyr[3], double deltaT) {
  // q is the previous quaternion estimate
  // update it to be the new quaternion estimate
  double threshold = 0.00000001;
  if (abs(gyr[0]) < threshold || abs(gyr[1]) < threshold || abs(gyr[2]) < threshold) return;
  double gl = pow(pow(gyr[0], 2) + pow(gyr[1], 2) + pow(gyr[2], 2), 0.5);
  q = q.multiply(q, Quaternion().setFromAngleAxis(deltaT * gl, gyr[0] / gl, gyr[1] / gl, gyr[2] / gl));
  q.normalize();
}


/** TODO: see documentation in header file */
void updateQuaternionComp(Quaternion& q, double gyr[3], double acc[3], double deltaT, double alpha) {
  // q is the previous quaternion estimate
  // update it to be the new quaternion estimate

  // Calculate gyro contribution
  Quaternion gyroq = q.clone();
  updateQuaternionGyr(gyroq, gyr, deltaT);

  Quaternion qaBody = Quaternion(0, acc[0], acc[1], acc[2]);

  Quaternion qaWorld = qaBody.rotate(gyroq);

  // Normalize accelerator coordinates, then calculate sensor norm vector,
  // then calculate vector to rotate sensor norm to world norm (using a cross product)
  
  // double al = pow(pow(acc[0], 2) + pow(acc[1], 2) + pow(acc[2], 2), 0.5);
  // double svec[3] = {acc[0] / al, acc[1] / al, acc[2] / al};
  double al = qaWorld.length();
  double svec[3] = {qaWorld.q[1] / al, qaWorld.q[2] / al, qaWorld.q[3] / al};
  double nvec[3] = {-svec[2], 0, svec[0]};

  double angQmag = (1. - alpha) * acos(svec[1]); 
  double nvlen = pow(pow(nvec[0], 2) + pow(nvec[1], 2) + pow(nvec[2], 2), 0.5);

  // Calculate accel tilt correction
  Quaternion accq = Quaternion().setFromAngleAxis(angQmag, nvec[0] / nvlen, nvec[1] / nvlen, nvec[2] / nvlen);

  // Multiply above two terms
  q = q.multiply(accq, gyroq).normalize();
}
