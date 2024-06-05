import type { NextPage } from "next";
import Head from "next/head";
import { titleCase } from "title-case";
import { computeclosestcoordsfromevent } from "../components/getclosestcoordsfromevent";
import { CloseButton } from "../components/CloseButton";
import { SelectButtons } from "@/components/SelectButtons";
import { MapTitle } from "@/components/MapTitle";
import { InfoCarousel } from "@/components/InfoCarousel";
import { signintrack, uploadMapboxTrack } from "../components/mapboxtrack";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import MapboxLanguage from "@mapbox/mapbox-gl-language";
import Nav from "../components/nav";
import { MantineProvider, Checkbox } from "@mantine/core";
import React, { useEffect, useState, useRef } from "react";
const councildistricts = require("./CouncilDistricts.json");
const citybounds = require("./citybounds.json");
import mapboxgl from "mapbox-gl";
import { Intensity } from "@/components/Intensity";
//test
const filterableRaces: any = {
  "Hispanic/Latin": 7552,
  Black: 15654,
  White: 12495,
  Other: 887,
  Asian: 198,
  "Pacific Islander": 4,
  Unknown: 8,
  "American Indian/Alaskan Native": 9,
};

const filterableRacesKeys = Object.keys(filterableRaces);

const filterableTimeRange: any = {
  "12am-4am": 681,
  "4am-8am": 9930,
  "8am-12pm": 12624,
  "12pm-4pm": 8241,
  "4pm-8pm": 3931,
  "8pm-12am": 1391,
};

const filterableTimesKeys = Object.keys(filterableTimeRange);

const filterableArrest: any = {
  Misdemeanor: 31009,
  Infraction: 5793,
  Other: 5,
};

const filterableArrestKeys = Object.keys(filterableArrest);

const filterableYears: any = {
  2012: 4096,
  2013: 5411,
  2014: 4583,
  2015: 4742,
  2016: 5438,
  2017: 5738,
  2018: 3456,
  2019: 887,
  2020: 340,
  2021: 568,
  2022: 853,
  2023: 695,
};

const filterableYearsKeys = Object.keys(filterableYears);

const filterableDistricts: any = {
  1: 873,
  2: 673,
  3: 239,
  4: 611,
  5: 747,
  6: 353,
  7: 162,
  8: 599,
  9: 900,
  10: 172,
  11: 5961,
  12: 745,
  13: 5206,
  14: 18972,
  15: 329,
};

const filterableDistrictsKeys = Object.keys(filterableDistricts);

var raceOptions = [
  {
    code: "h",
    title: "Hispanic/Latin",
    count: 7552,
    percent: "20.52%",
  },
  {
    code: "b",
    title: "Black",
    count: 15654,
    percent: "42.53%",
  },
  {
    code: "w",
    title: "White",
    count: 12495,
    percent: "33.95%",
  },
  {
    code: "o",
    title: "Other",
    count: 887,
    percent: "2.41%",
  },
  {
    code: "a",
    title: "Asian",
    count: 198,
    percent: "0.54%",
  },
  {
    code: "p",
    title: "Pacific Islander",
    count: 4,
    percent: "0.01%",
  },
  {
    code: "u",
    title: "Unknown",
    count: 8,
    percent: "0.02%",
  },
  {
    code: "n",
    title: "American Indian/Alaskan Native",
    count: 9,
    percent: "0.02%",
  },
];

const total = 36807;

