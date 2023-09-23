const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    id: { type: String, unique: true, required: true }, // Explicit ID field
    fullName: { type: String, required: true },
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    phoneNumber: { type: String },
    rooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }], // Reference to rooms
});

const roomSchema = new mongoose.Schema({
    id: { type: String, unique: true, required: true }, // Explicit ID field
    roomTitle: { type: String, required: true },
    ASPs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ASP' }], // Reference to ASPs
});

const aspSchema = new mongoose.Schema({
    id: { type: String, unique: true, required: true }, // Explicit ID field
    state: { type: String, unique: false, required: true, default: 'off' },
});

// Hash the user's password before saving it to the database
userSchema.pre('save', function (next) {
    const user = this;
    if (!user.isModified('password')) return next();

    bcrypt.genSalt(10, (err, salt) => {
        if (err) return next(err);

        bcrypt.hash(user.password, salt, (err, hash) => {
            if (err) return next(err);
            user.password = hash;
            next();
        });
    });
});

module.exports.User = mongoose.model('User', userSchema);
module.exports.Room = mongoose.model('Room', roomSchema);
module.exports.ASP = mongoose.model('ASP', aspSchema);