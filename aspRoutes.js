const express = require('express');
const router = express.Router();
const authMiddleware = require('./authMiddleware');
const User = require('./user').User;
const Room = require('./user').Room;
const ASP = require('./user').ASP;
const jwt = require('jsonwebtoken');

const handleError = (res, status, message) => {
  return res.status(status).json({ error: message });
};

const checkOwnership = (user, room) => {
  return user._id.toString() === room.owner.toString();
};

// Middleware to check if the user is the owner of the room
const checkRoomOwnership = async (req, res, next) => {
  const user = req.user; // Assuming you set the user in your authentication middleware
  const { roomId } = req.params;
  const room = await Room.findById(roomId);

  if (!room || !checkOwnership(user, room)) {
    return handleError(res, 403, 'Permission denied');
  }

  req.room = room;
  next();
};

// Middleware to authenticate IoT devices
const authenticateIoT = (req, res, next) => {
  const token = req.header('x-auth-token'); // Assume the token is sent as a header

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecretKey);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

// Route for updating ASP state
router.post('/update-asp-state/:userId/:roomId/:aspId', async (req, res) => {
  try {
    const aspId = req.params.aspId;
    const { state } = req.body;

    const asp = await ASP.findById(aspId);

    if (!asp) {
      return handleError(res, 404, 'ASP not found in the room');
    }
    console.log(state);
    console.log(asp.state);
    asp.state = state;
    await asp.save();
    console.log(asp.state);
    res.status(200).json({ message: 'ASP state updated successfully' });
  } catch (error) {
    console.error(error);
    handleError(res, 500, 'Failed to update ASP state');
  }
});

// Route for retrieving ASP state
router.get('/read-asp-state/:userId/:roomId/:aspId', async (req, res) => {
  try {
    const aspId = req.params.aspId;
    const asp = await ASP.findById(aspId);

    if (!asp) {
      return handleError(res, 404, 'ASP not found in the room');
    }
    
    res.status(200).json({ state: asp.state });
  } catch (error) {
    console.error(error);
    handleError(res, 500, 'Failed to retrieve ASP state');
  }
});

// Route for adding a room related to the user
router.post('/add-room/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { roomTitle } = req.body;

    console.log('Room Addition: Data Delivers');

    const user = await User.findById(userId);
    console.log('User found');

    if (!user) {
      return handleError(res, 404, 'User not found');
    }
    
    const newRoom = new Room({ roomTitle });
    await newRoom.save();

    user.rooms.push(newRoom);
    await user.save();

    res.status(200).json({ message: 'Room added and assigned to the user successfully' });
  } catch (error) {
    console.error(error);
    handleError(res, 500, 'Failed to add room and assign to user');
  }
});

// Route for adding a new ASP inside the room
router.post('/add-asp/:userId/:roomId', async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const userId = req.params.userId
    const { deviceName, state } = req.body;

    const room = await Room.findById(roomId);

    if (!room) {
      return handleError(res, 404, 'Room not found');
    }

    const newASP = new ASP({ deviceName, state });
    await newASP.save();

    room.ASPs.push(newASP);
    await room.save();

    res.status(200).json({ message: 'ASP added to the room successfully' });
  } catch (error) {
    console.error(error);
    handleError(res, 500, 'Failed to add ASP to the room');
  }
});

// Route for retrieving rooms with relevant ASPs
router.get('/get-rooms-with-asps/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return handleError(res, 404, 'User not found');
    }

    const rooms = await Room.find({ _id: { $in: user.rooms } });

    const roomsWithASPs = await Promise.all(
      rooms.map(async (room) => {
        const asps = await ASP.find({ _id: { $in: room.ASPs } });
        return { room, asps };
      })
    );

    res.status(200).json({ message: 'Rooms with relevant ASPs retrieved', roomsWithASPs });
  } catch (error) {
    console.error(error);
    handleError(res, 500, 'Failed to retrieve rooms with ASPs');
  }
});

router.get('/get-devices/:userId/:roomId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const roomId = req.params.roomId;
    const user = await User.findById(userId);
    const room = await Room.findById(roomId);

    if (!user) {
      return handleError(res, 404, 'User not found');
    }

    const devices = await ASP.find({ _id: { $in: room.ASPs } });

    res.status(200).json({ message: 'Devices in the current room retrieved', devices });
  } catch (error) {
    console.error(error);
    handleError(res, 500, 'Failed to retrieve devices');
  }
});

// Route for deleting a room
router.delete('/delete-room/:userId/:roomId', async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const userId = req.params.userId;
    const room = await Room.findById(roomId);
    const user = await User.findById(userId);
    
    if (!room) {
      return handleError(res, 404, 'Room not found');
    }

    result = await room.deleteOne({ _id: roomId });
    if (result.deletedCount === 1) {
        user.save();
        res.status(200).json({ message: 'Room deleted successfully' });
    } else {
        res.status(200).json({ message:'Document not found or already removed.' });
    }
    // res.status(200).json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error(error);
    handleError(res, 500, 'Failed to delete room');
  }
});

// Route for deleting an ASP
router.delete('/delete-asp/:userId/:roomId/:aspId', async (req, res) => {
  try {
    const aspId = req.params.aspId;
    const roomId = req.params.roomId; 

    const asp = await ASP.findById(aspId);
    const room = await Room.findById(roomId);

    if (!asp) {
      return handleError(res, 404, 'ASP not found in the room');
    }

    result = await asp.deleteOne({ _id: aspId });
    if (result.deletedCount === 1) {
        room.save();
        res.status(200).json({ message: 'ASP deleted successfully' });
    } else {
        res.status(200).json({ message:'ASP not found or already removed.' });
    }

    //res.status(200).json({ message: 'ASP deleted successfully' });
  } catch (error) {
    console.error(error);
    handleError(res, 500, 'Failed to delete ASP');
  }
});

// Route for updating a room's title
router.put('/update-room-title/:userId/:roomId', async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const { roomTitle } = req.body;
    const room = await Room.findById(roomId);

    room.roomTitle = roomTitle;
    await room.save();

    res.status(200).json({ message: 'Room title updated successfully' });
  } catch (error) {
    console.error(error);
    handleError(res, 500, 'Failed to update room title');
  }
});

// Route for updating a asp sevice's name
router.put('/update-device-name/:userId/:roomId/:aspId', async (req, res) => {
  try {
    const apsId = req.params.aspId;
    const { deviceName } = req.body;
    const asp = await ASP.findById(apsId);

    asp.deviceName = deviceName;
    
    await asp.save();

    res.status(200).json({ message: 'Device name updated successfully' });
  } catch (error) {
    console.error(error);
    handleError(res, 500, 'Failed to update device name');
  }
});

module.exports = router;