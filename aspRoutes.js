const express = require('express');
const router = express.Router();
const axios = require('axios');

const authMiddleware = require('./authMiddleware');

const User = require('./user');

const Room = User.Room; // Import the Room model from the user.js module
const ASP = User.ASP; // Import the ASP model from the user.js module

// Route for updating data state
router.post('/update-asp-state/:userId/:roomId/:aspId', authMiddleware.ensureAuthenticated, async (req, res) => {
  try {
      const { userId, roomId, aspId } = req.params;
      const { state } = req.body; // Get the state from the request body

      // Find the user
      const user = await User.findOne({ _id: userId });

      // Ensure that the authenticated user exists
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Find the room within the user's rooms
      const room = user.rooms.find((room) => room.id === roomId);

      // Ensure that the room exists and has ASPs
      if (!room || !room.ASPs || room.ASPs.length === 0) {
          return res.status(404).json({ message: 'Room or ASPs not found' });
      }

      // Check if the user is the owner of the room
      if (room.owner !== user.id) {
          return res.status(403).json({ message: 'Permission denied' });
      }

      // Find the ASP within the room's ASPs
      const asp = room.ASPs.find((asp) => asp.id === aspId);

      // Ensure that the ASP exists
      if (!asp) {
          return res.status(404).json({ message: 'ASP not found in the room' });
      }

      // Update the state of the ASP based on the state provided in the request
      asp.state = state;

      // Save the updated ASP state to the database
      await asp.save();

      res.status(200).json({ message: 'ASP state updated successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update ASP state' });
  }
});

// Route to get ASP state
router.get('/read-asp-state/:userId/:roomId/:aspId', authMiddleware.ensureAuthenticated, async (req, res) => {
  try {
      const { userId, roomId, aspId } = req.params;

      // Find the user
      const user = await User.findOne({ _id: userId });

      // Ensure that the authenticated user exists
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Find the room within the user's rooms
      const room = user.rooms.find((room) => room.id === roomId);

      // Ensure that the room exists and has ASPs
      if (!room || !room.ASPs || room.ASPs.length === 0) {
          return res.status(404).json({ message: 'Room or ASPs not found' });
      }

      // Check if the user is the owner of the room
      if (room.owner !== user.id) {
          return res.status(403).json({ message: 'Permission denied' });
      }

      // Find the ASP within the room's ASPs
      const asp = room.ASPs.find((asp) => asp.id === aspId);

      // Ensure that the ASP exists
      if (!asp) {
          return res.status(404).json({ message: 'ASP not found in the room' });
      }

      // Return the state of the ASP
      res.status(200).json({ state: asp.state });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to retrieve ASP state' });
  }
});

// Route for assigning a room to a user
router.post('/assign-room/:userId', authMiddleware.ensureAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const { roomId } = req.body;
  
      // Find the user
      const user = await User.findOne({ id: userId });
  
      // Ensure that the authenticated user exists
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Find the room by its ID
      const room = await Room.findOne({ id: roomId });
  
      // Ensure that the room exists
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
  
      // Assign the room to the user
      user.rooms.push(room);
      await user.save();
  
      res.status(200).json({ message: 'Room assigned to user successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to assign room to user' });
    }
});
  
// Route for assigning an ASP to a room
router.post('/assign-asp/:roomId', authMiddleware.ensureAuthenticated, async (req, res) => {
    try {
      const { roomId } = req.params;
      const { aspId } = req.body;
  
      // Find the room by its ID
      const room = await Room.findOne({ id: roomId });
  
      // Ensure that the room exists
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
  
      // Find the ASP by its ID
      const asp = await ASP.findOne({ id: aspId });
  
      // Ensure that the ASP exists
      if (!asp) {
        return res.status(404).json({ message: 'ASP not found' });
      }
  
      // Assign the ASP to the room
      room.ASPs.push(asp);
      await room.save();
  
      res.status(200).json({ message: 'ASP assigned to room successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to assign ASP to room' });
    }
});

// Route for retrieving rooms with relevant ASPs
router.get('/get-rooms-with-asps/:userId', authMiddleware.ensureAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user
    const user = await User.findOne({ _id: userId });

    // Ensure that the authenticated user exists
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the rooms associated with the user
    const rooms = await Room.find({ _id: { $in: user.rooms } });

    // Fetch the relevant ASPs for each room
    const roomsWithASPs = await Promise.all(
      rooms.map(async (room) => {
        // Find the ASPs associated with the room
        const asps = await ASP.find({ _id: { $in: room.ASPs } });
        return { room, asps };
      })
    );

    res.status(200).json({ message: 'Rooms with relevant ASPs retrieved', roomsWithASPs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve rooms with ASPs' });
  }
});

module.exports = router;