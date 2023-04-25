import type { NextPage } from "next";
import Head from "next/head";
import { titleCase } from "title-case";
import { computeclosestcoordsfromevent } from "../components/getclosestcoordsfromevent";
import { CloseButton } from "../components/CloseButton";
import { SelectButtons } from "@/components/SelectButtons";
import { MapTitle } from "@/components/MapTitle";
import { FilterButton } from "@/components/FilterButton";
import { CaseTypes } from "@/components/CaseTypes";
import { CaseTypeModal } from "@/components/CaseTypeModal";
import { signintrack, uploadMapboxTrack } from "../components/mapboxtrack";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import MapboxLanguage from "@mapbox/mapbox-gl-language";
import Nav from "../components/nav";
import { MantineProvider, Checkbox } from "@mantine/core";
import React, { useEffect, useState, useRef } from "react";
const councildistricts = require("./CouncilDistricts.json");
const citybounds = require("./citybounds.json");
import mapboxgl from "mapbox-gl";

function getLang() {
  if (navigator.languages != undefined) return navigator.languages[0];
  return navigator.language;
}

const filterableRaces: any = {
  "Hispanic/Latino": 32614,
  Black: 16192,
  White: 9240,
  Other: 3489,
  Asian: 304,
  "Pacific Islander": 20,
  Unknown: 10,
  "American Indian/Alaskan Native": 5,
};

const filterableRacesKeys = Object.keys(filterableRaces);

const filterableAreas: any = {
  Northeast: 2003,
  "West LA": 3543,
  Pacific: 3550,
  Southeast: 3145,
  Harbor: 1930,
  Mission: 3080,
  "N Hollywood": 2778,
  Wilshire: 1892,
  "77th Street": 4687,
  Foothill: 2105,
  "West Valley": 2255,
  Rampart: 5083,
  Devonshire: 2501,
  Newton: 3494,
  Central: 3767,
  Olympic: 2822,
  Hollenbeck: 2126,
  Topanga: 2594,
  Southwest: 3091,
  "Van Nuys": 3296,
  Hollywood: 3382,
};

const filterableAreasKeys = Object.keys(filterableAreas);

const filterableArrests: any = {
  Felony: 30378,
  Misdemeanor: 26245,
  Infraction: 4186,
  Dependent: 545,
  Other: 520,
};

const filterableArrestsKeys = Object.keys(filterableArrests);

var raceOptions = [
  {
    code: "h",
    title: "Hispanic/Latino",
    count: 32614,
  },
  {
    code: "b",
    title: "Black",
    count: 16192,
  },
  {
    code: "w",
    title: "White",
    count: 9240,
  },
  {
    code: "o",
    title: "Other",
    count: 3489,
  },
  {
    code: "a",
    title: "Asian",
    count: 304,
  },
  {
    code: "p",
    title: "Pacific Islander",
    count: 20,
  },
  {
    code: "u",
    title: "Unknown",
    count: 10,
  },
  {
    code: "n",
    title: "American Indian/Alaskan Native",
    count: 5,
  },
];

