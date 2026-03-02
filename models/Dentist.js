const mongose = require('mongoose');

const DentistSchema = new mongose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        unique: true,
        trim: true,
        maxlength: [50, 'Name can not be more than 50 characters']
    },
    yearsOfExperience: {
        type: Number,
        required: [true, 'Please add years of experience']
    },
    areaOfExpertise: {
        type: String,
        required: [true, 'Please add an area of expertise'],
        enum: ['Orthodontics', 'Endodontics', 'Prosthodontics', 'Pediatric Dentistry', 'Oral Surgery']
    },

}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});


//Reverse populate with virtuals
DentistSchema.virtual('appointments', {
    ref: 'Appointment',
    localField: '_id',
    foreignField: 'dentist',
    justOne: false
});

module.exports = mongose.model('Dentist', DentistSchema);