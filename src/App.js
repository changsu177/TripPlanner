import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  GoogleMap,
  useLoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from "@reach/combobox";
import { formatRelative } from "date-fns";

import "@reach/combobox/styles.css";
import mapStyles from "./mapStyles";

import { Container, Row, Navbar, Nav, NavDropdown, Form, FormControl, Button, Col } from "react-bootstrap";

// to avoid rerender
const libraries = ["places"];
const mapContainerStyle = {
  height: "60vh",
  width: "60vw",
  left: "20vw"
};
const options = {
  styles: mapStyles,
  disableDefaultUI: true,
  zoomControl: true,
};
const center = {
  lat: 34.052235,
  lng: -118.243683,
};

export default function App() {
  // if the google script is ready
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey:"AIzaSyBlHhL9EqgJx0ZFIuzc5vn2yUAe96pZhs8",
    libraries,
  });
  const [markers, setMarkers] = React.useState([]);
  const [selected, setSelected] = React.useState(null);

  const onMapClick = React.useCallback((e) => {
    setMarkers((current) => [
      ...current,
      {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
        time: new Date(),
      },
    ]);
  }, []);

  const mapRef = React.useRef();
  const onMapLoad = React.useCallback((map) => {
    mapRef.current = map;
  }, []);

  const panTo = React.useCallback(({ lat, lng }) => {
    mapRef.current.panTo({ lat, lng });
    mapRef.current.setZoom(14);
  }, []);

  if (loadError) return "Error";
  if (!isLoaded) return "Loading...";

  return (
      <Container fluid>
        <Navbar bg="light" expand="lg">
          <Navbar.Brand href="#home">Trip Planner</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mr-auto">
              <Nav.Link href="#home">Home</Nav.Link>
              <Nav.Link href="#link">Link</Nav.Link>
              <NavDropdown title="Dropdown" id="basic-nav-dropdown">
                <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>
                <NavDropdown.Item href="#action/3.2">Another action</NavDropdown.Item>
                <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item href="#action/3.4">Separated link</NavDropdown.Item>
              </NavDropdown>
            </Nav>
            <Form inline>
              <FormControl type="text" placeholder="Search" className="mr-sm-2" />
              <Button variant="outline-success">Search</Button>
            </Form>
          </Navbar.Collapse>
        </Navbar>

        <Container fluid>
          <div className="toolbar">
              <h1 class="tentIcon">
                <span role="img" aria-label="tent">
                ⛺️
                </span>
              </h1>
              <Search panTo={panTo} />
              <Locate panTo={panTo} />
          </div>
          <Row>
            <div className="mapContainer">
              <GoogleMap
                  id="map"
                  mapContainerStyle={mapContainerStyle}
                  zoom={8}
                  center={center}
                  options={options}
                  onClick={onMapClick}
                  onLoad={onMapLoad}
              >
                {markers.map((marker) => (
                    <Marker
                        key={`${marker.lat}-${marker.lng}`}
                        position={{ lat: marker.lat, lng: marker.lng }}
                        onClick={() => {
                          setSelected(marker);
                        }}

                    />
                ))}

                {selected ? (
                    <InfoWindow
                        position={{ lat: selected.lat, lng: selected.lng }}
                        onCloseClick={() => {
                          setSelected(null);
                        }}
                    >
                      <div>
                        <h2>
                          Alert
                        </h2>
                        <p>Spotted {formatRelative(selected.time, new Date())}</p>
                      </div>
                    </InfoWindow>
                ) : null}
              </GoogleMap>
            </div>
          </Row>
        </Container>
      </Container>
  );
}

function Locate({ panTo }) {
  return (
      <button
          className="locate"
          onClick={() => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                  panTo({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                  });
                },
                () => null
            );
          }}
      >
        <img src="/compass.svg" alt="compass" />
      </button>
  );
}

function Search({ panTo }) {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      location: { lat: () => 34.052235, lng: () =>  -118.243683 },
      radius: 100 * 1000,
    },
  });


  // https://developers.google.com/maps/documentation/javascript/reference/places-autocomplete-service#AutocompletionRequest

  const handleInput = (e) => {
    setValue(e.target.value);
  };

  const handleSelect = async (address) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      panTo({ lat, lng });
    } catch (error) {
      console.log("😱 Error: ", error);
    }
  };

  return (

        <div className="search">
          <Combobox onSelect={handleSelect}>
            <ComboboxInput
                value={value}
                onChange={handleInput}
                disabled={!ready}
                placeholder="Search your location"
            />
            <ComboboxPopover>
              <ComboboxList>
                {status === "OK" &&
                data.map(({ id, description }) => (
                    <ComboboxOption key={id} value={description} />
                ))}
              </ComboboxList>
            </ComboboxPopover>
          </Combobox>
        </div>
  );
}
