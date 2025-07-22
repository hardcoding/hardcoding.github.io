"use strict";

const config = {
  appVersion: 1,
  delay: 1000,
};

const domElements = {
  start: undefined,
  stop: undefined,
  camSelect: undefined,
  pause: undefined,
  video: undefined,
  overlay: undefined,
  screens: [],
};

const overlay = {
  overlay: (event) => {
    const canvas = event.target;
    const overlay = domElements.overlay;

    screens.copyToCanvas(canvas, overlay);
    overlay.style.visibility = "visible";

    timer.stop();
  },
};

const timer = {
  timer: undefined,

  start: () => {
    domElements.overlay.style.visibility = "hidden";
    dom.disableElement(domElements.camSelect)
    timer.timer = setInterval(screens.next, config.delay);
  },
  stop: () => {
    clearInterval(timer.timer);
    dom.enableElement(domElements.start)
    dom.disableElement(domElements.stop)
    dom.disableElement(domElements.pause)
  },
};

const screens = {
  next: () => {
    screens.switch();
    screens.capture();
  },

  switch: () => {
    for (let i = domElements.screens.length - 2; i >= 0; i--) {
      screens.copyToCanvas(domElements.screens[i], domElements.screens[i + 1]);
    }
  },

  copyToCanvas: (fromCanvasOrVideo, toCanvas) => {
    let width = fromCanvasOrVideo.width;
    let height = fromCanvasOrVideo.height;

    if (!width || !height) {
      width = fromCanvasOrVideo.videoWidth;
      height = fromCanvasOrVideo.videoHeight;
    }

    if (!width || !height) {
      console.log("height: " + height + " width: " + width);
      alert("Größe des Quell-Bildes ist NULL.");
      timer.stop();
      return;
    }

    toCanvas.width = width;
    toCanvas.height = height;

    let canvasContext = toCanvas.getContext("2d");
    canvasContext.drawImage(fromCanvasOrVideo, 0, 0, width, height);
  },

  capture: () => {
    const canvas = domElements.screens[0];
    const video = domElements.video;

    screens.copyToCanvas(video, canvas);
  },
};

const dom = {
  enableElement: (element) => {
    element.removeAttribute("disabled");
  },

  disableElement: (element) => {
    element.setAttribute("disabled", "disabled");
  },
};

const camera = {
  list: () => {
    navigator.mediaDevices.enumerateDevices().then((mediaDevices) => {
      const videoDevices = mediaDevices.filter(
        (device) => device.kind == "videoinput",
      );
      //alert(JSON.stringify(videoDevices));
      //console.log(videoDevices);
      videoDevices.forEach(
        (device) =>
          (domElements.camSelect.innerHTML += `<option value="${device.deviceId}">${device.label}</option>`),
      );
      dom.enableElement(domElements.start);
      dom.enableElement(domElements.camSelect);
    });
  },
  start: () => {
    const deviceId = domElements.camSelect.value;
    // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
    // https://developer.mozilla.org/en-US/docs/Web/API/Media_Capture_and_Streams_API/Constraints
    navigator.mediaDevices
      .getUserMedia({
        video: {
          deviceId: deviceId,
        },
        audio: false,
      })
      .then((stream) => {
        domElements.video.srcObject = stream;
        dom.disableElement(domElements.start);
        dom.enableElement(domElements.stop);
        dom.enableElement(domElements.pause)

        timer.start();
      });
  },
  stop: () => {
    const stream = domElements.video.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach((track) => track.stop());
    domElements.video.srcObject = null;

    timer.stop();

    dom.enableElement(domElements.start);
    dom.disableElement(domElements.stop);
  },
};

const init = {
  checkBrowser: () => {
    const isSecureContext = window.isSecureContext;

    const isNewJS = typeof String.prototype.replaceAll === "function"; // JS 2021
    // const isNewJS = typeof String.prototype.isWellFormed === "function"; // JS 2024

    if (!isSecureContext || !isNewJS) {
      const message =
        "Sicherer Kontext? " + isSecureContext + ". Aktuelles JS? " + isNewJS;
      alert(message);
      return false;
    }

    if (!navigator.mediaDevices.getUserMedia) {
      alert("Browser unterstützt keinen Video-Input");
      return false;
    }

    return true;
  },
  init: () => {
    // Browser-Fähigkeiten checken
    if (!init.checkBrowser()) {
      document.querySelector("html").innerHTML = "Doof gelaufen.";
    }

    // DOM-Elemente finden
    domElements.video = document.getElementById("video");
    domElements.overlay = document.getElementById("overlay");
    domElements.start = document.getElementById("start");
    domElements.stop = document.getElementById("stop");
    domElements.pause = document.getElementById("pause");
    domElements.camSelect = document.getElementById("cam-select");
    domElements.screens = document.getElementsByTagName("canvas");
    domElements.appVersion = document.getElementById("app-version").querySelector('span');

    // Version anzeigen
    domElements.appVersion.innerHTML = config.appVersion;

    // Video-Input initialisieren
    // (Rechte-Check in Browser anstoßen, Geräte-Liste geladen bekommen)
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(camera.list)
      .catch(() => alert(""
        + "Es konnte nicht auf die Kamera zugegriffen werden."
        + "\n"
        + "\n Mögliche Fehlerursachen:"
        + "\n"
        + "\n - es ist keine Kamera angeschlossen"
        + "\n - der Browser hat vom OS nicht die Berechtigung, auf die Kamera zuzugreifen"
        + "\n - die Webseite hat vom Browser nicht die Berechtigung, auf die Kamera zuzugreifen"
        ));
  },
};

// init
window.addEventListener("load", init.init);