const Home: NextPage = () => {
  const shouldfilteropeninit =
    typeof window != "undefined" ? window.innerWidth >= 640 : false;
  const [showtotalarea, setshowtotalarea] = useState(false);
  var mapref: any = useRef(null);
  const okaydeletepoints: any = useRef(null);
  const [doneloadingmap, setdoneloadingmap] = useState(false);
  const [selectedfilteropened, setselectedfilteropened] = useState("race");
  const [filteredRaces, setFilteredRaces] =
    useState<string[]>(filterableRacesKeys);
  const [filteredTimes, setFilteredTimes] =
    useState<string[]>(filterableTimesKeys);
  const [filteredArrest, setFilteredArrest] =
    useState<string[]>(filterableArrestKeys);
  const [filteredDistricts, setFilteredDistricts] = useState<number[]>(
    filterableDistrictsKeys.map((key) => Number(key))
  );
  const [filteredYears, setFilteredYears] = useState<number[]>(
    filterableYearsKeys.map((key) => Number(key))
  );

  const [filterpanelopened, setfilterpanelopened] =
    useState(shouldfilteropeninit);

  var [filterrace, setfilterrace] = useState("all");
  var [filterDistrict, setFilterDistrict] = useState("all");

  var [filtercount, setfiltercount] = useState(0);

  let [arrestData, setArrestData]: any = useState(null);
  let [arrestInfoOpen, setArrestInfoOpen] = useState(false);
  const [infoBoxLength, setInfoBoxLength] = useState(1);
  const [arrestInfo, setArrestInfo] = useState(0);
  const [normalizeIntensity, setNormalizeIntensity] = useState(false);
  const [mapboxConfig, setMapboxConfig] = useState<{
    mapboxToken: string;
    mapboxStyle: string;
  } | null>(null);

  useEffect(() => {
    const fetchMapboxConfig = async () => {
      try {
        const response = await fetch("/api/mapboxConfig");
        const data = await response.json();
        setMapboxConfig(data);
      } catch (error) {
        console.error("Error fetching Mapbox config:", error);
      }
    };

    fetchMapboxConfig();
  }, []);

  // useEffect(() => {
  //   console.log("arrestData updated:", arrestData);
  // }, [arrestData]);

  //template name, this is used to submit to the map analytics software what the current state of the map is.
  var mapname = "4118-Map";

  const setFilteredRacePre = (input: string[]) => {
    if (input.length === 0) {
      setFilteredRaces(["99999"]);
      setfiltercount(0);
    } else {
      setFilteredRaces(input);
      let total = 0;
      for (let i = 0; i < input.length; i++) {
        for (let j = 0; j < raceOptions.length; j++) {
          if (input[i] === raceOptions[j].title) {
            total = total + raceOptions[j].count;
          }
        }
      }
      setfiltercount(total);
      setfilterrace("not-all");
    }
  };

  const setFilteredDistrictPre = (input: string[]) => {
    if (input.length === 0) {
      setFilteredDistricts([99999]);
    } else {
      setFilteredDistricts(input.map((x) => Number(x)));
    }
  };

  const setFilteredYearsPre = (input: string[]) => {
    if (input.length === 0) {
      setFilteredYears([99999]);
    } else {
      setFilteredYears(input.map((x) => Number(x)));
    }
  };

  const setFilteredArrestPre = (input: string[]) => {
    if (input.length === 0) {
      setFilteredArrest(["99999"]);
    } else {
      setFilteredArrest(input);
    }
  };

  const setFilteredTimePre = (input: string[]) => {
    if (input.length === 0) {
      setFilteredTimes(["99999"]);
    } else {
      setFilteredTimes(input);
    }
  };

  var [hasStartedControls, setHasStartedControls] = useState(false);

  function checkHideOrShowTopRightGeocoder() {
    var toprightbox = document.querySelector(".mapboxgl-ctrl-top-right");
    if (toprightbox) {
      var toprightgeocoderbox: any = toprightbox.querySelector(
        ".mapboxgl-ctrl-geocoder"
      );
      if (toprightgeocoderbox) {
        if (typeof window != "undefined") {
          if (window.innerWidth >= 768) {
            toprightgeocoderbox.style.display = "block";
          } else {
            toprightgeocoderbox.style.display = "none";
          }
        } else {
          toprightgeocoderbox.style.display = "none";
        }
      }
    }
  }

  const handleResize = () => {
    checkHideOrShowTopRightGeocoder();
  };

  const divRef: any = React.useRef<HTMLDivElement>(null);

  const closeInfoBox = () => {
    console.log("mapref.current", mapref.current);
    console.log(
      "mapref.current.getSource arrest-point",
      mapref.current.getSource("arrest-point")
    );

    mapref.current.setLayoutProperty(
      "points-selected-arrests-layer",
      "visibility",
      "none"
    );

    setArrestInfoOpen(false);
    if (mapref) {
      if (mapref.current) {
        var arrestPoint: any = mapref.current.getSource("arrest-point");
        arrestPoint.setData(null);
      } else {
        console.log("no current ref");
      }
    } else {
      console.log("no ref");
    }

    if (okaydeletepoints.current) {
      okaydeletepoints.current();
    }
  };

  const recomputeIntensity = () => {
    let levels = ["interpolate", ["linear"], ["zoom"], 7, 0.5, 22, 0.7];

    if (normalizeIntensity === true) {
      levels = ["interpolate", ["linear"], ["zoom"], 7, 2.5, 15, 3.5];
    }

    var layer = mapref.current.getLayer("4118map");

    if (layer) {
      mapref.current.setPaintProperty("4118map", "heatmap-intensity", levels);
    }
  };

  useEffect(() => {
    if (mapref.current) {
      recomputeIntensity();
    }
  }, [normalizeIntensity]);

  useEffect(() => {
    if (mapboxConfig && divRef.current) {
      mapboxgl.accessToken = mapboxConfig.mapboxToken;

    const formulaForZoom = () => {
      if (typeof window != "undefined") {
        if (window.innerWidth > 700) {
          return 10;
        } else {
          return 9.1;
        }
      }
    };

    const urlParams = new URLSearchParams(
      typeof window != "undefined" ? window.location.search : ""
    );
    const latParam = urlParams.get("lat");
    const lngParam = urlParams.get("lng");
    const zoomParam = urlParams.get("zoom");
    const debugParam = urlParams.get("debug");

    var mapparams: any = {
      container: divRef.current, // container ID
      style: mapboxConfig.mapboxStyle,
      center: [-118.41, 34], // starting position [lng, lat]
      zoom: formulaForZoom(), // starting zoom
    };

    const map = new mapboxgl.Map(mapparams);
    mapref.current = map;

    var rtldone = false;

    try {
      if (rtldone === false && hasStartedControls === false) {
        setHasStartedControls(true);
        //multilingual support
        //right to left allows arabic rendering
        mapboxgl.setRTLTextPlugin(
          "https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.10.1/mapbox-gl-rtl-text.js",
          (callbackinfo: any) => {
            console.log(callbackinfo);
            rtldone = true;
          }
        );
      }

      const language = new MapboxLanguage();
      map.addControl(language);
    } catch (error) {
      console.error(error);
    }

    window.addEventListener("resize", handleResize);

    map.on("load", () => {
      setdoneloadingmap(true);
      setshowtotalarea(window.innerWidth > 640 ? true : false);

      okaydeletepoints.current = () => {
        try {
          var arrestPoint: any = map.getSource("arrest-point");
          arrestPoint.setData(null);
        } catch (err) {
          console.error(err);
        }
      };

      const processgeocodereventresult = (eventmapbox: any) => {
        var singlePointSet: any = map.getSource("single-point");

        singlePointSet.setData({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: eventmapbox.result.geometry,
            },
          ],
        });
      };

      const processgeocodereventselect = (object: any) => {
        var coord = object.feature.geometry.coordinates;
        var singlePointSet: any = map.getSource("single-point");

        singlePointSet.setData({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: object.feature.geometry,
            },
          ],
        });
      };

      const geocoder: any = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: map,
        proximity: {
          longitude: -118.41,
          latitude: 34,
        },
        marker: true,
      });

      var colormarker = new mapboxgl.Marker({
        color: "#41ffca",
      });

      const geocoderopt: any = {
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        marker: {
          color: "#41ffca",
        },
      };

      const geocoder2 = new MapboxGeocoder(geocoderopt);
      const geocoder3 = new MapboxGeocoder(geocoderopt);

      geocoder.on("result", (event: any) => {
        processgeocodereventresult(event);
      });

      geocoder.on("select", function (object: any) {
        processgeocodereventselect(object);
      });

      var geocoderId = document.getElementById("geocoder");

      if (geocoderId) {
        if (!document.querySelector(".geocoder input")) {
          geocoderId.appendChild(geocoder3.onAdd(map));

          var inputMobile = document.querySelector(".geocoder input");

          try {
            var loadboi = document.querySelector(
              ".mapboxgl-ctrl-geocoder--icon-loading"
            );
            if (loadboi) {
              var brightspin: any = loadboi.firstChild;
              if (brightspin) {
                brightspin.setAttribute("style", "fill: #e2e8f0");
              }
              var darkspin: any = loadboi.lastChild;
              if (darkspin) {
                darkspin.setAttribute("style", "fill: #94a3b8");
              }
            }
          } catch (err) {
            console.error(err);
          }

          if (inputMobile) {
            inputMobile.addEventListener("focus", () => {
              //make the box below go away
            });
          }
        }

        geocoder2.on("result", (event: any) => {
          processgeocodereventresult(event);
        });

        geocoder2.on("select", function (object: any) {
          processgeocodereventselect(object);
        });

        geocoder3.on("result", (event: any) => {
          processgeocodereventresult(event);
        });

        geocoder3.on("select", function (object: any) {
          processgeocodereventselect(object);
        });
      }

      map.addSource("single-point", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      if (true) {
        map.addLayer({
          id: "point",
          source: "single-point",
          type: "circle",
          paint: {
            "circle-radius": 10,
            "circle-color": "#41ffca",
          },
        });
      }

      if (debugParam) {
        map.showTileBoundaries = true;
        map.showCollisionBoxes = true;
        map.showPadding = true;
      }

      if (urlParams.get("terraindebug")) {
        map.showTerrainWireframe = true;
      }

      if (
        !document.querySelector(
          ".mapboxgl-ctrl-top-right > .mapboxgl-ctrl-geocoder"
        )
      ) {
        map.addControl(geocoder2);
      }

      checkHideOrShowTopRightGeocoder();

      // Create a popup, but don't add it to the map yet.
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
      });

      map.on("mouseover", "4118map", (e: any) => {
        if (e.features) {
          map.getCanvas().style.cursor = "pointer";
          const closestcoords: any = computeclosestcoordsfromevent(e);

          const filteredfeatures = e.features.filter((feature: any) => {
            return (
              feature.geometry.coordinates[0] === closestcoords[0] &&
              feature.geometry.coordinates[1] === closestcoords[1]
            );
          });

          console.log("filteredfeatures", filteredfeatures);

          // Copy coordinates array.
          const coordinates = closestcoords.slice();

          /*Ensure that if the map is zoomed out such that multiple
          copies of the feature are visible, the popup appears
          over the copy being pointed to.*/
          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }

          if (filteredfeatures.length > 0) {
            if (filteredfeatures[0]) {
              if (filteredfeatures[0].properties) {
                if (filteredfeatures[0].properties["Area Name"]) {
                  const areaPC = filteredfeatures[0].properties["Area Name"];

                  const allthelineitems = filteredfeatures.map(
                    (eachCase: any) => {
                      if (eachCase.properties?.["Report ID"]) {
                        return `<li class="leading-none my-2 text-blue-400">Report ID: ${
                          eachCase.properties["Report ID"]
                        }${" "}
                        ${
                          eachCase.properties?.["Arrest Date"]
                            ? `<span class="text-sky-400">Arrest Date: ${eachCase.properties["Arrest Date"]}</span>`
                            : ""
                        }${" "}
                        ${
                          eachCase.properties?.["Time Range"]
                            ? `<span class="text-slate-400">Time Range: ${eachCase.properties["Time Range"]}</span>`
                            : ""
                        }
                        <br />
                        ${
                          eachCase.properties?.["CD"]
                            ? `<span class="text-slate-100">CD#: ${eachCase.properties["CD"]} </span>`
                            : ""
                        }
                        ${
                          eachCase.properties?.["Area Name"]
                            ? `<span class="text-teal-200">Area: ${eachCase.properties["Area Name"]}, </span>`
                            : ""
                        }
                        ${
                          eachCase.properties?.["Address"]
                            ? `<span class="text-teal-400">${eachCase.properties["Address"]}</span> `
                            : ""
                        }
                        ${" "}
                        ${
                          eachCase.properties?.["Cross Street"]
                            ? `<span class="text-indigo-300">Cross St: ${eachCase.properties["Cross Street"]}</span>`
                            : ""
                        }
                        ${" "}
                        ${
                          eachCase.properties?.["Age"] &&
                          eachCase.properties["Age"] != "UNKNOWN"
                            ? `<span class="text-emerald-200">Age: ${eachCase.properties["Age"]}</span> `
                            : ""
                        }
                        ${
                          eachCase.properties?.["Sex"] &&
                          eachCase.properties["Sex"] != "UNKNOWN"
                            ? `<span class="text-lime-300">Sex: ${eachCase.properties["Sex"]}</span> `
                            : ""
                        }
                        ${
                          eachCase.properties?.["Race"] &&
                          eachCase.properties["Race"] != "UNKNOWN"
                            ? `<span class="text-amber-400">Race: ${eachCase.properties["Race"]}</span>`
                            : ""
                        }
                        <br/>
                  ${
                    eachCase.properties?.["Arrest Type"] &&
                    eachCase.properties["Arrest Type"] != "UNKNOWN"
                      ? `<span class="text-teal-200">Type: ${eachCase.properties["Arrest Type"]}</span>`
                      : ""
                  }
                  <br/>
                  ${
                    eachCase.properties?.["Charge"] &&
                    eachCase.properties["Charge"] != "UNKNOWN"
                      ? `<span class="text-blue-200">Charge: ${eachCase.properties["Charge"]}</span>`
                      : ""
                  }${" "}
                  ${
                    eachCase.properties?.["Charge Description"]
                      ? `<br/><span class="text-pink-200">${eachCase.properties[
                          "Charge Description"
                        ].toLowerCase()}</span>`
                      : ""
                  }${" "}${
                          eachCase.properties?.["Disposition Description"]
                            ? `<span class="text-pink-400">Disposition: ${eachCase.properties[
                                "Disposition Description"
                              ].toLowerCase()}</span>`
                            : ""
                        }
                  </li>`;
                      }
                    }
                  );

                  popup
                    .setLngLat(coordinates)
                    .setHTML(
                      ` <div>
                <p class="font-semibold">${titleCase(areaPC.toLowerCase())}</p>
                <p>${filteredfeatures.length} Case${
                        filteredfeatures.length > 1 ? "s" : ""
                      }</p>

                <ul class='list-disc leading-none'>${
                  allthelineitems.length <= 3
                    ? allthelineitems.join("")
                    : allthelineitems.splice(0, 3).join("")
                }</ul> 
                ${
                  allthelineitems.length > 1
                    ? `<p class="text-xs font-bold text-gray-300 mt-4">CLICK LOCATION TO SEE MORE</p>`
                    : ""
                }
              </div><style>
              .mapboxgl-popup-content {
                background: #212121e0;
                color: #fdfdfd;
              }
    
              .flexcollate {
                row-gap: 0.5rem;
                display: flex;
                flex-direction: column;
              }
              </style>`
                    )
                    .addTo(map);
                }
              }
            }
          }
        }
      });

      map.on("mouseleave", "4118map", () => {
        //check if the url query string "stopmouseleave" is true
        //if it is, then don't do anything
        //if it is not, then do the following

        if (urlParams.get("stopmouseleave") === null) {
          map.getCanvas().style.cursor = "";
          popup.remove();
        }
      });

      map.addSource("arrest-point", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      map.loadImage("/map-marker.png", (error, image: any) => {
        if (error) throw error;

        // Add the image to the map style.
        map.addImage("map-marker", image);

        if (true) {
          // example of how to add a pointer to what is currently selected
          map.addLayer({
            id: "points-selected-arrests-layer",
            type: "symbol",
            source: "arrest-point",
            paint: {
              "icon-color": "#FF8C00",
              "icon-translate": [0, -13],
            },
            layout: {
              "icon-image": "map-marker",
              // get the title name from the source's "title" property
              "text-allow-overlap": true,
              "icon-allow-overlap": true,
              "icon-ignore-placement": true,
              "text-ignore-placement": true,
              "icon-size": 0.5,
              "icon-text-fit": "both",
            },
          });
        }
      });

      map.on("mousedown", "4118map", (e: any) => {
        setArrestInfo(0);
        setInfoBoxLength(1);
        setArrestInfoOpen(true);
        let filteredData = e.features.map((obj: any) => {
          return {
            area: obj.properties["Area Name"],
            cd: obj.properties["CD"],
            reportId: obj.properties["Report ID"],
            arrestDate: obj.properties["Arrest Date"],
            timeRange: obj.properties["Time Range"],
            address: obj.properties["Address"],
            crossStreet: obj.properties["Cross Street"],
            age: obj.properties.Age,
            sex: obj.properties.Sex,
            race: obj.properties.Race,
            type: obj.properties["Arrest Type"],
            charge: obj.properties.Charge,
            description: obj.properties["Charge Description"],
            disposition: obj.properties["Disposition Description"],
          };
        });

        console.log("filteredData", filteredData);

        var arrestPoint: any = map.getSource("arrest-point");
        arrestPoint.setData(e.features[0].geometry);

        map.setLayoutProperty(
          "points-selected-arrests-layer",
          "visibility",
          "visible"
        );

        setArrestData(filteredData);
      });

      if (true) {
        map.addLayer(
          {
            id: "citybound",
            type: "line",
            source: {
              type: "geojson",
              data: citybounds,
            },
            paint: {
              "line-color": "#dddddd",
              "line-opacity": 1,
              "line-width": 1,
            },
          },
          "road-label-simple"
        );

        map.addSource("citycouncildist", {
          type: "geojson",
          data: councildistricts,
        });

        map.addLayer(
          {
            id: "councildistrictslayer",
            type: "line",
            source: "citycouncildist",
            paint: {
              "line-color": "#7FE5D4",
              "line-opacity": 1,
              "line-width": 0.8,
            },
          },
          "road-label-simple"
        );

        map.addLayer(
          {
            id: "councildistrictsselectlayer",
            type: "fill",
            source: "citycouncildist",
            paint: {
              "fill-color": "#000000",
              "fill-opacity": 0,
            },
          },
          "road-label-simple"
        );

        map.on("mousedown", "councildistrictsselectlayer", (e: any) => {
          var sourceofcouncildistselect: any = map.getSource(
            "selected-council-dist"
          );

          var clickeddata = e.features[0].properties.district;

          var councildistpolygonfound = councildistricts.features.find(
            (eachDist: any) => eachDist.properties.district === clickeddata
          );

          if (sourceofcouncildistselect) {
            if (councildistpolygonfound) {
              sourceofcouncildistselect.setData(councildistpolygonfound);
            }
          }
        });

        map.addSource("selected-council-dist", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
        });

        map.addLayer(
          {
            id: "selected-council-dist-layer",
            type: "fill",
            source: "selected-council-dist",
            paint: {
              "fill-color": "#000000",
              "fill-opacity": 0.3,
            },
          },
          "road-label-simple"
        );
      }

      if (hasStartedControls === false) {
        // Add zoom and rotation controls to the map.
        map.addControl(new mapboxgl.NavigationControl());

        // Add geolocate control to the map.
        map.addControl(
          new mapboxgl.GeolocateControl({
            positionOptions: {
              enableHighAccuracy: true,
            },
            // When active the map will receive updates to the device's location as it changes.
            trackUserLocation: true,
            // Draw an arrow next to the location dot to indicate which direction the device is heading.
            showUserHeading: true,
          })
        );
      }

      checkHideOrShowTopRightGeocoder();

      map.on("dragstart", (e) => {
        uploadMapboxTrack({
          mapname,
          eventtype: "dragstart",
          globallng: map.getCenter().lng,
          globallat: map.getCenter().lat,
          globalzoom: map.getZoom(),
        });
      });

      map.on("dragend", (e) => {
        uploadMapboxTrack({
          mapname,
          eventtype: "dragend",
          globallng: map.getCenter().lng,
          globallat: map.getCenter().lat,
          globalzoom: map.getZoom(),
        });
      });

      map.on("zoomstart", (e) => {
        uploadMapboxTrack({
          mapname,
          eventtype: "dragstart",
          globallng: map.getCenter().lng,
          globallat: map.getCenter().lat,
          globalzoom: map.getZoom(),
        });
      });
    });

    var getmapboxlogo: any = document.querySelector(".mapboxgl-ctrl-logo");

    if (getmapboxlogo) {
      getmapboxlogo.remove();
    }
  }}, [mapboxConfig]);

  useEffect(() => {
    let arrayoffilterables: any = [];

    arrayoffilterables.push([
      "match",
      ["get", "Race"],
      filteredRaces,
      true,
      false,
    ]);

    arrayoffilterables.push([
      "match",
      ["get", "CD"],
      filteredDistricts,
      true,
      false,
    ]);

    arrayoffilterables.push([
      "match",
      ["get", "Year"],
      filteredYears,
      true,
      false,
    ]);

    arrayoffilterables.push([
      "match",
      ["get", "Time Range"],
      filteredTimes.map((range) => String(range)),
      true,
      false,
    ]);

    arrayoffilterables.push([
      "match",
      ["get", "Arrest Type"],
      filteredArrest.map((arrest) => String(arrest)),
      true,
      false,
    ]);

    if (mapref.current) {
      if (doneloadingmap) {
        const filterinput = JSON.parse(
          JSON.stringify(["all", ...arrayoffilterables])
        );

        if (doneloadingmap === true) {
          mapref.current.setFilter("4118map", filterinput);
        }
      }
    }
  }, [
    filteredRaces,
    filteredArrest,
    filteredYears,
    filteredDistricts,
    filteredTimes,
  ]);

  const onSelect = () => {
    if (selectedfilteropened === "race") {
      setFilteredRacePre(filterableRacesKeys);
    } else if (selectedfilteropened === "year") {
      setFilteredYearsPre(filterableYearsKeys);
    } else if (selectedfilteropened === "district") {
      setFilteredDistrictPre(filterableDistrictsKeys);
    } else if (selectedfilteropened === "arrest") {
      setFilteredArrestPre(filterableArrestKeys);
    } else if (selectedfilteropened === "time") {
      setFilteredTimePre(filterableTimesKeys);
    }
  };

  const onUnselect = () => {
    if (selectedfilteropened === "race") {
      setFilteredRacePre([]);
      setfiltercount(0);
    } else if (selectedfilteropened === "year") {
      setFilteredYearsPre([]);
    } else if (selectedfilteropened === "district") {
      setFilteredDistrictPre([]);
      setfiltercount(0);
    } else if (selectedfilteropened === "arrest") {
      setFilteredArrestPre([]);
    } else if (selectedfilteropened === "time") {
      setFilteredTimePre([]);
    }
  };

  const onInvert = () => {
    if (selectedfilteropened === "race") {
      setFilteredRacePre(
        filterableRacesKeys.filter((n) => !filteredRaces.includes(n))
      );
    } else if (selectedfilteropened === "year") {
      setFilteredYearsPre(
        filterableYearsKeys.filter((n) => !filteredYears.includes(Number(n)))
      );
    } else if (selectedfilteropened === "district") {
      setFilteredDistrictPre(
        filterableDistrictsKeys.filter(
          (n) => !filteredDistricts.includes(Number(n))
        )
      );
    } else if (selectedfilteropened === "arrest") {
      setFilteredArrestPre(
        filterableArrestKeys.filter((n) => !filteredArrest.includes(n))
      );
    } else if (selectedfilteropened === "time") {
      setFilteredTimePre(
        filterableTimesKeys.filter((n) => !filteredTimes.includes(n))
      );
    }
  };

  return (
    <div className="flex flex-col h-full w-screen absolute">
      <MantineProvider
        theme={{ colorScheme: "dark" }}
        withGlobalStyles
        withNormalizeCSS
      >
        <Head>
          <meta charSet="utf-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
          />
          <title>City of LA 41.18 Arrests 2013-2023 | Map</title>
          <meta property="og:type" content="website" />
          <meta name="twitter:site" content="@lacontroller" />
          <meta name="twitter:creator" content="@lacontroller" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta
            name="twitter:title"
            key="twittertitle"
            content="City of LA 41.18 Arrests 2013-2023 | Map"
          ></meta>
          <meta
            name="twitter:description"
            key="twitterdesc"
            content="City of LA 41.18 Arrests 2013-2023"
          ></meta>
          <meta
            name="twitter:image"
            key="twitterimg"
            content="https://4118arrests.lacontroller.app/4118.png"
          ></meta>
          <meta name="description" content="LAPD Arrests 2019." />

          <meta property="og:url" content="https://4118arrests.lacontroller.app" />
          <meta property="og:type" content="website" />
          <meta
            property="og:title"
            content="City of LA 41.18 Arrests 2013-2023 | Map"
          />
          <meta
            property="og:description"
            content="City of LA 41.18 Arrests 2013-2023"
          />
          <meta
            property="og:image"
            content="https://4118arrests.lacontroller.app/4118.png"
          />
        </Head>

        <div className="flex-none">
          <Nav />
        </div>

        <div className="flex-initial h-content flex-col flex z-50">
          <div className="max-h-screen flex-col flex z-5">
            <MapTitle />

            <div
              className={`geocoder absolute mt-[2.7em] md:mt-[4.1em] ml-1 left-1 md:hidden xs:text-sm sm:text-base md:text-lg`}
              id="geocoder"
            ></div>
            <div className="w-content"></div>

            <div className="fixed mt-[6em] ml-2 sm:hidden flex flex-row">
              {filterpanelopened === false && (
                <button
                  onClick={() => {
                    setfilterpanelopened(true);
                  }}
                  className={` md:hidden mt-2 rounded-full px-3 pb-1.5 pt-0.5 text-sm bold md:text-base 
                  bg-gray-800 bg-opacity-80 text-white border-white border-2`}
                >
                  <svg
                    style={{
                      width: "20px",
                      height: "20px",
                    }}
                    viewBox="0 0 24 24"
                    className="inline align-middle mt-0.5"
                  >
                    <path
                      fill="currentColor"
                      d="M14,12V19.88C14.04,20.18 13.94,20.5 13.71,20.71C13.32,21.1 12.69,21.1 12.3,20.71L10.29,18.7C10.06,18.47 9.96,18.16 10,17.87V12H9.97L4.21,4.62C3.87,4.19 3.95,3.56 4.38,3.22C4.57,3.08 4.78,3 5,3V3H19V3C19.22,3 19.43,3.08 19.62,3.22C20.05,3.56 20.13,4.19 19.79,4.62L14.03,12H14Z"
                    />
                  </svg>
                  <span>Filter</span>
                </button>
              )}
            </div>

            <div
              className="filterandinfobox fixed top-auto bottom-0 left-0 right-0 sm:max-w-sm sm:absolute sm:mt-[6em] md:mt-[3em] sm:ml-3 
                        sm:top-auto sm:bottom-auto sm:left-auto sm:right-auto flex flex-col gap-y-2"
            >
              {filterpanelopened === false && (
                <div className=" flex flex-row">
                  <button
                    onClick={() => {
                      setfilterpanelopened(true);
                    }}
                    className={`hidden md:block mt-2 rounded-full px-3 pb-1.5 pt-0.5 text-sm bold md:text-base 
                  bg-gray-800 bg-opacity-80 text-white border-white border-2`}
                  >
                    <svg
                      style={{
                        width: "20px",
                        height: "20px",
                      }}
                      viewBox="0 0 24 24"
                      className="inline align-middle mt-0.5"
                    >
                      <path
                        fill="currentColor"
                        d="M14,12V19.88C14.04,20.18 13.94,20.5 13.71,20.71C13.32,21.1 12.69,21.1 12.3,20.71L10.29,18.7C10.06,18.47 9.96,18.16 10,17.87V12H9.97L4.21,4.62C3.87,4.19 3.95,3.56 4.38,3.22C4.57,3.08 4.78,3 5,3V3H19V3C19.22,3 19.43,3.08 19.62,3.22C20.05,3.56 20.13,4.19 19.79,4.62L14.03,12H14Z"
                      />
                    </svg>
                    <span>Filter</span>
                  </button>
                </div>
              )}
              <div
                className={`
              ${
                filterpanelopened
                  ? "relative bg-zinc-900 w-content bg-opacity-90 px-2 py-1 mt-1 sm:rounded-lg"
                  : "hidden"
              }
              `}
              >
                <CloseButton
                  onClose={() => {
                    setfilterpanelopened(false);
                  }}
                />
                <div className="gap-x-0 flex flex-row w-full pr-8">
                  <button
                    onClick={() => {
                      setselectedfilteropened("race");
                    }}
                    className={`px-2 border-b-2 py-1  font-semibold ${
                      selectedfilteropened === "race"
                        ? "border-[#41ffca] text-[#41ffca]"
                        : "hover:border-white border-transparent text-gray-50"
                    }`}
                  >
                    Race
                  </button>
                  <button
                    onClick={() => {
                      setselectedfilteropened("year");
                    }}
                    className={`px-2 border-b-2  py-1  font-semibold ${
                      selectedfilteropened === "year"
                        ? "border-[#41ffca] text-[#41ffca]"
                        : "hover:border-white border-transparent text-gray-50"
                    }`}
                  >
                    Year
                  </button>
                  <button
                    onClick={() => {
                      setselectedfilteropened("district");
                    }}
                    className={`px-2 border-b-2  py-1  font-semibold ${
                      selectedfilteropened === "district"
                        ? "border-[#41ffca] text-[#41ffca]"
                        : "hover:border-white border-transparent text-gray-50"
                    }`}
                  >
                    CD#
                  </button>
                  <button
                    onClick={() => {
                      setselectedfilteropened("arrest");
                    }}
                    className={`px-2 border-b-2  py-1  font-semibold ${
                      selectedfilteropened === "arrest"
                        ? "border-[#41ffca] text-[#41ffca]"
                        : "hover:border-white border-transparent text-gray-50"
                    }`}
                  >
                    Arrest
                  </button>
                  <button
                    onClick={() => {
                      setselectedfilteropened("time");
                    }}
                    className={`px-2 border-b-2  py-1  font-semibold ${
                      selectedfilteropened === "time"
                        ? "border-[#41ffca] text-[#41ffca]"
                        : "hover:border-white border-transparent text-gray-50"
                    }`}
                  >
                    Time
                  </button>
                </div>
                <div className="flex flex-col">
                  {selectedfilteropened === "race" && (
                    <div className="mt-1 mb-0">
                      <div className="grow font-semibold">
                        <span className="text-red-400">*</span>
                        {filterrace === "all" && filterDistrict === "all" && (
                          <span>36,807 Total Arrests (100%)</span>
                        )}
                        {(filterrace !== "all" || filterDistrict !== "all") && (
                          <span>
                            {filtercount.toLocaleString()} of 36,807 Total
                            Arrests (
                            {((filtercount / total) * 100).toFixed(2) + "%"})
                          </span>
                        )}
                      </div>
                      <SelectButtons
                        onSelect={onSelect}
                        onUnselect={onUnselect}
                        onInvert={onInvert}
                      />
                      <div className="flex flex-row gap-x-1">
                        <div className="flex items-center">
                          <Checkbox.Group
                            value={filteredRaces}
                            onChange={setFilteredRacePre}
                          >
                            <div
                              className={`grid grid-cols-3
                          } gap-x-4 `}
                            >
                              {Object.entries(raceOptions).map((eachEntry) => (
                                <Checkbox
                                  value={eachEntry[1].title}
                                  label={
                                    <span className="text-nowrap text-xs">
                                      <span className="text-white">
                                        {eachEntry[1].title}
                                      </span>{" "}
                                      <span className="text-red-400">
                                        {eachEntry[1].percent}
                                      </span>
                                    </span>
                                  }
                                  key={eachEntry[1].title}
                                />
                              ))}
                            </div>
                          </Checkbox.Group>
                        </div>
                      </div>
                      <p className="text-blue-400 text-xs mt-1">
                        <strong>41.18 Arrests by Race</strong>
                      </p>
                      <p className="text-xs text-red-400 mt-0 mb-1">
                        *% of race(s) when all Year, CD#, Sex, Time filters are
                        selected
                      </p>
                      <p className="text-xs text-red-400 mt-0 mb-1">
                        *Race categories created by LAPD
                      </p>
                      <p className="mt-2 text-xs italic text-[#41ffca]">
                        Los Angeles Municipal Code 41.18 criminalizes sitting,
                        lying, sleeping or storing, using, maintaining, or
                        placing personal property in the public right-of-way in
                        certain instances.
                      </p>
                      <a
                        href="https://codelibrary.amlegal.com/codes/los_angeles/latest/lamc/0-0-0-128514"
                        className="text-sm text-blue-300"
                        target="blank"
                      >
                        Click to Learn More
                      </a>
                      <Intensity
                        normalizeIntensity={normalizeIntensity}
                        setNormalizeIntensity={setNormalizeIntensity}
                      />
                    </div>
                  )}
                  {selectedfilteropened === "year" && (
                    <div className="mt-2">
                      <SelectButtons
                        onSelect={onSelect}
                        onUnselect={onUnselect}
                        onInvert={onInvert}
                      />
                      <div className="flex flex-row gap-x-1">
                        <div className="flex items-center">
                          <Checkbox.Group
                            value={filteredYears.map((year) => String(year))}
                            onChange={setFilteredYearsPre}
                          >
                            <div
                              className={`grid grid-cols-3
                          } gap-x-4 `}
                            >
                              {Object.entries(filterableYears).map(
                                (eachEntry) => (
                                  <Checkbox
                                    value={eachEntry[0]}
                                    label={
                                      <span className="text-nowrap text-xs">
                                        <span className="text-white">
                                          {eachEntry[0]}
                                        </span>{" "}
                                        <span>{eachEntry[1]}</span>
                                      </span>
                                    }
                                    key={eachEntry[0]}
                                  />
                                )
                              )}
                            </div>
                          </Checkbox.Group>
                        </div>
                      </div>
                      <div>
                        <p className="text-blue-400 text-xs mt-1">
                          <strong>41.18 Arrests by Year</strong>
                        </p>
                        <p className="mt-2 text-xs italic text-[#41ffca]">
                          Los Angeles Municipal Code 41.18 criminalizes sitting,
                          lying, sleeping or storing, using, maintaining, or
                          placing personal property in the public right-of-way
                          in certain instances.
                        </p>
                        <a
                          href="https://codelibrary.amlegal.com/codes/los_angeles/latest/lamc/0-0-0-128514"
                          className="text-sm text-blue-300"
                          target="blank"
                        >
                          Click to Learn More
                        </a>
                      </div>
                      <Intensity
                        normalizeIntensity={normalizeIntensity}
                        setNormalizeIntensity={setNormalizeIntensity}
                      />
                    </div>
                  )}
                  {selectedfilteropened === "district" && (
                    <div className="mt-2">
                      <SelectButtons
                        onSelect={onSelect}
                        onUnselect={onUnselect}
                        onInvert={onInvert}
                      />
                      <div className="flex flex-row gap-x-1">
                        <div className="flex items-center">
                          <Checkbox.Group
                            value={filteredDistricts.map((district) =>
                              String(district)
                            )}
                            onChange={setFilteredDistrictPre}
                          >
                            <div
                              className={`grid grid-cols-3
                          } gap-x-4 `}
                            >
                              {Object.entries(filterableDistricts).map(
                                (eachEntry) => (
                                  <Checkbox
                                    value={eachEntry[0]}
                                    label={
                                      <span className="text-nowrap text-xs">
                                        <span className="text-white">
                                          {eachEntry[0]}
                                        </span>{" "}
                                        <span>{eachEntry[1]}</span>
                                      </span>
                                    }
                                    key={eachEntry[0]}
                                  />
                                )
                              )}
                            </div>
                          </Checkbox.Group>
                        </div>
                      </div>
                      <div>
                        <p className="text-blue-400 text-xs mt-1">
                          <strong>41.18 Arrests by Council District</strong>
                        </p>
                        <p className="mt-2 text-xs italic text-[#41ffca]">
                          Los Angeles Municipal Code 41.18 criminalizes sitting,
                          lying, sleeping or storing, using, maintaining, or
                          placing personal property in the public right-of-way
                          in certain instances.
                        </p>
                        <a
                          href="https://codelibrary.amlegal.com/codes/los_angeles/latest/lamc/0-0-0-128514"
                          className="text-sm text-blue-300"
                          target="blank"
                        >
                          Click to Learn More
                        </a>
                      </div>
                      <Intensity
                        normalizeIntensity={normalizeIntensity}
                        setNormalizeIntensity={setNormalizeIntensity}
                      />
                    </div>
                  )}
                  {selectedfilteropened === "arrest" && (
                    <div className="mt-2">
                      <SelectButtons
                        onSelect={onSelect}
                        onUnselect={onUnselect}
                        onInvert={onInvert}
                      />
                      <div className="flex flex-row gap-x-1">
                        <div className="flex items-center">
                          <Checkbox.Group
                            value={filteredArrest}
                            onChange={setFilteredArrestPre}
                          >
                            <div
                              className={`grid grid-cols-3
                          } gap-x-4 `}
                            >
                              {Object.entries(filterableArrest).map(
                                (eachEntry) => (
                                  <Checkbox
                                    value={eachEntry[0]}
                                    label={
                                      <span className="text-nowrap text-xs">
                                        <span className="text-white">
                                          {titleCase(eachEntry[0])}
                                        </span>{" "}
                                        <span>{eachEntry[1]}</span>
                                      </span>
                                    }
                                    key={eachEntry[0]}
                                  />
                                )
                              )}
                            </div>
                          </Checkbox.Group>
                        </div>
                      </div>
                      <p className="text-xs mt-2">
                        *Under City law, alleged violations of 41.18 can be
                        cited as infractions or misdemeanors. Infractions
                        empower the City to levy fines of up to $2,500 for each
                        violation. Misdemeanors empower the City to seek fines
                        of up to $1,000 and imprisonment for up to six months
                        for each violation.*
                      </p>
                      <p className="text-blue-400 text-xs mt-1">
                        <strong>41.18 Arrests by Arrest Type</strong>
                      </p>
                      <p className="mt-2 text-xs italic text-[#41ffca]">
                        Los Angeles Municipal Code 41.18 criminalizes sitting,
                        lying, sleeping or storing, using, maintaining, or
                        placing personal property in the public right-of-way in
                        certain instances.
                      </p>
                      <a
                        href="https://codelibrary.amlegal.com/codes/los_angeles/latest/lamc/0-0-0-128514"
                        className="text-sm text-blue-300"
                        target="blank"
                      >
                        Click to Learn More
                      </a>
                      <Intensity
                        normalizeIntensity={normalizeIntensity}
                        setNormalizeIntensity={setNormalizeIntensity}
                      />
                    </div>
                  )}
                  {selectedfilteropened === "time" && (
                    <div className="mt-2">
                      <SelectButtons
                        onSelect={onSelect}
                        onUnselect={onUnselect}
                        onInvert={onInvert}
                      />
                      <div className="flex flex-row gap-x-1">
                        <div className="flex items-center">
                          <Checkbox.Group
                            value={filteredTimes}
                            onChange={setFilteredTimePre}
                          >
                            <div
                              className={`grid grid-cols-3
                          } gap-x-4 `}
                            >
                              {Object.entries(filterableTimeRange).map(
                                (eachEntry) => (
                                  <Checkbox
                                    value={eachEntry[0]}
                                    label={
                                      <span className="text-nowrap text-xs">
                                        <span className="text-white">
                                          {titleCase(eachEntry[0])}
                                        </span>{" "}
                                        <span>{eachEntry[1]}</span>
                                      </span>
                                    }
                                    key={eachEntry[0]}
                                  />
                                )
                              )}
                            </div>
                          </Checkbox.Group>
                        </div>
                      </div>
                      <div>
                        <p className="text-blue-400 text-xs mt-1">
                          <strong>41.18 Arrests by Time Range</strong>
                        </p>
                        <p className="mt-2 text-xs italic text-[#41ffca]">
                          Los Angeles Municipal Code 41.18 criminalizes sitting,
                          lying, sleeping or storing, using, maintaining, or
                          placing personal property in the public right-of-way
                          in certain instances.
                        </p>
                        <a
                          href="https://codelibrary.amlegal.com/codes/los_angeles/latest/lamc/0-0-0-128514"
                          className="text-sm text-blue-300"
                          target="blank"
                        >
                          Click to Learn More
                        </a>
                      </div>
                      <Intensity
                        normalizeIntensity={normalizeIntensity}
                        setNormalizeIntensity={setNormalizeIntensity}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div
                className={`text-sm ${
                  arrestInfoOpen
                    ? `px-3 pt-2 pb-3 fixed sm:relative top-auto bottom-0 left-0 right-0 w-full sm:mt-2 sm:w-auto 
                                    sm:top-auto sm:bottom-auto sm:left-auto sm:right-auto bg-[#212121] sm:rounded-xl bg-opacity-90 sm:bg-opacity-80 text-white 
                                    border-t-2 border-gray-200 sm:border sm:border-gray-400`
                    : "hidden"
                }`}
              >
                <CloseButton
                  onClose={() => {
                    closeInfoBox();
                    setInfoBoxLength(1);
                    setArrestInfo(0);
                    if (mapref.current) {
                      var arrestPoint: any =
                        mapref.current.getSource("arrest-point");
                      if (arrestPoint) {
                        arrestPoint.setData(null);
                      }
                    } else {
                      console.log("no ref current");
                    }
                  }}
                />
                {arrestData && (
                  <InfoCarousel
                    arrestData={arrestData}
                    infoBoxLength={infoBoxLength}
                    setInfoBoxLength={setInfoBoxLength}
                    arrestInfo={arrestInfo}
                    setArrestInfo={setArrestInfo}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <div ref={divRef} style={{}} className="map-container w-full h-full " />

        {(typeof window !== "undefined" ? window.innerWidth >= 640 : false) && (
          <>
            <div
              className={`absolute md:mx-auto z-9 bottom-2 left-1 md:left-1/2 md:transform md:-translate-x-1/2`}
            >
              <a
                href="https://controller.lacity.gov/"
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src="https://controller.lacity.gov/images/KennethMejia-logo-white-elect.png"
                  className="h-9 md:h-10 z-40"
                  alt="Kenneth Mejia LA City Controller Logo"
                />
              </a>
            </div>
          </>
        )}
      </MantineProvider>
    </div>
  );
};

export default Home;
