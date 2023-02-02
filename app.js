"use strict";

// getCoordinates()
// Demande au navigateur de détecter la position actuelle de l'utilisateur et retourne une Promise
const getCoordinates = () => {
  return new Promise((res, rej) =>
    navigator.geolocation.getCurrentPosition(res, rej)
  );
};

// getPosition()
// Résout la promesse de getCoordinates et retourne un objet {lat: x, long: y}
const getPosition = async () => {
  const position = await getCoordinates();
  return {
    lat: position.coords.latitude,
    long: position.coords.longitude
  };
};

// renderWeather(min, max)
// Affiche la valeu des deux paramêtres dans le widget de météo
const renderWeather = (min, max) => {
  document.querySelector(".min").textContent = `${min}°C`;
  document.querySelector(".max").textContent = `${max}°C`;
  return;
};

// parseStationData(rawData)
// Reçoit la réponse JSON de l'API Transport/stationboard et recrache un objet
// ne contenant que les informations pertinentes.
const parseStationData = (rawData) => {
  const { stationboard } = rawData;
  const departures = stationboard.map((el) => {
    const date = new Date(el.stop.departure);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const formattedHours = date.getHours() < 10 ? "0" + hours : hours;
    const formattedMinutes = date.getMinutes() < 10 ? "0" + minutes : minutes;
    return {
      departure: `${formattedHours}:${formattedMinutes}`,
      destination: el.to,
      category: el.category
    };
  });
  return {
    station: rawData.station.name,
    departures
  };
};

// renderTrain(train)
// Affiche une ligne de départ dans le widget CFF.
const renderTrain = (train) => {
  const board = document.querySelector(".departures");
  const html = `
    <article>
        <div class="time">${train.departure}</div>
        <div class="category" data-category="${train.category}">${train.category}</div>
        <div class="destination">${train.destination}</div>
    </article>
    `;
  board.insertAdjacentHTML("beforeend", html);
  return;
};

// renderStationName(station)
// Affiche le mot passé en paramettre dans le widget CFF. 
const renderStationName = (station) => {
  const stationElement = document.querySelector(".departures header p");
  stationElement.textContent = station;
};

function compareNumbers(a, b) {
  return a - b;
}

// Votre code peut se trouver dans cette fonction. L'appel vers getPosition est
// déjà implémenté. Si vous jetez un coup d'oeil à votre console vous verrez un objet
// contenant votre position.
const getDashboardInformation = async () => {
  const res = await getPosition();
  console.log(res);
  const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${res.lat}&longitude=${res.long}&daily=apparent_temperature_max,apparent_temperature_min&timezone=auto`);
  const transportRes = await fetch(`http://transport.opendata.ch/v1/locations?x=${res.lat}&y=${res.long}`);
  const dataWeather = await weatherRes.json();
  const dataTransport = await transportRes.json();

  const min = dataWeather.daily.apparent_temperature_min.sort(compareNumbers);
  const max = dataWeather.daily.apparent_temperature_max.sort(compareNumbers);
  renderWeather(min[0], max[0]);

  const nameStation = dataTransport.stations.filter((stations) => stations.icon === "train");
  const resStation = await fetch(`https://transport.opendata.ch/v1/stationboard?station=${nameStation[0].name}&limit=5`);
  const dataStation = await resStation.json();
  const dataStationFiltered = parseStationData(dataStation);
  console.log(dataStationFiltered.departures[0]);
  const allStation = dataStationFiltered.departures;
  allStation.forEach((e) => renderTrain(e));
};

getDashboardInformation();