var total = 61876;

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
  const [filteredArrests, setFilteredArrests] = useState<string[]>(
    filterableArrestsKeys
  );
  const [filteredAreas, setFilteredAreas] =
    useState<string[]>(filterableAreasKeys);

  const [filterpanelopened, setfilterpanelopened] =
    useState(shouldfilteropeninit);

  var [filterrace, setfilterrace] = useState("all");

  var [filtercount, setfiltercount] = useState(0);

  //template name, this is used to submit to the map analytics software what the current state of the map is.
  var mapname = "LAPD-arrests-2022";

  const setFilteredRacePre = (input: string[]) => {
    console.log("inputvalidator", input);
    if (input.length === 0) {
      setFilteredRaces(["99999"]);
    } else {
      setFilteredRaces(input);
      let total = 0;
      for(let i=0; i<input.length; i++) {
        for(let j=0; j<raceOptions.length; j++) {
          if(input[i] === raceOptions[j].title) {
            total = total + raceOptions[j].count;
          }
        }
      }
      console.log("total", total);
      setfiltercount(total);
      console.log("filtercount", filtercount);
      setfilterrace("notall");
    }
  };

  const setFilteredAreaPre = (input: string[]) => {
    console.log("inputvalidator", input);
    if (input.length === 0) {
      setFilteredAreas(["99999"]);
    } else {
      setFilteredAreas(input);
    }
  };

  const setFilteredArrestPre = (input: string[]) => {
    console.log("inputvalidator", input);
    if (input.length === 0) {
      setFilteredArrests(["99999"]);
    } else {
      setFilteredArrests(input);
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
            console.log("changing to block");
            toprightgeocoderbox.style.display = "block";
          } else {
            toprightgeocoderbox.style.display = "none";
            console.log("hiding");
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

  useEffect(() => {
    console.log("map div", divRef);

    if (divRef.current) {
      console.log("app render");
    }

    mapboxgl.accessToken =
      "pk.eyJ1Ijoia2VubmV0aG1lamlhIiwiYSI6ImNsZG1oYnpxNDA2aTQzb2tkYXU2ZWc1b3UifQ.PxO_XgMo13klJ3mQw1QxlQ";

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
      style: "mapbox://styles/kennethmejia/clgqr3ha2000001pp5tcl2j2u", // style URL (THIS IS STREET VIEW)
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
          var affordablepoint: any = map.getSource("selected-home-point");
          affordablepoint.setData(null);
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

        console.log("event.result.geometry", eventmapbox.result.geometry);
        console.log("geocoderesult", eventmapbox);
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
        console.log("geocoder div found");

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

      //create mousedown trigger
      map.on("mousedown", "lapd-arrests-2022", (e) => {
        console.log("mousedown", e, e.features);
        if (e.features) {
          const closestcoords = computeclosestcoordsfromevent(e);

          const filteredfeatures = e.features.filter((feature: any) => {
            return (
              feature.geometry.coordinates[0] === closestcoords[0] &&
              feature.geometry.coordinates[1] === closestcoords[1]
            );
          });

          if (filteredfeatures.length > 0) {
            console.log("filtered features", filteredfeatures);
          }
        }
      });

      // Create a popup, but don't add it to the map yet.
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
      });

      map.on("mouseover", "lapd-arrests-2022", (e: any) => {
        console.log("mouseover", e.features);

        if (e.features) {
          map.getCanvas().style.cursor = "pointer";
          const closestcoords: any = computeclosestcoordsfromevent(e);

          const filteredfeatures = e.features.filter((feature: any) => {
            return (
              feature.geometry.coordinates[0] === closestcoords[0] &&
              feature.geometry.coordinates[1] === closestcoords[1]
            );
          });

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
                  console.log("filteredfeatures", filteredfeatures);

                  const allthelineitems = filteredfeatures.map(
                    (eachCase: any) => {
                      if (eachCase.properties?.["Report ID"]) {
                        return `<li class="leading-none my-2">Report ID: ${
                          eachCase.properties["Report ID"]
                        }${" "}
                        ${
                          eachCase.properties?.["Arrest Date"]
                            ? `<span class="text-sky-400">Arrest Date: ${eachCase.properties["Arrest Date"]}</span>`
                            : ""
                        }
                        <br />
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
                  allthelineitems.length <= 7
                    ? allthelineitems.join("")
                    : allthelineitems.splice(0, 7).join("")
                }</ul> 
                ${
                  allthelineitems.length >= 7
                    ? `<p class="text-xs text-gray-300">Showing 7 of ${allthelineitems.length} cases</p>`
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

      map.on("mouseleave", "lapd-arrests-2022", () => {
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
            id: "points-selected-shelter-layer",
            type: "symbol",
            source: "arrest-point",
            paint: {
              "icon-color": "#41ffca",
              "icon-translate": [0, -13],
            },
            layout: {
              "icon-image": "map-marker",
              // get the title name from the source's "title" property
              "text-allow-overlap": true,
              "icon-allow-overlap": true,
              "icon-ignore-placement": true,
              "text-ignore-placement": true,
              "icon-size": 0.4,
              "icon-text-fit": "both",
            },
          });
        }
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
              "line-width": 2,
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
              "line-width": 1.5,
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
              "fill-color": "#DBEAFE",
              "fill-opacity": 0.2,
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
  }, []);

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
      ["get", "Area Name"],
      filteredAreas.map((area) => String(area)),
      true,
      false,
    ]);

    arrayoffilterables.push([
      "match",
      ["get", "Arrest Type"],
      filteredArrests.map((caseType) => String(caseType)),
      true,
      false,
    ]);

    if (mapref.current) {
      if (doneloadingmap) {
        const filterinput = JSON.parse(
          JSON.stringify(["all", ...arrayoffilterables])
        );

        console.log(filterinput);

        if (doneloadingmap === true) {
          mapref.current.setFilter("lapd-arrests-2022", filterinput);
        }
      }
    }
  }, [filteredRaces, filteredAreas, filteredArrests]);

  const onSelect = () => {
    console.log("onSelect", selectedfilteropened);
    if (selectedfilteropened === "race") {
      setFilteredRacePre(filterableRacesKeys);
    } else if (selectedfilteropened === "area") {
      setFilteredAreaPre(filterableAreasKeys);
    } else if (selectedfilteropened === "arrest") {
      setFilteredArrestPre(filterableArrestsKeys);
    }
  };

  const onUnselect = () => {
    if (selectedfilteropened === "race") {
      setFilteredRacePre([]);
      setfiltercount(0);
    } else if (selectedfilteropened === "area") {
      setFilteredAreaPre([]);
    } else if (selectedfilteropened === "arrest") {
      setFilteredArrestPre([]);
    }
  };

  const onInvert = () => {
    if (selectedfilteropened === "race") {
      setFilteredRacePre(filterableRacesKeys.filter((n) => !filteredRaces.includes(n)));
    } else if (selectedfilteropened === "area") {
      setFilteredAreaPre(
        filterableAreasKeys.filter((n) => !filteredAreas.includes(n))
      );
    } else if (selectedfilteropened === "arrest") {
      setFilteredArrestPre(
        filterableArrestsKeys.filter((n) => !filteredArrests.includes(n))
      );
    }
  };

  const [showModal, setShowModal] = useState(false);
  const [caseClicked, setCaseClicked] = useState("");
  const onCaseClicked = (e: any) => {
    setShowModal(true);
    const caseType = e.target.textContent;
    console.log("onCaseClicked", caseType);
    setCaseClicked(caseType);
  };

  return (
    <div className="flex flex-col h-full w-screen absolute">
      <MantineProvider
        theme={{ colorScheme: "dark" }}
        withGlobalStyles
        withNormalizeCSS
      >
        <Head>
          <link
            rel="icon"
            href="https://mejiaforcontroller.com/wp-content/uploads/2020/12/cropped-favicon-1-32x32.png"
            sizes="32x32"
          />
          <link
            rel="icon"
            href="https://mejiaforcontroller.com/wp-content/uploads/2020/12/cropped-favicon-1-192x192.png"
            sizes="192x192"
          />
          <link
            rel="apple-touch-icon"
            href="https://mejiaforcontroller.com/wp-content/uploads/2020/12/cropped-favicon-1-180x180.png"
          />
          <meta
            name="msapplication-TileImage"
            content="https://mejiaforcontroller.com/wp-content/uploads/2020/12/cropped-favicon-1-270x270.png"
          />

          <meta charSet="utf-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
          />
          <title>LAPD Arrests 2022 | Map</title>
          <meta property="og:type" content="website" />
          <meta name="twitter:site" content="@lacontroller" />
          <meta name="twitter:creator" content="@lacontroller" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta
            name="twitter:title"
            key="twittertitle"
            content="LAPD Arrests 2022 | Map"
          ></meta>
          <meta
            name="twitter:description"
            key="twitterdesc"
            content="LAPD Arrests 2022"
          ></meta>
          <meta
            name="twitter:image"
            key="twitterimg"
            content="https://buildingandsafety.lacontroller.io/building-map.png"
          ></meta>
          <meta name="description" content="LAPD Arrests 2022." />

          <meta
            property="og:url"
            content="https://buildingandsafety.lacontroller.io"
          />
          <meta property="og:type" content="website" />
          <meta property="og:title" content="LAPD Arrests 2022 | Map" />
          <meta property="og:description" content="LAPD Arrests 2022." />
          <meta
            property="og:image"
            content="https://buildingandsafety.lacontroller.io/building-map.png"
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

            <CaseTypeModal
              showModal={showModal}
              setShowModal={setShowModal}
              caseClicked={caseClicked}
            />
            <div
              className="filterandinfobox fixed top-auto bottom-0 left-0 right-0 
              sm:max-w-sm sm:absolute sm:mt-[6em] md:mt-[3em] sm:ml-3 sm:top-auto sm:bottom-auto sm:left-auto sm:right-auto flex flex-col gap-y-2"
            >
              {filterpanelopened === false && (
                <FilterButton setfilterpanelopened={setfilterpanelopened} />
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
                      setselectedfilteropened("area");
                    }}
                    className={`px-2 border-b-2  py-1  font-semibold ${
                      selectedfilteropened === "area"
                        ? "border-[#41ffca] text-[#41ffca]"
                        : "hover:border-white border-transparent text-gray-50"
                    }`}
                  >
                    Area
                  </button>
                  <button
                    onClick={() => {
                      setselectedfilteropened("arrest");
                    }}
                    className={`px-2 border-b-2  py-1  font-semibold ${
                      selectedfilteropened === "case"
                        ? "border-[#41ffca] text-[#41ffca]"
                        : "hover:border-white border-transparent text-gray-50"
                    }`}
                  >
                    Arrest
                  </button>
                </div>
                <div className="flex flex-col">
                  {selectedfilteropened === "race" && (
                    <div className="mt-2">
                      <div className="grow">
                        {filterrace === "all" && (
                          <span>61,874 Total Arrests</span>
                        )}

                        {filterrace !== "all" && (
                          <span>
                            {filtercount.toLocaleString()} of 61,874 Total
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
                              {/* {Object.entries(filterableRaces).map(
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
                              )} */}
                              {Object.entries(raceOptions).map((eachEntry) => (
                                <Checkbox
                                  value={eachEntry[1].title}
                                  label={
                                    <span className="text-nowrap text-xs">
                                      <span className="text-white">
                                        {eachEntry[1].title}
                                      </span>{" "}
                                      <span>{eachEntry[1].count}</span>
                                    </span>
                                  }
                                  key={eachEntry[1].title}
                                />
                              ))}
                            </div>
                          </Checkbox.Group>
                          {/* <div
                            className="flex flex-row flex-wrap gap-1 md:gap-1.5"
                          >
                            {raceOptions.map((eachItem) => (
                              <button
                                key={eachItem.code}
                                className={`text-sm md:text-base px-2 rounded-xl border-white  ${
                                  filterrace === eachItem.code
                                    ? "border-mejito border-2"
                                    : "border"
                                }`}
                                onClick={(e) => {
                                  setfilterrace(eachItem.code);
                                  setfiltercount(eachItem.count);

                                  // filterraceaction(eachItem.code);
                                }}
                              >
                                {eachItem.title}
                              </button>
                            ))}
                          </div> */}
                        </div>
                      </div>
                      <p className="text-blue-400 text-xs mt-1">
                        <strong>LAPD Arrests by Race</strong>
                      </p>
                    </div>
                  )}
                  {selectedfilteropened === "area" && (
                    <div className="mt-2">
                      <SelectButtons
                        onSelect={onSelect}
                        onUnselect={onUnselect}
                        onInvert={onInvert}
                      />
                      <div className="flex flex-row gap-x-1">
                        <div className="flex items-center">
                          <Checkbox.Group
                            value={filteredAreas}
                            onChange={setFilteredAreaPre}
                          >
                            <div
                              className={`grid grid-cols-3
                          } gap-x-4 `}
                            >
                              {Object.entries(filterableAreas).map(
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
                      <p className="text-blue-400 text-xs mt-1">
                        <strong>LAPD Arrests by Area</strong>
                      </p>
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
                            value={filteredArrests}
                            onChange={setFilteredArrestPre}
                          >
                            <div
                              className={`grid grid-cols-3
                          } gap-x-4 `}
                            >
                              {Object.entries(filterableArrests).map(
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
                          <strong>LAPD Arrests by Arrest Type</strong>
                        </p>
                        {/* <CaseTypes onCaseClicked={onCaseClicked} /> */}
                      </div>
                    </div>
                  )}
                </div>
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
