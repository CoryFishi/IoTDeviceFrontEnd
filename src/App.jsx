import React, { useState, useEffect } from "react";

function App() {
  // API server host (where your Node.js API is running)
  const [serverHost, setServerHost] = useState("192.168.0.73:3000");

  // List of devices from the API
  const [devices, setDevices] = useState([]);

  // List of motion events from the API
  const [events, setEvents] = useState([]);

  // Error message state
  const [error, setError] = useState("");

  // Store responses when toggling LED
  const [toggleResponses, setToggleResponses] = useState({});

  // Store the status for each device (keyed by board)
  const [deviceStatuses, setDeviceStatuses] = useState({});

  // -------------------------------------------------------------------
  // Fetching Device List
  // -------------------------------------------------------------------
  const fetchDevices = async () => {
    try {
      const res = await fetch(`http://${serverHost}/api/devices`);
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      setDevices(data);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  // -------------------------------------------------------------------
  // Fetching Motion Events
  // -------------------------------------------------------------------
  const fetchEvents = async () => {
    try {
      const res = await fetch(`http://${serverHost}/api/events`);
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();

      setEvents(data);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  // -------------------------------------------------------------------
  // Poll a single device's /status endpoint and update its status
  // -------------------------------------------------------------------
  const fetchDeviceStatus = async (device) => {
    try {
      const res = await fetch(`http://${device.ip}/status`);
      if (!res.ok) throw new Error("Network response was not ok");
      const statusText = await res.text();
      setDeviceStatuses((prev) => ({
        ...prev,
        [device.board]: statusText,
      }));
    } catch (err) {
      setDeviceStatuses((prev) => ({
        ...prev,
        [device.board]: "Offline",
      }));
    }
  };

  // -------------------------------------------------------------------
  // Poll all devices for their status every 30 seconds
  // -------------------------------------------------------------------
  useEffect(() => {
    const pollAllStatuses = () => {
      devices.forEach((device) => fetchDeviceStatus(device));
    };
    pollAllStatuses();
    const interval = setInterval(pollAllStatuses, 30000);
    return () => clearInterval(interval);
  }, [devices]);

  // -------------------------------------------------------------------
  // Fetch devices & events on mount and every 30 seconds
  // -------------------------------------------------------------------
  useEffect(() => {
    fetchDevices();
    fetchEvents();
    const interval = setInterval(() => {
      fetchDevices();
      fetchEvents();
    }, 30000);
    return () => clearInterval(interval);
  }, [serverHost]);

  // -------------------------------------------------------------------
  // Toggle the LED on a specific device
  // -------------------------------------------------------------------
  const toggleLED = async (device) => {
    try {
      const res = await fetch(`http://${device.ip}/led`);
      const text = await res.text();
      setToggleResponses((prev) => ({ ...prev, [device.board]: text }));
      setTimeout(() => {
        setToggleResponses((prev) => ({ ...prev, [device.board]: "" }));
      }, 10000);
    } catch (err) {
      setToggleResponses((prev) => ({
        ...prev,
        [device.board]: "Error: " + err.message,
      }));
      setTimeout(() => {
        setToggleResponses((prev) => ({ ...prev, [device.board]: "" }));
      }, 10000);
    }
  };

  return (
    <div className="p-6 font-sans">
      <h1 className="text-3xl font-bold mb-4 text-gray-800">
        Device Dashboard
      </h1>

      <div className="mb-6">
        <label className="block text-gray-700 font-semibold mb-2">
          API Server Host:
        </label>
        <input
          type="text"
          value={serverHost}
          onChange={(e) => setServerHost(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-64 focus:outline-none focus:border-blue-500"
        />
      </div>

      {error && <div className="text-red-600 font-semibold mb-4">{error}</div>}

      {/* Devices Table */}
      <div className="mb-10 overflow-x-auto">
        <h2 className="text-xl font-semibold mb-2 text-gray-800">Devices</h2>
        <table className="min-w-full bg-white border border-gray-200 shadow-sm">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="px-2 py-2 text-left text-gray-700">Board</th>
              <th className="px-2 py-2 text-left text-gray-700">IP</th>
              <th className="px-2 py-2 text-left text-gray-700">MAC</th>
              <th className="px-2 py-2 text-left text-gray-700">Firmware</th>
              <th className="px-2 py-2 text-left text-gray-700">Flash Size</th>
              <th className="px-2 py-2 text-left text-gray-700">Sketch Size</th>
              <th className="px-2 py-2 text-left text-gray-700">
                Free Sketch Space
              </th>
              <th className="px-2 py-2 text-left text-gray-700">Free Heap</th>
              <th className="px-2 py-2 text-left text-gray-700">
                Uptime (sec)
              </th>
              <th className="px-2 py-2 text-left text-gray-700">RSSI</th>
              <th className="px-2 py-2 text-left text-gray-700">BSSID</th>
              <th className="px-2 py-2 text-left text-gray-700">Channel</th>
              <th className="px-2 py-2 text-left text-gray-700">Subnet Mask</th>
              <th className="px-2 py-2 text-left text-gray-700">Gateway</th>
              <th className="px-2 py-2 text-left text-gray-700">DNS</th>
              <th className="px-2 py-2 text-left text-gray-700">Status</th>
              <th className="px-2 py-2 text-left text-gray-700">
                Last Updated
              </th>
              <th className="px-2 py-2 text-left text-gray-700">Action</th>
              <th className="px-2 py-2 text-left text-gray-700">Response</th>
            </tr>
          </thead>
          <tbody>
            {devices.length === 0 ? (
              <tr>
                <td
                  colSpan="19"
                  className="px-4 py-2 text-center text-gray-600"
                >
                  No devices found.
                </td>
              </tr>
            ) : (
              devices.map((device) => (
                <tr
                  key={device.board}
                  className="border-b last:border-b-0 hover:bg-gray-50"
                >
                  <td className="px-2 py-2 text-gray-800">{device.board}</td>
                  <td className="px-2 py-2 text-gray-800">{device.ip}</td>
                  <td className="px-2 py-2 text-gray-800">{device.mac}</td>
                  <td className="px-2 py-2 text-gray-800">
                    {device.firmware || "-"}
                  </td>
                  <td className="px-2 py-2 text-gray-800">
                    {device.flash_size || "-"}
                  </td>
                  <td className="px-2 py-2 text-gray-800">
                    {device.sketch_size || "-"}
                  </td>
                  <td className="px-2 py-2 text-gray-800">
                    {device.free_sketch_space || "-"}
                  </td>
                  <td className="px-2 py-2 text-gray-800">
                    {device.free_heap || "-"}
                  </td>
                  <td className="px-2 py-2 text-gray-800">
                    {device.uptime || "-"}
                  </td>
                  <td className="px-2 py-2 text-gray-800">
                    {device.rssi || "-"}
                  </td>
                  <td className="px-2 py-2 text-gray-800">
                    {device.bssid || "-"}
                  </td>
                  <td className="px-2 py-2 text-gray-800">
                    {device.channel || "-"}
                  </td>
                  <td className="px-2 py-2 text-gray-800">
                    {device.subnet_mask || "-"}
                  </td>
                  <td className="px-2 py-2 text-gray-800">
                    {device.gateway || "-"}
                  </td>
                  <td className="px-2 py-2 text-gray-800">
                    {device.dns || "-"}
                  </td>
                  <td className="px-2 py-2 text-gray-800">
                    {device.status || "Offline"}
                  </td>
                  <td className="px-2 py-2 text-gray-800">
                    {device.last_updated}
                  </td>
                  <td className="px-2 py-2">
                    <button
                      onClick={() => toggleLED(device)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded focus:outline-none"
                    >
                      Toggle LED
                    </button>
                  </td>
                  <td className="px-2 py-2 text-gray-800">
                    {toggleResponses[device.board] || ""}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Motion Events Table */}
      <div className="mb-10 overflow-x-auto">
        <h2 className="text-xl font-semibold mb-2 text-gray-800">
          Motion Events
        </h2>
        <table className="min-w-full bg-white border border-gray-200 shadow-sm">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="px-4 py-2 text-left text-gray-700">ID</th>
              <th className="px-4 py-2 text-left text-gray-700">Board</th>
              <th className="px-4 py-2 text-left text-gray-700">Motion Time</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-4 py-2 text-center text-gray-600">
                  No motion events found.
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr
                  key={event.id}
                  className="border-b last:border-b-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-2 text-gray-800">{event.id}</td>
                  <td className="px-4 py-2 text-gray-800">{event.board}</td>
                  <td className="px-4 py-2 text-gray-800">
                    {new Date(event.motion_time + "Z").toLocaleString("en-US", {
                      timeZone: "America/Phoenix",
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
