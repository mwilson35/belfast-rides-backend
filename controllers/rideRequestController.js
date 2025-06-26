const axios = require('axios');
const polyline = require('@mapbox/polyline');
const db = require('../db');

exports.requestRide = async (req, res, io) => {
  const { pickupLocation, destination } = req.body;
  const riderId = req.user.id;
  const userRole = req.user.role;

  // Step 1: Validate rider permissions
  if (userRole !== 'rider') {
    return res.status(403).json({ message: 'Only riders can request rides.' });
  }

  try {
    // Step 2: Geocode Pickup
    const pickupRes = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: { address: pickupLocation, key: process.env.GOOGLE_MAPS_API_KEY }
    });
    if (!pickupRes.data.results[0]) {
      return res.status(400).json({ message: 'Pickup location invalid.' });
    }
    const { lat: pickupLat, lng: pickupLng } = pickupRes.data.results[0].geometry.location;

    // Step 3: Geocode Destination
    const destRes = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: { address: destination, key: process.env.GOOGLE_MAPS_API_KEY }
    });
    if (!destRes.data.results[0]) {
      return res.status(400).json({ message: 'Destination invalid.' });
    }
    const { lat: destLat, lng: destLng } = destRes.data.results[0].geometry.location;

    // Step 4: Calculate Route
    const directionsRes = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params: {
        origin: `${pickupLat},${pickupLng}`,
        destination: `${destLat},${destLng}`,
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });
    const route = directionsRes.data.routes[0];
    if (!route) {
      return res.status(400).json({ message: 'Route calculation failed.' });
    }

    const decodedPolyline = polyline.decode(route.overview_polyline.points);
    const decodedRoute = decodedPolyline.map(([lat, lng]) => ({ lat, lng }));
    const geojsonRoute = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: decodedPolyline.map(([lat, lng]) => [lng, lat])
        },
        properties: {}
      }]
    };

    // Step 5: Fare calculation
    const distanceMeters = route.legs.reduce((total, leg) => total + leg.distance.value, 0);
    const durationSeconds = route.legs.reduce((total, leg) => total + leg.duration.value, 0);
    const distanceKm = distanceMeters / 1000;
    const estimatedFare = 2.5 + distanceKm * 1.2;

    // Step 6: Check for existing active ride
    db.query(
      "SELECT id FROM rides WHERE rider_id=? AND status IN ('requested','accepted')",
      [riderId],
      (err, activeRides) => {
        if (err) {
          console.error('Active ride check DB error:', err);
          return res.status(500).json({ message: 'Database error on active ride check.' });
        }
        if (activeRides.length) {
          return res.status(400).json({ message: 'You already have an active ride.' });
        }

        // Step 7: Insert Ride into DB
        db.query(
          `INSERT INTO rides (
            pickup_location, destination, rider_id, distance, estimated_fare,
            status, payment_status, encoded_polyline, decoded_route,
            pickup_lat, pickup_lng, destination_lat, destination_lng
          ) VALUES (?, ?, ?, ?, ?, 'requested', 'pending', ?, ?, ?, ?, ?, ?)`,
          [
            pickupLocation, destination, riderId, distanceKm, estimatedFare,
            JSON.stringify(geojsonRoute), JSON.stringify(decodedRoute),
            pickupLat, pickupLng, destLat, destLng
          ],
          (err, results) => {
            if (err) {
              console.error('DB insert error:', err);
              return res.status(500).json({ message: 'Database insertion failed.' });
            }

            const ride = {
              id: results.insertId,
              pickup_location: pickupLocation,
              destination,
              rider_id: riderId,
              distance: distanceKm,
              estimated_fare: estimatedFare,
              status: 'requested',
              pickup_lat: pickupLat,
              pickup_lng: pickupLng,
              destination_lat: destLat,
              destination_lng: destLng,
              encoded_polyline: geojsonRoute
            };

            // Emit to drivers (future-proof, does nothing if io is missing)
            if (io && typeof io.emit === "function") {
              io.emit('newAvailableRide', ride);
            }

            // Respond success
            res.status(201).json({
              message: 'Ride requested successfully',
              rideId: ride.id,
              distance: `${distanceKm.toFixed(2)} km`,
              duration: `${Math.ceil(durationSeconds / 60)} mins`,
              estimatedFare: `£${estimatedFare.toFixed(2)}`,
              geojsonRoute,
              pickupLat,
              pickupLng,
              destinationLat: destLat,
              destinationLng: destLng
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Unhandled error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
