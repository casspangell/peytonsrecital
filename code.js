import processing.sound.*;

int cols, rows;
int scl = 30;
int w = 800;
int h = 800;

float flying = 0;
float[][] terrain;

boolean isRunning = false;

FFT fft;
AudioIn in;
int bands = 512;
float[] spectrum = new float[bands];

color[][] colorSets = {
  {color(128, 0, 128), color(0, 0, 255), color(0, 255, 255), color(0, 255, 0), color(255, 165, 0)},
  {color(255, 165, 0), color(255, 255, 0), color(255, 105, 180), color(255, 0, 0), color(255)},
  {color(0, 0, 255), color(0, 255, 0), color(255, 255, 0), color(255, 0, 0), color(128, 0, 128)},
  {color(255, 0, 0), color(255, 105, 180), color(255, 255, 0), color(0, 255, 255), color(0, 0, 255)}
};
int currentColorSetIndex = 0;
int previousColorSetIndex = -1;
long fadeStartTime = -1;
float fadeDuration = 2000; // 2 seconds

void setup() {
  fullScreen(P3D);
  cols = w / scl;
  rows = h / scl;
  terrain = new float[rows][cols];

  fft = new FFT(this, bands);
  in = new AudioIn(this, 0);
  in.start();
  fft.input(in);
}

void keyPressed() {
  if (key == ' ') {
    isRunning = true;
    previousColorSetIndex = currentColorSetIndex;
    currentColorSetIndex = (currentColorSetIndex + 1) % colorSets.length;
    fadeStartTime = millis();
  }
}

void draw() {
  if (!isRunning) {
    background(0);
    return;
  }

  float fadeFactor = 0;
  if (fadeStartTime > -1) {
    fadeFactor = constrain((float)(millis() - fadeStartTime) / fadeDuration, 0, 1);
    if (fadeFactor == 1) {
      // Fade completed
      previousColorSetIndex = -1; // No longer need to blend from previous
    }
  }

  fft.analyze(spectrum);
  flying -= 0.05;

  float sensitivity = 10;
  float yoff = flying;
  for (int y = 0; y < rows; y++) {
    float xoff = 0;
    for (int x = 0; x < cols; x++) {
      terrain[x][y] = map(noise(xoff, yoff), 0, 1, -1000, spectrum[y % bands] * height * sensitivity);
      xoff += 0.1;
    }
    yoff += 0.1;
  }

  background(0);
  noFill();

  translate(width / 2, height / 2 - 300);
  rotateX(PI / 8);
  translate(-w / 2, -h / 4);

  for (int y = 0; y < rows - 1; y++) {
    beginShape(TRIANGLE_STRIP);
    for (int x = 0; x < cols; x++) {
      float amplitude = map(terrain[x][y], -1000, height * sensitivity, 0, 1);
      color currentColor = getColorForAmplitude(amplitude, colorSets[currentColorSetIndex]);
      color previousColor = previousColorSetIndex > -1 ? getColorForAmplitude(amplitude, colorSets[previousColorSetIndex]) : currentColor;
      color blendedColor = lerpColor(previousColor, currentColor, fadeFactor);
      fill(blendedColor);
      stroke(blendedColor);
      vertex(x * scl, y * scl, terrain[x][y]);
      vertex(x * scl, (y + 1) * scl, terrain[x][y + 1]);
    }
    endShape();
  }
}

color getColorForAmplitude(float amplitude, color[] colorSet) {
  if (amplitude < 0.2) {
    return lerpColor(colorSet[0], colorSet[1], amplitude / 0.2);
  } else if (amplitude < 0.4) {
    return lerpColor(colorSet[1], colorSet[2], (amplitude - 0.2) / 0.2);
  } else if (amplitude < 0.6) {
    return lerpColor(colorSet[2], colorSet[3], (amplitude - 0.4) / 0.2);
  } else if (amplitude < 0.8) {
    return lerpColor(colorSet[3], colorSet[4], (amplitude - 0.6) / 0.2);
  } else {
    return lerpColor(colorSet[4], color(255), (amplitude - 0.8) / 0.2); // Transition to white at highest amplitude
  }
}
