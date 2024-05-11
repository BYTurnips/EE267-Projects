#include "OrientationTracker.h"

OrientationTracker::OrientationTracker( double imuFilterAlphaIn, 
                                        bool simulateImuIn) : imu(),
    gyr{0, 0, 0},
    acc{0, 0, 0},
    gyrBias{0, 0, 0},
    gyrVariance{0, 0, 0},
    accBias{0, 0, 0},
    accVariance{0, 0, 0},
    previousTimeImu(0),
    imuFilterAlpha(imuFilterAlphaIn),
    deltaT(0.0),
    simulateImu(simulateImuIn),
    simulateImuCounter(0),
    flatlandRollGyr(0),
    flatlandRollAcc(0),
    flatlandRollComp(0),
    quaternionGyr{1, 0, 0, 0},
    eulerAcc{0, 0, 0},
    quaternionComp{1, 0, 0, 0}
{
}

void OrientationTracker::initImu() {
    imu.init();
}

/**
 * TODO: see documentation in header file
 */
void OrientationTracker::measureImuBiasVariance() {

    // check if imu.read() returns true
    // then read imu.gyrX, imu.accX, ...

    // compute bias, variance.
    // update:
    // gyrBias[0], gyrBias[1], gyrBias[2]
    // gyrVariance[0], gyrBias[1], gyrBias[2]
    // accBias[0], accBias[1], accBias[2]
    // accVariance[0], accBias[1], accBias[2]
    //, compute the mean of 1000 consecutive 𝑥, 𝑦, 𝑧 gyroscope and accelerometer measurements
    double gyrX_sum = 0, gyrY_sum = 0, gyrZ_sum = 0;
    double gyrX_sumsq = 0, gyrY_sumsq = 0, gyrZ_sumsq = 0;
    double accX_sum = 0, accY_sum = 0, accZ_sum = 0;
    double accX_sumsq = 0, accY_sumsq = 0, accZ_sumsq = 0;
    for (int i = 0; i < 1000; i++) {
        if (!imu.read())  {
          i--;
          continue;
        }
        gyrX_sum += imu.gyrX;
        gyrY_sum += imu.gyrY;
        gyrZ_sum += imu.gyrZ;
        accX_sum += imu.accX;
        accY_sum += imu.accY;
        accZ_sum += imu.accZ;

        gyrX_sumsq += pow(imu.gyrX, 2);
        gyrY_sumsq += pow(imu.gyrY, 2);
        gyrZ_sumsq += pow(imu.gyrZ, 2);
        accX_sumsq += pow(imu.accX, 2);
        accY_sumsq += pow(imu.accY, 2);
        accZ_sumsq += pow(imu.accZ, 2);
    }
    gyrBias[0] = gyrX_sum / 1000.;
    gyrBias[1] = gyrY_sum / 1000.;
    gyrBias[2] = gyrZ_sum / 1000.;

    accBias[0] = accX_sum / 1000.;
    accBias[1] = accY_sum / 1000.;
    accBias[2] = accZ_sum / 1000.;

    gyrVariance[0] =  gyrX_sumsq / 1000. - pow(gyrBias[0], 2);
    gyrVariance[1] = gyrY_sumsq / 1000. - pow(gyrBias[1], 2);
    gyrVariance[2] = gyrZ_sumsq / 1000. - pow(gyrBias[2], 2);

    accVariance[0] = accX_sumsq / 1000. - pow(accBias[0], 2);
    accVariance[1] = accY_sumsq / 1000. - pow(accBias[1], 2);
    accVariance[2] = accZ_sumsq / 1000. - pow(accBias[2], 2);
}

void OrientationTracker::setImuBias(double bias[3]) {
    for (int i = 0; i < 3; i++) gyrBias[i] = bias[i];
}

void OrientationTracker::resetOrientation() {
    flatlandRollGyr = 0;
    flatlandRollAcc = 0;
    flatlandRollComp = 0;
    quaternionGyr = Quaternion();
    eulerAcc[0] = 0;
    eulerAcc[1] = 0;
    eulerAcc[2] = 0;
    quaternionComp = Quaternion();
}

bool OrientationTracker::processImu() {

    if (simulateImu) {
        // get imu values from simulation
        updateImuVariablesFromSimulation();
    }
    else {

        // get imu values from actual sensor
        if (!updateImuVariables()) {

            // imu data not available
            return false;
        }
    }

    // run orientation tracking algorithms
    updateOrientation();

    return true;
}

void OrientationTracker::updateImuVariablesFromSimulation() {

    deltaT = 0.002;
    // get simulated imu values from external file
    for (int i = 0; i < 3; i++) {
        gyr[i] = imuData[simulateImuCounter + i];
    }
    simulateImuCounter += 3;
    for (int i = 0; i < 3; i++) {
        acc[i] = imuData[simulateImuCounter + i];
    }
    simulateImuCounter += 3;
    simulateImuCounter = simulateImuCounter % nImuSamples;

    // simulate delay
    delay(1);
}

/**
 * TODO: see documentation in header file
 */
bool OrientationTracker::updateImuVariables() {

    // sample imu values
    if (!imu.read()) {
        // return false if there's no data
        return false;
    }

    // call micros() to get current time in microseconds
    // update:
    // previousTimeImu (in seconds)
    // deltaT (in seconds)

    // read imu.gyrX, imu.accX ...
    // update:
    // gyr[0], ...
    // acc[0], ...

    // You also need to appropriately modify the
    // update of gyr as instructed in (2.1.3).
    deltaT = float(micros()) / 1000000. - previousTimeImu;
    previousTimeImu += deltaT;
    
    gyr[0] = imu.gyrX - gyrBias[0];
    gyr[1] = imu.gyrY - gyrBias[1];
    gyr[2] = imu.gyrZ - gyrBias[2];

    acc[0] = imu.accX;
    acc[1] = imu.accY;
    acc[2] = imu.accZ;
    
    return true;
}

/**
 * TODO: see documentation in header file
 */
void OrientationTracker::updateOrientation() {

    // call functions in OrientationMath.cpp.
    // use only class variables as arguments to functions.

    // update:
    // flatlandRollGyr
    // flatlandRollAcc
    // flatlandRollComp
    // quaternionGyr
    // eulerAcc
    // quaternionComp

    flatlandRollGyr = computeFlatlandRollGyr(flatlandRollGyr, gyr, deltaT);
    flatlandRollAcc = computeFlatlandRollAcc(acc);
    flatlandRollComp = computeFlatlandRollComp(flatlandRollComp, gyr, 
                        flatlandRollAcc, deltaT, imuFilterAlpha);
    
    updateQuaternionGyr(quaternionGyr, gyr, deltaT);

    eulerAcc[0] = computeAccPitch(acc);
    eulerAcc[2] = computeAccRoll(acc);

    updateQuaternionComp(quaternionComp, gyr, acc, deltaT, imuFilterAlpha);
}
